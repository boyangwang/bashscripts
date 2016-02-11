// LICENSE_CODE ZON
'use strict'; /*jslint browser:true*/
define(['angular_1_3_17', '/util/user_agent.js', '/www/hola/pub/site_load.js',
    '/util/etask.js', '/svc/pub/app_checker.js', '/www/hola/pub/download.js',
    '/www/hola/pub/download/ext_exe_flow.js', '/www/hola/pub/util.js',
    '/svc/versions.js', 'underscore', 'hola_opt', 'svg4everybody'],
    function(angular, user_agent, site_load, etask, app_checker, download,
    ext_exe_flow_model, www_util, hola_versions, _, hopt, svg4everybody){
angular.module('hola.download_buttons', [])
.directive('downloadButtons', ['$timeout', download_buttons]);
var platforms = [
    {
        name: 'chrome',
        href: 'https://chrome.google.com/webstore/detail/hola-better-internet/gkojfkhlekighikafcpjkiklfbnlmeio',
        title: 'Hola for Chrome'
    },
    {name: 'firefox', title: 'Hola for Firefox'},
    {
        name: 'ie',
        rel: 'windows',
        href: '/download',
        title: 'Hola for Internet Explorer'
    },
    {
        name: 'android',
        href: 'https://play.google.com/store/apps/details?id=org.hola.prem',
        title: 'Hola for Android'
    },
    {
        name: 'ios',
        href: '/ios',
        title: 'Hola for iPhone and iPad'
    },
    {
        name: 'windows',
        href: '/download',
        title: 'Hola for Windows'
    },
    {
        name: 'mac',
        href: '/mac',
        title: 'Hola for Safari and Mac OS X'
    }
];
var game_platforms = [
    {name: 'xbox', title: 'Hola for Xbox'},
    {name: 'playstation', title: 'Hola for Playstation'},
    {name: 'console', title: 'Hola for consoles'},
    {name: 'router', title: 'Hola for routers'},
    {name: 'appletv', title: 'Hola for Apple TV'},
    {name: 'smarttv', title: 'Hola for Smart TV'},
    {name: 'chromecast', title: 'Hola for Chromecast'}
];

function download_buttons($timeout){
    var browser_info = user_agent.guess_browser();
    var browser = browser_info.browser;
    return {
        scope: {hide_game_platforms: '@hideGamePlatforms'},
        link: link,
        templateUrl: '/www/hola/views/inc_download_icons.html?md5=1374-a827c729'
    };

    function link(scope, element){
        scope.platforms = platforms;
        scope.game_platforms = game_platforms;
        var path = '/img/homepage/platforms_icons.svg';
        for (var i = 0; i<platforms.length; i++)
        {
            platforms[i].frame_url = path+'#iconframe';
            platforms[i].logo_url = path+'#'+platforms[i].name
            +'_logo_svg';
        }
        for (i = 0; i<game_platforms.length; i++)
        {
            game_platforms[i].frame_url = path+'#iconframe_new';
            game_platforms[i].logo_url = path+'#'+game_platforms[i].name
            +'_logo_svg';
        }
        svg4everybody();
        // download signed ff ext for ff 43+ and other browsers
        var is_new = browser!='firefox' || browser_info.version>=43;
        _.findWhere(platforms, {name: 'firefox'}).href = is_new ?
            site_load.GDL.firefox_signed.url : site_load.GDL.firefox.url;
        etask([function(){
            return etask.all({ext: app_checker.is_latest_ext(),
                svc: app_checker.is_latest_svc()});
        }, function(is_latest){
            var $chrome_buttons = element.find('.download.chrome');
            if (browser=='firefox' && !is_latest.ext)
                download.set_download_vpn('.download.firefox', {type: 'ext'});
            var $ie_icons = element.find('.download.ie, .download.windows');
            if (!is_latest.svc)
            {
                $ie_icons.mousedown(function(){
                    new ext_exe_flow_model().install({flow: 'vpn'});
                });
                // Prevent native action for <a>.
                $ie_icons.click(function(){ return false; });
            }
            else
            {
                var link = www_util.get_exe_link(hopt, user_agent.guess(),
                    hola_versions);
                $timeout(function(){
                    _.findWhere(platforms, {name: 'ie'}).href = link;
                    _.findWhere(platforms, {name: 'windows'}).href = link;
                });
            }
            if (browser=='chrome')
            {
                download.set_download_vpn($chrome_buttons, {
                    type: 'ext',
                    redirect: site_load.GDL.chrome.url
                });
            }
        }]);
    }
}

});

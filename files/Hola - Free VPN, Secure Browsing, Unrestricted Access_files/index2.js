// LICENSE CODE ZON
'use strict'; /*jslint browser:true, es5:true*/
define('/www/hola/pub/index2.js', ['/util/user_agent.js',
    '/www/hola/pub/site.js', '/www/hola/pub/mplayer.js', '/util/etask.js',
    '/www/hola/pub/util.js', 'virt_jquery_all', '/www/login/pub/login.js',
    '/www/hola/pub/download.js', '/svc/pub/app_checker.js',
    'angular_1_3_17', '/www/hola/pub/download_buttons_directive.js'],
    function(user_agent, site, mplayer, etask, www_util,
    $, login, download, app_checker, angular){
angular.module('app.index', ['hola.download_buttons'])
.config(['$stateProvider', config])
.controller('index', ['user_country', 'template', 'users_number',
    index_controller]);
var browser_info = user_agent.guess_browser();
var browser = browser_info.browser;
var url = $.url();
var $platform_icons = $('.platforms-block-icons');

function index_controller(country_code, template, users_number){
    this.users_number = users_number;
    www_util.perr({id: 'www_main_vpn_install_page_open'});
    // XXX pavlo: we check length because icons are removed in index2
    if ($platform_icons.length && !is_scrolled_into_view($platform_icons))
    {
        hide_devices();
        $(window).on('scroll', check_platform_visibility);
    }
    site.start_page({
        country_code: country_code,
        template: template,
    });
    site.navbar_popover_links();
    download_buttons_listen();
    if (browser=='ie')
    {
        $('.try-me, .play-icon').hide();
        $('.explorer-soon').show();
    }
    if ($('.try-me').is(':visible'))
        mplayer.init();
    $('.search_nav_container > .btn').on('click', function(){
        var enter = $.Event('keypress');
        enter.which = 0xd;
        $('form.unblock-search .tt-input').trigger(enter);
    }).show();
    if (url.param('need_login'))
    {
        var login_modal = new login.Modal({
            enc_url: '?next='
                +decodeURIComponent(url.param('next')||'/my_account'),
            signup_mode: false
        });
        login_modal.open();
    }
    this.init_map();
}

index_controller.prototype.init_map = function(){
    try {
        var a = document.createElement('audio');
        a.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
    } catch(e){
        console.log('This browser does not support Adobe Edge');
        return;
    }
    // XXX pavlo: hack to add ability for edge animation reload
    window.AdobeEdge = undefined;
    require.undef('edge');
    require(['edge'], function(adobe_edge){
        adobe_edge.loadComposition('map', 'EDGE-1292444563', {
            scaleToFit: 'width',
            centerStage: 'horizontal',
            minW: '0',
            maxW: 'undefined',
            width: '1200px',
            height: '700px'
        }, {dom: {}}, {
            style: {
                '${symbolSelector}': {
                    isStage: 'true',
                    rect: ['undefined', 'undefined', '1200px', '700px'],
                    fill: ['rgba(255,255,255,1)']
                }
            },
            dom: [{
                rect: ['15px', '44px', '1169px', '638px', 'auto', 'auto'],
                id: 'fallback_map',
                fill: [
                    'rgba(0,0,0,0)',
                    '/www/hola/pub/img/homepage/fallback_map.png?md5=81982-0a196ac0',
                    '0px', '0px'
                ],
                type: 'image',
                tag: 'img'
            }]
        });
    });
};

function config($stateProvider){
    $stateProvider.state('index', {
        url: '/{index}',
        templateUrl: '/www/hola/views/main.html?md5=26523-b79f216d',
        controller: 'index',
        controllerAs: 'vm'
    });
}

function hide_devices(){ $('.device').addClass('device-hidden'); }
function show_devices(){ $('.device').removeClass('device-hidden'); }
function is_scrolled_into_view($elem){
    var view_top_margin = 250;
    var doc_view_top = $(window).scrollTop();
    var doc_view_bottom = doc_view_top+$(window).height();
    var elem_top = $elem.offset().top;
    var elem_bottom = elem_top+$elem.height();
    var view_box = elem_top+view_top_margin;
    return doc_view_bottom>=view_box && doc_view_top<=elem_bottom;
}
function check_platform_visibility(){
    if (is_scrolled_into_view($platform_icons))
    {
        show_devices();
        $(window).off('scroll', check_platform_visibility);
    }
}

function download_buttons_listen(){
    var $main_buttons = $('.main-download a');
    var $advantages_buttons = $('.advantage.vpn a');
    var is_detecting = true;
    etask([function(){
        return etask.all({ext: app_checker.is_latest_ext(),
            svc: app_checker.is_latest_svc()});
    }, function(is_latest){
        is_detecting = false;
        if (is_latest.svc || is_latest.ext)
            download.set_download_vpn($main_buttons);
        else
        {
            $main_buttons.removeClass('detecting');
            var start = 0, prev_ext;
            var download_trigger = new download.trigger();
            $main_buttons.mousedown(function(){
                var current = new Date();
                prev_ext = current-start<60*1000 ? !prev_ext : false;
                download_trigger.install({
                    type: prev_ext ? 'ext' : 'full',
                    flow: 'vpn'
                });
                start = current;
            });
        }
        download.set_download_vpn($advantages_buttons, {type: 'ext'});
        return etask.all({ext: app_checker.is_ext(),
            svc: app_checker.is_svc()});
    }, function(is_installed){
        www_util.perr({id: 'www_main_detect_on_open', info: {
            ext: is_installed.ext, svc: is_installed.svc}});
    }]);
    var is_clicked = false;
    $('.download-section .main-download a').mousedown(function(){
        // trigger event with is_detecting=true only on first click
        if (is_detecting&&is_clicked)
            return;
        is_clicked = true;
        www_util.perr({id: 'www_main_vpn_install_button_click', info: {
            is_detecting: is_detecting}});
    });
}

});

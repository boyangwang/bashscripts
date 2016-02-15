// LICENSE CODE ZON
'use strict'; /*jslint browser:true*/
define(['virt_jquery_all', 'bootstrap', 'hola_opt', '/util/user_agent.js',
    '/util/etask.js', '/www/hola/pub/util.js', 'backbone', '/util/url.js',
    'underscore', '/svc/pub/app_checker.js'],
    function($, bootstrap, hopt, user_agent, etask, www_util, Backbone, zurl,
    _, app_checker){
var E = {};
var b = user_agent.guess_browser();
var qs_o = zurl.qs_parse(location.search.replace(/^\?/, ''));

/**
 * @param action Perr name. Will be a suffix for perr id.
 * @param [opt] Perr options.
 * @param [opt.perr_on_step] Prefix for perr id. Will be defined based on
 * opt.flow if not specified.
 * @param [opt.info] Additional perr info.
 * @param [opt.flow=player] Flow name. One of vpn|player.
 */
E.perr = function(action, opt){
    opt = opt ? _.clone(opt) : {};
    if (opt.perr_on_step)
        opt.id = 'www_'+opt.perr_on_step+'_'+action;
    else
    {
        opt.id = (opt.flow=='vpn' ? 'www_vpn_install_' :
            'www_media_mp_install_')+action;
    }
    opt.info = _.extend({location_url: location.href, referrer:
        document.referrer, embedded: top!=window}, opt.info);
    return etask([function(){
        return app_checker.get_ext_info();
    }, function(ext_info){
        var uuid = (ext_info && ext_info.uuid) || qs_o.uuid;
        opt = $.extend({uuid: uuid}, opt);
        return www_util.perr(opt);
    }]);
};

E.track_download = function(opt){
    // XXX arik: rewrite function
    var name = opt.name||'unknown';
    var origin_name = opt.origin_name||'unknown';
    var url = opt.url;
    var page_url = opt.page_url||location.href;
    // XXX arik: do we need site.ga_virtual_pageview('track_download?b='+name);
    return www_util.perr({id: 'www_track_download',
        info: {name: name, url: url, page_url: page_url, browser: b,
        silent: opt.silent, ext_installed: opt.ext_installed,
        ext_skip_first_run: opt.ext_skip_first_run,
        exe_redirect: opt.exe_redirect, origin_name: origin_name,
        install_opt: opt.install_opt}});
};

return E; });

// LICENSE_CODE ZON
'use strict'; /*jslint browser:true*/
define(['/www/util/pub/static_conf.js'], function(static_conf){
define('login_config', {url_prefix: ''});
var E = {};
E.init = function(opt, dependencies, setup){
    var alt_cdn = /\bholaalt-holanetworksltd\b/.test(opt.cdn_path);
    static_conf.alt_cdn = alt_cdn;
    function c(cdn, local){
        if (typeof local!='string')
            throw '"local" should exist for alt_cdn cases!';
	if (alt_cdn)
	{
	    cdn = local.replace(/\bcdn4\.hola\.org\b/,
		'holaalt-holanetworksltd.netdna-ssl.com');
	}
        else
            cdn = opt.cdn_path+cdn;
	return [cdn, local];
    }
    if (E.inited)
        return void console.error('Config already initialized');
    E.inited = true;
    E.ver = opt.ver;
    var create_xhr;
    var ua = /[( ]MSIE ([789]|10).\d[);]/.exec(window.navigator.userAgent||'');
    if (window.XDomainRequest && +ua[1]<10)
    {
        // IE doesn't support CORS, use XDomainRequest instead
        create_xhr = function(){
            var xdr = new window.XDomainRequest();
            xdr.onload = function(){
                xdr.readyState = 4;
                xdr.status = 200;
                if (xdr.onreadystatechange)
                    xdr.onreadystatechange();
            };
            xdr.onerror = function(){
                xdr.readyState = 4;
                xdr.status = 500;
                if (xdr.onreadystatechange)
                    xdr.onreadystatechange();
            };
            // request will be aborted if onprogress missing
            xdr.onprogress = function(){};
            return xdr;
        };
    }
    require.onError = function(err){ window.hola.base.require_on_error(err); };
    E.config = {ver: opt.ver, baseUrl: '/', urlArgs: '', config: {
        text: {
            // requirejs text plugin will use <script> and not xhr when
            // trying to load html from another domain. we force always
            // to use xhr for loading html files
            useXhr: function(url, protocol, hostname, port){ return true; },
            createXhr: create_xhr
        }
    },
    map: {'*': {
        events: '/util/events.js',
        // XXX romank: remove after complete fixing paths (WIP)
        '/svc/be_user_nav.js': '/svc/pub/be_user_nav.js',
        '/svc/mp/circle_progress.js': '/svc/mp/pub/circle_progress.js',
        '/svc/search.js': '/svc/pub/search.js',
        '/svc/be_base.js': '/svc/pub/be_base.js',
        '/svc/mp/be_mp_storage.js': '/svc/mp/pub/be_mp_storage.js',
        // tmp for /svc/pub/search.js
        '/www/be.js': '/www/hola/pub/be.js',
        '/www/ui.js': '/www/hola/pub/ui.js',
        // fix for joint http://jointjs.com/tutorial/requirejs
        'underscore': 'lodash',
         // XXX sergry: codemirror trying to load it
        '../../lib/codemirror': 'codemirror',
        '../javascript/javascript': 'codemirror_javascript',
        '../xml/xml': 'codemirror_xml',
        '../css/css': 'codemirror_css'
    }},
    paths: {
        '/protocol/pub/countries.js': '/protocol/pub/countries.js?md5=6252-e1da7bc7',
        '/svc/pub/account/membership.js':
            '/svc/pub/account/membership.js?md5=1177-8e7c2fba',
        '/svc/pub/be_user_nav.js': '/svc/pub/be_user_nav.js?md5=22016-91f53aac',
        '/svc/mp/pub/circle_progress.js':
            '/svc/mp/pub/circle_progress.js?md5=3893-beb4b5e9',
        '/svc/pub/search.js': '/svc/pub/search.js?md5=18745-750f5861',
        '/svc/pub/util.js': '/svc/pub/util.js?md5=3168-73a1c840',
        '/svc/pub/aggstats.js': '/svc/pub/aggstats.js?md5=4591-bc3217ad',
        '/svc/svc_ipc.js': '/svc/svc_ipc.js?md5=10094-2128a2fd',
        '/svc/mp/pub/be_mp_storage.js': '/svc/mp/pub/be_mp_storage.js?md5=776-5e6c6613',
        '/svc/mp/pub/msg.js': '/svc/mp/pub/msg.js?md5=3555-6ca1d1fb',
        '/svc/mp/pub/www_storage.js': '/svc/mp/pub/www_storage.js?md5=2613-3f20b43b',
        '/svc/mp/pub/util.js': '/svc/mp/pub/util.js?md5=21970-f6d41f56',
        '/svc/mp/pub/playlist.js': '/svc/mp/pub/playlist.js?md5=2270-72c49321',
        // http handler, not actual file
        '/svc/versions.js': '/svc/versions.js',
        '/util/ajax.js': '/util/ajax.js?md5=2410-508322e8',
        '/util/array.js': '/util/array.js?md5=5089-d245fe27',
        '/util/conv.js': '/util/conv.js?md5=11345-3b984140',
        '/util/country.js': '/util/country.js?md5=6419-c524b3bc',
        '/util/csrf.js': '/util/csrf.js?md5=706-40b2e891',
        '/util/csv.js': '/util/csv.js?md5=4408-99abb6bb',
        '/util/date.js': '/util/date.js?md5=10399-ce1a2846',
        '/util/es6_shim.js': '/util/es6_shim.js?md5=3608-43c53625',
        '/util/typedarray_shim.js': '/util/typedarray_shim.js?md5=38581-a72f22cf',
        '/util/escape.js': '/util/escape.js?md5=6712-72158aec',
        '/util/etask.js': '/util/etask.js?md5=40187-cfd4d7a7',
        '/util/events.js': '/util/events.js?md5=4414-191c6d19',
        '/util/jquery_ajax_ie.js': '/util/jquery_ajax_ie.js?md5=7313-7dc9ad69',
        '/util/rate_limit.js': '/util/rate_limit.js?md5=1029-18cd475e',
        '/util/sprintf.js': '/util/sprintf.js?md5=10334-65402120',
        '/util/strftime.js': '/util/strftime.js?md5=7451-2324e98a',
        '/util/lang.js': '/util/lang.js?md5=5376-97012140',
        '/util/string.js': '/util/string.js?md5=1685-444eec57',
        '/util/storage.js': '/util/storage.js?md5=1588-52fa3f70',
        '/util/url.js': '/util/url.js?md5=7587-e57e28d8',
        '/util/user_agent.js': '/util/user_agent.js?md5=7014-65280fe4',
        '/util/util.js': '/util/util.js?md5=8379-68055185',
        '/util/version_util.js': '/util/version_util.js?md5=1960-91e3e117',
        '/util/zerr.js': '/util/zerr.js?md5=8770-9a7d1d2e',
        '/util/ccounter_client.js': '/util/ccounter_client.js?md5=1635-b0e6cf56',
        '/util/zdot.js': '/util/zdot.js?md5=6306-e3dd17cd',
        '/util/angular_util.js': '/util/angular_util.js?md5=641-d25639f2',
	'/www/hola/pub/unsupported/unsupported.js':
            '/www/hola/pub/unsupported/unsupported.js?md5=6366-b5bbb26c',
	'/www/hola/pub/unsupported/country_controller.js':
            '/www/hola/pub/unsupported/country_controller.js?md5=1073-4e90646a',
	'/www/hola/pub/unsupported/not_working_controller.js':
            '/www/hola/pub/unsupported/not_working_controller.js?md5=1564-ab7540e4',
	'/www/hola/pub/unsupported/site_controller.js':
            '/www/hola/pub/unsupported/site_controller.js?md5=749-46d92713',
	'/www/hola/pub/unsupported/unblock_service.js':
            '/www/hola/pub/unsupported/unblock_service.js?md5=676-1ccbed8b',
	'/www/hola/pub/unsupported/incognito_controller.js':
            '/www/hola/pub/unsupported/incognito_controller.js?md5=1067-06562d82',
	'/www/best/pub/best_widget.js': '/www/best/pub/best_widget.js?md5=8293-ade2fba3',
	'/www/best/vpn/pub/main.js': '/www/best/vpn/pub/main.js?md5=28505-9d5e3cba',
	'/www/best/vpn/pub/list.js': '/www/best/vpn/pub/list.js?md5=39988-3e929f6f',
	'/www/best/phone/pub/list.js':
            '/www/best/phone/pub/list.js?md5=41878-a0a7820a',
	'/www/best/phone/pub/phone.js':
            '/www/best/phone/pub/phone.js?md5=19643-0ba8b4a6',
        '/www/cp/pub/cp_util.js': '/www/cp/pub/cp_util.js?md5=17245-689de068',
        '/www/cp/pub/cp.js': '/www/cp/pub/cp.js?md5=39589-51aa3047',
        '/www/hola/pub/be.js': '/www/hola/pub/be.js?md5=23917-6006882d',
        '/www/hola/pub/bext_install.js':
            '/www/hola/pub/bext_install.js?md5=1820-22d24aec',
        '/www/hola/pub/download_page.js':
            '/www/hola/pub/download_page.js?md5=12947-7aada07b',
        '/www/hola/pub/download.js': '/www/hola/pub/download.js?md5=14598-91ed6ea8',
        '/www/hola/pub/download/ext_flow.js':
            '/www/hola/pub/download/ext_flow.js?md5=7428-a04d1acf',
        '/svc/pub/app_checker.js':
            '/svc/pub/app_checker.js?md5=8154-2a22f40c',
        '/www/hola/pub/download/mp_installed_view.js':
            '/www/hola/pub/download/mp_installed_view.js?md5=759-f52d19c3',
        '/www/hola/pub/download/vpn_installed_view.js':
            '/www/hola/pub/download/vpn_installed_view.js?md5=491-ce0d3930',
        '/www/hola/pub/download/tracker.js':
            '/www/hola/pub/download/tracker.js?md5=2077-6b0a6fbf',
        '/www/hola/pub/download/ext_exe_flow.js':
            '/www/hola/pub/download/ext_exe_flow.js?md5=26854-50dcf5ff',
        '/www/hola/pub/browser_support.js':
            '/www/hola/pub/browser_support.js?md5=1025-b129898d',
        '/www/hola/pub/download_rmt_upgrade.js':
            '/www/hola/pub/download_rmt_upgrade.js?md5=9789-c54136ef',
        '/www/hola/pub/ios_profile.js':
            '/www/hola/pub/ios_profile.js?md5=632-727795fc',
        '/www/hola/pub/download_buttons_directive.js':
            '/www/hola/pub/download_buttons_directive.js?md5=4434-899da6d6',
        '/www/util/pub/localize.js': '/www/util/pub/localize.js?md5=407-683ba404',
        '/www/util/pub/i18n.js': '/www/util/pub/i18n.js?md5=2581-667b21f6',
        '/www/util/pub/language_selector_directive.js':
            '/www/util/pub/language_selector_directive.js?md5=1883-d6a8c922',
        '/www/billing/pub/billing.js': '/www/billing/pub/billing.js?md5=49911-5be844d2',
        '/www/billing/pub/billing_util.js':
            '/www/billing/pub/billing_util.js?md5=5035-c5d566fa',
	'/www/hola/pub/mp_compat.js': '/www/hola/pub/mp_compat.js?md5=2021-3e7f5dad',
	'/www/hola/pub/mp_download.js':
            '/www/hola/pub/mp_download.js?md5=1607-5ba0c4d8',
	'/www/hola/pub/mp_torrents.js':
            '/www/hola/pub/mp_torrents.js?md5=6946-43a6fd75',
        '/www/hola/pub/mplay.js': '/www/hola/pub/mplay.js?md5=5388-f91188b3',
        '/www/hola/pub/mplayer.js': '/www/hola/pub/mplayer.js?md5=5277-81993da7',
        '/www/hola/pub/player_install.js':
            '/www/hola/pub/player_install.js?md5=1314-1a11abf7',
        '/www/hola/pub/promo.js': '/www/hola/pub/promo.js?md5=901-3e5c9a56',
	'/www/hola/pub/page_search.js':
            '/www/hola/pub/page_search.js?md5=2154-322c6551',
	'/www/hola/pub/payment.js': '/www/hola/pub/payment.js?md5=21482-0139e4ad',
        '/www/hola/pub/popular_sites.js':
            '/www/hola/pub/popular_sites.js?md5=1545-aa90d1bd',
	'/www/hola/pub/referral.js': '/www/hola/pub/referral.js?md5=5522-0bf33a50',
	'/www/hola/pub/site.js': '/www/hola/pub/site.js?md5=51966-531b84cc',
	'/www/hola/pub/site_load.js': '/www/hola/pub/site_load.js?md5=4055-dfcded42',
        '/www/hola/pub/social.js': '/www/hola/pub/social.js?md5=1574-81caca45',
        '/www/hola/pub/unblock_util.js':
            '/www/hola/pub/unblock_util.js?md5=2823-0eaeba3e',
	'/www/hola/pub/ui.js': '/www/hola/pub/ui.js?md5=37529-b6760e0f',
        '/www/hola/pub/unblock.js': '/www/hola/pub/unblock.js?md5=65278-f8dabaae',
        '/www/hola/pub/util.js': '/www/hola/pub/util.js?md5=6296-87fe40ce',
	'/www/hola/pub/zon_config.js':
            '/www/hola/pub/zon_config.js?md5=1348-26c33eb6',
        '/www/hola/pub/index.js':
            '/www/hola/pub/index.js?md5=5611-3a20e8d7',
        '/www/hola/pub/index2.js':
            '/www/hola/pub/index2.js?md5=6089-777c2e6c',
        '/www/hola/pub/publishers.js':
            '/www/hola/pub/publishers.js?md5=3986-2d609842',
        '/www/hola/pub/ensure_login.js':
            '/www/hola/pub/ensure_login.js?md5=1478-f983bd75',
        '/www/cdn/pub/cdn.js': '/www/cdn/pub/cdn.js?md5=16707-185edf62',
        '/www/cdn/pub/cdn_cp.js': '/www/cdn/pub/cdn_cp.js?md5=42480-a0182fc3',
        '/www/cdn/pub/cdn_cp_stats.js': '/www/cdn/pub/cdn_cp_stats.js?md5=49447-1b424727',
        '/www/cdn/pub/cdn_cp_graph.js': '/www/cdn/pub/cdn_cp_graph.js?md5=8482-b89f78ff',
        '/www/cdn/pub/cdn_util.js': '/www/cdn/pub/cdn_util.js?md5=11252-f6b12504',
        '/www/cdn/pub/flot_ztooltip.js':
            '/www/cdn/pub/flot_ztooltip.js?md5=1791-3b9984bf',
        '/www/login/pub/user.js': '/www/login/pub/user.js?md5=1564-95613941',
        '/www/login/pub/user_security.js':
            '/www/login/pub/user_security.js?md5=1036-feb9c9ba',
        '/www/login/pub/user_security_ui.js':
            '/www/login/pub/user_security_ui.js?md5=3510-1423b386',
        '/www/login/pub/login.js': '/www/login/pub/login.js?md5=35187-22eaa58a',
	'/www/login/pub/password.js': '/www/login/pub/password.js?md5=2344-6ffc173f',
	'/www/login/pub/verify_email.js':
            '/www/login/pub/verify_email.js?md5=853-11296cea',
        '/www/lum/pub/lum.js': '/www/lum/pub/lum.js?md5=1563-5e81a839',
        '/www/lum/pub/cp.js': '/www/lum/pub/cp.js?md5=17333-5c536af7',
        '/www/lum/pub/core.js': '/www/lum/pub/core.js?md5=61991-a83cae75',
        '/www/util/pub/ui_angular.js': '/www/util/pub/ui_angular.js?md5=5298-138326fc',
        '/www/util/pub/alert.js': '/www/util/pub/alert.js?md5=3450-1b8a5528',
        '/www/util/pub/prism.js': '/www/util/pub/prism.js?md5=17497-84fdd4ce',
        '/www/util/pub/prism_vb.js': '/www/util/pub/prism_vb.js?md5=632-bb8505c6',
        '/www/util/pub/myip.js': '/www/util/pub/myip.js?md5=165-2dff7449',
        '/www/util/pub/perr.js': '/www/util/pub/perr.js?md5=1088-7e7e3bac',
        // XXX arik/romank: change path to full path (requirejs text plugin
        // doesn't use paths when providing full path (so no ?md5=)
        'installation_templates':
            '/www/hola/pub/installation_templates.html?md5=15732-16e63006',
        edge: '/edge.5.0.1.min.js?md5=103891-2850882f',
        jschardet: '/jschardet.min.js?md5=355728-900a338b',
        'angular-ui-router_0_2_15': c(
            '/angular-ui-router/0.2.15/angular-ui-router.min',
            '/angular-ui-router.min.js?md5=30439-78c94563'),
        // XXX colin: jquery preferred for joint is 2.0.3
        jquery: c('/jquery/1.11.1/jquery.min',
            '/jquery/1.11.1/jquery.min.js?md5=95821-d4a20d75'),
        jquery_xmlrpc: '/jquery.xmlrpc.js?md5=10879-003befc0',
        firebase: 'https://cdn.firebase.com/js/client/2.0.2/firebase.js',
        firechat: 'https://cdn.firebase.com/libs/firechat/2.0.1/firechat.js',
        lodash: c('/lodash.js/3.10.1/lodash.min',
            '/www/util/pub/lodash.min.js?md5=50543-7629cac4'),
        geometry: '/geometry.min.js?md5=9004-ffd36319',
        // vectorizer.js wants module g
        vectorizer: '/vectorizer.min.js?md5=8094-a3340471',
        filesaver: c('/FileSaver.js/2014-11-29/FileSaver.min',
            '/www/util/pub/FileSaver.min.js?md5=5118-8514c12a'),
        '/www/hola/pub/locale/hola_en':
            '/www/hola/pub/locale/hola_en.json?md5=4601-57138eef',
        '/www/hola/pub/locale/hola_es':
            '/www/hola/pub/locale/hola_es.json?md5=4919-85dec69d'
    }, shim: {
        jquery_xmlrpc: {deps: ['jquery'], exports: 'jQuery.xmlrpc'},
	firebase: {deps: ['jquery'], exports: 'Firebase'},
	firechat: {deps: ['firebase'], exports: 'Firechat'},
        'angular-ui-router': {deps: ['angular_1_3_17']},
        'angular-ui-router_0_2_15': {deps: ['angular_1_4_8']},
        '/www/util/pub/prism.js': {exports: 'Prism'},
        vectorizer: {deps: ['geometry']},
        joint: {
            deps: ['geometry', 'vectorizer', 'jquery', 'lodash', 'backbone'],
            exports: 'joint',
            init: function(geometry, vectorizer){
                this.g = geometry;
                this.V = vectorizer;
            }
        },
        edge: {exports: 'AdobeEdge'},
        jsonview: {deps: ['jquery']}
    }};
    Object.keys(static_conf.conf).forEach(function(key){
        var cfg = static_conf.conf[key];
        if (!E.config.paths[key])
            E.config.paths[key] = static_conf.c(key);
        if (!E.config.shim[key] && cfg.shim)
            E.config.shim[key] = cfg.shim;
    });
    var cdn_list;
    // jshint ignore:start
    cdn_list = ["//www-holanetworksltd.netdna-ssl.com","//d1qm2c7h6sna4e.cloudfront.net","//hola.org"];
    // jshint ignore:end
    if (cdn_list.length)
        E.config.cdn = cdn_list;
    require.config(E.config);
    define('virt_jquery_all', ['jquery', '/util/jquery_ajax_ie.js',
        'jquery_cookie', 'jquery_url_parser', 'jquery_xmlrpc'],
        function(j){ return j; });
    require(['/util/es6_shim.js', '/util/typedarray_shim.js'], function(){
        if (Array.isArray(dependencies) && typeof setup=='function')
            require(dependencies, setup);
    });
};

return E; });

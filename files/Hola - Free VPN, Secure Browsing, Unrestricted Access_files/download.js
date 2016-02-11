// LICENSE CODE ZON
'use strict'; /*jslint browser:true*/
define(['virt_jquery_all', 'bootstrap', 'hola_opt', '/util/user_agent.js',
    '/util/escape.js', '/util/date.js', '/util/etask.js', '/svc/versions.js',
    '/www/hola/pub/site_load.js', '/www/hola/pub/util.js',
    '/util/version_util.js', 'backbone', '/util/url.js', 'underscore',
    'text!installation_templates', '/svc/mp/circle_progress.js',
    '/util/storage.js', '/svc/mp/pub/msg.js', '/svc/mp/pub/www_storage.js',
    '/www/login/pub/login.js', '/svc/svc_ipc.js',
    '/www/hola/pub/download/ext_exe_flow.js',
    '/www/hola/pub/download/ext_flow.js',
    '/svc/pub/app_checker.js',
    '/www/hola/pub/download/tracker.js',
    '/www/hola/pub/download/mp_installed_view.js',
    '/util/zerr.js'],
    function($, bootstrap, hopt, user_agent, zescape, date, etask, versions,
    site_load, www_util, version_util, Backbone, zurl, _,
    installation_templates, circle_progress, storage, mp_msg, www_storage,
    login, svc_ipc, ext_exe_flow_model, ext_flow_model,
    app_checker, tracker, mp_installed_view, zerr){
var E = {};
var b = user_agent.guess_browser(), sys = user_agent.guess(), os = sys.os;
var qs_o = zurl.qs_parse(location.search.replace(/^\?/, ''));
installation_templates = $(installation_templates);
var zopts = storage.get_json('hola_opts') || {};
var is_ie = b.browser=='ie'||zopts.ie_hola_ff;
var is_chrome = b.browser=='chrome';
var is_ff = b.browser=='firefox';

function show_hola_ff(url){
    return svc_ipc.hola_br_start({url:
        url||'https://hola.org/access/popular'});
}

function get_exe_link(){
    return www_util.get_exe_link(hopt, sys, versions); }

function get_download_url(){
    return site_load.select_dl().url; }

function start_download(link){
    $('body').append('<iframe width=0 height=0 class=hide frameborder=0 '+
        'src="'+link+'">');
}

function auto_install_check(value){
    etask([function(){
        return etask.all([app_checker.is_ext(), app_checker.is_svc()]);
    }, function(){
        var install_btn;
        switch (value)
        {
        case 'vpn': install_btn = $('.detect-install2-vpn')[0]; break;
        case 'player': install_btn = $('.detect-install2-player')[0]; break;
        default:
            try {
                return new E.trigger().install(JSON.parse(value));
            } catch(e){}
        }
        if (install_btn)
            $(install_btn).trigger('mousedown');
    }]);
}

E.init_links = function(opt){
    opt = opt||{};
    if (E.links_inited)
        return;
    E.links_inited = true;
    E.set_download_vpn('.detect-install2-vpn', opt);
    E.set_download_player('.detect-install2-player', opt);
    if (E.install_started)
        return;
    E.install_started = true;
    if (qs_o.auto_install)
        auto_install_check(qs_o.auto_install);
};

function opt_init(options){
    options = options||{};
    var opt = $.extend({}, options);
    opt.type = opt.type||'full';
    opt.flow = opt.flow||'vpn';
    opt.ext_exe = opt.ext_exe||{};
    // Disable 'Done' modal box. We will show it by ourselves in
    // trigger._on_installed().
    opt.ext_exe = $.extend({no_done: true}, opt.ext_exe);
    zerr.assert({full: 1, ext: 1}[opt.type], 'invalid type '+opt.type);
    zerr.assert({vpn: 1, player: 1}[opt.flow], 'invalid flow '+opt.type);
    opt.redirect = opt.redirect || (opt.flow=='player' ?
        'http://hola.org/player_torrents' : is_ie ?
        'http://hola.org/access/my/settings' : '/access/install');
    if (os=='windows' && (is_ie||is_chrome) && !options.redirect)
    {
        opt.redirect = 'http://hola.org/'+(opt.flow=='vpn' ? 'access/popular' :
            'player_torrents');
    }
    return opt;
}

E.set_download = function($el, opt){
    if (typeof $el=='string')
        $el = $($el);
    zerr.assert($el instanceof $, 'not a jquery element');
    if (!$el.length)
        return;
    site_load.uninit_simple_download($el);
    $el.off('.download');
    $el.attr('href', get_download_url());
    $el.on('click.download', function(event){ event.preventDefault(); });
    var triggers = [];
    etask([function(){
        return etask.all([app_checker.is_latest_ext(),
            app_checker.is_latest_svc()]);
    }, function(){
        $el.removeClass('detecting');
    }]);
    $el.each(function(){
        var trigger = new E.trigger();
        var $element = $(this);
        var local_opt = _.clone(opt);
        triggers.push(trigger);
        if ($element.data('download-type'))
            local_opt.type = $element.data('download-type');
        $element.on('mousedown.download', function(event){
            trigger.install(local_opt, event); });
    });
    return triggers[0];
};

E.set_download_vpn = function($el, opt){
    return E.set_download($el, $.extend({type: 'full', flow: 'vpn'}, opt)); };

E.set_download_player = function($el, opt){
    return E.set_download($el, $.extend({type: 'full', flow: 'player'}, opt));
};

function auto_download_exe(opt){
    zerr.assert(opt.type=='exe', 'invalid download type '+opt.type);
    start_download(get_exe_link());
    return tracker.track_download({name: 'exe',
        install_opt: opt,
        silent: opt.silent,
        ext_skip_first_run: opt.ext_skip_first_run,
        exe_redirect: opt.exe_redirect
    });
}

E.show_latest_modal = function(opt){
    tracker.perr('gen_show_latest_modal', opt);
    var $latest_modal = $('<div class="modal fade"></div>')
    .html(installation_templates.find('#latest-ext').clone());
    $latest_modal.find('#problem-hola-ext').click(function(){
        $latest_modal.modal('hide');
        tracker.track_download({name: 'ext', ext_skip_first_run: true,
            install_opt: opt});
        new ext_flow_model().install(opt);
    });
    $latest_modal.find('#problem-hola-exe').click(function(){
        $latest_modal.modal('hide');
        E.sp.spawn(auto_download_exe({type: 'exe', ext_skip_first_run: true}));
    });
    $latest_modal.find('#problem-hola-open').click(function(e){
        $latest_modal.modal('hide');
        if (is_ie)
        {
            e.preventDefault();
            return void show_hola_ff();
        }
    });
    $latest_modal.appendTo('body').modal();
};

/**
 * Detects and launches the most appropriate installation flow.
 *
 * Can trigger the following events:
 *
 * - **install_start** - installation flow started.
 * - **install_stop** - installation flow was interrupted and closed.
 * - **install_done** - installation successful.
 * - **latest** - nothing to install, app is latest. Will be triggered together
 * with 'no_install'.
 * - **unsupported** - nothing to install, os/browser is not supported. Will be
 * triggered together with 'no_install'.
 * - **no_install** - nothing to install (latest, unsupported or undefined
 * reason). If reason is defined then 'latest' or 'unsupported' events will be
 * triggered too.
 */
E.trigger = Backbone.Model.extend({
    opt: {},
    // Preloaded ext/exe states for _chrome_cb. Ext can't be executed async:
    // (https://developer.chrome.com/webstore/inline_installation#triggering)
    is_latest_ext: false,
    is_latest_svc: false,
    flow: null,
    e_latest_svc: null,
    is_chrome_incognito: false,
    initialize: function(){
        var _this = this;
        this.on('latest', function(type){
            _this._on_installed(type, true);
        });
        this.on('install_done', function(type){
            _this._on_installed(type, false);
        });
        etask([function(){
            return app_checker.is_latest_ext();
        }, function(is_latest){
            _this.is_latest_ext = is_latest;
        }]);
        this.e_latest_svc = etask([function(){
            return app_checker.is_latest_svc();
        }, function(is_latest){
            _this.is_latest_svc = is_latest;
        }]);
        this._detect_chrome_incognito();
    },
    /**
     * @param [opt.type='full'] Download type ('full'|'ext').
     * @param [opt.flow='vpn'] Installation flow ('vpn'|'player').
     * @param [opt.redirect] Url (redirect after install in current
     * browser).
     * @param [opt.ext_exe] ext_exe_flow specific parameters. Read more in
     * ext_exe_flow.js.
     * @param [opt.perr_on_step=false] Custom prefix for perr id.
     */
    install: function(opt, event){
        var _this = this;
        this.opt = opt_init(opt);
        if (event)
            event.preventDefault();
        if (!_.contains(['windows', 'macos'], os) && !sys.nix ||
            !_.contains(['chrome', 'firefox'], b.browser) && !is_ie)
        {
            window.open(get_download_url(), '_top');
            return this;
        }
        tracker.perr('step_click_0', this.opt);
        var flow;
        if (this._unsupported_browser())
            flow = null;
        else if (is_ie)
            flow = this._ie_cb();
        else if (b.browser=='chrome')
            flow = this._chrome_cb();
        else if (b.browser=='firefox')
            flow = this._firefox_cb();
        // sync and async flow init
        if (!(flow instanceof etask))
            this._set_flow(flow);
        else
        {
            etask([function(){
                return flow;
            }, function(flow){
               _this._set_flow(flow);
            }]);
        }
        return this;
    },
    _set_flow: function(flow){
        var _this = this;
        this.flow = flow;
        if (this.flow)
        {
            this.flow.on('all', function(){
                _this.trigger.apply(_this, arguments); });
            // We call installation methods by ourselves because we need to
            // bind on all object's events to not miss them.
            if (this.flow instanceof ext_flow_model)
                this.flow[is_chrome ? 'chrome' : 'firefox'](this.opt);
            else
                this.flow.install(this.opt);
        }
        else
            this.trigger('no_install');
    },
    _ie_cb: function(){
        var _this = this;
        return etask([function(){
            return _this.e_latest_svc;
        }, function(){
            if (_this.is_latest_svc)
                return void _this.trigger('latest', 'exe');
            return new ext_exe_flow_model();
        }]);
    },
    _chrome_cb: function(){
        if (this.opt.flow=='player' && os!='windows')
        {
            this.trigger('unsupported');
            this._show_player_unsupported_modal();
            return;
        }
        var flow;
        if (!this.is_latest_svc && this.opt.type!='ext' && os=='windows')
        {
            this.opt.ext_exe.no_ext = !this.opt.ext_exe
            .hasOwnProperty('no_ext') && this.is_chrome_incognito;
            flow = new ext_exe_flow_model();
        }
        else if (!this.is_latest_ext && this.opt.flow!='player')
        {
            if (this.is_chrome_incognito)
            {
                this.trigger('unsupported');
                location.href = '//hola.org/unsupported/product/incognitomode';
                return;
            }
            flow = new ext_flow_model();
        }
        else
            this.trigger('latest', 'ext');
        return flow;
    },
    _firefox_cb: function(){
        if (this.opt.flow=='player' && os!='windows')
        {
            this.trigger('unsupported');
            this._show_player_unsupported_modal();
            return;
        }
        var flow;
        if (!this.is_latest_svc && this.opt.type!='ext' && os=='windows')
            flow = new ext_exe_flow_model();
        else if (!this.is_latest_ext && this.opt.flow!='player')
            flow = new ext_flow_model();
        else
            this.trigger('latest', 'ext');
        return flow;
    },
    _detect_chrome_incognito: function(){
        // http://stackoverflow.com/a/27805491
        var _this = this;
        var fs = window.RequestFileSystem||window.webkitRequestFileSystem;
        if (!fs)
        {
            this.is_chrome_incognito = false;
            return;
        }
        fs(window.TEMPORARY, 100,
            function(){ _this.is_chrome_incognito = false; },
            function(){ _this.is_chrome_incognito = true; }
        );
    },
    /**
     * @param {string} [type] One of ext|exe. Will detect it automatically
     * based on current installation flow by default.
     * @param {boolean} is_previous Whether app was already installed when we
     * clicked installation button.
     */
    _on_installed: function(type, is_previous){
        if (!type&&this.flow)
        {
            if (this.flow instanceof ext_flow_model)
                type = 'ext';
            else if (this.flow instanceof ext_exe_flow_model)
                type = 'exe';
        }
        if (type=='ext')
            location.href = this.opt.redirect;
        else
        {
            if (this.opt.flow=='player')
                new mp_installed_view().show();
            if (is_previous)
                show_hola_ff(this.opt.redirect);
        }
    },
    _unsupported_browser: function(){
        if (!is_ff && !is_chrome)
            return false;
        var ver = b.version|0, min = is_chrome ? 31 : 22;
        if (is_chrome && (!window.chrome || !window.chrome.webstore) &&
            !window.opr)
        {
            tracker.perr('err_chrome_no_webstore', $.extend({},
                this.opt, {chrome: is_chrome}));
        }
        else
        {
            if (ver>min)
                return false;
            tracker.perr('err_unsupported_browser', this.opt);
        }
        this._show_unsupported_modal();
        this.trigger('unsupported');
        return true;
    },
    _show_unsupported_modal: function(){
        var $unsupported_modal = $('<div class="modal fade"></div>')
        .html(installation_templates.find('#outdated-browser').clone());
        $unsupported_modal.appendTo('body').modal();
        $unsupported_modal.find('#browser_update').attr('href',
            window.chrome ? 'https://www.google.com/intl/en/chrome/browser/' :
            'http://www.mozilla.org/en-US/firefox/update/');
    },
    _show_player_unsupported_modal: function(){
        tracker.perr('gen_player_unsupported', this.opt);
        var $player_unsupported_modal = $('<div class="modal fade"></div>')
        .html(installation_templates.find('#outdated-browser').clone());
        $player_unsupported_modal.appendTo('body').modal();
    },
    terminate_install: function(is_done){
        if (!this.flow)
            return;
        this.flow.terminate_install(is_done);
        tracker.perr('external_'+(is_done ? 'done' : 'close'));
    }
});

return E; });

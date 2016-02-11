// LICENSE CODE ZON
'use strict'; /*jslint browser:true*/
define(['virt_jquery_all', 'bootstrap', 'hola_opt', '/util/user_agent.js',
    '/util/etask.js', '/www/hola/pub/site_load.js', 'backbone',
    'text!installation_templates', '/svc/mp/pub/www_storage.js',
    '/svc/pub/app_checker.js', '/util/version_util.js',
    '/www/hola/pub/download/tracker.js', '/util/zdot.js'],
    function($, bootstrap, hopt, user_agent, etask, site_load, Backbone,
    installation_templates, www_storage, app_checker, version_util, tracker,
    zdot){
var b = user_agent.guess_browser();
var zdot_templates = zdot.template(installation_templates);

function start_download(link){
    $('body').append('<iframe width=0 height=0 class=hide frameborder=0 '+
        'src="'+link+'">');
}

return Backbone.Model.extend({
    $modal: null,
    opt: {},
    // Whether this version of Firefox requires signed extension.
    is_ff_signed: false,
    initialize: function(){
        this.is_ff_signed = b.browser=='firefox' &&
            version_util.version_cmp(b.version, '43')>=0;
    },
    install: function(opt){
        if (b.browser=='firefox')
            this.firefox(opt);
        else if (b.browser=='chrome')
            this.chrome(opt);
        return this;
    },
    firefox: function(opt){
        this.opt = opt || {};
        var _this = this;
        this.trigger('install_start');
        tracker.perr('step_modal_1', this.opt);
        var on_state = function(){
            switch (_this.get('state'))
            {
            case 'install_ext_wait':
                break;
            case 'install_done':
                _this.trigger('install_done');
                break;
            default:
                var _opt = $.extend({}, _this.opt, {state: _this
                .get('state')});
                tracker.perr('err_invalid_state', _opt);
                break;
            }
        };
        _this.on('change:state', on_state);
        if (this.get('state'))
            on_state();
        this._show_wait_modal('firefox', function(){
            _this.trigger_firefox_install();
        }, function(){
            if (sp)
                sp.ereturn();
            _this.off('change:state', on_state);
        });
        // XXX arik: improve, if svc detected, update svc as well
        // and if ext is latest, install svc
        var sp = etask([function try_catch$install_ext(){
            tracker.track_download({name: 'ext', ext_skip_first_run: true,
                install_opt: _this.opt});
            _this.trigger_firefox_install();
            _this.set('state', 'install_ext_wait');
            return app_checker.wait_for_new_ext(!!document.referrer);
        }, function done(){
        }, function try_catch$(){
            return www_storage.set_json('play_install_ts', {ts: Date.now()});
        }, function(){
            tracker.perr('step_done_9', _this.opt);
            _this.set('state', 'install_done');
            return this.wait();
        }, function ensure$(){
            sp = null;
        }]);
        return this;
    },
    chrome: function(opt){
        this.opt = opt || {};
        var _this = this;
        this.trigger('install_start');
        this._show_wait_modal('chrome', function(){
            _this.trigger_chrome_install(); });
        etask([function try_catch$(){
            tracker.track_download({
                name: 'ext',
                ext_skip_first_run: true,
                install_opt: _this.opt
            });
            return _this.trigger_chrome_install(_this.opt);
        }, function(){
            if (this.error)
            {
                _this.trigger('install_stop');
                if (this.error != 'User cancelled install')
                {
                    setTimeout(function(){
                        top.location.href = site_load.GDL[window.opr ?
                            'opera' : 'chrome'].url;
                    }, 250);
                }
                return this.ereturn();
            }
            return app_checker.wait_for_new_ext();
        }, function(){
            _this.trigger('install_done');
        }]);
        return this;
    },
    trigger_browser: function(opt){
        if (b.browser=='firefox')
            return this.trigger_firefox_install(opt);
        else if (b.browser=='chrome')
            return this.trigger_chrome_install(opt);
    },
    trigger_chrome_install: function(opt){
        var install_url = site_load.get_inline_url((site_load.GDL.chrome.url));
        return etask([function try_catch$(){
            tracker.perr('step_ext_4', opt);
            if (window.opr)
            {
                window.opr.addons.installExtension(site_load.GDL.opera.id,
                    this.econtinue_fn(), this.ethrow_fn());
            }
            else
            {
                window.chrome.webstore.install(install_url,
                    this.econtinue_fn(), this.ethrow_fn());
            }
            return this.wait();
        }, function(){
            var _opt = $.extend({}, opt, {err: ''+this.error});
            if (this.error)
            {
                if (this.error == 'User cancelled install')
                    tracker.perr('gen_step_ext_4_cancel', _opt);
                else
                    tracker.perr('err_step_ext_4', _opt);
                return this.ethrow(this.error);
            }
            tracker.perr('step_ext_5', _opt);
        }]);
    },
    trigger_firefox_install: function(){
        if (window.InstallTrigger)
        {
            // XXX arik: use Install_Object to handle success/cancel events:
            // https://developer.mozilla.org/en-US/docs/Archive/Mozilla/XPInstall/Reference/Install_Object
            return void window.InstallTrigger.install({Hola:
                this.is_ff_signed ? site_load.GDL.firefox_signed.url :
                site_load.GDL.firefox.url});
        }
        start_download(site_load.GDL.firefox.url);
    },
    terminate_install: function(){
        if (this.$modal)
            this.$modal.modal('hide');
    },
    _show_wait_modal: function(browser, on_install, on_close){
        var _this = this;
        var $template = $(zdot_templates({
            is_ff: browser=='firefox',
            is_ff_signed: this.is_ff_signed
        }));
        this.$modal = $('<div class="modal fade"></div>')
        .html($template.find('#firefox_modal').clone());
        this.$modal.removeClass('done');
        this.$modal.find(this.opt.flow == 'player' ? '.vpn_flow' :
            '.player_flow').hide();
        this.$modal.find('button.close').click(function(event){
            event.stopPropagation();
            event.preventDefault();
            _this.$modal.modal('hide');
        });
        var $content = this.$modal.find('.modal-content');
        $content.on('click', on_install);
        this.$modal.on('hidden.bs.modal', function(){
            _this.trigger('install_stop');
            if (on_close)
                on_close();
            $content.off('click', on_install);
            _this.$modal.remove();
            _this.$modal = null;
        });
        this.$modal.appendTo('body').modal({backdrop: 'static'});
        // XXX arik: firefox doesn't always show the modal when opened in a
        // frame
        setTimeout(function(){
            if (_this.$modal)
                _this.$modal.show();
        }, 1000);
    }
});

});

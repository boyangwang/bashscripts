// LICENSE CODE ZON
'use strict'; /*jslint browser:true, es5:true*/
define(['virt_jquery_all', '/util/user_agent.js', 'hola_opt',
    '/util/escape.js', '/util/etask.js', '/svc/versions.js',
    '/www/hola/pub/util.js', 'backbone', '/util/url.js',
    'text!installation_templates', '/svc/mp/circle_progress.js',
    '/util/storage.js', '/svc/mp/pub/www_storage.js',
    '/www/login/pub/login.js', '/svc/pub/app_checker.js',
    '/www/hola/pub/download/tracker.js',
    '/www/hola/pub/download/ext_flow.js', 'underscore',
    '/www/hola/pub/download/mp_installed_view.js',
    '/www/hola/pub/payment.js',
    '/util/zdot.js',
    '/svc/pub/account/membership.js'],
    function($, user_agent, hopt, zescape, etask, versions,
    www_util, Backbone, zurl,
    installation_templates, circle_progress, storage, www_storage,
    login, app_checker, tracker, ext_flow_model, _,
    mp_installed_view, payment, zdot, zmembership){
var b = user_agent.guess_browser(), sys = user_agent.guess();
var qs_o = zurl.qs_parse(location.search.replace(/^\?/, ''));
var zopts = storage.get_json('hola_opts') || {};
var is_ie = b.browser=='ie'||zopts.ie_hola_ff;
var is_chrome = b.browser=='chrome';
var is_ff = b.browser=='firefox';
var is_ext_no_plugin = !(window.hola_extension_info
    && window.hola_extension_info.plugin);

function is_download_arrow(){
    // only for chrome on desktops
    return b.browser=='chrome' && (sys.os=='windows' || sys.os=='macos' ||
        !sys.nix);
}

function is_paid(){
    return etask([function(){
        return $.get('/users/payment/get_membership');
    }, function(data){
        return zmembership.is_active(data) && !zmembership.is_in_trial(data);
    }]);
}

function start_download(link){
    $('body').append('<iframe width=0 height=0 class=hide frameborder=0 '+
        'src="'+link+'">');
}

var step_sign_up_view_class = Backbone.View.extend({
    initialize: function(options){
        this.$modal = options.$modal;
        this.model = options.model;
        this.install_opt = options.install_opt;
    },
    check_skip: function(opt){
        opt = opt||{};
        var _this = this;
        return etask([function(){
            var cookie = $.cookie('user');
            cookie = cookie && JSON.parse(cookie);
            return cookie || $.get('/users/get_user?source=download');
        }, function(res){
            if (!res || (!res.display_name && !res.user))
                return false;
            if (qs_o.login)
                _this.model.perr('step_sign_up_check_login_success');
            _this.model.set('step', opt.next||'i_agree');
            return true;
        }]);
    },
    start: function(opt){
        opt = opt||{};
        // We remove modal because it won't be used on this page any more. The
        // page will be reloaded after login.
        this.$modal.remove();
        $('.modal-backdrop').remove();
        var next = qs_o.auto_install ? location.href : zescape.uri(
            location.href, {auto_install: this.model.auto_install(opt.next)});
        var login_opt = opt.login||{};
        var login_modal = new login.Modal($.extend(login_opt, {
            signup_mode: true,
            enc_url: '?'+zescape.qs({next: next}),
            no_bg_close: true
        }));
        login_modal.open();
    }
});

var step_i_agree_engine_view_class = Backbone.View.extend({
    initialize: function(options){
        this.$modal = options.$modal;
        this.$modal.find('#chrome-ie-download').addClass('engine_update');
        this.model = options.model;
        this.install_opt = options.install_opt;
        this.$t = this.model.$templates.find('#step-agree-title-engine')
        .clone().hide();
        this.$b = this.model.$templates.find('#step-agree-body-engine').clone()
        .hide();
        this.$modal.find('.modal-header').append(this.$t);
        this.$modal.find('.modal-content').append(this.$b);
        var $b = this.$b, $t = this.$t;
        var model = this.model;
        $b.find('.checkbox-wrap').hide();
        $b.find('.exe-info').removeClass('hidden').html('');
        $b.find('.btn.next').text('Agree & install');
        $b.find('#terms_of_use').click(function(e){
            e.preventDefault();
            $b.find('#vpn_install_engine').toggleClass('border');
            $b.find('.eula').toggleClass('hidden');
        });
        $b.find('.eula').load(function(){
            $b.find('.eula').contents().find('.eula')
            .addClass('inside-iframe');
        });
        $b.find('.btn.next').click(function(){
            model.set('step', 'exe'); });
    },
    start: function(){
        this.$t.show();
        this.$b.show();
    },
    end: function(){
        this.$t.hide();
        this.$b.hide();
    }
});

var step_i_agree_view_class = Backbone.View.extend({
    initialize: function(options){
        var eula_shown = false;
        this.$modal = options.$modal;
        this.model = options.model;
        this.install_opt = options.install_opt;
        this.$t = this.model.$templates.find('#step-agree-title').clone()
        .hide();
        this.$b = this.model.$templates.find('#step-agree-body').clone()
        .hide();
        this.$modal.find('.modal-header').append(this.$t);
        this.$modal.find('.modal-content').append(this.$b);
        var $b = this.$b;
        var model = this.model;
        $b.find('.checkbox-wrap').hide();
        $b.find('.exe-info').removeClass('hidden')
        .html('Windows '+(sys.arch==64 ? ' 64bit' : '32bit')+
        ' version | '+this.model.get_exe_filename());
        $b.find('.btn.next').text('Agree and download');
        $b.find('.next_div, .exe-info').addClass('no-ext');
        $b.find('#terms_of_use').click(function(){
            if (!eula_shown)
            {
                $b.find('#vpn_install').removeClass('border');
                $b.find('.eula').removeClass('hidden');
                eula_shown = true;
            }
            else
            {
                $b.find('#vpn_install').addClass('border');
                $b.find('.eula').addClass('hidden');
                eula_shown = false;
            }
            return false;
        });
        $b.find('.eula').load(function(){
            $b.find('.eula').contents().find('.eula')
            .addClass('inside-iframe');
        });
        $b.find('.btn.next').click(function(){
            model.set('step', 'exe'); });
    },
    start: function(){
        this.$t.show();
        this.$b.show();
    },
    end: function(){
        this.$t.hide();
        this.$b.hide();
    }
});

var step_choose_plan_view_class = Backbone.View.extend({
    initialize: function(options){
        var eula_shown = false;
        this.$modal = options.$modal;
        var model = this.model = options.model;
        this.$t = model.$templates.find('#step-choose-plan-title').clone()
        .hide();
        this.$b = model.$templates.find('#step-choose-plan-body').clone()
        .hide();
        this.$modal.find('.modal-header').append(this.$t);
        this.$modal.find('.modal-content').append(this.$b);
        var $b = this.$b;
        $b.find('.checkbox-wrap').hide();
        $b.find('.btn.next').text('Next');
        $b.find('.next_div').addClass('no-ext');
        $b.find('#terms_of_use').click(function(){
            if (!eula_shown)
            {
                $b.find('.install').removeClass('border');
                $b.find('.eula').removeClass('hidden');
                eula_shown = true;
            }
            else
            {
                $b.find('.install').addClass('border');
                $b.find('.eula').addClass('hidden');
                eula_shown = false;
            }
            return false;
        });
        $b.find('.eula').load(function(){
            $b.find('.eula').contents().find('.eula')
            .addClass('inside-iframe');
        });
        $b.find('.btn.next').click(function(){
            var plan = $b.find('input[name="plan"]:checked').val();
            model.perr('step_choose_plan_select_'+plan);
            model.set_plan(plan);
            if (plan=='free')
                return model.set('step', 'exe');
            model.set('step', {name: 'sign_up', opt: {
                next: 'choose_premium',
                login: {title: 'Create your premium account'}}});
        });
    },
    start: function(){
        this.$modal.find('#chrome-ie-download').addClass('choose-plan');
        this.$t.show();
        this.$b.show();
    },
    end: function(){
        this.$t.hide();
        this.$b.hide();
    }
});

var step_choose_premium_view_class = Backbone.View.extend({
    initialize: function(options){
        this.$modal = options.$modal;
        var model = this.model = options.model;
        this.install_opt = options.install_opt;
        this.$t = model.$templates.find('#step-choose-premium-title').clone()
        .hide();
        this.$b = model.$templates.find('#step-choose-premium-body').clone()
        .hide();
        this.$modal.find('.modal-header').append(this.$t);
        this.$modal.find('.modal-content').append(this.$b);
        var $b = this.$b, et;
        $b.find('.checkout').click(function(){
            if (et)
                return et;
            var method = $b.find('input:radio[name=method]:checked').val();
            var period = $b.find('input:radio[name=period]:checked').val()
            .replace(' ', '_');
            model.perr('step_choose_premum_method_'+method);
            model.perr('step_choose_premum_period_'+period);
            et = etask([function(){
                return $.get('/users/get_user?source=download');
            }, function(res){
                if (!res||!res.user)
                    return this.ereturn();
                var payment_fn = method==='cc' ? payment.cc_btn
                    : payment.paypal_btn;
                payment_fn({form: $b, user: res.user,
                    next: zescape.uri('https://hola.org/',
                        {auto_install: model.auto_install('exe')})});
            }]);
        });
    },
    check_skip: function(){
        var _this = this;
        return etask([function(){
            return is_paid();
        }, function(is_paid){
            if (!is_paid)
                return false;
            _this.model.set('step', 'exe');
            return true;
        }]);
    },
    start: function(){
        this.$t.show();
        this.$b.show();
    },
    end: function(){
        this.$t.hide();
        this.$b.hide();
    }
});

var step_ext_view_class = Backbone.View.extend({
    initialize: function(options){
        var _this = this;
        this.$modal = options.$modal;
        this.model = options.model;
        this.install_opt = options.install_opt;
        this.$t = this.model.$templates.find('#step-ext-title').clone().hide();
        this.$b = this.model.$templates.find('#step-ext-body').clone().hide();
        this.$modal.find('.modal-header').append(this.$t);
        this.$modal.find('.modal-content').append(this.$b);
        this.$b.find('.btn').click(function(){
            _this.sp.egoto('install_ext');
            _this.model.perr('ext_install_click');
        });
    },
    start: function(){
        this.$t.show();
        this.$b.show();
        var $b = this.$b, model = this.model, _this = this;
        var opt = this.install_opt;
        var $install_status = $b.find('.status_msg');
        this.sp = etask([function(){
            return this.wait();
        }, function try_catch$install_ext(){
            $b.find('.circle_progress').circularProgress({rotate: true,
                spin_mode: 'spinner', progress: 35});
            tracker.track_download({name: 'ext', ext_skip_first_run: true,
                install_opt: opt});
            $b.find('.install').hide();
            $install_status.show();
            return new ext_flow_model().trigger_browser(opt);
        }, function(){
            if (this.error)
            {
                _this.$modal.modal('hide');
                return this.wait();
            }
            return app_checker.wait_for_new_ext();
        }, function(){
            model.trigger('state', 'installed', 'ext');
            return this.wait();
        }, function ensure$(){
            _this.sp = undefined;
        }]);
    },
    end: function(){
        this.$t.hide();
        this.$b.hide();
        if (this.sp)
            this.sp.ereturn();
    }
});

var step_exe_view_class = Backbone.View.extend({
    initialize: function(options){
        var _this = this;
        this.$modal = options.$modal;
        this.model = options.model;
        this.install_opt = options.install_opt;
        this.$t = this.model.$templates.find('#step-exe-title').clone().hide();
        this.$b = this.model.$templates.find('#step-exe-body').clone().hide();
        this.$modal.find('.modal-header').append(this.$t);
        this.$modal.find('.modal-content').append(this.$b);
        var $b = this.$b;
        $b.find('.download-again').click(function(){
            _this.sp.egoto('install_exe'); });
        $b.find('.add_to_win').click(function(){
            _this.sp.egoto('install_exe'); });
    },
    start: function(){
        this.$t.show();
        this.$b.show();
        var $b = this.$b, opt = this.install_opt, sp_track_exe;
        var _this = this, model = this.model;
        _this._set_msg(0, 0, '');
        this.sp = etask([function install_exe(){
            model.perr('step_exe_7');
            if (sp_track_exe)
                sp_track_exe.ereturn();
            _this._set_msg(0, 0, '');
            $b.find('.download-wrap').hide();
            var $wrapper = $b.find('.install_win_div').show();
            $('.exe-file', $wrapper).text(_this.model.get_exe_filename());
            $('.exe-link', $wrapper).attr('href', _this.model.get_exe_link());
            $('.screenshot', $wrapper).toggle(is_download_arrow());
            start_download(_this.model.get_exe_link());
            _this._show_arrow();
            return tracker.track_download({
                name: 'exe',
                install_opt: opt,
                ext_skip_first_run: !is_ie && !is_chrome && !is_ext_no_plugin,
                exe_redirect: opt.ext_exe.exe_redirect,
                silent: true
            });
        }, function(){
            _this.sp.spawn((sp_track_exe = track_exe_status()));
            return app_checker.wait_for_new_svc();
        }, function done(){
            model.trigger('state', 'installed', 'exe');
            return this.wait();
        }, function ensure$(){
            if (sp_track_exe)
                sp_track_exe.ereturn();
            _this.sp = undefined;
        }]);
        function track_exe_status(){
            var installing = false;
            // Show ext step if user has not started installation in 30 sec
            setTimeout(function(){
                if (!installing&&_this.model.is_ext_step)
                    _this.model.set('step', 'ext_timeout');
            }, 30000);
            return etask.efor(null, function(){ return etask.sleep(1000); },
            [function try_catch$(){
                return $.ajax({type: 'POST', dataType: 'json', url:
                    '//client.hola.org/client_cgi/win_install_init.json'});
            }, function(e){
                if (!e || !e.item || e.name != 'exe')
                    return;
                if (e.item.install_err_time)
                {
                    $b.find('.install_win_div').hide();
                    _this._set_msg(1, 0, '');
                    return this.ebreak();
                }
                if (e.item.cid_set_time)
                {
                    model.perr('exe_installed');
                    if (_this.model.is_ext_step)
                        _this.sp.ebreak();
                    else
                    {
                        _this.sp.egoto('done');
                        return this.ebreak();
                    }
                }
                else if ((e.item.install_start_time ||
                    e.item.install_web_start_time) && !installing)
                {
                    installing = true;
                    if (_this.model.is_ext_step)
                    {
                        _this.model.set('step', 'ext');
                        return;
                    }
                    model.perr('step_exe_8');
                    $b.find('.install_win_div').hide();
                    _this._hide_arrow();
                    $b.find('.circle_progress').circularProgress({rotate: true,
                        spin_mode: 'spinner', progress: 35});
                    _this._set_msg(0, 1, 'Hang on, installing Hola');
                }
            }, function ensure$(){
                sp_track_exe = undefined;
            }]);
        }
    },
    end: function(){
        this.$t.hide();
        this.$b.hide();
        this._hide_arrow();
        // don't stop this.sp, it must send all events related to exe
        // installation event if modal box is closed
    },
    _set_msg: function(err_msg, spinner, status_msg){
        if (status_msg)
        {
            this.$b.find('.status_msg').show();
            this.$b.find('.status_msg .msg').html(status_msg);
        }
        // firefox will not work if toggle doesn't get boolean
        this.$b.find('.status_msg').toggle(!!status_msg);
        this.$b.find('.spinner').toggle(!!spinner);
        this.$b.find('.err_msg').toggle(!!err_msg);
    },
    _show_arrow: function(){
        if (is_download_arrow())
            $('<div>', {class: 'chrome-download-arrow'}).appendTo('body');
    },
    _hide_arrow: function(){
        $('.chrome-download-arrow').remove();
    }
});

var step_done_mp_view_class = Backbone.View.extend({
    initialize: function(options){
        this.$modal = options.$modal;
    },
    start: function(){
        this.$modal.modal('hide');
        new mp_installed_view().show();
    },
    end: function(){
        // nothing to do here
    }
});
var steps = {
    i_agree: {
        object: step_i_agree_view_class,
        perr: '2'
    },
    choose_plan: {
        object: step_choose_plan_view_class,
        perr: '0'
    },
    sign_up: {
        object: step_sign_up_view_class,
        perr: '0'
    },
    choose_premium: {
        object: step_choose_premium_view_class,
        perr: '0'
    },
    exe: {
        object: step_exe_view_class,
        perr: '6'
    },
    ext: {
        object: step_ext_view_class,
        perr: '3'
    },
    ext_timeout: {
        object: step_ext_view_class,
        perr: '10'
    },
    done_mp: {
        object: step_done_mp_view_class,
        perr: 'gen_mp'
    }
};

/**
 * Ext/exe installation flow with modal boxes and steps.
 *
 * Can trigger the following events:
 *
 * - **install_start** - installation flow started.
 * - **install_stop** - installation flow was interrupted and closed.
 * - **install_done** - installation successful.
 * - **step** - triggered on each step change. Will pass step name as first
 * argument.
 */
return Backbone.Model.extend({
    opt: {},
    $modal: null,
    step_views: {},
    steps: 0,
    step: 0,
    state: 'not_init',
    is_paid: false,
    is_ext_step: false,
    $templates: null,
    initialize: function(){
        this.on('install_done', this._on_install_done, this);
        this.on('state', this._on_state, this);
    },
    /**
     * @param [opt.ext_exe] ext_exe_flow specific parameters.
     * @param {(false|string)} [opt.ext_exe.exe_redirect] Page url to open in
     * hola br after install. Set to `false` to disable hola br opening. Will
     * guess the url by default.
     * @param [opt.ext_exe.no_done=false] Whether we should not show the 'Done'
     * step for 'player' flow (modal box will just close after install).
     * @param [opt.ext_exe.step] Start flow on specific step.
     * @param [opt.ext_exe.title] Modal title for all steps.
     * @param [opt.ext_exe.plan] Which plan selected: free or paid.
     * @param [opt.ext_exe.no_ext=false] Whether we should not install
     * extension.
     * @param [opt.redirect] Url that will be displayed on the 'done' step.
     * @param [opt.flow='vpn'] One of vpn|player.
     */
    install: function(opt){
        opt = this._opt_init(opt);
        var _this = this;
        etask([function(){
            return is_paid();
        }, function(is_paid){
            _this.is_paid = is_paid;
            return _this._steps_init();
        }, function(){
            _this.step_views = {};
            _this.trigger('state', 'progress');
            _this.perr('step_modal_1');
            _this.$templates = $(zdot.template(installation_templates)({
                flow: opt.flow,
                is_ff: is_ff,
                modal_title: opt.ext_exe.title
            }));
            _this.$modal = $('<div class="modal fade"></div>')
            .html(_this.$templates.find('#chrome-ie-download').clone());
            if (_this.steps<2)
                _this.$modal.find('#chrome-ie-download').addClass('no-steps');
            _this.$modal.on('hidden.bs.modal', _.bind(_this._close, _this));
            _this.on('change:step', _this._on_step, _this);
            _this.$modal.appendTo('body').modal({backdrop: 'static'});
            var first_step = !_this.is_paid ? 'choose_plan' : 'exe';
            _this.set('step', opt.ext_exe.step||first_step);
            // XXX arik: when running installation in /player_install when
            // inside iframe (in-page exe install), the modal is not displayed
            // in firefox. As a hack, we set it to 'block'
            if (b.browser=='firefox')
                _this.$modal.css('display', 'block');
        }]);
        return this;
    },
    auto_install: function(step){
        var opt = _.clone(this.opt);
        opt.ext_exe.step = step;
        return JSON.stringify(opt);
    },
    perr: function(name, opt){
        var plan = this.opt.ext_exe.plan;
        return tracker.perr((plan ? plan+'_' : '')+name, opt||this.opt);
    },
    set_plan: function(plan){
        this.opt.ext_exe.plan = plan; },
    _get_step_info: function(){
        var step = this.get('step');
        return typeof step=='string' ? {name: step} : step;
    },
    _steps_init: function(){
        var _this = this;
        if (this.opt.ext_exe.step)
            this.step++;
        return etask([function(){
            return app_checker.is_latest_ext();
        }, function(is_ext){
            _this.is_ext_step = !_this.opt.ext_exe.no_ext && !is_ext && !is_ie
                && (_this.opt.flow!='player' || !is_chrome || b.opera);
            _this.steps = _this.is_ext_step ? 3 : 2;
            if (_this.is_paid&&!_this.opt.ext_exe.step)
                _this.steps--;
            // No need to open hola ff by setup.exe when ext is installing.
            if (_this.is_ext_step)
                _this.opt.ext_exe.exe_redirect = false;
        }]);
    },
    _on_step: function(){
        var _this = this;
        var step_info = this._get_step_info();
        var prev_step = this.get('prev_step');
        var step_view = this._get_step(step_info.name);
        var $steps_wrapper = this.$modal.find('.modal-title .steps');
        etask([function(){
            if (!step_view.check_skip)
                return false;
            return step_view.check_skip(step_info.opt);
        }, function(is_skip){
            if (is_skip)
                return;
            _this.trigger('step', step_info.name);
            _this.step++;
            if (prev_step)
                _this._get_step(prev_step.name).end();
            $steps_wrapper.find('.current').text(_this.step);
            $steps_wrapper.find('.total').text(_this.steps);
            step_view.start(step_info.opt);
            _this.set('prev_step', step_info);
            var step_num = steps[step_info.name] ? steps[step_info.name].perr :
                'err';
            _this.perr('step_'+step_info.name+'_'+step_num);
        }]);
    },
    _opt_init: function(opt){
        opt = opt||{};
        opt.flow = opt.flow||qs_o.install_flow||'vpn';
        opt.ext_exe = opt.ext_exe||{};
        if (!opt.ext_exe.hasOwnProperty('exe_redirect') && sys.os=='windows' &&
            (is_ie || is_chrome || is_ext_no_plugin))
        {
            opt.ext_exe.exe_redirect = (opt.flow=='player' ?
                'http://hola.org/player_torrents' :
                'http://hola.org/access/install');
        }
        return this.opt = opt;
    },
    _on_install_done: function(){
        var _this = this;
        return etask([function try_catch$(){
            return www_storage.set_json('play_install_ts', {ts: Date.now()});
        }, function(){
            // wait for perr request
            return _this.perr('step_done_9');
        }, function(){
            if (_this.opt.ext_exe.no_done||_this.opt.flow=='vpn')
                return void _this.$modal.modal('hide');
            if (_this.opt.flow=='player')
                _this.set('step', 'done_mp');
        }]);
    },
    _on_state: function(state, argument){
        this.state = state;
        var states = {
            progress: 'install_start',
            close: 'install_stop', // closed by user
            terminated: 'install_stop', // terminated by external command
            installed: 'install_done'
        };
        this.trigger(states[state], argument);
    },
    _close: function(){
        var step = this._get_step_info().name, view = this.step_views[step];
        if (this.state=='progress')
            this.trigger('state', 'close');
        if (view && view.end)
            view.end();
        this.off('change:step');
        this.$modal.remove();
        if (this.state!='terminated')
            this.perr('hide_step_'+this._get_step_info().name);
        this.$modal = null;
    },
    _get_step: function(name){
        if (this.step_views[name])
            return this.step_views[name];
        var _this = this;
        this.step_views[name] = new steps[name].object({
            $modal: this.$modal,
            model: this,
            install_opt: this.opt
        });
        this.step_views[name].on('all', function(eventName){
            _this.trigger(eventName); });
        this.$modal.find(this.opt.flow=='player' ? '.vpn_flow' :'.player_flow')
        .hide();
        return this.step_views[name];
    },
    get_exe_link: function(){
        return www_util.get_exe_link(hopt, sys, versions); },
    get_exe_filename: function(){
        return www_util.get_exe_filename(hopt, sys, versions); },
    terminate_install: function(is_done){
        if (this.state=='progress')
        {
            this.trigger('state', is_done ? 'installed' : 'terminated');
            this.$modal.modal('hide');
        }
    }
});

});

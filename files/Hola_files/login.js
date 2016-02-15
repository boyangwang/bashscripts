// LICENSE_CODE ZON
'use strict'; /*jslint browser:true*/
define(['backbone', 'underscore', '/util/etask.js', '/util/date.js',
    'virt_jquery_all', '/util/escape.js', '/svc/pub/account/membership.js',
    'login_config', '/util/url.js', '/util/storage.js',
    '/util/ccounter_client.js', '/util/csrf.js'],
    function(Backbone, _, etask, date, $, zescape, membership,
    login_config, zurl, storage, ccounter_client, csrf){
var E = {};
var up = login_config.url_prefix+'/users';
var modal_html= '\
    <div class="modal-dialog">\
      <div class="modal-content">\
        <div class="modal-header">\
           <button type="button" class="close" data-dismiss="modal" \
           aria-hidden="true">&times;</button>\
           <h4 class="modal-title"></h4>\
        </div>\
        <div class="modal-body"></div>\
        <div class="modal-footer">\
          <button type="button" class="btn btn-default login_skip" \
          data-dismiss="modal">Not right now</button>\
        </div>\
      </div>\
    </div>';
var page_html = '\
    <h2 style="text-align: center"></h2>\
    <h3 class="text-center"></h3>\
    <div class="modal-body"></div>';
var view_html = '\
    <p class="auth-text hidden"></p>\
    <a href="'+up+'/auth/google" class="auth-google"></a>\
    <a href="'+up+'/auth/facebook" class="auth-facebook"></a>\
    <p style="margin: 0px auto 0px auto; max-width: 300px">We will not post \
    anything on your behalf.</p>\
    <p class="or-line"><span>OR</span></p>\
    <form action="'+up+'/auth/basic/signup" class="signup" \
    method="POST">\
      <div class="form-group">\
        <div class="error alert alert-danger hidden"></div>\
        <div class="alert alert-info check-email hidden"></div>\
      </div>\
      <div class="form-group username-group">\
        <input type="text" name="username" \
        class="form-control signup_username" placeholder="Enter your email" \
        tabindex="1">\
      </div>\
      <div class="form-group password-group">\
        <input class="form-control signup_password" type="password"\
        name="password" tabindex="2">\
      <span class="help-block text-right password_reset">\
      <a class="forgot_password" href>Forgot password</a> or \
      <a class="dont_have_password" href>don\'t have one?</a></span>\
      </div>\
      <button type="submit" data-loading-text="Creating account..." \
      class="btn btn-signup btn-lg btn-block signup" tabindex="3">\
      Create your free account</button>\
      <button type="submit" data-loading-text="Logging in..." \
      class="btn btn-signup btn-lg btn-block login" tabindex="3">Log in\
      </button>\
      <span class="mode_switch text-left help-block"></span>\
    </form>';
var view_html2 = '\
    <div class="row">\
        <div class="col-sm-6 login-social-networks-block">\
          <h5 class="title">Using social networks</h5>\
          <div class="login-social-networks">\
            <a href="'+up+'/auth/facebook" class="auth-facebook">Log in with\
            Facebook</a>\
            <a href="'+up+'/auth/google" class="auth-google">Log in with \
            Google</a>\
            <p class="comment">\
              We will not post anything on your behalf.</p>\
          </div>\
        </div>\
        <div class="col-sm-6 login-email-block">\
          <h5 class="title">Using your email</h5>\
          <form action="'+up+'/auth/basic/signup" class="signup" \
            method="POST">\
            <div class="form-group alerts">\
              <div class="error alert alert-danger hidden"></div>\
              <div class="alert alert-info check-email hidden"></div>\
              <div class="alert alert-warning check-domain hidden"></div>\
            </div>\
            <div class="form-group username-group">\
              <label>Email</label>\
              <input type="text" name="username"\
                class="form-control signup_username" tabindex="1">\
            </div>\
            <div class="form-group password-group">\
              <label>Password</label>\
              <input class="form-control signup_password" type="password"\
              name="password" tabindex="2">\
            </div>\
            <button type="submit" data-loading-text="Creating account..."\
            class="btn btn-flat-blue btn-block signup" tabindex="3">\
            Create account</button>\
            <button type="submit" data-loading-text="Logging in..."\
            class="btn btn-flat-blue btn-block login" tabindex="3">Log in\
            </button>\
          </form>\
        </div>\
    </div>';
var activate_html = ['<div class="activate-form-body row">',
    '<div class="col-md-3 form-column">',
        '<div class="globe"></div>',
        '<div class="login-social-networks-block ',
            'activate-form-top">',
            '<a href="', up, '/auth/facebook" class="auth-facebook"></a>',
            '<a href="', up, '/auth/google" class="auth-google"></a>',
        '</div>',
        '<div class="login-email-block activate-form-bottom">',
            '<div class="email-activation text-center"></div>',
            '<form action="', up, '/auth/basic/signup" ',
                'class="signup activate-form-content-right" method="POST"',
                'style="display:none">',
                '<div class="form-group alerts">',
                    '<div class="error alert alert-danger hidden"></div>',
                    '<div class="alert alert-info check-email hidden"></div>',
                '</div>',
                '<div class="form-group username-group">',
                    '<label>Email address</label>',
                    '<input type="text" name="username"',
                        'class="form-control signup_username" tabindex="1">',
                '</div>',
                '<div class="form-group password-group">',
                    '<label>Enter your password</label>',
                    '<input class="form-control signup_password" ',
                        'type="password" name="password" tabindex="2">',
                '</div>',
                '<a class="forgot_password" href>Forgot password?</a>',
                '<button type="submit" tabindex="3"',
                    'data-loading-text="Creating account..."',
                    'class="btn btn-flat-blue btn-block signup">',
                    'Activate using email',
                '</button>',
                '<button type="submit" data-loading-text="Logging in..."',
                    'class="btn btn-flat-blue btn-block login" tabindex="3">',
                    'Login',
                '</button>',
            '</form>',
            '<p class="text-center notice">',
            ' We won\'t use or share your information',
            ' nor post anything on your behalf.</p>',
        '</div>',
    '</div></div>'].join('');
var verify_email_html =
    '<div class="modal fade">'
    +'  <div class="modal-dialog">'
    +'    <div class="modal-content">'
    +'      <div class="modal-header">'
    +'        <button type="button" class="close" data-dismiss="modal" '
    +'        aria-hidden="true">&times;</button>'
    +'        <h4 class="modal-title">Verify your email address</h4>'
    +'      </div>'
    +'      <div class="modal-body">'
    +'        <div class="alert alert-success hidden"></div>'
    +'      </div>'
    +'      <div class="modal-footer">'
    +'        <button type="button" class="btn btn-default" '
    +'        data-dismiss="modal">Close</button>'
    +'        <button type="button" class="btn btn-primary resend_email">'
    +'        Resend email'
    +'        </button>'
    +'      </div>'
    +'    </div>'
    +'  </div>'
    +'</div>';

var login_view = Backbone.View.extend({
    form_template: view_html,
    initialize: function(options){
        this.options = options||{};
        _.bindAll(this, 'switch_mode', 'signup', 'login', 'forgot_password',
            'prevalidate_email');
        this.render();
        this.render_affiliate();
        csrf.add('form.signup');
    },
    render_affiliate: function(){
        var $form = this.$('form');
        if (!$form.length)
            return;
        $form.find('[name=affiliate]').remove();
        var events = storage.get_json('affiliate_events');
        if (!events || !events.length)
            return;
        $form.append($('<input>', {type: 'hidden', name: 'affiliate',
            value: JSON.stringify(events)}));
    },
    input_err: function(class_name, $el){
        this.clear_errs();
        this.$('.error').append($el).removeClass('hidden');
        this.$(class_name).addClass('has-error').find('input').focus();
        this.reset_btn();
    },
    custom_input_err: function(e){
        var errors = login_config.err||{};
        var err_code = e.responseJSON && e.responseJSON.err;
        this.input_err(null, $('<span />').text(errors[err_code]||
            'We\'ve encountered an error. Please try again later.'));
    },
    check_password: function(email, password){
        var _this = this;
        return etask([function(){
            return $.post(up+'/auth/basic/check_credentials',
                {username: email, password: password});
        }, function(){
            $('input[name="csrf_token"]').val(csrf.get());
            return true;
        }, function catch$(e){
            if (e.status===401)
                return false;
            throw e;
        }]);
    },
    signup: function(event){
        var email, password, _this = this;
        etask([function(){
            event.preventDefault();
            _this.clear_errs();
            if (!(email = _this.validate_email()))
                return this.ereturn();
            if (!(password = _this.validate_password()))
                return this.ereturn();
            _this.$('button.signup').button('loading');
            return $.get(up+'/check_email', {email: email});
        }, function(res){
            if (res.err==='domain_blacklisted')
            {
                _this.input_err('.username-group', $('<span>We don\'t allow @'+
                    email.match(/@(.*)$/)[1]+' email addresses.</span>'));
                return this.ereturn();
            }
            if (!res.used)
            {
                if (_this.options.on_submit)
                {
                    _this.options.on_submit();
                    setTimeout(function(){
                        _this.$('form.signup').unbind('submit').submit();
                    }, 500);
                }
                else
                    _this.$('form.signup').unbind('submit').submit();
                return this.ereturn();
            }
            return _this.check_password(email, password);
        }, function(ret){
            if (ret)
            {
                if (_this.options.on_submit)
                {
                    _this.options.on_submit({type: 'signup'});
                    setTimeout(function(){
                        _this.$('form.signup').unbind('submit').submit();
                    }, 500);
                }
                else
                    _this.$('form.signup').unbind('submit').submit();
                return;
            }
            _this.input_err('.username-group',
                $('<span>')
            .text('The email address is already in use. ')
            .append($('<a>').attr('href', '')
            .text('Click here to log in.'))
            .click(_this.switch_mode));
        }, function catch$(e){
            _this.custom_input_err(e);
        }]);
    },
    login: function(event){
        var email, password, _this = this;
        etask([function(){
            event.preventDefault();
            if (!(email = _this.validate_email()))
                return this.ereturn();
            if (!(password = _this.validate_password()))
                return this.ereturn();
            _this.$('button.login').button('loading');
            return $.get(up+'/check_email', {email: email});
        }, function(res){
            if (!res.used)
            {
                _this.input_err('.username-group',
                    $('<span>').text('The email address is not registered. ')
                    .append($('<a>').attr('href', '')
                    .text('Click here to sign up.'))
                    .click(_this.switch_mode));
                return this.ereturn();
            }
            return _this.check_password(email, password);
        }, function(ret){
            if (ret)
            {
                if (_this.options.on_submit)
                {
                    _this.options.on_submit({type: 'login'});
                    setTimeout(function(){
                        _this.$('form.signup').unbind('submit').submit();
                    }, 500);
                }
                else
                    _this.$('form.signup').unbind('submit').submit();
                return;
            }
            _this.input_err('.password-group',
                $('<span>').text('The password is incorrect. ')
            .append($('<a>').attr('href', '')
            .text('Forgot your password?'))
            .click(_this.forgot_password));
        }, function catch$(e){
            _this.custom_input_err(e);
        }]);
    },
    switch_mode: function(){
        this.options.signup_mode = !this.options.signup_mode;
        this.render_mode();
        this.$('.signup_username').focus();
        if (this.options.parent)
            this.options.parent.trigger('mode_change');
        return false;
    },
    clear_errs: function(){
        this.$('.username-group, .password-group').removeClass('has-error');
        this.$('.error, .check-email').addClass('hidden');
        this.$('.error').empty();
    },
    reset_btn: function(){ this.$('.btn').button('reset'); },
    render_mode: function(){
        var $active_btn, $inactive_btn, submit_func;
        this.clear_errs();
        this.$('.signup_password').val('');
        if (this.options.signup_mode)
        {
            $active_btn = this.$('button.signup');
            $inactive_btn = this.$('button.login');
            submit_func = this.signup;
            if (this.options.no_switch)
                this.$('.mode_switch').addClass('hidden');
            else
            {
                this.$('.mode_switch').html('Already have an account? ')
                .append($('<a>').text('Log in').attr('href', '')
                .click(this.switch_mode)).removeClass('hidden');
            }
            this.$('.signup_password').attr('placeholder',
                'Choose a password');
            this.$('.auth-facebook')
            .html('Sign up with <strong>Facebook</strong>');
            this.$('.auth-google')
            .html('Sign up with <strong>Google</strong>');
            this.$('.password_reset').addClass('hidden');
        }
        else
        {
            $active_btn = this.$('button.login');
            $inactive_btn = this.$('button.signup');
            submit_func = this.login;
            this.$('.mode_switch').html('Don\'t have an account? ')
            .append($('<a>').text('Sign up').attr('href', '')
            .click(this.switch_mode));
            this.$('.signup_password').attr('placeholder',
                'Enter your password');
            this.$('.auth-facebook')
            .html('Log in with <strong>Facebook</strong>');
            this.$('.auth-google')
            .html('Log in with <strong>Google</strong>');
            this.$('.password_reset').removeClass('hidden');
        }
        $active_btn.removeClass('hidden').attr('type', 'submit');
        $inactive_btn.addClass('hidden').attr('type', 'button');
        this.$('.signup').unbind('submit').submit(submit_func);
    },
    render: function(){
        var _this = this;
        this.$el.html(this.form_template);
	var enc_url = _this.options.enc_url||
	    '?'+zescape.qs({next: location.href});
        this.$('form.signup').attr('action', function(idx, act){
            return (act.substr(0, act.indexOf('?'))||act)+enc_url; });
        this.$('a.auth-facebook, a.auth-google').each(function(n, a){
            a.rel = a.rel||a.href;
            a.href = a.rel+enc_url;
        });
        this.$('.forgot_password, .dont_have_password').unbind('click')
        .click(this.forgot_password);
        this.$('.signup_username').unbind('keyup change');
        if (this.options.text)
            this.$('.auth-text').html(this.options.text).removeClass('hidden');
        this.render_mode();
    },
    delay_event: function(fn){
        return function(event){
            if (fn._timeout && typeof fn.timer=='number')
                clearTimeout(fn._timeout);
            fn._timeout = setTimeout(function(){ fn.call(event); });
        };
    },
    validate_email: function(){
        var email = $.trim(this.$('.signup_username').val()).toLowerCase();
        this.$('.signup_username').val(email);
        if (!zurl.is_valid_email(email))
        {
            this.input_err('.username-group',
                $('<span>').text('Please enter a valid email address.'));
            return;
        }
        return email;
    },
    prevalidate_email: function(){
        var email = $.trim(this.$('.signup_username').val()).toLowerCase();
        if (!zurl.is_valid_email(email))
            return;
        if (/@(gmail|yahoo|hotmail|yandex)/.test(email))
        {
            var msg = 'To shorten your registration procedure, we advise you '+
                'to use your corporate email.';
            this.$('.check-domain').text(msg).removeClass('hidden');
        }
        else
            this.$('.check-domain').addClass('hidden');
    },
    validate_password: function(){
        var password = this.$('.signup_password').val();
        if (password==='')
        {
            this.input_err('.password-group', $('<span>')
            .text('Please enter a password.'));
            return;
        }
        return password;
    },
    forgot_password: function(event){
        location.href = '/forgot_password?'+zescape.qs({
	    email: this.$('.signup_username').val(),
            dont_have: +(event.currentTarget.className=='dont_have_password')
        });
        return false;
    }
});

var login_view2 = E.login_view = login_view.extend({
    form_template: view_html2,
    render: function(){
        var _this = this;
        this.$el.html(this.form_template);
        var enc_url = _this.options.enc_url||
            '?'+zescape.qs({next: location.href});
        this.$('form.signup').attr('action', function(idx, act){
            return (act.substr(0, act.indexOf('?'))||act)+enc_url; });
        this.$('a.auth-facebook, a.auth-google').each(function(n, a){
            a.rel = a.rel||a.href;
            a.href = a.rel+enc_url;
        });
        this.$('.forgot_password, .dont_have_password').unbind('click')
            .click(this.forgot_password);
        this.$('.signup_username').unbind('keyup change');
        if (this.options.site_name==='Luminati')
            this.$('.signup_username').on('change', this.prevalidate_email);
        if (this.options.text)
            this.$('.auth-text').html(this.options.text).removeClass('hidden');
        this.footer_el = $('<div></div>');
        var license = this.options.license;
        if (license)
        {
            this.$el.append('<p class="license">'+
                'By signing up, you agree to '+this.options.site_name+'\'s '+
                '<a target="_blank" href="'+(license.url||'/license')+'">'+
                (license.name||'License Agreement')+'</a>.'+'</p>');
        }
        var blocks = this.options.blocks;
        if (blocks)
        {
            var email = blocks.email;
            var $email = this.$el.find('.login-email-block');
            if (email)
            {
                if (email.title)
                    $email.find('.title').html(email.title);
                if (email.login_title)
                {
                    $email.find('.username-group label')
                        .html(email.login_title);
                }
                if (email.password_title)
                {
                    $email.find('.password-group label')
                        .html(email.password_title);
                }
                if (email.button_signup_title)
                {
                    $email.find('button.signup')
                        .html(email.button_signup_title);
                }
                if (email.button_signin_title)
                {
                    $email.find('button.signin')
                        .html(email.button_signin_title);
                }
            }
            var social = blocks.social;
            if (social)
            {
                var $soc = this.$el.find('.login-social-networks-block');
                if (social.hide)
                {
                    $soc.hide();
                    $email.removeClass('col-sm-6').addClass('col-sm-12');
                    this.$el.closest('.modal-dialog').addClass('modal-sm');
                }
                if (social.comment && social.comment.hide)
                    $soc.find('.comment').hide();
                if (social.title)
                    $soc.find('.title').html(social.title);
                var providers = social.providers||{};
                for (var name in providers)
                {
                    var provider = providers[name]||{};
                    if (provider.hide)
                        $soc.find('.auth-'+name).hide();
                    if (provider.title!==undefined)
                        $soc.find('.auth-'+name).html(provider.title);
                }
            }
        }
        if (this.options.email)
            this.$el.find('input[name="username"]').val(this.options.email);
        this.render_mode();
    },
    render_mode: function(){
        var $active_btn, $inactive_btn, submit_func;
        this.clear_errs();
        this.$('.signup_password').val('');
        var email_opt = ((this.options.blocks||{}).email||{});
        if (this.options.signup_mode)
        {
            this.render_footer(true);
            if (this.options.license)
                this.$('.license').show();
            $active_btn = this.$('button.signup');
            $inactive_btn = this.$('button.login');
            submit_func = this.signup;
            this.$('.password-group label').html(email_opt.password_title
                || 'Password');
        }
        else
        {
            this.render_footer(false);
            if (this.options.license)
                this.$('.license').hide();
            $active_btn = this.$('button.login');
            $inactive_btn = this.$('button.signup');
            submit_func = this.login;
            this.$('.password-group label').html(email_opt.password_title
                || 'Password');
        }
        $active_btn.removeClass('hidden').attr('type', 'submit');
        $inactive_btn.addClass('hidden').attr('type', 'button');
        this.$('.signup').unbind('submit').submit(submit_func);
    },
    render_footer: function(signup_mode){
        if (signup_mode)
        {
            this.footer_el.html('Already have an account?').append($('<a>')
                .text('Log in').attr('href', '').click(this.switch_mode));
        }
        else
        {
            this.footer_el.html('You do not have an account?').append($('<a>')
                .text('Sign up').attr('href', '').click(this.switch_mode));
        }
    }
});

var activate_view = login_view2.extend({
    form_template: activate_html,
    render: function(){
        login_view2.prototype.render.call(this);
        this.footer_el.addClass('activate-form-footer');
        this.footer_el.appendTo(this.$el);
    },
    render_mode: function(){
        login_view2.prototype.render_mode.call(this);
        if (this.options.signup_mode)
            this.$('.password-group label').html('Password');
        else
            this.$('.password-group label').html('Enter your password');
    },
    render_footer: function(signup_mode){
        if (signup_mode)
        {
            this.footer_el.empty().append($('<a>').text('Login')
                .attr('href', '').click(this.switch_mode))
            .append(' with existing account');
        }
        else
        {
            this.footer_el.html('Don\'t have a Hola account? ' )
            .append($('<a>').text('Activate').attr('href', '')
                .click(this.switch_mode))
            .append(' Hola');
        }
    }
});

E.Modal = Backbone.View.extend({
    className: 'modal fade',
    id: 'login_modal',
    attributes: {tabindex: -1, role: 'dialog', 'aria-hidden': true},
    events: {'hide.bs.modal': 'on_hide'},
    options: {},
    open: function(){
        this.$el.modal({backdrop: this.options.no_bg_close ? 'static': true});
    },
    close: function(){ this.$el.modal('hide'); },
    /**
     * @param {boolean} [opt.no_bg_close=false] Don't close modal on
     * background click.
     * @param {boolean} [opt.signup_mode=false] Set current view to
     * "Sign Up" view.
     * @param {string} [opt.enc_url] Query part of form 'action' url.
     * Example: "?next=http%3A%2F%2Fhola.org%2Fdone&random=1".
     * @param {string} [opt.theme] One of new_login|old_login. Default value
     * depends on current host.
     * @param {string} [opt.site_name] Site name. Shown in Sign Up view and
     * license. Default value varies between places.
     * @param {string} [opt.license=false] Whether we should show a license.
     * @param {string} [opt.title] Modal title. Default value depends on
     * current view.
     * @param {boolean} [opt.no_switch=false] Disables ability to switch from
     * Sign Up view to Log In view.
     * @param {string} [opt.text=''] Additional text on a view.
     * @param {object} [opt.blocks] Updates different blocks in modal box. Read
     * the source.
     */
    initialize: function(opt){
        this.options = opt||{};
        this.$el.html(modal_html).appendTo('body');
        var view = null;
        var theme = this.options.theme ||
            location.hostname=='hola.org' ? 'new_login' : 'old_login';
        if (theme=='new_login')
        {
            view = login_view2;
            this.$el.addClass('new_login');
        }
        else
            view = login_view;
        this.view = new view(_.extend({el: this.$('.modal-body'),
            parent: this}, opt));
        this.on('mode_change', this.on_mode_change);
        this.on_mode_change();
        if (theme=='new_login')
        {
            setTimeout(function(){
                $('.modal-backdrop').addClass('new_login'); });
            this.$('.modal-footer').html('').append(this.view.footer_el);
        }
    },
    on_mode_change: function(){
        this.$('.modal-title').html(this.options.title ? this.options.title :
            this.view.options.signup_mode ?
            'Sign up to '+(this.options.site_name||'Hola') : 'Log in');
    },
    on_hide: function(){
        var _that = this;
        if (this.options.on_cancel)
            this.options.on_cancel();
        setTimeout(function(){
            _that.remove();
        }, 500);
    }
});

E.Page = Backbone.View.extend({
    initialize: function(options){
        this.$el.html(page_html);
        this.view = new login_view(_.extend(options,
            {el: this.$('.modal-body'), parent: this}));
        this.on('mode_change', this.on_mode_change);
        this.on_mode_change();
    },
    on_mode_change: function(){
        this.$('h2').text(this.view.options.signup_mode ? 'Create account' :
            'Log in');
    }
});

E.activate_page = Backbone.View.extend({
    initialize: function(options){
        this.$el.html(page_html);
        this.view = new activate_view(_.extend(options,
            {el: this.$('.modal-body'), parent: this}));
        var signup = this.$('form.signup');
        this.$('.email-activation').on('click', '.show-email', function(){
            signup.toggle();
            return false;
        });
        this.on('mode_change', this.on_mode_change);
        this.on_mode_change();
    },
    on_mode_change: function(){
        this.$('h2').addClass('activate-form-title')
        .text(this.view.options.signup_mode ? 'Activate Hola' :
            'Login to Hola');
        this.$('h3')
        .text(this.view.options.signup_mode ?
            'Access any website' :
            'Access any website');
        this.$('.auth-facebook')
        .text(this.view.options.signup_mode ? 'Activate with Facebook' :
            'Login with Facebook');
        this.$('.auth-google')
        .text(this.view.options.signup_mode ? 'Activate with Google+' :
            'Login with Google+');
        this.$('.email-activation')
        .html((this.view.options.signup_mode ? 'Activate' : 'Login')+
            ' with <a href="" class="show-email">email</a>');
        this.$('.forgot_password').toggle(!this.view.options.signup_mode);
    }
});

/* XXX arik/amir/marat: wrap all async non-etask calls with etask
 * (eg. $.get('/users/get_user'), passing of a cb,...) */
/* XXX arik/marat: reuse be.ajax api (mv be.ajax to util) */
E.get_user = function(){
    return etask([function(){
	var _this = this;
	this.alarm(20000, {ethrow: 'timeout'});
	return $.get(up+'/get_user?source=login');
    }, function(res){
	return res.user||null;
    }]);
};

E.VerifyEmailModal = Backbone.View.extend({
    events: {'hide.bs.modal': 'on_hide'},
    open: function(){
        var _this = this;
        this.$('.modal').modal();
	var wait = etask.wait();
        this.interval = setInterval(function(){
	    etask([function(){
		return $.get(up+'/get_user?source=login_verify');
	    }, function(res){
		if (!res.user.verified)
		    return;
                _this.$('.modal').modal('hide');
		wait.ereturn(true);
	    }]);
        }, 4000);
	return wait;
    },
    initialize: function(options){
        var _this = this;
        this.options = options||{};
        this.$el.html(verify_email_html);
        $('<p>').html('We need to verify your email address <strong>'
            +options.email+'</strong> to '+options.action+'.<br>'
            +'<br>'
            +'We sent you a verification email. Check your inbox '
            +'and click on the link in the email to verify your address. If '
            +'you can\'t find it, check your spam folder or click the button '
            +'to resend the email.').appendTo(this.$('.modal-body'));
        this.$('.resend_email').click(function(){
            $.post(up+'/send_email_verification').done(function(){
                _this.$('.alert').text('Verification email sent to '
                    +options.email).removeClass('hidden');
            });
        });
        this.$el.appendTo('body');
    },
    on_hide: function(){
	this.closed = true;
	clearInterval(this.interval);
    }
});

var verify_modal;

E.ensure_email_verified = function(user, opt){
    return etask('ensure_email_verified', [function(){
	if (user.provider!=='basic' || user.verified)
	    return this.ereturn(user);
	if (!verify_modal || verify_modal.closed)
	{
	    verify_modal = new E.VerifyEmailModal(_.extend(opt,
		{email: user.emails[0].value}));
	    return verify_modal.open();
	}
    }]);
};

// Returns user object if login is ensured, or null otherwise, which is the
// case if the user canceled the modal or was redirected to Google or Facebook
// to complete the login, in which case the caller will be informed using the
// provided URL hash
E.ensure_login = function(options){
    return etask('ensure_login', [function(){
        return $.get(up+'/get_user?source=login_ensure');
    }, function(res){
        if (!res.user)
        {
            var next = options.next || (options.hash
                ? location.href.replace(/#.*$/, '')+options.hash
                : location.href);
            if (options.simple)
            {
                location.href = 'https://hola.org/signin?'
                    +zescape.qs({next: next});
            }
            else
            {
                new E.Modal({
                    enc_url: '?'+zescape.qs({next: next}),
                    signup_mode: options.signup_mode,
                    on_submit: options.on_submit,
                    on_cancel: options.on_cancel
                }).open();
            }
            return this.ereturn(null);
        }
        if (!options.email_verified)
            return this.ereturn(res.user);
        return E.ensure_email_verified(res.user, options);
    }]);
};

// XXX amir: find a way to merge this with the stuff in
// pkg/svc/pub/account/membership.js
E.membership = Backbone.Model.extend({
    /* XXX amir: use backbone sync */
    update: function(){
        var _this = this;
	return etask([function(){
	    return $.get(up+'/payment/get_membership');
	}, function(data){
	    _this.set('data', data);
	    return data;
	}]);
    },
    // XXX amir: deprecate it, use is_active() instead
    is_valid: function(){
        var data = this.get('data');
        return data && ((data.start && !data.end) ||
            (data.end && Date.now()<new Date(data.end)));
    },
    is_active: function(){ return membership.is_active(this.get('data')); },
    is_expired: function(){ return membership.is_expired(this.get('data')); },
    is_trial_started: function(){
        var data = this.get('data');
        return data && data.trial_end;
    },
    is_trial_valid: function(){
        return membership.is_in_trial(this.get('data'));
    },
    is_trial_expired: function(){
        return membership.is_trial(this.get('data')) &&
            membership.is_expired(this.get('data'));
    },
    is_paid: function(){ return membership.is_paid(this.get('data')); },
    is_trial: function(){ return membership.is_trial(this.get('data')); }
});

var affiliate_saved;
E.save_affiliate = function(new_events){
    var events = storage.get_json('affiliate_events')||[];
    if (!new_events)
    {
        if (affiliate_saved==window.location.href)
            return;
        affiliate_saved = window.location.href;
        var qs = zurl.parse(window.location.href.replace('@', '%40')).query;
        if (!qs)
            return;
        qs = zurl.qs_parse(qs);
        if (qs.login)
        {
            if (window.user && window.user.provider!='basic' && events.length)
                $.post(up+'/save_affiliate', {affiliate: events});
            storage.set_json('affiliate_events', []);
            if (window.user)
                window.user.affiliate = events;
            return;
        }
        new_events = [];
        var now = Date.now();
        var affiliate = qs.affiliate||qs.aff;
        if (affiliate)
            new_events.push({event: 'affiliate '+affiliate, last: now});
        var campaign = qs.campaign||qs.cam;
        if (campaign)
            new_events.push({event: 'campaign '+campaign, last: now});
    }
    if (new_events.length>0)
    {
        events = ccounter_client.update_affiliate(events, new_events);
        storage.set_json('affiliate_events', events);
    }
};

return E; });

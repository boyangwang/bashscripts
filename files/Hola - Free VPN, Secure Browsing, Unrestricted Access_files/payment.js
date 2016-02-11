// LICENSE_CODE ZON
'use strict'; /*jslint browser:true*/
define(['/www/hola/pub/site.js', '/www/login/pub/login.js',
    'virt_jquery_all', '/util/escape.js', '/util/etask.js',
    '/www/login/pub/verify_email.js', 'angular_1_3_17',
    '/svc/pub/account/membership.js', '/util/csrf.js', '/util/user_agent.js',
    '/www/hola/pub/ensure_login.js', '/www/util/pub/alert.js',
    '/www/login/pub/user_security_ui.js', '/www/util/pub/ui_angular.js'],
    function(site, login, $, zescape, etask, verify_email, angular,
        zmembership, csrf, user_agent){
var url = $.url();
var bootbox = window.bootbox;
var E = {}, membership;
E.paymill_errs = {
    40000: 'General problem with data.',
    40001: 'There is a general problem with the payment data.',
    40100: 'There are problems with the credit card. Further details can not '
        +'be passed.',
    40101: 'The CVV is incorrect.',
    40102: 'The credit card expired or is not yet valid.',
    40103: 'The credit card limit was exceeded with this transaction, or has '
        +'already exceeded.',
    40104: 'The credit card is invalid',
    40105: 'The credit card expiration date is incorrect.',
    40106: 'Credit card brand is required.',
    40200: 'Problem with bank account data.',
    40201: 'Mismatch with the bank account data combination.',
    40202: 'User authentication failed.',
    40300: 'Problem with 3d secure data.',
    40301: 'Currency or amount mismatch.',
    40400: 'Problem with input data.',
    40401: 'The amount is too low or zero.',
    40402: 'The usage field is too long.',
    40403: 'The currency is not configured for the customer.',
    50000: 'General problem with backend.',
    50001: 'The credit card is on a blacklist.',
    50100: 'Technical error with credit card.',
    50101: 'Error limit exceeded.',
    50102: 'This card was rejected without reasons.',
    50103: 'The credit card might be manipulated or stolen.',
    50104: 'The transaction is declined by the authorization system (card '
        +'restricted by bank).',
    50105: 'The configuration data is invalid.',
    50201: 'This customer account is on a black list.',
    50300: 'There is a technical error with 3-D Secure.',
    50400: 'Decline because of risk issues.',
    50501: 'The interface to the acquirer does not respond, so we get no '
        +'response if the transaction was completed successfully.',
    50500: 'General timeout.',
    50502: 'There is a risk management transaction timeout.',
    50600: 'Duplicate transaction.'
};

var already_premium_html = '\
<br>\
<a data-toggle="collapse" data-parent="#accordion"\
  href="#collapseOne">Already a Premium member?</a>\
<div id="collapseOne" class="alert alert-info collapse">\
  You may have signed up to Premium using a different email, Google \
  account, or Facebook account. Click \
  <a class="alert-link" id="logout_link" href="#">logout</a> and then login \
  with the same account you signed up to Premium.<br>\
  If you don\'t remember that account, look in your email for the Premium \
  signup email from hola.org.<br>\
  If you still have a problem, follow this \
  <a class="alert-link" href="/faq#in_premium_getting_ads">FAQ</a> \
  or email us at \
  <a class="alert-link" href="mailto:billing@hola.org">billing@hola.org</a>\
</div>';

E.paypal_btn = function(opt){
    opt = opt||{};
    var $form = opt.form||$(document);
    var period = $form.find('input:radio[name=period]:checked').val();
    var user = opt.user||site.get_user();
    $form.find('#paypal_form')
    .append($('<input>').attr({type: 'hidden', name: 'return',
        value: opt.next || url.param('next') ||
            zescape.uri('https://hola.org/thank_you', {
                utm_nooverride: 1, ref: url.param('ref'),
                test: url.param('test')||undefined})}))
    .append($('<input>').attr({type: 'hidden', name: 'cancel_return',
        value: zescape.uri(location.href, 'paypal_cancel=1')}))
    .append($('<input>').attr({type: 'hidden', name: 'a3',
        value: period==='1 M' ? 5 : 45}))
    .append($('<input>').attr({type: 'hidden', name: 't3',
        value: period==='1 M' ? 'M' : 'Y'}))
    .append($('<input>').attr({type: 'hidden', name: 'custom',
        value: JSON.stringify({hola_uid: user.hola_uid,
        ref: url.param('ref')})}));
    if (url.param('test'))
    {
        $form.find('#paypal_form').attr('action',
            'https://sandbox.paypal.com/cgi-bin/webscr')
        .find('input[name=business]').val('amir-facilitator@hola.org');
    }
    $.removeCookie('user');
    $form.find('#paypal_form').submit();
};

E.cc_btn = function(opt){
    opt = opt||{};
    var $form = opt.form||$(document);
    var user = opt.user||site.get_user();
    var period = $form.find('input:radio[name=period]:checked').val();
    var checkout_url = 'https://billing.hola.org/order/checkout.php?'
        +zescape.qs({
            QTY: 1,
            CART: 1,
            CARD: 2,
            CLEAN_CART: 1,
            PRODS: period==='1 M' ? '4615369' : '4621810',
            DOTEST: url.param('test'),
            AUTO_PREFILL: 1,
            BACK_REF: opt.next||'https://hola.org/thank_you',
            CUSTOMERID: user.hola_uid,
            SRC: url.param('ref'),
            SHORT_FORM: 1
        });
    window.location.href = 'https://billing.hola.org/order/pf.php?'
        +zescape.qs({
            MERCHANT: 'HOLANETW',
            URL: checkout_url,
            BILL_FNAME: user.name&&user.name.givenName || '',
            BILL_LNAME: user.name&&user.name.familyName || '',
            BILL_EMAIL: user.emails&&user.emails[0]&&user.emails[0].value || ''
        });
};

E.premium_page = function(country_code){
    angular.module('premium_page', ['ensure_login'])
    .config(['ensure_loginProvider', function(ensure_login_provider){
        ensure_login_provider.configure({
            user: '/users/payment/get_membership',
            redirect: '/my_account',
            condition: function(data){
                return zmembership.is_active(data) &&
                    !zmembership.is_in_trial(data);
            }
       });
    }]);
    angular.element(document).ready(function(){
        angular.bootstrap(document.body, ['premium_page']);
    });
    add_err('payment');
    site.generic_page({country_code: country_code});
    etask([function(){
	return site.init_user_account();
    }, function(){
        if (location.search.match(/[?&]payment/))
            $('.go_premium').click();
    }]);
    $('.go_premium').click(function(){
	etask([function(){
	    return login.ensure_login({hash: '?payment', email_verified: true,
		action: 'start your Premium membership'});
	}, function(ret){
            if (!ret)
                return this.ereturn();
            $('.payment_modal').modal();
        }]);
    });
    $('.checkout').click(function(){
        if ($('input:radio[name=method]:checked').val()==='cc')
            E.cc_btn();
        else
            E.paypal_btn();
    });
};

function append_payment_type(data){
    var val;
    if (data.paymill)
    {
        val = 'Credit card';
        if (data.paymill.payment.last4)
            val += ', ************'+data.paymill.payment.last4;
    }
    else if (data.paypal)
        val = 'PayPal';
    else
        return;
    add_row('#membership', 'Payment Method', $('<p>').text(val)
    .addClass('form-control-static'));
}

function paymill_init(btn_text, period, action, next){
    var script = document.createElement('script');
    var price = period==='1 M' ? 5 : 45;
    /* Workaround: this script is supposed to be added automatically by the
     * other script, but it's not, maybe because we add it dynamically */
    script.src = 'https://bridge.paymill.de/';
    $('#paymill_form').remove();
    $('body').append('<form id="paymill_form" '
        +'action="users/payment/'+action+'_subscription?next='+
	encodeURIComponent(next || 'thank_you')+'" method="post" '
        +'style="display:none"></form>');
    $('#paymill_form').append(script);
    csrf.add('#paymill_form');
    script = document.createElement('script');
    script.setAttribute('data-title', 'Hola Premium Monthly Subscription');
    script.setAttribute('data-description', '$'+price+' per '
        +(period==='1 M' ? 'month' : 'year'));
    script.setAttribute('data-submit-button', btn_text);
    script.setAttribute('data-amount', price*100);
    script.setAttribute('data-currency', 'USD');
    script.setAttribute('data-public-key', url.param('test') ?
        '3954442398766de4369bcdef661c654b':
        '8a8394c541ea2b050141fc14148315b7');
    script.setAttribute('data-logo', 'https://hola.org/img/logo.png');
    script.setAttribute('data-lang', 'en-GB');
    script.src = 'https://button.paymill.com/v1/';
    $('#paymill_form').append(script)
    .append($('<input>').attr({type: 'hidden', name: 'amount',
        value: price*100}))
    .append($('<input>').attr({type: 'hidden', name: 'ref',
        value: url.param('ref')}))
    .append($('<input>').attr({type: 'hidden', name: 'period',
        value: period}));
}

function cancel_membership(){
    $('#complete_cancellation').click(function(){});
    $('#cancel_membership_modal').modal();
}

function add_row(section, label, val, opt){
    opt = opt||{};
    var $val = $('<div>').addClass(opt.val_class||'col-sm-10').append(val);
    $(section+' form').append($('<div>').addClass('form-group')
    .append($('<label>').addClass('col-sm-2 control-label').text(label))
    .append($val));
    return $val;
}

function render_account_details(){
    if (window.user.provider!=='basic'||window.user.verified)
        return;
    var $btn = $('<a href="#">')
    .text('Resend verification email').click(function(){
        $.post('/users/send_email_verification').done(function(){
            $('.alert-success').text('We\'ve sent an email with '
            +'verification instructions to '
            +window.user.emails[0].value+'.').removeClass('hidden');
        });
    });
    add_row('#details .outer', '', $('<div class="alert alert-danger">')
        .append($('<p>Email not verified. </p>').append($btn)),
        {val_class: 'col-sm-4'});
}

function get_plan_description(data){
    var amount;
    if (membership.is_paid())
    {
        // XXX amir: getNextRenewalPrice() for avangate
        amount = (''+data.amount)
        .replace(/(\.[0-9]*?)0+$/, "$1")
        .replace(/\.$/, "");
        return data.currency+' '+amount+' per '
            +(data.period==='1 M' ? 'month' : 'year');
    }
    if (data.trial_end)
        return 'Free trial';
    return 'Bonus';
}

function avangate_update_cc(){
    etask([function(){
        return $.get('https://hola.org/users/payment/single_sign_on');
    }, function(url){
        location.href = url.replace('?', 'payment_methods/?'); }]);
}

function add_extras(){
    add_row('#extras', 'Full VPN', $('<p>Have an iPhone or iPad? Our Full VPN '
        +'feature allows you to route all your Internet traffic through a '
        +'chosen country.</p>'));
    var guess = user_agent.guess();
    if (guess.os=='ios' && +guess.version>=9)
    {
        add_row('#extras', '', $('<button type="button" class="btn">Install'
            +' VPN Profile</button>').appendTo('#extras').click(function(){
                window.location = '/users/install_ios_profile'; }));
    }
}

E.my_account_page = function(country_code){
    /* XXX vitaly: is better to place all angular code specific for hola.org
     * inside one module, but different controllers; instead of 'ensure_login'
     * implement service named 'user'; put redirect in the controller section
     * instead of config */
    angular.module('account_page', ['ensure_login', 'alert',
        'ui_angular', 'user_security_ui'])
    .constant('product_name', 'hola')
    .config(['ensure_loginProvider', function(ensure_login_provider){
        ensure_login_provider.configure({
            user: '/users/get_user?source=my_account',
            condition: function(res){
                if (!res.user)
                {
                    return '/?need_login=1&next='
                        +encodeURIComponent(location.pathname);
                }
                if (res.user.provider=='basic' && !res.user.verified)
                    return '/unverified_email';
                return false;
            }
       });
    }]).run(['$rootScope', '$compile', 'ensure_login', 'link_focus_fix',
        function($scope, $compile, ensure_login)
    {
        etask([function(){
            return ensure_login.get_user();
        }, function(response){
            $scope.ready = true;
            $scope.user = window.user = response.user;
            $scope.hola_uid = site.hola_uid_display(window.user.hola_uid);
            $scope.can_change_password = window.user.provider==='basic';
            E.render_account_page(country_code, $scope, $compile);
        }]);
    }]).directive('alreadyPremium', ['alert', function($alert){
        return {
            scope: {},
            templateUrl: '/www/hola/views/angular/already_premium.html',
            link: function(scope, elm){
                var ls = localStorage;
                scope.click_logout = site.user_links.logout;
                scope.show_already_premium_send_request = !ls.getItem(
                    'already_premium_request_sended');
                scope.check_user_premium = function(provided_account){
                    if (scope.loading_check_user_premium
                        || provided_account===null)
                    {
                        return;
                    }
                    scope.loading_check_user_premium = true;
                    etask([function try_catch$(){
                        var params = {};
                        if (provided_account)
                            params.provided_account = provided_account;
                        return $.post('/users/check_user_premium', params);
                    }, function(res){
                        scope.loading_check_user_premium = false;
                        $alert({id: 'check_user_premium',
                            type: this.error ? 'error' : 'success',
                            text: this.error ?
                            'Request can not be sent now, try again later' :
                            'Request successfully sent. '+
                            'Please note that processing may take '+
                            'up to 48 hours. We will follow up via '+
                            'help-premium@hola.org.'});
                        if (!this.error)
                        {
                            scope.show_did_reg_premium = false;
                            scope.show_provide_premium_account = false;
                            scope.show_already_premium_send_request = false;
                            ls.setItem('already_premium_request_sended', true);
                        }
                        scope.$apply();
                    }]);
                };
            }
        };
    }]);
    angular.element(document).ready(function(){
        angular.bootstrap(document.body, ['account_page']);
    });
};

E.render_account_page = function(country_code, $scope, $compile){
    site.generic_page({country_code: country_code});
    site.bext_refresh_membership({exp_synced: true});
    membership = new login.membership();
    etask([function(){
	return membership.update();
    }, function(){
        var $btn;
        var data = membership.get('data');
        if (!membership.is_active())
	{
	    var state = 'You don\'t have a Premium membership.';
	    var get_btn = 'Upgrade now';
	    if (membership.is_expired())
	    {
		state = 'Your '+(membership.is_trial() ? 'trial' : '')+
                    ' membership ended on '
                    +new Date(data.end||data.trial_end).toLocaleDateString()
                    +'.';
		if (membership.is_paid())
                    get_btn = 'Renew it now';
	    }
            var $state = add_row('#membership', '', state+' ');
            if (!membership.is_expired() && !window.user.check_premium)
            {
                $state.append(
                    $compile('<span data-already-premium></span>')($scope));
            }
            add_row('#membership', '', '<a class="btn btn-primary" href="'+
                'https://hola.org/premium?ref=my_account">'+get_btn+'</a>');
        }
        if (!(membership.is_paid() && membership.is_active()))
        {
            add_row('#free_premium', '', 'You can get free months of Premium '
                +'subscription by referring your friends to Hola! For every '
                +'friend who signs up, we\'ll give you and your friend a free '
                +'1-month subscription to Hola Premium.');
            add_row('#free_premium', '', '<a href="/referral?'
                +'ref=my_account" class="btn btn-primary">'
                +'Invite a Friend</a>');
            $('#free_premium').removeClass('hidden');
        }
        if (membership.is_active())
        {
            add_row('#membership', 'Subscription', $('<p>')
                .text(get_plan_description(data))
                .addClass('form-control-static'));
            if (data.start)
            {
                add_row('#membership', 'Started On',
                    '<p class="form-control-static">'
                    +new Date(data.start).toLocaleDateString()+'</p>');
            }
            if (data.end||data.trial_end)
            {
                add_row('#membership', 'Active Until',
                    $('<p class="form-control-static">'
                    +new Date(data.end||data.trial_end).toLocaleDateString()
                    +'</p>'));
            }
        }
        if (membership.is_paid() && membership.is_active() && data.period)
        {
            append_payment_type(data);
            if (data.cancelled)
            {
                /* The initial cancellation implementation of PayPal
                 * subscriptions didn't add end date, rather relied on PayPal
                 * eot IPN */
                var end_date = data.end ?
                    new Date(data.end).toLocaleDateString() :
                    'the end of the current payment period';
                add_row('#membership', '', $('<div class="alert alert-info">')
                    .text((data.gateway=='apple' ? '' : 'You have turned off '
                    +'auto-renewal of your membership. ')+'Your membership is '
                    +'valid until '+end_date).appendTo('#membership'));
            }
            else if (data.gateway!=='apple')
            {
                add_row('#membership', '',
                    $('<button type="button" class="btn">Turn off auto-renewal'
                    +'</button>').appendTo('#membership')
                    .click(cancel_membership));
                if ({'paymill': 1, 'avangate': 1}[data.gateway])
                {
                    $btn = $('<button type="button" class="btn">'
                        +'Update Credit Card Information</button>');
                    add_row('#membership', '', $btn.appendTo('#membership'));
                    if (data.gateway==='paymill')
                    {
                        $btn.click(function(){
                            $('.pay-button', frames[1].document).click(); });
                        paymill_init('Update Credit Card', data.period,
                            'update');
                        return void add_extras();
                    }
                    $btn.click(avangate_update_cc);
                }
            }
        }
        if (membership.is_active())
        {
            var subject = 'Premium support '
                +zescape.uri_comp(site.hola_uid_display(window.user.hola_uid));
            add_row('#membership', '', $('<p>For any issues with your Premium '
                +'membership, contact us at '
                +'<a href="mailto:help-premium@hola.org?subject='+subject
                +'">help-premium@hola.org</a>.</p>'));
	}
        add_extras();
    }]);
    render_account_details();
    add_err(url.param('update') ? 'update' : 'cancellation');
    if (url.param('password_reset'))
    {
        $('.alert-success').text('Your password has been successfully reset.')
        .removeClass('hidden');
    }
    if (url.param('coupon'))
    {
        var errors = {bad_coupon: 'bad', used_coupon: 'used', done: 'done'};
        $('#promo_code').removeClass('hide').find('form')
        .submit(function(event){
            event.preventDefault();
            $('#promo_code .alert').addClass('hide');
            etask('enter_coupon', [function(){
                return $.get('/users/coupon/'
                    +zescape.uri_comp($('#coupon').val()));
            }, function(res){
                var cls = errors[res]||'err';
                $('#promo_code .msg-coupon-'+cls).removeClass('hide');
            }, function catch$(){
                $('#promo_code .msg-coupon-err').removeClass('hide');
            }]);
        });
    }
};

function add_err(op){
    var err = url.param('err'), paymill_err = url.param('paymill_err');
    if (!paymill_err && !err)
        return;
    $('#error').css('display', 'block')
    .html('We failed to process your '+op
        +(paymill_err ? '. '+E.paymill_errs[paymill_err]
        +' (error code: '+paymill_err+').' : '. Please try again in a few '
        +'minutes.'));
}

return E; });

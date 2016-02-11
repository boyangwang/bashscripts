// LICENSE CODE ZON
'use strict'; /*jslint browser:true*/
define(['/util/etask.js', 'underscore', 'virt_jquery_all'],
    function(etask, _, $){
var url = $.url();
var E = {};
var bad_link_text = 'We couldn\'t verify that this user requested a password '
+'reset. Please try resetting again.';

function get_opt(){
    return {up: '', dont_have: +url.param('dont_have'),
	bad_link: +url.param('bad_link'), email: url.param('email'),
	username: url.param('username'), token: url.param('token')};
}

function email_alert(s){ $('#email_alert').text(s).removeClass('hidden'); }

E.forgot_password = function(opt){
    opt = _.defaults(opt||{}, get_opt());
    var $email = $('input[name=email]');
    if (opt.bad_link)
	$('#top_alert').text(bad_link_text).removeClass('hidden');
    $('#page_header').text(opt.dont_have ? 'Don\'t have a password?' :
	'Forgot your password?');
    $email.val(opt.email);
    $('form').submit(function(event){
	event.preventDefault();
	var email = $.trim($email.val()).toLowerCase();
	$email.val(email);
	if (!/.@.*\../.test(email))
	{
	    email_alert('Please enter a valid email address.');
	    return;
	}
	etask('forgot_password', [function(){
	    return $.get(opt.up+'/users/check_email', {email: email});
	}, function(res){
	    if (!res.used)
	    {
		email_alert('This email address is not registered.');
		return;
	    }
	    $('form').unbind('submit').submit();
	}]);
    });
};

E.forgot_password_success = function(opt){
    opt = _.defaults(opt||{}, get_opt());
    $('#user_email').text((opt.email ? ' to '+opt.email : '')+'.');
};

E.reset_password = function(opt){
    opt = _.defaults(opt||{}, get_opt());
    etask('reset_password', [function(){
	return $.get(opt.up+'/users/verify_reset_password_link',
	    {username: opt.username, token: opt.token});
    }, function(){
	var $username = $('<input>', {type: 'hidden', name: 'username',
	    value: opt.username});
	var $token = $('<input>', {type: 'hidden', name: 'token',
	    value: opt.token});
	$('form').append($username).append($token).end()
	.submit(function(event){
	    if ($('input[name=password]').val()!=='')
		return;
	    $('.alert').text('Please choose a password.')
	    .removeClass('hidden');
	    event.preventDefault();
	});
    }, function catch$(){ location.href = '/forgot_password?bad_link=1';
    }]);
};

return E; });

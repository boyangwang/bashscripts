// LICENSE CODE ZON
'use strict'; /*jslint browser:true*/
define(['jquery', '/util/etask.js'], function($, etask){
var E = {};

E.redir_unverified_email = function(force_login){
    etask('redir_unverified_email', [function(){ return force_login();
    }, function(user){
	if (user.provider=='basic' && !user.verified)
	    window.location = '/unverified_email';
    }]);
};

E.redir_verified_email = function(force_login, url){
    return etask('redir_verified_email', [function(){ return force_login();
    }, function(user){
	if (user.provider=='basic' && !user.verified)
	    return;
	window.location = url;
    }]);
};

E.resend_verification_email = function(url_prefix){
    url_prefix = url_prefix||'';
    return etask('resend_verification_email', [function(){
	return $.post(url_prefix+'/users/send_email_verification'); }]);
};

return E; });

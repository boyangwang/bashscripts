// LICENSE_CODE ZON
'use strict'; /*jslint browser:true*/
define(['/svc/versions.js', '/util/etask.js',
    'underscore', 'virt_jquery_all', '/util/escape.js', '/util/user_agent.js',
    '/util/version_util.js', '/util/date.js', 'hola_opt', '/util/ajax.js',
    '/svc/svc_ipc.js', '/svc/pub/app_checker.js'],
    function(versions, etask, _, $, zescape, user_agent, version_util,
    date, hopt, ajax, svc_ipc, app_checker){
var b = user_agent.guess_browser();
var sys = user_agent.guess(), os = sys.os;
var cdn4 = 'cdn4.hola.org';
var E = {
    download_url: {
        firefox: '//'+cdn4+'/static/hola_firefox_ext_'
            +versions.firefox+'_www.xpi',
        firefox_signed: '//'+cdn4+'/static/hola_firefox_ext_signed_'
            +versions.firefox_signed+'_www.xpi',
        chrome_manual: '//'+cdn4+'/static/hola_chrome_ext_'
            +'1.8.327'+'.crx',
        chrome_zip_static: '//'+cdn4+'/static/hola_chrome_ext_'
            +'1.8.327'+'.zip',
        android_tutorial: '//hola.org/installation_tutorials#android-app',
        chrome_tutorial: '//hola.org/installation_tutorials#chrome-ext-win',
        chrome_tutorial_mac: '//hola.org/installation_tutorials'
            +'#chrome-ext-mac',
        opera_manual: '//'+cdn4+'/static/hola_opera_ext_'
            +versions.opera+'.crx'
    },
    cdn4: cdn4
};

E.init = function(){
    E._is_installed = {};
    return etask([function(){
        return etask.all({ext: app_checker.is_ext(),
            svc: app_checker.is_svc()});
    }, function(_is_installed){
        E._is_installed = _is_installed;
    }]);
};

E.post_msg = function(msg){ top.postMessage(msg, '*'); };

E.msg_post_recv = function(opt){
    var msg = opt.msg, on_msg;
    return etask([function(){
	on_msg = function(e){
	    if (e.source!=top || e.data.src==msg.src || e.data.id!=msg.id)
		return;
            this.econtinue(e.data);
	}.bind(this);
        top.addEventListener('message', on_msg);
        top.postMessage(msg, '*');
	return this.wait(opt.timeout||5000);
    }, function ensure$(){ top.removeEventListener('message', on_msg); }]);
};

E.ajax = function(opt){
    return etask([function(){
	opt = opt||{};
	this.alarm(opt.timeout||20000, {ethrow: 'timeout'});
	return $.ajax(opt);
    }]);
};

/**
 * @deprecated Use svc/pub/app_checker.js methods instead.
 */
E.check_ext = function(opt){
    opt = opt||{};
    return E.msg_post_recv({timeout: opt.timeout||2000,
	msg: {src: 'hola_ccgi', id: 'callback'}});
};

/**
 * @deprecated Use svc/pub/app_checker.js methods instead.
 */
E.check_svc = function(){
    return etask([function(){
        return svc_ipc.ajax('callback.json');
    }, function catch$(ret){
	throw {status: ret};
    }, function(ret){
        var data = ret.ret;
        var xhr = ret.xhr;
	return {data: data, status: xhr.statusText};
    }]);
};

E.is_plugin = function(exe){ return /\bhola_plugin/.test(exe); };

E.has_player = function(svc_ver){
    return version_util.version_valid(svc_ver) &&
        version_util.version_cmp(svc_ver, '1.5.487')>0;
};

E.check_svc_player = function(){
    return etask([function try_catch$(){
        return E.check_svc();
    }, function(e){
        if (!e || !e.data || this.error)
            return;
        var svc = e.data;
        var is_ff = b.browser=='firefox';
        if (!is_ff && E.is_plugin(svc.exe))
            return;
        return {has_player: E.has_player(svc.ver), ver: svc.ver, ssl: svc.ssl};
    }]);
};

E.call_on_ext = function(cb){
    return etask.efor(null, function(){ return etask.sleep(1000); },
    [function try_catch$loop(){
        return E.check_ext();
    }, function(e){
        if (this.error || !e || !e.data || !e.data.mode)
            return;
        cb();
        return this.ebreak();
    }]);
};

/**
 * @deprecated Use svc/pub/app_checker.js methods instead.
 */
E.lean_check_ext = function(){ return svc_ipc.ext.lean_ping(); };

E.alert = function(text){
    $('.alert').text(text).addClass('in');
    setTimeout(function(){ $('.alert').removeClass('in'); }, 10000);
};

E.set_cookie = function(name, val){
    $.cookie(name, val, {domain: '.hola.org', path: '/',
        expires: date.add(date(), {hour: 1}), secure: false});
};

E.remove_cookie = function(name){
    $.removeCookie(name, {domain: '.hola.org', path: '/'}); };

E.set_exe_redirect = function(url){ E.set_cookie('exe_redirect', url); };

E.set_exe_redirect_play = function(v){
    E.set_exe_redirect('http://hola.org/play#v='+encodeURIComponent(v)); };
var perr_url = '1'==='1' && 'perr.hola.org' || 'perr.hola.org';
// XXX arik: need to use zerr.install_perr? reuse be.perr?
/**
 * @param {(object|string)} [opt.info] Optional info about event. 'ext' and
 * 'svc' will be added to this object to show whether product is installed.
 */
E.perr = function(opt){
    var ext = window.hola_extension_info||{}, data = {}, qs = {};
    qs.cid = opt.cid||ext.cid;
    qs.uuid = opt.uuid||ext.uuid;
    qs.browser = b.browser;
    qs.id = opt.id;
    qs.ver = hopt.ver;
    data.build = JSON.stringify({os: os, platform: navigator.platform,
        zua: navigator.userAgent});
    if (!opt.info || typeof opt.info!=='string')
        opt.info = $.extend(opt.info||{}, E._is_installed);
    data.info = opt.info && typeof opt.info!='string' ?
        JSON.stringify(opt.info) : opt.info;
    data.bt = opt.bt;
    data.filehead = opt.filehead;
    data.is_json = 1;
    return etask([function(){
	this.alarm(20000, {ethrow: 'timeout'});
	return $.ajax({type: 'POST', data: data, dataType: 'json',
            url: '//'+perr_url+'/be_client_cgi/perr?'+zescape.qs(qs)});
    }]);
};

function use_new_setup(hopt, sys){
    return hopt.enable_new_installer &&
        ['7', '8', '8.1', '10.0'].includes(sys.version);
}

E.get_exe_link = function(hopt, sys, versions){
    var static_path = use_new_setup(hopt, sys) ?
        '/setup/'+versions.web_installer : '';
    return '//'+E.cdn4+'/static'+static_path+'/'+
        E.get_exe_filename(hopt, sys, versions);
};

E.get_exe_filename = function(hopt, sys, versions){
    var prefix = 'Hola-Setup';
    if (use_new_setup(hopt, sys))
        return prefix+'.exe';
    var suffix = '-'+versions.windows+'.exe';
    if (sys.arch=='64')
        return prefix+'-x64'+suffix;
    return prefix+suffix;
};

return E; });

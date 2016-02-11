// LICENSE_CODE ZON
'use strict'; /*jslint browser:true*/
define(['virt_jquery_all', 'backbone', '/util/escape.js',
    '/www/hola/pub/util.js', '/util/etask.js', 'underscore',
    '/www/hola/pub/unblock_util.js', '/util/user_agent.js',
    '/www/util/pub/config.js', '/svc/pub/util.js', '/util/version_util.js',
    '/util/date.js', 'hola_opt', '/util/events.js', '/util/storage.js',
    '/www/util/pub/localize.js', '/util/ajax.js', '/svc/svc_ipc.js',
    '/util/zerr.js', '/util/url.js'],
    function($, Backbone, zescape, www_util, etask, _, uutil, user_agent,
    config, svc_util, version_util, date, hopt, EventEmitter, storage, T,
    ajax, svc_ipc, zerr, zurl){
var $url = $.url();
var E = new Backbone.Model();
var perr_url = '1'==='1' && 'perr.hola.org' || 'perr.hola.org';

E.ext = function(){ return E.get('ext.info'); };
E.can_use_ext = function(){
    return E.ext() || window.hola_extension_info;
};

// XXX alexeym: sync be_util.js <-> be.js
E.check_activation = function(){
    // XXX alexeym: disable 'activation' at all for now.
    return false;
    var zopts = storage.get_json('hola_opts')||{};
    var switched_on = hopt.www_config.vpn_signup_require;
    return etask([function try_catch$(){
        // silent mode here to prevent circular on('change:ext.info') elsewhere
        return E.ext_callback(true);
    }, function(ext){
        ext = ext||E.get('ext.info');
        if (ext)
            return switched_on;
        var ext_mode = ext && ext.mode=='ext';
        // XXX alexeym: hack, on server side we don't have a method to check
        // if user has svc or not
        var ext_mode_cookie = $.cookie('is_ext_mode');
        if (ext_mode!=ext_mode_cookie)
        {
            if (ext_mode)
                $.cookie('is_ext_mode', 1, {path: '/'});
            else
                $.removeCookie('is_ext_mode', {path: '/'});
        }
        if (ext && ext.check_activation && ext.install_ts)
            $.cookie('install_ts', ext.install_ts, {path: '/'});
        return window.chrome && ext && ext_mode &&
            ext.check_activation && switched_on;
    }]);
};

E.svc = function(){
    var v;
    return E.get('svc.info') || ((v=E.ext()) && v.svc_info);
};
E.is_svc = function(){
    // hola firefox plugin is filtered
    return E.svc()&&!/\bhola_plugin/.test(E.svc().exe);
};
E.has_hola = function(){ return E.ext()||E.svc(); };
E.is_plugin = function(){ return E.ext()&&E.ext().plugin; };
E.build_info = function(){
    var build_info = _.clone(E.ext() && E.ext().build_info)||
	{platform: navigator.platform, user_agent: navigator.userAgent};
    build_info.www_version = hopt.version;
    return build_info;
};
E.ios_email_cancel = function(){
    storage.set('ios_email_collect_cancelled', true); };
E.ios_email_submit = function(){
    storage.set('ios_email_collect_submitted', true); };
E.ios_email_check = function(test_group){
    // XXX alexeym: naor asked to turn it off
    return;
    var uuid = E.get('uuid');
    if (!uuid)
    {
        var ext = E.get('ext.info');
        uuid = ext && ext.uuid;
    }
    var submitted = storage.get('ios_email_collect_submitted');
    if (submitted || !E.is_firefox() || !uuid || !test_group)
        return;
    // XXX alexeym: test_group options
    // 1: popular page form
    // 2: sitepic unblock form
    // 3: popup inside Ext popup
    // 4: form in Ext popup footer
    var groups = [/[0-3]$/, /[4-7]$/, /[89ab]$/, /[c-f]$/];
    if (groups[test_group-1].test(uuid) ||
        storage.get('email_test_group')==test_group)
    {
        var new_user = !!$url.param('first_run');
        var attempt = +storage.get('ios_email_collect');
        if (!new_user)
        {
            if (isNaN(attempt))
                return;
            if (attempt < 3)
                return void storage.set('ios_email_collect', attempt+1);
            storage.clr('ios_email_collect_cancelled');
        }
        var cancelled = storage.get('ios_email_collect_cancelled');
        if (cancelled)
            return;
        storage.set('ios_email_collect', 0);
        storage.set('ios_email_popup_impressions',
            storage.get_int('ios_email_popup_impressions')+1);
        return true;
    }
};

E.build = function(){
    var info = E.build_info(), s = '';
    for (var f in info)
	s += (s&&'\n')+f+': '+info[f];
    return s;
};

/* XXX arik: add rmt_ver, browser,... (copy from extension ajax requests ) */
E.auth = function(_o){
    var o = _.clone(_o||{}), uid;
    o.session_key = E.get('session_key');
    if ((uid=E.get('cid')))
	o.cid = uid;
    else if ((uid=E.get('uuid')))
	o.uuid = uid;
    return o;
};

E.updater_callback = function(){
    // XXX alexeym: HACK for mixed content warning
    if (location.protocol=='https:')
        return;
    return etask([function try_catch$(){
        return svc_ipc.ajax({cmd: 'callback.json', up: true});
    }, function(ret){
        var e, xhr;
        if (ret)
        {
            e = ret.ret;
            xhr = ret.xhr;
        }
        if (this.error)
        {
            if (this.error.message=='timeout')
                return this.ethrow('timeout');
            return this.ethrow('updater error '+this.error);
        }
        if (!e || !e.exe || e.exe!='hola_updater.exe')
            return this.ethrow('invalid updater response');
        return e;
    }]);
};

E.svc_callback = function(){
    return etask([function try_catch$(){
        if (E.svc_callback.use_ext || location.protocol=='https:')
            return this.egoto('ext');
        return svc_ipc.ajax('callback.json');
    }, function(ret){
        var e, xhr;
        if (ret)
        {
            e = ret.ret;
            xhr = ret.xhr;
        }
        if (!this.error)
	    return this.egoto('res', e);
	if (this.error.message=='timeout')
            return this.ethrow('timeout');
        // xhr.statusText will contain 'nsresult: "0x805e0006 (<unknown>)"'
        // if firefox blocked mixed content, in that case we fallback to use
        // extension, otherwise, we propagate error
	// XXX bahaa: try to use extension anyway on chrome and firefox
        if (location.protocol!='https:' || !E.is_firefox() || !xhr ||
            !xhr.statusText.includes('0x805e0006'))
        {
            throw new Error(xhr ? xhr.statusText : 'no xhr');
        }
        return this.egoto('res');
    }, function catch$(){
    }, function ext(){
        // firefox blocked mixed content, try to get info from ext
	return etask([function(){
            return www_util.msg_post_recv({msg: {src: 'hola_ccgi',
                id: 'svc_callback'}});
        }, function(data){
            if (!data || !data.data || !data.data.from_be)
                throw new Error('svc_callback from be failed');
            E.svc_callback.use_ext = 1;
            return data.data;
        }, function catch$(err){
            http_redir();
            throw err;
        }]);
    }, function res(data){
        if (data && data.exe && data.exe.includes('hola_plugin') &&
            !E.is_plugin())
        {
            // XXX bahaa: remove this once extensions know how to work with a
            // plugin from another browser
	    throw new Error('plugin outside this browser');
        }
	window.hola_svc_info = data;
	E.set('svc.info', window.hola_svc_info);
        // XXX colin/arik: storage_set_json used null, this had caused
        // the string to be set as "null" please check this out and remove
	storage.set_json('unblock.svc.info', E.get('svc.info'));
	return window.hola_svc_info;
    }, function catch$(err){
	delete window.hola_svc_info;
	E.unset('svc.info');
	storage.set_json('unblock.svc.info', E.get('svc.info'));
	throw err;
    }]);
};

E.ext_callback = function(no_trigger){
    no_trigger = no_trigger||false;
    return etask([function(){
        return www_util.check_ext();
    }, function(info){
	window.hola_extension_info = info&&info.data;
	E.set('ext.info', window.hola_extension_info, {silent: no_trigger});
	storage.set('unblock.had_ext', 1);
	storage.set_json('unblock.ext.info', E.get('ext.info'));
	return window.hola_extension_info;
    }, function catch$(err){
	delete window.hola_extension_info;
	E.unset('ext.info');
	storage.set_json('unblock.ext.info', E.get('ext.info')||null);
	throw err;
    }]);
};

E.update_info = function(){
    if (E.get('cid'))
	return E.svc_callback();
    return E.ext_callback();
};

function update_info_init(){
    var ext_info_fail_count = 0, retry_count = 0;
    etask([function(){
        E.update_info_sp = this;
    }, function try_catch$loop(){
        return E.ext_callback();
    }, function try_catch$(){
        return E.svc_callback();
    }, function(){
        var ext = E.get('ext.info');
        var svc = E.get('svc.info');
        if (ext || (svc && ++ext_info_fail_count > 10))
            return this.ereturn();
        retry_count++;
        this.set_state('loop');
        return etask.sleep(retry_count<20 ? 1000 : 5000);
    }, function ensure$(){ E.update_info_sp = null; }]);
}

E._rule_set = function(_opt){
    var opt = _.clone(_opt||{});
    opt.plugin = +!!E.is_plugin();
    return etask([function(){
        if (!E.ext() || !opt.type || !opt.md5)
        {
            return www_util.ajax({dataType: 'text', type: 'POST', data: opt,
                url: E.get('url_ccgi')+'/rule_set.json?'+zescape.qs(E.auth())});
        }
        return etask([function(){
            return www_util.msg_post_recv({msg: {src: 'hola_ccgi',
                id: 'set_rule', opt: opt}, timeout: 20000});
        }, function(e){
            if (!e || !e.data || e.data.err)
                throw new Error(e.data.err||'set_rule failed');
            return e.data;
        }]);
    }, function(){
	www_util.post_msg({src: 'hola_ccgi', id: 'update_rules'});
    }]);
};

E.rule_set = function(rule, on, opt){
    return E._rule_set(_.extend({enabled: +!!on}, _.pick(rule, 'sid', 'name',
	'type', 'md5', 'country'), opt));
};

E.enable_root_url = function(opt){
    zerr.assert(zurl.is_valid_domain(opt.root_url), 'Invalid root url:'
    +opt.root_url);
    // XXX arik: enable for svc
    if (!E.ext())
	throw new Error('enable_root_url not supported for svc');
    return etask([function(){
	return www_util.msg_post_recv({msg: {src: 'hola_ccgi',
	    id: 'enable_root_url', opt: opt}, timeout: 20000});
    }, function(e){
	if (!e || !e.data || e.data.err)
	    throw new Error(e.data.err||'enable_root_url failed');
	return e.data;
    }]);
};

E.enable_ext = function(){
    www_util.post_msg({src: 'hola_ccgi', id: 'enable', data: true}); };

E.enable_unblocker = function(reload){
    if (!E.get('cid')||E.get('svc.unblocker.enabled'))
	return;
    var ext = E.ext(), rmt_ver = ext&&ext.rmt_ver;
    if (rmt_ver && version_util.version_cmp(rmt_ver, '1.2.816')>=0)
    {
        return etask([function(){
            return www_util.msg_post_recv({msg: {src: 'hola_ccgi',
                id: 'vpn_enable'}});
        }, function(e){
            if (e.data.err)
                throw new Error(e);
            return E.update_info();
        }]);
    }
    return etask([function(){
	return www_util.ajax({dataType: 'text', type: 'POST', data: {on: 1},
	    url: E.get('url_ccgi')+'/rules_enable?'+zescape.qs(E.auth())});
    }, function(){
	if (!reload)
	    return;
	return www_util.ajax({dataType: 'text', type: 'POST', data: {},
	    url: E.get('url_ccgi')+'/rules_reload?'+zescape.qs(E.auth())});
    }, function(){ return E.update_info(); }]);
};

E.get_unblocking_rates = function(limit){
    return etask([function(){
        return www_util.ajax({dataType: 'json', type: 'GET', data: {limit:
            limit, src_country: (E.get('src_country')||'').toLowerCase()},
            url: E.get('url_ccgi')+'/unblocking_rate?'+zescape.qs(E.auth())});
    }]);
};

E.is_android = function(){
    return user_agent.guess(navigator.userAgent).os=='android'; };
E.is_firefox = function(){
    return user_agent.guess_browser(navigator.userAgent).browser=='firefox'; };
E.is_ie = function(){
    return user_agent.guess_browser(navigator.userAgent).browser=='ie'; };
E.is_chrome = function(){ return (window.chrome && !window.chrome.torch); };
E.is_torch = function(){ return (window.chrome && window.chrome.torch); };

E.product_info = function(){
    var info = {};
    var ext = E.ext(), svc = E.svc();
    info.server_version = config.ver;
    info.ext_version = ext&&ext.ver;
    info.rmt_version = ext&&ext.rmt_ver;
    info.svc_mode = ext&&ext.svc_mode;
    info.svc_mode_pending = ext&&ext.svc_mode_pending;
    info.svc_version = svc&&svc.ver;
    info.product_type = ext ? ext.type : svc ? 'svc' : '';
    info.browser = E.get('browser');
    var browser = user_agent.guess_browser();
    var browser_name = browser.opera ? 'opera' : browser.browser;
    info.browser2 = browser_name+' '+(browser_name=='opera' ?
        browser.opera_version : browser.version);
    info.os = E.os_guess.os;
    info.platform = navigator && navigator.platform;
    info.cid = svc&&svc.cid;
    info.uuid = ext&&ext.uuid;
    return info;
};

// XXX alexeym: unify with svc/pub/be_about_main.js
E.print_product_info = function($info, build, dev){
    function add_line(s, val, classname){
        var $div = $('<div>').append($('<span>')
            .text(s), $('<span>').text(val));
        if (classname)
            $div.addClass(classname);
        $div.appendTo($info);
        return s+val+'\n';
    }
    var s = '';
    if (build.ext_version)
        s += add_line(T('Ext version')+': ', build.ext_version);
    else
    {
        var ext_version = window.zon_config && window.zon_config.ZON_VERSION;
        if (ext_version)
            s += add_line(T('Ext version')+': ', ext_version);
    }
    if (build.rmt_version)
    {
        s += add_line('RMT version: ', build.rmt_version);
        if (build.server_version)
            s += add_line('WWW version: ', build.server_version);
    }
    else if (build.server_version)
        s += add_line(T('RMT version')+': ', build.server_version);
    if (build.svc_version)
    {
        s += add_line(T('Service')+': ', build.svc_version,
            'product-service-version');
    }
    if (build.svc_mode)
    {
        var mode = build.svc_mode+' active';
        if (build.svc_mode_pending)
            mode += ', '+build.svc_mode_pending+' pending';
        s += add_line(T('Mode')+': ', mode);
    }
    if (build.product_type)
        s += add_line(T('Product')+': ', build.product_type);
    if (build.browser2)
        s += add_line(T('Browser')+': ', build.browser2);
    else if (build.browser)
        s += add_line(T('Browser')+': ', build.browser);
    if (build.platform)
        s += add_line(T('Platform')+': ', build.platform);
    var cid, uuid;
    if (E.be_bg_main)
    {
        if (E.be_bg_main.get('svc.cid'))
            cid = E.be_bg_main.get('svc.cid');
        uuid = E.be_bg_main.get('uuid');
    }
    else
    {
        cid = build.cid;
        uuid = build.uuid;
    }
    if (cid)
        s += add_line(T('CID')+': ', cid);
    if (uuid)
        s += add_line('UUID: ', uuid);
    if (dev)
        s += add_line('Dev info: ', dev);
    return s;
};

E.rule_get = function(opt){
    var rules = E.get('rules'), r;
    if (rules)
	r = svc_util.find_rule(rules, opt);
    if (!r)
    {
	r = _.extend({}, opt);
	if (opt.type)
	    r.supported = opt.type==(E.is_android() ? 'apk' : 'url');
	else
	    r.supported = E.is_android() ? !!r.root_apk : !!r.root_url;
    }
    return r;
};

E.fetch_rules = function(){
    /* XXX arik: cancel previous running etask */
    var auth = E.auth();
    if (!auth.session_key || (!auth.cid && !auth.uuid))
	return E.unset('rules');
    return etask([function(){
        if (E.ext())
        {
            return etask([function(){
                return www_util.msg_post_recv({msg: {src: 'hola_ccgi',
                    id: 'fetch_rules'}, timeout: 20000});
            }, function(e){
                if (!e || !e.data || e.data.err)
                    throw new Error(e.data.err||'fetch_rule failed');
                return e.data.rules;
            }]);
        }
	return www_util.ajax({dataType: 'json', type: 'POST',
            data: {plugin: +!!E.is_plugin()},
            url: E.get('url_ccgi')+'/rules_get_settings.json?'+
                zescape.qs(E.auth())});
    }, function(e){
	E.set('rules', e&&e.unblocker_rules);
	storage.set_json('unblock.rules', E.get('rules'));
    }, function catch$(err){ E.perr({id: 'www_fetch_rules_err',
	bt: err.stack, info: ''+err}); }]);
};

E.fetch_all = function(){ return etask.all({rules: E.fetch_rules()}); };

function get_ratings_array(rules){
    var n, r, a = [];
    var src_country = (E.get('src_country')||'').toLowerCase();
    for (n in rules)
    {
	r = rules[n];
	if (!r.root_url)
	    continue;
	for (var i=0; i<r.root_url.length; i++)
	{
	    a.push(_.extend({src_country: src_country,
		root_url: uutil.get_root_url(r)},
		_.pick(r, 'sid', 'name', 'type', 'md5')));
	}
    }
    return a;
}

E.fetch_ratings = function(){
    var rules = E.get('rules');
    if (!rules)
	return;
    var a = get_ratings_array(rules);
    if (!a.length)
	return;
    /* XXX arik: don't call it if E.get('ratings') matches list of rules */
    return etask([function(){
	return www_util.ajax({dataType: 'json', type: 'POST', data: {a: a},
	    url: '/access/ratings?'+zescape.qs(E.auth())});
    }, function(e){
	E.set('ratings', e.ratings);
	storage.set_json('unblock.ratings', E.get('ratings'));
    }, function catch$(err){ E.perr({id: 'www_fetch_ratings_err',
	bt: err.stack, info: ''+err}); }]);
};

E.fetch_rate = function(r, domain){
    if (!r)
	return;
    var src = (E.get('src_country')||'').toLowerCase();
    var a = [_.extend({src_country: src, root_url: domain}, _.pick(r, 'name',
	'sid', 'type', 'md5', 'country'))];
    return etask([function(){
	return www_util.ajax({dataType: 'json', type: 'POST', data: {a: a},
	    url: '/access/ratings?'+zescape.qs(E.auth())});
    }, function(e){ return e ? e.ratings[0] : null;
    }, function catch$(err){
	E.perr({id: 'www_fetch_rating_err', bt: err.stack, info: ''+err});
    }]);
};

E.get_rate = function(ratings, rule){
    for (var i=0; i<ratings.length; i++)
    {
	var rate = ratings[i];
	if (!rate)
	    continue;
	var r = svc_util.find_rule({a: rate}, rule);
	if (r)
	    return rate;
    }
};

/* XXX arik/mark: mv to generic place */
function stringify(o){
    try { return JSON.stringify(o)||''; }
    catch(err){ return '[circular]'; }
}

function log_to_body(){
    var body = $('body'), $msg = $('<div>').appendTo(body);
    $msg.text(arguments[0]+' '+stringify(_.toArray(arguments)));
}

function http_redir(force){
    /* XXX bahaa/arik HACK: fix ajax to http://127.0.0.1 from https page */
    if (force || (location.protocol=='https:' && E.br_guess.browser=='ie'))
        location.replace(location.href.replace(/^https:/, 'http:'));
}

E.init_fetch_rules = function(){
    E.on('change:cid change:uuid change:session_key', _.debounce(E.fetch_all));
};

/* XXX arik/mark: 1) use Backbone.localStorage?
 * 2) unite code with be_util.js */
function storage_err(api, key, err){
    console.error('%s failed %s %s %s',api, key, ''+err, err.stack);
    E.set('storage.err', (E.get('storage.err')||0)+1);
}

E.init = function(opt){
    opt = opt||{};
    if (E.inited)
	return;
    storage.on_err = storage_err;
    E.inited = true;
    E.br_guess = user_agent.guess_browser(navigator.userAgent);
    E.os_guess = user_agent.guess(navigator.userAgent);
    http_redir();
    E.set('src_country',
	opt.src_country || (hopt.user_country||'').toLowerCase());
    if ($url.param('debug')=='y')
    {
	var orig_log = console.log;
	var orig_error= console.error;
	console.log = function(){ log_to_body.apply(null, arguments); };
	console.error = function(){ log_to_body.apply(null, arguments); };
	console.debug = function(){ log_to_body.apply(null, arguments); };
	console.info = function(){ log_to_body.apply(null, arguments); };
	console.log('be.init userAgent '+navigator.userAgent);
    }
    /* XXX arik/marat: mv this part to www/pub/util.js browser_init() */
    if (E.os_guess.os=='android')
	$('html').addClass('android');
    if (E.br_guess.browser)
	$('html').addClass(E.br_guess.browser);
    E.on('change:developer', _.debounce(function(){
	if (E.get('developer'))
	    $('html').addClass('developer');
	else
	    $('html').removeClass('developer');
    }));
    E.on('change:ext.info change:svc.info', _.debounce(function(){
        var ext = E.ext(), svc = E.svc(), cid, uuid, session_key;
	var enabled;
	if (ext)
	{
	    uuid = ext.uuid;
	    session_key = ext.session_key;
	    enabled = !ext.disable;
	    E.set('ext.enabled', enabled);
	    E.set('browser', ext.browser);
	    E.unset('svc.unblocker.enabled');
	}
	else if (svc)
	{
	    session_key = svc.session_key;
	    cid = svc.cid;
	    enabled = svc.unblocker ? !svc.unblocker.disable : false;
	    E.set('svc.unblocker.enabled', enabled);
	    E.unset('ext.enabled');
	    E.unset('browser');
	}
	E.set('cid', cid);
	E.set('uuid', uuid);
	E.set('enabled', enabled);
	E.set('session_key', session_key);
    }));
    E.on('change:url_ccgi', _.debounce(function(){
        etask([function(){ return E.get_unblocking_rates(5); },
        function(unblocking_rate){
            E.set('unblocking_rate', unblocking_rate); }]);
    }));
    E.set('url_ccgi', '//client.hola.org/be_client_cgi');
    E.set('url_perr', '//'+perr_url+'/be_client_cgi');
    E.set('ext.info', storage.get_json('unblock.ext.info'));
    E.set('svc.info', storage.get_json('unblock.svc.info'));
    E.set('rules', storage.get_json('unblock.rules'));
    /* XXX shachar: remove unused key from storage */
    storage.clr('unblock.groups');
    storage.clr('unblock.auto_rules');
    update_info_init();
    E.check_activation();
};

/* XXX arik hack: rm once moving perr out */
E.init_perr = function(opt){
    E.set('url_ccgi', '//client.hola.org/be_client_cgi');
    E.set('url_perr', '//'+perr_url+'/be_client_cgi');
};

E.uninit = function(){
    if (!E.inited)
	return;
    E.off();
    if (E.update_info_sp)
        E.update_info_sp.ereturn();
    E.inited = false;
};

/* XXX arik: based on pkg/svc/pub/be_vpn_util.js:get_rules */
E.get_rules_for_root_url = function(rules, url){
    url = url||'';
    var _r, ret = [], r_enabled = null;
    if (!rules)
	return [];
    for (_r in rules)
    {
	var r = rules[_r];
	if (r.sid=='2' || !r.supported || (r.popup!==undefined && !r.popup))
	    continue;
	var urls = r.root_url;
	if (urls && urls.some(function(rurl){ return url.match(rurl); }))
	{
	    if (r.enabled)
		r_enabled = r;
	    else
		ret.push(r);
	}
    }
    if (r_enabled)
	ret.unshift(r_enabled);
    return ret;
};

E.get_rules_for_apk = function(rules, pkg){
    var _r, ret = [];
    if (!rules)
	return [];
    for (_r in rules)
    {
	var r = rules[_r];
	if (!r.root_apk || !r.root_apk.includes(pkg))
	    continue;
	if (!r.supported || (r.popup!==undefined && !r.popup))
	    continue;
	ret.push(r);
    }
    return ret;
};

/* XXX arik: mv to util.js */
E.perr = function(opt){
    var data = {}, qs = {};
    qs.cid = opt.cid||E.get('cid');
    qs.uuid = opt.uuid||E.get('uuid');
    qs.browser = opt.browser;
    qs.id = opt.id;
    qs.ver = opt.ver;
    data.build = E.build();
    data.is_json = 1;
    data.info = opt.info && typeof opt.info!='string' ?
	JSON.stringify(opt.info) : opt.info;
    data.bt = opt.bt;
    data.filehead = opt.filehead;
    console.log('perr '+qs.id+' '+data.info);
    return www_util.ajax({dataType: 'json', type: 'POST',
	data: data, url: E.get('url_perr')+'/perr?'+zescape.qs(qs)});
};

E.set_post_install = function(rule){
    $.cookie('post_install', JSON.stringify({rule: rule,
	ts: date.to_sql(date()), cmd: 'enable_site'}),
	{expires: date(Date.now()+30*date.ms.MIN), path: '/'});
};

E.emitter = new EventEmitter();
return E; });

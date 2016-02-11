// LICENSE_CODE ZON
'use strict'; /*jslint browser:true, es5:true*/
define(['virt_jquery_all', '/www/hola/pub/util.js', '/svc/versions.js',
    '/util/escape.js', '/www/util/pub/localize.js',
    '/www/login/pub/login.js', '/svc/search.js', '/www/util/pub/config.js',
    '/svc/be_user_nav.js', '/util/etask.js', 'underscore', 'backbone',
    'fastclick', '/www/hola/pub/ui.js', '/util/user_agent.js',
    '/www/hola/pub/be.js', '/util/version_util.js',
    '/www/hola/pub/site_load.js', '/protocol/pub/countries.js',
    '/util/country.js', '/www/hola/pub/unblock_util.js', 'hola_opt',
    '/util/url.js', '/www/hola/pub/page_search.js', '/util/date.js',
    '/www/login/pub/verify_email.js', '/www/login/pub/password.js',
    '/www/hola/pub/social.js', '/util/storage.js', 'bootstrap',
    '/www/hola/pub/download.js', '/svc/mp/pub/www_storage.js',
    '/svc/mp/pub/msg.js', '/svc/svc_ipc.js', '/util/csrf.js'],
    function($, www_util, hola_versions, zescape, T, login, zsearch, config,
    be_user_nav, etask, _, Backbone, FastClick, ui, user_agent, be,
    version_util, site_load, pcountries, zcountry, uutil, hopt, zurl,
    page_search, date, verify_email, password, social,
    storage, bootstrap, download, www_storage, mp_msg, svc_ipc, csrf){
be.init();
be.init_perr({dev: false});

function compact_object(a){
    var b = _.clone(a);
    _.each(b, function(value, key){
        if (!value)
            delete b[key];
    });
    return b;
}
_.mixin({compactObject: compact_object});

var browser = user_agent.guess_browser();

var $html = $('html');
function is_hola_ext_present(){
    // Synchronously set by cs_hola.js at document_start time
    return !!$html.attr('hola_ext_present');
}
window.ga('set', 'dimension1', is_hola_ext_present() ? 'ext_installed' :
    'ext_not_installed');

var E = {user: user, init_sharing: social.init_sharing};
var url = $.url();
var cdn4 = 'cdn4.hola.org';
var user = null;
var opt = {};
var console = window.console||{log: function(){}, error: function(){}};

function delay(fn, t){ setTimeout(fn, t||50); }

function old_redir(){
    if (url.param('old_ff_market')===undefined &&
        url.param('old_chrome')===undefined)
    {
        return;
    }
    location.replace('/old_ff_chrome'+location.search);
}

function init_chat(){
    if (!hopt.www_config.purechat_active)
        return;
    if (hopt.www_config.chat_countries)
    {
        var enable_chat = false;
	hopt.www_config.chat_countries.split(',').forEach(function(c){
	    enable_chat = enable_chat||(c==hopt.user_country); });
	if (!enable_chat)
	    return;
    }
    var done = false;
    var s = load_script('https://widget.purechat.com/VisitorWidget'
	+'/WidgetScript');
    s.onreadystatechange = s.onload = function(){
	if (!done && (!this.readyState || this.readyState=='loaded' ||
	    this.readyState=='complete'))
	{
	    $('body').addClass('livechat');
	    new window.PCWidget({c: 'abb1d9b0-cd4d-4c1f-b79b-c2c9ee50d4ef',
		f: true});
	    done = true;
	}
    };
}

function init_backward(){
    var ext_info, svc_info, min_ver;
    if (!(min_ver = hopt.notify_upgrade_min_version))
	return void console.error('notify_upgrade_min_version undefined');
    if (/android/i.test(navigator.userAgent))
	return;
    // don't show backward on download page
    var path = $.url(true).attr('path');
    if (path=='/download' || path=='/download_rmt_upgrade')
	return;
    return etask([function(){ return www_util.check_ext();
    }, function(_ext_info){ ext_info = _ext_info&&_ext_info.data;
    }, function catch$(err){
    }, function(){
	if (ext_info)
	    return this.egoto('done');
	return www_util.check_svc();
    }, function(_svc_info){
	svc_info = _svc_info&&_svc_info.data;
	if (svc_info && svc_info.exe.search('plugin')!=-1)
	    svc_info = undefined;
    }, function catch$(err){
    }, function done(){
        if (ext_info && ext_info.browser=='torch')
            return;
        var need_ext_upgrade = ext_info && ext_info.ver &&
	    version_util.version_cmp(ext_info.ver, min_ver)<0;
        var need_svc_upgrade = svc_info && svc_info.ver &&
	    version_util.version_cmp(svc_info.ver, min_ver)<0;
        if (!need_ext_upgrade && !need_svc_upgrade)
	    return this.ereturn();
        $('.unblock-settings .container.rules').hide();
        $('.unblock-settings .container.heading').hide();
        $('.unblock_domain_using .container.rule').hide();
        $('.unblock_domain_using .container.heading').hide();
        $('.unblock_domain_using .container.comments').hide();
	var upgrade_link = '//hola.org/download?upgrade=1';
	var $msg = $('<div>',
	    {class: 'container upgrade-alert alert alert-warning'});
	var $h4 = $('<h4>').appendTo($msg)
        .text('Your version of Hola is not supported anymore. ');
	var $btn = $('<a>', {href: upgrade_link,
	    class: 'btn btn-success btn-lg download-button'})
	.text('Upgrade now');
	$h4.append($btn);
	var info, perr_opt;
        if (need_ext_upgrade)
        {
            download.set_download_vpn($btn);
	    info = {url: window.location.href, ext_info: ext_info};
	    perr_opt = {uuid: ext_info.uuid, cid: ext_info.cid,
		browser: ext_info.browser, info: info, ver: ext_info.ver};
	    be.perr(_.extend(perr_opt, {id: 'www_need_upgrade'}));
	    // XXX arik TODO: upgrade for torch
	}
        $msg.insertAfter($('.navbar-default'));
    }]);
}

function load_script(url){
    var script = document.createElement('script');
    script.async = true;
    script.src = url;
    var other = document.getElementsByTagName('script')[0];
    other.parentNode.insertBefore(script, other);
    return script;
}

function install_cws_plugin(user_ip){
    if (browser.browser!='chrome' || user_agent.guess().os=='macos')
	return false;
    if (url.param('v')==2)
	return true;
    return false; /* XXX arik EXP: disable exp for now */
    var ip = user_ip||'', a;
    if ((a = ip.match(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.([0-9]{1,3})$/)))
	return +a[1] < 6; /* XXX arik EXP: ~2% of new installs: cws plugin */
    return false;
}

E.init = function(){ www_util.init(); };

E.init_download = function(options){ download.init_links(options); };

E.bext_refresh_membership = function(opt){
    if (!window.postMessage)
        return;
    window.postMessage({src: 'hola_ccgi', id: 'refresh_membership', data: opt},
        '*');
};

E.init_user_account = function(){
    return etask('init_user_account', [function(){
	return $.get('/users/get_user?source=site');
    }, function(res){
	if ((user = res.user||null))
	    E.bext_refresh_membership();
        window.ga('set', 'dimension2', user ? 'Yes' : 'No');
    }]);
};

function init_user_links(){
    E.user_status = new be_user_nav.user_status();
    E.user_links = new be_user_nav.www_user_links({
        model: E.user_status,
        upgrade: true,
        login: true
    });
    $('.user_nav_container').empty().append(E.user_links.$el);
}
function init_footer_links(){
    $('a[href="mailto:abuse@hola.org"]').attr('href', zescape.mailto_url({
        to: 'abuse@hola.org',
        subject: 'Hola abuse report',
        body: 'You are reporting a suspected abuse of the Hola service. '
        +'Please provide us with the below information and the Hola team '
        +'will get back to you.\n\n'
        +'Contact information\n'
        +'===================\n'
        +'First name:\n'
        +'Last name:\n'
        +'Email address:\n'
        +'Phone number:\n\n'
        +'Abuse time information\n'
        +'======================\n'
        +'Time zone:\n'
        +'Abuse date (yyyy-mm-dd):\n'
        +'Abuse time (hh:mm):\n\n'
        +'Abuse description:\n'
        +'==================\n'
    }));
}

function init_hiring_banner(){
    setTimeout(function(){
        console.log('Do you speak JavaScript? We are hiring!\n'
            +'http://hola.org/jobs');
    }, 1000);
}

E.init_social_login = function(){
    $('body').on('click', '#sign_up', {signup_mode: true}, E.open_login_modal)
    .on('click', '#sign_in', E.open_login_modal)
    .on('click', '#sign_in_for_trial', E.open_login_modal);
    if (url.param('login')||url.param('logout'))
        E.bext_refresh_membership();
};

var promo_search;
// opt:
//   string type: type of promo_search, available: index, new, player
//   object typeahead: if undefined then we do not bind leave/enter events
//     string hover: placeholder for editbox when it's hovered
//     string unhover: placeholder for editbox when mouse left
function init_promo_search(opt){
    var promo_opts = {};
    Object.keys(opt).forEach(function(key){
        if (key !== 'type' && key !== 'typeahead')
            promo_opts[key] = opt[key];
    });
    var promo_search_class;
    switch (opt.type)
    {
    case 'index': promo_search_class = E.promo_search_index; break;
    case 'player': promo_search_class = E.promo_search_player; break;
    default: promo_search_class = E.promo_search;
    }
    promo_search = new promo_search_class(promo_opts);
    promo_search.append_to('.js-promo-search');
    if (opt.typeahead!==undefined)
    {
        $('.search-container').mouseenter(function(){
            if ($('.tt-input').is(':focus') || $('.tt-input').val())
                return;
                if ($('.search-container').is(':hover')
                    && !$('.tt-input').is(':focus') && !$('.tt-input').val())
                {
                    $('.tt-input').attr('placeholder', opt.typeahead.hover);
                }
        });
        $('.search-container').mouseleave(function(){
            if ($('.tt-input').is(':focus') || $('.tt-input').val())
                return;
            $('.tt-input').attr('placeholder', opt.typeahead.unhover);
        });
    }
}

E.unsubscribe = function(){
    var err = $('.container h4.err');
    switch (true)
    {
    case /done/.test(location.search):
	err.text('You have been successfully unsubscribed');
	$('.container form').hide();
	/* falls through */
    case /err/.test(location.search):
	err.show();
    }
};

E.init_disqus = function(str){
    if (!$('#disqus_thread').length)
	return;
    str = str||'holaorg';
    delay(function(){ load_script('//'+str+'.disqus.com/embed.js'); }, 500);
};

var guess_os = user_agent.guess().os;
$html.addClass(guess_os+' '+browser.browser+' '
    +browser.browser+browser.version);
if (guess_os=='android')
{
    $('.change-android.device').text('device');
    $('.change-android.open-app').text('Open application ►');
}
if (browser.hola_android)
    $html.addClass('android-webview');

E.open_login_modal = function(event, next_args){
    var next = location.href.replace(/#.*$/, '')+(next_args||'');
    var login_modal = new login.Modal({
        enc_url: '?'+zescape.qs({next: next}),
        signup_mode: event&&event.data ? event.data.signup_mode : false,
        theme: 'new_login',
        site_name: 'Hola'
    });
    login_modal.open();
    if (event)
        event.preventDefault();
};

// XXX bahaa: use backbone models from be.js to get extension info
function ext_is_installed(opt){
    opt = _.extend({timeout: 1000, tries: 1}, opt);
    var l, tries = 0;
    function cleanup(){
        if (l)
            window.removeEventListener('message', l);
        l = null;
    }
    return etask([function check(){
        var _this = this;
        if (!opt.msg_only && window.hola_extension_info &&
            (!opt.ver || opt.ver==window.hola_extension_info.ver))
        {
            return E.ga_track_installed();
        }
        if (tries++>=opt.tries)
            return this.ereturn(false);
        window.addEventListener('message', l = function(e){
            if (!mp_msg.is_hola_origin(e.origin))
                return;
            var d = e.data;
            if (d && d.data && d.id==='ping' &&
                (!opt.ver || opt.ver==d.data.ver) &&
                /^hola_(chrome|firefox)$/.test(d.src))
            {
                return _this.ereturn(E.ga_track_installed());
            }
        }, '*');
        window.postMessage({src: 'hola_ccgi', id: 'ping', data: {}}, '*');
        return this.wait(opt.timeout);
    }, function catch$(err){
        cleanup();
        if (err==='timeout')
            return this.egoto('check');
        throw err;
    }, function ensure$(){ cleanup(); }]);
}

function ensure_bootstrap_css(){
    var t = $('<div class=col-xs-1>').appendTo('body');
    if (t.css('position')!='relative')
	$('<link rel=stylesheet href=/bootstrap.min.css>').prependTo('head');
    t.remove();
}

E.ga_track_installed = function(){
    return etask([function(){
        if (E.ga_virtual_pageview.triggered &&
            E.ga_virtual_pageview.triggered.ext_is_installed)
        {
            return this.egoto('end');
        }
    }, function(){ E.ga_virtual_pageview('ext_is_installed');
    }, function end(){ return this.ereturn(true);
    }]);
};

// XXX arik: this function takes time (ext_is_installed may take 1sec).
// we might never send track download at the end
E.ga_track_download_send = function(name, origin_name, url, next, page_url){
    name = name||'unknown';
    origin_name = origin_name||'unknown';
    url = url||origin_name;
    page_url = page_url||location.href;
    E.ga_virtual_pageview('track_download?b='+name);
    etask([function(){
        if (origin_name=='inline_err')
            return this.econtinue();
    }, function(){ return ext_is_installed();
    }, function(is_installed){
        var info = be.product_info();
        return be.perr({id: 'www_track_download', info: {name: name, url: url,
            page_url: page_url, ext_installed: !!is_installed,
            ext_cid: info.cid||0, browser: browser,
            origin_name: origin_name,
            hola_ff: zopts.get('vlc_hola_ff')||zopts.get('ie_hola_ff')}});
    }, function ensure$(){
        if (next)
            next();
    }]);
};

E.ga_track_download = function(elem, name, origin_name){
    var cb = function(){
        var $this = $(this);
        var url = $this.attr('href');
        origin_name = $this.data('origin-name')||origin_name;
        E.ga_track_download_send(name, origin_name, url,
            function(){ location.href = url; });
        return false;
    };
    if (typeof elem=='string')
        $('body').on('click', elem, cb);
    else
        elem.click(cb);
};

E.ga_virtual_pageview = function(page_name){
    var ga_url = '_virt_'+page_name;
    E.ga_virtual_pageview.triggered = E.ga_virtual_pageview.triggered||{};
    if (E.ga_virtual_pageview.triggered[page_name])
	return;
    window.ga('send', 'pageview', ga_url);
    E.ga_virtual_pageview.triggered[page_name] = true;
};

function init_country_message(){
    var msg;
    if (!hopt.www_config.country_message_active ||
        !hopt.www_config.country_messages ||
        !(msg = hopt.www_config.country_messages[hopt.user_country]))
    {
        return;
    }
    $('#country_message').show().find('.panel-body').html(msg);
}

E.check_browser_support = function(opt){
    if (browser.browser!='ie')
        return;
    opt = opt||{};
    return etask([function try_catch$(){ return www_util.check_svc();
    }, function(_svc_info){
        if (!_svc_info || this.error)
        {
            // XXX alexeym: don't redirect to not_supported page,
            // Avi & Michal Z. request
            return;
            // XXX shachar: add redir to upgrade page if older version
            window.location = '/browser_not_supported';
            return;
        }
        // in IE open hola_ff with user's site
        return svc_ipc.hola_br_start({url: opt && opt.hola_ff_url});
    }]);
};

E.player_page = function(options){
    E.generic_page(options);
    init_promo_search({
        torrents: options.torrents,
        country: options.country_code.toLowerCase(),
        type: 'player',
        placeholder: T('Stream any torrent'),
        typeahead: {
            hover: T('Torrent URL or magnet link'),
            unhover: T('Stream any torrent')
        }
    });
};

E.start_page = function(options){
    options = options||{};
    var email;
    E.init();
    login.save_affiliate();
    ensure_bootstrap_css();
    old_redir();
    init_country_message();
    init_chat();
    init_backward();
    FastClick.attach(document.body);
    init_user_links();
    init_footer_links();
    init_hiring_banner();
    E.init_download();
    social.init_sharing();
    E.init_social_login();
    country_over_display();
    template_info_display(options.template);
    init_promo_search({
        country: options.country_code.toLowerCase(),
        type: 'index',
        placeholder: T('Access any website'),
        typeahead: {
            hover: T('blocked-site.com'),
            unhover: T('Access any website')
        }
    });
    if (url.param('email_verify_fail'))
    {
        $('#msg').html('We could not verify your email address. For more '
            +'information <a href="/faq#ts_email_verification">'
            +'click here</a>.').addClass('msg_error msg_not_float')
        .removeClass('hidden');
    }
    else if ((email = url.param('email_verify_success')))
    {
        $('#msg').html('Your email <strong>'+zescape.html(email)+'</strong> '+
            'has been verified.').addClass('msg_success msg_not_float')
        .removeClass('hidden');
    }
    else if (url.param('referrer_uid'))
        location.href = '/referral_signup'+location.search;
};

var $popover_link;
function show_popover(link){
    var $link = $(link);
    if ($popover_link)
    {
        if ($popover_link.is($link))
            return;
        $popover_link.popover('hide');
    }
    $popover_link = $link.popover('show');
    $link.data('bs.popover').$tip.mouseleave(hide_popover);
}
function hide_popover(){
    setTimeout(function(){
        if (!$popover_link || $popover_link.is(':hover'))
            return;
        var $popover = $popover_link.data('bs.popover');
        if (!$popover || $popover.$tip.is(':hover'))
            return;
        $popover_link.popover('hide');
        $popover_link = null;
    }, 200);
}
E.navbar_popover_links = function(){
    $('.links_nav_container').find('.downloads_link, .features_link')
    .popover({trigger: 'manual', html: true, placement: 'bottom',
        content: function(){ return $(this).next().html(); }})
    .mouseenter(function(){ show_popover(this); })
    .mouseleave(hide_popover).click(function(e){ e.preventDefault(); });
};
function init_scroller(){
    if (($(window).height() + 100) > $(document).height())
        return;
    $('#scroller').click(function(){
        $('body, html').animate({scrollTop: 0}, 400);
        return false;
    })
    .removeClass('hidden')
    .affix({offset: {
        top: $(window).height() * 2.5,
        bottom: function(){ return $('body > footer').outerHeight(); }
    }});
}
E.generic_page = function(options){
    options = options||{};
    E.simple_page();
    init_chat();
    init_backward();
    FastClick.attach(document.body);
    if (options.perr_on_show)
    {
        be.perr({id: 'www_onshow_'+options.perr_on_show,
            info: {browser: browser}});
    }
    E.init_download(options);
    country_over_display();
    template_info_display(options.template);
    E.navbar_popover_links();
    init_scroller();
};

E.simple_page = function(){
    E.init();
    login.save_affiliate();
    ensure_bootstrap_css();
    init_user_links();
    init_footer_links();
    init_hiring_banner();
    E.init_social_login();
    social.init_sharing();
};

E.force_login = function(){
    return etask('force_login', [E.init_user_account, function(){
	if (user)
	    return user;
	E.open_login_modal(null);
    }]);
};

E.verify_email_page_resend = function(){
    etask('redir_verified_email', [function(){
        return verify_email.redir_verified_email(E.force_login, '/my_account');
    }, function(){
        $('#user_email').text(user.emails[0].value);
    }]);
};

E.verify_email_page = function(){
    login.save_affiliate();
    etask('redir_verified_email', [function(){
        return verify_email.redir_verified_email(E.force_login, '/my_account');
    }, function(){
        $('#user_email').text(user.emails[0].value);
    }]);
    $('.resend_email').click(function(event){
	event.preventDefault();
	etask('resend_email', [function(){
	    return verify_email.resend_verification_email();
	}, function(){
            window.location = '/unverified_email_resend';
	}]);
    });
};

function format_json(a){ return JSON.stringify(a, null, 4)+'\n'; }

E.get_help = function(country_code){
    var _hopt = $.extend(true, {}, hopt);
    if (_hopt.www_config)
        delete _hopt.www_config.country_messages;
    var system = _.extend({}, _.compactObject(user_agent.guess()),
        _.compactObject(browser));
    var log = 'system = '+format_json(system)
    +'ext.info = '+format_json(be.get('ext.info'))
    +'hola_opt = '+format_json(_hopt);
    E.generic_page({country_code: country_code});
    $('#get_help_log').click(function(){ $(this).focus().select(); })
    .text(log).click();
};

E.get_mp_requirements = function(){
    var ext_info = window.hola_extension_info;
    var svc_version = '1.5.487', cgi_version = '1.5.470';
    var requirements = [];
    if (browser.browser=='chrome')
    {
        if (!window.hola_svc_info || version_util.version_cmp(
            window.hola_svc_info.ver, svc_version)<0)
        {
            requirements.push('install_win_client');
        }
        if (!ext_info || !ext_info.ver
            || version_util.version_cmp(ext_info.ver, '1.5.219')<=0)
        {
            requirements.push('install_chrome_extension');
        }
    }
    else if (browser.browser=='firefox')
    {
        if (!ext_info)
            requirements.push('install_firefox_extension');
        if (!window.hola_svc_info)
            requirements.push('wait_firefox_service');
        // XXX colin: add detection of torrent_stream feature in svc
    }
    if (/firefox|chrome/.test(browser.browser))
    {
        if (ext_info && ext_info.rmt_ver
            && version_util.version_cmp(ext_info.rmt_ver, cgi_version)<0)
        {
            requirements.push('reload');
        }
    }
    return requirements;
};
// XXX colin: remove this code
function get_mp_steps(){
    var steps = [];
    steps.concat(E.get_mp_requirements().map(function(label){
        switch (label)
        {
        case 'install_win_client':
            return '<div><a href="//hola.org/download?upgrade=1">'
                +'- Install/Update Hola windows client</a></div>';
        case 'install_chrome_extension':
            return '<div><a href="https://chrome.google.com/webstore/'
                +'detail/hola-better-internet/'
                +'mhcmfkkjmkcfgelgdpndepmimbmkbpfp" '
                +'rel="chrome"> - Get Hola extension</a></div>';
        case 'install_firefox_extension':
            return '<div><a href="//hola.org">- Install Hola Firefox '
                +'extension</a></div>';
        case 'wait_firefox_service':
            return '<div>- Wait till Firefox engine completes download</div>';
        case 'reload':
            return '<div>- extension needs reload, disable and '
                +'then enable Hola extension or close and open chrome'
                +'</div>';
        }}));
    return steps;
}

// XXX colin: merge with svc/mp/pub/util.js
var zopts = {};
zopts.set = function(key, val){
    zopts.table[key] = val===undefined ? false : val;
    storage.set_json('hola_opts', zopts.table);
    www_storage.set_json('hola_opts', zopts.table);
};

// XXX alexeym: make it work transparently with http & https pages
zopts.get = function(key){ return zopts.table[key]; };
zopts.init = function(){
    zopts.table = {};
    etask([function(){
        return www_storage.init({ver: config.ver});
    }, function(){
        return www_storage.get_json('hola_opts');
    }, function(hola_opts){
        zopts.table = hola_opts||{};
        if (add_steps)
            add_steps();
    }]);
};
zopts.init();

var add_steps;
var hola_opts_list = [
    'developer_mode',
    'vlc_hola_ff',
    'ie_hola_ff',
    'vlc_hola_br',
    'vlc_hola_br_dbg',
    'vlc_activex',
    'vlc_windowless',
    'vlc_log',
    'new_features',
    'mp_tpopup',
    'mp_tpopup_new',
    'proxy_debug',
    'proxy_debug_timing',
    'js_torrent_engine',
    'for_all_os',
    'watch_later_www',
    'bw_saver',
    'zcdn',
    'show_template_info',
    'svc_check',
    'unblocker_api_new'
];
E.country_override = function(country_code){
    var $country = $('#country').val($.cookie('country_override')||'');
    var cookie_opt = {domain: '.hola.org', path: '/', expires: 30};

    function flash_msg(id, text){
        $('#' + id + '_flash_msg').stop(true, true).text(text)
        .show().hide(1000);
    }

    E.generic_page({country_code: country_code});

    $('#country_save').click(function(){
        if (!$country.val())
            $.removeCookie('country_override', cookie_opt);
        else
            $.cookie('country_override', $country.val(), cookie_opt);

        flash_msg('country', 'Saved');
    });
    $('#country_form').submit(function(event){
        $('#country_save').click();
        event.preventDefault();
    });
    add_steps = function(){
        function add_opt(opt, need_cookie){
            var checked;
            $('#opts_'+opt).click(function(){
                window.postMessage({src: 'hola_ccgi', id: 'opts_set',
                    data: {key: opt, val: this.checked}}, '*');
                zopts.set(opt, this.checked);
                if (need_cookie)
                {
                    if (this.checked)
                        $.cookie('hola_opt_'+opt, '1');
                    else
                        $.removeCookie('hola_opt_'+opt);
                }
                add_steps();
            }).prop('checked', (checked=zopts.get(opt)));
            window.postMessage({src: 'hola_ccgi', id: 'opts_set',
                data: {key: opt, val: checked}}, '*');
        }
        var need_cookie = {vpn_activation: 1};
        _.each(hola_opts_list, function(opt){
            add_opt(opt, need_cookie[opt]);
        });
        $('#mp_steps').empty();
        var steps = get_mp_steps();
        if (steps.length)
        {
            $('#mp_steps').append(
                '<h1>Not working</h1><div>Do the following steps</div>'
                +steps.join(''));
        }
    };
    add_steps();
    etask([function(){
        return be.svc_callback();
    }, function(){
        return be.ext_callback();
    }, function(){
        add_steps();
    }]);
    etask([function(){
        return login.get_user();
    }, function(user){
        var affiliate = user.affiliate ? JSON.stringify(user.affiliate) :
            'no affiliate data saved';
        $('#affiliate').append(affiliate);
    }]);
};

E.update_hola_opts = function(){
    var zopts = {};
    function add_opt(opt){
        window.postMessage({src: 'hola_ccgi', id: 'opts_set',
            data: {key: opt, val: zopts[opt]}}, '*');
    }
    return etask([function(){
        return etask.all({
            ext_callback: be.ext_callback(),
            hola_opts: www_storage.get_json('hola_opts')
        });
    }, function(resp){
        zopts = resp.hola_opts||{};
        _.each(hola_opts_list, add_opt);
    }]);
};

function country_over_display(){
    var country = $.cookie('country_override');
    if (!country)
        return;
    $('<div>', {class: 'country_override'})
    .text('Country forced to '+country)
    .appendTo('body');
}

function template_info_display(template){
    if (!template || !zopts.get('show_template_info'))
        return;
    $('<div>', {class: 'template_info'})
    .text('The page uses '+template+' template')
    .appendTo('body');
}

E.signin_page = function(){
    login.save_affiliate();
    var enc_url = '?'+zescape.qs({next: url.param('next')});
    new login.Page({el: '.container#login', enc_url: enc_url});
};

function track_activation(name){
    be.perr({id: 'www_track_activation_'+name, info: {browser: browser}});
}

E.activate_page = function(){
    login.save_affiliate();
    var redirect_url = url.param('next')||'https://hola.org';
    etask([function(){
        return E.update_hola_opts();
    }, function(){
        return be.check_activation();
    }, function activate(check_activation){
        if (!check_activation)
            return void(window.location = redirect_url);
        track_activation('page');
        var enc_url = '?'+zescape.qs({activate: redirect_url});
        new login.activate_page({el: '.container#login', enc_url: enc_url,
            signup_mode: true, on_submit: function(info){
                track_activation('submit'+(info && info.type ?
                    '_'+info.type : ''));
            }});
    }, function catch$(){
        $.removeCookie('is_ext_mode', {path: '/'});
        this.egoto('activate');
    }]);
};

E.activate_success = function(){
    var $success = $('#activate_success');
    var $link = $success.find('.activate-form-redirect');
    var redirect_url = url.param('next');
    var root_url;
    if (redirect_url)
    {
        root_url = zurl.parse(redirect_url);
        root_url = root_url ? root_url.hostname : '';
        redirect_url = root_url ?
            'https://hola.org/access/'+root_url+'?go=1' : '';
    }
    if (!redirect_url)
        redirect_url = 'https://hola.org';
    var pages = {
        '/access/my/settings': 'Settings',
        'https://hola.org': 'hola.org'
    };
    etask([function(){
        return be.check_activation();
    }, function activate(check_activation){
        if (check_activation)
            track_activation('success');
        $link.attr('href', redirect_url)
        .text(root_url||pages[redirect_url]||redirect_url);
        setTimeout(function(){
            window.location = redirect_url;
        }, 2000);
    }, function catch$(){
        $.removeCookie('is_ext_mode', {path: '/'});
        this.egoto('activate');
    }]);
};

E.get_user = function(){ return user; };

E.hola_uid_display = function(uid){
    var a = (uid||'').match(/([^/]*)\/(.*)/);
    if (a[1]=='basic')
	return 'email/'+a[2];
    return a[1]+'/'+a[2];
};

E.reset_password_page = function(country_code){
    E.generic_page({country_code: country_code});
    password.reset_password();
};

E.forgot_password_page = function(country_code){
    E.generic_page({country_code: country_code});
    password.forgot_password();
};

E.forgot_password_success_page = function(country_code){
    E.generic_page({country_code: country_code});
    password.forgot_password_success();
};

E.download_accel_init = function(){
    var version = url.param('accel')||'';
    if (version && version!='0')
    {
        var $body = $('body');
        var $text = $('.download_accel_text');
        var domain = url.param('url');
        domain = zurl.is_valid_url(domain) ? zurl.get_host_gently(domain) : '';
        if (!domain)
            domain = T('site');
        $body.addClass('download_accel');
        if (version=='1')
        {
            $body.addClass('download_accel_circle');
            $text.text(T('Click to accelerate')+' '+domain);
        }
        if (version=='2' && window.chrome)
        {
            $body.addClass('download_accel_arrow');
            $text.html(T('Click to speed up')+'<br>'
                +domain+' '+T('using Hola'));
        }
        $body.click(function(){ $('#install_btn').click(); });
    }
};

E.download_apk_init = init(function(){
    var z = user_agent.guess(navigator.userAgent);
    var prefix = z.os==='android' && z.arch==='32' ?
	'Hola-Setup-x86-' : 'Hola-Setup-';
    var apk_file = prefix+hola_versions.android+'.apk';
    $('small.file_name').text(apk_file);
    $('small.file_size').text('5MB'); /* XXX eilam: calc real size */
    var host = '//'+cdn4+'/static/';
    if (!/^(https?:)?\/\//.test(apk_file))
	apk_file = host+apk_file;
    var label = 'www_download_apk_page';
    window.ga('send', 'event', label, 'visit_download_page',
        {nonInteraction: 1});
    be.perr({id: label, info: 'visit_download_page'});
    $('a.download-button.android_apk').attr('href', apk_file)
    .css('line-height', 1).mousedown(function(){
        window.ga('send', 'event', label, 'apk_file', {nonInteraction: 1});
	be.perr({id: label, info: 'apk_file'});
    });
    $('a.download-button.google_play').mousedown(function(){
        window.ga('send', 'event', label, 'google_play',
            {nonInteraction: 1});
	be.perr({id: label, info: 'google_play'});
    });
    E.ga_track_download($('a.download-button.android_apk'), 'android');
    E.ga_track_download($('a.download-button.google_play'), 'android');
});

E.faq_init = init(function(country_code, template){
    E.generic_page({
        country_code: country_code,
        template: template,
        no_search: true
    });
    var faq_search;
    if (/android/i.test(navigator.userAgent))
        $('body').addClass('android');
    if (/hola_android/.test(navigator.userAgent))
        $('#header .logo, #follow-hola, #footer').remove();
    $('a[data-subject]').prop('href', function(){
        return zescape.mailto_url({to: 'help@hola.org',
            subject: $(this).data('subject'), body: $(this).data('body')});
    });
    if (!(faq_search = $('.faq-search')).length)
        return;
    var faq_text = $('.container.faq-text, .wrap.faq-text');
    var old_query, search_match;
    $('form', faq_search).submit(function(event){
        event.preventDefault();
        var search = $('input', faq_search);
        var need_search;
        var query = search.val();
        var new_query = $.trim(query);
        if (!old_query || !old_query.length || old_query!=new_query)
        {
            search_match = 0;
            old_query = new_query;
            need_search = true;
        }
        else
        {
            need_search = false;
            search_match++;
        }
        if (need_search)
        {
            faq_text.page_search_clear();
            if (!query)
                return void search.focus();
            faq_text.page_search($.trim(query));
        }
        var result_count = $('.page-search-hl').length;
        if (result_count)
            search_match = search_match%result_count;
        $('.page-search-hl.curr').removeClass('curr');
        var first_match = $('.page-search-hl:eq('+search_match+')');
        if (first_match[0])
        {
            $(first_match[0]).addClass('curr');
            first_match[0].scrollIntoView();
        }
        $.ajax({
            url: '/search',
            data: {q: query},
            type: 'GET',
            complete: function(){
                if (hopt.www_config.faq_support_active)
                    window.location = '/support';
            }
        });
    });
});

function update_init(){
    download.set_download_vpn('a.heading-icons-download'); }

E.update_unblocker = init(function(){
    var url = $.url();
    if (url.param('old_ff_market')!==undefined)
	update_init('firefox');
    else if (url.param('old_chrome')!==undefined)
	update_init('chrome');
    else // user error, redirect to home page
	window.location.replace('https://hola.org/');
});

E.promo_search = Backbone.View.extend({
    className: 'ui_promo_search',
    events: {
        'blur .tt-input': 'unhover',
        'mouseleave .tt-input': 'unhover',
        'focus .tt-input': 'focus',
        'mouseenter .tt-input': 'focus'
    },
    append_to: function(parent){
        this.$parent = $(parent);
        this.$el.appendTo(this.$parent);
        this.left_combobox.$el.appendTo(this.$parent);
    },
    get_search_input: function(options){
        return new zsearch.search({
            country: options.country,
            country_select: this.left_combobox,
            settings: {
                placeholder: options.placeholder
            },
            on_select: this.on_select.bind(this)
        });
    },
    get_left_combobox: function(options){
        return new E.promo_country_select({country: options.country,
            search: this});
    },
    initialize: function(options){
        this.render();
        this.left_combobox = this.get_left_combobox(options);
        this.search = this.get_search_input(options);
        this.search.render(this.$search);
        this.$input = this.search.$input;
        if (this.left_combobox.select)
            this.left_combobox.select('us', 'United States');
    },
    render: function(){
        this.$search = $('<span>', {class: 'ui_promo_search_input'})
        .appendTo(this.$el);
        $('<i>', {class: 'ui_promo_search_arrow'}).appendTo(this.$el);
    },
    unhover: function(){
        if (this.can_unhover())
            this.$parent.removeClass('js-promo-search_hover');
    },
    focus: function(){
        this.$parent.addClass('js-promo-search_hover');
    },
    can_unhover: function(){
        return !this.$input.is(':focus') && !this.$input.val()
            && !this.left_combobox.selected;
    },
    on_select: function(url){
        var domain = zurl.get_host_gently(url);
        if (this.search.show_modal(domain))
            return;
        window.location.href = '/access/'+domain+'/using/vpn-'
            +this.left_combobox.country+'?go=1';
    }
});

E.promo_search_index = E.promo_search.extend({
    className: 'ui_promo_search_index',
    events: {
        'blur .tt-input': 'unhover',
        'mouseleave .tt-input': 'unhover',
        'focus .tt-input': 'focus',
        'mouseenter .tt-input': 'hover',
        'focusout .tt-input': 'focusout',
        'click .tt-input': 'click',
        'keyup .tt-input': 'keyup',
        'input .tt-input': 'input'
    },
    append_to: function(parent){
        this.$parent = $(parent);
        this.$el.appendTo(this.$parent);
        $('<div>', {class: 'devider'}).appendTo(this.left_combobox.$el);
        this.left_combobox.$el.appendTo(this.$parent);
        var $input = this.$el.find('.tt-input');
        this.$parent.find('.magnifier').insertAfter($input)
        .removeClass('hide').click(function(){
            var e = $.Event('keypress');
            e.which = 13;
            $input.trigger(e);
        });
        this.hide_hint();
        this.$fake_cursor = this.$parent.find('.fake-cursor');
        this.$parent.hover(this.repeat_fake_cursor_toggle.bind(this),
            this.stop_fake_cursor_toggle.bind(this));
    },
    set_hovered: function(){
        this.$parent.addClass('js-promo-search_hover');
    },
    hover: function(){
        www_util.perr({id: 'www_index_promo_search_new_hover'});
        this.set_hovered();
    },
    on_select: function(){
        www_util.perr({id: 'www_index_promo_search_new_select'});
        E.promo_search.prototype.on_select.apply(this, arguments);
    },
    focus: function(){
        this.set_hovered();
    },
    click: function(){
        www_util.perr({id: 'www_index_promo_search_new_click'});
        this.set_hovered();
        this.stop_fake_cursor_toggle();
    },
    keyup: function(){
        if (!this.is_input_empty())
            this.unhide_hint();
        else
            this.hide_hint();
    },
    unhover: function(){
        if (this.can_unhover())
        {
            if (this.is_input_empty())
                this.$parent.removeClass('js-promo-search_hover');
            else
                this.$parent.addClass('js-promo-search_hover');
        }
    },
    focusout: function(){
        this.unhover();
        if (this.is_input_empty())
            this.hide_hint();
    },
    is_input_empty: function(){
        return !this.$el.find('.tt-input').val();
    },
    hide_hint: function(){
        this.$parent.find('.tt-hint').addClass('hide');
    },
    unhide_hint: function(){
        this.$parent.find('.tt-hint').removeClass('hide');
    },
    repeat_fake_cursor_toggle: function(){
        this.$fake_cursor.removeClass('hide');
        this.toggle_interval = setInterval(this.toggle_fake_cursor.bind(this),
            600);
    },
    stop_fake_cursor_toggle: function(){
        this.$fake_cursor.addClass('hide');
        clearInterval(this.toggle_interval);
    },
    toggle_fake_cursor: function(){
        if (this.$parent.find('.tt-input').is(':focus'))
        {
            this.stop_fake_cursor_toggle();
            return;
        }
        if (this.$fake_cursor.is(':visible'))
            this.$fake_cursor.hide();
        else
            this.$fake_cursor.show();
    },
    input: function(){
        if (this.$parent.find('.tt-input').val())
            this.$parent.find('.go').css('display', 'block');
        else
            this.$parent.find('.go').css('display', 'none');
    }
});

var hola_ff_cache;
function play_url_in_ff(url){
    etask([function(){
        if (hola_ff_cache !== undefined)
            return this.egoto('play', hola_ff_cache);
        return be.ext_callback();
    }, function(extInfo){
        return extInfo.hola_ff;
    }, function catch$(err){
        return false;
    }, function play(hola_ff){
        hola_ff_cache = hola_ff;
        if (!hola_ff)
            svc_ipc.hola_br_start({url: url});
        else
            window.location.href = url;
    }]);
}

function get_textarea_line_count($el){
    var pad = parseInt($el.css('padding-bottom'))
        +parseInt($el.css('padding-top'));
    var line_height = parseInt($el.css('font-size'))*1.5;
    var orig_height = $el.css('height'), height = 0;
    var orig_scroll_top = $el.prop('scrollTop');
    $el.css('height', 0);
    for (var lines=0; $el.prop('offsetHeight')<($el.prop('scrollHeight')-pad);
        lines++)
    {
        height += line_height;
        $el.css('height', height+'px');
    }
    $el.css('height', orig_height);
    $el.prop('scrollTop', orig_scroll_top);
    return lines;
}

E.promo_search_player = E.promo_search_index.extend({
    className: 'ui_promo_search_player',
    get_search_input: function(options){
        var _this = this;
        var max = 1;
        function validator(s){
            _this.left_combobox.dropdown.$el.removeClass('open');
            return s.match(/^magnet:\?([\w-]+(=[^\&=]*)?(&[\w-]+(=[^\&=]*)?)*)?$/i)
                || zurl.is_valid_url(s);
        }
        function init_input(){
            $input.css('font-size', 50);
            // 38 = (font-size*1.5)/2 = (50*1.5)/2
            var pad = parseInt($input.css('height'))/2-38;
            $input.css('padding-top', pad+'px');
            max = 1;
        }
        var search = new zsearch.search({
            settings: {
                placeholder: options.placeholder,
                typeahead: false,
                show_modal: false,
                validationError: T('Please enter a valid torrent URL or magnet'
                +' link'),
                validator: validator,
                inputTag: '<textarea rows=2></textarea>'
            },
            on_select: this.on_select.bind(this)
        });
        var $input = search.$input;
        var original_padding = 10;
        $input.on('input keyup', function(){
            var lineCount = get_textarea_line_count($input);
            if (lineCount>max)
                max = lineCount;
            if (max>1)
            {
                if ($input.val())
                {
                    $input.css('font-size', max>=3 ? 25 : 35);
                    $input.css('padding-top', original_padding);
                } else
                    init_input();
            }
        });
        search.on('focus', function(){
            if (!$input.val())
            {
                init_input();
                setTimeout(function(){
                    _this.left_combobox.dropdown.$el.addClass('open');
                }, 200);
            }
        }).on('blur', function(){
            if (!$input.val())
            {
                $input.css('padding-top', '');
                $input.css('font-size', '');
            }
        });
        return search;
    },
    get_left_combobox: function(options){
        return new E.promo_torrent_select({search: this,
            torrents: options.torrents});
    },
    on_select: function(url){
        url = zescape.uri('http://hola.org/play', {}, {v: url});
        if (this.downloadTrigger.is_latest_svc)
            return void play_url_in_ff(url);
        this.downloadTrigger.install({type: 'full', flow: 'player',
            ext_exe: {exe_redirect: url}});
    },
    initialize: function(options){
        this.constructor.__super__.initialize.call(this, options);
        this.downloadTrigger = new download.trigger();
    }
});

E.promo_torrent_select = Backbone.View.extend({
    className: 'torrent_select ui_promo_torrent_select',
    initialize: function(options){
        var _this = this;
        this.search = options.search;
        var svg = ['<svg viewBox="0 -20 100 100"><g><path fill="#009cd6" d="',
            'M68,40.6l-5.4,0H35.5c-7.8,0-15.6-3.1-15.6-10.6c0-8,8.1-10.6,',
            '15.6-10.6h27.1l5.4,0V0L33.9,0C15.2,0,0,12.1,0,30c0,17.9,15.2,30,',
            '33.9,30H68V40.6z M55.1,17.7V1.8h11v15.9H55.1zM55.5,58.3V42.5h11',
            'v15.9H55.5z M55.5,58.3"/></g></svg>'
        ].join('');
        var dropdown = this.dropdown = new ui.dropdown({title:
            '<span class="magnet">'+svg+'</span><span class="caret"></span>'});
        dropdown.$btn.removeClass('btn go-btn main-unblock');
        var torrents = options.torrents.filter(function(i){
            var host = zurl.get_host_gently(i.http);
            return host.substr(0, 5) == 'cdn4.';
        });
        for (var i=0, len=torrents.length; i<len; i++)
        {
            var item = torrents[i];
            var li = $('<span class="r_ui_torrent_list_item f32">'+
                '<span class="icon"></span>'+
                '<span class="r_ui_torrent_list_item_name">'+item.title+
                '.torrent</span></span>');
            var $li = dropdown.add_item(li);
            (function(url){
                $li.click(function(){
                    _this.selected = true;
                    _this.search.search.$input.val(url).trigger('input');
                    _this.search.on_select(url);
                });
            })(item.http);
        }
        dropdown.$ul_wrap.append($('<div>', {class: 'arrow'}));
        dropdown.$el.appendTo(this.$el);
    }
});

// XXX alexeym: use be_vpn_util.get_popular_country
function get_popular_country(){ return ['US', 'GB']; }

E.promo_country_select = Backbone.View.extend({
    className: 'country_select ui_promo_country_select',
    initialize: function(options){
        var _this = this;
        var popular_countries = get_popular_country();
        options = $.extend({countries: pcountries.proxy_countries.bext,
            domain: ''}, options);
        this.promo_search = options.search;
        var dropdown = new ui.dropdown({title: '<span class="f64">'
            +'<span class="flag flag_other"></span></span>'
            +'<span class="caret"></span>'
            +'<span class="r_list_head_label"></span>'});
        this.$flag = dropdown.$btn.find('.flag');
        this.$label = dropdown.$btn.find('.r_list_head_label');
        dropdown.$btn.removeClass('btn go-btn main-unblock');
        function add_countries(countries, need_sort){
            need_sort = need_sort===undefined ? true : need_sort;
            countries = _.map(countries, function(c){
                var www_c = zcountry.code2www(c);
                return {value: c, name: T(www_c),
                    fmt_name: uutil.fmt_country(www_c)}; });
            if (need_sort)
            {
                countries = _.sortBy(countries, function(i){
                    return i.fmt_name; });
            }
            _.each(countries, function(c){
                var ic = 'r_ui_vpn_country_list_item';
                var item = $('<span class="'+ic+' f32">'
                    +'<span class="flag '+c.value.toLowerCase()+'"></span>'
                    +'<span class="'+ic+'_name">'+c.fmt_name+'</span></span>');
                var $li = dropdown.add_item(item, c.value);
                $li.click(function(){
                    var _c = c.value.toLowerCase();
                    _this.selected = true;
                    _this.select(_c, c.fmt_name);
                });
            });
        }
        add_countries(popular_countries, false);
        dropdown.$ul.append($('<li>', {class: 'divider'}));
        add_countries(options.countries);
        dropdown.$ul_wrap.append($('<div>', {class: 'arrow'}));
        this.$el.append('<h4>Access site from:</h4>');
        dropdown.$el.appendTo(this.$el);
    },
    select: function(country, label){
        this.country = country;
        this.$flag.attr('class', 'flag '+country);
        this.$label.text(label);
        var search_value;
        if (this.promo_search)
        {
            this.promo_search.$input.focus();
            search_value = this.promo_search.$input.val();
        }
        if (search_value)
            this.promo_search.search.on_search(search_value);
    }
});

function init(done){
    return function(){
	var args = Array.prototype.slice.call(arguments);
	$(function(){ done.apply(null, args); });
    };
}

E.get_player_download_url_override = function(){
    var exe_redirect = $.cookie('exe_redirect');
    var link = 'https://hola.org/player_download?mplayer=1';
    if (exe_redirect)
        link += '&exe_redirect='+encodeURIComponent(exe_redirect);
    return link;
};

E.engine_update = function(){
    try {
        parent.postMessage({id: 'tpopup.init'}, '*');
        parent.postMessage({id: 'tpopup.show'}, '*');
    } catch(err){ be.perr({id: 'www_engine_update_err_init'}); }
};

E.engine_update_init = function(opt){
    var rate = {
        root_url: opt.root_url,
        name: opt.root_url
    };

    opt = _.extend({
        no_search: true,
        perr_on_show: 'engine_update',
        perr_on_step: 'engine_update',
        // xxx pavlo: it must be rewritten before it will be turned ON again.
        // skip_auth: true,
        // svc_check: true,
        no_auto_redirect: true
    }, {
        country_code: opt.country_code,
        template: opt.template
    });
    E.generic_page(opt);
    var sitepic = new ui.sitepic2({rate: rate,
        popular_sites: opt.popular_sites,
        no_handlers: true,
        screenshot: opt.screenshot
    });
    $('#sitepic').append(sitepic.$el.addClass('ui_sitepic2_popup'));
    $('body').show();
    $('a.detect-install2-vpn').mousedown();
};

E.challenge = function(){
    E.generic_page();
    var a = url.param('a') || storage.get('challenge_a');
    if (a && /^[-_.a-zA-Z0-9]+$/.test(a))
    {
        storage.set('challenge_a', a);
        if (url.param('a')!==a)
        {
            var parsed = zurl.parse(window.location.href, true);
            var qs = parsed.query ? zurl.qs_parse(parsed.query) : {};
            qs.a = a;
            console.log(qs);
            var u = parsed.protocol+'//'+parsed.authority+parsed.pathname+'?'
                    +Object.keys(qs).map(function(key){
                        return window.encodeURIComponent(key)+'='
                            +window.encodeURIComponent(qs[key]);
                    }).join('&')+(parsed.hash||'');
            if (window.history && window.history.replaceState)
                window.history.replaceState(null, null, u);
            else
                window.location.href = u;
        }
        $('a.campaign-email').each(function(i, elm){
            var m = elm.href.match(/^mailto:(.*)@(.*)$/);
            var email = m[1]+'+'+a+'@'+m[2];
            if ('mailto:'+elm.innerText==elm.href)
                elm.innerText = email;
            elm.href = 'mailto:'+email;
        });
    }
    require(['/www/util/pub/prism.js'], function(prism){
        prism.highlightAll(); });
};

$(document).bind('ajaxSend', function(event, xhr, opt){
    csrf.on_ajax_send(xhr, opt); });

E._init = init;
return E; });

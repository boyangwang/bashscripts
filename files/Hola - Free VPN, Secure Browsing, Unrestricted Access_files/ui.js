// LICENSE_CODE ZON
'use strict';/*jslint browser:true*/
define(['backbone', 'underscore', 'virt_jquery_all', '/util/etask.js',
    '/www/login/pub/login.js', '/www/hola/pub/be.js',
    '/www/hola/pub/unblock_util.js',
    '/util/url.js', '/util/user_agent.js', '/util/storage.js',
    '/util/string.js',
    '/www/hola/pub/download.js', '/svc/pub/app_checker.js',
    '/svc/svc_ipc.js', '/www/hola/pub/download/ext_flow.js',
    '/www/hola/pub/download/ext_exe_flow.js'],
    function(Backbone, _, $, etask, login, be, uutil, zurl, user_agent,
    storage, string, download, app_checker, svc_ipc, ext_flow_model,
    ext_exe_flow_model){
var $html = $('html');
var qs_o = zurl.qs_parse(location.search.substr(1));
var E = {};
var browser = user_agent.guess_browser().browser;
var os = user_agent.guess().os;
/* XXX sergeiv: utils class for get random number from range
without repeat numbers before current range ends */
function random_sequence(min, max){
    this.max = max||min;
    this.min = !max ? 0 : min;
    this.makeArray();
}
random_sequence.prototype.makeArray = function(){
    this.sequence = _.range(this.min, this.max);
};
random_sequence.prototype.get = function(){
    if (!this.sequence.length)
        this.makeArray();
    var el = this.sequence[Math.floor(Math.random() * this.sequence.length)];
    this.sequence = _.without(this.sequence, el);
    return el;
};

/* XXX marat: localize on client side */
function T(value){ return value; }

/* XXX marat: unite code with popup svc/pub/be_ui_obj.js */
E.dropdown = Backbone.View.extend({
    className: 'dropdown scrollable_list',
    initialize: function(options){
        options = $.extend({title: 'More'}, options);
        var $el = this.$el;
        this.$btn = $('<a>', {'class': 'btn main-unblock go-btn '
            +'dropdown-toggle', 'data-toggle': 'dropdown'})
            .html(options.title).appendTo($el);
        this.$ul_wrap = $('<div>', {'class': 'dropdown-menu-wrap'})
            .appendTo($el);
        this.$ul = $('<ul>', {'class': 'dropdown-menu', role: 'menu'})
        .appendTo(this.$ul_wrap);
    },
    add_item: function($item){
        return $('<li>').appendTo(this.$ul).append($item);
    }
});

/* XXX marat: unite code with popup svc/pub/be_ui_obj.js */
E.country_select = Backbone.View.extend({
    className: 'country_select',
    initialize: function(options){
	options = $.extend({countries: [], domain: ''}, options);
	$('<div>', {'class': 'r_ui_flags_list_label f32 pull-left'})
        .append($('<i>', {'class': 'flag us', 'data-country': 'us'}))
	.append($('<i>', {'class': 'flag gb', 'data-country': 'gb'}))
	.append($('<i>', {'class': 'flag br', 'data-country': 'br'}))
	.append($('<i>', {'class': 'flag au', 'data-country': 'au'}))
	.appendTo(this.$el);
	var dropdown = new E.dropdown({title: T('More countries ▼')});
	dropdown.$el.addClass('pull-right');
	_.chain(options.countries).map(function(c){
	    return {value: c, name: T(c), fmt_name: uutil.fmt_country(c)}; })
	.sortBy(function(i){ return i.fmt_name; })
	.each(function(c){
	    var ic = 'r_ui_vpn_country_list_item';
	    var item = $('<span class="'+ic+' f32">'
		+'<span class="flag '+c.value.toLowerCase()+'"></span>'
		+'<span class="'+ic+'_name">'+c.fmt_name+'</span></span>');
	    var $li = dropdown.add_item(item, c.value);
	    $li.click(function(){
		var url, _c = c.value.toLowerCase();
	        /* XXX arik/marat: use uutil.rule_unblock_url (and search for
		 * other places to cleanup urls) */
		if (options.pkg)
		    url = '/access/apk/'+options.pkg+'/using/vpn-'+_c;
		else
		    url = '/access/'+options.domain+'/using/vpn-'+_c;
		window.location.href = url;
	    });
	});
	dropdown.$el.appendTo(this.$el);
    },
    render: function(){}
});

E.glyph = Backbone.View.extend({
    tagName: 'a',
    className: 'btn ui_glyph',
    render: function(){ $('<span>',
        {'class': 'glyphicon glyphicon-play'}).appendTo(this.$el); },
    initialize: function(){ this.render(); }
});

E.stars = Backbone.View.extend({
    tagName: 'span',
    className: 'unblock-stars-wrap',
    render: function(){
	if (!this.options.stars)
            return;
        var unblock_stars_bg = $('<span>', {'class': 'unblock-stars-bg'})
        .appendTo(this.$el);
	$('<span>', {'class': 'unblock-stars'})
	.width(16*this.options.stars).appendTo(unblock_stars_bg);
    },
    initialize: function(options){
	this.options = options;
	this.render();
    }
});

E.thumbs = Backbone.View.extend({
    tagName: 'div',
    className: 'unblock-thumbs-wrap',
    render: function(){
	if (this.options.calc_users)
	{
	    $('<div>', {'class': 'unblock-thumbs-up',
		title: 'Number of users that use this option'})
	    .text(this.options.calc_users).appendTo(this.$el);
	}
	if (this.options.not_working)
	{
	    $('<div>', {'class': 'unblock-thumbs-down',
		title: 'Number of users that pressed `not working`'})
	    .text(this.options.not_working).appendTo(this.$el);
	}
    },
    initialize: function(options){
	this.options = options;
	this.render();
    }
});

// XXX arik/alexeym: unite www/hola/pub/ui.js and svc/pub/be_ui_obj.js
E.lock_glyph = Backbone.View.extend({
    tagName: 'i',
    className: 'ui_sitepic_lock',
    initialize: function(){ this.render(); },
    render: function(){
        $('<i>', {'class': 'ui_sitepic_lock_body'}).appendTo(this.$el);
        $('<i>', {'class': 'ui_sitepic_lock_arm'}).appendTo(this.$el);
    },
    animate: function(){
        this.$el.addClass('ui_sitepic_lock_animated');
    },
    stop_animate: function(){
        this.$el.removeClass('ui_sitepic_lock_animated');
    }
});

E.status = Backbone.View.extend({
    className: 'ui_status',
    initialize: function(){
	this.render();
	this.hide();
    },
    render: function(){
	this.$s = $('<div>', {'class': 'ui_status_label'}).appendTo(this.$el);
    },
    show: function(){ this.$el.show(); },
    hide: function(){ this.$el.hide(); },
    set: function($s){
	this.$s.empty().append($s);
	this.show();
    }
});

function load_icon_try(image){
    var url = image.url;
    return etask([function(){
        if (!url && image.className)
            return this.econtinue();
	var img = $('<img>'), _this = this;
	img.load(function(){ _this.econtinue(); });
	img.error(function(){ _this.ethrow(url+' failed'); });
	img.attr('src', url);
	return this.wait();
    }]);
}

function load_icon(images){
    var i = 0;
    return etask([function load(){
	return load_icon_try(images[i]);
    }, function(){ return this.ereturn(images[i]);
    }, function catch$(err){
	if ((++i)<images.length)
	    return this.egoto('load');
	throw err;
    }]);
}

E.make_icon = function(image){
    if (!image)
        return;
    if (image.className)
        return $('<span>', {'class': image.className});
    return $('<img>', {'src': image.url});
};

E.sitepic = Backbone.View.extend({
    className: 'ui_sitepic',
    events: {'click': 'click_sitepick'},
    initialize: function(options, settings){
	var _this = this;
	settings = settings||{size: 'middle'};
	this.options = options = options||{};
	var rate = options.rate||{};
	this.rate = rate;
	var script = rate.script||{};
	var cls = this.className;
	var $el = this.$el;
	this.status = new E.status();
	this.url = this.rate.url ? this.rate.url+'?go=1' : '';
	var root_url = this.rate.root_url;
        $el.toggleClass('sitepic_large', settings.size==='large');
	// XXX arik/alexeym: handle right click and open in new tab correctly
	var sitepic_body_class = cls+'_body '+cls+'_body_loading';
        var $b = this.url ? $('<a>', {'class': sitepic_body_class,
            'href': this.url}) : $('<div>', {'class': sitepic_body_class});
        this.lock_glyph = new E.lock_glyph();
	this.status.$el.appendTo($b);
	this.click_count = 0;
	this.busy = false;
	$el.click(function(e){
            if (!_this.url)
                return;
            e.preventDefault();
            e.stopPropagation();
            _this.activate();
	});
        $b.appendTo($el);
	/* XXX arik: add alt text */
        var images = [
            {url: '//sitepic-holanetworksltd.netdna-ssl.com/'
	    +root_url+'.png'},
            {url: '//favicon.yandex.net/favicon/'+root_url, alt: true},
            {url: '/img/no_favicon.png', alt: true},
            {className: 'icon-unknown', alt: true}];
        etask([function(){ return load_icon(images);
	}, function(image){
            var $icon = E.make_icon(image);
            $icon.addClass(image.alt ? 'sitepic alternative' : cls+'_img')
            .appendTo($b);
            setTimeout(function(){
                $b.removeClass(cls+'_body_loading');
            }, 13);
	}]);
	var $top = $('<div>', {'class': cls+'_top'}).appendTo($b);
	var stars = new E.stars(rate);
	stars.$el.appendTo($top);
	var thumbs = new E.thumbs(rate);
	thumbs.$el.appendTo($top);
	etask([function(){
            var icon_data = rate.className ? {className: rate.className} :
                {url: rate.icon};
            var images = [icon_data, {className: 'icon-unknown',
		alt: true}];
	    return load_icon(images);
	}, function(image){
            var $icon = E.make_icon(image).addClass('favicon')
            .toggleClass('alternative', !!image.alt).appendTo($top);
	}]);
	var $bottom = $('<div>', {'class': cls+'_bottom'}).appendTo($b);
	if (rate.country)
	{
	    $('<span>', {'class': 'f32'}).appendTo($bottom).append(
	        $('<span>', {'class': 'flag '+rate.country.toLowerCase()}));
        }
	else
	{
	    etask([function(){
		var images = [{url: '//favicon.yandex.net/favicon/'
                    +root_url}, {className: 'icon-unknown'}];
		return load_icon(images);
	    }, function(image){
                E.make_icon(image).addClass('no_flag').prependTo($bottom);
	    }]);
	}
	$('<span>', {'class': cls+'_bottom_name'}).text(rate.name)
	.appendTo($bottom);
        this.lock_glyph.$el.appendTo($b);
    },
    ensure_login: function(url){
        var _this = this;
        if (be.ios_email_check(2))
        {
            return etask([function(){
                var wait = etask.wait();
                var ios_form = (new E.ios_email_form_modal({
                    test_group: 2, on_close: function(){ wait.ereturn(true); }
                })).render();
                return wait;
            }, function(){
                return true;
            }]);
        }
        return true;
    },
    activate: function(){
        var _this = this;
        var $el = this.$el;
        var show_modal = !window.is_popup && user_agent.guess().os!='android'
            && (browser=='chrome' || browser=='firefox' || browser=='ie');
        var root_url = this.rate.root_url;
        var country = this.rate.country;
        var options = this.options;
        if (options.no_handlers)
            return;
        var rate = this.rate;
        if ($el.hasClass('ui_sitepic_disabled'))
            return;
        if (this.busy)
            return;
        this.click_count++;
        if (!be.can_use_ext())
        {
            if (show_modal)
                (new E.sitepic_install_modal({root_url: root_url,
                    country: options.country})).show();
            else
                window.location.href = this.url;
            return;
        }
        this.busy = true;
        $('.'+this.className).not($el).addClass('ui_sitepic_disabled');
        var enable_err = 0, redirect_url;
        var t0 = Date.now();
        var info = {root_url: root_url, country: options.country, t: {},
            click: this.click_count, first_run: $.url().param('first_run')};
        etask([function(){
            be.perr({id: 'www_sitepic_click', info: info});
            _this.status.set($('<div>').text('Unblocking '+root_url+'...'));
            if (_this.lock_glyph)
                _this.lock_glyph.$el.addClass('ui_sitepic_lock_loading');
        }, function enable_root_url(){
            return be.enable_root_url({root_url: root_url, rule: rate.rule,
		country: country, src: 'ui'});
        }, function catch$(err){
            info.t.enable_err = Date.now()-t0;
            enable_err++;
            info.enable_err = enable_err;
            be.perr({id: 'www_sitepic_enable_err',
                info: _.extend(info, {err: ''+err})});
            if (enable_err>1)
                throw new Error('enable_url_failed');
            return this.egoto('enable_root_url');
        }, function(e){
            info.t.enable = Date.now()-t0;
            _this.status.set($('<div>').text('Loading '+root_url+'...'));
            be.perr({id: 'www_sitepic_ok', info: info});
            redirect_url = zurl.add_proto((e.rule&&e.rule.link)||root_url);
            return etask.sleep(200); // XXX arik: allow perr to be sent
        }, function(){
            return _this.ensure_login(redirect_url);
        },
        function(e){
            if (e)
            {
                location.href = redirect_url;
                return this.wait(20000);
            }
            return this.ethrow('Sitepic sign up needed');
        }, function catch$(err){
            info.t.err = Date.now()-t0;
            be.perr({id: 'www_sitepic_err',
                info: _.extend(info, {err: ''+err})});
            if (err && err.message=='enable_url_failed')
            {
                window.location = '/fix_install'+
                    (browser=='firefox' ? '_ff' : '');
                return;
            }
            _this.busy = false;
            $('.ui_sitepic_disabled').removeClass('ui_sitepic_disabled');
            if (_this.lock_glyph)
            {
                _this.lock_glyph.$el.removeClass('ui_sitepic_lock_loading');
                _this.lock_glyph.stop_animate();
            }
            var $msg = '<span>Failed loading '+root_url+'. '+
                '<a><b>Try again</b></a></span>';
            $msg = $($msg);
            $msg.click(function(e){
                e.preventDefault();
                e.stopPropagation();
                _this.activate();
            });
            _this.status.set($msg);
        }]);
    },
    animate: function(){
        this.lock_glyph.animate();
    }
});

E.sitepic2 = E.sitepic.extend({
    className: 'ui_sitepic2',
    events: {'click': 'click_sitepick'},
    activate_count: 0,
    initialize: function(options){
        var _this = this;
        this.options = options = options||{};
        var rate = this.rate = options.rate||{};
        var popular_sites = options.popular_sites||{};
        this.random_sequence = options.random_sequence||
            new random_sequence(12);
        var script = rate.script||{};
        var cls = this.className;
        var $el = this.$el;
        this.status = new E.status();
        this.url = this.rate.url ? this.rate.url+'?go=1' : '';
        var root_url = this.rate.root_url;
        $el.addClass('sitepic_'+root_url.replace(/\./g, '_'));
        if (this.options.no_handlers)
            $el.addClass('ui_sitepic_no_handlers ui_sitepic_disabled');
        if (options.large)
            $el.addClass('ui_sitepic2_large');
        // XXX arik/alexeym: handle right click and open in new tab correctly
        var sitepic_body_class = cls+'_body '+cls+'_body_loading';
        var $b = this.url ? $('<a>', {'class': sitepic_body_class,
            'href': this.url}) : $('<div>', {'class': sitepic_body_class});
        this.status.$el.appendTo($b);
        this.click_count = 0;
        this.busy = false;
        $el.click(function(e){
            if (!_this.url || options.no_handlers)
                return;
            e.preventDefault();
            e.stopPropagation();
            _this.activate();
        });
        $b.appendTo($el);
        /* XXX arik: add alt text */
        var images = [{url: '//sitepic-holanetworksltd.netdna-ssl.com/'
                +root_url+'.png'}];
        if (popular_sites[root_url] && popular_sites[root_url].has_screen
            && !options.large)
        {
            images.unshift({url: '/img/popular/'+root_url+'.jpg'});
        }
        function add_image(image){
            var $img_wrapper = $('<div>').addClass(cls+'_img');
            $('<img>').attr('src', image.url).appendTo($img_wrapper);
            $img_wrapper.appendTo($b);
        }
        etask([function(){ return load_icon(images); }, add_image,
        function catch$(){
            if (options.screenshot)
                add_image({url: options.screenshot});
            else
                $el.addClass(_this.className+'_noimage');
        }, function ensure$(){
            setTimeout(function(){
                $b.removeClass(cls+'_body_loading');
            }, 13);
        }]);
        /* XXX sergeiv: randomize shade color */
        this.options.shade_color = this.options.shade_color
            || this.random_sequence.get();
        var $shade = $('<div>', {'class':
            cls+'_shade '+cls+'_shade_bg_'+this.options.shade_color
        }).appendTo($b);
        $('<span>', {'class': cls+'_shade_siteurl'}).text('www.'+root_url)
            .appendTo($shade);
        var $site_name = $('<div>', {'class': cls+'_shade_sitename'})
            .appendTo($shade);
        this.options.title = this.options.title||'';
        if (!this.options.title)
        {
            if (popular_sites[root_url] && popular_sites[root_url].title)
                this.options.title = popular_sites[root_url].title;
            else
            {
                var dot_index = rate.name.indexOf('.');
                this.options.title = dot_index==-1 ? rate.name :
                    rate.name.slice(0, dot_index);
                if (this.options.title.length <= 3)
                    this.options.title = this.options.title.toUpperCase();
                else
                    this.options.title = string.capitalize(this.options.title);
            }
        }
        $('<span>', {'class': cls+'_shade_sitename_title'})
            .text(this.options.title).appendTo($site_name);
        etask([function(){
            var images = [{url: '//favicon.yandex.net/favicon/'
                +root_url}];
            return load_icon(images);
        }, function(image){
            var $img_wrapper = $('<span>', {'class':
                cls+'_shade_sitename_img'}).prependTo($site_name);
            $('<img>', {src: image.url}).appendTo($img_wrapper);
        }]);
        if (this.options.no_handlers)
            return;
        var $overlay = this.$overlay = $('<div>', {'class': cls+'_overlay'});
        $overlay.html('<div class="sprite"></div><div class="status">'
	    +'Unblocking '+this.options.title+'</div>');
        $overlay.appendTo($b);
        load_icon_try({url: '/img/loader_sprite.png'});
        load_icon_try({url: '/img/loader_sprite_small.png'});
        $('<div>', {'class': cls+'_promotion'})
        .text('Add Hola to access '+this.options.title).appendTo($b);
    },
    activate: function(){
        if (this.options.no_handlers)
            return;
        var _this = this;
        var $el = this.$el;
        var clear_state = function(){
            $el.removeClass(_this.className+'_unblocking')
                .removeClass(_this.className+'_active');
            $('.'+_this.className).removeClass('ui_sitepic_disabled');
        };
        var show_modal = !window.is_popup && user_agent.guess().os!='android'
            && (browser=='chrome' || browser=='firefox' || browser=='ie');
        var root_url = this.rate.root_url;
        var options = this.options;
        var rate = this.rate;
        if ($el.hasClass('ui_sitepic_disabled') || this.busy)
            return;
        if (options.show_access_modal)
        {
            this.options.$el = $el;
            var modal = new E.sitepic2_access_modal(this.options);
            modal.show();
        }
        this.click_count++;
        if (!be.can_use_ext() && !show_modal)
        {
            window.location.href = this.url;
            return;
        }
        if (show_modal && (!be.can_use_ext() || !be.is_svc()))
        {
            var unblock_url = location.origin+'/access/'+root_url+'?go=1';
            var ext_exe = {exe_redirect: false, title:
                'To access this site, please install Hola'};
            be.set_post_install({root_url: root_url});
            if (!be.can_use_ext())
            {
                new download.trigger().install({
                    flow: 'vpn',
                    type: be.is_svc() ? 'ext' : null,
                    ext_exe: ext_exe,
                    redirect: unblock_url
                });
                return;
            }
            else if (!this.activate_count && !qs_o.first_run && os=='windows')
            {
                var ext_exe_flow = new ext_exe_flow_model().install({ext_exe:
                    ext_exe});
                ext_exe_flow.on('install_done', function(){
                    window.location.href = unblock_url; });
                this.activate_count++;
                return;
            }
        }
        $el.addClass(this.className+'_active');
        $('.'+this.className).not($el).addClass('ui_sitepic_disabled');
        this.busy = true;
        var enable_err = 0, redirect_url;
        var t0 = Date.now();
        var info = {root_url: root_url, country: options.country, t: {},
            click: this.click_count, first_run: $.url().param('first_run')};
        etask([function(){
            be.perr({id: 'www_sitepic_click', info: info});
            $el.addClass(_this.className+'_unblocking')
                .parent().addClass('unblocking');
        }, function enable_root_url(){
            return be.enable_root_url({root_url: root_url, rule: rate.rule,
                src: 'ui'});
        }, function catch$(err){
            info.t.enable_err = Date.now()-t0;
            enable_err++;
            info.enable_err = enable_err;
            be.perr({id: 'www_sitepic_enable_err',
                info: _.extend(info, {err: ''+err})});
            if (enable_err>1)
                throw new Error('enable_url_failed');
            return this.egoto('enable_root_url');
        }, function(e){
            info.t.enable = Date.now()-t0;
            $el.removeClass(this.className+'_unblocking');
            be.perr({id: 'www_sitepic_ok', info: info});
            redirect_url = zurl.add_proto((e.rule&&e.rule.link)||root_url);
            return etask.sleep(200); // XXX arik: allow perr to be sent
        }, function(){
            return _this.ensure_login(redirect_url);
        }, function(e){
            if (e)
            {
                location.href = redirect_url;
                return this.wait(20000);
            }
            return this.ethrow('Sitepic sign up needed');
        }, function catch$(err){
            info.t.err = Date.now()-t0;
            be.perr({id: 'www_sitepic_err',
                info: _.extend(info, {err: ''+err})});
            if (err && err.message=='enable_url_failed')
            {
                window.location = '/fix_install'+
                    (browser=='firefox' ? '_ff' : '');
                return;
            }
            _this.busy = false;
            $('.ui_sitepic_disabled').removeClass('ui_sitepic_disabled');
            var $msg = '<span>Failed loading '+root_url+'. '+
                '<a><b>Try again</b></a></span>';
            $msg = $($msg);
            $msg.click(function(e){
                e.preventDefault();
                e.stopPropagation();
                _this.activate();
            });
            _this.status.set($msg);
            clear_state();
        }]);
    }
});

E.sitepics = Backbone.View.extend({
    className: 'ui_sitepics',
    events: {
        'click .ui_sitepics_more_btn': 'show_more'
    },
    initialize: function(options){
	var _this = this;
        this.options = options;
        this.version = options.sitepic_version||1;
        this.popular_sites = options.popular_sites||{};
        if (options.pagination)
        {
            this.options.pagination.page_size =
                this.options.pagination.page_size||6;
            this.tiles_limit = this.options.pagination.page_size;
        }
        else
            this.tiles_limit = options.rules_rating.length;
	this.on('render', function(){ _this.render(); });
	this.set_rules_rating(options.rules_rating);
    },
    set_rules_rating: function(rules_rating){
	this.rules_rating = rules_rating;
	this.trigger('render');
    },
    render: function(options){
        options = options||{};
        var _this = this;
	if (!this.rules_rating)
	    return this.$el.empty();
	var $tmp = $('<div>');
        var random = new random_sequence(12);
        var start = 0;
        if (options.addition
            && this.tiles_limit > this.options.pagination.page_size)
        {
            start = this.tiles_limit - this.options.pagination.page_size;
        }
        for (var i=start; i<this.tiles_limit; i++)
        {
            var rate = this.rules_rating[i];
            var sitepic = null;
            if (_this.version==2)
            {
                sitepic = new E.sitepic2({rate: rate,
                    random_sequence: random,
                    popular_sites: _this.popular_sites,
                    show_access_modal: _this.options.show_access_modal
                });
            }
            else
                sitepic = new E.sitepic({rate: rate});
            sitepic.$el.appendTo($tmp);
        }
        if (!options.addition)
            this.$el.empty().append($tmp.children());
        else
            $tmp.children().insertBefore(this.$('.ui_sitepics_more_btn'));
        if (_this.version==2)
	{
            this.$el.on('mouseover', '.ui_sitepic2', function(){
		_this.$el.addClass('hover'); });
            this.$el.on('mouseout', '.ui_sitepic2', function(){
                _this.$el.removeClass('hover'); });
            if (!this.options.pagination && this.$el.children().length>6)
            {
                $('.sitepic2_more_header').removeClass('never_show')
                .insertAfter(this.$el.find('.ui_sitepic2:eq(5)'));
            }
            if (!this.options.pagination)
            {
                this.$el.find('.ui_sitepic2:lt(6)')
                .addClass('ui_sitepic2_popular');
            }
            else
            {
                this.$el.find('.ui_sitepic2').addClass('ui_sitepic2_popular');
                if (!options.addition
                    && this.tiles_limit < this.rules_rating.length)
                {
                    $('<a class="ui_sitepics_more_btn">Show more</a>')
                    .appendTo(this.$el);
                }
            }
        }
        return this;
    },
    show_more: function(){
        this.tiles_limit += this.options.pagination.page_size;
        this.render({addition: true});
    }
});

E.modal = Backbone.View.extend({
    className: 'modal',
    initialize: function(options){
	if (this.$el.addClass(options['class']))
	    this.$el.addClass(options['class']);
	var empty = options.empty;
	this.options = options;
	$.extend({header_text: '', $content: '', buttons: []}, options);
	var _this = this;
	this.$dialog = $('<div>', {'class': 'modal-dialog'})
        .appendTo(this.$el);
	if (empty)
	    return void this.$dialog.append(options.$content);
	var content = $('<div>', {'class': 'modal-content'})
        .appendTo(this.$dialog);
	var header = $('<div>', {'class': 'modal-header'}).appendTo(content);
	this.add_close_button(header);
	$('<h4>', {'class': 'modal-title', text: options.header_text})
	.appendTo(header);
	var body = $('<div>', {'class': 'modal-body'}).appendTo(content)
	.append(options.$content);
	var footer = $('<div>', {'class': 'modal-footer'})
	.appendTo(content);
	_.forEach(options.buttons, function(b){
	    var button = $('<button>', b).appendTo(footer);
	    if (!b.click)
		button.click(function(){ _this.remove(); });
	});
	this.$header = header;
	this.$footer = footer;
	this.$content = content;
    },
    show: function(){
	if (this.options.dark)
	    $('body').addClass('modal-backdrop-dark');
	this.$el.appendTo('body');
	if (this.options.modal)
	    this.$el.modal(this.options.modal);
	this.$el.modal('show');
    },
    remove: function(){
	this.$el.modal('hide').remove();
	if (this.options.dark)
	    $('body').removeClass('modal-backdrop-dark');
    },
    disable_buttons: function(disabled){
	if (this.$header)
	    this.$header.find(':button').prop('disabled', disabled);
	if (this.$footer)
	    this.$footer.find(':button').prop('disabled', disabled);
    },
    add_close_button: function(element){
        element = element ? $(element) : this.$dialog;
        $('<div data-dismiss="modal" aria-hidden="true"></div>')
        .addClass('firefox-modal-x').prependTo($(element));
    }
});

E.sitepic_install_modal = Backbone.View.extend({
    unblock_url: null,
    className: 'sitepic_install_modal',
    initialize: function(opt){
	var _this = this;
	if (!be.inited)
            throw new Error('be not inited');
        this.opt = opt;
	var $el = this.$el;
	this.unblock_url = location.origin+'/access/'+this.opt.root_url
        +'?go=1';
        this.modal = new E.modal({$content: $el, empty: true,
	    'class': 'sitepic_modal'});
	be.on('change:ext.info', _.debounce(function(){ _this.render(); }));
	this.render();
    },
    render: function(){
        var _this = this;
	var opt = this.opt;
	var $el = this.$el.empty();
        var ff = browser=='firefox';
        var ie = browser=='ie';
	var $row, sitepic;
        var unblock_url = location.origin+'/access/'+opt.root_url+'?go=1';
	if (be.can_use_ext())
	{
	    $row = $('<div>').appendTo($el);
	    sitepic = new E.sitepic({rate: {root_url: opt.root_url,
                country: opt.country, url: unblock_url}},
		{size: 'large'});
	    sitepic.$el.appendTo($row);
	    sitepic.activate();
	}
	else
	{
	    this.modal.add_close_button(this.modal.$el);
            $row = $('<div>', {'class': 'sitepic_install_modal_button'})
	    .appendTo($el);
	    var $btn = $('<a>', {'class': 'btn main-btn on-hover-scale '+
                'detect-install2-vpn'}).appendTo($row)
            .text('Add Hola to '+(ie ? 'browser' :
                (ff ? 'Firefox' : 'Chrome'))+' to access '+opt.root_url);
	    $row = $('<div>').appendTo($el);
	    sitepic = new E.sitepic({rate: {root_url: opt.root_url}},
		{size: 'large'});
	    sitepic.$el.appendTo($row);
            $btn.add(sitepic.$el).mousedown(function(){
                _this._run_vpn();
            });
	    be.set_post_install({root_url: opt.root_url});
	}
	sitepic.animate();
    },
    _run_vpn: function(){
        var _this = this;
        etask([function(){
            return etask.all({ext: app_checker.is_ext(), svc:
                app_checker.is_svc()});
        }, function(is_installed){
            if (is_installed.svc && browser=='ie')
            {
                etask([function(){
                    return svc_ipc.hola_br_start({url: _this.unblock_url});
                }, function(){
                    location.href = '/access/popular';
                }]);
            }
            else if (!is_installed.ext)
            {
                if (browser=='ie')
                {
                    new ext_exe_flow_model().install({
                        flow: 'vpn',
                        ext_exe: {exe_redirect: this.unblock_url}
                    });
                }
                else
                    new ext_flow_model().install({flow: 'vpn'});
            }
        }]);
    },
    show: function(){
        this.modal.show();
        this._run_vpn();
    },
    remove: function(){ this.modal.remove(); }
});

E.sitepic2_access_modal = Backbone.View.extend({
    className: 'sitepic2_access_modal',
    events: {
        'click': 'hide'
    },
    initialize: function(options){
        this.options = _.clone(options);
        this.options.show_access_modal = false;
        this.options.large = true;
        be.emitter.on('chrome_extension_install_canceled',
            this.hide.bind(this));
    },
    show: function(){
        $('body').append(this.render().$el);
        setTimeout((function(){
            this.$el.addClass('modal_displayed');
            this.options.$el.addClass('ui_sitepic2_modal ui_sitepic2_promote');
        }).bind(this), 100);
        this.delegateEvents();
    },
    hide: function(){
        clearTimeout(this.hide_timeout);
        this.$el.removeClass('modal_displayed');
        this.hide_timeout = setTimeout((function(){
            this.$el.remove();
            this.options.$el.removeClass('ui_sitepic2_modal')
            .removeClass('ui_sitepic2_promote');
        }).bind(this), 350);
    },
    render: function(){
        return this;
    }
});

/* XXX arik/marat: mv to ui_util.js */
E.pretty_script = function(script){
    if (script.unblocker_rules)
    {
	script = $.extend(true, {}, script); // deep copy
	_.each(script.unblocker_rules, function(rule){
	    delete rule.supported; });
    }
    return JSON.stringify(script, null, '\t');
};

E.popover = Backbone.View.extend({
    className: 'list-group',
    initialize: function(options){
	var _this = this;
	var content = $('<div>');
	_.chain(options.items)
	.forEach(function(i, index){
	    var div = $('<div>', {'class': 'list-group-item'}).html(i)
	    .click(function(){ _this.trigger('select', {index: index}); })
            .appendTo(content);
	});
	var template = $('<div class="popover"><div class="arrow"></div>'
	    +'<div class="popover-inner"><h3 class="popover-title"></h3>'
	    +'<div class="popover-content"><p></p></div></div></div>');
	template.addClass(options.popoverClass);
	options.button.popover({html: true, content: content, placement:
	    'bottom', 'data-toggle': 'popover', template: template});
	$('body').on('click', function(e){
	    if ($(e.target).is(options.button))
		return;
	    if ($(e.target).parents().is(_this.$el))
		return;
	    options.button.popover('hide');
	});
	options.button.on('click', function(e){ e.preventDefault(); });
    }
});

E.ios_email_form = Backbone.View.extend({
    className: 'ios_email',
    initialize: function(opt){
        var _this = this;
        this.test_group = opt.test_group;
        this.on_close = opt.on_close;
        this.$header = $('<div>', {'class': 'ios_email_header'})
        .text(T('Be the first to get Hola for iPhone / iPad – Register now:'))
        .appendTo(this.$el);
        this.$form = $('<div>', {'class': 'ios_email_form'});
        this.$input = $('<input>', {'class': 'ios_email_input', 'placeholder':
            'Enter your email'})
        .appendTo(this.$form);
        $('<button>', {'class': 'ios_email_button'}).text(T('Submit'))
        .click(function(e){
            e.preventDefault();
            _this.submit();
        })
        .appendTo(this.$form);
        this.$form.appendTo(this.$el);
    },
    render: function(container){
        if (container)
            this.$el.appendTo(container);
        this.send('display');
        return this.$el;
    },
    submit: function(){
        var _this = this;
        var email = this.$input.val();
        if (!/.@.*\../.test(email))
        {
            this.error(T('Please enter a valid email address.'));
            return;
        }
        be.ios_email_submit();
        this.send('submit', email);
        this.$form.fadeOut(function(){
            _this.$el.append($('<span>', {'class': 'ios_email_message'})
                .text(T('We will be in touch with you soon')));
        });
        this.$header.text(T('Thank you!'));
        setTimeout(function(){ _this.remove(); }, 2000);
    },
    error: function(msg){
        var _this = this;
        var error_class = 'ios_email_input_error';
        etask([function(){
            _this.$input.addClass(error_class);
            return this.wait(1000);
        }, function(){
            _this.$input.removeClass(error_class);
        }]);
    },
    cancel: function(){
        be.ios_email_cancel();
        this.send('cancel');
        this.remove();
    },
    remove: function(){
        var _this = this;
        this.$el.fadeOut(function(){
            _this.$el.remove();
        });
        if (typeof(this.on_close)=='function')
            this.on_close();
    },
    send: function(id, email){
        // XXX alexeym: never should happens
        if (!this.test_group || this.triggered)
            return;
        if (['submit', 'cancel'].includes(id))
            this.triggered = true;
        id = 'www_ios_email_'+id;
        var info = {src_country: be.get('src_country'),
            lang: (navigator.language||'').replace('-', '_'),
            uuid: be.get('uuid'), group: this.test_group,
            impressions: storage.get_int('ios_email_popup_impressions')};
        if (email)
            info.email = email;
        be.perr({id: id, info: info});
    }
});

E.ios_email_form_modal = E.ios_email_form.extend({
    render: function(){
        var _this = this;
        var $header = $('<div>', {'class': 'ios_email_title'});
        var $close = $('<i>', {'class': 'ios_email_close'}).click(function(){
            _this.cancel();
        }).appendTo($header);
        $header.prependTo(this.$el);
        this.modal = new E.modal({$content: this.$el, empty: true, 'class':
            'ios_email_modal', modal: {backdrop: 'static'}, dark: true});
        this.modal.show();
        this.send('display');
    },
    remove: function(){
        this.modal.remove();
        if (typeof(this.on_close)=='function')
            this.on_close();
    }
});
return E; });

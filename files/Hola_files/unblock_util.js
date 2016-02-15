// LICENSE_CODE ZON
'use strict'; /*jslint node:true, browser:true*/
(function(){
var define;
var is_node = typeof module=='object' && module.exports;
if (!is_node)
    define = self.define;
else
    define = require('../../../util/require_node.js').define(module, '../');
define(['underscore', '/util/etask.js', '/util/country.js', '/util/url.js'],
    function(_, etask, zcountry, zurl){
var E = {};

/* XXX arik/marat: need unit-test for all file */

E.rule_class = function(rule){
    if (rule.type)
	return 'rule_vpn_'+rule.country;
    var s = 'rule_'+rule.sid+'_'+rule.name;
    /* XXX arik/mark hack: use property instead of class (so we can avoid
     * escaping for invalid class name handling) */
    return s.replace(/[:\/]/g, '_');
};

// XXX mark: merge with rule_class and rm obsolete options
E.rule_cls = function(rule){ return E.rule_class(rule)+' rule'; };

E.rule_unblock_url = function(rule, domain){
    domain = domain||rule.root_url;
    var country = (rule.country||'').toLowerCase();
    var pkg = rule.root_apk ? rule.root_apk[0] : '';
    if (rule.type=='apk')
	return '/access/apk/'+pkg+'/using/vpn-'+country;
    if (rule.type=='url')
    {
	return '/access/'+domain+'/using/vpn-'
	    +(rule.md5=='premium' ? 'full-' : '')+country;
    }
    return '/access/'+domain+'/using/'+rule.sid
	+(rule.name ? '/'+encodeURIComponent(rule.name) : '');
};

E.fmt_country = function(code){
    return zcountry.list[code.toUpperCase()] || code;
};

E.get_root_url = function(r){
    /* XXX arik hack: how to get valid domain from root_url array */
    if (r.link)
    {
	var link = (r.link||'').replace(/^www\./, '');
	return zurl.get_host(zurl.add_proto(link)+'/');
    }
    return (r.root_url[0]||'').replace(/^[*.]*/, '');
};

E.fix_icon_url = function(url){
    if (!url)
	return '';
    if (url[0]=='/')
	return url;
    if (url.startsWith('img/'))
	return '/'+url;
    if (!zurl.get_proto(url))
	return '//'+url;
    return url;
};

E.is_valid_domain = function(domain){
    if (!zurl.is_valid_domain(domain))
	return false;
    return !zurl.is_hola_domain(domain);
};

E.fmt_stars = function(rating){ return 0|rating*5||1; };

// XXX arik: mv to util
function capitlize(s){ return s ? s[0].toUpperCase()+s.slice(1) : ''; }

E.fmt_rule_name = function(rule, group){
    if (rule.type)
    {
        return rule.description ?  rule.description+' '+rule.name :
            rule.country.toUpperCase()+' VPN '+
            (rule.md5=='premium' ? 'Premium ' : '')+rule.name;
    }
    if (rule.description)
	return capitlize(rule.description);
    if (rule.name)
	return capitlize(rule.name);
    if (rule.script && rule.script.name)
	return capitlize(rule.script.name);
    if (group && group.script)
        return capitlize(group.script.name);
    return capitlize(rule.name);
};

return E; }); }());

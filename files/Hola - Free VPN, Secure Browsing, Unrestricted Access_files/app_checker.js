// LICENSE CODE ZON
'use strict'; /*jslint browser:true*/
define(['/util/user_agent.js', '/util/etask.js', '/svc/versions.js',
    '/util/version_util.js', 'backbone', '/svc/svc_ipc.js'],
    function(user_agent, etask, versions, version_util, Backbone,
    svc_ipc){
var b = user_agent.guess_browser();
var is_ext_inited, is_svc_inited;
var ext_etask, svc_etask;

// xxx pavlo: not working for MP use case now
function msg_post_recv(opt){
    var msg = opt.msg, on_msg;
    return etask([function(){
	on_msg = function(e){
	    if (e.source!=top || e.data.src==msg.src || e.data.id!=msg.id)
		return;
            this.econtinue(e.data);
	}.bind(this);
        try {
            // will init exception on cross origin frame access
            top.addEventListener('message', on_msg);
        } catch(e){
            this.econtinue();
            return;
        }
        top.postMessage(msg, '*');
	return this.wait(opt.timeout||5000);
    }, function ensure$(){
        // will init exception on cross origin frame access
        try { top.removeEventListener('message', on_msg); } catch(e){}
    }]);
}

function check_ext(opt){
    opt = opt||{};
    return msg_post_recv({timeout: opt.timeout||2000,
	msg: {src: 'hola_ccgi', id: 'callback'}});
}

function lean_check_ext(){ return svc_ipc.ext.lean_ping(); }

function is_plugin(exe){ return /\bhola_plugin/.test(exe); }

function check_svc(){
    return etask([function(){
        return svc_ipc.ajax('callback.json');
    }, function catch$(ret){
	throw {status: ret};
    }, function(ret){
        var data = ret.ret;
        var xhr = ret.xhr;
	return {data: data, status: xhr.statusText};
    }]);
}

var info_model = Backbone.Model.extend({
    is_latest_ext: function(){
        var _this = this;
        return etask([function(){
            return _this.get_ext_info();
        }, function(info){
            if (!info)
                return false;
            if (info.type=='cws_plugin')
            {
                return version_util.version_cmp(info.ver,
                    versions.chrome_dll) >= 0;
            }
            return version_util.version_cmp(info.ver,
                versions[info.build_info.browser_build]) >= 0;
        }]);
    },
    get_ext_info: function(){
        var _this = this;
        return etask([function(){
            if (is_ext_inited)
                return;
            return _this._check_ext();
        }, function(){
            is_ext_inited = true;
            return _this.get('ext_info');
        }]);
    },
    get_svc_info: function(){
        var _this = this;
        return etask([function(){
            if (is_svc_inited)
                return;
            return _this._check_svc();
        }, function(){
            is_svc_inited = true;
            return _this.get('svc_info');
        }]);
    },
    is_ext: function(){
        var _this = this;
        return etask([function(){
            return _this.get_ext_info();
        }, function(info){
            return !!info;
        }]);
    },
    is_svc: function(){
        var _this = this;
        return etask([function(){
            return _this.get_svc_info();
        }, function(info){
            return !!info;
        }]);
    },
    is_latest_svc: function(){
        var _this = this;
        return etask([function(){
            return _this.get_svc_info();
        }, function(info){
            if (!info)
                return false;
            return version_util.version_cmp(info.ver,
                versions.windows) >= 0;
        }]);
    },
    /**
     * Waits for svc.
     *
     * @param {number} [timeout] Timeout in seconds.
     * @returns {etask} Etask with svc info.
     */
    wait_for_svc: function(timeout){
        var _this = this;
        var spent = 0;
        return etask.efor(null, function(){ return etask.sleep(1000); },
        [function try_catch$(){
            spent++;
            // _check_svc() will not work if we are currently using 'https', so
            // call both, _check_ext() can provide svc info too.
            return etask.all({ext: _this._check_ext(), svc: _this
            ._check_svc()});
        }, function(){
            return _this.get_svc_info();
        }, function(info){
            if (info || timeout && spent==timeout)
                return this.ebreak(info);
        }]);
    },
    /**
     * Waits for latest svc.
     *
     * @returns {etask} Etask with svc info.
     */
    wait_for_new_svc: function(){
        var _this = this;
        return etask.efor(null, function(){ return etask.sleep(1000); },
        [function try_catch$(){
            // _check_svc() will not work if we are currently using 'https', so
            // call both, _check_ext() can provide svc info too.
            return etask.all({ext: _this._check_ext(), svc: _this
            ._check_svc()});
        }, function(){
            return _this.is_latest_svc();
        }, function(is_latest){
            if (is_latest)
                return this.ebreak(_this.get('svc_info'));
        }]);
    },
    /**
     * Waits for latest extension.
     *
     * @param {boolean} [lean=false] Whether we should check using image
     * {@link svc/svc_ipc.js:ext.lean_ping()}.
     * @returns {etask} Etask with extension info.
     */
    wait_for_new_ext: function(lean){
        var _this = this;
        var previous_init_ts = (_this.get('ext_info')||{}).init_ts;
        return etask.efor(null, function(){ return etask.sleep(1000); },
        [function try_catch$(){
            if (lean)
                return lean_check_ext();
            return _this._check_ext();
        }, function(e){
            if (lean)
            {
                if (!this.error)
                    return this.ebreak();
                return;
            }
            var new_info = !this.error && e;
            if (!new_info)
                return;
            // in chrome, chrome.webstore.install will succeed if extension is
            // already the the latest version, but the extension will not be
            // reinstalled (so init_ts will not change).
            if (b.browser=='chrome' && new_info.init_ts)
                return this.ebreak();
            if (previous_init_ts==new_info.init_ts)
                return;
            return this.ebreak(new_info);
        }]);
    },
    _set_ext_info: function(info){
        if (!info)
            return;
        this.set('ext_info', info);
        if (info.svc_info && !info.svc_info.plugin)
            this.set('svc_info', info.svc_info.raw);
    },
    _check_ext: function(){
        var _this = this;
        if (ext_etask)
            return ext_etask;
        this._set_ext_info(window.hola_extension_info);
        ext_etask = etask([function try_catch$(){
            return check_ext();
        }, function(e){
            ext_etask = null;
            if (this.error || !e || !e.data)
                return;
            _this._set_ext_info(e.data);
            return e.data;
        }]);
        return ext_etask;
    },
    _check_svc: function(){
        var _this = this;
        if (svc_etask)
            return svc_etask;
        svc_etask = etask([function try_catch$(){
            return check_svc();
        }, function(e){
            svc_etask = null;
            if (this.error || !e || !e.data)
                return;
            var info = e.data;
            if (is_plugin(info.exe))
                return;
            _this.set('svc_info', info);
        }]);
        return svc_etask;
    },
    check_hola_br: function(){
        var _this = this;
        return etask([function(){
            return _this.get_ext_info();
        }, function(ext){
            var t;
            var is_hola_cr = b.browser=='chrome' && !b.opera &&
                (t = window.navigator.mimeTypes) &&
                (t = t['application/x-hola-vlc-plugin']) && t.enabledPlugin;
            return {
                is_hola_ff: ext&&ext.hola_ff,
                is_hola_cr: is_hola_cr,
                is_hola_br: ext&&ext.hola_ff || is_hola_cr
            };
        }]);
    }
});

// Singleton.
return new info_model(); });

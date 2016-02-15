// LICENSE_CODE ZON
'use strict'; /*jslint node:true, browser:true*/
(function(){
var define;
var is_node = typeof module=='object' && module.exports;
if (!is_node)
    define = self.define;
else
    define = require('./require_node.js').define(module, '../');
define(['/util/array.js'], function(array){
var E = {};

E.rm_empty_last = function(a){
    if (a[a.length-1]==='')
	a.pop();
    return a;
};
E.split_trim = function(s, sep, limit){
    return array.compact_self(s.split(sep, limit)); };
E.split_ws = function(s){ return E.split_trim(s, /\s+/); };
E.qw = function(parts){
    if (!Array.isArray(parts))
        return E.split_ws(parts);
    // support ES6: qw`text text`
    var str = parts[0], res = [];
    for (var i = 1; i<parts.length; i++)
    {
        var arg = arguments[i];
        if (Array.isArray(arg))
        {
            res = res.concat(E.split_ws(str), arg);
            str = '';
        }
        else
            str += arg;
        str += parts[i];
    }
    if (str)
        res = res.concat(E.split_ws(str));
    return res;
};
E.chomp = function(s){ return s.replace(/\n$/, ''); };
E.split_crlf = function(s){
    return E.rm_empty_last(s.split(/\r?\n/)); };
E.split_nl = function(s){
    return E.rm_empty_last(s.split('\n')); };
E.to_array_buffer = function(s){
    var buf = new ArrayBuffer(s.length), buf_view = new Uint8Array(buf), i;
    for (i=0; i<s.length; i++)
        buf_view[i] = s.charCodeAt(i);
    return buf;
};
E.from_array_buffer = function(buf){
    return String.fromCharCode.apply(null, new Uint8Array(buf)); };
E.capitalize = function(s){
    s = ''+s;
    return (s[0]||'').toUpperCase()+s.slice(1);
};

return E; }); }());

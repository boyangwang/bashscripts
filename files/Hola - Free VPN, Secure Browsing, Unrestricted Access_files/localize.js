// LICENSE_CODE ZON
'use strict'; /*jslint browser:true*/
define(function(){
var E = get_message;

function get_message(str){
    if (arguments.length <= 1)
        return str;
    var args = Array.prototype.slice.call(arguments, 1);
    function match_arg(match, number){
        return args[number-1]!==undefined ? args[number-1] : match; }
    return str.replace(/\$(\d+)/g, match_arg);
}

return E; });

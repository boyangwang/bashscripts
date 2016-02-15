// LICENSE CODE ZON
'use strict'; /*jslint browser:true, es5:true*/
define(['angular_1_3_17', '/util/escape.js'], function(angular, zescape){
angular.module('angular_util', [])
.filter('zdate', ['$filter', function($filter){
    var formats = {short: 'dd-MMM-yyyy', long: 'dd-MMM-yyyy HH:mm:ss'};
    return function(date, format){
        return $filter('date')(date, formats[format]||formats.short); };
}]).filter('nl2br', ['$sce', function($sce){
    return function(input){
        return $sce.trustAsHtml((''+(input||'')).replace(/\n/g, '<br>')); };
}]).filter('uri_comp', function(){
    return zescape.uri_comp.bind(zescape);
});
});

// LICENSE CODE ZON
'use strict'; /*jslint browser:true*/
define(['angular_1_3_17', '/util/url.js', 'angular-ui-router',
    '/www/hola/pub/index2.js', '/www/util/pub/i18n.js',
    '/www/util/pub/language_selector_directive.js'],
    function(angular, zurl){
var E = {};

E.module = angular.module('app', ['ui.router', 'app.index', 'www.i18n',
    'www.language_selector'])
.config(['$locationProvider', config])
.run(['$translate', '$rootScope', 'i18n_helper', '$window',
    function($translate, $rootScope, i18n_helper, $window)
{
    $rootScope.language = i18n_helper.getCurrentLanguage();
    $rootScope.$on('$stateChangeSuccess', function(event, toState){
        if (!toState.data)
            return;
        if (toState.data.title)
            $rootScope.title = toState.data.title;
        if (toState.data.description)
            $rootScope.description = toState.data.description;
    });
    $rootScope.$on('$locationChangeStart', function(event, new_url){
        // XXX pavlo: only main page is under angular now, skip history api
        // for other urls
        var url_parts = zurl.parse(new_url);
        if (['/', '/index2'].includes(url_parts.pathname))
            return;
        event.preventDefault();
        $window.location.href = new_url;
    });
}]);

E.init = function(){
    angular.bootstrap(document, ['app']);
};

function config($locationProvider){
    $locationProvider.html5Mode(true); }

return E; });

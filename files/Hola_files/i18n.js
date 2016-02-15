// LICENSE_CODE ZON
'use strict'; /*jslint browser:true*/
define(['angular_1_3_17', '/util/storage.js', '/util/zerr.js',
    'angular-translate'],
    function(angular, storage, zerr){
angular.module('www.i18n', ['pascalprecht.translate'])
.config(['$translateProvider', 'supported_languages',
    function($translateProvider, supported_languages)
{
    // enable escaping of HTML only in translation parameters
    $translateProvider.useSanitizeValueStrategy('escapeParameters');
    $translateProvider.useLoader('translation_loader')
    .registerAvailableLanguageKeys(supported_languages)
    .determinePreferredLanguage()
    .useMissingTranslationHandler('missing_handler')
    .useStorage('local_storage')
    .fallbackLanguage('en');
}])
.run(['$rootScope', '$location', '$translate', 'supported_languages',
    function($rootScope, $location, $translate, supported_languages)
{
    $rootScope.$on('$stateChangeSuccess', function(){
        var hl = $location.search().hl;
        if (hl && supported_languages.includes(hl))
            $translate.use(hl);
    });
}])
// XXX pavlo: get supported languages from server side
.constant('supported_languages', ['en', 'es'])
.factory('i18n_helper', ['$translate', function($translate){
    return {getCurrentLanguage: getCurrentLanguage};

    function getCurrentLanguage(){
        return $translate.proposedLanguage() || $translate.use(); }
}])
.factory('local_storage', function(){
    return {
        put: function(name, value){ storage.set(name, value); },
        get: function(name){ return storage.get(name); }
    };
})
.factory('missing_handler', function(){
    return function(translationID){
        zerr.warn('Missing translation for: "'+translationID+'"'); };
})
// custom name for translate filter
.filter('t', ['$filter', function($filter){ return $filter('translate'); }])
.factory('translation_loader', ['$q', 'supported_languages',
    function($q, supported_languages)
{
    return function(options){
        var deferred = $q.defer();
        // XXX pavlo: https://github.com/angular-translate/angular-translate/issues/1390
        if (!supported_languages.includes(options.key))
        {
            deferred.reject(options.key);
            return deferred.promise;
        }
        // XXX pavlo: url must be dynamic ot use it in lum/cdn in future
        require(['text!/www/hola/pub/locale/hola_'+options.key],
            function(locale){ deferred.resolve(JSON.parse(locale)); },
            function(){ deferred.reject(options.key); }
        );
        return deferred.promise;
    };
}]);

});

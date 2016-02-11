// LICENSE_CODE ZON
'use strict'; /*jslint browser:true*/
define(['angular_1_3_17', '/svc/pub/locale/be_en.js', '/www/util/pub/i18n.js'],
    function(angular, be_en){
angular.module('www.language_selector', ['www.i18n'])
.controller('language_selector_controller', ['i18n_helper', '$translate',
    '$state', 'supported_languages', '$document', '$timeout', '$rootScope',
    language_selector_controller])
.directive('languageSelector', language_selector);

function language_selector(){
    return {
        controller: 'language_selector_controller',
        controllerAs: 'vm',
        templateUrl: '/www/util/views/language_selector_directive.html?md5=301-ac83912c'
    };
}

function language_selector_controller(i18n_helper, $translate, $state,
    supported_languages, $document, $timeout, $rootScope)
{
    var _this = this;
    this.$translate = $translate;
    this.$state = $state;
    this.languages = {};
    this.current_language = i18n_helper.getCurrentLanguage();
    $rootScope.$on('$translateChangeEnd', function(event, args){
      _this.current_language = args.language; });
    supported_languages.forEach(function(code){
        _this.languages[code] = be_en['locale_en_'+code].message.split(' ')
        .slice(1).join(' ');
    });
    $document.find('body').click(function(){
        $timeout(function(){ _this.is_opened = false; });
    });
}

language_selector_controller.prototype.change = function($event, code){
    // stop click bubbling to current language block
    $event.stopPropagation();
    this.current_language = code;
    this.$translate.use(this.current_language);
    this.$state.go(this.$state.current, {}, {reload: true});
    this.is_opened = false;
};

language_selector_controller.prototype.list_toggle = function($event){
    // stop click bubbling to body
    $event.stopPropagation();
    this.is_opened = !this.is_opened;
};

});

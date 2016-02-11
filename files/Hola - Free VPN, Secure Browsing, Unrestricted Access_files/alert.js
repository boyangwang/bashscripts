// LICENSE CODE ZON
'use strict'; /*jslint browser:true, es5:true*/
define(['angular_1_3_17', 'jquery'], function(angular){
angular.module('alert', [])
.factory('alert', ['$rootScope', function($rootScope){
    var id_counter = 0;
    var alerts = {};
    function $alert(opts){
        var a = {};
        opts = opts||{};
        if (typeof opts=='string')
            opts = {text: opts};
        this.id = opts.id||++id_counter;
        this.text = opts.text||'';
        this.type = opts.type||'info';
        this.duration = opts.duration||0;
        this.dismissible = opts.dismissible||true;
        return a.id;
    }
    $alert.prototype.remove = function(){
        create_alert.remove(this.id); };
    function create_alert(opts){
        var a = new $alert(opts);
        alerts[a.id] = a;
        $rootScope.$broadcast('create_alert', a);
        return a;
    }
    create_alert.remove = function(id){
        if (alerts[id] && !alerts[id].duration)
        {
            $rootScope.$broadcast('remove_alert', {id: id});
            delete alerts[id];
        }
    };
    return create_alert;
}]).directive('alertsArea', ['$compile', function($compile){
    function get_id(id){ return 'alert_'+id; }
    return {
        scope: {},
        link: function(scope, elm){
            elm.css({position: 'fixed', 'z-index': 999});
            elm.width(elm.parent().width());
            scope.$on('create_alert', function(event, a){
                var d = angular.element('<div data-alert-item="'+a.text+
                    '"></div>');
                var id = get_id(a.id), _alert = elm.find('#'+id);
                function show(){
                    d.hide();
                    elm.append($compile(d)(scope));
                    d.fadeIn(100);
                }
                if (a.type=='error')
                    a.type = 'danger';
                ['type', 'duration', 'dismissible'].map(function(k){
                    d.attr(k, a[k]); });
                d.attr('id', id);
                if (!_alert.length)
                    return void show();
                if (_alert.is(':animated'))
                {
                    _alert.remove();
                    return void show();
                }
                _alert.fadeOut({
                    duration: 100,
                    done: function(){ this.remove(); },
                    always: show
                });
            });
            scope.$on('remove_alert', function(event, a){
                var _alert = elm.find('#'+get_id(a.id));
                if (_alert.length)
                    _alert.fadeOut(100, function(){ this.remove(); });
            });
        }
    };
}]).directive('alertItem', ['$timeout', function($timeout){
    return {
        scope: {text: '@alertItem', dismissible: '@', type: '@',
            duration: '@'},
        template: '<div ng-class="{\'alert-dismissible\':dismissible}" '+
        'class="alert alert-{{type}}" role="alert" style="opacity:.95;">'+
        '<button ng-if="dismissible" ng-click="close()" type="button" '+
        'class="close" aria-label="Close"><span aria-hidden="true">&times;'+
        '</span></button>{{text}}</div>',
        link: function(scope, elm){
            scope.close = function(){
                elm.fadeOut('slow', function(){ elm.remove(); }); };
            if (+scope.duration)
                $timeout(scope.close, scope.duration);
        }
    };
}]); });

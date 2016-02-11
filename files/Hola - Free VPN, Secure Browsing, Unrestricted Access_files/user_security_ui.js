// LICENSE CODE ZON
'use strict'; /*jslint browser:true, es5:true*/
define(['angular_1_3_17',  '/util/etask.js', '/www/util/pub/ui_angular.js',
    '/www/login/pub/user_security.js', '/www/util/pub/alert.js'],
    function(angular, etask){

angular.module('user_security_ui', ['ui_angular', 'user_security', 'alert'])
.directive('buttonLogoutSessions', ['user_security', 'alert',
    function(user_security, $alert)
{
    return {
        scope: {},
        template: '<a href>Logout all sessions except me</a> '+
            '<span data-spinner="loading"></span>',
        link: function($scope, $elm){
            $elm.find('a').bind('click', function(){
                if ($scope.loading)
                    return;
                etask([function try_catch$(){
                    $scope.loading = true;
                    return user_security.logout_sessions();
                }, function(){
                    $scope.loading = false;
                    $alert({
                        id: 'logout_all_sessions',
                        text: (this.error ? 'Unsuccessful' : 'Successful')
                            +' logout all sessions except me',
                        type: this.error ? 'error' : 'success',
                        duration: this.error ? 0 : 2000
                    });
                }]);
            });
        }
    };
}]).directive('formChangePassword', ['user_security', 'alert',
    function(user_security, $alert)
{
    return {
        scope: {flag: '=formChangePassword'},
        templateUrl: '/www/login/pub/form_change_password.html',
        link: function(scope, elm){
            scope.master = {old_pass: '', new_pass: ''};
            scope.reset = function(){
                scope.submitted = false;
                scope.password = angular.copy(scope.master);
            };
            scope.update = function(form, password){
                if (scope.loading)
                    return;
                var opts = {id: 'change_password'};
                etask([function try_catch$(){
                    scope.submitted = true;
                    if (!password.old_pass || !password.new_pass)
                    {
                        $alert(angular.extend(opts,
                            {text: 'Please fill all fields', type: 'error'}));
                        return this.ereturn();
                    }
                    scope.loading = true;
                    return user_security.change_password(password);
                }, function(res){
                    scope.loading = false;
                    $alert({
                        id: 'change_password',
                        text: this.error ? 'Current password is incorrect' :
                            'Password successfully  changed',
                        type: this.error ? 'error' : 'success',
                        duration: this.error ? 0 : 3000,
                    });
                    if (this.error)
                        return void(password.old_pass = '');
                    scope.reset();
                    scope.flag = !scope.flag;
                }]);
            };
            scope.reset();
            scope.$watch(function(){
                return elm.is(':visible');
            }, function(){
                if (!elm.is(':visible'))
                    return void $alert.remove('change_password');
                scope.reset();
                scope.change_password.$setPristine();
            });
        }
    };
}]);

});

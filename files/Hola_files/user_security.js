// LICENSE CODE ZON
'use strict'; /*jslint browser:true, es5:true*/
define(['angular_1_3_17', '/util/etask.js', 'login_config'],
    function(angular, etask, login_config){

angular.module('user_security', []).service('user_security', ['$http',
    'product_name', function($http, product_name)
{
    var prefix = login_config.url_prefix;
    var _this = this;
    this.logout_sessions = function(){
        return etask([function(){
            return $http.post(prefix+'/users/logout/others');
        }, function(result){
            if (result.status!=200 || result.data!=='ok')
                throw new Error('Fail');
        }]);
    };
    this.change_password = function(opts){
        opts = opts||{};
        return etask([function(){
            return $http.post(prefix+'/users/change_password', {
                password: opts.old_pass,
                new_pass: opts.new_pass,
                service: true
            });
        }, function(){
            return _this.logout_sessions();
        }]);
    };
}]);

});

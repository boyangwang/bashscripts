// LICENSE CODE ZON
'use strict'; /*jslint browser:true, es5:true*/
define('/www/hola/pub/ensure_login.js', ['angular_1_3_17', '/util/etask.js'],
    function(angular, etask){

angular.module('ensure_login', [])
.provider('ensure_login', function(){
    var config, user;
    this.configure = function(_config){ config = _config; };
    this.$get = ["$http", "$window", function($http, $window){
        function get_url(should_redirect){
            return (typeof should_redirect=='string') ?
                should_redirect : config.redirect;
        }
        return {
            get_user: function(){
                if (!user)
                    this.load();
                return user;
            },
            load: function(){
                if (!config)
                    return;
                user = etask([function try_catch$(){
                    return $http.get(config.user);
                }, function(response){
                    var data = response.data;
                    if (this.error||data=='null')
                        data = null;
                    var should_redirect = config.condition ?
                        config.condition(data) : !data;
                    if (should_redirect)
                        $window.location.href = get_url(should_redirect);
                    return data;
                }]);
            }
        };
    }];
})
.run(['ensure_login', function(ensure_login){
     ensure_login.load();
}]);

});

// LICENSE CODE ZON
'use strict'; /*jslint browser:true*/
define(['virt_jquery_all', 'bootstrap', 'backbone',
    'text!installation_templates'],
    function($, bootstrap, Backbone, installation_templates){
installation_templates = $(installation_templates);

return Backbone.View.extend({
    initialize: function(){
        this.$modal = installation_templates.find('#mp-installed-popup')
        .clone().hide();
    },
    show: function(){
        this.$modal.modal();
        // Play 3 times.
        var $video = $('video', this.$modal);
        $video.on('loadeddata', function(){ this.play(); });
        var max = 2;
        $video.on('ended', function(){
          if (max > 0)
            this.play();
          max--;
        });
    }
});

});

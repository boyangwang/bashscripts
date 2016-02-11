// LICENSE_CODE ZON
'use strict'; /*jshint browser:true, es5:true*/
define(['virt_jquery_all'], function($){
    var tpl = [
        '<svg viewBox="0,0,200,200">',
        '<circle class="progress-circle-back" r="80" cx="100" cy="100"></circle>',
        '<path class="progress-circle-filled"></path>',
        '</svg>',
    ].join('');
    var open_circle_path = function(angle){
        angle = angle==360 ? 360 : (angle||0)%360;
        var ex = Math.cos(angle/180*Math.PI)*80+100;
        var ey = Math.sin(angle/180*Math.PI)*80+100;
        var base = 'M180,100 A80,80 0 0,1 ';
        if (angle>90)
            base += '100,180 A80 80 0 0,1 ';
        if (angle>180)
            base += ' 20,100 A80 80 0 0,1 ';
        if (angle>270)
            base += '100, 20 A80 80 0 0,1 ';
        return base+ex+' '+ey;
    };
    var buildInside = function($el){
        $el.html(tpl);
    };
    var cycle_log = function(){
        if (!this.log_running)
            return;
        this.current_angle += (330-this.current_angle)/600;
        this.$path.attr('d', open_circle_path(this.current_angle));
        window.requestAnimationFrame(cycle_log.bind(this));
    };
    var cycle_spin = function(v){
        this.spin_timeout = setTimeout(cycle_spin.bind(
            this, v==30 ? 80 : 30), 2400);
        this.set_progress(v, {speed: 1});
    };
    var cycle_set_progress = function(){
        if (!this.running)
            return;
        var d = this.target-(0|this.current_angle);
        if (Math.abs(d)<this.speed)
        {
            this.current_angle = this.target;
            this.running = false;
        } else
            this.current_angle = (this.current_angle||0)+
                (d<0 ? -1 : 1 )*this.speed;
        this.$path.attr('d', open_circle_path(this.current_angle));
        if (this.running)
            window.requestAnimationFrame(cycle_set_progress.bind(this));
    };
    var circularProgress = {
        set_progress: function(v, opt){
            opt = opt||{};
            this.target = v*360/100;
            if (!opt.speed)
            {
                this.$path.attr('d', open_circle_path(
                    this.current_angle = this.target));
                this.running = false;
                return;
            }
            this.speed = opt.speed||Infinity;
            if (!this.running)
            {
                this.running = true;
                cycle_set_progress.call(this);
            }
        },
        set_rotate: function(rotate){
            this.$path.parents('.circle_progress')
                [rotate ? 'addClass' : 'removeClass']('rotate');
        },
        set_spin_mode: function(mod){
            if (mod==this.current_mod)
                return;
            this.log_running = false;
            this.spin_timeout = clearTimeout(this.spin_timeout);
            if (mod=='spinner')
               cycle_spin.call(this, 30);
            if (mod=='log')
            {
                this.current_angle = 0;
                this.log_running = true;
                cycle_log.call(this);
            }
            this.current_mod = mod;
        },
    };

    $.fn.circularProgress = function(opt){
        opt = opt||{};
        var args = arguments;
        return this.each(function(){
            var $el = $(this);
            var c;
            if (typeof(opt)=='string')
            {
                if ((c = $el.data('circularProgress')) && c[opt])
                    return c[opt](args[1]);
                else
                    return;
            }
            buildInside($el);
            c = Object.create(circularProgress);
            c.$path = $el.find('.progress-circle-filled');
            c.set_progress(0|opt.progress);
            c.set_spin_mode(opt.mode||'progress');
            c.set_rotate(!!opt.rotate);
            $el.data('circularProgress', c);
        });
    };
});

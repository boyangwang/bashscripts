// LICENSE CODE ZON
'use strict'; /*jslint browser:true, es5:true*/
define('/www/hola/pub/mplayer.js', ['virt_jquery_all', 'underscore',
    '/www/hola/pub/util.js', '/util/url.js', '/www/hola/pub/site.js',
    '/svc/mp/pub/msg.js', '/www/hola/pub/download.js',
    '/util/user_agent.js'],
    function($, _, www_util, zurl, site, mp_msg, download, user_agent){
var E = {};
var $frame = null;
var last_video_title = '';
var BASE_CDN_URL = 'http://holagrowth.s3-website-us-east-1.amazonaws.com/';
var BASE_PUB_URL = 'http://cdn4.hola.org/static/mp4/';
var play_on_ready = false;
var url_o = zurl.parse(location.href);
var hash_o = zurl.qs_parse((url_o.hash||'').substr(1));

E.init = function(opt){
    opt = opt||{};
    var base_url = opt.is_pub ? BASE_PUB_URL : BASE_CDN_URL;
    mp_msg.init('web');
    $('.torrent_magnet_link, .torrent_download_link, '
        +'.torrent_block .block_category')
    .on('mouseenter mousemove', function(){
        attach_player.call(this, base_url); }).mouseleave(delete_later);
    $('.torrent_video').on('click', function(){
        var $this = $(this);
        var $block = $this.parents('.torrent_block');
        var player_params = {
            movie: base_url+$block.attr('rel'),
            subtitle: $block.attr('sub1'),
            start: $block.attr('start'),
        };
        if ($frame && $frame.attr('data-movie')!=player_params.movie)
            delete_frame();
        if ($frame)
            delete_later.cancel();
        else
        {
            var frame_html = get_frame_html(player_params);
            $frame = $(frame_html).attr('data-movie', player_params.movie)
            .appendTo('body');
            last_video_title = $block.find('.block_category').text();
        }
        play_on_ready = true;
    });
    window.addEventListener('message', function(e){
        var info = mp_msg.parse(e.data);
        if (!info || info.dst!='web')
            return;
        switch (info.id)
        {
        case 'mp.ready': on_mp_ready(); break;
        case 'mp.open': delete_later.cancel(true); break;
        case 'mp.resize': resize_frame(e.data); break;
        case 'mp.close': delete_frame(); break;
        }
    });
};

function get_frame_html(replace_obj){
    var str = '<iframe id="mplayer-frame" src="/be_mp_popover'
    +'#demo=%movie&sub1=%subtitle&start=%start&use_ext=1" '
    +'style="position: absolute; box-sizing: content-box; '
    +'border: 5px solid transparent; overflow: hidden; width: 162px; '
    +'height: 122px; left: 0; top: 0; z-index: 9999" '
    +'allowTransparency="true"></iframe>';
    replace_obj = _.extend({movie: 'popeye.mp4', subtitle: '',
        start: ''}, replace_obj);
    $.each(replace_obj, function(key, val){
        str = str.replace('%'+key, encodeURIComponent(val)); });
    return str;
}

function attach_player(base_url){
    var $this = $(this);
    var $block = $this.parents('.torrent_block');
    var offset = $this.offset();
    var player_params = {
        movie: base_url+$block.attr('rel'),
        subtitle: $block.attr('sub1'),
        start: $block.attr('start'),
    };
    if ($frame && $frame.attr('data-movie')!=player_params.movie)
        delete_frame();
    if ($frame)
        delete_later.cancel();
    else
    {
        var frame_html = get_frame_html(player_params);
        $frame = $(frame_html).attr('data-movie', player_params.movie)
        .attr('data-movie', player_params.movie)
        .mouseenter(delete_later.cancel)
        .mouseleave(delete_later).appendTo('body');
        last_video_title = $block.find('.block_category').text();
    }
    $frame.css({left: offset.left-5+'px', top: offset.top
        +(this.tagName=='DIV' ? 27 : 20)+'px'});
}

function on_mp_ready(){
    if (!$frame || !$frame[0].contentWindow)
        return;
    frame_send({id: 'set_title', title: last_video_title});
    if (play_on_ready)
    {
        frame_send({id: 'playnow'});
        play_on_ready = false;
    }
}

function frame_send(msg){
    mp_msg.send('ifr', msg, {remote: $frame[0].contentWindow}); }

function resize_frame(opt){
    if (!$frame)
        return;
    $frame.width(opt.width).height(opt.height);
    if (opt.width=='100%'||opt.height=='100%')
        $frame.css('border', 0);
    if (opt.top)
        $frame.css({top: opt.top});
    if (opt.left)
        $frame.css({left: opt.left});
    if (opt.position)
        $frame.css({position: opt.position});
    if (opt.fullscreen)
    {
        $frame.attr('allowfullscreen', 'true')
        .attr('webkitallowfullscreen', 'true')
        .attr('mozallowfullscreen', 'true');
    }
}

function delete_frame(){
    if (!$frame)
        return;
    $frame.remove();
    $frame = null;
    delete_later.cancelled = false;
}

function delete_later(){
    if (delete_later.t)
        delete_later.cancel();
    if (delete_later.cancelled)
        return;
    delete_later.t = setTimeout(function(){
        delete_frame();
        delete_later.t = null;
    }, 250);
}

delete_later.t = null;
delete_later.cancelled = false;
delete_later.cancel = function(sticky){
    if (sticky===true) // might also be an event
        delete_later.cancelled = true;
    if (delete_later.t===null)
        return;
    delete_later.t = clearTimeout(delete_later.t);
};

return E; });

// LICENSE_CODE ZON
'use strict'; /*jslint browser:true*/
define(['jquery', '/util/escape.js'], function($, zescape){
var E = {};
function open_new_window(event){
    window.open(this.href, '_blank', 'height=500,width=900');
    return false;
}

E.init_sharing = function(options){
    var tweet, share_url, facebook;
    options = options||{};
    if (options.torch)
    {
	tweet = {
	    url: 'http://bit.ly/HolaTorch',
	    text: 'Check out Hola for @TorchBrowser, I can now access blocked '
	    +'sites from any country!'
	};
	share_url = 'http://bit.ly/HolaTorch';
	facebook = {
	    s: 100,
	    'p[url]': share_url,
	    'p[images][0]': 'https://cdn4.hola.org/img/torch-logo.jpg',
	    'p[title]': 'Make your Internet better with Hola for Torch '
	    +'Browser',
	    'p[summary]': "I'm using Hola for Torch to view sites that are "
	    +'blocked in my country, and surf faster!'
	};
    }
    else
    {
	tweet = {
	    url: 'https://hola.org',
	    via: 'hola_org',
	    text: 'Check out Hola: it lets you access censored sites '
	    +'from anywhere in the world!',
	    hashtags: 'hola_org'
	};
	share_url = 'https://hola.org';
	facebook = {u: share_url};
    }
    $('.share-twitter').attr('href', 'https://twitter.com/intent/tweet?'
	+zescape.qs(tweet)).click(open_new_window);
    $('.share-googleplus').attr('href', 'https://plus.google.com/share?'
	+zescape.qs({url: share_url})).click(open_new_window);
    $('.share-facebook').attr('href',
	'https://www.facebook.com/sharer/sharer.php?'
	+zescape.qs(facebook)).click(open_new_window);
};

return E; });

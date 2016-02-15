// LICENSE_CODE ZON
'use strict'; /*jslint browser:true*/
define(['jquery'], function($){
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
// XXX mark: rewrite so that loop counter isn't altered inside the loop
function normalize(tag){
    var count = tag.childNodes.length;
    for (var i=0; i<count; i++)
    {
        var child = tag.childNodes[i];
        if (child.nodeType==ELEMENT_NODE)
        {
            normalize(child);
            continue;
        }
        if (child.nodeType!=TEXT_NODE)
            continue;
        var next = child.nextSibling;
        if (!next||next.nodeType!=TEXT_NODE)
            continue;
        var new_node = tag.ownerDocument.createTextNode(child.nodeValue
            +next.nodeValue);
        tag.insertBefore(new_node, child);
        tag.removeChild(child);
        tag.removeChild(next);
        i--;
        count--;
    }
}
// XXX mark: rewrite so that loop counter isn't altered inside the loop
function highlight(tag, uc_str){
    if (tag.nodeType==TEXT_NODE)
    {
        var pos = tag.data.toUpperCase().indexOf(uc_str);
        if (pos!=-1)
        {
            var span = document.createElement('span');
            span.className = 'page-search-hl';
            var middlebit = tag.splitText(pos);
            var endbit = middlebit.splitText(uc_str.length);
            var middleclone = middlebit.cloneNode(true);
            span.appendChild(middleclone);
            middlebit.parentNode.replaceChild(span, middlebit);
            return 1;
        }
        return 0;
    }
    if (tag.nodeType==ELEMENT_NODE && tag.childNodes &&
        tag.tagName!='script' && tag.tagName!='style')
    {
        for (var i=0; i<tag.childNodes.length; i++)
            i += highlight(tag.childNodes[i], uc_str);
    }
    return 0;
}

$.fn.page_search = function(search){
    return this.each(function(){ highlight(this, search.toUpperCase()); }); };

$.fn.page_search_clear = function(){
    return this.find("span.page-search-hl")
    .each(function(){
        var parent = this.parentNode;
        parent.replaceChild(this.firstChild, this);
        normalize(parent);
    })
    .end();
};
return $; });

// LICENSE CODE ZON
'use strict'; /*jslint browser:true, es5:true*/
define(['angular_1_3_17', 'jquery', '/util/date.js', '/util/angular_util.js',
    'bootstrap-datepicker', 'jsonview'], function(angular, $, date){

angular.module('ui_angular', ['angular_util'])
.service('link_focus_fix', function(){
    $(document).on('click', 'a', function(){ $(this).blur(); });
}).directive('spinner', function(){
    return {
        scope: {loading: '=spinner'},
        template: '<img style="display:inline;" ng-show="loading" '+
            'src="/www/util/pub/img/spinner_14.gif">',
    };
}).directive('zdatepicker', function(){
    var options = ['autoclose', 'format', 'endDate'];
    function link(scope, elm){
        function get_val(){
            return elm.prop('tagName')=='INPUT' ? elm.val() :
                elm.find('input').val();
        }
        var opts = scope.opts||{};
        options.forEach(function(opt){
            if (scope[opt]!==undefined)
                opts[opt] = scope[opt];
        });
        if (elm.hasClass('input-group'))
            elm.addClass('date');
        var dp = elm.datepicker(opts);
        scope.$watch('value', function(value){
            if (!value||elm.datepicker('getDate')==value)
                return;
            setTimeout(function(){ elm.datepicker('setDate', value); }, 0);
        });
    }
    var scope = {opts: '=zdatepicker', value: '=value'};
    options.forEach(function(opt){ scope[opt] = '@'+opt; });
    return {link: link, scope: scope};
}).directive('checkboxTable', ['$filter', function($filter){
    function link(scope, elm){
        var fields, _fields;
        function init_fields(){
            var i = 0;
            if (_fields==scope._fields)
                return;
            _fields = scope._fields||{};
            fields = [];
            for (var f in _fields)
            {
                _fields[f].field = f;
                _fields[f].pos = _fields[f].pos||i;
                fields.push(_fields[f]);
                if (_fields[f].sort)
                    scope.sort = (_fields[f].sort=='desc' ? '-' : '')+f;
                i++;
            }
            fields.sort(function(a, b){
                if (a.pos>b.pos)
                    return 1;
                if (a.pos<b.pos)
                    return -1;
                return 0;
            });
            scope.fields = fields;
        }
        function init_sum(){
            for (var i=0; i<fields.length; i++)
            {
                if (!fields[i].sum)
                    continue;
                fields[i]._sum = 0;
                scope.has_sum = true;
            }
        }
        function inc_sum(item, sign){
            if (!scope.has_sum)
                return;
            sign = sign||sign===undefined ? 1 : -1;
            for (var i=0; i<fields.length; i++)
            {
                if (!fields[i].sum)
                    continue;
                var val = item[fields[i].field];
                fields[i]._sum += sign*(isNaN(val) ? 0 : val);
            }
        }
        init_fields();
        scope.toggle_items = function(checked){
            scope.items_checked = checked;
            init_sum();
            for (var i=0; i<scope.items.length; i++)
            {
                scope.items[i]._checked = scope.items_checked;
                if (scope.items[i]._checked)
                    inc_sum(scope.items[i]);
            }
        };
        scope.check_item = function(item){
            inc_sum(item, item._checked);
            for (var i=0; i<scope.items.length; i++)
            {
                if (!scope.items[i]._checked)
                    return scope.items_checked = false;
            }
            scope.items_checked = true;
        };
        scope.show_val = function(val, field){
            return field.format ? $filter(field.format)(val) : val; };
        scope.click_item = function(item, field, event){
            if (field.link_hook)
                return field.link_hook(item[field.field]);
            field.click(event, item, field);
        };
        scope.check_link = function(item, field){
            return +!!(field.link_hook||field.click); };
        scope.items_checked = scope.checked;
        scope.$watch('_fields', init_fields);
        scope.$watch('items', function(items){
            if (!items)
                return;
            scope.toggle_items(!!scope.items_checked);
        });
    }
    return {link: link,
        templateUrl: '/www/util/views/angular/checkbox_table.html', scope: {
        items: '=checkboxTable', _fields: '=fields', disabled: '=',
        checked: '='}};
}]).directive('jsonview', function(){
    return {
        scope: {toggle: '@withToggle'},
	link: function(scope, elm, attrs){
            var data, collapsed = true;
	    scope.$watch(attrs.jsonview, function(_data){
                data = _data;
		elm.JSONView(data||{}, {collapsed: collapsed}); });
            if (!scope.toggle)
                return;
            elm.before('<a href class="toggle">Toggle</a>');
            elm.parent().find('.toggle').on('click', function(){
                collapsed = !collapsed;
                elm.JSONView(data||{}, {collapsed: collapsed});
                return false;
            });
	},
    };
});
});


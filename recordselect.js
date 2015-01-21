/*
* 0.0.4
* 添加了选择 value_field, 可兼容老版本
* 0.0.3
* 添加每页多少个 pre_page
* 添加总数计算
* 重新搜索的时候重新定义回第一页
*/

var $ = require('jquery');
require('./css/recordselect.css');
var cdn_path = "http://agideo-cdn.b0.upaiyun.com/modules/recordselect/0.0.1/";

function Recordselect(obj, url, options) {
  this.current = null;
  this.obj = $(obj);
  this.obj.addClass("record-select");
  this.obj.addClass("rs-label");
  this.hidden_input = $("<input type='hidden' class='value'>"); // value for ultimus
  this.container = $("<div class='record-select-container record-select'></div>");
  this.url = url;
  this.page = 1;
  this.per_page = 10;
  this.options = options || {};

  if(this.options.value_field === undefined ) {
    this.options.value_field = "label|||value"
  }
}

Recordselect.prototype.do_find = function() {
  var el = this;

  $.ajax({
    url: this.url,
    data: {
      'page': this.page,
      'search': this.obj.val(),
      'per_page': this.per_page
    },
    dataType: "jsonp",
    jsonpCallback: 'fun_' + (new Date()).getTime(),
    // jsonpCallback: 'tom2cjp',
    success: function(data) {
      if (data.msg) {
        alert(data.msg);
      } else {
        el._generate_list(data, data.total_entries);
        el.highlight(el.container.find('li.record:first')); // #OPTMIZE
        el.container.find("li.record:even").addClass("even");
        el.show_container();

        $("body").bind('mousedown', function(ev) { el.onbodyclick(ev); });
      }
    }
  });
}

Recordselect.prototype._generate_list = function(data) {
  this.container.empty();
  var $ol = $('<ol></ol>').appendTo(this.container);

  $ol.append("<li class='found'>第 " + this.page + " 页</li>");
  if (this.page > 1) $ol.append("<li class='pagination previous'><a href='javascript:void(0)'><img src='" + cdn_path + "/previous.gif' />上一页</a></li>");
  $.each(data.items, function(i, item) {
    $ol.append($("<li class='record'><a href='javascript:void(0)'>" + item.label + "</a><input type='hidden' value='" + item.value + "' /></li>"));
  });
  if (data.total_entries > (this.per_page * this.page)) $ol.append("<li class='pagination next'><a href='javascript:void(0)'>下一页<img src='" + cdn_path + "next.gif' /></a></li>");
}

Recordselect.prototype.show_container = function() {
  // 还要找原因
  // var offset = this.obj.offset();
  // this.container.css('left', offset.left);
  // this.container.css('top', (this.obj.outerHeight() + offset.top));

  this.container.show();
}

Recordselect.prototype.is_open = function() {
  return this.container.html().length > 0;
}

Recordselect.prototype.set = function(value, label) {
  this.obj.val(label);

  if (this.options.value_field == "label|||value")
    this.hidden_input.val(lable + '|||' + value);
  else if (this.options.value_field == "value")
    this.hidden_input.val(value);
  else if (this.options.value_field == "label") {
    this.hidden_input.val(label);
  }
}

Recordselect.prototype.onbodyclick = function(ev) {
  if (!this.is_open()) return;
  var $ancestors = $(ev.target).parents().andSelf();
  if ($ancestors.filter(this.container).size() > 0 || $ancestors.filter(this.obj).size() > 0) return;
  this.close();
}

Recordselect.prototype._init = function() {
  this.obj.after(this.container);
  this.obj.after(this.hidden_input);
  this.container.hide();
  if (this.options.width) this.obj.css('width', this.options.width);
  // move name from obj to hidden_input
  this.hidden_input.attr("name", this.obj.attr("name"));
  this.obj.attr("name", '');
  this.obj.attr("autocomplete", 'off');

  //init values
  if (this.obj.val().length > 0) {
    var val_arr = this.obj.val().split('|||', 2);
    this.set(val_arr[1], val_arr[0]);
  }
  // event
  if (!this.obj.attr('readonly')) {  // control readonly in html
    this._event_handler(this.obj);
  }
}

Recordselect.prototype.onkeyup = function(event) {
  var elem, try_find;

  switch( event.keyCode ) {
  case 13://keyCode.ENTER
    if (this.current) this.current.find('a').click();
    break;
  case 27://Event.KEY_ESC:
    this.close();
    break;
  case 37://Event.KEY_LEFT:
    break;
  case 38://Event.key_UP:
    if (this.current) {
      elem = this.current.prev();
      if (elem.hasClass('record')) this.highlight(elem);
    }
    break;
  case 39://Event.KEY_RIGHT:
    break;
  case 40://Event.KEY_DOWN:
    if (this.current) {
      elem = this.current.next();
      if (elem.hasClass('record')) this.highlight(elem);
    }
    break;
  default:
    try_find = true;
  }

  if (try_find) {
    try_find = false;
    this.clear_hidden_input();
    var el = this;
    this.page = 1;
    clearTimeout(this.timer);
    this.timer = setTimeout(function() { el.do_find(); }, 0.35 * 1000 + 50);
  }
}

Recordselect.prototype.highlight = function(obj) {
  if (this.current) this.current.removeClass('current');
  this.current = obj;
  obj.addClass('current');
}

Recordselect.prototype.onselect = function(id, value) {
  if (this.options.onchange) this.options.onchange(id, value);
  this.set(id, value);
  this.close();
}

Recordselect.prototype.do_prev_page = function() {
  if (this.page > 1) this.page -= 1; this.do_find();
}

Recordselect.prototype.do_next_page = function() {
  this.page += 1; this.do_find();
}

Recordselect.prototype._event_handler = function() {
  var el = this;
  this.container.delegate("a", "click", function() {
    var $li = $(this).parent();
    if ($li.hasClass('record')) {
      el.onselect($(this).next("input").val(), $(this).html());
    } else {
      if ($li.hasClass('next')) {
        el.do_next_page()
      } else if ($li.hasClass('previous')) { el.do_prev_page() }
    }
  });

  this.obj.click(function() { el.onclick() });
  this.obj.bind("keyup", function(event) { el.onkeyup(event) }); // chrome need keyup
  this.obj.bind("keypress", function(event) {
    if ( event.keyCode == 13 ) {
      event.stopPropagation();
      event.preventDefault();
    }
  });
}

Recordselect.prototype.onclick = function() {
  var el = this;
  this.open();
  setTimeout(function() { el.obj.select(); }, 200); // support select in chrome
}

Recordselect.prototype.clear_hidden_input = function() {
  if (this.obj.attr('readonly')) return;
  if (this.hidden_input.val().length == 0 || this.hidden_input.val().split('|||', 2)[0] == this.obj.val()) return;
  this.hidden_input.val('');
}

Recordselect.prototype.open = function() {
  if (this.obj.attr('readonly') || this.is_open()) return; // control readonly in js
  this.do_find();
}

Recordselect.prototype.close = function() {
  // if they close the dialog with the text field empty, then delete the id value
  if (this.obj.val() == '') this.set('', '');

  this.container.empty();
  this.container.hide();
}

Recordselect.prototype.render = function() {
  this._init();
}

module.exports = Recordselect;

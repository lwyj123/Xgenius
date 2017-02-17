var link = function(href, fn, cssname, moduleName) {

    //未设置路径，则不加载css
    if (!HJalert.jsPath) return;
    var head = $('head')[0];
    var link = document.createElement('link');
    if (typeof fn === 'string') cssname = fn;
    var timeout = 0;
    var id = cssname;

    link.rel = 'stylesheet';
    link.href = HJalert.cssPath + moduleName + '/' + cssname;
    link.id = id;
    //注意加载使用轮询
    if (!$('#' + id)[0]) {
        head.appendChild(link);
    }

    if (typeof fn !== 'function') return;

    //轮询css是否加载完毕
    (function poll() {
        //超时报错
        if (++timeout > 8 * 1000 / 100) {
            return window.console && console.error('HJalert-default.css: Invalid');
        };
        $("head > #" + id)[0] ? fn() : setTimeout(poll, 100);
    }());

};

	window.HJproject = {};
    HJproject.link = link



//HJ对象
;!function(win){
  
"use strict";

var HJ = function(){
  this.version = '0.0.1'; //版本号
};

HJ.fn = HJ.prototype;

}(window)
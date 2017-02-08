/**

 @Name：HJtemplate v0.0.1 js模板引擎  
 @Author：梁王
 @Site：None
 @License：MIT
 当前初版是基于layui(贤心),实现了一个简单的模板引擎。
 为什么100多行我看了好几个小时T_T，辣鸡正则
 */

/**
 *  
模版语法
输出一个普通字段，不转义html：   {{ d.field }}
输出一个普通字段，并转义html：   {{= d.field }}
逻辑处理： {{#  JavaScript 表达式 }} 
(
  注意:只能是表达式，不能为 {{#  fn() }} 的这样的写法，只能为：{{ fn() }} 
  正确的写法是： 
  {{#  if(true){ }}
    内容：{{ fn() }}
  {{#  } }}
)
 */

;
! function(window, undefined) {
    "use strict";

    var config = {
        open: '{{',
        close: '}}'
    };

    var tool = {
        //封装全局匹配正则对象
        exp: function(str) {
            return new RegExp(str, 'g');
        },
        //匹配满足规则内容,type为0是js语句，type为1是普通字段
        query: function(type, prefix, postfix) {
            var typeArr = [
                '#([\\s\\S])+?', //js语句
                '([^{#}])*?' //普通字段
            ];
            var types = typeArr[type || 0];
            return exp((prefix || '') + config.open + types + config.close + (postfix || ''));
        },
        //
        escape: function(html) {
            return String(html || '').replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
                .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        },
        //报错模块
        error: function(e, tplog) {
            var error = 'Laytpl Error：';
            typeof console === 'object' && console.error(error + e + '\n' + (tplog || ''));
            return error + e;
        }        
    }

    var exp = tool.exp,
        Tpl = function(tpl) {
            this.tpl = tpl;
        };

    Tpl.pt = Tpl.prototype;

    window.errors = 0;

    //编译模版
    Tpl.pt.parse = function(tpl, data) {
        var that = this,
            tplog = tpl;
        var jss = exp('^' + config.open + '#', ''),
            jsse = exp(config.close + '$', '');

        //先替换掉空白字符和换行之类的，
        tpl = tpl.replace(/\s+|\r|\t|\n/g, ' ')

        //避免#和后面的语句连在一起
        .replace(exp(config.open + '#'), config.open + '# ')
        //???
        .replace(exp(config.close + '}'), '} ' + config.close)
        //???
        .replace(/\\/g, '\\\\')
        //???
        .replace(/(?="|')/g, '\\')
        //把模板{{# }}删了并 ????????
        .replace(tool.query(), function(str) {
            str = str.replace(jss, '').replace(jsse, '');
            return '";' + str.replace(/\\/g, '') + ';view+="';
        })
        //
        .replace(tool.query(1), function(str) {
            var start = '"+(';
            //如果是{{}}这种空的直接替换成空
            if (str.replace(/\s/g, '') === config.open + config.close) {
                return '';
            }
            //{{或}}换成空
            str = str.replace(exp(config.open + '|' + config.close), '');
            //如果是这种{{= d.field }},当然大括号已经没有了，就???
            if (/^=/.test(str)) {
                str = str.replace(/^=/, '');
                start = '"+_escape_(';
            }
            return start + str.replace(/\\/g, '') + ')+"';
        });

        //此时tpl是包含(d.title)这样的js代码
        tpl = '"use strict";var view = "' + tpl + '";return view;';

        try {
            //惊了，竟然还能这样用
            that.cache = tpl = new Function('d', '_escape_', tpl);
            return tpl(data, tool.escape);
        } catch (e) {
            delete that.cache;
            return tool.error(e, tplog);
        }
    };

    Tpl.pt.render = function(data, callback) {
        var that = this,
            tpl;
        if (!data) return tool.error('no data');
        tpl = that.cache ? that.cache(data, tool.escape) : that.parse(that.tpl, data);
        if (!callback) return tpl;
        callback(tpl);
    };

    var laytpl = function(tpl) {
        if (typeof tpl !== 'string') return tool.error('Template not found');
        return new Tpl(tpl);
    };

    laytpl.config = function(options) {
        options = options || {};
        for (var i in options) {
            config[i] = options[i];
        }
    };

    laytpl.v = '1.2.0';

    window.laytpl = laytpl;



    // //用来存moveElem之类的
    // var HJglobal = {};

    // //默认内置方法。
    // var HJalert = {
    //     version: '0.0.2',
    //     moduleName: 'HJalert',
    //     index: 0,
    //     jsPath: ready.getPath,
    //     cssPath: ready.getPath.replace(/\/js\//,"/css/"),

    //     /**
    //      * 自动链接css文件 
    //      * @param  {String}   href    css文件夹路径，最后带斜杠/
    //      * @param  {Function} fn      加载完后的回调函数
    //      * @param  {String}   cssname css文件名
    //      * @return {undefined and error}           无，可能报error
    //      */
    //     link: function(href, fn, cssname) {

    //         //未设置路径，则不加载css
    //         if (!HJalert.jsPath) return;
    //         var head = $('head')[0];
    //         var link = document.createElement('link');
    //         if (typeof fn === 'string') cssname = fn;
    //         var timeout = 0;
    //         var id = 'HJcss-alert';

    //         link.rel = 'stylesheet';
    //         link.href = HJalert.cssPath + this.moduleName + '/' + cssname;
    //         link.id = id;
    //         //注意加载使用轮询
    //         if (!$('#' + id)[0]) {
    //             head.appendChild(link);
    //         }

    //         if (typeof fn !== 'function') return;

    //         //轮询css是否加载完毕
    //         (function poll() {
    //             //超时报错
    //             if (++timeout > 8 * 1000 / 100) {
    //                 return window.console && console.error('HJalert-default.css: Invalid');
    //             };
    //             $("head > #" + id)[0] ? fn() : setTimeout(poll, 100);
    //         }());

    //     },

    //     cssready: function(callback) {
    //         var cssname = 'HJalert-default.css';

    //         HJalert.link(HJalert.cssPath, callback, cssname);

    //         return this;
    //     },

    // };

    // var Class = function(setings) {
    //     var that = this;
    //     that.index = ++HJalert.index;
    //     that.config = $.extend({}, that.config, setings);
    //     document.body ? that.creat() : setTimeout(function() {
    //         that.creat();
    //     }, 50);
    // };

    // Class.pt = Class.prototype;


    // /**
    //  * 默认配置
    //  * @type {Object}
    //  */
    // Class.pt.config = {
    //     move: '.HJProject-alert-move',         //拖曳元素，选择器表示,比如-> '.layui-layer-title'
    //     title: '',           //title的内容
    //     zIndex: 19891014,    
    //     maxWidth: 360,
    //     resize: true,        //右下角是否有resize部分
    //     shadeClose: true,    //默认点遮罩层会关闭窗口
    // };

    // /**
    //  * 容器，用来设定弹出框的模板
    //  * @param  {Function} callback 一个函数，输入3个参数，第一个是数组依次存遮罩、主体的string表达，第二个是标题栏的html，第三个是拖曳对象（暂时不理解怎么用的）
    //  * @return {[type]}            [description]
    //  */
    // Class.pt.vessel = function(callback) {
    //     var that = this,
    //         times = that.index,
    //         config = that.config;
    //     var zIndex = config.zIndex + times,
    //     	titype = typeof config.title === 'object';
    //     //最大最小化按钮,暂不考虑
    //     //var ismax = config.maxmin //&& (config.type === 1 || config.type === 2);
    //     //标题栏支持样式设置
    //     var titleHTML = (config.title ? '<div class="HJproject-alert-title" style="' + (titype ? config.title[1] : '') + '">' + (titype ? config.title[0] : config.title) + '</div>' : '');
    //     config.zIndex = zIndex;

    //     callback([
    //     	//遮罩
    //     	config.shade ? ('<div class="HJproject-alert-shade" id="HJproject-alert-shade' + times + '" times ="' + times + '" style="' + ('z-index:' + (zIndex-1) +'; background-color:'+ (config.shade[1]||'#000') +'; opacity:' + (config.shade[0]||config.shade) +'; filter:alpha(opacity=' + (config.shade[0]*100||config.shade*100) + ');') + '"></div>'):'',
    //     	//主体,暂不考虑closeBtn
    //     	'<div class="HJproject-alert HJproject-alert-page" id="HJproject-alert' + times + '" type="page' + ' "times="' + times + ' " style="z-index: ' + zIndex + '; width:' + config.area[0] + ';height:' + config.area[1] + '">' + titleHTML + '<div id="' + (config.id || '') + '" class="HJproject-alert-content' + '">' + (config.content || '') + '</div>' + '<span class="HJproject-alert-setwin">'/* + function(){
    //     		var closebtn = ismax ? '<a class="HJproject-alert-min" href="javascript:;"><cite></cite></a><a class="HJproject-alert-ico HJproject-alert-max" href="javascript:;"></a>':'';
    //     		config.closeBtn && (closebtn += '<a class="HJproject-alert-ico ' + 'HJproject-alert-close HJproject-alert-close HJproject-alert-close' + (config.title ? config.closebtn : '1') + '" href="javascript:;"></a>');
    //     		return closebtn;
    //     	}()*/ + '</span>' + (config.btn ? function(){
    //     		var button = '';
    //     		typeof config.btn === 'string' && (config.btn = [config.btn]);
    //     		for (var i = 0,len = config.btn.length; i < len; i++) {
    //     			button += '<a class="HJproject-alert-btn' + '' + i + '">' + config.btn[i] + '</a>' ;
    //     		}
    //     		//config.btnAlign???
    //     		return '<div class="HJproject-alert-btn HJproject-alert-btn-' + (config.btnAlian || '') + '">' + button + '</div>';
    //     	}() : '')
    //     	+ (config.resize ? '<span class="HJproject-alert-resize"></span>' : '') + '</div>'
    //     	],titleHTML,$('<div class="HJProject-alert-move></div>'));
    //     return that;
    // };

    // /**
    //  * 创建一个窗口实例
    //  * @return {undefined} 无
    //  */
    // Class.pt.creat = function() {
    //     var that = this,
    //         config = that.config,
    //         times = that.index,
    //         body = $('body');

    //     //需要加入对参数的处理，如area处理为数组
    //     if($('#'+config.id)[0])  return;

    //     if(typeof config.area === 'string'){
    //         config.area = config.area === 'auto' ? ['', ''] : [config.area, ''];
    //     }
    //     //依据情况初始化（比如关闭其他弹出层）
    //     switch (config.type) {
    //         // case 0:
    //         //     config.btn = ('btn' in config) ? config.btn : ready.btn[0];
    //         //     HJalert.closeAll('dialog');
    //         //     break;
    //     }

    //     //调用vessel建立容器
    //     that.vessel(function(html, titleHTML, moveElem) {
    //         body.append(html[0]);
    //         body.append(html[1]);

    //         if(!$('.HJproject-alert-move')[0]) {
    //             body.append(HJglobal.moveElem = moveElem);        
    //         }

    //         that.alertObject = $('#HJproject-alert'+ times);
    //     });
        
    //     //调用auto
    //     that.auto(times);


    //     //坐标自适应浏览器窗口尺寸
    //     that.offset();

    //     //添加move和一些回调事件
    //     that.move().callback();
    // };

    // /**
    //  * 自适应窗口的各个部分的宽高
    //  * @param  {int} index     自适应对象的index
    //  * @return {Object}        返回实例对象本身
    //  */
    // Class.pt.auto = function(index) {
    //     var that = this,
    //         config = that.config,
    //         //获取弹层对象
    //         alertObject = that.alertObject;

    //     //自适应宽度,没设置宽度默认最大宽度
    //     if(config.area[0] === '' && config.maxWidth > 0){
    //     	alertObject.outerWidth() > config.maxWidth && alertObject.width(config.maxWidth);
    //     }
    //     //获取实际实体innerwidth
    //     var area = [alertObject.innerWidth(),alertObject.innerHeight()];
    //     //获取title,button的outerWidth
    //     var titHeight = alertObject.find('.HJproject-alert-title').outerHeight() || 0;
    //     var btnHeight = alertObject.find('.HJproject-alert-btn').outerHeight() || 0;
    //     //自适应高度,将空余部分设置为content高度
    //     function autoElemHeight(elem){
    //     	elem = alertObject.find(elem);
    //     	elem.height(area[1] - titHeight - btnHeight - 2*(parseFloat(elem.css('padding')) | 0));
    //     }
    //     //如果未设置高度，并且实体高度过界，则进行自适应处理
    //     if(config.area[1] === ''){
    //     	if(area[1] >= win.height()){
    //     		area[1] = win.height();
    //     		autoElemHeight('.HJproject-alert-content');
    //     	}
    //     }else{
    //     	//设置高度后自适应处理
    //     	autoElemHeight('.HJproject-alert-content');
    //     }
    //     /*switch(config.type){
    //     	default: if (config.area[1] === ''){
    //     		if(area[1] >= win.height()){
    //     			area[1] = win.height();
    //     			autoElemHeight('.HJproject-alert-content');
    //     		}
    //     	}else{
    //     			autoElemHeight('.HJproject-alert-content');
    //     		}
    //     	break;
    //     }*/
    //     return that;
    // };

    // /**
    //  * 计算坐标并设置偏移(和auto不同这个是对窗口整体而言)
    //  * 
    //  * @return {undefined}   无
    //  */
    // Class.pt.offset = function() {
    //     var that = this,
    //         config = that.config,
    //         //注意这里需要获取弹层对象
    //         alertObject = that.alertObject;
    //     //获取弹层外宽（包括border)
    //     var area = [alertObject.outerWidth(), alertObject.outerHeight()];
    //     var type = typeof config.offset === 'object';
    //     //偏移类型
    //     var offsetType = ['t','r','b','l','lt','lb','rt','rb'];

    //     //处理offset值，return float型
    //   	function dealOffset(offset,des){
    //   		var rt = offset;
    //     	switch(des){
    //     		case 't':
    //     			rt = /%$/.test(offset)?win.height()*parseFloat(offset)/100 : parseFloat(offset);
    //     			break;
    //     		case 'l':
    //     			rt = /%$/.test(offset)?win.width()*parseFloat(offset)/100 : parseFloat(offset);
    //     			break;
    //     		default:
    //     			rt = parseFloat(offset);
    //     	}
    //     	return rt;
    //     }

    //     //获取偏移量
    //     that.offsetTop = (win.height() - area[1]) / 2;
    //     that.offsetLeft = (win.width() - area[0]) / 2;

    //     //根据传入参数设置偏移坐标,可能情况有三种，默认设置(undefined)=auto,offsetType中任意种情况，坐标对
    //     if(type){
    //     	that.offsetTop = config.offset[0];
    //     	that.offsetLeft = config.offset[1] || that.offsetLeft;
    //     }else if(config.offset !== 'auto'){
    //     	//对每种偏移类型进行处理
    //     	switch(config.offset){
    //     		case offsetType[0]:
    //     			that.offsetTop = 0;
    //     			break;
    //     		case offsetType[1]:
    //     			that.offsetLeft = win.width() - area[0];
    //     			break;
    //     		case offsetType[2]:
    //     			that.offsetTop = win.height() - area[1];
    //     			break;
    //     		case offsetType[3]:
    //     			that.offsetLeft = 0;
    //     			break;
    //     		case offsetType[4]:
    //     			that.offsetTop = 0;
    //     			that.offsetLeft = 0;
    //     			break;
    //     		case offsetType[5]:
    //     			that.offsetLeft = 0;
    //     			that.offsetTop = win.height() - area[1];
    //     			break;
    //     		case offsetType[6]:
    //     			that.offsetTop = 0;
    //     			that.offsetLeft = win.width() - area[0];
    //     			break;
    //     		case offsetType[7]:
    //     			that.offsetLeft = win.width() - area[0];
    //     			that.offsetTop = win.height() - area[1];
    //     			break;
    //     		default:
    //     			//只定义top坐标，水平居中
    //     			that.offsetTop = config.offset;
    //     	}
    //     }else{
    //     	//默认不固定弹层，offset水平垂直居中
    //     	that.offsetTop = dealOffset(that.offsetTop,'t');
    //     	that.offsetLeft = dealOffset(that.offsetLeft,'l');
    //     	that.offsetLeft += win.scrollLeft();
    //     	that.offsetTop += win.scrollTop();
    //     }

    //     //设置css样式
    //     alertObject.css({
    //     	top: that.offsetTop,
    //     	left: that.offsetLeft
    //     });

    // };

    // /**
    //  * move事件绑定，包括拖曳和调整大小
    //  * @return {Object} 返回实例对象
    //  */
    // Class.pt.move = function() {
    //     var that = this;
    //     var config = that.config;
    //     var _DOC = $(document);
    //     var alertObject = that.alertObject;
    //     var moveElem = alertObject.find(config.move);
    //     var dict = {};

    //     if (config.move) {
    //         moveElem.css('cursor', 'move');
    //     }
    //     moveElem.on('mousedown', function(e) {
    //         e.preventDefault();
    //         if (config.move) {
    //             dict.moveStart = true;
    //             dict.offset = [
    //                 e.clientX - parseFloat(alertObject.css('left')), e.clientY - parseFloat(alertObject.css('top'))
    //             ];
    //             HJglobal.moveElem.css('cursor', 'move').show();
    //         }
    //     });

    //     _DOC.on('mousemove', function(e) {

    //         //拖拽移动
    //         if (dict.moveStart) {
    //             var X = e.clientX - dict.offset[0];
    //             var Y = e.clientY - dict.offset[1];

    //             e.preventDefault();

    //             alertObject.css({
    //                 left: X,
    //                 top: Y
    //             });
    //         }
    //     }).on('mouseup', function(e) {
    //         if (dict.moveStart) {
    //             delete dict.moveStart;
    //             HJglobal.moveElem.hide();
    //             config.moveEnd && config.moveEnd(alertObject);
    //         }
    //     });


    //     return that;
    // };

    // /**
    //  * 执行设定的回调函数(success等)
    //  * @return {undefined} 无返回值
    //  */
    // Class.pt.callback = function() {
    //     var that = this,
    //         alertObject = that.alertObject,
    //         config = that.config;


    //     if(config.success){
    //         config.success(alertObject,that.index);
    //     }

    //     /**
    //      * 取消时执行回掉函数，比如点右上角×的时候（未完成）
    //      */


    //     //点遮罩关闭
    //     if (config.shadeClose) {
    //         $('#HJproject-alert-shade' + that.index).on('click', function() {
    //             HJalert.close(that.index);
    //         });
    //     }

    //     //最小化 （未完成）


    //     //全屏/还原 （未完成）


    // };


    // /** 暴露HJalert */

    // window.HJalert = HJalert;

    // /**
    //  * 设定窗口的样式，index必须
    //  * @param  {int} index   层的index
    //  * @param  {Object} options 指定样式
    //  * @param  {bool} limit   是否做出限制，可选
    //  * @return {[type]}         [description]
    //  */
    // HJalert.style = function(index, options, limit) {
    //     var alertObject = $('#HJproject-alert' + index);
    //     var contElem = alertObject.find('.HJproject-alert-content');
    //     var titHeight = alertObject.find('.HJproject-alert-title').outerHeight() || 0;
    //     var btnHeight = alertObject.find('.HJproject-alert-btn').outerHeight() || 0;

    //     //如果设置了宽高，是否限制最小是多少？

    //     alertObject.css(options);

    //     //这里应该调用自适应的代码，这一块是后面重点
    //     //alertObject.auto();
    // };


    // //关闭指定index的窗口
    // HJalert.close = function(index) {
    //     var alertObject = $('#HJproject-alert' + index),
    //         type = alertObject.attr('type');
    //     if (!alertObject[0]) return;
    //     var WRAP = 'HJproject-alert-wrap';
    //     var remove = function() {
    //         alertObject[0].innerHTML = '';
    //         alertObject.remove();
    //         //可以考虑加入关闭的回调事件
    //     };

    //     //删除非对象内容的遮罩
    //     $('#HJproject-alert-shade' + index).remove();
    //     remove();
    // };

    // //关闭所有层
    // HJalert.closeAll = function() {
    //     $.each($('.HJproject-alert'), function() {
    //         var othis = $(this);
    //         HJalert.close(othis.attr('times'));
    //     });
    // };

    // //主入口
    // HJglobal.run = function(_$) {
    //     $ = _$;
    //     win = $(window);
    //     HJalert.open = function(deliver) {
    //         var o = new Class(deliver);
    //         return o.index;
    //     };
    // };

    // /**
    //  * 加载方式，最土的一种，后面要改。
    //  * @param  {[type]} exports) {                        HJalert.path [description]
    //  * @return {[type]}          [description]
    //  */
    // HJglobal.run(window.jQuery);
    // HJalert.cssready();


}(window);
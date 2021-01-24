/**
 * 核心模块
 */

layui.define(['jquery', 'element', 'layer','laydate','table', 'utils'],function(exports){
    var $ = layui.jquery,
        element = layui.element,
        layer = layui.layer,
        table = layui.table,
        utils = layui.utils,
        $win = $(window),
        $body = $('body'),

        //常用对象
        MAIN_APP = '#admin_app', //主窗口
        TABS_HEADER = '#admin_tabs_header',
        FILTER_TAB_TABS_ID = 'admin-layout-tabs', //主标签页 LAY-FILTER
        ELEM_TABS_LIS = '#admin_tabs_header>li', //主标签项

        //常用样式
        //CSS_SHOW = 'layui-show', CSS_HIDE = 'layui-hide', CSS_ADMIN_IFRAME = 'admin-iframe',

        //admin封装对象
        admin = {
            events: {}, //事件集
            tabsPage: { //主tabs
                index: 0 //当前选中项索引
            },
            side: { //侧边
                auto: true, //是否自动侧边伸缩
                spread: true,  //当前侧边伸缩状态（默认展开)
                isMinWin: false //窗口大小状态
            },
            global:{
                editFormId: 'edit_form',
                searchFormId: 'search_form',
                tableId: 'main_table',
                pkField: 'id'
            }
        };


    //---------方法定义--------------

    /**
     * 侧边伸缩方法
     * @param spread  展开状态 true(展开)|false(收缩)
     * 实现方式：
     * 1、在导航菜单项上加 admin-logo-min-width（logo收缩宽度） 和 admin-logo-max-width（logo展开宽度） 属性
     * 2、在顶层页面和栏目主页面在外层加上id为 admin_app 的 div，在伸缩缩时，会自动在此div添加或移动 side-shrink 样式
     * 3、在样式表中添加 side-shrink（收缩后）的样式
     * 4、会同步向栏目主页调用 syncFlexible（spread)方法
     */
    admin.sideFlexible = function(spread){
        if (spread!==admin.side.spread) { //状态变更时处理
            var ID_FLEXIBLE = '#admin_flexible',
                CSS_ICON_SPREAD = 'layui-icon-spread-left', //展开图标样式
                CSS_ICON_SHRINK = 'layui-icon-shrink-right', //收缩图标样式
                CSS_SIDE_SHRINK = 'side-shrink'; //主窗口收缩样式

            if (spread) {//从收缩到展开
                $(ID_FLEXIBLE).removeClass(CSS_ICON_SPREAD).addClass(CSS_ICON_SHRINK); //伸缩按钮切换到收缩图标
                $(MAIN_APP).removeClass(CSS_SIDE_SHRINK); //主窗口容器移除收缩样式
            } else { //从展开到收缩
                $(ID_FLEXIBLE).removeClass(CSS_ICON_SHRINK).addClass(CSS_ICON_SPREAD);//伸缩按钮切换到展开图标
                $(MAIN_APP).addClass(CSS_SIDE_SHRINK); //主窗口容器添加收缩样式
            }
            admin.side.spread = !admin.side.spread; //记录伸缩状态
        }

    };



    /**
     *根据窗口大小自动侧边伸缩
     */
    admin.autoSideFlexible = function(){
        if(window.top !== window.self) return; //如果不是顶层窗口则退出
        if (!admin.side.auto) return; //当前面是手动收缩侧边时，则不会自动展开
        var isMinWin = ($win.width() <=992);
        if (isMinWin === admin.side.isMinWin) return; //当前状态未发生变化时退出

        admin.side.isMinWin = isMinWin;
        admin.sideFlexible(!isMinWin);
    };


    /**
     * 打开页面标签方法
     * @param title  标签文本
     * @param url  url
     * @param params url参数
     * @param noClose  是否是不允许关闭的标签 true|false
     */
    admin.openTabsPage = function(title, url, params, noClose){
        url = utils.setUrlParams(url, params);
        var matchTo,
            tabs = $(ELEM_TABS_LIS);

        tabs.each(function(index){
            if($(this).attr('lay-id') === url){
                matchTo = true;
                admin.tabsPage.index = index;
            }
        });
        title = title || '新标签页';
        if(!matchTo) { //添加一个标签
            admin.tabsPage.index = tabs.length;
            element.tabAdd(FILTER_TAB_TABS_ID,{
                title: '<span>' + title + '</span>',
                id: url,
                content: '<iframe src="' + url + '" class="admin-iframe"></iframe>'
            });
            if(noClose) {
                $(ELEM_TABS_LIS).eq(admin.tabsPage.index).addClass('admin-no-close');
            }
        }
        //定位到当前标签
        element.tabChange(FILTER_TAB_TABS_ID, url);
    };


    /**
     * 在新窗口打开页面方法
     * @param url
     * @param params
     * @param target 打开页面的目标
     */
    admin.openWin = function(url, params, target){
        url = utils.setUrlParams(url, params);
        if(target==="self"){
            self.location.href = url;
        }else{
            window.open(url);
        }
    };

    /**
     * 无窗口POST提交方式
     * @param url
     * @param params
     */
    admin.openPost = function(url, params){
        utils.ajax({url: url, type:'POST', data: params});
    };

    /**
     * 普通弹窗方式
     * @param title
     * @param url
     * @param params
     * @param width
     * @param height
     */
    admin.openDialog = function (title, url, params, width, height){
        utils.ajax({url: url, type:'GET', data: params,showType:1, width: width, height:height});
    };

    /**
     * 编辑弹窗方式
     * @param title
     * @param url
     * @param params
     * @param formId
     * @param width
     * @param height
     */
    admin.openEditDialog = function(title, url, params,  width, height, formId){
        var form = utils.jqueryId(formId || admin.global.editFormId),
            theForm = null;

        utils.ajax({
            url: url,
            type:'GET',
            data: params,
            success: function(data){
                layer.open({type:1, title:title, content: data, area: [width, height], maxmin:true, resize:true, moveOut:true,
                    btn:['确定','取消'],
                    yes: function(){
                       theForm.submit();
                    },
                    success:function(){
                        theForm = $(form).ajaxForm({
                            url: utils.setUrlParams(url, params),
                            //data: params,
                            beforeSubmit: function(){
                                layer.load(2);//open({type:3, content:'数据提交中，请稍候...',icon:16});
                            },
                            complete: function(){
                                layer.closeAll('loading');
                            },
                            success:function(data){
                                try {
                                    data = utils.parseJSON(data);
                                    if (data.code.toString() === "0") { //返回成功
                                        layer.open({
                                            title: '提示信息', content: data.msg, icon: 6,
                                            yes: function () {
                                                layer.closeAll();
                                                try{layui.fulltable.refresh();}catch (e) {} //表格存在时，刷新表格
                                            }
                                        });
                                    } else { //返回失败
                                        layer.open({title: '出错啦', content: data.msg, icon: 5});
                                    }
                                }catch(e) { //非JSON格式
                                    layer.open({title: '提示信息', content: data})
                                }
                            },
                            error:function(){
                                layer.open({title:'出错啦', content:'发生未知的错误', icon:5})
                            }
                        });
                    }
                });
            }
        });

    };


    /**
     * 打开连接
     * HTML属性：
     * link-type, 连接类型，（1-js,0-连接(默认）
     * open-type, 打开方式(0-标签页, 1-新窗口, 2-本页面, 3-普通弹窗, 4-编辑弹窗, 5-无窗口)
     * param-type, 参数获取类型（0-无参（默认），1-表单,2-单行列表,3-多行列表)
     * width, 弹窗宽度 (只对编辑窗类型有效）
     * height, 弹窗高度 (只对编辑窗类型有效）
     * title, 弹窗或tab标题
     * no-close, tab时是否不允许关闭 (只对标签页有效）
     * confirm, 操作前的确认提示信息
     * edit-form-id, 编辑时对应的编辑formid (只对编辑窗类型有效）, 默认取editFormId全局变量
     * param-obj-id 参数获取对象id 默认取tableId 或 searchFormId全局变量
     */
    admin.openLink = function(obj){
        var objThis = $(obj),
            url = objThis.attr('admin-href'),
            confirm = objThis.attr("confirm"),
            isLock = false;

        if (utils.isEmptyOrNull(url)) {
            layer.open({title: '提示信息', content: '无法执行该操作!\r\n该操作还未定义操作路径 [admin-href] 属性'});
            return
        }
        if(!utils.isEmptyOrNull(confirm)){
            layer.confirm(confirm,
                {btn:['确定','取消']},
                function(){
                    if (!isLock){
                        openLinkDo(url, objThis);
                        isLock = true;
                    }
                }
            );
        }else{
            openLinkDo(url, objThis);
        }
    };

    var openLinkDo = function(url, objThis){
        var title = objThis.attr('title') || objThis.text(),
            confirm = objThis.attr("confirm"),
            width = (objThis.attr('width') || '800') + 'px',
            height = (objThis.attr('height') || '600') + 'px';

        if(objThis.attr('link-type')==="1"){ //js
            eval(url);
        }else{ //链接
            var params = '',
                paramType = objThis.attr('param-type'),
                openType = objThis.attr('open-type');
            if(!utils.isEmptyOrNull(paramType)){
                params = admin.getParam(paramType, objThis.attr('param-obj-id')); //获取参数
            }
            switch (parseInt(openType)) {
                case 1: //新窗口
                    admin.openWin(url,params);
                    break;
                case 2: //本页面
                    admin.openWin(url,params,"self");
                    break;
                case 3: //普通弹窗
                    admin.openDialog(title, url, params, width, height);
                    break;
                case 4: //编辑弹窗
                    admin.openEditDialog(title, url, params, width, height, objThis.attr('edit-form-id'));
                    break;
                case 5: //无窗口
                    admin.openPost(url, params);
                    break;
                default: //标签页
                    admin.openTabsPage(title, url, params, objThis.attr('no-close'));
                    break;
            }
        }
    };

    /**
     * 获取参数
     * @param paramType 参数来源类型（0-无,1-查询,2-单行列表,3-多行列表）
     * @param paramObjId 参数来源对象id
     */
    admin.getParam = function(paramType, paramObjId){
        switch (paramType.toString()) {
            case "1":
                return admin.getParamBySearchForm(paramObjId);
            case "2":
                return admin.getParamBySingleRow(paramObjId);
            case "3":
                return admin.getParamByMultiRow(paramObjId);
            default:
                return "";
        }
    };

    /**
     * 获取查询表单参数
     * @param id 查询表单id
     */
    admin.getParamBySearchForm = function(id){
        return admin.getParamByForm(id || admin.global.searchFormId);
    };

    /**
     * 获取表单参数
     * @param id 表单id
     */
    admin.getParamByForm = function(id){
        var theForm = $(id);
        if(theForm === undefined) {
            layer.open({title:'提示信息', content:'参数来源表单未定义', icon:0});
            return false
        }
        return theForm.formSerialize();
    };


    /**
     * 获取表格单行参数
     * @param id 表格id
     */
    admin.getParamBySingleRow = function(id) {

        if (utils.isEmptyOrNull(admin.global.pkField)){
            layer.open({title:'提示信息', content:'参数来源数据表格未定义PK字段', icon:0});
            return false;
        }

        id = id || admin.global.tableId;
        if(utils.isEmptyOrNull(id)){
            layer.open({title:'提示信息', content:'参数来源数据表格未定义', icon:0});
            return false;
        }

        var checkStatus = table.checkStatus(id);
        if (checkStatus.data.length <= 0) {
            layer.open({title:'提示信息', content:'请选择要操作的对象', icon:0});
            return false;
        }else if(checkStatus.data.length >=2){
            layer.open({title:'提示信息', content:'只能选择一条记录进行操作', icon:0});
            return false;
        }else{
            return admin.global.pkField + "=" + checkStatus.data[0][admin.global.pkField];
        }
    };

    /**
     * 获取表格多行参数
     * @param id 表格id
     */
    admin.getParamByMultiRow = function(id) {
        if (utils.isEmptyOrNull(admin.global.pkField)){
            layer.open({title:'提示信息', content:'参数来源数据表格未定义PK字段', icon:0});
            return false;
        }
        id = id || admin.global.tableId;
        if(utils.isEmptyOrNull(id)){
            layer.open({title:'提示信息', content:'参数来源数据表格未定义', icon:0});
            return false;
        }
        var checkStatus = table.checkStatus(id);
        if (checkStatus.data.length <= 0) {
            layer.open({title:'提示信息', content:'请选择要操作的对象', icon:0});
            return false;
        }else{
            var ids = [];
            for (var i=0; i<checkStatus.data.length; i++){
                ids[i] = checkStatus.data[i][admin.global.pkField];
            }
            return admin.global.pkField + "=" + ids.join('&' + admin.global.pkField + '=');

        }
    };


    /**
     * 渲染日期组件
     */
    admin.renderDate = function(container){
        $(container).find('input[datetime-data]').each(function(){
            var option = $(this).attr('datetime-data') || '{}';
            try {
                option = eval('(' + option + ')');
                option.elem = this;
            }catch (e) {
                option = {elem:this};
            }
            option.type = option.type || "date"; //默认使用日期类型

            layui.laydate.render(option);
        });
    };


    //---------事件定义--------------------------------------------------------------------------------------------------------

    /**
     * 全屏事件
     * @param objThis
     */
    admin.events.fullScreen = function(objThis){
        var CSS_SCREEN_FULL = 'layui-icon-screen-full',
            CSS_SCREEN_REST = 'layui-icon-screen-restore',
            iconElem = objThis.children("i"),
            elem = null;

        if(iconElem.hasClass(CSS_SCREEN_FULL)){
            elem = document.body;
            if(elem.webkitRequestFullScreen){
                elem.webkitRequestFullScreen();
            } else if(elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if(elem.requestFullScreen) {
                elem.requestFullscreen();
            }

            iconElem.addClass(CSS_SCREEN_REST).removeClass(CSS_SCREEN_FULL);
        } else {
            elem = document;
            if(elem.webkitCancelFullScreen){
                elem.webkitCancelFullScreen();
            } else if(elem.mozCancelFullScreen) {
                elem.mozCancelFullScreen();
            } else if(elem.cancelFullScreen) {
                elem.cancelFullScreen();
            } else if(elem.exitFullscreen) {
                 elem.exitFullscreen();
            }
            iconElem.addClass(CSS_SCREEN_FULL).removeClass(CSS_SCREEN_REST);
        }
    };

    /**
     * 侧边伸缩事件
     */
    admin.events.flexible = function(objThis){
        admin.side.auto = !admin.side.spread; //当手动收缩时，则不进行自动伸缩
        admin.sideFlexible(!admin.side.spread);
    };

    /**
     * 左右滚动页面标签事件
     * @param type  滚动方式(auto|left|right)
     * @param index 当前标签页索引
     */
    admin.events.rollPage = function(type, index){
        var tabsHeader = $(TABS_HEADER),
            liItem = tabsHeader.children('li'),
            scrollWidth = tabsHeader.prop('scrollidth'),
            outerWidth = tabsHeader.outerWidth(),
            tabsLeft = parseFloat(tabsHeader.css('left'));
        if(type === 'left'){ //从左住右
            if(!tabsLeft && tabsLeft <= 0) return;
            //当前的left减去可视宽度，用于与上一轮的页标比较
            var prefLeft = -tabsLeft - outerWidth;
            liItem.each(function(index, item){
                var li = $(item),
                    left = li.position().left;
                if(left >= prefLeft){
                    tabsHeader.css('left', -left);
                    return false;
                }
            });
        } else if(type=== 'auto'){ //自动滚动
            (function(){
                var thisLi = liItem.eq(index), thisLeft;

                if(!thisLi[0]) return;
                thisLeft = thisLi.position().left;

                //当目标标签在可视区域左侧时
                if(thisLeft < -tabsLeft){
                    return tabsHeader.css('left', -thisLeft);
                }

                //当目标标签在可视区域右侧时
                if(thisLeft + thisLi.outerWidth() >= outerWidth - tabsLeft){
                    //alert("OK");
                    var subLeft = thisLeft + thisLi.outerWidth() - (outerWidth - tabsLeft);
                    liItem.each(function(i, item){
                        var li = $(item),
                        left = li.position().left;

                        //从当前可视区域的最左第二个节点遍历，如果减去最左节点的差 > 目标在右侧不可见的宽度，则将该节点放置可视区域最左
                        if(left + tabsLeft > 0){
                            if(left - tabsLeft > subLeft){
                                tabsHeader.css('left', -left);
                                return false;
                            }
                        }
                    });
                }
            }());
        } else {
            //默认向左滚动
            liItem.each(function(i, item){
                var li = $(item),
                left = li.position().left;

                if(left + li.outerWidth() >= outerWidth - tabsLeft){
                    tabsHeader.css('left', -left);
                    return false;
                }
            });
        }
    };

    /**
     * 向右滚动页面标签事件
     */

    admin.events.leftPage = function(){
        admin.events.rollPage('left');
    };

    /**
     * 向左滚动页面标签事件
     */
    admin.events.rightPage = function(){
        admin.events.rollPage();
    };

    /**
     * 关闭当前标签页事件
     */
    admin.events.closeThisTabs = function(){
        if(!admin.tabsPage.index) return;
        var objThis = $(ELEM_TABS_LIS).eq(admin.tabsPage.index);
        if(objThis.hasClass('admin-no-close')) return; //如果当前标签不允许关闭，则退出
        objThis.find(".layui-tab-close").trigger('click');
    };

    /**
     * 关闭其它标签页事件
     * @param type 类型： all(所有) | （其它）
     */
    admin.events.closeOtherTabs = function(type){
        var currIndex = admin.tabsPage.index,
            TABS_REMOVE = 'admin-pagetabs-remove',
            tabsBodys = $('#admin_main_body>div.layui-tab-item'),
            tabs = $(ELEM_TABS_LIS);


        var noCloseNum = 0;
        tabs.each(function(index,item){
            if($(item).hasClass('admin-no-close')) { //记录不能关闭的标签数量
                if (index < currIndex) noCloseNum ++;
                if (index === currIndex && type === 'all') noCloseNum ++;
            }else{
                if(!(type!=='all' && index === currIndex)) { //给要关闭的标签全部加上移动临时样式
                    $(item).addClass(TABS_REMOVE);
                    tabsBodys.eq(index).addClass(TABS_REMOVE);
                }
            }
        });
        $('.' + TABS_REMOVE).remove(); //将所有要移除的标签全部移除
        $(TABS_HEADER).css('left',0); //滚动到最左侧
        //选择一个未关闭的标签
        if(type === 'all'){
            admin.tabsPage.index = noCloseNum -1;
            $(ELEM_TABS_LIS).eq(admin.tabsPage.index).trigger('click');
        }else{
            admin.tabsPage.index = noCloseNum;
        }
    };

    /**
     * 关闭全部标签页事件
     */
    admin.events.closeAllTabs = function(){
        admin.events.closeOtherTabs('all');
    };




    //---------事件监听-------------------------------------------------------------
    $(function () {

        /**
         * 监听点击事件
         * 范围（所有具有 admin-event 属性的对象
         */
        $body.on('click', '*[admin-event]', function () {
            var objThis = $(this),
                attrEvent = objThis.attr('admin-event');
            admin.events[attrEvent] && admin.events[attrEvent].call(this, objThis);
        });


        /**
         * 监听页面连接点击事件
         * 范围 （所有具有 admin-href 属性的对象）
         * 其它属性：参考admin.openLink()说明
         */
        $body.on('click', '*[admin-href]', function () {
            admin.openLink(this);
        });


        /**
         * 监听 主 tab 组件切换，同步 admin.tabsPage.index 及菜单选择
         */
        element.on('tab(' + FILTER_TAB_TABS_ID + ')', function (data) {
            admin.tabsPage.index = data.index;
            admin.events.rollPage('auto', data.index);
            layId = $(ELEM_TABS_LIS).eq(admin.tabsPage.index).attr('lay-id');
            $('[admin-href]').parent().removeClass('layui-this');
            $("[admin-href='" + layId + "']").parent().addClass('layui-this')
        });

        /**
         * 监听 tab 组件删除，同步 admin.tabsPage.index
         * layui tabs 在删除时有个bug，当删除的标签不是排在最后，则切换后的index会比实际的大1
         */
        element.on('tabDelete(' + FILTER_TAB_TABS_ID + ')', function (data) {
            if (data.index < admin.tabsPage.index) {
                admin.tabsPage.index -= 1;
            }
        });

        /**
         * 监听窗口大小变化
         */
        $win.on('resize', function () {
            admin.autoSideFlexible(); //自动侧边伸缩
        });

        /**
         * 监听tips
         */
        $body.on('mouseenter', '*[lay-tips]', function () {
            var objThis = $(this),
                tips = objThis.attr('lay-tips');
            layer.tips(tips, objThis);
        }).on('mouseleave', '*[lay-tips]', function () {
            layer.close(layer.index);
        });


        /**
         * 侧边分组tabs点击时
         */
        $("#admin_menu_tabs>.layui-tab-title>li").on('click',function () {
            //展开侧边
            admin.sideFlexible(true);
        }).on('mouseenter',function () {
            //显示tips
            if (!$(MAIN_APP).hasClass('side-shrink')) return;
            var text = $(this).find("span").html();
            layer.tips(text, this);
        }).on('mouseleave',function () {
            //隐藏tips
            layer.close(layer.index);
        });



        /**
         * 自动打开页面
         * 之所以要加延时处理，是因为layui动态加载模块时，并不随页面加载完成而完成
         */
        setTimeout(function () {
            $body.find('[admin-default-open]').click();
        }, 200);

    });

    //接口输出
    exports('admin', admin);

});

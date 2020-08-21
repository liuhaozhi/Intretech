/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search'], function (serverWidget) {
    function onRequest(context) {
        if (context.request.method === 'GET') {//直接访问页面是GET方式
            // 创建表单
            var form = serverWidget.createForm({
                title: '采购订单行关闭'
            });
            form.clientScriptModulePath = "./../cs/cs_cux_po_close_line.js";
            //普通按钮
            form.addButton({
                label : '搜索',
                id : 'cstm_page_search_btn',
                functionName: "searchButtonClickEvent"
            });
            form.addButton({
                label : '提交',
                id : 'cstm_page_submit_btn',
                functionName: "searchSubmitClickEvent"
            });
            form.addButton({
                label : '仅提交备注',
                id : 'cstm_page_submit_memo_btn',
                functionName: "searchSubmitMemoClickEvent"
            });
            form.addButton({
                label : '添加备注',
                id : 'cstm_page_add_memo_btn',
                functionName: "addMemoButtonClickEvent"
            });
            //创建下拉字段，数据源自系统数据
            form.addField({
                id: 'subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: '子公司',
                source: "subsidiary"
            });
            form.addField({
                id: 'vendor',
                type: serverWidget.FieldType.SELECT,
                label: '供应商',
                source: "vendor"
            });
            /* form.addField({
                id: 'process_status',
                type: serverWidget.FieldType.TEXTAREA,
                label: '执行状态',
                displayType: serverWidget.FieldDisplayType.HIDDEN
            }); */
            
            form.addField({
                id: 'item',
                type: serverWidget.FieldType.SELECT,
                label: '货品',
                source: "item"
            });
            var closed = form.addField({
                id: 'closed',
                type: serverWidget.FieldType.SELECT,
                label: '已关闭'
            });
            closed.addSelectOption({
                value: "",
                text: "任意"
            });
            closed.addSelectOption({
                value: "T",
                text: "是"
            });
            closed.addSelectOption({
                value: "F",
                text: "否"
            });
            //创建tab
            form.addTab({
                id: 'cux_po_close_line_tab',
                label: '采购订单列表'
            });
            // 创建sublist
            var sublist = form.addSublist({
                id: 'cux_po_close_line',
                type: serverWidget.SublistType.STATICLIST,
                label: '采购订单列表',
                tab: 'cux_po_close_line_tab'
            });
            sublist.addField({
                id: 'linesequencenumber',
                type: serverWidget.FieldType.INTEGER,
                label: '序号'
            });
            sublist.addField({
                id: 'checkbox',
                type: serverWidget.FieldType.CHECKBOX,
                label: '全选'
            });
            sublist.addField({
                id: 'item',
                type: serverWidget.FieldType.SELECT,
                label: '货品',
                source: 'item'
            });
            sublist.addField({
                id: 'subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: '子公司',
                source: 'subsidiary'
            });
            sublist.addField({
                id: 'quantity',
                type: serverWidget.FieldType.TEXT,
                label: '数量'
            });
            sublist.addField({
                id: 'vendor_altname',
                type: serverWidget.FieldType.TEXT,
                label: '名称'
            });
            sublist.addField({
                id: 'trandate',
                type: serverWidget.FieldType.DATE,
                label: '日期'
            });
            sublist.addField({
                id: 'tranid',
                type: serverWidget.FieldType.TEXT,
                label: '文件号码'
            });
            sublist.addField({
                id: 'lineuniquekey',
                type: serverWidget.FieldType.FLOAT,
                label: '行唯一键'
            });
            sublist.addField({
                id: 'quantityshiprecv',
                type: serverWidget.FieldType.TEXT,
                label: '已实施数量/已收货数量'
            });
            sublist.addField({
                id: 'quantityonshipments',
                type: serverWidget.FieldType.TEXT,
                label: '装运数量'
            });
            sublist.addField({
                id: 'shiprecvstatusline',
                type: serverWidget.FieldType.TEXT,
                label: '已履行量/已收货量(行层次)'
            });
            sublist.addField({
                id: 'closed',
                type: serverWidget.FieldType.CHECKBOX,
                label: '已关闭'
            });
            
            form.addTab({
                id: 'custpage_notes',
                label: '注释'
            });
            var sublists = form.addSublist({
                id: 'bom_notes',
                type: serverWidget.SublistType.STATICLIST,
                label: '注释',
                tab: 'custpage_notes'
            });
            sublists.helpText = 
            '<script>\
                window.onload=function(){\
                    page_init();\
                };\
            </script>';
            sublists.addField({
                id: 'bom_notes_item_code',
                type: serverWidget.FieldType.TEXT,
                label: 'Note'
            });
            //输出这个表单到用户的浏览器
            context.response.writePage(form);
        } else {//当用户访问页面，填写了数据，并提交，数据会提交到当前Suitelet，只不过是以POST的方式，所以在这里处理提交后的逻辑
            //获取用户填写的字段的值
        }
    }

    return {
        onRequest: onRequest
    };
});
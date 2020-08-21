/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search'], function (serverWidget) {
    function onRequest(context) {
        if (context.request.method === 'GET') {//直接访问页面是GET方式
            // 创建表单
            var form = serverWidget.createForm({
                title: '采购订单批量退货'
            });
            form.clientScriptModulePath = "./../cs/cs_cux_po_return_sales.js";
            //普通按钮
            form.addButton({
                label : '搜索',
                id : 'cstm_page_search_btn',
                functionName: "searchButtonClickEvent"
            });
            form.addButton({
                label : '添加',
                id : 'cstm_page_add_btn',
                functionName: "searchAddClickEvent"
            });
            form.addButton({
                label : '提交',
                id : 'cstm_page_submit_btn',
                functionName: "searchSubmitClickEvent"
            });
            //创建下拉字段，数据源自系统数据
            form.addField({
                id: 'subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: '子公司',
                source: "subsidiary"
            });
            form.addField({
                id: 'vendor__internalid',
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
                label: '物料编码',
                source: "item"
            });
            form.addField({
                id: 'createdfrom',
                type: serverWidget.FieldType.SELECT,
                label: '采购订单',
                source: "purchaseorder"
            });
            form.addField({
                id: 'createdby',
                type: serverWidget.FieldType.SELECT,
                label: '创建人',
                source: "employee"
            });
            form.addField({
                id: 'tranid',
                type: serverWidget.FieldType.TEXT,
                label: '入库单号'
            });
            form.addField({
                id: 'datecreated__from',
                type: serverWidget.FieldType.DATE,
                label: '创建日期From'
            });
            form.addField({
                id: 'datecreated__to',
                type: serverWidget.FieldType.DATE,
                label: '创建日期To'
            });
            form.addField({
                id: 'location',
                type: serverWidget.FieldType.SELECT,
                label: '地点',
                source: 'location'
            });
            form.addField({
                id: 'custbody_outbound_3',
                type: serverWidget.FieldType.SELECT,
                label: '审批状态',
                source: 'customlist_sales_order_status_list_2'
            });
            //创建tab
            form.addTab({
                id: 'cux_po_close_line_tab',
                label: '入库单列表'
            });
            // 创建sublist
            var sublist = form.addSublist({
                id: 'cux_po_close_line',
                type: serverWidget.SublistType.STATICLIST,
                label: '入库单列表',
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
                id: 'item_name',
                type: serverWidget.FieldType.SELECT,
                label: '货品',
                source: 'item'
            });
            sublist.addField({
                id: 'vendor_companyname',
                type: serverWidget.FieldType.TEXT,
                label: '公司名称'
            });
            sublist.addField({
                id: 'tranid',
                type: serverWidget.FieldType.TEXT,
                label: '文件号码'
            });
            sublist.addField({
                id: 'item_custitem_ps_item_specification',
                type: serverWidget.FieldType.TEXT,
                label: '规格型号'
            });
            sublist.addField({
                id: 'quantity',
                type: serverWidget.FieldType.FLOAT,
                label: '入库/接收数量'
            });
            sublist.addField({
                id: 'quantityret',
                type: serverWidget.FieldType.FLOAT,
                label: '退货数量'
            });
            sublist.addField({
                id: 'location',
                type: serverWidget.FieldType.SELECT,
                label: '地点',
                source: 'location'
            });
            sublist.addField({
                id: 'quantitylocation',
                type: serverWidget.FieldType.FLOAT,
                label: '仓库可用数量'
            });
            sublist.addField({
                id: 'actualshipdate',
                type: serverWidget.FieldType.TEXT,
                label: '实际发货/收货日期'
            });
            sublist.addField({
                id: 'datecreated',
                type: serverWidget.FieldType.TEXT,
                label: '创建日期'
            });
            sublist.addField({
                id: 'createdfrom',
                type: serverWidget.FieldType.SELECT,
                label: '创建自'
            });
            sublist.addField({
                id: 'createdby',
                type: serverWidget.FieldType.SELECT,
                label: '创建人',
                source: "employee"
            });
            sublist.addField({
                id: 'memo',
                type: serverWidget.FieldType.TEXT,
                label: '备注'
            });
            form.addTab({
                id: 'custpage_alreadyaddlist',
                label: '已添加列表'
            });
            var sublists = form.addSublist({
                id: 'alreadyaddlist',
                type: serverWidget.SublistType.STATICLIST,
                label: '已添加列表',
                tab: 'custpage_alreadyaddlist'
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
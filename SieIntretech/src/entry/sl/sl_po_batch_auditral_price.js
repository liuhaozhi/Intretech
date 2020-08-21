/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search'], function (serverWidget, search) {
    function onRequest(context) {
        if (context.request.method === 'GET') {//直接访问页面是GET方式
            // 创建表单
            var form = serverWidget.createForm({
                title: '采购订单价格批量审批'
            });
            form.clientScriptModulePath = "./../cs/cs_po_batch_auditral_price.js";
            //普通按钮
            form.addButton({
                label : '搜索',
                id : 'cstm_page_search_btn',
                functionName: "searchButtonClickEvent"
            });
            form.addButton({
                label : '同意',
                id : 'execute',
                functionName: "searchSubmitAgreeClickEvent"
            });
            form.addButton({
                label : '拒绝',
                id : 'execute',
                functionName: "searchSubmitRefuseClickEvent"
            });
            var expandStr = "<img id='filters_field_group_expand' onclick='filtersFieldsExpand(this)' src='/images/nav/tree/minus.png' border='0' style='vertical-align:top;margin:2px 3px 0px 0px;cursor:pointer;'>";
            form.addFieldGroup({ id: "batch_auditral_price_filter_group", label: expandStr + "过滤条件" });
            createPageFields(form, getRecordFields());
            //输出这个表单到用户的浏览器
            context.response.writePage(form);
        } else {//当用户访问页面，填写了数据，并提交，数据会提交到当前Suitelet，只不过是以POST的方式，所以在这里处理提交后的逻辑
            //获取用户填写的字段的值
        }
    }

    return {
        onRequest: onRequest
    };

    function getRecordFields() {
        var scriptString = 
        "<script>\
            window.onload=function(){\
                page_init();\
            };\
            function filtersFieldsExpand(img){\
                var cNode=img.parentNode.parentNode.parentNode.nextElementSibling;\
                if(/minus/gmi.test(img.src)){\
                    cNode.style.display='none';\
                    img.src=img.src.replace('minus', 'plus');\
                }else{\
                    cNode.style.display='';\
                    img.src=img.src.replace('plus', 'minus');\
                }\
            }\
        </script>";
        
        return {
            'custrecord_field_vendor': {
                id: 'custrecord_field_vendor',
                type: serverWidget.FieldType.SELECT,
                label: '供应商编码',
                source: "vendor",
                container: "batch_auditral_price_filter_group"
            },
            'custrecord_field_item': {
                id: 'custrecord_field_item',
                type: serverWidget.FieldType.SELECT,
                label: '物料编码',
                source: "item",
                container: "batch_auditral_price_filter_group"
            },
            'created__from': {
                id: 'created__from',
                type: serverWidget.FieldType.DATE,
                label: '创建日期From',
                container: "batch_auditral_price_filter_group"
            },
            'created__to': {
                id: 'created__to',
                type: serverWidget.FieldType.DATE,
                label: '创建日期To',
                container: "batch_auditral_price_filter_group"
            },
            'custrecord_po_price_people': {
                id: 'custrecord_po_price_people',
                type: serverWidget.FieldType.SELECT,
                label: '价格维护人',
                source: "employee",
                container: "batch_auditral_price_filter_group"
            },
            'custrecord_field_start_date__from': {
                id: 'custrecord_field_start_date__from',
                type: serverWidget.FieldType.DATE,
                label: '生效日期From',
                container: "batch_auditral_price_filter_group"
            },
            'custrecord_field_start_date__to': {
                id: 'custrecord_field_start_date__to',
                type: serverWidget.FieldType.DATE,
                label: '生效日期To',
                container: "batch_auditral_price_filter_group"
            },
            /* 'custrecord_field_status': {
                id: 'custrecord_field_status',
                type: serverWidget.FieldType.SELECT,
                label: "状态",
                source: "customlist_ps_bom_approvestatus",
                container: "batch_auditral_price_filter_group"
            }, */
            'custrecord_field_currencies': {
                id: 'custrecord_field_currencies',
                type: serverWidget.FieldType.SELECT,
                source: 'currency',
                label: '币种',
                container: "batch_auditral_price_filter_group"
            },
            'custrecord_price_type': {
                id: 'custrecord_price_type',
                type: serverWidget.FieldType.SELECT,
                source: 'customlist_purchase_price_list',
                label: '价格类型',
                container: "batch_auditral_price_filter_group"
            },
            'custrecord_last_maintenance_time__from': {
                id: 'custrecord_last_maintenance_time__from',
                type: serverWidget.FieldType.DATE,
                label: '最后维护时间From',
                container: "batch_auditral_price_filter_group"
            },
            'custrecord_last_maintenance_time__to': {
                id: 'custrecord_last_maintenance_time__to',
                type: serverWidget.FieldType.DATE,
                label: '最后维护时间To',
                container: "batch_auditral_price_filter_group"
            },
            'custrecord_vp_field_next_auditor': {
                id: 'custrecord_vp_field_next_auditor',
                type: serverWidget.FieldType.SELECT,
                source: 'employee',
                label: '下一审核人',
                container: "batch_auditral_price_filter_group"
            },
            'custrecord_tiering_price': {
                id: 'custrecord_tiering_price',
                type: serverWidget.FieldType.SELECT,
                label: '是否阶梯价',
                container: "batch_auditral_price_filter_group"
            },
            addStatisOption: function (sublist, field) {
                field.addSelectOption({ value: "", text: "" });
                field.addSelectOption({ value: true, text: "是" });
                field.addSelectOption({ value: false, text: "否" });
            },
            "cux_po_batch_auditral_price_tab": {
                id: "cux_po_batch_auditral_price_tab",
                type: "TAB",
                label: "采购订单价格批量审批",
                "cux_po_batch_auditral_price": {
                    id: 'cux_po_batch_auditral_price',
                    type: serverWidget.SublistType.STATICLIST,
                    label: '采购订单价格批量审批',
                    tab: 'cux_po_batch_auditral_price_tab',
                    fields: [
                        {label: " ", id: "custrecord_price_type", type: "text"}
                    ]
                }
            },
            "pochange_confirm_sublist": {
                id: "pochange_confirm_sublist",
                type: "TAB",
                label: '注释',
                pochange_comment_tab: 
                {
                    id: "pochange_comment_tab",
                    type: serverWidget.SublistType.STATICLIST,
                    label: "注释",
                    tab: 'pochange_confirm_sublist',
                    fields: [
                        { label: "注释", id: "pochange_comment", type: "text" },
                        function(sublist) { sublist.helpText = scriptString; }
                    ]
                }
            }
        };
    }

    function createPageFields(form, recFields, field) {
        for(var fieldId in recFields) {
            var fieldInfo = recFields[fieldId];
            if(typeof fieldInfo == "function") {
                fieldInfo(form, field);
            } else if(fieldInfo.type == 'TAB') {
                field = form.addTab({
                    id: fieldInfo.id,
                    label: fieldInfo.label
                });
                for(var sublistId in fieldInfo) {
                    if(typeof fieldInfo[sublistId] != "object") { continue; }
                    var sublistFields = fieldInfo[sublistId].fields;
                    delete fieldInfo[sublistId].fields;
                    field = form.addSublist(fieldInfo[sublistId]);
                    createPageFields(field, sublistFields, field);
                }
            } else {
                field = form.addField(fieldInfo);
            }
        }
    }
});
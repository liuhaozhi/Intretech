/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/runtime'], function (serverWidget, search, runtime) {
    function onRequest(context) {
        if (context.request.method === 'GET') {//直接访问页面是GET方式
            var form;
            // 创建表单
            form = serverWidget.createForm({
                title: '采购订单批量审批'
            });
            //普通按钮
            form.addButton({
                label : '搜索',
                id : 'cstm_page_search_btn',
                functionName: "searchButtonClickEvent"
            });
            form.addButton({
                label : '提交审批',
                id : 'cstm_page_audit_submit_btn',
                functionName: "searchBatchAuditSubmitButtonClickEvent"
            });
            form.addButton({
                label : '同意',
                id : 'cstm_page_audit_approve_btn',
                functionName: "searchBatchAuditApproveButtonClickEvent"
            });
            form.addButton({
                label : '拒绝',
                id : 'cstm_page_audit_reject_btn',
                functionName: "searchBatchAuditRejectButtonClickEvent"
            });
            form.clientScriptModulePath = "./../cs/cs_cux_po_batch_auditral.js";
            //创建下拉字段，数据源自系统数据
            createPageFields(form, getRecordFields());
            //输出这个表单到用户的浏览器
            context.response.writePage(form);
        } else {//当用户访问页面，填写了数据，并提交，数据会提交到当前Suitelet，只不过是以POST的方式，所以在这里处理提交后的逻辑
            //获取用户填写的字段的值
            context.response.write({
                output: JSON.stringify(context)
            });
        }
    }

    function getRecordFields() {
        return {
            "entity": {
                id: 'entity',
                type: serverWidget.FieldType.SELECT,
                source: 'vendor',
                label: '供应商'
            },
            "datecreated_from": {
                id: 'datecreated_from',
                type: serverWidget.FieldType.DATE,
                label: '创建日期From'
            },
            "datecreated_to": {
                id: 'datecreated_to',
                type: serverWidget.FieldType.DATE,
                label: '创建日期To'
            },
            "expectedreceiptdate_from": {
                id: 'expectedreceiptdate_from',
                type: serverWidget.FieldType.DATE,
                label: '预计收货日期From'
            },
            "expectedreceiptdate_to": {
                id: 'expectedreceiptdate_to',
                type: serverWidget.FieldType.DATE,
                label: '预计收货日期To'
            },
            "item": {
                id: 'item',
                type: serverWidget.FieldType.SELECT,
                source: 'item',
                label: '物料编码'
            },
            "custbody_po_list_pur_type": {
                id: 'custbody_po_list_pur_type',
                type: serverWidget.FieldType.SELECT,
                source: 'customlist_po_list_pur_type',
                label: '采购类型'
            },
            "tranid": {
                id: 'tranid',
                type: serverWidget.FieldType.TEXT,
                label: '采购订单号'
            },
            "custcol_external_2": {
                id: 'custcol_external_2',
                type: serverWidget.FieldType.SELECT,
                source: 'estimate',
                label: '原销售订单号'
            },
            "custbody_po_buyer": {
                id: 'custbody_po_buyer',
                type: serverWidget.FieldType.SELECT,
                source: 'employee',
                label: '专营采购员'
            },
            "po_batch_auditral_submit_tab": {
                id: 'po_batch_auditral_submit_tab',
                type: "TAB",
                label: "采购订单提交审批列表",
                po_batch_auditral_submit_sublist: {
                    id: "po_batch_auditral_submit_sublist",
                    type: serverWidget.SublistType.LIST,
                    label: "采购订单提交审批列表",
                    tab: "po_batch_auditral_submit_tab",
                    fields: [
                        {"id":"linenumber","type":"TEXT","label":" "}
                    ]
                }
            },
            "po_batch_auditral_confirm_tab": {
                id: 'po_batch_auditral_confirm_tab',
                type: "TAB",
                label: '采购订单审批列表',
                po_batch_auditral_confirm_sublist: {
                    id: "po_batch_auditral_confirm_sublist",
                    type: serverWidget.SublistType.LIST,
                    label: '采购订单审批列表',
                    tab: "po_batch_auditral_confirm_tab",
                    fields: [
                        {"id":"linenumber","type":"TEXT","label":" "}
                    ]
                }
            }
        };
    }

    /* function fieldDisplayTypeDisabled(sublist, field) {
        field.updateDisplayType({
            displayType : serverWidget.FieldDisplayType.DISABLED
        });
    } */

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

    return {
        onRequest: onRequest
    };
});
/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@author RhysLan
 *@description Bill Payment UE主程序
 */
define(['N/record', 'N/search', 'N/runtime', 'N/ui/serverWidget'], function (record, search, runtime, serverWidget) {
    function beforeLoad(context) {
        frizeGridColumnsAndRows(context);//表格头冻结

        var currentRecord = context.newRecord;
        var user = runtime.getCurrentUser();
        var formFieldsMap = {
            "purchaseorder": {//盈趣-采购定单（仓库用）
                "item": ["tax1amt", "grossamt", "amount"]
            },
            "vendorreturnauthorization": {//供应商退货授权（仓库用） 货品
                "usertotal": true,
                "item": ["amount", "grossamt"]
            },
            "salesorder": {//发货通知单 盈趣-客制化-发货通知单表格-仓管专用
                "item": ["amount", "grossamt", "taxrate1", "taxcode", "tax1amt"]
            },
            "estimate": {//销售订单 盈趣-客制化-发货通知单表格-仓管专用
                "item": ["amount", "grossamt", "taxrate1", "taxcode", "tax1amt"]
            },
            "returnauthorization": {//盈趣-客制化-退货通知单表格-仓库专用
                "item": ["amount", "grossamt", "taxrate1", "taxcode", "tax1amt"]
            }
        };
        var permission = {
            "purchaseorder": {
                "role": ["1153", "1154", "1146", "1147"]
            },
            "vendorreturnauthorization": {
                "role": ["1153", "1154", "1146", "1147"]
            },
            "salesorder": {
                "role": ["1040", "1133", "1134", "1038"] 
            },
            "estimate": {
                "role": ["1040", "1133", "1134", "1038"] 
            },
            "returnauthorization": {
                "role": ["1040", "1133", "1134", "1038"] 
            }
        };
        var type = currentRecord.type;
        if(permission[type] && permission[type]["role"].indexOf(user.role + "") == -1) { return; }
        try{
            hiddenFormFields(context, formFieldsMap[type + currentRecord.getValue("customform")] || formFieldsMap[type]);
        } catch(e) {
            throw e;
        }
    }

    function hiddenFormFields(context, fieldsObj){
        if(!fieldsObj) { return ; }
        var contextForm = context.form;
        for(var fieldId in fieldsObj) {
            var value = fieldsObj[fieldId];
            if(typeof value == "object") {
                for(var subFieldId in value) {
                    subFieldId = Array.isArray(value)? value[subFieldId]: subFieldId;
                    contextForm.getSublist({
                        id: fieldId
                    }).getField(subFieldId).updateDisplayType({displayType: 'hidden'});
                }
            } else {
                contextForm.getField(fieldId).updateDisplayType({displayType: 'hidden'});
            }
        }
    }

    function frizeGridColumnsAndRows(context) {
        var frizeScript = "<script>(function ($, undefined) {\
            $(function () {debugger;\
                const windowHeight = $(window).height();\
                $('.uir-machine-table-container')\
                .filter((index, elem) => $(elem).height() > windowHeight)\
                .css('height', '70vh')\
                .bind('scroll', (event) => {\
                    const headerElem = $(event.target).find('.uir-machine-headerrow');\
                    headerElem.css('transform', `translate(0, ${event.target.scrollTop}px)`);\
                })\
                .bind('scroll', (event) => {\
                    const headerElem = $(event.target).find('.uir-list-headerrow');\
                    headerElem.css('transform', `translate(0, ${event.target.scrollTop}px)`);\
                });\
            });\
        })(window.jQuery.noConflict(true));</script>";
        var field = context.form.addField({
            id : 'custpage_global_field_by_frize_grids_row_and_cols_',
            type : serverWidget.FieldType.INLINEHTML,
            label : '全局JS脚本'
        });
        field.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });
        context.newRecord.setValue("custpage_global_field_by_frize_grids_row_and_cols_", frizeScript);
    }

    return {
        beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        //afterSubmit: afterSubmit
    }
});

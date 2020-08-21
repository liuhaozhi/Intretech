/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@author RhysLan
 *@description Bill Payment UE主程序
 */
define(['N/record', 'N/search', 'N/runtime', 'N/ui/serverWidget'], function (record, search, runtime, serverWidget) {
    function beforeLoad(context) {
        frizeGridColumnsAndRows(context);
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
            type : serverWidget.FieldType.HELP,
            label : '全局JS脚本'
        });
        /* field.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        }); */
        context.newRecord.setValue("custpage_global_field_by_frize_grids_row_and_cols_", frizeScript);
    }

    return {
        beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        //afterSubmit: afterSubmit
    }
});

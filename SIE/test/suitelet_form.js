/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define([
    'N/ui/serverWidget'
], function(
    ui
) {

    function onRequest(context) {
        var form = ui.createForm({
            title : 'test'
        })

        form.clientScriptModulePath = './protlet_html_cs'

        form.addButton({
            id : 'custpage_search',
            label : 'search',
            functionName : 'search'
        })

        form.addFieldGroup({
            id : 'custpage_group',
            label : '字段组'
        })

        var innerField = form.addField({
            id : 'custpage_inline',
            label : 'inner',
            type : 'INLINEHTML'
        })
        innerField.defaultValue = '<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script><div id ="test" style="height : 200px"></div>'

        form.addField({
            id : 'custpage_test',
            label : '测试',
            type : 'checkbox',
            container : 'custpage_group'
        })

        form.addField({
            id : 'custpage_customer',
            label : '客户',
            type : 'select',
            source : 'customer',
            container : 'custpage_group'
        })

        var sublistObj = form.addSublist({
            id : 'custpage_list',
            label : '子列表',
            type : 'INLINEEDITOR'
        })

        sublistObj.addField({
            id : 'custpage_employee',
            label : '测试',
            type : 'select',
            source : 'employee'
        })

        sublistObj.addField({
            id : 'custpage_date',
            label : 'date',
            type : 'date'
        })

        sublistObj.setSublistValue({
            id : 'custpage_employee',
            value : 10,
            line : 0
        })

        context.response.writePage(form)
    }

    return {
        onRequest: onRequest
    }
});

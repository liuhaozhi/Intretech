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

        form.clientScriptModulePath = './a_cs'

        form.addButton({
            id : 'custpage_test',
            label : 'test_message',
            functionName : 'openchild'
        })

        form.addField({
            id: 'custpage_text',
            label : 'text',
            type : 'text'
        })

        context.response.writePage(form)
    }

    return {
        onRequest: onRequest
    }
});

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

        form.clientScriptModulePath = './b_cs'
        form.addSubmitButton({
            label : '提交'
        })

        context.response.writePage(form)
    }

    return {
        onRequest: onRequest
    }
});

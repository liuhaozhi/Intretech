/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([], function() {

    function beforeLoad(context) {
        if(context.type === 'view')
        {
            addPrintButton(context.form,context.newRecord)
        }
    }

    function addPrintButton(form,newRecord){
        form.clientScriptModulePath = '../cs/creditmemo_cs'
        form.addButton({
            id : 'custpage_printPdf',
            label : '打印Pdf',
            functionName : 'printPdf(' + newRecord.id + ')'
        })

        form.addButton({
            id : 'custpage_printExcel',
            label : '打印Excel',
            functionName : 'printExcel(' + newRecord.id + ')'
        })
    }

    return {
        beforeLoad: beforeLoad
    }
});

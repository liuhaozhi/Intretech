/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    'N/url'
], function(
    url
) {

    function pageInit(context) {
        
    }

    function printElement(params){
        setWindowChanged(window, false)

        window.location = url.resolveScript({
            scriptId : 'customscript_print_response',
            deploymentId : 'customdeploy_print_response',
            params : params
        })
    }

    function printPdf(id){
        printElement({
            id : id,
            type : 'pdf',
            action : 'print',
            printType : 'creditInvoice'
        })
    }

    function printExcel(id){
        printElement({
            id : id,
            type : 'excel',
            action : 'print',
            printType : 'creditInvoice'
        })
    }

    return {
        printPdf : printPdf,
        printExcel : printExcel,
        pageInit: pageInit
    }
});

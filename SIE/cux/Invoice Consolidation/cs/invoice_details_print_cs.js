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

    function printPackpdf(id){
        printElement({
            id : id,
            type : 'pdf',
            action : 'print',
            printType : 'packlist'
        })
    }

    function printPackExcel(id){
        printElement({
            id : id,
            type : 'excel',
            action : 'print',
            printType : 'packlist'
        })
    }

    function prinTransportInvoicPdf(id){
        printElement({
            id : id,
            type : 'pdf',
            action : 'print',
            printType : 'transportInvoice'
        })
    }

    function prinTransportInvoicExcel(id){
        printElement({
            id : id,
            type : 'excel',
            action : 'print',
            printType : 'transportInvoice'
        })
    }

    function printElement(params){
        setWindowChanged(window, false)

        window.location = url.resolveScript({
            scriptId : 'customscript_print_response',
            deploymentId : 'customdeploy_print_response',
            params : params
        })
    }

    return {
        pageInit: pageInit,
        printPackpdf : printPackpdf,
        printPackExcel : printPackExcel,
        prinTransportInvoicPdf : prinTransportInvoicPdf,
        prinTransportInvoicExcel : prinTransportInvoicExcel

    }
});

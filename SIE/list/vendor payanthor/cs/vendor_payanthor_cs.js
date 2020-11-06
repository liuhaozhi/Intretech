/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define([], function() {
    function payToJor(id){
        window.open('/app/accounting/transactions/journal.nl?whence=&type=vdotherpay&payid='+ id)
    }

    function pageInit(context) {
        
    }

    return {
        payToJor : payToJor,
        pageInit : pageInit
    }
});

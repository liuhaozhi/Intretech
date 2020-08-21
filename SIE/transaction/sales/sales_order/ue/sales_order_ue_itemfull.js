/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    
], function() {

    function beforeLoad(context) {
        var fillment = ['pendingFulfillment' , 'pendingBillingPartFulfilled' , 'partiallyFulfilled']
        var status = context.newRecord.getValue({
            fieldId : 'statusRef'
        })

        if(fillment.indexOf(status) > -1)
        {
            addFillButton(context.form,context.newRecord)
        }
        log.error(status)
    }

    function addFillButton(form,newRecord){
        form.clientScriptModulePath = '../cs/sales_order_cs'
        form.addButton({
            id : 'custpage_itemFullment',
            label : '出库（cux）',
            functionName : 'itemFullment(' + newRecord.id + ')'
        })
    }

    return {
        beforeLoad: beforeLoad
    }
});

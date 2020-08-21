/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    '../../../helper/operation_assistant'
], function(assistant) {
    function fieldChanged(context) {
        var fieldId = context.fieldId
        var currentRec = context.currentRecord

        if(fieldId === 'apply' || fieldId === 'total' || fieldId === 'paymentmethod' || fieldId === 'currency')
        setLocalTotal(currentRec)
    }

    function setLocalTotal(currentRec){
        var exchangerate = currentRec.getValue('exchangerate')

        currentRec.setValue({
            fieldId : 'custbody_total_local_currency',
            value : assistant.mul(exchangerate || 0 , currentRec.getValue('total') || 0)
        })
    }

    return {
        fieldChanged: fieldChanged
    }
});

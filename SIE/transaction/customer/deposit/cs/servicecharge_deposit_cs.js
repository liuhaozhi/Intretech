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

        if(fieldId === 'payment' || fieldId === 'custbody_service_charge_amount' || fieldId === 'currency')
        setTotal(currentRec)
    }

    function setTotal(currentRec){
        currentRec.setValue({
            fieldId : 'custbody_ar_total_amoun',
            value : assistant.add(
                currentRec.getValue('payment') || 0,
                currentRec.getValue('custbody_service_charge_amount') || 0
            )
        })

        currentRec.setValue({
            fieldId : 'custbody_total_local_currency',
            value : assistant.mul(
                currentRec.getValue('exchangerate') || 0,
                currentRec.getValue('custbody_ar_total_amoun') || 0
            )
        })
    }

    return {
        fieldChanged: fieldChanged
    }
});

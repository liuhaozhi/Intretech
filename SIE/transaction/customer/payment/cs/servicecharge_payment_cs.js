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
        var payment = currentRec.getValue('payment')

        if(fieldId === 'custbody_shijishoukuanjine')
        {
            var reality = currentRec.getValue(fieldId)
  
            if(payment && reality)
            {
                currentRec.setValue({
                    fieldId : 'custbody_service_charge_amount',
                    value : assistant.sub(payment , reality)
                })
            }
        }
    }

    return {
        fieldChanged: fieldChanged
    }
});

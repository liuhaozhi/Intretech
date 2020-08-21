/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([], function() {
    function fieldChanged(context) {
        var currRec = context.currentRecord
        var fieldId = context.fieldId
        var sublistId = 'recmachcustrecord_cust_price_list_link'

        if(fieldId === 'custrecord_cust_price_item_name'){
            currRec.setCurrentSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_selling_price_subsidiary',
                value : currRec.getValue('custrecord_osubsidiary_main')
            })

            currRec.setCurrentSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_selling_price_department',
                value : currRec.getValue('custrecord_department_main')
            })
        }
    }

    return {
        fieldChanged: fieldChanged
    }
});

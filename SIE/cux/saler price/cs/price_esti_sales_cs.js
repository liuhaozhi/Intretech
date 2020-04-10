/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([], function() {
    function fieldChanged(context) {
        if(context.fieldId === 'custcol_unit_notax')
        {
            var currentRec = context.currentRecord
            var formerPrice= currentRec.getCurrentSublistValue({
                sublistId : 'item',
                fieldId : context.fieldId
            })

            if(formerPrice)
            {
                var discount = +currentRec.getCurrentSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_fdiscount'
                }) / 100

                currentRec.setCurrentSublistValue({
                    sublistId : 'item',
                    fieldId : 'rate',
                    value : discount ? formerPrice * discount : formerPrice
                })      
            }
        }
    }

    return {
        fieldChanged: fieldChanged
    }
});

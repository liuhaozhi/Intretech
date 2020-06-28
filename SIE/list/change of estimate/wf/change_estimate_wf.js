/**
 *@NApiVersion 2.x
 *@NScriptType WorkflowActionScript
 */
define([
    'N/record'
], function(
    record
) {

    function onAction(scriptContext) {
        var newRecord = scriptContext.newRecord
        var lineCount = newRecord.getLineCount({
            sublistId : 'recmachcustrecord_link_changestimate'
        })
        var estRec    = record.load({
            type : 'estimate',
            id : newRecord.getValue('custrecord_estimatechange_order')
        })

        var lineQuantityChanges = volidLineQuantity(estRec,newRecord,lineCount)
    }

    function volidLineQuantity(estRec,newRecord,lineCount){
        for(var i = 0 ; i < lineCount ; i ++)
        {
            var currQuantity = newRecord.getSublistValue({
                sublistId : 'recmachcustrecord_link_changestimate',
                fieldId : 'custrecord_c_quantity',
                line : i
            })
            var plaNumber   = newRecord.getSublistValue({
                sublistId : 'recmachcustrecord_link_changestimate',
                fieldId : 'custrecord_c_custcol_plan_number',
                line : i
            })
            var estRecLine  = estRec.findSublistLineWithValue({
                sublistId : 'item',
                fieldId : 'custcol_plan_number',
                value : plaNumber
            })

            if(estRecLine > -1)
            {
                var estLineQuantity = estRec.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'quantity',
                    line : estRecLine
                })

                if(estLineQuantity.toString() !== currQuantity.toString())
                {
                    newRecord.setSublistValue({
                        sublistId : 'recmachcustrecord_link_changestimate',
                        fieldId : 'custrecord_quantity_beforech',
                        value : estLineQuantity,
                        line : i
                    })
                }
            }
        }
    }

    return {
        onAction: onAction
    }
});

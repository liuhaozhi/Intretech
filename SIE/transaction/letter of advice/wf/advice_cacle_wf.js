/**
 *@NApiVersion 2.x
 *@NScriptType WorkflowActionScript
 */
define([
    'N/record',
    'N/search',
    '../../helper/operation_assistant'
], function(
    record,
    search,
    operation
) {
    function onAction(scriptContext) {
        cancelOrder(scriptContext.newRecord)
    }

    function cancelOrder(newRecord){
        var lineCount = newRecord.getLineCount({
            sublistId : 'item'
        })

        for(var i = 0 ; i < lineCount ; i ++)
        {
            var estimate = newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_salesorder',
                line : i
            })
            var planum = newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_plan_number',
                line : i
            })
            var quantity = newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'quantity',
                line : i
            })

            search.create({
                type : 'customrecord_shipping_plan',
                filters : [
                    ['custrecord_p_custcol_plan_number' , 'is' , planum],
                    'AND',
                    ['custrecord_p_custcol_salesorder' , 'anyof' , [estimate]]
                ],
                columns : ['custrecord_quantity_shipped']
            })
            .run()
            .each(function(res){
                record.submitFields({
                    type : 'customrecord_shipping_plan',
                    id : res.id,
                    values : {
                        custrecord_salesorder_shipped : false,
                        custrecord_quantity_shipped : operation.sub(res.getValue('custrecord_quantity_shipped') , quantity)
                    }
                })

                return true
            })
        }
    }

    return {
        onAction: onAction
    }
});

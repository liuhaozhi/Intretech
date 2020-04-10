/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/search'
], function(
    search
) {

    function beforeLoad(context) {
        if(!context.oldRecord)
        {
            var newRecord = context.newRecord
            var realityInvTotal = +newRecord.getValue('custbody_actual_amount_to_be_invoiced')
            if(realityInvTotal)
            {
                var createdfrom = newRecord.getValue('createdfrom')
                if(createdfrom)
                {
                    var salesTotal  = search.lookupFields({
                        type : 'salesorder',
                        id : createdfrom,
                        columns : ['total','exchangerate']
                    })
                    log.error(salesTotal.total,salesTotal.exchangerate)
                    updateLineItemPrice({
                        newRecord : newRecord,
                        total : salesTotal.total / salesTotal.exchangerate,
                        realityInvTotal : realityInvTotal
                    })
                }
            }
        }
    }

    function updateLineItemPrice(params){
        var newRecord = params.newRecord
        var discount = params.realityInvTotal / params.total
        var lineCount= newRecord.getLineCount({
            sublistId : 'item'
        })

        for(var i = 0; i < lineCount; i ++)
        {
            newRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'rate',
                line : i,
                value : +newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'rate',
                    line : i
                }) * discount
            })
        }
    }

    return {
        beforeLoad: beforeLoad
    }
});

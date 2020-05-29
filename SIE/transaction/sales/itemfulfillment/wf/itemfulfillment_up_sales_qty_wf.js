/**
 *@NApiVersion 2.x
 *@NScriptType WorkflowActionScript
 */
define([
    'N/record',
    '../../../helper/operation_assistant'
], function(
    record,
    operation
) {

    function onAction(scriptContext) {
        updateSalesLineQuantity(scriptContext.newRecord)
    }

    function updateSalesLineQuantity(newRecord){
        var sublistLines = getLineItems(newRecord)
        log.error('sublistLines',sublistLines)

        for(var key in sublistLines)
        {
            if(!!key)
            {
                var item = sublistLines[key]
                var salesOrd = record.load({
                    type : 'estimate',
                    id : key
                })
    
                for(var line in item)
                {
                    var index = getIndex(salesOrd,line)
                    
                    if(index > -1)
                    {
                        salesOrd.setSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_out_of_stock',
                            line : index,
                            value : operation.add(
                                salesOrd.getSublistValue({
                                    sublistId : 'item',
                                    fieldId : 'custcol_out_of_stock',
                                    line : index
                                }) || 0,
                                item[line]
                            )
                        })
                    }
                }
    
                salesOrd.save()
            }
        }
    }

    function getIndex(salesOrd,line){
        var index = salesOrd.findSublistLineWithValue({
            sublistId : 'item',
            fieldId : 'custcol_line',
            value : line
        })

        if(index < 0)
        {
            index = salesOrd.findSublistLineWithValue({
                sublistId : 'item',
                fieldId : 'custcol_line',
                value : line.slice(0,line.indexOf('.'))
            })
        }

        return index
    }

    function getLineItems(newRecord){
        var sublistLines = new Object()
        var lineCount = newRecord.getLineCount({
            sublistId : 'item'
        })

        for(var i = 0 ; i < lineCount ; i ++){
            var custline = newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_line',
                line : i
            })
            var salesorder = newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_salesorder',
                line : i
            })
            var quantity = newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'quantity',
                line : i
            })

            if(!sublistLines[salesorder])
            sublistLines[salesorder] = new Object()

            if(!sublistLines[salesorder][custline])
            sublistLines[salesorder][custline] = quantity
        }

        return sublistLines
    }

    return {
        onAction: onAction
    }
});

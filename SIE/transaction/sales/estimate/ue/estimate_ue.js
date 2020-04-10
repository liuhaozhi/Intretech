/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/record',
    'N/task'
], function(record,task) {
    function afterSubmit(context){
        
        if(context.type === 'create')
        {
            setLineItemSaleId(context.newRecord)
        }
    }

    function setLineItemSaleId(recordInfo){
        var newRecord = record.load({
            type : recordInfo.type,
            id : recordInfo.id
        })
        var itemCount = newRecord.getLineCount({
            sublistId : 'item'
        })

        for(var i = 0 ; i < itemCount ; i ++)
        {
            newRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_salesorder',
                line : i,
                value : recordInfo.id
            })

            if(newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'expectedshipdate',
                line : i
            }))
            {
                if(!newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_before_date',
                    line : i
                }))
                newRecord.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_before_date',
                    line : i,
                    value : newRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'expectedshipdate',
                        line : i
                    })
                })
            }  
        }

        newRecord.save({
            ignoreMandatoryFields : true
        })
    }

    return {
        afterSubmit: afterSubmit
    }
});

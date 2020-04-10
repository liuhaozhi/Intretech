/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define([
    'N/record'
], function(
    record
) {
    function afterSubmit(context) {
        if(context.type === 'edit')
        {
            var newRecord = context.newRecord
            var oldRecord = context.oldRecord

            if(oldRecord.getValue('custrecord_p_custcol_approval_status') !== newRecord.getValue('custrecord_p_custcol_approval_status'))
            {
                if(newRecord.getValue('custrecord_p_custcol_approval_status') === '2')
                {
                    approveRecord(newRecord)
                }
            }
        }
    }

    function approveRecord(newRecord){
        var type = newRecord.getValue('custrecord_approval_type')

        switch(type)
        {
            case '1':
                add(newRecord)
            break
            case '2':
                edit(newRecord)
            break
            case '3':
                deleter(newRecord)
            break
            default :
            break
        }
    }

    function add(newRecord){
        var orderRecord = record.load({
            type : 'estimate',
            id : newRecord.getValue({fieldId : 'custrecord_p_custcol_salesorder'})
        })
        var index = getInsetIndex(
            newRecord.getValue({fieldId : 'custrecord_p_custcol_line'}),
            orderRecord
        )

        orderRecord.insertLine({
            sublistId : 'item',
            line : index
        })

        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_salesorder',
            line : index,
            value : orderRecord.id
        })

        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_line',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_custcol_line'})
        })

        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'quantity',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_quantity'})
        })

        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'expectedshipdate',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_expectedshipdate'}) 
        })

        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custrecord_p_custcol_before_date',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_expectedshipdate'}) 
        }) 

        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'item',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_item'})
        })

        if(newRecord.getValue({fieldId : 'custrecord_p_custcol_cgoodsname'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_cgoodsname',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_custcol_cgoodsname'})
        })

        if(newRecord.getValue({fieldId : 'custrecord_p_description'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'description',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_description'})
        })

        if(newRecord.getValue({fieldId : 'custrecord_p_custcol_unit_notax'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_unit_notax',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_custcol_unit_notax'})
        })

        if(newRecord.getValue({fieldId : 'custrecord_p_rate'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'rate',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_rate'})
        })

        if(newRecord.getValue({fieldId : 'custrecord_p_taxcode'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'taxcode',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_taxcode'})
        })

        if(newRecord.getValue({fieldId : 'custrecord_p_custcol_cdiscount'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_cdiscount',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_custcol_cdiscount'})
        })

        if(newRecord.getValue({fieldId : 'custrecord_p_custcol_fdiscount'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_fdiscount',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_custcol_fdiscount'})
        })

        if(newRecord.getValue({fieldId : 'custrecord_p_custcol_unit_tax'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_unit_tax',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_custcol_unit_tax'})
        })

        if(newRecord.getValue({fieldId : 'custrecord_p_custcol_funit'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_funit',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_custcol_funit'})
        })

        if(newRecord.getValue({fieldId : 'custrecord_p_custcol_suggest_date'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_suggest_date',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_custcol_suggest_date'})
        })

        if(newRecord.getValue({fieldId : 'custrecord_p_custcol_indiscount'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_indiscount',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_custcol_indiscount'})
        })

        if(newRecord.getValue({fieldId : 'custrecord_p_custcol_inrate'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_inrate',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_custcol_inrate'})
        })

        if(newRecord.getValue({fieldId : 'custrecord_p_custcol_effective_mode'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_effective_mode',
            line : index,
            value : newRecord.getValue({fieldId : 'custrecord_p_custcol_effective_mode'})
        })

        var parentIndex =  orderRecord.findSublistLineWithValue({
            sublistId : 'item',
            fieldId : 'custcol_line',
            value : newRecord.getValue('custrecord_p_custcol_line').slice(0,item.line.indexOf('.'))
        })

        if(parentIndex > -1)
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'quantity',
            line : parentIndex,
            value : operation.sub(
                orderRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'quantity',
                    line : parentIndex
                }),
                newRecord.getValue('custrecord_p_quantity')
            )
        })
    }

    
    function getInsetIndex(lineNum,orderRecord){
        var currIndex = -1
        var lineCount = orderRecord.getLineCount({
            sublistId : 'item'
        })
       
        if(lineNum.indexOf('.') > -1)
        {
            var star = lineNum.slice(0,lineNum.indexOf('.'))
            currIndex = orderRecord.findSublistLineWithValue({
                sublistId : 'item',
                fieldId : 'custcol_line',
                value : (++star).toString()
            })
        }

        return currIndex === -1 ? lineCount : currIndex
    }

    return {
        afterSubmit: afterSubmit
    }
});

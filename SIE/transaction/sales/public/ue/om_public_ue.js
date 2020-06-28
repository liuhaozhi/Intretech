/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    '../../../helper/operation_assistant'
], function(operation) {

    function beforeSubmit(context) {
        if(context.type === 'create' || context.type === 'edit')
        {
            var newRecord = context.newRecord
            var lineCount = newRecord.getLineCount({
                sublistId : 'item'
            })

            while(lineCount > 0)
            {
                --lineCount
                var exchangerate = newRecord.getValue('exchangerate')
                var quantity = getSubValue('quantity',lineCount,newRecord)
                var price = getSubValue('custcol_unit_notax',lineCount,newRecord)
                var textRate = parseFloat(getSubValue('taxrate1',lineCount,newRecord))
                var fdiscount = parseFloat(getSubValue('custcol_fdiscount',lineCount,newRecord))
                var rate = operation.mul(price || 0, isNaN(fdiscount) ? 1 :  fdiscount / 100)
                var hasTaxRate = operation.mul(price || 0, operation.add(1 , isNaN(textRate) ? 0 : textRate / 100 ))
                var disHasTaxRate = operation.mul(rate , operation.add(1 , isNaN(textRate) ? 0 : textRate / 100 ))
                var discountAmount = operation.mul(operation.sub(hasTaxRate, disHasTaxRate)  , quantity)
                var amount = operation.mul(rate,quantity).toFixed(2)
                var taxAmt = operation.mul(amount,isNaN(textRate) ? 0 : textRate / 100).toFixed(2)
    
                setSubValue('rate' , rate , lineCount , newRecord) //折后单价 不含税
                setSubValue('custcol_unit_tax' , hasTaxRate , lineCount , newRecord) //折前单价（含税)
                setSubValue('custcol_funit' , disHasTaxRate , lineCount , newRecord) //折后单价 (含税)
                setSubValue('custcol_om_before_discount' , operation.mul(price , quantity) , lineCount , newRecord) //折前金额（不含税）
                setSubValue('custcol_before_tax' , operation.mul(hasTaxRate , quantity) , lineCount , newRecord) //折前金额（含税）
                setSubValue('custcol_discount' , discountAmount , lineCount , newRecord) //总折扣额
                setSubValue('custcol_om_total_discount' , operation.mul(discountAmount , exchangerate) , lineCount , newRecord) //总折扣额(本币)
                setSubValue('custcol_trueamount' , operation.add(
                    operation.mul(amount,exchangerate).toFixed(2),
                    operation.mul(taxAmt,exchangerate).toFixed(2)
                ) , lineCount , newRecord) //折后含税总金额（本币）
            }
        }
    }

    function setSubValue(fieldId,value,line,newRecord){
        newRecord.setSublistValue({ 
            sublistId : 'item',
            fieldId : fieldId,
            value : value,
            line : line
        })
    }

    function getSubValue(fieldId,line,newRecord){
        return newRecord.getSublistValue({
            sublistId : 'item',
            fieldId : fieldId,
            line : line
        })
    }
    
    return {
        beforeSubmit: beforeSubmit
    }
});

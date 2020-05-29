/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    '../../../helper/operation_assistant'
], function(
    operation
) {
    function validateLine(context) {
        var currentRecord = context.currentRecord

        doSomeThing(currentRecord)
        setCurrentLineItemPriceInfo({
            rate : currentRecord.getCurrentSublistValue({ //折后单价  
                sublistId : 'item',
                fieldId : 'rate'
            }),
            price : currentRec.getCurrentSublistValue({  //折前单价  
                sublistId : 'item',
                fieldId : 'custcol_unit_notax',
                value : params.price
            }),
            currentRec : currentRecord
        })
        return true
    }

    function doSomeThing(currentRec){
        var quantity = currentRec.getCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'quantity'
        })
        var amount = currentRec.getCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'amount'
        })
        var taxAmt = currentRec.getCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'tax1amt'
        })
        var exchangerate =  currentRec.getValue({
            fieldId : 'exchangerate'
        })

        currentRec.setCurrentSublistValue({ //折后含税总金额（本币）
            sublistId : 'item',
            fieldId : 'custcol_trueamount',
            value : operation.add(
                operation.mul(amount,exchangerate).toFixed(2),
                operation.mul(taxAmt,exchangerate).toFixed(2)
            )
        })

        currentRec.setCurrentSublistValue({ //折扣额
            sublistId : 'item',
            fieldId : 'custcol_discount',
            value : operation.mul(
                operation.sub( currentRec.getCurrentSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_unit_tax'
                }) || 0 ,  
                currentRec.getCurrentSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_funit'
                }) || 0) || 0 ,
                quantity
            ) 
        })

        currentRec.setCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_before_tax',
            value : operation.mul(
                currentRec.getCurrentSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_unit_tax'
                }) || 0, quantity
            )
        })
    }

    function setCurrentLineItemPriceInfo(params){
        var currentRec = params.currentRec
        var textRate   = parseFloat(currentRec.getCurrentSublistText({
            sublistId : 'item',
            fieldId : 'taxrate1' 
        }))
        
        currentRec.setCurrentSublistValue({  //折前单价  不含税
            sublistId : 'item',
            fieldId : 'custcol_unit_tax',
            value : operation.mul(params.price , operation.add(1 , isNaN(textRate) ? 0 : textRate / 100 ))
        })

        currentRec.setCurrentSublistValue({  //折后单价  含税
            sublistId : 'item',
            fieldId : 'custcol_funit',
            value : operation.mul(params.rate , operation.add(1 , isNaN(textRate) ? 0 : textRate / 100 ))
        })
    }

    return {
        validateLine: validateLine
    }
});

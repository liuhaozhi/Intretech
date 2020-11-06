/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    'N/format',
    '../../../helper/operation_assistant'
], function(
    format,
    operation
) {
    var currentRec = undefined
    function fieldChanged(context){
        if(!currentRec)
        currentRec = context.currentRecord

        if(context.fieldId === 'custcol_unit_notax' || context.fieldId === 'custcol_fdiscount' || context.fieldId === 'quantity' || context.fieldId === 'taxrate1' ||  context.fieldId === 'currency')
        {
            var exchangerate = currentRec.getValue('exchangerate') || 1
            var quantity = getCurrentSubValue('quantity') || 0
            var price = getCurrentSubValue('custcol_unit_notax') || 0
            var textRate = parseFloat(getCurrentSubValue('taxrate1'))
            var fdiscount = parseFloat(getCurrentSubValue('custcol_fdiscount'))
            var rate = operation.mul(price || 0, isNaN(fdiscount) ? 1 :  fdiscount / 100)
            var hasTaxRate = operation.mul(price || 0, operation.add(1 , isNaN(textRate) ? 0 : textRate / 100 ))
            var disHasTaxRate = operation.mul(rate , operation.add(1 , isNaN(textRate) ? 0 : textRate / 100 ))
            var discountAmount = operation.mul(operation.sub(hasTaxRate, disHasTaxRate)  , quantity)
            var amount = operation.mul(rate,quantity).toFixed(2)
            var taxAmt = operation.mul(amount,isNaN(textRate) ? 0 : textRate / 100).toFixed(2)

            setCurrentSubValue('rate' , rate) //折后单价 不含税
            setCurrentSubValue('custcol_unit_tax' , hasTaxRate) //折前单价（含税)
            setCurrentSubValue('custcol_funit' , disHasTaxRate) //折后单价 (含税)
            setCurrentSubValue('custcol_om_before_discount' , operation.mul(price , quantity)) //折前金额（不含税）
            setCurrentSubValue('custcol_before_tax' , operation.mul(hasTaxRate , quantity)) //折前金额（含税）
            setCurrentSubValue('custcol_discount' , discountAmount) //总折扣额
            setCurrentSubValue('custcol_om_total_discount' , operation.mul(discountAmount , exchangerate)) //总折扣额(本币)
            setCurrentSubValue('custcol_trueamount' , operation.add(
                operation.mul(amount,exchangerate).toFixed(2),
                operation.mul(taxAmt,exchangerate).toFixed(2)
            )) //折后含税总金额（本币）
        }

        if(context.fieldId === 'custcol_cdiscount')
        {
            setCurrentSubValue('custcol_fdiscount',getCurrentSubValue('custcol_cdiscount'))
        }
    }

    function setCurrentSubValue(fieldId,value){
        currentRec.setCurrentSublistValue({ 
            sublistId : 'item',
            fieldId : fieldId,
            value : value
        })
    }

    function getCurrentSubValue(fieldId){
        return currentRec.getCurrentSublistValue({
            sublistId : 'item',
            fieldId : fieldId
        })
    }

    function lineInit(context){
        console.log('enter')
        var domesticTotal = operation.mul(currentRec.getValue('total') , currentRec.getValue('exchangerate'))

        jQuery('#domesticTotal').html(format.format({
            type : format.Type.CURRENCY,
            value :domesticTotal
        }))

        return true
    }
  
   function pageInit(context){
     currentRec = context.currentRecord
   }

    return {
        pageInit : pageInit,
        lineInit : lineInit,
        fieldChanged : fieldChanged
    }
});

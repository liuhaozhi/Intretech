/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    '../../helper/operation_assistant'
], function(assistant) {
    var currentRe = undefined
    var cacheInfo = undefined

    function pageInit(context) {
        currentRe = context.currentRecord
        cacheInfo = JSON.parse(currentRe.getValue('custbody_sales_cache') || "{}")
    }

    function fieldChanged(context) {
        var fieldId = context.fieldId
        var planNum  =  currentRe.getCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_plan_number'
        })

        if(fieldId === 'quantity')
        {
            if(!volidQuantity(currentRe))
            currentRe.setCurrentSublistValue({
                sublistId : 'item',
                fieldId : 'quantity',
                value : cacheInfo.quantitys[planNum]
            })
        }
    }

    function volidQuantity(currentRe){
        debugger
        var planNum  =  currentRe.getCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_plan_number'
        })
        var quantity = currentRe.getCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'quantity'
        })
        var difference = assistant.sub(quantity || 0 , cacheInfo.quantitys[planNum])

        if(quantity < cacheInfo.quantitysFulfilled[planNum])
        {
            alert('变更后数量不能低于已出库数量')
            return false
        }

        if(difference > cacheInfo.salesInfo[planNum]){
            alert('总数量不得大于订单可发货数量')
            return false
        }

        return true
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    }
})

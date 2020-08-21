/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    '../../../helper/operation_assistant'
], function(assistant) {
    function fieldChanged(context) {
        debugger
        var fieldId = context.fieldId
        var currentRec = context.currentRecord
        var payment = currentRec.getValue('payment')

        if(fieldId === 'custbody_shijishoukuanjine')
        {
            var reality = currentRec.getValue(fieldId)
  
            if(payment && reality)
            {
                currentRec.setValue({
                    fieldId : 'custbody_service_charge_amount',
                    value : assistant.sub(payment , reality)
                })
            }
        }

        if(fieldId === 'currency')
        {
            currentRec.setValue({
                fieldId : 'custbody_ar_total_amoun',
                value : 0
            })
    
            currentRec.setValue({
                fieldId : 'custbody_total_local_currency',
                value : 0
            })
        }

        if(fieldId === 'disc' || fieldId === 'amount' || fieldId === 'paymentmethod' || fieldId === 'apply')
        setLineTotal(currentRec)
    }

    function pageInit(context){
        setLineTotal(context.currentRecord)
    }

    function setLineTotal(currentRec){
        var disc = currentRec.getCurrentSublistValue({
            sublistId : 'apply',
            fieldId : 'disc'
        })
        var amount = currentRec.getCurrentSublistValue({
            sublistId : 'apply',
            fieldId : 'amount'
        })

        currentRec.setCurrentSublistValue({
            sublistId : 'apply',
            fieldId : 'custbody_ar_total_amoun',
            value : assistant.add(disc || 0, amount || 0)
        })

        setTotal(currentRec)
    }

    function getDisc(currentRec){
        var total = 0
        var lineCount = currentRec.getLineCount({
            sublistId : 'apply'
        })

        while(lineCount >  0)
        {
            total = assistant.add(total , currentRec.getSublistValue({
                sublistId : 'apply',
                fieldId : 'disc',
                line : --lineCount
            }))
        }

        return total
    }

    function setTotal(currentRec){
        var disc = getDisc(currentRec)
        var exchangerate = currentRec.getValue('exchangerate')

        currentRec.setValue({
            fieldId : 'custbody_ar_total_amoun',
            value : assistant.add(disc , currentRec.getValue('applied') || 0) 
        })

        currentRec.setValue({
            fieldId : 'custbody_total_local_currency',
            value : assistant.mul(
                exchangerate,
                assistant.add(disc , currentRec.getValue('applied') || 0) 
            ) 
        })
    }

    return {
        pageInit : pageInit,
        fieldChanged: fieldChanged
    }
});

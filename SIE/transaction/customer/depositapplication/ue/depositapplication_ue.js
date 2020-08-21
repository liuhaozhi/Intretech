/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/search'
], function(search) {
    function beforeLoad(context) {
        if(context.type === 'create')
        setRawTotal(context.newRecord) 
    }

    function setRawTotal(newRecord){
        var deposit = newRecord.getValue('deposit')
        
        if(deposit)
        var payment = search.lookupFields({
            type : 'customerdeposit',
            id : deposit,
            columns : ['total']
        }).total

        if(payment)
        newRecord.setValue({
            fieldId : 'custbody_ar_total_amoun',
            value : payment
        })
    }

    return {
        beforeLoad: beforeLoad
    }
});

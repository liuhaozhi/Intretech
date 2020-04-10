/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/search',
    'N/currency',
    '../helper/credit_sign_of_operation'
], function(
    search,
    currency,
    operation
) {
    function afterSubmit(context) {
        var newRecord = context.newRecord
        var oldRecord = context.oldRecord
        var customer  = undefined
        var exchangerate = undefined
        if(!oldRecord) //新建
        {
            var fieldId  = fieldName(newRecord.type)

            customer = newRecord.getValue('customer') || newRecord.getValue('entity')
            exchangerate = getExchangerate(customer, newRecord.getValue('currency'),newRecord.getValue('trandate'))
            operation.changeCredit({
                oldTotal : operation.mul(newRecord.getValue(fieldId),exchangerate),
                customer : customer
            })     
        }
        else if(!newRecord) //删除
        {
            var fieldId  = fieldName(oldRecord.type)

            customer = oldRecord.getValue('customer') || oldRecord.getValue('entity')
            exchangerate = getExchangerate(customer, oldRecord.getValue('currency'),oldRecord.getValue('trandate'))     
            operation.changeCredit({
                newTotal : operation.mul(oldRecord.getValue(fieldId),exchangerate),
                customer : customer
            })           
        }
        else //编辑
        {
            var fieldId  = fieldName(newRecord.type)

            customer = newRecord.getValue('customer') || newRecord.getValue('entity')
            exchangerate = getExchangerate(customer, newRecord.getValue('currency'),newRecord.getValue('trandate'))
            operation.changeCredit({
                newTotal : operation.mul(oldRecord.getValue(fieldId),exchangerate),
                oldTotal : operation.mul(newRecord.getValue(fieldId),exchangerate),
                customer : customer
            })           
        }
    }

    function fieldName(recordType){
        return recordType === 'creditmemo' ? 'total' : 'payment'
    }

    function getExchangerate(customer,recordCurrency,trandate){
        return currency.exchangeRate({
            source : recordCurrency,
            target : search.lookupFields({
                type : 'customer',
                id : customer,
                columns : ['currency']
            }).currency[0].value,
            date : trandate
        })
    }

    return {
        beforeSubmit: afterSubmit
    }
});

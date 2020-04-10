/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

define([
    'N/search',
    'N/ui/message',
    '../helper/credit_sign_of_operation'
], function(
    search,
    message,
    operation
) {
    var currentType = undefined
    var messageBuild= null
    var messageParms = {
        ERROR : {
            title : '拦截' , 
            type : 'ERROR' , 
            message : '该用户已超信使用，实施管控</br>'
        },
        WARNING : {
            title : '警报' , 
            type : 'WARNING' , 
            message : '用户信用使用已达警戒线</br>'
        }
    }

    function pageInit(context) {
        var currentRec = context.currentRecord
        var customer = currentRec.getValue('entity')
        currentType = currentRec.type
        if(customer)
        {
            control(null,customerCredit(customer))
        }
    }

    function fieldChanged(context){
        if(context.fieldId === 'entity')
        {
            var currentRec = context.currentRecord
            var customer = currentRec.getValue('entity')
            if(customer)
            {
                if(messageBuild)
                {
                    messageBuild.hide()
                    messageBuild = null
                }     
                control(null,customerCredit(customer))
            }
        }
    }

    function control(currTotal,creditInfo){
        var intercept = listValue(creditInfo.custentity_credit_intercept)
        var creditAmount = +creditInfo.custentity_credit_amount
        var alarmAmount  = +creditInfo.custentity_credit_alarm_limit
        var creditUsed   = operation.add(creditInfo.custentity_credit_used , currTotal || 0)

        if(creditAmount)
        {               
            if(patternMatching(intercept,currentType))
            {
                var creditLimit = listValue(creditInfo.custentity_credit_limit)
                var overCredit = creditUsed > creditAmount ? true : false
    
                if(creditLimit === '1') //警报
                {
                    isShow(creditUsed , alarmAmount , messageParms.WARNING , creditInfo, currTotal || 0)                  
                }
                else //拦截
                {
                    if(overCredit)
                    {
                        isShow(creditUsed , alarmAmount , messageParms.ERROR , creditInfo, currTotal || 0)
                    }
                    else
                    {
                        isShow(creditUsed , alarmAmount , messageParms.WARNING , creditInfo, currTotal || 0)
                    }                   
                }
            }
        }
        return true
    }

    function patternMatching(intercept,currentType){
        return intercept === '1' || 
        intercept === '2' && currentType === 'estimate' ||  
        intercept === '3' && currentType === 'salesorder'
    }

    function isShow(used,limit,messageInfo,creditInfo,currTotal){
        if(used >= limit)
        {
            customerCreditUseInfo = CreditUseInfo(currTotal,creditInfo)
            messageBuild = message.create({
                title : messageInfo.title,
                message : messageInfo.message + customerCreditUseInfo,
                type : message.Type[messageInfo.type]
            }).show()
        }
    }

    function CreditUseInfo(currTotal,creditInfo){
        var stringArr = new Array()

        stringArr.push(
            '总额度:' + creditInfo.custentity_credit_amount,
            '警戒额度:' + creditInfo.custentity_credit_alarm_limit,       
            '已使用额度:' + creditInfo.custentity_credit_used,
            '本次交易金额:' + currTotal   
        )

        return stringArr.join(';')
    }

    function saveRecord(context) {
      return true
    }

    function listValue(listobj){
        if(listobj[0]) return listobj[0].value
        return false
    }

    function customerCredit(customer,currTotal){
        return search.lookupFields({
            type : 'customer',
            id : customer,
            columns : [
                'custentity_credit_limit',
                'custentity_credit_amount',
                'custentity_credit_used',
                'custentity_credit_alarm_limit',
                'custentity_credit_intercept'
            ]
        })
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        fieldChanged: fieldChanged
    }
});

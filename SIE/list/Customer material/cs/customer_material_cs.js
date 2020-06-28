/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    'N/url',
    'N/https'
], function(
    url,
    https
) {
    function fieldChanged(context) {
        var currtRec = context.currentRecord

        if(context.fieldId === 'name' || context.fieldId === 'custrecord_intretech_goods')
        {
            var fieldValue = currtRec.getCurrentSublistValue({
                sublistId : 'recmachcustrecord_connactid',
                fieldId : context.fieldId
            })

            if(fieldValue)
            volidRepeat({
                fieldId : context.fieldId,
                currtRec : currtRec,
                fieldValue : fieldValue
            })
        }
    }

    function volidRepeat(params){
        var lineCount = params.currtRec.getLineCount({
            sublistId : 'recmachcustrecord_connactid'
        })

        for(var i = 0 ; i < lineCount ; i ++)
        {
            var listValue = params.currtRec.getSublistValue({
                sublistId : 'recmachcustrecord_connactid',
                fieldId : params.fieldId,
                line : i
            })

            if(params.fieldValue === listValue)
            {
                alert('第' + (i + 1) + '行已录入此号码')

                params.currtRec.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord_connactid',
                    fieldId : params.fieldId,
                    value : ''
                })

                return false
            }
        }

        var response = https.post({
            url : url.resolveScript({
                scriptId : 'customscript_customer_mater_response',
                deploymentId : 'customdeploy_customer_mater_response'
            }),
            body : {
                value : params.fieldValue,
                action : 'volidRepeat',
                fieldId : params.fieldId,
              	companys : params.currtRec.getValue('custrecord_companys'),
                department : params.currtRec.getValue('custrecord_departments'),
                customer : params.currtRec.getValue('custrecord_cust')
            }
        })

        var body = JSON.parse(response.body)

        if(body.status === 'sucess')
        {
            if(body.isRepeat === true)
            {
                alert('此号码已被录入')
                
                params.currtRec.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord_connactid',
                    fieldId : params.fieldId,
                    value : ''
                })
            }
        }
        else
        {
            alert(body.message)
        }

        console.log(response)
    }

    return {
        fieldChanged: fieldChanged
    }
});

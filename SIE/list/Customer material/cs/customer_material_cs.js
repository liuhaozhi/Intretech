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
        var fieldId  = context.fieldId

        if(fieldId === 'name' || fieldId === 'custrecord_intretech_goods')
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

    function setDefault (currRec){

        currRec.setCurrentSublistValue({
            sublistId : 'recmachcustrecord_connactid',
            fieldId : 'custrecord_company_son',
            value : currRec.getValue('custrecord_companys')
        })

        currRec.setCurrentSublistValue({
            sublistId : 'recmachcustrecord_connactid',
            fieldId : 'custrecord_depart',
            value : currRec.getValue('custrecord_departments')
        })

        currRec.setCurrentSublistValue({
            sublistId : 'recmachcustrecord_connactid',
            fieldId : 'custrecord_customer',
            value : currRec.getValue('custrecord_cust')
        })

        return true
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

        setDefault(params.currtRec)

        console.log(response)
    }

    return {
        fieldChanged: fieldChanged
    }
});

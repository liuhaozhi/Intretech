/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    'N/url',
    'N/https'
], function(url , https) {
    function fieldChanged(context) {
        var currRec = context.currentRecord
        var fieldId = context.fieldId
        var sublistId = 'recmachcustrecord_cust_price_list_link'

        if(fieldId === 'custrecord_cust_price_item_name'){
            currRec.setCurrentSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_selling_price_subsidiary',
                value : currRec.getValue('custrecord_osubsidiary_main')
            })

            currRec.setCurrentSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_selling_price_department',
                value : currRec.getValue('custrecord_department_main')
            })
        }

        if(fieldId === 'custrecord_selling_price_client' || fieldId === 'custrecord_cust_price_item_name'){
            var item = currRec.getCurrentSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_cust_price_item_name'
            })
            var customer = currRec.getCurrentSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_selling_price_client'
            })
            var department = currRec.getCurrentSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_selling_price_department'
            })
            var subsidiary = currRec.getCurrentSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_selling_price_subsidiary'
            })

            
            if(item && customer && department && subsidiary)
            {
                setItemRelated({
                    currentRec : currRec,
                    body : {
                        item : item,
                        fieldId : 'item',
                        action : 'getRelated',
                        customer : customer,
                        sublistId : sublistId,
                        department : department,
                        subsidiary : subsidiary
                    }
                })
            }
        }
    }

    function setItemRelated(params){
        debugger
        var currentRec = params.currentRec
        var response = https.post({
            url : url.resolveScript({
                scriptId : 'customscript_om_changefield_response',
                deploymentId : 'customdeploy_om_changefield_response'
            }),
            body : params.body
        })

        var body = JSON.parse(response.body)

        if(body.customerItem)
        {
            if(currentRec.getCurrentSublistValue({
                sublistId : params.body.sublistId,
                fieldId : 'custrecord_cust_item_customer_number',
            }) !== body.customerItem)
            currentRec.setCurrentSublistValue({
                sublistId : params.body.sublistId,
                fieldId : 'custrecord_cust_item_customer_number',
                value : body.customerItem
            })
        }
    }

    return {
        fieldChanged: fieldChanged
    }
});

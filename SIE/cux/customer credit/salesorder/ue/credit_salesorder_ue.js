/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/search',
    '../../public/helper/credit_sign_of_operation'
], function(
    search,
    operation
) {
    function isNotNre(type){
        return type !== '1'
    }

    function afterSubmit(context) {
        var ordertype = undefined
        var newRecord = context.newRecord
        if(context.type === context.UserEventType.CREATE)
        {
            var createForm = newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_salesorder',
                line : 0
            })

            if(createForm)
            {
                ordertype = search.lookupFields({
                    type : 'estimate',
                    id : createForm,
                    columns : [
                        'custbody_cust_ordertype'
                    ]
                })

                if(ordertype.custbody_cust_ordertype[0].value && isNotNre(ordertype.custbody_cust_ordertype[0].value))
                {
                    try
                    {
                        operation.changeCredit({
                            newTotal : operation.afterRateTotal(newRecord.id,newRecord.getValue('entity'),newRecord.getValue('subsidiary')),
                            customer : newRecord.getValue('entity')
                        })
                    }    
                    catch(e)
                    {
                        throw(e)
                    }
                }
            }
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});


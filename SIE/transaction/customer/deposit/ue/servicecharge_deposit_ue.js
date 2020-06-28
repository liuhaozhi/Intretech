/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *description  处理手续费
 */
define([
    'N/record'
], function(
    record
) {
    function afterSubmit(context) {
        var newRecord = context.newRecord
        if(newRecord)
        {
            var serviceTotal = newRecord.getValue('custbody_service_charge_amount')
            if(serviceTotal)
            {
                createServiceRecord({
                    type : newRecord.type,
                    recordId : newRecord.id,
                    serviceTotal : serviceTotal,
                    trandate : newRecord.getValue({
                        fieldId : 'trandate'
                    })
                })
            }
        }
    }

    function createServiceRecord(parmas){
        var serviceRecord = record.copy({
            type : parmas.type,
            id : parmas.recordId,
            isDynamic : true
        })

        serviceRecord.setValue({
            fieldId : 'undepfunds',
            value : 'F'
        })

         serviceRecord.setValue({
            fieldId : 'trandate',
            value : parmas.trandate
        })

        serviceRecord.setValue({
            fieldId : 'account',
            value : 661
        })

        serviceRecord.setValue({
            fieldId : 'payment',
            value : parmas.serviceTotal
        })
        
        serviceRecord.setValue({
            fieldId : 'custbody_service_charge_amount',
            value : ''
        })

        try
        {
            var serviceRecordId = serviceRecord.save({
                ignoreMandatoryFields : true
            })

            if(serviceRecordId)
            {
                var serviceRecord = record.load({
                    type : parmas.type,
                    id : serviceRecordId,
                    isDynamic : true
                })

                serviceRecord.save()
                
                record.submitFields({
                    type : parmas.type,
                    id : parmas.recordId,
                    values : {
                        custbody_precoding : parmas.recordId,
                        custbodycustbody_source_id : serviceRecordId
                    }
                })

                record.submitFields({
                    type : parmas.type,
                    id : serviceRecordId,
                    values : {
                        custbody_precoding : parmas.recordId,
                        custbodycustbody_source_id : parmas.recordId
                    } 
                })
            }
        }catch(e)
        {
            throw('error',e.message)
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});

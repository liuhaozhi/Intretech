/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *description  处理手续费
 */
define([
    'N/record',
    'N/search'
], function(
    record,
    search
) {
    function afterSubmit(context) {
        if(context.type === 'create')
        {
            var newRecord = context.newRecord
            var serviceTotal = newRecord.getValue('custbody_service_charge_amount')
            if(serviceTotal)
            {
                createServiceRecord({
                    tranid : search.lookupFields({
                        type : newRecord.type,
                        id : newRecord.id,
                        columns : ['tranid']
                    }).tranid,
                    type : newRecord.type,
                    recordId : newRecord.id,
                    subsidiary : newRecord.getValue('subsidiary'),
                    trandate : newRecord.getValue('trandate'),
                    account : newRecord.getValue('account'),
                    currency : newRecord.getValue('currency'),
                    postingperiod : newRecord.getValue('postingperiod'),
                    serviceTotal : serviceTotal
                })
            }
        }
    }

    function createServiceRecord(parmas){
        var serviceRecord = record.create({
            type : 'journalentry',
            isDynamic : true
        })

        serviceRecord.setValue({
            fieldId : 'subsidiary',
            value : parmas.subsidiary
        })

        serviceRecord.setValue({
            fieldId : 'trandate',
            value : parmas.trandate
        })

        serviceRecord.setValue({
            fieldId : 'currency',
            value : parmas.currency
        })
        
        serviceRecord.setValue({
            fieldId : 'memo',
            value : parmas.tranid
        })

        serviceRecord.setValue({
            fieldId : 'postingperiod',
            value : parmas.postingperiod
        })

        serviceRecord.selectNewLine({
            sublistId : 'line'
        })

        serviceRecord.setCurrentSublistValue({
            sublistId : 'line',
            fieldId : 'account',
            value : 748
        })

        serviceRecord.setCurrentSublistValue({
            sublistId : 'line',
            fieldId : 'custcol_cseg_cn_cfi',
            value : 7
        })

        serviceRecord.setCurrentSublistValue({  //借
            sublistId : 'line',
            fieldId : 'debit',
            value : parmas.serviceTotal
        })

        serviceRecord.commitLine({
            sublistId : 'line'
        })

        serviceRecord.selectNewLine({
            sublistId : 'line'
        })

        serviceRecord.setCurrentSublistValue({
            sublistId : 'line',
            fieldId : 'account',
            value : parmas.account
        })

        serviceRecord.setCurrentSublistValue({  //借
            sublistId : 'line',
            fieldId : 'credit',
            value : parmas.serviceTotal
        })

        serviceRecord.commitLine({
            sublistId : 'line'
        })

        try
        {
            var serviceRecordId = serviceRecord.save({
                ignoreMandatoryFields : true
            })

            if(serviceRecordId)
            {
                var serviceRecord = record.load({
                    type : 'journalentry',
                    id : serviceRecordId
                })
                
                serviceRecord.save()

                record.submitFields({
                    type : parmas.type,
                    id : parmas.recordId,
                    values : {
                        custbodycustbody_source_id : serviceRecordId
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

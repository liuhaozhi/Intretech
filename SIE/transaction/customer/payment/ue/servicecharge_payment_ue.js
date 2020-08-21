/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *description  处理手续费
 */
define([
    'N/record',
    'N/search',
    '../../../helper/operation_assistant'
], function(
    record,
    search,
    assistant
) {
    function beforeLoad(context){
        insertHackStyle(context)
        log.error(context.type)
        if(context.type === 'create')
        setLineTotal(context.newRecord)
    }

    function setLineTotal(newRecord){
        var lineCount = newRecord.getLineCount({
            sublistId : 'apply'
        })

        while(lineCount > 0)
        {
            var apply = newRecord.getSublistValue({
                sublistId : 'apply',
                fieldId : 'apply',
                line : --lineCount
            })
            log.error(apply)
            if(apply)
            {
                var disc = newRecord.getSublistValue({
                    sublistId : 'apply',
                    fieldId : 'disc',
                    line : lineCount
                })
                var amount = newRecord.getSublistValue({
                    sublistId : 'apply',
                    fieldId : 'amount',
                    line : lineCount
                })

                newRecord.setSublistValue({
                    sublistId : 'apply',
                    fieldId : 'amount',
                    line : line,
                    value : assistant.add(disc || 0 , amount || 0)
                })
            }
        }
    }

    function insertHackStyle(context){
        context.form.addField({
            type : 'inlinehtml',
            label : 'hackstyle',
            id : 'custpage_hackstyle'
        }).defaultValue = '<script>'+
        'var timeOut = setTimeout(function(){' +
            'var content1 = jQuery(".listheader:contains(手续费)");' +
            'var content2 = jQuery(".listheader:contains(实际收款金额)");' +
            'if(content1.length === 0 || content2.length === 0){' +
                'jQuery(".listheader:contains(应得折扣)").text("手续费");' +
                'jQuery(".listheader:contains(付款)").text("实际收款金额");' +
            '}else{' +
                'clearTimeout(timeOut)' +
            '}' +
        '}, 50)' +
        '</script>'
    }

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
            value : 661
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
        beforeLoad : beforeLoad,
        afterSubmit : afterSubmit
    }
});

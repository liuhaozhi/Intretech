/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */

define([
    'N/record',
    'N/runtime'
], function(
    record,
    runtime
) {
    var allPlanFields = undefined
    var savePlanFields = undefined
    var fieldRegExPrefix  = 'custrecord_p_'
    var currScriptContext = runtime.getCurrentScript()
    var estimateRecordId  = currScriptContext.getParameter({
        name : 'custscript_estimate_recordid'
    })

    function execute(context) {
        var estimate = record.load({
            type : 'estimate',
            id : estimateRecordId
        })
        var lineCount = estimate.getLineCount({
            sublistId : 'item'
        })

        for(var i = 0 ; i < lineCount ; i++)
        {
            var planRecord  = record.create({
                type : 'customrecord_shipping_plan'
            })

            planRecord.setValue({
                fieldId : 'custrecord_copysubsidiary',
                value : estimate.getValue({
                    fieldId : 'subsidiary'
                })
            })

            if(!allPlanFields) allPlanFields = planRecord.getFields()
            if(!savePlanFields)
            {
                savePlanFields = allPlanFields.filter(function(item){
                    return item.indexOf(fieldRegExPrefix) > -1
                })
            }

            for(var j = 0 ; j < savePlanFields.length ; j ++)
            {
                var fieldId = savePlanFields[j].replace(fieldRegExPrefix,'')

                if(fieldId === 'custbody_ifexport')
                {
                    planRecord.setValue({
                        fieldId : savePlanFields[j],
                        value : estimate.getValue({
                            fieldId : fieldId
                        })
                    })
                }
                else
                {
                    planRecord.setValue({
                        fieldId : savePlanFields[j],
                        value : estimate.getSublistValue({
                            sublistId : 'item',
                            fieldId : fieldId === 'custcol_cn_cfi' ? 'custcol_cseg_cn_cfi' : fieldId,
                            line : i
                        })
                    })
                }

            }

            var planId = planRecord.save()

            if(planId){
                record.submitFields({
                    type : 'customrecord_shipping_plan',
                    id : planId,
                    values : {
                        custrecord_edit_link : '/app/common/custom/custrecordentry.nl?rectype=257&fromrecord=' + planId
                    }
                })
            }
        }
    }

    return {
        execute: execute
    }
});

/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/record',
    'N/search'
], function(record,search) {
    function afterSubmit(context){
        
        if(context.type === 'create')
        {
            setLineItemSaleId(context.newRecord)
        }

        if(context.type === 'edit'){
            log.error(context.type)
            if(context.newRecord.getValue('custbody_workchange') === true)
            updatePlan(context.newRecord)
        }
    }

    function updatePlan(newRecord){
        var lineCount = newRecord.getLineCount({
            sublistId : 'item'
        })
        var workInfo = new Object()
 
        for(var i = 0 ; i < lineCount ; i ++){
            var line = newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_line',
                line : i
            })

            workInfo[line] = {
                workDate : newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_completion_date',
                    line : i
                }),
                picking : newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_pick_id',
                    line : i
                }),
                workNum : newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_work_order_number',
                    line : i
                })
            }
        }

        updatePlanWorkInfo(workInfo,newRecord.id)
    }

    function updatePlanWorkInfo(workInfo,recordId){
        search.create({
            type : 'customrecord_shipping_plan',
            filters : [
                ['custrecord_p_custcol_salesorder' , 'anyof' , [recordId]]
            ],
            columns : ['custrecord_p_custcol_line']
        })
        .run()
        .each(function(res){
            var line = res.getValue('custrecord_p_custcol_line')
            var item = workInfo[line] ? workInfo[line] : workInfo[line.slice(0,line.indexOf('.'))]

            record.submitFields({
                type : 'customrecord_shipping_plan',
                id : res.id,
                values : {
                    custrecord_p_custcol_completion_date : item.workDate,
                    custrecord_p_custcol_pick_id : item.picking,
                    custrecord_p_custcol_work_order_number : item.workNum
                }
            })

            return true
        })

        record.submitFields({
            type : 'estimate',
            id : recordId,
            values : {
                custbody_workchange : false
            }
        })
    }

    function setLineItemSaleId(recordInfo){
        var newRecord = record.load({
            type : recordInfo.type,
            id : recordInfo.id
        })
        var itemCount = newRecord.getLineCount({
            sublistId : 'item'
        })

        for(var i = 0 ; i < itemCount ; i ++)
        {
            newRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_salesorder',
                line : i,
                value : recordInfo.id
            })

            if(newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'expectedshipdate',
                line : i
            }))
            {
                if(!newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_before_date',
                    line : i
                }))
                newRecord.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_before_date',
                    line : i,
                    value : newRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'expectedshipdate',
                        line : i
                    })
                })
            }  
        }

        newRecord.save({
            ignoreMandatoryFields : true
        })
    }

    return {
        afterSubmit: afterSubmit
    }
});

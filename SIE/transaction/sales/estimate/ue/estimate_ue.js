/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/record',
    'N/search'
], function(record,search) {
    function beforeSubmit(context){
        if(context.type === 'create')
        {
            setLineAndExpenDate(context.newRecord)
        }
    }

    function setLineAndExpenDate(newRecord){
        var itemCount = newRecord.getLineCount({
            sublistId : 'item'
        })
  
        for(var i = 0 ; i < itemCount ; i ++)
        {
            var expectedshipdate = newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'expectedshipdate',
                line : i
            })

            if(expectedshipdate)
            {
                var suggestDate = newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_suggest_date',
                    line : i
                })

                if(!suggestDate)
                newRecord.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_suggest_date',
                    line : i,
                    value : expectedshipdate
                })
            }

            newRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_line',
                line : i,
                value : (i + 1).toString()
            })
        }
    }

    function afterSubmit(context){
        
        if(context.type === 'create')
        {
            setLineItemSalesId(context.newRecord)
        }

        if(context.type === 'edit'){
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

    function setLineItemSalesId(recordInfo){
        var newRecord = record.load({
            type : recordInfo.type,
            id : recordInfo.id
        })
        var itemCount = newRecord.getLineCount({
            sublistId : 'item'
        })
        var newRranid = updateSalesOrderCode(newRecord)

        for(var i = 0 ; i < itemCount ; i ++)
        {
            var line = newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_line',
                line : i
            })

            newRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_plan_number',
                line : i,
                value : newRranid.replace(/[0]{1,}/,'') + line
            })

            newRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_salesorder',
                line : i,
                value : recordInfo.id
            })
        }

        newRecord.save({
            ignoreMandatoryFields : true
        })
    }

    function updateSalesOrderCode(orderRecord){
        var tranid = orderRecord.getValue({'fieldId': 'tranid'})
        var orderType = orderRecord.getValue({'fieldId' : 'custbody_cust_ordertype'})

        search.create({
            type : 'customrecord_sales_order_type_code',
            filters : [
                {
                    'name'    : 'custrecord_sales_order_type',
                    'operator': search.Operator.ANYOF,
                    'values'  : [orderType]
                }
            ],
            'columns' : [
                {'name':'custrecord_pre_code'}
            ]
        })
        .run()
        .each(function(res){
            var orderTypeCode = res.getValue({'name':'custrecord_pre_code'})
            tranid = orderTypeCode + tranid

            orderRecord.setValue({
                fieldId : 'tranid',
                value : tranid
            })
        })

        return tranid
    }


    return {
        beforeSubmit : beforeSubmit,
        afterSubmit: afterSubmit
    }
});

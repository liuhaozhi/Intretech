/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define([
    'N/format',
    'N/search',
    'N/record',
    'N/workflow',
    '../../helper/wrapper_runtime',
    '../../helper/operation_assistant'
], function(
    format,
    search,
    record,
    workflow,
    runtime,
    operation
) {

    function onRequest(context) {
        var request = context.request
        var response= context.response
        var params  = request.parameters
            
        if(request.method === 'GET')
        {
            if(params.action === 'ratify') 
            ratifyPlan(params,response) //批准

            if(params.action === 'refuse')
            refusePlan(params,response) //拒绝
        }
    }

    function getCheckInfo(params){
        return JSON.parse(params.checked)
    }

    function ratifyPlan(params,response){ //批准 
        var checkedEle = getCheckEle(getCheckInfo(params))

        checkedEle.map(function(ele){
            try
            {
                workflow.trigger({
                    recordType : 'customrecord_cust_price_item_list',
                    recordId   : ele.id,
                    workflowId : 'customworkflow_om_priceapp',
                    actionId : 'workflowaction2982'
                })

                var currDay = operation.getDateWithTimeZone({
                    date: new Date(),
                    timezone: runtime.getUserTimezone()
                })
                var effectiveDate = format.parse({
                    type : format.Type.DATE,
                    value : search.lookupFields({
                        type : 'customrecord_cust_price_item_list',
                        id : ele.id,
                        columns : ['custrecord_item_effective_date']
                    }).custrecord_item_effective_date
                }) 

                if(effectiveDate.getTime() <= currDay.getTime())
                {
                    record.submitFields({
                        type : 'customrecord_cust_price_item_list',
                        id : ele.id,
                        values : {
                            custrecord_selling_price_effective_stat : '2',
                            custrecord_item_effective_date : currDay
                        }
                    })
                }
                else
                {
                    record.submitFields({
                        type : 'customrecord_cust_price_item_list',
                        id : ele.id,
                        values : {
                            custrecord_selling_price_effective_stat : '1'
                        }
                    })
                }
            }
            catch(e)
            {
                throw e.message
            }
        })

        response.write('sucess')
    }

    function getCheckEle(checkedInfo){
        var items = new Array()

        for(var key in checkedInfo)
        {
            if(checkedInfo[key].checked === 'T')
            {
                items.push({id : key , memo : checkedInfo[key].memo})
            }
        }

        return items
    }

    function refusePlan(params,response){ //拒绝
        var checkedEle = getCheckEle(getCheckInfo(params))

        checkedEle.map(function(ele){
            try
            {
                workflow.trigger({
                    recordType : 'customrecord_cust_price_item_list',
                    recordId   : ele.id,
                    workflowId : 'customworkflow_om_priceapp',
                    actionId : 'workflowaction2983'
                })

                record.submitFields({
                    type : 'customrecord_cust_price_item_list',
                    id : ele.id,
                    values : {
                        custrecord_refusereason : ele.memo
                    }
                })
            }
            catch(e)
            {
                throw e.message
            }
        })

        response.write('sucess')
    }

    return {
        onRequest: onRequest
    }
});

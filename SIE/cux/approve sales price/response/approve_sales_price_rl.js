/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define([
    'N/format',
    'N/search',
    'N/record',
    'N/workflow',
    '../../helper/wrapper_runtime',
    '../../helper/operation_assistant'
], 
    (format,search,record,workflow,runtime,operation) => {
        function post(context) {
            const {action , checked} = context

            if(action === 'ratify')
            return ratifyPlan(checked)

            if(action === 'refuse')
            return refusePlan(checked)

            return 'wlgxx'
        }

        const parseCheck = check => JSON.parse(check)

        const ratifyPlan = check => {
            const checkedEle = getCheckEle(parseCheck(check))

            checkedEle.map(function(ele){
                try
                {
                    workflow.trigger({
                        recordType : 'customrecord_cust_price_item_list',
                        recordId   : ele.id,
                        workflowId : 'customworkflow_om_priceapp',
                        actionId : 'workflowaction2924'
                    })
    
                    const currDay = operation.getDateWithTimeZone({
                        date: new Date(),
                        timezone: runtime.getUserTimezone()
                    })

                    const effectiveDate = format.parse({
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
                                custrecord_statuss : '2',
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
                                custrecord_statuss : '2',
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
    
            return 'sucess'
        }

        const refusePlan = check => {
            const checkedEle = getCheckEle(parseCheck(check))

            checkedEle.map(function(ele){
                try
                {
                    workflow.trigger({
                        recordType : 'customrecord_cust_price_item_list',
                        recordId   : ele.id,
                        workflowId : 'customworkflow_om_priceapp',
                        actionId : 'workflowaction2925'
                    })
    
                    record.submitFields({
                        type : 'customrecord_cust_price_item_list',
                        id : ele.id,
                        values : {
                            custrecord_statuss : '3',
                            custrecord_refusereason : ele.memo
                        }
                    })
                }
                catch(e)
                {
                    throw e.message
                }
            })

            return 'sucess'
        }

        const getCheckEle = checkedInfo => {
            const items = new Array()
    
            for(var key in checkedInfo)
            {
                if(checkedInfo[key].checked === 'T')
                {
                    items.push({id : key , memo : checkedInfo[key].memo})
                }
            }
    
            return items
        }

        return { post}
    }
)

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
        var items = new Array()
        var itemIds = new Array()
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
                    var filter = record.lookupFields({
                        type : 'customrecord_cust_price_item_list',
                        id : ele.id,
                        columns : [
                            'custrecord_selling_price_unit',
                            'custrecord_cust_price_item_name',
                            'custrecord_selling_price_client',
                            'custrecord_selling_price_currency',
                            'custrecord_selling_price_subsidiary',
                            'custrecord_cust_item_customer_number'
                        ]
                    })

                    itemIds.push(ele.id)

                    items.push({
                        unit : filter.custrecord_selling_price_unit[0].value,
                        item : filter.custrecord_cust_price_item_name[0].value,
                        customer : filter.custrecord_selling_price_client[0].value,
                        currency : filter.custrecord_selling_price_currency[0].value,
                        subsidiary : filter.custrecord_selling_price_subsidiary[0].value,
                        customerProductCode : filter.custrecord_cust_item_customer_number[0]
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

        if(items.length > 0) failureAndUpdateItemPrice(items,itemIds,currDay) 

        response.write('sucess')
    }

    function priceSearch(params){
        var type = 'customrecord_cust_price_item_list'

        return search.create({
            type : type,
            filters : priceFilters(params.items),
            columns : params.columns || []
        }).run()
    }

    function failureAndUpdateItemPrice(items,itemIds,today){
        priceSearch.priceSearch({items : items})
        .each(function(res){
            record.submitFields({
                type : RECORDTYPE,
                id : res.id,
                values : {
                    custrecord_item_expiry_date : today,
                    custrecord_selling_price_effective_stat : '3'
                }
            })
            return true
        })

        updateItemPrice(itemIds,today)
    }

    function updateItemPrice(itemIds,today){
        itemIds.map(function(id){
            record.submitFields({
                type : RECORDTYPE,
                id : id,
                values : {
                    custrecord_selling_price_effective_stat : '2',
                    custrecord_item_effective_date : today
                }
            })
        })
    }

    function priceFilters(items){
        var filters = new Array()

        for(var i = 0; i < items.length; i ++)
        {
            var item = items[i]
            var itemFilter = new Array()
            itemFilter.push(
                ['custrecord_selling_price_unit' , 'anyof' , [item.unit]],
                'AND',
                ['custrecord_cust_price_item_name' , 'anyof' , [item.item]],
                'AND',
                ['custrecord_selling_price_client' , 'anyof' , [item.customer]],
                'AND',
                ['custrecord_selling_price_currency' , 'anyof' , [item.currency]],
                'AND',
                ['custrecord_selling_price_subsidiary' , 'anyof' , [item.subsidiary]],
                'AND',
                ['custrecord_selling_price_effective_stat' , 'anyof' , ['2']]
            )

            if(item.customerProductCode)
            {
                itemFilter.push(
                    'AND',
                    ['custrecord_cust_item_customer_number' , 'anyof' , [item.customerProductCode.value]]
                )
            }

            filters.push(itemFilter)

            if(items.length > 1 && i <= items.length - 2)
            {
                filters.push('OR')
            }
        }

        return filters
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

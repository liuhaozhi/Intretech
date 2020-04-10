/**
 *@NApiVersion 2.x
 *@NScriptType WorkflowActionScript
 */
define([
    'N/record',
    '../public/price_search',
    '../public/price_update_assistant'
], function(
    record,
    priceSearch,
    assistant
) {

    var RECORDTYPE = 'customrecord_cust_price_item_list'

    function onAction(context) {
        updatePrice(context.newRecord)
    }

    function updatePrice(newRecord){
        var timeZone = 8 * 60 * 60 * 1000
        var items = new Array()
        var itemIds = new Array()
        var currDay = assistant.currDate() 
        var sublistId = 'recmachcustrecord_cust_price_list_link'
        var currDayTimeZone = new Date(currDay.getFullYear(),currDay.getMonth(),currDay.getDate(),0).getTime()
        var count = newRecord.getLineCount({
            sublistId : sublistId
        })

        for(var i = 0; i < count; i ++)
        {
            var effectiveDate = newRecord.getSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_item_effective_date',
                line : i
            })
            log.error('effectiveDate',JSON.stringify(effectiveDate))
            if((effectiveDate.getTime() - timeZone) <= currDayTimeZone)  //等待批量优化
            {
                items.push({
                    unit : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_selling_price_unit',
                        line : i
                    }),
                    item : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_cust_price_item_name',
                        line : i
                    }),
                    customer : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_selling_price_client',
                        line : i
                    }),
                    currency : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_selling_price_currency',
                        line : i
                    }),
                    subsidiary : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_selling_price_subsidiary',
                        line : i
                    }),
                    customerProductCode : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_cust_item_customer_number',
                        line : i
                    })
                })

                itemIds.push(newRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'id',
                    line : i
                }))
            }
        }

        if(itemIds.length > 0) failureAndUpdateItemPrice(items,itemIds,new Date(currDayTimeZone))  
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

    return {
        onAction: onAction
    }
});

/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    '../public/price_search',
    '../../customer credit/public/helper/credit_sign_of_operation'
], function(
    priceSearch,
    operation
) {
    function beforeSubmit(context) {
        if(!context.oldRecord)
        {
            var newRecord = context.newRecord
            log.error(newRecord.getValue('custbody_price_isupdate'))
            if(!newRecord.getValue('custbody_price_isupdate'))
            {
                var count = newRecord.getLineCount({
                    sublistId : 'item'
                })
                var subsidiary = newRecord.getValue('subsidiary')
                var currency   = newRecord.getValue('currency')
                var customer   = newRecord.getValue('entity')
                var ITEMGROUP  = itemsGroup({
                    count : count,
                    record : newRecord,
                    currency : currency,
                    customer : customer,
                    subsidiary : subsidiary
                })
    
                setItemInfo({
                    count : count,
                    record : newRecord,
                    quantitys : ITEMGROUP.quantitys,
                    itemResult: priceSearch.ItemResult(ITEMGROUP)
                })
    
                log.error('itemsGroup',priceSearch.ItemResult(ITEMGROUP))
            }
        }
    }

    function setItemInfo(params){
        var count = params.count
        var record = params.record
        var quantitys = params.quantitys
        var itemResult= params.itemResult
        for(var i = 0; i < count; i ++)
        {
            var item = record.getSublistValue({
                sublistId : 'item',
                fieldId : 'item',
                line : i
            })

            record.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_itemcount',
                line : i,
                value : quantitys[item]
            })

            if(itemResult[item])
            {
                record.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_effective_mode',
                    line : i,
                    value : itemResult[item].mode
                })
    
                record.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'rate',
                    line : i,
                    value : itemResult[item].price
                })
    
                record.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'taxrate1',
                    line : i,
                    value : parseFloat(itemResult[item].taxrate1)
                })
            }
        }
    }

    function itemsGroup(params){
        var items  = new Array()
        var record = params.record
        var count  = params.count
        var quantitys  = new Object()
        var currency   = params.currency
        var customer   = params.customer
        var subsidiary = params.subsidiary

        for(var i = 0; i < count; i ++)
        {
            var item = record.getSublistValue({
                sublistId : 'item',
                fieldId : 'item',
                line : i
            })

            var quantity = +record.getSublistValue({
                sublistId : 'item',
                fieldId : 'quantity',
                line : i
            })

            items.push({
                item : item,
                unit :  record.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'units',
                    line : i
                }),
                currency : currency,
                customer : customer,
                subsidiary : subsidiary
            })

            quantitys[item] ? quantitys[item] = operation.add(quantitys[item],quantity) : quantitys[item] = quantity
        }

        return {
            items : items,
            quantitys : quantitys
        }
    }

    return {
        beforeSubmit: beforeSubmit
    }
});

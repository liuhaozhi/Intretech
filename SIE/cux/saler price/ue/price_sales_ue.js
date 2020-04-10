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
        var newRecord = context.newRecord
        if(context.type === 'create')
        {
            updateItemPrice(newRecord)       
        }
    }

    function updateItemPrice(newRecord){
        var itemInfo = itemsGroup({
            newRecord : newRecord,
            currency : newRecord.getValue('currency'),
            customer : newRecord.getValue('entity'),
            subsidiary : newRecord.getValue('subsidiary')
        })

        if(itemInfo.items.length)
        {
            var itemPrice = priceSearch.ItemResult({
                items : itemInfo.items,
                quantitys : itemInfo.quantitys
            })

            log.error('itemPrice',itemPrice)
    
            Object.keys(itemInfo.lines).map(function(res){
                if(itemPrice[res])
                {
                    setPrice({
                        newRecord : newRecord,
                        lines : itemInfo.lines[res],
                        price : itemPrice[res].price
                    })
                }
            })
        } 
    }

    function setPrice(params){
        params.lines.map(function(index){
            var discount = parseFloat(params.newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_fdiscount',
                line : index
            }))

            log.error(index,operation.mul(params.price , discount / 100))
            params.newRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'rate',
                value : operation.mul(params.price , discount / 100),
                line : index
            })

            params.newRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_unit_notax',
                value : params.price,
                line : index
            })
        })
    }

    function itemsGroup(params){
        var items  = new Array()
        var lines  = new Object()
        var quantitys = new Object()
        var newRecord = params.newRecord
        var lineCount = newRecord.getLineCount({
            sublistId : 'item'
        })

        for(var i = 0 ; i < lineCount ; i ++)
        {
            var mode = newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_effective_mode',
                line : i
            })

            if(mode === '2')
            {
                var item = newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'item',
                    line : i
                })
                var quantity = newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'quantity',
                    line : i
                })
                var unit = newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'units',
                    line : i
                })
                var customerProductCode = newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_cgoodscode',
                    line : i
                })

                items.push({
                    item : item,
                    unit : unit,
                    currency : params.currency,
                    customer : params.customer,
                    subsidiary : params.subsidiary,
                    customerProductCode : customerProductCode
                })

                lines[item] ? lines[item].push(i) : lines[item] = [i]
                quantitys[item] = quantitys[item] ? operation.add(quantitys[item] , quantity) : quantity
            }
        }

        return {
            lines : lines,
            items : items,
            quantitys : quantitys
        }
    }

    return {
        beforeSubmit : beforeSubmit
    }
});

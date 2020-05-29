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
            var textRate   = parseFloat(params.newRecord.getSublistText({
                sublistId : 'item',
                fieldId : 'taxrate1',
                line : index
            }))
            var quantity = params.newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'quantity',
                line : index
            })
            var amount = params.newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'amount',
                line : index
            })
            var taxAmt = params.newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'tax1amt',
                line : index
            })
            var exchangerate =  params.newRecord.getValue({
                fieldId : 'exchangerate'
            })
            var rate = operation.mul(params.price , discount / 100)
            var amount = operation.mul(rate,quantity).toFixed(2)
            var taxAmt = operation.mul(amount,isNaN(textRate) ? 0 : textRate / 100).toFixed(2)

            params.newRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'rate',
                value : rate,
                line : index
            })

            params.newRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_unit_notax',
                value : params.price,
                line : index
            })
    
            params.newRecord.setSublistValue({  //折前单价  含税
                sublistId : 'item',
                fieldId : 'custcol_unit_tax',
                line : index,
                value : operation.mul(params.price , operation.add(1 , isNaN(textRate) ? 0 : textRate / 100 ))
            })
    
            params.newRecord.setSublistValue({  //折后单价  含税
                sublistId : 'item',
                fieldId : 'custcol_funit',
                line : index,
                value : operation.mul(rate , operation.add(1 , isNaN(textRate) ? 0 : textRate / 100 ))
            })

            params.newRecord.setSublistValue({ //折后含税总金额（本币）
                sublistId : 'item',
                fieldId : 'custcol_trueamount',
                line : index,
                value : operation.add(
                    operation.mul(amount,exchangerate).toFixed(2),
                    operation.mul(taxAmt,exchangerate).toFixed(2)
                )
            })

            params.newRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_before_tax',
                line : index,
                value : operation.mul(operation.mul(params.price,quantity) , (1 + (isNaN(textRate) ? 0 : textRate / 100 ))) 
            })

            params.newRecord.setSublistValue({ //折扣额
                sublistId : 'item',
                fieldId : 'custcol_discount',
                line : index,
                value : operation.mul(
                    operation.sub(params.newRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'custcol_unit_tax',
                        line : index
                    }) || 0 ,  
                    params.newRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'custcol_funit',
                        line : index
                    }) || 0) || 0 ,
                    quantity
                ) 
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

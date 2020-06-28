/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    '../public/price_search',
    '../../customer credit/public/helper/credit_sign_of_operation'
], function(
    priceSearch,
    operation
) {
    function pageInit(context){
        console.log(3)
        context.currentRecord.setValue({
            fieldId : 'custbody_price_isupdate',
            value : true
        })
    }

    function fieldChanged(context) {
        var currentRec = context.currentRecord
        var discount = +currentRec.getCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_fdiscount'
        })

        discount = discount ? discount / 100 : 1

        if(context.fieldId === 'quantity')
        {
            if(currentRec.getValue('custbody_cust_ordertype') !== '7')
            {
                if(currentRec.getCurrentSublistValue({
                    sublistId : 'item',
                    fieldId : 'item'
                }))
                {
                    var itemInfo = currItemInfo(currentRec)
                    var itemPrice = priceSearch.ItemResult({
                        items : itemInfo.items,
                        quantitys : itemInfo.quantitys
                    })
                    var currentIndex = currentRec.getCurrentSublistIndex({
                        sublistId : 'item'
                    })
        
                    if(itemPrice[itemInfo.item]){
                        var price = itemPrice[itemInfo.item].price
                        var customerDiscount = parseFloat(itemPrice[itemInfo.item].customerDiscount)
            
                        if(itemPrice[itemInfo.item])
                        {
                            setPrice({
                                currentRec : currentRec,
                                item : itemInfo.item,   
                                mode : itemPrice[itemInfo.item].mode,
                                price : price,
                                customerDiscount : isNaN(customerDiscount) ? '' : customerDiscount
                            })
        
                            currentRec.selectLine({
                                sublistId : 'item',
                                line : currentIndex
                            })
                        }
                    }
                }
            }
        }
    }

    function setPrice(params){
        var currentRec = params.currentRec
        var lineCount = currentRec.getLineCount({
            sublistId : 'item'
        })

        setCurrentLineItemPriceInfo({
            currentRec : currentRec,
            item : params.item,
            mode : params.mode,
            price : params.price,
            customerDiscount : params.customerDiscount
        })

        for(var i = 0; i < lineCount; i ++)
        {
            itemPrice({
                index : i,
                currentRec : currentRec,
                item : params.item,
                mode : params.mode,
                price : params.price,
                customerDiscount : params.customerDiscount
            })
        }   
    }

    function setCurrentLineItemPriceInfo(params){
        var currentRec = params.currentRec

        if(params.customerDiscount)
        {
            currentRec.setCurrentSublistValue({  //客户折扣
                sublistId : 'item',
                fieldId : 'custcol_cdiscount',
                value : params.customerDiscount
            })
    
            currentRec.setCurrentSublistValue({  //最终折扣
                sublistId : 'item',
                fieldId : 'custcol_fdiscount',
                value : params.customerDiscount
            })
        }

        currentRec.setCurrentSublistValue({  //折前单价  不含税
            sublistId : 'item',
            fieldId : 'custcol_unit_notax',
            value : params.price
        })

        currentRec.setCurrentSublistValue({  //生效类型
            sublistId : 'item',
            fieldId : 'custcol_effective_mode',
            value : params.mode
        })
    }

    function itemPrice(params){
        var currentRec = params.currentRec
        var item = currentRec.getSublistValue({
            sublistId : 'item',
            fieldId : 'item',
            line : params.index
        })   

        if(item === params.item){
            currentRec.selectLine({
                sublistId : 'item',
                line : params.index
            })

            setCurrentLineItemPriceInfo(params)

            currentRec.commitLine({
                sublistId : 'item'
            })
        }       
    }

    function currItemInfo(currentRec){
        var itemCount = 0
        var quantitys = new Object()
        var lineCount = currentRec.getLineCount({
            sublistId : 'item'
        })
        var currIndex = currentRec.getCurrentSublistIndex({
            sublistId : 'item'
        })
        var currItem = currentRec.getCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'item'
        })
        
        for(var i = 0; i < lineCount; i ++)
        {
            var lineItem = currentRec.getSublistValue({
                sublistId : 'item',
                fieldId : 'item',
                line : i
            })

            if(lineItem === currItem){

                var lineItemCount = currentRec.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'quantity',
                    line : i
                })

                if(currIndex === i)
                {
                    var currCount = currentRec.getCurrentSublistValue({
                        sublistId : 'item',
                        fieldId : 'quantity'
                    })

                    itemCount = operation.add(itemCount,currCount)
                }
                else
                {
                    itemCount = operation.add(itemCount,lineItemCount)
                }
            }
        }

        if(currIndex === lineCount)
        {
            itemCount = operation.add(itemCount, currentRec.getCurrentSublistValue({
                sublistId : 'item',
                fieldId : 'quantity'
            }))
        }

        quantitys[currItem] = itemCount

        return {
            items : [{
                item : currItem,
                unit : currentRec.getCurrentSublistValue({
                    sublistId : 'item',
                    fieldId : 'units'
                }),
                customer :currentRec.getValue('entity'),
                currency : currentRec.getValue('currency'),
                subsidiary : currentRec.getValue('subsidiary'),
                customerProductCode : currentRec.getCurrentSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_cgoodscode'
                })
            }],
            quantitys : quantitys,
            item : currItem
        }
    }

    
    return {
        pageInit : pageInit,
        fieldChanged: fieldChanged
    }
})

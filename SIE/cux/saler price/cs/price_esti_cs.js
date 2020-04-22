/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    '../public/price_search',
    '../public/price_update_assistant',
    '../../customer credit/public/helper/credit_sign_of_operation'
], function(
    priceSearch,
    assistant,
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
        if(context.fieldId === 'quantity')
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
                        rate : operation.mul(price , isNaN(customerDiscount) ? 1 :  customerDiscount / 100),
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

        if(context.fieldId === 'grossamt')
        {
            changeBeforeDsicountPrice({
                price : currentRec.getCurrentSublistValue({
                    sublistId : 'item',
                    fieldId : context.fieldId
                }),
                quantity : currentRec.getCurrentSublistValue({
                    sublistId : 'item',
                    fieldId : 'quantity'
                }),
                currentRec : currentRec
            })
        }
    }

    function changeBeforeDsicountPrice(params){
        params.currentRec.setCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_unit_tax',
            value : operation.div(params.price , params.quantity)
        })
    }

    function setPrice(params){
        var currentRec = params.currentRec
        var lineCount = currentRec.getLineCount({
            sublistId : 'item'
        })

        setCurrentLineItemPriceInfo({
            currentRec : currentRec,
            rate : params.rate,
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
                rate : params.rate,
                item : params.item,
                mode : params.mode,
                price : params.price,
                customerDiscount : params.customerDiscount
            })
        }   
    }

    function setCurrentLineItemPriceInfo(params){
        var currentRec = params.currentRec
        var textRate   = parseFloat(currentRec.getCurrentSublistText({
            sublistId : 'item',
            fieldId : 'taxrate1'
        }))
        
        currentRec.setCurrentSublistValue({  //折后单价 不含税
            sublistId : 'item',
            fieldId : 'rate',
            value : params.rate
        })

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

        currentRec.setCurrentSublistValue({  //折前单价  含税
            sublistId : 'item',
            fieldId : 'custcol_unit_tax',
            value : operation.mul(params.price , operation.add(1 , isNaN(textRate) ? 0 : textRate / 100 ))
        })

        currentRec.setCurrentSublistValue({  //生效类型
            sublistId : 'item',
            fieldId : 'custcol_effective_mode',
            value : params.mode
        })

        currentRec.setCurrentSublistValue({  //折后单价  含税
            sublistId : 'item',
            fieldId : 'custcol_funit',
            value : operation.mul(params.rate , operation.add(1 , isNaN(textRate) ? 0 : textRate / 100 ))
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

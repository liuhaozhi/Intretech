/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    'N/search',
    '../../../helper/operation_assistant'
], function(
    search,
    operation
) {
    var mode = undefined
    var maxIndex = 0
    var oldQuantity = new Object()
    function pageInit(context){
        console.log('pageinit')
        mode = context.mode
        if(mode === 'copy' || mode === 'edit')
        {  
            maxIndex = maxLine(context.currentRecord)
        }

        if(mode === 'edit')
        {
            setOldQuantity(context.currentRecord)
        }
    }

    function setOldQuantity(currentRec){
        var lineCount = currentRec.getLineCount({
            sublistId : 'item'
        })

        for(var i = 0 ; i < lineCount ; i ++)
        {
            oldQuantity[i] = currentRec.getSublistValue({
                sublistId : 'item',
                fieldId : 'quantity',
                line : i
            })
        }
    }

    function maxLine(currentRecord){
        var countArr = new Array()
        var count = currentRecord.getLineCount({
            sublistId : 'item'
        })

        for(var i = 0 ; i < count ; i ++)
        {
            countArr.push(+currentRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_line',
                line : i
            }))
        }

        countArr.sort(function(a,b){
            return a - b
        })

        return countArr[countArr.length - 1]
    }

    function setLineNoInfo(currentRecord){
        currentRecord.setCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_line',
            value : ++maxIndex
        })
    }

    function validateLine(context) {
        console.log(maxIndex)
        var currentRec = context.currentRecord
        if(mode === 'create' || mode === 'copy' || mode === 'edit')
        {
            if(currentRec.getLineCount({
                sublistId : 'item'
            })
            === currentRec.getCurrentSublistIndex({
                sublistId : 'item'
            }))
            {
                setLineNoInfo(currentRec)
            }
        }

        if(mode === 'edit')
        {
            var lineCount = currentRec.getLineCount({
                sublistId : 'item'
            })
            var currIndex = currentRec.getCurrentSublistIndex({
                sublistId : 'item'
            })

            if(lineCount === currIndex)
            {
                return false
            }
        }

        doSomeThing(currentRec)
        return true
    }

    function doSomeThing(currentRec){
        var quantity = currentRec.getCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'quantity'
        })

        currentRec.setCurrentSublistValue({ //折后含税总金额（本币）
            sublistId : 'item',
            fieldId : 'custcol_trueamount',
            value : operation.mul(
                currentRec.getCurrentSublistValue({
                    sublistId : 'item', 
                    fieldId : 'grossamt'
                }) , 
                currentRec.getValue({
                    fieldId : 'exchangerate'
                })
             )
        })

        currentRec.setCurrentSublistValue({ //折扣额
            sublistId : 'item',
            fieldId : 'custcol_discount',
            value : operation.mul(
                operation.sub( currentRec.getCurrentSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_unit_tax'
                }) || 0, 
                currentRec.getCurrentSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_funit'
                }) || 0) || 0,
                quantity
            ) 
        })

        currentRec.setCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_before_tax',
            value : operation.mul(
                currentRec.getCurrentSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_unit_tax'
                }) || 0, quantity
            )
        })
    }

    function fieldChanged(context){
        var currentRec = context.currentRecord
        if(context.fieldId === 'item')
        {
            var item = currentRec.getCurrentSublistValue({
                sublistId : 'item',
                fieldId : 'item'
            })

            if(item)
            setCashFlow(item,currentRec)
        }

        if(mode === 'edit')
        {
            if(context.fieldId === 'quantity')
            {
                var lineCount = currentRec.getLineCount({
                    sublistId : 'item'
                })
                var currIndex = currentRec.getCurrentSublistIndex({
                    sublistId : 'item'
                })
    
                if(lineCount !== currIndex)
                {
                    if(validQuantity(currentRec,currIndex))
                    {
                        currentRec.setCurrentSublistValue({
                            sublistId : 'item',
                            fieldId : 'quantity',
                            value : oldQuantity[currIndex]
                        })
                    }   
                }
            }
        }
    }

    function validQuantity(currentRec,currIndex){
        var newValue = currentRec.getCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'quantity'
        })

        return Number(newValue) > Number(oldQuantity[currIndex])
    }

    function setCashFlow(item,currentRec){
        var account = search.lookupFields({
            type : 'item',
            id : item,
            columns : ['incomeaccount']
        }).incomeaccount

        if(account[0])
        {
            var cashFlow = search.lookupFields({
                type : 'account',
                id : account[0].value,
                columns : ['custrecord_n112_cseg_cn_cfi']
            }).custrecord_n112_cseg_cn_cfi

            if(cashFlow[0])
            currentRec.setCurrentSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_cseg_cn_cfi',
                value : cashFlow[0].value
            })
        }
    }

    return {
        pageInit : pageInit,
        fieldChanged : fieldChanged,
        validateLine : validateLine
    }
});

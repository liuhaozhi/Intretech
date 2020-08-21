/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    '../../helper/operation_assistant'
], function(assistant) {
    function fieldChanged(context) {
        var fieldId = context.fieldId
        var currRec = context.currentRecord
   
        if(fieldId === 'quantity')
        {
            var line = currRec.getCurrentSublistValue({
                sublistId : 'item',
                fieldId : 'id'
            })
            var quantity  = currRec.getCurrentSublistValue({
                sublistId : 'item',
                fieldId : 'quantity'
            })
            var currIndex = currRec.getCurrentSublistIndex({
                sublistId : 'item'
            })
            var cacheInfo = JSON.parse(currRec.getValue('custbody_linequantitys_cache') || "{}")

            if(cacheInfo[line] && currRec.getValue('orderstatus') === 'B')
            {
                if(quantity > assistant.mul(cacheInfo[line] , 1.2))
                {
                    currRec.setCurrentSublistValue({
                        sublistId : 'item',
                        fieldId : 'quantity',
                        value : currRec.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'quantity',
                            line : currIndex
                        })
                    })

                    alert('第' + ++currIndex + '行的数量超过原采购数量的120%，不允许修改')
                }
            }
        }

        if(fieldId === 'expectedreceiptdate')
        {
            var expectedreceiptdate = currRec.getCurrentSublistValue({
                sublistId : 'item',
                fieldId : fieldId
            })

            if(expectedreceiptdate)
            {
                var day = expectedreceiptdate.getDay()

                switch(day){
                    case 0 :
                        currRec.setCurrentSublistValue({
                            sublistId : 'item',
                            fieldId : fieldId,
                            value : new Date(expectedreceiptdate.valueOf() + 86400000)
                        })  
                        break;
                    case 6 :
                        currRec.setCurrentSublistValue({
                            sublistId : 'item',
                            fieldId : fieldId,
                            value : new Date(expectedreceiptdate.valueOf() + 86400000  * 2)
                        })  
                        break;
                    default:
                        break;
                }
            }
        }

        return true
    }

    return {
        fieldChanged: fieldChanged
    }
});

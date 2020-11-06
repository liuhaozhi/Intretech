/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define([
    'N/record',
    'N/search',
    '../../helper/operation_assistant'
], function(
    record , search , operation
) {
    var sublistId = 'recmachcustrecord185'

    function onRequest(context) {
        var request = context.request
        var response= context.response
        var params = request.parameters

        if(request.method === 'POST' && params.action === 'transform')
        {
            var resultInfo = transPrintIvoice(params.recordId)
            if(resultInfo.status === 'sucess')
            {
                response.write(JSON.stringify({
                    status : 'sucess'
                }))
            }
            else
            {
                response.write(JSON.stringify({
                    status : 'error',
                    message : resultInfo.message
                }))
            }
        }

        if(request.method === 'GET' && params.action === 'voidRecord')
        {
            response.write(voidRecord(params.recordId))
        }
    }

    function voidRecord(recordId){
        var saleOrds  = new Object()

        search.create({
            type : 'customrecord_ci_huopinghang',
            filters : [
                ['custrecord185' , 'anyof' , [recordId]]
            ],
            columns : [
                'custrecord_ci_danjubianhao',
                'custrecord_planum',
                'custrecord_ci_shuliang'
            ]
        }).run().each(function(res){
            var orderId = res.getValue({
                name : 'custrecord_ci_danjubianhao'
            })

            if(!saleOrds[orderId])
            saleOrds[orderId] = new Object()

            saleOrds[orderId][res.getValue({
                name : 'custrecord_planum'
            })] = res.getValue({
                name : 'custrecord_ci_shuliang'
            })

            return true
        })

        dealWithSublist(saleOrds,recordId)
        
        return JSON.stringify({status : 'sucess'})
    }

    function dealWithSublist(sublistLines,recordId){
        try
        {
            for(var key in sublistLines)
            {
                var salesItem = sublistLines[key]
                var saleOrder = record.load({
                    type : 'salesorder',
                    id : key
                })
    
                for(var line in salesItem)
                {
                    var index = saleOrder.findSublistLineWithValue({
                        sublistId : 'item',
                        fieldId : 'custcol_plan_number',
                        value : line
                    })
        
                    if(index > -1)
                    {
                        changeSalesOrdLinesQuantity({
                            index : index,
                            saleOrder : saleOrder,
                            quantity : salesItem[line]
                        })
                    }
                }
    
                saleOrder.save({
                    ignoreMandatoryFields : true
                })
            }

            record.submitFields({
                type : 'customrecord_hebingfapiao',
                id : recordId,
                values : {
                    custrecord_void : true
                }
            })
        }
        catch(e)
        {
            throw e.message
        }
    }

    
    function changeSalesOrdLinesQuantity(params){
        params.saleOrder.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_ci_yunshudaying',
            line : params.index,
            value : operation.sub(
                params.saleOrder.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_ci_yunshudaying',
                    line : params.index,
                }),params.quantity
            )
        })
    }

    function transPrintIvoice(recordId){
        var detailRec = record.load({
            type : 'customrecord_hebingfapiao',
            id : recordId
        })

        var lines = getSublistLines(detailRec)

        return transFormToInvoice(
            lines,
            recordId,
            detailRec.getValue('custrecord_ci_shuchuleix'),
            detailRec.getValue('custrecord_ci_fapiaohao')
        )
    }

    function transFormToInvoice(lines,internalId,prinType,invoiceNum){
        for(var key in lines){
             var salesItem = lines[key]
             var invoiceRe = record.transform({
                 fromType : 'salesorder',
                 fromId : key,
                 toType : 'invoice'
             })
             var lineCount = invoiceRe.getLineCount({
                 sublistId : 'item'
             })
 
             invoiceRe.setValue({
                 fieldId : 'custbody_merge_id',
                 value : internalId
             })
 
             invoiceRe.setValue({
                 fieldId : 'custbody_invoice_number',
                 value : invoiceNum
             })
 
             invoiceRe.setValue({
                 fieldId : 'custbody_ci_invoice_consolidated',
                 value : prinType === '2' ? true : false
             })
 
             try{
                 for(var item in salesItem)
                 {
                     for(var i = 0 ; i < lineCount ; i ++)
                     {
                         var lineItem = invoiceRe.getSublistValue({
                             sublistId : 'item',
                             fieldId : 'item',
                             line : i
                         })
     
                         if(lineItem === salesItem[item].item)
                         {
                             invoiceRe.setSublistValue({
                                 sublistId : 'item',
                                 fieldId : 'quantity',
                                 line : i,
                                 value : salesItem[item].quantity
                             })
                         }
                     }
                 }
     
                 invoiceRe.save({
                     ignoreMandatoryFields : true
                 })
             }
             catch(e){
                return {
                    status : 'error',
                    message : e.message
                }
             }
        }

        return {
            status : 'sucess'
        }
     }
 
     function getSublistLines(newRecord){
         var saleOrds  = new Object()
         var lineCount = newRecord.getLineCount({
             sublistId : sublistId
         })
 
         for(var i = 0 ; i < lineCount ; i ++)
         {
             var orderId = newRecord.getSublistValue({
                 sublistId : sublistId,
                 fieldId : 'custrecord_ci_danjubianhao',
                 line : i
             })
 
             if(!saleOrds[orderId])
             saleOrds[orderId] = new Object()
             
             saleOrds[orderId][newRecord.getSublistValue({
                 sublistId : sublistId,
                 fieldId : 'custrecord_ci_hanghao',
                 line : i
             })] = {
                 item : newRecord.getSublistValue({
                     sublistId : sublistId,
                     fieldId : 'custrecord_ci_wuliaobianma',
                     line : i
                 }),
                 quantity : newRecord.getSublistValue({
                     sublistId : sublistId,
                     fieldId : 'custrecord_ci_shuliang',
                     line : i
                 })
             }
             
         }
 
         return saleOrds
     }

    return {
        onRequest: onRequest
    }
});

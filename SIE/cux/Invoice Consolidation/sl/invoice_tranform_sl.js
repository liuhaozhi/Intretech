/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define([
    'N/record'
], function(
    record
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

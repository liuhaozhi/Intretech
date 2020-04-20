/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define([
    'N/search',
    'N/record',
    '../../helper/operation_assistant'
], function(search , record , operation) {
    var sublistId = 'recmachcustrecord185'

    function beforeLoad(context) {
        if(context.type === context.UserEventType.VIEW){
            insertHackStyle(context)
            if(context.newRecord.getValue('custrecord_yituishoukuanfapiao') === false)
            {
                if(context.newRecord.getValue('custrecord_danjuleixing') === '1')
                {
                    if(transPrintToInvoice(
                        record.load({
                            type : context.newRecord.type,
                            id : context.newRecord.id
                        })
                    ))
                    addTranformButton(context)

                    if(context.newRecord.getValue('custrecord_void') === false)
                    addVoidButton(context)
                }
            }

            addPrintButton(context)
        }
    }

    function addPrintButton(context){
        context.form.clientScriptModulePath = '../cs/invoice_details_cs'

        if(context.newRecord.getValue('custrecord_danjuleixing') === '1')
        {
            context.form.addButton({
                id : 'custpage_printPackPdf',
                label : '打印装箱单PDF',
                functionName : 'printPackpdf('+ context.newRecord.id +')'
            })
    
            context.form.addButton({
                id : 'custpage_printPackExcel',
                label : '打印装箱单Excel',
                functionName : 'printPackExcel('+ context.newRecord.id +')'
            })

            context.form.addButton({
                id : 'custpage_prinTransportInvoicPdf',
                label : '打印运输发票PDF',
                functionName : 'prinTransportInvoicPdf('+ context.newRecord.id +')'
            })
    
            context.form.addButton({
                id : 'custpage_prinTransportInvoicExcel',
                label : '打印运输发票Excel',
                functionName : 'prinTransportInvoicExcel('+ context.newRecord.id +')'
            })
        }

        else
        {
            context.form.addButton({
                id : 'custpage_printPaymentInvoicPdf',
                label : '打印收款发票PDF',
                functionName : 'printPaymentInvoicPdf('+ context.newRecord.id +')'
            })
    
            context.form.addButton({
                id : 'custpage_printPaymentInvoicExcel',
                label : '打印收款发票Excel',
                functionName : 'printPaymentInvoicExcel('+ context.newRecord.id +')'
            })
        }
    }

    function insertHackStyle(context){
        context.form.addField({
            type : 'inlinehtml',
            id : 'custpage_hackstyle',
            label : 'hackstyle'
        }).defaultValue = 
        '<style>.uir-list-header-td:nth-last-child(2){display:none!important}' +
        '#recmachcustrecord185__tab .uir-list-row-tr td:last-child{display:none}</style>' 
    }

    function addVoidButton(context){
        context.form.clientScriptModulePath = '../cs/invoice_details_cs'
        context.form.addButton({
            id : 'custpage_void',
            label : '撤回',
            functionName : 'voidRecord('+ context.newRecord.id +')'
        })
    }

    function addTranformButton(context){
        context.form.clientScriptModulePath = '../cs/invoice_details_cs'
        context.form.addButton({
            id : 'custpage_transform',
            label : '收款发票',
            functionName : 'transformToInvoice('+ context.newRecord.id +')'
        })
    }

    function transPrintToInvoice(newRecord){
        var sublistLines = getSublistLines(newRecord)
        
        for(var key in sublistLines)
        {
            var salesorder = record.load({
                type : 'salesorder',
                id : key
            })
            
            for(var line in sublistLines[key])
            {
                var index = salesorder.findSublistLineWithValue({
                    sublistId : 'item',
                    fieldId : 'item',
                    value : sublistLines[key][line].item
                })

                if(index > -1)
                {
                    var quantity = operation.sub(
                        salesorder.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'quantityfulfilled',
                            line : index
                        }),
                        salesorder.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'quantitybilled',
                            line : index
                        })
                    )
    
                    if(Number(quantity) < Number(sublistLines[key][line].quantity))
                    return false
                }
                else
                {
                    return false
                }
            }
        }

        return true
    }

    function beforeSubmit(context) {
        
    }

    function afterSubmit(context) {
        if(!context.oldRecord)
        {
            log.error('create')
            updateSalesorder(context.newRecord)
        }
    }

    function transFormToInvoice(lines,internalId,prinType,invoiceNum){
        var invoiceIds = new Object()
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
                invoiceIds[key] = invoiceRe.save({
                    ignoreMandatoryFields : true
                })
            }
            catch(e){
                throw(e.message)
            }
       }

       updateInvoiceIds(internalId,invoiceIds)
    }

    function updateInvoiceIds(internalId,invoiceIds){
        var detailsRec = record.load({
            type : 'customrecord_hebingfapiao',
            id : internalId
        })
        var lineCount = detailsRec.getLineCount({
            sublistId : sublistId
        })

        for(var i = 0 ; i < lineCount ; i ++)
        {
            var orderId = detailsRec.getSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_ci_danjubianhao',
                line : i
            })

            detailsRec.setSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_ci_danjubianhao',
                line : i,
                value : invoiceIds[orderId]
            })
        }

        try
        {
            detailsRec.save()
        }
        catch(e)
        {
            throw e.message
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

    function updateSalesOrdQuantity(lines,internalId){
        for(var key in lines)
        {
            var salesItem = lines[key]
            var saleOrder = record.load({
                type : 'salesorder',
                id : key
            })

            try{
                for(var item in salesItem)
                {
                    var index = saleOrder.findSublistLineWithValue({
                        sublistId : 'item',
                        fieldId : 'line',
                        value : item
                    })
    
                    if(index > -1)
                    {
                        saleOrder.setSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_ci_yunshudaying',
                            line : index,
                            value : operation.add(
                                saleOrder.getSublistValue({
                                    sublistId : 'item',
                                    fieldId : 'custcol_ci_yunshudaying',
                                    line : index,
                                }),salesItem[item].quantity
                            )
                        })

                        saleOrder.setSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_ci_yunshu',
                            line : index,
                            value : internalId
                        })
                    }
                }

                saleOrder.save({
                    ignoreMandatoryFields : true
                })
            }catch(e){
                throw(e.message)
            }
        }
    }

    function updateSalesorder(newRecord){
        var prinType  = newRecord.getValue('custrecord_danjuleixing')
        var sublistLines = getSublistLines(newRecord)

        if(prinType === '2')
        {
            transFormToInvoice(
                sublistLines,
                newRecord.id,
                newRecord.getValue('custrecord_ci_shuchuleix'),
                newRecord.getValue('custrecord_ci_fapiaohao')
            )
        }
        else if(prinType === '1')
        {
            updateSalesOrdQuantity(sublistLines,newRecord.id)
        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

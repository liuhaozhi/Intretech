/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define([
    'N/record',
    'N/workflow',
    '../../helper/operation_assistant'
], function(record , workflow , operation) {
    var sublistId = 'recmachcustrecord185'

    function beforeLoad(context) {
        if(context.type === context.UserEventType.VIEW){
            insertHackStyle(context)
            if(context.newRecord.getValue('custrecord_yituishoukuanfapiao') === false)
            {
                if(context.newRecord.getValue('custrecord_danjuleixing') === '1' && context.newRecord.getValue('custrecord_void') === false)
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

        log.error('sublistLines',sublistLines)
        
        for(var key in sublistLines)
        {
            if(key)
            {
                var salesorder = record.load({
                    type : 'salesorder',
                    id : key
                })
                
                for(var line in sublistLines[key])
                {
                    var index = salesorder.findSublistLineWithValue({
                        sublistId : 'item',
                        fieldId : 'custcol_plan_number',
                        value : line
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
        }

        return true
    }

    function afterSubmit(context) {
        if(!context.oldRecord)
        {
            updateSalesorder(context.newRecord)
            backwashInvoice(context.newRecord)
        }
    }

    function backwashInvoice(newRecord){
        var invoicenum= newRecord.getValue('custrecord_ci_fapiaohao')
        var lineCount = newRecord.getLineCount({
            sublistId : sublistId
        })
        var salesorderIds = newRecord.getValue('custrecord_fahuotongzhidanmingxi')
        var salesorders   = salesorderIds.map(function(id){
            return record.load({
                type : 'salesorder',
                id : id
            })
        })
        
        for(var i = 0 ; i < lineCount ; i ++)
        {
            var planum = newRecord.getSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_planum',
                line : i
            })

            salesorders.map(function(rec){
                var salesLineCount = rec.getLineCount({
                    sublistId : 'item'
                })

                for(var j = 0 ; j < salesLineCount ; j ++)
                {
                    var salesPlanum = rec.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'custcol_plan_number',
                        line : j
                    })

                    if(planum === salesPlanum)
                    {
                        var salesInvoiceNum = rec.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_pubg_id',
                            line : j
                        })

                        if(salesInvoiceNum)
                        invoicenum = ',' + invoicenum

                        rec.setSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_pubg_id',
                            line : j,
                            value : salesInvoiceNum + invoicenum
                        })
                    }
                }
            })
        }

        salesorders.map(function(rec){
            rec.save({ignoreMandatoryFields : true})
        })
    }

    function transFormToInvoice(lines,internalId,prinType,invoiceNum){
        var invoiceIds = new Object()

        for(var key in lines)
        {
            if(key)
            {
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
    
                log.error('salesItem',salesItem)

                try{
                    var lineItems = new Array()

                    for(var item in salesItem)
                    {
                        lineItems.push(item)

                        for(var i = 0 ; i < lineCount ; i ++)
                        {
                            var lineItem = invoiceRe.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'custcol_plan_number',
                                line : i
                            })
    
                            if(lineItem === item)
                            {
                                invoiceRe.setSublistValue({
                                    sublistId : 'item',
                                    fieldId : 'quantity',
                                    line : i,
                                    value : salesItem[item].quantity
                                })
                            }

                            var exchangerate = invoiceRe.getValue('exchangerate') || 1
                            var quantity = getSubValue('quantity',i,invoiceRe) || 0
                            var price = getSubValue('custcol_unit_notax',i,invoiceRe) || 0
                            var textRate = parseFloat(getSubValue('taxrate1',i,invoiceRe))
                            var fdiscount = parseFloat(getSubValue('custcol_fdiscount',i,invoiceRe))
                            var rate = operation.mul(price || 0, isNaN(fdiscount) ? 1 :  fdiscount / 100)
                            var hasTaxRate = operation.mul(price || 0, operation.add(1 , isNaN(textRate) ? 0 : textRate / 100 ))
                            var disHasTaxRate = operation.mul(rate , operation.add(1 , isNaN(textRate) ? 0 : textRate / 100 ))
                            var discountAmount = operation.mul(operation.sub(hasTaxRate, disHasTaxRate)  , quantity)
                            var amount = operation.mul(rate,quantity).toFixed(2)
                            var taxAmt = operation.mul(amount,isNaN(textRate) ? 0 : textRate / 100).toFixed(2)
                
                            setSubValue('rate' , rate , i , invoiceRe) //折后单价 不含税
                            setSubValue('custcol_unit_tax' , hasTaxRate , i , invoiceRe) //折前单价（含税)
                            setSubValue('custcol_funit' , disHasTaxRate , i , invoiceRe) //折后单价 (含税)
                            setSubValue('custcol_om_before_discount' , operation.mul(price , quantity) , i , invoiceRe) //折前金额（不含税）
                            setSubValue('custcol_before_tax' , operation.mul(hasTaxRate , quantity) , i , invoiceRe) //折前金额（含税）
                            setSubValue('custcol_discount' , discountAmount , i , invoiceRe) //总折扣额
                            setSubValue('custcol_om_total_discount' , operation.mul(discountAmount , exchangerate) , i , invoiceRe) //总折扣额(本币)
                            setSubValue('custcol_trueamount' , operation.add(
                                operation.mul(amount,exchangerate).toFixed(2),
                                operation.mul(taxAmt,exchangerate).toFixed(2)
                            ) , i , invoiceRe) //折后含税总金额（本币）
                        }
                    }

                    deleteOtherLine(invoiceRe,lineCount,lineItems)

                    invoiceIds[key] = invoiceRe.save({
                        ignoreMandatoryFields : true
                    })

                    if(invoiceIds[key])
                    workflow.initiate({
                        recordType: 'invoice',
                        recordId : invoiceIds[key],
                        workflowId: 'customworkflow_om_invoice_approval'
                    })
                }
                catch(e){
                    throw(e.message)
                }
            }
       }

       updateInvoiceIds(internalId,invoiceIds)
    }

    function setSubValue(fieldId,value,line,newRecord){
        newRecord.setSublistValue({ 
            sublistId : 'item',
            fieldId : fieldId,
            value : value,
            line : line
        })
    }

    function getSubValue(fieldId,line,newRecord){
        return newRecord.getSublistValue({
            sublistId : 'item',
            fieldId : fieldId,
            line : line
        })
    }

    function deleteOtherLine(invoiceRe,lineCount,lineItems){
        while(lineCount > 0)
        {
            var lineItem = invoiceRe.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_plan_number',
                line : --lineCount
            })

            if(lineItems.indexOf(lineItem) < 0)
            {
                invoiceRe.removeLine({
                    sublistId : 'item',
                    line : lineCount
                })
            }
        }
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
                fieldId : 'custrecord_planum',
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
                }),
                planum : newRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_planum',
                    line : i
                })
            }
        }

        return saleOrds
    }

    function updateSalesOrdQuantity(lines,internalId){
        for(var key in lines)
        {
            if(key)
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
                            fieldId : 'custcol_plan_number',
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
    }

    function updateSalesorder(newRecord){
        var prinType  = newRecord.getValue('custrecord_danjuleixing')
        var sublistLines = getSublistLines(newRecord)
        log.error('sublistLines',sublistLines)

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
        afterSubmit: afterSubmit
    }
});

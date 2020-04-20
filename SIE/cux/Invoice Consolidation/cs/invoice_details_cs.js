/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    'N/url',
    'N/search',
    'N/record',
    'N/ui/message',
    '../../helper/operation_assistant'
], function(
    url,
    search,
    record,
    message,
    operation
) {
    var coco = false
    var sublistId = 'recmachcustrecord185'
    function pageInit(context){

    }

    function createInvoice(messageDaiog,coco,recordId){
        record.load.promise({
            type : 'customrecord_hebingfapiao',
            id : recordId
        })
        .then(function(oldRecord){
            var newRecord = record.copy({
                type : 'customrecord_hebingfapiao',
                id : recordId
            })
    
            newRecord.setValue({
                fieldId : 'custrecord_danjuleixing',
                value : '2'
            })
    
            setSublistValue(oldRecord,newRecord)
    
            try{
                if(newRecord.save())
                {
                    record.submitFields({
                        type : 'customrecord_hebingfapiao',
                        id : recordId,
                        values : {
                            custrecord_yituishoukuanfapiao : true
                        }
                    })
    
                    messageDaiog.hide()
                    message.create({
                        title : '已完成！' , 
                        type :  message.Type.CONFIRMATION , 
                        message : '处理成功，收款发票已生成！'
                    }).show()
    
                    location.reload()
                }
                else
                {
                    messageDaiog.hide()
                    message.create({
                        title : '错误！' , 
                        type :  message.Type.ERROR , 
                        message : '未知错误 请安排排查'
                    }).show()
                }
                coco = false
            }
            catch(e)
            {
                messageDaiog.hide()
                message.create({
                    title : '错误！' , 
                    type :  message.Type.ERROR , 
                    message : e.message
                }).show()
                coco = false
            }
        })
        .catch(function(e){
            throw e.message
        })
    }

    function transformToInvoice(recordId){
        if(coco)
        return false

        coco = true
        var messageDaiog = message.create({
            title : '处理中！' , 
            type : message.Type.WARNING , 
            message : '正在处理中，请勿关闭此页'
        })

        messageDaiog.show()

        createInvoice(messageDaiog,coco,recordId)
    }

    function setSublistValue(oldRecord,newRecord){
        var lineCount = oldRecord.getLineCount({
            sublistId : sublistId
        })

        for(var i = 0 ; i < lineCount ; i ++){
            newRecord.setSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_ci_danjubianhao',
                line : i,
                value : oldRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_ci_danjubianhao',
                    line : i
                })
            })

            newRecord.setSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_ci_hanghao',
                line : i,
                value : oldRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_ci_hanghao',
                    line : i
                })
            })

            newRecord.setSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_ci_wuliaobianma',
                line : i,
                value : oldRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_ci_wuliaobianma',
                    line : i
                })
            })

            newRecord.setSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_ci_wuliaomingcheng',
                line : i,
                value : oldRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_ci_wuliaomingcheng',
                    line : i
                })
            })

            newRecord.setSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_ci_huobi',
                line : i,
                value : oldRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_ci_huobi',
                    line : i
                })
            })

            newRecord.setSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_ci_danjia',
                line : i,
                value : oldRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_ci_danjia',
                    line : i
                })
            })

            newRecord.setSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_ci_shuliang',
                line : i,
                value : oldRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_ci_shuliang',
                    line : i
                })
            })

            newRecord.setSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_ci_buhanshuiheji',
                line : i,
                value : oldRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_ci_buhanshuiheji',
                    line : i
                })
            })

            newRecord.setSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_ci_shuilv',
                line : i,
                value : oldRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_ci_shuilv',
                    line : i
                })
            })

            newRecord.setSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_ci_shuie',
                line : i,
                value : oldRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_ci_shuie',
                    line : i
                })
            })


            newRecord.setSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_ci_zongjine_',
                line : i,
                value : oldRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_ci_zongjine_',
                    line : i
                })
            })
        }
    }

    function voidRecord(recordId){
        message.create({
            title : '处理中！' , 
            type : message.Type.WARNING , 
            message : '正在处理中，请勿关闭此页'
        }).show()

        getSublistLines(recordId)
    }

    function changeSalesOrdLinesQuantity(params){
        console.log(operation.sub(
            params.saleOrder.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_ci_yunshudaying',
                line : params.index,
            }),params.quantity
        ))
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

    function getSublistLines(recordId){
        var saleOrds  = new Object()

        search.create.promise({
            type : 'customrecord_ci_huopinghang',
            filters : [
                ['custrecord185' , 'anyof' , [recordId]]
            ],
            columns : [
                'custrecord_ci_danjubianhao',
                'custrecord_ci_hanghao',
                'custrecord_ci_shuliang'
            ]
        })
        .then(function(result){
            result.run().each(function(res){
                var orderId = res.getValue({
                    name : 'custrecord_ci_danjubianhao'
                })

                if(!saleOrds[orderId])
                saleOrds[orderId] = new Object()

                saleOrds[orderId][res.getValue({
                    name : 'custrecord_ci_hanghao'
                })] = res.getValue({
                    name : 'custrecord_ci_shuliang'
                })

                return true
            })
            console.log('saleOrds',saleOrds)
            dealWithSublist(saleOrds,recordId)
        })
        .catch(function(e){
            throw e.message
        })
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
                        fieldId : 'line',
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
            
            location.reload()
        }
        catch(e)
        {
            throw e.message
        }
    }

    function printPackpdf(id){
        printElement({
            id : id,
            type : 'pdf',
            action : 'print',
            printType : 'packlist'
        })
    }

    function printPackExcel(id){
        printElement({
            id : id,
            type : 'excel',
            action : 'print',
            printType : 'packlist'
        })
    }

    function prinTransportInvoicPdf(id){
        printElement({
            id : id,
            type : 'pdf',
            action : 'print',
            printType : 'transportInvoice'
        })
    }

    function prinTransportInvoicExcel(id){
        printElement({
            id : id,
            type : 'excel',
            action : 'print',
            printType : 'transportInvoice'
        })
    }

    function printPaymentInvoicExcel(id){
        printElement({
            id : id,
            type : 'excel',
            action : 'print',
            printType : 'paymentInvoice'
        })
    }

    function printPaymentInvoicPdf(id){
        printElement({
            id : id,
            type : 'pdf',
            action : 'print',
            printType : 'paymentInvoice'
        })
    }

    function printElement(params){
        setWindowChanged(window, false)

        window.location = url.resolveScript({
            scriptId : 'customscript_print_response',
            deploymentId : 'customdeploy_print_response',
            params : params
        })
    }

    return {
        pageInit: pageInit,
        voidRecord : voidRecord,
        transformToInvoice : transformToInvoice,
        printPackpdf : printPackpdf,
        printPackExcel : printPackExcel,
        printPaymentInvoicPdf : printPaymentInvoicPdf,
        printPaymentInvoicExcel : printPaymentInvoicExcel,
        prinTransportInvoicPdf : prinTransportInvoicPdf,
        prinTransportInvoicExcel : prinTransportInvoicExcel
    }
});

/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    'N/url',
    'N/https',
    'N/search',
    'N/record',
    'N/ui/message',
    '../../helper/operation_assistant'
], function(
    url,
    https,
    search,
    record,
    message,
    operation
) {
    var coco = false
    var sublistId = 'recmachcustrecord185'
    var childFields = [
        'custrecord_ci_danjubianhao',
        'custrecord_ci_hanghao',
        'custrecord_ci_wuliaobianma',
        'custrecord_ci_kehuwuliaomingchen',
        'custrecord_ci_kehudingdanhanghao',
        'custrecord_ci_zongtuoshu',
        'custrecord_ci_zonglifangshu',
        'custrecord_ci_zongmaozhong',
        'custrecord_ci_zongjingzhong',
        'custrecord_ci_kehuwuliaobianma',
        'custrecord_ci_kehudingdanhao',
        'custrecord_ci_xiangshu',
        'custrecord_ci_jiaoqi',
        'custrecord_ci_total_amount_before_discou',
        'custrecord_ci_buhanshuiheji',
        'custrecord_ci_total_before_discount',
        'custrecord_ci_zheqiandanjia',
        'custrecord_ci_wuliaomingcheng',
        'custrecord_ci_huobi',
        'custrecord_ci_danjia',
        'custrecord_ci_shuliang',
        'custrecord_ci_shuilv',
        'custrecord_ci_shuie',
        'custrecord_ci_zongjine_',
        'custrecord_planum'
    ]
    function pageInit(context){

    }

    function createInvoice(messageDaiog,coco,recordId){
        debugger
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
            childFields.map(function(item){
                var value = oldRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : item,
                    line : i
                })

                if(!_isEmpty(value))
                newRecord.setSublistValue({
                    sublistId : sublistId,
                    fieldId : item,
                    line : i,
                    value : value
                })
            })
        }
    }

    function voidRecord(recordId){
        debugger
        message.create({
            title : '处理中！' , 
            type : message.Type.WARNING , 
            message : '正在处理中，请勿关闭此页'
        }).show()

        https.get.promise({
            url : url.resolveScript({
                scriptId : 'customscript_invoice_transform_sl',
                deploymentId : 'customdeploy_invoice_transform_sl',
                params : {
                    action : 'voidRecord',
                    recordId : recordId
                }
            })
        }).then(function(res){
            console.log(res)
            var body = JSON.parse(res.body)

            if(body.status === 'sucess') location.reload()
        })

        // getSublistLines(recordId)
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

        window.open(url.resolveScript({
            scriptId : 'customscript_print_response',
            deploymentId : 'customdeploy_print_response',
            params : params
        }))
    }

    function _isEmpty(value){
        var bResult = false;            
        if (value == null || value == 'null' || value == undefined || value == '' || value == "" || value.length <= 0) { bResult = true}
        return bResult;
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

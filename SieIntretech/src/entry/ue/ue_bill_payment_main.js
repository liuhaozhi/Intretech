/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@author Charles Zhang
 *@description Bill Payment UE主程序
 */
define(['N/record' ,'N/render' ,'N/url' ,'N/search'], function (record ,render ,url ,search) {

    //params
    var vendorPrepayFieldId = 'custbody_nsts_vp_prepay_ref';

    //util
    function setPrepayInfo(context){
        var newRecord = context.newRecord,
            request = context.request,
            parameters,
            vendorPrepayId,
            prepayApacct,
            prepayAcct,
            prepayReturn,
            paymentCredit,
            prepayVendor,
            noVerificationAmt,
            lineCount,
            curBillId,
            i;

        try {
            if(request){
                parameters = request.parameters;
                prepayApacct = parameters.prepayapacct;
                prepayAcct = parameters.prepayacct;
                prepayVendor = parameters.prepayvendor;
                vendorPrepayId = parameters.vendorprepayid;
                prepayReturn = parameters.prepayreturn;
                paymentCredit = parameters.paymentcredit;
                noVerificationAmt = parameters.noVerificationAmt
                

                if(prepayApacct && prepayVendor && vendorPrepayId){
                    //设置关联预付款单
                    newRecord.setValue({
                        fieldId : vendorPrepayFieldId,
                        value : vendorPrepayId
                    });
                    
                    //设置供应商
                    newRecord.setValue({
                        fieldId : 'entity',
                        value : prepayVendor
                    });

                    //子公司
                    // newRecord.setValue({
                    //     fieldId : 'subsidiary',
                    //     value : 1
                    // });

                    //设置科目
                    newRecord.setValue({
                        fieldId : 'apacct',
                        value : prepayApacct
                    });
                    if(prepayAcct){
                        newRecord.setValue({
                            fieldId : 'account',
                            value : prepayAcct
                        });
                    }
                
                    //设置行上勾选信息-在UE上设置收款人和子公司无法带出核销账单信息，故改用CS端设置
                    // lineCount = newRecord.getLineCount({
                    //     sublistId : 'apply'
                    // });
                    // for(i = 0; i < lineCount; i++){
                    //     curBillId = newRecord.getSublistValue({
                    //         sublistId : 'apply',
                    //         fieldId : 'internalid',
                    //         line : i
                    //     });
                    //     curBillId = String(curBillId);
                    //     if(curBillId == paymentCredit || curBillId == prepayReturn){
                    //         newRecord.setSublistValue({
                    //             sublistId : 'apply',
                    //             fieldId : 'apply',
                    //             line : i,
                    //             value : true
                    //         });
                    //     }
                    // }
                }
            }
        } catch (ex) {
            log.error({
                title: 'set prepay default info error',
                details: ex
            });
        }
    }

    function writeToVendorPrepay(context){
        var newRecord = context.newRecord,
            recordId = newRecord.id,
            vendorPrepayId,
            cacelAmt,
            vpCancelInfo,
            vendorPrepayRecType = 'customrecord_nsts_vp_vendorprepayment';

        try {
            vendorPrepayId = newRecord.getValue({
                fieldId : vendorPrepayFieldId
            });
            
            if(vendorPrepayId){
                cacelAmt = getCancelAmt(newRecord) 

                vpCancelInfo = search.lookupFields({
                    type : vendorPrepayRecType,
                    id : vendorPrepayId,
                    columns : ['custrecord_vp' , 'custrecord_vp_not_written_off']
                }) 

                record.submitFields({
                    type : vendorPrepayRecType,
                    id : vendorPrepayId,
                    values : {
                        'custrecord_nsts_vp_refund_writeoff' : true,
                        'custrecord_vp' : add(vpCancelInfo.custrecord_vp || 0 , cacelAmt),
                        'custrecord_vp_not_written_off' : sub(vpCancelInfo.custrecord_vp_not_written_off || 0 , cacelAmt)
                    },
                    options : {
                        ignoreMandatoryFields : true
                    }
                });
            }
        } catch (ex) {
            log.error({
                title: 'write vendor prepay back error',
                details: {
                    recordId : recordId,
                    prepayId : vendorPrepayId,
                    ex : ex
                } 
            });
            throw '此付款单已成功核销，但是将单号回写至对应的供应商预付款时发生错误，请手动处理。错误提示：' + ex.message;
        }
    }

    function getCancelAmt(newRecord){
        var cancelAmt = 0
        var lineCount = newRecord.getLineCount({
            sublistId : 'apply'
        })

        while(lineCount > 0){
            var apply = newRecord.getSublistValue({
                sublistId : 'apply',
                fieldId : 'apply',
                line : --lineCount
            })

            if(apply || apply === 'T'){
                var Amt = newRecord.getSublistValue({
                    sublistId : 'apply',
                    fieldId : 'amount',
                    line : lineCount
                })

                if(Amt < 0)
                cancelAmt = add(cancelAmt , Math.abs(Amt))
            }
        }

        return cancelAmt
    }

    function add(a, b) {
        a = a || 0, b = b || 0
        var c, d, e;
        try {
            c = a.toString().split(".")[1].length
        } catch (f) {
            c = 0;
        }
        try {
            d = b.toString().split(".")[1].length;
        } catch (f) {
            d = 0;
        }
        return e = Math.pow(10, Math.max(c, d)), (mul(a, e) + mul(b, e)) / e;
    }

    function mul(a, b) {
        a = a || 0, b = b || 0
        var c = 0,
        d = a.toString(),
        e = b.toString();
        try {
            c += d.split(".")[1].length
        } catch (f) {}
        try {
            c += e.split(".")[1].length
        } catch (f) {}
        return Number(d.replace(".", "")) * Number(e.replace(".", "")) / Math.pow(10, c)
    }

    function sub(a, b) {
        a = a || 0, b = b || 0
        var c, d, e;
        try {
            c = a.toString().split(".")[1].length
        } catch (f) {
            c = 0
        }
        try {
            d = b.toString().split(".")[1].length
        } catch (f) {
            d = 0
        }
        return e = Math.pow(10, Math.max(c, d)), (a * e - b * e) / e
    }

    function div(a, b) {
        a = a || 0, b = b || 0
        var c, d, e = 0,
            f = 0
        try {
            e = a.toString().split(".")[1].length
        } catch (g) {}
        try {
            f = b.toString().split(".")[1].length
        } catch (g) {}
        return c = Number(a.toString().replace(".", "")), d = Number(b.toString().replace(".", "")), c / d * Math.pow(10, f - e)
    }
    
//------------------------打印信息获取部分（新增）----------------------------------------------↓↓↓
    
    function addPrintDate(context){
        
        var newRecord = context.newRecord;
        var recordForm = context.form;
        var recordId = newRecord.id;
        
        //隐藏原打印按钮
        var theButton = recordForm.getButton({
            id: 'print'
        });
        if(theButton){
            theButton.isHidden = true;
            theButton.isDisabled = true;
        }
        
        var reqURL = url.resolveScript({
            scriptId : 'customscript_sl_bill_payment_print',//这里传入你的Suitelet打印程序的script id
            deploymentId : 'customdeploy_sl_bill_payment_print',//这里传入你的Suitelet打印程序的deployment id
            params : {//这个对象是将要加到url后面的多余参数，通常我们只需要传入当前单据的internal id即可
                recordId : recordId
            }
        });
        recordForm.addButton({
            id : 'custpage_printdocument',//这里的自定义按钮的id一定要以custpage_开头，以防止和系统的元素冲突
            label : '打印单据',
            functionName : "(function(){window.open('" + reqURL + "')})"
        });
        
    }
    
//------------------------------------------------------------------------------------------------↑↑↑

    //entry points
    function beforeLoad(context) {
        if (context.type === context.UserEventType.CREATE) {
            setPrepayInfo(context);
        }else if (context.type === context.UserEventType.VIEW) {
            addPrintDate(context);
        }
    }

    function afterSubmit(context){
        if (context.type === context.UserEventType.CREATE) {
            writeToVendorPrepay(context);
        }
    }

    return {
        beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

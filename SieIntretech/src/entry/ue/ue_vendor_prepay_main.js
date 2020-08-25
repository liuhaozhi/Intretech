/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@author Charles Zhang
 *@description 供应商预付款UE主程序
 */
define(['N/search' , 'N/runtime', 'N/url', 'N/record'], function (search, runtime, url, record) {

    //util
    function getBillPayApacct(paymentId){
        var paymentRec = record.load({
            type : 'vendorpayment',
            id : paymentId
        });

        return {
            apAcct : paymentRec.getValue({
                fieldId : 'apacct'
            }),
            acct : paymentRec.getValue({
                fieldId : 'account'
            })
        }
    }

    function addReturnButton(context) {
        var newRecord = context.newRecord,
            form = context.form,
            vendorPrepayId = newRecord.id,
            prepayBill,
            prepayBillPayment,
            paymentCredit,
            prepayReturn,
            prepayVendor,
            billPaymentInfo,
            isReturnApplied,
            subsidiaryId,
            currency,
            refundAmt,
            vpJeId,
            noVerificationAmt,
            redirectUrl;

        try {
            prepayBill = newRecord.getValue({
                fieldId: 'custrecord_nsts_vp_prepay_bill'
            });
            prepayBillPayment = newRecord.getValue({
                fieldId: 'custrecord_nsts_vp_prepay_payment'
            });
            paymentCredit = newRecord.getValue({
                fieldId: 'custrecord_nsts_vp_prepay_credit'
            });
            prepayReturn = newRecord.getValue({
                fieldId: 'custrecord_nsts_vp_prepay_refund'
            });
            isReturnApplied = newRecord.getValue({
                fieldId: 'custrecord_nsts_vp_refund_writeoff'
            });
            subsidiaryId = newRecord.getValue({
                fieldId: 'custrecordnsts_vp_total_po_prepay_subsid'
            });
            currency = newRecord.getValue({
                fieldId: 'custrecord_nsts_vp_po_curr'
            });
            refundAmt = +newRecord.getValue({
                fieldId: 'custrecord_vp_refund_amount'
            });
            noVerificationAmt = +newRecord.getValue({
                fieldId : 'custrecord_vp_not_written_off'
            });
            var prepayAmount = +newRecord.getValue({//预付款金额
                fieldId: 'custrecord_nsts_vp_prepay_amount'
            });

            if (prepayBill && prepayBillPayment && paymentCredit) {
                prepayVendor = newRecord.getValue({
                    fieldId : 'custrecord_nsts_vp_po_vendor'
                });
                billPaymentInfo = getBillPayApacct(prepayBillPayment);

                if (noVerificationAmt > 0) {//添加核销退款按钮
                    search.create({
                        type : 'journalentry',
                        filters : [
                            ['custbody_ap_vp_no' , 'anyof' , [newRecord.id]]
                        ]
                    })
                    .run()
                    .each(function(res){
                        vpJeId = res.id
                    })

                    redirectUrl = url.resolveTaskLink({
                        id: 'EDIT_TRAN_VENDPYMT',
                        params: {
                            vpJeId : vpJeId,
                            currency : currency,
                            vendorprepayid: vendorPrepayId,
                            prepayvendor : prepayVendor,
                            prepayapacct : billPaymentInfo.apAcct,
                            prepayacct : billPaymentInfo.acct,
                            prepayreturn : prepayReturn,
                            paymentcredit : paymentCredit,
                            prepaysubsidiary : subsidiaryId,
                            noVerificationAmt : noVerificationAmt
                        }
                    });

                    form.addButton({
                        id: 'custpage_sie_return_prepay_apply',
                        label: '核销退款',
                        functionName: "(function(){window.location = '" + redirectUrl + "'})"
                    });
                } 
                /**
                 * 核销与退款判断条件更改
                 */
                var vpId = newRecord.getValue({
                    fieldId : 'custrecord_nsts_vp_po'
                })
                var userTotal = +newRecord.getValue({
                    fieldId : 'custrecord_ap_vp_refund'
                })

                if(vpId){ 
                    if(refundAmt < prepayAmount - userTotal){
                        //添加退款按钮
                        //                    redirectUrl = url.resolveTaskLink({
                        //                        id: 'EDIT_TRAN_DEPOSIT',
                        //                        params: {
                        //                            prepayvendor : prepayVendor,
                        //                            prepayapacct : billPaymentInfo.apAcct,
                        //                            vendorprepayid : vendorPrepayId
                        //                        }
                        //                    });
                                            
                        //修改------------------退款跳转页面更改为《日记账》---------------------------↓↓↓
                        redirectUrl = url.resolveTaskLink({
                            id: 'EDIT_TRAN_JOURNAL',
                            params: {
                                prepayvendor : prepayVendor,
                                prepayapacct : billPaymentInfo.apAcct,
                                vendorprepayid : vendorPrepayId,
                                subsidiary : subsidiaryId,
                                currency : currency ,
                                amount : prepayAmount - userTotal - refundAmt
                            }
                        });
                        //--------------------------------------------------------------------------------↑↑↑
    
                        form.addButton({
                            id: 'custpage_sie_return_prepay',
                            label: '退款',
                            functionName: "(function(){window.location = '" + redirectUrl + "'})"
                        });
                    }
                }
            }
        } catch (ex) {
            log.error({
                title: 'add return button error',
                details: ex
            });
        }
    }

    //entry points
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
                addReturnButton(context);
            }
        }
    }

    return {
        beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        // afterSubmit: afterSubmit
    }
});
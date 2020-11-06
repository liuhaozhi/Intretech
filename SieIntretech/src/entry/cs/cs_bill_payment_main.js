/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description Bill Payment CS主程序
 */
define(['N/ui/dialog','N/search'], function (dialog,search) {

    //util
    function getParaFromURL(key) {
        var self = getParaFromURL;
        if (!self.map) {
            var paraMap = {};
            var paraArray = window.location.search.substring(1).split('&');
            paraArray.forEach(function (para) {
                para = para.split('=');
                paraMap[para[0]] = decodeURIComponent(para[1]);
            });
            self.map = paraMap;
        }
        return self['map'][key];
    }

    function setPrepayInfo(context) {
        var subsidiaryId = getParaFromURL('prepaysubsidiary'),
            paymentRec = context.currentRecord,
            currency = getParaFromURL('currency');

        if(currency)
        paymentRec.setValue({
            fieldId : 'currency',
            value : currency
        })

        try {
            if (subsidiaryId) {
                paymentRec.setValue({
                    fieldId: 'subsidiary',
                    value: subsidiaryId
                });
            }
        } catch (ex) {
            dialog.alert({
                title: '错误',
                message: '初始化子公司错误，请手动设置'
            });
        }
    }

    function setPrepayLines(context) {
        //在UE上设置收款人和子公司无法带出核销账单信息，故改用CS端设置
        var vpJeId = getParaFromURL('vpJeId'),
            paymentRec = context.currentRecord

        if(vpJeId){
            try {
                var paymentCredit = getParaFromURL('paymentcredit'),
                    prepayReturn = getParaFromURL('prepayreturn'),
                    noVerificationAmt = getParaFromURL('noVerificationAmt'),
                    lineCount = paymentRec.getLineCount({
                        sublistId: 'apply'
                    }),
                    i,
                    curBillId;
    
                for (i = 0; i < lineCount; i++) {
                    curBillId = paymentRec.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'internalid',
                        line: i
                    });
                    curBillId = String(curBillId);
                    if (curBillId == paymentCredit || curBillId == prepayReturn) {
                        paymentRec.selectLine({
                            sublistId : 'apply',
                            line : i
                        });
                        paymentRec.setCurrentSublistValue({
                            sublistId: 'apply',
                            fieldId: 'apply',
                            value: true
                        });
                        paymentRec.setCurrentSublistValue({
                            sublistId: 'apply',
                            fieldId: 'amount',
                            value: -noVerificationAmt
                        });
                        paymentRec.commitLine({
                            sublistId : 'apply'
                        });
                    }
    
                    if(curBillId == vpJeId){
                        paymentRec.selectLine({
                            sublistId : 'apply',
                            line : i
                        });
                        paymentRec.setCurrentSublistValue({
                            sublistId: 'apply',
                            fieldId: 'apply',
                            value: true
                        });
                        paymentRec.setCurrentSublistValue({
                            sublistId: 'apply',
                            fieldId: 'amount',
                            value: noVerificationAmt
                        });
                        paymentRec.commitLine({
                            sublistId : 'apply'
                        });
                    }
                }
            } catch (ex) {
                dialog.alert({
                    title: '错误',
                    message: '初始化行上勾选供应商预付退款单错误，请手动勾选'
                });
            }
        }else{
            var sublistS  = Object.create(null)
            var lineCount = paymentRec.getLineCount({
                sublistId: 'apply'
            })

            while(lineCount > 0){
                sublistS[paymentRec.getSublistValue({
                    sublistId: 'apply',
                    fieldId: 'internalid',
                    line: --lineCount
                })] = lineCount
            }

            if(Object.keys(sublistS).length)
            search.create({
                type : 'transaction',
                filters : [
                    ['internalid' , 'anyof' , Object.keys(sublistS)],
                    'AND',
                    ['custbody_ap_vp_order' , 'noneof', '@NONE@']
                ]
            })
            .run()
            .each(function(res){
                paymentRec.getSublistField({
                    sublistId : 'apply' ,
                    fieldId : 'apply' , 
                    line : sublistS[res.id]
                }).isDisabled = true

                return true
            })
        }
    }

    //entry points
    function pageInit(context) {
        debugger
        if (context.mode == 'create') {
            setPrepayInfo(context);
            setPrepayLines(context);
        }
    }

    function postSourcing(context) {
        if (context.fieldId === 'subsidiary') {
            setPrepayLines(context);
        }
    }

    return {
        pageInit: pageInit,
        // saveRecord: saveRecord,
        // validateField: validateField,
        // fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});

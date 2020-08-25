/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@author YHR
 *@description Journalentry UE主程序
 */
define(['N/record','N/search'], function (record,search) {

    //params
    var vendorPrepayFieldId = 'custbody_nsts_vp_prepay_ref';

    //util
    function setPrepayInfo(context){
        var newRecord = context.newRecord,
            request = context.request,
            parameters,
            vendorPrepayId,
            prepayApacct,
            prepayAmount,
            prepayVendor,
            subsidiary,
            currency;

        try {
            if(request){
                parameters = request.parameters;
                prepayApacct = parameters.prepayapacct;
                prepayVendor = parameters.prepayvendor;
                vendorPrepayId = parameters.vendorprepayid;
                subsidiary = parameters.subsidiary;
                currency = parameters.currency;
                prepayAmount = parameters.amount;

                if(prepayApacct && prepayVendor && vendorPrepayId){
                    newRecord.setValue({
                        fieldId : vendorPrepayFieldId,
                        value : vendorPrepayId
                    });
                    newRecord.setValue({//货币
                        fieldId : 'currency',
                        value : currency
                    });
                    newRecord.setValue({//子公司
                        fieldId : 'subsidiary',
                        value : subsidiary
                    });
                    newRecord.setSublistValue({//公司名称
                        sublistId : 'line',
                        fieldId : 'entity',
                        line : 0,
                        value : prepayVendor
                    });
                    newRecord.setSublistValue({//科目
                        sublistId : 'line',
                        fieldId : 'account',
                        line : 0,
                        value : 238
                    });
                    newRecord.setSublistValue({//贷记
                        sublistId : 'line',
                        fieldId : 'credit',
                        line : 0,
                        value : prepayAmount
                    });
                    newRecord.setSublistValue({//中国现金流量项
                        sublistId : 'line',
                        fieldId : 'custcol_cseg_cn_cfi',
                        line : 0,
                        value : 3
                    });
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
            vendorPrepayRecType = 'customrecord_nsts_vp_vendorprepayment';

        try {
            vendorPrepayId = newRecord.getValue({
                fieldId : vendorPrepayFieldId
            });
            if(vendorPrepayId){
                var UseAmt = getUseAmt(newRecord)

                var vpOrd = record.load({
                    type : vendorPrepayRecType,
                    id : vendorPrepayId
                })
                var vpId = vpOrd.getValue('custrecord_nsts_vp_po')

                vpOrd.setValue({
                    fieldId : 'custrecord_nsts_vp_prepay_refund',
                    value : (vpOrd.getValue('custrecord_nsts_vp_prepay_refund') || []).concat(recordId)
                })

                vpOrd.setValue({
                    fieldId : 'custrecord_vp_refund_amount',
                    value : add(vpOrd.getValue('custrecord_vp_refund_amount') || 0 , UseAmt) 
                })

                vpOrd.setValue({
                    fieldId : 'custrecord_vp_not_written_off',
                    value : add(vpOrd.getValue('custrecord_vp_not_written_off') || 0 ,UseAmt) 
                })

                vpOrd.save({
                    ignoreMandatoryFields : true
                })

                var vpPerpay = search.lookupFields({
                    type : 'purchaseorder',
                    id : vpId,
                    columns : ['custbody_ap_vp_total']
                }).custbody_ap_vp_total

                record.submitFields({
                    type : 'purchaseorder',
                    id : vpId,
                    values : {
                        custbody_ap_vp_total : sub(vpPerpay || 0, UseAmt)
                    }
                })
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
            throw '此存款单已保存成功，但是将单号回写至对应的供应商预付款时发生错误，请手动处理。错误提示：' + ex.message;
        }
    }

    function getUseAmt(newRecord){
        var UseAmt = 0
        var lineCount = newRecord.getLineCount({
            sublistId : 'line'
        })

        while(lineCount > 0){
            UseAmt = add(UseAmt , Math.abs(newRecord.getSublistValue({
                sublistId : 'line',
                fieldId : 'credit',
                line : --lineCount
            })) || 0)
        }

        return UseAmt
    }
 
    //entry points
    function beforeLoad(context) {
        if (context.type === context.UserEventType.CREATE) {
            setPrepayInfo(context);
        }
    }

    function afterSubmit(context){
        if (context.type === context.UserEventType.CREATE) {
            writeToVendorPrepay(context);
        }
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

    return {
        beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

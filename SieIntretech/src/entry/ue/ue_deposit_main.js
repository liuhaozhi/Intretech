/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@author Charles Zhang
 *@description Deposit UE主程序
 */
define(['N/record'], function (record) {

    //params
    var vendorPrepayFieldId = 'custbody_nsts_vp_prepay_ref';

    //util
    function setPrepayInfo(context){
        var newRecord = context.newRecord,
            request = context.request,
            parameters,
            vendorPrepayId,
            prepayApacct,
            prepayVendor;

        try {
            if(request){
                parameters = request.parameters;
                prepayApacct = parameters.prepayapacct;
                prepayVendor = parameters.prepayvendor;
                vendorPrepayId = parameters.vendorprepayid;

                if(prepayApacct && prepayVendor && vendorPrepayId){
                    newRecord.setValue({
                        fieldId : vendorPrepayFieldId,
                        value : vendorPrepayId
                    });
                    newRecord.setSublistValue({
                        sublistId : 'other',
                        fieldId : 'entity',
                        line : 0,
                        value : prepayVendor
                    });
                    newRecord.setSublistValue({
                        sublistId : 'other',
                        fieldId : 'account',
                        line : 0,
                        value : prepayApacct
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
                record.submitFields({
                    type : vendorPrepayRecType,
                    id : vendorPrepayId,
                    values : {
                        'custrecord_nsts_vp_prepay_refund' : recordId
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
            throw '此存款单已保存成功，但是将单号回写至对应的供应商预付款时发生错误，请手动处理。错误提示：' + ex.message;
        }
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

    return {
        beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

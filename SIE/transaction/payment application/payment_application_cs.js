/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define([
    'N/url',
    'N/https'
], function(url , https) {
    var recordFields = {
        vendorpayment : {
            vendor : 'entity',
            subsidiary : 'subsidiary',
            banknum : 'custbody_bank_ap',
            swiftcode : 'custbody_ap_bank_swift_code',
            accountbank : 'custbody_ap_deposit_bank_pay'
        },
        customrecord_nsts_vp_vendorprepayment : {
            vendor : 'custrecord_nsts_vp_po_vendor',
            subsidiary : 'custrecordnsts_vp_total_po_prepay_subsid',
            banknum : 'custrecord_ap_bank_num',
            swiftcode : 'custrecord_ap_bank_swift_code',
            accountbank : 'custrecord_ap_deposit_bank_vendor'
        }
    }

    function setBankInfo(params){
        var recordType = params.recordType
        var currentRec = params.currentRec
        var recordFields = params.recordFields
        https.post.promise({
            url : url.resolveScript({
                scriptId : 'customscript_om_changefield_response',
                deploymentId : 'customdeploy_om_changefield_response'
            }),
            body : {
                action : 'vondorBankInfo',
                vendor : params.vendor,
                subsidiary : params.subsidiary
            }
        })
        .then(function(response){
            var body = JSON.parse(response.body)

            currentRec.setValue({fieldId : recordFields[recordType].banknum , value : body.banknum || ''})
            currentRec.setValue({fieldId : recordFields[recordType].swiftcode , value : body.swiftcode || ''})
            currentRec.setValue({fieldId : recordFields[recordType].accountbank , value : body.accountbank || ''})
        })
        .catch(function(e){
            console.log(e.message)
        })
    }

    function toGetBank(context){
        var currentRec = context.currentRecord
        var recordType = currentRec.type
        var vendor     = currentRec.getValue({fieldId : recordFields[recordType].vendor})

        if(vendor){
            var subsidiary = currentRec.getValue({fieldId : recordFields[recordType].subsidiary})

            if(subsidiary)
            setBankInfo({vendor : vendor , recordType : recordType , subsidiary : subsidiary , currentRec : currentRec , recordFields : recordFields})
        }
    }

    function pageInit(context){
        toGetBank(context)
    }

    function fieldChanged(context) {
        var fieldId = context.fieldId
        var currentRec = context.currentRecord
        var recordType = currentRec.type

        if(fieldId === recordFields[recordType].vendor || fieldId === recordFields[recordType].subsidiary)
        toGetBank(context)
    }

    function postSourcing(context) {
        var fieldId = context.fieldId
        var currentRec = context.currentRecord
        var recordType = currentRec.type

        if(fieldId === recordFields[recordType].vendor || fieldId === recordFields[recordType].subsidiary)
        toGetBank(context)
    }

    return {
        pageInit : pageInit,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing
    }
});

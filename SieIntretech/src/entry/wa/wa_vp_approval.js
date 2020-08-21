/**
 *@NApiVersion 2.0
 *@NScriptType WorkflowActionScript
 *@author YHR
 *@description  该脚本用于Vendor Prepayment记录判断审批状态
 */
define(['N/record'], function (record) {

    function onAction(scriptContext) {
        
        var newRecord = scriptContext.newRecord;
        var recordType = newRecord.type;
        var recordID = newRecord.id;
        log.error(recordType ,recordID);
        
        var approvalStatus = newRecord.getValue({//Vendor Prepayment记录审批状态
            fieldId: 'custrecord_vp_approval'
        });
        var vpID = newRecord.getValue({//抓取隐藏字段储存的《预付款账单》ID
            fieldId: 'custrecord_vp_intelid'
        });

        log.error(vpID,approvalStatus)
        
        if(vpID && approvalStatus == '3'){
            log.error('满足条件' , '隐藏字段ID为:'+vpID);
            record.submitFields({
                type : recordType,
                id : recordID,
                values : {
                    'custrecord_nsts_vp_prepay_bill' : vpID//将隐藏字段存储ID放入字段《预付款账单》
                }
            });
        }
            
    }

    return {
        onAction: onAction
    };
});
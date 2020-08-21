/**
 * @NApiVersion 2.0
 * @NScriptType clientscript
 */
                
define(['N/record', 'N/search'], function(record, search){
    var currentRecord;

    function pageInit(context) {
        currentRecord = context.currentRecord;
    }

    function batchAddPracticalBillNum(e) {
        var sublistId = "recmachcustrecord_check_parent";
        var billNumValue = currentRecord.getValue("custrecord_practical_bill_num");
        var machine = getSublistMachine(sublistId);
        for(var i = currentRecord.getLineCount({ sublistId: sublistId }) - 1; i > -1; i--) {
            machine.setFieldValue(i + 1, "custrecord_real_bill_number", billNumValue);
        };
        machine.refresheditmachine();
    }

    function getSublistMachine(sublistId) {
        return Ext.get(sublistId + "_splits").dom.machine;
    }
    
    return {
        pageInit : pageInit,
        //saveRecord: saveRecord
        batchAddPracticalBillNum: batchAddPracticalBillNum,
    };
});
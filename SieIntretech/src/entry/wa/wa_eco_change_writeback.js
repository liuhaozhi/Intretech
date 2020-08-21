/**
 *@NApiVersion 2.0
 *@NScriptType WorkflowActionScript
 *@author Rishan Lan
 *@description  
 */
define(['N/task'], function (task) {
    var sublistId = "recmachcustrecord_change_detail_link_field";
    var currentRecord;
    function onAction(scriptContext) {
        currentRecord = scriptContext.newRecord;
        var datas = getInputData(),
            mrScriptId = 'customscript_mr_eco_change_writeback',
            mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: mrScriptId,
                params: {
                    "custscript_param_eco_change_detail": JSON.stringify(datas)
                },
            }),
            taskId;
            log.debug("Record datas", JSON.stringify(datas));
        try {
            taskId = mrTask.submit();
            log.debug('taskId', taskId);
        } catch (e) {
            log.error({
                title: e.name,
                details: e.message
            });
        }
    }

    return {
        onAction: onAction
    }

    function getInputData() {
        var lineCount = currentRecord.getLineCount({ sublistId: sublistId });
        var dataObj = {};
        for(var line = 0; line < lineCount; line++) {
            var isValid = getSublistValue("custrecord_eco_checkout_reason", line);
            if(isValid) { continue; }
            var bomId = getSublistValue("custrecord_change_detail_bom_code", line);
            var type = getSublistValue("custrecord_eco_type", line);
            dataObj[bomId] = dataObj[bomId] || {};
            dataObj[bomId][type] = dataObj[bomId][type] || [];
            dataObj[bomId][type].push({
                item: getSublistValue("custrecord_subitem_code", line),
                bomquantity: getSublistValue("custrecord_component_quantity", line),
                componentyield: getSublistValue("custrecord_component_yield", line),
                units: getSublistValue("custrecord_eco_bom_unit", line),
                custrecord_version_location_number: getSublistValue("custrecord_location_code", line),
                custrecord_ecn_code: currentRecord.getValue({ fieldId: "custrecord_oa_receipt_no" }),
                custrecord_eco_record: currentRecord.getValue({ fieldId: "custrecord_eco_number" }),
                custrecord_remarks: getSublistValue("custrecord_eco_line_memo", line),
                custrecord_eco_record_id: currentRecord.id,
                _line_: line,
                _totalLine_: lineCount
            });
        }
        return dataObj;
    }

    function getSublistValue(fieldId, line) {
        return currentRecord.getSublistValue({ sublistId: sublistId, fieldId: fieldId, line: line });
    }
});
/**
 *@NApiVersion 2.0
 *@NScriptType WorkflowActionScript
 *@author yuming Hu
 *@description  该脚本用于采购价格明细审批后更新货品上的供应商价格及采购申请上的供应商及价格
 */
define(['N/task'], function (task) {

    var itemFieldId = 'custrecord_field_item';

    function onAction(scriptContext) {
        log.debug('testing..', 'testing..');
        var newRecord = scriptContext.newRecord,
            itemValue = newRecord.getValue({
                fieldId: itemFieldId
            }),
            mrScriptId = 'customscript_mr_pr_vendor_update',
            mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: mrScriptId,
                params: {
                    custscript_item: itemValue //JSON.stringify(selectedEntries)
                }
            }),
            taskId;

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
});
/**
 *@NApiVersion 2.x
 *@NScriptType WorkflowActionScript
 */
define([
    'N/task',
    'N/search'
], function(task , search) {
    function onAction(scriptContext) {
        var planRecords = search.create({
            type : 'customrecord_shipping_plan',
            filters : [
                ['custrecord_p_custcol_salesorder' , 'anyof' , [scriptContext.newRecord.id]]
            ],
            columns : ['custrecord_p_custcol_line']
        })
        .run()
        .getRange({
            start : 0,
            end : 1
        })

        if(planRecords.length === 0)
        task.create({
            taskType : task.TaskType.SCHEDULED_SCRIPT,
            scriptId : 'customscript_sales_planning_task',
            params : {
                custscript_estimate_recordid : scriptContext.newRecord.id
            }
        }).submit()
    }

    return {
        onAction: onAction
    }
});

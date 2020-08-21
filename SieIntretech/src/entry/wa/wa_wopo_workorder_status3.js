/**
 *@NApiVersion 2.0
 *@NScriptType WorkflowActionScript
 *@author Rishan Lan
 *@description  
 */
define(['N/task'], function (task) {
    function onAction(scriptContext) {
        var currentRecord = scriptContext.newRecord;
        try {
            currentRecord.setValue("orderstatus", "3");
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
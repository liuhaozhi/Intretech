/**
 *@NApiVersion 2.x
 *@NScriptType WorkflowActionScript
 */
define([
    'N/workflow'
], function(
    workflow
) {

    function onAction(scriptContext) {
        initWorkflow(scriptContext.newRecord)
    }

    function initWorkflow(newRecord){
        var lineCount = newRecord.getLineCount({
            sublistId : 'recmachcustrecord_cust_price_list_link'
        })

        log.error('lineCount',lineCount)

        for(var i = 0 ; i < lineCount ; i ++)
        {
            var id = newRecord.getSublistValue({
                sublistId : 'recmachcustrecord_cust_price_list_link',
                fieldId : 'id',
                line : i
            })

            log.error('id',id)

            workflow.initiate({
                recordType: 'customrecord_cust_price_item_list',
                recordId : id,
                workflowId: 'customworkflow_om_priceapp'
            })
        }
    }


    return {
        onAction: onAction
    }
});

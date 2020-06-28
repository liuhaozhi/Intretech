/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/record',
    'N/workflow'
], function(
    record,
    workflow
) {
    function afterSubmit(context) {
        if(context.type === context.UserEventType.CREATE)
        {
            initWorkflow(record.load({
                type : 'customrecord_cust_price_list',
                id : context.newRecord.id
            }))
        }
    }

    function initWorkflow(newRecord){
        var lineCount = newRecord.getLineCount({
            sublistId : 'recmachcustrecord_cust_price_list_link'
        })

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
        afterSubmit: afterSubmit
    }
});

/**
 *@NApiVersion 2.x
 *@NScriptType WorkflowActionScript
 */
define([
    'N/record',
    'N/search'
], function(
    record,
    search
) {

    function onAction(scriptContext) {
        log.error('enter')
        updateSalesExpectedDate(scriptContext.newRecord)
    }

    function updateSalesExpectedDate(newRecord){
        var salesOrderId= newRecord.getValue('createdfrom')
        var approveDate = newRecord.getValue('custbody_appdate')

        if(salesOrderId && approveDate)
        {
            var timeLong = search.lookupFields({
                type : 'salesorder',
                id : salesOrderId,
                columns : ['custbody_datetime']
            }).custbody_datetime

            if(timeLong)
            {
                record.submitFields({
                    type : 'salesorder',
                    id : salesOrderId,
                    values : {
                        custbody_expected_receipt_date : new Date(approveDate.valueOf() + timeLong * 1000 * 60 * 60 * 24)
                    }
                })
            }
        }
    }

    return {
        onAction: onAction
    }
});

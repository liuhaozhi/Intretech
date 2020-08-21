/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define([
    'N/record',
    'N/search'
    // 'N/runtime',
    //'N/ui/message',
    //'../../app/app_workorder_transfer_items'
], function (
    record,
    search
    //  runtimeMod,
    //  messageMod,
    //  woInfoMod
) {
    function beforeLoad(context) {
    }

    function beforeSubmit(context) {
    }

    function afterSubmit(context) {
        if (context.type === context.UserEventType.EDIT) {
            updateEstimateCompletionDate(context.newRecord);
        }
    }

    function updateEstimateCompletionDate(currentRecord) {
        var sublistId = "item", item;
        var planNumber = currentRecord.getValue("custbody_wip_so_line_information");
        var itemValue = currentRecord.getValue("assemblyitem");
        var planCompleteDate = new Date(currentRecord.getValue("custbody_wip_planned_completion_date") || 0);
        if(!planNumber) { return log.debug("Update Fail", "Plan Number is null!"); }
        var allResults = getAllSearchResults({
            type: "workorder",
            columns: [
                { name: "custbody_wip_planned_completion_date" }
            ],
            filters: [
                ["custbody_wip_so_line_information", "is", planNumber],
                "AND",
                ["bom.internalid", "anyof", itemValue],
                "AND",
                ["subsidiary", "anyof", currentRecord.getValue("subsidiary")]
            ]
        });
        for(var i = 0; i < allResults.length; i++) {
            item = allResults[i];
            planCompleteDate = planCompleteDate > new Date(item.getValue(item.columns[0]) || 0)? planCompleteDate: new Date(item.getValue(item.columns[0]) || 0);
        }
        allResults = getAllSearchResults({
            type: "estimate",
            columns: [ "internalid", "custcol_plan_number"],
            filters: [
                [ "item", "anyof", itemValue ],
                "AND",
                [ "custcol_plan_number", "is", planNumber ]
            ]
        });
        var existItem = {}, hasChange = false;
        for(var i = 0; i < allResults.length; i++) {
            try{
                var item = allResults[i];
                if(existItem[item.id]) { continue; }
                var estimateRec = record.load({
                    type: "estimate",
                    id: item.id,
                    isDynamic: true
                });
                for(var line = estimateRec.getLineCount({ sublistId: sublistId }) - 1; line > -1; line--) {
                    var itemPlanNumber = estimateRec.getSublistValue({ sublistId: sublistId, fieldId: "custcol_plan_number", line: line });
                    var item = estimateRec.getSublistValue({ sublistId: sublistId, fieldId: "item", line: line });
                    var itemPlanCompleteDate = estimateRec.getSublistValue({ sublistId: sublistId, fieldId: "custcol_completion_date", line: line });
                    planCompleteDate = new Date(planCompleteDate);
                    if(itemPlanNumber == planNumber && item == itemValue && (!itemPlanCompleteDate || new Date(itemPlanCompleteDate) < planCompleteDate)) {
                        estimateRec.selectLine({ sublistId: sublistId, line: line });
                        estimateRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: "custcol_completion_date", value: planCompleteDate });
                        estimateRec.commitLine({ sublistId: sublistId });
                        hasChange = true;
                    }
                }
                hasChange && estimateRec.save();
                existItem[item.id] = true;
            } catch(e) {
                log.debug("Update Faile", e.message);
            }
        }
    }
    
    function getAllSearchResults(options) {
        var allResults = [], searchObj = options;
        if(typeof options != "object") {
            searchObj = search.load({ id: options });
        } else if(options.type) {
            searchObj = search.create(options);
        }
        var resultPagedData = searchObj.runPaged({
            pageSize: 1000
        });
        resultPagedData.pageRanges.forEach(function (pageRange) {
            var currentPageData = resultPagedData.fetch({
                index: pageRange.index
            }).data;
            allResults = allResults.concat(currentPageData);
        });
        return allResults;
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
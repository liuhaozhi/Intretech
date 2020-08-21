/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record'], function(search, record) {

    function execute(context) {
        workOrderTest();
    }

    function workOrderTest() {
        var allResults = getAllSearchResults({
            type: "workorder",
            columns: [
                { name: "internalid", summary: "GROUP" }, 
                { name: "custbody_wip_so_line_information", summary: "GROUP" },
                { name: "quantity", summary: "SUM" },
                { name: "custcol_quantity_issued", summary: "SUM" }
            ],
            filters: [
                ["type", "anyof", "WorkOrd"],
                "AND",
                ["custbody_wip_picking_loge", "anyof", "1", "@NONE@"],
                "AND",
                ["sum(custcol_quantity_issued)", "greaterthan", "0"]
            ]
        });
        var existPlanName = {};
        for(var i = 0; i < allResults.length; i++) {
            var item = allResults[i], id = item.getValue(item.columns[0]);
            var lineInfo = item.getValue(item.columns[1]);//计划号
            if(lineInfo == "- None -") { continue; }
            existPlanName[lineInfo] = id;
            var workOrderRec = record.load({
                type: "workorder", 
                id: id,
                isDynamic: true
            });
            var pkckLog = "0";
            var quantity = +item.getValue(item.columns[2]) || 0, giveQuqntity = +item.getValue(item.columns[3]) || 0;
            if(giveQuqntity == 0) {
                pkckLog = "1";
            } else if(giveQuqntity > 0 && giveQuqntity < quantity) {
                pkckLog = "2";
            } else if(giveQuqntity == quantity) {
                pkckLog = "3";
            } else if(giveQuqntity > quantity) {
                pkckLog = "4";
            }
            workOrderRec.setValue("custbody_wip_picking_loge", pkckLog);
            workOrderRec.save();
        }
        var eSch = {
            type: "estimate",
            columns: [ "internalid", "custcol_plan_number"],
            filters: [
                [ "custcol_pick_id", "anyof", "2" ],
                "AND"
            ]
        };
        if(JSON.stringify(existPlanName) == "{}") { return; }
        var filters = [];
        for(var value in existPlanName) {
            filters.push([ "custcol_plan_number", "is", value ], "OR");
        }
        filters.pop();
        eSch.filters.push(filters);
        allResults = getAllSearchResults(eSch);
        var existItem = {};
        var sublistId = "item";
        for(var i = 0; i < allResults.length; i++) {
            try{
                var item = allResults[i];
                var seleId = item.getValue(item.columns[0]);
                if(existItem[seleId]) { continue; }
                var salesRec = record.load({
                    type: "estimate", 
                    id: seleId,
                    isDynamic: true
                });
                for(var line = salesRec.getLineCount({ sublistId: sublistId }) - 1; line > -1; line--) {
                    var planNumber = salesRec.getSublistValue({ sublistId: sublistId, fieldId: "custcol_plan_number", line: line });
                    if(existPlanName[planNumber]) {
                        salesRec.selectLine({ sublistId: sublistId, line: line });
                        salesRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: "custcol_pick_id", value: "1" });
                        salesRec.commitLine({ sublistId: sublistId });
                    }
                }
                salesRec.save();
                existItem[seleId] = true;
            } catch(e) {
                log.debug('Write Error', e.message);
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
        execute: execute
    }
});

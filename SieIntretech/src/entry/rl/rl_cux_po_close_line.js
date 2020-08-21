/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/search', 'N/record', 'N/runtime', 'N/format', 'N/task'], function (search, record, runtime, format, task) {
    var funcList = {
        getPageData: getPageData,
        closedPoLine: closedPoLine
    };
    
    function _get(context) {
        if(funcList[context.funcName]) {
            return funcList[context.funcName](context);
        }
        return ;
    }

    function _post(context) {
        if(funcList[context.funcName]) {
            return funcList[context.funcName](context);
        }
        return ;
    }

    function getPageData(context) {
        var sch = {
            type: "purchaseorder",
            columns: [
                { "name": "internalid" },
                { "name": "item" },
                { "name": "subsidiary" },
                { "name": "quantity" },
                { "name": "item" },
                { "name": "altname", join: "vendor" },
                { "name": "trandate" },
                { "name": "tranid" },
                { "name": "lineuniquekey" },
                { "name": "linesequencenumber" },
                { "name": "quantityshiprecv" },
                { "name": "quantityonshipments" },
                { "name": "shiprecvstatusline" },
                { "name": "closed" },
                { "name": "custcol_close_date" },
                { "name": "custcol_line_close_employee" },
                { "name": "custcol_close_reason" }
            ],
            filters: [
                ["type", "anyof", "PurchOrd"],
                "AND",
                ["mainline", "is", "F"],
                "AND",
                ["taxline", "is", "F"],
                "AND",
                ["closed", context.filters.closed? "is": "any", context.filters.closed],
                /* "AND",
                ["shiprecvstatusline", "is", "F"], */
                "AND",
                ["approvalstatus", "anyof", "2", "11"],
                "AND",
                ["status", "anyof", "PurchOrd:B", "PurchOrd:E", "PurchOrd:D"]//采购订单:待收货, 采购订单:待发账单/部分收货, 采购订单:部分收货
            ]
        };
        if(context.filters.subsidiary) {
            sch.filters.push("AND", ["subsidiary", "anyof", context.filters.subsidiary]);
        }
        if(context.filters.vendor) {
            sch.filters.push("AND", ["vendor.entityid", "haskeywords", context.filters.vendor]);
        }
        if(context.filters.item) {
            sch.filters.push("AND", ["item", "anyof", context.filters.item]);
        }
        var data = getAllSearchResults(sch);
        var lineArray = [];
        for(var i = 0; i < data.length; i++) {
            var lineData = data[i], lineArrayLine = {};
            for(var j = 0; j < lineData.columns.length; j++) {
                var col = lineData.columns[j];
                var value = lineData.getValue(col);
                var text = lineData.getText(col);
                var fieldId = (col.join? col.join + "_": "") + (col.label || col.name);
                if(typeof value == "boolean") {
                    value = value? "T": "F";
                    text = value == "T"? "是": "否";
                }
                lineArrayLine[fieldId] = value;
                text && (lineArrayLine[fieldId + "_display"] = text);
            }
            lineArray.push(lineArrayLine);
        }
        return lineArray;
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

    function closedPoLine(context) {
        var mrTask = task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: "customscript_mr_cux_po_close_line",
            params: {
                'custscriptpo_close_line_params': JSON.stringify(context.data)
            }
        });
        return mrTask.submit();
    }

    function _delete(context) {
    }

    return {
        get: _get,
        post: _post,
        delete: _delete
    }
});
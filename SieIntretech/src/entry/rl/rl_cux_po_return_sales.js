/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/search', 'N/record', 'N/runtime', 'N/format', 'N/task'], function (search, record, runtime, format, task) {
    var funcList = {
        getPageData: getPageData,
        createRetAuthors: createRetAuthors,
        getLocationQuantity: getLocationQuantity,
        getReturnSalesOrder: getReturnSalesOrder
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
            type: "itemreceipt",
            columns: [
                {"name":"internalid","label":"内部标识","type":"text"},
                {"name":"tranid","label":"文件号码","type":"text"},
                {"name":"item","label":"货品","type":"select"},
                {"name":"custitem_ps_item_specification","join":"item","label":"规格型号","type":"text"},
                {"name":"quantity","label":"数量","type":"float"},
                {"name":"location","label":"地点","type":"select"},
                {"name":"actualshipdate","label":"实际发货/收货日期","type":"date"},
                {"name":"datecreated","label":"创建日期","type":"datetime","sort":"DESC"},
                {"name":"createdby","label":"创建人","type":"select"},
                {"name":"companyname","join":"vendor","label":"公司名称","type":"text"},
                {"name":"altname","join":"vendor","label":"供应商名称","type":"text"},
                {"name":"createdfrom","label":"创建自","type":"select"},
                {"name":"purchaseorder","label":"采购订单","type":"select"},
                {"name":"inventorynumber","join":"inventoryDetail","label":"批次编号","type":"text"},
                {"name": "custbody_outbound_3", "label":"审批状态"},
                {"name":"line"}
            ],
            filters: [
                ["mainline", "is", "F"],
                "AND",
                ["createdfrom.type", "anyof", "PurchOrd"],
                /* "AND",
                ["status", "anyof", "PurchOrd:E", "PurchOrd:D", "PurchOrd:F"]//采购订单:待发账单/部分收货, 采购订单:部分收货, 采购订单:待定账单 */
            ].concat(context.filters)
        };
        var allResults = getAllSearchResults(sch), lineArray = [];
        for(var index in allResults) {
            var item = allResults[index];
            var lineData = {};
            for(var col in item.columns) {
                var column = item.columns[col];
                var value = item.getValue(column);
                var text = item.getText(column);
                var fieldId = (column.join? column.join + "__": "") + column.name;
                lineData[fieldId] = value;
                text && (lineData[fieldId + "_display"] = text);
            }
            lineArray.push(lineData);
        }
        return lineArray;
    }

    function getLocationQuantity(context) {
        var allResults = getAllSearchResults({
            type: 'inventorynumber',
            columns: ["item", "location", "quantityavailable"],
            filters: [
                ["item", "anyof", context.items],
                "AND",
                ["location", "anyof", context.locations]
            ]
        });
        var datas = {};
        for(var index in allResults) {
            var item = allResults[index];
            datas[item.getValue(item.columns[0]) + "_" + item.getValue(item.columns[1])] = item.getValue(item.columns[2]);
        }
        return datas;
    }

    function getReturnSalesOrder(context) {
        var datas = {};
        if(!context.item || !context.createdfrom) { return datas; }
        var sch = {
            type: "vendorreturnauthorization",
            columns: ["vendor.altname", "vendor.entityid"],
            filters: [
                ["type", "anyof", "VendAuth"],
                "AND",
                ["item", "anyof", context.item]
            ]
        }
        var allResults = getAllSearchResults(sch);
        for(var index in allResults) {
            var item = allResults[index];
            datas[item.id] = item.getValue(item.columns[1]) + item.getValue(item.columns[0]);
        }
        sch = {
            type: "vendorreturnauthorization",
            columns: ["vendor.altname", "vendor.entityid", "tranid"],
            filters: [
                ["type", "anyof", "VendAuth"],
                "AND",
                ["createdfrom", "anyof", context.createdfrom]
            ]
        }
        allResults = getAllSearchResults(sch);
        var retDatas = {};
        for(var index in allResults) {
            var item = allResults[index];
            if(datas[item.id]) {
                retDatas[item.id] = item.getValue(item.columns[2]) + " " + item.getValue(item.columns[1]) + item.getValue(item.columns[0]);
            }
        }
        return retDatas;
    }

    function createRetAuthors(context) {
        var mrTask = task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: "customscript_mr_cux_po_return_sales",
            params: {
                'custscriptpo_return_sales_params': JSON.stringify(context.data)
            }
        });
        return mrTask.submit();
    }

    function _delete(context) {
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
        get: _get,
        post: _post,
        delete: _delete
    }
});
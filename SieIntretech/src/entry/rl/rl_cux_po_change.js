/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/search', 'N/record', 'N/runtime', 'N/format', 'N/task'], function (search, record, runtime, format, task) {
    var funcList = {
        getDetailSublsitData: getDetailSublsitData,
        executeMapReduceChange: executeMapReduceChange
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

    function executeMapReduceChange(params) {
        var mrTask = task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: "customscript_mr_cux_po_change",
            params: {
                'custscript_mr_cux_po_change_params': JSON.stringify(params.datas)
            }
        });
        return mrTask.submit();
    }

    function getDetailSublsitData(params) {
        var shcObj = {
            type: "purchaseorder",
            columns: [
                {"name":"internalid"},
                {"name":"internalid", "join":"vendor"},
                {"name":"entityid", "join":"vendor"},
                {"name":"altname", "join":"vendor"},
                {"name":"custbody_k3_po_number","type":"TEXT","label":"K3采购订单号"},
                {"name":"internalid","type":"TEXT","label":"内部标识"},
                {"name":"externalid","type":"TEXT","label":"外部ID"},
                {"name":"tranid","type":"TEXT","label":"采购订单号"},
                {"name":"custcol_k3_line_number","type":"TEXT","label":"K3行id"},
                {"name":"line","type":"TEXT","label":"行Id"},
                {"name":"item","type":"SELECT","label":"货品"},
                {"name":"salesdescription","type":"TEXT","label":"说明", "join": "item"},
                {"name":"quantity","type":"TEXT","label":"数量"},
                {"name":"rate","type":"TEXT","label":"货品价格"},
                {"name":"taxcode","type":"PERCENT","label":"税率"},
                {"name":"fxrate","type":"PERCENT","label":"货品价格（外币）"},
                {"name":"currency","type":"TEXT","label":"货币"},
                {"name":"fxamount","type":"CURRENCY","label":"金额（外币）"},
                {"name":"total","type":"CURRENCY","label":"金额（交易总计）"},
                {"name":"netamount","type":"CURRENCY","label":"金额（净额）"},
                {"name":"taxamount","type":"CURRENCY","label":"金额（税）"},
                {"name":"expectedreceiptdate","type":"DATE","label":"预计收货日期"},
                {"name":"approvalstatus","type":"SELECT","label":"审批状态"},
                {"name":"statusref","type":"TEXT","label":"状态"},
                {"name":"datecreated","type":"DATE","label":"创建日期","sort":"DESC"},
                {"name":"custcol_custcol_kehutrueamount_khd","type":"TEXT","label":"客户含税总金额（原币）"},
                {"name":"custcol_custcol_kehutrueamount_lc","type":"TEXT","label":"客户含税总金额（本币）"},
                {"name":"custbody_po_list_pur_type","type":"SELECT","label":"采购类型"},
                {"name":"subsidiary","type":"SELECT","label":"子公司"},
                {"name":"custbody_po_buyer","type":"SELECT","label":"专营采购员"}
            ],
            filters: [
                ["type", "anyof", "PurchOrd"],
                "AND",
                ["taxline", "is", "F"],
                "AND",
                ["mainline", "is", "F"],
                "AND",
                ["status", "noneof", "PurchOrd:H", "PurchOrd:F"],
                "AND",
                ["custcol_line_closure", "noneof", "1"]
            ].concat(params.filters || [])
        };
        var allResults = getAllSearchResults(shcObj, params.pageSize, params.pageIndex);
        var datas = allResults.data || allResults;
        for(var i = 0; i < datas.length; i++) {
            var lineItem = {}, item = datas[i], fieldId;
            for(var j = 0; j < item.columns.length; j++) {
                fieldId = (item.columns[j].join? item.columns[j].join + "__": "") + item.columns[j].name;
                lineItem[fieldId] = item.getValue(item.columns[j]);
                lineItem[fieldId + "_display"] = item.getText(item.columns[j]);
            }
            datas[i] = lineItem;
        }
        return allResults;
    }

    function getAllSearchResults(options, pageSize, pageIndex) {
        var actualPageSize = pageSize? 100: 1000;
        var allResults = [], searchObj = options;
        if(typeof options != "object") {
            searchObj = search.load({ id: options });
        } else if(options.type) {
            searchObj = search.create(options);
        }
        var resultPagedData = searchObj.runPaged({
            pageSize: actualPageSize
        });
        if(!pageSize) {
            resultPagedData.pageRanges.forEach(function (pageRange) {
                var currentPageData = resultPagedData.fetch({
                    index: pageRange.index
                }).data;
                allResults = allResults.concat(currentPageData);
            });
        } else {
            var actualPageIndex = Math.floor((--pageIndex * pageSize) / actualPageSize);//2506 25
            actualPageIndex = Math.max(0, actualPageIndex);
            actualPageIndex = Math.min(actualPageIndex, resultPagedData.pageRanges.length - 1);
            allResults = { dataCount: resultPagedData.count, totalPage: Math.ceil(resultPagedData.count / pageSize), data: [] };
            allResults.totalPage = allResults.totalPage? allResults.totalPage: 1;
            try{
                allResults.data = resultPagedData.fetch({ index: actualPageIndex }).data;
            } catch(e) {
                log.debug("ERROR", e);
            }
            if(actualPageIndex + 1 < resultPagedData.pageRanges.length) {//防止跨页，所以多取一页
                allResults.data = allResults.data.concat(resultPagedData.fetch({ index: actualPageIndex + 1 }).data);
            }
            var starIndex = pageIndex * pageSize - actualPageIndex * actualPageSize;
            allResults.data = allResults.data.slice(starIndex, starIndex + pageSize);
        }
        return allResults;
    }

    function _delete(context) {
    }

    return {
        get: _get,
        post: _post,
        delete: _delete
    }
});
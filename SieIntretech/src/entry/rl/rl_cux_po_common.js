/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/search', 'N/record', 'N/runtime', 'N/format', 'N/task', 'N/workflow'], function (search, record, runtime, format, task, workflow) {
    var funcList = {
        getPriceBatchUpadeDatas: getPriceBatchUpadeDatas,
        getPriceBatchAuditralDatas: getPriceBatchAuditralDatas,
        excuteBatchUpdateOrAuditralPriceApply: excuteBatchUpdateOrAuditralPriceApply
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

    function excuteBatchUpdateOrAuditralPriceApply(params) {
        var status = { success: [], faile: [] };
        if(!params.priceIds.length) { return status; }
        var typeMap = { "Update": "workflowaction2122", "Agree": "workflowaction2117", "Refused": "workflowaction2125" };
        for(var i = 0; i < params.priceIds.length; i++) {
            var priceId = params.priceIds[i];
            try{
                var workflowInstanceId = workflow.trigger({
                    recordType: "customrecord_price_apply",
                    recordId: priceId,
                    workflowId: "customworkflow_purchase_price_approval",
                    actionId: typeMap[params.type]
                });
                status.success.push(workflowInstanceId)
            } catch(e) {
                status.faile.push(workflowInstanceId);
            }
        }
        return status;
    }

    function getPriceBatchUpadeDatas(params) {
        params.type = "Update";
        return getPriceApplyBatchDatas(params);
    }

    function getPriceBatchAuditralDatas(params) {
        params.type = "Auditral";
        return getPriceApplyBatchDatas(params);
    }

    function getPriceApplyBatchDatas(params) {
        var shcObj = {
            type: "customrecord_price_apply",
            columns: [
                {label: "内部标识", name: "internalid"},
                {label: "价格类型", name: "custrecord_price_type", type: "text"},
                {label: "供应商编码", name: "custrecord_field_vendor", type: "text"},
                {label: "供应商名称", name: "custrecord_vendor_name_2", type: "text"},
                {label: "物料编码", name: "custrecord_field_item", type: "text"},
                {label: "物料名称", name: "custrecord_item_name_2", type: "text"},
                {label: "物料规格型号", name: "custrecord_item_specification_1", type: "text"},
                {label: "计量单位", name: "custrecord_item_uom", type: "text"},
                {label: "币种", name: "custrecord_field_currencies", type: "text"},
                {label: "阶梯数量起", name: "custrecord_field_start1", type: "text"},
                {label: "阶梯数量止", name: "custrecord_field_stop", type: "text"},
                {label: "阶梯采购价", name: "custrecord_unit_price_vat", sort: "DESC"},
                {label: "是否阶梯价", name: "custrecord_tiering_price", type: "text"},
                {label: "状态", name: "custrecord_field_status", type: "text"},
                {label: "生效日期", name: "custrecord_field_start_date", type: "text"},
                {label: "失效日期", name: "custrecord_field_stop_date", type: "text"},
                {label: "价格维护人", name: "custrecord_po_price_people", type: "text"},
                {label: "下一审核人", name: "custrecord_vp_field_next_auditor", type: "text"},
                {label: "审批日期", name: "custrecord_approval_date_time", type: "text"},
                {label: "子公司", name: "custrecord_price_company", type: "text"},
                {label: "最后维护时间", name: "custrecord_last_maintenance_time", type: "text"},
                {label: "K3旧物料代码", name: "custrecordk3_old_item_num", type: "text"},
                {label: "当前处理人", name: "custrecord_current_handler", type: "text"},
                {label: "创建日期", name: "created", type: "text"}
            ],
            filters: [
                ["isinactive", "is", "F"]
            ].concat(params.filters || [])
        };
        if(params.type == "Update") {
            shcObj.filters.push("AND", ["custrecord_field_status", "anyof", "2", "4"]);
        } else if(params.type == "Auditral") {
            shcObj.filters.push("AND", ["custrecord_field_status", "anyof", "3"]);
        }
        var allResults = getAllSearchResults(shcObj);
        var datas = allResults.data || allResults;
        for(var i = 0; i < datas.length; i++) {
            var lineItem = {}, item = datas[i], fieldId;
            for(var j = 0; j < item.columns.length; j++) {
                fieldId = (item.columns[j].join? item.columns[j].join + "__": "") + item.columns[j].name;
                lineItem[fieldId] = item.getValue(item.columns[j]);
                lineItem[fieldId + "_display"] = item.getText(item.columns[j]);
                lineItem[fieldId] = lineItem[fieldId] === true? "是": lineItem[fieldId] === false? "否": lineItem[fieldId];
            }
            datas[i] = lineItem;
        }
        return datas;
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
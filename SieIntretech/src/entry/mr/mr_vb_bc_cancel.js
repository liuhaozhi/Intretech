/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 *@author Charles Zhang
 *@description 撤回提交的账单和贷项通知单申请
 */
define([
    'N/record',
    'N/search',
    'N/runtime'
], function (
    record,
    search,
    runtime
) {

    function updateOrderAppStatus(option){
        try {
            var recId = option.recId,
                newStatus = option.newStatus,
                orderInfo = search.lookupFields({
                    type : 'transaction',
                    id : recId,
                    columns : ['recordtype', 'custbody_kaipiao_apply']
                }),
                recType = orderInfo['recordtype'],
                appStatus = orderInfo['custbody_kaipiao_apply'][0];

            appStatus = appStatus ? appStatus['value'] : null;

            // log.debug('orderInfo', orderInfo);

            if(appStatus != newStatus){
                record.submitFields({
                    type : recType,
                    id : recId,
                    values : {
                        'custbody_kaipiao_apply' : newStatus
                    },
                    options : {
                        ignoreMandatoryFields : true
                    }
                });
            }
        } catch (ex) {
            log.error({
                title : 'update receipt/fulfillment error',
                details : {
                    params : option,
                    ex : ex
                }
            });
        }
    }
    
    function getInputData(context) {
        var currentScript = runtime.getCurrentScript(),
            parameters = currentScript.getParameter({
                name: 'custscript_vbbc_input_structure'
            }),
            inputData = JSON.parse(parameters);

        return inputData;
    }

    function map(context) {
        //搜索当前行的对应的所有对账信息
        var lineInfo = JSON.parse(context.value),
            applyDateTime = lineInfo['custpage_paged_formulatext_0'],
            orderType = lineInfo['custpage_paged_custrecord_type_voucher'],
            vendorId = lineInfo['custpage_paged_custrecord_check_parent_custrecord_vendor_name'],
            orderCurrency = lineInfo['custpage_paged_custrecord_trasations_currency'],
            subsidiaryId = lineInfo['custpage_paged_custrecord_state_subsidiary'],
            searchId = 'customsearch_avail_confirm_statement_v2',
            searchObj,
            custSearchObj,
            filters,
            columns,
            updateMap = {},
            resultPagedData;

        searchObj = search.load({
            id: searchId
        });

        filters = searchObj.filterExpression.concat([
            'AND',
            ["formulatext:TO_CHAR({custrecord_application_date},'YYYY-MM-DD hh24:mi:ss')", 'is', applyDateTime],
            'AND',
            ['custrecord_type_voucher', 'is', orderType],
            'AND',
            ['custrecord_check_parent.custrecord_vendor_name', 'is', vendorId],
            'AND',
            ['custrecord_trasations_currency', 'is', orderCurrency],
            'AND',
            ['custrecord_state_subsidiary', 'is', subsidiaryId]
        ]);
        columns = [
            'custrecord_check_parent',
            'custrecord_receipt_nub'
        ];

        custSearchObj = search.create({
            type: searchObj.searchType,
            filters: filters,
            columns: columns
        });
        resultPagedData = custSearchObj.runPaged({
            pageSize: 1000
        });
        resultPagedData.pageRanges.forEach(function (pageRange) {
            var currentPageData = resultPagedData.fetch({
                index: pageRange.index
            });
            currentPageData.data.forEach(function(result){
                var lineId = result.id,
                    stateId = result.getValue({
                        name : 'custrecord_check_parent'
                    }),
                    orderId = result.getValue({
                        name : 'custrecord_receipt_nub'
                    });

                if(!updateMap[stateId]){
                    updateMap[stateId] = [];
                }

                updateMap[stateId].push({
                    lineId : lineId,
                    orderId : orderId
                });
            });
        });

        // log.debug('resultPagedData.count', resultPagedData.count);
        // log.debug('updateMap', updateMap);
        
        util.each(updateMap, function(stateLines, stateId){
            context.write({
                key: stateId,
                value: stateLines
            });
        });
    }

    function reduce(context) {
        var stateId = context.key,
            stateLines = context.values,
            flatLines = [],
            orderIdMap = {},
            stateRecType = 'customrecord_reconciliation',
            sublistId = 'recmachcustrecord_check_parent',
            cancelStatus = '3',//已撤回
            lineCount,
            childId,
            stateRec;

        stateLines.forEach(function(line){
            JSON.parse(line).forEach(function(lineObj){
                var lineId = String(lineObj.lineId),
                    orderId = lineObj.orderId;

                flatLines.push(lineId);
                orderIdMap[orderId] = null;
            });
        });

        // log.debug('orderIdMap', orderIdMap);
        // log.debug(stateId, flatLines);

        //修改状态
        stateRec = record.load({
            type : stateRecType,
            id : stateId
        });
        lineCount = stateRec.getLineCount({
            sublistId : sublistId
        });
        for(var i = 0; i < lineCount; i++){
            childId = stateRec.getSublistValue({
                sublistId : sublistId,
                fieldId : 'id',
                line : i
            });
            childId = String(childId);
            if(flatLines.indexOf(childId) !== -1){
                stateRec.setSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_bill_status',
                    line : i,
                    value : cancelStatus
                });
            }
        }
        stateRec.save({
            ignoreMandatoryFields : true
        });

        context.write({
            key : stateId,
            value : flatLines
        });

        //更新出入库单
        Object.keys(orderIdMap).forEach(function(orderId){
            updateOrderAppStatus({
                recId : orderId,
                newStatus : cancelStatus
            });
        });
    }

    function summarize(summary) {
        var processResults = {};
        //记录错误
        summary.mapSummary.errors.iterator().each(function (key, error, executionNo) {
            log.error({
                title: 'Map error key: ' + key,
                details: error
            });
            return true;
        });
        summary.reduceSummary.errors.iterator().each(function (key, error, executionNo) {
            log.error({
                title: 'Reduce error key: ' + key,
                details: error
            });
            return true;
        });
        //遍历结果
        summary.output.iterator().each(function (key, value) {
            processResults[key] = value;
            return true;
        });

        log.error({
            title: '整体处理结果摘要',
            details: processResults
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
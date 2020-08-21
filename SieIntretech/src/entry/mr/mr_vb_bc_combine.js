/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 *@author Charles Zhang
 *@description 生成合成的待确认的账单和贷项通知单
 */
define([
    'N/runtime',
    'N/record',
    'N/format',
    'N/search',
    '../../dao/dao_search_common',
    '../../../lib/common_lib.js'
], function (
    runtime,
    record,
    format,
    search,
    searchCommon,
    commonLib
) {

    var stateRecType = 'customrecord_reconciliation';
    var sublistId = 'recmachcustrecord_check_parent';

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
                name: 'custscript_vbbc_data_structure'
            }),
            inputData = JSON.parse(parameters),
            combinedData = {},
            submitTime = format.format({
                type: format.Type.DATETIME,
                value: new Date(),
                timezone: format.Timezone.ASIA_HONG_KONG
            });

        inputData.forEach(function (lineData) {
            var orderId = lineData['custpage_paged_internalid'];
            combinedData[orderId] = lineData;
            lineData['operationTime'] = submitTime;
        });

        return combinedData;
    }

    function map(context) {
        var orderId = String(context.key),
            lineData = JSON.parse(context.value),
            stateId = +lineData['custpage_paged_compare_order'],
            operationTime = lineData['operationTime'],
            operationTimeObj,
            lineCount,
            stateRec,
            stateLineOrderId,
            pendingConfirm = '1';

        operationTimeObj = format.parse({
            type: format.Type.DATETIME,
            value: operationTime,
            timezone: format.Timezone.ASIA_HONG_KONG
        });

        if (stateId) {
            stateRec = record.load({
                type: stateRecType,
                id: stateId
            });
            lineCount = stateRec.getLineCount({
                sublistId: sublistId
            });
            for (var i = 0; i < lineCount; i++) {
                stateLineOrderId = stateRec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_receipt_nub',
                    line: i
                });
                stateLineOrderId = String(stateLineOrderId);
                if (stateLineOrderId === orderId) {
                    stateRec.setSublistValue({//状态
                        sublistId: sublistId,
                        fieldId: 'custrecord_bill_status',
                        line: i,
                        value: pendingConfirm//待确认
                    });
                    stateRec.setSublistValue({//提交时间
                        sublistId: sublistId,
                        fieldId: 'custrecord_application_date',
                        line: i,
                        value: operationTimeObj
                    });
                }
            }
            stateRec.save({
                ignoreMandatoryFields: true
            });

            updateOrderAppStatus({
                recId : orderId,
                newStatus : pendingConfirm//待确认
            });

            context.write({
                key: 'update',
                value: stateId
            });
        } else {
            //将出入库单据状态改为待确认
            updateOrderAppStatus({
                recId : orderId,
                newStatus : pendingConfirm//待确认
            });

            context.write({
                key: lineData['custpage_paged_mainname'],
                value: lineData
            });
        }
    }

    function reduce(context) {
        var vendorId = context.key,
            linesRawData = context.values,
            searchId = 'customsearch_irt_iff_lines',
            duplicateId = null,
            pendingConfirm = '1',
            stateName,
            operationTime,
            operationTimeObj,
            orderIds,
            stateRec,
            linesData,
            stateId;

        if (vendorId != 'update') {
            linesData = linesRawData.map(function(lineStr){
                return JSON.parse(lineStr);
            });
            operationTime = linesData[0]['operationTime'];
            operationTimeObj = format.parse({
                type: format.Type.DATETIME,
                value: operationTime,
                timezone: format.Timezone.ASIA_HONG_KONG
            });
            stateName = vendorId + '-' + operationTime;

            //服务器重启
            if (context.isRestarted) {
                search.create({
                    type : stateRecType,
                    filters: [
                        {
                            name : 'name',
                            operator : 'is',
                            values : stateName
                        }
                    ],
                    columns : [
                        {
                            name : 'name'
                        }
                    ]
                }).run().each(function(result){
                    duplicateId = result.id;
                    return false;
                });
            }
            if(duplicateId){
                context.write({
                    key: 'create-' + vendorId,
                    value: duplicateId
                });
                return true;
            }

            orderIds = linesData.map(function (line) {
                return line['custpage_paged_internalid'];
            });

            //查询所有得结果
            var results = searchCommon.getAllSearchResults({
                searchId: searchId,
                addFilters: [
                    {
                        name: 'internalid',
                        operator: 'anyof',
                        values: orderIds
                    }
                ]
            });

            stateRec = record.create({
                type: stateRecType,
                isDynamic: true
            });
            stateRec.setValue({
                fieldId: 'name',
                value: stateName
            });
            stateRec.setValue({
                fieldId: 'custrecord_vendor_name',
                value: vendorId
            });
            stateRec.setValue({
                fieldId: 'custrecord_source',
                value: '3'//自动生成
            });

            results.forEach(function (result, index) {
                var columns = result.columns,
                    orderId = result.id;
                stateRec.selectNewLine({
                    sublistId: sublistId
                });
                stateRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_receipt_nub',
                    value: orderId
                });
                stateRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_po_no',
                    value: result.getValue(columns[1])
                });
                //货品
                stateRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_name_item',
                    value: result.getValue(columns[2])
                });
                //单价
                stateRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_check_rate',
                    value: result.getValue(columns[3])
                });
                //数量
                stateRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_check_amount',
                    value: result.getValue(columns[4])
                });
                //日期
                // var orderDate = format.parse({
                //     type: format.Type.DATE,
                //     value: result.getValue(columns[6])
                // });
                // stateRec.setCurrentSublistValue({
                //     sublistId: sublistId,
                //     fieldId: 'custrecord_recipt_date',
                //     value: orderDate
                // });
                //地点
                stateRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_warehouse',
                    value: result.getValue(columns[7])
                });
                //币种
                // stateRec.setCurrentSublistValue({
                //     sublistId: sublistId,
                //     fieldId: 'custrecord_trasations_currency',
                //     value: result.getText(columns[8])
                // });
                //金额
                var lineAmt = +result.getValue(columns[5]);
                stateRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_check_grossamount',
                    value: lineAmt
                });
                //金额（含税）
                var taxRate = 0, taxRatePercent, taxCode;
                for (var i = 0, len = linesData.length; i < len; i++) {
                    var line = linesData[i];
                    if (line['custpage_paged_internalid'] == orderId) {
                        taxRatePercent = parseFloat(line['custpage_paged_tax_rate']);
                        taxRate = commonLib.accDiv(taxRatePercent, 100);
                        taxCode = line['custpage_paged_tax_code'];
                        break;
                    }
                }
                stateRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_amount_tax',
                    value: commonLib.accMul(lineAmt, commonLib.accAdd(1, taxRate))
                });
                //行ID
                stateRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_id_line',
                    value: result.getValue(columns[9])
                });
                //税码
                stateRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_tax_code',
                    value: taxCode
                });
                //状态
                stateRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_bill_status',
                    value: '1'//待确认
                });
                //申请日期
                stateRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_application_date',
                    value: operationTimeObj
                });

                stateRec.commitLine({
                    sublistId: sublistId
                });
            });

            stateId = stateRec.save({
                ignoreMandatoryFields: true
            });

            //更新出入库单据状态
            // orderIds.forEach(function(orderId){
            //     updateOrderAppStatus({
            //         recId : orderId,
            //         newStatus : pendingConfirm//待确认
            //     });
            // });
            // log.debug('stateId', stateId);

            context.write({
                key: 'create-' + vendorId,
                value: stateId
            });
        } else {
            context.write({
                key: vendorId,
                value: linesRawData
            });
        }
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
            title : '整体处理结果摘要',
            details : processResults
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});

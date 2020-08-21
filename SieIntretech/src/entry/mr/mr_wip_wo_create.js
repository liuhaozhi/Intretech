/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 *@author yuming Hu
 *@description 创建工单执行程序
 */
define([
        'N/runtime',
        '../../app/app_wip_common.js',
        'N/format',
        'N/record',
        'N/search'
    ],
    function (
        runtime,
        wipCommon,
        format,
        record,
        search) {

        function getInputData() {
            var currentScript = runtime.getCurrentScript(),
                parameters = currentScript.getParameter({
                    name: 'custscript_dosomething'
                });

            return JSON.parse(parameters);
        }

        function map(context) {

            context.write({
                key: context.key,
                value: context.value
            });
        }

        function reduce(context) {
            var woColumns = [],
                woFilters = [],
                woSearchCriteria = {},
                woTranid;

            for (var i = 0; i < context.values.length; i++) {
                var option = JSON.parse(context.values[i]).option;

                if (option.mode == 'CREATE') {

                    var mainPayload = JSON.parse(context.values[i]).mainPayload;

                    //格式化时间
                    option.dateOption.expectReceiveDate = format.parse({
                        value: option.dateOption.expectReceiveDate,
                        type: format.Type.DATETIME
                    });

                    recId = wipCommon.woCreationRecursive(mainPayload, option);

                    woColumns = [{
                        name: "tranid"
                    }];

                    woFilters = [
                        ["mainline", "is", "T"],
                        "AND",
                        ["type", "anyof", "WorkOrd"],
                        "AND",
                        ["internalid", "anyof"].concat(recId)
                    ];

                    woSearchCriteria = {
                        type: 'workorder',
                        filters: woFilters,
                        columns: woColumns
                    };

                    search.create(woSearchCriteria).run().each(function (result, i) {

                        woTranid = result.getValue({
                            name: woColumns[0]
                        });
                        return true;
                    });

                    var salesOrderRec = record.load({
                        type: 'estimate',
                        id: mainPayload.custbody_wip_so,
                        isDynamic: true
                    });

                    var LineCount = salesOrderRec.getLineCount({
                        sublistId: 'item'
                    });

                    for (var i = 0; i < LineCount; i++) {

                        var planNumber = salesOrderRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_plan_number',
                            line: i
                        });

                        var soQty = salesOrderRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        });

                        var npQty = salesOrderRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_no_pushdown',
                            line: i
                        });

                        var pdQty = salesOrderRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_number_pushed_down',
                            line: i
                        });

                        var woNumber = salesOrderRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_work_order_number',
                            line: i
                        });

                        if (woNumber) {
                            woNumber = woNumber + ';' + woTranid;
                        } else {
                            woNumber = woTranid;
                        }

                        pdQty = pdQty ? Number(pdQty) : 0;
                        npQty = npQty ? Number(npQty) : 0;

                        pdQty = pdQty + Number(mainPayload.quantity);

                        npQty = Number(soQty) - pdQty;

                        if (mainPayload.custbody_wip_so_line_information == planNumber) {
                            salesOrderRec.selectLine({
                                sublistId: 'item',
                                line: i
                            });

                            salesOrderRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_work_order_number',
                                value: woNumber //recId
                            });

                            salesOrderRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_number_pushed_down',
                                value: pdQty
                            });

                            salesOrderRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_no_pushdown',
                                value: npQty
                            });

                            if (!npQty) {
                                salesOrderRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_wip_if_push_down_comple',
                                    value: true
                                });
                            }

                            salesOrderRec.commitLine({
                                sublistId: 'item'
                            });
                        }
                    }

                    salesOrderRec.save();
                } else {
                    var mainPayload = {
                        "subsidiary": '',
                        "assemblyitem": '',
                        "iswip": true,
                        "orderstatus": "A",
                        "schedulingmethod": "FORWARD",
                        "custbody_wip_top_wo_id": '',
                        "custbody_wip_so": '',
                        "custbody_wip_so_line_information": '',
                        "location": '',
                        "custbody_wip_planned_commencement_date": '',
                        "custbody_wip_manufacturing_type": ''
                        // "custbody_wip_planned_commencement_date": "2019-12-20T08:00:00.000Z",
                        // "custbody_wip_planned_completion_date": "2019-12-22T01:27:26.000Z"
                    };
                    wipCommon.woCreationRecursive(mainPayload, option);
                }
            }

            context.write({
                key: context.key,
                value: JSON.parse(context.values[0])
            });
        }


        function summarize(summary) {
            var processResults = {};

            //记录错误
            if (summary.inputSummary.error) {
                log.error({
                    title: 'Input Error',
                    details: summary.inputSummary.error
                });
            }
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
                title: '成功处理结果摘要',
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
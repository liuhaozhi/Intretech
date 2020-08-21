/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 */
define([
    'N/search',
    '../../app/app_wip_common.js',
    'N/record',
    'N/format',
    '../../app/moment.js'
], function (
    search,
    wipCommon,
    record,
    format,
    moment
) {

    function getInputData() {
        var woiColumns = [],
            woiFilters = [],
            woiSearchCriteria = {},
            woiObj = {},
            woiList = [],
            writeObj = {};

        woiColumns = [{
            name: 'internalid',//子公司
            sort: search.Sort.ASC
        },
        {
            name: 'custrecord_wob_subsidiary' //子公司
        },
        {
            name: 'custrecord_wip_manufacturing_type' //生产类型
        },
        {
            name: 'custrecord_wob_custbody_document_old' //单据编号(老系统)
        },
        {
            name: 'custrecord_wob_assemblyitem' //装配件
        },
        {
            name: 'custrecord_wob_quantity' //数量
        },
        {
            name: 'custrecord_wob_wip_executing_state' //执行状态
        },
        {
            name: 'custrecord_wob_document_old_so' //原K3销售订单号
        },
        {
            name: 'custrecord_wob_wip_software_version' //软件版本
        },
        {
            name: 'custrecord_wob_wip_so_memo' //销售订单备注
        },
        {
            name: 'custrecord_wob_wip_so_abstract' //销售订单摘要
        },
        {
            name: 'custrecord_wob_trandate' //日期（制单日期）
        },
        {
            name: 'custrecord_wob_wip_commencement_date' //开工日期
        },
        {
            name: 'custrecord_wob_wip_completion_date' //完工日期
        },
        {
            name: 'custrecord_wob_location' //地点
        },
        {
            name: 'custrecord_wob_iswip' //wip
        },
        {
            name: 'custrecord_wob_orderstatus' //状态
        },
        {
            name: 'custrecord_wob_document_old_wotop' //K3工单顶层工单号
        },
        {
            name: 'custrecord_wob_document_old_woup' //K3工单顶层工单号
        },
        {
            name: 'custrecord_wip_so_linknumber' //计划号
        },
        {
            name: 'custrecord_so_number' //销售订单号
        },
        {
            name: 'custrecord_ns_so_line_no' //ns销售订单行号
        },
        {
            name: 'custrecord_k3_so_line_no' //K3销售订单行号
        },
        {
            name: 'custrecord_osp_po_line_no' //委外订单的行号
        }
        ];

        woiFilters = [
            ["custrecord_is_import", "is", "F"],
            // "AND",
            // ["internalidnumber", "greaterthan", "4000"],
             "AND",
              ["internalidnumber", "lessthanorequalto", "17232"]
             //["internalid", "anyof", "904"]
        ];

        woiSearchCriteria = {
            type: 'customrecord_work_order_begin',
            filters: woiFilters,
            columns: woiColumns
        };

        var results = search.create(woiSearchCriteria).run();
        log.debug('results.length',results.length);
        while (results.length >= 800) { //re-run the search if limit has been reached
            var lastId = results[799].getValue('internalid'); //note the last record retrieved

            woiFilters = [
                ["custrecord_is_import", "is", "F"],
                // "AND",
                // ["internalidnumber", "greaterthan", "4000"],
                "AND",
                ["internalidnumber", "lessthanorequalto", lastId]
                //["internalid", "anyof", "904"]
            ];

            woiSearchCriteria = {
                type: 'customrecord_work_order_begin',
                filters: woiFilters,
                columns: woiColumns
            };
            var results = search.create(woiSearchCriteria).run();
            log.debug('2 results.length',results.length);
        }

        results.each(function (result, i) {

            woiObj = {};

            for (var j = 0; j < woiColumns.length; j++) {

                // innerValue = result.getValue({
                //     name: woiColumns[j]
                // });

                //log.debug('34343', woiColumns[j]['name']);

                //if (innerValue instanceof Date) {
                // if (woiColumns[j]['name'] == 'custrecord_wob_trandate') {
                //     log.debug('innerValue', innerValue);
                //     fInnerValue = format.format({
                //         value: innerValue,
                //         type: format.Type.DATETIME
                //     });
                // } else {
                //     fInnerValue = innerValue;
                // }
                if (j < 800) {
                    woiObj[woiColumns[j]['name']] = result.getValue({
                        name: woiColumns[j]
                    });
                }
                // woiObj[woiColumns[j]['name']] = result.getValue({
                //     name: woiColumns[j]
                // });
            }

            woiList.push(woiObj);
            return true;
        });

        for (var i = 0; i < woiList.length; i++) {

            writeObj[woiList[i]['internalid']] = woiList[i];
        }

        log.debug('writeObj', writeObj);

        return writeObj;

    }

    function map(context) {
        var woStatusPlanning = 187,
            woStatusPrepare = 20,
            contextKey = context.key,
            contextValue = JSON.parse(context.value),
            option,
            woiRec;
        // statusT;
        log.debug('context', context);
        log.debug('context.key', context.key);
        log.debug('context.value', context.value);

        // switch (contextValue['custrecord_wob_orderstatus']) {
        //     case woStatusPlanning:
        //         statusT = 'B';
        //         break;
        //     default:
        //         statusT = 'A'
        // }

        var option = {

            main: {
                subsidiary: contextValue['custrecord_wob_subsidiary'],
                assemblyitem: contextValue['custrecord_wob_assemblyitem'],
                iswip: true,
                location: contextValue['custrecord_wob_location'],
                quantity: contextValue['custrecord_wob_quantity'],
                //trandate: new Date(), //moment(contextValue['custrecord_wob_trandate']),
                trandate: new Date(moment(contextValue['custrecord_wob_trandate'])), //moment(contextValue['custrecord_wob_trandate']),
                //2020-04-15T03:38:34.581Z
                //2020-04-06T07:00:00.000Z
                //trandate: new Date(contextValue['custrecord_wob_trandate']),
                // trandate: format.parse({
                //     value: contextValue['custrecord_wob_trandate'],
                //     type: format.Type.DATETIME
                // }),
                orderstatus: 'B',
                custbody_wip_manufacturing_type: contextValue['custrecord_wip_manufacturing_type'], //生产类型
                custbody_document_old: contextValue['custrecord_wob_custbody_document_old'], //单据编号(老系统)
                custbody_wip_executing_state: contextValue['custrecord_wob_wip_executing_state'], //执行状态
                custbody_document_old_so: contextValue['custrecord_wob_document_old_so'], //原K3销售订单号
                custbody_wip_software_version: contextValue['custrecord_wob_wip_software_version'], //软件版本
                custbody_wip_so_memo: contextValue['custrecord_wob_wip_so_memo'], //销售订单备注
                custbody_wip_so_abstract: contextValue['custrecord_wob_wip_so_abstract'], //销售订单备注
                custbody_document_old_woup: contextValue['custrecord_wob_document_old_woup'], //K3上层工单号
                custbody_document_old_wotop: contextValue['custrecord_wob_document_old_wotop'], //K3工单顶层工单号
                //custbody_wip_planned_commencement_date: new Date(contextValue['custrecord_wob_wip_commencement_date']), //计划开工日期
                //custbody_wip_planned_completion_date: new Date(contextValue['custrecord_wob_wip_completion_date']),
                custbody_wip_so_line_if_under_bond: '', //保税
                custbody_wip_so_line_information: contextValue["custrecord_wip_so_linknumber"],//计划号
                custbody_wip_so: contextValue["custrecord_so_number"],//销售订单号
                custbody_wip_nsso_line_no: contextValue["custrecord_ns_so_line_no"],//ns销售订单行号
                custbody_wip_k3so_line_no: contextValue["custrecord_k3_so_line_no"],//K3销售订单行号
                custcol_wip_po_line_no: contextValue["custrecord_osp_po_line_no"]//委外订单的行号
            },
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        log.debug('option', option);

        if (contextValue['custrecord_wob_wip_commencement_date']) {
            option.main.custbody_wip_planned_commencement_date =
                new Date(moment(contextValue['custrecord_wob_wip_commencement_date']));
        }

        if (contextValue['custrecord_wob_wip_completion_date']) {
            option.main.custbody_wip_planned_completion_date =
                new Date(moment(contextValue['custrecord_wob_wip_completion_date']));
        }

        var recId = wipCommon.workorderCreationSt(option);

        log.debug('recId', recId);

        if (recId) {
            woiRec = record.load({
                type: 'customrecord_work_order_begin',
                id: contextKey
            });

            woiRec.setValue({
                fieldId: 'custrecord_write_back_wo',
                value: recId
                //ignoreFieldChange: false
            });

            woiRec.setValue({
                fieldId: 'custrecord_is_import',
                value: true
                //ignoreFieldChange: false
            });
        }

        woiRec.save();
    }

    // function reduce(context) {

    // }

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
        // reduce: reduce,
        summarize: summarize
    }
});
/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 *@author yuming Hu
 *@description 创建转移订单
 */
define([
        'N/runtime',
        '../../app/app_wip_common.js',
        'N/format',
        'N/record',
        'N/search',
        '../../app/app_inv_common.js',
        '../../app/app_workorder_transfer_items'
    ],
    function (
        runtime,
        wipCommon,
        format,
        record,
        search,
        invCommon,
        woInfoMod) {

        function getInputData() {
            var currentScript = runtime.getCurrentScript(),
                parameters = currentScript.getParameter({
                    name: 'custscript_dosomething_forwwoctransfer'
                });

            log.debug('parameters', parameters);

            return JSON.parse(parameters);
        }

        function map(context) {

            context.write({
                key: context.key,
                value: context.value
            });
        }

        function reduce(context) {
            log.debug('context', context);

            var wrMain = JSON.parse(context.values[0]),
                tTypeWGRKDefault = '4',
                tTypeZCLLDefault = '1',
                fOption,
                fRecId,
                tItems = [],
                tItemObj = {},
                sItems = [],
                batchObj = {},
                batchList = [],
                sOption,
                sRecId;

            log.debug('wrMain', wrMain);

            batchObj = {
                issueinventorynumber: wrMain.custrecord_woc_inventorydetail || '',
                quantity: wrMain.custrecord_woc_completedquantity || ''
            };

            batchList.push(batchObj);

            var fOption = {

                main: {
                    subsidiary: wrMain.custrecord_woc_subsidiary,
                    //trandate: new Date(),
                    location: wrMain.custrecord_woc_location,
                    transferlocation: wrMain.custrecord_woc_default_warehouse,
                    custbody_wip_work_order_id: wrMain.custrecord_woc_createdfrom,
                    custbody_wip_transfer_type: tTypeWGRKDefault,
                    orderstatus: 'B',
                    custbody_if_up_wo: wrMain.custrecord_woc_up_wo ? true : false
                },
                items: [{
                    item: wrMain.custrecord_woc_item,
                    quantity: wrMain.custrecord_woc_completedquantity,
                    inventorydetail: batchList
                }],
                enableSourcing: true,
                ignoreMandatoryFields: true
            };

            fRecId = invCommon.transferorderCreationSt(fOption);
            log.debug('fRecId', fRecId);

            if (!fRecId) {
                return;
            }

            if (!wrMain.custrecord_woc_up_wo) {
                return;
            }

            if (!wrMain.custrecord_woc_up_location) {
                return;
            }

            const queryResult = woInfoMod.getWorkOrderInfo(wrMain.custrecord_woc_up_wo);
            const woInfo = Object.fromEntries(queryResult.woInfo);

            log.debug('queryResult', queryResult);
            log.debug('woInfo', woInfo);

            tItems = woInfo.items;

            for (var i = 0; i < tItems.length; i++) {
                var itemId = tItems[i].item;
                if (itemId == wrMain.custrecord_woc_item) {

                    tItemObj = {
                        item: wrMain.custrecord_woc_item,
                        quantity: wrMain.custrecord_woc_completedquantity,
                        custcol_all_the_quantity: tItems[i].custcol_all_the_quantity,
                        custcol_quantity_issued: tItems[i].custcol_quantity_issued,
                        custcol_wip_returned_quantity: tItems[i].custcol_wip_returned_quantity,
                        custcol_over_issue_quantity: tItems[i].custcol_over_issue_quantity || 0,
                        custcol_wip_components_of_output: tItems[i].componentyield,
                        custcol_wip_bom_quantity: tItems[i].bomquantity,
                        custcol_main_ingredient_level: tItems[i].custcol_main_ingredient_level || '',
                        custcol_main_ingredient_code: tItems[i].custcol_main_ingredient_code || '',
                        custcol_substitute_material_level: tItems[i].custcol_substitute_material_level || '',
                        custcol_po_replenish_source: tItems[i].line.toString(10),
                        custcol_wip_first_store_issue: tItems[i].custcol_substitute_material_level || '',
                        custcol_wip_second_store_issue: tItems[i].custcol_wip_second_store_issue || '',
                        custcol_wip_third_store_issue: tItems[i].custcol_wip_third_store_issue || '',
                        custcol_wip_fourth_store_issue: tItems[i].custcol_wip_fourth_store_issue || '',
                        custcol_wip_fifith_store_issue: tItems[i].custcol_wip_fifith_store_issue || '',
                        inventorydetail: batchList
                    };

                    sItems.push(tItemObj);
                }
            }

            log.debug('sItems', sItems);

            var sOption = {

                main: {
                    subsidiary: wrMain.custrecord_woc_subsidiary,
                    //trandate: new Date(),
                    location: wrMain.custrecord_woc_default_warehouse,
                    transferlocation: wrMain.custrecord_woc_up_location,
                    custbody_wip_work_order_id: wrMain.custrecord_woc_up_wo,
                    custbody_wip_transfer_type: tTypeZCLLDefault,
                    orderstatus: 'B'
                },
                items: sItems,
                enableSourcing: true,
                ignoreMandatoryFields: true
            };

            sRecId = invCommon.transferorderCreationSt(sOption);
            log.debug('sRecId', sRecId);
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
/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 *@author yuming Hu
 *@description 创建采购订单执行程序
 */
define([
    'N/runtime',
    '../../app/app_po_common.js',
    'N/format',
    'N/record'
], function (
    runtime,
    poCommon,
    format,
    record
) {
    var gEntityFieldId = 'entity', //供应商编码
        gCurrencyFieldId = 'currency',
        gItemFieldId = 'item',
        gRateFieldId = 'rate',
        gQuantityFieldId = 'quantity',
        gLineNumberFieldId = 'custcol_source_sales_order_line_numbe',
        gSoId = 'custcol_source_sales_order_number',
        gPoId = 'custcol_external',
        gPoLineNumber = 'custcol_sales_bank',
        gEstimateRecordTypeId = 'estimate',
        gPurchaseorderRecordTypeId = 'purchaseorder',
        gItemSublistId = 'item',
        gLinenumberSublistFieldId = 'line',
        gPushDownQuantitySbFieldId = 'custcol_quantity_pushed_down',
        gSubsidiary = 'custpage_subsidiary';

    function getInputData() {
        var currentScript = runtime.getCurrentScript(),
            parameters = currentScript.getParameter({
                name: 'custscript_podosomething'
            }),
            parametersJson = JSON.parse(parameters),
            fMapName,
            fMap = {};

        for (var i = 0; i < parametersJson.length; i++) {

            var fMapName = parametersJson[i][gEntityFieldId].toString() +
                parametersJson[i][gCurrencyFieldId].toString() +
                parametersJson[i][gSubsidiary].toString();

            if (!fMap[fMapName]) {
                fMap[fMapName] = {
                    entity: parametersJson[i][gEntityFieldId],
                    currency: parametersJson[i][gCurrencyFieldId],
                    subsidiary: parametersJson[i][gSubsidiary],
                    details: []
                };

                fMap[fMapName]['details'].push({
                    item: parametersJson[i][gItemFieldId],
                    //rate: parametersJson[i][gRateFieldId],
                    quantity: parametersJson[i][gQuantityFieldId],
                    custcol_source_sales_order_line_numbe: parametersJson[i][gLineNumberFieldId],
                    custcol_source_sales_order_number: parametersJson[i][gSoId],
                    custcol_external: parametersJson[i][gPoId],
                    custcol_sales_bank: parametersJson[i][gPoLineNumber]
                    //amount: 1
                });
            } else {
                fMap[fMapName]['details'].push({
                    item: parametersJson[i][gItemFieldId],
                    //rate: parametersJson[i][gRateFieldId],
                    quantity: parametersJson[i][gQuantityFieldId],
                    custcol_source_sales_order_line_numbe: parametersJson[i][gLineNumberFieldId],
                    custcol_source_sales_order_number: parametersJson[i][gSoId],
                    custcol_external: parametersJson[i][gPoId],
                    custcol_sales_bank: parametersJson[i][gPoLineNumber]
                    //amount: 1
                });
            }

        }

        log.debug('fMap', fMap);

        return fMap;
    }

    function map(context) {
        log.debug('context.key', context.key);
        log.debug('context.value', context.value);
        var mainPayload = JSON.parse(context.value),
            items = mainPayload['details'];

        log.debug('mainPayload', mainPayload);
        log.debug('items', items);

        var option = {

            main: {
                entity: mainPayload['entity'],
                subsidiary: mainPayload['subsidiary'],
                currency: mainPayload[gCurrencyFieldId],
                custbody_po_list_pur_type: 1,
                trandate: new Date()
            },
            items: items
        };

        var recId = poCommon.purchaseorderCreationSt(option);

        if (recId) {
            // for (var i = 0; i < items.length; i++) {
            //     context.write({
            //         key: items[i][gSoId],
            //         value: items[i]
            //     });
            // }
            context.write({
                key: recId,
                value: recId
            });
        }
        log.debug('recId', recId);
        log.debug('option', option);

        // context.write({
        //     key: result.getValue({
        //         name: columns[0]
        //     }),
        //     value: writeObj
        // });
    }

    function reduce(context) {
        log.debug('context', context);
        var outPoId = context.key,
            outPoRec,
            inPoRec,
            inSoRec,
            outItemLineCount = 0,
            outPoOriginItemList = [],
            outPoOriginItemObj = {},
            poIds = [],
            soIds = [],
            soQty,
            npQty,
            pdQty;

        log.debug('soQty1', soQty);
        log.debug('npQty1', npQty);
        log.debug('pdQty1', pdQty);

        outPoRec = record.load({
            type: gPurchaseorderRecordTypeId,
            id: outPoId
        });

        outItemLineCount = outPoRec.getLineCount({
            sublistId: gItemSublistId
        });

        for (var i = 0; i < outItemLineCount; i++) {
            outPoOriginItemObj = {
                item: '',
                rate: 0,
                quantity: 0,
                custcol_source_sales_order_line_numbe: '',
                custcol_source_sales_order_number: '',
                custcol_external: '',
                custcol_sales_bank: ''
            };

            for (var key in outPoOriginItemObj) {

                if (outPoOriginItemObj.hasOwnProperty(key)) {
                    outPoOriginItemObj[key] = outPoRec.getSublistValue({
                        sublistId: gItemSublistId,
                        fieldId: key,
                        line: i
                    });
                }
            }

            outPoOriginItemList.push(outPoOriginItemObj);
        }

        log.debug('outPoOriginItemList', outPoOriginItemList);

        for (var i = 0; i < outPoOriginItemList.length; i++) {
            if (poIds.indexOf(outPoOriginItemList[i][gPoId]) == -1) {
                poIds.push(outPoOriginItemList[i][gPoId]);
            }

            if (soIds.indexOf(outPoOriginItemList[i][gSoId]) == -1) {
                soIds.push(outPoOriginItemList[i][gSoId]);
            }
        }

        log.debug('poIds', poIds);
        log.debug('soIds', soIds);

        //更新公司间采购订单
        for (var i = 0; i < poIds.length; i++) {
            inPoRec = record.load({
                type: gPurchaseorderRecordTypeId,
                id: poIds[i]
            });

            var inPoId = inPoRec.id;
            var inPoItemLineCount = inPoRec.getLineCount({
                sublistId: gItemSublistId
            });

            for (var j = 0; j < inPoItemLineCount; j++) {
                var isUpdate = inPoRec.getSublistValue({
                    sublistId: gItemSublistId,
                    fieldId: 'custcol_inter_is_update_price',
                    line: j
                });
                var purRate = inPoRec.getSublistValue({
                    sublistId: gItemSublistId,
                    fieldId: 'custcol_inter_pur_rate', //单价
                    line: j
                });
                var ldbl = inPoRec.getSublistValue({
                    sublistId: gItemSublistId,
                    fieldId: 'custcol_inter_ldbl', //联动比例
                    line: j
                });
                var initemline = inPoRec.getSublistValue({
                    sublistId: gItemSublistId,
                    fieldId: 'line', //联动比例
                    line: j
                });

                if (isUpdate == 'Y') {

                    for (var k = 0; k < outPoOriginItemList.length; k++) {
                        if (initemline == outPoOriginItemList[k][gPoLineNumber] &&
                            inPoId == outPoOriginItemList[k][gPoId] && outPoOriginItemList[k][gRateFieldId] > purRate) {

                            inPoRec.setSublistValue({
                                sublistId: gItemSublistId,
                                fieldId: 'custcol_inter_pur_rate',
                                line: j,
                                value: outPoOriginItemList[k][gRateFieldId]
                            });

                            inPoRec.setSublistValue({
                                sublistId: gItemSublistId,
                                fieldId: gRateFieldId,
                                line: j,
                                value: Number(outPoOriginItemList[k][gRateFieldId]) * Number(ldbl)
                            });
                        }
                    }
                }
            }

            inPoRec.save();
        }

        //2.更新公司间销售订单
        for (var i = 0; i < soIds.length; i++) {
            inSoRec = record.load({
                type: gEstimateRecordTypeId,
                id: soIds[i]
            });

            var inSoId = inSoRec.id;
            var inSoItemLineCount = inSoRec.getLineCount({
                sublistId: gItemSublistId
            });

            log.debug('inSoId', inSoId);
            log.debug("inSoItemLineCount", inSoItemLineCount);

            for (var j = 0; j < inSoItemLineCount; j++) {
                var isUpdate = inSoRec.getSublistValue({
                    sublistId: gItemSublistId,
                    fieldId: 'custcol_inter_is_update_price',
                    line: j
                });
                var soRate = inSoRec.getSublistValue({
                    sublistId: gItemSublistId,
                    fieldId: 'custcol_inter_pur_rate', //单价
                    line: j
                });
                var ldbl = inSoRec.getSublistValue({
                    sublistId: gItemSublistId,
                    fieldId: 'custcol_inter_ldbl', //联动比例
                    line: j
                });
                var initemline = inSoRec.getSublistValue({
                    sublistId: gItemSublistId,
                    fieldId: 'line', //联动比例
                    line: j
                });

                log.debug('initemline', initemline);
                log.debug('isUpdate', isUpdate);

                for (var k = 0; k < outPoOriginItemList.length; k++) {
                    if (initemline == outPoOriginItemList[k][gLineNumberFieldId] &&
                        inSoId == outPoOriginItemList[k][gSoId]) {

                        soQty = inSoRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: j
                        });

                        npQty = inSoRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_quantity_not_pushed_down',
                            line: j
                        });

                        pdQty = inSoRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_quantity_pushed_down',
                            line: j
                        });
                        // var sumQty = Number(initemQty) + Number(outPoOriginItemList[k][gQuantityFieldId]);

                        pdQty = pdQty ? Number(pdQty) : 0;
                        npQty = npQty ? Number(npQty) : 0;
                        pdQty = pdQty + Number(outPoOriginItemList[k][gQuantityFieldId]);
                        npQty = Number(soQty) - pdQty;

                        log.debug('soQty2', soQty);
                        log.debug('pdQty2', pdQty);
                        log.debug('npQty2', npQty);


                        inSoRec.setSublistValue({
                            sublistId: gItemSublistId,
                            fieldId: 'custcol_quantity_pushed_down',
                            line: j,
                            value: pdQty
                        });

                        inSoRec.setSublistValue({
                            sublistId: gItemSublistId,
                            fieldId: 'custcol_quantity_not_pushed_down',
                            line: j,
                            value: npQty
                        });

                        if (!npQty) {

                            inSoRec.setSublistValue({
                                sublistId: gItemSublistId,
                                fieldId: 'custcol_po_pushed_down',
                                line: j,
                                value: true
                            });
                        }

                        if (isUpdate == 'Y' && outPoOriginItemList[k][gRateFieldId] > soRate) {
                            inSoRec.setSublistValue({
                                sublistId: gItemSublistId,
                                fieldId: 'custcol_inter_pur_rate',
                                line: j,
                                value: outPoOriginItemList[k][gRateFieldId]
                            });

                            inSoRec.setSublistValue({
                                sublistId: gItemSublistId,
                                fieldId: gRateFieldId,
                                line: j,
                                value: Number(outPoOriginItemList[k][gRateFieldId]) * Number(ldbl)
                            });
                        }
                    }
                }

                // if (isUpdate == 'Y') {

                //     for (var k = 0; k < outPoOriginItemList.length; k++) {
                //         if (initemline == outPoOriginItemList[k][gLineNumberFieldId] &&
                //             inSoId == outPoOriginItemList[k][gSoId] && outPoOriginItemList[k][gRateFieldId] > soRate) {

                //             inSoRec.setSublistValue({
                //                 sublistId: gItemSublistId,
                //                 fieldId: 'custcol_inter_pur_rate',
                //                 line: j,
                //                 value: outPoOriginItemList[k][gRateFieldId]
                //             });

                //             inSoRec.setSublistValue({
                //                 sublistId: gItemSublistId,
                //                 fieldId: gRateFieldId,
                //                 line: j,
                //                 value: Number(outPoOriginItemList[k][gRateFieldId]) * Number(ldbl)
                //             });
                //         }
                //     }
                // }
            }

            inSoRec.save();
        }

        // inPoRec = record.load({
        //     type: gPurchaseorderRecordTypeId,
        //     id: 157339
        // });

        // var coccc = inPoRec.getLineCount({
        //     sublistId: gItemSublistId
        // });

        // for (var i = 0; i < coccc; i++) {
        //     var ttttt = inPoRec.getSublistValue({
        //         sublistId: gItemSublistId,
        //         fieldId: 'custcol_inter_pur_rate',
        //         line: i
        //     });

        //     log.debug('ttttt', ttttt);
        // }

        // var items = context.values,
        //     soId = context.key,
        //     soRec = record.load({
        //         type: gEstimateRecordTypeId,
        //         id: soId
        //     }),
        //     lineCount = soRec.getLineCount({
        //         sublistId: gItemSublistId
        //     });

        // log.debug('lineCount', lineCount);

        // for (var i = 0; i < lineCount; i++) {
        //     var linenumber = soRec.getSublistValue({
        //             sublistId: gItemSublistId,
        //             fieldId: gLinenumberSublistFieldId,
        //             line: i
        //         }),
        //         pushDownQuantitySbFieldId = soRec.getSublistValue({
        //             sublistId: gItemSublistId,
        //             fieldId: gPushDownQuantitySbFieldId,
        //             line: i
        //         }) ? soRec.getSublistValue({
        //             sublistId: gItemSublistId,
        //             fieldId: gPushDownQuantitySbFieldId,
        //             line: i
        //         }) : 0;

        //     log.debug('linenumber', linenumber);
        //     log.debug('linenumber', JSON.parse(items[0])['linenumber']);
        //     log.debug('pushDownQuantitySbFieldId', pushDownQuantitySbFieldId);

        //     for (var j = 0; j < items.length; j++) {
        //         if (linenumber == JSON.parse(items[j])['linenumber']) {
        //             soRec.setSublistValue({
        //                 sublistId: gItemSublistId,
        //                 fieldId: gPushDownQuantitySbFieldId,
        //                 line: i,
        //                 value: pushDownQuantitySbFieldId + JSON.parse(items[j])[gQuantityFieldId]
        //             });
        //         }
        //     }
        // }

        // var recId = soRec.save({
        //     enableSourcing: false,
        //     ignoreMandatoryFields: false
        // });

        // log.debug('reduce recId', recId);
    }

    // function reduce(context) {
    //     log.debug('context', context);
    //     var items = context.values,
    //         soId = context.key,
    //         soRec = record.load({
    //             type: gEstimateRecordTypeId,
    //             id: soId
    //         }),
    //         lineCount = soRec.getLineCount({
    //             sublistId: gItemSublistId
    //         });

    //     log.debug('lineCount', lineCount);

    //     for (var i = 0; i < lineCount; i++) {
    //         var linenumber = soRec.getSublistValue({
    //                 sublistId: gItemSublistId,
    //                 fieldId: gLinenumberSublistFieldId,
    //                 line: i
    //             }),
    //             pushDownQuantitySbFieldId = soRec.getSublistValue({
    //                 sublistId: gItemSublistId,
    //                 fieldId: gPushDownQuantitySbFieldId,
    //                 line: i
    //             }) ? soRec.getSublistValue({
    //                 sublistId: gItemSublistId,
    //                 fieldId: gPushDownQuantitySbFieldId,
    //                 line: i
    //             }) : 0;

    //         log.debug('linenumber', linenumber);
    //         log.debug('linenumber', JSON.parse(items[0])['linenumber']);
    //         log.debug('pushDownQuantitySbFieldId', pushDownQuantitySbFieldId);

    //         for (var j = 0; j < items.length; j++) {
    //             if (linenumber == JSON.parse(items[j])['linenumber']) {
    //                 soRec.setSublistValue({
    //                     sublistId: gItemSublistId,
    //                     fieldId: gPushDownQuantitySbFieldId,
    //                     line: i,
    //                     value: pushDownQuantitySbFieldId + JSON.parse(items[j])[gQuantityFieldId]
    //                 });
    //             }
    //         }
    //     }

    //     var recId = soRec.save({
    //         enableSourcing: false,
    //         ignoreMandatoryFields: false
    //     });

    //     log.debug('reduce recId', recId);
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
        reduce: reduce,
        summarize: summarize
    }
});
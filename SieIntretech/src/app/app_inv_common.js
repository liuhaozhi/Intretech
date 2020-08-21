/**
 *@NApiVersion 2.0
 *@author yuming Hu
 *@description Inv处理公共程序
 */
define([
    'N/record'
], function (
    record
) {
    var gInventorytransferRecTypeId = 'inventorytransfer', //库存转移订单类型
        gInventorydetailFieldId = 'inventorydetail',
        gAssemblyitemFieldId = 'assemblyitem',
        gSlInventorydetailFieldId = 'inventorydetail', //货品行地点详细信息
        gSubRecSlInventoryassignmentId = 'inventoryassignment', //详细详细子标签
        gSublistLocationFieldId = 'componentinventorydetail',
        gSlInventoryId = 'inventory', //货品行sublist
        gSlInventoryItemFieldId = 'item',
        gSlComponentId = 'component',
        gSlOperationId = 'operation',
        gSlIssueinventorynumberFieldId = 'issueinventorynumber',
        gCreatedfromFieldId = 'createdfrom';
    /**
     * 
     * @param {*} option
     * @description 标准模式创建转移库存
     *   1、创建货品行
     *   2、增加了详细信息的创建
     * @version 1.0
     * @author yuming Hu 
     * @date 2020-03-23
     */
    function inventorytransferCreationSt(option) {
        var main = option.main,
            items = option.items,
            enableSourcing = option.enableSourcing,
            ignoreMandatoryFields = option.ignoreMandatoryFields,
            itRec,
            inventorydetailSubRec,
            inventorydetailList = [];

        try {

            itRec = record.create({
                type: gInventorytransferRecTypeId
            });

            for (var key in main) {
                if (main.hasOwnProperty(key)) {
                    itRec.setValue({
                        fieldId: key,
                        value: main[key]
                    });
                }
            }

            if (items) {
                for (var i = 0; i < items.length; i++) {
                    itRec.insertLine({
                        sublistId: gSlInventoryId,
                        line: i
                    });

                    for (var key in items[i]) {

                        if (items[i].hasOwnProperty(key)) {

                            //非批次字段处理
                            if (key != gSlInventorydetailFieldId) {

                                itRec.setSublistValue({
                                    sublistId: gSlInventoryId,
                                    fieldId: key,
                                    line: i,
                                    value: items[i][key]
                                });
                            } else {
                                if (!items[i][key]) {
                                    continue;
                                }

                                inventorydetailSubRec = itRec.getSublistSubrecord({
                                    sublistId: gSlInventoryId,
                                    fieldId: gSlInventorydetailFieldId,
                                    line: i
                                });

                                inventorydetailList = items[i][key];

                                for (var j = 0; j < inventorydetailList.length; j++) {
                                    inventorydetailSubRec.insertLine({
                                        sublistId: gSubRecSlInventoryassignmentId,
                                        line: j
                                    });

                                    for (var skey in inventorydetailList[j]) {

                                        if (inventorydetailList[j].hasOwnProperty(skey)) {

                                            if (skey == gSlIssueinventorynumberFieldId) {

                                                inventorydetailSubRec.setSublistText({
                                                    sublistId: gSubRecSlInventoryassignmentId,
                                                    fieldId: skey,
                                                    line: j,
                                                    text: inventorydetailList[j][skey]
                                                });

                                                // inventorydetailSubRec.setSublistText({
                                                //     sublistId: gInventoryassignmentSrecSlId,
                                                //     fieldId: skey,
                                                //     line: k,
                                                //     text: inventorydetailSlFieldValues[k][skey]
                                                // });
                                            } else {
                                                inventorydetailSubRec.setSublistValue({
                                                    sublistId: gSubRecSlInventoryassignmentId,
                                                    fieldId: skey,
                                                    line: j,
                                                    value: inventorydetailList[j][skey]
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return itRec.save({
                enableSourcing: enableSourcing,
                ignoreMandatoryFields: ignoreMandatoryFields
            });

        } catch (ex) {
            log.error({
                title: '创建事务处理>销售>销售订单',
                details: ex
            });
        }
    }

    /**
     * 
     * @param {*} option
     * @description 标准模式创建库存转移订单
     *   1、创建货品行
     *   2、增加了详细信息的创建
     * @version 1.0
     * @author yuming Hu 
     * @date 2020-03-23
     */
    function transferorderCreationSt(option) {
        var main = option.main,
            items = option.items,
            enableSourcing = option.enableSourcing,
            ignoreMandatoryFields = option.ignoreMandatoryFields,
            itRec,
            inventorydetailSubRec,
            inventorydetailList = [];

        try {

            itRec = record.create({
                type: 'transferorder'
            });

            for (var key in main) {
                if (main.hasOwnProperty(key)) {
                    itRec.setValue({
                        fieldId: key,
                        value: main[key]
                    });
                }
            }

            if (items) {
                for (var i = 0; i < items.length; i++) {
                    itRec.insertLine({
                        sublistId: 'item',
                        line: i
                    });

                    for (var key in items[i]) {

                        if (items[i].hasOwnProperty(key)) {

                            //非批次字段处理
                            if (key != gSlInventorydetailFieldId) {

                                itRec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: key,
                                    line: i,
                                    value: items[i][key]
                                });
                            } else {
                                if (!items[i][key]) {
                                    continue;
                                }

                                inventorydetailSubRec = itRec.getSublistSubrecord({
                                    sublistId: 'item',
                                    fieldId: gSlInventorydetailFieldId,
                                    line: i
                                });

                                inventorydetailList = items[i][key];

                                for (var j = 0; j < inventorydetailList.length; j++) {
                                    inventorydetailSubRec.insertLine({
                                        sublistId: gSubRecSlInventoryassignmentId,
                                        line: j
                                    });

                                    for (var skey in inventorydetailList[j]) {

                                        if (inventorydetailList[j].hasOwnProperty(skey)) {

                                            if (skey == gSlIssueinventorynumberFieldId) {

                                                inventorydetailSubRec.setSublistText({
                                                    sublistId: gSubRecSlInventoryassignmentId,
                                                    fieldId: skey,
                                                    line: j,
                                                    text: inventorydetailList[j][skey]
                                                });

                                                // inventorydetailSubRec.setSublistText({
                                                //     sublistId: gInventoryassignmentSrecSlId,
                                                //     fieldId: skey,
                                                //     line: k,
                                                //     text: inventorydetailSlFieldValues[k][skey]
                                                // });
                                            } else {
                                                inventorydetailSubRec.setSublistValue({
                                                    sublistId: gSubRecSlInventoryassignmentId,
                                                    fieldId: skey,
                                                    line: j,
                                                    value: inventorydetailList[j][skey]
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return itRec.save({
                enableSourcing: enableSourcing,
                ignoreMandatoryFields: ignoreMandatoryFields
            });

        } catch (ex) {
            log.error({
                title: '创建事务处理>销售>销售订单',
                details: ex
            });
        }
    }

    /**
     * 
     * @param {*} option
     * @description 标准模式创建工作单完工
     *   1、创建货品行
     *   2、增加了详细信息的创建
     * @version 1.0
     * @author yuming Hu 
     * @date 2020-04-18
     */

    function workordercompletionCreationSt(option) {
        var main = option.main,
            component = option.component,
            enableSourcing = option.enableSourcing,
            ignoreMandatoryFields = option.ignoreMandatoryFields,
            wocRec,
            lineCount,
            inventorydetailSubRec,
            inventorydetailSlFieldValues,
            itemValue,
            headerLocSubRecord;

        try {
            wocRec = record.transform({
                fromType: record.Type.WORK_ORDER,
                fromId: main[gCreatedfromFieldId],
                toType: 'workordercompletion',
                defaultValues: {
                    isbackflush: 'T'
                }
            });

            //主要信息
            for (var key in main) {
                if (main.hasOwnProperty(key)) {
                    if (key != gCreatedfromFieldId) {
                        if (key == 'startoperation' || key == 'endoperation') {
                            wocRec.setText({
                                fieldId: key,
                                text: main[key]
                                // ignoreFieldChange: true
                            });
                        } else if (key == 'inventorydetail') {
                            headerLocSubRecord = wocRec.getSubrecord({
                                fieldId: key
                            });

                            for (var i = 0; i < main[key].length; i++) {
                                headerLocSubRecord.insertLine({
                                    sublistId: gSubRecSlInventoryassignmentId,
                                    line: i
                                });

                                for (var skey in main[key][i]) {
                                    headerLocSubRecord.setSublistValue({
                                        sublistId: gSubRecSlInventoryassignmentId,
                                        fieldId: skey,
                                        line: i,
                                        value: main[key][i][skey]
                                    });
                                }
                            }
                        } else {
                            wocRec.setValue({
                                fieldId: key,
                                value: main[key]
                                //ignoreFieldChange: true
                            });
                        }
                    }
                }
            }

            //货品行
            if (component) {
                var lineCount = wocRec.getLineCount({
                    sublistId: gSlComponentId
                });

                for (var i = 0; i < lineCount; i++) {
                    itemValue = wocRec.getSublistValue({
                        sublistId: gSlComponentId,
                        fieldId: gSlInventoryItemFieldId,
                        line: i
                    });

                    for (var j = 0; j < component.length; j++) {

                        if (itemValue == component[j][gSlInventoryItemFieldId]) {
                            for (var key in component[j]) {

                                if (component[j].hasOwnProperty(key)) {

                                    if (key != gSlInventoryItemFieldId && key != gSublistLocationFieldId) {

                                        wocRec.setSublistValue({
                                            sublistId: gSlComponentId,
                                            fieldId: key,
                                            line: i,
                                            value: component[j][key]
                                        });
                                    }
                                }
                            }

                            //地点详细信息处理
                            if (component[j][gSublistLocationFieldId]) {

                                inventorydetailSubRec = wocRec.getSublistSubrecord({
                                    sublistId: gSlComponentId,
                                    fieldId: gSublistLocationFieldId,
                                    line: i
                                });

                                inventorydetailSlFieldValues = component[j][gSublistLocationFieldId];

                                for (var k = 0; k < inventorydetailSlFieldValues.length; k++) {

                                    inventorydetailSubRec.insertLine({
                                        sublistId: gSubRecSlInventoryassignmentId,
                                        line: k
                                    });

                                    for (var skey in inventorydetailSlFieldValues[k]) {
                                        if (inventorydetailSlFieldValues[k].hasOwnProperty(skey)) {

                                            inventorydetailSubRec.setSublistValue({
                                                sublistId: gSubRecSlInventoryassignmentId,
                                                fieldId: skey,
                                                line: k,
                                                value: inventorydetailSlFieldValues[k][skey]
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return wocRec.save({
                enableSourcing: enableSourcing,
                ignoreMandatoryFields: ignoreMandatoryFields
            });

        } catch (ex) {
            log.error({
                title: '创建事务处理>销售>销售订单',
                details: ex
            });
        }
    }

    function workordercompletionCreationStV2(option) {
        var main = option.main,
            component = option.component,
            enableSourcing = option.enableSourcing,
            ignoreMandatoryFields = option.ignoreMandatoryFields,
            wocRec,
            lineCount,
            inventorydetailSubRec,
            inventorydetailSlFieldValues,
            itemValue,
            headerLocSubRecord;

        try {
            wocRec = record.transform({
                fromType: record.Type.WORK_ORDER,
                fromId: main[gCreatedfromFieldId],
                toType: 'workordercompletion',
                defaultValues: {
                    isbackflush: 'T'
                }
            });

            //主要信息
            for (var key in main) {
                if (main.hasOwnProperty(key)) {
                    if (key != gCreatedfromFieldId) {
                        if (key == 'startoperation' || key == 'endoperation') {
                            wocRec.setText({
                                fieldId: key,
                                text: main[key]
                                // ignoreFieldChange: true
                            });
                        } else if (key == 'inventorydetail') {
                            headerLocSubRecord = wocRec.getSubrecord({
                                fieldId: key
                            });

                            for (var i = 0; i < main[key].length; i++) {
                                headerLocSubRecord.insertLine({
                                    sublistId: gSubRecSlInventoryassignmentId,
                                    line: i
                                });

                                for (var skey in main[key][i]) {
                                    headerLocSubRecord.setSublistValue({
                                        sublistId: gSubRecSlInventoryassignmentId,
                                        fieldId: skey,
                                        line: i,
                                        value: main[key][i][skey]
                                    });
                                }
                            }
                        } else {
                            wocRec.setValue({
                                fieldId: key,
                                value: main[key]
                                //ignoreFieldChange: true
                            });
                        }
                    }
                }
            }

            //货品行
            if (component) {
                var lineCount = wocRec.getLineCount({
                    sublistId: gSlComponentId
                });

                for (var i = 0; i < lineCount; i++) {
                    itemValue = wocRec.getSublistValue({
                        sublistId: gSlComponentId,
                        fieldId: gSlInventoryItemFieldId,
                        line: i
                    });

                    for (var j = 0; j < component.length; j++) {

                        if (itemValue == component[j][gSlInventoryItemFieldId]) {
                            for (var key in component[j]) {

                                if (component[j].hasOwnProperty(key)) {

                                    if (key != gSlInventoryItemFieldId && key != gSublistLocationFieldId) {

                                        wocRec.setSublistValue({
                                            sublistId: gSlComponentId,
                                            fieldId: key,
                                            line: i,
                                            value: component[j][key]
                                        });
                                    }
                                }
                            }

                            //地点详细信息处理
                            if (component[j][gSublistLocationFieldId]) {

                                inventorydetailSubRec = wocRec.getSublistSubrecord({
                                    sublistId: gSlComponentId,
                                    fieldId: gSublistLocationFieldId,
                                    line: i
                                });

                                inventorydetailSlFieldValues = component[j][gSublistLocationFieldId];

                                for (var k = 0; k < inventorydetailSlFieldValues.length; k++) {

                                    inventorydetailSubRec.insertLine({
                                        sublistId: gSubRecSlInventoryassignmentId,
                                        line: k
                                    });

                                    for (var skey in inventorydetailSlFieldValues[k]) {
                                        if (inventorydetailSlFieldValues[k].hasOwnProperty(skey)) {

                                            if (skey == gSlIssueinventorynumberFieldId) {
                                                // inventorydetailSubRec.setSublistValue({
                                                //     sublistId: gSubRecSlInventoryassignmentId,
                                                //     fieldId: skey,
                                                //     line: k,
                                                //     value: inventorydetailSlFieldValues[k][skey]
                                                // });
                                                inventorydetailSubRec.setSublistText({
                                                    sublistId: gSubRecSlInventoryassignmentId,
                                                    fieldId: skey,
                                                    line: k,
                                                    text: inventorydetailSlFieldValues[k][skey]
                                                });
                                            } else {
                                                inventorydetailSubRec.setSublistValue({
                                                    sublistId: gSubRecSlInventoryassignmentId,
                                                    fieldId: skey,
                                                    line: k,
                                                    value: inventorydetailSlFieldValues[k][skey]
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return wocRec.save({
                enableSourcing: enableSourcing,
                ignoreMandatoryFields: ignoreMandatoryFields
            });

        } catch (ex) {
            log.error({
                title: '创建事务处理>销售>销售订单',
                details: ex
            });
        }
    }

    return {
        inventorytransferCreationSt: inventorytransferCreationSt,
        workordercompletionCreationSt: workordercompletionCreationSt,
        workordercompletionCreationStV2: workordercompletionCreationStV2,
        transferorderCreationSt: transferorderCreationSt
    }
});
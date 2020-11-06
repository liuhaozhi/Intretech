/**
 *@NApiVersion 2.0
 *@author yuming Hu
 *@description po处理公共程序
 */
define([
    'N/record'
], function (
    record
) {
    var gprRecordTypeId = 'purchaserequisition', //采购申请记录类型
        gpoRecordTypeId = 'purchaseorder', //采购订单记录类型
        gItemreceiptRecTypeId = 'itemreceipt',
        gPurchaseorderRecTypeId = 'purchaseorder', //采购订单记录类型
        gItemSublistId = 'item', //货品子标签
        gLocationFieldId = 'location', //主线地点字段Id
        gInventorydetailSlFieldId = 'inventorydetail', //货品行地点详细信息
        gItemLocationSlFieldId = 'location', //货品行上的地点字段Id
        gInventoryassignmentSlRecId = 'inventoryassignment',
        gItemSlFieldId = 'item',
        gLineSlFieldId = 'line',
        gOrderlineSlFieldId = 'orderline'; //详细详细子标签

    function prCreation(option) {

        var main = option.main;
        var items = option.items;

        try {
            var rec = record.create({
                type: gprRecordTypeId,
                isDynamic: true
            });

            for (var key in main) {
                if (main.hasOwnProperty(key)) {
                    rec.setValue({
                        fieldId: key,
                        value: main[key]
                    });
                }
            }

            for (var itemIndex in items) {
                rec.selectNewLine({
                    sublistId: gItemSublistId
                });

                for (var key in items[itemIndex]) {
                    if (items[itemIndex].hasOwnProperty(key)) {
                        rec.setCurrentSublistValue({
                            sublistId: gItemSublistId,
                            fieldId: key,
                            value: items[itemIndex][key]
                        });
                    }
                };

                rec.commitLine({
                    sublistId: gItemSublistId
                });
            }

            return rec.save({
                enableSourcing: false,
                ignoreMandatoryFields: false
            });

        } catch (ex) {
            log.error({
                title: '创建采购申请',
                details: ex
            });
        }
    }

    function poCreationSTM(option) {
        var mainPayload = option.mainPayload,
            items = option.items,
            poRec;

        try {

            poRec = record.create({
                type: gpoRecordTypeId
            });

            for (var key in mainPayload) {
                if (mainPayload.hasOwnProperty(key)) {
                    poRec.setValue({
                        fieldId: key,
                        value: mainPayload[key]
                    });
                }
            }

            if (items) {
                for (var i = 0; i < items.length; i++) {
                    poRec.insertLine({
                        sublistId: gItemSublistId,
                        line: i
                    });

                    for (var key in items[i]) {
                        if (items[i].hasOwnProperty(key)) {
                            poRec.setSublistValue({
                                sublistId: gItemSublistId,
                                fieldId: key,
                                line: i,
                                value: items[i][key]
                            });
                        }
                    }
                }
            }

            return poRec.save({
                enableSourcing: false,
                ignoreMandatoryFields: false
            });

        } catch (ex) {
            log.error({
                title: '创建事务处理>销售>报价单',
                details: ex
            });
        }
    }
    /**
     * 
     * @param {*} option
     * @description 标准模式创建采购订单
     *   1、创建货品行
     *   2、增加了详细信息的创建
     * @version 1.0
     * @author yuming Hu 
     * @date 2020-02-20
     */
    function purchaseorderCreationSt(option) {
        var main = option.main,
            items = option.items,
            enableSourcing = option.enableSourcing,
            ignoreMandatoryFields = option.ignoreMandatoryFields,
            purchaseorderRec,
            inventorydetailSubRec,
            inventorydetailSlFieldValues = [];

        try {

            purchaseorderRec = record.create({
                type: gPurchaseorderRecTypeId
            });

            for (var key in main) {
                if (main.hasOwnProperty(key)) {
                    purchaseorderRec.setValue({
                        fieldId: key,
                        value: main[key]
                    });
                }
            }

            if (items) {
                for (var i = 0; i < items.length; i++) {
                    purchaseorderRec.insertLine({
                        sublistId: gItemSublistId,
                        line: i
                    });

                    for (var key in items[i]) {

                        if (items[i].hasOwnProperty(key)) {

                            //非批次字段处理
                            if (key != gInventorydetailSlFieldId) {

                                purchaseorderRec.setSublistValue({
                                    sublistId: gItemSublistId,
                                    fieldId: key,
                                    line: i,
                                    value: items[i][key]
                                });
                            } else {

                                //如果不存在地点，则退出当前循环
                                if (!main[gLocationFieldId]) {
                                    continue;
                                }

                                inventorydetailSubRec = purchaseorderRec.getSublistSubrecord({
                                    sublistId: gItemSublistId,
                                    fieldId: key,
                                    line: i
                                });

                                inventorydetailSlFieldValues = items[i][key];

                                for (var j = 0; j < inventorydetailSlFieldValues.length; j++) {

                                    inventorydetailSubRec.insertLine({
                                        sublistId: gInventoryassignmentSlRecId,
                                        line: j
                                    });

                                    for (var skey in inventorydetailSlFieldValues[j]) {
                                        if (inventorydetailSlFieldValues[j].hasOwnProperty(skey)) {

                                            inventorydetailSubRec.setSublistValue({
                                                sublistId: gInventoryassignmentSlRecId,
                                                fieldId: skey,
                                                line: j,
                                                value: inventorydetailSlFieldValues[j][skey]
                                            });
                                        }
                                    }
                                }
                            }

                        }
                    }
                }
            }

            return purchaseorderRec.save({
                enableSourcing: enableSourcing,
                ignoreMandatoryFields: ignoreMandatoryFields
            });

        } catch (ex) {
            log.error({
                title: '创建事务处理>销售>报价单',
                details: ex
            });
        }
    }

    /**
     * 
     * @param {*} option
     * @description 标准模式创建采购订单
     *   1、创建货品行
     *   2、增加了详细信息的创建
     * @version 1.0
     * @author yuming Hu 
     * @date 2020-02-20
     */
    function purchaseorderCreationDy(option) {
        var main = option.main,
            items = option.items,
            enableSourcing = option.enableSourcing,
            ignoreMandatoryFields = option.ignoreMandatoryFields,
            purchaseorderRec,
            inventorydetailSubRec,
            inventorydetailSlFieldValues = [];

        try {

            purchaseorderRec = record.create({
                type: gPurchaseorderRecTypeId
            });

            for (var key in main) {
                if (main.hasOwnProperty(key)) {
                    purchaseorderRec.setValue({
                        fieldId: key,
                        value: main[key]
                    });
                }
            }

            if (items) {
                for (var i = 0; i < items.length; i++) {
                    purchaseorderRec.insertLine({
                        sublistId: gItemSublistId,
                        line: i
                    });

                    for (var key in items[i]) {

                        if (items[i].hasOwnProperty(key)) {

                            //非批次字段处理
                            if (key != gInventorydetailSlFieldId) {

                                purchaseorderRec.setCurrentSublistValue({
                                    sublistId: gItemSublistId,
                                    fieldId: key,
                                    value: items[i][key]
                                });
                            } else {

                                //如果不存在地点，则退出当前循环
                                if (!main[gLocationFieldId]) {
                                    continue;
                                }

                                inventorydetailSubRec = purchaseorderRec.getCurrentSublistSubrecord({
                                    sublistId: gItemSublistId,
                                    fieldId: key,
                                });

                                inventorydetailSlFieldValues = items[i][key];

                                for (var j = 0; j < inventorydetailSlFieldValues.length; j++) {

                                    inventorydetailSubRec.insertLine({
                                        sublistId: gInventoryassignmentSlRecId,
                                        line: j
                                    });

                                    for (var skey in inventorydetailSlFieldValues[j]) {
                                        if (inventorydetailSlFieldValues[j].hasOwnProperty(skey)) {

                                            purchaseorderRec.setCurrentSublistValue({
                                                sublistId: gItemSublistId,
                                                fieldId: skey,
                                                value: inventorydetailSlFieldValues[i][skey]
                                            });
                                        }
                                    }

                                    inventorydetailSubRec.commitLine({
                                        sublistId: gInventoryassignmentSlRecId
                                    });
                                }
                            }

                        }
                    }

                    purchaseorderRec.commitLine({
                        sublistId: gItemSublistId
                    });
                }
            }

            return purchaseorderRec.save({
                enableSourcing: enableSourcing,
                ignoreMandatoryFields: ignoreMandatoryFields
            });

        } catch (ex) {
            log.error({
                title: '创建事务处理>销售>报价单',
                details: ex
            });
        }
    }

    /**
     * 
     * @param {*} option
     * @description 标准模式创建入库单
     *   1、创建货品行
     *   2、增加了详细信息的创建
     * @version 1.0
     * @author yuming Hu 
     * @date 2020-02-27
     */
    function itemreceiptCreationSt(option) { 
        var main = option.main,
            items = option.items,
            enableSourcing = option.enableSourcing,
            ignoreMandatoryFields = option.ignoreMandatoryFields,
            irRec, //入库单记录
            inventorydetailSubRec, //详细信息子记录
            inventorydetailSlFieldValues = [], //详细信息自己录的子列表
            createdfromFieldId = 'createdfrom',
            lineCount,
            orderlineValue; //采购来源行

        try {
            irRec = record.transform({
                fromType: gPurchaseorderRecTypeId,
                fromId: main[createdfromFieldId],
                toType: gItemreceiptRecTypeId
            });

            //主要信息
            for (var key in main) {
                if (main.hasOwnProperty(key)) {
                    if (key != createdfromFieldId) {
                        irRec.setValue({
                            fieldId: key,
                            value: main[key]
                        });
                    }
                }
            }

            //货品行
            if (items) {
                var lineCount = irRec.getLineCount({
                    sublistId: gItemSublistId
                });

                for (var i = 0; i < lineCount; i++) {
                    orderlineValue = irRec.getSublistValue({
                        sublistId: gItemSublistId,
                        fieldId: gOrderlineSlFieldId,
                        line: i
                    });

                    for (var j = 0; j < items.length; j++) {

                        if (orderlineValue == items[j][gLineSlFieldId]) {
                            for (var key in items[j]) {

                                if (items[j].hasOwnProperty(key)) {

                                    if (key != gOrderlineSlFieldId && key != gInventorydetailSlFieldId) {

                                        irRec.setSublistValue({
                                            sublistId: gItemSublistId,
                                            fieldId: key,
                                            line: i,
                                            value: items[j][key]
                                        });
                                    }
                                }
                            }

                            //地点详细信息处理
                            if (items[j][gInventorydetailSlFieldId] && items[j][gItemLocationSlFieldId]) {

                                inventorydetailSubRec = irRec.getSublistSubrecord({
                                    sublistId: gItemSublistId,
                                    fieldId: gInventorydetailSlFieldId,
                                    line: i
                                });

                                inventorydetailSlFieldValues = items[j][gInventorydetailSlFieldId];

                                for (var k = 0; k < inventorydetailSlFieldValues.length; k++) {

                                    inventorydetailSubRec.insertLine({
                                        sublistId: gInventoryassignmentSlRecId,
                                        line: k
                                    });

                                    for (var skey in inventorydetailSlFieldValues[k]) {
                                        if (inventorydetailSlFieldValues[k].hasOwnProperty(skey)) {

                                            inventorydetailSubRec.setSublistValue({
                                                sublistId: gInventoryassignmentSlRecId,
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

            return irRec.save({
                enableSourcing: enableSourcing,
                ignoreMandatoryFields: true
            });
        } catch (e) {
            log.error({
                title: '事务处理>采购>接受订单',
                details: e
            });
        }
    }

    return {
        prCreation: prCreation,
        poCreationSTM: poCreationSTM,
        purchaseorderCreationSt: purchaseorderCreationSt,
        purchaseorderCreationDy: purchaseorderCreationDy,
        itemreceiptCreationSt: itemreceiptCreationSt
    }
});
/**
 *@NApiVersion 2.0
 *@author yuming Hu
 *@description so处理公共程序
 */
define([
    'N/record'
], function ( 
    record
) {
    var gestimateRecordTypeId = 'estimate',
        gSalesorderRecTypeId = 'salesorder',
        gItemfulfillmentRecTypeId = 'itemfulfillment',
        gInventorydetailSlFieldId = 'inventorydetail', //货品行地点详细信息
        gInventoryassignmentSrecSlId = 'inventoryassignment', //详细详细子标签
        gItemLocationSlFieldId = 'location', //货品行上的地点字段Id
        gItemSublistId = 'item',
        gItemSlFieldId = 'item',
        gLineSlFieldId = 'line',
        gSlIssueinventorynumberFieldId = 'issueinventorynumber',
        gOrderlineSlFieldId = 'orderline'; //详细详细子标签;

    /**
     * 
     * @param {*} option 
     * @author yuming Hu
     * @version 1.0
     * @description 创建准备报价单，标准模式
     */
    function estimateCreationSTM(option) {

        var mainPayload = option.mainPayload,
            items = option.items,
            soRec;

        try {
            log.debug('Create Estimate', JSON.stringify(option));
            soRec = record.create({
                type: gestimateRecordTypeId
            });

            for (var key in mainPayload) {
                if (mainPayload.hasOwnProperty(key)) {
                    soRec.setValue({
                        fieldId: key,
                        value: mainPayload[key]
                    });
                }
            }

            if (items) {
                for (var i = 0; i < items.length; i++) {
                    soRec.insertLine({
                        sublistId: gItemSublistId,
                        line: i
                    });

                    for (var key in items[i]) {
                        if(key === 'rate'){
                            soRec.setSublistValue({
                                sublistId: gItemSublistId,
                                fieldId: 'custcol_unit_notax',
                                line: i,
                                value: items[i][key]
                            })
                        } 

                        soRec.setSublistValue({
                            sublistId: gItemSublistId,
                            fieldId: key,
                            line: i,
                            value: items[i][key]
                        });
                    }
                }
            }

            return soRec.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
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
     * @description 标准模式创建销售订单
     *   1、创建货品行
     *   2、增加了详细信息的创建
     * @version 1.0
     * @author yuming Hu 
     * @date 2020-02-20
     */
    function salesorderCreationSt(option) {
        var main = option.main,
            items = option.items,
            enableSourcing = option.enableSourcing,
            ignoreMandatoryFields = option.ignoreMandatoryFields,
            salesorderRec,
            inventorydetailSubRec,
            inventorydetailSlFieldValues = [];

        try {

            salesorderRec = record.create({
                type: gSalesorderRecTypeId
            });

            for (var key in main) {
                if (main.hasOwnProperty(key)) {
                    salesorderRec.setValue({
                        fieldId: key,
                        value: main[key]
                    });
                }
            }

            if (items) {
                for (var i = 0; i < items.length; i++) {
                    salesorderRec.insertLine({
                        sublistId: gItemSublistId,
                        line: i
                    });
                   
                    salesorderRec.setSublistValue({
                        sublistId: gItemSublistId,
                        fieldId: 'custcol_k3line_number',
                        line: i,
                        value: '-None-'
                    })
                    
                    for (var key in items[i]) {
                        if (items[i].hasOwnProperty(key)) {
                            if (key != gInventorydetailSlFieldId) {

                                salesorderRec.setSublistValue({
                                    sublistId: gItemSublistId,
                                    fieldId: key,
                                    line: i,
                                    value: items[i][key]
                                });
                            }

                            if(key == 'rate'){
                                salesorderRec.setSublistValue({
                                    sublistId: gItemSublistId,
                                    fieldId: 'custcol_unit_notax',
                                    line: i,
                                    value: items[i][key]
                                });
                            }
                        }
                    }
                    // if (!items[i][gInventorydetailSlFieldId] && items[i][gItemLocationSlFieldId]) {

                    //     inventorydetailSubRec = salesorderRec.getSublistSubrecord({
                    //         sublistId: gItemSublistId,
                    //         fieldId: gInventorydetailSlFieldId,
                    //         line: i
                    //     });

                    //     inventorydetailSlFieldValues = items[i][gInventorydetailSlFieldId];

                    //     if(inventorydetailSlFieldValues)
                    //     for (var j = 0; j < inventorydetailSlFieldValues.length; j++) {
                    //         inventorydetailSubRec.insertLine({
                    //             sublistId: gInventoryassignmentSrecSlId,
                    //             line: j
                    //         });

                    //         for (var skey in inventorydetailSlFieldValues[j]) {

                    //             if (inventorydetailSlFieldValues[j].hasOwnProperty(skey)) {

                    //                 inventorydetailSubRec.setSublistValue({
                    //                     sublistId: gInventoryassignmentSrecSlId,
                    //                     fieldId: skey,
                    //                     line: j,
                    //                     value: inventorydetailSlFieldValues[j][skey]
                    //                 });
                    //             }
                    //         }
                    //     }
                    // }
                }
            }

            return salesorderRec.save({
                enableSourcing: enableSourcing,
                ignoreMandatoryFields: true
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
     * @description 标准模式创建出库单
     *   1、创建货品行
     *   2、增加了详细信息的创建
     * @version 1.0
     * @author yuming Hu 
     * @date 2020-02-20
     */
    function itemfulfillmentCreationSt(option) {

        var main = option.main,
            items = option.items,
            enableSourcing = option.enableSourcing,
            ignoreMandatoryFields = option.ignoreMandatoryFields,
            iffRec, //出库单记录
            inventorydetailSubRec, //详细信息子记录
            inventorydetailSlFieldValues = [], //详细信息自己录的子列表
            createdfromFieldId = 'createdfrom',
            lineCount,
            orderlineValue;

        try {
            iffRec = record.transform({
                fromType: gSalesorderRecTypeId,
                fromId: main[createdfromFieldId],
                toType: gItemfulfillmentRecTypeId,
                isDynamic : true
            });

            iffRec.setValue({
                fieldId : 'customform',
                value : 215
            })

            log.debug('iffRec',iffRec)
            log.debug('main',main)
            log.debug('items',JSON.stringify(items))
            //主要信息
            for (var key in main) {
                if (main.hasOwnProperty(key)) {
                    if (key != createdfromFieldId) {
                        iffRec.setValue({
                            fieldId: key,
                            value: main[key]
                        });
                    }
                }
            }

            //货品行
            if (items) {
                var lineCount = iffRec.getLineCount({
                    sublistId: gItemSublistId
                });

                for (var i = 0; i < lineCount; i++) {
                    iffRec.selectLine({
                        sublistId : gItemSublistId,
                        line : i
                    })
                    iffRec.removeCurrentSublistSubrecord({
                        sublistId: gItemSublistId,
                        fieldId: gInventorydetailSlFieldId
                    })
                    orderlineValue = iffRec.getSublistValue({
                        sublistId: gItemSublistId,
                        fieldId: gOrderlineSlFieldId,
                        line: i
                    })
                    for (var j = 0; j < items.length; j++) {
                        if (orderlineValue == items[j][gLineSlFieldId]) {
                            for (var key in items[j]) {
                                if (items[j].hasOwnProperty(key)) {
                                    if (key != gItemSlFieldId && key != gInventorydetailSlFieldId) {
                                        iffRec.setCurrentSublistValue({
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
                                inventorydetailSlFieldValues = items[j][gInventorydetailSlFieldId];
                                inventorydetailSubRec = iffRec.getCurrentSublistSubrecord({
                                    sublistId: gItemSublistId,
                                    fieldId: gInventorydetailSlFieldId,
                                    line: i
                                })
                                for (var k = 0; k < inventorydetailSlFieldValues.length; k++) {
                                    inventorydetailSubRec.selectNewLine({
                                        sublistId : gInventoryassignmentSrecSlId
                                    })
                                    // inventorydetailSubRec.insertLine({
                                    //     sublistId: gInventoryassignmentSrecSlId,
                                    //     line: k
                                    // });

                                    for (var skey in inventorydetailSlFieldValues[k]) {
                                        if (inventorydetailSlFieldValues[k].hasOwnProperty(skey)) {

                                            // inventorydetailSubRec.setSublistValue({
                                            //     sublistId: gInventoryassignmentSrecSlId,
                                            //     fieldId: skey,
                                            //     line: k,
                                            //     value: inventorydetailSlFieldValues[k][skey]
                                            // });
                                            if (skey == gSlIssueinventorynumberFieldId) {
                                                // objRecord.setSublistText({
                                                //     sublistId: 'item',
                                                //     fieldId: 'item',
                                                //     line: 3,
                                                //     text: 'value'
                                                // });

                                                inventorydetailSubRec.setCurrentSublistText({
                                                    sublistId: gInventoryassignmentSrecSlId,
                                                    fieldId: skey,
                                                    line: k,
                                                    text: inventorydetailSlFieldValues[k][skey]
                                                });
                                            } else {
                                                inventorydetailSubRec.setCurrentSublistValue({
                                                    sublistId: gInventoryassignmentSrecSlId,
                                                    fieldId: skey,
                                                    line: k,
                                                    value: inventorydetailSlFieldValues[k][skey]
                                                });
                                            }
                                        }
                                    }

                                    inventorydetailSubRec.commitLine({
                                        sublistId : gInventoryassignmentSrecSlId
                                    })
                                }
                            }
                        }

                        iffRec.commitLine({
                            sublistId : gItemSublistId
                        })
                    }
                }
            }

            iffRec.selectLine({
                sublistId : gItemSublistId,
                line : 0
            })

            var subRecord = iffRec.getCurrentSublistSubrecord({
                sublistId: gItemSublistId,
                fieldId: gInventorydetailSlFieldId
            })

            subRecord.selectLine({
                sublistId : gInventoryassignmentSrecSlId,
                line : 0
            })

            log.debug('quantity', subRecord.getCurrentSublistValue({
                sublistId: gInventoryassignmentSrecSlId,
                fieldId: 'quantity',
                line: 0
            }))

            log.debug('status', subRecord.getCurrentSublistValue({
                sublistId: gInventoryassignmentSrecSlId,
                fieldId: 'status',
                line: 0
            }))

            log.debug('issueinventorynumber', subRecord.getCurrentSublistValue({
                sublistId: gInventoryassignmentSrecSlId,
                fieldId: 'issueinventorynumber',
                line: 0
            }))


            return iffRec.save({
                enableSourcing: enableSourcing,
                ignoreMandatoryFields: true
            });
        } catch (e) {
            log.error({
                title: '创建事务处理>销售>履行订单',
                details: e
            });
        }

    }

    return {
        estimateCreationSTM: estimateCreationSTM,
        salesorderCreationSt: salesorderCreationSt,
        itemfulfillmentCreationSt: itemfulfillmentCreationSt
    }
});
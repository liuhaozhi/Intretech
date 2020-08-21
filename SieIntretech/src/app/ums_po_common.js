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
        gItemSublistId = 'item', //货品子标签
        gPurchaseorderRecTypeId = 'purchaseorder', //采购订单记录类型
        gLocationFieldId = 'location', //主线地点字段Id
        gInventorydetailSlFieldId = 'inventorydetail', //货品行地点详细信息
        gInventoryassignmentSrecSlId = 'inventoryassignment',
        gItemLocationSlFieldId = 'location', //货品行上的地点字段Id
        gItemSlFieldId = 'orderline'; //详细详细子标签从item 换成 orderline 
    ////////////////////////////
    gLandcostlFieldId = 'landedcost', //到岸成本
        gIandCostrecSblId = 'landedcostdata',//到岸成本行
        gLandcostlFieldIdCostCategory = 'costcategory',
        gLandcostlFieldIdamount = 'amount';
    ////标准到岸成本不可直接用，换成custcol_ums_duty_amount
    dutyAmountField = 'custcol_ums_duty_amount',//关税字段
        costcategoryid = 9; //关税类别



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
                                    for (var skey in inventorydetailSlFieldValues[j]) {
                                        if (inventorydetailSlFieldValues[j].hasOwnProperty(skey)) {
                                            inventorydetailSubRec.insertLine({
                                                sublistId: gInventoryassignmentSrecSlId,
                                                line: j
                                            });

                                            sublistLocRecord.setSublistValue({
                                                sublistId: gInventoryassignmentSrecSlId,
                                                fieldId: skey,
                                                line: j,
                                                value: inventorydetailSlFieldValues[j][key]
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

                                // purchaseorderRec.setSublistValue({
                                //     sublistId: gItemSublistId,
                                //     fieldId: key,
                                //     line: i,
                                //     value: items[i][key]
                                // });

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
                                    for (var skey in inventorydetailSlFieldValues[j]) {
                                        if (inventorydetailSlFieldValues[j].hasOwnProperty(skey)) {
                                            inventorydetailSubRec.insertLine({
                                                sublistId: gInventoryassignmentSrecSlId,
                                                line: j
                                            });

                                            purchaseorderRec.setCurrentSublistValue({
                                                sublistId: gItemSublistId,
                                                fieldId: key,
                                                value: items[i][key]
                                            });
                                        }
                                    }

                                    inventorydetailSubRec.commitLine({
                                        sublistId: gInventoryassignmentSrecSlId
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
            LandCostlSubRec, //到岸成本子记录
            landcostFieldValues = [], //到岸成本的子列表 
            createdfromFieldId = 'createdfrom',
            lineCount,
            itemValue;

        try {
            irRec = record.transform({
                fromType: gPurchaseorderRecTypeId,
                fromId: main[createdfromFieldId],
                toType: gItemreceiptRecTypeId,
                isDynamic: false /// add by andy

            });

            irRec.setValue({
                fieldId: 'landedcostperline',
                value: true
            });


            //主要信息
            for (var key in main) {
                if (main.hasOwnProperty(key)) {
                    if (key != createdfromFieldId) {
                        log.debug('line 408', { key: key, value: main[key] });
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
                    itemValue = irRec.getSublistValue({
                        sublistId: gItemSublistId,
                        fieldId: gItemSlFieldId,
                        line: i
                    });

                    for (var j = 0; j < items.length; j++) {

                        if (itemValue == items[j][gItemSlFieldId]) {
                            //此处是 orderline匹配上
                            for (var key in items[j]) {

                                if (items[j].hasOwnProperty(key)) {

                                    if (key != gItemSlFieldId && key != gInventorydetailSlFieldId && key != gLandcostlFieldId) {
                                        //  log.debug('line 438',{key:key,value:items[j][key]});


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

                                //  log.error('line 446 ', { line: i, gInventorydetailSlFieldId: gInventorydetailSlFieldId })

                                inventorydetailSlFieldValues = items[j][gInventorydetailSlFieldId];

                                for (var k = 0; k < inventorydetailSlFieldValues.length; k++) {

                                    inventorydetailSubRec.insertLine({
                                        sublistId: gInventoryassignmentSrecSlId,
                                        line: k
                                    });

                                    for (var skey in inventorydetailSlFieldValues[k]) {
                                        if (inventorydetailSlFieldValues[k].hasOwnProperty(skey)) {

                                            inventorydetailSubRec.setSublistValue({
                                                sublistId: gInventoryassignmentSrecSlId,
                                                fieldId: skey,
                                                line: k,
                                                value: inventorydetailSlFieldValues[k][skey]
                                            });
                                        }
                                    }

                                }
                            }




                            /* log.debug(' 处理到岸成本处理', gLandcostlFieldId);
                             if (items[j][gLandcostlFieldId]) {
                                 log.debug(' 处理到岸成本处理');
                                 landcostFieldValues = items[j][gLandcostlFieldId];
 
                                 LandCostlSubRec = irRec.getSublistSubrecord({
                                     sublistId: gItemSublistId,
                                     fieldId: gLandcostlFieldId,
                                     line: i
                                 });
 
                                 landcostFieldValues = items[j][gLandcostlFieldId];
 
 
 
                                 for (var k = 0; k < landcostFieldValues.length; k++) {
 
                                     LandCostlSubRec.insertLine({
                                         sublistId: gIandCostrecSblId,
                                         line: k
                                     });
 
                                     for (var skey in landcostFieldValues[k]) {
                                         if (landcostFieldValues[k].hasOwnProperty(skey)) {
 
                                             log.error('到岸成本line 506 ', { line: i, gItemSublistId: gItemSublistId, gIandCostrecSblId: gIandCostrecSblId, skey: skey, value: landcostFieldValues[k][skey] });
 
                                             LandCostlSubRec.setSublistValue({
                                                 sublistId: gIandCostrecSblId,//gLandcostlFieldId,
                                                 fieldId: skey,
                                                 line: k,
                                                 value: landcostFieldValues[k][skey]
                                             });
                                         }
                                     }
                                 }
                                 //  LandCostlSubRec.commit;
                             }*/
                        }
                    }
                }
            }

            var sr = irRec.save({
                enableSourcing: enableSourcing,
                ignoreMandatoryFields: ignoreMandatoryFields
            });

            //更新关税

            var myRec = record.load({
                type: record.Type.ITEM_RECEIPT,
                id: sr,
                isDynamic: false
            });

            var lineCount = myRec.getLineCount({
                sublistId: gItemSublistId
            });

            var costValue = null;
            for (var i = 0; i < lineCount; i++) {
                costValue = null;

                costValue = myRec.getSublistValue({
                    sublistId: gItemSublistId,
                    fieldId: dutyAmountField,  //关税字段
                    line: i
                });

                if (costValue > 0) {

                    log.debug(i, costValue);

                    var landCost = myRec.getSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'landedcost',
                        line: i
                    });

                    landCost.insertLine({
                        sublistId: 'landedcostdata',// gIandCostrecSblId ,
                        line: 0
                    });


                    landCost.setSublistValue({
                        sublistId: 'landedcostdata',
                        fieldId: 'costcategory',
                        value: costcategoryid, //关税
                        line: 0
                    });

                    landCost.setSublistValue({
                        sublistId: 'landedcostdata',
                        fieldId: 'amount',
                        value: costValue,
                        line: 0
                    })
                }
            }

            var saveid = myRec.save();
            return saveid;



        } catch (e) {
            log.error({
                title: '事务处理>采购>接受订单',
                details: e
            });
        }
    }


    function updateLandCost() {



        //  124096 :测试从inboundshipment 创建能不能更新关税
        sr = 124096;
        var myRec = record.load({
            type: record.Type.ITEM_RECEIPT,
            id: sr,
            isDynamic: false
        });

        var lineCount = myRec.getLineCount({
            sublistId: gItemSublistId
        });

        var costValue = null;
        for (var i = 0; i < lineCount; i++) {
            costValue = null;

            costValue = myRec.getSublistValue({
                sublistId: gItemSublistId,
                fieldId: dutyAmountField,  //关税字段
                line: i
            });

            costValue = 0.34;

            if (costValue > 0) {

                log.debug(i, costValue);

                var landCost = myRec.getSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'landedcost',
                    line: i
                });

                landCost.insertLine({
                    sublistId: 'landedcostdata',// gIandCostrecSblId ,
                    line: 0
                });


                landCost.setSublistValue({
                    sublistId: 'landedcostdata',
                    fieldId: 'costcategory',
                    value: costcategoryid, //关税
                    line: 0
                });

                landCost.setSublistValue({
                    sublistId: 'landedcostdata',
                    fieldId: 'amount',
                    value: 0.33,// costValue,
                    line: 0
                })
            }
        }

        var saveidsss = myRec.save();



    }



    function createcustomizationrecord(rcv_jsondata, headerRecType, lineRecType, FieldLineToHeader) {

          
        var main = rcv_jsondata.main,
            items = rcv_jsondata.items,
            rtnmsg = null;
            
        try {
            var hdrRec = record.create({
                type: headerRecType,
                isDynamic: true
            });
            //主要信息
            for (var key in main) {
                if (main.hasOwnProperty(key)) {
                    // if (key != createdfromFieldId) {
                    log.debug('line 408', { key: key, value: main[key] });
                    hdrRec.setValue({
                        fieldId: key,
                        value: main[key]
                    });
                    //    }
                }
            }
            var headerid = hdrRec.save();
            //行
            if (items) {
                var lineRec = null;
                for (var j = 0; j < items.length; j++) {
                    lineRec = record.create({
                        type: lineRecType,
                        isDynamic: true
                    });

                    //此处是 、line匹配上
                    for (var key in items[j]) {
                        if (items[j].hasOwnProperty(key)) {
                            if (key != gItemSlFieldId && key != gInventorydetailSlFieldId && key != gLandcostlFieldId) {
                                //  log.debug('line 438',{key:key,value:items[j][key]});
                                lineRec.setValue({
                                    fieldId: key,
                                    value: items[j][key]
                                });

                            }
                        }
                    }

                    //保存关联关系
                    lineRec.setValue({
                        fieldId: FieldLineToHeader,
                        value: headerid
                    });
                    var lineid = lineRec.save();


                }
            }


            rtnmsg = headerid + '';



        } catch (e) {
            rtnmsg = e;
        }

        return rtnmsg;

    }

    function createintercompanyporcv(rcv_jsondata) {
        var headerRecType = 'customrecord_ums_po_stock_header',
            lineRecType = 'customrecord_ums_po_stock_line',
            FieldLineToHeader = 'custrecord_ums_line_stock_header'; //关联字段

        return createcustomizationrecord(rcv_jsondata, headerRecType, lineRecType, FieldLineToHeader)
    }


    return {
        prCreation: prCreation,
        poCreationSTM: poCreationSTM,
        purchaseorderCreationSt: purchaseorderCreationSt,
        purchaseorderCreationDy: purchaseorderCreationDy,
        itemreceiptCreationSt: itemreceiptCreationSt,
        createintercompanyporcv: createintercompanyporcv
    }
});
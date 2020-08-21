/**
 *@NApiVersion 2.1
 *@author Charles Zhang
 *@description 工单领料的相关程序
 */
define([
    'N/query',
    'N/record',
    'N/cache',
    'N/runtime',
    '../../lib/common_lib.js',
    'N/search',
], function (
    query,
    recordMod,
    cacheMod,
    runtimeMod,
    commonLib,
    searchMod,
) {

    //util
    function throwError(message) {
        throw new Error(message)
    }

    function getToCacheKey(...keyIds) {
        return keyIds.join('-');
    }

    function getToCacheObj() {
        const toRemindCacheKey = 'toAutoFulfillCache';
        const toCache = cacheMod.getCache({
            name: toRemindCacheKey,
            scope: cacheMod.Scope.PRIVATE
        });

        return toCache;
    }

    //设置提示缓存
    function setTransOrderCache({
        orderId,
        userId,
        ...cacheValue
    } = {}) {
        const toCache = getToCacheObj();

        toCache.put({
            key: getToCacheKey(orderId, userId),
            value: cacheValue,
            ttl: 300
        });
    }

    //读取缓存
    function getTransOrderCache({
        orderId,
        userId
    } = {}) {
        const toCache = getToCacheObj();

        return toCache.get({
            key: getToCacheKey(orderId, userId)
        });
    }

    //清除缓存
    function clearTransOrderCache({
        orderId,
        userId
    } = {}) {
        const toCache = getToCacheObj();

        toCache.remove({
            key: getToCacheKey(orderId, userId)
        });
    }

    //查询工单信息-由于workbook无法搜索出来Item Source字段，所以改用Saved Search-2020-4-18修改
    function getWorkOrderInfo(woId = throwError('缺少工单ID信息'), { lingliaoType, fromLocation } = {}) {
        const locationKey = 'location';
        const subsidiaryKey = 'subsidiary';
        const itemsKey = 'items';
        const assemblyQtyKey = 'assemblyQty';
        const covbKey = 'covb';
        let woInfo = new Map();
        const filters = [
            {
                name: 'internalid',
                operator: 'anyof',
                values: [woId]
            },
            {
                name: 'taxline',
                operator: 'is',
                values: 'F'
            },
            {
                name: 'itemsource',
                operator: 'noneof',
                values: ['PHANTOM']
            },
        ];
        const columns = [
            {
                name: 'subsidiary'
            },
            {
                name: 'item'
            },
            {
                name: 'quantity'
            },
            {
                name: 'quantityuom'
            },
            {
                name: 'location'
            },
            { //组件产出
                name: 'componentyield'
            },
            { //Bom数量
                name: 'bomquantity'
            },
            { //已发料数量
                name: 'custcol_quantity_issued'
            },
            { //超领料数量
                name: 'custcol_over_issue_quantity'
            },
            { //退料数量
                name: 'custcol_wip_returned_quantity'
            },
            { //主料等级
                name: 'custcol_main_ingredient_level'
            },
            { //主料编码
                name: 'custcol_main_ingredient_code'
            },
            { //替代料等级
                name: 'custcol_substitute_material_level'
            },
            { //行号
                name: 'line',
            },
            {
                name: 'mainline'
            },
            { //第一次发料
                name: 'custcol_wip_first_store_issue'
            },
            { //第二次发料
                name: 'custcol_wip_second_store_issue'
            },
            { //第三次发料
                name: 'custcol_wip_third_store_issue'
            },
            { //第四次发料
                name: 'custcol_wip_fourth_store_issue'
            },
            { //第五次发料
                name: 'custcol_wip_fifith_store_issue'
            },
            { //单位
                name: 'unitid'
            },
            { //是否取整
                name: 'custcol_if_round_numbers'
            },
            { //已发料套数
                name: 'custcol_wip_already_kitting'
            },
            { //委外供应商库存位
                name: 'custbody_osp_vendor_bin'
            },
        ];
        const itemIds = new Set();

        if (lingliaoType == '1') {//正常发料的时候，过滤已经发完的物品，其他情况维持原状
            filters.push({
                name: 'formulanumeric',
                formula: `CASE WHEN (NVL({custcol_quantity_issued}, 0) + NVL({custcol_over_issue_quantity}, 0) - NVL({custcol_wip_returned_quantity}, 0)) < {quantityuom} THEN 1 ELSE 0 END`,
                operator: 'equalto',
                values: 1
            });
        }

        searchMod.create({
            type: 'workorder',
            filters,
            columns,
        }).run().each(result => {
            const mapResult = {};
            for (const column of result.columns) {
                let { name } = column;
                let resultValue = result.getValue(column);
                mapResult[name] = resultValue;
                if (name === 'item') {
                    mapResult.itemName = result.getText(column);
                }
            }
            const {
                mainline: isMainline,
                bomquantity: bomQty,
                quantityuom: qty,
                item: itemId,
                // custbody_osp_vendor_bin: covb
            } = mapResult;

            //init
            if (woInfo.size === 0) {
                woInfo.set(subsidiaryKey, mapResult.subsidiary);
                woInfo.set(locationKey, mapResult.location);
                woInfo.set(assemblyQtyKey, 0);
                woInfo.set(covbKey, mapResult.custbody_osp_vendor_bin); //add by yuming hu
                woInfo.set(itemsKey, []);
            }

            //insert
            if (isMainline === '*' || isMainline === true) {
                woInfo.set(assemblyQtyKey, mapResult.quantity); //总套数
            } else if (bomQty !== '') {
                mapResult.quantityuom = Math.abs(qty); //查询出来有复数，设置为正数
                woInfo.get(itemsKey).push(mapResult);
            }

            if (itemId) {
                itemIds.add(itemId);
            }

            return true;
        });

        //查询库存信息
        if (fromLocation && itemIds.size > 0) {
            const inventoryInfo = getLotNumInfo([...itemIds], [fromLocation]);
            for (const mapResult of woInfo.get(itemsKey)) {
                const itemId = +mapResult.item;
                const itemStock = inventoryInfo.get(itemId);
                if (itemId && itemStock) {
                    mapResult.custItemStockTotal = itemStock.reduce(function (total, current) {
                        return total + current.quantityavailable;
                    }, 0);
                } else {
                    mapResult.custItemStockTotal = 0;
                }

                mapResult.custItemStockTotal = +mapResult.custItemStockTotal.toFixed(6);
            }
        }

        return {
            subsidiaryKey,
            locationKey,
            assemblyQtyKey,
            itemsKey,
            woInfo,
        }
    }

    // function getWorkOrderInfo(woId = throwError('缺少工单ID信息')) {
    //     const locationKey = 'location';
    //     const subsidiaryKey = 'subsidiary';
    //     const itemsKey = 'items';
    //     const assemblyQtyKey = 'assemblyQty';
    //     let woInfo = new Map();

    //     //create search
    //     let woQuery = query.create({
    //         type: query.Type.TRANSACTION
    //     });
    //     let transcLineJoin = woQuery.autoJoin({
    //         fieldId: 'transactionlines'
    //     });

    //     //condition
    //     let andConditions = [
    //         woQuery.createCondition({
    //             fieldId: 'type',
    //             operator: query.Operator.ANY_OF,
    //             values: ['WorkOrd']
    //         }),
    //         woQuery.createCondition({
    //             fieldId: 'id',
    //             operator: query.Operator.ANY_OF,
    //             values: [woId]
    //         }),
    //         transcLineJoin.createCondition({
    //             fieldId: 'taxline',
    //             operator: query.Operator.IS,
    //             values: false
    //         })
    //     ];

    //     //columns
    //     let resultColumns = [
    //         transcLineJoin.createColumn({
    //             fieldId: 'subsidiary'
    //         }),
    //         transcLineJoin.createColumn({
    //             fieldId: 'item'
    //         }),
    //         transcLineJoin.createColumn({
    //             fieldId: 'quantity'
    //         }),
    //         transcLineJoin.createColumn({
    //             fieldId: 'location'
    //         }),
    //         transcLineJoin.createColumn({//组件产出
    //             fieldId: 'componentyield'
    //         }),
    //         transcLineJoin.createColumn({//Bom数量
    //             fieldId: 'bomquantity'
    //         }),
    //         transcLineJoin.createColumn({//已发料数量
    //             fieldId: 'custcol_quantity_issued'
    //         }),
    //         transcLineJoin.createColumn({//超领料数量
    //             fieldId: 'custcol_over_issue_quantity'
    //         }),
    //         transcLineJoin.createColumn({//退料数量
    //             fieldId: 'custcol_wip_returned_quantity'
    //         }),
    //         transcLineJoin.createColumn({//主料等级
    //             fieldId: 'custcol_main_ingredient_level'
    //         }),
    //         transcLineJoin.createColumn({//主料编码
    //             fieldId: 'custcol_main_ingredient_code'
    //         }),
    //         transcLineJoin.createColumn({//替代料等级
    //             fieldId: 'custcol_substitute_material_level'
    //         }),
    //         transcLineJoin.createColumn({
    //             fieldId: 'uniquekey'
    //         }),
    //         transcLineJoin.createColumn({
    //             fieldId: 'mainline'
    //         }),
    //         transcLineJoin.createColumn({//第一次发料
    //             fieldId: 'custcol_wip_first_store_issue'
    //         }),
    //         transcLineJoin.createColumn({//第二次发料
    //             fieldId: 'custcol_wip_second_store_issue'
    //         }),
    //         transcLineJoin.createColumn({//第三次发料
    //             fieldId: 'custcol_wip_third_store_issue'
    //         }),
    //         transcLineJoin.createColumn({//第四次发料
    //             fieldId: 'custcol_wip_fourth_store_issue'
    //         }),
    //         transcLineJoin.createColumn({//第五次发料
    //             fieldId: 'custcol_wip_fifith_store_issue'
    //         }),
    //     ];

    //     //run the query
    //     woQuery.condition = woQuery.and(...andConditions);
    //     woQuery.columns = resultColumns;
    //     let resultSets = woQuery.run();
    //     resultSets.iterator().each(result => {
    //         const { value: currentLine } = result;
    //         const mapResult = currentLine.asMap();
    //         const { mainline: isMainline, bomquantity: bomQty, quantity: qty } = mapResult;
    //         //init
    //         if (woInfo.size === 0) {
    //             woInfo.set(subsidiaryKey, mapResult.subsidiary);
    //             woInfo.set(locationKey, mapResult.location);
    //             woInfo.set(assemblyQtyKey, 0);
    //             woInfo.set(itemsKey, []);
    //         }

    //         //insert
    //         if (isMainline === true) {
    //             woInfo.set(assemblyQtyKey, mapResult.quantity);//总套数
    //         } else if (typeof bomQty === 'number') {
    //             mapResult.quantity = Math.abs(qty);//查询出来有复数，设置为正数
    //             woInfo.get(itemsKey).push(mapResult);
    //         }

    //         return true;
    //     });

    //     return {
    //         subsidiaryKey,
    //         locationKey,
    //         assemblyQtyKey,
    //         itemsKey,
    //         woInfo
    //     }
    // }

    //查询批次信息

    function getLotNumInfo(itemIds, fromLocations) {
        const lotNumInfo = new Map();
        const itemQuery = query.create({
            type: query.Type.ITEM
        });
        const inventNumJoin = itemQuery.joinFrom({
            fieldId: 'item',
            source: 'inventorynumber'
        });
        const inventNumLocationJoin = inventNumJoin.join({
            fieldId: 'locations'
        });

        //set condition and columns
        const inventNumColumn = inventNumJoin.createColumn({
            fieldId: 'inventorynumber'
        });
        const andConditions = [
            itemQuery.createCondition({
                fieldId: 'id',
                operator: query.Operator.ANY_OF,
                values: itemIds
            }),
            inventNumLocationJoin.createCondition({
                fieldId: 'location',
                operator: query.Operator.ANY_OF,
                values: fromLocations
            }),
            inventNumLocationJoin.createCondition({
                fieldId: 'quantityavailable',
                operator: query.Operator.GREATER,
                values: 0
            }),
        ];
        const resultColumns = [
            itemQuery.createColumn({
                fieldId: 'id'
            }),
            inventNumLocationJoin.createColumn({
                fieldId: 'quantityavailable'
            }),
            inventNumJoin.createColumn({
                fieldId: 'id',
                alias: 'inventNumId'
            }),
            inventNumColumn,
        ];
        const itemQuerySorts = [
            inventNumJoin.createSort({
                column: inventNumColumn,
                ascending: true
            }),
        ];

        //run the query
        itemQuery.condition = itemQuery.and(...andConditions);
        itemQuery.columns = resultColumns;
        itemQuery.sort = itemQuerySorts;
        const pagedData = itemQuery.runPaged({
            pageSize: 1000
        });
        pagedData.iterator().each(({
            value: currentPage
        }) => {
            for (const singResult of currentPage.data.results) {
                const mapResult = singResult.asMap();
                const {
                    id: itemId
                } = mapResult;
                if (!lotNumInfo.has(itemId)) {
                    lotNumInfo.set(itemId, []);
                }
                lotNumInfo.get(itemId).push(mapResult);
            };
            return true;
        });

        return lotNumInfo;
    }

    //查询剩余套数
    function getWoRemainTaoshu(woId) {
        const transfertypeFieldId = 'custbody_wip_transfer_type';
        const taoShuFieldId = 'custbody_wip_quantity';

        //先搜索工单总套数
        const woInfo = searchMod.lookupFields({
            type: 'workorder',
            id: woId,
            columns: [
                'quantity'
            ]
        });
        let remainTaoShu = +woInfo.quantity;

        //然后搜索已领料和退料套数
        searchMod.create({
            type: 'transferorder',
            filters: [{
                name: 'custbody_wip_work_order_id',
                operator: 'anyof',
                values: [woId]
            },
            {
                name: 'mainline',
                operator: 'is',
                values: 'T'
            }
            ],
            columns: [{
                name: transfertypeFieldId
            },
            {
                name: taoShuFieldId
            }
            ]
        }).run().each(result => {
            const transferType = result.getValue({
                name: transfertypeFieldId
            });
            const taoShu = +result.getValue({
                name: taoShuFieldId
            }) || 0;
            if (transferType == '1' || transferType == '2') { //正常发料-超领料
                remainTaoShu -= taoShu;
            } else if (transferType == '3') { //退料
                remainTaoShu += taoShu;
            }
            return true;
        });

        remainTaoShu = +remainTaoShu.toFixed(6);

        return {
            remainTaoShu,
        }
    }

    //更新转移单的状态
    function updateTransOrderStatus({
        transferId,
        newStatus
    }) {
        try {
            recordMod.submitFields({
                type: 'transferorder',
                id: transferId,
                values: {
                    'custbody_wip_it_status': newStatus
                },
                options: {
                    ignoreMandatoryFields: true
                }
            });
        } catch (ex) {
            log.error({
                title: `更新转移订单的状态失败，订单ID为：${transferId}`
            });
        }
    }

    //自动发货
    function autoFulfill({
        newRecord,
        newRecord: {
            id: transferId
        }
    }) {
        const itemIds = new Set();
        const itemSublist = 'item';
        const invtDtSublist = 'inventoryassignment';
        const result = {
            status: null,
            detail: null
        };

        try {
            const fulfillRec = recordMod.transform({
                fromType: recordMod.Type.TRANSFER_ORDER,
                fromId: transferId,
                toType: recordMod.Type.ITEM_FULFILLMENT
            });
            //设置Pick Pack状态
            fulfillRec.setValue({
                fieldId: 'shipstatus',
                value: 'C' //Shipped
            });
            //获取物料信息
            const lineCount = fulfillRec.getLineCount({
                sublistId: itemSublist
            });
            for (let i = 0; i < lineCount; i++) {
                const itemId = fulfillRec.getSublistValue({
                    sublistId: itemSublist,
                    fieldId: 'item',
                    line: i
                });
                itemIds.add(itemId);
            }

            //查询转移类型 add by yuming hu
            const transferType = newRecord.getValue({
                fieldId: 'custbody_wip_transfer_type'
            });

            //库位 add by yuming hu
            const covbin = newRecord.getValue({
                fieldId: 'custbody_osp_vendor_bin'
            });

            //查询所有物料的批次信息
            const fromLocation = newRecord.getValue({
                fieldId: 'location'
            });
            const lotNumInfo = getLotNumInfo([...itemIds], [fromLocation]);
            log.debug('lotNumInfo', Object.fromEntries(lotNumInfo));

            //设置批次信息
            for (let i = 0; i < lineCount; i++) {
                const itemId = +fulfillRec.getSublistValue({
                    sublistId: itemSublist,
                    fieldId: 'item',
                    line: i
                });
                const itemText = fulfillRec.getSublistText({
                    sublistId: itemSublist,
                    fieldId: 'item',
                    line: i
                });
                const curLineRemainQty = fulfillRec.getSublistValue({
                    sublistId: itemSublist,
                    fieldId: 'quantityremaining',
                    line: i
                });
                //勾选物料
                fulfillRec.setSublistValue({
                    sublistId: itemSublist,
                    fieldId: 'itemreceive',
                    line: i,
                    value: true
                });
                //设置发货数量
                fulfillRec.setSublistValue({
                    sublistId: itemSublist,
                    fieldId: 'quantity',
                    line: i,
                    value: curLineRemainQty
                });

                //获取库存详细信息
                const curInventDetail = fulfillRec.getSublistSubrecord({
                    sublistId: itemSublist,
                    fieldId: 'inventorydetail',
                    line: i
                });
                if (curInventDetail) {
                    const invtDtLineCount = curInventDetail.getLineCount({
                        sublistId: invtDtSublist
                    });
                    //如果用户填写了库存详细信息，则跳过
                    if (!invtDtLineCount) {
                        let curLotData = lotNumInfo.get(itemId);
                        if (!curLotData || !curLotData.length) {
                            throw new Error(`物料：${itemText} 的库存可用数量为0`);
                        }

                        const invtDtReqQty = curInventDetail.getValue({
                            fieldId: 'quantity'
                        });
                        let remainQty = invtDtReqQty;
                        let lotNumIndex = 0;
                        do {
                            const curNumInfo = curLotData[lotNumIndex];
                            if (!curNumInfo) {
                                break;
                            }

                            //求数量
                            const minQty = Math.min(curNumInfo.quantityavailable, remainQty);

                            //设置批次号
                            curInventDetail.setSublistText({
                                sublistId: invtDtSublist,
                                fieldId: 'issueinventorynumber',
                                line: lotNumIndex,
                                text: curNumInfo.inventorynumber
                            });
                            //设置数量
                            curInventDetail.setSublistValue({
                                sublistId: invtDtSublist,
                                fieldId: 'quantity',
                                line: lotNumIndex,
                                value: minQty
                            });
                            //设置库位
                            if (transferType == '6') {
                                curInventDetail.setSublistValue({
                                    sublistId: invtDtSublist,
                                    fieldId: 'binnumber',
                                    line: lotNumIndex,
                                    value: covbin
                                });
                            }

                            //扣减
                            remainQty = commonLib.accSub(remainQty, minQty);
                            lotNumIndex++;
                        } while (remainQty > 0);

                        //验证库存下详细信息总数量是否和行上数量一至
                        let setTotalQty = 0;
                        for (let j = 0; j < lotNumIndex; j++) {
                            const curQty = curInventDetail.getSublistValue({
                                sublistId: invtDtSublist,
                                fieldId: 'quantity',
                                line: j
                            });
                            setTotalQty = commonLib.accAdd(setTotalQty, curQty);
                        }
                        if (setTotalQty !== invtDtReqQty) {
                            throw new Error(`物料：${itemText} 的库存详细信息不足，当前总库存：${setTotalQty}`);
                        }
                    }
                }
            }

            //保存发货单
            const fulfillId = fulfillRec.save({
                ignoreMandatoryFields: true
            });
            log.debug('fulfillId', fulfillId);

            result.status = 'success';
            result.detail = fulfillId;
        } catch (ex) {
            log.error({
                title: `自动给转移单发货失败，转移单ID: ${transferId}`,
                details: ex
            });
            result.status = 'fail';
            result.detail = ex.message;
        }

        return result;
    }

    //自动收货
    function autoReceive({
        newRecord: {
            id: transferId
        }
    }) {
        const itemSublist = 'item';
        let status = null;
        let detail = null;

        try {
            const receiveRec = recordMod.transform({
                fromType: recordMod.Type.TRANSFER_ORDER,
                fromId: transferId,
                toType: recordMod.Type.ITEM_RECEIPT
            });
            const lineCount = receiveRec.getLineCount({
                sublistId: itemSublist
            });
            for (let i = 0; i < lineCount; i++) {
                receiveRec.setSublistValue({
                    sublistId: itemSublist,
                    fieldId: 'itemreceive',
                    line: i,
                    value: true
                });
            }

            const receiptId = receiveRec.save({
                ignoreMandatoryFields: true
            });
            log.debug('receiptId', receiptId);

            status = 'success';
            detail = receiptId;
        } catch (ex) {
            log.error({
                title: `自动给转移单收货失败，转移单ID: ${transferId}`,
                details: ex
            });
            status = 'fail';
            detail = ex.message;
        }

        return {
            status,
            detail
        }
    }

    //更新回写工单的发料信息
    function updateWoLines({
        newRecord,
        newRecord: {
            id: transferId
        }
    }) {
        const woFieldId = 'custbody_wip_work_order_id';
        const invtWoLineKeyField = 'custcol_po_replenish_source';
        const transQtyFieldId = 'quantity';
        const cwnkQtyFieldId = 'custcol_wip_need_kitting'; //需发料套数
        const cwakQtyFieldId = 'custcol_wip_already_kitting'; //已发料套数
        const itemSublist = 'item';
        const faliaoType = '1';
        const weiwaiFaliaoType = '5';
        const transferTypeUpdateFieldMap = new Map([
            [faliaoType, 'custcol_quantity_issued'],
            ['2', 'custcol_over_issue_quantity'],
            ['3', 'custcol_wip_returned_quantity'],
            [weiwaiFaliaoType, 'custcol_quantity_issued'],//委外发料
            ['6', 'custcol_wip_returned_quantity'],//委外退料
        ]);
        const updateTimesFields = [
            'custcol_wip_first_store_issue',
            'custcol_wip_second_store_issue',
            'custcol_wip_third_store_issue',
            'custcol_wip_fourth_store_issue',
            'custcol_wip_fifith_store_issue'
        ];
        const woId = newRecord.getValue({
            fieldId: woFieldId
        });
        let status = null;
        let detail = null;

        try {
            const transferType = newRecord.getValue({
                fieldId: 'custbody_wip_transfer_type'
            });
            const addQtyField = transferTypeUpdateFieldMap.get(transferType);
            // if (!addQtyField) {
            //     throw new Error('不支持的转移类型');
            // }

            const woRec = recordMod.load({
                type: 'workorder',
                id: woId
            });
            const inventLineCount = newRecord.getLineCount({
                sublistId: itemSublist
            });
            const woLineCount = woRec.getLineCount({
                sublistId: itemSublist
            });

            //回写
            let isWoNeedToUpdate = false;
            for (let i = 0; i < inventLineCount; i++) {
                const itemIdOnIt = newRecord.getSublistValue({
                    sublistId: itemSublist,
                    fieldId: 'item',
                    line: i
                });
                const woLineKeyOnIt = newRecord.getSublistValue({
                    sublistId: itemSublist,
                    fieldId: invtWoLineKeyField,
                    line: i
                });
                const transferQty = newRecord.getSublistValue({
                    sublistId: itemSublist,
                    fieldId: transQtyFieldId,
                    line: i
                });
                const cwnkQty = newRecord.getSublistValue({
                    sublistId: itemSublist,
                    fieldId: cwnkQtyFieldId,
                    line: i
                }) || 0;
                for (let j = 0; j < woLineCount; j++) {
                    const woItemId = woRec.getSublistValue({
                        sublistId: itemSublist,
                        fieldId: 'item',
                        line: j
                    });
                    const woLineKey = woRec.getSublistValue({
                        sublistId: itemSublist,
                        fieldId: 'line',
                        line: j
                    });

                    //根据不同的转移类型，累计不同字段的值
                    if (woItemId == itemIdOnIt && woLineKey == woLineKeyOnIt) {
                        if (addQtyField) {
                            //设置总数量
                            const oldQty = woRec.getSublistValue({
                                sublistId: itemSublist,
                                fieldId: addQtyField,
                                line: j
                            }) || 0;
                            woRec.setSublistValue({
                                sublistId: itemSublist,
                                fieldId: addQtyField,
                                line: j,
                                value: (oldQty + transferQty).toFixed(5)
                            });
                        }

                        //add by yuming hu-7.29由Charles Zhang 修改
                        const cwakOldQty = woRec.getSublistValue({
                            sublistId: itemSublist,
                            fieldId: cwakQtyFieldId,
                            line: j
                        }) || 0;
                        //add by yuming hu-7.29由Charles Zhang 修改
                        woRec.setSublistValue({
                            sublistId: itemSublist,
                            fieldId: cwakQtyFieldId,
                            line: j,
                            value: cwakOldQty + cwnkQty
                        });

                        //检测是第几次回写-只有发料的时候才记录
                        if (transferType == faliaoType || transferType == weiwaiFaliaoType) {
                            const timeField = updateTimesFields.find((fieldId, index, list) => {
                                const curQty = woRec.getSublistValue({
                                    sublistId: itemSublist,
                                    fieldId: fieldId,
                                    line: j
                                });
                                return !util.isNumber(curQty) || index === list.length - 1;
                            });
                            const timeFieldQty = woRec.getSublistValue({
                                sublistId: itemSublist,
                                fieldId: timeField,
                                line: j
                            }) || 0;
                            let newTimeQty = +(timeFieldQty + transferQty).toFixed(5);
                            woRec.setSublistValue({
                                sublistId: itemSublist,
                                fieldId: timeField,
                                line: j,
                                value: newTimeQty
                            });
                        }

                        //标记为可更新
                        isWoNeedToUpdate = true;
                        break;
                    }
                }
            }

            if (isWoNeedToUpdate) {
                woRec.save({
                    ignoreMandatoryFields: true
                });
            }

            status = 'success';
            detail = woId;
        } catch (ex) {
            log.error({
                title: `将库存转移订单的转移数量回写到工单错误，转移单ID：${transferId}, 工单ID：${woId}`,
                details: ex
            });
            status = 'fail';
            detail = ex.message;
        }

        return {
            status,
            detail
        }
    }

    function checkHasUpWo({
        newRecord
    }) {
        const ciwoFieldId = 'custbody_if_up_wo';
        const cwttFieldId = 'custbody_wip_transfer_type';
        const ciwoValue = newRecord.getValue({
            fieldId: ciwoFieldId
        });
        const cwttValue = newRecord.getValue({
            fieldId: cwttFieldId
        });

        if (cwttValue == '4') {
            return ciwoValue ? true : false;
        }

        return true;
    }

    function autoFulReceiveFlow(context) {
        const {
            newRecord: {
                id: transferId
            }
        } = context;
        const successMark = 'success';
        const failMark = 'fail';
        let newStatus = null;
        let status = successMark;
        let msg = '您已成功转移工单物料';

        //发货
        const fulfillResult = autoFulfill(context);
        const isHasUpWo = checkHasUpWo(context);
        if (fulfillResult.status === successMark && isHasUpWo) {
            newStatus = '2'; //已发货未收货
            //收货
            const receiveResult = autoReceive(context);
            if (receiveResult.status === successMark) {
                newStatus = '3'; //已发货已收货
                //回写工单信息
                const updateWoResult = updateWoLines(context);
                if (updateWoResult.status !== successMark) {
                    status = failMark;
                    msg = `发货收货均成功，但是更新工单信息失败，请您稍后手动更新工单信息。失败提示：${updateWoResult.detail}`;
                }
            } else {
                status = failMark;
                msg = `发货成功，但是收货失败，请您稍后重新收货。失败提示：${receiveResult.detail}`;
            }
        } else {
            status = failMark;
            msg = `发货失败，请您稍后重新发货并收货。失败提示：${fulfillResult.detail}`;
        }

        //更新转移单状态
        if (newStatus) {
            updateTransOrderStatus({
                transferId,
                newStatus
            });
        }

        //设置缓存提醒
        const {
            id: userId
        } = runtimeMod.getCurrentUser();
        setTransOrderCache({
            orderId: transferId,
            userId,
            status,
            msg
        });
    }

    return {
        getWorkOrderInfo,
        getLotNumInfo,
        autoFulfill,
        autoReceive,
        updateWoLines,
        autoFulReceiveFlow,
        getTransOrderCache,
        clearTransOrderCache,
        getWoRemainTaoshu,
    }
});
/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@author Charles Zhang
 *@description PO主UE程序，其中包括应用采购价格
 */
define([
    'N/query',
    'N/runtime',
    '../../app/app_get_purchase_price',
    'N/record',
    'N/search',
    'N/format',
], function (
    query,
    runtime,
    appGetPurPrice,
    record,
    search,
    format
) {

    //util
    function getMapKey(itemId, lineId) {
        return itemId + '-' + lineId;
    }

    function parseDate(dateStr, returnStr) {
        var dateObj = format.parse({
            type: format.Type.DATE,
            value: dateStr
        });
        return returnStr ? format.format({
            type: format.Type.DATE,
            value: dateObj
        }) : dateObj;
    }

    function setPurchPrice(context) {
        var newRecord = context.newRecord,
            vendorId = newRecord.getValue({
                fieldId: 'entity'
            }),
            currencyId = newRecord.getValue({
                fieldId: 'currency'
            }),
            subsidiaryId = newRecord.getValue({
                fieldId: 'subsidiary'
            }),
            lineCount = newRecord.getLineCount({
                sublistId: 'item'
            }),
            itemInfo = {},
            curItemId,
            curItemQty,
            curItemTaxRate,
            curLineLowestPrice = 0,
            curLineIsLevel = false,
            curLineLatestPrice = 0,
            curLineLatestVendor = '',
            curLineLatestAppDate = '',
            rspMsg,
            priceInfo,
            i;

        try {
            for (i = 0; i < lineCount; i++) {
                curItemId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                curItemQty = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });
                curItemQty = +curItemQty;
                if (itemInfo.hasOwnProperty(curItemId)) {
                    itemInfo[curItemId] += curItemQty;
                } else {
                    itemInfo[curItemId] = curItemQty;
                }
            }

            //查询价格
            rspMsg = appGetPurPrice.getOutPurchPrice({
                itemInfo: itemInfo,
                currency: currencyId,
                vendor: vendorId,
                subsidiary: subsidiaryId,
                reqLatest: true,
            });

            // log.debug('rspMsg', rspMsg);

            if (rspMsg.status === 'success') {
                priceInfo = rspMsg.results;

                //设置价格
                for (i = 0; i < lineCount; i++) {
                    curItemId = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    curItemTaxRate = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxrate1',
                        line: i
                    });
                    curItemTaxRate = parseFloat(curItemTaxRate) || 0;
                    curItemTaxRate /= 100;

                    if (priceInfo[curItemId]) {
                        if (priceInfo[curItemId].lowest) { //最低价格
                            curLineLowestPrice = priceInfo[curItemId].lowest.purPrice;
                            curLineIsLevel = priceInfo[curItemId].lowest.isLevelPrice;
                        }

                        if (priceInfo[curItemId].latest) { //最新价格
                            curLineLatestPrice = priceInfo[curItemId].latest.purPrice;
                            curLineLatestVendor = priceInfo[curItemId].latest.vendorId;
                            curLineLatestAppDate = priceInfo[curItemId].latest.approveDate;
                        }
                    }

                    //设置价格和供应商以及审批日期
                    newRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: i,
                        value: curLineLowestPrice
                    });
                    newRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_po_tier_price',
                        line: i,
                        value: curLineIsLevel
                    });
                    newRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_updatest_price',
                        line: i,
                        value: curLineLatestPrice
                    });
                    newRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_updatest_vendor',
                        line: i,
                        value: curLineLatestVendor
                    });
                    //最新价格对应生效日期
                    if (curLineLatestAppDate) {
                        newRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_po_price_updatest_date',
                            line: i,
                            value: parseDate(curLineLatestAppDate)
                        });
                    }
                    //含税单价-单价*（1+税率）
                    newRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_po_tax_price',
                        line: i,
                        value: +((1 + curItemTaxRate) * curLineLowestPrice).toFixed(6)
                    });
                }
            }
        } catch (ex) {
            log.error({
                title: 'search purchase item price error',
                details: ex
            });
        }
    }

    function setInterPurchPrice(context) {

    }

    function updateLineUnits(context) {
        var newRecord = context.newRecord,
            // oldRecord = context.oldRecord,
            lineCount = newRecord.getLineCount({
                sublistId: 'item'
            }),
            itemQty,
            itemUnit,
            custUnit,
            custQty,
            convertRate,
            itemUnitName,
            custUnitName,
            // oldItemUnit,
            // oldCustUnit,
            unitMap = {},
            unitIds,
            queryObj,
            unitLineJoin,
            pagedData,
            i;

        for (i = 0; i < lineCount; i++) {
            itemUnit = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'units',
                line: i
            });
            custUnit = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_po_stock_unit',
                line: i
            });

            // if(oldRecord){
            //     oldItemUnit = oldRecord.getSublistValue({
            //         sublistId: 'item',
            //         fieldId: 'units',
            //         line: i
            //     });
            //     oldCustUnit = oldRecord.getSublistValue({
            //         sublistId: 'item',
            //         fieldId: 'custcol_po_stock_unit',
            //         line: i
            //     });
            //     if(oldItemUnit == itemUnit && oldCustUnit == custUnit){
            //         continue;
            //     }
            // }

            if (custUnit && itemUnit != custUnit) {
                unitMap[itemUnit] = '';
                unitMap[custUnit] = '';
            }
        }

        unitIds = Object.keys(unitMap);

        if (unitIds.length) {
            try {
                queryObj = query.create({
                    type: query.Type.UNITS_TYPE
                });
                unitLineJoin = queryObj.autoJoin({
                    fieldId: 'uom'
                });
                queryObj.condition = unitLineJoin.createCondition({
                    fieldId: 'internalid',
                    operator: query.Operator.ANY_OF,
                    values: unitIds
                });
                queryObj.columns = [
                    unitLineJoin.createColumn({
                        fieldId: 'internalid'
                    }),
                    unitLineJoin.createColumn({
                        fieldId: 'conversionrate'
                    }),
                    queryObj.createColumn({
                        fieldId: 'id'
                    })
                ];
                pagedData = queryObj.runPaged({
                    pageSize: 1000
                });
                pagedData.iterator().each(function (resultPage) {
                    var currentPage = resultPage.value;
                    currentPage.data.iterator().each(function (result) {
                        var resultObj = result.value.asMap(),
                            unitId = resultObj.internalid;

                        unitMap[unitId] = {
                            convertRate: resultObj.conversionrate,
                            unitType: resultObj.id
                        };
                        return true;
                    });
                    return true;
                });

                // log.error('unitMap', unitMap);

                for (i = 0; i < lineCount; i++) {
                    itemUnit = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'units',
                        line: i
                    });
                    itemQty = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    });
                    custUnit = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_po_stock_unit',
                        line: i
                    });

                    if (custUnit) {
                        if (itemUnit === custUnit) {
                            convertRate = 1;
                        } else {
                            if (unitMap[itemUnit].unitType === unitMap[custUnit].unitType) {
                                convertRate = unitMap[custUnit].convertRate / unitMap[itemUnit].convertRate;
                            } else {
                                convertRate = 0;
                                itemUnitName = newRecord.getSublistText({
                                    sublistId: 'item',
                                    fieldId: 'units',
                                    line: i
                                });
                                custUnitName = newRecord.getSublistText({
                                    sublistId: 'item',
                                    fieldId: 'custcol_po_stock_unit',
                                    line: i
                                });
                                log.error({
                                    title: 'order id:' + newRecord.id,
                                    details: '物料单位"' + itemUnitName + '"和库存单位"' + custUnitName + '"不属于同一个单位类型，不能转换'
                                });
                            }
                        }

                        custQty = Math.round(convertRate * itemQty * 1000) / 1000;

                        //设置库存转换率
                        newRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_po_conversion_rate',
                            line: i,
                            value: convertRate !== 0 ? unitMap[custUnit].convertRate : ''
                        });
                        //设置库存单位数量
                        newRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_po_stock_quantity',
                            line: i,
                            value: convertRate !== 0 ? custQty : ''
                        });
                    }
                }
            } catch (ex) {
                log.error({
                    title: 'search item unit error',
                    details: ex
                });
            }
        }
    }

    function copyLinkedOrders(context) {
        try {
            var newRecord = context.newRecord,
                parameters = context.request.parameters,
                copyId = parameters.id,
                memdoc = parameters.memdoc,
                copiedPoRec,
                lineCount,
                curLinkOrder,
                i;

            if (copyId && memdoc == '0') {
                copiedPoRec = record.load({
                    type: newRecord.type,
                    id: copyId
                });
                lineCount = copiedPoRec.getLineCount({
                    sublistId: 'item'
                });
                for (i = 0; i < lineCount; i++) {
                    curLinkOrder = copiedPoRec.getSublistText({
                        sublistId: 'item',
                        fieldId: 'linkedorder',
                        line: i
                    });
                    if (curLinkOrder) {
                        // log.error('curLinkOrder', curLinkOrder);
                        newRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_po_line_link_order',
                            line: i,
                            value: curLinkOrder.join(',')
                        });
                    }
                }
            }
        } catch (ex) {
            log.error({
                title: 'copy linked order error',
                details: ex
            });
        }
    }

    function setReturnedQty(context) {
        var newRecord = context.newRecord,
            lineCount = newRecord.getLineCount({
                sublistId: 'item'
            }),
            itemId,
            lineId,
            returnAvailQty = {},
            curReturnQty,
            filters,
            columns,
            i;

        try {
            filters = [
                ['mainline', 'is', 'F'],
                'AND',
                ['taxline', 'is', 'F'],
                'AND',
                ['internalid', 'is', newRecord.id],
                'AND',
                ['applyingtransaction.recordtype', 'is', 'vendorreturnauthorization'],
            ];
            columns = [{
                    name: 'item',
                    summary: search.Summary.GROUP
                },
                {
                    name: 'line',
                    summary: search.Summary.GROUP
                },
                {
                    name: 'formulanumeric',
                    formula: "ABS({applyingtransaction.quantityuom})",
                    summary: search.Summary.SUM
                }
            ];
            //查询
            search.create({
                type: newRecord.type,
                filters: filters,
                columns: columns
            }).run().each(function (result) {
                var resultColumns = result.columns,
                    itemId = result.getValue(resultColumns[0]) + '',
                    lineId = result.getValue(resultColumns[1]) + '',
                    returnedQty = +result.getValue(resultColumns[2]) || 0;

                returnAvailQty[getMapKey(itemId, lineId)] = {
                    returnedQty: returnedQty
                }
                return true;
            });

            // log.error('returnAvailQty', returnAvailQty);

            //设置已退货数量
            for (i = 0; i < lineCount; i++) {
                itemId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                lineId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'line',
                    line: i
                });
                curReturnQty = returnAvailQty[getMapKey(itemId, lineId)];
                curReturnQty = curReturnQty ? curReturnQty.returnedQty : 0;
                newRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_returned_quantity',
                    line: i,
                    value: curReturnQty
                });
            }
        } catch (ex) {
            log.error({
                title: '查询已退货数量错误',
                details: ex
            });
        }
    }

    function updateRelationInterPurchQty(context) {
        var newRecord = context.newRecord,
            oldRecord = context.oldRecord,
            poid = newRecord.id,
            gItemSublistId = 'item',
            gSlLineFieldId = 'line',
            outerCounter = 0,
            innerCounter = 0,
            purchaseLine = {},
            lyddhValue, //来源订单号
            lyddhhValue, //来源订单行号
            lyxsddhValue, //来源销售订单号
            lyxsddhhValue, //来源销售订单行号
            slSourceSoIdFieldId = 'custcol_external', //来源订单号
            slSourceLineFieldId = 'custcol_sales_bank', //来源订单行号
            soNumberFieldId = 'custcol_source_sales_order_number',
            soLineFieldId = 'custcol_source_sales_order_line_numbe',
            soRec,
            lineValue,
            newLineCount,
            oldLineCount,
            newQty,
            oldQty,
            dffQty,
            sonum,
            soline,
            line,
            newItemList = [],
            oldItemList = [],
            dffList = [],
            dffObj = {},
            newItemObj = {},
            oldItemObj = {},
            soMap = {},
            outUpdateCount = 0,
            soRec;

        try {

            log.debug('newRecord', newRecord);
            log.debug('oldRecord', oldRecord);

            if (!oldRecord) {
                return false;
            }

            newLineCount = newRecord.getLineCount({
                sublistId: gItemSublistId
            });

            oldLineCount = oldRecord.getLineCount({
                sublistId: gItemSublistId
            });

            log.debug('newLineCount', newLineCount);
            log.debug('oldLineCount', oldLineCount);

            for (var i = 0; i < newLineCount; i++) {
                newQty = newRecord.getSublistValue({
                    sublistId: gItemSublistId,
                    fieldId: 'quantity',
                    line: i
                });

                sonum = newRecord.getSublistValue({
                    sublistId: gItemSublistId,
                    fieldId: soNumberFieldId,
                    line: i
                });

                soline = newRecord.getSublistValue({
                    sublistId: gItemSublistId,
                    fieldId: soLineFieldId,
                    line: i
                });

                line = newRecord.getSublistValue({
                    sublistId: gItemSublistId,
                    fieldId: gSlLineFieldId,
                    line: i
                });

                newItemObj = {
                    line: line,
                    sonum: sonum,
                    soline: soline,
                    newqty: newQty
                };

                newItemList.push(newItemObj);
            }

            log.debug('newItemList', newItemList);

            for (var i = 0; i < oldLineCount; i++) {
                oldQty = oldRecord.getSublistValue({
                    sublistId: gItemSublistId,
                    fieldId: 'quantity',
                    line: i
                });

                line = oldRecord.getSublistValue({
                    sublistId: gItemSublistId,
                    fieldId: gSlLineFieldId,
                    line: i
                });

                oldItemObj = {
                    line: line,
                    oldqty: oldQty
                };

                oldItemList.push(oldItemObj);
            }

            log.debug('oldItemList', oldItemList);

            //3.查询差异并有来源销售订单号和行号
            for (var i = 0; i < newItemList.length; i++) {
                for (var j = 0; j < oldItemList.length; j++) {

                    if (newItemList[i].line == oldItemList[j].line) {
                        log.debug('newItemList[i].newqty', newItemList[i].newqty);
                        log.debug('oldItemList[j].oldQty', oldItemList[j].oldqty);
                        dffQty = Number(newItemList[i].newqty) - Number(oldItemList[j].oldqty);

                        log.debug('dffQty', dffQty);
                        //if (dffQty && newItemList[i].sonum && newItemList[i].soline) {
                        if (dffQty) {

                            dffObj = {
                                sonum: sonum,
                                soline: soline,
                                dffqty: dffQty
                            };

                            dffList.push(dffObj);
                        }
                    }
                }
            }

            log.debug('dffList', dffList);

            // if (dffList.length) {
            //     return false;
            // }

            //4.转换为map
            for (var i = 0; i < dffList.length; i++) {

                sonum = dffList[i].sonum;
                soline = dffList[i].soline;
                dffqty = dffList[i].dffqty;

                if (sonum) {
                    if (!soMap[sonum]) {
                        soMap[sonum] = {
                            sonum: sonum,
                            item: []
                        };

                        var itemObj = {
                            soline: soline,
                            dffqty: dffqty
                        }

                        soMap[sonum].item.push(itemObj);
                    } else {
                        var itemObj = {
                            soline: soline,
                            dffqty: dffqty
                        }

                        soMap[sonum].push(itemObj);
                    }
                }
            }

            log.debug('soMap', soMap);

            //更新处理
            Object.keys(soMap).forEach(function (result, index) {
                log.debug('result', result);

                var soRec = record.load({
                    type: 'estimate',
                    id: result, //3347内部，3352外部
                });

                var soMapList = soMap[result].item;

                log.debug('soMapList', soMapList);

                var soLineCount = soRec.getLineCount({
                    sublistId: 'item'
                });

                for (var i = 0; i < soLineCount; i++) {

                    var soitemLine = soRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'line',
                        line: i
                    });

                    log.debug('soitemLine', soitemLine);

                    var qpdQty = soRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_quantity_pushed_down', //已下推数量
                        line: i
                    });

                    var npdQty = soRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_quantity_not_pushed_down', //未下推数量
                        line: i
                    });

                    for (var j = 0; j < soMapList.length; j++) {
                        var sourceSoLine = soMapList[j].soline;
                        var dffqty = soMapList[j].dffqty;

                        log.debug('sourceSoLine', sourceSoLine);

                        if (soitemLine == sourceSoLine) {
                            var newQpdQty = Number(qpdQty) + Number(dffqty);
                            var newNpdQty = Number(npdQty) - Number(dffqty);

                            soRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_quantity_pushed_down',
                                line: i,
                                value: newQpdQty
                            });

                            log.debug('newQpdQty', newQpdQty);
                            log.debug('newNpdQty', newNpdQty);

                            soRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_quantity_not_pushed_down',
                                line: i,
                                value: newNpdQty
                            });
                        }
                    }
                }

                var recId = soRec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                log.debug('recId', recId);

                outUpdateCount++;

                return true;
            });

            log.debug('outUpdateCount', outUpdateCount);

            if (outUpdateCount) {
                return true;
            }

            //内部交易更新
            var soFilters = [
                ["mainline", "is", "F"],
                "AND",
                ["taxline", "is", "F"],
                "AND",
                ["type", "anyof", "Estimate"],
                "AND",
                ["custcol_external", "anyof", poid]
            ];

            var soColumns = [{
                name: 'internalid',
                summary: "GROUP"
            }];

            var soSearchCriteria = {
                type: 'estimate',
                filters: soFilters,
                columns: soColumns
            };

            var inSoId;

            search.create(soSearchCriteria).run().each(function (result, i) {


                inSoId = result.getValue({
                    name: soColumns[0]
                });

                return true;
            });

            log.debug('inSoId', inSoId);

            if (inSoId) {
                var soRec = record.load({
                    type: 'estimate',
                    id: inSoId, //3347内部，3352外部
                });

                var soLineCount = soRec.getLineCount({
                    sublistId: 'item'
                });

                for (var i = 0; i < soLineCount; i++) {

                    var poLine = soRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_sales_bank',
                        line: i
                    });

                    for (var j = 0; j < newItemList.length; j++) {
                        var sourcepoLine = newItemList[j].line;

                        if (poLine == sourcepoLine) {

                            soRec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i,
                                value: newItemList[j].newqty
                            });
                        }
                    }
                }

                soRec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                return true;
            }

            return false;
        } catch (e) {
            log.debug('dddd', 11111);
            log.debug('e', e.message);
            return true;
        }
    }

    //entry points
    function beforeLoad(context) {
        if (context.type === context.UserEventType.COPY) {
            copyLinkedOrders(context);
        } else if (context.type === context.UserEventType.EDIT) {
            setReturnedQty(context);
        } else if (context.type === context.UserEventType.VIEW) {
            setReturnedQty(context);
        }
    }

    function beforeSubmit(context) {
        if (context.type === context.UserEventType.CREATE) {
            if (runtime.executionContext !== runtime.ContextType.USER_INTERFACE) {
                var newRecord = context.newRecord,
                    isInterCompOrder = newRecord.getValue({
                        fieldId: 'custbody_whether_ntercompany_transact'
                    });

                if (isInterCompOrder === true) { //公司间交易
                    log.debug('test', 1);
                    setInterPurchPrice(context);
                } else { //普通交易
                    setPurchPrice(context);
                }
            }

            //更新单位
            updateLineUnits(context);
            //add by yuming hu 2020.01.06
            updatePoBuyer(context);
        } else if (context.type === context.UserEventType.EDIT) {
            //更新单位
            updateLineUnits(context);
            updateRelationInterPurchQty(context);
        }
    }

    /**
     * @author yuming Hu
     * @description 更新专营采购员字段，数据为货品上的代理商
     * @date 2020.01.06
     */
    function updatePoBuyer(context) {

        var newRecord = context.newRecord,
            lineCount = newRecord.getLineCount({
                sublistId: 'item'
            }),
            itemId,
            columns = [{
                name: 'custitem_item_agent' //固定提前期
            }],
            filters,
            sublistSearchCriteria,
            searchObj,
            resultObj = {},
            resultList = [];

        if (lineCount) {
            itemId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: 0
            });

            if (itemId) {

                filters = [
                    ["internalid", "anyof"].concat(itemId)
                    //["internalid", "anyof", "49737"]
                ];

                sublistSearchCriteria = {
                    type: 'item',
                    filters: filters,
                    columns: columns
                };

                try {
                    searchObj = search.create(sublistSearchCriteria);

                    searchObj.run().each(function (result, i) {
                        for (var j = 0; j < columns.length; j++) {
                            resultObj[columns[j].name] = result.getValue({
                                name: columns[j]
                            });
                        };

                        resultList.push(resultObj);

                        return true;
                    });

                    resultList[0].custitem_item_agent && newRecord.setValue({
                        fieldId: 'employee',
                        value: resultList[0].custitem_item_agent,
                        ignoreFieldChange: true
                    });

                } catch (ex) {
                    log.error({
                        title: 'search item unit error',
                        details: ex
                    });
                }
            }
        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    }
});
/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 *@author Charles Zhang
 *@description 用于生成真正的Vendor Bill和Bill Credit
 */
define([
    'N/record',
    'N/search',
    'N/runtime'
], function (
    record,
    search,
    runtime
) {

    var confirmedStauts = '2';//已确认

    function getMapKey(items, separator) {
        return items.join(separator || '#');
    }

    function updateStatement(stateMap, billId) {
        var stateRecType = 'customrecord_reconciliation',
            sublistId = 'recmachcustrecord_check_parent',
            todayDate = new Date(),
            lineCount,
            stateRec;

        util.each(stateMap, function (childLines, parentId) {
            try {
                var childId;
                childLines = childLines.map(function (childId) {
                    return String(childId);
                });

                //加载
                stateRec = record.load({
                    type: stateRecType,
                    id: parentId
                });
                lineCount = stateRec.getLineCount({
                    sublistId: sublistId
                });
                for (var i = 0; i < lineCount; i++) {
                    childId = stateRec.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'id',
                        line: i
                    });
                    childId = String(childId);
                    if (childLines.indexOf(childId) !== -1) {
                        //状态
                        stateRec.setSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord_bill_status',
                            line: i,
                            value: confirmedStauts
                        });
                        //单据号
                        stateRec.setSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord_bill_or_credit',
                            line: i,
                            value: billId
                        });
                        //发票日期
                        stateRec.setSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custrecord_bill_date',
                            line: i,
                            value: todayDate
                        });
                    }
                }

                stateRec.save({
                    ignoreMandatoryFields: true
                });
            } catch (ex) {
                log.error({
                    title: '回写账单/贷项通知单到对账单错误',
                    details: {
                        parentId: parentId,
                        childLines: childLines,
                        billId: billId
                    }
                });
            }
        });
    }

    function getAllSearchResults(options) {
        var allResults = [], searchObj = options;
    
        if(typeof options != "object") {
            searchObj = search.load({ id: options });
        } else if(options.type) {
            searchObj = search.create(options);
        }
        var resultPagedData = searchObj.runPaged({
            pageSize: 1000
        });
        resultPagedData.pageRanges.forEach(function (pageRange) {
            var currentPageData = resultPagedData.fetch({
                index: pageRange.index
            }).data;
            allResults = allResults.concat(currentPageData);
        });
    
        return allResults;
    }

    //entry points
    function getInputData(context) {
        var currentScript = runtime.getCurrentScript(),
            parameters = currentScript.getParameter({
                name: 'custscript_vbbc_arg_structure'
            }),
            inputData = JSON.parse(parameters),
            searchId = 'customsearch_avail_confirm_statement_v2',
            searchObj = search.load({
                id: searchId
            }),
            basicFilters = searchObj.filterExpression,
            searchType = searchObj.searchType,
            billTypeList = [
                '入库单',
                'Item Receipt'
            ],
            billCreditTypeList = [
                '出库单',
                'Item Fulfillment'
            ],
            outputData = [],
            itemIds = [];

        //搜索勾选数据对应的对账单明细
        inputData.forEach(function (lineInfo) {
            var applyDateTime = lineInfo['custpage_paged_formulatext_0'],
                orderType = lineInfo['custpage_paged_custrecord_type_voucher'],
                vendorId = lineInfo['custpage_paged_custrecord_check_parent_custrecord_vendor_name'],
                orderCurrency = lineInfo['custpage_paged_custrecord_trasations_currency'],
                subsidiaryId = lineInfo['custpage_paged_custrecord_state_subsidiary'],
                exchangeRate = lineInfo['custpage_paged_add_exchange_rate'],
                custSearchObj,
                filters,
                columns,
                resultPagedData,
                resultMap = {},
                groupKey = '',
                itemAllSchResults,
                itemAssetMap = {},
                assetAccounts = {};

            filters = basicFilters.concat([
                'AND',
                ["formulatext:TO_CHAR({custrecord_application_date},'YYYY-MM-DD hh24:mi:ss')", 'is', applyDateTime],
                'AND',
                ['custrecord_type_voucher', 'is', orderType],
                'AND',
                ['custrecord_check_parent.custrecord_vendor_name', 'is', vendorId],
                'AND',
                ['custrecord_trasations_currency', 'is', orderCurrency],
                'AND',
                ['custrecord_state_subsidiary', 'is', subsidiaryId]
            ]);
            columns = [
                'custrecord_receipt_nub',
                'custrecord_name_item',
                'custrecord_check_rate',
                'custrecord_check_amount',//对账数量
                'custrecord_check_grossamount',
                'custrecord_tax_code',
                'custrecord_id_line',
                'custrecord_check_parent',
                'custrecord_real_bill_number'//实际发票号
            ];

            // log.debug('filters', filters);

            custSearchObj = search.create({
                type: searchType,
                filters: filters,
                columns: columns
            });
            resultPagedData = custSearchObj.runPaged({
                pageSize: 1000
            });
            resultPagedData.pageRanges.forEach(function (pageRange) {
                var currentPageData = resultPagedData.fetch({
                    index: pageRange.index
                });
                currentPageData.data.forEach(function (result) {
                    var stateId = result.id,
                        orderId = result.getValue({
                            name: 'custrecord_receipt_nub'
                        }),
                        itemId = result.getValue({
                            name: 'custrecord_name_item'
                        }),
                        itemRate = result.getValue({
                            name: 'custrecord_check_rate'
                        }),
                        itemQty = result.getValue({
                            name: 'custrecord_check_amount'
                        }),
                        itemAmt = result.getValue({
                            name: 'custrecord_check_grossamount'
                        }),
                        itemTax = result.getValue({
                            name: 'custrecord_tax_code'
                        }),
                        lineId = result.getValue({
                            name: 'custrecord_id_line'
                        }),
                        realBillNum = result.getValue({
                            name: 'custrecord_real_bill_number'
                        }),
                        stateParentId = result.getValue({
                            name: 'custrecord_check_parent'
                        });

                    itemRate = +itemRate;
                    itemQty = Math.abs(+itemQty);
                    itemAmt = Math.abs(+itemAmt);

                    if (!resultMap[orderId]) {
                        resultMap[orderId] = [];
                    }

                    resultMap[orderId].push({
                        itemId: itemId,
                        itemRate: itemRate,
                        itemQty: itemQty,
                        itemAmt: itemAmt,
                        itemTax: itemTax,
                        lineId: lineId,
                        stateId: stateId,
                        parentId: stateParentId,
                        realBillNum: realBillNum
                    });

                    itemIds.push(itemId);
                });
            });

            if (billTypeList.indexOf(orderType) > -1) {//搜索入库单对账信息
                groupKey = getMapKey([applyDateTime, orderType, vendorId, orderCurrency, subsidiaryId]);
                //装配件搜索
                itemAllSchResults = getAllSearchResults({
                    type: "item",
                    columns: ["assetaccount"],//财务资料的资产账户
                    filters: [ "internalid", "anyof", itemIds ]
                });
                itemIds = [];
                for(var i = 0; i < itemAllSchResults.length; i++) {
                    itemIds.push(itemAllSchResults[i].getValue(itemAllSchResults[i].columns[0]));
                    itemAssetMap[itemIds[itemIds.length - 1]] = itemAllSchResults[i].id;
                }
                //科目搜索
                itemAllSchResults = getAllSearchResults({
                    type: "account",
                    columns: ["custrecord_n112_cseg_cn_cfi"],//中国现金流
                    filters: [ "internalid", "anyof", itemIds ]
                });
                for(var i = 0; i < itemAllSchResults.length; i++) {
                    assetAccounts[itemAssetMap[itemAllSchResults[i].id]] = itemAllSchResults[i].getValue(itemAllSchResults[i].columns[0]);
                }
                //写入输出列表
                util.each(resultMap, function (itemLines, orderId) {
                    for(var i = 0; i < itemLines.length; i++) {
                        itemLines[i]["assetAccount"] = assetAccounts[itemLines[i].itemId] || "";
                    }
                    outputData.push({
                        type: 'itemreceipt',
                        id: orderId,
                        groupKey: groupKey,
                        lines: itemLines,
                        exRate: exchangeRate,
                        vendorId: vendorId,
                        currencyId: orderCurrency,
                        subsidiaryId: subsidiaryId
                    });
                });
            } else if (billCreditTypeList.indexOf(orderType) > -1) {//搜索出库单对账信息
                //写入输出列表
                util.each(resultMap, function (itemLines, orderId) {
                    outputData.push({
                        type: 'itemfulfillment',
                        id: orderId,
                        lines: itemLines,
                        exRate: exchangeRate
                    });
                });
            } else {
                throw new Error('无效的类型：' + orderType);
            }
        });

        // log.debug('outputData.length', outputData.length);
        // log.debug('outputData', outputData);

        return outputData;
    }

    function map(context) {
        var lineData = JSON.parse(context.value),
            recType = lineData['type'],
            recId = lineData['id'],
            itemLines = lineData['lines'],
            itemLinesLength = itemLines.length,
            hasToUpdate = false,
            curRealNum = null,
            realNumColId = 'custcol_real_invoice_number',
            orderRec,
            lineCount,
            itemId,
            invtDetailRec,
            invtdLineCount,
            lineId,
            currentLine,
            curInvDtLine,
            createdFrom,
            i,
            j,
            k,
            invtDetailSublistFields = [
                'binnumber',
                'expirationdate',
                'inventorystatus',
                'receiptinventorynumber',
                'quantity',
                'tobinnumber',
                'toinventorystatus'
            ];

        //加载每个出入库单，并获取采购单/退货授权的信息
        orderRec = record.load({
            type: recType,
            id: recId
        });
        createdFrom = orderRec.getValue({
            fieldId: 'createdfrom'
        });
        lineCount = orderRec.getLineCount({
            sublistId: 'item'
        });

        //获取Orderdoc, orderline以及库存详细信息
        for (i = 0; i < lineCount; i++) {
            itemId = orderRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });
            lineId = orderRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'line',
                line: i
            });

            for (j = 0; j < itemLinesLength; j++) {
                currentLine = itemLines[j];
                if (String(currentLine.itemId) === String(itemId) && String(currentLine.lineId) === String(lineId)) {
                    currentLine.orderDoc = orderRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'orderdoc',
                        line: i
                    });
                    currentLine.orderLine = orderRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'orderline',
                        line: i
                    });
                    currentLine.location = orderRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        line: i
                    });
                    invtDetailRec = orderRec.getSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'inventorydetail',
                        line: i
                    });
                    if (invtDetailRec) {
                        invtdLineCount = invtDetailRec.getLineCount({
                            sublistId: 'inventoryassignment'
                        });
                        if (invtdLineCount) {
                            currentLine.inventoryDetail = [];
                            for (k = 0; k < invtdLineCount; k++) {
                                curInvDtLine = {};
                                //抓取库存详细信息值
                                invtDetailSublistFields.forEach(function (invtColId) {
                                    var invtColValue = invtDetailRec.getSublistValue({
                                        sublistId: 'inventoryassignment',
                                        fieldId: invtColId,
                                        line: k
                                    });

                                    if (util.isDate(invtColValue)) {
                                        invtColValue = invtDetailRec.getSublistText({
                                            sublistId: 'inventoryassignment',
                                            fieldId: invtColId,
                                            line: k
                                        });
                                    }

                                    if (invtColValue !== null && invtColValue !== '' && invtColValue !== undefined) {
                                        curInvDtLine[invtColId] = invtColValue;
                                    }
                                });

                                currentLine.inventoryDetail.push(curInvDtLine);
                            }
                        }
                    }

                    //将实际发票号写入出入库单的行上
                    curRealNum = orderRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: realNumColId,
                        line: i
                    });
                    if (!curRealNum) {
                        orderRec.setSublistValue({
                            sublistId: 'item',
                            fieldId: realNumColId,
                            line: i,
                            value: currentLine.realBillNum
                        });
                        hasToUpdate = true;
                    }

                    break;
                }
            }
        }

        if (hasToUpdate) {
            //改写出入库单的申请状态
            orderRec.setValue({
                fieldId: 'custbody_kaipiao_apply',
                value: confirmedStauts
            });

            //保存
            orderRec.save({
                ignoreMandatoryFields: true
            });
        }

        log.debug('lineData in Map', lineData);

        //输出
        if (recType === 'itemreceipt') {
            context.write({
                key: lineData.groupKey,
                value: lineData
            });
        } else if (recType === 'itemfulfillment') {
            lineData['createdFrom'] = createdFrom;
            context.write({
                key: recId,
                value: lineData
            });
        }
    }

    function reduce(context) {
        var reduceLines = context.values,
            linesData = reduceLines.map(function (line) {
                return JSON.parse(line);
            }),
            currentType = linesData[0].type,
            vcStateLines = linesData[0].lines,
            subsidiaryId = linesData[0].subsidiaryId,
            vendorId = linesData[0].vendorId,
            currencyId = linesData[0].currencyId,
            createdFrom = linesData[0].createdFrom,
            fulfillId = linesData[0].id,
            vcStateLineCount = vcStateLines.length,
            realNumFieldId = 'custbody_psap_vendorbill_invoicenumber_5',
            realNumber = '',
            stateUpdateMap = {},
            curStateId,
            curParentId,
            billRec,
            billLineIndex = 0,
            vcRec,
            vcLineCount,
            itemId,
            orderLine,
            curStateLine,
            exchangeRate = linesData[0].exRate,
            billId,
            vcId,
            i,
            j;

        log.debug('Key in Reduce: ' + context.key, linesData);

        //是否带含税总额

        //创建账单或者贷项通知单
        if (currentType === 'itemreceipt') {//创建合并的账单************************************
            billRec = record.create({
                type: record.Type.VENDOR_BILL,
            });

            //设置供应商
            billRec.setValue({
                fieldId: 'entity',
                value: vendorId
            });

            //设置子公司
            billRec.setValue({
                fieldId: 'subsidiary',
                value: subsidiaryId
            });

            //设置币种
            billRec.setValue({
                fieldId: 'currency',
                value: currencyId
            });

            //设置汇率
            billRec.setValue({
                fieldId: 'exchangerate',
                value: exchangeRate
            });

            //添加行信息
            linesData.forEach(function (lineData) {//每个单
                lineData.lines.forEach(function (line) {//每个单的每行
                    //设置物料
                    billRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: billLineIndex,
                        value: line.itemId
                    });
                    //设置关联的PO信息
                    billRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'orderdoc',
                        line: billLineIndex,
                        value: line.orderDoc
                    });
                    billRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'orderline',
                        line: billLineIndex,
                        value: line.orderLine
                    });
                    //单价
                    billRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: billLineIndex,
                        value: line.itemRate
                    });
                    //数量
                    billRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: billLineIndex,
                        value: line.itemQty
                    });
                    //金额
                    billRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: billLineIndex,
                        value: line.itemAmt
                    });
                    //税码
                    billRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxcode',
                        line: billLineIndex,
                        value: line.itemTax
                    });
                    //仓库
                    billRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        line: billLineIndex,
                        value: line.location
                    });
                    //中国现金流
                    billRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_cseg_cn_cfi',
                        line: billLineIndex,
                        value: line.assetAccount
                    });
                    //库存详细信息
                    var invtDetailRec = billRec.getSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'inventorydetail',
                        line: billLineIndex
                    });
                    if (invtDetailRec && line.inventoryDetail) {
                        var invtDetailLineCount = invtDetailRec.getLineCount({
                            sublistId: 'inventoryassignment'
                        });
                        //设置库存行信息
                        if (!invtDetailLineCount) {
                            line.inventoryDetail.forEach(function (invDtLine, invtLineIndex) {
                                util.each(invDtLine, function (fieldValue, fieldId) {
                                    if (fieldId == 'expirationdate') {
                                        invtDetailRec.setSublistText({
                                            sublistId: 'inventoryassignment',
                                            fieldId: fieldId,
                                            text: fieldValue,
                                            line: invtLineIndex
                                        });
                                    } else {
                                        invtDetailRec.setSublistValue({
                                            sublistId: 'inventoryassignment',
                                            fieldId: fieldId,
                                            value: fieldValue,
                                            line: invtLineIndex
                                        });
                                    }
                                });
                            });
                        }
                    }

                    //递增行号
                    billLineIndex++;

                    //收集实际发票号
                    if (!realNumber) {
                        realNumber = line.realBillNum;
                    }

                    //收集账单信息，用于回写实际的发票号码
                    curStateId = line.stateId;
                    curParentId = line.parentId;
                    if(!stateUpdateMap[curParentId]){
                        stateUpdateMap[curParentId] = [];
                    }
                    stateUpdateMap[curParentId].push(curStateId);
                });
            });

            //设置实际发票号
            billRec.setValue({
                fieldId: realNumFieldId,
                value: realNumber
            });

            billId = billRec.save({
                ignoreMandatoryFields: true
            });

            //更新对账单行信息
            updateStatement(stateUpdateMap, billId);

            context.write({
                key: context.key,
                value: billId
            });
        } else if (currentType === 'itemfulfillment') {//创建贷项通知单************************************
            //创建记录
            vcRec = record.transform({
                fromType: record.Type.VENDOR_RETURN_AUTHORIZATION,
                fromId: createdFrom,
                toType: record.Type.VENDOR_CREDIT,
                isDynamic: true,
            });

            //设置汇率
            vcRec.setValue({
                fieldId: 'exchangerate',
                value: exchangeRate
            });

            //设置行信息
            vcLineCount = vcRec.getLineCount({
                sublistId: 'item'
            });
            for (i = 0; i < vcLineCount; i++) {
                itemId = vcRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                orderLine = vcRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'orderline',
                    line: i
                });

                for (j = 0; j < vcStateLineCount; j++) {
                    curStateLine = vcStateLines[j];
                    if (String(curStateLine.itemId) === String(itemId) && String(curStateLine.orderLine) === String(orderLine)) {
                        vcRec.selectLine({
                            sublistId: 'item',
                            line: i
                        });
                        vcRec.setCurrentSublistValue({//单价
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: curStateLine.itemRate
                        });
                        vcRec.setCurrentSublistValue({//数量
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: curStateLine.itemQty
                        });
                        vcRec.setCurrentSublistValue({//金额
                            sublistId: 'item',
                            fieldId: 'amount',
                            value: curStateLine.itemAmt
                        });
                        vcRec.setCurrentSublistValue({//税码
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            value: curStateLine.itemTax
                        });
                        vcRec.setCurrentSublistValue({//仓库
                            sublistId: 'item',
                            fieldId: 'location',
                            value: curStateLine.location
                        });

                        //库存详细信息
                        if (curStateLine.inventoryDetail) {
                            var defaultInvtDetail = null;
                            var defaultInvtLineCount = 0;
                            defaultInvtDetail = vcRec.getCurrentSublistSubrecord({
                                sublistId: 'item',
                                fieldId: 'inventorydetail'
                            });
                            if (defaultInvtDetail) {
                                defaultInvtLineCount = defaultInvtDetail.getLineCount({
                                    sublistId: 'inventoryassignment'
                                });
                                // log.debug('defaultInvtLineCount', defaultInvtLineCount);
                                if (!defaultInvtLineCount) {
                                    curStateLine.inventoryDetail.forEach(function (invDtLine) {
                                        defaultInvtDetail.seletNewLine({
                                            sublistId: 'inventoryassignment'
                                        });
                                        util.each(invDtLine, function (fieldValue, fieldId) {
                                            if (fieldId === 'expirationdate') {//日期特殊处理
                                                defaultInvtDetail.setCurrentSublistText({
                                                    sublistId: 'inventoryassignment',
                                                    fieldId: fieldId,
                                                    text: fieldValue
                                                });
                                            } else {
                                                defaultInvtDetail.setCurrentSublistValue({
                                                    sublistId: 'inventoryassignment',
                                                    fieldId: fieldId,
                                                    value: fieldValue
                                                });
                                            }
                                        });
                                        defaultInvtDetail.commitLine({
                                            sublistId: 'inventoryassignment'
                                        });
                                    });
                                }
                            }
                        }

                        vcRec.commitLine({
                            sublistId: 'item'
                        });

                        //收集实际发票号
                        if (!realNumber) {
                            realNumber = curStateLine.realBillNum;
                        }

                        //收集账单信息，用于回写实际的发票号码
                        curStateId = curStateLine.stateId;
                        curParentId = curStateLine.parentId;
                        if (!stateUpdateMap[curParentId]) {
                            stateUpdateMap[curParentId] = [];
                        }
                        stateUpdateMap[curParentId].push(curStateId);

                        break;
                    }
                }

                //如果没有找到对行的对账单行则删除该行
                if (j === vcStateLineCount) {
                    vcRec.removeLine({
                        sublistId: 'item',
                        line: i
                    });
                    i--;
                }
            }

            //设置实际发票号
            vcRec.setValue({
                fieldId: realNumFieldId,
                value: realNumber
            });

            //保存
            vcId = vcRec.save({
                ignoreMandatoryFields: true
            });

            //更新对账单行信息
            updateStatement(stateUpdateMap, vcId);

            context.write({
                key: fulfillId,
                value: vcId
            });
        }
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
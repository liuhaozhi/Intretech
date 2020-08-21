/**
 *@NApiVersion 2.0
 *@author Charles Zhang
 *@description 查询采购价格
 */
define([
    'N/format',
    '../dao/dao_search_common'
], function (
    format,
    searchCommon
) {

    function sortLatest(a, b) {
        var leftDate, rightDate;

        if (a.approveDate) {
            leftDate = format.parse({
                type: format.Type.DATETIME,
                value: a.approveDate,
                timezone: format.Timezone.ASIA_HONG_KONG
            });
        } else {
            leftDate = new Date(0);
        }

        if (b.approveDate) {
            rightDate = format.parse({
                type: format.Type.DATETIME,
                value: b.approveDate,
                timezone: format.Timezone.ASIA_HONG_KONG
            });
        } else {
            rightDate = new Date(0);
        }
        
        // var leftDate = format.parse({
        //     type: format.Type.DATETIME,
        //     value: a.approveDate,
        //     timezone: format.Timezone.ASIA_HONG_KONG
        // });
        // var rightDate = format.parse({
        //     type: format.Type.DATETIME,
        //     value: b.approveDate,
        //     timezone: format.Timezone.ASIA_HONG_KONG
        // });

        return rightDate.getTime() - leftDate.getTime();
    }

    function getFilterValue(targetLine, reserveKeys) {
        var result = {};
        if (targetLine) {
            reserveKeys = reserveKeys || ['purPrice', 'taxCode', 'vendorId', 'currencyId', 'isLevelPrice', 'pricelistId'];
            reserveKeys.reduce(function (total, current) {
                total[current] = targetLine[current];
                return total;
            }, result);

            return result;
        } else {
            return null;
        }
    }

    function getOutPurchPrice(options) {
        var itemInfo = options.itemInfo,
            reqCurrency = options.currency,
            reqVendor = options.vendor,
            reqSubsidiary = options.subsidiary,
            reqLatest = options.reqLatest,
            reqCurrencyStr = String(reqCurrency),
            reqVendorStr = String(reqVendor),
            priceInfo = {},
            responseObj = {},
            filters = null,
            columns = null,
            rspMsg = null,
            searchResults,
            priceDetailRecType = 'customrecord_price_apply_main_form';

        try {
            //过滤器
            filters = [
                {
                    name: 'custrecord_item_in_list',
                    operator: 'anyof',
                    values: Object.keys(itemInfo)
                },
                {
                    name: 'isinactive',
                    operator: 'is',
                    values: 'F'
                },
                {
                    name: 'isinactive',
                    join: 'custrecord_po_price_list',
                    operator: 'is',
                    values: 'F'
                },
                {
                    name: 'custrecord_field_status',
                    join: 'custrecord_po_price_list',
                    operator: 'anyof',
                    values: ['1']//['2']
                },
                {
                    name: 'custrecord_field_start_date',
                    join: 'custrecord_po_price_list',
                    operator: 'onorbefore',
                    values: 'today'
                },
                {
                    name: 'custrecord_field_stop_date',
                    join: 'custrecord_po_price_list',
                    operator: 'onorafter',
                    values: 'today'
                }
            ];

            if (reqSubsidiary) {//2020-4-10修改，增加子公司过滤维度
                filters.push(
                    {
                        name: 'custrecord_company_name_1',
                        operator: 'anyof',
                        values: [reqSubsidiary]
                    }
                );
            }

            //结果列
            columns = [
                {
                    name: 'custrecord_item_in_list'//货品
                },
                {
                    name: 'custrecord_vql_field_entity'//供应商
                },
                {
                    name: 'custrecord_field_currencies',//货币
                    join: 'custrecord_po_price_list'
                },
                {
                    name: 'custrecord_field_tax_rate',//税码
                    join: 'custrecord_po_price_list'
                },
                {
                    name: 'custrecord_field_start1',//开始数量
                    join: 'custrecord_po_price_list'
                },
                {
                    name: 'custrecord_field_stop',//结束数量
                    join: 'custrecord_po_price_list'
                },
                {
                    name: 'custrecord_unit_price_vat',//该阶梯采购价
                    join: 'custrecord_po_price_list'
                },
                {
                    name: 'custrecord_approval_date_time',//审核日期
                    join: 'custrecord_po_price_list'
                },
                {
                    name: 'custrecord_tiering_price',//是否阶梯价
                    join: 'custrecord_po_price_list'
                }
            ];

            //查询
            searchResults = searchCommon.getAllSearchResults({
                searchDefine: {
                    type: priceDetailRecType,
                    filters: filters,
                    columns: columns
                }
            });
            searchResults.forEach(function (result) {
                var rangeId = result.id,
                    itemId = result.getValue({
                        name: 'custrecord_item_in_list'
                    }),
                    vendorId = result.getValue({
                        name: 'custrecord_vql_field_entity'
                    }),
                    currencyId = result.getValue({
                        name: 'custrecord_field_currencies',
                        join: 'custrecord_po_price_list'
                    }),
                    taxCode = result.getValue({
                        name: 'custrecord_field_tax_rate',
                        join: 'custrecord_po_price_list'
                    }),
                    startQty = result.getValue({
                        name: 'custrecord_field_start1',
                        join: 'custrecord_po_price_list'
                    }) || 0,
                    endQty = result.getValue({
                        name: 'custrecord_field_stop',
                        join: 'custrecord_po_price_list'
                    }) || 999999999999,
                    purPrice = result.getValue({
                        name: 'custrecord_unit_price_vat',
                        join: 'custrecord_po_price_list'
                    }),
                    approveDate = result.getValue({
                        name: 'custrecord_approval_date_time',
                        join: 'custrecord_po_price_list'
                    }),
                    isLevelPrice = result.getValue({
                        name: 'custrecord_tiering_price',
                        join: 'custrecord_po_price_list'
                    });

                startQty = Number(startQty);
                endQty = Number(endQty);
                purPrice = Number(purPrice);
                vendorId = String(vendorId);
                currencyId = String(currencyId);

                if (!priceInfo[itemId]) {
                    priceInfo[itemId] = {};
                }
                if (!priceInfo[itemId][vendorId]) {
                    priceInfo[itemId][vendorId] = {};
                }
                if (!priceInfo[itemId][vendorId][currencyId]) {
                    priceInfo[itemId][vendorId][currencyId] = [];
                }

                priceInfo[itemId][vendorId][currencyId].push({
                    startQty: startQty,
                    endQty: endQty,
                    purPrice: purPrice,
                    taxCode: taxCode,
                    approveDate: approveDate,
                    vendorId: vendorId,
                    currencyId: currencyId,
                    isLevelPrice: isLevelPrice,
                    vendorName: result.getText({
                        name: 'custrecord_vql_field_entity'
                    }),
                    currencyName: result.getText({
                        name: 'custrecord_field_currencies',
                        join: 'custrecord_po_price_list'
                    }),
                    pricelistId: rangeId
                });
            });

            // log.debug('priceInfo', priceInfo);
            //检测下一阶梯 
            var nextPrice = new Array()
            //检测下一阶梯 
            //带出币种、最低价格以及对应的供应商
            util.each(priceInfo, function (priceDetail, itemId) {
                var itemReqQty = +itemInfo[itemId],
                    allPriceEntries = [],
                    filteredEntries,
                    lowestPriceEntries = [],
                    lowestPrice;

                //首先归纳同一个供应商，同个货币之下的区间最低价格
                util.each(priceDetail, function (currencyPrice, vendorId) {
                    util.each(currencyPrice, function (priceList, currencyId) {
                        var currentLine,
                            targetPrice = null,
                            leftGap = null,
                            rightGap = null;

                        priceList.sort(function (a, b) {
                            return a.startQty - b.startQty;
                        });

                        for (var i = 0, len = priceList.length - 1; i <= len; i++) {
                            currentLine = priceList[i];
                            if (itemReqQty < currentLine.startQty) {
                                if (i === 0) {
                                    targetPrice = currentLine;
                                } else {
                                    rightGap = {
                                        gap: currentLine.startQty - itemReqQty,
                                        line: currentLine
                                    };
                                }
                                break;
                            } else if (itemReqQty <= currentLine.endQty) {
                                targetPrice = currentLine;

                                //检测下一阶梯 
                                if(i < len && +itemReqQty > currentLine.endQty * 0.9){
                                    var next = priceList[i + 1]
                                    next.difference = +next.startQty - +itemReqQty
                                    nextPrice.push(next)
                                }    
                                //检测下一阶梯                
                                break;
                            } else {
                                if (i === len) {
                                    targetPrice = currentLine;
                                    break;
                                } else {
                                    leftGap = {
                                        gap: itemReqQty - currentLine.endQty,
                                        line: currentLine
                                    };
                                }
                            }
                        }

                        //如果没有找到目标价格,取最近的区间价格
                        if (targetPrice === null) {
                            if (leftGap.gap < rightGap.gap) {
                                targetPrice = leftGap.line;
                            } else if (leftGap.gap > rightGap.gap) {
                                targetPrice = rightGap.line;
                            } else {
                                if (leftGap.line.purPrice < rightGap.line.purPrice) {
                                    targetPrice = leftGap.line;
                                } else {
                                    targetPrice = rightGap.line;
                                }
                            }
                        }

                        allPriceEntries.push(targetPrice);
                    });
                });

                //初始化
                responseObj[itemId] = {};

                //如果要查询最新价格，主要用于PO行上,要同一个货币比较
                if (reqLatest) {
                    //2020-4-10日修改，增加子公司过滤而导致货币过滤逻辑修改
                    if (reqCurrency) {
                        filteredEntries = allPriceEntries.filter(function (entry) {
                            return entry.currencyId === reqCurrencyStr;
                        });

                        //检测下一阶梯 
                        nextPrice = nextPrice.filter(function (entry) {
                            return entry.currencyId === reqCurrencyStr;
                        })
                        //检测下一阶梯 
                    } else {
                        filteredEntries = allPriceEntries.concat();
                    }

                   //检测下一阶梯 
                    if (nextPrice.length) {
                        nextPrice.sort(sortLatest);
                        responseObj[itemId].nextPrice = getFilterValue(
                            nextPrice[0]
                            ,['purPrice', 'taxCode', 'vendorId', 'currencyId', 'isLevelPrice', 'approveDate', 'pricelistId', 'difference']
                        );
                    } else {
                        responseObj[itemId].nextPrice = null;
                    }
                    //检测下一阶梯 

                    if (filteredEntries.length) {
                        filteredEntries.sort(sortLatest);
                        responseObj[itemId].latest = getFilterValue(
                            filteredEntries[0]
                            ,['purPrice', 'taxCode', 'vendorId', 'currencyId', 'isLevelPrice', 'approveDate', 'pricelistId']
                        );
                    } else {
                        responseObj[itemId].latest = null;
                    }
                }

                //过滤相应的条件
                if (!reqCurrency && !reqVendor) {//不带供应商和货币
                    filteredEntries = allPriceEntries.concat();
                } else if (!reqVendor) {//只带货币
                    filteredEntries = allPriceEntries.filter(function (entry) {
                        return entry.currencyId === reqCurrencyStr;
                    });
                } else if (!reqCurrency) {//只带供应商
                    filteredEntries = allPriceEntries.filter(function (entry) {
                        return entry.vendorId === reqVendorStr;
                    });
                } else {//同时带供应商和货币
                    filteredEntries = allPriceEntries.filter(function (entry) {
                        return entry.currencyId === reqCurrencyStr && entry.vendorId === reqVendorStr;
                    });
                }

                if (filteredEntries.length) {
                    //按价格顺序
                    filteredEntries.sort(function (a, b) {
                        return a.purPrice - b.purPrice;
                    });
                    lowestPrice = filteredEntries[0].purPrice;
                    lowestPriceEntries = filteredEntries.filter(function (entry) {
                        return entry.purPrice === lowestPrice;
                    });
                    if (lowestPriceEntries.length > 1) {
                        //最低价格按审批时间倒叙
                        lowestPriceEntries.sort(sortLatest);
                    }

                    //写入最低价格
                    responseObj[itemId].lowest = getFilterValue(
                        lowestPriceEntries[0]
                        // ,['purPrice', 'taxCode', 'vendorName', 'currencyName']
                    );
                } else {
                    //写入最低价格
                    responseObj[itemId].lowest = null;
                }

                return true;
            });

            rspMsg = {
                status: 'success',
                results: responseObj
            };
        } catch (ex) {
            rspMsg = {
                status: 'fail',
                message: ex.message
            };
            log.error({
                title: 'get items purchase price error',
                details: {
                    input: options,
                    error: ex
                }
            });
        }

        return rspMsg;
    }

    function getInPurchPrice(options) {
        return {};
    }

    return {
        getOutPurchPrice: getOutPurchPrice,
        getInPurchPrice: getInPurchPrice
    }
});
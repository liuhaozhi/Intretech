/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 *@author yuming Hu
 *@description 更新货品上的默认供应商及采购申请上价格供应商的处理程序
 */
define([
    'N/search',
    'N/record',
    'N/runtime'
], function (
    search,
    record,
    runtime) {

    var gVendorFieldId = 'custrecord_field_vendor', //供应商编码
        gItemFieldId = 'custrecord_field_item', //物料编码
        gCurrencyFieldId = 'custrecord_field_currencies', //币种
        gPriceFieldId = 'custrecord_unit_price_vat', //阶梯采购价
        gCompanyFieldId = 'custrecord_company_name_1', //所属子公司
        gCompanyJoinId = 'custrecord_po_price_list',
        gPriceApproveValue = 1/* 2 */;

    function getInputData() {
        var currentScript = runtime.getCurrentScript(),
            params = currentScript.getParameter({
                name: 'custscript_item'
            });

        //采购价格明细查询
        var columns = [{
                    name: gVendorFieldId
                },
                {
                    name: gItemFieldId
                },
                {
                    name: gCurrencyFieldId
                },
                {
                    name: gPriceFieldId
                },
                {
                    name: gCompanyFieldId,
                    join: gCompanyJoinId
                }
            ],
            filters = [
                ["custrecord_field_item", "anyof", params],
                "AND",
                ["custrecord_field_status", "anyof", gPriceApproveValue],
                "AND",
                ["isinactive", "is", "F"],
                "AND",
                ["custrecord_field_start_date", "onorbefore", "today"],
                "AND",
                ["custrecord_field_stop_date", "onorafter", "today"],
                "AND",
                ["custrecord_po_price_list.custrecord_company_name_1", "noneof", "@NONE@"]
            ],
            sublistSearchCriteria = {
                type: 'customrecord_price_apply',
                filters: filters,
                columns: columns
            },

            searchObj = search.create(sublistSearchCriteria),
            rObj = {},
            fMapName, //第一轮转换key
            sMapName,
            fMap = {}, //第一轮转换过度对象
            sMap = {},
            fMapList = [],
            sMapList = [];

        searchObj.run().each(function (result) {
            var innerObj = {};

            for (key in columns) {
                innerObj[columns[key].name] = result.getValue({
                    name: columns[key]
                });
            };

            //子公司+币种为对象的key
            fMapName = innerObj[gCompanyFieldId].toString() + innerObj[gCurrencyFieldId].toString();

            //如果不存在，则赋值，如果存在，则比较更新为最低价格及最低价格对应的供应商
            if (!fMap[fMapName]) {
                fMap[fMapName] = innerObj;
            } else {
                if (Number(fMap[fMapName][gPriceFieldId]) > Number(innerObj[gPriceFieldId])) {
                    fMap[fMapName][gPriceFieldId] = innerObj[gPriceFieldId];
                    fMap[fMapName][gVendorFieldId] = innerObj[gVendorFieldId];
                }
            }

            return true;
        });

        //转换为数组
        Object.keys(fMap).forEach(function (result) {
            fMapList.push(fMap[result]);
            return true;
        })

        for (var i = 0; i < fMapList.length; i++) {
            sMapName = fMapList[i][gCompanyFieldId].toString() + fMapList[i][gVendorFieldId].toString();

            if (!sMap[sMapName]) {
                sMap[sMapName] = {
                    details: []
                }

                sMap[sMapName][gCompanyFieldId] = fMapList[i][gCompanyFieldId];
                sMap[sMapName][gVendorFieldId] = fMapList[i][gVendorFieldId];

                sMap[sMapName]['details'].push({
                    'custrecord_field_currencies': fMapList[i][gCurrencyFieldId],
                    'custrecord_unit_price_vat': fMapList[i][gPriceFieldId]
                });
            } else {
                sMap[sMapName]['details'].push({
                    'custrecord_field_currencies': fMapList[i][gCurrencyFieldId],
                    'custrecord_unit_price_vat': fMapList[i][gPriceFieldId]
                });
            }
        }

        //转换为数组
        Object.keys(sMap).forEach(function (result) {

            sMapList.push(sMap[result]);
            return true;
        })

        rObj[params] = sMapList;

        return rObj;

    }

    function map(context) {
        var itemRecordTypeId = 'lotnumberedassemblyitem', //需要更改：lotnumberedinventoryitem
            itemRecord,
            vendorLists = JSON.parse(context.value),
            itemvendorSublistId = 'itemvendor',
            vendorFieldId = 'vendor',
            subsidiaryFieldId = 'subsidiary',
            itemvendorpriceFieldId = 'itemvendorprice',
            preferredvendorFieldId = 'preferredvendor',
            itemvendorpricelinesSublistId = 'itemvendorpricelines',
            numLines,
            columns = [{
                name: 'internalid',
                summary: "GROUP"
            }],
            filters = [
                ["type", "anyof", "PurchReq"],
                "AND",
                ["status", "anyof", "PurchReq:B", "PurchReq:A"],
                "AND",
                ["mainline", "is", "F"],
                "AND",
                ["taxline", "is", "F"],
                "AND",
                ["cogs", "is", "F"],
                "AND",
                ["shipping", "is", "F"],
                "AND",
                ["item", "anyof", context.key]
            ],
            sublistSearchCriteria = {
                type: 'purchaserequisition',
                filters: filters,
                columns: columns
            },

            searchObj = search.create(sublistSearchCriteria),
            writeObj = {};

        writeObj[context.key] = vendorLists;

        log.debug('writeObj', writeObj);

        try {
            itemRecord = record.load({
                type: itemRecordTypeId, //lotnumberedassemblyitem,lotnumberedinventoryitem
                id: context.key,
                isDynamic: false
            });

            numLines = itemRecord.getLineCount({
                sublistId: itemvendorSublistId
            });

            //删除vendor行
            for (var i = numLines - 1; i >= 0; i--) {
                itemRecord.removeLine({
                    sublistId: itemvendorSublistId,
                    line: i,
                    ignoreRecalc: true
                });
            }

            itemRecord.save();

            itemRecord = record.load({
                type: itemRecordTypeId, //lotnumberedassemblyitem,lotnumberedinventoryitem
                id: context.key,
                isDynamic: false
            });

            for (var i = 0; i < vendorLists.length; i++) {
                itemRecord.insertLine({
                    sublistId: itemvendorSublistId,
                    line: i
                });

                itemRecord.setSublistValue({
                    sublistId: itemvendorSublistId,
                    fieldId: vendorFieldId,
                    line: i,
                    value: vendorLists[i][gVendorFieldId]
                });

                itemRecord.setSublistValue({
                    sublistId: itemvendorSublistId,
                    fieldId: subsidiaryFieldId,
                    line: i,
                    value: vendorLists[i][gCompanyFieldId]
                });

                itemRecord.setSublistValue({
                    sublistId: itemvendorSublistId,
                    fieldId: preferredvendorFieldId,
                    line: i,
                    value: true
                });

                var sublistLocRecord = itemRecord.getSublistSubrecord({
                    sublistId: itemvendorSublistId,
                    fieldId: itemvendorpriceFieldId,
                    line: i
                });

                var _details = vendorLists[i].details;

                for (var j = 0; j < _details.length; j++) {
                    sublistLocRecord.insertLine({
                        sublistId: itemvendorpricelinesSublistId,
                        line: j
                    });

                    sublistLocRecord.setSublistValue({
                        sublistId: itemvendorpricelinesSublistId,
                        fieldId: 'vendorcurrency',
                        line: j,
                        value: _details[j][gCurrencyFieldId]
                        //ignoreFieldChange: true
                    });

                    sublistLocRecord.setSublistValue({
                        sublistId: itemvendorpricelinesSublistId,
                        fieldId: 'vendorprice',
                        line: j,
                        value: _details[j][gPriceFieldId]
                        //ignoreFieldChange: true
                    });
                }
            }

            var recId = itemRecord.save();
            log.debug('recId', recId);

            //查询采购申请
            if (recId) {
                searchObj.run().each(function (result) {
                    log.debug('result', result);

                    context.write({
                        key: result.getValue({
                            name: columns[0]
                        }),
                        value: writeObj
                    });

                    return true;
                })
            }

        } catch (ex) {
            log.error({
                title: '创建采购申请',
                details: ex
            });
        }
    }

    function reduce(context) {
        log.debug('reduce context', context);
        var prRecId = context.key,
            prRecordTypeId = 'purchaserequisition',
            currencyFieldId = 'currency',
            currencyValue,
            subsidiaryFieldId = 'subsidiary',
            subsidiaryValue,
            prRecord,
            priceLists = context.values,
            priceObj = JSON.parse(priceLists[0]),
            lineCount,
            prItemSublistId = 'item',
            prPovendorFieldId = 'povendor',
            changeItemValue = Object.keys(priceObj)[0],
            ChangeVenderValues = priceObj[changeItemValue],
            vendorValue,
            priceValue;

        log.debug('priceObj', priceObj);
        log.debug('ChangeVenderValues', ChangeVenderValues);

        prRecord = record.load({
            type: prRecordTypeId,
            id: prRecId,
            isDynamic: false
        });

        //获取请购单上的币种和子公司
        currencyValue = prRecord.getValue({
            fieldId: currencyFieldId
        });

        subsidiaryValue = prRecord.getValue({
            fieldId: subsidiaryFieldId
        });

        log.debug('currencyValue', currencyValue);
        log.debug('subsidiaryValue', subsidiaryValue);

        //获取对应的供应商及价格
        for (var i = 0; i < ChangeVenderValues.length; i++) {
            var bflag = false;

            if (subsidiaryValue == ChangeVenderValues[i][gCompanyFieldId]) {
                var vendorDetails = ChangeVenderValues[i].details;
                var vendorValue = ChangeVenderValues[i][gVendorFieldId];

                for (var j = 0; j < vendorDetails.length; j++) {
                    if (currencyValue == vendorDetails[j][gCurrencyFieldId]) {
                        priceValue = vendorDetails[j][gPriceFieldId];
                        bflag = true;
                        break;
                    }
                }
            }

            if (bflag) {
                break;
            }
        }

        log.debug('vendorValue', vendorValue);
        log.debug('priceValue', priceValue);

        var lineCount = prRecord.getLineCount({
            sublistId: prItemSublistId
        });

        log.debug('lineCount', lineCount);

        for (var i = 0; i < lineCount; i++) {
            var itemValue = prRecord.getSublistValue({
                sublistId: prItemSublistId,
                fieldId: 'item',
                line: i
            });

            //如果货品匹配，则更新子列表
            if (itemValue == changeItemValue) {
                prRecord.setSublistValue({
                    sublistId: prItemSublistId,
                    fieldId: prPovendorFieldId,
                    line: i,
                    value: vendorValue
                    //ignoreFieldChange: true
                });
            }

            log.debug('itemValue', itemValue);
        }

        var recId = prRecord.save();
        log.debug('recId', recId);
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
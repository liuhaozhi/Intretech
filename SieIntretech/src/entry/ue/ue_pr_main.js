/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@author Charles Zhang
 *@description PR的主UE程序，其中包括应用采购价格-2020-4-21日修改，增加子公司过滤条件等
 */
define([
    'N/runtime',
    '../../app/app_get_purchase_price'
], function (
    runtime,
    appGetPurPrice
) {

    //util
    function setPurchPrice(context) {
        var newRecord = context.newRecord,
            currencyId = newRecord.getValue({
                fieldId: 'currency'
            }),
            subsidiaryId = newRecord.getValue({
                fieldId: 'subsidiary'
            }),
            lineCount = newRecord.getLineCount({
                sublistId: 'item'
            }),
            itemSearchMap = {},
            resultMap = {},
            curItemId,
            curItemQty,
            curVendorId,
            curLineLowestPrice = 0,
            curLineIsLevel = false,
            curLineLatestVendor = '',
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
                curVendorId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_pr_cheapest_vendor',
                    line: i
                }) || newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'povendor',
                    line: i
                }) || '';
                curItemQty = +curItemQty;

                if (!itemSearchMap[curVendorId]) {
                    itemSearchMap[curVendorId] = {};
                }

                if (itemSearchMap[curVendorId].hasOwnProperty(curItemId)) {
                    itemSearchMap[curVendorId][curItemId] += curItemQty;
                } else {
                    itemSearchMap[curVendorId][curItemId] = curItemQty;
                }
            }

            //循环查询价格
            util.each(itemSearchMap, function (itemInfo, vendorId) {
                var rspMsg = appGetPurPrice.getOutPurchPrice({
                    itemInfo: itemInfo,
                    currency: currencyId,
                    subsidiary: subsidiaryId,
                    vendor: vendorId,
                    reqLatest: true,
                });

                resultMap[vendorId] = rspMsg.status === 'success' ? rspMsg.results : {};
            });

            //设置价格
            for (i = 0; i < lineCount; i++) {
                curItemId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                curVendorId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_pr_cheapest_vendor',
                    line: i
                }) || newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'povendor',
                    line: i
                }) || '';

                priceInfo = resultMap[curVendorId];

                if (priceInfo[curItemId]) {
                    if (priceInfo[curItemId].lowest) {
                        curLineLowestPrice = priceInfo[curItemId].lowest.purPrice;
                        curLineIsLevel = priceInfo[curItemId].lowest.isLevelPrice;
                    }
                    if (priceInfo[curItemId].latest) {
                        curLineLatestVendor = priceInfo[curItemId].latest.vendorId;
                    }
                }

                //设置价格和供应商
                newRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'estimatedrate',
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
                    fieldId: 'custcol_updatest_vendor',
                    line: i,
                    value: curLineLatestVendor
                });
            }
        } catch (ex) {
            log.error({
                title: 'search requistion item price error',
                details: ex
            });
        }
    }

    //entry points
    function beforeSubmit(context) {
        if (context.type === context.UserEventType.CREATE) {
            if (runtime.executionContext !== runtime.ContextType.USER_INTERFACE) {
                setPurchPrice(context);
            }
        }
    }

    return {
        beforeSubmit: beforeSubmit,
    }
});
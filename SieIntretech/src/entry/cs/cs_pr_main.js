/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description pr的主要Client脚本
 */
define(['N/https', 'N/url', 'N/ui/dialog'], function (https, url, dialog) {

    var $,
        pageDoc;

    function getPriceSearchUrl() {
        var _self = getPriceSearchUrl;
        if (!_self.url) {
            _self.url = url.resolveScript({
                scriptId: 'customscript_rl_search_purchprice',
                deploymentId: 'customdeploy_rl_search_purchprice'
            });
        }

        return _self.url;
    }

    function refreshPrices(context) {
        'use strict';
        var newRecord = context.currentRecord,
            currencyId = newRecord.getValue({
                fieldId: 'currency'
            }),
            subsidiaryId = newRecord.getValue({
                fieldId: 'subsidiary'
            }),
            lineCount = newRecord.getLineCount({
                sublistId: 'item'
            }),
            curItemId,
            curItemQty,
            curVendorId,
            curItemRate,
            curItemIsLevel,
            curItemLatestVendor,
            itemSearchMap = {},
            resultMap = {},
            priceInfo,
            curLineLowestPrice = 0,
            curLineIsLevel = false,
            curLineLatestVendor = '',
            isErrorOccured = false,
            i;

        //标记已经刷新过价格
        if (!window.confirm('刷新价格将覆盖现有的所有价格，是否继续?')) {
            return false;
        }

        //标记为已刷新
        refreshPrices.isRreshed = true;

        //收集物料信息
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

        try {
            //循环查询价格
            util.each(itemSearchMap, function (itemInfo, vendorId) {
                var searchSummary = https.post({
                    url: getPriceSearchUrl(),
                    header: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        itemInfo: itemInfo,
                        currency: currencyId,
                        subsidiary: subsidiaryId,
                        vendor: vendorId,
                        reqLatest: true
                    }
                });

                resultMap[vendorId] = {};

                if (searchSummary.code == 200) {
                    var rspMsg = JSON.parse(searchSummary.body);
                    if (rspMsg.status === 'success') {
                        resultMap[vendorId] = rspMsg.results;
                    } else {
                        isErrorOccured = true;
                    }
                } else {
                    isErrorOccured = true;
                }
            });

            //设置价格
            for (i = 0; i < lineCount; i++) {
                curItemId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                curItemRate = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'estimatedrate',
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
                curItemIsLevel = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_po_tier_price',
                    line: i
                });
                curItemLatestVendor = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_updatest_vendor',
                    line: i
                });

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

                curItemRate = +curItemRate;
                curLineLowestPrice = +curLineLowestPrice;

                //设置价格和供应商
                if (curItemRate !== curLineLowestPrice || curItemIsLevel !== curLineIsLevel || curItemLatestVendor !== curLineLatestVendor) {
                    newRecord.selectLine({
                        sublistId: 'item',
                        line: i
                    });
                    newRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'estimatedrate',
                        value: curLineLowestPrice
                    });
                    newRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_po_tier_price',
                        value: curLineIsLevel
                    });
                    newRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_updatest_vendor',
                        value: curLineLatestVendor
                    });
                    newRecord.commitLine({
                        sublistId: 'item'
                    });
                }
            }

            if (isErrorOccured) {
                dialog.alert({
                    title: '错误',
                    message: '查询某些物料的最低价格失败，可能是由于网络连接未成功，请稍后再试'
                });
                return false;
            }
        } catch (ex) {
            dialog.alert({
                title: '错误',
                message: '查询采购价格失败，请稍后再试。失败提示：' + ex.message
            });
            return false;
        }
    }

    //entry points
    function pageInit(context) {
        var priceRefreshButton,
            priceRefreshCell;

        $ = jQuery;
        pageDoc = document;

        //插入按钮-系统标准按钮只能插入到顶部和底部
        priceRefreshButton = $('<input type="button" class="rndbuttoninpt bntBgT" value="刷新采购价格" id="customRefreshPrice" style="border: 1px solid gray;width: 120px;height: 27px;border-radius: 5px;font-weight: bold;font-size: 14px;background-color: rgb(242,242,242) !important;" />');
        priceRefreshCell = $('<td id="customRefreshCell" class="bntBgB" style="vertical-align: top;"></td>');
        priceRefreshButton.on('click', function (event) {
            refreshPrices(context);
        });
        priceRefreshCell.append(priceRefreshButton);
        $('#item_form > table tr.uir-listheader-button-row:first-child').append(priceRefreshCell);
    }

    function saveRecord(context) {
        if (!refreshPrices.isRreshed) {
            return window.confirm('您还未刷新过采购最低价格，是否确定提交？');
        }

        return true;
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
    }
});

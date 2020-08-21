/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author yuming Hu
 *@description  销售订单下推工单客户端脚本
 */
define([
    'N/currentRecord',
    'N/ui/dialog',
    'N/format'
], function (currentRecord,
    dialog,
    format) {
    var sublistId = 'custpage_sublist';
    var checkBoxId = 'custpage_checked';
    var pageSizeId = 'custpage_pagesize';
    var pageIdId = 'custpage_pageid';
    var cacheFieldId = 'custpage_pagecache';

    function getCache(key) {
        var _self = getCache;
        if (!_self.cache) {
            var pageRec = currentRecord.get();
            var pageCache = pageRec.getValue({
                fieldId: cacheFieldId
            });
            _self.cache = JSON.parse(pageCache);
        }

        return _self.cache[key];
    }

    function refreshPage(params) {
        var refreshURL = getCache('refreshURL');
        refreshURL = Object.keys(params).reduce(function (updatedURL, currentParam) {
            return updatedURL + '&' + currentParam + '=' + params[currentParam];
        }, refreshURL);

        setWindowChanged(window, false);
        //return true;
        window.location.assign(refreshURL);
    }

    function goToPage(pageId) {
        var refreshParams = getCache('refreshParams');
        refreshParams[pageIdId] = pageId;
        refreshPage(refreshParams);
        return (function () {}); //为了不让页面报错
    }

    function searchResults() {
        var searchFields = getCache('searchFields');

        var pageRec = currentRecord.get();

        var pageSize = pageRec.getValue({
            fieldId: pageSizeId
        });

        var urlParams = {};
        urlParams[pageSizeId] = pageSize;
        urlParams[pageIdId] = 1;

        if (pageSize > 1000 || pageSize < 0) {
            dialog.alert({
                title: '错误',
                message: '每页显示数量必须在1000条以内'
            });
            return false;
        }

        //搜索字段取值
        util.each(searchFields, function (fieldId) {
            var searchValue = pageRec.getValue({
                fieldId: fieldId
            });

            if (util.isDate(searchValue)) {
                searchValue = format.format({
                    value: searchValue,
                    type: format.Type.DATE
                });
            } else if (util.isArray(searchValue)) {
                searchValue = searchValue.join(',');
            } else if (util.isString(searchValue)) {
                searchValue = jQuery.trim(searchValue);
            }

            if (searchValue !== null && searchValue !== undefined && searchValue !== '') {
                urlParams[fieldId] = searchValue
            };
        });

        refreshPage(urlParams);
        return true;
    }

    function validateQuantity(context) {
        var pageRec = context.currentRecord,
            sublistId = 'custpage_sublist',
            lineCount,
            i,
            currentItemObj = {},
            currentItemList = [],
            outOfStockList = [],
            soQty,
            npQty,
            pdQty,
            deffQty;

        lineCount = pageRec.getLineCount({
            sublistId: sublistId
        });

        for (var i = 0; i < lineCount; i++) {
            currentItemObj = {
                custpage_quantity: '',
                custpage_number_pushed_down: 0,
                custpage_no_pushdown: ''
            };

            var isChecked = pageRec.getSublistValue({
                sublistId: sublistId,
                fieldId: checkBoxId,
                line: i
            });

            if (isChecked) {
                for (var key in currentItemObj) {
                    if (currentItemObj.hasOwnProperty(key)) {
                        currentItemObj[key] = pageRec.getSublistValue({
                            sublistId: sublistId,
                            fieldId: key,
                            line: i
                        });
                    }
                }
    
                currentItemList.push(currentItemObj);
            }
        }

        console.log(currentItemList);

        for (var i = 0; i < currentItemList.length; i++) {
            soQty = Number(currentItemList[i].custpage_quantity);
            npQty = Number(currentItemList[i].custpage_no_pushdown);
            pdQty = Number(currentItemList[i].custpage_number_pushed_down);

            deffQty = soQty - npQty - pdQty;

            if (deffQty < 0) {
                outOfStockList.push('第' + (i + 1) + '行可下推量不足');
            }
        }

        if (outOfStockList.length) {
            dialog.alert({
                title: '提示',
                message: '以下行可下推量不足，请修改后重试：<br />' + outOfStockList.join('<br />')
            });
            return false;
        }

        return true;
    }

    function saveRecord(context) {

        var suiteletPage = context.currentRecord;
        var lineCount = suiteletPage.getLineCount({
            sublistId: sublistId
        });
        var flag = false;

        for (var i = 0; i < lineCount; i++) {
            var isChecked = suiteletPage.getSublistValue({
                sublistId: sublistId,
                fieldId: checkBoxId,
                line: i
            });
            if (isChecked) {
                flag = true;
            }
        }

        if (!flag) {
            dialog.alert({
                title: '错误',
                message: '您没有勾选任何条目'
            });

            return false;
        }

        var ispdOk = validateQuantity(context);

        if (!ispdOk) {
            return false;
        }

        return true;
    }

    function fieldChanged(context) {

        if (context.fieldId == pageIdId) { //先检查是否为页码跳转
            var pageRec = context.currentRecord;
            var pageId = pageRec.getValue({
                fieldId: pageIdId
            });
            goToPage(pageId);
        }
    }

    return {
        saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        goToPage: goToPage,
        searchResults: searchResults
    }
});
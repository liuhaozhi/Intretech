/**
 *@NApiVersion 2.x
 *@author huyming Hu
 *@description UI组件对应的客户端程序
 */
define([
    'N/currentRecord',
    'N/ui/dialog',
    'N/format'
], function (
    currentRecord,
    dialog,
    format
) {

    var defaultPageIndexFieldId = 'custpage_pageid';
    var defaultPageSizeFieldId = 'custpage_pagesize';

    function getCache(key, cacheFieldId) {
        var _self = getCache;
        if (!_self.cache) {
            var pageRec = currentRecord.get();
            var pageCache = pageRec.getValue({
                fieldId: cacheFieldId || 'custpage_pagecache'
            });
            _self.cache = JSON.parse(pageCache);
        }

        return _self.cache[key];
    }

    function refreshPage(params, cacheKey) {
        var refreshURL = getCache(cacheKey || 'refreshURL');
        refreshURL = Object.keys(params).reduce(function (updatedURL, currentParam) {
            return updatedURL + '&' + currentParam + '=' + params[currentParam];
        }, refreshURL);

        setWindowChanged(window, false);
        window.location.assign(refreshURL);
    }

    function goToPage(pageId, pageIndexFieldId, cacheKey) {
        var refreshParams = getCache(cacheKey || 'refreshParams');
        refreshParams[pageIndexFieldId || defaultPageIndexFieldId] = pageId;
        refreshPage(refreshParams);
        return (function () {}); //为了不让页面报错
    }

    function searchResults(pageIndexFieldId, pageSizeFieldId, cacheKey) {
        var searchFields = getCache(cacheKey || 'searchFields');
        var pageRec = currentRecord.get();
        var pageSize = pageRec.getValue({
            fieldId: pageSizeFieldId || defaultPageSizeFieldId
        });
        var urlParams = {};
        urlParams[pageIndexFieldId || defaultPageIndexFieldId] = 1;
        urlParams[pageSizeFieldId || defaultPageSizeFieldId] = pageSize;

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
                searchValue = String(searchValue).trim();
            }

            if (searchValue !== null && searchValue !== undefined && searchValue !== '') {
                urlParams[fieldId] = encodeURIComponent(searchValue);
            };
        });

        refreshPage(urlParams);
        return true;
    }

    return {
        getCache: getCache,
        refreshPage: refreshPage,
        goToPage: goToPage,
        searchResults: searchResults
    }
});
/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description 计划行分拆的客户端逻辑
 */
define([
    'N/currentRecord',
], function (
    currentRecord
) {

    var updateSublistId = 'custpage_update_sublist',
        custElementPrefix = 'custpage_';

    function getCache(key) {
        var _self = getCache;
        if (!_self.cache) {
            var pageRec = currentRecord.get();
            var pageCache = pageRec.getValue({
                fieldId: 'custpage_pagecache'
            });
            _self.cache = JSON.parse(pageCache);
        }

        return _self.cache[key];
    }

    function autoFill(sublistFieldId) {
        var pageRec = currentRecord.get(),
            lineCount = pageRec.getLineCount({
                sublistId: updateSublistId
            }),
            valueMap = {},
            i;

        if (sublistFieldId) {
            valueMap[sublistFieldId] = pageRec.getValue({
                fieldId: custElementPrefix + sublistFieldId
            });
        } else {
            getCache('sublistFields').forEach(function (sublistFieldId) {
                valueMap[sublistFieldId] = pageRec.getValue({
                    fieldId: custElementPrefix + sublistFieldId
                });
            });
        }

        for (i = 0; i < lineCount; i++) {
            pageRec.selectLine({
                sublistId: updateSublistId,
                line: i,
            });
            Object.keys(valueMap).forEach(function (sublistFieldId) {
                pageRec.setCurrentSublistValue({
                    sublistId: updateSublistId,
                    fieldId: sublistFieldId,
                    value: valueMap[sublistFieldId]
                });
            });
            pageRec.commitLine({
                sublistId: updateSublistId,
            });
        }

        return function () {};
    }

    //entry point
    function saveRecord(context) {
        return window.confirm('确定批量更新这些计划单吗?');
    }

    return {
        saveRecord: saveRecord,
        autoFill: autoFill,
    }
});
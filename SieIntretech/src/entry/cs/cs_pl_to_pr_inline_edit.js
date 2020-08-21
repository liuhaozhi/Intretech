/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description 计划行分拆的客户端逻辑
 */
define([
    'N/ui/dialog',
    'N/currentRecord',
], function (
    dialog,
    currentRecord
) {

    var updateSublistId = 'custpage_update_sublist',
        suggestQtyFieldId = 'custpage_custrecord_suggested_order_quantity',
        memoFieldId = 'custpage_custrecord_memo_plan',
        closeMethodFieldId = 'custpage_custrecord_close_memo',
        assistSuggestQtyFieldId = 'custpage_assist_custrecord_suggested_order_quantity',
        assistMemoFieldId = 'custpage_assist_custrecord_memo_plan',
        assistCloseMethodFieldId = 'custpage_assist_custrecord_close_memo',
        updateMap = {};

    updateMap[assistSuggestQtyFieldId] = suggestQtyFieldId;
    updateMap[assistMemoFieldId] = memoFieldId;
    updateMap[assistCloseMethodFieldId] = closeMethodFieldId;

    function autoFill(assistFieldId) {
        var pageRec = currentRecord.get(),
            lineCount = pageRec.getLineCount({
                sublistId: updateSublistId
            }),
            valueMap = {},
            i;

        if (assistFieldId) {
            valueMap[updateMap[assistFieldId]] = pageRec.getValue({
                fieldId: assistFieldId
            });
        } else {
            Object.keys(updateMap).forEach(function (assistFieldId) {
                valueMap[updateMap[assistFieldId]] = pageRec.getValue({
                    fieldId: assistFieldId
                });
            });
        }

        for (i = 0; i < lineCount; i++) {
            Object.keys(valueMap).forEach(function (sublistFieldId) {
                pageRec.selectLine({
                    sublistId: updateSublistId,
                    line : i,
                });
                pageRec.setCurrentSublistValue({
                    sublistId: updateSublistId,
                    fieldId: sublistFieldId,
                    value : valueMap[sublistFieldId]
                });
                pageRec.commitLine({
                    sublistId: updateSublistId,
                });
            });
        }
    }

    function fillSuggestOrderQty() {
        autoFill(assistSuggestQtyFieldId);
    }

    function fillMemo() {
        autoFill(assistMemoFieldId);
    }

    function fillCloseMethod() {
        autoFill(assistCloseMethodFieldId);
    }

    //entry point
    function saveRecord(context) {
        return window.confirm('确定批量更新这些计划单吗?');
    }

    return {
        saveRecord: saveRecord,
        fillSuggestOrderQty: fillSuggestOrderQty,
        fillMemo: fillMemo,
        fillCloseMethod: fillCloseMethod,
        autoFill : autoFill,
    }
});
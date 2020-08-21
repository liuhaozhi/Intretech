/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description 设置采购平台首选项的相关客户端验证处理
 */
define([
    'N/ui/dialog',
], function (
    dialog
) {

    var filterSublistId = 'custpage_filter_sublist',
        resultSublistId = 'custpage_result_sublist',
        filterSelectFieldId = 'custpage_filter_sublist_filter_options',
        resultSelectFieldId = 'custpage_result_sublist_result_options',
        freeCountFieldId = 'custpage_freeze_count';

    //entry point
    function saveRecord(context) {
        var pageRec = context.currentRecord,
            filterLineCount = pageRec.getLineCount({
                sublistId: filterSublistId
            }),
            resultLineCount = pageRec.getLineCount({
                sublistId: resultSublistId
            }),
            freeCount = pageRec.getValue({
                fieldId: freeCountFieldId
            }),
            curFilterId,
            filterMap = {},
            curResultId,
            resultMap = {},
            i;

        if (filterLineCount < 1) {
            dialog.alert({
                title: '错误',
                message: '请您至少选择一个过滤器'
            });
            return false;
        }

        if (resultLineCount < 1) {
            dialog.alert({
                title: '错误',
                message: '请您至少选择一个输出结果'
            });
            return false;
        }

        if (freeCount < 1) {
            dialog.alert({
                title: '错误',
                message: '冻结列数不能小于1列'
            });
            return false;
        }

        //验证是否有重复的过滤器
        for (i = 0; i < filterLineCount; i++) {
            curFilterId = pageRec.getSublistValue({
                sublistId: filterSublistId,
                fieldId: filterSelectFieldId,
                line: i
            });
            if (!filterMap[curFilterId]) {
                filterMap[curFilterId] = {
                    name: pageRec.getSublistText({
                        sublistId: filterSublistId,
                        fieldId: filterSelectFieldId,
                        line: i
                    }),
                    count: 0
                }
            } else {
                filterMap[curFilterId].count++;
            }

            if(filterMap[curFilterId].count > 0){
                dialog.alert({
                    title: '错误',
                    message: '过滤器: ' + filterMap[curFilterId].name + ' 选择重复，请删掉重复项再提交'
                });
                return false;
            }
        }

        //验证是否有重复的结果列
        for (i = 0; i < resultLineCount; i++) {
            curResultId = pageRec.getSublistValue({
                sublistId: resultSublistId,
                fieldId: resultSelectFieldId,
                line: i
            });
            if (!resultMap[curResultId]) {
                resultMap[curResultId] = {
                    name: pageRec.getSublistText({
                        sublistId: resultSublistId,
                        fieldId: resultSelectFieldId,
                        line: i
                    }),
                    count: 0
                }
            } else {
                resultMap[curResultId].count++;
            }

            if(resultMap[curResultId].count > 0){
                dialog.alert({
                    title: '错误',
                    message: '结果列: ' + resultMap[curResultId].name + ' 选择重复，请删掉重复项再提交'
                });
                return false;
            }
        }

        return true;
    }

    return {
        saveRecord: saveRecord,
    }
});
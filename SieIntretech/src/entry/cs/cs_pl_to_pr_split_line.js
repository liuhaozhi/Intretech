/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description 计划行分拆的客户端逻辑
 */
define([
    'N/ui/dialog',
], function (
    dialog
) {

    var splitSublistId = 'custpage_split_sublist',
        splitSublistSubNumFieldId = 'custpage_split_sub_order_num',
        splitSublistSuggNumFieldId = 'custpage_split_suggest_num',
        totalSuggestFieldId = 'custrecord_suggested_order_quantity',
        leftSuggestQtyFieldId = 'custrecord_suggested_order_quantity_split',
        cancelStatus = '8';

    //entry point
    function saveRecord(context) {
        var pageRec = context.currentRecord,
            lineCount = pageRec.getLineCount({
                sublistId: splitSublistId
            }),
            totalAvailQty = pageRec.getValue({
                fieldId: totalSuggestFieldId
            }) || 0,
            parentNum = pageRec.getValue({
                fieldId: 'custrecord_plan_order_num'
            }),
            curSubNumToBe,
            curSubNum,
            lineQty,
            splitedQty = 0,
            leftAvailQty = 0,
            i;

        //验证总行数
        if (lineCount === 0) {
            dialog.alert({
                title: '错误',
                message: '您至少分拆一行'
            });
            return false;
        }

        //验证分拆数量是否超过原有数量
        for (i = 0; i < lineCount; i++) {
            lineQty = pageRec.getSublistValue({
                sublistId: splitSublistId,
                fieldId: splitSublistSuggNumFieldId,
                line: i
            });
            splitedQty += lineQty;
        }
        splitedQty = +splitedQty.toFixed(6);
        leftAvailQty = totalAvailQty - splitedQty;
        leftAvailQty = +leftAvailQty.toFixed(6);
        if (leftAvailQty < 0) {
            dialog.alert({
                title: '错误',
                message: '总拆分数量大于总的建议订单数量'
            });
            return false;
        }

        //自动添加剩余未拆数量的行
        if (leftAvailQty > 0) {
            pageRec.selectNewLine({
                sublistId: splitSublistId
            });
            pageRec.setCurrentSublistValue({
                sublistId: splitSublistId,
                fieldId: splitSublistSuggNumFieldId,
                value: leftAvailQty
            });
            // pageRec.setCurrentSublistValue({
            //     sublistId: splitSublistId,
            //     fieldId: 'custpage_split_status',
            //     value: cancelStatus
            // });
            pageRec.commitLine({
                sublistId: splitSublistId
            });
        }

        //修复子单号自动编码，为了防止用户频繁修改而造成编码混乱
        lineCount = pageRec.getLineCount({
            sublistId: splitSublistId
        });
        for (i = 0; i < lineCount; i++) {
            curSubNum = pageRec.getSublistValue({
                sublistId: splitSublistId,
                fieldId: splitSublistSubNumFieldId,
                line : i
            });
            curSubNumToBe = parentNum + '-' + (i + 1);
            if(curSubNum !== curSubNumToBe){
                pageRec.selectLine({
                    sublistId: splitSublistId,
                    line: i
                });
                pageRec.setCurrentSublistValue({
                    sublistId: splitSublistId,
                    fieldId: splitSublistSubNumFieldId,
                    value: curSubNumToBe
                });
                pageRec.commitLine({
                    sublistId: splitSublistId
                });
            }
        }

        return window.confirm('确定分拆行吗？');
    }

    function lineInit(context) {
        if (context.sublistId == splitSublistId) {
            //同步头部信息到行上
            var pageRec = context.currentRecord,
                subOrderNum = pageRec.getCurrentSublistValue({
                    sublistId: splitSublistId,
                    fieldId: splitSublistSubNumFieldId
                }),
                parentNum = pageRec.getValue({
                    fieldId: 'custrecord_plan_order_num'
                }),
                curLineIndex = pageRec.getCurrentSublistIndex({
                    sublistId: splitSublistId
                }),
                suggestOrderNum,
                suggestOrderDate,
                suggestReceiveDate,
                suggestVendor;

            if (!subOrderNum) {//初次输入值，自动带入头部字段值
                subOrderNum = parentNum + '-' + (curLineIndex + 1);
                suggestOrderNum = pageRec.getValue({
                    fieldId: leftSuggestQtyFieldId
                });
                suggestOrderDate = pageRec.getValue({
                    fieldId: 'custrecord_plan_date'
                });
                suggestReceiveDate = pageRec.getValue({
                    fieldId: 'custrecord_platform_end_date'
                });
                suggestVendor = pageRec.getValue({
                    fieldId: 'custrecord_plan_vendor'
                });

                pageRec.setCurrentSublistValue({
                    sublistId: splitSublistId,
                    fieldId: splitSublistSubNumFieldId,
                    value: subOrderNum
                });
                pageRec.setCurrentSublistValue({
                    sublistId: splitSublistId,
                    fieldId: splitSublistSuggNumFieldId,
                    value: suggestOrderNum
                });
                pageRec.setCurrentSublistValue({
                    sublistId: splitSublistId,
                    fieldId: 'custpage_split_suggest_order_date',
                    value: suggestOrderDate
                });
                pageRec.setCurrentSublistValue({
                    sublistId: splitSublistId,
                    fieldId: 'custpage_split_suggest_receive_date',
                    value: suggestReceiveDate
                });
                pageRec.setCurrentSublistValue({
                    sublistId: splitSublistId,
                    fieldId: 'custpage_split_vendor',
                    value: suggestVendor
                });
            }
        }
    }

    function validateLine(context) {
        if (context.sublistId == splitSublistId) {
            //验证建议订单量是否超出
            var pageRec = context.currentRecord,
                curSugNum = pageRec.getCurrentSublistValue({
                    sublistId: splitSublistId,
                    fieldId: splitSublistSuggNumFieldId
                }),
                lineCount = pageRec.getLineCount({
                    sublistId: splitSublistId
                }),
                curLineIndex = pageRec.getCurrentSublistIndex({
                    sublistId: splitSublistId
                }),
                totalAvailQty = pageRec.getValue({
                    fieldId: totalSuggestFieldId
                }) || 0,
                splitedQty = 0,
                lineQty,
                leftAvailQty = 0,
                i;

            if (!curSugNum || curSugNum < 0) {
                dialog.alert({
                    title: '提示',
                    message: '当前行建议订单量必须大于0'
                });
                return false;
            } else {
                //动态计算剩余可用数量，而不用头部的剩余可用数量，是因为用户有可能回头去修改已经确认的行，导致可用数量不准确
                for (i = 0; i < lineCount; i++) {
                    if (curLineIndex != i) {
                        lineQty = pageRec.getSublistValue({
                            sublistId: splitSublistId,
                            fieldId: splitSublistSuggNumFieldId,
                            line: i
                        });
                        splitedQty += lineQty;
                    }
                }
                splitedQty = +splitedQty.toFixed(6);
                leftAvailQty = totalAvailQty - splitedQty;

                if (curSugNum > leftAvailQty) {
                    dialog.alert({
                        title: '提示',
                        message: '当前行建议订单量已超过剩余可拆数量：' + leftAvailQty
                    });
                    return false;
                }
            }
        }

        return true;
    }

    function sublistChanged(context) {
        if (context.sublistId == splitSublistId) {
            //同步剩余可拆数量
            var pageRec = context.currentRecord,
                lineCount = pageRec.getLineCount({
                    sublistId: splitSublistId
                }),
                totalAvailQty = pageRec.getValue({
                    fieldId: totalSuggestFieldId
                }) || 0,
                leftSuggestQty = pageRec.getValue({
                    fieldId: leftSuggestQtyFieldId
                }),
                splitedQty = 0,
                lineQty,
                leftAvailQty = 0,
                i;

            for (i = 0; i < lineCount; i++) {
                lineQty = pageRec.getSublistValue({
                    sublistId: splitSublistId,
                    fieldId: splitSublistSuggNumFieldId,
                    line: i
                });
                splitedQty += lineQty;
            }

            splitedQty = +splitedQty.toFixed(6);
            leftAvailQty = totalAvailQty - splitedQty;
            leftAvailQty = +leftAvailQty.toFixed(6);

            if(leftAvailQty != leftSuggestQty){
                pageRec.setValue({
                    fieldId: leftSuggestQtyFieldId,
                    value : leftAvailQty
                });
            }
        }
    }

    function pageInit(context){
        //初始化子列表
        var pageRec = context.currentRecord;
        pageRec.cancelLine({
            sublistId : splitSublistId
        });
    }

    return {
        saveRecord: saveRecord,
        lineInit: lineInit,
        validateLine: validateLine,
        sublistChanged: sublistChanged,
        pageInit : pageInit
    }
});
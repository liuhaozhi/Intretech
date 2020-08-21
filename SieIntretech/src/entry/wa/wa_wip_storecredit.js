/**
 *@NApiVersion 2.x
 *@NScriptType WorkflowActionScript
 *@author yuming Hu
 *@description  该脚本用于退料单审批后，冲销工作单完成上的用料的数量
 */
define(['N/log',
    'N/record'
], function (log, record) {

    var approveStatus = 'custrecord_wip_approval_status';
    var statusCode = '3';
    var item = 'custrecord_scl_sc_item';
    var quanityReturn = 'custrecord_scl_sc_return_numbers';
    var sublistId = 'recmachcustrecord_scl_sc_link';
    var workordercompletion = 'custrecord_sc_wo_completion';
    var info = {
        completionId: '',
        componentDetails: []
    };

    function updateUseQuanity(scriptContext) {
        var newRecord = scriptContext.newRecord;

        var approveStatusValue = newRecord.getValue({
            fieldId: approveStatus
        });

        if (approveStatusValue == statusCode) {

            try {
                var completionValue = newRecord.getValue({
                    fieldId: workordercompletion
                });

                info.completionId = completionValue;

                var lineCount = newRecord.getLineCount({
                    sublistId: sublistId
                });

                for (var i = 0; i < lineCount; i++) {
                    var componentObj = {};

                    var itemValue = newRecord.getSublistValue({
                        sublistId: sublistId,
                        fieldId: item,
                        line: i
                    });

                    var quanityReturnValue = newRecord.getSublistValue({
                        sublistId: sublistId,
                        fieldId: quanityReturn,
                        line: i
                    });

                    if (quanityReturnValue) {
                        componentObj['itemValue'] = itemValue;
                        componentObj['quanityReturnValue'] = quanityReturnValue;

                        info.componentDetails.push(componentObj);
                    }
                }

                if (info.componentDetails.length > 0) {
                    //加载工作单完成记录类型
                    var comObjRecord = record.load({
                        type: 'workordercompletion',
                        id: completionValue,
                        isDynamic: true,
                    });

                    //获取组件行数
                    var numLines = comObjRecord.getLineCount({
                        sublistId: 'component'
                    });

                    for (var i = 0; i < numLines; i++) {
                        var itemValue = comObjRecord.getSublistValue({
                            sublistId: 'component',
                            fieldId: 'item',
                            line: i
                        });

                        var quantity = comObjRecord.getSublistValue({
                            sublistId: 'component',
                            fieldId: 'quantity',
                            line: i
                        });

                        info.componentDetails.forEach(function (result) {
                            var returnQuanity = result['quanityReturnValue'];
                            var QuanityDef = quantity - returnQuanity;

                            if (result['itemValue'] == itemValue) {
                                //动态模式获取工作单完成的sublist数据
                                comObjRecord.selectLine({
                                    'sublistId': 'component',
                                    'line': i
                                });

                                comObjRecord.setCurrentSublistValue({
                                    'sublistId': 'component',
                                    'fieldId': 'quantity',
                                    'value': QuanityDef,
                                    ignoreFieldChange: true
                                });

                                // comObjRecord.commitLine({
                                //     sublistId: 'component'
                                // });

                                //获取库存详细信息
                                var objSubRecord = comObjRecord.getCurrentSublistSubrecord({
                                    sublistId: 'component',
                                    fieldId: 'componentinventorydetail',
                                    line: i
                                });

                                var objSubRecordLineCount = objSubRecord.getLineCount({
                                    sublistId: 'inventoryassignment'
                                });

                                for (var j = objSubRecordLineCount - 1; j >= 0; j--) {
                                    objSubRecord.selectLine({
                                        'sublistId': 'inventoryassignment',
                                        'line': j
                                    });

                                    var subRecordQuanity = objSubRecord.getCurrentSublistValue({
                                        sublistId: 'inventoryassignment',
                                        fieldId: 'quantity'
                                    });

                                    if (returnQuanity >= subRecordQuanity) {

                                        //如果退货数量大于批次中的数量，则删除该行，并且退货数量减去被删除行的数量
                                        objSubRecord.removeLine({
                                            sublistId: 'inventoryassignment',
                                            line: j
                                            //ignoreRecalc: true
                                        });

                                        returnQuanity = returnQuanity - subRecordQuanity;

                                        // objSubRecord.commitLine({
                                        //     sublistId: 'inventoryassignment'
                                        // });
                                    } else {
                                        objSubRecord.setCurrentSublistValue({
                                            'sublistId': 'inventoryassignment',
                                            'fieldId': 'quantity',
                                            'value': subRecordQuanity - returnQuanity,
                                            ignoreFieldChange: true
                                        });

                                        objSubRecord.commitLine({
                                            sublistId: 'inventoryassignment'
                                        });
                                    }
                                }

                                comObjRecord.commitLine({
                                    sublistId: 'component'
                                });
                            }
                            return true;
                        });
                    }

                    comObjRecord.save();
                }
            } catch (e) {
                log.error({
                    title: e.name,
                    details: e.message
                });

            }
        }

    }

    function onAction(scriptContext) {
        updateUseQuanity(scriptContext);
    }

    return {
        onAction: onAction
    }
});
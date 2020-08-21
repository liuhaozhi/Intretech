/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@author yuming Hu
 *@description  该脚本用于在客户端处理相关逻辑，验证退货数量和选取了工作单完成后自动带出用料情况信息
 */
define(['N/log',
    'N/ui/dialog',
    'N/https'
], function (log,
    dialog,
    https) {

    var sublistId = 'recmachcustrecord_scl_sc_link';
    var typeCheckList = ['1', '2'];
    var creditType = 'custrecord_sc_return_type_material';
    var workordercompletion = 'custrecord_sc_wo_completion';
    var cache = 'custpage_for_dev';
    var item = 'custrecord_scl_sc_item';
    var bomQuanityStadand = 'custrecord_sc_bom_standard_dosage';
    var quanityCompleted = 'custrecord_sc_finished_dosage';
    var quanityUllage = 'custrecord_sc_ullage_number';
    var quanityReturn = 'custrecord_scl_sc_return_numbers';

    function saveRecord(context) {

        try {
            var currentRecord = context.currentRecord;

            var typeValue = currentRecord.getValue({
                fieldId: creditType
            });

            var typeText = currentRecord.getText({
                fieldId: creditType
            });

            var completionValue = currentRecord.getValue({
                fieldId: workordercompletion
            });

            if (typeCheckList.indexOf(typeValue) >= 0 && (!completionValue)) {
                dialog.alert({
                    title: '提示',
                    message: '当退料类型为：' + typeText + '时，工单完工必须填写，请输入工单完工后重试。'
                });

                return false;
            }

            var Linecount = currentRecord.getLineCount({
                sublistId: sublistId
            });

            for (var i = 0; i < Linecount; i++) {
                // currentRecord.selectLine({
                //     sublistId: sublistId,
                //     line: i
                // });

                var quanityUllageValue = currentRecord.getSublistValue({
                    sublistId: sublistId,
                    fieldId: quanityUllage,
                    line: i
                });

                var quanityReturnValue = currentRecord.getSublistValue({
                    sublistId: sublistId,
                    fieldId: quanityReturn,
                    line: i
                });

                log.debug('quanityUllageValue', quanityUllageValue);
                log.debug('quanityReturnValue', quanityReturnValue);

                if (Number(quanityReturnValue) > Number(quanityUllageValue)) {
                    dialog.alert({
                        title: '提示',
                        message: '退料数量不能大于损耗数量，请输入工单完工后重试。'
                    });

                    return false;
                }
            }

            return true;

        } catch (e) {
            dialog.alert({
                title: '错误',
                message: '出现错误，请稍后再试：' + e.message
            });

            log.error({
                title: e.name,
                details: e.message
            });

            return false;
        }
    }

    function fieldChanged(context) {

        var currentRecord = context.currentRecord;

        var typeValue = currentRecord.getValue({
            fieldId: creditType
        });

        var completionValue = currentRecord.getValue({
            fieldId: workordercompletion
        });

        var cacheValue = JSON.parse(currentRecord.getValue({
            fieldId: cache
        }));

        //当工单完工字段修改时，触发更改操作
        if (context.fieldId == workordercompletion) {

            //如果退料类型为完工退料或者完工退料（其他工单/其他入库）时，同时工单完工不能为空时，自动将完工单上的用料信息带出
            if (typeCheckList.indexOf(typeValue) >= 0 &&
                completionValue &&
                cacheValue['type'] == 'create') {
                //log.debug("1234", 1);
                var daoURL = cacheValue['daoURL'];

                var Linecount = currentRecord.getLineCount({
                    sublistId: sublistId
                });

                log.debug('Linecount', Linecount);

                if (Linecount > 0) {
                    for (i = Linecount - 1; i >= 0; i--) {
                        currentRecord.removeLine({
                            sublistId: sublistId,
                            line: i,
                            ignoreRecalc: true
                        });
                    }
                } else {

                    if (completionValue) {

                        //获取返回的物料信息
                        var resp = https.post({
                            url: daoURL,
                            body: {
                                action: 'getComponent',
                                completionValue: completionValue
                            }
                        }).body;

                        try {
                            resp = JSON.parse(resp);
                            if (resp.status == 'S') {
                                log.debug('resp', resp);

                                var lineCount = 0;

                                resp.details.forEach(function (result) {
                                    log.debug('custrecord_scl_sc_item', result.custrecord_scl_sc_item);

                                    currentRecord.insertLine({
                                        sublistId: sublistId,
                                        line: lineCount,
                                        ignoreRecalc: true
                                    });

                                    currentRecord.setCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: item,
                                        value: result[item]
                                    });

                                    currentRecord.setCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: quanityCompleted,
                                        value: result[quanityCompleted]
                                    });

                                    currentRecord.setCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: bomQuanityStadand,
                                        value: result[bomQuanityStadand]
                                    });

                                    currentRecord.setCurrentSublistValue({
                                        sublistId: sublistId,
                                        fieldId: quanityUllage,
                                        value: result[quanityUllage]
                                    });

                                    currentRecord.commitLine({
                                        sublistId: sublistId
                                    });

                                    lineCount++;
                                    return true;
                                });
                            } else {
                                dialog.alert({
                                    title: '错误',
                                    message: '出现错误：' + resp.message
                                });

                                return false;
                            }
                        } catch (e) {
                            dialog.alert({
                                title: '错误',
                                message: '出现错误，请稍后再试：' + e.message
                            });

                            log.error({
                                title: e.name,
                                details: e.message
                            });

                            return false;
                        }
                    }
                }
            }
        }
    }

    return {
        saveRecord: saveRecord,
        fieldChanged: fieldChanged
    }
});
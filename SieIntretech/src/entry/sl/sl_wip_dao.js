/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@author yuming Hu
 *@description  该脚本用于获取wip的查询数据
 */
define(['N/log',
    'N/record'
], function (
    log, record) {
    function getComponent(workordercompletion) {

        var resultMsg = {
            workordercompletion: workordercompletion,
            workorder: '', //createdfrom
            status: 'E',
            details: []
        };

        try {
            //加载记录类型
            var objRecord = record.load({
                type: 'workordercompletion',
                id: workordercompletion,
                isDynamic: true,
            });

            resultMsg.workorder = objRecord.getValue({
                fieldId: 'createdfrom'
            });

            //获取组件行数
            var numLines = objRecord.getLineCount({
                sublistId: 'component'
            });

            if (numLines == 0) {
                resultMsg.message = '未找到用量信息，请修改后重试';
            }

            for (var i = 0; i < numLines; i++) {

                resultMsg.status = 'S';

                var detailObj = {
                    custrecord_scl_sc_item: '',
                    custrecord_sc_finished_dosage: 0,
                    custrecord_sc_bom_standard_dosage: 0,
                    custrecord_sc_ullage_number: 0
                };

                detailObj.custrecord_scl_sc_item = objRecord.getSublistValue({
                    'sublistId': 'component',
                    'fieldId': 'item',
                    'line': i
                });

                detailObj.custrecord_sc_finished_dosage = objRecord.getSublistValue({
                    'sublistId': 'component',
                    'fieldId': 'quantity',
                    'line': i
                });

                resultMsg.details.push(detailObj);
            }

            //加载工单记录类型
            var workorderRecord = record.load({
                type: 'workorder',
                id: resultMsg.workorder,
                isDynamic: true,
            });

            //获取工单的item sublist的行数
            numLines = workorderRecord.getLineCount({
                sublistId: 'item'
            });

            for (var i = 0; i < numLines; i++) {
                var _item = workorderRecord.getSublistValue({
                    'sublistId': 'item',
                    'fieldId': 'item',
                    'line': i
                });

                resultMsg.details.forEach(function (result) {
                    //log.error('result', result);
                    if (_item == result.custrecord_scl_sc_item) {
                        result.componentyield = workorderRecord.getSublistValue({
                            'sublistId': 'item',
                            'fieldId': 'componentyield',
                            'line': i
                        }) / 100;

                        result.custrecord_sc_bom_standard_dosage = (result.custrecord_sc_finished_dosage * result.componentyield).toFixed(5);
                        result.custrecord_sc_ullage_number = (result.custrecord_sc_finished_dosage - result.custrecord_sc_bom_standard_dosage).toFixed(5);
                    }

                    return true;
                });

            }

        } catch (e) {
            resultMsg.message = e.message;

            log.error({
                title: '提示',
                details: JSON.stringify(resultMsg)
            });
        }

        return resultMsg;
    }

    function onRequest(context) {
        var request = context.request;
        var response = context.response;

        if (request.method === 'POST') {
            log.debug('request.parameters.action', request.parameters.action);
            log.debug('request.parameters.completionValue', request.parameters.completionValue);
            if (request.parameters.action == 'getComponent') {
                var rtn = getComponent(request.parameters.completionValue);
                response.write(JSON.stringify(rtn));
            }
        }
    }

    return {
        onRequest: onRequest
    }
});
/**
 *@NApiVersion 2.0
 *@NScriptType Restlet
 *@author Charles Zhang
 *@description 标记PO执行平台的行数据的已读未读状态
 */
define(['N/record'], function (record) {

    function markOrderReadStatus(orderLines, isRead) {
        var resultMap = {
            success: [],
            fail: []
        };

        util.each(orderLines, function (orderLine, orderId) {
            try {
                var poRec,
                    lineCount,
                    curLineId,
                    readField = 'custcol_po_line_whether_read';

                poRec = record.load({
                    type: 'purchaseorder',
                    id: orderId
                });
                lineCount = poRec.getLineCount({
                    sublistId: 'item'
                });

                for (var i = 0; i < lineCount; i++) {
                    curLineId = poRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'line',
                        line: i
                    }) + '';
                    if (orderLine.indexOf(curLineId) > -1) {
                        poRec.setSublistValue({
                            sublistId: 'item',
                            fieldId: readField,
                            line: i,
                            value: isRead
                        });
                    }
                }

                poRec.save({
                    ignoreMandatoryFields: true
                });

                resultMap.success.push(orderId);
            } catch (ex) {
                log.error({
                    title: 'po line read status update error',
                    details: {
                        orderId: orderId,
                        orderLine: orderLine,
                        error: ex
                    }
                });

                resultMap.fail.push(orderId);
            }
        });

        return resultMap;
    }

    function _post(context) {
        var operateType = context.operateType,
            orderLines = context.orderLines,
            rspMsg;

        if (operateType === 'markAsRead') {
            rspMsg = markOrderReadStatus(orderLines, true);
        } else {
            rspMsg = markOrderReadStatus(orderLines, false);
        }

        return rspMsg;
    }

    return {
        post: _post
    }
});
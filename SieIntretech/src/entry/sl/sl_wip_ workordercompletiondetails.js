/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/search',
    'N/log'
], function (search,
    log) {
    function getComponent(workordercompletion) {

        var resultMsg = {
            workordercompletion: workordercompletion,
            status: 'E',
            details: {
                custrecord_scl_sc_item: '',
                custrecord_sc_finished_dosage: 0,
                custrecord_sc_bom_standard_dosage: 0,
                custrecord_sc_ullage_number: 0
            }
        };

        try {
            //加载记录类型
            var objRecord = record.load({
                type: 'workordercompletion',
                id: workordercompletion,
                isDynamic: true,
            });

            //获取组件行数
            var numLines = objRecord.getLineCount({
                sublistId: 'component'
            });

            for (var i = 0; i < numLines; i++) {
                resultMsg.details.custrecord_scl_sc_item = currentRecord.getSublistValue({
                    'sublistId': 'custpage_sl',
                    'fieldId': 'custpage_sl_vendor',
                    'line': i
                });
            }

        } catch (e) {
            resultMsg.data = e.message;

            log.error({
                title: '提示',
                details: JSON.stringify(resultMsg)
            });
        }

        // try {
        //     var mySearch = search.create({
        //         type: 'item',
        //         filters: ['internalId', 'is', item],
        //         columns: ['displayname', 'stockunit']
        //     });

        //     mySearch.run().each(function (result) {

        //         resultMsg.status = 'S';
        //         resultMsg.details.custpage_paged_item_desc = result.getValue('displayname');
        //         resultMsg.details.custpage_paged_unit = result.getValue('stockunit');
        //         resultMsg.details.custpage_paged_unit_desc = result.getText('stockunit');
        //         return true;
        //     });

        // } catch (e) {
        //     resultMsg.data = e.message;

        //     log.error({
        //         title: '提示',
        //         details: JSON.stringify(resultMsg)
        //     });
        // }

        return resultMsg;
    }

    function onRequest(context) {
        var request = context.request;
        var response = context.response;

        if (request.method === 'GET') {
            var rtn = getComponent(3136);
            response.write(JSON.stringify(rtn));
        }
        // else {
        //     //获取货品详细
        //     if (request.parameters.action == 'getItem') {
        //         var rtn = getItem(request.parameters.newItem);
        //         //返回结果
        //         response.write(JSON.stringify(rtn));
        //     } else {
        //         submitPage(context);
        //     }
        // }
    }

    return {
        onRequest: onRequest
    }
});
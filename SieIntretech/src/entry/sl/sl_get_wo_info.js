/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 查询工单信息，以供库存转移使用
 */
define(['../../app/app_workorder_transfer_items', 'N/search'], function (woInfoMod, search) {
    //util
    function returnWoInfo({ request: { parameters: { workorderid: woId, lingliaotype: lingliaoType, fromlocation: fromLocation } } }) {
        const rspMsg = {
            status: null,
            result: null
        };
        try {
            const queryResult = woInfoMod.getWorkOrderInfo(woId, { lingliaoType, fromLocation });
            const woInfo = Object.fromEntries(queryResult.woInfo);
            rspMsg.status = 'success';
            rspMsg.result = woInfo;
        } catch (ex) {
            rspMsg.status = 'fail';
            rspMsg.result = `查询ID为${woId}的工单号信息失败，错误提示：${ex.message}`;
            log.error({
                title: `查询ID为${woId}的工单号信息失败`,
                details: ex
            });
        }

        return rspMsg;
    }

    function returnItemStockInfo({ request: { parameters: { itemids: itemIds, fromlocation: fromLocation } } }) {
        let status = null;
        let result = null;

        try {
            const itemIdList = itemIds.split(',');
            const queryResult = woInfoMod.getLotNumInfo(itemIdList, [fromLocation]);
            const stockInfo = Object.fromEntries(queryResult);
            status = 'success';
            result = stockInfo;
        } catch (ex) {
            status = 'fail';
            result = `查询物料库存信息失败，错误提示：${ex.message}`;
            log.error({
                title: `查询物料库存信息失败`,
                details: ex
            });
        }

        return {
            status,
            result
        }
    }

    function returnRemainTaoshu({ request: { parameters: { workorderid: woId } } }) {
        const rspMsg = {
            status: null,
            result: null
        };
        try {
            const woInfo = woInfoMod.getWoRemainTaoshu(woId);
            rspMsg.status = 'success';
            rspMsg.result = woInfo;
        } catch (ex) {
            rspMsg.status = 'fail';
            rspMsg.result = `${ex.message}`;
            log.error({
                title: `查询ID为${woId}的工单号剩余套数失败`,
                details: ex
            });
        }

        return rspMsg;
    }

    function returnLocation({
        request: {
            parameters: {
                subsidiary: Subsidiary,
                tllx: Tllx
            }
        }
    }) {
        const rspMsg = {
            status: null,
            sllocation: null
        };

        // log.debug('subsidiary', Subsidiary);
        // log.debug('tllx', Tllx);

        const tllxFilters = [
            ["custrecord_srl_subsidiary", "anyof", Subsidiary],
            "AND",
            ["custrecord_srl_type", "anyof", Tllx]
        ];

        // log.debug('tllxFilters', tllxFilters);

        const tllxColumns = [{
            name: "custrecord_srl_location"
        }];

        const tllxSearchCriteria = {
            type: 'customrecord_wip_stores_returne_location',
            filters: tllxFilters,
            columns: tllxColumns
        };

        try {

            search.create(tllxSearchCriteria).run().each(function (result, i) {

                // log.debug('test', 11111111);
                rspMsg.sllocation = result.getValue({
                    name: tllxColumns[0]
                });

                return true;
            });

            rspMsg.status = 'success';
        } catch (ex) {
            rspMsg.status = 'fail';
            rspMsg.result = ex.message;
            log.error({
                title: '查询地点失败',
                details: ex
            });
        }

        return rspMsg;
    }

    //entry point
    function onRequest(context) {
        let returnResult = {};
        const {
            request: {
                method,
                parameters: {
                    getaction: getAction
                }
            },
            response
        } = context;

        //Search
        if (method === 'GET') {
            if (getAction === 'getwoinfo') {
                returnResult = returnWoInfo(context);
            } else if (getAction === 'getremaintaoshu') {
                returnResult = returnRemainTaoshu(context);
            } else if (getAction === 'getloction') {
                returnResult = returnLocation(context);
            }
        } else {
            if (getAction === 'getstockinfo') {
                returnResult = returnItemStockInfo(context);
            }
        }

        response.setHeader({
            name: 'Content-Type',
            value: 'application/json'
        });
        response.write({
            output: JSON.stringify(returnResult)
        });
    }

    return {
        onRequest
    }
});
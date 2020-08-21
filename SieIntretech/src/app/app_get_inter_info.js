/**
 *@NApiVersion 2.0
 *@author yuming Hu
 *@description Inv处理公共程序
 */
define([
    'N/search'
], function (
    search
) {
    var gWorkorderRecordTypeId = 'workorder',
        gSubsidiaryFieldId = 'subsidiary', //可用于事务处理上的子公司字段、客户主数据上的主要子公司字段
        gInternalidFieldId = 'internalid', //内部标示Id
        gCurrencyFieldId = 'currency',
        gEntityFieldId = 'entity';

    function getInterPurchInfo(option) {

        var entity = option.entity,
            cdsFieldId = 'custentity_deputy_subsidiaries', //代表子公司
            resultMsg = {
                status: 'E',
                data: {
                    vendor: {}
                }
            },
            vendorColumns = [],
            vendorFilters = [],
            vendorSearchCriteria = {},
            vendorObj = {};

        try {
            vendorColumns = [{
                    name: cdsFieldId
                },
                {
                    name: gSubsidiaryFieldId
                }
            ];

            vendorFilters = [
                [gInternalidFieldId, "anyof", entity]
            ];

            vendorSearchCriteria = {
                type: 'vendor',
                filters: vendorFilters,
                columns: vendorColumns
            };

            search.create(vendorSearchCriteria).run().each(function (result, i) {

                for (var j = 0; j < vendorColumns.length; j++) {
                    vendorObj[vendorColumns[j]['name']] = result.getValue({
                        name: vendorColumns[j]
                    });
                }
                return true;
            });

            if (Object.keys(vendorObj).length) {
                resultMsg.data.vendor = vendorObj;
                resultMsg.status = 'S';
                log.debug('resultMsg', resultMsg);
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

    function getInterPriceListInfo(option) {

        var subsidiary = option.subsidiary,
            intersub = option.intersub,
            currency = option.currency,
            cgfFieldId = 'custrecord_po', //采购方
            nbgysFieldId = 'custrecord_inter_sub', //内部供应商
            wlFieldId = 'custrecord_material', //物料
            jglxFieldId = 'custrecord_price_type_', //价格类型
            szFieldId = 'custrecord_num_', //数值 行联动比例
            ldblFieldId = 'custrecord_proportion', //联动比例 头
            bzFieldId = 'custrecord_currency__', //币种
            gsjjyListRecTypeId = 'customrecord_intercompany_price_list',
            joinRId = 'CUSTRECORD_FATHER_',
            resultMsg = {
                //workordercompletion: workordercompletion,
                //workorder: '', //createdfrom
                status: 'E',
                data: {
                    head: '',
                    lines: {}
                }
            },
            ipListColumns = [],
            ipListFilters = [],
            ipListSearchCriteria = {},
            ipListObj = {
                cgf: '',
                nbgys: '',
                wl: '',
                jglx: '',
                sz: '',
                ldbl: '',
                bz: ''
            },
            ipList = {},
            blValue = 0;

        try {
            ipListColumns = [{
                    name: cgfFieldId //采购方
                },
                {
                    name: nbgysFieldId //内部供应商
                },
                {
                    name: wlFieldId, //物料
                    join: joinRId
                },
                {
                    name: jglxFieldId, //价格类型
                    join: joinRId
                },
                {
                    name: szFieldId, //数值 行联动比例
                    join: joinRId
                },
                {
                    name: ldblFieldId //联动比例 头
                },
                {
                    name: bzFieldId //币种
                }
            ];

            ipListFilters = [
                [cgfFieldId, "anyof", subsidiary],
                "AND",
                [nbgysFieldId, "anyof", intersub],
                "AND",
                [bzFieldId, "anyof", currency]
            ];

            ipListSearchCriteria = {
                type: gsjjyListRecTypeId,
                filters: ipListFilters,
                columns: ipListColumns
            };

            log.debug('ipListSearchCriteria', ipListSearchCriteria);

            search.create(ipListSearchCriteria).run().each(function (result, i) {

                ipListObj = {
                    cgf: '',
                    nbgys: '',
                    wl: '',
                    jglx: '',
                    sz: '',
                    ldbl: '',
                    bz: ''
                };

                ipListObj.cgf = result.getValue({
                    name: ipListColumns[0]
                });

                ipListObj.nbgys = result.getValue({
                    name: ipListColumns[1]
                });

                ipListObj.wl = result.getValue({
                    name: ipListColumns[2]
                });

                ipListObj.jglx = result.getValue({
                    name: ipListColumns[3]
                });

                ipListObj.sz = result.getValue({
                    name: ipListColumns[4]
                });

                ipListObj.ldbl = result.getValue({
                    name: ipListColumns[5]
                });

                ipListObj.bz = result.getValue({
                    name: ipListColumns[6]
                });

                if (!blValue) {
                    blValue = ipListObj.ldbl;
                }

                //ipList.push(ipListObj);

                log.debug('ipListObj.wl', ipListObj.wl);

                if (!ipList[ipListObj.wl]) {
                    ipList[ipListObj.wl] = ipListObj;
                }

                return true;
            });

            log.debug('ipList', ipList);

            resultMsg.data = {
                head: blValue,
                lines: ipList
            };

            resultMsg.status = 'S';

            log.debug('resultMsg', resultMsg);

        } catch (e) {
            resultMsg.message = e.message;

            log.error({
                title: '提示',
                details: JSON.stringify(resultMsg)
            });
        }

        return resultMsg;
    }

    return {
        getInterPurchInfo: getInterPurchInfo,
        getInterPriceListInfo: getInterPriceListInfo
    }
});
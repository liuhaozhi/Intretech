/**
 *@NApiVersion 2.0
 *@NScriptType WorkflowActionScript
 *@author yuming Hu
 *@description  该脚本为PO审批的触发程序
 */
define([
    'N/search',
    '../../app/app_so_common.js'
], function (
    search,
    soCommon
) {
    var gItemSublistId = 'item',
        gSubsidiaryFieldId = 'subsidiary', //可用于事务处理上的子公司字段、客户主数据上的主要子公司字段
        gInternalidFieldId = 'internalid', //内部标示Id
        gCurrencyFieldId = 'currency',
        gEntityFieldId = 'entity',
        gIdFieldId = 'id',
        gSlItemFieldId = 'item',
        gSlRateFieldId = 'rate',
        gSlLineFieldId = 'line',
        gSlQuantityFieldId = 'quantity',
        gTrandateFieldId = 'trandate',
        gCustomformField = 'customform';

    function onAction(scriptContext) {
        autoSoCreation(scriptContext);
    }

    //内部交易自动创建销售订单
    function autoSoCreation(scriptContext) {
        var poRecord = scriptContext.newRecord,
            ordertypeDefultValue = 11,
            poMain = {},
            poItems = [], //采购订单行
            soItems = [],
            soItemObj = {},
            poLineCount = 0, //采购订单行数
            poItemObj = {},
            cdsFieldId = 'custentity_deputy_subsidiaries', //代表子公司
            vendorColumns = [],
            vendorFilters = [],
            vendorSearchCriteria = {},
            vendorObj = {},
            customerColumns = [],
            customerFilters = [],
            customerSearchCriteria = {},
            customerObj = {},
            mainPayload = {},
            lyddhFieldId = 'custcol_external',
            lyddlFieldId = 'custcol_sales_bank',
            isCctFieldId = 'custbody_whether_ntercompany_transact', //是否公司间交易
            cspFieldId = 'custbody_source_purchase', //来源是否采购
            ccoFieldId = 'custbody_cust_ordertype', //销售订单类型
            cosFieldId = 'custbody_order_status', //销售订单总订单状态
            ciprFieldId = 'custcol_inter_pur_rate', //公司间交易单价
            cipcFieldId = 'custcol_inter_pur_currency', //公司间交易货币
            civFieldId = 'custcol_inter_vendor', //公司间交易供应商
            ciiupFieldId = 'custcol_inter_is_update_price', //采购流程是否需要更新价格
            cildblFieldId = 'custcol_inter_ldbl',
            cdgsFieldId = 'custbody_dont_generate_sales', //不生成公司间销售订单
            cpoK3LineId = 'custcol_k3_line_number', //采购订单K3行号
            csoK3LineId = 'custcol_k3line_number', //销售订单K3行号
            cosDefultValue = '3',
            customformDefult = '152'; //Cross-company Trading


        //1.0 初始化采购订单
        poMain[gEntityFieldId] = 0;
        poMain[gCurrencyFieldId] = 0;
        poMain[gSubsidiaryFieldId] = 0;
        poMain[gTrandateFieldId] = new Date();
        poMain[cdgsFieldId] = false;

        for (var key in poMain) {
            if (poMain.hasOwnProperty(key)) {
                poMain[key] = poRecord.getValue({
                    fieldId: key
                });
            }
        }

        if (!poMain[cdgsFieldId]) {

            log.debug('poMain', poMain);
            log.debug('poRecord', poRecord);
            log.debug('poRecord.id', poRecord.id);

            //2.1 查询供应商，判断是否为公司间交易供应商
            vendorColumns = [{
                    name: cdsFieldId
                },
                {
                    name: gSubsidiaryFieldId
                }
            ];

            vendorFilters = [
                [gInternalidFieldId, "anyof", poMain[gEntityFieldId]]
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

            log.debug('vendorObj', vendorObj);

            //2.2如果存在代表子公司，则表示为公司间交易供应商，查询对应的公司间交易客户
            if (vendorObj[cdsFieldId]) {
                customerColumns = [{
                    name: gInternalidFieldId
                }];

                customerFilters = [
                    [cdsFieldId, "anyof", vendorObj[gSubsidiaryFieldId]],
                    'AND',
                    [gSubsidiaryFieldId, "anyof", vendorObj[cdsFieldId]]
                ];

                log.debug('customerFilters', customerFilters);

                customerSearchCriteria = {
                    type: 'customer',
                    filters: customerFilters,
                    columns: customerColumns
                };

                search.create(customerSearchCriteria).run().each(function (result, i) {

                    for (var j = 0; j < customerColumns.length; j++) {
                        customerObj[customerColumns[j]['name']] = result.getValue({
                            name: customerColumns[j]
                        });
                    }

                    return true;
                });

                log.debug('customerObj', customerObj);

                //3.如果查询到客户，则创建内部销售订单
                if (customerObj[gInternalidFieldId]) {
                    poLineCount = poRecord.getLineCount({
                        sublistId: gItemSublistId
                    });

                    for (var i = 0; i < poLineCount; i++) {

                        poItemObj = {};
                        poItemObj[gSlItemFieldId] = 0;
                        poItemObj[gSlRateFieldId] = 0;
                        poItemObj[gSlQuantityFieldId] = 0;
                        poItemObj[gSlLineFieldId] = 0;
                        poItemObj[ciprFieldId] = 0;
                        poItemObj[cipcFieldId] = 0;
                        poItemObj[civFieldId] = 0;
                        poItemObj[ciiupFieldId] = 0;
                        poItemObj[cildblFieldId] = 0;
                        poItemObj[cpoK3LineId] = 0;

                        for (var key in poItemObj) {

                            if (poItemObj.hasOwnProperty(key)) {
                                poItemObj[key] = poRecord.getSublistValue({
                                    sublistId: gItemSublistId,
                                    fieldId: key,
                                    line: i
                                });
                            }
                        }

                        poItemObj[gIdFieldId] = poRecord.id;

                        poItems.push(poItemObj);

                    }

                    log.debug('poItems', poItems);

                    // for (var i = 0; i < poItems.length; i++) {
                    //     poItems[i][lyddhFieldId] = poItems[i].id;
                    //     poItems[i][lyddlFieldId] = poItems[i].line;
                    //     delete poItems[i].id;
                    //     delete poItems[i].line;
                    // }

                    for (var i = 0; i < poItems.length; i++) {
                        //poItems[i][lyddhFieldId] = poItems[i].id;
                        //poItems[i][lyddlFieldId] = poItems[i].line;
                        //delete poItems[i].id;
                        //delete poItems[i].line;
                        soItemObj = {};

                        Object.keys(poItems[i]).forEach(function (result, index) {
                            if (result == gSlLineFieldId) {
                                soItemObj[lyddlFieldId] = poItems[i][result];
                            } else if (result == gIdFieldId) {
                                soItemObj[lyddhFieldId] = poItems[i][result]; //lyddhFieldId
                            } else if(result == cpoK3LineId){
                                soItemObj[csoK3LineId] = poItems[i][result];
                            } else {
                                soItemObj[result] = poItems[i][result];
                            }
                            return true;
                        });

                        soItems.push(soItemObj);
                    }

                    log.debug('soItems', soItems);

                    mainPayload[gCustomformField] = customformDefult;
                    mainPayload[ccoFieldId] = ordertypeDefultValue;
                    mainPayload[gEntityFieldId] = customerObj[gInternalidFieldId];
                    mainPayload[gCurrencyFieldId] = poMain[gCurrencyFieldId];
                    mainPayload[gTrandateFieldId] = poMain[gTrandateFieldId];
                    mainPayload[cosFieldId] = cosDefultValue;
                    mainPayload[cspFieldId] = true;
                    mainPayload[isCctFieldId] = true;

                    log.debug('mainPayload', mainPayload);


                    var option = {

                        mainPayload: mainPayload,
                        items: soItems
                    };

                    try {
                        var recId = soCommon.estimateCreationSTM(option);

                        log.debug('recId', recId);
                    } catch (e) {
                        log.error({
                            title: e.name,
                            details: e.message
                        });
                    }
                }
            }
        }
    }

    return {
        onAction: onAction
    }
});
/**
 *@NApiVersion 2.x
 *@NScriptType WorkflowActionScript
 *@author yuming Hu
 *@description  该脚本用于销售出库的审批
 */
define([
    '../../app/app_po_common.js',
    '../../app/app_so_common.js',
    'N/search',
    'N/record'
], function (
    poCommon,
    soCommon,
    search,
    record
) {
    var gfromAsnRecTypeId = 'salesorder',
        gCreatedfromFieldId = 'createdfrom',
        gItemSublistId = 'item',
        gSubsidiaryFieldId = 'subsidiary', //可用于事务处理上的子公司字段、客户主数据上的主要子公司字段
        gInternalidFieldId = 'internalid', //内部标示Id
        gCurrencyFieldId = 'currency',
        gEntityFieldId = 'entity',
        gApprovalstatusFieldId = 'approvalstatus',
        gIdFieldId = 'id',
        gTranidFieldId = 'tranid',
        gSlInventoryassignmentRecId = 'inventoryassignment',
        gSLinventorydetailFieldId = 'inventorydetail',
        gSlItemFieldId = 'item',
        gSlRateFieldId = 'rate',
        gSlLineFieldId = 'line',
        gSlQuantityFieldId = 'quantity',
        gSlLinenumberFieldId = 'linenumber',
        gSlIssueinventorynumberFieldId = 'issueinventorynumber',
        gSlIssueinventorynumberDisplayFieldId = 'issueinventorynumber_display',
        gSlLocationFieldId = 'location',
        gSlOrderlineFieldId = 'orderline',
        gSLReceiptinventorynumberFieldId = 'receiptinventorynumber',
        gOrderstatusFieldId = 'orderstatus',
        gShipstatusFieldId = 'shipstatus',
        gTrandateDateFieldId = 'trandate';

    function onAction(scriptContext) {
        autoMachine(scriptContext);
    }

    function autoMachine(scriptContext) {
        var iffRec = scriptContext.newRecord, //出库单记录
            poApprovalstatusDefaultValue = 2,
            ordertypeDefultValue = 11,
            orderstatusDefultValue = 'B',
            toPoCustomformDefultValue = '154', //154
            iffItemObj = {},
            iffItemLineCount,
            iffItemList = [],
            iffInventorydetailSubRec,
            iffInventorydetailSubLineCount,
            iffInventorydetailSubObj = {},
            createdfromValue,
            fromAsnRec, //销售订单记录
            cSoIdFieldId = 'custcol_salesorder', //销售订单号
            cSoLineFieldId = 'custcol_line', //销售订单行号
            csdcFieldId = 'custbody_source_doc_creator', //来源单据创建人
            cinterDisFieldId = 'custbody_sales_order_inter_discount', //公司间交易折扣率
            fromAsnFcFieldId = 'custbody_final_customer', //最终客户
            fromAsnWntFieldId = 'custbody_whether_ntercompany_transact', //是否公司间交易
            fromAsnMarkFieldId = 'custbody_mark', //寄售标示
            fromAsnRlFieldId = 'custbody_rece_locations', //寄售仓
            fromAsnordertypeFieldId = 'custbody_cust_ordertype', //销售订单类型
            slSourceSoIdFieldId = 'custcol_external', //来源订单号
            slSourceLineFieldId = 'custcol_sales_bank', //来源订单行号
            slCsidoFieldId = 'custcol_source_issue_doc_no', //来源出库单号
            slCsidlnFieldId = 'custcol_source_issue_doc_line_no', //来源出库行号
            fromIffMain = {}, //来源出库单主体信息
            fromAsnSoMain = {},
            fromAsnSoItemObj = {},
            fromAsnItemList = [],
            cdsFieldId = 'custentity_deputy_subsidiaries', //代表子公司（0210）
            customerColumns = [],
            customerFilters = [],
            customerSearchCriteria = {},
            customerMain = {},
            vendorFilters = [],
            vendorColumns = [],
            vendorSearchCriteria = {},
            vendorMain = {},
            toPoItemObj = {},
            toPoItemList = [],
            toPoMain = {},
            toPoOption = {},
            toPoRecId,
            toIrItemObj = {},
            toIrItemList = [],
            toIrMain = {},
            toIrOption = {},
            toIrRecId,
            toAsnItemObj = {},
            toAsnItemList = [],
            toAsnMain = {},
            toAsnOption = {},
            toAsnRecId,
            toIffItemObj = {},
            toIffItemList = [],
            toIffMain = {},
            toIffOption = {},
            toIffRecId,
            inventorydetailList = [],
            toIrInventorydetailObj = {},
            toIffInventorydetailObj = {},
            toLineValue = 0;

        createdfromValue = iffRec.getValue({
            fieldId: gCreatedfromFieldId
        });

        //初始化来源出库单主体字段
        fromIffMain[gTrandateDateFieldId] = 0;

        //赋值
        for (var key in fromIffMain) {
            if (fromIffMain.hasOwnProperty(key)) {
                fromIffMain[key] = iffRec.getValue({
                    fieldId: key
                });
            }
        }

        log.debug('fromIffMain', fromIffMain);

        try {
            //1.获取发货通知单记录
            fromAsnRec = record.load({
                type: 'salesorder',
                id: createdfromValue
            });

            //初始化发货通知单主体字段
            fromAsnSoMain[gEntityFieldId] = 0;
            fromAsnSoMain[gSubsidiaryFieldId] = 0;
            fromAsnSoMain[gCurrencyFieldId] = 0;
            fromAsnSoMain[fromAsnFcFieldId] = 0;
            fromAsnSoMain[fromAsnWntFieldId] = 0;
            fromAsnSoMain[fromAsnRlFieldId] = 0;
            fromAsnSoMain[fromAsnMarkFieldId] = 0;
            fromAsnSoMain[csdcFieldId] = 0;
            fromAsnSoMain[cinterDisFieldId] = 0;
            //fromAsnSoMain[fromAsnordertypeFieldId] = 0;

            //赋值
            for (var key in fromAsnSoMain) {
                if (fromAsnSoMain.hasOwnProperty(key)) {
                    fromAsnSoMain[key] = fromAsnRec.getValue({
                        fieldId: key
                    });
                }
            }

            log.debug('fromAsnSoMain', fromAsnSoMain);

            //货品行数
            soLineCount = fromAsnRec.getLineCount({
                sublistId: gItemSublistId
            });

            //货品行
            for (var i = 0; i < soLineCount; i++) {
                fromAsnSoItemObj = {}
                fromAsnSoItemObj[gSlItemFieldId] = '';
                fromAsnSoItemObj[gSlRateFieldId] = 0;
                fromAsnSoItemObj[gSlQuantityFieldId] = 0;
                fromAsnSoItemObj[gSlLineFieldId] = 0;
                fromAsnSoItemObj[slSourceSoIdFieldId] = 0;
                fromAsnSoItemObj[slSourceLineFieldId] = 0;
                fromAsnSoItemObj[slSourceSoIdFieldId] = 0; //来源订单号
                fromAsnSoItemObj[slSourceLineFieldId] = 0; //来源订单行号

                for (var key in fromAsnSoItemObj) {

                    if (fromAsnSoItemObj.hasOwnProperty(key)) {
                        fromAsnSoItemObj[key] = fromAsnRec.getSublistValue({
                            sublistId: gItemSublistId,
                            fieldId: key,
                            line: i
                        });
                    }
                }

                fromAsnItemList.push(fromAsnSoItemObj);
            }

            log.debug('fromAsnItemList', fromAsnItemList);

            //2.获取出库单货品行信息
            iffItemLineCount = iffRec.getLineCount({
                sublistId: gItemSublistId
            });
            log.debug('iffItemLineCount', iffItemLineCount);

            for (var i = 0; i < iffItemLineCount; i++) {
                //初始化
                iffItemObj = {};
                iffItemObj[gSlItemFieldId] = 0;
                iffItemObj[gSlQuantityFieldId] = 0;
                iffItemObj[gSlLineFieldId] = 0;
                iffItemObj[gSlOrderlineFieldId] = 0;
                //iffItemObj[gSlLocationFieldId] = fromAsnSoMain[fromAsnRlFieldId]; //获取来源发货通知单的寄售仓地点，用于目标的接收出库
                iffItemObj[gSLinventorydetailFieldId] = [];

                iffRec.selectLine({
                    sublistId: gItemSublistId,
                    line: i
                });

                for (var key in iffItemObj) {

                    if (iffItemObj.hasOwnProperty(key)) {

                        if (key != gSLinventorydetailFieldId) {
                            iffItemObj[key] = iffRec.getCurrentSublistValue({
                                sublistId: gItemSublistId,
                                fieldId: key
                            });
                        } else {
                            iffInventorydetailSubRec = iffRec.getCurrentSublistSubrecord({
                                sublistId: gItemSublistId,
                                fieldId: key
                            });

                            iffInventorydetailSubLineCount = iffInventorydetailSubRec.getLineCount({
                                sublistId: gSlInventoryassignmentRecId
                            });

                            for (var j = 0; j < iffInventorydetailSubLineCount; j++) {

                                //初始化
                                iffInventorydetailSubObj = {};
                                iffInventorydetailSubObj[gSlIssueinventorynumberFieldId] = '';
                                iffInventorydetailSubObj[gSlIssueinventorynumberDisplayFieldId] = '';
                                iffInventorydetailSubObj[gSlQuantityFieldId] = 0;

                                //注释之前的代码
                                // for (var skey in iffInventorydetailSubObj) {
                                //     if (iffInventorydetailSubObj.hasOwnProperty(skey)) {
                                //         iffInventorydetailSubObj[skey] = iffInventorydetailSubRec.getSublistValue({
                                //             sublistId: gSlInventoryassignmentRecId,
                                //             fieldId: skey,
                                //             line: j
                                //         });
                                //     }
                                // }

                                for (var skey in iffInventorydetailSubObj) {
                                    if (iffInventorydetailSubObj.hasOwnProperty(skey)) {
                                        if (skey == gSlIssueinventorynumberFieldId) {
                                            iffInventorydetailSubObj[skey] = iffInventorydetailSubRec.getSublistText({
                                                sublistId: gSlInventoryassignmentRecId,
                                                fieldId: skey,
                                                line: j
                                            });
                                        } else {
                                            iffInventorydetailSubObj[skey] = iffInventorydetailSubRec.getSublistValue({
                                                sublistId: gSlInventoryassignmentRecId,
                                                fieldId: skey,
                                                line: j
                                            });
                                        }
                                    }
                                }

                                iffItemObj[key].push(iffInventorydetailSubObj);
                            }
                        }
                    }
                }

                iffItemList.push(iffItemObj);
            }

            log.debug('iffItemList', iffItemList);

            //3.合并出库货品行与发货通知单货品行
            for (var i = 0; i < iffItemList.length; i++) {
                for (var j = 0; j < fromAsnItemList.length; j++) {
                    if (iffItemList[i][gSlOrderlineFieldId] == fromAsnItemList[j][gSlLineFieldId]) {
                        iffItemList[i][gSlRateFieldId] = fromAsnItemList[j][gSlRateFieldId];
                        iffItemList[i][slSourceSoIdFieldId] = fromAsnItemList[j][slSourceSoIdFieldId];
                        iffItemList[i][slSourceLineFieldId] = fromAsnItemList[j][slSourceLineFieldId];
                    }
                }
            }

            log.debug('iffItemList', iffItemList);

            //4.查询客户，判断是否为公司间交易客户
            customerColumns = [{
                    name: cdsFieldId
                },
                {
                    name: gSubsidiaryFieldId //主要子公司
                }
            ];

            customerFilters = [
                ['internalid', 'anyof', fromAsnSoMain[gEntityFieldId]]
            ]

            customerSearchCriteria = {
                type: 'customer',
                filters: customerFilters,
                columns: customerColumns
            };

            search.create(customerSearchCriteria).run().each(function (result, i) {

                customerMain = {};

                for (var j = 0; j < customerColumns.length; j++) {
                    var cc = customerColumns[j]['name'];

                    customerMain[cc] = result.getValue({
                        name: customerColumns[j]
                    });
                }

                return true;
            });

            log.debug('customerMain', customerMain);

            //如果存在代表子公司，则表示为公司间交易
            if (customerMain[cdsFieldId]) {
                //5.查询供应商，获取内部交易采购订单供应商
                vendorFilters = [
                    ["custentity_deputy_subsidiaries", "anyof", customerMain[gSubsidiaryFieldId]],
                    "AND",
                    ["subsidiary", "anyof", customerMain[cdsFieldId]]
                ];

                vendorColumns = [{
                        name: gInternalidFieldId
                    },
                    {
                        name: gSubsidiaryFieldId
                    }
                ];

                vendorSearchCriteria = {
                    type: 'vendor',
                    filters: vendorFilters,
                    columns: vendorColumns
                };

                log.debug('vendorSearchCriteria', vendorSearchCriteria);

                search.create(vendorSearchCriteria).run().each(function (result, i) {

                    vendorMain = {};

                    for (var j = 0; j < vendorColumns.length; j++) {
                        var vc = vendorColumns[j]['name'];

                        vendorMain[vc] = result.getValue({
                            name: vendorColumns[j]
                        });
                    }

                    return true;
                });

                log.debug('vendorMain', vendorMain);
            }

            //6.如果存在供应商则执行以下操作
            if (vendorMain[gInternalidFieldId]) {
                //6.1预处理数据
                toPoMain[gCreatedfromFieldId] = toPoCustomformDefultValue;
                toPoMain[gEntityFieldId] = vendorMain[gInternalidFieldId];
                toPoMain[gCurrencyFieldId] = fromAsnSoMain[gCurrencyFieldId];
                toPoMain[gApprovalstatusFieldId] = poApprovalstatusDefaultValue;
                toPoMain[csdcFieldId] = fromAsnSoMain[csdcFieldId];
                toPoMain[gTrandateDateFieldId] = fromIffMain[gTrandateDateFieldId];
                toPoMain[fromAsnWntFieldId] = true;

                toAsnMain[gEntityFieldId] = fromAsnSoMain[fromAsnFcFieldId];
                toAsnMain[gOrderstatusFieldId] = orderstatusDefultValue;

                log.debug('toPoMain', toPoMain);
                log.debug('toAsnMain', toAsnMain);


                for (var i = 0; i < iffItemList.length; i++) {
                    //初始化
                    toLineValue = i + 1;
                    toPoItemObj = {};
                    toIrItemObj = {};
                    toIffItemObj = {};

                    toPoItemObj[gSlItemFieldId] = 0;
                    toPoItemObj[gSlQuantityFieldId] = 0;
                    toPoItemObj[gSlRateFieldId] = 0;
                    //toPoItemObj[slSourceLineFieldId] = 0;

                    //toIrItemObj[gSlItemFieldId] = 0;
                    toIrItemObj[gSlQuantityFieldId] = 0;
                    toIrItemObj[gSLinventorydetailFieldId] = [];

                    //toIffItemObj[gSlItemFieldId] = 0;
                    toIffItemObj[gSlQuantityFieldId] = 0;
                    toIffItemObj[gSLinventorydetailFieldId] = [];

                    for (var key in toPoItemObj) {

                        if (toPoItemObj.hasOwnProperty(key)) {
                            toPoItemObj[key] = iffItemList[i][key];
                        }
                    }
                    log.debug('toPoItemObj', toPoItemObj);

                    for (var key in toIrItemObj) {

                        if (toIrItemObj.hasOwnProperty(key)) {

                            if (key != gSLinventorydetailFieldId) {
                                toIrItemObj[key] = iffItemList[i][key];
                            } else {
                                inventorydetailList = iffItemList[i][key];

                                for (var j = 0; j < inventorydetailList.length; j++) {

                                    toIrInventorydetailObj = {};
                                    toIrInventorydetailObj[gSLReceiptinventorynumberFieldId] = inventorydetailList[j][gSlIssueinventorynumberFieldId];
                                    toIrInventorydetailObj[gSlQuantityFieldId] = inventorydetailList[j][gSlQuantityFieldId];

                                    toIrItemObj[key].push(toIrInventorydetailObj);
                                }
                            }
                        }
                    }

                    log.debug('toIrItemObj', toIrItemObj);

                    for (var key in toIffItemObj) {

                        if (toIffItemObj.hasOwnProperty(key)) {

                            if (key != gSLinventorydetailFieldId) {
                                toIffItemObj[key] = iffItemList[i][key];
                            } else {
                                inventorydetailList = iffItemList[i][key];

                                for (var j = 0; j < inventorydetailList.length; j++) {

                                    toIffInventorydetailObj = {};
                                    toIffInventorydetailObj[gSlIssueinventorynumberFieldId] = inventorydetailList[j][gSlIssueinventorynumberFieldId];
                                    toIffInventorydetailObj[gSlQuantityFieldId] = inventorydetailList[j][gSlQuantityFieldId];

                                    toIffItemObj[key].push(toIffInventorydetailObj);
                                }
                            }
                        }
                    }

                    log.debug('toIffItemObj', toIffItemObj);

                    toPoItemObj[gSlLineFieldId] = toLineValue;
                    toPoItemObj[slCsidoFieldId] = createdfromValue;
                    toPoItemObj[slCsidlnFieldId] = iffItemList[i][gSlLineFieldId];
                    toPoItemObj[gSlLocationFieldId] = fromAsnSoMain[fromAsnRlFieldId];
                    //toIrItemObj[slSourceSoIdFieldId] = createdfromValue;
                    toIrItemObj[gSlLineFieldId] = toLineValue;
                    toIffItemObj[gSlLineFieldId] = toLineValue;
                    toIrItemObj[gSlLocationFieldId] = fromAsnSoMain[fromAsnRlFieldId]; //添加接收地点
                    toIffItemObj[gSlLocationFieldId] = fromAsnSoMain[fromAsnRlFieldId];

                    log.debug('toPoItemObj', toPoItemObj);


                    toPoItemList.push(toPoItemObj);
                    toIrItemList.push(toIrItemObj);
                    toIffItemList.push(toIffItemObj);
                }

                //toAsnItemList = toPoItemList;
                for (var i = 0; i < toPoItemList.length; i++) {
                    toAsnItemObj = {};
                    // slCsidoFieldId = 'custcol_source_issue_doc_no_2', //来源出库单号
                    // slCsidlnFieldId = 'custcol_source_issue_doc_line_no_2', //来源出库行号
                    toAsnItemObj[gSlItemFieldId] = toPoItemList[i][gSlItemFieldId];
                    toAsnItemObj[gSlQuantityFieldId] = toPoItemList[i][gSlQuantityFieldId];
                    //toAsnItemObj[slCsidlnFieldId] = toPoItemList[i][slCsidlnFieldId];
                    if (fromAsnSoMain[cinterDisFieldId]) {
                        toAsnItemObj[gSlRateFieldId] = toPoItemList[i][gSlRateFieldId] * 100 / fromAsnSoMain[cinterDisFieldId];
                    } else {
                        toAsnItemObj[gSlRateFieldId] = toPoItemList[i][gSlRateFieldId];
                    }
                    toAsnItemObj[gSlLineFieldId] = toPoItemList[i][gSlLineFieldId];
                    toAsnItemObj[slCsidoFieldId] = toPoItemList[i][slCsidoFieldId];
                    toAsnItemObj[slCsidlnFieldId] = toPoItemList[i][slCsidlnFieldId];
                    toAsnItemObj[gSlLocationFieldId] = toPoItemList[i][gSlLocationFieldId];
                    toAsnItemList.push(toAsnItemObj);
                }
                log.debug('toPoItemList', toPoItemList);
                log.debug('toIrItemList', toIrItemList);
                log.debug('toAsnItemList', toAsnItemList);
                log.debug('toIffItemList', toIffItemList);

                //6.2 创建采购订单
                toPoOption = {
                    main: toPoMain,
                    items: toPoItemList,
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                };

                log.debug('toPoOption', toPoOption);

                toPoRecId = poCommon.purchaseorderCreationSt(toPoOption);

                if (toPoRecId) {
                    //6.3创建采购接收
                    toIrMain[gCreatedfromFieldId] = toPoRecId;

                    toIrOption = {
                        main: toIrMain,
                        items: toIrItemList,
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    };
                    log.debug('toIrOption',toIrOption)
                    toIrRecId = poCommon.itemreceiptCreationSt(toIrOption);
                }

                //6.4创建发货通知单
                toAsnOption = {
                    main: toAsnMain,
                    items: toAsnItemList,
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                };

                log.debug('toAsnOption', toAsnOption);

                var toAsnRecId = soCommon.salesorderCreationSt(toAsnOption);

                //6.5创建出库单
                if (toIrRecId && toAsnRecId) {
                    toIffMain[gCreatedfromFieldId] = toAsnRecId;
                    toIffMain[gShipstatusFieldId] = 'C';

                    toIffOption = {

                        main: toIffMain,
                        items: toIffItemList,
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    };

                    toIffRecId = soCommon.itemfulfillmentCreationSt(toIffOption);
                }
            }


        } catch (e) {
            log.error({
                title: e.name,
                details: e.message
            });
        }
    }

    return {
        onAction: onAction
    }
});
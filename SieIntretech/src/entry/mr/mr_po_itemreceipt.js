/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */
define([
    'N/runtime',
    '../../app/app_wip_common.js',
    'N/format',
    'N/record',
    'N/search',
    '../../app/app_inv_common.js',
    '../../app/moment'
], function (
    runtime,
    wipCommon,
    format,
    record,
    search,
    invCommon,
    moment
) {

    var gCreatedfromFieldId = 'createdfrom',
        gInternalidFieldId = 'internalid',
        gCwcFieldId = 'custbody_wip_createdfrom',
        gCplptFieldId = 'custbody_po_list_pur_type',
        gSlItemId = 'item',
        gSlItemItemFieldId = 'item',
        gSlItemLineFieldId = 'line',
        gSlItemQuantityFieldId = 'quantity',
        gQuantityonhandFieldId = 'quantityonhand',
        gSlItemLocationFieldId = 'location',
        gSlItemCwbnFieldId = 'custcol_wip_batch_number', //批次
        gSlItemInventorydetailFieldId = 'inventorydetail',
        gSlInventoryassignmentId = 'inventoryassignment',
        gSlBinnumberFieldId = 'binnumber',
        gSlReceiptinventorynumberFieldId = 'receiptinventorynumber',
        gWorkorderRecordTypeId = 'workorder',
        gCovbFieldId = 'custbody_osp_vendor_bin', //委外供应商库位
        gAssemblyitemFieldId = 'assemblyitem',
        gSubsidiaryFieldId = 'subsidiary',
        gCwopFieldId = 'custcol_wip_placeofreceipt_outsource', //收货地点（委外）
        gItemreceiveFieldId = 'itemreceive',
        gCwwtlFieldId = 'custcol_wip_wo_text_link', //工单
        gCwoasFieldId = 'custcol_wip_os_automatic_state', //委外自动化状态
        wyTypeValue = '5',
        mrScriptId = 'customscript_mr_po_itemreceipt'; //MR 入库单委外自动化

    function getWorkorderInfo(option) {
        var woId = option.woId,
            rtnMsg = {
                status: 'E',
                info: {
                    main: {},
                    item: [],
                    operation: []
                }
            },
            main,
            woRec,
            itemObj = {},
            operationObj = {},
            itemLineCount,
            operationFilters = [],
            operationColumns = [],
            operationSearchCriteria = {},
            operationObj = {},
            operationList = [];

        try {
            //加载记录类型
            var woRec = record.load({
                type: gWorkorderRecordTypeId,
                id: woId
            });

            main = rtnMsg.info.main;
            rtnMsg.info.main[gCovbFieldId] = '';
            rtnMsg.info.main[gAssemblyitemFieldId] = '';
            rtnMsg.info.main[gSubsidiaryFieldId] = '';

            for (var key in main) {

                if (main.hasOwnProperty(key)) {

                    rtnMsg.info.main[key] = woRec.getValue({
                        fieldId: key
                    });
                }
            };

            itemLineCount = woRec.getLineCount({
                sublistId: gSlItemId
            });

            for (var i = 0; i < itemLineCount; i++) {
                itemObj = {
                    item: '',
                    bomquantity: 0,
                    componentyield: '',
                    quantity: 0,
                    units: ''
                };

                for (var key in itemObj) {

                    if (itemObj.hasOwnProperty(key)) {

                        itemObj[key] = woRec.getSublistValue({
                            sublistId: gSlItemId,
                            fieldId: key,
                            line: i
                        });
                    }
                };

                rtnMsg.info.item.push(itemObj);
            }

            //查询操作
            operationColumns = [{
                    name: 'sequence', //操作顺序
                    join: 'manufacturingOperationTask',
                    sortdir: "ASC"
                },
                {
                    name: 'name', //工序名称
                    join: 'manufacturingOperationTask'
                }
            ];

            operationFilters = [
                ["type", "anyof", "WorkOrd"],
                "AND",
                ["mainline", "is", "T"],
                "AND",
                ["internalid", "anyof", woId]
            ]

            operationSearchCriteria = {
                type: 'workorder',
                filters: operationFilters,
                columns: operationColumns
            };

            search.create(operationSearchCriteria).run().each(function (result, i) {

                operationObj = {};

                for (var j = 0; j < operationColumns.length; j++) {
                    var cc = operationColumns[j]['name'];

                    operationObj[cc] = result.getValue({
                        name: operationColumns[j]
                    });
                }

                operationList.push(operationObj);

                return true;
            });

            rtnMsg.info.operation = operationList;

            rtnMsg.status = 'S';

        } catch (e) {
            rtnMsg.message = e.message;

            log.error({
                title: '提示',
                details: JSON.stringify(rtnMsg)
            });
        }

        return rtnMsg;
    }

    function getShelfLifeInfo(option) {
        var subsidiary = option.subsidiary,
            item = option.item,
            rtnMsg = {
                status: 'E',
                info: {
                    main: {
                        life: 0
                    }
                }
            },
            itemFilters = [],
            itemColumns = [],
            itemSearchCriteria = {};

        try {
            itemFilters = [
                ["internalid", "anyof"].concat(item),
                "AND",
                ["custrecord_link_field.custrecord_intercompany_subsidiary", "anyof", subsidiary], //"26"
                "AND",
                ["custrecord_link_field.custrecord_material_attribute", "anyof", "2"]
            ];
            itemColumns = [{
                    name: 'internalid' //客户
                },
                {
                    name: 'custrecord_shelf_life', //
                    join: "CUSTRECORD_LINK_FIELD"
                }
            ];
            var itemSearchCriteria = {
                type: 'item',
                filters: itemFilters,
                columns: itemColumns
            };

            search.create(itemSearchCriteria).run().each(function (result, i) {

                var life = result.getValue({
                    name: itemColumns[1]
                });

                if (life) {
                    rtnMsg.info.main.life = life;
                }

                return true;
            });

            rtnMsg.status = 'S';

        } catch (e) {
            rtnMsg.message = e.message;

            log.error({
                title: '提示',
                details: JSON.stringify(rtnMsg)
            });
        }

        return rtnMsg;
    }

    function getItemQtyOnhand(option) {

        var location = option[gSlItemLocationFieldId],
            itemIds = option.itemIds,
            binnumber = option[gCovbFieldId],
            woId = option.woId,
            rtnMsg = {
                status: 'E',
                info: {}
            },
            itemreceiptFilters = [],
            itemreceiptColumns = [],
            itemreceiptSearchCriteria = {},
            itemreceiptObj = {},
            itemreceiptList = [],
            itemFilters = [],
            itemColumns = [],
            itemSearchCriteria = {},
            itemObj = {},
            itemList = [],
            itemreceiptTotalKey,
            itemreceiptTotalMap = {},
            itemOnhandTotalKey;

        //查询操作
        itemreceiptColumns = [{
                name: "item",
                summary: "GROUP"
            },
            {
                join: "inventoryDetail",
                name: "binnumber",
                summary: "GROUP"
            },
            {
                join: "inventoryDetail",
                name: "inventorynumber",
                summary: "GROUP",
                sortdir: "ASC"
            },
            {
                join: "inventoryDetail",
                name: "quantity",
                summary: "SUM"
            },
            {
                name: "location",
                summary: "GROUP"
            },
            {
                formula: "{inventorydetail.inventorynumber}",
                name: "formulatext",
                summary: "GROUP"
            }
        ];

        itemreceiptFilters = [
            ["type", "anyof", "ItemRcpt"],
            "AND",
            ["createdfrom.type", "anyof", "TrnfrOrd"],
            "AND",
            ["mainline", "is", "F"],
            "AND",
            ["createdfrom.custbody_wip_work_order_id", "anyof", woId], //woId,159574
            "AND",
            ["cogs", "is", "F"],
            "AND",
            ["shipping", "is", "F"],
            "AND",
            ["taxline", "is", "F"],
            "AND",
            ["createdfrom.custbody_wip_transfer_type", "anyof", wyTypeValue],
            "AND",
            ["inventorydetail.inventorynumber", "noneof", "@NONE@"],
            "AND",
            ["item", "anyof"].concat(itemIds),
            "AND",
            ["location", "anyof", location],
            "AND",
            ["inventorydetail.binnumber", "anyof", binnumber],
            "AND",
            ["inventorydetail.quantity", "greaterthan", "0"]
        ]

        itemreceiptSearchCriteria = {
            type: 'itemreceipt',
            filters: itemreceiptFilters,
            columns: itemreceiptColumns
        };

        //货品上的查询字段及条件
        itemColumns = [{
                join: "inventoryNumberBinOnHand",
                name: "quantityavailable",
                summary: "SUM"
            },
            {
                join: "inventoryNumberBinOnHand",
                name: "location",
                summary: "GROUP"
            },
            {
                join: "inventoryNumberBinOnHand",
                name: "binnumber",
                summary: "GROUP"
            },
            {
                join: "inventoryNumberBinOnHand",
                name: "inventorynumber",
                sortdir: "ASC",
                summary: "GROUP"
            },
            {
                join: "inventoryNumberBinOnHand",
                name: "quantityonhand",
                summary: "SUM"
            },
            {
                join: "inventoryNumberBinOnHand",
                name: "quantityonhand",
                summary: "SUM"
            },
            {
                name: "internalid",
                summary: "GROUP"
            }
        ];

        itemFilters = [
            ["internalid", "anyof"].concat(itemIds),
            "AND",
            ["inventorynumberbinonhand.location", "anyof", location],
            "AND",
            ["inventorynumberbinonhand.binnumber", "anyof", binnumber],
            "AND",
            ["inventorynumberbinonhand.quantityonhand", "greaterthan", "0"],
            "AND",
            ["inventorynumberbinonhand.quantityavailable", "greaterthan", "0"]
        ]

        itemSearchCriteria = {
            type: 'item',
            filters: itemFilters,
            columns: itemColumns
        };

        try {
            search.create(itemreceiptSearchCriteria).run().each(function (result, i) {

                itemreceiptObj = {};

                for (var j = 0; j < itemreceiptColumns.length; j++) {
                    var cc = itemreceiptColumns[j]['name'];

                    itemreceiptObj[cc] = result.getValue({
                        name: itemreceiptColumns[j]
                    });
                }

                itemreceiptList.push(itemreceiptObj);

                return true;
            });

            search.create(itemSearchCriteria).run().each(function (result, i) {

                itemObj = {};

                for (var j = 0; j < itemColumns.length; j++) {
                    var cc = itemColumns[j]['name'];

                    itemObj[cc] = result.getValue({
                        name: itemColumns[j]
                    });
                }

                itemList.push(itemObj);

                return true;
            });

            //合计接收批次数据
            for (var i = 0; i < itemreceiptList.length; i++) {
                itemreceiptTotalKey = itemreceiptList[i][gSlItemItemFieldId];
                if (!itemreceiptTotalMap[itemreceiptTotalKey]) {
                    itemreceiptTotalMap[itemreceiptTotalKey] = {};
                    itemreceiptTotalMap[itemreceiptTotalKey].irInfo = {};
                    itemreceiptTotalMap[itemreceiptTotalKey].irInfo.total = Number(itemreceiptList[i][gSlItemQuantityFieldId]);
                    itemreceiptTotalMap[itemreceiptTotalKey].irInfo.details = [];
                    itemreceiptTotalMap[itemreceiptTotalKey].irInfo.details.push(itemreceiptList[i]);
                    //itemreceiptTotalMap[itemreceiptTotalKey].total = Number(itemreceiptList[i][gSlItemQuantityFieldId]);
                    //itemreceiptTotalMap[itemreceiptTotalKey].details = [];
                    //itemreceiptTotalMap[itemreceiptTotalKey].details.push(itemreceiptList[i]);
                } else {
                    itemreceiptTotalMap[itemreceiptTotalKey].irInfo.total += Number(itemreceiptList[i][gSlItemQuantityFieldId]);
                    itemreceiptTotalMap[itemreceiptTotalKey].irInfo.details.push(itemreceiptList[i]);
                }
            }

            for (var i = 0; i < itemList.length; i++) {
                itemOnhandTotalKey = itemList[i][gInternalidFieldId];

                if (!itemreceiptTotalMap[itemOnhandTotalKey]) {
                    itemreceiptTotalMap[itemOnhandTotalKey] = {};
                    itemreceiptTotalMap[itemOnhandTotalKey].onhandInfo = {};
                    itemreceiptTotalMap[itemOnhandTotalKey].onhandInfo.total = Number(itemList[i][gQuantityonhandFieldId]);
                    itemreceiptTotalMap[itemOnhandTotalKey].onhandInfo.details = [];
                    itemreceiptTotalMap[itemOnhandTotalKey].onhandInfo.details.push(itemList[i]);

                    if (!itemreceiptTotalMap[itemOnhandTotalKey].irInfo) {
                        itemreceiptTotalMap[itemOnhandTotalKey].irInfo = {};
                        itemreceiptTotalMap[itemOnhandTotalKey].irInfo.total = 0;
                        itemreceiptTotalMap[itemOnhandTotalKey].irInfo.details = [];
                    }
                } else {
                    if (!itemreceiptTotalMap[itemOnhandTotalKey].onhandInfo) {
                        itemreceiptTotalMap[itemOnhandTotalKey].onhandInfo = {};
                        itemreceiptTotalMap[itemOnhandTotalKey].onhandInfo.total = Number(itemList[i][gQuantityonhandFieldId]);
                        itemreceiptTotalMap[itemOnhandTotalKey].onhandInfo.details = [];
                        itemreceiptTotalMap[itemOnhandTotalKey].onhandInfo.details.push(itemList[i]);
                    } else {
                        itemreceiptTotalMap[itemOnhandTotalKey].onhandInfo.total += Number(itemList[i][gQuantityonhandFieldId]);
                        itemreceiptTotalMap[itemOnhandTotalKey].onhandInfo.details.push(itemList[i]);
                    }
                }
            }

            rtnMsg.status = 'S';
            rtnMsg.info = itemreceiptTotalMap;

        } catch (e) {
            rtnMsg.message = e.message;

            log.error({
                title: '提示',
                details: JSON.stringify(rtnMsg)
            });
        }

        return rtnMsg;
    }

    /**
     * 
     * @param {*} context 
     * @description 更新订单转移状态
     */
    function updateAutomatizationStatus(option) {
        var id = option.id,
            line = option.line,
            status = option.status,
            irRec,
            irItemLineCount,
            lineValue; //工单号

        irRec = record.load({
            type: 'itemreceipt',
            id: id
        });

        irItemLineCount = irRec.getLineCount({
            sublistId: gSlItemId
        });

        for (var i = 0; i < irItemLineCount; i++) {


            lineValue = irRec.getSublistValue({
                sublistId: gSlItemId,
                fieldId: gSlItemLineFieldId,
                line: i
            });

            if (lineValue == line) {
                irRec.setSublistValue({
                    sublistId: gSlItemId,
                    fieldId: gCwoasFieldId,
                    line: i,
                    value: status //2
                });
            }
        }

        irRec.save({
            enableSourcing: false,
            ignoreMandatoryFields: true
        });
    }

    function getInputData() {
        var currentScript = runtime.getCurrentScript(),
            parameters = currentScript.getParameter({
                name: 'custscript_params_wcandtranscreation'
            });

        log.debug('parameters', parameters);

        return JSON.parse(parameters);
    }

    function map(context) {
        var mapKey = context.key,
            mapJsonValue = JSON.parse(context.value),
            irObj = {};

        for (var i = 0; i < mapJsonValue.length; i++) {
            irObj = {};
            irObj.irid = mapKey;
            irObj.item = mapJsonValue[i];

            context.write({
                key: mapJsonValue[i][gSlItemLineFieldId],
                value: irObj
            });
        }
    }

    function reduce(context) {
        // var reduceKey = context.key,
        //     reduceJsonValues = JSON.parse(context.values);

        // log.debug('reduceKey', reduceKey);
        // log.debug('reduceJsonValues', reduceJsonValues);
        //log.debug('context', context);

        var reduceJsonValueCurrent = JSON.parse(context.values[0]),
            reduceKey = context.key,
            wgAndWzyDefaultValue = '2',
            wgAndzyDefaultValue = '3',
            wgzyTypeDefaultValue = '4',
            workorderInfo = {},
            workorderItemList = [],
            osnessItemIds = [],
            qtyOnhandOption = {},
            itemQtyOnhandInfo = {},
            woCompQty,
            irQty,
            onhandQty,
            irDetail,
            onhandDetail,
            finalDetail,
            component = [],
            componentObj = {},
            componentObjOs = {},
            componentinventorydetailObjOs = {},
            inventorydetailOs = [],
            componentinventorydetailObj = {},
            woCompOption,
            woCompId,
            transOption,
            transId,
            main,
            shelfLife;

        log.debug('reduceJsonValueCurrent', reduceJsonValueCurrent);
        workorderInfo = getWorkorderInfo({
            woId: reduceJsonValueCurrent[gSlItemId][gCwwtlFieldId]
        });

        log.debug('workorderInfo', workorderInfo);

        if (workorderInfo.status == 'S') {
            workorderItemList = workorderInfo.info.item;

            for (var i = 0; i < workorderItemList.length; i++) {
                //for (var j = 0; j < irItemList.length; j++) {
                if (workorderItemList[i][gSlItemItemFieldId] !== reduceJsonValueCurrent[gSlItemId][gSlItemItemFieldId]) {
                    osnessItemIds.push(workorderItemList[i][gSlItemItemFieldId]);
                }
                // }
            }
            log.debug('osnessItemIds', osnessItemIds);

            qtyOnhandOption = {
                location: reduceJsonValueCurrent[gSlItemId][gSlItemLocationFieldId],
                itemIds: osnessItemIds,
                custbody_osp_vendor_bin: workorderInfo.info.main.custbody_osp_vendor_bin,
                woId: reduceJsonValueCurrent[gSlItemId][gCwwtlFieldId]
            };

            log.debug('qtyOnhandOption', qtyOnhandOption);

            itemQtyOnhandInfo = getItemQtyOnhand(qtyOnhandOption);
            woCompQty = reduceJsonValueCurrent[gSlItemId][gSlItemQuantityFieldId];

            log.debug('itemQtyOnhandInfo', itemQtyOnhandInfo);
            log.debug('woCompQty', woCompQty);

            // now = moment().add(Number(woInfo.main.life), 'days');

            // pageRec.setValue({
            //     fieldId: 'custrecord_woc_date_due',
            //     value: now.toDate()
            // });

            //获取质保期


            shelfLife = getShelfLifeInfo({
                subsidiary: workorderInfo.info.main.subsidiary,
                item: workorderInfo.info.main.assemblyitem
            }).info.main.life;

            log.debug('shelfLife', shelfLife);

            main = {
                createdfrom: reduceJsonValueCurrent[gSlItemId][gCwwtlFieldId],
                startoperation: workorderInfo.info.operation[0].sequence,
                endoperation: workorderInfo.info.operation[workorderInfo.info.operation.length - 1].sequence,
                completedquantity: woCompQty,
                quantity: woCompQty,
                inventorydetail: [{
                    receiptinventorynumber: reduceJsonValueCurrent[gSlItemId][gSlItemCwbnFieldId],
                    quantity: woCompQty,
                    expirationdate: moment().add(shelfLife, 'days').toDate()
                }]
            };

            log.debug('main', main);

            for (var i = 0; i < osnessItemIds.length; i++) {
                irQty = itemQtyOnhandInfo.info[osnessItemIds[i]].irInfo.total;
                onhandQty = itemQtyOnhandInfo.info[osnessItemIds[i]].onhandInfo.total;

                irDetail = itemQtyOnhandInfo.info[osnessItemIds[i]].irInfo.details;
                onhandDetail = itemQtyOnhandInfo.info[osnessItemIds[i]].onhandInfo.details;

                if (woCompQty <= irQty && woCompQty <= onhandQty) {
                    finalDetail = irDetail;
                } else if (woCompQty > irQty && woCompQty <= onhandQty) {
                    finalDetail = onhandDetail;
                }

                componentObj = {
                    item: '',
                    quantity: 0,
                    componentinventorydetail: []
                    // componentinventorydetail: [{
                    //     issueinventorynumber: 4682,
                    //     quantity: 1
                    // }]
                };

                componentObj[gSlItemItemFieldId] = osnessItemIds[i];
                componentObj[gSlItemQuantityFieldId] = woCompQty;
                log.debug('finalDetail', finalDetail);

                for (var j = 0; j < finalDetail.length; j++) {
                    // componentinventorydetail = [],
                    //     componentinventorydetailObj = {};
                    componentinventorydetailObj = {
                        issueinventorynumber: '',
                        binnumber: '',
                        quantity: 0
                    };
                    var curQty = finalDetail[j]['quantity'] ? finalDetail[j]['quantity'] : finalDetail[j]['quantityonhand'];

                    log.debug('woCompQty', woCompQty);
                    log.debug('curQty', curQty);
                    if (woCompQty <= curQty) {
                        componentinventorydetailObj.issueinventorynumber =
                            finalDetail[j]['formulatext'] ? finalDetail[j]['formulatext'] : finalDetail[j]['inventorynumber'];
                        componentinventorydetailObj.quantity = woCompQty;
                        componentinventorydetailObj.binnumber = finalDetail[j]['binnumber'];

                        componentObj.componentinventorydetail.push(componentinventorydetailObj);
                        break;
                    } else {
                        componentinventorydetailObj.issueinventorynumber =
                            finalDetail[j]['formulatext'] ? finalDetail[j]['formulatext'] : finalDetail[j]['inventorynumber'];
                        componentinventorydetailObj.quantity = curQty;
                        componentinventorydetailObj.binnumber = finalDetail[j]['binnumber'];
                        componentObj.componentinventorydetail.push(componentinventorydetailObj);
                        woCompQty = woCompQty - curQty;
                    }
                }

                component.push(componentObj);

                log.debug('irQty', irQty);
                log.debug('onhandQty', onhandQty);
                log.debug('irDetail', irDetail);
                log.debug('onhandDetail', onhandDetail);
                log.debug('finalDetail', finalDetail);
            }

            log.debug('component', component);

            // componentObjOs = {},
            //     componentinventorydetailObjOs = {};
            //接收行上的货品信息
            componentObjOs = {
                item: reduceJsonValueCurrent[gSlItemId][gSlItemItemFieldId],
                quantity: reduceJsonValueCurrent[gSlItemId][gSlItemQuantityFieldId],
                componentinventorydetail: []
            };

            inventorydetailOs = reduceJsonValueCurrent[gSlItemId][gSlItemInventorydetailFieldId];

            for (var i = 0; i < inventorydetailOs.length; i++) {
                componentinventorydetailObjOs = {
                    issueinventorynumber: '',
                    binnumber: '',
                    quantity: 0
                };

                componentinventorydetailObjOs.issueinventorynumber = inventorydetailOs[i].receiptinventorynumber;
                componentinventorydetailObjOs.quantity = inventorydetailOs[i].quantity;
                componentinventorydetailObjOs.binnumber = inventorydetailOs[i].binnumber;

                componentObjOs.componentinventorydetail.push(componentinventorydetailObjOs);
            }

            log.debug('componentObjOs', componentObjOs);

            component.push(componentObjOs);

            woCompOption = {
                main: main,
                component: component,
                enableSourcing: true,
                ignoreMandatoryFields: true
            };

            log.debug('woCompOption', woCompOption);

            woCompId = invCommon.workordercompletionCreationStV2(woCompOption);
            log.debug('woCompId', woCompId);

            if (woCompId) {
                updateAutomatizationStatus({
                    id: reduceJsonValueCurrent.irid,
                    line: reduceKey,
                    status: wgAndWzyDefaultValue
                });

                var transOption = {

                    main: {
                        subsidiary: workorderInfo.info.main.subsidiary,
                        trandate: new Date(),
                        location: reduceJsonValueCurrent[gSlItemId][gSlItemLocationFieldId],
                        transferlocation: reduceJsonValueCurrent[gSlItemId][gCwopFieldId],
                        custbody_wip_work_order_id: reduceJsonValueCurrent[gSlItemId][gCwwtlFieldId],
                        custbody_wip_transfer_type: wgzyTypeDefaultValue
                    },
                    items: [{
                        item: workorderInfo.info.main.assemblyitem,
                        adjustqtyby: woCompQty,
                        inventorydetail: [{
                            issueinventorynumber: reduceJsonValueCurrent[gSlItemId][gSlItemCwbnFieldId],
                            quantity: woCompQty
                        }]
                    }],
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                };

                log.debug('transOption', transOption);
                var transId = invCommon.inventorytransferCreationSt(transOption);

                if (transId) {
                    updateAutomatizationStatus({
                        id: reduceJsonValueCurrent.irid,
                        line: reduceKey,
                        status: wgAndzyDefaultValue
                    });
                }
                log.debug('transId', transId);
            }
        }
    }

    function summarize(summary) {
        var processResults = {};

        //记录错误
        if (summary.inputSummary.error) {
            log.error({
                title: 'Input Error',
                details: summary.inputSummary.error
            });
        }
        summary.mapSummary.errors.iterator().each(function (key, error, executionNo) {
            log.error({
                title: 'Map error key: ' + key,
                details: error
            });
            return true;
        });
        summary.reduceSummary.errors.iterator().each(function (key, error, executionNo) {
            log.error({
                title: 'Reduce error key: ' + key,
                details: error
            });
            return true;
        });

        //遍历结果
        summary.output.iterator().each(function (key, value) {
            processResults[key] = value;
            return true;
        });

        log.error({
            title: '成功处理结果摘要',
            details: processResults
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
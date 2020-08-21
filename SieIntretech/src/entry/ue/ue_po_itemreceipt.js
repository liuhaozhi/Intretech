/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/search',
    'N/log',
    '../../app/app_wip_common.js',
    'N/record',
    '../../app/app_inv_common.js',
    'N/task'
], function (search,
    log,
    wipCommon,
    record,
    invCommon,
    task) {

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
        gCovbFieldId = 'custbody_osp_vendor_bin',
        gAssemblyitemFieldId = 'assemblyitem',
        gSubsidiaryFieldId = 'subsidiary',
        gCwopFieldId = 'custcol_wip_placeofreceipt_outsource', //收货地点（委外）
        gItemreceiveFieldId = 'itemreceive',
        gCwwtlFieldId = 'custcol_wip_wo_text_link', //工单
        gCwoasFieldId = 'custcol_wip_os_automatic_state', //委外自动化状态
        wyTypeValue = '5',
        mrScriptId = 'customscript_mr_po_itemreceipt'; //MR 入库单委外自动化

    function getPurchaseInfo(option) {
        var poId = option.poId,
            purchaseColumns = [],
            purchaseFilters = [],
            purchaseSearchCriteria = [],
            purchaseObj = {},
            rtnMsg = {
                status: 'E',
                info: {}
            };

        purchaseColumns = [{
                name: gCwcFieldId
            },
            {
                name: gCplptFieldId
            }
        ];

        purchaseFilters = [
            ["type", "anyof", "PurchOrd"],
            "AND",
            ["mainline", "is", "T"],
            "AND",
            ["internalid", "anyof", poId] //purchaseOrder 65018
        ];

        purchaseSearchCriteria = {
            type: 'purchaseorder',
            filters: purchaseFilters,
            columns: purchaseColumns
        };

        try {
            search.create(purchaseSearchCriteria).run().each(function (result, i) {

                for (var j = 0; j < purchaseColumns.length; j++) {
                    purchaseObj[purchaseColumns[j]['name']] = result.getValue({
                        name: purchaseColumns[j]
                    });
                }

                rtnMsg.status = 'S';

                return true;
            });

            rtnMsg.info = purchaseObj;

            return rtnMsg;
        } catch (e) {
            log.error({
                title: e.name,
                details: e.message
            });
        }

    }

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

    function autoCreation(context) {
        var irRec = context.newRecord,
            poId,
            ptTypeOsValue = 3,
            purchaseInfo,
            irItemObj = {},
            irItemList = [],
            irItemLineCount,
            slItemInventorydetailRec,
            slInventorydetailLineCount,
            inventorydetailObj = {},
            inventorydetailList = [],
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
            obItems = [],
            component = [],
            componentObj = {},
            componentObjOs = {},
            componentinventorydetailObjOs = {},
            inventorydetailOs = [],
            componentinventorydetail = [],
            componentinventorydetailObj = {},
            woCompOption,
            woCompId,
            transOption,
            transId,
            main;

        poId = irRec.getValue({
            fieldId: gCreatedfromFieldId
        });

        purchaseInfo = getPurchaseInfo({
            poId: poId
        });

        log.debug('purchaseInfo', purchaseInfo);

        if (purchaseInfo.status == 'S') {
            //如果是委外采购订单并且工单不为空
            if (purchaseInfo.info[gCplptFieldId] == ptTypeOsValue &&
                purchaseInfo.info[gCwcFieldId]) {

                //1.获取接收单货品信息
                irItemLineCount = irRec.getLineCount({
                    sublistId: gSlItemId
                });

                for (var i = 0; i < irItemLineCount; i++) {
                    irItemObj = {};
                    irItemObj[gSlItemItemFieldId] = '';
                    irItemObj[gSlItemQuantityFieldId] = 0;
                    irItemObj[gSlItemLocationFieldId] = '';
                    irItemObj[gSlItemCwbnFieldId] = '';
                    irItemObj[gCwopFieldId] = '';
                    irItemObj[gSlItemInventorydetailFieldId] = [];

                    //赋值
                    for (var key in irItemObj) {
                        if (irItemObj.hasOwnProperty(key)) {
                            if (key !== gSlItemInventorydetailFieldId) {
                                irItemObj[key] = irRec.getSublistValue({
                                    sublistId: gSlItemId,
                                    fieldId: key,
                                    line: i
                                });
                            } else {
                                slItemInventorydetailRec = irRec.getSublistSubrecord({
                                    sublistId: gSlItemId,
                                    fieldId: key,
                                    line: i
                                });

                                slInventorydetailLineCount = slItemInventorydetailRec.getLineCount({
                                    sublistId: gSlInventoryassignmentId
                                });

                                for (var j = 0; j < slInventorydetailLineCount; j++) {
                                    inventorydetailObj = {};
                                    inventorydetailObj[gSlBinnumberFieldId] = '';
                                    inventorydetailObj[gSlReceiptinventorynumberFieldId] = '';
                                    inventorydetailObj[gSlItemQuantityFieldId] = 0;

                                    for (var skey in inventorydetailObj) {
                                        if (inventorydetailObj.hasOwnProperty(skey)) {
                                            inventorydetailObj[skey] = slItemInventorydetailRec.getSublistValue({
                                                sublistId: gSlInventoryassignmentId,
                                                fieldId: skey,
                                                line: j
                                            });
                                        }
                                    }

                                    inventorydetailList.push(inventorydetailObj);
                                }

                                irItemObj[key] = inventorydetailList;
                            }
                        }
                    }

                    //log.debug('irItemObj', irItemObj);
                    irItemList.push(irItemObj);
                }

                log.debug('irItemList', irItemList);

                //2.查询工单信息
                if (purchaseInfo.info[gCwcFieldId]) {
                    workorderInfo = getWorkorderInfo({
                        woId: purchaseInfo.info[gCwcFieldId]
                    });
                }

                log.debug('workorderInfo', workorderInfo);

                //3.查询工单反馈
                if (workorderInfo.status == 'S') {
                    workorderItemList = workorderInfo.info.item;

                    for (var i = 0; i < workorderItemList.length; i++) {
                        for (var j = 0; j < irItemList.length; j++) {
                            if (workorderItemList[i][gSlItemItemFieldId] !== irItemList[j][gSlItemItemFieldId]) {
                                osnessItemIds.push(workorderItemList[i][gSlItemItemFieldId]);
                            }
                        }
                    }
                    log.debug('osnessItemIds', osnessItemIds);

                    qtyOnhandOption = {
                        location: irItemList[0][gSlItemLocationFieldId],
                        itemIds: osnessItemIds,
                        custbody_osp_vendor_bin: workorderInfo.info.main.custbody_osp_vendor_bin,
                        woId: purchaseInfo.info.custbody_wip_createdfrom
                    };

                    log.debug('qtyOnhandOption', qtyOnhandOption);

                    itemQtyOnhandInfo = getItemQtyOnhand(qtyOnhandOption);
                    woCompQty = irItemList[0][gSlItemQuantityFieldId];
                    //obItems = workorderInfo.info.item;

                    log.debug('itemQtyOnhandInfo', itemQtyOnhandInfo);
                    //log.debug('obItems', obItems);
                    log.debug('woCompQty', woCompQty);

                    main = {
                        createdfrom: purchaseInfo.info.custbody_wip_createdfrom,
                        startoperation: workorderInfo.info.operation[0].sequence,
                        endoperation: workorderInfo.info.operation[workorderInfo.info.operation.length - 1].sequence,
                        completedquantity: woCompQty,
                        quantity: woCompQty,
                        inventorydetail: [{
                            receiptinventorynumber: irItemList[0][gSlItemCwbnFieldId],
                            quantity: woCompQty
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
                        item: irItemList[0][gSlItemItemFieldId],
                        quantity: irItemList[0][gSlItemQuantityFieldId],
                        componentinventorydetail: []
                    };

                    inventorydetailOs = irItemList[0][gSlItemInventorydetailFieldId];

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

                        // transOption,
                        // transId;
                        var transOption = {

                            main: {
                                subsidiary: workorderInfo.info.main.subsidiary,
                                trandate: new Date(),
                                location: irItemList[0][gSlItemLocationFieldId],
                                transferlocation: irItemList[0][gCwopFieldId]
                            },
                            items: [{
                                item: workorderInfo.info.main.assemblyitem,
                                adjustqtyby: woCompQty,
                                inventorydetail: [{
                                    issueinventorynumber: irItemList[0][gSlItemCwbnFieldId],
                                    quantity: woCompQty
                                }]
                            }],
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        };

                        log.debug('transOption', transOption);
                        var transId = invCommon.inventorytransferCreationSt(transOption);
                        log.debug('transId', transId);
                    }
                }
            }
        }
    }

    function autoCreatecompletion(context) {
        var workorderList = []; //工单查询参数
        var workorderTotalObj = {};
        var locationIds = [];
        var manufacturingroutingIds = [];
        //var mainLocationPayload = [];
        var quantity = 0;
        var receiptinventorynumber = '';
        var subsidiary = ''; //custcol_wip_placeofreceipt_outsource
        var transferlocation = '';
        var item = '';
        var purType = '';
        var transferTypeValue = 4;

        var newRecord = context.newRecord;

        var purchaseOrder = newRecord.getValue({
            fieldId: 'createdfrom'
        });

        if (purchaseOrder) {
            //1.0 查询采购订单相关信息
            var columns = [{
                    name: 'custbody_wip_createdfrom',
                    type: 'select'
                },
                {
                    name: 'custbody_po_list_pur_type',
                    type: 'select'
                }
            ];

            var filters = [
                ["type", "anyof", "PurchOrd"],
                "AND",
                ["mainline", "is", "T"],
                "AND",
                ["internalid", "anyof", purchaseOrder] //purchaseOrder 65018
            ];

            var sublistSearchCriteria = {
                type: 'purchaseorder',
                filters: filters,
                columns: columns
            };

            var searchObj = search.create(sublistSearchCriteria);

            searchObj.run().each(function (result, i) {
                var workorders = result.getValue({
                    name: columns[0]
                });

                purType = result.getText({
                    name: columns[1]
                });

                workorderList = workorders.split(',');
                return true;
            });

            log.debug('采购订单类型', purType);

            if (purType == '委外采购') {

                var lineCount = newRecord.getLineCount({
                    sublistId: 'item'
                });

                //委外订单，只有一个货品，只取第一行
                if (lineCount) {

                    var subsidiary = newRecord.getValue({
                        fieldId: 'subsidiary'
                    });

                    quantity = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: 0
                    });

                    receiptinventorynumber = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_wip_batch_number',
                        line: 0
                    });

                    transferlocation = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_wip_placeofreceipt_outsource',
                        line: 0
                    });

                    item = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: 0
                    });
                }

                if (workorderList) {
                    filters = [
                        ["type", "anyof", "WorkOrd"],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND",
                        ["internalid", "anyof"].concat(workorderList)
                    ];

                    columns = [{
                            name: 'internalid'
                        },
                        {
                            name: 'quantity'
                        },
                        {
                            name: 'enddate',
                            sortdir: 'ASC'
                        },
                        {
                            name: 'manufacturingrouting'
                        },
                        {
                            name: 'location'
                        }
                    ];

                    sublistSearchCriteria = {
                        type: 'workorder',
                        filters: filters,
                        columns: columns
                    };

                    searchObj = search.create(sublistSearchCriteria);

                    searchObj.run().each(function (result, i) {

                        var workorderId = result.getValue({
                            name: columns[0]
                        });

                        var workorderQuantity = result.getValue({
                            name: columns[1]
                        });

                        var manufacturingrouting = result.getValue({
                            name: columns[3]
                        });

                        var location = result.getValue({
                            name: columns[4]
                        });

                        if (manufacturingroutingIds.indexOf(manufacturingrouting) == -1) {
                            manufacturingroutingIds.push(manufacturingrouting);
                        }

                        if (locationIds.indexOf(location) == -1) {
                            locationIds.push(location);
                        }

                        if (quantity <= workorderQuantity) {
                            workorderTotalObj[workorderId] = {
                                complicationQuantity: quantity,
                                manufacturingrouting: manufacturingrouting,
                                location: location,
                                mainLocationPayload: {
                                    receiptinventorynumber: receiptinventorynumber,
                                    quantity: quantity
                                }
                            };

                            return false;
                        } else {
                            workorderTotalObj[workorderId] = {
                                complicationQuantity: workorderQuantity,
                                manufacturingrouting: manufacturingrouting,
                                location: location,
                                mainLocationPayload: {
                                    receiptinventorynumber: receiptinventorynumber,
                                    quantity: workorderQuantity
                                }
                            };

                            quantity = quantity - workorderQuantity;
                        }

                        return true;
                    });
                }

                if (manufacturingroutingIds && locationIds) {

                    filters = [
                        ["internalid", "anyof"].concat(manufacturingroutingIds),
                        "AND",
                        ["location", "anyof"].concat(locationIds)
                    ];

                    columns = [{
                            name: 'sequence',
                            summary: 'MIN'
                        },
                        {
                            name: 'sequence',
                            summary: 'MAX'
                        },
                        {
                            name: 'internalid',
                            summary: 'GROUP'
                        }
                    ];

                    sublistSearchCriteria = {
                        type: 'manufacturingrouting',
                        filters: filters,
                        columns: columns
                    };

                    searchObj = search.create(sublistSearchCriteria);

                    searchObj.run().each(function (result, i) {

                        var startoperation = result.getValue({
                            name: columns[0]
                        });

                        var endoperation = result.getValue({
                            name: columns[1]
                        });

                        var manufacturingrouting = result.getValue({
                            name: columns[2]
                        });

                        for (var key in workorderTotalObj) {
                            if (workorderTotalObj.hasOwnProperty(key)) {
                                if (manufacturingrouting == workorderTotalObj[key]['manufacturingrouting']) {
                                    workorderTotalObj[key]['startoperation'] = '10'; //2836; //startoperation;
                                    workorderTotalObj[key]['endoperation'] = '10'; // 2836; //endoperation;
                                    workorderTotalObj[key]['subsidiary'] = subsidiary;
                                    workorderTotalObj[key]['transferlocation'] = transferlocation;
                                    workorderTotalObj[key]['item'] = item;
                                    //workorderTotalObj[key]['mainLocationPayload'] = mainLocationPayload;
                                }
                            }
                        }

                        return true;
                    });

                    log.debug('获取到的参数列表值', workorderTotalObj);

                    Object.keys(workorderTotalObj).forEach(function (result) {
                        var mainLocationPayload = [];
                        var items = [];

                        var mainPayload = {
                            startoperation: workorderTotalObj[result]['startoperation'],
                            endoperation: workorderTotalObj[result]['endoperation'],
                            completedquantity: workorderTotalObj[result]['complicationQuantity'],
                            quantity: workorderTotalObj[result]['complicationQuantity']
                        };

                        mainLocationPayload.push(workorderTotalObj[result]['mainLocationPayload']);

                        wipCommon.createWorkOrderComplationByStd(mainPayload, mainLocationPayload, result);

                        mainPayload = {
                            subsidiary: workorderTotalObj[result]['subsidiary'],
                            location: workorderTotalObj[result]['location'],
                            transferlocation: workorderTotalObj[result]['transferlocation'],
                            custbody_wip_work_order_id: result,
                            custbody_wip_transfer_type: transferTypeValue
                        };

                        items.push({
                            item: workorderTotalObj[result]['item'],
                            adjustqtyby: workorderTotalObj[result]['complicationQuantity'], //complicationQuantity
                            inventorydetail: []
                        });

                        var rtnMsg = wipCommon.createInventoryTransferByStd(mainPayload, items);
                        return true;
                    })

                }
            }
        }

    }

    /**
     * 
     * @param {*} context 
     * @description 更新订单转移状态
     */
    function updateAutomatizationStatus(context) {
        var irRec = context.newRecord,
            irItemLineCount,
            itemreceiveValue,
            cwwtlValue,
            wwgwzyDefaultValue = '1'; //工单号

        irItemLineCount = irRec.getLineCount({
            sublistId: gSlItemId
        });

        for (var i = 0; i < irItemLineCount; i++) {

            itemreceiveValue = irRec.getSublistValue({
                sublistId: gSlItemId,
                fieldId: gItemreceiveFieldId,
                line: i
            });

            cwwtlValue = irRec.getSublistValue({
                sublistId: gSlItemId,
                fieldId: gCwwtlFieldId,
                line: i
            });

            if (itemreceiveValue && cwwtlValue) {
                irRec.setSublistValue({
                    sublistId: gSlItemId,
                    fieldId: gCwoasFieldId,
                    line: i,
                    value: wwgwzyDefaultValue
                });
            }
        }
    }

    function createWcAndTransfer(context) {
        var mrTask,
            irRec = context.newRecord,
            itemreceiveValue,
            cwwtlValue,
            irItemObj = {},
            irItemList = [],
            irItemLineCount,
            slItemInventorydetailRec,
            slInventorydetailLineCount,
            inventorydetailObj = {},
            irdata = {};

        irItemLineCount = irRec.getLineCount({
            sublistId: gSlItemId
        });

        for (var i = 0; i < irItemLineCount; i++) {
            irItemObj = {};
            irItemObj[gSlItemLineFieldId] = '';
            irItemObj[gSlItemItemFieldId] = '';
            irItemObj[gSlItemQuantityFieldId] = 0;
            irItemObj[gSlItemLocationFieldId] = '';
            irItemObj[gSlItemCwbnFieldId] = ''; //批次
            irItemObj[gCwopFieldId] = ''; //收货地点（委外）
            irItemObj[gCwwtlFieldId] = ''; //工单
            irItemObj[gSlItemInventorydetailFieldId] = [];

            itemreceiveValue = irRec.getSublistValue({
                sublistId: gSlItemId,
                fieldId: gItemreceiveFieldId,
                line: i
            });

            cwwtlValue = irRec.getSublistValue({
                sublistId: gSlItemId,
                fieldId: gCwwtlFieldId,
                line: i
            });

            if (itemreceiveValue && cwwtlValue) {
                //赋值
                for (var key in irItemObj) {
                    if (irItemObj.hasOwnProperty(key)) {
                        if (key !== gSlItemInventorydetailFieldId) {
                            irItemObj[key] = irRec.getSublistValue({
                                sublistId: gSlItemId,
                                fieldId: key,
                                line: i
                            });
                        } else {
                            slItemInventorydetailRec = irRec.getSublistSubrecord({
                                sublistId: gSlItemId,
                                fieldId: key,
                                line: i
                            });

                            slInventorydetailLineCount = slItemInventorydetailRec.getLineCount({
                                sublistId: gSlInventoryassignmentId
                            });

                            for (var j = 0; j < slInventorydetailLineCount; j++) {
                                inventorydetailObj = {};
                                inventorydetailObj[gSlBinnumberFieldId] = '';
                                inventorydetailObj[gSlReceiptinventorynumberFieldId] = '';
                                inventorydetailObj[gSlItemQuantityFieldId] = 0;

                                for (var skey in inventorydetailObj) {
                                    if (inventorydetailObj.hasOwnProperty(skey)) {
                                        inventorydetailObj[skey] = slItemInventorydetailRec.getSublistValue({
                                            sublistId: gSlInventoryassignmentId,
                                            fieldId: skey,
                                            line: j
                                        });
                                    }
                                }

                                irItemObj[gSlItemInventorydetailFieldId].push(inventorydetailObj);
                            }
                        }
                    }
                }
                irItemList.push(irItemObj);
            }

        }

        log.debug('irItemList', irItemList);

        irdata[irRec.id] = irItemList;

        log.debug('irdata', irdata);

        if (irItemList.length) {
            mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: mrScriptId,
                params: {
                    custscript_params_wcandtranscreation: JSON.stringify(irdata)
                }
            });

            log.debug('mrTask', mrTask);

            mrTask.submit();
        }
    }

    function beforeLoad(context) {
        // autoCreation(context);
    }

    function beforeSubmit(context) {
        if (context.type == 'create') {
            updateAutomatizationStatus(context);
        }
    }

    function afterSubmit(context) {
        if (context.type == 'create') {
            //autoCreatecompletion(context);
            //autoCreation(context);
            createWcAndTransfer(context);
        }


    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */
define([
    'N/search',
    'N/record',
    'N/format',
    '../../app/app_inv_common.js',
    '../../app/app_so_common.js',
    '../../app/ums_po_common.js'
], function (
    search,
    record,
    format,
    invCommon,
    soCommon,
    umsCommon
) {
    var gCreatedfromFieldId = 'createdfrom',
        gInternalidFieldId = 'internalid',
        gSubsidiaryFieldId = 'subsidiary',
        gtransferlocationFieldId = 'transferlocation',
        gSlItemItemFieldId = 'item',
        gSlItemLocationFieldId = 'location',
        gSlInventorydetailFieldId = 'inventorydetail', //货品行地点详细信息
        gSlInventoryFieldId = 'inventory', //货品行sublist
        gSladjustqtybyFieldId = 'adjustqtyby',
        gSLIssueinventorynumberFieldId = 'issueinventorynumber',
        gSlLineuniquekeyFieldId = 'lineuniquekey',
        gSlItemQuantityFieldId = 'quantity',
        gAssignQuantityFieldId = 'quantity',
        gAssignInventorynumberFieldId = 'inventorynumber',
        gLinesequencenumberFieldId = 'linesequencenumber',
        gTranidFieldId = 'tranid',
        lSlsalesorderFieldId = 'custcol_salesorder', //销售订单
        lSlLineFieldId = 'custcol_line', //行号
        lSlExternalFieldId = 'custcol_external', //来源订单号
        lSlSalesBankFieldId = 'custcol_sales_bank',
        gSlItemLineFieldId = 'line',
        gSlItemOrderlineFieldId = 'orderline'; //来源订单行号
        //ADD AT 2020-09-19
        gSlcustcol_k3line_number='custcol_k3line_number';//K3行号（销售）
        gSlItemDetailStatusFiledId='status';
        gSLIssueinventorynumberIDFieldId='numberedrecordid';

    function getInputData() {

        var lSlIsTransferredFieldId = 'custcol_is_transferred', //是否已转移
            ciilFieldId = 'custrecord_intre_intercompany_location', //公司间交易默认仓库（子公司）
            cassqFieldId = 'inventoryDetail_quantity',
            casslotFieldId = 'inventoryDetail_inventorynumber',
            casslotIdFieldId = 'inventoryDetail_numberedrecordid', //ADD AT 2020-09-19
            casslotStatusFieldId = 'inventoryDetail_status',        //ADD AT 2020-09-19
            iffColumns = [],
            iffFilters = [],
            iffSearchCriteria = {},
            iffObj = {},
            iffList = [],
            iffObjKey,
            subsidiaryIdList = [],
            subsidiaryColumns = [],
            subsidiaryFilters = [],
            subsidiarySearchCriteria = {},
            subsidiaryObj = {},
            subsidiaryList = [],
            purchaseorderIdList = [],
            purchaseorderColumns = [],
            purchaseorderFilters = [],
            purchaseorderSearchCriteria = {},
            purchaseorderObj = {},
            purchaseorderList = [],
            assKey,
            fKey,
            fMap = {},
            fList = [],
            sKey,
            sMap = {},
            sList = [],
            inventoryObj = {},
            inventorydetailObj = {};

        //1.查询库存出库
        iffColumns = [{
                name: 'internalid'
            },
            {
                name: 'createdfrom'
            },
            {
                name: 'item'
            },
            {
                name: 'location'
            },
            {
                name: 'quantity'
            },
            {
                name: 'quantity',
                join: 'inventoryDetail'
            },
            {
                name: 'inventorynumber',
                join: 'inventoryDetail'
            },
            {
                name: 'lineuniquekey'
            },
            {
                name: 'linesequencenumber'
            },
            {
                name: 'subsidiary'
            },
            {
                name: lSlsalesorderFieldId
            },
            {
                name: lSlLineFieldId
            },
            {
                name: lSlExternalFieldId
            },
            {
                name: lSlSalesBankFieldId
            },
            {
                name: 'tranid'
            },
            {
                name: 'formulatext',
                type: "text",
                formula: "{inventorydetail.inventorynumber}"
            },
            ///add at 2020-09-19
            {
                name: 'status',
                join: 'inventoryDetail'
            } 

        ];

        iffFilters = [
            ['type', 'anyof', 'ItemShip'],
            'AND',
            ['status', 'anyof', 'ItemShip:A'],
            //'AND',
            //['internalid', 'anyof', '120910', '134966'],
            'AND',
            ['taxline', 'is', 'F'],
            'AND',
            ['cogs', 'is', 'F'],
            'AND',
            ["createdfrom.custbody_source_purchase", "is", "T"],
            "AND",
            ["createdfrom.custbody_whether_ntercompany_transact", "is", "T"],
            "AND",
            ["custbody_is_transfer", "is", "F"]
        ];

        iffSearchCriteria = {
            type: 'itemfulfillment',
            filters: iffFilters,
            columns: iffColumns
        };

        search.create(iffSearchCriteria).run().each(function (result, i) {

            iffObj = {};

            for (var j = 0; j < iffColumns.length; j++) {

                if (iffColumns[j]['name'] == 'formulatext') {
                    iffObjKey = iffColumns[j]['name'] + '_' + j;
                } else {
                    if (iffColumns[j]['join']) {
                        iffObjKey = iffColumns[j]['join'] + '_' + iffColumns[j]['name'];
                    } else {
                        iffObjKey = iffColumns[j]['name'];
                    }
                }

                iffObj[iffObjKey] = result.getValue({
                    name: iffColumns[j]
                });
            }

            iffList.push(iffObj);
            return true;
        });

        log.debug('iffList', iffList);

        for (var i = 0; i < iffList.length; i++) {
            if (subsidiaryIdList.indexOf(iffList[i][gSubsidiaryFieldId]) == -1) {
                subsidiaryIdList.push(iffList[i][gSubsidiaryFieldId]);
            }
        }

        log.debug('subsidiaryIdList', subsidiaryIdList);

        //2.查询默认仓库
        subsidiaryColumns = [{
                name: 'internalid'
            },
            {
                name: ciilFieldId
            },
        ];

        subsidiaryFilters = [
            ["internalid", "anyof"].concat(subsidiaryIdList)
        ];

        subsidiarySearchCriteria = {
            type: 'subsidiary',
            filters: subsidiaryFilters,
            columns: subsidiaryColumns
        };

        search.create(subsidiarySearchCriteria).run().each(function (result, i) {

            subsidiaryObj = {};

            for (var j = 0; j < subsidiaryColumns.length; j++) {

                subsidiaryObj[subsidiaryColumns[j]['name']] = result.getValue({
                    name: subsidiaryColumns[j]
                });
            }

            subsidiaryList.push(subsidiaryObj);
            return true;
        });

        log.debug('subsidiaryList', subsidiaryList);

        for (var i = 0; i < iffList.length; i++) {
            for (var j = 0; j < subsidiaryList.length; j++) {
                if (iffList[i][gSubsidiaryFieldId] == subsidiaryList[j][gInternalidFieldId]) {
                    iffList[i][ciilFieldId] = subsidiaryList[j][ciilFieldId];
                }
            }
        }

        log.debug('iffList', iffList);

        //查询采购订单相关信息
        for (var i = 0; i < iffList.length; i++) {

            if (purchaseorderIdList.indexOf(iffList[i][lSlExternalFieldId]) == -1) {
                purchaseorderIdList.push(iffList[i][lSlExternalFieldId]);
            }
        }

        log.debug('purchaseorderIdList', purchaseorderIdList);

        if (purchaseorderIdList.length) {
            purchaseorderColumns = [{
                    name: 'internalid'
                },
                {
                    name: 'subsidiary'
                },
                {
                    name: 'entity'
                }
            ];

            purchaseorderFilters = [
                ["type", "anyof", "PurchOrd"],
                "AND",
                ["mainline", "is", "T"],
                "AND",
                ["internalid", "anyof"].concat(purchaseorderIdList)
            ];

            purchaseorderSearchCriteria = {
                type: 'purchaseorder',
                filters: purchaseorderFilters,
                columns: purchaseorderColumns
            };

            search.create(purchaseorderSearchCriteria).run().each(function (result, i) {

                purchaseorderObj = {};

                for (var j = 0; j < purchaseorderColumns.length; j++) {

                    purchaseorderObj[purchaseorderColumns[j]['name']] = result.getValue({
                        name: purchaseorderColumns[j]
                    });
                }

                purchaseorderList.push(purchaseorderObj);
                return true;
            });

            log.debug('purchaseorderList', purchaseorderList);

            for (var i = 0; i < iffList.length; i++) {
                for (var j = 0; j < purchaseorderList.length; j++) {
                    if (iffList[i][lSlExternalFieldId] == purchaseorderList[j][gInternalidFieldId]) {
                        iffList[i]['poSubsidiary'] = purchaseorderList[j]['subsidiary'];
                        iffList[i]['poEntity'] = purchaseorderList[j]['entity'];
                    }
                }
            }

            log.debug('iffList', iffList);
        }

        //3.第一次转换，合并批次
        for (var i = 0; i < iffList.length; i++) {
            fKey = iffList[i][gSlLineuniquekeyFieldId];

            if (!fMap[fKey]) {
                fMap[fKey] = {
                    subsidiary: iffList[i][gSubsidiaryFieldId],
                    location: iffList[i][gSlItemLocationFieldId],
                    transferlocation: iffList[i][ciilFieldId],
                    item: iffList[i][gSlItemItemFieldId],
                    adjustqtyby: iffList[i][gSlItemQuantityFieldId],
                    internalid: iffList[i][gInternalidFieldId],
                    createdfrom: iffList[i][gCreatedfromFieldId],
                    tranid: iffList[i][gTranidFieldId],
                    line: iffList[i][gLinesequencenumberFieldId],
                    poSubsidiary: iffList[i]['poSubsidiary'],
                    poEntity: iffList[i]['poEntity'],
                    //items: []
                    //add at 2020-09-19
                    custcol_k3line_number:iffList[i][gSlcustcol_k3line_number] 
                };

                fMap[fKey][lSlsalesorderFieldId] = iffList[i][lSlsalesorderFieldId];
                fMap[fKey][lSlLineFieldId] = iffList[i][lSlLineFieldId];
                fMap[fKey][lSlExternalFieldId] = iffList[i][lSlExternalFieldId];
                fMap[fKey][lSlSalesBankFieldId] = iffList[i][lSlSalesBankFieldId];
                fMap[fKey][gSlcustcol_k3line_number] = iffList[i][gSlcustcol_k3line_number];

                fMap[fKey][gSlInventorydetailFieldId] = [];

                inventorydetailObj = {};

                //inventorydetailObj[gSLIssueinventorynumberFieldId] = iffList[i][casslotFieldId];
                inventorydetailObj[gSLIssueinventorynumberFieldId] = iffList[i]['formulatext_15'];
                inventorydetailObj[gSLIssueinventorynumberIDFieldId] = iffList[i][casslotIdFieldId];
                inventorydetailObj[gSlItemQuantityFieldId] = iffList[i][cassqFieldId];
                inventorydetailObj[gSlItemDetailStatusFiledId] = iffList[i][casslotStatusFieldId];

                inventorydetailObj['formulatext_15'] = iffList[i]['formulatext_15'];

                inventorydetailObj[gSlItemDetailStatusFiledId] = iffList[i][casslotStatusFieldId];

                fMap[fKey][gSlInventorydetailFieldId].push(inventorydetailObj);

            } else {
                inventorydetailObj = {};

                //inventorydetailObj[gSLIssueinventorynumberFieldId] = iffList[i][casslotFieldId];
                inventorydetailObj[gSLIssueinventorynumberFieldId] = iffList[i]['formulatext_15'];
               inventorydetailObj[gSLIssueinventorynumberIDFieldId] = iffList[i][casslotIdFieldId];
                inventorydetailObj[gSlItemQuantityFieldId] = iffList[i][cassqFieldId];
           inventorydetailObj[gSlItemDetailStatusFiledId] = iffList[i][casslotStatusFieldId];

                inventorydetailObj['formulatext_15'] = iffList[i]['formulatext_15'];

                fMap[fKey][gSlInventorydetailFieldId].push(inventorydetailObj);
            }
        }

        log.debug('fMap', fMap);

        Object.keys(fMap).forEach(function (result, i) {
            fList.push(fMap[result]);
        });

        log.debug('fList', fList);

        //4.第二次转换，得到库存转移信息
        for (var i = 0; i < fList.length; i++) {

            sKey = fList[i][gInternalidFieldId];

            if (!sMap[sKey]) {
                sMap[sKey] = {
                    subsidiary: fList[i][gSubsidiaryFieldId],
                    createdfrom: fList[i][gCreatedfromFieldId],
                    transferlocation: fList[i][gtransferlocationFieldId],
                    tranid: fList[i][gTranidFieldId]
                };

                sMap[sKey][gSlInventoryFieldId] = [];

                inventoryObj = {};
                inventoryObj[gSlItemItemFieldId] = fList[i][gSlItemItemFieldId];
                inventoryObj[gSlItemLineFieldId] = fList[i][gSlItemLineFieldId];
                inventoryObj[gSlItemLocationFieldId] = fList[i][gSlItemLocationFieldId];
                inventoryObj[gSladjustqtybyFieldId] = fList[i][gSladjustqtybyFieldId];
                inventoryObj[gSlInventorydetailFieldId] = fList[i][gSlInventorydetailFieldId];
                inventoryObj[lSlsalesorderFieldId] = fList[i][lSlsalesorderFieldId];
                inventoryObj[lSlLineFieldId] = fList[i][lSlLineFieldId];
                inventoryObj[lSlExternalFieldId] = fList[i][lSlExternalFieldId];
                inventoryObj[lSlSalesBankFieldId] = fList[i][lSlSalesBankFieldId];
                inventoryObj[gSlcustcol_k3line_number] = fList[i][gSlcustcol_k3line_number];
                inventoryObj['poSubsidiary'] = fList[i]['poSubsidiary'];
                inventoryObj['poEntity'] = fList[i]['poEntity'];

                sMap[sKey][gSlInventoryFieldId].push(inventoryObj);
            } else {
                inventoryObj = {};
                inventoryObj[gSlItemItemFieldId] = fList[i][gSlItemItemFieldId];
                inventoryObj[gSlItemLineFieldId] = fList[i][gSlItemLineFieldId];
                inventoryObj[gSlItemLocationFieldId] = fList[i][gSlItemLocationFieldId];
                inventoryObj[gSladjustqtybyFieldId] = fList[i][gSladjustqtybyFieldId];
                inventoryObj[gSlInventorydetailFieldId] = fList[i][gSlInventorydetailFieldId];
                inventoryObj[lSlsalesorderFieldId] = fList[i][lSlsalesorderFieldId];
                inventoryObj[lSlLineFieldId] = fList[i][lSlLineFieldId];
                inventoryObj[lSlExternalFieldId] = fList[i][lSlExternalFieldId];
                inventoryObj[lSlSalesBankFieldId] = fList[i][lSlSalesBankFieldId];
                inventoryObj[gSlcustcol_k3line_number] = fList[i][gSlcustcol_k3line_number];
                inventoryObj['poSubsidiary'] = fList[i]['poSubsidiary'];
                inventoryObj['poEntity'] = fList[i]['poEntity'];

                sMap[sKey][gSlInventoryFieldId].push(inventoryObj);
            }
        }

        log.debug('sMap', sMap);

        return sMap;

    }

    function map(context) {
        var contextKey = context.key,
            contextValue = JSON.parse(context.value),
            citFieldId = 'custbody_is_transfer',
            option,
            inventory,
            fromInventorydetail = [],
            toInventorydetailObj = {},
            toInventorydetail = [],
            sKey,
            sMap = {},
            sMapItems = [],
            itemObj = {},
            sourceIffRec,
            sourceIffItemList = [],
            sourceIffItemObj = {},
            sourceLineCount,
            toIffItemList = [],
            toIffObj = {},
            toIffMain = {},
            toIffOption = {},
            poKey,
            poMap = {},
            poItemObj = {},
            poItemList = {},
            poList = [],
            toIffRecId;

        log.debug('context', contextValue);

        inventory = contextValue[gSlInventoryFieldId];

        for (var i = 0; i < inventory.length; i++) {

            fromInventorydetail = inventory[i][gSlInventorydetailFieldId];
            toInventorydetail = [];

            for (var k = 0; k < fromInventorydetail.length; k++) {
                toInventorydetailObj = {};
                toInventorydetailObj[gSLIssueinventorynumberFieldId] = fromInventorydetail[k][gSLIssueinventorynumberFieldId];
                toInventorydetailObj[gSLIssueinventorynumberIDFieldId] = fromInventorydetail[k][gSLIssueinventorynumberIDFieldId];
                toInventorydetailObj[gSlItemQuantityFieldId] = fromInventorydetail[k][gSlItemQuantityFieldId];
                toInventorydetailObj[gSlItemDetailStatusFiledId] = fromInventorydetail[k][gSlItemDetailStatusFiledId];
                toInventorydetail.push(toInventorydetailObj);
            }

            //获取转移数据
            sKey = contextValue[gtransferlocationFieldId].toString() +
                inventory[i][gSlItemLocationFieldId].toString();

            if (!sMap[sKey]) {
                sMap[sKey] = {
                    subsidiary: contextValue[gSubsidiaryFieldId],
                    //trandate: new Date(),
                    location: inventory[i][gSlItemLocationFieldId],
                    transferlocation: contextValue[gtransferlocationFieldId]
                };

                sMap[sKey]['items'] = [];
                itemObj = {};
                itemObj[gSlItemItemFieldId] = inventory[i][gSlItemItemFieldId];
                itemObj[gSladjustqtybyFieldId] = inventory[i][gSladjustqtybyFieldId];
                itemObj[gSlInventorydetailFieldId] = toInventorydetail;
                sMap[sKey]['items'].push(itemObj);
            } else {
                //sMap[sKey]['items'] = [];
                itemObj = {};
                itemObj[gSlItemItemFieldId] = inventory[i][gSlItemItemFieldId];
                itemObj[gSladjustqtybyFieldId] = inventory[i][gSladjustqtybyFieldId];
                itemObj[gSlInventorydetailFieldId] = toInventorydetail;
                sMap[sKey]['items'].push(itemObj);
            }


            for (var j = 0; j < toInventorydetail.length; j++) {
                var option = {
                    main: {
                        custrecord_tranid: contextValue[gTranidFieldId],
                        custrecord_iff_item: inventory[i][gSlItemItemFieldId],
                        custrecord_iff_quantity: inventory[i][gSladjustqtybyFieldId],
                        custrecord_iff_lot: toInventorydetail[j][gSLIssueinventorynumberFieldId],
                        custrecord_iff_lotID: toInventorydetail[j][gSLIssueinventorynumberIDFieldId],
                        custrecord_iff_lot_quantity: toInventorydetail[j][gSlItemQuantityFieldId],
                     custrecord_iff_lot_status: toInventorydetail[j][gSlItemDetailStatusFiledId],
                    }
                }

                log.debug('option', option);

                //备份出库单数据
                //iffBak(option);
            }

            //创建出库单参数
            toIffObj = {};
            toIffObj[gSlItemItemFieldId] = inventory[i][gSlItemItemFieldId];
            toIffObj[gSlItemQuantityFieldId] = inventory[i][gSladjustqtybyFieldId];
            toIffObj[gSlItemDetailStatusFiledId] = inventory[i][gSlItemDetailStatusFiledId];
            toIffObj[gSlItemLineFieldId] = inventory[i][gSlItemLineFieldId];
            toIffObj[gSlItemLocationFieldId] = contextValue[gtransferlocationFieldId];
            toIffObj[gSlInventorydetailFieldId] = toInventorydetail;
            ///
            toIffObj[gSlcustcol_k3line_number] = contextValue[gSlcustcol_k3line_number]; // add at 2020-09019
           log.debug('line 535' ,toIffObj );
            toIffItemList.push(toIffObj);
        }

        log.debug('sMap', sMap);
        log.debug('toIffItemList', toIffItemList);

        //2.1获取出库单信息
        sourceIffRec = record.load({
            type: 'itemfulfillment',
            id: contextKey
        });

        var sourceLineCount = sourceIffRec.getLineCount({
            sublistId: gSlItemItemFieldId
        });

        for (var i = 0; i < sourceLineCount; i++) {
            sourceIffItemObj = {};
            sourceIffItemObj[gSlItemLineFieldId] = 0;
            sourceIffItemObj[gSlItemOrderlineFieldId] = 0;

            for (var key in sourceIffItemObj) {

                if (sourceIffItemObj.hasOwnProperty(key)) {
                    sourceIffItemObj[key] = sourceIffRec.getSublistValue({
                        sublistId: gSlItemItemFieldId,
                        fieldId: key,
                        line: i
                    });
                }
            }

           log.debug('568 sourceIffItemObj ',sourceIffItemObj);


            sourceIffItemList.push(sourceIffItemObj);
        }

        log.debug('sourceIffItemList', sourceIffItemList);

        //合并查询orderline
        for (var i = 0; i < toIffItemList.length; i++) {
            for (var j = 0; j < sourceIffItemList.length; j++) {
                if (toIffItemList[i][gSlItemLineFieldId] == sourceIffItemList[j][gSlItemLineFieldId]) {
                    toIffItemList[i][gSlItemOrderlineFieldId] = sourceIffItemList[j][gSlItemOrderlineFieldId];
                }
            }
        }

        log.debug('toIffItemList', toIffItemList);

        for (var i = 0; i < toIffItemList.length; i++) {
            toIffItemList[i][gSlItemLineFieldId] = toIffItemList[i][gSlItemOrderlineFieldId];
            delete toIffItemList[i][gSlItemOrderlineFieldId];
        }

        log.debug('toIffItemListend', toIffItemList);

        //2.删除原出库单
        record.delete({
            type: 'itemfulfillment',
            id: contextKey,
        });

        //3.创建转移单据
        Object.keys(sMap).forEach(function (result, i) {

            log.debug('result', result);
            var option = {

                main: {
                    subsidiary: sMap[result][gSubsidiaryFieldId],
                    //trandate: new Date(),
                    location: sMap[result][gSlItemLocationFieldId],
                    transferlocation: sMap[result][gtransferlocationFieldId]
                },
                items: sMap[result]['items'],
                enableSourcing: true,
                ignoreMandatoryFields: true
            };

            // log.debug('option', option);

            var recId = invCommon.inventorytransferCreationSt(option);
            // log.debug('recId', recId);
            return true;
        });

        //创建出库
        toIffMain[gCreatedfromFieldId] = contextValue[gCreatedfromFieldId];
        toIffMain[citFieldId] = true;
        // log.debug('toIffMain', toIffMain);
        toIffOption = {

            main: toIffMain,
            items: toIffItemList,
            enableSourcing: false,
            ignoreMandatoryFields: true
        };

        toIffRecId = soCommon.itemfulfillmentCreationSt(toIffOption);

        // log.debug('toIffRecId', toIffRecId);

        //关税导入
        for (var i = 0; i < inventory.length; i++) {
            poKey = inventory[i]['poSubsidiary'].toString() +
                inventory[i]['poEntity'].toString();


            if (!poMap[poKey]) {

                poMap[poKey] = {
                    //custcol_external: poKey,
                    tranid: contextValue[gTranidFieldId],
                    //trandate: new Date(),
                    poSubsidiary: inventory[i]['poSubsidiary'],
                    poEntity: inventory[i]['poEntity'],
                    items: []
                };

                poItemObj = {};
                poItemObj[gSlItemItemFieldId] = inventory[i][gSlItemItemFieldId];
                poItemObj[gSladjustqtybyFieldId] = inventory[i][gSladjustqtybyFieldId];
                poItemObj[lSlExternalFieldId] = inventory[i][lSlExternalFieldId];
                poItemObj[lSlSalesBankFieldId] = inventory[i][lSlSalesBankFieldId];
                poItemObj[gSlcustcol_k3line_number] = inventory[i][gSlcustcol_k3line_number];
                poItemObj[gSlInventorydetailFieldId] = inventory[i][gSlInventorydetailFieldId];
                poMap[poKey]['items'].push(poItemObj);
            } else {
                poItemObj = {};
                poItemObj[gSlItemItemFieldId] = inventory[i][gSlItemItemFieldId];
                poItemObj[gSladjustqtybyFieldId] = inventory[i][gSladjustqtybyFieldId];
                poItemObj[lSlExternalFieldId] = inventory[i][lSlExternalFieldId];
                poItemObj[lSlSalesBankFieldId] = inventory[i][lSlSalesBankFieldId];
                poItemObj[gSlcustcol_k3line_number] = inventory[i][gSlcustcol_k3line_number];
                poItemObj[gSlInventorydetailFieldId] = inventory[i][gSlInventorydetailFieldId];

                // log.debug('line 674 poItemObj',poItemObj);
                poMap[poKey]['items'].push(poItemObj);
            }

        }

        // log.debug('poMap', poMap);

        Object.keys(poMap).forEach(function (result, i) {

            var cdury = {
                main: {
                    custrecord_ums_shipment_date: new Date(), //format.parse({ value: "2020/03/11", type: format.Type.DATETIME }),
                    custrecord_ums_memo_inventory: poMap[result][gTranidFieldId],
                    custrecord_ums_subsidiary_corporation: poMap[result]['poSubsidiary'],
                    custrecord_ums_vendor_name_inventory: poMap[result]['poEntity'],
                    custrecord_ums_header_iso_fulfillment: toIffRecId //测试数据，YQRKD0000000292
                },
                items: []
            };

            var _items = poMap[result]['items'];

            for (var j = 0; j < _items.length; j++) {

                var _inventorydetail = _items[j][gSlInventorydetailFieldId];

                for (var k = 0; k < _inventorydetail.length; k++) {
                    var cduryItemObj = {
                        custrecord_ums_line_item_inventory: _items[j][gSlItemItemFieldId],
                        custrecord_ums_line_po_id: _items[j][lSlExternalFieldId],
                        custrecord_ums_line_po_line_num: _items[j][lSlSalesBankFieldId],
                        custrecord_ums_line_k3line_number: _items[j][gSlcustcol_k3line_number],
                        custrecord_ums_line_lotnum: _inventorydetail[k]['formulatext_15'],
                        custrecord_ums_line_quantity: _inventorydetail[k][gSlItemQuantityFieldId],
                        custrecord_ums_line_status: _inventorydetail[k][gSlItemDetailStatusFiledId]

                    };

                    // log.debug(' line 713 cduryItemObj',cduryItemObj);

                    cdury['items'].push(cduryItemObj);

                }
            }

            // log.debug('cdury', cdury);

            var recId111 = umsCommon.createintercompanyporcv(cdury);

            // log.debug('recId', recId111);

            return;
        });

    }

    function reduce(context) {

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

    function iffBak(option) {

        var main = option.main,
            enableSourcing = option.enableSourcing,
            ignoreMandatoryFields = option.ignoreMandatoryFields,
            iffBakRec;

        try {

            iffBakRec = record.create({
                type: 'customrecord_iff_be_delete'
            });

            for (var key in main) {
                if (main.hasOwnProperty(key)) {
                    iffBakRec.setValue({
                        fieldId: key,
                        value: main[key]
                    });
                }
            }

            return iffBakRec.save({
                enableSourcing: enableSourcing,
                ignoreMandatoryFields: ignoreMandatoryFields
            });
        } catch (ex) {
            log.error({
                title: '备份错误',
                details: ex
            });
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
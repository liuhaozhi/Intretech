/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
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
    var gInventoryassignmentSlRecId = 'inventoryassignment';

    function beforeLoad(context) {

    }

    function beforeSubmit(context) {

    }

    function afterSubmit(context) {
        if (context.type == 'create') {
            autoCreatePurchaseOrder(context);
        }
    }

    function autoCreatePurchaseOrder(context) {
        var newRecord = context.newRecord,
            createdfrom = newRecord.getValue({
                fieldId: 'createdfrom'
            }),
            salesorderRecTypeId = 'salesorder',
            salesorderRec,
            entityFieldId = 'entity',
            entityFieldValue,
            subsidiaryFieldId = 'subsidiary',
            gItemSublistId = 'item',
            lineFieldId = 'line',
            rateFieldId = 'rate',
            soMain = {
                entity: '',
                subsidiary: ''
            },
            iffMain = {
                entity: '',
                trandate: new Date()
            },
            iffLineCount,
            iffItemsList = [],
            soItemsList = [],
            soLineCount,
            cdsFieldId = 'custentity_deputy_subsidiaries', //代表子公司（0210）
            customerColumns = [{
                    name: cdsFieldId
                },
                {
                    name: subsidiaryFieldId //主要子公司
                }
            ],
            customerCdsFieldValue, //公司间客户代表子公司的值
            customerSubsidiaryFiledValue, //公司间客户主要子公司
            customerFilters = [
                ['internalid', 'anyof']
            ],
            customerSearchCriteria = {},
            customerSearchObj,
            vendorColumns = [{
                name: 'internalid'
            }],
            poVendorValue,
            vendorFilters = [],
            vendorSearchCriteria = {},
            vendorSearchObj,
            isgsj = true,
            currency,
            itemObj = {},
            items = [],
            poMain = {},
            inventorydetailSlFieldId = 'inventorydetail',
            locationSlFieldId = 'location',
            inventorydetailSubRec,
            inventorydetailSubLineCount,
            iffItemsObj = {},
            soItemsObj = {},
            poItemsObj = {},
            irItemsObj = {},
            newSoItemsObj = {},
            newAsnItemsObj = {},
            inventorydetailSubObj = {},
            poItemsList = [],
            newSoItemsList = [],
            newAsnItemsList = [],
            irItemsList = [],
            poOption = {},
            irOption = {},
            newSoOption = {},
            newAsnOption = {},
            iffDetails = [],
            irItemDetailsObj = {};

        try {
            salesorderRec = record.load({
                type: salesorderRecTypeId,
                id: createdfrom
            });

            //查询发货通知上的主要信息
            for (var key in soMain) {
                if (soMain.hasOwnProperty(key)) {
                    soMain[key] = salesorderRec.getValue({
                        fieldId: key
                    });
                }
            }
            log.debug('soMain', soMain);

            //货品行数
            soLineCount = salesorderRec.getLineCount({
                sublistId: gItemSublistId
            });

            //货品行缓存
            for (var i = 0; i < soLineCount; i++) {
                soItemsObj = {
                    item: '',
                    rate: 0,
                    quantity: 0,
                    line: '',
                    linenumber: 0
                }

                for (var key in soItemsObj) {

                    if (soItemsObj.hasOwnProperty(key)) {
                        soItemsObj[key] = salesorderRec.getSublistValue({
                            sublistId: gItemSublistId,
                            fieldId: key,
                            line: i
                        });

                    }
                }

                soItemsList.push(soItemsObj);
            }

            log.debug('soItemsList', soItemsList);

            //查询客户判断是否为公司间交易
            entityFieldValue = soMain[entityFieldId];
            if (entityFieldValue) {

                customerFilters[0] = customerFilters[0].concat(entityFieldValue);

                customerSearchCriteria = {
                    type: 'customer',
                    filters: customerFilters,
                    columns: customerColumns
                };

                log.debug('customerSearchCriteria', customerSearchCriteria);

                customerSearchObj = search.create(customerSearchCriteria);

                customerSearchObj.run().each(function (result, i) {

                    customerCdsFieldValue = result.getValue({
                        name: customerColumns[0]
                    });

                    customerSubsidiaryFiledValue = result.getValue({
                        name: customerColumns[1]
                    });

                    return true;
                });

                log.debug('customerCdsFieldValue', customerCdsFieldValue);
                log.debug('customerSubsidiaryFiledValue', customerSubsidiaryFiledValue);
            }

            //如果存在代表子公司，则表示为公司间交易
            if (customerCdsFieldValue) {
                vendorFilters = [
                    ["custentity_deputy_subsidiaries", "anyof", customerSubsidiaryFiledValue],
                    "AND",
                    ["subsidiary", "anyof", customerCdsFieldValue]
                ];

                vendorSearchCriteria = {
                    type: 'vendor',
                    filters: vendorFilters,
                    columns: vendorColumns
                };

                log.debug('vendorSearchCriteria', vendorSearchCriteria);

                vendorSearchObj = search.create(vendorSearchCriteria);

                vendorSearchObj.run().each(function (result, i) {

                    poVendorValue = result.getValue({
                        name: vendorColumns[0]
                    });

                    return true;
                });

                log.debug('poVendorValue', poVendorValue);
                //如果供应商存在则创建采购订单
                if (poVendorValue) {
                    //查询出库货品行
                    iffLineCount = newRecord.getLineCount({
                        sublistId: gItemSublistId
                    });
                    log.debug('iffLineCount', iffLineCount);

                    for (var i = 0; i < iffLineCount; i++) {
                        iffItemsObj = {
                            item: '',
                            //location: 4,
                            quantity: 0,
                            line: '',
                            inventorydetail: []
                        }

                        for (var key in iffItemsObj) {

                            if (iffItemsObj.hasOwnProperty(key)) {

                                if (key != inventorydetailSlFieldId) {
                                    iffItemsObj[key] = newRecord.getSublistValue({
                                        sublistId: gItemSublistId,
                                        fieldId: key,
                                        line: i
                                    });
                                } else {
                                    inventorydetailSubRec = newRecord.getSublistSubrecord({
                                        sublistId: gItemSublistId,
                                        fieldId: key,
                                        line: i
                                    });

                                    inventorydetailSubLineCount = inventorydetailSubRec.getLineCount({
                                        sublistId: gInventoryassignmentSlRecId
                                    });

                                    for (var j = 0; j < inventorydetailSubLineCount; j++) {

                                        inventorydetailSubObj = {
                                            issueinventorynumber: '',
                                            issueinventorynumber_display: '',
                                            quantity: 0
                                        };

                                        for (var skey in inventorydetailSubObj) {
                                            if (inventorydetailSubObj.hasOwnProperty(skey)) {
                                                inventorydetailSubObj[skey] = inventorydetailSubRec.getSublistValue({
                                                    sublistId: gInventoryassignmentSlRecId,
                                                    fieldId: skey,
                                                    line: j
                                                });
                                            }
                                        }

                                        iffItemsObj[key].push(inventorydetailSubObj);
                                    }
                                }

                            }
                        }

                        iffItemsList.push(iffItemsObj);
                    }

                    log.debug('iffItemsList', iffItemsList);

                    //匹配行并更新价格
                    for (var i = 0; i < iffItemsList.length; i++) {
                        for (var j = 0; j < soItemsList.length; j++) {
                            if (iffItemsList[i][lineFieldId] == soItemsList[j][lineFieldId]) {
                                iffItemsList[i][rateFieldId] = soItemsList[j][rateFieldId];
                            }
                        }
                    }

                    log.debug('iffItemsList', iffItemsList);

                    for (var i = 0; i < iffItemsList.length; i++) {
                        //测试添加一个地点
                        iffItemsList[i][locationSlFieldId] = 4;

                        poItemsObj = {
                            item: '',
                            quantity: 0,
                            rate: 0
                        };

                        for (var key in poItemsObj) {

                            if (poItemsObj.hasOwnProperty(key)) {
                                poItemsObj[key] = iffItemsList[i][key];
                            }
                        }

                        poItemsList.push(poItemsObj);

                        irItemsObj = {
                            item: '',
                            location: '',
                            quantity: 0,
                            inventorydetail: []
                        };

                        for (var key in irItemsObj) {

                            if (irItemsObj.hasOwnProperty(key)) {

                                if (key != inventorydetailSlFieldId) {
                                    irItemsObj[key] = iffItemsList[i][key];
                                } else {
                                    iffDetails = iffItemsList[i][key];

                                    for (var j = 0; j < iffDetails.length; j++) {

                                        irItemDetailsObj = {
                                            receiptinventorynumber: '',
                                            quantity: 0
                                        };

                                        irItemDetailsObj['receiptinventorynumber'] = iffDetails[j]['issueinventorynumber'];
                                        irItemDetailsObj['quantity'] = iffDetails[j]['quantity'];

                                        irItemsObj[key].push(irItemDetailsObj);
                                    }
                                }
                            }
                        }

                        irItemsList.push(irItemsObj);

                        //step 3
                    }

                    //irItemsList = iffItemsList;

                    log.debug('irItemsList', irItemsList);
                    log.debug('poItemsList', poItemsList);
                    newSoItemsList = poItemsList;
                    newAsnItemsList = poItemsList;

                    poMain = {
                        entity: poVendorValue,
                        //subsidiary: 29,
                        //location: 243,
                        //currency: 1,
                        //custbody_po_list_pur_type: 1,
                        approvalstatus: 2,
                        trandate: new Date()
                    };

                    poOption = {

                        main: poMain,
                        items: poItemsList,
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    };

                    var recId = poCommon.purchaseorderCreationSt(poOption);

                    log.debug('recId', recId);
                    //如果成功创建采购订单则创建接收
                    if (recId) {
                        var irOption = {

                            main: {
                                createdfrom: recId
                            },
                            items: irItemsList,
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        };

                        var irRecId = poCommon.itemreceiptCreationSt(irOption);

                        log.debug('irRecId', irRecId);
                    }

                    //创建销售订单
                    newSoOption = {

                        mainPayload: {
                            custbody_cust_ordertype: 1,
                            currency: 1,
                            entity: 4656,
                            trandate: new Date()
                        },
                        items: newSoItemsList
                    };

                    var newSorecId = soCommon.estimateCreationSTM(newSoOption);
                    log.debug('newSorecId', newSorecId);

                    if (newSorecId) {
                        newAsnOption = {

                            main: {
                                entity: 4656, //2953
                                //currency: 1,
                                //custbody_po_list_pur_type: 1,
                                //approvalstatus: 2,
                                orderstatus: 'B',
                                trandate: new Date()
                                //department: 12
                            },
                            items: newAsnItemsList,
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        };

                        var newAsnRecId = soCommon.salesorderCreationSt(newAsnOption);

                        log.debug('newAsnRecId', newAsnRecId);
                    }
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
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
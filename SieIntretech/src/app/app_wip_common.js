/**
 *@NApiVersion 2.0
 *@author yuming Hu
 *@description wip处理公共程序
 */
define([
    'N/search',
    'N/record',
    '../dao/dao_collection_utils.js'
], function (search,
    record,
    dao) {
    var workordercompletion = 'workordercompletion';
    var componentSublistId = 'component';
    var operationSublistId = 'operation';
    var headerLocationFieldId = 'inventorydetail';
    var inventoryassignmentSublistId = 'inventoryassignment';
    var receiptinventorynumberFieldIdH = 'receiptinventorynumber';
    var sublistLocationFieldId = 'componentinventorydetail';
    var locationQuantityFieldIdH = 'quantity';
    var locationQuantityFieldIdL = 'quantity';
    var issueinventorynumberFieldId = 'issueinventorynumber';
    var gworkorderRecTypeId = 'workorder';

    /**
     * 
     * @description:创建工作单完成
     * @author:yuming Hu
     * @param {*} mainPayload :工作单完成主信息参数
     * @param {*} mainLocationPayload :工作单完成主信息的库存详细信息参数
     * @param {*} workorder :工单id
     * 参数demo：var mainPayload = {
            startoperation: '10',
            endoperation: '10',
            completedquantity: 1,
            quantity: 1,
        };

        var mainLocationPayload = [{
            receiptinventorynumber: '1111',
            quantity: 0.5
        }, {
            receiptinventorynumber: '2222',
            quantity: 0.5
        }]
     */
    function createWorkOrderComplationByStd(mainPayload, mainLocationPayload, workorder) {
        var completedquantityValue = 0;
        var itemsList = {};
        var completedQuantityItemUse = 0;
        var headerLocation = 0;

        var headerRecord = record.transform({
            fromType: record.Type.WORK_ORDER,
            fromId: workorder, //64756, //workorder, //65366,
            toType: workordercompletion,
            //isDynamic: true,
            defaultValues: {
                isbackflush: 'T'
            }
        });

        //1.创建工作单完成的主体部分
        for (var key in mainPayload) {
            if (mainPayload.hasOwnProperty(key)) {

                if (key == 'completedquantity') {
                    completedquantityValue = mainPayload[key];
                }

                if (key == 'startoperation' || key == 'endoperation') {
                    headerRecord.setText({
                        fieldId: key,
                        text: mainPayload[key],
                        ignoreFieldChange: true
                    });
                } else {
                    headerRecord.setValue({
                        fieldId: key,
                        value: mainPayload[key],
                        ignoreFieldChange: true
                    });
                }
            }
        }

        //获取头上的库存地点
        headerLocation = headerRecord.getValue({
            fieldId: 'location'
        });

        //2.获取头库存详细信息子记录
        var headerLocSubRecord = headerRecord.getSubrecord({
            fieldId: headerLocationFieldId
        });

        //3.创建工作单完成地址详细信息
        for (var index in mainLocationPayload) {
            headerLocSubRecord.insertLine({
                sublistId: inventoryassignmentSublistId,
                line: index
            });

            for (var key in mainLocationPayload[index]) {
                headerLocSubRecord.setSublistValue({
                    sublistId: inventoryassignmentSublistId,
                    fieldId: key,
                    line: index,
                    value: mainLocationPayload[index][key]
                });
            }
        }

        //4.获取用料批次的详细数据:itemsList
        var componentSublistCount = headerRecord.getLineCount({
            sublistId: componentSublistId
        });

        for (var i = 0; i < componentSublistCount; i++) {
            //重置completedQuantityItemUse
            completedQuantityItemUse = 0;

            var itemValue = headerRecord.getSublistValue({
                sublistId: componentSublistId,
                fieldId: 'item',
                line: i
            });

            var quantityperValue = headerRecord.getSublistValue({
                sublistId: componentSublistId,
                fieldId: 'quantityper',
                line: i
            });

            completedQuantityItemUse = quantityperValue * completedquantityValue;

            itemsList[itemValue] = {
                quantityUse: completedQuantityItemUse,
                location: headerLocation,
                locationDetails: []
            };
        }

        var itemOnhandBatchListValue = itemOnhandBatchList(itemsList);

        //处理组件行及批次中的数据
        for (var i = 0; i < componentSublistCount; i++) {

            var itemValue = headerRecord.getSublistValue({
                sublistId: componentSublistId,
                fieldId: 'item',
                line: i
            });

            var quantityperValue = headerRecord.getSublistValue({
                sublistId: componentSublistId,
                fieldId: 'quantityper',
                line: i
            });

            var locationDetails = itemOnhandBatchListValue[itemValue].locationDetails;
            var quantityUseTotal = itemOnhandBatchListValue[itemValue].quantityUse;

            //如果bom用料数量大于0，则设置用料量及批次，如果小于0，则设置用料量为0
            if (quantityperValue > 0) {

                headerRecord.setSublistValue({
                    sublistId: componentSublistId,
                    fieldId: locationQuantityFieldIdL,
                    line: i,
                    value: quantityperValue * completedquantityValue
                    //ignoreFieldChange: true
                });

                //获取sublist的库存详细信息
                var sublistLocRecord = headerRecord.getSublistSubrecord({
                    sublistId: componentSublistId,
                    fieldId: sublistLocationFieldId,
                    line: i
                });

                var sublistLocLineCount = 0;

                //for (var j = 0; j < locationDetails.length; i++) {
                for (var j = locationDetails.length - 1; j >= 0; i--) {

                    //var sublistLocLineCount = 0;

                    //如果批次数量大于完工用量，则直接出库，否则按批次号从小到大出库
                    //if (quantityperValue <= locationDetails[j].quantityonhand) {
                    if (quantityUseTotal <= locationDetails[j].quantityonhand) {
                        //直接出库 
                        sublistLocRecord.insertLine({
                            sublistId: inventoryassignmentSublistId,
                            line: sublistLocLineCount
                        });

                        sublistLocRecord.setSublistValue({
                            sublistId: inventoryassignmentSublistId,
                            fieldId: issueinventorynumberFieldId,
                            line: sublistLocLineCount,
                            value: locationDetails[j].locInternalid
                            //ignoreFieldChange: true
                        });

                        sublistLocRecord.setSublistValue({
                            sublistId: inventoryassignmentSublistId,
                            fieldId: locationQuantityFieldIdL,
                            line: sublistLocLineCount,
                            value: quantityUseTotal
                            //ignoreFieldChange: true
                        });

                        break;
                    } else {

                        sublistLocRecord.insertLine({
                            sublistId: inventoryassignmentSublistId,
                            line: sublistLocLineCount
                        });

                        sublistLocRecord.setSublistValue({
                            sublistId: inventoryassignmentSublistId,
                            fieldId: issueinventorynumberFieldId,
                            line: sublistLocLineCount,
                            value: locationDetails[j].locInternalid
                            //ignoreFieldChange: true
                        });

                        sublistLocRecord.setSublistValue({
                            sublistId: inventoryassignmentSublistId,
                            fieldId: locationQuantityFieldIdL,
                            line: sublistLocLineCount,
                            value: locationDetails[j].quantityonhand
                            //ignoreFieldChange: true
                        });

                        quantityUseTotal = quantityUseTotal - locationDetails[j].quantityonhand;
                        sublistLocLineCount++;
                        locationDetails.splice(j, 1);
                    }
                }
            } else {
                headerRecord.setSublistValue({
                    sublistId: componentSublistId,
                    fieldId: locationQuantityFieldIdL,
                    line: i,
                    value: 0
                    //ignoreFieldChange: true
                });
            }
        }

        var recId = headerRecord.save();
        log.debug('recId', recId);

    }

    /**
     * @description:创建工作单完成
     * @param {*} mainPayload :工作单完成主体信息
     * @param {*} mainLocationPayload ：工作单完成地点详细信息（批次）
     * @param {*} workorder 工单号
     * @deprecated
     * 参数demo：
     * mainPayload = [{
                fieldId: 'startoperation', //originalstartoperation，startoperation
                value: 2838 //2838
            },
            {
                fieldId: 'endoperation',
                value: 2838 //2838
            },
            {
                fieldId: 'completedquantity',
                value: 1
            },
            {
                fieldId: 'quantity',
                value: 1
            }
        ];

        mainLocationPayload = [{
            receiptinventorynumber: '1111',
            quantity: 0.5
        }, {
            receiptinventorynumber: '2222',
            quantity: 0.5
        } ];

        workorder：
     */
    function createWorkOrderComplation(mainPayload, mainLocationPayload, workorder) {

        var completedquantityValue = 0;
        var itemsList = {};
        var completedQuantityItemUse = 0;
        var headerLocation = 0;

        //根据工作单创建工作单完成
        var headerRecord = record.transform({
            fromType: record.Type.WORK_ORDER,
            fromId: workorder, //64756, //workorder, //65366,
            toType: workordercompletion,
            isDynamic: true,
            defaultValues: {
                isbackflush: 'T'
            }
        });

        //设置头上的必要信息
        mainPayload.forEach(function (result) {

            if (result.fieldId == 'completedquantity') {
                completedquantityValue = result.value;
            }

            if (result.fieldId == 'startoperation' || result.fieldId == 'endoperation') {
                log.debug('3432', 1234567890);
                // headerRecord.setText({
                //     fieldId: result.fieldId,
                //     value: result.value,
                //     ignoreFieldChange: true
                // });

                headerRecord.setText({
                    fieldId: result.fieldId,
                    text: '10',
                    ignoreFieldChange: true
                });
            } else {
                headerRecord.setValue({
                    fieldId: result.fieldId,
                    value: result.value,
                    ignoreFieldChange: true
                });
            }



            return true;
        });

        //获取头上的库存地点
        headerLocation = headerRecord.getValue({
            fieldId: 'location'
        });

        //设置头上库存详细信息的必要信息

        var headerLocSubRecord = headerRecord.getSubrecord({
            fieldId: headerLocationFieldId
        });

        var HeaderLocCount = headerLocSubRecord.getLineCount({
            sublistId: inventoryassignmentSublistId
        });

        mainLocationPayload.forEach(function (result) {

            headerLocSubRecord.insertLine({
                sublistId: inventoryassignmentSublistId,
                line: HeaderLocCount
            });

            headerLocSubRecord.setCurrentSublistValue({
                sublistId: inventoryassignmentSublistId,
                fieldId: receiptinventorynumberFieldIdH,
                value: result[receiptinventorynumberFieldIdH]
            });

            headerLocSubRecord.setCurrentSublistValue({
                sublistId: inventoryassignmentSublistId,
                fieldId: locationQuantityFieldIdH,
                value: result[locationQuantityFieldIdH]
            });

            headerLocSubRecord.commitLine({
                sublistId: inventoryassignmentSublistId
            });

            HeaderLocCount++;
            return true;
        });

        //获取operation sublist中的内容，并创建数据
        var operationSublistCount = headerRecord.getLineCount({
            sublistId: operationSublistId
        });

        log.debug('operationSublistCount', operationSublistCount);
        for (var i = 0; i < operationSublistCount; i++) {
            headerRecord.selectLine({
                sublistId: operationSublistId,
                line: i
            });

            var operationsequence = headerRecord.getCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'operationsequence'
            });

            log.debug('operationsequence', operationsequence); //operationname

            var operationname = headerRecord.getCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'operationname'
            });

            log.debug('operationname', operationname); //machineresources

            var workcenter = headerRecord.getCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'workcenter'
            });

            log.debug('workcenter', workcenter);

            var machineresources = headerRecord.getCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'machineresources'
            });

            log.debug('machineresources', machineresources); //laborresources

            var laborresources = headerRecord.getCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'laborresources'
            });

            log.debug('laborresources', laborresources); //inputquantity

            var laborresources = headerRecord.getCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'laborresources'
            });

            log.debug('laborresources', laborresources); //quantityremaining

            var quantityremaining = headerRecord.getCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'quantityremaining'
            });

            log.debug('quantityremaining', quantityremaining); //completedquantity

            var completedquantity = headerRecord.getCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'completedquantity'
            });

            log.debug('completedquantity', completedquantity); //completedquantity	



            headerRecord.setCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'machineresources',
                value: 1
            }); //laborresources

            headerRecord.setCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'operationsequence',
                value: 30
            }); //laborresources

            headerRecord.setCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'laborresources',
                value: 1
            }); //laborresources

            headerRecord.setCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'completedquantity',
                value: 1
            }); //laborresources

            headerRecord.setCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'laborruntime',
                value: 0
            }); //laborresources

            headerRecord.setCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'laborsetuptime',
                value: 0
            }); //laborresources

            headerRecord.setCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'machineruntime',
                value: 0
            }); //laborresources

            headerRecord.setCurrentSublistValue({
                sublistId: operationSublistId,
                fieldId: 'machinesetuptime',
                value: 0
            }); //laborresources

            // headerRecord.commitLine({
            //     sublistId: operationSublistId
            // });
        }

        //获取component sublist中的内容，并创建数据
        var componentSublistCount = headerRecord.getLineCount({
            sublistId: componentSublistId
        });

        //获取用料批次的详细数据:itemsList
        for (var i = 0; i < componentSublistCount; i++) {

            completedQuantityItemUse = 0;

            headerRecord.selectLine({
                sublistId: componentSublistId,
                line: i
            });

            var itemValue = headerRecord.getCurrentSublistValue({
                sublistId: componentSublistId,
                fieldId: 'item'
            });

            var quantityperValue = headerRecord.getCurrentSublistValue({
                sublistId: componentSublistId,
                fieldId: 'quantityper'
            });

            completedQuantityItemUse = quantityperValue * completedquantityValue;

            //log.debug('itemValue', itemValue);

            itemsList[itemValue] = {
                quantityUse: completedQuantityItemUse,
                location: headerLocation,
                locationDetails: []
            };
        }

        var itemOnhandBatchListValue = itemOnhandBatchList(itemsList);

        //处理组件行及批次中的数据
        for (var i = 0; i < componentSublistCount; i++) {
            headerRecord.selectLine({
                sublistId: componentSublistId,
                line: i
            });

            var itemValue = headerRecord.getCurrentSublistValue({
                sublistId: componentSublistId,
                fieldId: 'item'
            });

            var quantityperValue = headerRecord.getCurrentSublistValue({
                sublistId: componentSublistId,
                fieldId: 'quantityper'
            });

            var locationDetails = itemOnhandBatchListValue[itemValue].locationDetails;
            var quantityUseTotal = itemOnhandBatchListValue[itemValue].quantityUse;

            //如果bom用料数量大于0，则设置用料量及批次，如果小于0，则设置用料量为0
            if (quantityperValue > 0) {

                headerRecord.setCurrentSublistValue({
                    sublistId: componentSublistId,
                    fieldId: locationQuantityFieldIdL,
                    value: quantityperValue * completedquantityValue,
                    ignoreFieldChange: true
                });

                //获取sublist的库存详细信息
                var sublistLocRecord = headerRecord.getCurrentSublistSubrecord({
                    sublistId: componentSublistId,
                    fieldId: sublistLocationFieldId,
                    line: i
                });

                for (var j = 0; j < locationDetails.length; i++) {
                    var sublistLocLineCount = 0;

                    //如果批次数量大于完工用量，则直接出库，否则按批次号从小到大出库
                    //if (quantityperValue <= locationDetails[j].quantityonhand) {
                    if (quantityUseTotal <= locationDetails[j].quantityonhand) {
                        //直接出库 
                        sublistLocRecord.insertLine({
                            sublistId: inventoryassignmentSublistId,
                            line: sublistLocLineCount
                        });

                        sublistLocRecord.setCurrentSublistValue({
                            sublistId: inventoryassignmentSublistId,
                            fieldId: issueinventorynumberFieldId,
                            value: locationDetails[j].locInternalid
                        });

                        sublistLocRecord.setCurrentSublistValue({
                            sublistId: inventoryassignmentSublistId,
                            fieldId: locationQuantityFieldIdL,
                            value: quantityUseTotal
                        });

                        sublistLocRecord.commitLine({
                            sublistId: inventoryassignmentSublistId
                        });
                        break;
                    } else {

                        sublistLocRecord.insertLine({
                            sublistId: inventoryassignmentSublistId,
                            line: sublistLocLineCount
                        });

                        sublistLocRecord.setCurrentSublistValue({
                            sublistId: inventoryassignmentSublistId,
                            fieldId: issueinventorynumberFieldId,
                            value: locationDetails[j].locInternalid
                        });

                        sublistLocRecord.setCurrentSublistValue({
                            sublistId: inventoryassignmentSublistId,
                            fieldId: locationQuantityFieldIdL,
                            value: locationDetails[j].quantityonhand
                        });

                        sublistLocRecord.commitLine({
                            sublistId: inventoryassignmentSublistId
                        });

                        quantityUseTotal = quantityUseTotal - locationDetails[j].quantityonhand;
                        sublistLocLineCount++;
                    }
                }
            } else {
                headerRecord.setCurrentSublistValue({
                    sublistId: componentSublistId,
                    fieldId: locationQuantityFieldIdL,
                    value: 0,
                    ignoreFieldChange: true
                });
            }

            headerRecord.commitLine({
                sublistId: componentSublistId
            });
        }

        var recId = headerRecord.save();
        log.debug('recId', recId);

    }

    /**
     * @description 获取库存详细信息
     * @author:yuming Hu
     * @param {*} option ：
     * 参数demo：itemsList = {
            1665: {
                quantityUse: 1,
                location: 14,
                locationDetails: []
            },
            1666: {
                quantityUse: 1,
                location: 14,
                locationDetails: []
            },
            37733: {
                quantityUse: 1,
                location: 14,
                locationDetails: []
            }
        };
     */
    function itemOnhandBatchList(option) {

        var itemsList = option;

        var itemIdsCriteria = Object.keys(itemsList);

        var columns = [{
                name: 'inventorynumber',
                join: "inventoryNumber",
                sortdir: "DESC" //"ASC"
            },
            {
                name: 'location',
                join: 'inventoryNumber'
            },
            {
                name: 'quantityonhand',
                join: 'inventoryNumber'
            },
            {
                name: 'internalid',
                join: 'inventoryNumber'
            }
        ];

        var filters = [
            ["type", "anyof", "InvtPart", "Assembly"],
            "AND",
            ["inventorynumber.quantityonhand", "greaterthan", "0"],
            "AND",
            ["internalid", "anyof"].concat(itemIdsCriteria)
        ];

        var sublistSearchCriteria = {
            type: 'item',
            filters: filters,
            columns: columns
        };

        searchObj = search.create(sublistSearchCriteria);

        searchObj.run().each(function (result, i) {

            var locationDetailObj = {
                inventorynumber: '',
                quantityUse: 0,
                quantityonhand: 0
            };

            var itemId = result.id;

            var inventorynumberValue = result.getValue({
                name: columns[0]
            });

            var locationValue = result.getValue({
                name: columns[1]
            });

            var quantityonhandValue = result.getValue({
                name: columns[2]
            });

            var locInternalidValue = result.getValue({
                name: columns[3]
            });

            Object.keys(itemsList).forEach(function (result) {

                if (itemId == result && itemsList[result]['location'] == locationValue) {

                    locationDetailObj.inventorynumber = inventorynumberValue;
                    locationDetailObj.quantityUse = itemsList[result]['quantityUse'];
                    locationDetailObj.quantityonhand = quantityonhandValue;
                    locationDetailObj.locInternalid = locInternalidValue;

                    itemsList[result]['locationDetails'].push(locationDetailObj);
                }

                return true;
            })
            return true;
        })

        log.debug("获取列表库存详细信息列表：", itemsList);
        return itemsList;
    }

    /**
     * @description:验证库存现有量是否充足
     * @author:yuming Hu
     * @param {*} option :
     * payload demo：itemsList = {
            location: 14,
            itemDetails: [{
                item: 1665,
                quantity: 2000
            }, {
                item: 1808,
                quantity: 1000
            }],
            status: 'E'
        };
     */
    function itemOnhandValidation(option) {
        var itemsList = option;
        var errCounter = 0;
        var itemIdsCriteria = [];

        itemsList['itemDetails'].forEach(function (result) {

            itemIdsCriteria.push(result['item']);
            return true;
        });

        var columns = [{
                name: 'quantityonhand',
                join: 'inventoryNumber',
                summary: 'SUM'
            },
            {
                name: 'itemid',
                summary: 'GROUP'
            }, {
                name: 'internalid',
                summary: 'GROUP'
            }
        ];

        var filters = [
            ["type", "anyof", "InvtPart", "Assembly"],
            "AND",
            ["inventorynumber.quantityonhand", "greaterthan", "0"],
            "AND",
            ["internalid", "anyof"].concat(itemIdsCriteria),
            "AND",
            ["inventorynumber.location", "anyof", itemsList['location']]
        ];

        var sublistSearchCriteria = {
            type: 'item',
            filters: filters,
            columns: columns
        };

        searchObj = search.create(sublistSearchCriteria);

        searchObj.run().each(function (result, i) {

            var item = result.getValue({
                name: columns[2]
            });

            var quanityOnhand = result.getValue({
                name: columns[0]
            });

            for (var j = 0; j < itemsList['itemDetails'].length; j++) {

                if (item == itemsList['itemDetails'][j]['item']) {

                    if (itemsList['itemDetails'][j]['quantity'] > quanityOnhand) {
                        itemsList['itemDetails'][j].status = 'E';
                        itemsList['itemDetails'][j].quantityAvailable = quanityOnhand;
                        errCounter++;
                    } else {

                        itemsList['itemDetails'][j].status = 'S';
                    }
                }
            }

            return true;
        });

        if (!errCounter) {
            itemsList.status = 'S';
        }

        return itemsList;
    }

    /**
     * @description:标准模式库存转移创建
     * @author:yuming Hu
     * @param {*} mainPayload:库存转移的主要信息
     * 参数demo：mainPayload = {
            subsidiary: 1,
            location: 14,
            transferlocation: 223
        };
     *  @param {*} items:货品行的信息
     *  参数demo：items = [{
                item: 1808,
                adjustqtyby: 2,
                inventorydetail: []
            },
            {
                item: 1808,
                adjustqtyby: 2,
                inventorydetail: []
            }
        ];
     */
    function createInventoryTransferByStd(mainPayload, items) {
        var inventorySublistId = 'inventory';
        var itemsList = {};

        try {
            items.forEach(function (result) {
                var innerObj = {
                    quantityUse: result.adjustqtyby,
                    location: mainPayload.location,
                    locationDetails: []
                };
                itemsList[result.item] = innerObj;
                return true;
            })

            var itemOnhandBatchListValue = itemOnhandBatchList(itemsList);

            var inventoryTransferRec = record.create({
                type: 'inventorytransfer'
            });

            //创建子库存转移主体部分
            for (var key in mainPayload) {
                if (mainPayload.hasOwnProperty(key)) {
                    inventoryTransferRec.setValue({
                        fieldId: key,
                        value: mainPayload[key]
                    });
                }
            }

            for (var itemIndex in items) {
                //每当创建一行新的货品行是，库存详细信息的数据重置为0
                var subRecordLineCount = 0;
                var quanityTotal = 0;
                var item = '';

                inventoryTransferRec.insertLine({
                    sublistId: inventorySublistId,
                    line: itemIndex
                });

                for (var key in items[itemIndex]) {
                    if (items[itemIndex].hasOwnProperty(key)) {

                        if (key == 'adjustqtyby') {
                            quanityTotal = items[itemIndex][key];
                        }

                        if (key == 'item') {
                            item = items[itemIndex][key];
                        }

                        if (key == 'inventorydetail') {

                            var sublistLocRecord = inventoryTransferRec.getSublistSubrecord({
                                sublistId: inventorySublistId,
                                fieldId: key,
                                line: itemIndex
                            });

                            var locationDetails = itemOnhandBatchListValue[item].locationDetails;

                            //for (var i = 0; i < locationDetails.length; i++) {
                            for (var i = locationDetails.length - 1; i >= 0; i--) {

                                if (quanityTotal <= locationDetails[i].quantityonhand) {
                                    //直接出库 
                                    sublistLocRecord.insertLine({
                                        sublistId: inventoryassignmentSublistId,
                                        line: subRecordLineCount
                                    });

                                    sublistLocRecord.setSublistValue({
                                        sublistId: inventoryassignmentSublistId,
                                        fieldId: issueinventorynumberFieldId,
                                        line: subRecordLineCount,
                                        value: locationDetails[i].locInternalid
                                    });

                                    sublistLocRecord.setSublistValue({
                                        sublistId: inventoryassignmentSublistId,
                                        fieldId: locationQuantityFieldIdL,
                                        line: subRecordLineCount,
                                        value: quanityTotal
                                    });
                                    break;
                                } else {

                                    sublistLocRecord.insertLine({
                                        sublistId: inventoryassignmentSublistId,
                                        line: subRecordLineCount
                                    });

                                    sublistLocRecord.setSublistValue({
                                        sublistId: inventoryassignmentSublistId,
                                        fieldId: issueinventorynumberFieldId,
                                        line: subRecordLineCount,
                                        value: locationDetails[i].locInternalid
                                    });

                                    sublistLocRecord.setSublistValue({
                                        sublistId: inventoryassignmentSublistId,
                                        fieldId: locationQuantityFieldIdL,
                                        line: subRecordLineCount,
                                        value: locationDetails[i].quantityonhand
                                    });

                                    quanityTotal = quanityTotal - locationDetails[i].quantityonhand;
                                    subRecordLineCount++;
                                    //将已经转移完毕的货品从list中删除，防止创建第二行的时候出现异常
                                    locationDetails.splice(i, 1);
                                }

                            }
                        } else {
                            inventoryTransferRec.setSublistValue({
                                sublistId: inventorySublistId,
                                fieldId: key,
                                line: itemIndex,
                                value: items[itemIndex][key]
                            });
                        }
                    }
                }
            }

            var id = inventoryTransferRec.save();

            var rtnMsg = {
                status: 'E'
            }

            if (id) {
                rtnMsg.status = 'S';
                rtnMsg.id = id;
            }

            return rtnMsg;


        } catch (e) {
            log.error({
                title: e.name,
                details: e.message
            });
        }
    }

    /**
     * 
     * @param {*} mainPayload 
     * @param {*} mainLocationPayload 
     * @param {*} workorder 
     * @deprecated
     */
    function createWorkOrderByStd(mainPayload, mainLocationPayload, workorder) {
        var mainPayload = {
            subsidiary: 1,
            assemblyitem: 6298, //1662,6298
            location: 14,
            iswip: true,
            quantity: 10,
            orderstatus: 'A',
            schedulingmethod: 'FORWARD',
            startdate: new Date(), //'2019-12-10', //new Date(),
            enddate: new Date() //new Date('2019-12-15') //'2019-12-10' //new Date()
        };

        var workOrderRec = record.create({
            type: 'workorder',
            isDynamic: true
        });

        //创建子库存转移主体部分
        for (var key in mainPayload) {
            if (mainPayload.hasOwnProperty(key)) {
                workOrderRec.setValue({
                    fieldId: key,
                    value: mainPayload[key],
                    ignoreFieldChange: false
                });
            }
        }

        var recId = workOrderRec.save();

        log.debug(recId, recId);
    }

    /**
     * 
     * @param {*} mainPayload :创建工单主要参数
     * @param {*} option :根据类型，选择执行工单的方式
     * @description 递归创建工单
     *              1、从销售订单创建工单，option.mode =create;
     *              2、从工单创建子工单，option.mode = load
     *              3、判断用料表中的货品是否需要创建子工单
     * @author yuming Hu
     * @version 1.0
     * demo:
     * mainPayload = {
            subsidiary: 1,
            assemblyitem: 1002, //37733, //1662
            location: 14,
            iswip: true,
            quantity: 10,
            orderstatus: 'A',
            schedulingmethod: 'FORWARD',
            startdate: new Date(), //'2019-12-10', //new Date(),
            enddate: new Date() //new Date('2019-12-15') //'2019-12-10' //new Date()
        };

        option = {
            mode: 'CREATE',
            pushFlag: 'Y'
            //recId: 77077
        };

        option = {
            mode: 'LOAD',
            pushFlag: 'Y',
            recId: 77077
        };
        var mainPayload = {
            subsidiary: 1,
            assemblyitem: 1002, //37733, //1662
            iswip: true,
            quantity: 10,
            orderstatus: 'A',
            schedulingmethod: 'FORWARD',
            custbody_wip_so: 52536,
            custbody_wip_so_line_information: '12344321'
        };

        var option = {
            mode: 'CREATE',
            pushFlag: 'Y',
            dateOption: {
                itemIds: 1002,
                isFreeTax: 1,
                expectReceiveDate: new Date(),
                quantity: 101
            }
            //recId: 77077
        };
     */
    function woCreationRecursive(mainPayload, option) {
        var itemSublistId = 'item'; //工单货品sublist
        var itemFieldId = 'item'; //物品字段
        var pushByHandFlagFieldId = 'custcol_if_push_down_handwork'; //是否下推
        var subWorkOrderFieldId = 'custcol_wip_wo_text_link'; //子列表工单号custcol_work_order_number
        var itemSubquantityFieldId = 'quantity'; //数量字段
        var topWorkOrderFieldId = 'custbody_wip_top_wo_id';
        var workOrderRec; //工单记录
        var recId;
        var quantity = 0; //子列表数量
        var itemIds = [];
        var mainPayload = mainPayload;
        var option = option;
        var mode = option.mode ? option.mode : 'CREATE';
        var pushFlag = option.pushFlag ? option.pushFlag : 'Y';
        var noValue = 2; //否
        var bsValue = 1;
        var yesValue = 1; //是
        var topRecId;

        log.debug('mainPayload1', mainPayload);
        log.debug('option1', option);
        //获取工单id
        if (option.recId) {
            recId = option.recId;
        }

        if (mode == 'CREATE') {
            workOrderRec = record.create({
                type: 'workorder',
                isDynamic: true
            });

            //时间，地点获取
            var dateOption = option.dateOption;
            var result = dao.routingGetter(dateOption);
            log.debug('result', result);
            mainPayload.custbody_wip_planned_commencement_date = result.startdate; //计划开始时间
            mainPayload.custbody_wip_planned_completion_date = result.enddate; //计划结束时间
            //mainPayload.location = mainPayload.location ? mainPayload.location : result.location;
            mainPayload.location = result.location;
            //mainPayload.iswip = mainPayload.iswip ? mainPayload.iswip : true; //add by yuming hu 20200424
            mainPayload.iswip = true;

            //log.debug('mainPayload', mainPayload);
            //创建工单主体部分
            for (var key in mainPayload) {
                if (mainPayload.hasOwnProperty(key)) {
                    if (mainPayload[key]) {
                        workOrderRec.setValue({
                            fieldId: key,
                            value: mainPayload[key]
                            //ignoreFieldChange: false
                        });
                    }
                }
            };

            recId = workOrderRec.save();
        }

        workOrderRec = record.load({
            type: 'workorder',
            id: recId,
            isDynamic: true
        });

        //根据来源参数是否下推子工单，如果不下推，则直接返回
        if (pushFlag == 'N') {

            //补最顶层销售订单来的顶层工单
            topRecId = workOrderRec.getValue({
                fieldId: topWorkOrderFieldId
            });

            if (!topRecId) {
                workOrderRec.setValue({
                    fieldId: topWorkOrderFieldId,
                    value: recId
                    //ignoreFieldChange: false
                });
            }

            workOrderRec.save();

            log.debug('工单Id', recId);

            return recId;
        };

        for (var key in mainPayload) {
            if (mainPayload.hasOwnProperty(key)) {

                if (!mainPayload[key]) {

                    if (key == 'location') {
                        mainPayload[key] = '';
                    } else {
                        mainPayload[key] = workOrderRec.getValue({
                            fieldId: key
                        });
                    }
                }
            }
        }

        var LineCount = workOrderRec.getLineCount({
            sublistId: itemSublistId
        });

        for (var i = 0; i < LineCount; i++) {

            var sublistpushFlag = workOrderRec.getSublistValue({
                sublistId: itemSublistId,
                fieldId: pushByHandFlagFieldId,
                line: i
            });

            var subworkOrder = workOrderRec.getSublistValue({
                sublistId: itemSublistId,
                fieldId: subWorkOrderFieldId,
                line: i
            });

            //工单为空并且下推为是，则返回货品结果集
            if (!(sublistpushFlag == noValue) && !subworkOrder) {
                itemIds.push(workOrderRec.getSublistValue({
                    sublistId: itemSublistId,
                    fieldId: itemFieldId,
                    line: i
                }));
            };
        };

        log.debug('mainPayload...', mainPayload);
        log.debug('itemIds...', itemIds);

        //获取是有bom版本的货品id结果集
        // itemIds = dao.bomGetter(itemIds).itemIds;
        itemIds = dao.bomGetter(itemIds, mainPayload.subsidiary).itemIds;

        for (var i = 0; i < LineCount; i++) {
            var item = workOrderRec.getSublistValue({
                sublistId: itemSublistId,
                fieldId: itemFieldId,
                line: i
            });

            var quantity = workOrderRec.getSublistValue({
                sublistId: itemSublistId,
                fieldId: itemSubquantityFieldId,
                line: i
            });

            var itemsource = workOrderRec.getSublistValue({
                sublistId: itemSublistId,
                fieldId: 'itemsource',
                line: i
            });

            // var isFreeTax = workOrderRec.getSublistValue({
            //     sublistId: itemSublistId,
            //     fieldId: 'custcol_whether_bonded',
            //     line: i
            // }) ? workOrderRec.getSublistValue({
            //     sublistId: itemSublistId,
            //     fieldId: 'custcol_whether_bonded',
            //     line: i
            // }) : bsValue;

            //log.debug('itemsource', itemsource);

            workOrderRec.selectLine({
                sublistId: itemSublistId,
                line: i
            });

            workOrderRec.setCurrentSublistValue({
                sublistId: itemSublistId,
                fieldId: pushByHandFlagFieldId,
                value: yesValue
            });

            //如果不是配件，则退出
            if (itemIds.indexOf(item) == -1 || itemsource == 'PHANTOM') {
                continue;
            } else {
                //补充创建参数
                mainPayload.quantity = quantity;
                mainPayload.assemblyitem = item;
                mainPayload.custbody_wip_up_wo_id = recId;
                option.dateOption.itemIds = item;
                option.dateOption.expectReceiveDate = mainPayload.custbody_wip_planned_commencement_date;
                option.dateOption.quantity = quantity;
                //option.dateOption.isFreeTax = isFreeTax;

                //删除下一轮的recId，走创建模式
                if (option.mode == 'LOAD') {
                    delete option.recId;
                }

                option.mode = 'CREATE';
                option.pushFlag = 'Y';

                //获取创建顶层工单，如果是销售订单来的，则补充该参数
                if (!mainPayload.hasOwnProperty(topWorkOrderFieldId)) {
                    mainPayload.custbody_wip_top_wo_id = recId;
                }

                child = woCreationRecursive(mainPayload, option);

                workOrderRec.setCurrentSublistValue({
                    sublistId: itemSublistId,
                    fieldId: subWorkOrderFieldId,
                    value: child
                });
            }

            workOrderRec.commitLine({
                sublistId: itemSublistId
            });

        }

        //补最顶层销售订单来的顶层工单
        topRecId = workOrderRec.getValue({
            fieldId: topWorkOrderFieldId
        });

        if (!topRecId) {
            workOrderRec.setValue({
                fieldId: topWorkOrderFieldId,
                value: recId
                //ignoreFieldChange: false
            });
        }

        workOrderRec.save();

        log.debug('工单Id', recId);

        return recId;
    }

    // function woCreationRecursive(mainPayload, option) {
    //     var itemSublistId = 'item'; //工单货品sublist
    //     var itemFieldId = 'item'; //物品字段
    //     var pushByHandFlagFieldId = 'custcol_if_push_down_handwork'; //是否下推
    //     var subWorkOrderFieldId = 'custcol_work_order_number'; //子列表工单号
    //     var itemSubquantityFieldId = 'quantity'; //数量字段
    //     var topWorkOrderFieldId = 'custbody_wip_top_wo_id';
    //     var workOrderRec; //工单记录
    //     var recId;
    //     var quantity = 0; //子列表数量
    //     var itemIds = [];
    //     var mainPayload = mainPayload;
    //     var option = option;
    //     var mode = option.mode ? option.mode : 'CREATE';
    //     var pushFlag = option.pushFlag ? option.pushFlag : 'Y';
    //     var noValue = 2; //否
    //     var yesValue = 1; //是
    //     var topRecId;

    //     //获取工单id
    //     if (option.recId) {
    //         recId = option.recId;
    //     }

    //     if (mode == 'CREATE') {
    //         workOrderRec = record.create({
    //             type: 'workorder',
    //             isDynamic: true
    //         });

    //         //时间，地点获取
    //         var dateOption = option.dateOption;
    //         var result = dao.routingGetter(dateOption);
    //         mainPayload.custbody_wip_planned_commencement_date = result.startdate; //计划开始时间
    //         mainPayload.custbody_wip_planned_completion_date = result.enddate; //计划结束时间
    //         mainPayload.location = mainPayload.location ? mainPayload.location : result.location;

    //         //创建工单主体部分
    //         for (var key in mainPayload) {
    //             if (mainPayload.hasOwnProperty(key)) {
    //                 if (mainPayload[key]) {
    //                     workOrderRec.setValue({
    //                         fieldId: key,
    //                         value: mainPayload[key]
    //                         //ignoreFieldChange: false
    //                     });
    //                 }
    //             }
    //         };

    //         recId = workOrderRec.save();
    //     }

    //     workOrderRec = record.load({
    //         type: 'workorder',
    //         id: recId,
    //         isDynamic: true
    //     });

    //     //根据来源参数是否下推子工单，如果不下推，则直接返回
    //     if (pushFlag == 'N') {

    //         //补最顶层销售订单来的顶层工单
    //         topRecId = workOrderRec.getValue({
    //             fieldId: topWorkOrderFieldId
    //         });

    //         if (!topRecId) {
    //             workOrderRec.setValue({
    //                 fieldId: topWorkOrderFieldId,
    //                 value: recId
    //                 //ignoreFieldChange: false
    //             });
    //         }

    //         workOrderRec.save();

    //         log.debug('工单Id', recId);

    //         return recId;
    //     };

    //     for (var key in mainPayload) {
    //         if (mainPayload.hasOwnProperty(key)) {

    //             if (!mainPayload[key]) {
    //                 mainPayload[key] = workOrderRec.getValue({
    //                     fieldId: key
    //                 });
    //             }
    //         }
    //     }

    //     var LineCount = workOrderRec.getLineCount({
    //         sublistId: itemSublistId
    //     });

    //     for (var i = 0; i < LineCount; i++) {

    //         var sublistpushFlag = workOrderRec.getSublistValue({
    //             sublistId: itemSublistId,
    //             fieldId: pushByHandFlagFieldId,
    //             line: i
    //         });

    //         var subworkOrder = workOrderRec.getSublistValue({
    //             sublistId: itemSublistId,
    //             fieldId: subWorkOrderFieldId,
    //             line: i
    //         });

    //         //工单为空并且下推为是，则返回货品结果集
    //         if (!(sublistpushFlag == noValue) && !subworkOrder) {
    //             itemIds.push(workOrderRec.getSublistValue({
    //                 sublistId: itemSublistId,
    //                 fieldId: itemFieldId,
    //                 line: i
    //             }));
    //         };
    //     };

    //     //获取是有bom版本的货品id结果集
    //     itemIds = dao.bomGetter(itemIds).itemIds;

    //     for (var i = 0; i < LineCount; i++) {
    //         var item = workOrderRec.getSublistValue({
    //             sublistId: itemSublistId,
    //             fieldId: itemFieldId,
    //             line: i
    //         });

    //         var quantity = workOrderRec.getSublistValue({
    //             sublistId: itemSublistId,
    //             fieldId: itemSubquantityFieldId,
    //             line: i
    //         });

    //         workOrderRec.selectLine({
    //             sublistId: itemSublistId,
    //             line: i
    //         });

    //         workOrderRec.setCurrentSublistValue({
    //             sublistId: itemSublistId,
    //             fieldId: pushByHandFlagFieldId,
    //             value: yesValue
    //         });

    //         //如果不是配件，则退出
    //         if (itemIds.indexOf(item) == -1) {
    //             continue;
    //         } else {
    //             //补充创建参数
    //             mainPayload.quantity = quantity;
    //             mainPayload.assemblyitem = item;
    //             mainPayload.custbody_wip_up_wo_id = recId;
    //             option.dateOption.itemIds = item;
    //             option.dateOption.expectReceiveDate = mainPayload.custbody_wip_planned_commencement_date;
    //             option.dateOption.quantity = quantity;

    //             //删除下一轮的recId，走创建模式
    //             if (option.mode == 'LOAD') {
    //                 delete option.recId;
    //             }

    //             option.mode = 'CREATE';
    //             option.pushFlag = 'Y';

    //             //获取创建顶层工单，如果是销售订单来的，则补充该参数
    //             if (!mainPayload.hasOwnProperty(topWorkOrderFieldId)) {
    //                 mainPayload.custbody_wip_top_wo_id = recId;
    //             }

    //             child = woCreationRecursive(mainPayload, option);

    //             workOrderRec.setCurrentSublistValue({
    //                 sublistId: itemSublistId,
    //                 fieldId: subWorkOrderFieldId,
    //                 value: child
    //             });
    //         }

    //         workOrderRec.commitLine({
    //             sublistId: itemSublistId
    //         });

    //     }

    //     //补最顶层销售订单来的顶层工单
    //     topRecId = workOrderRec.getValue({
    //         fieldId: topWorkOrderFieldId
    //     });

    //     if (!topRecId) {
    //         workOrderRec.setValue({
    //             fieldId: topWorkOrderFieldId,
    //             value: recId
    //             //ignoreFieldChange: false
    //         });
    //     }

    //     workOrderRec.save();

    //     log.debug('工单Id', recId);

    //     return recId;
    // }

    function workorderCreationSt(option) {
        var main = option.main,
            enableSourcing = option.enableSourcing,
            ignoreMandatoryFields = option.ignoreMandatoryFields,
            workorderRec;

        try {

            workorderRec = record.create({
                type: gworkorderRecTypeId,
                isDynamic: true
            });

            for (var key in main) {
                if (main.hasOwnProperty(key)) {
                    workorderRec.setValue({
                        fieldId: key,
                        value: main[key]
                    });
                }
            }

            return workorderRec.save({
                enableSourcing: enableSourcing,
                ignoreMandatoryFields: ignoreMandatoryFields
            });

        } catch (ex) {
            log.error({
                title: '创建事务处理>制造>输入工作单',
                details: ex
            });
        }
    }

    return {
        itemOnhandValidation: itemOnhandValidation,
        createInventoryTransferByStd: createInventoryTransferByStd,
        createWorkOrderComplationByStd: createWorkOrderComplationByStd,
        //createWorkOrderByStd: createWorkOrderByStd,
        woCreationRecursive: woCreationRecursive,
        workorderCreationSt: workorderCreationSt
    }
});
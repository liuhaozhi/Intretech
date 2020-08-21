/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/search',
    'N/record',
    'N/log',
    '../../app/app_wip_common.js',
    'N/task',
    'N/redirect',
    'N/format',
    'N/runtime',
    'N/format',
    '../../dao/dao_collection_utils.js',
    '../../app/app_po_common.js',
    '../../app/app_so_common.js',
    '../../app/app_inv_common.js',
    '../../app/ums_po_common.js',
    '../../app/app_get_inter_info.js',
    '../../app/app_workorder_transfer_items',
    '../../app/moment'
], function (search,
    record,
    log,
    wipCommon,
    task,
    redirect,
    format,
    runtime,
    format,
    dao,
    poCommon,
    soCommon,
    invCommon,
    umsCommon,
    interInfo,
    woInfoMod,
    moment
) {

    function action1(context) {
        // var mySearch = search.create({
        //     type: 'workordercompletion',
        //     filters: ["internalid", "anyof", "3136"],
        //     columns: ['internalid', "transactionnumber", {
        //         name: "type",
        //         join: "item"
        //     }] //{name: "type", join: "item", summary: null, type: "select", label: "类型", …}
        // });

        // var mySearch = search.create({
        //     type: 'item',
        //     filters: ['name', 'is', 'CDM/B'],
        //     columns: ['displayname', 'stockunit']
        // });


        // mySearch.run().each(function (result, i) {
        //     log.debug('workordercompletion', result);
        // });

        var objRecord = record.load({
            type: 'workordercompletion',
            id: 3136,
            isDynamic: true,
        });

        log.debug('objRecord', objRecord);

        var numLines = objRecord.getLineCount({
            sublistId: 'component'
        });

        log.debug('numLines', numLines);

        // objRecord.selectLine({
        //     'sublistId': 'component',
        //     'line': 1
        // });

        // objRecord.setCurrentSublistValue({
        //     'sublistId': 'component',
        //     'fieldId': 'quantity',
        //     'value': 249,
        //     ignoreFieldChange: true
        // });

        // objRecord.commitLine({
        //     sublistId: 'component'
        // });

        // objRecord.save();

        var a = objRecord.getSublistValue({
            sublistId: 'component',
            fieldId: 'componentinventorydetail',
            line: 1
        });

        var a = objRecord.getSublistValue({
            sublistId: 'component',
            fieldId: 'componentinventorydetail',
            line: 1
        });

        log.debug('a', a);

        objRecord.selectLine({
            'sublistId': 'component',
            'line': 1
        });

        objRecord.setCurrentSublistValue({
            'sublistId': 'component',
            'fieldId': 'quantity',
            'value': 249,
            ignoreFieldChange: true
        });

        var objSubRecord = objRecord.getCurrentSublistSubrecord({
            sublistId: 'component',
            fieldId: 'componentinventorydetail',
            line: 1
        });

        log.debug('objSubRecord', objSubRecord);


        // objRecord.commitLine({
        //     sublistId: 'component'
        // });


        var aa = objSubRecord.getSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'quantity',
            line: 0
        });

        log.debug('aa', aa);

        objSubRecord.selectLine({
            'sublistId': 'inventoryassignment',
            'line': 0
        });

        objSubRecord.setCurrentSublistValue({
            'sublistId': 'inventoryassignment',
            'fieldId': 'quantity',
            'value': 249,
            ignoreFieldChange: true
        });

        objSubRecord.commitLine({
            sublistId: 'inventoryassignment'
        });

        objRecord.commitLine({
            sublistId: 'component'
        });



        objRecord.save();
    }

    function action2(context) {
        var objRecord = record.transform({
            fromType: record.Type.WORK_ORDER,
            fromId: 65366, //65366,
            toType: 'workordercompletion',
            isDynamic: true,
        });

        log.debug('objRecord', objRecord);

        //开始操作
        objRecord.setValue({
            fieldId: 'startoperation',
            value: 2838,
            ignoreFieldChange: true
        });

        //结束操作
        objRecord.setValue({
            fieldId: 'endoperation',
            value: 2838,
            ignoreFieldChange: true
        });

        //wip
        objRecord.setValue({
            fieldId: 'isbackflush',
            value: 'T',
            ignoreFieldChange: true
        });

        //已完成数量
        objRecord.setValue({
            fieldId: 'completedquantity',
            value: 1,
            ignoreFieldChange: true
        });

        //获取组件行数
        var numLines = objRecord.getLineCount({
            sublistId: 'component'
        });

        log.debug('numLines', numLines);

        for (var i = 0; i < numLines; i++) {
            objRecord.selectLine({
                'sublistId': 'component',
                'line': i
            });

            objRecord.setCurrentSublistValue({
                'sublistId': 'component',
                'fieldId': 'quantity',
                'value': QuanityDef,
                ignoreFieldChange: true
            });

            //获取库存详细信息
            var objSubRecord = objRecord.getCurrentSublistSubrecord({
                sublistId: 'component',
                fieldId: 'componentinventorydetail',
                line: i
            });

            var objSubRecordLineCount = objSubRecord.getLineCount({
                sublistId: 'inventoryassignment'
            });

            for (var j = 0; j < objSubRecordLineCount; j++) {

            }

        }

    }

    function action2(context) {
        var comObjRecord = record.load({
            type: 'workordercompletion',
            id: 65370,
            isDynamic: true,
        });

        log.debug('comObjRecord', comObjRecord);

        var headerObjSubRecord = comObjRecord.getSubrecord({
            fieldId: 'inventorydetail'
        });

        log.debug('headerObjSubRecord', headerObjSubRecord);

        var numLines = headerObjSubRecord.getLineCount({
            sublistId: 'inventoryassignment'
        });

        log.debug('numLines', numLines);

        //工作单完成头上的信息
        for (var i = 0; i < numLines; i++) {
            headerObjSubRecord.selectLine({
                'sublistId': 'inventoryassignment',
                'line': i
            });

            //批次
            var receiptinventorynumber = headerObjSubRecord.getCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'receiptinventorynumber'
            });

            //数量
            var receiptinventorynumber = headerObjSubRecord.getCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'quantity'
            });


            log.debug('receiptinventorynumber', receiptinventorynumber);
        }

        //组件信息
        numLines = comObjRecord.getLineCount({
            sublistId: 'component'
        });

        for (var i = 0; i < numLines; i++) {

            comObjRecord.selectLine({
                'sublistId': 'component',
                'line': i
            });

            //获取库存详细信息
            var objSubRecord = comObjRecord.getCurrentSublistSubrecord({
                sublistId: 'component',
                fieldId: 'componentinventorydetail',
                line: i
            });

            var componentDetailCount = objSubRecord.getLineCount({
                sublistId: 'inventoryassignment'
            });

            log.debug('objSubRecord', objSubRecord);


            for (var j = 0; j < componentDetailCount; j++) {
                objSubRecord.selectLine({
                    'sublistId': 'inventoryassignment',
                    'line': j
                });

                //批次
                var receiptinventorynumberL = objSubRecord.getCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'receiptinventorynumber'
                });

                log.debug('receiptinventorynumberL', receiptinventorynumberL);
            }
        }

    }

    function action3(context) {
        var option = {
            workOrder: 222
        };

        var mainPayload = [{
            "fieldId": "startoperation",
            "value": '10' //2836
        }, {
            "fieldId": "endoperation",
            "value": '10' //2836
        }, {
            "fieldId": "completedquantity",
            "value": 1
        }, {
            "fieldId": "quantity",
            "value": 1
        }];

        var mainLocationPayload = [{
            "receiptinventorynumber": "12344321",
            "quantity": 1
        }];

        var workorder = 64756;
        //wipCommon.createWorkOrderComplation(option);
        wipCommon.createWorkOrderComplation(mainPayload, mainLocationPayload, workorder);
    }

    function action4(context) {
        var option = {
            workOrder: 22
        };
        wipCommon.itemOnhandBatchList(option);
    }

    function action5(context) {
        var option = {
            workOrder: 22
        };

        mainPayload = {
            subsidiary: 1,
            location: 14,
            transferlocation: 223,
            custbody_wip_work_order_id: 10510,
            custbody_wip_transfer_type: 1
        };

        items = [{
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
        var rtnMsg = wipCommon.createInventoryTransferByStd(mainPayload, items);

        log.debug('rtnMsg', rtnMsg);
    }

    function action6(context) {
        var option = {
            workOrder: 22
        };
        wipCommon.getDetails(option);
    }

    function action7(context) {
        var option = {
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
        var itemsList = wipCommon.itemOnhandValidation(option);

        log.debug('itemsList', itemsList);
    }

    function action8(context) {
        var option = {
            workOrder: 222
        };

        var mainPayload = {
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
        }];

        var workorder = 64763; //64763，64756
        //wipCommon.createWorkOrderComplation(option);
        wipCommon.createWorkOrderComplationByStd(mainPayload, mainLocationPayload, workorder);
    }

    function action9(context) {
        var option = {
            workOrder: 222
        };

        var mainPayload = {
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
        }];

        var workorder = 64763; //64763，64756
        //wipCommon.createWorkOrderComplation(option);
        wipCommon.createWorkOrderByStd(mainPayload, mainLocationPayload, workorder);
    }

    function action10(context) {
        var sublistColumnConfig = {
            'custpage_paged_type': {
                type: 'TEXT',
                label: '类型',
                useText: true
            },
            'custpage_paged_tranid': {
                type: 'TEXT',
                label: '文件编号'
            },
            'custpage_paged_internalid': {
                type: 'SELECT',
                label: '单据ID',
                source: 'transaction',
                displayType: 'HIDDEN'
            },
            'custpage_paged_formulatext_0': {
                type: 'SELECT',
                label: 'PO ID',
                source: 'transaction',
                displayType: 'HIDDEN'
            },
            'custpage_paged_formulatext_1': {
                type: 'TEXT',
                label: 'PO编号'
            },
            'custpage_paged_mainname': {
                type: 'SELECT',
                label: '供应商',
                source: 'vendor',
                displayType: 'INLINE'
            },
            'custpage_paged_trandate': {
                type: 'DATE',
                label: '日期',
            },
            'custpage_paged_currency': {
                type: 'SELECT',
                label: '货币',
                source: 'currency',
                displayType: 'INLINE'
            },
            'custpage_paged_subsidiary_currency': {
                type: 'SELECT',
                label: '本位币',
                source: 'currency',
                displayType: 'INLINE'
            },
            'custpage_paged_subsidiary': {
                type: 'SELECT',
                label: '子公司',
                source: 'subsidiary',
                displayType: 'HIDDEN'
            },
            'custpage_paged_quantityuom': { //old-custpage_paged_formulanumeric_2
                type: 'FLOAT',
                label: '数量'
            },
            'custpage_paged_fxamount': { //old-custpage_paged_formulanumeric_3
                type: 'FLOAT',
                label: '总金额'
            }
        };

        util.each(sublistColumnConfig, function (value, id) {
            log.debug('id', id);
            log.debug('value', value);
        });

        sublistColumnConfig = [{
                'custpage_paged_quantityuom': { //old-custpage_paged_formulanumeric_2
                    type: 'FLOAT',
                    label: '数量'
                }
            },
            {
                'custpage_paged_fxamount': { //old-custpage_paged_formulanumeric_3
                    type: 'FLOAT',
                    label: '总金额'
                }
            }
        ];

        util.each(sublistColumnConfig, function (value, id) {
            log.debug('id', id);
            log.debug('value', value);
        });

        sublistColumnConfig.forEach(function (result, index) {
            log.debug('index', index);
            log.debug('result', result);
        });
    }

    function CheckLength(txtObj) {
        var valLength = 0;
        for (var ii = 0; ii < txtObj.length; ii++) {
            var word = txtObj.charAt(ii);
            if (/[^\x00-\xff]/g.test(word)) {
                valLength += 2;
            } else {
                valLength++;
            }
        }
        return valLength;
        if (valLength > 100) {
            return false;
        } else {
            return true;
        }
    }

    function bomGetter() {
        var resultList = [];

        var columns = [{
                name: 'name', //客户
            },
            {
                name: 'name',
                join: 'revision' //销售订单号
            },
            {
                name: 'effectivestartdate',
                join: 'revision' //销售订单号
            },
            {
                name: 'effectiveenddate',
                join: 'revision' //销售订单号
            }
        ];

        var filters = [
            ["assemblyitem.assembly", "anyof", "1662"],
            "AND",
            ["assemblyitem.default", "is", "T"],
            "AND",
            [
                ["revision.effectivestartdate", "notafter", "today"],
                "OR",
                ["revision.effectivestartdate", "isempty", ""]
            ],
            "AND",
            [
                ["revision.effectiveenddate", "notbefore", "today"],
                "OR",
                ["revision.effectiveenddate", "isempty", ""]
            ]
        ];

        var sublistSearchCriteria = {
            type: 'bom',
            filters: filters,
            columns: columns
        };

        searchObj = search.create(sublistSearchCriteria);

        searchObj.run().each(function (result, i) {

            log.debug('result', result);
            return true;
        });

        return resultList;
    }


    function action12(context) {
        var option = {
            workOrder: 222
        };

        var mainPayload = {
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
        }];

        var workorder = 64763; //64763，64756
        //wipCommon.createWorkOrderComplation(option);

        var option1 = {
            itemIds: 1002,
            isFreeTax: 1,
            expectReceiveDate: new Date(),
            quantity: 101
        };

        //dao.routingGetter(option);

        var mainPayload = {
            subsidiary: 1,
            assemblyitem: 1002, //37733, //1662
            //location: 14,
            iswip: true,
            quantity: 10,
            orderstatus: 'A',
            schedulingmethod: 'FORWARD',
            custbody_wip_so: 52536,
            custbody_wip_so_line_information: '12344321'
            //startdate: new Date(), //'2019-12-10', //new Date(),
            //enddate: new Date() //new Date('2019-12-15') //'2019-12-10' //new Date()
        };

        //var mode = option.mode ? option.mode : 'CREATE';
        //var pushFlag = option.pushFlag ? option.pushFlag : 'Y';

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

        // var option = {
        //     mode: 'LOAD',
        //     pushFlag: 'Y',
        //     recId: 77077
        // };



        wipCommon.woCreationRecursive(mainPayload, option);
    }

    function action13(d, n) {
        if (!n) return d;
        var c = new Date(d);
        //当前日期为周六或周日，将日期前移/后移
        while (c.getDay() % 6 == 0) {
            n > 0 ? c.setDate(c.getDate() + 1) : c.setDate(c.getDate() - 1);
        }
        //应增加/减少周数
        var _w = parseInt(n / 5);
        //应增加/减少天数
        var _d = n % 5;
        if (_w != 0) c.setDate(c.getDate() + _w * 7);
        if (_d != 0) c.setDate(c.getDate() + _d)
        log.debug('c', c);
        return c;

    }

    function action14(context) {
        var mrScriptId = 'customscript_mr_wip_wo_create';
        currentUser = runtime.getCurrentUser();
        userName = currentUser.name;
        var slStatusScriptId = 'customscript_sl_get_task_status';
        var slStatusDeployId = 'customdeploy_sl_get_task_status';

        var selectedEntries = [];

        var currentDate = new Date();

        var currentDateStr = format.format({
            value: currentDate,
            type: format.Type.DATETIME
        });

        var mainPayload = {
            subsidiary: 1,
            assemblyitem: 1002, //37733, //1662
            location: 14,
            iswip: true,
            quantity: 10,
            orderstatus: 'A',
            schedulingmethod: 'FORWARD',
            startdate: currentDateStr, //'2019-12-10', //new Date(),
            enddate: currentDateStr //new Date('2019-12-15') //'2019-12-10' //new Date()
        };

        var obj = {
            "entity": "2987",
            "tranid": "ORD0000000048",
            "custcol_plan_number": "",
            "custbody_cust_ordertype": "2",
            "custbody_wip_customer_order_number": "",
            "item": "49538",
            "custcol_intretech_goods_code": "",
            "custcol_item_configuration": "",
            "unit": "PCS",
            "quantity": "1",
            "custcol_no_pushdown": "",
            "custcol_number_pushed_down": "",
            "expectedreceiptdate": "",
            "custbody_po_remark": "34534",
            "memomain": "453453",
            "custcol_whether_bonded": ""
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

        mainPayload = {
            "subsidiary": "1",
            "assemblyitem": "916",
            "iswip": true,
            "quantity": 1,
            "orderstatus": "A",
            "schedulingmethod": "FORWARD",
            "custbody_wip_so": "78626",
            "custbody_wip_so_line_information": "XMYQ0001",
            "custbody_wip_planned_commencement_date": "2019-12-21T06:11:22.000Z",
            "custbody_wip_planned_completion_date": "2019-12-22T06:11:22.000Z",
            "location": "3",
            "custbody_wip_top_wo_id": "",
            "custbody_wip_up_wo_id": 87831
        };

        mainPayload = {
            "subsidiary": "1",
            "assemblyitem": "1002",
            "iswip": true,
            "orderstatus": "A",
            "schedulingmethod": "FORWARD",
            "custbody_wip_top_wo_id": "",
            "custbody_wip_so": "78626",
            "custbody_wip_so_line_information": "XMYQ0001",
            "location": "3",
            "custbody_wip_planned_commencement_date": "2019-12-20T08:00:00.000Z",
            "quantity": 4,
            "custbody_wip_up_wo_id": "86012"
        };

        // mainPayload = {
        //     "subsidiary": "1",
        //     "iswip": true,
        //     "orderstatus": "A",
        //     "schedulingmethod": "FORWARD",
        //     //"custbody_wip_top_wo_id": "",
        //     "custbody_wip_so": "78626",
        //     "custbody_wip_so_line_information": "XMYQ0001",
        //     "location": "3",
        //     "custbody_wip_planned_commencement_date": "2019-12-20T08:00:00.000Z",
        //     "quantity": 1,
        //     "assemblyitem": "916",
        //     "custbody_wip_up_wo_id": "86012"
        // };

        // mainPayload = {
        //     "subsidiary": "1",
        //     "assemblyitem": "916",
        //     "iswip": true,
        //     "quantity": 1,
        //     "orderstatus": "A",
        //     "schedulingmethod": "FORWARD",
        //     "custbody_wip_so": "78626",
        //     "custbody_wip_so_line_information": "XMYQ0001",
        //     "custbody_wip_planned_commencement_date": "2019-12-20T08:00:00.000Z",
        //     "custbody_wip_planned_completion_date": "2019-12-22T02:15:19.000Z",
        //     "location": "3",
        //     "custbody_wip_up_wo_id": 86320,
        //     "custbody_wip_top_wo_id": 86320
        // };

        // mainPayload = {
        //     "subsidiary": "1",
        //     "assemblyitem": "916",
        //     "iswip": true,
        //     "quantity": 1,
        //     "orderstatus": "A",
        //     "schedulingmethod": "FORWARD",
        //     "custbody_wip_so": "78626",
        //     "custbody_wip_so_line_information": "XMYQ0001",
        //     "custbody_wip_planned_commencement_date": "2019-12-20T08:00:00.000Z",
        //     "custbody_wip_planned_completion_date": "2019-12-22T01:27:26.000Z",
        //     "location": "3",
        //     "custbody_wip_up_wo_id": 86119,
        //     "custbody_wip_top_wo_id": 86119
        // };

        //var mode = option.mode ? option.mode : 'CREATE';
        //var pushFlag = option.pushFlag ? option.pushFlag : 'Y';

        var option = {
            mode: 'CREATE',
            pushFlag: 'Y',
            dateOption: {
                itemIds: 1002,
                isFreeTax: 1,
                expectReceiveDate: currentDateStr,
                quantity: 101
            }
            //recId: 77077
        };

        option = {
            "mode": "CREATE",
            "pushFlag": "Y",
            "dateOption": {
                "itemIds": "916",
                "expectReceiveDate": "2019-12-26T01:14:40.051Z",
                "quantity": 1,
                "isFreeTax": 1
            }
        };

        option = {
            "mode": "CREATE",
            "pushFlag": "Y",
            "dateOption": {
                "itemIds": "916",
                "expectReceiveDate": "2019-12-20T08:00:00.000Z",
                "quantity": 1,
                "isFreeTax": 1
            }
        };


        option = {
            "mode": "CREATE",
            "pushFlag": "Y",
            "dateOption": {
                "itemIds": "916",
                "isFreeTax": "1",
                "expectReceiveDate": "2019-12-21T06:11:22.000Z",
                "quantity": 1
            }
        };

        option = {
            "mode": "CREATE",
            "pushFlag": "N",
            "dateOption": {
                "itemIds": "916",
                "expectReceiveDate": "2019-12-20T08:00:00.000Z",
                "quantity": 1,
                "isFreeTax": 1
            }
        };

        selectedEntriesObj = {
            mainPayload: mainPayload,
            option: option
        };

        for (var i = 0; i < 2; i++) {
            selectedEntries.push(selectedEntriesObj);
        }

        log.debug('JSON.stringify(selectedEntries)', JSON.stringify(selectedEntries));
        var mrTask = task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: mrScriptId,
            params: {
                custscript_dosomething: JSON.stringify(selectedEntries)
            }
        });
        var taskId = mrTask.submit();

        var nowChinaTime = format.format({
            type: format.Type.DATETIME,
            value: new Date(),
            timezone: format.Timezone.ASIA_HONG_KONG
        });

        redirect.toSuitelet({
            scriptId: slStatusScriptId,
            deploymentId: slStatusDeployId,
            parameters: {
                mrtaskid: taskId,
                taskname: '工单创建',
                taskcreator: userName,
                taskcreatetime: nowChinaTime
            }
        });
    }

    function action15(d, n, l) {
        //n为0或者null,返回原值
        if (!n) return d;
        var c = new Date(d);
        //当前日期为周六或周日，将日期前移/后移

        //每周工作日天数
        var workdayPerWeek = l.filter(function (item) {
            return item;
        }).length;;

        //应增加/减少周数
        var _w = parseInt(n / workdayPerWeek);

        //应增加/减少天数
        var _d = n % workdayPerWeek;

        if (_w != 0) c.setDate(c.getDate() + _w * 7);

        //当前是周几
        var _wd = c.getDay();
        var x = 0; //天数
        //往后推步长1，往前推步长为-1
        var step = n > 0 ? 1 : -1;

        //_d个工作日实际对应天数
        while (_d != 0) {
            var pos = (_wd + x + 7) % 7;
            if (l[pos]) {
                _d -= step;
            }
            x += step;
        }
        //结果为非工作日，调整到工作日
        while (!l[(_wd + x + 7) % 7]) {
            x += step;
        }

        c.setDate(c.getDate() + x);

        log.debug('c', c);
        return c;
    }

    function action16() {
        var c = new Date();
        var b = format.format({
            value: c,
            type: format.Type.DATETIME
        });

        log.debug('b', b);

        var d = format.parse({
            value: b,
            type: format.Type.DATETIME
        });

        log.debug('d', d);
    }

    function action17(context) {
        dao.bomGetter(1002);
    }

    function action18(context) {
        var option = {
            itemIds: 1002,
            isFreeTax: 1,
            expectReceiveDate: new Date(),
            quantity: 101
        };
        //dao.routingGetter(1002, 1);
        dao.routingGetter(option);
    }

    function action19(context) {
        var option = {
            main: {
                subsidiary: 1,
                entity: 2884,
                trandate: new Date(),
                custbody_po_list_pur_type: 1

            },
            items: [{
                item: 59,
                estimatedamount: 1
            }]
        };
        //dao.routingGetter(1002, 1);
        //dao.routingGetter(option);

        var recId = poCommon.prCreation(option);

        log.debug('recId', recId);
    }

    function action20(context) {
        var custPrRec = record.load({
            type: 'lotnumberedassemblyitem', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '1689',
            isDynamic: false
        });

        log.debug('custPrRec', custPrRec);

        var sublistName = custPrRec.getSublists();

        log.debug('sublistName', sublistName);

        var objSublist = custPrRec.getSublist({
            sublistId: 'itemvendor'
        });

        log.debug('objSublist', objSublist);

        // var aaa = custPrRec.getSublistValue({
        //     sublistId: 'itemvendor',
        //     fieldId: 'aaa',
        //     line: i
        // });

        // log.debug('aaa', aaa);

        var objColumn = objSublist.getColumn({
            fieldId: 'vendor'
        });

        log.debug('objColumn', objColumn);

        objColumn = objSublist.getColumn({
            fieldId: 'vendorprices'
        });

        log.debug('objColumn', objColumn);

        //itemvendorprice
        objColumn = objSublist.getColumn({
            fieldId: 'subsidiary'
        });

        log.debug('objColumn', objColumn);

        var aaa = custPrRec.getSublistValue({
            sublistId: 'itemvendor',
            fieldId: 'vendor',
            line: 0
        });

        log.debug('aaa', aaa);

        //vendorcurrency
        var sublistLocRecord = custPrRec.getSublistSubrecord({
            sublistId: 'itemvendor',
            fieldId: 'itemvendorprice',
            line: 0
        });

        sublistLocRecord.setSublistValue({
            sublistId: 'itemvendorpricelines',
            fieldId: 'vendorprice',
            line: 0,
            value: 100
            //ignoreFieldChange: true
        });

        log.debug('sublistLocRecord', sublistLocRecord);

        custPrRec.save();

        //<input type='hidden' autocomplete='off' name='itemvendorfields' value='vendor_displayvendorvendorcurrencyidvendorcodesubsidiary_displaysubsidiaryvendorcurrencynamepurchasepriceschedule_displayschedulepreferredvendoritemvendorpricevendorprices'></input>

    }


    function action21(context) {
        var custPrRec = record.load({
                type: 'inventoryitem', //lotnumberedassemblyitem,lotnumberedinventoryitem
                id: '51255'
            }),
            itemvendorSublistId = 'itemvendor',
            vendorFieldId = 'vendor',
            subsidiaryFieldId = 'subsidiary',
            itemvendorpriceFieldId = 'itemvendorprice';

        // log.debug('custPrRec', custPrRec);


        var json = {
            'ponum': 1,
            'vendor': 1,
            'amount': 1
        };

        var aaa = [];

        aaa.push(custPrRec);

        var sublistLocRecord = custPrRec.getSublistSubrecord({
            sublistId: itemvendorSublistId,
            fieldId: itemvendorpriceFieldId,
            line: 0
        });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(custPrRec)
        });

        // context.response.write({
        //     'output': custPrRec
        // });



    }

    function action22(context) {
        var itemvendorSublistId = 'itemvendor',
            vendorFieldId = 'vendor',
            subsidiaryFieldId = 'subsidiary',
            itemvendorpriceFieldId = 'itemvendorprice',
            itemvendorpricelinesSublistId = 'itemvendorpricelines';

        var custPrRec = record.load({
            type: 'lotnumberedinventoryitem', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '1208',
            isDynamic: false
        });

        // log.debug('custPrRec', custPrRec);//86  subsidiary：1 preferredvendor：T vendor:86  vendorprices:"CNY: 9.00"


        // var json = {
        //     'ponum': 1,
        //     'vendor': 1,
        //     'amount': 1
        // };

        // var aaa = [];

        // aaa.push(custPrRec);

        // context.response.setHeader({
        //     'name': 'Content-Type',
        //     'value': 'application/json'
        // });

        // context.response.write({
        //     'output': JSON.stringify(aaa)
        // });

        // context.response.write({
        //     'output': custPrRec
        // });

        custPrRec.insertLine({
            sublistId: itemvendorSublistId,
            line: 0
        });

        custPrRec.setSublistValue({
            sublistId: itemvendorSublistId,
            fieldId: vendorFieldId,
            line: 0,
            value: 86
        });

        custPrRec.setSublistValue({
            sublistId: itemvendorSublistId,
            fieldId: subsidiaryFieldId,
            line: 0,
            value: 1
        });

        // custPrRec.setSublistValue({
        //     sublistId: itemvendorSublistId,
        //     fieldId: 'vendorprices',
        //     line: 0,
        //     value: "CNY: 9.00"
        // });

        var sublistLocRecord = custPrRec.getSublistSubrecord({
            sublistId: itemvendorSublistId,
            fieldId: itemvendorpriceFieldId,
            line: 0
        });


        sublistLocRecord.insertLine({
            sublistId: itemvendorpricelinesSublistId,
            line: 0
        });


        sublistLocRecord.setSublistValue({
            sublistId: itemvendorpricelinesSublistId,
            fieldId: 'vendorcurrency',
            line: 0,
            value: 1
            //ignoreFieldChange: true
        });

        sublistLocRecord.setSublistValue({
            sublistId: itemvendorpricelinesSublistId,
            fieldId: 'vendorprice',
            line: 0,
            value: 1
            //ignoreFieldChange: true
        });

        var recid = custPrRec.save();

        log.debug('recid', recid);

    }

    function action23(context) {
        var columns = [{
                name: 'custentity_deputy_subsidiaries' //请求编号
            }],
            filters = [
                ["internalid", "anyof", "10874"]
            ],
            sublistSearchCriteria = {
                type: 'vendor',
                filters: filters,
                columns: columns
            },
            searchObj,
            isEx = false,
            soRecordTypeId = 'estimate',
            soRec = record.create({
                type: soRecordTypeId
            });

        var mainPayload = {
            'custbody_cust_ordertype': 1,
            'currency': 1,
            'entity': 81,
            'trandate': new Date()
            //'subsidiary': '1'
        };

        for (var key in mainPayload) {
            if (mainPayload.hasOwnProperty(key)) {
                soRec.setValue({
                    fieldId: key,
                    value: mainPayload[key]
                });
            }
        }

        soRec.insertLine({
            sublistId: 'item',
            line: 0
        });

        soRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: 0,
            value: 20
        });

        soRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            line: 0,
            value: 21
        });

        var recId = soRec.save();

        log.debug('recId', recId);

    }

    function action24(context) {
        var option = {

            mainPayload: {
                custbody_cust_ordertype: 1,
                currency: 1,
                entity: 81,
                trandate: new Date()
            },
            items: [{
                item: 59,
                rate: 2
            }]
        };

        var recId = soCommon.estimateCreationSTM(option);

        log.debug('recId', recId);
    }

    function action25(context) {
        var option = {

            mainPayload: {
                entity: 10977,
                currency: 1,
                custbody_po_list_pur_type: 1,
                trandate: new Date()
            },
            items: [{
                item: 21,
                rate: 2
            }]
        };

        var recId = poCommon.poCreationSTM(option);

        log.debug('recId', recId);
    }

    function action26(context) {
        var custPrRec = record.load({
            type: 'purchaseorder', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '108758', //，108520
            isDynamic: false
        });

        var headerLocationFieldId = 'inventorydetail';

        // log.debug('custPrRec', custPrRec);


        var aaa = [];

        aaa.push(custPrRec);

        var sublistLocRecord = custPrRec.getSublistSubrecord({
            sublistId: 'item',
            fieldId: 'inventorydetail',
            line: 0
        });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(sublistLocRecord)
        });

        // context.response.write({
        //     'output': custPrRec
        // });



    }

    function action27(context) {
        var option = {

            main: {
                entity: 10977,
                currency: 1,
                //custbody_po_list_pur_type: 1,
                approvalstatus: 2,
                custbody_whether_ntercompany_transact: true,
                trandate: new Date()
            },
            items: [{
                item: 21,
                rate: 2
            }],
            enableSourcing: false,
            ignoreMandatoryFields: true
        };

        //批次
        var option1 = {

            main: {
                entity: 10976,
                subsidiary: 29,
                location: 243,
                currency: 1,
                //custbody_po_list_pur_type: 1,
                approvalstatus: 2,
                trandate: new Date()
            },
            items: [{
                item: 20,
                rate: 2,
                quantity: 2
                // inventorydetail: [{
                //     receiptinventorynumber: 6534,
                //     quantity: 2
                // }]
            }],
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        var recId = poCommon.purchaseorderCreationSt(option);

        log.debug('recId', recId);
    }

    function action28(context) {
        var custPrRec = record.load({
            type: 'purchaseorder', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '113044', //，108520
            isDynamic: true
        });

        var headerLocationFieldId = 'inventorydetail';

        // log.debug('custPrRec', custPrRec);


        var aaa = [];

        aaa.push(custPrRec);

        // custPrRec.selectLine({
        //     sublistId: 'item',
        //     line: 0
        // });

        // var sublistLocRecord = custPrRec.getCurrentSublistSubrecord({
        //     sublistId: 'item',
        //     fieldId: 'inventorydetail'
        // });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(custPrRec)
        });

        // context.response.write({
        //     'output': custPrRec
        // });



    }

    function action30(context) {
        var custPrRec = record.load({
            type: 'salesorder', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '113008', //，108520
            isDynamic: true
        });

        var headerLocationFieldId = 'inventorydetail';

        // log.debug('custPrRec', custPrRec);


        var aaa = [];

        aaa.push(custPrRec);

        custPrRec.selectLine({
            sublistId: 'item',
            line: 0
        });

        var sublistLocRecord = custPrRec.getCurrentSublistSubrecord({
            sublistId: 'item',
            fieldId: 'inventorydetail'
        });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(custPrRec)
        });

        // context.response.write({
        //     'output': custPrRec
        // });



    }

    function action29(context) {
        var option = {

            main: {
                entity: 10977,
                currency: 1,
                //custbody_po_list_pur_type: 1,
                approvalstatus: 2,
                trandate: new Date()
            },
            items: [{
                item: 21,
                rate: 2
            }],
            enableSourcing: false,
            ignoreMandatoryFields: true
        };

        //批次
        var option1 = {

            main: {
                entity: 11082,
                currency: 1,
                //custbody_po_list_pur_type: 1,
                //approvalstatus: 2,
                orderstatus: 'B',
                trandate: new Date()
            },
            items: [{
                item: 39521,
                rate: 2,
                quantity: 2,
                location: 231,
                inventorydetail: [{
                        issueinventorynumber: 1022,
                        quantity: 1
                    },
                    {
                        issueinventorynumber: 953,
                        quantity: 1
                    }
                ]
            }],
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        var recId = poCommon.purchaseorderCreationSt(option1);

        log.debug('recId', recId);
    }

    function action31(context) {
        var option = {

            main: {
                entity: 11082, //2953
                currency: 1,
                //custbody_po_list_pur_type: 1,
                //approvalstatus: 2,
                orderstatus: 'B',
                trandate: new Date()
                //department: 12
            },
            items: [{
                item: 39521,
                rate: 2,
                quantity: 4
            }],
            enableSourcing: false,
            ignoreMandatoryFields: true
        };

        var option2 = {

            main: {
                entity: 11082,
                currency: 1,
                //custbody_po_list_pur_type: 1,
                //approvalstatus: 2,
                orderstatus: 'B',
                trandate: new Date()
            },
            items: [{
                    item: 39521,
                    rate: 2,
                    quantity: 2,
                    location: 231,
                    inventorydetail: [{
                            issueinventorynumber: 1022,
                            quantity: 1
                        },
                        {
                            issueinventorynumber: 953,
                            quantity: 1
                        }
                    ]
                },
                {
                    item: 39521,
                    rate: 2,
                    quantity: 3,
                    location: 231,
                    inventorydetail: [{
                            issueinventorynumber: 1022,
                            quantity: 1
                        },
                        {
                            issueinventorynumber: 953,
                            quantity: 2
                        }
                    ]
                }
            ],
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        var recId = soCommon.salesorderCreationSt(option);

        log.debug('recId', recId);
    }


    function action32(context) {
        var option = {

            main: {
                createdfrom: 110862
                //currency: 1,
                //custbody_po_list_pur_type: 1,
                //approvalstatus: 2,
                //orderstatus: 'B',
                ///trandate: new Date(),
                //department: 12
            },
            items: [{
                item: 1625,
                location: 2,
                quantity: 1
            }],
            enableSourcing: false,
            ignoreMandatoryFields: true
        };

        //批次
        var option1 = {

            main: {
                customform: 98,
                entity: 10976,
                subsidiary: 29,
                location: 243,
                currency: 1,
                orderstatus: 'B',
                //custbody_po_list_pur_type: 1,
                //approvalstatus: 2,
                trandate: new Date()
            },
            items: [{
                item: 20,
                rate: 2,
                quantity: 2
                // inventorydetail: [{
                //     receiptinventorynumber: 6534,
                //     quantity: 2
                // }]
            }],
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        var option2 = {

            main: {
                createdfrom: 112321
                //currency: 1,
                //custbody_po_list_pur_type: 1,
                //approvalstatus: 2,
                //orderstatus: 'B',
                ///trandate: new Date(),
                //department: 12
            },
            items: [{
                item: 39521,
                location: 231,
                quantity: 3,
                inventorydetail: [{
                        issueinventorynumber: 953,
                        quantity: 1
                    },
                    {
                        issueinventorynumber: 953,
                        quantity: 2
                    }
                ]
            }],
            enableSourcing: false,
            ignoreMandatoryFields: true
        };

        var recId = soCommon.itemfulfillmentCreationSt(option2);

        log.debug('recId', recId);
    }

    function action33(context) {
        var custPrRec = record.load({
            type: 'itemfulfillment', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '38156', //108530，108825--非批次货品
            isDynamic: true
        });

        var headerLocationFieldId = 'inventorydetail';

        // log.debug('custPrRec', custPrRec);


        var aaa = [];

        aaa.push(custPrRec);

        custPrRec.selectLine({
            sublistId: 'item',
            line: 0
        });

        var sublistLocRecord = custPrRec.getCurrentSublistSubrecord({
            sublistId: 'item',
            fieldId: 'inventorydetail'
        });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(sublistLocRecord)
        });

        // context.response.write({
        //     'output': custPrRec
        // });



    }

    function action34(context) {
        var custPrRec = record.load({
            type: 'itemreceipt', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '163239', //108530，108825--非批次货品
            isDynamic: true
        });

        var headerLocationFieldId = 'inventorydetail';

        // log.debug('custPrRec', custPrRec);


        var aaa = [];

        aaa.push(custPrRec);

        custPrRec.selectLine({
            sublistId: 'item',
            line: 0
        });

        var sublistLocRecord = custPrRec.getCurrentSublistSubrecord({
            sublistId: 'item',
            fieldId: 'inventorydetail'
        });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(sublistLocRecord)
        });

        // context.response.write({
        //     'output': custPrRec
        // });



    }

    function action35(context) {
        var option = {

            main: {
                createdfrom: 113360
                //currency: 1,
                //custbody_po_list_pur_type: 1,
                //approvalstatus: 2,
                //orderstatus: 'B',
                ///trandate: new Date(),
                //department: 12
            },
            items: [{
                item: 1625,
                location: 246,
                quantity: 3
            }],
            enableSourcing: false,
            ignoreMandatoryFields: true
        };

        var option2 = {

            main: {
                createdfrom: 113354
                //currency: 1,
                //custbody_po_list_pur_type: 1,
                //approvalstatus: 2,
                //orderstatus: 'B',
                ///trandate: new Date(),
                //department: 12
            },
            items: [{
                item: 20,
                location: 246,
                quantity: 3,
                inventorydetail: [{
                        receiptinventorynumber: 12,
                        quantity: 1
                    },
                    {
                        receiptinventorynumber: 22,
                        quantity: 2
                    }
                ]
            }],
            enableSourcing: false,
            ignoreMandatoryFields: true
        };

        var recId = poCommon.itemreceiptCreationSt(option2);

        log.debug('recId', recId);
    }

    function action36(context) {
        var custPrRec = record.load({
            type: 'salesorder', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '120567', //108530，108825--非批次货品
            isDynamic: true
        });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(custPrRec)
        });

    }

    function action37(context) {
        var custPrRec = record.load({
            type: 'itemfulfillment', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '121680' //108530，108825--非批次货品
        });

        var inventorydetailSubRec = custPrRec.getSublistSubrecord({
            sublistId: 'item',
            fieldId: 'inventorydetail',
            line: 0
        });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(custPrRec)
        });

    }

    function action38(context) {
        var custPrRec = record.load({
            type: 'itemreceipt', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '121682' //108530，108825--非批次货品
            //isDynamic: true
        });

        var inventorydetailSubRec = custPrRec.getSublistSubrecord({
            sublistId: 'item',
            fieldId: 'inventorydetail',
            line: 0
        });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(inventorydetailSubRec)
        });

    }

    function action39(context) {
        var option2 = {

            main: {
                createdfrom: 121678
                //currency: 1,
                //custbody_po_list_pur_type: 1,
                //approvalstatus: 2,
                //orderstatus: 'B',
                ///trandate: new Date(),
                //department: 12
            },
            items: [{
                item: 39521,
                location: 4,
                quantity: 1,
                inventorydetail: [{
                    issueinventorynumber: 953,
                    //issueinventorynumber_display: 1,
                    quantity: 1
                }]
            }],
            enableSourcing: false,
            ignoreMandatoryFields: true
        };

        var recId = soCommon.itemfulfillmentCreationSt(option2);

        log.debug('recId', recId);
    }

    function action40(context) {
        //批次
        var option1 = {

            main: {
                entity: 13142,
                approvalstatus: 2,
                //location: 4,
                trandate: new Date()
            },
            items: [{
                    item: 39521,
                    rate: 2,
                    quantity: 1,
                    line: 1
                },
                {
                    item: 39521,
                    rate: 2,
                    quantity: 3,
                    line: 2
                }
            ],
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        var recId = poCommon.purchaseorderCreationSt(option1);

        log.debug('recId', recId);

        if (recId) {
            var option2 = {

                main: {
                    createdfrom: recId
                },
                items: [{
                        line: 1,
                        location: 4,
                        quantity: 1,
                        inventorydetail: [{
                            receiptinventorynumber: 12,
                            quantity: 1
                        }]
                    },
                    {
                        line: 2,
                        location: 4,
                        quantity: 3,
                        inventorydetail: [{
                                receiptinventorynumber: 13,
                                quantity: 1
                            },
                            {
                                receiptinventorynumber: 13,
                                quantity: 2
                            }
                        ]
                    }
                ],
                enableSourcing: false,
                ignoreMandatoryFields: true
            };

            var rrrrecId = poCommon.itemreceiptCreationSt(option2);

            log.debug('rrrrecId', rrrrecId);
        }
    }

    function action41(context) {
        var custPrRec = record.load({
            type: 'purchaseorder', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '122471' //108530，108825--非批次货品
            //isDynamic: true
        });

        // var inventorydetailSubRec = custPrRec.getSublistSubrecord({
        //     sublistId: 'item',
        //     fieldId: 'inventorydetail',
        //     line: 0
        // });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(custPrRec)
        });

    }

    function action42(context) {
        var custPrRec = record.load({
            type: 'itemreceipt', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '124033' //108530，108825--非批次货品
            //isDynamic: true
        });

        // var inventorydetailSubRec = custPrRec.getSublistSubrecord({
        //     sublistId: 'item',
        //     fieldId: 'inventorydetail',
        //     line: 0
        // });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(custPrRec)
        });

    }

    function action44(context) {
        var objRecord = record.copy({
            type: 'estimate',
            id: 128300
        });

        ///var recid = objRecord.save();

        //log.debug('recid', recid);
        // return;

        var numLines = objRecord.getLineCount({
            sublistId: 'item'
        });

        log.debug('numLines', numLines);

        //custcol_line

        for (var i = numLines - 1; i >= 0; i--) {
            var linev = objRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_line',
                line: i
            });

            log.debug('linev', linev);

            if (linev == '3') {
                objRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i,
                    value: 1000
                });
            } else {
                objRecord.removeLine({
                    sublistId: 'item',
                    line: i
                    //ignoreRecalc: true
                });
            }

            // if (linev == '2') {
            //     objRecord.setSublistValue({
            //         sublistId: 'item',
            //         fieldId: 'quantity',
            //         line: i,
            //         value: 1000
            //     });
            // } else {
            //     objRecord.removeLine({
            //         sublistId: 'item',
            //         line: i
            //         //ignoreRecalc: true
            //     });
            // }
        }

        var recId = objRecord.save();
        log.debug('recId', recId);

    }


    function action45(context) {
        //批次
        var option1 = {

            main: {
                //"createdfrom": "154",
                "entity": "13142"
                //"currency": "2"
                //"approvalstatus": 2,
                //"custbody_source_doc_creator": "",
                //"trandate": "2020-03-20T07:00:00.000Z",
                //"custbody_whether_ntercompany_transact": true
            },
            items: [{
                'item': 39521
            }],
            // items: [{
            //         "item": "39521"
            //         //"quantity": 1,
            //         //"rate": 1
            //         //"line": 1,
            //         //"custcol_source_issue_doc_no": "128189",
            //         //"custcol_source_issue_doc_line_no": "0"
            //     }
            // {
            //     "item": "39521",
            //     "quantity": 1,
            //     "rate": 1
            //     //"line": 2,
            //     //"custcol_source_issue_doc_no": "128189",
            //     //"custcol_source_issue_doc_line_no": "3"
            // }
            // ],
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        var recId = poCommon.purchaseorderCreationSt(option1);

        log.debug('recId', recId);
    }

    function action46(context) {
        var custPrRec = record.load({
            type: 'inventorytransfer', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '135070' //108530，108825--非批次货品
            //isDynamic: true
        });

        var inventorydetailSubRec = custPrRec.getSublistSubrecord({
            sublistId: 'inventory',
            fieldId: 'inventorydetail',
            line: 0
        });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(custPrRec)
        });

    }

    function action47(context) {
        //批次
        var option1 = {

            main: {
                subsidiary: 2,
                trandate: new Date(),
                location: 4,
                transferlocation: 460
            },
            items: [{
                    item: 39521,
                    adjustqtyby: 1,
                    inventorydetail: [{
                        issueinventorynumber: 953,
                        quantity: 1
                    }]
                },
                {
                    item: 39521,
                    adjustqtyby: 3,
                    inventorydetail: [{
                            issueinventorynumber: 953,
                            quantity: 1
                        },
                        {
                            issueinventorynumber: 953,
                            quantity: 2
                        }
                    ]
                }
            ],
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        var recId = invCommon.inventorytransferCreationSt(option1);

        log.debug('recId', recId);

        var option2 = {

            main: {
                subsidiary: 2,
                trandate: new Date(),
                location: 4,
                transferlocation: 460
            },
            items: [{
                    item: 57868,
                    adjustqtyby: 1
                },
                {
                    item: 57868,
                    adjustqtyby: 3
                }
            ],
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        var recId1 = invCommon.inventorytransferCreationSt(option2);
        log.debug('recId1', recId1);

        var option3 = {

            main: {
                subsidiary: 2,
                trandate: new Date(),
                location: 4,
                transferlocation: 460
            },
            items: [{
                    item: 57868,
                    adjustqtyby: 1
                },
                {
                    item: 39521,
                    adjustqtyby: 3,
                    inventorydetail: [{
                            issueinventorynumber: 953,
                            quantity: 1
                        },
                        {
                            issueinventorynumber: 953,
                            quantity: 2
                        }
                    ]
                }
            ],
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        var recId2 = invCommon.inventorytransferCreationSt(option3);
        log.debug('recId2', recId2);
    }

    function action48(context) {
        var currentUser = runtime.getCurrentUser();
        var subsidiary = currentUser.subsidiary;

        log.debug('subsidiary', subsidiary);

    }

    function action49(context) {
        var custPrRec = record.load({
            type: 'estimate', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '55099' //108530，108825--非批次货品
            //isDynamic: true
        });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(custPrRec)
        });

    }

    function action50(context) {
        var custPrRec = record.load({
            type: 'workorder', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '162930' //108530，108825--非批次货品
            //isDynamic: true
        });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(custPrRec)
        });

    }

    function action51(context) {
        var option = {

            main: {
                subsidiary: 1,
                assemblyitem: 906,
                quantity: 5,
                trandate: new Date()
            },
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        var recId = wipCommon.workorderCreationSt(option);

        log.debug('recId', recId);
    }

    function action52(context) {
        var custPrRec = record.load({
            type: 'workordercompletion', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '163236' //108530，108825--非批次货品
            //isDynamic: true
        });

        var gSlComponentId = 'component';
        var gSublistLocationFieldId = 'componentinventorydetail';

        var inventorydetailSubRec = custPrRec.getSublistSubrecord({
            sublistId: gSlComponentId,
            fieldId: gSublistLocationFieldId,
            line: 0
        });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(inventorydetailSubRec)
        });

    }

    function action53(context) {
        var custPrRec = record.load({
            type: 'customrecord_wip_work_order_completion', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '1' //108530，108825--非批次货品
            //isDynamic: true
        });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(custPrRec)
        });

    }

    function action54(context) {

        var componentSublistId = 'component';
        var operationSublistId = 'operation';
        var headerLocationFieldId = 'inventorydetail';
        var sublistLocationFieldId = 'componentinventorydetail';

        var custPrRec = record.load({
            type: 'workordercompletion', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '168073' //108530，108825--非批次货品
            //isDynamic: true
        });

        var headerLocSubRecord = custPrRec.getSubrecord({
            fieldId: headerLocationFieldId
        });

        var sublistLocRecord = custPrRec.getSublistSubrecord({
            sublistId: componentSublistId,
            fieldId: sublistLocationFieldId,
            line: 2
        });

        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(headerLocSubRecord)
        });

    }


    function action55(context) {

        var option1 = {

            main: {
                createdfrom: 150860,
                startoperation: '10',
                endoperation: '10',
                completedquantity: 1,
                quantity: 1,
                inventorydetail: [{
                    receiptinventorynumber: '1111',
                    quantity: 0.5
                }, {
                    receiptinventorynumber: '2222',
                    quantity: 0.5
                }]
            },
            component: [{
                    item: 918,
                    quantity: 1,
                    componentinventorydetail: [{
                        issueinventorynumber: 4682,
                        quantity: 1
                    }]
                },
                {
                    item: 902,
                    quantity: 1,
                    componentinventorydetail: [{
                        issueinventorynumber: 4702,
                        quantity: 1
                    }]
                },
                {
                    item: 916,
                    quantity: 1,
                    componentinventorydetail: [{
                        issueinventorynumber: 4662,
                        quantity: 1
                    }]
                }
            ],
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        var recId = invCommon.workordercompletionCreationSt(option1);

        log.debug('recId', recId);

    }

    function action56(context) {


        var custPrRec = record.load({
            type: 'estimate', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '156430' //108530，108825--非批次货品
            //isDynamic: true
        });


        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(custPrRec)
        });

    }

    function action57(context) {

        var option = {
            entity: 13135
        };

        interInfo.getInterPurchInfo(option);

        // var recId = invCommon.workordercompletionCreationSt(option1);

        // log.debug('recId', recId);

        // var option = {
        //     subsidiary: 26,
        //     intersub: 2,
        //     currency: 2
        // };

        // getInterPriceListInfo(option);

    }

    function action58(context) {

        var option = {
            subsidiary: 26,
            intersub: 2,
            currency: 2
        };

        interInfo.getInterPriceListInfo(option);

    }


    function action59(context) {

        var option1 = {

            main: {
                createdfrom: 159369,
                startoperation: '5',
                endoperation: '5',
                completedquantity: 1,
                quantity: 1,
                inventorydetail: [{
                    receiptinventorynumber: '1111',
                    quantity: 0.5
                }, {
                    receiptinventorynumber: '2222',
                    quantity: 0.5
                }]
            },
            component: [{
                    item: 1644,
                    quantity: 1,
                    componentinventorydetail: [{
                        issueinventorynumber: 5832,
                        binnumber: 23,
                        quantity: 1
                    }]
                },
                {
                    item: 58884,
                    quantity: 1,
                    componentinventorydetail: [{
                        issueinventorynumber: 5837,
                        binnumber: 23,
                        quantity: 1
                    }]
                }
            ],
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        var recId = invCommon.workordercompletionCreationSt(option1);

        log.debug('recId', recId);

    }

    function action60(context) {

        var option1 = {

            main: {
                createdfrom: 159369,
                startoperation: '5',
                endoperation: '5',
                completedquantity: 1,
                quantity: 1,
                inventorydetail: [{
                    receiptinventorynumber: '1111',
                    quantity: 0.5
                }, {
                    receiptinventorynumber: '2222',
                    quantity: 0.5
                }]
            },
            component: [{
                    item: 1644,
                    quantity: 1,
                    componentinventorydetail: [{
                        issueinventorynumber: '202005110000',
                        binnumber: 23,
                        quantity: 1
                    }]
                },
                {
                    item: 58884,
                    quantity: 1,
                    componentinventorydetail: [{
                        issueinventorynumber: '202005110001',
                        binnumber: 23,
                        quantity: 1
                    }]
                }
            ],
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        var recId = invCommon.workordercompletionCreationStV2(option1);

        log.debug('recId', recId);

    }

    function action61(context) {

        var option1 = {
            "main": {
                "createdfrom": "159369",
                "startoperation": "5",
                "endoperation": "5",
                "completedquantity": 1,
                "quantity": 1,
                "inventorydetail": [{
                    "receiptinventorynumber": "20200513001",
                    "quantity": 1
                }]
            },
            "component": [{
                "item": "1644",
                "quantity": 1,
                "componentinventorydetail": [{
                    "issueinventorynumber": "202005120003",
                    "binnumber": "23",
                    "quantity": 1
                }]
            }, {
                "item": "58884",
                "quantity": 1,
                "componentinventorydetail": [{
                    "issueinventorynumber": "20200513001",
                    "binnumber": "23",
                    "quantity": 1
                }]
            }],
            "enableSourcing": true,
            "ignoreMandatoryFields": true
        };

        var recId = invCommon.workordercompletionCreationStV2(option1);

        log.debug('recId', recId);

    }


    function action62(context) {
        //批次
        // var option1 = {

        //     main: {
        //         subsidiary: 2,
        //         trandate: new Date(),
        //         location: 4,
        //         transferlocation: 460
        //     },
        //     items: [{
        //             item: 39521,
        //             adjustqtyby: 1,
        //             inventorydetail: [{
        //                 issueinventorynumber: 953,
        //                 quantity: 1
        //             }]
        //         },
        //         {
        //             item: 39521,
        //             adjustqtyby: 3,
        //             inventorydetail: [{
        //                     issueinventorynumber: 953,
        //                     quantity: 1
        //                 },
        //                 {
        //                     issueinventorynumber: 953,
        //                     quantity: 2
        //                 }
        //             ]
        //         }
        //     ],
        //     enableSourcing: true,
        //     ignoreMandatoryFields: true
        // };

        // var recId = invCommon.inventorytransferCreationSt(option1);

        // log.debug('recId', recId);

        var option2 = {

            main: {
                subsidiary: 1,
                trandate: new Date(),
                location: 13,
                transferlocation: 143,
                custbody_wip_work_order_id: 165881,
                custbody_wip_transfer_type: 4,
                orderstatus: "B"
            },
            items: [{
                item: 918,
                quantity: 1
            }],
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        var option3 = {

            main: {
                subsidiary: 1,
                trandate: new Date(),
                location: 13,
                transferlocation: 143,
                custbody_wip_work_order_id: 165881,
                custbody_wip_transfer_type: 4,
                orderstatus: "B"
            },
            items: [{
                item: 918,
                quantity: 1,
                inventorydetail: [{
                    issueinventorynumber: '202005180001',
                    quantity: 1
                }]
            }],
            enableSourcing: true,
            ignoreMandatoryFields: true
        };


        var recId1 = invCommon.transferorderCreationSt(option3);
        log.debug('recId1', recId1);

        // var option3 = {

        //     main: {
        //         subsidiary: 2,
        //         trandate: new Date(),
        //         location: 4,
        //         transferlocation: 460
        //     },
        //     items: [{
        //             item: 57868,
        //             adjustqtyby: 1
        //         },
        //         {
        //             item: 39521,
        //             adjustqtyby: 3,
        //             inventorydetail: [{
        //                     issueinventorynumber: 953,
        //                     quantity: 1
        //                 },
        //                 {
        //                     issueinventorynumber: 953,
        //                     quantity: 2
        //                 }
        //             ]
        //         }
        //     ],
        //     enableSourcing: true,
        //     ignoreMandatoryFields: true
        // };

        // var recId2 = invCommon.inventorytransferCreationSt(option3);
        // log.debug('recId2', recId2);
    }

    function action63(context) {


        var custPrRec = record.load({
            type: 'transferorder', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '166197' //108530，108825--非批次货品
            //isDynamic: true
        });

        var sublistLocRecord = custPrRec.getSublistSubrecord({
            sublistId: 'item',
            fieldId: 'inventorydetail',
            line: 0
        });


        context.response.setHeader({
            'name': 'Content-Type',
            'value': 'application/json'
        });

        context.response.write({
            'output': JSON.stringify(sublistLocRecord)
        });

    }

    function action64(context) {


        //165878

        //  var queryResult = woInfoMod.getWorkOrderInfo(165878);

        const queryResult = woInfoMod.getWorkOrderInfo('165878');
        const woInfo = Object.fromEntries(queryResult.woInfo);

        log.debug('queryResult', queryResult);
        log.debug('woInfo', woInfo);

    }

    function action65(context) {
        now = moment();
        log.debug('now', now);
        var period = now.utc(8);
        log.debug('period', period);

        var c = now.format('YYYYMMDD');
        log.debug('c', c);
    }


    function getNowString(context) {
        var now = new Date();

        log.debug('111', now.getTimezoneOffset());

        var nowString = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().PadLeft(2, '0') +
            now.getDate().toString();
        log.debug('nowString', nowString);

        return nowString;
    }

    String.prototype.PadLeft = function (len, charStr) {
        var s = this + '';
        return new Array(len - s.length + 1).join(charStr || '') + s;
    }

    function create_intercompany_po_recceive_data(context) {
        //本程序第一版本 未检查编码是否一致
        var option = {
            main: {
                custrecord_po_custom_bill_number: null,
                custrecord_ums_shipment_date: new Date(), //format.parse({ value: "2020/03/11", type: format.Type.DATETIME }),
                custrecord_ums_header_tariff_amount: null,
                custrecord_ums_header_tariff_bill: null,
                custrecord_ums_header_tariff_rate: null,
                custrecord_ums_inventory_num: "RCV20200402001",
                custrecord_ums_subsidiary_corporation: "1",
                custrecord_ums_vendor_name_inventory: "13135",
                custrecord_ums_header_tariff_currency: null,
                custrecord_ums_header_iso_fulfillment: 121707 //测试数据，YQRKD0000000292
            },
            items: [{
                    custrecord_ums_line_item_inventory: "20",
                    custrecord_ums_line_location: "14",
                    custrecord_ums_line_lotnum: "202004030001",
                    custrecord_ums_line_po_id: "12733", //测数据，随意的
                    custrecord_ums_line_po_line_num: "3",
                    custrecord_ums_line_quantity: "1",
                    custrecord_ums_line_tariff_amount: null
                },
                {
                    custrecord_ums_line_item_inventory: "20",
                    custrecord_ums_line_location: "14",
                    custrecord_ums_line_lotnum: "202004030002",
                    custrecord_ums_line_po_id: 12733,
                    custrecord_ums_line_po_line_num: "5",
                    custrecord_ums_line_quantity: "2",
                    custrecord_ums_line_tariff_amount: null
                }
            ]

        };

        //内部销售订单发货转内部接受处理关税
        var recId = umsCommon.createintercompanyporcv(option);

        log.debug('recId', recId);

    }

    function onRequest(context) {
        //log.debug('111', 2222);

        //action2(context);
        //action3(context);
        //action4(context);
        //action5(context);
        //action6(context);
        //action7(context);
        //action8(context);
        //action9(context);
        //action10();
        //var aaa = CheckLength('12345asc汉字');
        //log.debug('aaa', aaa);
        //bomGetter();
        //action12(context);

        //
        // var dateObj = new Date();
        // var utcHours = dateObj.getUTCHours();
        // var utcYear = dateObj.getUTCFullYear();
        // var utcMonth = dateObj.getUTCMonth();
        // var utcDate = dateObj.getUTCDate();
        // dateObj.setFullYear(utcYear);
        // dateObj.setMonth(utcMonth);
        // dateObj.setDate(utcDate);
        // dateObj.setHours(utcHours + 8);
        // action13(dateObj, -7);
        //

        // action14(context);
        // var a = new Date();
        // var b = a.getDay();
        // log.debug('a', a);
        // log.debug('b', b);
        // var dateObj = new Date();
        // var utcHours = dateObj.getUTCHours();
        // var utcYear = dateObj.getUTCFullYear();
        // var utcMonth = dateObj.getUTCMonth();
        // var utcDate = dateObj.getUTCDate();
        // dateObj.setFullYear(utcYear);
        // dateObj.setMonth(utcMonth);
        // dateObj.setDate(utcDate);
        // dateObj.setHours(utcHours + 8);
        // //action15(new Date(), -7, [0, 1, 1, 1, 1, 1, 0]);//美国时间
        // action15(dateObj, -45, [0, 1, 1, 1, 1, 1, 0]);

        //action16();
        //action17(context);
        //action18(context);

        //action19(context);
        //action20(context);
        //action21(context);
        //action22(context);
        //action24(context);
        //action25(context);
        //action27(context);
        action49(context);
    }

    return {
        onRequest: onRequest
    }
});
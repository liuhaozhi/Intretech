/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/search',
    'N/record',
    'N/log',

    'N/task',
    'N/redirect',
    'N/format',
    'N/runtime',
    'N/format',
    '../dao/dao_collection_utils.js',
    '../ums/ums_po_common.js'
], function (search,
    record,
    log,
    task,
    redirect,
    format,
    runtime,
    format,
    dao,
    poCommon) {
    function sysdate() {
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

        return d;

    }





    function createPO(context) {
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

        var recId = poCommon.purchaseorderCreationSt(option1);

        log.debug('recId', recId);
    }

    function getPO(context) {
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



    function createPO2(context) {
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


    function demoitemfulfillment(context) {
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

    function getitemfulfillment(context) {
        var custPrRec = record.load({
            type: 'itemfulfillment', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '117458', //108530，108825--非批次货品
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

    function getitemreceipt(context) {
        var custPrRec = record.load({
            type: 'itemreceipt', //lotnumberedassemblyitem,lotnumberedinventoryitem
            id: '113331', //108530，108825--非批次货品
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

    function demoitemreceipt(context) {
        var option = {

            main: {
                createdfrom: 12733 //#18
                //currency: 1,
                //custbody_po_list_pur_type: 1,
                //approvalstatus: 2,
                //orderstatus: 'B',
                ///trandate: new Date(),
                //department: 12
            },
            items: [{
                //item: 1625,
                orderline: 2,
                location: 14,//YQ_原材料仓 : R01_国内仓
                quantity: 1
            }],
            enableSourcing: false,
            ignoreMandatoryFields: true
        };

        var option2 = {

            main: {
                createdfrom: 12733, //#18
                //currency: 1,
                //custbody_po_list_pur_type: 1,
                //approvalstatus: 2,
                //orderstatus: 'B',
                ///trandate: new Date(),
                //department: 12
                // landedcostperline: true  在程序中去固定, 这里不能再弄
            },
            items: [{
                // item: 20,
                orderline: 2,
                location: 14,//YQ_原材料仓 : R01_国内仓
                quantity: 2,
                custcol_ums_duty_amount: 1.3,//关税
                inventorydetail: [{
                    receiptinventorynumber: '20200310001',
                    quantity: 1
                },
                {
                    receiptinventorynumber: '20200310002',
                    quantity: 1
                }
                ],
                /*标准功能新增的时候不成功，先用custcol_ums_duty_amount 去更新
                 landedcost: [{
                     costcategory: 9,//
                     amount: 1.1
                 }]*/
            }],

            enableSourcing: false,
            ignoreMandatoryFields: true
        };

        var recId = poCommon.itemreceiptCreationSt(option2);

        log.debug('recId', recId);
    }


    function getyymmdd() {

        var date = new Date;
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        m = m < 10 ? '0' + m : m;
        var d = date.getDate();
        d = d < 10 ? ('0' + d) : d;
        //返回日期 

        return (y.toString() + m.toString() + d.toString());

    }

    function ums_itemreceipt(context) {
        //本程序第一版本 未检查编码是否一致
        var rcvid = 1;// context.custscriptrcvid;

        var search_po_list = 'customsearch_ums_stock_po_list';  //入库列表查询

        var header_rectype = 'customrecord_ums_po_stock_header';
        var header_field_source = 'custrecord_ums_inventory_num';
        var line_rectype = 'customrecord_ums_po_stock_line';
        var line_field_LineToHeader = 'custrecord_ums_line_stock_header';
        var line_field_Podoc = 'CUSTRECORD_UMS_LINE_PO_ID'; //po , for join internalid
        var line_field_poline = 'custrecord_ums_line_po_line_num'; //PO 
        var line_field_location = 'custrecord_ums_line_location';
        var line_filed_item = 'custrecord_ums_line_item_inventory';
        var line_field_uom = 'custrecordums_line_uom';
        var line_field_qty = 'custrecord_ums_line_quantity';
        var line_field_lotnumber = 'custrecord_ums_line_lotnum';
        var line_field_tariff_amt = 'custrecord_ums_line_tariff_amount';//关税金额


        var arr_header = [];
        var arr_line = [];
        var sourcedoc = null;
        var yyyymmdd = getyymmdd();

        log.debug('yyyymmdd =', yyyymmdd);

        //更新头状态--开始处理



        //获取PO 列表
        /* var poSearch = search.create({
             type: line_rectype,
             filters: [{
                 name: line_field_LineToHeader,
                 operator: 'anyof',
                 values: rcvid
             }],
             columns: [
                 
                 {
                     name:'internalid',
                     join: line_field_Podoc,
 
                     //"name":"internalid","join":"CUSTRECORD_UMS_LINE_PO_ID","summary":"GROUP"
 
                     summary: search.Summary.GROUP
                     //  sort: search.Sort.ASC
                 }
 
             ]
         });
 */
        var poSearch = search.load(search_po_list);

        log.debug('filters', poSearch.filters);
        log.debug('columns', poSearch.columns);
        log.debug('expression', poSearch.filterExpression);

        poSearch.run().each(function (rec) {
            sourcedoc = rec.getValue(rec.columns[1]);//UMS接收单号
            var poid = rec.getValue(rec.columns[2]);

            arr_line = [];
            //获取行数据

            var lineSearch = search.create({
                type: line_rectype,
                filters: [{
                    name: line_field_LineToHeader,
                    operator: 'anyof',
                    values: rcvid
                },
                {
                    name: line_field_Podoc,
                    operator: 'anyof',
                    values: poid
                }],
                columns: [
                    {
                        name: line_field_poline,
                        sort: search.Sort.ASC
                    }, //0 PO行  
                    { name: line_field_location, },// 1地点
                    {
                        name: line_filed_item,
                    },// 2 物料
                    {
                        name: line_field_uom,
                    }, //3 单位
                    {
                        name: line_field_qty,
                    },//4 数量
                    { name: line_field_lotnumber }
                    ,//5 批次号
                    {
                        name: line_field_tariff_amt,
                    }//6 关税

                ]
            });

            // log.debug('lineSearch filters', lineSearch.filters);
            //  log.debug('lineSearch columns', lineSearch.columns);
            //  log.debug('lineSearch expression', lineSearch.filterExpression);

            lineSearch.run().each(function (linerec) {

                // log.debug(' linedoc', linerec);
                // log.debug('line col0', linerec.getValue(linerec.columns[0]));
                var itemid = linerec.getValue(linerec.columns[2]);

                var lotnum = linerec.getValue(linerec.columns[5]);
                var currlotnumbe = null;

                if (typeof lotnum == "undefined" || lotnum == null || lotnum == "") {
                    //如果批次为空，则自动生成批次
                    var itemlotsearch = search.create({
                        type: 'inventorynumber',
                        filters: [{
                            name: 'item',
                            operator: 'anyof',
                            values: itemid
                        },
                        {
                            name: 'inventorynumber',
                            operator: 'startswith',
                            values: yyyymmdd
                        }],
                        columns: [{
                            name: 'inventorynumber',
                            sort: search.Sort.DESC
                        }]
                    })



                    itemlotsearch.run().each(function (lotrec) {
                        currlotnumber = lotrec.getValue(lotrec.columns[0]);
                    });


                    if (typeof currlotnumber == "undefined" || currlotnumber == null || currlotnumber == "") {
                        lotnum = yyyymmdd.toString() + '0001';
                    }
                    else {

                        var nowseq = parseInt(currlotnumber.substring(8)) + 1;  //如果直接加太长了，会变成E数字
                        nowseq = (nowseq < 10 ? "000" : nowseq < 100 ? "00" : nowseq < 1000 ? "0" : "") + nowseq;
                        lotnum = currlotnumber.substring(0, 8).toString() + nowseq;
                    };
                }

                log.debug('lotnum', lotnum);

                //生成JSON数据
                var arr_detail = [];
                arr_detail.push({
                    receiptinventorynumber: lotnum,
                    quantity: linerec.getValue(linerec.columns[4])
                });

                var arr_costland = [];
                arr_costland.push({
                    costcategory: 9,//
                    amount: linerec.getValue(linerec.columns[6]) //关税

                });

                arr_line.push(
                    {
                        orderline: linerec.getValue(linerec.columns[0]),
                        item: itemid,
                        location: linerec.getValue(linerec.columns[1]),
                        quantity: linerec.getValue(linerec.columns[4]),
                        custcol_ums_duty_amount: linerec.getValue(linerec.columns[6]),//关税
                        inventorydetail: arr_detail,
                        //   landedcost: arr_costland  //盈趣环境， 标准方法处理到岸成本不成功，采用更新方式处理
                    }
                )
                    ;

                return true;
            });

            //生成JSON数据

            arr_header.push({
                main: {
                    createdfrom: poid
                },
                items: arr_line,
                custbody_ums_document: sourcedoc,
                enableSourcing: false,
                ignoreMandatoryFields: true
            });
            return true;
        }

        );
        //更新状态--更新状态


        //对数据进行检查，在处理入库 过程去检查 poCommon.itemreceiptCreationSt(item) 进行
    


        arr_header.forEach(function (item) {

            var recId = poCommon.itemreceiptCreationSt(item);

            log.debug('recId', recId);
            
        })




    }

    function onRequest(context) {
        //log.debug('111', 2222);


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

        ums_itemreceipt(context);
    }

    return {
        onRequest: onRequest
    }
});
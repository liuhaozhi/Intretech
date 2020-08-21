/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
define(['N/record', 'N/search', '../ums/ums_po_common.js'],
	/**
	 * @param {record} record
	 * @param {search} search
	 */
    function (record, search, poCommon) {

		/**
		 * Definition of the Suitelet script trigger point.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.newRecord - New record
		 * @param {Record} scriptContext.oldRecord - Old record
		 * @Since 2016.1
		 */


        function getyymmdd(txndate) {

            var date = new Date(txndate);
            var y = date.getFullYear();
            var m = date.getMonth() + 1;
            m = m < 10 ? '0' + m : m;
            var d = date.getDate();
            d = d < 10 ? ('0' + d) : d;
            //返回日期 

            return (y.toString() + m.toString() + d.toString());

        }

        function get_new_lotnum(itemid, yyyymmdd) {
            //先不考虑公司
            var new_lot_num = null, currlotnumber = null;
            //自动生成批次
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
                new_lot_num = yyyymmdd.toString() + '0001';
            }
            else {

                var nowseq = parseInt(currlotnumber.substring(8)) + 1;  //如果直接加太长了，会变成E数字
                nowseq = (nowseq < 10 ? "000" : nowseq < 100 ? "00" : nowseq < 1000 ? "0" : "") + nowseq;
                new_lot_num = currlotnumber.substring(0, 8).toString() + nowseq;
            };
            return new_lot_num;
        }

        function get_default_locationid(itemid, subsidiaryid) {

            var defaultlocation = null;


            var mySalesOrderSearch = search.create({
                type: 'customrecord_intercompany_fields',
                columns: [{
                    name: 'custrecord_default_warehouse'
                }],
                filters: [{
                    name: 'custrecord_link_field', //item
                    operator: 'anyof',
                    values: [itemid]
                },
                {
                    name: 'custrecord_intercompany_subsidiary', //subsidiary
                    operator: 'anyof',
                    values: [subsidiaryid]
                }
                ]
            });
            mySalesOrderSearch.run().each(function (rec) {
                log.debug('geted default locaton', rec)
                defaultlocation = rec.getValue(rec.columns[0]);//UMS接收单号

            });



            return defaultlocation;

        }


        function find(element, dataList) {
            var k = -1;

            for (var i = 0; i < dataList.length; i++) {
                if (dataList[i] == element) {
                    k = i;
                }
            }
            return k;
        }

        function isoitemfulfillment(context) {
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

        function ums_itemreceipt(rcvid) {
            //本程序第一版本 未检查编码是否一致
            log.debug('line 171 rcvid', rcvid);

            var error_list = [];


            var search_po_list = 'customsearch_ums_stock_po_list';  //入库列表查询

            var header_rectype = 'customrecord_ums_po_stock_header';
            var header_field_source = 'custrecord_ums_inventory_num';
            var line_rectype = 'customrecord_ums_po_stock_line';
            var line_field_LineToHeader = 'custrecord_ums_line_stock_header';
            var line_field_Podoc = 'custrecord_ums_line_po_id'; //po , for join internalid
            var line_field_poline = 'custrecord_ums_line_po_line_num'; //PO 
            var line_field_location = 'custrecord_ums_line_location';
            var line_filed_item = 'custrecord_ums_line_item_inventory';
            var line_field_uom = 'custrecord_ums_line_uom';
            var line_field_qty = 'custrecord_ums_line_quantity';
            var line_field_lotnumber = 'custrecord_ums_line_lotnum';
            var line_field_tariff_amt = 'custrecord_ums_line_tariff_amount';//关税金额


            var arr_header = [];
            var arr_line = [];
            var sourcedoc = null;
            var yyyymmdd = getyymmdd();

            log.debug('yyyymmdd =', yyyymmdd);

            var hdrrec = record.load({
                type: header_rectype,
                id: rcvid
            });


            var subsidiaryid = hdrrec.getValue('custrecord_ums_subsidiary_corporation');

            var isoFulfillmentid = hdrrec.getValue('custrecord_ums_header_iso_fulfillment');
            var trandate = hdrrec.getValue('custrecord_ums_date_inventory');
            var error_data_nolocation = 0;
            if (!trandate){
                trandate= new Date();
            }
            //更新头状态--开始处理
            //更新默认仓库

            var nolocationSearch = search.create({
                type: line_rectype,
                filters: [{
                    name: 'internalid',
                    join: line_field_LineToHeader,
                    operator: 'anyof',
                    values: rcvid
                },
                {
                    name: 'custrecord_ums_line_location',
                    operator: 'anyof',
                    values: '@NONE@'
                }],
                columns: [{ name: 'custrecord_ums_line_item_inventory' }]
            });

            nolocationSearch.run().each(function (rec) {
                var itemid = rec.getValue(rec.columns[0]);
                var defaultlocation = get_default_locationid(itemid, subsidiaryid);

                if (defaultlocation) {
                    log.debug(' line id update location', { id: rec.id, itemid: itemid, subsidiaryid: subsidiaryid });
                    var id = record.submitFields({
                        type: line_rectype,
                        id: rec.id,
                        values: {
                            custrecord_ums_line_location: defaultlocation
                        }

                    });
                }
                else {
                    error_data_nolocation = error_data_nolocation + 1;
                    log.debug(' line id not define location', { id: rec.id, itemid: itemid, subsidiaryid: subsidiaryid });
                }
                return true;
            });


            if (!trandate){
                error_list.push({ error: '日期不能空'});

            };

            if (error_data_nolocation > 0) {

                error_list.push({ error: '存在' + error_data_nolocation + '行数据没有仓库' });


            }
            if (error_list.length<1) {
                //可以处理


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


                //define and add filters
                var filters = poSearch.filters;
                var filterOne = search.createFilter({
                    name: 'internalid',//'internalid',
                    join: 'custrecord_ums_line_stock_header',
                    operator: search.Operator.ANYOF,
                    values: rcvid
                });
                filters.push(filterOne);

                //   "custrecord_ums_line_stock_header.id","equalto","308"
                log.debug('filters', poSearch.filters);
                log.debug('columns', poSearch.columns);
                log.debug('expression', poSearch.filterExpression);


                poSearch.run().each(function (rec) {
                    sourcedoc = rec.getValue(rec.columns[1]);//UMS接收单号
                    var poid = rec.getValue(rec.columns[2]);
                    log.debug('line 232 poid', poid);
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
                            createdfrom: poid,
                            trandate:trandate
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
                //处理完成,处理公司间发货

                if (isoFulfillmentid) {
                    log.debug('update iso fulfillnent',isoFulfillmentid);

                    var id = record.submitFields({
                        type: record.Type.ITEM_FULFILLMENT,
                        id: isoFulfillmentid,
                        values: {
                            shipstatus: 'C',
                            trandate: trandate
                        }

                    });

                }

            }

            
            var error_data_nolocation = 0;
            if (!trandate){
                trandate= new Date();
            }

            if (error_list.length > 0) {
                var id = record.submitFields({
                    type: header_rectype,
                    id: rcvid,
                    values: {
                        custrecord_ums_date_inventory:trandate,
                        custrecord_ums_process_code: 'E',
                        custrecord_ums_process_msg: error_list
                    }

                });
            }
            else {
                var id = record.submitFields({
                    type: header_rectype,
                    id: rcvid,
                    values: {
                        custrecord_ums_date_inventory:trandate,
                        custrecord_ums_process_code: 'S',
                        custrecord_ums_process_msg: '入库处理完成'
                    }

                });
            }
            return 1;
        }

        function onAction(scriptContext) {
            log.debug(scriptContext);
            ///读取表格
            var newRecord = scriptContext.newRecord;
            ///读取送货单ID值
            var rcvid = newRecord.getValue("id"); //runtime.getCurrentScript().getParameter("custscriptitemreceiptid"); // mycars[x]; //strtojson.values.internalid[0].value; //runtime.getCurrentScript().getParameter("custscriptinboundshipmentid");
            ///生成发货行明细，


            return ums_itemreceipt(rcvid);


        }
        return {
            onAction: onAction
        };
    });
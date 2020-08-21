/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */

define(["require", "exports",
    "N/log", "N/search", 'N/format', "N/record", "N/transaction", "N/task", '../ums/ums_po_common.js', '../ums/app_ums_common.js'],
    /**
     * @param {error} error
     * @param {format} format
     * @param {record} record
     * @param {runtime} runtime
     * @param {search} search
     */
    function (require, exports, log, search, format, record, transaction, task, poCommon, umsCommon) {

        /**
         * Function called upon sending a GET request to the RESTlet.
         *
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.1
         */
        function doPut(requestBody) {
        }
        function doGet(requestParams) {
            var orderby, searChID;
            try { orderby = requestParams.orderby; }
            catch (e) { orderby = 'ASC'; }

            if (orderby == 'ASC') { searChID = 'customsearch_cux_multpo_reced_noitemf_a'; }
            else { searChID = 'customsearch_cux_multpo_reced_noitemf_d'; }
            log.debug('searChID', searChID);

            var rec_id,
                shipmnentnum,
                shipmentstatus,
                n = 0;

            /*
			search.create({
				type: record.Type.SALES_ORDER,
				columns: [
					{ name: 'internalid', },
					{ name: 'trandate', sort: search.Sort.ASC },
					{ name: 'status' },
				],
				filters: [				
					{
						name: 'subsidiary',
						operator: 'anyof',
						values: '5'
					},
					{
						name: 'status',
						operator: 'is',
						values: 'SalesOrd:F'// 'pendingBilling'
					},
					{
						name: 'trandate',
						operator: 'before',
						values: '2019-09-01'
					},
					{
						name: 'trandate',
						operator: 'after',
						values: '2019-07-31'
					}
				]
			}).run().each(function (rec) {
				n = n + 1;
				var order_id = rec.id;

				var orderstatus = rec.getValue(rec.columns[1]);
				log.debug('orderstatus', orderstatus);

				billsaleorder(order_id, trandate);
				if (n < 50) {
					return true;
				}

				else {
					return false;
				}
            });
            */


            var mySearch = search.load({ id: searChID });

            log.debug('filters', mySearch.filters);
            log.debug('columns', mySearch.columns);
            log.debug('expression', mySearch.filterExpression);



            // {"name":"custrecord_aio_batch","join":"custbody_aio_account","operator":"equalto","values":["1"]


            // mySearch.filters = mySearch.filters.concat({
            //   name: 'custrecord_aio_batch',
            // join: 'custbody_aio_account',
            // operator: search.Operator.EQUALTO,
            // values: aiobatchid
            //  }
            //  );

            //log.debug('filters', mySearch.filters);
            // log.debug('columns', mySearch.columns);
            // log.debug('expression', mySearch.filterExpression);
            var n = 0;
            mySearch.run().each(function (rec) {
                log.debug('rec data', rec);
                rec_id = rec.id;
                //   shipmnentnum = rec.getValue(rec.columns[0]);
                // shipmentstatus = rec.getValue(rec.columns[1]);

                ums_itemreceipt(rec_id);
                n = n + 1;
                if (n > 1) { return false }
                else { return true }
            })

            log.debug('供处理订单数据：' + n);
            return '供处理订单数据：' + n;



        }




        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPost(requestBody) {


        }

        /**
         * Function called upon sending a DELETE request to the RESTlet.
         *
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doDelete(requestParams) {

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




            var hdrrec = record.load({
                type: header_rectype,
                id: rcvid
            });


            var subsidiaryid = hdrrec.getValue('custrecord_ums_subsidiary_corporation');

            var isoFulfillmentid = hdrrec.getValue('custrecord_ums_header_iso_fulfillment');
            var trandate = hdrrec.getValue('custrecord_ums_date_inventory');
            var yyyymmdd = umsCommon.getyymmdd(trandate);

            log.debug('yyyymmdd =', yyyymmdd);

            var error_data_nolocation = 0;
            if (!trandate) {
                trandate = new Date();
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
                var defaultlocation = umsCommon.get_default_locationid(itemid, subsidiaryid);

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


            if (!trandate) {
                error_list.push({ error: '日期不能空' });

            };

            if (error_data_nolocation > 0) {

                error_list.push({ error: '存在' + error_data_nolocation + '行数据没有仓库' });


            }
            if (error_list.length < 1) {
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
                            },//6 关税

                            {
                                name: 'custrecord_due_date1',
                            },//7 到期日

                            {
                                name: 'custrecordcustfield_po_k3ponumberitem',
                            },//8  K3采购订单号

                            {
                                name: 'custrecord_ums_line_po_line_num',
                            },//9 采购订单行号

                            {
                                name: 'custrecord_k3_godown_entry_num',
                            },//10 K3入库单号

                            {
                                name: 'custrecordcustfield_po_itemk3ship',
                            },//11 K3入库行号


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


                        //保质期  7 到期日             
                        var expriationdate = linerec.getValue(linerec.columns[7]),
                            custbody_k3_po_number = linerec.getValue(linerec.columns[8]), //K3采购订单号
                            custcol_k3_po_line_num = linerec.getValue(linerec.columns[9]),//K3采购订单行号 
                            custcol_k3_godown_entry_num = linerec.getValue(linerec.columns[10]),//K3入库单号 
                            custcol_k3_godown_entry_num_line = linerec.getValue(linerec.columns[11]);  //K3入库行号

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



                        log.debug('expriationdate', expriationdate);

                        if (!expriationdate && trandate) {
                            //保质期
                            var shelf_life = umsCommon.get_shelf_life(itemid, subsidiaryid);

                            log.debug('shelf_life', shelf_life);
                            if (shelf_life) {
                                expriationdate = new Date(trandate);
                                expriationdate.setDate(expriationdate.getDate() + (+shelf_life || 0));

                            }
                        }
                        else {
                            log.debug("Expriationdate",typeof expriationdate == "object"?JSON.stringify(expriationdate):typeof expriationdate+" "+expriationdate);
                          //  expriationdate.setDate(expriationdate.getDate()+ 0);

                            //expriationdate = new Date(expriationdate);

                            expriationdate = format.parse({
                                                type: format.Type.DATE,
                                                value:expriationdate
                                            });
                        }

                       // log.debug('expriationdate', expriationdate);

                        //生成JSON数据
                        var arr_detail = [];
                        arr_detail.push({
                            receiptinventorynumber: lotnum,
                            quantity: linerec.getValue(linerec.columns[4]),
                            expirationdate: expriationdate
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

                                custbody_k3_po_number: custbody_k3_po_number, //K3采购订单号
                                custcol_k3_po_line_num: custcol_k3_po_line_num,//K3采购订单行号 
                                custcol_k3_godown_entry_num: custcol_k3_godown_entry_num,//K3入库单号 
                                custcol_k3_godown_entry_num_line: custcol_k3_godown_entry_num_line, //K3入库行号

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
                            trandate: trandate
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

               // log.debug('items', arr_line);

                arr_header.forEach(function (item) {

                    var recId = poCommon.itemreceiptCreationSt(item);

                    log.debug('recId', recId);

                })
                //处理完成,处理公司间发货

                if (isoFulfillmentid) {
                    log.debug('update iso fulfillnent', isoFulfillmentid);

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
            if (!trandate) {
                trandate = new Date();
            }

            if (error_list.length > 0) {
                var id = record.submitFields({
                    type: header_rectype,
                    id: rcvid,
                    values: {
                        custrecord_ums_date_inventory: trandate,
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
                        custrecord_ums_date_inventory: trandate,
                        custrecord_ums_process_code: 'S',
                        custrecord_ums_process_msg: '入库处理完成'
                    }

                });
            }
            return 1;
        }


        return {
            'get': doGet,
            put: doPut,
            post: doPost,
            'delete': doDelete
        };

    });

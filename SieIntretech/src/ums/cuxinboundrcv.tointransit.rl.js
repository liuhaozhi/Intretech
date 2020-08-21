/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */

define(["require", "exports",
    "N/log", "N/search", 'N/format', "N/record", "N/transaction", "N/task"],
    /**
     * @param {error} error
     * @param {format} format
     * @param {record} record
     * @param {runtime} runtime
     * @param {search} search
     */
    function (require, exports, log, search, format, record, transaction, task) {

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
            catch(e)
            { orderby = 'ASC'; }

            if (orderby == 'ASC') { searChID = 'customsearch_cux_inbound_intrant'; }
            else { searChID = 'customsearch_cux_inbound_intrant_desc'; }




            //log.debug('aiobatchid', aiobatchid);


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




            mySearch.run().each(function (rec) {
                log.debug('rec data', rec);
                rec_id = rec.id;
                shipmnentnum = rec.getValue(rec.columns[0]);
                shipmentstatus = rec.getValue(rec.columns[1]);



                log.debug({ shipmentstatus: shipmentstatus })
                // billsaleorder(order_id, trandate, subtotal,handlingcost);


                var rec = record.load({
                    type: record.Type.INBOUND_SHIPMENT,
                    id: rec_id,
                    isDynamic: true,
                });


                rec.setValue({
                    fieldId: 'custrecord_cux_auto_receipt',
                    value: true
                });


                rec.setValue({
                    fieldId: 'shipmentstatus',
                    value: 'inTransit'
                });

                var recordId = rec.save({
                    enableSourcing: true
                });

                var no_locations = inboundshipment_default_location(rec_id);
                if (no_locations == 0) { inboundshipment_rcv(rec_id) }

                n = n + 1;
                if (n < 1) {
                    return true;
                }

                else {
                    return false;
                }

            });


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

        function get_default_locationid(itemid, subsidiaryid) {

            log.debug('get default location', { itemid: itemid, subsidiaryidsubsidiaryid: subsidiaryid });

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




        function get_shelf_life(itemid, subsidiaryid) {
            var shelf_life;

            var mySalesOrderSearch = search.create({
                type: 'customrecord_intercompany_fields',
                columns: [{
                    name: 'custrecord_shelf_life'
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
                shelf_life = rec.getValue(rec.columns[0]);//UMS接收单号

            });

            return shelf_life;

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

        function inboundshipment_default_location(inboundshipmentid) {
            var errorlist = [];
            var itemlist = [];
            var cux_lot_num,
                shelf_life;
            var inboundShipmentRec = record.load({ type: 'inboundshipment', id: inboundshipmentid });//, isDynamic: true,

            log.debug('inboundShipmentRec id=' + inboundshipmentid, { info: inboundShipmentRec });

            var actualdeliverydate = inboundShipmentRec.getValue({ fieldId: 'actualdeliverydate' });
            var subsidiaryid, no_locations = 0;

            var itemLineCount = inboundShipmentRec.getLineCount({ sublistId: 'items' });
            log.debug('itemLineCount:', itemLineCount);
            //获取自定批次
            for (var i = 0; i < itemLineCount; i++) {
                itemid = inboundShipmentRec.getSublistValue({ sublistId: 'items', fieldId: 'itemid', line: i });
                defaultlocation = inboundShipmentRec.getSublistValue({ sublistId: 'items', fieldId: 'receivinglocation', line: i });

                var purchaseorderkey = inboundShipmentRec.getSublistValue({ sublistId: 'items', fieldId: 'purchaseorder', line: i });
                log.debug('get purchaseorderkey', { itemid: itemid, purchaseorderkey: purchaseorderkey });
                // if (!purchaseorderkey){
                mySalesOrderSearch = search.create({
                    type: 'purchaseorder',
                    columns: [{
                        name: 'subsidiary'
                    }],
                    filters: [{
                        name: 'internalid', //item
                        operator: 'anyof',
                        values: [purchaseorderkey]
                    }
                    ]
                });
                mySalesOrderSearch.run().each(function (rec) {
                    log.debug('geted default locaton', rec)
                    subsidiaryid = rec.getValue(rec.columns[0]);//UMS接收单号

                });

                //如果仓库没有，则默认仓库
                if (typeof defaultlocation == "undefined" || defaultlocation == null || defaultlocation == "") {



                    defaultlocation = get_default_locationid(itemid, subsidiaryid);
                    // }

                    log.debug('获取默认仓库', { itemid: itemid, subsidiaryid: subsidiaryid, defaultlocation: defaultlocation });

                    if (defaultlocation) {
                        inboundShipmentRec.setSublistValue({ sublistId: 'items', fieldId: 'receivinglocation', line: i, value: defaultlocation });
                        log.debug('seted 获取默认仓库');

                    }
                    else {
                        no_locations = no_locations + 1;
                        errorlist.push({
                            line: i,
                            lineuniquekey: inboundShipmentRec.getSublistValue({ sublistId: 'items', fieldId: 'shipmentitem', line: i }),
                            errmsg: '获取默认仓库失败'
                        });
                    }
                };
                // 处理批次
                cux_lot_num = inboundShipmentRec.getSublistValue({ sublistId: 'items', fieldId: 'custrecord_yx_lotnumber', line: i })
                log.debug(i + ' item: lotis ', { itemid: itemid, cux_lot_num: cux_lot_num });

                if (actualdeliverydate)
                //批次物料处理
                {

                    if (typeof cux_lot_num == "undefined" || cux_lot_num == null || cux_lot_num == "") {
                        //如果批次为空，则自动生成批次 
                        var yyyymmdd = getyymmdd(actualdeliverydate);
                        cux_lot_num = get_new_lotnum(itemid, yyyymmdd);

                        inboundShipmentRec.setSublistValue({ sublistId: 'items', fieldId: 'custrecord_yx_lotnumber', line: i, value: cux_lot_num });

                    }

                }

                //保质期
                expriationdate = inboundShipmentRec.getSublistValue({ sublistId: 'items', fieldId: 'custrecord_yx_expriationdate', line: i });

                log.debug('expriationdate', expriationdate);

                if (!expriationdate && actualdeliverydate) {
                    //保质期
                    shelf_life = get_shelf_life(itemid, subsidiaryid);
                    log.debug('shelf_life', shelf_life);
                    if (shelf_life) {
                        var lineactualdeliverydate = new Date(actualdeliverydate);
                        lineactualdeliverydate.setDate(lineactualdeliverydate.getDate() + (+shelf_life || 0));
                        inboundShipmentRec.setSublistValue(
                            { sublistId: 'items', fieldId: 'custrecord_yx_expriationdate', line: i, value: lineactualdeliverydate });
                    }
                }


            }


            inboundShipmentRec.setValue({ fieldId: 'custrecord_cux_inboundsmt_nolocations', value: no_locations });

            inboundShipmentRec.save();
            log.debug( 'inboundshipment_default_location return',no_locations);
            return no_locations;


        }


        function inboundshipment_rcv(inboundshipmentid) {
            var itemlist = [];
            var inboundShipmentRec = record.load({ type: 'inboundshipment', id: inboundshipmentid });//, isDynamic: true,



            log.debug('inboundShipmentRec id=' + inboundshipmentid, { info: inboundShipmentRec });


            var actualdeliverydate = inboundShipmentRec.getValue({ fieldId: 'actualdeliverydate' });
            var subsidiaryid;

            // log.debug('inboundshipment id=' + inboundshipmentid, { info: inboundShipmentRec });
            var itemLineCount = inboundShipmentRec.getLineCount({ sublistId: 'items' });
            log.debug('itemLineCount:', itemLineCount);
            //获取自定批次
            for (var i = 0; i < itemLineCount; i++) {
                // log.debug('line key', inboundShipmentRec.getSublistValue({ sublistId: 'items', fieldId: 'shipmentitem', line: i }));
                //log.debug('lot info', inboundShipmentRec.getSublistValue({ sublistId: 'items', fieldId: 'custrecord_cux_lot_num', line: i }));
                //inboundShipmentItem




                defaultlocation = inboundShipmentRec.getSublistValue({ sublistId: 'items', fieldId: 'receivinglocation', line: i });



                //默认仓库
                if (typeof defaultlocation == "undefined" || defaultlocation == null || defaultlocation == "") {


                    itemid = inboundShipmentRec.getSublistValue({ sublistId: 'items', fieldId: 'itemid', line: i });
                    var purchaseorderkey = inboundShipmentRec.getSublistValue({ sublistId: 'items', fieldId: 'purchaseorder', line: i });
                    log.debug('get purchaseorderkey', { itemid: itemid, purchaseorderkey: purchaseorderkey });
                    // if (!purchaseorderkey){
                    mySalesOrderSearch = search.create({
                        type: 'purchaseorder',
                        columns: [{
                            name: 'subsidiary'
                        }],
                        filters: [{
                            name: 'internalid', //item
                            operator: 'anyof',
                            values: [purchaseorderkey]
                        }
                        ]
                    });
                    mySalesOrderSearch.run().each(function (rec) {
                        log.debug('geted default locaton', rec)
                        subsidiaryid = rec.getValue(rec.columns[0]);//UMS接收单号

                    });

                    defaultlocation = get_default_locationid(itemid, subsidiaryid);
                    // }

                    log.debug('获取默认仓库', { itemid: itemid, subsidiaryid: subsidiaryid, defaultlocation: defaultlocation });

                    if (defaultlocation) {
                        inboundShipmentRec.setSublistValue({ sublistId: 'items', fieldId: 'receivinglocation', line: i, value: defaultlocation });
                        log.debug('seted 获取默认仓库');

                    }
                }

                itemlist.push({
                    line: i,
                    lineuniquekey: inboundShipmentRec.getSublistValue({ sublistId: 'items', fieldId: 'shipmentitem', line: i }),
                    cux_lot_num: inboundShipmentRec.getSublistValue({ sublistId: 'items', fieldId: 'custrecord_yx_lotnumber', line: i }),
                    yx_expriationdate: inboundShipmentRec.getSublistValue({ sublistId: 'items', fieldId: 'custrecord_yx_expriationdate', line: i })
                });
            };

            inboundShipmentRec.save();

            //log.debug('listlist', itemlist);

            var bulkReceive = record.load({ type: record.Type.RECEIVE_INBOUND_SHIPMENT, id: inboundshipmentid/*, isDynamic: true */ });
            if (actualdeliverydate) {
                bulkReceive.setValue({ fieldId: 'trandate', value: actualdeliverydate });
            }

            log.debug('inboundshipment id=' + inboundshipmentid, { info: bulkReceive });
            itemLineCount = bulkReceive.getLineCount({ sublistId: 'receiveitems' });
              log.debug(' line 544 bulkReceive count', itemLineCount);
            //获取自定批次
            var k = -1, element = null, itemid = null, currlotnumber = null, quantitytobereceived = null, defaultlocation;

            for (var i = 0; i < itemLineCount; i++) {
                //匹配批次
                k = -1;
                element = null;
                currlotnumber = null;
                quantitytobereceived = null;
                itemid = bulkReceive.getSublistValue({ sublistId: 'receiveitems', fieldId: 'item', line: i });
                element = bulkReceive.getSublistValue({ sublistId: 'receiveitems', fieldId: 'uniquekey', line: i });

                quantitytobereceived = bulkReceive.getSublistValue({ sublistId: 'receiveitems', fieldId:  'quantityremaining' , line: i });
                log.debug(' line rec qty info',{i:i,
                    quantityexpected:bulkReceive.getSublistValue({ sublistId: 'receiveitems', fieldId: 'quantityexpected' , line: i }),
                    quantityremaining:bulkReceive.getSublistValue({ sublistId: 'receiveitems', fieldId:  'quantityremaining' , line: i })
                })

                //默认仓库
                /*
                
                                defaultlocation = bulkReceive.getSublistValue({ sublistId: 'receiveitems', fieldId: 'receivinglocation', line: i });
                
                          
                
                                
                                if (typeof defaultlocation == "undefined" || defaultlocation == null || defaultlocation == "") {
                
                                    var purchaseorderkey = bulkReceive.getSublistValue({ sublistId: 'receiveitems', fieldId: 'purchaseorderkey', line: i });
                
                
                                     mySalesOrderSearch = search.create({
                                        type: 'purchaseorder',
                                        columns: [{
                                            name: 'subsidiary'
                                        }],
                                        filters: [{
                                            name: 'internalid', //item
                                            operator: 'anyof',
                                            values: [purchaseorderkey]
                                        }                        
                                        ]
                                    });
                                    mySalesOrderSearch.run().each(function (rec) {
                                        log.debug('geted default locaton', rec)
                                        subsidiaryid = rec.getValue(rec.columns[0]);//UMS接收单号
                
                                    });
                
                                    defaultlocation = get_default_locationid(itemid, subsidiaryid);
                
                                    log.debug('获取默认仓库', { subsidiaryid: subsidiaryid, defaultlocation: defaultlocation });
                
                                    if (defaultlocation) {
                                        bulkReceive.setSublistValue({ sublistId: 'receiveitems', fieldId: 'receivinglocation', line: i, value: defaultlocation });
                
                                    }
                                }
                                */

                if (quantitytobereceived > 0) {

                    bulkReceive.setSublistValue({
                        sublistId: 'receiveitems',
                        fieldId: 'receiveitem',
                        line: i,
                        value: 'T'
                    });
                   
                    //有数量可以入库
                    for (var j = 0; j < itemlist.length; j++) {
                        if (itemlist[j].lineuniquekey == element) {
                            k = j;
                        }
                    }


                    cux_lot_num = itemlist[k].cux_lot_num;
                    yx_expriationdate = itemlist[k].yx_expriationdate;
                    log.debug(i + ' item: lotis ', { itemid: itemid, cux_lot_num: cux_lot_num });

                    bulkReceive.setSublistValue({
                        sublistId: 'receiveitems',
                        fieldId: 'quantitytobereceived',
                        line: i,
                        value: quantitytobereceived
                    });


                    if (bulkReceive.getSublistValue({ sublistId: 'receiveitems', fieldId: 'isnumbered', line: i }) == 'T')
                    //批次物料处理
                    {

                        if (typeof cux_lot_num == "undefined" || cux_lot_num == null || cux_lot_num == "") {
                            //如果批次为空，则自动生成批次 
                            var yyyymmdd = getyymmdd(bulkReceive.getValue({ fieldId: 'trandate' }));
                            cux_lot_num = get_new_lotnum(itemid, yyyymmdd);


                        }
                        //处理批次
                        log.debug(i + ' is 批次物料', { shipment_line: k, cux_lot_num: cux_lot_num, quantitytobereceived: quantitytobereceived });

                        bulkReceive.setSublistValue({
                            sublistId: 'receiveitems',
                            fieldId: 'custcol_wip_batch_number',
                            line: i,
                            value: cux_lot_num
                        });


                        // SublistSubrecord 行下面的子记录
                        {
                            log.debug(' line 377 start create lot data....');
                            var subrec = bulkReceive.getSublistSubrecord({
                                sublistId: 'receiveitems',
                                fieldId: 'inventorydetail',
                                line: i
                            });

                            subrec.insertLine({
                                sublistId: 'inventoryassignment',
                                line: 0
                            });
                            subrec.setSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'quantity',
                                line: 0,
                                value: quantitytobereceived
                            });

                            subrec.setSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'receiptinventorynumber',
                                line: 0,
                                value: cux_lot_num
                            });

                            subrec.setSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'expirationdate',
                                line: 0,
                                value: yx_expriationdate
                            });
                        }
                        subrec.commit;

                    }

                }

                else {
                    log.debug('line ' + i, '没有要入库的数量')
                }

            };
            log.debug('bulkReceive info', bulkReceive);
            try{
            var rcvid = bulkReceive.save();
            log.debug('入库 created rcvid =' + rcvid);
            }
            catch (e) {
                log.debug('入库失败 rcvid =' + rcvid,e.name+e.stack); 
            }

            return rcvid;
        }

        return {
            'get': doGet,
            put: doPut,
            post: doPost,
            'delete': doDelete
        };

    });

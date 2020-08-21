/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
define(['N/record', 'N/search'],
	/**
	 * @param {record} record
	 * @param {search} search
	 */
    function (record, search) {

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


        function find(element, dataList) {
            var k = -1;

            for (var i = 0; i < dataList.length; i++) {
                if (dataList[i] == element) {
                    k = i;
                }
            }
            return k;
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
            //   log.debug('bulkReceive count', itemLineCount);
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

                quantitytobereceived = bulkReceive.getSublistValue({ sublistId: 'receiveitems', fieldId: 'quantityremaining', line: i });


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
                    //有数量可以入库
                    for (var j = 0; j < itemlist.length; j++) {
                        if (itemlist[j].lineuniquekey == element) {
                            k = j;
                        }
                    }


                    cux_lot_num = itemlist[k].cux_lot_num;
                    yx_expriationdate=itemlist[k].yx_expriationdate;
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

            var rcvid = bulkReceive.save();
            log.debug('created rcvid =' + rcvid);

            return rcvid;
        }
        function onAction(scriptContext) {
            log.debug(scriptContext);
            ///读取表格
            var newRecord = scriptContext.newRecord;
            ///读取送货单ID值
            var inboundshipmentid = newRecord.getValue("id"); //runtime.getCurrentScript().getParameter("custscriptitemreceiptid"); // mycars[x]; //strtojson.values.internalid[0].value; //runtime.getCurrentScript().getParameter("custscriptinboundshipmentid");
            ///生成发货行明细，


            return inboundshipment_rcv(inboundshipmentid);


        }
        return {
            onAction: onAction
        };
    });
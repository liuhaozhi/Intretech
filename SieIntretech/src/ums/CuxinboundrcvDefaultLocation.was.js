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
          
            log.debug('get default location',{itemid:itemid, subsidiaryidsubsidiaryid:subsidiaryid});

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


        }
        function onAction(scriptContext) {
            log.debug(scriptContext);
            ///读取表格
            var newRecord = scriptContext.newRecord;
            ///读取送货单ID值
            var inboundshipmentid = newRecord.getValue("id"); //runtime.getCurrentScript().getParameter("custscriptitemreceiptid"); // mycars[x]; //strtojson.values.internalid[0].value; //runtime.getCurrentScript().getParameter("custscriptinboundshipmentid");
            ///生成发货行明细，


            return inboundshipment_default_location(inboundshipmentid);


        }
        return {
            onAction: onAction
        };
    });
/**
 *@NApiVersion 2.0
 *@author yuming Hu
 *@description po处理公共程序
 */
define([
    'N/record','N/search'
], function (
    record,search
) {
    var gprRecordTypeId = 'purchaserequisition', //采购申请记录类型
        gpoRecordTypeId = 'purchaseorder', //采购订单记录类型
        gItemreceiptRecTypeId = 'itemreceipt',
        gPurchaseorderRecTypeId = 'purchaseorder', //采购订单记录类型
        gItemSublistId = 'item', //货品子标签
        gLocationFieldId = 'location', //主线地点字段Id
        gInventorydetailSlFieldId = 'inventorydetail', //货品行地点详细信息
        gItemLocationSlFieldId = 'location', //货品行上的地点字段Id
        gInventoryassignmentSlRecId = 'inventoryassignment',
        gItemSlFieldId = 'item',
        gLineSlFieldId = 'line',
        gOrderlineSlFieldId = 'orderline'; //详细详细子标签


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
         //get default lot
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



      //公司层属性有效期天数
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


    return {
        getyymmdd:getyymmdd,
        get_default_locationid:get_default_locationid,
        get_new_lotnum:get_new_lotnum,
        get_shelf_life: get_shelf_life,
        find: find
    }
});
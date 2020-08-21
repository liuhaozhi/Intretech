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

    function create_intercompany_po_recceive_data(context) {
        //本程序第一版本 未检查编码是否一致
        var option = {
            main: {
                custrecord_po_custom_bill_number: null,
               // custrecord_ums_shipment_date: format.parse({ value: "2020/03/11", type: format.Type.DATETIME }),
                custrecord_ums_header_tariff_amount: null,
                custrecord_ums_header_tariff_bill: null,
                custrecord_ums_header_tariff_rate: null,
                custrecord_ums_inventory_num: "RCV20200402001",
                custrecord_ums_subsidiary_corporation: "1",
                custrecord_ums_vendor_name_inventory: "13135",
                custrecord_ums_header_tariff_currency: null,
                custrecord_ums_header_iso_fulfillment: 121707  //测试数据，YQRKD0000000292
            },
            items: [{
                custrecord_ums_line_item_inventory: "20",
                custrecord_ums_line_location: "14",
                custrecord_ums_line_lotnum: "202004030001",
                custrecord_ums_line_po_id: "12733",   //测数据，随意的
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
        var recId = poCommon.createintercompanyporcv(option);

        log.debug('recId', recId);

    }

    function onRequest(context) {

        create_intercompany_po_recceive_data(context);
    }

    return {
        onRequest: onRequest
    }
});
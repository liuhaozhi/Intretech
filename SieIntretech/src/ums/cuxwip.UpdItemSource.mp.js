/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/format', 'N/runtime', '../../src/app/app_so_common.js'], function (search, record, format, runtime, soCommon) {


    function getInputData() {

        /*  var ordertype = runtime.getCurrentScript().getParameter({
              name: 'custscriptordertype'
          });
  */


        var orderlist = [], searChID = 'customsearch_cux_wip_change_item_source';



        var mySearch = search.load({ id: searChID });

        log.debug('filters', mySearch.filters);
        log.debug('columns', mySearch.columns);
        log.debug('expression', mySearch.filterExpression);



        mySearch.run().each(function (rec) {

            var order_id = rec.id;
            orderlist.push(rec);

            return true;
        });

        //log.audit('orderlist', orderlist);
        return orderlist;

    }

    //接收--从自定义列表

    function map(context) {
        log.debug('test', context);
        var obj = JSON.parse(context.value);
        log.debug('id', obj.id);
        log.debug('RecTypeFrom', obj.recordType);
        log.debug('values', obj.values);
        log.debug('line', obj.values.linesequencenumber);

        var RecTypeFrom = obj.recordType,
            rec_id = obj.id,
            line = obj.values.linesequencenumber,
            itemid = obj.values.item[0].value;



        log.debug('data', { RecTypeFrom: RecTypeFrom, rec_id: rec_id, line: line, itemid: itemid });
        ////////////
        try {
            var fromSoRecord = record.load({
                type: RecTypeFrom,
                id: rec_id,
                isDynamic: true,
            });



            log.audit('fromSoRecord', fromSoRecord);
            //step1:获取行信息
            fromSoSlLineCount = fromSoRecord.getLineCount({
                sublistId: 'item'
            });
            var currln,
                currItemSource, currItemID;
            for (var i = 0; i < fromSoSlLineCount; i++) {

                fromSoRecord.selectLine({
                    sublistId: 'item',
                    line: i
                });


                currItemSource = fromSoRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemsource'
                });
                currItemID = fromSoRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'

                });


                if (currItemID == itemid && currItemSource == 'STOCK') {
                    log.debug('LINE:' + line, ' modify itemsource to PHANTOM');
                    fromSoRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemsource',
                        value: 'PHANTOM',
                        ignoreFieldChange: true,
                        forceSyncSourcing: true
                    });
                    fromSoRecord.commitLine({
                        sublistId: 'item'
                    });
                    break;
                }
            }
            log.debug(' saving....');
            fromSoRecord.save();


        }
        catch (e) {
            log.error('error', e + ',' + e.stack);

        }
        return true;
    };




    function summarize(summary) {

    }



    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    }
});

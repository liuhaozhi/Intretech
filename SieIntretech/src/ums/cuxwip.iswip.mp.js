/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/format', 'N/runtime'], function (search, record, format, runtime) {


    function getInputData() {

        /*  var ordertype = runtime.getCurrentScript().getParameter({
              name: 'custscriptordertype'
          });
  */


        var orderlist = [], order_count = 0;

        log.debug('getInputData', getInputData);
        var mysearch = search.load('customsearch_cux_wip_nowip_list');

        mysearch.run().each(function (rec) {
            orderlist.push(rec);

            return ++order_count < 200;
        });


        // log.debug('orderlist', orderlist);

        return orderlist;

    }



    function map(context) {
        try {
            var obj = JSON.parse(context.value);
            //  log.audit('test obj data', obj);
            var RecTypeFrom = obj.recordType,
                listrecid = obj.id;

            log.audit('update data', { RecTypeFrom: RecTypeFrom, listrecid: listrecid });
            record.submitFields({
                type: RecTypeFrom,
                id: listrecid,
                values: {
                    'iswip': true
                }
            });
        }
        catch (e) {
            log.debug({
                title: 'set iswip to true error',
                details: e.message + ' ' + e.stack
            });
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

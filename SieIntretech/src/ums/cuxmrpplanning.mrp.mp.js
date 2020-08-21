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


        var   orderlist = [];

        var mrpRecType = 'customrecordmrp_planned_order';
  
        search.create({
            type: mrpRecType,
            columns: [
                { name: 'internalid' },

            ],
            filters: [
                //需要增加公司段			

                {
                    name: 'custrecord_status_plan',
                    operator: 'noneof',
                    values: [4,8]//	已投放,取消
                }
            ]
        }).run().each(function (rec) {
          
            var order_id = rec.id;
            orderlist.push(rec);

            return true;
        });


        return orderlist;

    }

    //接收--从自定义列表

    function map(context) {

        var obj = JSON.parse(context.value);
        log.audit('test', obj);
        var RecTypeFrom = obj.recordType,

            listrecid = obj.id;

        var id = record.submitFields({
            type: RecTypeFrom,
            id: listrecid,
            values: {
                custrecord_status_plan: 8 //取消
            },
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true
            }
        });

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

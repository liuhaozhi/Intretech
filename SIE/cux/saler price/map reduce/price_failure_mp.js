/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */
define([
    'N/search',
    'N/record'
], function(
    search,
    record
) {

    function getInputData() {
        return search.load({
            id : 'customsearch_price_failure_search'
        })
    }

    function map(context) {
        var priceList = JSON.parse(context.value)
        failureList({
            listId : priceList.id,
            lisType : priceList.recordType
        })
    }

    function failureList(params){
        record.submitFields({
            type : params.lisType,
            id : params.listId,
            values : {
                custrecord_selling_price_effective_stat : '3'
            }
        })
    }

    return {
        getInputData: getInputData,
        map: map
    }
});

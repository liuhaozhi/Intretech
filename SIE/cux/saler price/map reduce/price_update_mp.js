/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */

define([
    'N/search',
    '../public/price_update_assistant'
], function(
    search,
    assistant
) {

    function getInputData() {
        return search.load({
            id : 'customsearch_price_update_search'
        })
    }

    function map(context) {
        var priceList = JSON.parse(context.value)
        var listId    = priceList.id
        var listVal   = priceList.values
        var lisType   = priceList.recordType
   
        assistant.updatEffect({
            id : listId,
            type : lisType,
            items : [{
                unit : listVal.custrecord_selling_price_unit.value,
                item : listVal.custrecord_cust_price_item_name.value,
                customer : listVal.custrecord_selling_price_client.value,
                currency : listVal.custrecord_selling_price_currency.value,
                subsidiary : listVal.custrecord_selling_price_subsidiary.value,
                customerProductCode : listVal.custrecord_cust_item_customer_number.value
            }]
        })
    }

    return {
        getInputData: getInputData,
        map: map
    }
});

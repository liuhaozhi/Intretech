/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define([
    'N/search'
],function(search){
    function searchColumns (params){
        var mySearch = search.load({
            id : 'customsearch_om_price_application'
        })

        return mySearch.columns
    }

    return {
        searchColumns : searchColumns
    }
})
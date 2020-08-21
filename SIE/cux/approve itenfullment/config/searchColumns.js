/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define([
    'N/search'
],function(search){
    function searchColumns (params){
        var mySearch = search.load({
            id : 'customsearch_sales_itemfullment_search'
        })

        return mySearch.columns
    }

    return {
        searchColumns : searchColumns
    }
})
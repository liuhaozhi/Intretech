/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define([
    'N/search'
], function(search){
    function sublistFields(params){
        var mySearch = search.load({
            id : 'customsearch_om_price_application'
        })

        return mySearch.columns.concat(params).map(function(item){
            log.error('item',item)
            return {
           
                id : item.name.slice(-10),
                label : item.label,
                type : 'text',
                source : item.source,
                displayType : item.name === 'custrecord_refusereason' ? 'ENTRY' : item.displayType
            }
        })
    }

    return {
        sublistFields : sublistFields
    }
})
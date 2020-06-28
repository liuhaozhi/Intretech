/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define([
    'N/search'
], function(search){
    function sublistFields(params){
        var mySearch = search.load({
            id : 'customsearch_om_delivery_notice'
        })

        return  mySearch.columns.concat(params).map(function(item){
            return {
                id : item.join ? (item.join + item.name.slice(-10)).toLowerCase() : item.name.slice(-10).toLowerCase(),
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
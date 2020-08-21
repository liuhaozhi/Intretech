/**
 * @NApiVersion 2.0
 * @NModuleScope Public 
 */

define([
    'N/search'
],function(search){

    function searchFilters(params){
        var filters = new Array()

        if(params.item)
        var items = JSON.parse(params.item)

        if(items && items.length && items[0])
        {
            filters.push(
                'AND',
                ['item' , 'anyof' , items]
            )
        }

        if(params.k3order)
        {
            filters.push(
                'AND',
                ['custcol_k3order_num' , 'is' , params.k3order]
            )
        }

        if(params.customerord)
        {
            filters.push(
                'AND',
                ['custcol_custorder' , 'is' , params.customerord]
            ) 
        }

        if(params.invoicenum)
        {
            filters.push(
                'AND',
                ['custbody_invoice_number' , 'is' , params.invoicenum]
            ) 
        }

        if(params.encasementnum)
        {
            filters.push(
                'AND',
                ['custbody_packing_number' , 'is' , params.encasementnum]
            ) 
        }

        if(params.isexport)
        {
            filters.push(
                'AND',
                ['custbody_om_export_or_not' , 'anyof' , [params.isexport]]
            )
        }

        if(params.location)
        {
            filters.push(
                'AND',
                ['location' , 'anyof' , [params.location]]
            )
        }

        if(params.subsidiary)
        {
            filters.push(
                'AND',
                ['createdfrom.subsidiary' , 'anyof' , [params.subsidiary]]
            )
        }

        if(params.employee)
        {
            filters.push(
                'AND',
                ['custbody_wip_documentmaker' , 'anyof' , [params.employee]]
            )
        }

        if(params.trandatend)
        {
            filters.push(
                'AND',
                ['trandate' , 'onorbefore' , [params.trandatend]]
            )
        }

        if(params.trandatestar)
        {
            filters.push(
                'AND',
                ['trandate' , 'onorafter' , [params.trandatestar]]
            )
        }

        if(params.fullmentord)
        {
            var transType = search.lookupFields({
                type : 'transaction' ,
                id : params.fullmentord ,
                columns : ['type']
            }).type

            if(transType[0])
            {
                if(transType[0].value === 'ItemShip')
                filters.push(
                    'AND',
                    ['internalid' , 'is' , [params.fullmentord]]
                )

                if(transType[0].value === 'SalesOrd')
                filters.push(
                    'AND',
                    ['createdfrom' , 'anyof' , [params.fullmentord]]
                )

                if(transType[0].value === 'Estimate')
                filters.push(
                    'AND',
                    ['custcol_salesorder' , 'anyof' , [params.fullmentord]]
                )
            }
        }
    
        return filters
    }

    return {
        searchFilters : searchFilters
    }
})
/**
 * @NApiVersion 2.0
 * @NModuleScope Public 
 */

define([
    '../../helper/wrapper_runtime'
],function(
    runtime
){
    function searchFilters(params){
        var filters = [
            ['custrecord_nextapproval' , 'anyof' , [runtime.getCurrentUserId()]],
            'AND',
            ['custrecord_selling_price_subsidiary' , 'anyof' , [params.subsidiary]]
        ]

        if(params.department)
        {
            filters.push(
                'AND',
                ['custrecord_selling_price_department' , 'anyof' , [params.department]]
            )
        }

        if(params.pricenum)
        {
            filters.push(
                'AND',
                ['custrecord_cust_price_list_link' , 'anyof' , [params.pricenum]]
            )
        }

        if(params.customer)
        {
            filters.push(
                'AND',
                ['custrecord_selling_price_client' , 'anyof' , [params.customer]]
            )
        }

        if(params.employee)
        {
            filters.push(
                'AND',
                ['custrecord_cust_price_list_link.custrecord_founder' , 'anyof' , [params.employee]]
            )
        }

        if(params.item)
        {
            filters.push(
                'AND',
                ['custrecord_cust_price_item_name' , 'anyof' , [params.item]]
            )
        }

        if(params.customeritem)
        {
            filters.push(
                'AND',
                ['custrecord_cust_item_customer_number' , 'anyof' , [params.customeritem]]
            )
        }
        

        if(params.deliverydatestar)
        {
            filters.push(
                'AND',
                ['custrecord_createdate.' , 'onorafter' , [params.deliverydatestar]]
            )
        }

        if(params.deliverydatend)
        {
            filters.push(
                'AND',
                ['custrecord_createdate' , 'onorbefore' , [params.deliverydatend]]
            )
        }
    
        return filters
    }

    return {
        searchFilters : searchFilters
    }
})
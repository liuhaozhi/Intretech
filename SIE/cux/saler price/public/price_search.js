/** 
 * price search
 * @NApiVersion 2.x
 * @NModuleScope Public
 */
define([
    'N/search'
], function(search) {
    var STARPREFIX = 'custrecord_item_sales_volume_start_'
    var ENDPREFIX  = 'custrecord_item_sales_volume_end_'
    var PRICEPREFIX= 'custrecord_item_sale_price_'

    function ItemResult(params){
        var result = new Object()
        params.columns = params.columns || priceColumns()
        priceSearch(params)
        .each(function(record){
            var ITEM   = record.getValue('custrecord_cust_price_item_name')
            result[ITEM] = itemInfo({
                item : ITEM,
                record : record,
                quantitys : params.quantitys
            })
      
            return true
        })

        return result
    }

    function itemInfo(params){
        var item = params.item
        var record = params.record
        var quantitys = params.quantitys

        for(var i = 1; i < 16; i ++)
        {
            var SQSTAR = +record.getValue(STARPREFIX + i) 
            var SQEND  = +record.getValue(ENDPREFIX + i) 
            
            if(quantitys[item] >= SQSTAR && quantitys[item] < SQEND)
            {
                return {
                    price : record.getValue(PRICEPREFIX + i),
                    mode : record.getValue('custrecord_selling_price_effective_mode'),
                    customerDiscount : record.getValue('custrecord_cust_customer_discount')
                }
            }
        }

        if(record.getValue('custrecord_without_ladder'))
        {
            return {
                price : record.getValue('custrecord_nonof_ladder_price'),
                mode : record.getValue('custrecord_selling_price_effective_mode'),
                customerDiscount : record.getValue('custrecord_cust_customer_discount')
            }
        }
    }

    function priceSearch(params){
        var type = 'customrecord_cust_price_item_list'

        return search.create({
            type : type,
            filters : priceFilters(params.items),
            columns : params.columns || []
        }).run()
    }

    function priceColumns(){
        var columns = new Array()

        columns.push(
            'custrecord_without_ladder',
            'custrecord_nonof_ladder_price', 
            'custrecord_cust_price_item_name',
            'custrecord_cust_customer_discount',
            'custrecord_selling_price_effective_mode'
        )
        for(var i = 1 ; i < 16 ; i ++)
        {
            columns.push(STARPREFIX + i,ENDPREFIX + i,PRICEPREFIX + i)
        }

        return columns
    }

    function priceFilters(items){
        var filters = new Array()

        for(var i = 0; i < items.length; i ++)
        {
            var item = items[i]
            var itemFilter = new Array()
            itemFilter.push(
                ['custrecord_selling_price_unit' , 'anyof' , [item.unit]],
                'AND',
                ['custrecord_cust_price_item_name' , 'anyof' , [item.item]],
                'AND',
                ['custrecord_selling_price_client' , 'anyof' , [item.customer]],
                'AND',
                ['custrecord_selling_price_currency' , 'anyof' , [item.currency]],
                'AND',
                ['custrecord_selling_price_subsidiary' , 'anyof' , [item.subsidiary]],
                'AND',
                ['custrecord_selling_price_effective_stat' , 'anyof' , ['2']]
            )

            if(item.customerProductCode)
            {
                itemFilter.push(
                    'AND',
                    ['custrecord_cust_item_customer_number' , 'anyof' , [item.customerProductCode]]
                )
            }

            filters.push(itemFilter)

            if(items.length > 1 && i <= items.length - 2)
            {
                filters.push('OR')
            }
        }

        return filters
    }

    return {
        ItemResult : ItemResult,
        priceSearch : priceSearch
    }

});
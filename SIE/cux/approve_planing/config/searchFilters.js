/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define({
    searchFilters : function (params){
        var filters = [
            ['custrecord_salesorder_shipped' , 'is' , 'F'],
            'AND',
            ['custrecord_p_custcol_approval_status' , 'anyof' , [1]]
        ]
   
        if(params.item)
        {
            filters.push(
                'AND',
                ['custrecord_p_item' , 'anyof' , [params.item]]
            )
        }
         
        if(params.apptype)
        {
            filters.push(
                'AND',
                ['custrecord_approval_type' , 'anyof' , [params.apptype]]
            )
        }

        if(params.subsidiary)
        {
            filters.push(
                'AND',
                ['custrecord_copysubsidiary' , 'anyof' , [params.subsidiary]]
            )
        }

        if(params.salesorder)
        {
            filters.push(
                'AND',
                ['custrecord_p_custcol_salesorder' , 'anyof' , [params.salesorder]]
            )
        }

        if(params.deliverydatend)
        {
            filters.push(
                'AND',
                ['custrecord_p_expectedshipdate' , 'onorbefore' , [params.deliverydatend]]
            )
        }

        if(params.deliverydatestar)
        {
            filters.push(
                'AND',
                ['custrecord_p_expectedshipdate' , 'onorafter' , [params.deliverydatestar]]
            )
        }

        return filters
    }
})
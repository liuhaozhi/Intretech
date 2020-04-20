/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define({
    searchFilters : function (params){
        var filters = new Array()

        filters.push(
            ['mainline' , 'is' , 'F'],
            'AND',
            ['taxline' , 'is' , 'F'],
            'AND',
            ['formulanumeric: ABS({quantity}) - ABS({quantitypicked})' , 'greaterthan' , 0],
            'AND',
            ['status' , 'anyof' , ['SalesOrd:D' , 'SalesOrd:B' , 'SalesOrd:E']]
        )

        if(params.subsidiary)
        {
            filters.push(
                'AND',
                ['subsidiary' , 'anyof' , [params.subsidiary]]
            )
        }

        if(params.customer && params.customer !== '-1')
        {
            filters.push(
                'AND',
                ['entity' , 'anyof' , [params.customer]]
            )
        }

        if(params.trandate)
        {
            filters.push(
                'AND',
                ['trandate' , 'onorafter' , [params.trandate]]
            )
        }

        if(params.dateclose)
        {
            filters.push(
                'AND',
                ['trandate' , 'onorbefore' , [params.dateclose]]
            )
        }

        if(params.salesorder)
        {
            filters.push(
                'AND',
                ['custcol_salesorder' , 'anyof' , [params.salesorder]]
            )
        }

        if(params.emoloyee)
        {
            filters.push(
                'AND',
                ['custbody_pc_salesman' , 'anyof' , [params.emoloyee]]
            )
        }

        return filters
    }
})
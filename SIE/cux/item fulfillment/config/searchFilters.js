/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define({
    searchFilters : function (params){
        var filters = new Array()

        filters.push(
            ['taxline' , 'is' , 'F'],
            'AND',
            ['mainline' , 'is' , 'F'],
            'AND',
            ['custbody_sales_status' , 'noneof' , '14'],
            'AND',
            ['custcol_salesorder.taxline' , 'is' , 'F'],
            'AND',
            ['custcol_salesorder.mainline' , 'is' , 'T'],
            'AND',
            ['status' , 'anyof' , ['SalesOrd:D' , 'SalesOrd:B' , 'SalesOrd:E']],
            'AND',
            ['formulanumeric: ABS({quantity}) - ABS({quantitypicked})' , 'greaterthan' , 0]
        )

        if(params.k3order)
        {
            filters.push(
                'AND',
                ['custcol_k3order_num' , 'contains' , [params.k3order]]
            )
        }

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

        if(params.department)
        {
            filters.push(
                'AND',
                ['department' , 'anyof' , [params.department]]
            )
        }

        if(params.invoicenum)
        {
            filters.push(
                'AND',
                ['custbody_invoice_number' , 'contains' , [params.invoicenum]]
            )
        }
   
        if(params.boxnum)
        {
            filters.push(
                'AND',
                ['custbody_packing_number' , 'contains' , [params.boxnum]]
            )
        }

        if(params.emoloyee)
        {
            filters.push(
                'AND',
                ['custbody_pc_salesman' , 'anyof' , [params.emoloyee]]
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

        if(params.advice)
        {
            filters.push(
                'AND',
                ['internalId' , 'anyof' , [params.advice]]
            )
        }

        if(params.salesorder)
        {
            filters.push(
                'AND',
                ['custcol_salesorder' , 'anyof' , [params.salesorder]]
            )
        }

        if(params.isexport)
        {
            filters.push(
                'AND',
                ['custbody_ifexport' , 'is' , [params.isexport === '1' ? 'T' : 'F']]
            )
        }

        if(params.customerord)
        {
            filters.push(
                'AND',
                ['custcol_salesorder.custbody_wip_customer_order_number' , 'is' , params.customerord]
            )
        }

        return filters
    }
})
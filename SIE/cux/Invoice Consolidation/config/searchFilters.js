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
            ['taxline' , 'is' , 'F']
        )

        if(params.printype === '1') //运输发票
        {
            filters.push(
                'AND',
                [
                    ['custcol_ci_yunshu' , 'anyof' , ['@NONE@']],
                    'OR',
                    ['formulanumeric: ABS({quantity}) - ABS({custcol_ci_yunshudaying})' , 'greaterthan' , 0]
                ]
            )
        }
        else //收款发票
        {
            filters.push(
                'AND',
                ['status' , 'anyof' , ['SalesOrd:F' , 'SalesOrd:B' , 'SalesOrd:E']],
                'AND',
                ['formulanumeric: ABS({quantityshiprecv}) - ABS({quantitybilled})' , 'greaterthan' , 0]
            )
        }

        if(params.subsidiary)
        {
            filters.push(
                'AND',
                ['subsidiary' , 'anyof' , [params.subsidiary]]
            )
        }

        if(params.currency)
        {
            filters.push(
                'AND',
                ['currency' , 'anyof' , [params.currency]]
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

        if(params.receipt)
        {
            filters.push(
                'AND',
                ['internalId' , 'anyof' , [params.receipt]]
            )
        }

        if(params.invoice)
        {
            filters.push(
                'AND',
                ['custbody_invoice_number' , 'contains' , [params.invoice]]
            )
        }

        if(params.boxnumber)
        {
            filters.push(
                'AND',
                ['custbody_packing_number' , 'contains' , [params.boxnumber]]
            )
        }

        return filters
    }
})
/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define({
    searchFilters : function (params){
        if(params.item)
        var items = JSON.parse(params.item)
        var filters = [
            ['custrecord_p_custcol_salesorder.mainline' , 'is' , 'T'],
            'AND',
            ['custrecord_p_custcol_salesorder.taxline' , 'is' , 'F'],
            'AND',
            ['custrecord_salesorder_shipped' , 'is' , 'F']
        ]

        if(items && items.length && items[0])
        {
            filters.push(
                'AND',
                ['custrecord_p_item' , 'anyof' , items]
            )
        }

        if(params.k3order)
        {
            filters.push(
                'AND',
                ['custrecord_p_custcol_k3order_num' , 'contains' , params.k3order]
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

        if(params.customer && params.customer !== '-1')
        {
            filters.push(
                'AND',
                ['custrecord_p_custcol_salesorder.entity' , 'anyof' , [params.customer]]
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

        if(params.currency)
        {
            filters.push(
                'AND',
                ['custrecord_p_custcol_salesorder.currency' , 'anyof' , [params.currency]]
            )
        }

        if(params.trandate)
        {
            filters.push(
                'AND',
                ['custrecord_p_custcol_salesorder.trandate' , 'onorafter' , [params.trandate]]
            )
        }
        
        if(params.dateclose)
        {
            filters.push(
                'AND',
                ['custrecord_p_custcol_salesorder.trandate' , 'onorbefore' , [params.dateclose]]
            )
        }
    
        if(params.emoloyee)
        {
            filters.push(
                'AND',
                ['custrecord_p_custcol_salesorder.custbody_pc_salesman' , 'anyof' , [params.emoloyee]]
            )
        }

        if(params.ordertype)
        {
            if(params.ordertype !== '-1')
            {
                filters.push(
                    'AND',
                    ['custrecord_p_custcol_salesorder.custbody_cust_ordertype' , 'anyof' , [params.ordertype]]
                )
            }
            else
            {
                filters.push(
                    'AND',
                    ['custrecord_p_custcol_salesorder.custbody_cust_ordertype' , 'noneof' , ['1' , '7']]
                )
            }
        }
        else
        {
            filters.push(
                'AND',
                ['custrecord_p_custcol_salesorder.custbody_cust_ordertype' , 'noneof' , ['1' , '7']]
            )
        }

        if(params.isintercompany)
        {
            filters.push(
                'AND',
                ['custrecord_p_custcol_salesorder.custbody_whether_ntercompany_transact' , 'is' , 'T']
            )

            if(params.isintercompany === '2') //对外 需要最终客户
            {
                filters.push(
                    'AND',
                    ['custrecord_p_custcol_salesorder.custbody_final_customer' , 'anyof' , [params.endcustomer]]
                )
            }
            else
            {
                filters.push(
                    'AND',
                    ['custrecord_p_custcol_salesorder.custbody_source_purchase' , 'is' , 'T']
                )
            }
        }
        else
        {
            filters.push(
                'AND',
                ['custrecord_p_custcol_salesorder.custbody_whether_ntercompany_transact' , 'is' , 'F']
            )
        }

        if(params.sourcemp)
        {
            filters.push(
                'AND',
                ['custrecord_p_custcol_salesorder.custbody_source_doc_creator' , 'anyof' , [params.sourcemp]]
            )
        }

        return filters
    }
})
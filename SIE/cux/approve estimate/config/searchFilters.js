/**
 * @NApiVersion 2.0
 * @NModuleScope Public 
 */

define({
    searchFilters : function (params){
        var filters = new Array()

        if(params.isapprove)
        {
            switch(params.isapprove)
            {
                case '1':
                case '2':
                case '3':
                    filters.push(
                        'AND',
                        ['custbody_order_status' , 'anyof' , [params.isapprove]]
                    )
                break
                case '4':
                    filters.push(
                        'AND',
                        ['custbody_order_status' , 'anyof' , ['9']]
                    )
                break
                case '5':
                    filters.push(
                        'AND',
                        ['custbody_order_status' , 'anyof' , ['10']]
                    )
                break
                default :
                break
            }      
        }
        else
        {
            filters.push(
                'AND',
                ['custbody_order_status' , 'noneof' , ['14']]
            )
        }

        if(params.myself === 'T'){
            if(params.role != '1112'){
                filters.push(
                    'AND',
                    ['custbody_workflow' , 'anyof' , [params.role]]
                )
            }else{
                filters.push(
                    'AND',
                    ['custbody_next_approve' , 'anyof' , ['1']]
                )
            }
        }

        if(params.creater){
            filters.push(
                'AND',
                ['custbody_wip_documentmaker' , 'anyof' , [params.creater]]
            )
        }

        if(params.director)
        {
            filters.push(
                'AND',
                ['custbody_pc_salesman.supervisor' , 'anyof' , [params.director]]
            )
        }

        if(params.subsidiary)
        {
            filters.push(
                'AND',
                ['subsidiary' , 'anyof' , [params.subsidiary]]
            )
        }

        if(params.customer)
        {
            filters.push(
                'AND',
                ['entity' , 'anyof' , [params.customer]]
            )
        }

        if(params.employee)
        {
            filters.push(
                'AND',
                ['custbody_pc_salesman' , 'anyof' , [params.employee]]
            )
        }

        if(params.estimate)
        {
            filters.push(
                'AND',
                ['internalid' , 'is' , params.estimate]
            )
        }

        if(params.ordtype)
        {
            filters.push(
                'AND',
                ['custbody_cust_ordertype' , 'anyof' , [params.ordtype]]
            )
        }

        if(params.customerord)
        {
            filters.push(
                'AND',
                ['custbody_wip_customer_order_number' , 'contains' , [params.customerord]]
            )
        }
        
        if(params.interitem)
        {
            filters.push(
                'AND',
                ['item' , 'anyof' , [params.interitem]]
            )
        }

        if(params.customeritem)
        {
            filters.push(
                'AND',
                ['custcol_cgoodscode' , 'anyof' , [params.customeritem]]
            )
        }

        if(params.department)
        {
            filters.push(
                'AND',
                ['department' , 'anyof' , [params.department]]
            )
        }

        if(params.deliverydatestar)
        {
            filters.push(
                'AND',
                ['custcol_dedate' , 'onorafter' , [params.deliverydatestar]]
            )
        }

        if(params.deliverydatend)
        {
            filters.push(
                'AND',
                ['custcol_dedate' , 'onorbefore' , [params.deliverydatend]]
            )
        }

        if(params.trandatestar)
        {
            filters.push(
                'AND',
                ['trandate' , 'onorafter' , [params.trandatestar]]
            )
        }

        if(params.trandatend)
        {
            filters.push(
                'AND',
                ['trandate' , 'onorbefore' , [params.trandatend]]
            )
        }
    
        return filters
    }
})
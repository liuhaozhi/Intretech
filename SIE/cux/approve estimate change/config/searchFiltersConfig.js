/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([],
    () => {
        return {
            searchFilters : params => {
                const filters = new Array()

                if(params.isapprove)
                {
                    switch(params.isapprove)
                    {
                        case '1':
                        case '2':
                        case '3':
                            filters.push(
                                'AND',
                                ['custrecord_c_custcol_salesorder.custbody_order_status' , 'anyof' , [params.isapprove]]
                            )
                        break
                        case '4':
                            filters.push(
                                'AND',
                                ['custrecord_c_custcol_salesorder.custbody_order_status' , 'anyof' , ['9']]
                            )
                        break
                        case '5':
                            filters.push(
                                'AND',
                                ['custrecord_c_custcol_salesorder.custbody_order_status' , 'anyof' , ['10']]
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
                        ['custrecord_c_custcol_salesorder.custbody_order_status' , 'noneof' , ['14']]
                    )
                }
        
                if(params.creater){
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.custbody_wip_documentmaker' , 'anyof' , [params.creater]]
                    )
                }
        
                if(params.director)
                {
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.custbody_pc_salesman.supervisor' , 'anyof' , [params.director]]
                    )
                }
        
                if(params.subsidiary)
                {
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.subsidiary' , 'anyof' , [params.subsidiary]]
                    )
                }
        
                if(params.customer)
                {
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.entity' , 'anyof' , [params.customer]]
                    )
                }
        
                if(params.employee)
                {
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.custbody_pc_salesman' , 'anyof' , [params.employee]]
                    )
                }
        
                if(params.estimate)
                {
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.internalid' , 'is' , params.estimate]
                    )
                }
        
                if(params.ordtype)
                {
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.custbody_cust_ordertype' , 'anyof' , [params.ordtype]]
                    )
                }
        
                if(params.endcustomer)
                {
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.custbody_final_customer' , 'anyof' , [params.endcustomer]]
                    )
                }
        
                if(params.customerord)
                {
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.custbody_wip_customer_order_number' , 'contains' , [params.customerord]]
                    )
                }
                
                if(params.interitem)
                {
                    let interitem = JSON.parse(params.interitem)

                    if(interitem.length && interitem[0])
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.item' , 'anyof' , interitem]
                    )
                }
        
                if(params.customeritem)
                {
                    let customeritem = JSON.parse(params.customeritem)

                    if(customeritem.length && customeritem[0])
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.custcol_cgoodscode' , 'anyof' , customeritem]
                    )
                }
        
                if(params.department)
                {
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.department' , 'anyof' , [params.department]]
                    )
                }
        
                if(params.deliverydatestar)
                {
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.custcol_dedate' , 'onorafter' , [params.deliverydatestar]]
                    )
                }
        
                if(params.deliverydatend)
                {
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.custcol_dedate' , 'onorbefore' , [params.deliverydatend]]
                    )
                }
        
                if(params.trandatestar)
                {
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.trandate' , 'onorafter' , [params.trandatestar]]
                    )
                }
        
                if(params.trandatend)
                {
                    filters.push(
                        'AND',
                        ['custrecord_c_custcol_salesorder.trandate' , 'onorbefore' , [params.trandatend]]
                    )
                }

                log.error('filters',filters)
            
                return filters
            }
        }
    }    
)
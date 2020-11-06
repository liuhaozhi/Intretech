/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([],
    () => {
        return {
            searchFilters : params => {
                const filters = new Array()

                if(params.payee)
                {
                    filters.push(
                        'AND',
                        ['entity' , 'anyof' , [params.payee]]
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
        
                if(params.employee)
                {
                    filters.push(
                        'AND',
                        ['custbody_po_invoice' , 'is' , params.employee]
                    )
                }

                if(params.transaction)
                {
                    filters.push(
                        'AND',
                        ['internalid' , 'anyof' , [params.transaction]]
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
        }
    }    
)
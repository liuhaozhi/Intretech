/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/search',
    'N/record',
    'N/format',
    'N/currency',
    '../helper/credit_sign_of_operation'
], function(
    search,
    record,
    format,
    currency,
    operation
) {
    function afterSubmit(context) {
        if(context.type === context.UserEventType.EDIT || context.type === context.UserEventType.DELETE)
        {
            var newRecord = context.newRecord
            var oldRecord = context.oldRecord
            var type = oldRecord.type
            var createdfrom = oldRecord.getValue('createdfrom')
            var ascurrency = customerAndSubsidiaryCurrency(oldRecord.getValue('entity'),oldRecord.getValue('subsidiary'))
            var exchangeRate = currency.exchangeRate({
                source: oldRecord.getValue('currency'),
                target: ascurrency.customerCurrency,
                date: oldRecord.getValue('trandate')
            })
            if(createdfrom)
            {
                hasCreateFrom({
                    type : type,
                    context : context,
                    newRecord : newRecord,
                    oldRecord : oldRecord,
                    createdfrom : createdfrom,
                    exchangeRate : exchangeRate
                })
            }
            else //没有来源  一律按nre计算
            {
                noneCreateFrom({
                    type : type,
                    context : context,
                    newRecord : newRecord,
                    oldRecord : oldRecord,
                    exchangeRate : exchangeRate
                })
            }
        }

        if(context.type === 'create' || context.type === 'edit')
        {
            beforeCredit(context.newRecord,context.type)
        }
        if(context.type === 'delete')
        {
            beforeCredit(context.oldRecord,context.type)
        }
    }

    function beforeCredit(oldRecord,type){
        var createdfrom = oldRecord.type === 'invoice' ?
        oldRecord.getValue('createdfrom') :  oldRecord.type === 'salesorder' ?
        oldRecord.id : true
        var invSitua = undefined
   
        if(createdfrom)
        {
            invSitua = invSituation(createdfrom,oldRecord.getValue('entity'),oldRecord.getValue('subsidiary'))
            search.create({
                type : 'invoice',
                filters : [
                    ['mainline' , 'is' , 'T'],
                    'AND',
                    ['createdfrom' , 'anyof' , [createdfrom]]
                ],
                columns : [
                    'custbody_cust_beforesave_credit'
                ]
            }).run().each(function(res){
                record.submitFields({
                    type : res.recordType,
                    id : res.id,
                    values : {
                        'custbody_cust_beforesave_credit' : invSitua
                    }
                })
                return true
            })
            if(
                oldRecord.type === 'salesorder' && type === 'delete' || 
                oldRecord.type === 'estimate' && type === 'delete'
            )
            {
                return false
            }
            else
            {
                var saveType = search.lookupFields({
                    type : 'transaction',
                    id : createdfrom,
                    columns : [
                        'type'
                    ]
                })

                saveType = saveType.type[0].value === 'Estimate' ?
                'estimate' : saveType.type[0].value === 'SalesOrd' ?
                'salesorder' : false

                if(saveType)
                {
                    record.submitFields({
                        type : saveType,
                        id : createdfrom,
                        values : {
                            'custbody_cust_beforesave_credit' : invSitua
                        }
                    })
                }
            }
        }
        
    }

    function saveChanged(params){
        var entity = undefined
        var subsidiary = undefined
        var oldInvTotal = undefined
        var type = params.type
        var oldRecord = params.oldRecord
        var newRecord = params.newRecord
        var createdfrom = type === 'invoice' ?
        oldRecord.getValue('createdfrom') : oldRecord.id

        params.event === 'delete' ?
        (oldInvTotal = oldRecord.getValue('custbody_cust_beforesave_credit') , entity = oldRecord.getValue('entity') , subsidiary = oldRecord.getValue('subsidiary')) : 
        (oldInvTotal = newRecord.getValue('custbody_cust_beforesave_credit') , entity = newRecord.getValue('entity') , subsidiary = newRecord.getValue('subsidiary'))

        var newInvTotal = invSituation(createdfrom,entity,subsidiary)

        if(oldInvTotal !== newInvTotal)
        {
            operation.changeCredit({
                newTotal : newInvTotal,
                oldTotal : oldInvTotal,
                customer : oldRecord.getValue('entity')
            })
        }       
    }

    function customerAndSubsidiaryCurrency(customer,subsidiary){
        return {
            customerCurrency : search.lookupFields({
                type : 'customer',
                id : customer,
                columns : ['currency']
            }).currency[0].value,
            subsidiaryCurrency : search.lookupFields({
                type : 'subsidiary',
                id : subsidiary,
                columns : ['currency']
            }).currency[0].value
        }
    }

    function invSituation(createdfrom,customer,subsidiary){
        var invTotal = {
            hasInvoiceTotal : 0,
            didInvoiceTotal : 0
        }

        var customerCurrency = search.lookupFields({
            type : 'customer',
            id : customer,
            columns : ['currency']
        }).currency[0].value

        search.create({
            type : 'invoice',
            filters : [
                ['mainline' , 'is' , 'T'],
                'AND',
                ['createdfrom' , 'anyof' , [createdfrom]]
            ],
            columns : [
                {name : 'fxamount' , summary : 'sum'},
                {name : 'trandate' , summary : 'group'},
                {name : 'currency' , summary : 'group'}
            ]
        }).run().each(function(res){
            var exchange = currency.exchangeRate({
                source: res.getValue({name : 'currency' , summary : 'group'}),
                target: customerCurrency,
                date: format.parse({
                    type : format.Type.DATE,
                    value :  res.getValue({name : 'trandate' , summary : 'group'})
                })
            })

            invTotal.hasInvoiceTotal = operation.add(+res.getValue( {name : 'fxamount' , summary : 'sum'}) * exchange , invTotal.hasInvoiceTotal) 
            return true
        })

        var didInvoiceTotalSearch = search.load({
            id : 'customsearch_shipping_order_rema'
        })

        var filters = didInvoiceTotalSearch.filters
        var columns = didInvoiceTotalSearch.columns

        didInvoiceTotalSearch.filters = filters.concat({
            name : 'internalId' , 
            operator : 'anyof',
            values : [createdfrom]
        })

        didInvoiceTotalSearch.run().each(function(res){
            var exchange = currency.exchangeRate({
                source: res.getValue(columns[0]),
                target: customerCurrency,
                date: format.parse({
                    type : format.Type.DATE,
                    value : res.getValue(columns[1])
                })
            })
            invTotal.didInvoiceTotal = operation.add(+res.getValue(columns[2]) * exchange , invTotal.didInvoiceTotal) 
            return true
        })

        return operation.add(invTotal.hasInvoiceTotal , invTotal.didInvoiceTotal)
    }

    function hasCreateFrom(params){
        var type = params.type
        var context = params.context
        var newRecord = params.newRecord
        var oldRecord = params.oldRecord
        var fromType = search.lookupFields({
            type : 'transaction',
            id : params.createdfrom,
            columns : ['type']
        })

        if(type === 'invoice')
        {
            if(fromType.type[0].value === 'SalesOrd') //发货通知单来的发票
            {
                var ordertype = getSalesType(newRecord,oldRecord)

                if(ordertype && ordertype.custbody_cust_ordertype[0])
                {
                    if(ordertype.custbody_cust_ordertype[0].value === '1')  //nre
                    {                       
                        if(context.type === context.UserEventType.EDIT)
                        {
                            operation.changeCredit({
                                newTotal : newRecord.getValue('total') * params.exchangeRate,
                                oldTotal : oldRecord.getValue('total') * params.exchangeRate,
                                customer : oldRecord.getValue('entity')
                            })
                        }
                        if(context.type === context.UserEventType.DELETE)
                        {
                            operation.changeCredit({
                                newTotal : 0,
                                oldTotal : oldRecord.getValue('total') * params.exchangeRate,
                                customer : oldRecord.getValue('entity')
                            })
                        }
                    }
                    else  //非nre
                    {
                        saveChanged({
                            type : type,
                            event : context.type,
                            newRecord : newRecord,
                            oldRecord : oldRecord
                        })   
                    }
                }
            }
            else //不是来源发货通知单  一律按nre计算
            {
                if(context.type === context.UserEventType.EDIT)
                {
                    operation.changeCredit({
                        newTotal : newRecord.getValue('total') * params.exchangeRate,
                        oldTotal : oldRecord.getValue('total') * params.exchangeRate,
                        customer : oldRecord.getValue('entity')
                    })
                }
                if(context.type === context.UserEventType.DELETE)
                {
                    operation.changeCredit({
                        newTotal : 0,
                        oldTotal : oldRecord.getValue('total') * params.exchangeRate,
                        customer : oldRecord.getValue('entity')
                    })
                }
            }
        }
        else if(type === 'salesorder')
        {
            var ordertype = oldRecord.getValue('custbody_cust_ordertype')
            if(ordertype) //发货通知单非nre
            {
                if(ordertype !== '1')
                {
                    if(context.type === context.UserEventType.EDIT || context.type === context.UserEventType.DELETE)
                    {
                        saveChanged({
                            type : type,
                            event : context.type,
                            newRecord : newRecord,
                            oldRecord : oldRecord
                        })
                    }
                }
            }
        }
    }

    function noneCreateFrom(params){
        var type = params.type
        var context = params.context
        var newRecord = params.newRecord
        var oldRecord = params.oldRecord
    
        if(type === 'invoice')
        {
            if(context.type === context.UserEventType.EDIT) 
            {
                operation.changeCredit({
                    newTotal : newRecord.getValue('total') * params.exchangeRate,
                    oldTotal : oldRecord.getValue('total') * params.exchangeRate,
                    customer : oldRecord.getValue('entity')
                })
            }

            if(context.type === context.UserEventType.DELETE)
            {
                operation.changeCredit({
                    newTotal : 0,
                    oldTotal : oldRecord.getValue('total') * params.exchangeRate,
                    customer : oldRecord.getValue('entity')
                })
            }  
        }

        if(type === 'salesorder')
        {
            var ordertype = getSalesType(newRecord,oldRecord)

            if(ordertype && ordertype.custbody_cust_ordertype[0].value !== '1')
            {
                saveChanged({
                    type : type,
                    event : params.context.type,
                    newRecord : newRecord,
                    oldRecord : oldRecord
                })   
            }
        }
    }

    function getSalesType(newRecord,oldRecord){
        var currRecord = newRecord || oldRecord
        var estimateId = currRecord.getSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_salesorder',
            line : 0
        })

        if(estimateId)
        return search.lookupFields({
            type : 'estimate',
            id : estimateId,
            columns : [
                'custbody_cust_ordertype'
            ]
        })
    }

    return {
        afterSubmit: afterSubmit
    }
});

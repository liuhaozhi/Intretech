/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/search',
    'N/currency',
    'N/format',
    '../../public/helper/credit_sign_of_operation'
], function(
    search,
    currency,
    format,
    operation
) {
    function create(params){
        var newRecord = params.newRecord
        var createdfrom = newRecord.getValue('createdfrom')
        var customer = newRecord.getValue('entity')
        var subsidiary = newRecord.getValue('subsidiary')
        if(createdfrom)
        {
            var fromType = search.lookupFields({
                type : 'transaction',
                id : createdfrom,
                columns : [
                    'type',
                    'custbody_cust_ordertype'
                ]
            })

            var orderType = search.lookupFields({
                type : 'estimate',
                id : newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_salesorder',
                    line : 0
                }),
                columns : [
                    'custbody_cust_ordertype'
                ]
            })

            if(fromType.type[0].value === 'SalesOrd')
            {
                if(orderType.custbody_cust_ordertype[0])
                {
                    if(orderType.custbody_cust_ordertype[0].value === '1') //来源NRE的发货通知单，新的发票直接计入额度使用
                    {
                        operation.changeCredit({
                            newTotal : operation.afterRateTotal(newRecord.id,customer,subsidiary),
                            customer : newRecord.getValue('entity')
                        })
                    }
                    else //非nre订单，需要重新计算额度
                    {
                        var invTotal = invSituation(createdfrom,customer,subsidiary)
                        //新旧对比  
                        operation.changeCredit({
                            newTotal : invTotal,
                            oldTotal : newRecord.getValue('custbody_cust_beforesave_credit'),
                            customer : newRecord.getValue('entity')
                        })
                    }
                }
                else
                { //如果不是订单来的发货通知单 和非nre订单一样处理
                    operation.changeCredit({
                        newTotal : operation.afterRateTotal(newRecord.id,customer,subsidiary),
                        customer : newRecord.getValue('entity')
                    })
                }
            }
            else if(fromType.type[0].value === 'Estimate') //没有发货通知单的，直接从订单来的
            {
                if(fromType.custbody_cust_ordertype[0].value === '1') //从nre订单来的
                {
                    operation.changeCredit({
                        newTotal : operation.afterRateTotal(newRecord.id,customer,subsidiary),
                        customer : newRecord.getValue('entity')
                    })
                }
            } 
        }
        else //没有任何来源的 直接计入客户额度使用
        {
            operation.changeCredit({
                newTotal : operation.afterRateTotal(newRecord.id,customer,subsidiary),
                customer : newRecord.getValue('entity')
            })
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
            invTotal.hasInvoiceTotal = +res.getValue(
                {name : 'fxamount' , summary : 'sum'}
            ) * currency.exchangeRate({
                source: res.getValue({name : 'currency' , summary : 'group'}),
                target: customerCurrency,
                date: format.parse({
                    type : format.Type.DATE,
                    value : res.getValue({name : 'trandate' , summary : 'group'})
                })
            })
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
            invTotal.didInvoiceTotal = +res.getValue(columns[2]) * currency.exchangeRate({
                source: res.getValue(columns[0]),
                target: customerCurrency,
                date: format.parse({
                    type : format.Type.DATE,
                    value : res.getValue(columns[1])
                })        
            })
        })

        return operation.add(invTotal.hasInvoiceTotal , invTotal.didInvoiceTotal)
    }


    return {
        afterSubmit : function afterSubmit(context) {
            if(context.type === context.UserEventType.CREATE)
            {
                create({
                    newRecord : context.newRecord,
                })
            } 
        }
    }
});

/** 
 * sign_of_operation
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

define([
    'N/search',
    'N/record',
    'N/format',
    'N/currency'
], function(
    search,
    record,
    format,
    currency
) {
    function add(a, b) {
        var c, d, e;
        try {
            c = a.toString().split(".")[1].length
        } catch (f) {
            c = 0;
        }
        try {
            d = b.toString().split(".")[1].length;
        } catch (f) {
            d = 0;
        }
        return e = Math.pow(10, Math.max(c, d)), (mul(a, e) + mul(b, e)) / e;
    }
        
    function sub(a, b) {
        var c, d, e;
        try {
            c = a.toString().split(".")[1].length
        } catch (f) {
            c = 0
        }
        try {
            d = b.toString().split(".")[1].length
        } catch (f) {
            d = 0
        }
        return e = Math.pow(10, Math.max(c, d)), (a * e - b * e) / e
    }
      
    function mul(a, b) {
        var c = 0,
        d = a.toString(),
        e = b.toString();
        try {
            c += d.split(".")[1].length
        } catch (f) {}
        try {
            c += e.split(".")[1].length
        } catch (f) {}
        return Number(d.replace(".", "")) * Number(e.replace(".", "")) / Math.pow(10, c)
    }
      
    function div(a, b) {
        var c, d, e = 0,
            f = 0
        try {
            e = a.toString().split(".")[1].length
        } catch (g) {}
        try {
            f = b.toString().split(".")[1].length
        } catch (g) {}
        return c = Number(a.toString().replace(".", "")), d = Number(b.toString().replace(".", "")), c / d * Math.pow(10, f - e)
    }

    function afterRateTotal(recordId,customer,subsidiary){
        var total = 0
        var customerCurrency = search.lookupFields({
            type : 'customer',
            id : customer,
            columns : ['currency']
        }).currency[0].value

        search.create({
            type : 'transaction',
            filters : [
                ['type', 'anyof', ['SalesOrd', 'CustInvc', 'CustDep', 'CustPymt', 'CustCred']],
                'AND',
                ['mainline', 'is', 'T'],
                'AND',
                ['internalId','anyof',[recordId]]
            ],
            columns : ['trandate','fxamount','currency']
        }).run().each(function(res){
            total = +res.getValue('fxamount') * currency.exchangeRate({
                source: res.getValue('currency'),
                target: customerCurrency,
                date: format.parse({
                    value : res.getValue('trandate'),
                    type : format.Type.DATE
                })
            })
            return true
        })

        return total
    }

    function changeCredit(params){
        record.submitFields({
            type : 'customer',
            id : params.customer,
            values : {
                'custentity_credit_used' : sub(add(customerUsed(params.customer),params.newTotal || 0),params.oldTotal || 0) 
            }
        })
    }

    function customerUsed(customer){
        return search.lookupFields({
            type : 'customer',
            id : customer,
            columns : [
                'currency',
                'custentity_credit_used'     
            ]
        }).custentity_credit_used    
    }

    return {
        add : add,
        mul : mul,
        div : div,
        sub : sub,
        changeCredit : changeCredit,
        customerUsed : customerUsed,
        afterRateTotal : afterRateTotal
    }
});
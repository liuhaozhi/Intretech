/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define({
    searchColumns : function (params){
        return  [
            {
                name : 'line'
            },{
                name : 'tranid'
            },{
                name : 'item'
            },{
                name : 'currency'
            },{
                name : 'quantity'
            },{
                name : 'rate'
            },{
                name : 'grossamount'
            },{
                name : 'quantityshiprecv'
            },{
                name : 'quantitybilled'
            },{
                name : 'custcol_ci_yunshudaying'
            },{
                name : 'formulanumeric',
                formula: 'ABS({rate} / {exchangerate})'
            }, {
                name : 'formulanumeric',
                formula: 'ABS({netamountnotax} / {exchangerate})'
            },{
                name : 'formulanumeric',
                formula: 'ABS({taxamount} / {exchangerate})'
            },{
                name : 'custcol_plan_number'
            },{
                name : 'trandate'
            },{
                name : 'custbody_goodsman'
            },{
                name : 'shipaddress'
            },{
                name : 'billaddress'
            }
        ]
    }
})
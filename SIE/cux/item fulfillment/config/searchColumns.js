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
                name : 'custcol_line'
            },{
                name : 'tranid'
            },{
                name : 'item'
            },{
                name : 'quantity'
            },{
                name : 'quantitypicked'
            },{
                name : 'custcol_salesorder'
            }
        ]
    }
})
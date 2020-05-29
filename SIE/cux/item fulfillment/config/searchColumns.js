/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define({
    searchColumns : function (params){
        return  [
            {
                name : 'item' 
            },{
                name : 'line'
            },{
                name : 'tranid' 
            },{
                name : 'quantity' 
            },{
                name : 'trandate'
            },{
                name : 'displayname',  
                join : 'item'
            },{
                name : 'custcol_line' 
            },{
                name : 'quantitypicked' 
            },{
                name : 'custcol_dedate'
            },{
                name : 'custcol_salesorder'
            },{
                name : 'tranid' ,
                join : 'custcol_salesorder' 
            },{
                name : 'custbody_invoice_number' 
            },{
                name : 'custbody_packing_number' 
            }
        ]
    }
})
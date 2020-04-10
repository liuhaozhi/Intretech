/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define({
    sublistFields : function (params){
        return  [
            {
                id : 'internalid' ,
                label : 'internalid' , 
                type : 'text' ,
                displayType : 'hidden'
            },
            {
                id : 'line' ,
                label : 'line' , 
                type : 'text' ,
                displayType : 'hidden'
            },
            {
                id : 'check' ,
                label : '选择' , 
                type : 'checkbox'
            },
            {
                id : 'tranid' ,
                label : '单据编号', 
                type : 'text'
            },
            {
                id : 'item' ,
                label : '物料' , 
                type : 'select',
                source : 'item' ,
                displayType : 'inline'
            },
            {
                id : 'currency' ,
                label : '币别' , 
                type : 'text' 
            },
            {
                id : 'quantity' ,
                label : '数量' , 
                type : 'text' 
            },
            {
                id : 'quantityshiprecv' ,
                label : '已实施数量' , 
                type : 'text' 
            },
            {
                id : 'quantitybilled' ,
                label : '已开票数量' , 
                type : 'text' 
            },
            {
                id : 'rate' ,
                label : '单价(不含税)' , 
                type : 'text' 
            },
            {
                id : 'netamountnotax' ,
                label : '金额' , 
                type : 'currency' 
            },
            {
                id : 'taxamount' ,
                label : '税额' , 
                type : 'currency' 
            },
            {
                id : 'grossamount' ,
                label : '总金额' , 
                type : 'currency' 
            },
            {
                id : 'abbprovequantity' ,
                label : '本次开票数量' , 
                type : 'text' ,
                displayType : 'hidden'
            },
            {
                id : 'currquantity' ,
                label : '本次开票数量' , 
                type : 'FLOAT' ,
                displayType : 'ENTRY'
            },
            {
                id : 'invnumber' ,
                label : '发票号（批量开票用）' , 
                type : 'text' ,
                displayType : 'ENTRY'
            }
        ]
    }
})
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
                id : 'salesorder' ,
                label : 'salesorder' , 
                type : 'text' ,
                displayType : 'hidden'
            },
            {
                id : 'custline' ,
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
                label : '单据编号' , 
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
                id : 'location' ,
                label : '地点' , 
                type : 'select',
                source : 'location' ,
                displayType : 'ENTRY'
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
                id : 'available' ,
                label : '可用数量' , 
                type : 'text' ,
                displayType : 'ENTRY'
            },
            {
                id : 'abbprovequantity' ,
                label : '本次出库数量' , 
                type : 'text' ,
                displayType : 'hidden'
            },
            {
                id : 'currquantity' ,
                label : '本次出库数量' , 
                type : 'text' ,
                displayType : 'ENTRY'
            }
        ]
    }
})
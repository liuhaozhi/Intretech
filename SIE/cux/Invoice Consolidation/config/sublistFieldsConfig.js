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
                id : 'planum',
                label : '计划号',
                type : 'text',
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
                label : 'Choice/选择' , 
                type : 'checkbox'
            },
            {
                id : 'tranid' ,
                label : 'Delivery notice No./发货通知单号', 
                type : 'text'
            },
            {
                id : 'item' ,
                label : 'Description/规格描述' , 
                type : 'select',
                source : 'item' ,
                displayType : 'inline'
            },
            {
                id : 'currency' ,
                label : 'Currency/币别' , 
                type : 'text' 
            },
            {
                id : 'quantity' ,
                label : 'Qty. /数量（PCS）' , 
                type : 'text' 
            },
            {
                id : 'quantityshiprecv' ,
                label : 'Delivered Qty./已出库数量' , 
                type : 'text' 
            },
            {
                id : 'quantitybilled' ,
                label : 'Invoiced Qty./已开票数量' , 
                type : 'text' 
            },
            {
                id : 'rate' ,
                label : 'Unit price (excluding tax)/单价(不含税)' , 
                type : 'text' 
            },
            {
                id : 'netamountnotax' ,
                label : 'Amount/金额' , 
                type : 'currency' 
            },
            {
                id : 'taxamount' ,
                label : 'Tax amount/税额' , 
                type : 'currency' 
            },
            {
                id : 'grossamount' ,
                label : 'Total amount/总金额' , 
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
                label : 'Quantity invoiced this time/本次开票数量' , 
                type : 'FLOAT' ,
                displayType : 'ENTRY'
            },
            {
                id : 'invnumber' ,
                label : 'Invoice No. (for batch Invoicing)/发票号(批量开票用)' , 
                type : 'text' ,
                displayType : 'ENTRY'
            }
        ]
    }
})
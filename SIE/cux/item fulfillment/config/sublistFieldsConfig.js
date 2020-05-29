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
                id : 'itemid' ,
                label : 'itemid' ,
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
                id : 'check' ,
                label : '选择' ,
                type : 'checkbox'
            },
            {
                id : 'trandate' ,
                label : '日期' ,
                type : 'text'
            },
            {
                id : 'tranid' ,
                label : '发货通知单号' ,
                type : 'text'
            },
            {
                id : 'invnum' ,
                label : '发票号' ,
                type : 'text'
            },
            {
                id : 'boxnum' ,
                label : '装箱号' ,
                type : 'text'
            },
            {
                id : 'saleordnum' ,
                label : '销售订单号' ,
                type : 'text'
            },
            {
                id : 'custline' ,
                label : '行号' ,
                type : 'text' 
            },
            {
                id : 'itemnum' ,
                label : '物料编码' ,
                type : 'text',
            },
            {
                id : 'itemname' ,
                label : '物料名称' ,
                type : 'text',
            },
            {
                id : 'available' ,
                label : '库存量',
                type : 'text' 
            },
            {
                id : 'detail',
                type : 'textarea',
                label : '批次信息'
            },
            {
                id : 'expectedshipdate' ,
                label : '交期' ,
                type : 'text'
            },
            {
                id : 'quantity' ,
                label : '数量' ,
                type : 'text' 
            },
            {
                id : 'quantityshiprecv' ,
                label : '已出库数量' ,
                type : 'text' 
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
            },
            {
                id : 'surplusquantity' ,
                label : '剩余数量' ,
                type : 'text' ,
                displayType : 'ENTRY'
            }
        ]
    }
})
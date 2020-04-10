/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define({
    sublistFields : function (params){
        return  [
            {
                id : 'planing' ,
                label : '计划单', 
                type : 'select',
                source : 'customrecord_shipping_plan' ,
                displayType : 'hidden'
            },
            {
                id : 'estimate' ,
                label : '订单', 
                type : 'select',
                source : 'transaction' ,
                displayType : 'inline'
            },
            {
                id : 'line' ,
                label : '行号', 
                type : 'text',
                displayType : 'inline'
            },
            {
                id : 'item' ,
                label : '物料' , 
                type : 'select',
                source : 'item' ,
                displayType : 'inline'
            },
            {
                id : 'itemname' ,
                label : '物料名称', 
                type : 'text',
                displayType : 'inline'
            },
            {
                id : 'beforequantity' ,
                label : '原数量' , 
                type : 'text'
            },
            {
                id : 'quantity' ,
                label : '变更后数量' , 
                type : 'text' 
            },
            {
                id : 'expectedshipdate' ,
                label : '交期' , 
                type : 'text' 
            },
            {
                id : 'starexpectedshipdate' ,
                label : '初始交期' , 
                type : 'text' 
            },
            {
                id : 'beforeexpectedshipdate' ,
                label : '变更前交期' , 
                type : 'text' 
            },
            {
                id : 'creater' ,
                label : '创建人' , 
                type : 'select',
                source : 'employee' ,
                displayType : 'inline'
            }
        ]
    }
})
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
                label : '物料编码' , 
                type : 'select',
                source : 'item' ,
                displayType : 'inline'
            },
            {
                id : 'itemname' ,
                label : '物料名称' , 
                type : 'text'
            },
            {
                id : 'specifications' ,
                label : '规格型号' , 
                type : 'text' 
            },
            {
                id : 'allquantity',
                label : '计划数量',
                type : 'text',
                displayType : params.disposetype === '2' ? 'INLINE' : 'HIDDEN'
            },
            {
                id : 'quantityshipped',
                label : '已发货数量',
                type : 'text',
                displayType : params.disposetype === '2' ? 'INLINE' : 'HIDDEN'
            },
            {
                id : 'opquantity' ,
                label : '数量1' , 
                type : 'text' ,
                displayType : 'hidden'
            },
            {
                id : 'quantity' ,
                label : '本次发货数量' , 
                type : 'text' ,
                displayType : 'ENTRY'
            },
            {
                id : 'expectedshipdate' ,
                label : '计划交期' , 
                type : 'text' 
            },
            {
                id : 'workorder' ,
                label : '是否有工单' , 
                type : 'select',
                source : 'customlist_y_n_lsit',
                displayType : params.title === '计划执行平台' ? 'INLINE' : 'HIDDEN'
            },
            {
                id : 'isexport',
                label : '是否出口',
                type : 'checkbox',
                displayType : 'inline'
            },
            {
                id : 'boxes' ,
                label : '箱数' , 
                type : 'text' 
            },
            {
                id : 'pallet' ,
                label : '栈板数' , 
                type : 'text' 
            },
        ]
    }
})
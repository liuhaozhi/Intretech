/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define({
    searchFields : function (params){
        var displaySize = {
            width : 120,
            height : 30
        }

        return  [
            {
                id : 'cacheid' ,
                label : '缓存记录id', 
                type : 'text',
                displayType : 'hidden' ,
                defaultValue : params.cacheid || ''
            },
            {
                id : 'subsidiary' ,
                label : '子公司(subsidiary)' ,
                type : 'select' ,
                source : 'subsidiary' ,
                container : 'custpage_filters' ,
                isMandatory : true,
                displaySize : displaySize,
                defaultValue : params.subsidiary || ''
            },
            {
                id : 'salesorder' ,
                label : '销售订单(delivery notice)' , 
                type : 'select' ,
                source : 'transaction' ,
                container : 'custpage_filters' ,
                breakType : 'startcol' ,
                displaySize : displaySize,
                defaultValue : params.salesorder || ''
            },
            {
                id : 'item' ,
                label : '货品(item)' , 
                type : 'select' ,
                source : 'item' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                displaySize : displaySize,
                defaultValue : params.item || ''
            },
            {
                id : 'deliverydatestar' ,
                label : '交期自' , 
                type : 'date' ,
                container : 'custpage_filters' ,
                breakType : 'startcol' ,
                displaySize : displaySize,
                defaultValue : params.deliverydatestar || ''
            },
            {
                id : 'deliverydatend' ,
                label : '至' , 
                type : 'date' ,
                container : 'custpage_filters' ,
                breakType : 'startcol' ,
                displaySize : displaySize,
                defaultValue : params.deliverydatend || ''
            },
            {
                id : 'apptype' ,
                label : '变更类型' , 
                type : 'select' ,
                source : 'customlist_approval_type' ,
                container : 'custpage_filters' ,
                breakType : 'startcol' ,
                displaySize : displaySize,
                defaultValue : params.apptype || ''
            }
        ]
    }
})
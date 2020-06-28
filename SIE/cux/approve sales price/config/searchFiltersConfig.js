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
                id : 'deliverydatestar' ,
                label : '日期自' , 
                type : 'date' ,
                container : 'custpage_filters' ,
                layoutType : 'startrow' ,
                defaultValue : params.deliverydatestar || ''
            },
            {
                id : 'deliverydatend' ,
                label : '至' , 
                type : 'date' ,
                container : 'custpage_filters' ,
                layoutType : 'endrow' ,
                defaultValue : params.deliverydatend || ''
            },
            {
                id : 'department' ,
                label : '部门(department)' ,
                type : 'select' ,
                source : 'department' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                displaySize : displaySize,
                defaultValue : params.department || ''
            },
            {
                id : 'item' ,
                label : '物料编码(item)' , 
                type : 'select' ,
                source : 'item' ,
                container : 'custpage_filters' ,
                displaySize : displaySize,
                defaultValue : params.item || ''
            },
            {
                id : 'pricenum' ,
                label : '价格表编号(pricenum)' ,
                type : 'select' ,
                source : 'customrecord_cust_price_list' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                displaySize : displaySize,
                defaultValue : params.pricenum || ''
            },
            {
                id : 'customeritem' ,
                label : '客户物料编码(item)' , 
                type : 'select' ,
                source : 'customrecord_customer_product' ,
                container : 'custpage_filters' ,
                displaySize : displaySize,
                defaultValue : params.customeritem || ''
            },
            {
                id : 'employee' ,
                label : '维护人(employee)' ,
                type : 'select' ,
                source : 'employee' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                displaySize : displaySize,
                defaultValue : params.employee || ''
            },
            {
                id : 'customer' ,
                label : '客户(customer)' ,
                type : 'select' ,
                source : 'customer' ,
                container : 'custpage_filters' ,
                displaySize : displaySize,
                defaultValue : params.customer || ''
            },

        ]
    }
})
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
                defaultValue : params.subsidiary || ''
            },
            {
                id : 'trandatestar' ,
                label : '日期自' , 
                type : 'date' ,
                container : 'custpage_filters' ,
                layoutType : 'startrow' ,
                defaultValue : params.trandatestar || ''
            },
            {
                id : 'trandatend' ,
                label : '至' , 
                type : 'date' ,
                container : 'custpage_filters' ,
                layoutType : 'endrow' ,
                defaultValue : params.trandatend || ''
            },
            {
                id : 'customeritem' ,
                label : '客户物料()' , 
                type : 'select' ,
                source : 'customrecord_customer_product_admini' ,
                container : 'custpage_filters' ,
                defaultValue : params.customeritem || ''
            },
            {
                id : 'customer' ,
                label : '客户(customer)' ,
                type : 'select' ,
                source : 'customer' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                defaultValue : params.customer || ''
            },
            {
                id : 'deliverydatestar' ,
                label : '交期自' , 
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
                id : 'interitem' ,
                label : '盈趣物料()' , 
                type : 'select' ,
                source : 'item' ,
                container : 'custpage_filters' ,
                defaultValue : params.interitem || ''
            },
            {
                id : 'employee' ,
                label : '业务员(employee)' ,
                type : 'select' ,
                source : 'employee' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                defaultValue : params.employee || ''
            },
            {
                id : 'department' ,
                label : '部门()' , 
                type : 'select' ,
                source : 'department' ,
                container : 'custpage_filters' ,
                defaultValue : params.department || ''
            },
            {
                id : 'isapprove' ,
                label : '总订单状态()' , 
                type : 'select' ,
                source : 'customlist_ordersta' ,
                container : 'custpage_filters' ,
                defaultValue : params.isapprove || ''
            },
            {
                id : 'estimate' ,
                label : '单据编号(tranid)' ,
                type : 'select' ,
                source : 'transaction' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                defaultValue : params.estimate || ''
            },
            {
                id : 'customerord' ,
                label : '客户订单号()' , 
                type : 'text' ,
                container : 'custpage_filters' ,
                defaultValue : params.customerord || ''
            },
            {
                id : 'invoicenum' ,
                label : '发票号()' , 
                type : 'text' ,
                container : 'custpage_filters' ,
                defaultValue : params.invoicenum || ''
            },
            {
                id : 'endcustomer' ,
                label : '最终客户()' , 
                type : 'select' ,
                source : 'customer' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                defaultValue : params.endcustomer || ''
            },
            {
                id : 'boxnum' ,
                label : '装箱号()' , 
                type : 'text' ,
                container : 'custpage_filters' ,
                defaultValue : params.boxnum || ''
            }
        ]
    }
})
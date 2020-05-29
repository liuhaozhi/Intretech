/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define({
    searchFields : function (params){
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
                label : 'Subsidiary/子公司' ,
                type : 'select' ,
                source : 'subsidiary' ,
                container : 'custpage_filters' ,
                isMandatory : true ,
                defaultValue : params.subsidiary || ''
            },
            {
                id : 'trandate' ,
                label : 'Date from/日期自' , 
                type : 'date' ,
                container : 'custpage_filters' ,
                layoutType : 'startrow' ,
                defaultValue : params.trandate || ''
            },
            {
                id : 'dateclose' ,
                label : 'To/至' , 
                type : 'date' ,
                container : 'custpage_filters' ,
                layoutType : 'endrow' ,
                defaultValue : params.dateclose || ''
            },     
            {
                id : 'receipt' ,
                label : 'Delivery notice No./发货通知单号' , 
                type : 'select' ,
                source : 'transaction' ,
                container : 'custpage_filters' ,
                defaultValue : params.receipt || ''
            },   
            {
                id : 'customer' ,
                label : 'Customer/客户' ,
                type : 'select' ,
                container : 'custpage_filters' ,
                breakType : 'startcol' ,
                isMandatory : true ,
                defaultValue : params.customer || '' ,
                selectOptions : params.customerSelectOptions
            },
            {
                id : 'salesorder' ,
                label : 'Sales order No./销售订单号' , 
                type : 'select' ,
                source : 'transaction' ,
                container : 'custpage_filters' ,
                defaultValue : params.salesorder || ''
            },       
            {
                id : 'invoice' ,
                label : 'Invoice No./发票号' , 
                type : 'text' ,
                container : 'custpage_filters' ,
                defaultValue : params.invoice || ''
            },
            {
                id : 'currency' ,
                label : 'Currency/货币' , 
                type : 'select' ,
                source : 'currency' ,
                container : 'custpage_filters' ,
                breakType : 'startcol' ,
                isMandatory : true,
                defaultValue : params.currency || ''
            },
            {
                id : 'emoloyee' ,
                label : 'Sales/业务员' , 
                type : 'select' ,
                source : 'employee' ,
                container : 'custpage_filters' ,
                defaultValue : params.emoloyee || ''
            },      
            {
                id : 'boxnumber' ,
                label : 'Packing No./装箱号' , 
                type : 'text' ,
                container : 'custpage_filters' ,
                defaultValue : params.boxnumber || ''
            },
            {
                id : 'printype' ,
                label : 'Print type/打印类型' , 
                type : 'select' ,
                source : 'customlist_printype' ,
                container : 'custpage_filters' ,
                breakType : 'startcol' ,
                isMandatory : true ,
                defaultValue : params.printype || ''
            },
            {
                id : 'samegoods' ,
                label : 'Merge the same product line/合并相同货品行' ,
                type : 'select' ,
                source : 'customlist_samegoods',
                container : 'custpage_filters' ,
                defaultValue : params.samegoods
            }
        ]
    }
})
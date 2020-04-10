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
                label : '子公司(subsidiary)' ,
                type : 'select' ,
                source : 'subsidiary' ,
                container : 'custpage_filters' ,
                isMandatory : true ,
                defaultValue : params.subsidiary || ''
            },
            {
                id : 'trandate' ,
                label : '日期自' , 
                type : 'date' ,
                container : 'custpage_filters' ,
                layoutType : 'startrow' ,
                defaultValue : params.trandate || ''
            },
            {
                id : 'dateclose' ,
                label : '至' , 
                type : 'date' ,
                container : 'custpage_filters' ,
                layoutType : 'endrow' ,
                defaultValue : params.dateclose || ''
            },     
            {
                id : 'receipt' ,
                label : '单据编号' , 
                type : 'select' ,
                source : 'transaction' ,
                container : 'custpage_filters' ,
                defaultValue : params.receipt || ''
            },   
            {
                id : 'customer' ,
                label : '客户(customer)' ,
                type : 'select' ,
                container : 'custpage_filters' ,
                breakType : 'startcol' ,
                isMandatory : true ,
                defaultValue : params.customer || '' ,
                selectOptions : params.customerSelectOptions
            },
            {
                id : 'salesorder' ,
                label : '销售订单(delivery notice)' , 
                type : 'select' ,
                source : 'transaction' ,
                container : 'custpage_filters' ,
                defaultValue : params.salesorder || ''
            },       
            {
                id : 'invoice' ,
                label : '发票号' , 
                type : 'text' ,
                container : 'custpage_filters' ,
                defaultValue : params.invoice || ''
            },
            {
                id : 'currency' ,
                label : '货币(currency)' , 
                type : 'select' ,
                source : 'currency' ,
                container : 'custpage_filters' ,
                breakType : 'startcol' ,
                isMandatory : true,
                defaultValue : params.currency || ''
            },
            {
                id : 'emoloyee' ,
                label : '业务员(employee)' , 
                type : 'select' ,
                source : 'employee' ,
                container : 'custpage_filters' ,
                defaultValue : params.emoloyee || ''
            },      
            {
                id : 'boxnumber' ,
                label : '装箱号' , 
                type : 'text' ,
                container : 'custpage_filters' ,
                defaultValue : params.boxnumber || ''
            },
            {
                id : 'printype' ,
                label : '打印类型' , 
                type : 'select' ,
                source : 'customlist_printype' ,
                container : 'custpage_filters' ,
                breakType : 'startcol' ,
                isMandatory : true ,
                defaultValue : params.printype || ''
            },
            {
                id : 'samegoods' ,
                label : '合并相同货品行' ,
                type : 'checkbox' ,
                container : 'custpage_filters' ,
                defaultValue : params.samegoods
            }
        ]
    }
})
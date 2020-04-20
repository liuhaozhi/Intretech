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
                id : 'customer' ,
                label : '客户(customer)' ,
                type : 'select' ,
                container : 'custpage_filters' ,
                breakType : 'startcol' ,
                defaultValue : params.customer || '' ,
                selectOptions : params.customerSelectOptions
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
                id : 'salesorder' ,
                label : '销售订单(delivery notice)' , 
                type : 'select' ,
                source : 'transaction' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                defaultValue : params.salesorder || ''
            }
        ]
    }
})
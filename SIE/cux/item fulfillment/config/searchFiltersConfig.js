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
                displaySize : {width : 5 , height : 10},
                container : 'custpage_filters' ,
                layoutType : 'startrow' ,
                defaultValue : params.trandate || ''
            },
            {
                id : 'dateclose' ,
                label : '至' , 
                type : 'date' ,
                displaySize : {width : 5 , height : 10},
                container : 'custpage_filters' ,
                layoutType : 'endrow' ,
                defaultValue : params.dateclose || ''
            },   
            {
                id : 'location' ,
                label : '仓位(location)' , 
                type : 'select' ,
                container : 'custpage_filters' ,
                isMandatory : true ,
                defaultValue : params.location || '',
                selectOptions : params.locationSelectOptions
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
                id : 'advice' ,
                label : '发货通知单(delivery notice)' , 
                type : 'select' ,
                source : 'transaction' ,
                container : 'custpage_filters' ,
                defaultValue : params.advice || ''
            },
            {
                id : 'customerord' ,
                label : '客户订单号(customer order)' , 
                type : 'text' ,
                container : 'custpage_filters' ,
                defaultValue : params.customerord || ''
            },
            {
                id : 'department' ,
                label : '部门(department)' , 
                type : 'select' ,
                source : 'department' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                defaultValue : params.department || ''
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
                id : 'invoicenum' ,
                label : '发票号(invoicenum)' , 
                type : 'text' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                defaultValue : params.invoicenum || ''
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
                id : 'boxnum' ,
                label : '装箱号(boxnum)' , 
                type : 'text' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                defaultValue : params.boxnum || ''
            },
            {
                id : 'isexport' ,
                label : '是否出口(export)' , 
                type : 'select' ,
                source : 'customlist_whether_list',
                container : 'custpage_filters' ,
                defaultValue : params.isexport || ''
            }
        ]
    }
})
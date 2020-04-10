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
                id : 'disposetype' ,
                label : '处理类型(disposetype)' ,
                type : 'select' ,
                source : 'customlist_dispose_type' ,
                container : 'custpage_filters' ,
                isMandatory : true,
                displayType : 'hidden',
                defaultValue : params.disposetype || '1'
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
                id : 'customer' ,
                label : '客户(customer)' ,
                type : 'select' ,
                container : 'custpage_filters' ,
                breakType : 'startcol' ,
                isMandatory :  params.disposetype === '2' ? true : false,
                defaultValue : params.customer || '',
                selectOptions : params.customerSelectOptions
            },
            {
                id : 'endcustomer' ,
                label : '最终客户(endcustomer)' , 
                type : 'select' ,
                source : 'customer' ,
                container : 'custpage_filters' ,
                defaultValue : params.endcustomer || ''
            },
            {
                id : 'isintercompany' ,
                label : '公司间交易(inter-firm transction)' ,
                type : 'checkbox' ,
                container : 'custpage_filters' ,
                defaultValue : params.isintercompany
            },
            {
                id : 'currency' ,
                label : '货币(currency)' , 
                type : 'select' ,
                source : 'currency' ,
                container : 'custpage_filters' ,
                breakType : 'startcol' ,
                isMandatory : params.disposetype === '2' ? true : false,
                defaultValue : params.currency || ''
            },
            {
                id : 'item' ,
                label : '货品(item)' , 
                type : 'select' ,
                source : 'item' ,
                container : 'custpage_filters' ,
                defaultValue : params.item || ''
            },
            {
                id : 'ordertype' ,
                label : '订单类型(ordertype)' , 
                type : 'select' ,
                container : 'custpage_filters' ,
                isMandatory : params.disposetype === '2' ? true : false,
                defaultValue : params.ordertype || '',
                selectOptions : params.orderTypeSelectOptions,
            },
            {
                id : 'salesorder' ,
                label : '销售订单(delivery notice)' , 
                type : 'select' ,
                source : 'transaction' ,
                container : 'custpage_filters' ,
                breakType : 'startcol' ,
                defaultValue : params.salesorder || ''
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
                id : 'title' ,
                label : 'title' , 
                type : 'text' ,
                container : 'custpage_filters' ,
                displayType : 'hidden',
                defaultValue : params.title
            },
        ]
    }
})
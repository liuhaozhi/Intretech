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
                id : 'isexport',
                label : '是否出口',
                type : 'select',
                source : 'customlist_whether_list',
                container : 'custpage_filters' ,
                defaultValue : params.isexport || ''
            },
            {
                id : 'fullmentord' ,
                label : '单据编号(tranid)' ,
                type : 'select' ,
                source : 'transaction' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                defaultValue : params.fullmentord || ''
            },
            {
                id : 'customerord' ,
                label : '客户订单号()' , 
                type : 'text' ,
                container : 'custpage_filters' ,
                defaultValue : params.customerord || ''
            },
            {
                id : 'k3order' ,
                label : 'k3销售订单号()' , 
                type : 'text' ,
                container : 'custpage_filters' ,
                defaultValue : params.k3order || ''
            },
            {
                id : 'location' ,
                label : '仓位(tranid)' ,
                type : 'select' ,
                source : 'location' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                defaultValue : params.location || ''
            },
            {
                id : 'invoicenum' ,
                label : '发票号()' , 
                type : 'text' ,
                container : 'custpage_filters' ,
                defaultValue : params.invoicenum || ''
            },
            {
                id : 'employee' ,
                label : '制单人(employee)' ,
                type : 'select' ,
                source : 'employee' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                defaultValue : params.employee || ''
            },
            {
                id : 'encasementnum' ,
                label : '装箱号()' , 
                type : 'text' ,
                container : 'custpage_filters' ,
                defaultValue : params.encasementnum || ''
            },
            {
                id : 'item' ,
                label : '物料编码()' , 
                type : 'MULTISELECT' ,
                source : 'item' ,
                breakType : 'startcol' ,
                container : 'custpage_filters' ,
                defaultValue : params.item ? JSON.parse(params.item) : ''
            },
        ]
    }
})
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([],
    () => {
        return {
            searchFiltersFields :  params => [
                {
                    id : 'cacheid' ,
                    label : '缓存记录id', 
                    type : 'text',
                    displayType : 'hidden' ,
                    defaultValue : params.cacheid || ''
                },
                {
                    id : 'cachefields' ,
                    label : '自列表字段', 
                    type : 'text',
                    displayType : 'hidden' ,
                    defaultValue : JSON.stringify(params.cachefields)
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
                    id : 'currency' ,
                    label : '货币()' , 
                    type : 'select' ,
                    source : 'currency',
                    breakType : 'startcol' ,
                    container : 'custpage_filters' ,
                    defaultValue : params.currency || ''
                },
                {
                    id : 'payee' ,
                    label : '收款人()' , 
                    type : 'select' ,
                    source : 'vendor' ,
                    container : 'custpage_filters' ,
                    defaultValue : params.payee || ''
                },
                {
                    id : 'employee' ,
                    label : '专营采购员(employee)' ,
                    type : 'select' ,
                    source : 'employee' ,
                    breakType : 'startcol' ,
                    container : 'custpage_filters' ,
                    defaultValue : params.employee || ''
                },
                {
                    id : 'transaction' ,
                    label : '事务处理编号(tranid)' ,
                    type : 'select' ,
                    source : 'transaction' ,
                    breakType : 'startcol' ,
                    container : 'custpage_filters' ,
                    defaultValue : params.transaction || ''
                }
            ]
        }
        
    }    
)
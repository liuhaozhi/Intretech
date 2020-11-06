/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 */
define([
    'N/cache',
    'N/search',
    'N/record',
    'N/ui/serverWidget',
    '../config/searchFilters',
    '../config/searchColumns',
    '../../helper/wrapper_runtime',
    '../config/searchFiltersConfig',
    '../config/sublistFieldsConfig'
], function(
    cache , search , record , ui , searchFilters , searchColumns , runtime , searchFiltersConfig , sublistFieldsConfig
) {
    var FIELDPR = 'custpage_'
    var searchColumn = undefined
    var defaultPageSize = 200

    function onRequest(context) {
        var request = context.request
        var response= context.response
        var params  = request.parameters
            
        if(request.method === 'GET')
        {
            searchPage(params,response)
        }
        if(request.method === 'POST')
        {
            approveElement(params,request,response)
        }
    }

    function approveElement(){

    }

    function searchPage(params,response){
        var currentUser = runtime.getCurrentUser()
        var form = ui.createForm({
            title :  '销售价格批量审批平台'
        })

        form.addFieldGroup({
            id : 'custpage_filters',
            label : '查询条件'
        })

        form.addFieldGroup({
            id : 'custpage_lists',
            label : '审批列表'
        })

        form.clientScriptModulePath = '../cs/approve_sales_price_cs'

        if(!params.subsidiary)
        params.subsidiary = currentUser.subsidiary

        if(!params.action)
        {
            addButtons(form,params)
            addSublist(form,params)
            addFields(form,searchFiltersConfig.searchFields(params))
        }

        if(params.action === 'search')
        {
            addButtons(form,params)
            addSublist(form,params,bindSublists)
            addFields(form,searchFiltersConfig.searchFields(params))
        }

        response.writePage(form)
    }

    function addButtons(form){
        form.addButton({
            id : 'custpage_search',
            label : 'Search',
            functionName : 'searchLines'
        })

        form.addButton({
            id : 'custpage_ratify',
            label : '批准',
            functionName : 'ratifyPlan'
        })

        form.addButton({
            id : 'custpage_refuse',
            label : '拒绝',
            functionName : 'refusePlan'
        })
    }

    function addFields(target,data){
        data.map(function(item){
            var field = target.addField({
                id : FIELDPR + item.id,
                label : item.label,
                type : item.type,
                source : item.source,
                container : item.container
            })

            if(item.selectOptions)
            {
                for(var i = 0 ; i < item.selectOptions.length; i ++)
                {
                    field.addSelectOption({
                        text : item.selectOptions[i].text,
                        value : item.selectOptions[i].value
                    })
                }
            }
            
            if(item.displayType)     
            field.updateDisplayType({
                displayType : item.displayType
            })
            
            if(item.layoutType)
            field.updateLayoutType({
                layoutType : item.layoutType
            })
            
            if(item.breakType)
            field.updateBreakType({
                breakType : item.breakType
            })
            
            if(item.displaySize)
            field.updateDisplaySize(item.displaySize)
            
            if(item.isMandatory === true)
            field.isMandatory = item.isMandatory 

            if(item.defaultValue)
            field.defaultValue = item.defaultValue 
        })
    }

    function addPageFields(params){
        var currPageField = params.form.addField({
            id : FIELDPR + 'currpage',
            label : '当前页',
            type : 'select',
            container : params.target
        })

        var pageSizeField = params.form.addField({
            id : FIELDPR + 'pagesize',
            label : '每页数据条数',
            type : 'select',
            container : params.target
        })

        for(var i = 1 ; i <= params.pageCount; i ++){
            currPageField.addSelectOption({
                text : i + '/' + params.pageCount,
                value : i,
                isSelected : i === +params.currPage
            })
        }

        for(var j = 1000 ; j >= 200 ; j -= 200){
            pageSizeField.addSelectOption({
                text : j,
                value : j,
                isSelected : j === +params.pageSize
            })
        }
    }

    function getCheckInfo(cacheId){
        var checkCache = undefined

        if(cacheId)
        {
            checkCache = search.lookupFields({
                type : 'customrecord_cache_record',
                id : cacheId,
                columns : ['custrecord_salesorder_cache']
            }).custrecord_salesorder_cache
        }

        return checkCache ? JSON.parse(checkCache) : new Object()
    }

    function bindSublists(params,form,sublist){
        var filters = getSearchFilters(params, runtime.getCurrentUserId() + 'ApprovePriceCache', 'searchFilters')
        searchColumn =  searchColumns.searchColumns()
        
        var pageDate = search.create({
            type : 'customrecord_cust_price_item_list',
            filters : filters,
            columns : searchColumn
        }).runPaged({pageSize : params.pageSize || defaultPageSize})

        if(pageDate.pageRanges.length > 0)
        {
            addPageFields({
                form : form,
                target : 'custpage_lists',
                pageCount : pageDate.pageRanges.length,
                currPage : params.currPage || 1,
                pageSize : pageDate.pageSize
            })
    
            pageDate.fetch({
                index : params.currPage ? --params.currPage : 0
            }).data.forEach(function(res,index){
                addSublistLine(sublist,index,res,params.cacheId)
            })
        }
    }

    function saveCache(cacheName,key,cacheData){
        var myCache = cache.getCache({
            name : cacheName
        })

        myCache.put({
            key   : key,
            value : cacheData,
            ttl   : 9999999
        })
    }

    function getSearchFilters(params,cacheName,key){
        if(params.pagetype === 'create')
        {
            var filters = searchFilters.searchFilters(params)
            removeCheckCache(params.cacheId)
            saveCache(cacheName,key,JSON.stringify(filters))
            return filters
        }

        if(params.pagetype === 'turnpage')
        {
            var myCache = cache.getCache({
                name : cacheName
            })

            return JSON.parse(myCache.get({
                key : key,
                loader : loader(params)
            }))
        }
    }

    function removeCheckCache(cacheId){
        if(cacheId)
        {
            record.submitFields({
                type : 'customrecord_cache_record',
                id : cacheId,
                values : {
                    custrecord_salesorder_cache : ''
                }
            })
        }
    }

    function loader(params){
        return searchFilters.searchFilters(params)
    }

    function addSublistLine(sublist,index,res,cacheId){
        var checkInfo = getCheckInfo(cacheId)

        if(checkInfo[res.id] && checkInfo[res.id].checked === 'T')
        sublist.setSublistValue({
            id : FIELDPR + 'check',
            line : index,
            value : checkInfo[res.id].checked
        })

        sublist.setSublistValue({
            id : FIELDPR + 'priceitem',
            line : index,
            value : res.id
        })

        searchColumn.map(function(item){
            var getType = 'getText'
            var valueFields = getValueFields()
            if(valueFields.indexOf(item.name) > -1)
            getType = 'getValue'

            if(res[getType](item))
            {
                var value = res[getType](item)
                if(item.name === 'custrecord_cust_price_list_link')
                value = '<a target="_blank" style="color:blue!important" href="'
                +'/app/common/custom/custrecordentry.nl?rectype=516&id='+value+'">'+res.getText(item)+'</a>'

                sublist.setSublistValue({
                    id : FIELDPR + item.name.slice(-10),
                    line : index,
                    value : value
                })
            }
        })
    }

    function getValueFields(){
        return [
            'custrecord_cust_item_list_name',
            'custrecord_cust_item_item_type',
            'custrecord_cust_item_customer_name',
            'custrecord_nonof_ladder_price',
            'custrecord_item_sales_volume_start_1',
            'custrecord_item_sales_volume_end_1',
            'custrecord_item_sale_price_1',
            'custrecord_item_sales_volume_start_2',
            'custrecord_item_sales_volume_end_2',
            'custrecord_item_sale_price_2',
            'custrecord_item_sales_volume_start_3',
            'custrecord_item_sales_volume_end_3',
            'custrecord_item_sale_price_3',
            'custrecord_item_sales_volume_start_4',
            'custrecord_item_sales_volume_end_4',
            'custrecord_item_sale_price_4',
            'custrecord_item_sales_volume_start_5',
            'custrecord_item_sales_volume_end_5',
            'custrecord_item_sale_price_5',
            'custrecord_refusereason',
            'custrecord_without_ladder',
            'custrecord_createdate',
            'custrecord_cust_price_list_link',
            'custrecord_item_effective_date',
            'custrecord_cust_customer_discount'
        ]
    }

    function addSublist(form,params,callBackFun){
        var sublist = form.addSublist({
            id : FIELDPR + 'lines',
            label : '查询结果',
            tab : 'custpage_lists',
            type : 'list'
        })

        addFields(sublist,[{
            id : 'check' ,
            label : '选择' , 
            type : 'checkbox'
        }]) 

        sublist.addMarkAllButtons()
        
        addFields(sublist,sublistFieldsConfig.sublistFields([
            {
                name : 'priceitem',
                label : 'priceitem',
                type : 'select',
                source : 'customrecord_cust_price_item_list',
                displayType : 'hidden'
            }
        ]))
   
        if(callBackFun) callBackFun(params,form,sublist)
    }

    return {
        onRequest: onRequest
    }
});

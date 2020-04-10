/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 */
define([
    'N/cache',
    'N/search',
    'N/record',
    'N/format',
    'N/runtime',
    'N/redirect',
    'N/ui/serverWidget',
    '../config/searchFilters',
    '../config/searchColumns',
    '../config/searchFiltersConfig',
    '../config/sublistFieldsConfig'
], function(
    cache , search , record , format , runtime , redirect , ui , searchFilters , searchColumns , searchFiltersConfig , sublistFieldsConfig
) {
    var FIELDPR = 'custpage_'
    var defaultPageSize = 200

    function onRequest(context) {
        var request = context.request
        var response= context.response
        var params  = request.parameters
            
        if(request.method === 'GET')
        {
            searchPage(params,response)
        }
    }

    function searchPage(params,response){
        var form = ui.createForm({
            title :  '拆分计划审批'
        })

        form.addFieldGroup({
            id : 'custpage_filters',
            label : '查询条件'
        })

        form.addFieldGroup({
            id : 'custpage_lists',
            label : '审批列表'
        })

        form.clientScriptModulePath = '../cs/approve_planing_cs'

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
            label : 'search',
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
        var filters = getSearchFilters(params,'myCache','searchFilters')
        var pageDate = search.create({
            type : 'customrecord_shipping_plan',
            filters : filters,
            columns : searchColumns.searchColumns()
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
        var cache = JSON.parse(res.getValue('custrecord_cache_change')) 

        sublist.setSublistValue({
            id : FIELDPR + 'planing',
            line : index,
            value : res.id
        })

        if(checkInfo[res.id] === 'T')
        sublist.setSublistValue({
            id : FIELDPR + 'check',
            line : index,
            value : checkInfo[res.id]
        })

        if(res.getValue('custrecord_p_custcol_line'))
        sublist.setSublistValue({
            id : FIELDPR + 'line',
            line : index,
            value : res.getValue('custrecord_p_custcol_line')
        })

        if(res.getValue('custrecord_p_custcol_salesorder'))
        sublist.setSublistValue({
            id : FIELDPR + 'estimate',
            line : index,
            value : res.getValue('custrecord_p_custcol_salesorder')
        })

        if(res.getValue('custrecord_p_item'))
        sublist.setSublistValue({
            id : FIELDPR + 'item',
            line : index,
            value : res.getValue('custrecord_p_item')
        })

        if(res.getValue({
            name : 'displayname',
            join : 'custrecord_p_item'
        }))
        sublist.setSublistValue({
            id : FIELDPR + 'itemname',
            line : index,
            value : res.getValue({
                name : 'displayname',
                join : 'custrecord_p_item'
            })
        })

        if(res.getValue('custrecord_p_quantity'))
        sublist.setSublistValue({
            id : FIELDPR + 'quantity',
            line : index,
            value : res.getValue('custrecord_p_quantity')
        })

        if(res.getValue('custrecord_p_expectedshipdate'))
        sublist.setSublistValue({
            id : FIELDPR + 'expectedshipdate',
            line : index,
            value : res.getValue('custrecord_p_expectedshipdate')
        })

        if(res.getValue('custrecord_p_custcol_suggest_date'))
        sublist.setSublistValue({
            id : FIELDPR + 'starexpectedshipdate',
            line : index,
            value : res.getValue('custrecord_p_custcol_suggest_date')
        })

        if(res.getValue('custrecord_p_custbody_wip_documentmaker'))
        sublist.setSublistValue({
            id : FIELDPR + 'creater',
            line : index,
            value : res.getValue('custrecord_p_custbody_wip_documentmaker')
        })
        
        if(cache.oldQuantity)
        sublist.setSublistValue({
            id : FIELDPR + 'beforequantity',
            line : index,
            value : cache.oldQuantity
        })

        if(cache.beforExpectedshipdate)
        sublist.setSublistValue({
            id : FIELDPR + 'beforeexpectedshipdate',
            line : index,
            value : cache.beforExpectedshipdate
        })
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
        
        addFields(sublist,sublistFieldsConfig.sublistFields())
   
        if(callBackFun) callBackFun(params,form,sublist)
    }

    return {
        onRequest: onRequest
    }
});

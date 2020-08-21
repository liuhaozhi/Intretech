/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 */
define([
    'N/search',
    'N/util',
    'N/runtime',
    'N/ui/serverWidget',
    '../config/searchFiltersConfig',
    '../config/sublistFieldsConfig'
], function(
    search , util , runtime , ui , searchFiltersConfig , sublistFieldsConfig
) {
    var FIELDPR = 'custpage_'

    function onRequest(context) {
        var request = context.request
        var response= context.response
        var params  = request.parameters

        util.extend(params,{
            title : '发货执行平台',
            disposetype :  '2'
        })
        
        if(request.method === 'GET') searchPage(params,response)
    }

    function searchPage(params,response){
        var form = ui.createForm({
            title : params.title
        })
        var currentUser = runtime.getCurrentUser()

        form.addFieldGroup({
            id : 'custpage_filters',
            label : '查询条件'
        })

        form.addFieldGroup({
            id : 'custpage_lists',
            label : '计划列表'
        })

        form.clientScriptModulePath = '../cs/planning_form_cs'

        if(!params.subsidiary)
        params.subsidiary = currentUser.subsidiary

        if(params.subsidiary)
        {
            params.customerSelectOptions = getCustomerSelectOption(params.subsidiary)
        }

        params.orderTypeSelectOptions = getOrderTypeSelectOptions()

        addButtons(form,params)       
        addFields(form,searchFiltersConfig.searchFields(params))
        addSublist(form,params)
        response.writePage(form)
    }

    function getOrderTypeSelectOptions(){
        var orderTypeSelectOptions = [{
            text : ' ',
            value : -1
        }]

        search.create({
            type : 'customlist_cust_ordertype',
            filters : [
                ['internalid' , 'noneof' , ['1' , '7']]
            ],
            columns : ['name' , 'internalid']
        })
        .run()
        .each(function(res){
            orderTypeSelectOptions.push({
                value : res.getValue('internalid'),
                text : res.getValue('name')
            })

            return true
        })

        return orderTypeSelectOptions
    }

    function addButtons(form,params){
        form.addButton({
            id : 'custpage_search',
            label : 'search',
            functionName : 'searchLines'
        })

        if(params.disposetype === '2')
        {
            form.addSubmitButton({
                label : '确认发货'
            })

            addCountInfo(form)
        }
    }

    function getCustomerSelectOption(subsidiary){
        var customerSelectOption = new Array()
        search.create({
            type : 'customer',
            filters : [
                ['msesubsidiary.internalid' , 'anyof' , [subsidiary]]
            ],
            columns : [
                'internalid',
                'entityid',
                'companyname'
            ]
        }).run().each(function(res){
            customerSelectOption.push({
                value : res.getValue('internalid'),
                text : res.getValue('entityid') + '&nbsp;&nbsp;' + res.getValue('companyname')
            })
            return true
        })

        return customerSelectOption
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

    function addSublist(form,params,callBackFun){
        var sublist = form.addSublist({
            id : FIELDPR + 'lines',
            label : '查询结果',
            tab : 'custpage_lists',
            type : 'list'
        })

        if(params.disposetype === '2' ) 
        {
            addFields(sublist,[{
                id : 'check' ,
                label : '选择' , 
                type : 'checkbox'
            }]) 
    
            sublist.addMarkAllButtons()
        }

        addFields(sublist,sublistFieldsConfig.sublistFields(params))
    }

    function sublistCountConfig(){
        return [
            {
                id : 'boxcount',
                label : '总箱数',
                type : 'text',
                container : 'custpage_lists',
                displayType : 'disabled'
            },
            {
                id : 'boardcount',
                label : '总展板数',
                type : 'text',
                container : 'custpage_lists',
                displayType : 'disabled'
            }
        ]
    }

    function addCountInfo(target){
        addFields(target,sublistCountConfig())
    }

    return {
        onRequest: onRequest
    }
});

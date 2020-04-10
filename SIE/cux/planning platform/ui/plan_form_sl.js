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
    var fieldRegExPrefix = 'custrecord_p_' 

    function onRequest(context) {
        var request = context.request
        var response= context.response
        var params  = request.parameters

        if(!params.title)
        {
            params.title = '计划执行平台'
        }      
        if(request.method === 'GET')
        {
            searchPage(params,response)
        }
        if(request.method === 'POST')
        {
            salesOrdCreate(params,request,response)
        }
    }

    function searchPage(params,response){
        var form = ui.createForm({
            title :  params.title
        })

        form.addFieldGroup({
            id : 'custpage_filters',
            label : '查询条件'
        })

        form.addFieldGroup({
            id : 'custpage_lists',
            label : '计划信息'
        })

        form.clientScriptModulePath = '../cs/planning_form_cs'

        if(params.subsidiary)
        {
            params.customerSelectOptions = getCustomerSelectOption(params.subsidiary)
        }

        params.orderTypeSelectOptions = getOrderTypeSelectOptions()

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

    function addButtons(form,params){

        if(params.disposetype === '2')
        {
            form.addSubmitButton({
                label : '确认发货'
            })

            addCountInfo(form)
        }

        form.addButton({
            id : 'custpage_search',
            label : 'search',
            functionName : 'searchLines'
        })
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

    function getCustomerSelectOption(subsidiary){
        var customerSelectOption = [{
            text : ' ',
            value : -1
        }]

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

    function addPageFields(params){ //target , form , pageCount , currPage , pageSize
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


    function salesOrdCreate(params,request,response){
        createSalesorder(params,getPlanListIds(extendChechInfo(getCheckInfo(params.custpage_cacheid),request)))
    }

    function createSalesorder(params,planListIds){
      
        var salesOrder = record.create({
            type : 'salesorder',
            isDynamic : false
        })
        var columns = getAllSalesLineFields()
        setHeadFieldsValue(salesOrder,params)
        setLineItemValue(salesOrder,planListIds,columns)

        try{
            var salesOrderId  = salesOrder.save({ignoreMandatoryFields : false})

            if(salesOrderId)
            {
                planListIds.map(function(item){
                    record.submitFields({
                        type : 'customrecord_shipping_plan',
                        id : item,
                        values : {
                            custrecord_salesorder_shipped : 'T'
                        }
                    })
                })
            }

            redirect.toSuitelet({
                scriptId : 'customscript_sales_planing',
                deploymentId : 'customdeploy_sales_planing',
                parameters : {
                    action : 'search',
                    status : 'sucess',
                    pagetype : 'create',
                    item : params.custpage_item,
                    title : params.custpage_title,
                    pageSize : params.custpage_pagesize,  
                    currency : params.custpage_currency,
                    trandate : params.custpage_trandate,
                    emoloyee : params.custpage_emoloyee,
                    customer : params.custpage_customer,
                    dateclose : params.custpage_dateclose,
                    subsidiary : params.custpage_subsidiary,
                    salesorder : params.custpage_salesorder,
                    endcustomer : params.custpage_endcustomer,
                    disposetype : params.custpage_disposetype,
                    salesOrderId : salesOrderId,
                    deliverydatend : params.custpage_deliverydatend,
                    deliverydatestar : params.custpage_deliverydatestar,
                    isintercompany : params.custpage_isintercompany
                }
            })
        }catch(e){
            throw(e)
        }

    }

    function setLineItemValue(salesOrder,planListIds,columns){
        var index = 0
        var allDateField = dateFields()
        var allPercentFields = percentFields()
        search.create({
            type : 'customrecord_shipping_plan',
            filters : [
                ['internalid' , 'anyof' , planListIds]
            ],
            columns : columns
        }).run().each(function(res){
            for(var i = 0 ; i < columns.length ; i ++)
            {
                var value = res.getValue(columns[i])
                if(allDateField.indexOf(columns[i].name) > -1)
                {
                    if(!!value)
                    {
                        value = format.parse({
                            type : format.Type.DATE,
                            value : value
                        })
                    }
                }

                if(allPercentFields.indexOf(columns[i].name) > -1)
                {
                    if(!!value)
                    {
                        value = parseFloat(value)
                    }
                }

                var fieldId = columns[i].name.replace(fieldRegExPrefix,'')
                
                if(fieldId !== 'amount' && fieldId !== 'custcol_cn_cfi')
                salesOrder.setSublistValue({
                    sublistId : 'item',
                    fieldId : fieldId,
                    value : value,
                    line : index
                })

                if(fieldId === 'custcol_cn_cfi')
                salesOrder.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_cseg_cn_cfi',
                    value : value,
                    line : index
                })
            }

            index ++

            return true
        })
    }

    function dateFields(){
        return [
            'custrecord_p_expectedshipdate',
            'custrecord_p_custcol_suggest_date',
            'custrecord_p_custcol_completion_date',
            'custrecord_p_custbody_ordering_time',
            'custrecord_p_custcol_before_date',
            'custrecord_p_custcol_change_date'
        ]
    }

    function percentFields(){
        return [
            'custrecord_p_taxrate',
            'custrecord_p_custcol_cdiscount',
            'custrecord_p_custcol_fdiscount',
            'custrecord_p_custcol_indiscount',
            'custrecord_p_custcol_out_tax',
            'custrecord_p_custcol_sup_rate'
        ]
    }

    function getCustomerAdress(customer){
        var customerAdress = new Object()
        var customerRec   = record.load({
            type : 'customer',
            id : customer
        })

        var defaultAdresShipsLine = getDefaultAdresShipsLine(customerRec)
        var defaultAdresBillsLine = getDefaultAdresBillsLine(customerRec)
  
        if(defaultAdresShipsLine || defaultAdresShipsLine === 0)
        {
            var adressRec = customerRec.getSublistSubrecord({
                sublistId : 'addressbook',
                fieldId : 'addressbookaddress',
                line : defaultAdresShipsLine
            })

            if(adressRec)
            {
                customerAdress.ship = {
                    emp : adressRec.getValue({
                        fieldId : 'attention'
                    }),
                    empFax : adressRec.getValue({
                        fieldId : 'custrecord186'
                    }), 
                    empIphone : adressRec.getValue({
                        fieldId : 'addrphone'
                    }),
                    empEmail : adressRec.getValue({
                        fieldId : 'custrecord_addressee_email'
                    }),
                    adress : adressRec.getValue({
                        fieldId : 'addrtext'
                    }),
                    country : adressRec.getValue({
                        fieldId : 'country'
                    })
                }
            }
        }

        if(defaultAdresBillsLine || defaultAdresBillsLine === 0)
        {
            var adressRec = customerRec.getSublistSubrecord({
                sublistId : 'addressbook',
                fieldId : 'addressbookaddress',
                line : defaultAdresBillsLine
            })

            if(adressRec)
            {
                customerAdress.bill = {
                    emp : adressRec.getValue({
                        fieldId : 'attention'
                    }),
                    empFax : adressRec.getValue({
                        fieldId : 'custrecord186'
                    }), 
                    empIphone : adressRec.getValue({
                        fieldId : 'addrphone'
                    }),
                    empEmail : adressRec.getValue({
                        fieldId : 'custrecord_addressee_email'
                    }),
                    adress : adressRec.getValue({
                        fieldId : 'addrtext'
                    }),
                    country : adressRec.getValue({
                        fieldId : 'country'
                    })
                }
            }
        }

        return customerAdress
    }

    function getDefaultAdresBillsLine(customerRec){
        var lineCount = customerRec.getLineCount({
            sublistId : 'addressbook'
        })

        for(var line = 0 ; line <  lineCount ; line ++)
        {
            var isDefault = customerRec.getSublistValue({
                sublistId : 'addressbook',
                fieldId : 'defaultbilling',
                line : line
            })
    
            if(isDefault === true)
            return line
        }

        return false
    }

    function getDefaultAdresShipsLine(customerRec){
        var lineCount = customerRec.getLineCount({
            sublistId : 'addressbook'
        })

        for(var line = 0 ; line <  lineCount ; line ++)
        {
            var isDefault = customerRec.getSublistValue({
                sublistId : 'addressbook',
                fieldId : 'defaultshipping',
                line : line
            })
    
            if(isDefault === true)
            return line
        }

        return false
    }

    function setHeadFieldsValue(salesOrder,params){
        var userObj = runtime.getCurrentUser()
        var customerAdress = getCustomerAdress(params.custpage_customer)
        var billingaddress = salesOrder.getSubrecord('billingaddress')
        var shippingaddress = salesOrder.getSubrecord('shippingaddress')

        if(customerAdress.ship)
        {
            if(customerAdress.ship.emp)
            {
                salesOrder.setValue({
                    fieldId : 'custbody_goodsman',
                    value : customerAdress.ship.emp
                })

                shippingaddress.setValue({
                    fieldId : 'attention',
                    value : customerAdress.ship.emp
                })
            }
     
            if(customerAdress.ship.empIphone)
            {
                salesOrder.setValue({
                    fieldId : 'custbody_phones',
                    value : customerAdress.ship.empIphone
                })

                shippingaddress.setValue({
                    fieldId : 'addrphone',
                    value : customerAdress.ship.empIphone
                })
            }

            if(customerAdress.ship.empFax) 
            {
                salesOrder.setValue({
                    fieldId : 'custbody_taxs',
                    value : customerAdress.ship.empFax
                })

                shippingaddress.setValue({
                    fieldId : 'custrecord186',
                    value : customerAdress.ship.empFax
                })
            }

            if(customerAdress.ship.empEmail) 
            {
                salesOrder.setValue({
                    fieldId : 'custbody_emails',
                    value : customerAdress.ship.empEmail
                })

                shippingaddress.setValue({
                    fieldId : 'custrecord_addressee_email',
                    value : customerAdress.ship.empEmail
                })
            }

            if(customerAdress.ship.adress)    
            shippingaddress.setValue({
                fieldId : 'addrtext',
                value : customerAdress.ship.adress
            })

            if(customerAdress.ship.country)    
            shippingaddress.setValue({
                fieldId : 'country',
                value : customerAdress.ship.country
            })
        }

        if(customerAdress.bill)
        {
            if(customerAdress.bill.empEmail)
            {
                salesOrder.setValue({
                    fieldId : 'custbody_emailss',
                    value : customerAdress.bill.empEmail
                })

                billingaddress.setValue({
                    fieldId : 'custrecord_addressee_email',
                    value : customerAdress.bill.empEmail
                })
            }

            
            if(customerAdress.bill.empFax)
            {
                salesOrder.setValue({
                    fieldId : 'custbody_vtax',
                    value : customerAdress.bill.empFax
                })

                billingaddress.setValue({
                    fieldId : 'custrecord186',
                    value : customerAdress.bill.empFax
                })
            }
 
            if(customerAdress.bill.empIphone)   
            {
                salesOrder.setValue({
                    fieldId : 'custbody_tel',
                    value : customerAdress.bill.empIphone
                })

                billingaddress.setValue({
                    fieldId : 'addrphone',
                    value : customerAdress.bill.empIphone
                })
            }
        
            if(customerAdress.bill.emp)  
            {
                salesOrder.setValue({
                    fieldId : 'custbody_vperson',
                    value : customerAdress.bill.emp
                })

                billingaddress.setValue({
                    fieldId : 'attention',
                    value : customerAdress.bill.emp
                })
            }

            if(customerAdress.bill.adress)    
            billingaddress.setValue({
                fieldId : 'addrtext',
                value : customerAdress.bill.adress
            })

            if(customerAdress.bill.country)    
            billingaddress.setValue({
                fieldId : 'country',
                value : customerAdress.bill.country
            })
        }

        salesOrder.setValue({
            fieldId : 'entity',
            value : params.custpage_customer
        })

        salesOrder.setValue({
            fieldId : 'subsidiary',
            value : params.custpage_subsidiary
        })

        salesOrder.setValue({
            fieldId : 'trandate',
            value : today()
        })

        salesOrder.setValue({
            fieldId : 'currency',
            value : params.custpage_currency
        })

        salesOrder.setValue({
            fieldId : 'department',
            value : userObj.department
        })

        if(params.custpage_isintercompany === 'T')
        {
            var searchInfo = params.custpage_ordertype === '4' ? {
                id : params.custpage_customer,
                type : 'customer',
                fieldId : 'custentity_vim'
            } : {
                id : params.custpage_subsidiary,
                type : 'subsidiary',
                fieldId : 'custrecord_intre_intercompany_location'
            }

            var location = search.lookupFields({
                type : searchInfo.type,
                id : searchInfo.id,
                columns : [searchInfo.fieldId]
            })[searchInfo.fieldId][0]

            if(location)
            {
                salesOrder.setValue({
                    fieldId : 'custbody_rece_locations',
                    value : location.value
                })
            }
        }
    }

    function today(){
        var date = new Date()
        return new Date(date.getTime() + 8 * 1000 * 60 * 60)
    }

    function getAllSalesLineFields(){
                                                          
        var planRecord  = record.create({
            type : 'customrecord_shipping_plan'
        })
        var allPlanFields  = planRecord.getFields()

        return allPlanFields.filter(function(item){
            return item.indexOf(fieldRegExPrefix) > -1
        })
    }

    function getPlanListIds(checkInfo){
        var ids = new Array()

        for(var key in checkInfo)
        {
            if(checkInfo[key] === 'T')
            {
                ids.push(key)
            }
        }

        return ids
    }

    function extendChechInfo(checkInfo,request){
        var lineCount = request.getLineCount({
            group : FIELDPR + 'lines'
        })
       
        for(var i = 0 ; i < lineCount ; i ++)
        {
              checkInfo[request.getSublistValue({
                group: FIELDPR + 'lines',
                name: FIELDPR + 'planing',
                line: i
            })] = request.getSublistValue({
                group: FIELDPR + 'lines',
                name: FIELDPR + 'check',
                line: i
            })
        }

        return checkInfo
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
        log.error('filters',filters)
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
                addSublistLine(sublist,index,res,params.disposetype,params.cacheId)
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

    function addSublistLine(sublist,index,res,disposetype,cacheId){
        var checkInfo = getCheckInfo(cacheId)

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

        if(res.getValue('custrecord_p_custcol_itemtype'))
        sublist.setSublistValue({
            id : FIELDPR + 'specifications',
            line : index,
            value : res.getValue('custrecord_p_custcol_itemtype')
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

        if(res.getValue('custrecord_p_custcol_boxes_numbers'))
        sublist.setSublistValue({
            id : FIELDPR + 'boxes',
            line : index,
            value : res.getValue('custrecord_p_custcol_boxes_numbers')
        })

        if(res.getValue('custrecord_p_custcol_sup_total'))
        sublist.setSublistValue({
            id : FIELDPR + 'pallet',
            line : index,
            value : res.getValue('custrecord_p_custcol_sup_total')
        })

        if(disposetype === '1')
        {
            var strWindowFeatures = "height=300,width=424,menubar=no,status=no,titlebar=no,location=no,toolbar=no"
            var link = '"' + res.getValue('custrecord_edit_link') +
            '&index=' + index +
            '","","' + strWindowFeatures + '"'
            sublist.setSublistValue({
                id : FIELDPR + 'operation',
                line : index,
                value : '<input class="openChild" style="padding:0 12px" value="操作" type="button" onclick=window.open('+ link +')>'
            })
        }
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

        addFields(sublist,sublistFieldsConfig.sublistFields())

        if(params.disposetype === '1')
        {
            addFields(sublist,[{
                id : 'detail',
                type : 'textarea',
                label : '拆分明细',
                displayType : 'ENTRY'
            }]) 

            addFields(sublist,[{
                id : 'operation',
                type : 'text',
                label : '操作'
            }]) 
        }     

        if(callBackFun) callBackFun(params,form,sublist)
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

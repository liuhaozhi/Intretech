/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * Authot lhz
 * Descripition estimate change entery
 */

 define([
        'N/task',
        'N/cache',
        'N/record',
        'N/search',
        'N/redirect',
        'N/ui/serverWidget',
        '../config/fieldGroupsConfig',
        '../config/sublistFieldsConfig',
        '../config/searchFiltersConfig',
        '../config/formUiButtonsConfig',
        '../config/searchFiltersFieldsConfig',
        '../../helper/wrapper_runtime'
    ],
    (
        task,
        cache , 
        record , 
        search , 
        redirect ,
        ui , 
        fieldGroupsConfig , 
        sublistFields , 
        searchFilters , 
        formUiButtons , 
        searchFiltersFields , 
        runtime 
    ) => {
        let sublistSearch
        const FIELDPR = 'custpage_'
        const formTitle = '账单付款批量更改科目平台'
        const defaultPageSize = 50
        const billpaymentSearch = () => search.load({id : 'customsearch_ap_payment_subject'})
       
        const onRequest = context => {
            const {request,response} = context
            const params  = request.parameters

            sublistSearch = billpaymentSearch()

            if(!params.subsidiary)
            params.subsidiary  = runtime.getCurrentUser().subsidiary
            params.cachefields = sublistSearch.columns.map(item => item.join ? (item.join + item.name).toLowerCase() : item.name.toLowerCase()) 

            if(request.method === 'GET')
            new searchPage(params , response).renderForm()
        
            if(request.method === 'POST')
            new createChangeOrd({params , ...context}).redirectoSl()  
        }

        class createChangeOrd{
            constructor(params){
                this.params = params.params
                this.request = params.request
                this.response = params.response
            }

            redirectoSl (){
                try{
                    this.changeOrdSave()
                }
                catch(e){
                    this.response.write(e.message)
                }
                
                redirect.toSuitelet({
                    scriptId : 'customscript_estimate_change',
                    deploymentId : 'customdeploy_estimate_change',
                    parameters : {
                        action : 'search',
                        status : 'sucess',
                        pagetype : 'create',
                        payee : this.params.custpage_payee,  
                        creater : this.params.custpage_creater,
                        cacheid : this.params.custpage_cacheid,   
                        currency : this.params.custpage_currency, 
                        employee : this.params.custpage_employee,  
                        trandatend : this.params.custpage_trandatend,  
                        subsidiary : this.params.custpage_subsidiary,  
                        transaction : this.params.custpage_transaction,  
                        cachefields : this.params.custpage_cachefields, 
                        trandatestar : this.params.custpage_trandatestar  
                    }
                })
            }

            getCheckEle() {
                const checkEle = Object.create(null)
                const allLines = this.allLinesInfo()

                Object.keys(allLines).map(item => {
                    let check = allLines[item].checked

                    if(check === 'T' || check === true || check === 'true')
                    checkEle[item] = allLines[item]
                })

                return checkEle
            }

            changeOrdSave() {
                let checkEle = this.getCheckEle()
                
                task.create({
                    taskType : task.TaskType.MAP_REDUCE,
                    scriptId : 'customscript_estimate_change_ordcreate',
                    params : {
                        custscript_change_type : this.params.custpage_changetype,
                        custscript_change_items : JSON.stringify(checkEle)
                    }
                }).submit()

                this.response.write(JSON.stringify(checkEle))
            }

            allLinesInfo() {
                const group = FIELDPR + 'lines'
                let lineCount = this.request.getLineCount({
                    group : group
                })
                let currLines = Object.create(null)
                let cacheLines = getCheckInfo(this.params.custpage_cacheid)

                while(lineCount > 0)
                {
                    let key = this.params.custpage_changetype !== '2' ? this.request.getSublistValue({
                        group : group,
                        name : 'custpage_custcol_plan_number',
                        line : --lineCount
                    }) : this.request.getSublistValue({
                        group : group,
                        name : 'custpage_ordid',
                        line : --lineCount
                    })

                    currLines[key] = getSublistFields(this.request , lineCount , this.params.cachefields)
                }

                return {...cacheLines , ...currLines}
            }

            changeOrdInit() {
                return record.create({
                    type : this.params.changetype === '2' ? 'customrecord_order_changereq' : 'customrecord_order_changereqline'
                })
            }

            setFieldValues() {

            }
        }

        class searchPage {
            constructor(params , response) {
                this.params = params
                this.response = response
            }

            addFltersFields(){
                this.addFields(this.form , searchFiltersFields.searchFiltersFields(this.params))
            }

            addFields(target , data){
                data.map(item =>{
                    const field = target.addField({
                        id : FIELDPR + item.id,
                        label : item.label,
                        type : item.type,
                        source : item.source,
                        container : item.container
                    })

                    if(item.id === 'cachefields')
                    field.maxLength  = 999999
        
                    if(item.selectOptions)
                    {
                        for(let i = 0 ; i < item.selectOptions.length ; i ++)
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

            renderForm() {
                this.formInit()
                this.addButtons()
                this.addFieldGroup()
                this.addSublist()
                this.addFltersFields()

                if(this.params.action === 'search')
                this.bindSublists()

                this.response.writePage(this.form)
            }

            formInit() {
                this.form = ui.createForm({
                    title : formTitle
                })
        
                this.form.clientScriptModulePath = '../cs/billpay_account_change_cs'
            }

            addFieldGroup() {
                const fieldGroups = fieldGroupsConfig.fieldGroups()

                fieldGroups.map(item => this.form.addFieldGroup({
                    id : item.id,
                    label : item.label
                }))
            }

            addButtons() {
                const UiButtons = formUiButtons.formUiButtons()
 
                UiButtons.map(item => {
                    this.form[item.action]({
                        id : item.id,
                        label : item.label,
                        functionName : item.functionName
                    })
                })
            }

            addSublist(){
                const sublist = this.sublist = this.form.addSublist({
                    id : FIELDPR + 'lines',
                    label : '查询结果',
                    tab : 'custpage_lists',
                    type : 'list'
                })
        
                sublist.addMarkAllButtons()
                
                this.addFields(sublist,sublistFields.sublistFields([{
                    name : 'check' ,
                    label : '选择' , 
                    type : 'checkbox'
                },{
                    name : 'transid',
                    label : 'transid'
                },{
                    name : 'transidtext',
                    label : 'transidtext'
                }],sublistSearch))
            }

            bindSublists(){
                const that = this
                const filters = that.getSearchFilters(runtime.getCurrentUserId() + 'accountchange' , 'searchFilters')

                sublistSearch.filterExpression = sublistSearch.filterExpression.concat(filters)

                const pageDate = sublistSearch.runPaged({pageSize : that.params.pageSize || defaultPageSize})
        
                if(pageDate.pageRanges.length > 0)
                {
                    that.checkInfo = getCheckInfo(that.params.cacheid)
                    that.addPageFields({
                        target : 'custpage_lists',
                        pageCount : pageDate.pageRanges.length,
                        currPage : that.params.currPage || 1,
                        pageSize : pageDate.pageSize
                    })
        
                    pageDate.fetch({
                        index : that.params.currPage ? --that.params.currPage : 0
                    }).data.forEach(function(res,index){
                        that.addSublistLine(that ,res , index) 
                    })
                }
            }

            addSublistLine(that , res , index) {
                sublistSearch.columns.map(item => {     
                    const type  = JSON.parse(JSON.stringify(item)).type
                    let   value = (type === 'select' && item.name !== 'account') ? res.getText(item) : res.getValue(item)
  
                    if(value === true)
                    value = 'T'

                    if(item.name === 'transactionnumber')
                    value = '<a style="color:blue" target="_blank" href="/app/accounting/transactions/vendpymt.nl?id=' + res.id + '&whence=">' + value + '</a>'
                    
                    if(value)
                    that.sublist.setSublistValue({
                        id : FIELDPR + (item.join ? (item.join + item.name).toLowerCase() : item.name.toLowerCase()),
                        line : index,
                        value : value
                    })
                    
                    that.sublist.setSublistValue({
                        id : FIELDPR + 'transid',
                        line : index,
                        value : res.id
                    })

                    that.sublist.setSublistValue({
                        id : FIELDPR + 'transidtext',
                        line : index,
                        value : res.getValue({name : 'transactionnumber'})
                    })
                })

                if(that.checkInfo[res.id] === 'T')
                that.sublist.setSublistValue({
                    id : FIELDPR + 'check',
                    line : index,
                    value : checkInfo[res.id]
                })
            }

            removeCheckCache(cacheid){
                if(cacheid)
                {
                    record.submitFields({
                        type : 'customrecord_cache_record',
                        id : cacheid,
                        values : {
                            custrecord_salesorder_cache : ''
                        }
                    })
                }
            }

            saveCache(cacheName , key , cacheData){
                let myCache = cache.getCache({
                    name : cacheName
                })
        
                myCache.put({
                    key   : key,
                    value : cacheData,
                    ttl   : 9999999
                })
            }

            getSearchFilters(cacheName , key){
                if(this.params.pagetype === 'create')
                {
                    const filters = searchFilters.searchFilters(this.params)

                    this.removeCheckCache(this.params.cacheid)
                    this.saveCache(cacheName,key,JSON.stringify(filters))

                    return filters
                }
        
                if(this.params.pagetype === 'turnpage')
                {
                    let myCache = cache.getCache({
                        name : cacheName
                    })
        
                    return JSON.parse(myCache.get({
                        key : key,
                        loader : this.loader
                    }))
                }
            }

            loader(){
                return searchFilters.searchFilters(this.params)
            }        

            addPageFields(params) {
                log.error('params',params)
                const currPageField = this.form.addField({
                    id : FIELDPR + 'currpage',
                    label : '当前页',
                    type : 'select',
                    container : params.target
                })
        
                const pageSizeField = this.form.addField({
                    id : FIELDPR + 'pagesize',
                    label : '每页数据条数',
                    type : 'select',
                    container : params.target
                })
        
                for(let i = 1 ; i <= params.pageCount; i ++){
                    currPageField.addSelectOption({
                        text : i + '/' + params.pageCount,
                        value : i,
                        isSelected : i === +params.currPage
                    })
                }
        
                for(let j = 400 ; j >= 50 ; j -= 50){
                    pageSizeField.addSelectOption({
                        text : j,
                        value : j,
                        isSelected : j === +params.pageSize
                    })
                }
            }
        }

        const getSublistFields = (request , line , cacheFields) =>{
            const group = FIELDPR + 'lines'
            const lineItems = Object.create(null)
    
            cacheFields.map(function(item){
                return lineItems[item] = request.getSublistValue({
                    group : group,
                    name : 'custpage_' + item,
                    line : line
                })
            })
    
            return {checked : request.getSublistValue({
                group : group,
                name : 'custpage_check',
                line : line
            }), ...lineItems}
        }

        const getCheckInfo = (cacheid) => {
            let checkCache
    
            if(cacheid)
            {
                checkCache = search.lookupFields({
                    type : 'customrecord_cache_record',
                    id : cacheid,
                    columns : ['custrecord_salesorder_cache']
                }).custrecord_salesorder_cache
            }
    
            return checkCache ? JSON.parse(checkCache) : new Object()
        }

        return {onRequest}
    }    
)
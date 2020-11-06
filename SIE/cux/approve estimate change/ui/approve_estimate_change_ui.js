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
        '../config/searchColumnsConfig',
        '../config/searchFiltersFieldsConfig',
        '../../helper/wrapper_runtime',
        '../../helper/operation_assistant'
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
        searchColumns , 
        searchFiltersFields , 
        runtime , 
        assistant
    ) => {
        let sublistSearch
        const FIELDPR = 'custpage_'
        const formTitle = '订单变更审批平台'
        const defaultPageSize = 50
        const changeOrdSearch = () => search.load({id : 'customsearch_changeline'})

        const onRequest = context => {
            const {request,response} = context
            const params  = request.parameters

            sublistSearch = changeOrdSearch()

            if(!params.subsidiary)
            params.subsidiary  = runtime.getCurrentUser().subsidiary

            if(request.method === 'GET')
            new searchPage(params , response).renderForm()
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
        
                this.form.clientScriptModulePath = '../cs/approve_estimate_change_cs'
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
                    name : 'internalid' ,
                    label : '标识' , 
                    type : 'text'
                },{
                    name : 'role',
                    label : 'role',
                    type : 'text'
                },{
                    name : 'nexts',
                    label : 'nexts',
                    type : 'text'
                }],sublistSearch,this.params.changetype))
            }

            bindSublists(){
                const that = this
                const filters = that.getSearchFilters(runtime.getCurrentUserId() + 'approvestimateChange' , 'searchFilters')

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
                    let getText = that.TextFieldIds()
                    let value   = getText.includes(item.name) ? res.getText(item) : res.getValue(item)

                    if(value === true) value = '是'
                    if(value === false) value = '否'
        
                    if(value)
                    that.sublist.setSublistValue({
                        id : FIELDPR + (item.join ? (item.join + item.name).toLowerCase() : item.name.toLowerCase()),
                        line : index,
                        value : value
                    })
                })

                if(that.checkInfo[res.id] === 'T')
                that.sublist.setSublistValue({
                    id : FIELDPR + 'check',
                    line : index,
                    value : checkInfo[res.id]
                })
      
                that.sublist.setSublistValue({
                    id : FIELDPR + 'internalid',
                    line : index,
                    value : res.id
                })

                that.sublist.setSublistValue({
                    id : FIELDPR + 'role',
                    line : index,
                    value : res.getValue({name : 'custrecord_gzl'}) || ' '
                })

                that.sublist.setSublistValue({
                    id : FIELDPR + 'nexts',
                    line : index,
                    value : res.getValue({name : 'custrecord_nexts'}) || ' '
                })
            }

            TextFieldIds() {
                return [
                    'custrecord_p_department',
                    'custrecord_c_custbody_order_status',
                    'custrecord_c_unit',
                    'custrecord_c_custcol_whether_bonded',
                    'custrecord_shenpi',
                    'custrecord_gzl',
                    'custrecord_nexts',
                ]
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

        const getCheckInfo = cacheid => {
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
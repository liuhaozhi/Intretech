/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 */
define([
    'N/cache',
    'N/search',
    'N/record',
    'N/redirect',
    'N/ui/serverWidget',
    '../config/searchFilters',
    '../config/searchColumns',
    '../config/searchFiltersConfig',
    '../config/sublistFieldsConfig',
    '../../helper/wrapper_runtime',
    '../../helper/operation_assistant'
], function(
    cache , search , record , redirect , ui , searchFilters , searchColumns  , searchFiltersConfig , 
    sublistFieldsConfig , runtime , operation
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
        if(request.method === 'POST')
        {
            itemFulfillment(params,request,response)
        }
    }

    function searchPage(params,response){
        var form = ui.createForm({
            title : '销售出库平台'
        })

        form.addFieldGroup({
            id : 'custpage_filters',
            label : '查询条件'
        })

        form.addFieldGroup({
            id : 'custpage_lists',
            label : '查询结果'
        })

        form.clientScriptModulePath = '../cs/item_fulfillment_cs'

        if(params.subsidiary)
        {
            params.customerSelectOptions = getCustomerSelectOption(params.subsidiary)
        }

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
        form.addSubmitButton({
            label : '出库'
        })

        form.addButton({
            id : 'custpage_search',
            label : 'search',
            functionName : 'searchLines'
        })
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

    function itemFulfillment(params,request,response){
        try{
            fulfillment(
                params,
                response,
                getCheckLists(
                    extendChechInfo(
                        getCheckInfo(params.custpage_cacheid),
                        request
                    )
                )
            )

            redirect.toSuitelet({
                scriptId : 'customscript_item_fulfillment',
                deploymentId : 'customdeploy_item_fulfillment',
                parameters : {
                    action : 'search',
                    status : 'sucess',
                    pagetype : 'create',
                    pageSize : params.custpage_pagesize,
                    emoloyee : params.custpage_emoloyee,
                    customer : params.custpage_customer,
                    trandate : params.custpage_trandate,
                    dateclose : params.custpage_dateclose,
                    salesorder : params.custpage_salesorder,
                    subsidiary : params.custpage_subsidiary,
                    location : params.custpage_location,
                    department : params.custpage_department,
                    invoicenum : params.custpage_invoicenum,
                    boxnum : params.custpage_boxnum,
                    advice : params.custpage_advice,
                    isexport : params.custpage_isexport,
                    customerord : params.custpage_customerord
                }
            })
        }
        catch(e)
        {
            throw e.message
        }
    }

    function fulfillment(params,response,lines){
       
        var errorMessage = new Array()

        for(var key in lines){
            var fulfillRecord = record.transform({
                fromType : 'salesorder',
                fromId : key,
                toType : 'itemfulfillment',
                isDynamic : true
            })

            setLineItemBin(fulfillRecord , lines[key] , params)

            try
            {
                fulfillRecord.save({
                    ignoreMandatoryFields : true
                })
            }
            catch(e)
            {
                errorMessage.push({
                    error : '原因:' + e.message,
                    id : '发货通知单内部标识:' + key
                })
            }
        }

        if(errorMessage.length)
        {
            response.write(JSON.stringify(errorMessage))

            throw 'out'
        }
    }

    function setLineItemBin(fulfillRecord , items , params){
        for(var item in items)
        {
            var quantity  = +items[item].quantity
            var lineCount = fulfillRecord.getLineCount({
                sublistId : 'item'
            })
            var invDetail    = JSON.stringify(items[item].invDetails)
            var invDetailArr = invDetail.split('\\u0005')

            invDetailArr = invDetailArr.map(function(i){
                var formatStr = '{' + i.replace(/\;/ig,',') + '}'

                formatStr = formatStr.replace(/\"/ig,'')
                return (new Function("return " + formatStr))()
            })

            for(var i = 0 ; i < lineCount ; i ++){
                var a = fulfillRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'item',
                    line : i
                })
                var b = fulfillRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_line',
                    line : i
                })
                var c = fulfillRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_salesorder',
                    line : i
                })

                if(a === items[item].item && b === items[item].custline && c === items[item].salesorder)
                {
                    fulfillRecord.selectLine({
                        sublistId : 'item',
                        line : i
                    })

                    fulfillRecord.setCurrentSublistValue({
                        sublistId : 'item',
                        fieldId : 'quantity',
                        value : quantity,
                    })

                    fulfillRecord.setCurrentSublistValue({
                        sublistId : 'item',
                        fieldId : 'location',
                        value : params.custpage_location,
                    })

                    var subDetail = fulfillRecord.getCurrentSublistSubrecord({
                        sublistId : 'item',
                        fieldId : 'inventorydetail'
                    })
            
                    invDetailArr.map(function(invList){
                        var invQuantity = invList['数量']

                        if(quantity > +invQuantity)
                        {
                            quantity = operation.sub(quantity , invQuantity)
                            inventoryLine(subDetail , +invQuantity , invList['批次号'])
                        }
                        else
                        {
                            inventoryLine(subDetail, +quantity , invList['批次号'])
                        }
                    })

                    fulfillRecord.commitLine({
                        sublistId : 'item'
                    })
                }
            }
        }
    }

    function inventoryLine(subDetail,quantity,id){
		subDetail.selectNewLine({
			sublistId : 'inventoryassignment'
		})

		subDetail.setCurrentSublistValue({
			sublistId: 'inventoryassignment',
			fieldId: 'quantity',
			value: quantity
        })
        
		subDetail.setCurrentSublistValue({
			sublistId: 'inventoryassignment',
			fieldId: 'receiptinventorynumber',
			value: id.toString()
        })

		subDetail.commitLine({
			sublistId : 'inventoryassignment'
        })
	}

    function getCheckLists(checkInfo){
        var lines = new Object()

        for(var key in checkInfo)
        {
            for(var line in checkInfo[key])
            {
                if(checkInfo[key][line].checked === 'T')
                {
                    if(!lines[key])                  
                    lines[key] = new Object()
                    
                    lines[key][line] = {
                        item : checkInfo[key][line].item,
                        custline : checkInfo[key][line].custline,
                        quantity : checkInfo[key][line].quantity,
                        salesorder : checkInfo[key][line].salesorder,
                        invDetails : checkInfo[key][line].invDetails
                    }
                }
            }
        }

        return lines
    }

    function extendChechInfo(checkInfo,request){
        var lineCount = request.getLineCount({
            group : FIELDPR + 'lines'
        })
   
        for(var i = 0 ; i < lineCount ; i ++)
        {
            var internalid = request.getSublistValue({
                group : FIELDPR + 'lines',
                name : 'custpage_internalid',
                line : i
            })

            if(!checkInfo[internalid])
            checkInfo[internalid] = new Object()

            checkInfo[internalid][request.getSublistValue({
                group : FIELDPR + 'lines',
                name : 'custpage_line',
                line : i
            })] = {
                item : request.getSublistValue({
                    group : FIELDPR + 'lines',
                    name : 'custpage_itemid',
                    line : i
                }),
                checked : request.getSublistValue({
                    group : FIELDPR + 'lines',
                    name : 'custpage_check',
                    line : i
                }),
                quantity : request.getSublistValue({
                    group : FIELDPR + 'lines',
                    name : 'custpage_currquantity',
                    line : i
                }),
                salesorder : request.getSublistValue({
                    group : FIELDPR + 'lines',
                    name : 'custpage_salesorder',
                    line : i
                }),
                custline : request.getSublistValue({
                    group : FIELDPR + 'lines',
                    name : 'custpage_custline',
                    line : i
                }),
                invDetails : request.getSublistValue({
                    group : FIELDPR + 'lines',
                    name : 'custpage_detail',
                    line : i
                })
            }  
        }

        return checkInfo
    }

    function getCheckInfo(cacheid){
        var checkCache = undefined

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

    function getLineItemInvent(items,location){
        var invent   = new Object()
        var invCount = new Object()
        var mySearch = search.load({
            id : 'customsearch_inventory_number'
        })

        mySearch.filters = mySearch.filters.concat(
            {
                name : 'item',
                operator : 'anyof',
                values : [items.map(function(i){return i.item})]
            },
            {
                name : 'location',
                operator : 'anyof',
                values : [location]
            }
        )

        mySearch.run().each(function(res){
            var item = res.getValue('item')
            var expirationdate = res.getValue('expirationdate')
            var inventorynumber = res.getValue('inventorynumber')
            var quantityavailable = res.getValue('quantityavailable')
  
            if(!invent[item]) invent[item] = new Object()
            if(!invent[item][inventorynumber]) invent[item][inventorynumber] = {quantity : quantityavailable , expirationdate : expirationdate} 

            invCount[item] ? 
            invCount[item] = operation.add(invCount[item] , quantityavailable) :  
            invCount[item] = quantityavailable

            return true
        })

        return {
            invent : invent,
            invCount : invCount
        }
    }

    function setLineItemInvent(sublist,items,location){
        var inventInfo = getLineItemInvent(items,location)

        items.map(function(item){
            if(inventInfo.invent[item.item])
            {
                var itemQuantiy= +item.quantity
                var itemInvent = inventInfo.invent[item.item]
                var detailInfo = getInventDetail(itemQuantiy,itemInvent,[])
                var detailArr  = detailInfo.detailArr
      
                detailArr = detailArr.map(function(item){
                    return item.join(';')
                })

                sublist.setSublistValue({
                    id : FIELDPR + 'detail',
                    line : item.index,
                    value : detailArr.join('\r\n')
                })

                if(inventInfo.invCount[item.item])
                sublist.setSublistValue({
                    id : FIELDPR + 'available',
                    line : item.index,
                    value : inventInfo.invCount[item.item].toString()
                })

                if(detailInfo.itemQuantiy)
                {
                    sublist.setSublistValue({
                        id : FIELDPR + 'currquantity',
                        line : item.index,
                        value : operation.sub(itemQuantiy, detailInfo.itemQuantiy).toString()
                    })
    
                    sublist.setSublistValue({
                        id : FIELDPR + 'abbprovequantity',
                        line : item.index,
                        value : operation.sub(itemQuantiy, detailInfo.itemQuantiy).toString()
                    })  

                    sublist.setSublistValue({
                        id : FIELDPR + 'surplusquantity',
                        line : item.index,
                        value : detailInfo.itemQuantiy.toString()
                    })  
                }
            }
        })     
    }

    function getInventDetail(itemQuantiy,itemInvent,detailArr){
        if(JSON.stringify(itemInvent) === '{}') return {detailArr : detailArr ,itemQuantiy : itemQuantiy}

        for(var key in itemInvent)
        {
            var list = itemInvent[key]

            if(itemQuantiy > +list.quantity)
            {
                itemQuantiy = operation.sub(itemQuantiy , list.quantity)
                detailArr.push([
                    '批次号:' + key,
                    '数量:' + list.quantity,
                    '到期日期:' +  list.expirationdate
                ])
                delete itemInvent[key]

                return getInventDetail(itemQuantiy,itemInvent,detailArr)
            }
       
            list.quantity = operation.sub(list.quantity , itemQuantiy)
            detailArr.push([
                '批次号:' + key,
                '数量' + itemQuantiy,
                '到期日期:' +  list.expirationdate
            ])

            if(list.quantity === 0) delete itemInvent[key]

            return {detailArr : detailArr}
        }
    }

    function bindSublists(params,form,sublist){
        var filters = getSearchFilters(params , runtime.getCurrentUserId() + 'ItemfullCache' , 'searchFilters')
        var Mysearch= search.create({
            type : 'salesorder',
            filters : filters,
            columns : searchColumns.searchColumns()
        })
        var pageDate = Mysearch.runPaged({pageSize : params.pageSize || defaultPageSize})

        if(pageDate.pageRanges.length > 0)
        {
            var checkInfo = getCheckInfo(params.cacheid)

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
                addSublistLine(sublist,index,res,checkInfo,params.location)
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
            removeCheckCache(params.cacheid)
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

    function removeCheckCache(cacheid){
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

    function loader(params){
        return searchFilters.searchFilters(params)
    }

    function addSublistLine(sublist,index,res,checkInfo,location){
        var line = res.getValue('line')
        var items = new Array()
        var custline = res.getValue('custcol_line')
        var quantity = Math.abs(res.getValue('quantity'))
        var backordered = res.getValue('quantitypicked')
        var currQuantity= operation.sub(quantity,backordered).toString()
        var itemInfo = {item : res.getValue('item') , index : index , quantity : currQuantity} 
        
        items.push(itemInfo)
 
        sublist.setSublistValue({
            id : FIELDPR + 'internalid',
            line : index,
            value : res.id
        })

        sublist.setSublistValue({
            id : FIELDPR + 'line',
            line : index,
            value : line
        })

        if(custline)
        sublist.setSublistValue({
            id : FIELDPR + 'custline',
            line : index,
            value : custline
        })

        if(res.getValue('custcol_salesorder'))
        sublist.setSublistValue({
            id : FIELDPR + 'salesorder',
            line : index,
            value : res.getValue('custcol_salesorder')
        })

        sublist.setSublistValue({
            id : FIELDPR + 'quantityshiprecv',
            line : index,
            value : backordered
        }) 

        if(res.getValue('tranid'))
        sublist.setSublistValue({
            id : FIELDPR + 'tranid',
            line : index,
            value : res.getValue('tranid')
        }) //单据编号

        if(res.getValue('trandate'))
        sublist.setSublistValue({
            id : FIELDPR + 'trandate',
            line : index,
            value : res.getValue('trandate')
        }) //日期

        if(res.getValue('custbody_invoice_number'))
        sublist.setSublistValue({
            id : FIELDPR + 'invnum',
            line : index,
            value : res.getValue('custbody_invoice_number')
        }) //发票号

        if(res.getValue('custbody_packing_number'))
        sublist.setSublistValue({
            id : FIELDPR + 'boxnum',
            line : index,
            value : res.getValue('custbody_packing_number')
        }) //装箱号

        if(res.getValue({
            name : 'tranid' ,
            join : 'custcol_salesorder'
        }))
        sublist.setSublistValue({
            id : FIELDPR + 'saleordnum',
            line : index,
            value : res.getValue({
                name : 'tranid' ,
                join : 'custcol_salesorder'
            })
        }) //销售订单号

        if(res.getValue('custcol_salesorder'))
        sublist.setSublistValue({
            id : FIELDPR + 'salesorder',
            line : index,
            value : res.getValue('custcol_salesorder')
        }) //销售订单id

        if(res.getText('item'))
        sublist.setSublistValue({
            id : FIELDPR + 'itemnum',
            line : index,
            value : res.getText('item')
        }) //物料

        if(res.getValue('item'))
        sublist.setSublistValue({
            id : FIELDPR + 'itemid',
            line : index,
            value : res.getValue('item')
        }) //物料id

        if(res.getValue({
            name : 'displayname',
            join : 'item'
        }))
        sublist.setSublistValue({
            id : FIELDPR + 'itemname',
            line : index,
            value : res.getValue({
                name : 'displayname',
                join : 'item'
            })
        }) //物料名称

        if(res.getValue('custcol_dedate'))
        sublist.setSublistValue({
            id : FIELDPR + 'expectedshipdate',
            line : index,
            value : res.getValue('custcol_dedate')
        }) //数量

        if(res.getValue('quantity'))
        sublist.setSublistValue({
            id : FIELDPR + 'quantity',
            line : index,
            value : quantity.toString()
        }) //数量

    
        setCacheLine(checkInfo,res,line,sublist,index,currQuantity)
        setLineItemInvent(sublist,items,location)
    }

    function setCacheLine(checkInfo,res,line,sublist,index,currQuantity){
        if(checkInfo[res.id])
        {
            if(checkInfo[res.id][line])
            {
                if(checkInfo[res.id][line].checked === 'T')
                {
                    sublist.setSublistValue({
                        id : FIELDPR + 'check',
                        line : index,
                        value : 'T'
                    })
                }
    
                if(checkInfo[res.id][line].quantity)
                {
                    sublist.setSublistValue({
                        id : FIELDPR + 'currquantity',
                        line : index,
                        value : checkInfo[res.id][line].quantity
                    })

                    sublist.setSublistValue({
                        id : FIELDPR + 'abbprovequantity',
                        line : index,
                        value : checkInfo[res.id][line].quantity
                    })  
                }
            }
            else
            {
                sublist.setSublistValue({
                    id : FIELDPR + 'currquantity',
                    line : index,
                    value : currQuantity
                })

                sublist.setSublistValue({
                    id : FIELDPR + 'abbprovequantity',
                    line : index,
                    value : currQuantity
                })  
            }
        }
        else
        {
            sublist.setSublistValue({
                id : FIELDPR + 'currquantity',
                line : index,
                value : currQuantity
            })

            sublist.setSublistValue({
                id : FIELDPR + 'abbprovequantity',
                line : index,
                value : currQuantity
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

        sublist.addMarkAllButtons()
        
        addFields(sublist,sublistFieldsConfig.sublistFields())
  
        if(callBackFun) callBackFun(params,form,sublist)
    }

    return {
        onRequest: onRequest
    }
});

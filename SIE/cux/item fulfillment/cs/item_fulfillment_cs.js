/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    'N/url',
    'N/util',
    'N/https',
    'N/search',
    'N/record',
    'N/ui/message',
    'N/currentRecord',
    '../../helper/operation_assistant'
], function(url , util , https , search , record , message , currentRecord , operation
) {
    var currentRec= undefined
    var allFields = {
        item : 'custpage_item',
        check : 'custpage_check',
        boxnum : 'custpage_boxnum',
        advice : 'custpage_advice',
        cacheid : 'custpage_cacheid',
        quantity : 'custpage_quantity',
        isexport : 'custpage_isexport',
        currpage : 'custpage_currpage',
        pagesize : 'custpage_pagesize',
        emoloyee : 'custpage_emoloyee',
        customer : 'custpage_customer',
        trandate : 'custpage_trandate',
        location : 'custpage_location',
        available: 'custpage_available',
        dateclose : 'custpage_dateclose',
        sublistId : 'custpage_lines',
        invoicenum : 'custpage_invoicenum',
        salesorder : 'custpage_salesorder',
        subsidiary : 'custpage_subsidiary',
        department : 'custpage_department',
        customerord  : 'custpage_customerord',
        currquantity : 'custpage_currquantity',
        surplusquantity : 'custpage_surplusquantity',
        quantityshiprecv : 'custpage_quantityshiprecv',
        abbprovequantity : 'custpage_abbprovequantity'
    }

    function pageInit(context) {
        console.log('pageinit')
        initMessage()
        formOptimize()
        setCurrentRec()
        bindButtonEvent()
    }

    function bindButtonEvent(){
        jQuery('#custpage_linesmarkall').on('click',function(e){
            var lineCount = currentRec.getLineCount({
                sublistId : allFields.sublistId
            })

            for(var i = 0 ; i < lineCount ; i ++)
            {   
                var currquantity = currentRec.getSublistValue({
                    sublistId : allFields.sublistId,
                    fieldId : allFields.currquantity,
                    line : i
                })
        
                if(currquantity === '0' || !currquantity)
                {
                    currentRec.selectLine({
                        sublistId : allFields.sublistId,
                        line : i
                    })

                    currentRec.setCurrentSublistValue({
                        sublistId : allFields.sublistId,
                        fieldId : allFields.check,
                        value : false
                    })
                }
            }
        })
    }

    function setCurrentRec(){
        currentRec = currentRecord.get() 
    }

    function initMessage(){
        var params  = {}
        var href = location.href

        if(href.indexOf('?') !== -1){
            var hrefObj = href.substring(href.indexOf('?') + 1)

            if(hrefObj.indexOf('&') > -1){
                var arr = hrefObj.split('&')      
                arr.forEach(function(item){
                    var Itemobj = item.split('=')    
                    params[Itemobj[0]] = Itemobj[1] ? Itemobj[1] : 'false'           
                })
            }
        }

        if(params.status === 'sucess')
        {
            message.create({
                title : '已完成！' , 
                type :  message.Type.CONFIRMATION , 
                message : '处理完成！'
            }).show()
        }
    }

    function formOptimize(){
        jQuery('#custpage_lines_div').css({
            maxHeight : '500px',
            overflow : 'auto'
        })
        window.onbeforeunload = function(){}
    }

    function saveRecord(context) {
        var hasChecked= false
        var lineCount = currentRec.getLineCount({
            sublistId : allFields.sublistId
        })

        for(var i = 0 ; i < lineCount; i ++)
        {
            var checked = currentRec.getSublistValue({
                sublistId : allFields.sublistId,
                fieldId : 'custpage_check',
                line : i
            })

            if(checked === true)
            {
                hasChecked = true
                break
            }
        }

        if(!hasChecked) alert('您没有选择任何一个物料')

        return hasChecked
    }

    function fieldChanged(context) {
        if(context.fieldId === allFields.subsidiary)
        {
            if(currentRec.getValue(context.fieldId))
            {
                var customerField = currentRec.getField({
                    fieldId : allFields.customer
                })
                var locationField = currentRec.getField({
                    fieldId : allFields.location
                })
    
                customerField.removeSelectOption({
                    value : null
                })

                locationField.removeSelectOption({
                    value : null
                })
    
                changeCustomerSelectOption(customerField,currentRec.getValue(context.fieldId))
                changeLocationSelectOption(locationField,currentRec.getValue(context.fieldId),currentRec.getValue(allFields.isexport))
            }
        }

        if(context.fieldId === allFields.currpage)
        {
            turnPage({
                currPage : currentRec.getValue(allFields.currpage),
                pageSize : currentRec.getValue(allFields.pagesize)
            })
        }

        if(context.fieldId === allFields.pagesize)
        {
            searchLines(currentRec.getValue(allFields.pagesize))
        }

        if(context.fieldId === allFields.currquantity)
        {
            if(validQuantity())
            {
                currentRec.setCurrentSublistValue({
                    sublistId : allFields.sublistId,
                    fieldId : allFields.currquantity,
                    value : currentRec.getCurrentSublistValue({
                        sublistId : allFields.sublistId,
                        fieldId : allFields.abbprovequantity
                    })
                })
            } 

            changeSurplusquantity()
        }

        if(context.fieldId === allFields.advice){
            var advice = currentRec.getValue({
                fieldId : allFields.advice
            })

            setIsexport(advice)
        }

        if(context.fieldId === allFields.check){
            var checked = currentRec.getCurrentSublistValue({
                sublistId : allFields.sublistId,
                fieldId : allFields.check
            })

            if(checked)
            {
                validLine()
            }
        }

        if(context.fieldId === allFields.isexport){
            var locationField = currentRec.getField({
                fieldId : allFields.location
            })
            var subsidiary = currentRec.getField({
                fieldId : allFields.subsidiary
            })

            if(subsidiary)
            {
                locationField.removeSelectOption({
                    value : null
                })

                changeLocationSelectOption(locationField,subsidiary,currentRec.getValue(allFields.isexport))
            }
        }
    }

    function setIsexport(advice){
        if(advice)
        {
            var isexport = search.lookupFields({
                type : 'salesorder',
                id : advice,
                columns : ['custbody_ifexport']
            }).custbody_ifexport

            currentRec.setValue({
                fieldId : allFields.isexport,
                value : isexport ? '1' : '2'
            })
        }
        else
        {
            currentRec.setValue({
                fieldId : allFields.isexport,
                value : ''
            })
        }
    }

    function changeSurplusquantity(){
        var index = currentRec.getCurrentSublistIndex({
            sublistId : allFields.sublistId
        })

        currentRec.setCurrentSublistValue({
            sublistId : allFields.sublistId,
            fieldId : allFields.surplusquantity,
            value : operation.sub(
                currentRec.getSublistValue({
                    sublistId : allFields.sublistId,
                    fieldId : allFields.quantity,
                    line : index
                }) || 0,
                operation.add(
                    currentRec.getSublistValue({
                        sublistId : allFields.sublistId,
                        fieldId : allFields.currquantity,
                        line : index
                    }) || 0,
                    currentRec.getSublistValue({
                        sublistId : allFields.sublistId,
                        fieldId : allFields.quantityshiprecv,
                        line : index
                    }) || 0
                )
            ).toString()
        })
    }

    function validLine(){
        var currquantity = currentRec.getCurrentSublistValue({
            sublistId : allFields.sublistId,
            fieldId : allFields.currquantity
        })

        if(currquantity === '0' || !currquantity)
        {
            currentRec.setCurrentSublistValue({
                sublistId : allFields.sublistId,
                fieldId : allFields.check,
                value : false
            })
        }
    }

    function getAvailable(location , index , item){
        https.get.promise({
            url : url.resolveScript({
                scriptId : 'customscript_item_fulfillment_response',
                deploymentId : 'customdeploy_item_fulfillment_response',
                params : {
                    item : item,
                    location : location,
                    action : 'searchAvailable'
                } 
            })
        })
        .then(function(res){
            console.log(res.body)
            var body = JSON.parse(res.body)
            var currQuantity = currentRec.getCurrentSublistValue({
                sublistId : allFields.sublistId,
                fieldId : allFields.currquantity,
            })

            currentRec.setCurrentSublistValue({
                sublistId : allFields.sublistId,
                fieldId : allFields.available,
                value : body.quantity || '0',
                line : index
            })

            if(Number(currQuantity) > Number(body.quantity))
            currentRec.setCurrentSublistValue({
                sublistId : allFields.sublistId,
                fieldId : allFields.currquantity,
                value : body.quantity || '0',
            })
        })
        .catch(function(e){
            console.log(e)
        })
    }

    function validQuantity(){
        var oldValue = currentRec.getCurrentSublistValue({
            sublistId : allFields.sublistId,
            fieldId : allFields.abbprovequantity
        })

        var newValue = currentRec.getCurrentSublistValue({
            sublistId : allFields.sublistId,
            fieldId : allFields.currquantity
        })

        return Number(newValue) > Number(oldValue)
    }

    function validAvailable(){
        var newValue = currentRec.getCurrentSublistValue({
            sublistId : allFields.sublistId,
            fieldId : allFields.currquantity
        })

        var available = currentRec.getCurrentSublistValue({
            sublistId : allFields.sublistId,
            fieldId : allFields.available
        })

        if(Number(newValue) > Number(available))
        return Number(available)

        return false
    }

    function turnPage(params){
        setCheckCache()

        location.href = url.resolveScript({
            scriptId : 'customscript_item_fulfillment',
            deploymentId : 'customdeploy_item_fulfillment',
            params : util.extend(searchParams(),{
                action : 'search',
                pagetype : 'turnpage',
                currPage : params.currPage,
                pageSize : params.pageSize
            })
        })
    }

    function getCache(cacheId){
        var checkCache = undefined
        
        if(cacheId)
        {
            checkCache = search.lookupFields({
                type : 'customrecord_cache_record',
                id : cacheId,
                columns : ['custrecord_salesorder_cache']
            }).custrecord_salesorder_cache
        }else
        {
            cacheId = record.create({
                type : 'customrecord_cache_record'
            }).save({ignoreMandatoryFields : false})

            currentRec.setValue({
                fieldId : 'custpage_cacheid',
                value : cacheId
            })
        }

        return {
            cacheId : cacheId,
            checkInfo : checkCache ? JSON.parse(checkCache) : new Object()
        }
    }

    function setCheckCache(){
        var lineCount = currentRec.getLineCount({
            sublistId : allFields.sublistId
        })
        var cacheId = currentRec.getValue('custpage_cacheid')
        var checkCache = getCache(cacheId) 
        var checkInfo  = checkCache.checkInfo

        for(var i = 0 ; i < lineCount ; i ++)
        {
            var internalid = currentRec.getSublistValue({
                sublistId : allFields.sublistId,
                fieldId : 'custpage_internalid',
                line : i
            })

            if(!checkInfo[internalid]) checkInfo[internalid] = new Object()

            checkInfo[internalid][currentRec.getSublistValue({
                sublistId : allFields.sublistId,
                fieldId : 'custpage_line',
                line : i
            })] =  {
                item : currentRec.getSublistValue({
                    sublistId : allFields.sublistId,
                    fieldId : 'custpage_itemid',
                    line : i
                }),
                checked : currentRec.getSublistValue({
                    sublistId : allFields.sublistId,
                    fieldId : 'custpage_check',
                    line : i
                }),
                quantity : currentRec.getSublistValue({
                    sublistId : allFields.sublistId,
                    fieldId : 'custpage_currquantity',
                    line : i
                }),
                salesorder : currentRec.getSublistValue({
                    sublistId : allFields.sublistId,
                    fieldId : 'custpage_salesorder',
                    line : i
                }),
                custline : currentRec.getSublistValue({
                    sublistId : allFields.sublistId,
                    fieldId : 'custpage_custline',
                    line : i
                }),
                invDetails : currentRec.getSublistValue({
                    sublistId : allFields.sublistId,
                    fieldId : 'custpage_detail',
                    line : i
                })
            }         
        }

        record.submitFields({
            type : 'customrecord_cache_record',
            id : checkCache.cacheId,
            values : {
                custrecord_salesorder_cache : JSON.stringify(checkInfo)
            }
        })
    }

    function changeCustomerSelectOption(customerField,subsidiary){
        customerField.insertSelectOption({
            value : -1,
            text : ' '
        })

        https.get.promise({
            url : url.resolveScript({
                scriptId : 'customscript_item_fulfillment_response',
                deploymentId : 'customdeploy_item_fulfillment_response',
                params : {
                    subsidiary : subsidiary,
                    action : 'getCustomerSelectOption'
                } 
            })
        })
        .then(function(res){
            var body = JSON.parse(res.body)
  
            body.selectOption.map(function(item){
                customerField.insertSelectOption({
                    value : item.id,
                    text : item.entityid + '&nbsp;&nbsp;' + item.companyname
                })
            })
        })
        .catch(function(e){
            console.log(e)
        })
    }

    function changeLocationSelectOption(locationField,subsidiary,isexport){
        locationField.insertSelectOption({
            value : -1,
            text : ' '
        })

        https.get.promise({
            url : url.resolveScript({
                scriptId : 'customscript_item_fulfillment_response',
                deploymentId : 'customdeploy_item_fulfillment_response',
                params : {
                    isExport : isexport,
                    subsidiary : subsidiary,
                    action : 'getLocationSelectOption'
                } 
            })
        })
        .then(function(res){
            var body = JSON.parse(res.body)
  
            body.selectOption.map(function(item){
                locationField.insertSelectOption({
                    value : item.id,
                    text : item.name
                })
            })
        })
        .catch(function(e){
            console.log(e)
        })
    }

    function volidMandatory(){
        if(!currentRec.getValue(allFields.subsidiary))
        {
            alert('请输入值：子公司')
            return false
        }

        if(!currentRec.getValue(allFields.location))
        {
            alert('请输入值：仓位')
            return false
        }

        return true
    }

    function searchLines(pageSize){
        if (!volidMandatory()) return false

        location.href = url.resolveScript({
            scriptId : 'customscript_item_fulfillment',
            deploymentId : 'customdeploy_item_fulfillment',
            params : util.extend(searchParams(),{
                action : 'search',
                pagetype : 'create',
                pageSize : pageSize || ''
            })
        })
    }

    function searchParams(){
        return {
            advice : currentRec.getValue(allFields.advice),
            cacheid : currentRec.getValue(allFields.cacheid),
            pageSize : currentRec.getValue(allFields.pagesize),
            emoloyee : currentRec.getValue(allFields.emoloyee),
            customer : currentRec.getValue(allFields.customer),
            trandate : currentRec.getText(allFields.trandate),
            dateclose : currentRec.getText(allFields.dateclose),
            sublistId : currentRec.getValue(allFields.sublistId),
            salesorder : currentRec.getValue(allFields.salesorder),
            subsidiary : currentRec.getValue(allFields.subsidiary),
            location : currentRec.getValue(allFields.location),
            department : currentRec.getValue(allFields.department),
            invoicenum : currentRec.getValue(allFields.invoicenum),
            isexport : currentRec.getValue(allFields.isexport),
            customerord : currentRec.getValue(allFields.customerord)
        }
    }
    

    return {
        pageInit : pageInit,
        saveRecord : saveRecord,
        searchLines : searchLines,
        fieldChanged : fieldChanged
    }
});

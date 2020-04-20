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
    'N/currentRecord'
], function(url , util , https , search , record , message , currentRecord 
) {
    var currentRec= undefined
    var allFields = {
        item : 'custpage_item',
        check : 'custpage_check',
        cacheid : 'custpage_cacheid',
        currpage : 'custpage_currpage',
        pagesize : 'custpage_pagesize',
        emoloyee : 'custpage_emoloyee',
        customer : 'custpage_customer',
        trandate : 'custpage_trandate',
        location : 'custpage_location',
        available: 'custpage_available',
        dateclose : 'custpage_dateclose',
        sublistId : 'custpage_lines',
        salesorder : 'custpage_salesorder',
        subsidiary : 'custpage_subsidiary',
        currquantity : 'custpage_currquantity',
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
                if(!currentRec.getSublistValue({
                    sublistId : allFields.sublistId,
                    fieldId : allFields.location,
                    line : i
                }))
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
    
                customerField.removeSelectOption({
                    value : null
                })
    
                changeCustomerSelectOption(customerField,currentRec.getValue(context.fieldId))
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

            var available = validAvailable()

            if(available || available === 0)
            {
                currentRec.setCurrentSublistValue({
                    sublistId : allFields.sublistId,
                    fieldId : allFields.currquantity,
                    value : available.toString()
                })
            }
        }

        if(context.fieldId === allFields.location){
            var location = currentRec.getCurrentSublistValue({
                sublistId : allFields.sublistId,
                fieldId : context.fieldId
            })

            if(location)
            {
                var index = currentRec.getCurrentSublistIndex({
                    sublistId : allFields.sublistId
                })

                getAvailable(location,index,currentRec.getSublistValue({
                    sublistId : allFields.sublistId,
                    fieldId : allFields.item,
                    line : index
                }))
            }
        }

        if(context.fieldId === allFields.check){
            if(currentRec.getCurrentSublistValue({
                sublistId : allFields.sublistId,
                fieldId : allFields.check
            }))
            {
                validLine()
            }
        }
    }

    function validLine(){
        if(!currentRec.getCurrentSublistValue({
            sublistId : allFields.sublistId,
            fieldId : allFields.location
        }))
        {
            currentRec.setCurrentSublistValue({
                sublistId : allFields.sublistId,
                fieldId : allFields.check,
                value : false
            })
        }    

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
                item : currentRec.getSublistText({
                    sublistId : allFields.sublistId,
                    fieldId : 'custpage_item',
                    line : i
                }),
                checked : currentRec.getSublistText({
                    sublistId : allFields.sublistId,
                    fieldId : 'custpage_check',
                    line : i
                }),
                quantity : currentRec.getSublistText({
                    sublistId : allFields.sublistId,
                    fieldId : 'custpage_currquantity',
                    line : i
                }),
                salesorder : currentRec.getSublistText({
                    sublistId : allFields.sublistId,
                    fieldId : 'custpage_salesorder',
                    line : i
                }),
                custline : currentRec.getSublistText({
                    sublistId : allFields.sublistId,
                    fieldId : 'custpage_custline',
                    line : i
                }),
                location : currentRec.getSublistText({
                    sublistId : allFields.sublistId,
                    fieldId : 'custpage_location',
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
            customerField.insertSelectOption({
                value : res.getValue('internalid'),
                text : res.getValue('entityid') + '&nbsp;&nbsp;' + res.getValue('companyname')
            })
            return true
        })
    }

    function volidMandatory(){
        if(!currentRec.getValue(allFields.subsidiary))
        {
            alert('请输入值：子公司')
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
            cacheid : currentRec.getValue(allFields.cacheid),
            pageSize : currentRec.getValue(allFields.pagesize),
            emoloyee : currentRec.getValue(allFields.emoloyee),
            customer : currentRec.getValue(allFields.customer),
            trandate : currentRec.getText(allFields.trandate),
            dateclose : currentRec.getText(allFields.dateclose),
            sublistId : currentRec.getValue(allFields.sublistId),
            salesorder : currentRec.getValue(allFields.salesorder),
            subsidiary : currentRec.getValue(allFields.subsidiary)
        }
    }
    

    return {
        pageInit : pageInit,
        saveRecord : saveRecord,
        searchLines : searchLines,
        fieldChanged : fieldChanged
    }
});

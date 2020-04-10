/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    'N/url',
    'N/util',
    'N/search',
    'N/record',
    'N/ui/message',
    'N/currentRecord',
    '../../helper/operation_assistant'
], function(url , util , search , record , message , currentRecord , operation
) {
    var sublistId = 'custpage_lines'
    var currentRec = undefined

    function pageInit(context) {
        console.log('pageinit')
        initMessage()
        formOptimize()
        setCurrentRec()
        bindButtonEvent(currentRec)
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

        if(params.salesOrderId)
        window.open('/app/accounting/transactions/salesord.nl?id='+ params.salesOrderId +'&e=T&whence=')

        if(params.status === 'sucess')
        message.create({
            title : '已完成！' , 
            type :  message.Type.CONFIRMATION , 
            message : '处理完成！'
        }).show()
    }

    function setCurrentRec(){
        window.currentRec = currentRec = currentRecord.get() 
    }

    function bindButtonEvent(currentRec){
        jQuery('#custpage_linesmarkall').on('click',function(e){
            var boxcount = 0
            var boardcount = 0
            var lineCount = currentRec.getLineCount({
                sublistId : sublistId
            })

            for(var i = 0 ; i < lineCount ; i ++)
            {
                boxcount = operation.add(boxcount,currentRec.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custpage_boxes',
                    line : i
                }))

                boardcount = operation.add(boardcount,currentRec.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custpage_pallet',
                    line : i
                }))
            }

            currentRec.setValue({
                fieldId : 'custpage_boxcount',
                value : boxcount
            })

            currentRec.setValue({
                fieldId : 'custpage_boardcount',
                value : boardcount
            })
        })

        jQuery('#custpage_linesunmarkall').on('click',function(e){
            currentRec.setValue({
                fieldId : 'custpage_boxcount',
                value : ''
            })

            currentRec.setValue({
                fieldId : 'custpage_boardcount',
                value : ''
            })
        })

        jQuery('.openChild').on('click',function(e){
            var parent = jQuery(this)
            .parent('td:first')
            console.log(parent.attr('style'))
            var parentSiblings = jQuery(this)
            .parent('td:first')
            .siblings()

            parent
            .css("cssText", parent.attr('style') + ";background-color: red !important;")
           
            for(var i = 0 ; i < parentSiblings.length ; i ++)
            {
                console.log(jQuery(parentSiblings[i]).attr('style'))
                jQuery(parentSiblings[i])
                .css("cssText",jQuery(parentSiblings[i]).attr('style') + ";background-color: red !important;")
            }
        })
    }

    function formOptimize(){
        jQuery('#custpage_lines_div').css({
            maxHeight : '500px',
            overflow : 'auto'
        })
        jQuery('td textarea')
        .attr({disabled : true})
        window.onbeforeunload = function(){}
    }

    function saveRecord(context) {
        var hasChecked= false
        var lineCount = currentRec.getLineCount({
            sublistId : sublistId
        })
        
        if(currentRec.getValue('custpage_isintercompany'))
        {
            if(!currentRec.getValue('custpage_endcustomer'))
            {
                alert('请输入值：最终客户')
                return false
            }
        }

        for(var i = 0 ; i < lineCount; i ++)
        {
            var checked = currentRec.getSublistValue({
                sublistId : sublistId,
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
        if(context.fieldId === 'custpage_subsidiary')
        {
            if(currentRec.getValue(context.fieldId))
            {
                var customerField = currentRec.getField({
                    fieldId : 'custpage_customer'
                })
    
                customerField.removeSelectOption({
                    value : null
                })
    
                changeCustomerSelectOption(customerField,currentRec.getValue(context.fieldId))
            }
        }

        if(context.fieldId === 'custpage_isintercompany')
        {
            var endcustomer = currentRec.getText({
                fieldId : 'custpage_isintercompany'
            })

            currentRec.getField({
                fieldId : 'custpage_endcustomer'
            }).isMandatory = endcustomer === 'T'
        }

        if(context.fieldId === 'custpage_currpage')
        {
            turnPage({
                currPage : currentRec.getValue('custpage_currpage'),
                pageSize : currentRec.getValue('custpage_pagesize'),
                disposetype : currentRec.getValue('custpage_disposetype')
            })
        }

        if(context.fieldId === 'custpage_pagesize')
        {
            searchLines(currentRec.getValue('custpage_pagesize'))
        }

        if(context.fieldId === 'custpage_check')
        {
            setCountInfo(context.fieldId)
        }

        if(context.fieldId === 'custpage_customer')
        {
            setCustomerCurrency(context.fieldId)
        }
    }

    function setCustomerCurrency(customer){
        var customerId = currentRec.getValue({
            fieldId : customer
        })

        if(customerId && customerId !== '-1')
        {
            var currency = search.lookupFields({
                type : 'customer',
                id : customerId,
                columns : ['currency']
            }).currency[0].value

            currentRec.setValue({
                fieldId : 'custpage_currency',
                value : currency
            })
        }
    }

    function setCountInfo(fieldId){
        var checked =  currentRec.getCurrentSublistValue({
            sublistId : sublistId,
            fieldId : fieldId
        })
        var boxcount = currentRec.getSublistValue({
            sublistId : sublistId,
            fieldId : 'custpage_boxes',
            line : currentRec.getCurrentSublistIndex({
                sublistId : sublistId
            })
        })
        var boardcount = currentRec.getSublistValue({
            sublistId : sublistId,
            fieldId : 'custpage_pallet',
            line : currentRec.getCurrentSublistIndex({
                sublistId : sublistId
            })
        })
        
        currentRec.setValue({
            fieldId : 'custpage_boxcount',
            value : operation[checked ? 'add' : 'sub' ](currentRec.getValue('custpage_boxcount') || 0,boxcount || 0)
        })

        currentRec.setValue({
            fieldId : 'custpage_boardcount',
            value : operation[checked ? 'add' : 'sub' ](currentRec.getValue('custpage_boardcount') || 0,boardcount || 0)
        })
    }

    function turnPage(params){
        if(params.disposetype === '2') setCheckCache()

        location.href = url.resolveScript({
            scriptId : 'customscript_sales_planing',
            deploymentId : 'customdeploy_sales_planing',
            params : util.extend(searchParams(),{
                action : 'search',
                pagetype : 'turnpage',
                currPage : params.currPage,
                pageSize : params.pageSize
            })
        })
    }

    function setCheckCache(){
        var checkCache = undefined
        var lineCount = currentRec.getLineCount({
            sublistId : sublistId
        })
        var cacheId = currentRec.getValue('custpage_cacheid')

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
         
        var checkInfo = checkCache ? JSON.parse(checkCache) : new Object()

        for(var i = 0 ; i < lineCount ; i ++)
        {
            checkInfo[currentRec.getSublistValue({
                sublistId : sublistId,
                fieldId : 'custpage_planing',
                line : i
            })] = currentRec.getSublistText({
                sublistId : sublistId,
                fieldId : 'custpage_check',
                line : i
            })
        }

        record.submitFields({
            type : 'customrecord_cache_record',
            id : cacheId,
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
        if(currentRec.getValue('custpage_disposetype') === '2')
        {
            if(!currentRec.getValue('custpage_ordertype'))
            {
                alert('请输入值：订单类型')
                return false
            }

            if(!currentRec.getValue('custpage_currency'))
            {
                alert('请输入值：货币')
                return false
            }
    
            if(!currentRec.getValue('custpage_customer'))
            {
                alert('请输入值：客户')
                return false
            }
         }
  

        if(!currentRec.getValue('custpage_subsidiary'))
        {
            alert('请输入值：子公司')
            return false
        }

        if(currentRec.getValue('custpage_isintercompany'))
        {
            if(!currentRec.getValue('custpage_endcustomer'))
            {
                alert('请输入值：最终客户')
                return false
            }
        }
        
        return true
    }

    function searchLines(pageSize){
        if (!volidMandatory()) return false

        location.href = url.resolveScript({
            scriptId : 'customscript_sales_planing',
            deploymentId : 'customdeploy_sales_planing',
            params : util.extend(searchParams(),{
                action : 'search',
                pagetype : 'create',
                pageSize : pageSize || ''
            })
        })
    }

    function searchParams(){
        return {
            item : currentRec.getValue('custpage_item'),
            title : currentRec.getValue('custpage_title'),
            cacheid : currentRec.getValue('custpage_cacheid'),
            currency : currentRec.getValue('custpage_currency'),
            trandate : currentRec.getText('custpage_trandate'),
            emoloyee : currentRec.getValue('custpage_emoloyee'),
            customer : currentRec.getValue('custpage_customer'),
            ordertype : currentRec.getValue('custpage_ordertype'),
            dateclose : currentRec.getText('custpage_dateclose'),     
            subsidiary : currentRec.getValue('custpage_subsidiary'), 
            salesorder : currentRec.getValue('custpage_salesorder'),
            endcustomer : currentRec.getValue('custpage_endcustomer'),
            disposetype : currentRec.getValue('custpage_disposetype'),
            deliverydatend : currentRec.getText('custpage_deliverydatend'),
            deliverydatestar : currentRec.getText('custpage_deliverydatestar'), 
            isintercompany : currentRec.getText('custpage_isintercompany')
        }
    }
    

    return {
        pageInit : pageInit,
        saveRecord : saveRecord,
        searchLines : searchLines,
        fieldChanged : fieldChanged,
    }
});

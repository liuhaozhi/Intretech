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
    'N/currentRecord'
], function(url , util , search , record , message , currentRecord 
) {
    var currentRec= undefined
    var allFields = {
        cacheid : 'custpage_cacheid',
        receipt : 'custpage_receipt',  
        invoice : 'custpage_invoice',
        currpage : 'custpage_currpage',
        pagesize : 'custpage_pagesize',
        currency : 'custpage_currency',
        emoloyee : 'custpage_emoloyee',
        printype : 'custpage_printype',
        customer : 'custpage_customer',
        trandate : 'custpage_trandate',
        outputype : 'custpage_outputype',
        dateclose : 'custpage_dateclose',
        samegoods : 'custpage_samegoods',
        sublistId : 'custpage_lines',
        boxnumber : 'custpage_boxnumber',
        salesorder : 'custpage_salesorder',
        subsidiary : 'custpage_subsidiary',
        invoicentry : 'custpage_invoicentry',
        currquantity : 'custpage_currquantity',
        abbprovequantity : 'custpage_abbprovequantity'
    }

    function pageInit(context) {
        console.log('pageinit')
        initMessage()
        formOptimize()
        setCurrentRec()
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

    function setCurrentRec(){
        window.currentRec = currentRec = currentRecord.get() 
    }

    function formOptimize(){
        jQuery('#custpage_lines_div').css({
            maxHeight : '500px',
            overflow : 'auto'
        })
        window.onbeforeunload = function(){}
    }

    function saveRecord(context) {
        if(currentRec.getValue(allFields.outputype) === '2')
        {
            if(!currentRec.getValue(allFields.invoice) && !currentRec.getValue(allFields.invoicentry))
            {
                alert('请输入值：发票号')
                return false
            }
        }

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

        if(context.fieldId === allFields.invoice)
        {
            disabledField(currentRec.getValue(context.fieldId),allFields.invoicentry)
        }

        if(context.fieldId === allFields.invoicentry)
        {
            disabledField(currentRec.getValue(context.fieldId),allFields.invoice)
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
        }

        if(context.fieldId === allFields.customer)
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

    function disabledField(value,fieldId){
        if(value)
        {
            currentRec.getField({
                fieldId : fieldId
            }).isDisabled = true
        }
        else
        {
            currentRec.getField({
                fieldId : fieldId
            }).isDisabled = false
        }
    }

    function turnPage(params){
        setCheckCache()

        location.href = url.resolveScript({
            scriptId : 'customscript_invoice_consolidation',
            deploymentId : 'customdeploy_invoice_consolidation',
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
                invnumber :  currentRec.getSublistText({
                    sublistId : allFields.sublistId,
                    fieldId : 'custpage_invnumber',
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

        if(!currentRec.getValue(allFields.customer))
        {
            alert('请输入值：客户')
            return false
        }

        if(!currentRec.getValue(allFields.currency))
        {
            alert('请输入值：货币')
            return false
        }

        if(!currentRec.getValue(allFields.printype))
        {
            alert('请输入值：打印类型')
            return false
        }

        if(!currentRec.getValue(allFields.outputype))
        {
            alert('请输入值：输出类型')
            return false
        }

        return true
    }

    function searchLines(pageSize){
        if (!volidMandatory()) return false

        location.href = url.resolveScript({
            scriptId : 'customscript_invoice_consolidation',
            deploymentId : 'customdeploy_invoice_consolidation',
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
            receipt : currentRec.getValue(allFields.receipt),  
            invoice : currentRec.getValue(allFields.invoice),
            pageSize : currentRec.getValue(allFields.pagesize),
            currency : currentRec.getValue(allFields.currency),
            emoloyee : currentRec.getValue(allFields.emoloyee),
            printype : currentRec.getValue(allFields.printype),
            customer : currentRec.getValue(allFields.customer),
            trandate : currentRec.getText(allFields.trandate),
            outputype : currentRec.getValue(allFields.outputype),
            dateclose : currentRec.getText(allFields.dateclose),
            samegoods : currentRec.getText(allFields.samegoods),
            sublistId : currentRec.getValue(allFields.sublistId),
            boxnumber : currentRec.getValue(allFields.boxnumber),
            salesorder : currentRec.getValue(allFields.salesorder),
            subsidiary : currentRec.getValue(allFields.subsidiary),
            invoicentry : currentRec.getValue(allFields.invoicentry)
        }
    }
    

    return {
        pageInit : pageInit,
        saveRecord : saveRecord,
        searchLines : searchLines,
        fieldChanged : fieldChanged
    }
});

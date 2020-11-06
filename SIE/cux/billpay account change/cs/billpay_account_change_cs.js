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
    'N/runtime',
    'N/ui/dialog',
    'N/ui/message',
    'N/currentRecord',
    '../../helper/operation_assistant'
], function(url , util , https , search , record , runtime , dialog , message , currentRecord , operation
) {
    var sublistId = 'custpage_lines'
    var currentRec = undefined

    function pageInit(context) {
        console.log('pageinit')
        formOptimize()
        setCurrentRec()
        bindButtonEvent()
    }

    function bindButtonEvent(){
        jQuery('#custpage_linesmarkall').on('click',function(e){
            var lineCount = currentRec.getLineCount({
                sublistId : sublistId
            })
    
            while(lineCount > 0)
            {
                if(currentRec.getSublistField({
                    sublistId : sublistId,
                    fieldId : 'custpage_check',
                    line : --lineCount
                }).isDisabled === true){
                    currentRec.selectLine({
                        sublistId : sublistId,
                        line : lineCount,
                    })

                    currentRec.setCurrentSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custpage_check',
                        value : false
                    })

                }
            }
        })
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
        var hasSelect = volidLineCheck()

        if(!hasSelect) return hasSelect

        var response = https.post({
            url : url.resolveScript({
                scriptId : 'customscript_billpay_account_change_rs',
                deploymentId : 'customdeploy_billpay_account_change_rs'
            }),
            body : {
                action : 'changeAccount',
                checkInfo : getCheckCache()
            }
        })

        try{
            body = JSON.parse(response.body)

            if(body.status === 'sucess'){
                if(!body.errorLists.length){
                    dialog.alert({title : '处理完成，点击OK以刷新页面' , message : body.message})
                    .then(function(result){
                        searchLines(currentRec.getValue('custpage_pagesize'))
                    })
                }else{
                    dialog.alert({title : '处理完成，部分错误,点击OK以刷新页面' , message : errMessage(body.errorLists)})
                    .then(function(result){
                        searchLines(currentRec.getValue('custpage_pagesize'))
                    })
                }
            }else{
                dialog.alert({title : '错误提示' , message : body.details})
            }
        }catch(e){
            dialog.alert({title : '错误提示' , message : e.message})
        }

        console.log(body)

        return false
    }

    function errMessage(errorLists){
        var errorMsg = new String()

        errorLists.map(function(item){
            errorMsg += ('单号:' + item.tranid + '处理失败；错误信息：' + item.message + '</br>')
        })

        return errorMsg
    }

    function volidLineCheck(){
        var hasChecked= false
        var lineCount = currentRec.getLineCount({
            sublistId : sublistId
        })

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

        if(!hasChecked) alert('您没有选择任何一行')

        return hasChecked
    }

    function fieldChanged(context) {
        var fieldId = context.fieldId
        if(fieldId === 'custpage_currpage')
        turnPage({
            currPage : currentRec.getValue('custpage_currpage'),
            pageSize : currentRec.getValue('custpage_pagesize')
        })
        
        if(fieldId === 'custpage_pagesize')
        searchLines(currentRec.getValue('custpage_pagesize'))
        
        if(fieldId !== 'custpage_check')
        currentRec.setCurrentSublistValue({
            sublistId : sublistId,
            fieldId : 'custpage_check',
            value : true
        })
    }

    function turnPage(params){
        setCheckCache()

        location.href = url.resolveScript({
            scriptId : 'customscript_billpay_account_change_ui',
            deploymentId : 'customdeploy_billpay_account_change_ui',
            params : util.extend(searchParams(),{
                action : 'search',
                pagetype : 'turnpage',
                currPage : params.currPage,
                pageSize : params.pageSize
            })
        })
    }

    function getCheckCache(){
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
         
        var checkInfo = checkCache ? JSON.parse(checkCache) : Object.create(null)

        for(var i = 0 ; i < lineCount ; i ++)
        {
            checkInfo[currentRec.getSublistValue({
                sublistId : sublistId,
                fieldId : 'custpage_transid',
                line : i
            })] = {
                check : currentRec.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custpage_check',
                    line : i
                }),
                account : currentRec.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custpage_account',
                    line : i
                }),
                transidtext : currentRec.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custpage_transidtext',
                    line : i
                })
            } 
        }

        return checkInfo
    }

    function setCheckCache(){
        var checkInfo = getCheckCache()

        record.submitFields({
            type : 'customrecord_cache_record',
            id : currentRec.getValue('custpage_cacheid'),
            values : {
                custrecord_salesorder_cache : JSON.stringify(checkInfo)
            }
        })
    }

    function volidMandatory(){
        if(!currentRec.getValue('custpage_subsidiary'))
        {
            alert('请输入值：子公司')
            return false
        }

        return true
    }

    function searchLines(pageSize){
        if (!volidMandatory()) return false

        location.href = url.resolveScript({
            scriptId : 'customscript_billpay_account_change_ui',
            deploymentId : 'customdeploy_billpay_account_change_ui',
            params : util.extend(searchParams(),{
                action : 'search',
                pagetype : 'create',
                pageSize : pageSize || ''
            })
        })
    }

    function searchParams(){
        return {
            payee : currentRec.getValue('custpage_payee'),  
            cacheid : currentRec.getValue('custpage_cacheid'),   
            currency : currentRec.getValue('custpage_currency'), 
            employee : currentRec.getValue('custpage_employee'),  
            trandatend : currentRec.getText('custpage_trandatend'),  
            subsidiary : currentRec.getValue('custpage_subsidiary'),  
            transaction : currentRec.getText('custpage_transaction'),  
            cachefields : currentRec.getValue('custpage_cachefields'), 
            trandatestar : currentRec.getText('custpage_trandatestar')  
        }
    }
    
    return {
        pageInit : pageInit,
        saveRecord : saveRecord,
        searchLines : searchLines,
        fieldChanged : fieldChanged
    }
});

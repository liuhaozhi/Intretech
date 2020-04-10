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
    var sublistId = 'custpage_lines'
    var currentRec = undefined

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
        message.create({
            title : '已完成！' , 
            type :  message.Type.CONFIRMATION , 
            message : '处理完成！'
        }).show()
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

    function saveRecord() {
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

        if(!hasChecked) alert('您没有选择任何一个物料')

        return hasChecked
    }

    function fieldChanged(context) {
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
    }


    function turnPage(params){
        setCheckCache()

        location.href = url.resolveScript({
            scriptId : 'customscript_approve_planing_sl',
            deploymentId : 'customdeploy_approve_planing_sl',
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

    function currentSublistCheck(){
        var checkInfo = new Object()
        var lineCount = currentRec.getLineCount({
            sublistId : sublistId
        })

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

        return checkInfo
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
            scriptId : 'customscript_approve_planing_sl',
            deploymentId : 'customdeploy_approve_planing_sl',
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
            cacheid : currentRec.getValue('custpage_cacheid'),  
            apptype : currentRec.getValue('custpage_apptype'),  
            subsidiary : currentRec.getValue('custpage_subsidiary'), 
            salesorder : currentRec.getValue('custpage_salesorder'),
            deliverydatend : currentRec.getText('custpage_deliverydatend'),
            deliverydatestar : currentRec.getText('custpage_deliverydatestar')
        }
    }
    
    function ratifyPlan(){ //批准
        if(!saveRecord())
        return false

        message.create({
            title : '处理中！' , 
            type :  message.Type.CONFIRMATION , 
            message : '请稍后。。。'
        }).show()

        https.get.promise({
            url : url.resolveScript({
                scriptId : 'customscript_approval_plan_response',
                deploymentId : 'customdeploy_approval_plan_response',
                params : {
                    action : 'ratify',
                    cacheid : currentRec.getValue('custpage_cacheid'),  
                    checked : JSON.stringify(currentSublistCheck())
                } 
            })
        })
        .then(function(res){
            if(res.body === 'sucess')
            location.href = location.href + '&status=sucess'
        })
        .catch(function(e){
            alert(e.message)
            console.log(e)
        })
    }

    function refusePlan(){ //拒绝
        if(!saveRecord())
        return false
        
        message.create({
            title : '处理中！' , 
            type :  message.Type.CONFIRMATION , 
            message : '请稍后。。。'
        }).show()

        https.get.promise({
            url : url.resolveScript({
                scriptId : 'customscript_approval_plan_response',
                deploymentId : 'customdeploy_approval_plan_response',
                params : {
                    action : 'refuse',
                    cacheid : currentRec.getValue('custpage_cacheid'),  
                    checked : JSON.stringify(currentSublistCheck())
                } 
            })
        })
        .then(function(res){
            if(res.body === 'sucess')
            location.href = location.href + '&status=sucess'
        })
        .catch(function(e){
            alert(e.message)
            console.log(e)
        })
    }

    return {
        pageInit : pageInit,
        ratifyPlan : ratifyPlan,
        refusePlan : refusePlan,
        searchLines : searchLines,
        fieldChanged : fieldChanged,
    }
});

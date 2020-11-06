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
        initMessage()
        formOptimize()
        setCurrentRec()
        disabledFields()
        bindButtonEvent()
    }

    function disabledFields(){
        var userRole  = runtime.getCurrentUser().role
        var lineCount = currentRec.getLineCount({
            sublistId : sublistId
        })

        while(lineCount > 0)
        {
            currentRec.getSublistField({
                sublistId : sublistId,
                fieldId : 'custpage_check',
                line : --lineCount
            }).isDisabled = 
                    userRole.toString() !== currentRec.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custpage_role',
                        line : lineCount
            }) && AP11112(userRole,lineCount)
        }
    }

    function AP11112(userRole,lineCount){
        var appEmp = currentRec.getSublistValue({
            sublistId : sublistId,
            fieldId : 'custpage_custbody_nextapproval_1firstname',
            line : lineCount
        })

        if(userRole.toString() === '1112' &&  appEmp !== ' ')
        return true

        if(userRole.toString() !== '1112')
        return true

        return false
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
                        line : lineCount
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

        // if(params.status === 'sucess')
        // message.create({
        //     title : '任务已提交处理！' , 
        //     type :  message.Type.CONFIRMATION , 
        //     message : '您可以去溜达溜达，任务完成后会发送邮件通知您，记得刷新邮箱哦！'
        // }).show({ duration : 6000 })
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
        var fieldId = context.fieldId
        if(fieldId === 'custpage_currpage')
        {
            turnPage({
                currPage : currentRec.getValue('custpage_currpage'),
                pageSize : currentRec.getValue('custpage_pagesize'),
                disposetype : currentRec.getValue('custpage_disposetype')
            })
        }

        if(fieldId === 'custpage_pagesize')
        {
            searchLines(currentRec.getValue('custpage_pagesize'))
        }

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
            scriptId : 'customscript_approve_estimatechange',
            deploymentId : 'customdeploy_approve_estimatechange',
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
         
        var checkInfo = checkCache ? JSON.parse(checkCache) : new Object()

        for(var i = 0 ; i < lineCount ; i ++)
        {
            checkInfo[currentRec.getSublistValue({
                sublistId : sublistId,
                fieldId : 'custpage_internalid',
                line : i
            })] = {check : currentRec.getSublistText({
                sublistId : sublistId,
                fieldId : 'custpage_check',
                line : i
            }) , nexts : currentRec.getSublistText({
                sublistId : sublistId,
                fieldId : 'custpage_nexts',
                line : i
            })}
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
            scriptId : 'customscript_approve_estimatechange',
            deploymentId : 'customdeploy_approve_estimatechange',
            params : util.extend(searchParams(),{
                action : 'search',
                pagetype : 'create',
                pageSize : pageSize || ''
            })
        })
    }

    function searchParams(){
        return {
            creater : currentRec.getValue('custpage_creater'),
            ordtype : currentRec.getValue('custpage_ordtype'),  
            cacheid : currentRec.getValue('custpage_cacheid'),  
            director : currentRec.getValue('custpage_director'),  
            customer : currentRec.getValue('custpage_customer'),  
            employee : currentRec.getValue('custpage_employee'),  
            estimate : currentRec.getValue('custpage_estimate'),  
            interitem : JSON.stringify(currentRec.getValue('custpage_interitem')),  
            isapprove : currentRec.getValue('custpage_isapprove'),
            changetype : currentRec.getValue('custpage_changetype'),
            department : currentRec.getValue('custpage_department'),  
            trandatend : currentRec.getText('custpage_trandatend'),  
            subsidiary : currentRec.getValue('custpage_subsidiary'), 
            endcustomer : currentRec.getValue('custpage_endcustomer'),  
            customerord : currentRec.getValue('custpage_customerord'),  
            customeritem : JSON.stringify(currentRec.getValue('custpage_customeritem')),  
            trandatestar : currentRec.getText('custpage_trandatestar'),  
            deliverydatend : currentRec.getText('custpage_deliverydatend'),  
            deliverydatestar : currentRec.getText('custpage_deliverydatestar'),  
        }
    }

    function ratifyPlan(){ //批准
        if(!saveRecord())
        return false

        message.create({
            title : '处理中！' , 
            type :  message.Type.INFORMATION , 
            message : '请稍后。。。'
        }).show()

        https.post.promise({
            url : url.resolveScript({
                scriptId : 'customscript_estimatechange_approve',
                deploymentId : 'customdeploy_estimatechange_approve'
            }),
            body : {
                action : 'ratify',
                cacheid : currentRec.getValue('custpage_cacheid'),
                checked : JSON.stringify(getCheckCache())
            } 
        })
        .then(function(res){
            var body = JSON.parse(res.body)

            if(body.errorMsg.length)
            {
                dialog.alert({
                    title: "error msg",
                    message: '本次共处理' + body.count + '条，失败' + body.errorMsg.length + '条,明细：</br>' + body.errorMsg.join('</br>')
                })
                .then(function(){
                    location.href = location.href + '&status=sucess'
                })
            }
            else
            {
                location.href = location.href + '&status=sucess'
            }
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
            type :  message.Type.INFORMATION , 
            message : '请稍后。。。'
        }).show()

        https.post.promise({
            url : url.resolveScript({
                scriptId : 'customscript_estimatechange_approve',
                deploymentId : 'customdeploy_estimatechange_approve'
            }),
            body : {
                action : 'refuse',
                cacheid : currentRec.getValue('custpage_cacheid'),  
                checked : JSON.stringify(getCheckCache())
            } 
        })
        .then(function(res){
            var body = JSON.parse(res.body)

            if(body.errorMsg.length)
            {
                dialog.alert({
                    title: "error msg",
                    message: '本次共处理' + body.count + '条，失败' + body.errorMsg.length + '条,明细：</br>' + body.errorMsg.join('</br>')
                })
                .then(function(){
                    location.href = location.href + '&status=sucess'
                })
            }
            else
            {
                location.href = location.href + '&status=sucess'
            }
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

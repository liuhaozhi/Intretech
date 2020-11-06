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
        disbledFields()
        bindButtonEvent()
    }

    function disbledFields(){
        if(currentRec){
            var lineCount = currentRec.getLineCount({
                sublistId : sublistId
            })
            var changeType = currentRec.getValue({fieldId : 'custpage_changetype'})

            while(lineCount > 0){
                var status = currentRec.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custpage_custbody_order_status',
                    line : --lineCount
                })

                if(changeType === '2'){
                    var closed = currentRec.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custpage_custbody_closed',
                        line : lineCount
                    })

                    if(closed){
                        currentRec.getSublistField({
                            sublistId : sublistId,
                            fieldId : 'custpage_custbody_closed',
                            line : lineCount
                        }).isDisabled = true
                    }
                }else{
                    var closed = currentRec.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custpage_custcol_close_manually',
                        line : lineCount
                    })

                    if(closed){
                        currentRec.getSublistField({
                            sublistId : sublistId,
                            fieldId : 'custpage_custcol_close_manually',
                            line : lineCount
                        }).isDisabled = true
                    }
                }

                if(changeType === '2'){
                    currentRec.getSublistField({
                        sublistId : sublistId,
                        fieldId : 'custpage_custbody_cancelled',
                        line : lineCount
                    }).isDisabled = status !== '1'
                }

                if(status === '2' || status === '1'){
                    if(changeType === '1'){
                        currentRec.getSublistField({
                            sublistId : sublistId,
                            fieldId : 'custpage_custcol_if_frozen',
                            line : lineCount
                        }).isDisabled = true
        
                        currentRec.getSublistField({
                            sublistId : sublistId,
                            fieldId : 'custpage_custcol_close_manually',
                            line : lineCount
                        }).isDisabled = true
                    }
                    
                    if(changeType === '2'){
                        currentRec.getSublistField({
                            sublistId : sublistId,
                            fieldId : 'custpage_custbody_isit_frozen',
                            line : lineCount
                        }).isDisabled = true
        
                        currentRec.getSublistField({
                            sublistId : sublistId,
                            fieldId : 'custpage_custbody_closed',
                            line : lineCount
                        }).isDisabled = true
                    }
                }else{
                    if(changeType === '1'){
                        var closed = currentRec.getSublistValue({
                            sublistId : sublistId,
                            fieldId : 'custpage_custcol_close_manually',
                            line : lineCount
                        })

                        currentRec.getSublistField({
                            sublistId : sublistId,
                            fieldId : 'custpage_custcol_if_frozen',
                            line : lineCount
                        }).isDisabled = status !== '3'
        
                        if(!closed)
                        currentRec.getSublistField({
                            sublistId : sublistId,
                            fieldId : 'custpage_custcol_close_manually',
                            line : lineCount
                        }).isDisabled = status !== '3'
                    }
                    
                    if(changeType === '2'){
                        var closed = currentRec.getSublistValue({
                            sublistId : sublistId,
                            fieldId : 'custpage_custbody_closed',
                            line : lineCount
                        })

                        currentRec.getSublistField({
                            sublistId : sublistId,
                            fieldId : 'custpage_custbody_cancelled',
                            line : lineCount
                        }).isDisabled = status === '3'
    
                        currentRec.getSublistField({
                            sublistId : sublistId,
                            fieldId : 'custpage_custbody_isit_frozen',
                            line : lineCount
                        }).isDisabled = status !== '3'
        
                        if(!closed)
                        currentRec.getSublistField({
                            sublistId : sublistId,
                            fieldId : 'custpage_custbody_closed',
                            line : lineCount
                        }).isDisabled = status !== '3'
                    }
                }
            }
        }
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

        if(params.status === 'sucess')
        message.create({
            title : '任务已提交处理！' , 
            type :  message.Type.CONFIRMATION , 
            message : '您可以去溜达溜达，任务完成后会发送邮件通知您，记得刷新邮箱哦！'
        }).show({ duration : 6000 })
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

        if(fieldId === 'custpage_custcol_if_frozen')
        {
            var newVal = currentRec.getCurrentSublistValue({
                sublistId : sublistId,
                fieldId : fieldId
            })

            var frDate = currentRec.getCurrentSublistValue({
                sublistId : sublistId,
                fieldId : 'custpage_custcol_freezing_date'
            })

            if(newVal){
                if(!frDate){
                    currentRec.setCurrentSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custpage_custcol_freezing_date',
                        value : new Date()
                    })
                }
            }

            if(!newVal){
                if(frDate){
                    currentRec.setCurrentSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custpage_custcol_unfreezing',
                        value : new Date()
                    })
                }
            }
        }

        if(fieldId === 'custpage_custcol_close_manually'){
            var newVal = currentRec.getCurrentSublistValue({
                sublistId : sublistId,
                fieldId : fieldId
            })

            if(newVal){
                currentRec.setCurrentSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custpage_custcol_close_date',
                    value : new Date()
                })
            }
        }

        if(fieldId === 'custpage_custbody_isit_frozen'){
            var newVal = currentRec.getCurrentSublistValue({
                sublistId : sublistId,
                fieldId : fieldId
            })

            var frDate = currentRec.getCurrentSublistValue({
                sublistId : sublistId,
                fieldId : 'custpage_custbody_suspense_date'
            })

            if(newVal){
                if(!frDate){
                    currentRec.setCurrentSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custpage_custbody_suspense_date',
                        value : new Date()
                    })
                }
            }

            if(!newVal){
                if(frDate){
                    currentRec.setCurrentSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custpage_custbody_back_suspense_date',
                        value : new Date()
                    })
                }
            }
        }

        if(fieldId === 'custpage_custbody_closed'){
            var newVal = currentRec.getCurrentSublistValue({
                sublistId : sublistId,
                fieldId : fieldId
            })

            if(newVal){
                currentRec.setCurrentSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custpage_custbody_closing_date',
                    value : new Date()
                })
            }
        }
    }

    function turnPage(params){
        setCheckCache()

        location.href = url.resolveScript({
            scriptId : 'customscript_estimate_change',
            deploymentId : 'customdeploy_estimate_change',
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
        var changetype= currentRec.getValue('custpage_changetype')
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
            var key = changetype === '1' ? currentRec.getSublistValue({
                sublistId : sublistId,
                fieldId : 'custpage_custcol_plan_number',
                line : i
            }) : currentRec.getSublistValue({
                sublistId : sublistId,
                fieldId : 'custpage_ordid',
                line : i
            })

            var itemSublist = getSublistFields(i)

            checkInfo[key] = Object.assign({checked : currentRec.getSublistValue({
                sublistId : sublistId,
                fieldId : 'custpage_check',
                line : i
            })} , itemSublist)
        }

        return checkInfo
    }

    function getSublistFields(line){
        var lineItems = Object.create(null)
        var cacheFields = JSON.parse(currentRec.getValue('custpage_cachefields'))

        cacheFields.map(function(item){
            return lineItems[item] =  currentRec.getSublistValue({
                sublistId : sublistId,
                fieldId : 'custpage_' + item,
                line : line
            })
        })

        return lineItems
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
            scriptId : 'customscript_estimate_change',
            deploymentId : 'customdeploy_estimate_change',
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
    
    return {
        pageInit : pageInit,
        saveRecord : saveRecord,
        searchLines : searchLines,
        fieldChanged : fieldChanged
    }
});

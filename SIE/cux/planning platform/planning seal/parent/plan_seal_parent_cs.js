/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

define([
    'N/search',
    '../../../helper/operation_assistant'
], function(search,assistant) {
    var mode = undefined
    var maxIndex = 0
    var linePrefix = undefined

    function pageInit(context){
        console.log(1)
        mode = context.mode
        linePrefix = context.currentRecord.getValue({
            fieldId : 'custrecord_s_custcol_line'
        }) + '.'

        if(mode === 'edit')
        {  
            maxIndex = maxLine(context.currentRecord) || 0
        }

        bindEvents()
    }

    function bindEvents(){
        window.onbeforeunload = function(){}

        window.onunload = function(){
            var params = getParams(location.href)

            if(params.index)
            {
                var parentNode = window.opener.jQuery('.openChild')[params.index]
                jQuery(parentNode)
                .parent('td:first')
                .css({backgroundColor : "#FFFFFF"})
                .end()
                .parent('td:first').siblings()
                .css({backgroundColor : "#FFFFFF"})
            }
        }
    }

    function maxLine(currentRecord){
        var countArr = new Array()
        var count = currentRecord.getLineCount({
            sublistId : 'recmachcustrecord_l_link'
        })

        for(var i = 0 ; i < count ; i ++)
        {
            countArr.push(+(currentRecord.getSublistValue({
                sublistId : 'recmachcustrecord_l_link',
                fieldId : 'custrecord_l_custcol_line',
                line : i
            }).replace(linePrefix , '')))
        }

        countArr.sort(function(a,b){
            return a - b
        })

        return countArr[countArr.length - 1]
    }

    function setLineNoInfo(currentRecord){
        currentRecord.setCurrentSublistValue({
            sublistId : 'recmachcustrecord_l_link',
            fieldId : 'custrecord_l_custcol_line',
            value : linePrefix + ++maxIndex
        })
    }

    function validateLine(context) {
        var currentRec = context.currentRecord
        
        if(!currentRec.getCurrentSublistValue({
            sublistId : 'recmachcustrecord_l_link',
            fieldId : 'custrecord_l_expectedshipdate'
            
        }))
        return false

        var canSave = validQuantity({
            currentRec : currentRec,
            lineCount : currentRec.getLineCount({
                sublistId : 'recmachcustrecord_l_link'
            }),
            currIndex : currentRec.getCurrentSublistIndex({
                sublistId : 'recmachcustrecord_l_link'
            }),
            available : +currentRec.getValue({
                fieldId : 'custrecord_s_quantity'
            }),
            currQuantity : +currentRec.getCurrentSublistValue({
                sublistId : 'recmachcustrecord_l_link',
                fieldId : 'custrecord_l_quantity'
            })
        })

        if(canSave)
        {
            if(mode === 'create' || mode === 'edit')
            {
                if(!currentRec.getCurrentSublistValue({
                    sublistId : 'recmachcustrecord_l_link',
                    fieldId : 'custrecord_l_custcol_line'
                }))
                {
                    setLineNoInfo(currentRec)
                }
            }
        }

        return canSave
    }

    function validQuantity(params){
        var currentRec = params.currentRec
        var lineCount = params.lineCount
        var currIndex = params.currIndex
        var available = params.available
        var currQuantity = params.currQuantity

        if(currQuantity <= 0)
        {         
            alert('数量不可输入空值或0')
            return false
        }

        if(lineCount === currIndex) //新建
        {
            if(currQuantity >= available)
            {
                alert('拆行数量不能大于等于可拆数量')
                return false
            }

            currentRec.setValue({
                fieldId : 'custrecord_s_quantity',
                value : assistant.sub(available,currQuantity)
            })

            return true
        }
        else //修改
        {
            var oldQuantity = +currentRec.getSublistValue({
                sublistId : 'recmachcustrecord_l_link',
                fieldId : 'custrecord_l_quantity',
                line : currIndex
            })

            if(assistant.sub(currQuantity,oldQuantity) >= available)
            {
                alert('可拆数量不可小于等于0，请调整拆分数量')
                return false
            }

            currentRec.setValue({
                fieldId : 'custrecord_s_quantity',
                value : assistant.sub(available,assistant.sub(currQuantity,oldQuantity))
            })

            return true
        }
    }

    function validateDelete(context){
        var currentRec = context.currentRecord

        currentRec.setValue({
            fieldId : 'custrecord_s_quantity',
            value : assistant.add(currentRec.getValue({
                fieldId : 'custrecord_s_quantity'
            }),
            currentRec.getCurrentSublistValue({
                sublistId : 'recmachcustrecord_l_link',
                fieldId : 'custrecord_l_quantity'
            }))
        })
        return true
    }

    function validRecord(salesorder,line){
        var result = search.create({
            type : 'customrecord_planning_seal',
            filters : [
                ['custrecord_s_custcol_salesorder' , 'anyof' , [salesorder]],
                'AND',
                ['custrecord_s_custcol_line' , 'is' , line.slice(0,line.indexOf('.')) || line]
            ],
            columns : [
                'internalId'
            ]
        }).run().getRange({
            start : 0,
            end : 1000
        })

        return result.length > 0
    }

    function saveRecord(context){
        var currentRec = context.currentRecord
        if(mode === 'create'){
            if(validRecord(currentRec.getValue('custrecord_s_custcol_salesorder'),currentRec.getValue('custrecord_s_custcol_line')))
            throw('您已保存过此货品行的拆分记录，想要再次编辑此行拆分记录，请确保关闭所有与此行相关的拆分记录，重新打开操作')
        }
        setParentDetail(currentRec)
        return true
    }

    function getParams(href){
        var params  = {}

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

        return params
    }

    function setParentDetail(currentRec){
        var params = getParams(location.href)

        if(params.index)
        {
            var prentRec = window.opener.currentRec
            prentRec.selectLine({
                sublistId : 'custpage_lines',
                fieldId : 'custpage_detail',
                line : params.index
            })

            prentRec.setCurrentSublistValue({
                sublistId : 'custpage_lines',
                fieldId : 'custpage_quantity',
                value : currentRec.getValue('custrecord_s_quantity')
            })

            prentRec.setCurrentSublistValue({
                sublistId : 'custpage_lines',
                fieldId : 'custpage_detail',
                value : lineInfo(currentRec)
            })
        }
    }

    function lineInfo(currentRec){
        var details = new String()
        var sublistId = 'recmachcustrecord_l_link'
        var lineCount = currentRec.getLineCount({
            sublistId : sublistId
        })

        details += ('行号 ：' + currentRec.getValue({
            fieldId : 'custrecord_s_custcol_line'
        }) + ', 数量 ：' + currentRec.getValue({
            fieldId : 'custrecord_s_quantity'
        }) + ', 交期 : ' + currentRec.getText({
            fieldId : 'custrecord_s_expectedshipdate'
        }) + '\r\n')

        for(var i = 0 ; i < lineCount ; i ++)
        {
            details += ('行号 ：' + currentRec.getSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_l_custcol_line',
                line : i
            }) + ', 数量 ：' + currentRec.getSublistValue({
                sublistId : sublistId,
                fieldId : 'custrecord_l_quantity',
                line : i
            }) + ', 交期 : ' + currentRec.getSublistText({
                sublistId : sublistId,
                fieldId : 'custrecord_l_expectedshipdate',
                line : i
            }) + '\r\n')
        }

        return details
    }

    function lineInit(context){
        var currentRec = context.currentRecord
        var recordId   = currentRec.getCurrentSublistValue({
            sublistId : 'recmachcustrecord_l_link',
            fieldId : 'id',
        })

        if(recordId){
            var isShip = search.lookupFields({
                type : 'customrecord_shipping_plan',
                id : currentRec.getCurrentSublistValue({
                    sublistId : 'recmachcustrecord_l_link',
                    fieldId : 'id',
                }),
                columns : [
                    'custrecord_salesorder_shipped'
                ]
            }).custrecord_salesorder_shipped
    
            if(isShip){
                currentRec.commitLine({
                    sublistId : 'recmachcustrecord_l_link'
                })
            }
        }
    }

    return {
        lineInit : lineInit,
        pageInit : pageInit,
        saveRecord : saveRecord,
        validateLine : validateLine,
        validateDelete : validateDelete
    }
});

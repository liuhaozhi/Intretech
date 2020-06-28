/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/format',
    'N/search',
    'N/record',
    'N/redirect',
    '../../../helper/operation_assistant'
], function(
    format,
    search,
    record,
    redirect,
    operation
) {
    function beforeLoad(context) {
        if(context.type === context.UserEventType.VIEW)
        {
            closeWindow(context)
        }
        else
        {
            var params = getParams(context)

            if(params.fromrecord && params.index)
            {
                setDefaultFieldValueOrToRecord(params.fromrecord,context.newRecord,params.index)
            }
            else if(params.recordId)
            {
                var defaultFieldsInfo = search.lookupFields({
                    type : 'customrecord_shipping_plan',
                    id : params.recordId,
                    columns : [
                        'custrecord_p_item',
                        'custrecord_p_quantity',
                        'custrecord_p_custcol_line',
                        'custrecord_p_expectedshipdate',
                        'custrecord_p_custcol_salesorder'
                    ]
                })
    
                setDefaultFieldValue(context.newRecord,defaultFieldsInfo,params.recordId)
            }
            
            insertHackStyle(context)
            shrinkFieldsWidth(context.form)
            hiddenScriptIdField(context.form)
        }
    }

    function closeWindow(context){
        context.form.addField({
            type : 'inlinehtml',
            id : 'custpage_hackstyle',
            label : 'hackstyle'
        }).defaultValue = 
        '<script> window.close() </script>'   
    }

    function shrinkFieldsWidth(form){
        var displaySize = {
            width : 10,
            height : 10
        }
        form.getField({
            id : 'custrecord_s_quantity'
        }).updateDisplaySize(displaySize)

        form.getField({
            id : 'custrecord_s_former_quantity'
        }).updateDisplaySize(displaySize)

        form.getField({
            id : 'custrecord_s_expectedshipdate'
        }).updateDisplaySize(displaySize)
    }

    function insertHackStyle(context){
        context.form.addField({
            type : 'inlinehtml',
            id : 'custpage_hackstyle',
            label : 'hackstyle'
        }).defaultValue = 
        '<style>#recmachcustrecord_l_link_main_form,.uir-page-title-firstline{display:none}' +
        '#pageContainer{width : 425px!important} div#body{min-width : min-content!important}' +
        '.uir-list-row-tr td:nth-child(n+5),.uir-list-row-tr td:nth-last-child(n+5),.uir-page-title,' +
        '.uir-list-headerrow td:nth-child(n+5),.uir-list-headerrow td:nth-last-child(n+6){display:none}' +
        '.uir-listheader-button-table,#div__header,.uir-header-buttons{display:none} #pageContainer{margin-top:-90px}'+
        '#detail_table_lay td:nth-child(n+2){width:50%!important} #detail_table_lay td:first-child{width:0%!important}</style>'    
    }
 //#pageContainer   div#body

    function getParams(context){
        if(context.request)
        {
            if(context.request.parameters)
            {
                return {
                    index : context.request.parameters.index,
                    recordId : context.request.parameters.recordId,
                    fromrecord : context.request.parameters.fromrecord
                }
            }
        }  
    }

    function hiddenScriptIdField(form){
        var scriptIdField = form.getField({
            id : 'scriptid'
        })

        if(scriptIdField) scriptIdField.updateDisplayType({
            displayType : 'hidden'
        })
    }

    function setDefaultFieldValueOrToRecord(recordId,newRecord,index){
        var defaultFieldsInfo = search.lookupFields({
            type : 'customrecord_shipping_plan',
            id : recordId,
            columns : [
                'custrecord_p_item',
                'custrecord_p_quantity',
                'custrecord_p_custcol_line',
                'custrecord_p_expectedshipdate',
                'custrecord_p_custcol_salesorder'
            ]
        })

        var line = defaultFieldsInfo.custrecord_p_custcol_line
        var salesorder = defaultFieldsInfo.custrecord_p_custcol_salesorder[0].value

        planSealSearch(salesorder,line).each(function(res){
            redirect.toRecord({
                type : res.recordType,
                id : res.id,
                isEditMode : true,
                parameters: {index:index,recordId:recordId}
            })

            return true
        })

        setDefaultFieldValue(newRecord,defaultFieldsInfo,recordId)
    }

    function setDefaultFieldValue(newRecord,defaultFieldsInfo,recordId){
        newRecord.setValue({
            fieldId : 'custrecord_inv_source',
            value : recordId
        })

        newRecord.setValue({
            fieldId : 'custrecord_s_item',
            value : defaultFieldsInfo.custrecord_p_item[0].value
        })

        newRecord.setValue({
            fieldId : 'custrecord_s_custcol_salesorder',
            value : defaultFieldsInfo.custrecord_p_custcol_salesorder[0].value
        })

        newRecord.setValue({
            fieldId : 'custrecord_s_quantity',
            value : defaultFieldsInfo.custrecord_p_quantity
        })

        newRecord.setValue({
            fieldId : 'custrecord_s_custcol_line',
            value : defaultFieldsInfo.custrecord_p_custcol_line
        })

        newRecord.setValue({
            fieldId : 'custrecord_s_expectedshipdate',
            value : defaultFieldsInfo.custrecord_p_expectedshipdate
        })

        newRecord.setValue({
            fieldId : 'custrecord_s_former_quantity',
            value : defaultFieldsInfo.custrecord_p_quantity
        })
    }

    function planSealSearch(salesorder,line){
        return search.create({
            type : 'customrecord_planning_seal',
            filters : [
                ['custrecord_s_custcol_salesorder' , 'anyof' , [salesorder]],
                'AND',
                ['custrecord_s_custcol_line' , 'is' , line.slice(0,line.indexOf('.')) || line]
            ],
            columns : [
                'internalid'
            ]
        }).run()
    }

    function beforeSubmit(context){
        if(context.type === context.UserEventType.DELETE)
        throw '请勿尝试删除此项'

        if(!context.oldRecord)
        {
            validRecord(context)
        }
    }

    function validRecord(context){
        var result = planSealSearch(
            context.newRecord.getValue('custrecord_s_custcol_salesorder'),
            context.newRecord.getValue('custrecord_s_custcol_line')
        )
        .getRange({
            start : 0,
            end : 1000
        })

        if(result.length > 0)
        {
            throw('您已保存过此货品行的拆分记录，想要再次编辑此行拆分记录，请确保关闭所有与此行相关的拆分记录，重新打开操作')
        }
    }

    function afterSubmit(context){
        commitDetails(context)
    }

    function commitDetails(context){
        var newRecord = context.newRecord
        var oldRecord = context.oldRecord

        if(!oldRecord){
            var orderRecord = record.load({
                type : 'estimate',
                id : newRecord.getValue({
                    fieldId : 'custrecord_s_custcol_salesorder'
                })
            })

            var oldExpectedshipdate = search.lookupFields({
                type : 'customrecord_shipping_plan',
                id : newRecord.getValue('custrecord_inv_source'),
                columns : ['custrecord_p_expectedshipdate']
            }).custrecord_p_expectedshipdate
            oldExpectedshipdate = oldExpectedshipdate ? format.parse({type : format.Type.DATE , value : oldExpectedshipdate}) : false
            var newExpectedshipdate = newRecord.getValue('custrecord_s_expectedshipdate')
    
            if(oldExpectedshipdate.toString() !== newExpectedshipdate.toString())
            updateParentExpectedshipdate({
                orderRecord : orderRecord,
                source : newRecord.getValue('custrecord_inv_source'),
                lineNum : newRecord.getValue('custrecord_s_custcol_line'),
                newExpectedshipdate : newExpectedshipdate,
                oldExpectedshipdate : oldExpectedshipdate
            })

            addPlanRecord(orderRecord,context,null,true)

            try
            {
                orderRecord.save()
            }
            catch(e)
            {
                throw e.message
            }
        }  
        
        if(newRecord && oldRecord) editAndDeletePlanRecord(context)
    }

    function editAndDeletePlanRecord(context){
        var newRecord = record.load({
            type : context.newRecord.type,
            id : context.newRecord.id
        }) 
        var oldRecord = context.oldRecord
        var history   = modifyHistory()
        var newLines  = geiLineItems(newRecord)
        var oldLines  = geiLineItems(oldRecord)

        oldLines.map(function(oldline){
            var edit = false
            newLines.map(function(newLine,newIndex){
                if(newLine.line === oldline.line)
                {
                    if(newLine.expectedshipdate.getTime() !== oldline.expectedshipdate.getTime() || newLine.quantity !== oldline.quantity)
                    {       
                        if(newLine.expectedshipdate.getTime() !== oldline.expectedshipdate.getTime())
                        {
                            newLine.changeExpected = true
                            newLine.beforeExpected = oldline.expectedshipdate
                        }

                        history.edit.push(newLine) 
                    }

                    edit = true
                    newLines.splice(newIndex,1)
                }
            })

            if(!edit) history.delete.push(oldline)
        })

        history.add = history.add.concat(newLines)

        changeHistory(context,history)
    }

    function updateParentExpectedshipdate(params){
        if(params.source)
        record.submitFields({
            type : 'customrecord_shipping_plan',
            id : params.source,
            values : {
                custrecord_p_expectedshipdate : params.newExpectedshipdate
            }
        })

        var orderIndex = params.orderRecord.findSublistLineWithValue({
            sublistId : 'item',
            fieldId : 'custcol_line',
            value : params.lineNum
        })

        if(orderIndex > -1)
        {
            params.orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'expectedshipdate',
                line : orderIndex,
                value : params.newExpectedshipdate
            })

            if(!params.oldExpectedshipdate)
            {
                params.orderRecord.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_suggest_date',
                    line : orderIndex,
                    value : params.newExpectedshipdate
                })
            }
            else
            {
                params.orderRecord.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_before_date',
                    line : orderIndex,
                    value : params.oldExpectedshipdate
                })
            }
        }
    }

    function changeHistory(context,history){
        var newRecord = context.newRecord
        var oldRecord = context.oldRecord
        var orderRecord = record.load({
            type : 'estimate',
            id : newRecord.getValue({
                fieldId : 'custrecord_s_custcol_salesorder'
            })
        })
        var oldExpectedshipdate = oldRecord.getValue('custrecord_s_expectedshipdate')
        var newExpectedshipdate = newRecord.getValue('custrecord_s_expectedshipdate')

        if(oldExpectedshipdate.toString() !== newExpectedshipdate.toString())
        updateParentExpectedshipdate({
            orderRecord : orderRecord,
            source : newRecord.getValue('custrecord_inv_source'),
            lineNum : newRecord.getValue('custrecord_s_custcol_line'),
            newExpectedshipdate : newExpectedshipdate,
            oldExpectedshipdate : oldExpectedshipdate
        })

        try
        {
            if(history.add.length) addPlanRecord(orderRecord,context,history.add,false)
            if(history.edit.length) editPlanRecord(orderRecord,history.edit,newRecord,oldRecord)
            if(history.delete.length) deletePlanRecord(orderRecord,history.delete)
    
            orderRecord.save()
            updateParentRecordQuantity(newRecord)
        }
        catch(e)
        {
            throw e.message
        }
    }

    function updateParentRecordQuantity(newRecord){
        var fromrecord = newRecord.getValue('custrecord_inv_source')
        if(fromrecord)
        record.submitFields({
            type : 'customrecord_shipping_plan',
            id : fromrecord,
            values : {
                custrecord_p_quantity : newRecord.getValue('custrecord_s_quantity')
            }
        })
    }

    function modifyHistory(){
        return {
            add : new Array(),
            edit : new Array(),
            delete : new Array()
        }
    }

    function geiLineItems(currRecord){
        var items = new Array()
        var sublistId = 'recmachcustrecord_l_link'
        var lineCount = currRecord.getLineCount({
            sublistId : sublistId
        })

        for(var i = 0 ; i < lineCount ; i ++)
        {
            items.push({
                index : i,
                line : currRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_l_custcol_line',
                    line : i
                }),
                expectedshipdate : currRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_l_expectedshipdate',
                    line : i
                }),
                quantity : currRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_l_quantity',
                    line : i
                }),
                recordId : currRecord.getSublistValue({
                    sublistId : sublistId,
                    fieldId : 'id',
                    line : i
                })
            })
        }

        return items
    }

    function getRecordids(currenRecord){
        return currenRecord.map(function(item){
            return item.recordId
        })
    }

    function deletePlanRecord(orderRecord,deleteRecords){
        deleteRecords.map(function(item){
            var planRecord = record.load({
                type : 'customrecord_shipping_plan',
                id : item.recordId
            })

            var completionDate = planRecord.getValue({
                fieldId : 'custrecord_p_custcol_completion_date'
            })

            if(planRecord.getValue('custrecord_p_custcol_pick_id') !== '1')
            {
                if(completionDate)
                {
                    if(item.expectedshipdate.valueOf() > completionDate.valueOf())
                    {
                        record.delete({
                            type : 'customrecord_shipping_plan',
                            id : item.recordId
                        })

                        deleteOrderSublistLine(orderRecord,item)
                    }
                    else
                    {
                        planRecord.setValue({ //设置待审批
                            fieldId : 'custrecord_p_custcol_approval_status',
                            value : '1'
                        })

                        planRecord.setValue({ //
                            fieldId : 'custrecord_approval_type',
                            value : '3'
                        })

                        planRecord.save()
                    }
                }
                else
                {
                    record.delete({
                        type : 'customrecord_shipping_plan',
                        id : item.recordId
                    })

                    deleteOrderSublistLine(orderRecord,item)
                }
            }
        }) 
    }

    function editPlanRecord(orderRecord,editRecords,newRecord,oldRecord){
        search.create({
            type : 'customrecord_shipping_plan',
            filters : [
                ['internalid' , 'anyof' , getRecordids(editRecords)]
            ],
            columns : ['internalid']
        }).run().each(function(res){
            editRecords.filter(function(item,index){
                if(item.recordId == res.id)
                {
                    var planRecord = record.load({
                        type : res.recordType,
                        id : res.id,
                    })

                    var completionDate = planRecord.getValue({
                        fieldId : 'custrecord_p_custcol_completion_date'
                    })

                    var beforExpectedshipdate = planRecord.getText({
                        fieldId : 'custrecord_p_expectedshipdate'
                    })

                    planRecord.setValue({
                        fieldId : 'custrecord_p_quantity',
                        value : item.quantity,
                    })

                    planRecord.setValue({
                        fieldId : 'custrecord_p_custcol_line',
                        value : item.line,
                    })

                    planRecord.setValue({
                        fieldId : 'custrecord_p_expectedshipdate',
                        value : item.expectedshipdate,
                    })

                    if(item.changeExpected)
                    {
                        planRecord.setValue({
                            fieldId : 'custrecord_p_custcol_before_date',
                            value : item.beforeExpected
                        })
                    }

                    editRecords.splice(index,1)

                    if(planRecord.getValue('custrecord_p_custcol_pick_id') !== '1')
                    {
                        if(completionDate)
                        {
                            if(item.expectedshipdate.valueOf() > completionDate.valueOf())
                            {
                                planRecord.setValue({
                                    fieldId : 'custrecord_p_custcol_approval_status',
                                    value : ''
                                })

                                planRecord.setValue({ 
                                    fieldId : 'custrecord_approval_type',
                                    value : ''
                                })
                                
                                planRecord.setValue({
                                    fieldId : 'custrecord_cache_change',
                                    value : ''
                                })
                                editOrderSublistLine(orderRecord,item,newRecord,oldRecord)
                            }
                            else
                            {
                                planRecord.setValue({ //设置待审批
                                    fieldId : 'custrecord_p_custcol_approval_status',
                                    value : '1'
                                })

                                planRecord.setValue({ //设置待审批
                                    fieldId : 'custrecord_approval_type',
                                    value : '2'
                                })
                                
                                planRecord.setValue({ //设置缓存所需
                                    fieldId : 'custrecord_cache_change',
                                    value : JSON.stringify({
                                        oldQuantity :  oldRecord.getSublistValue({
                                            sublistId : 'recmachcustrecord_l_link',
                                            fieldId : 'custrecord_l_quantity',
                                            line : item.index
                                        }),
                                        beforExpectedshipdate : beforExpectedshipdate
                                    })
                                })
                            }
                        }
                        else
                        {
                            planRecord.setValue({
                                fieldId : 'custrecord_p_custcol_approval_status',
                                value : ''
                            })

                            planRecord.setValue({ 
                                fieldId : 'custrecord_approval_type',
                                value : ''
                            })
                            
                            planRecord.setValue({
                                fieldId : 'custrecord_cache_change',
                                value : ''
                            })
                            editOrderSublistLine(orderRecord,item,newRecord,oldRecord)
                        }
                    }

                    planRecord.save()
                    
                    return true
                }
            })
        })
    }

    function addPlanRecord(orderRecord,context,lineitems,updateParent){
        var planRecords = new Array()
        var newRecord = record.load({
            type : context.newRecord.type,
            id : context.newRecord.id
        }) 
        var lineItems = lineitems || geiLineItems(newRecord)
        var fromrecord = newRecord.getValue('custrecord_inv_source')

        if(lineItems.length)
        {
            if(fromrecord)
            {
                lineItems.map(function(item){
                    var copyRecord = record.copy({
                        type : 'customrecord_shipping_plan',
                        id : fromrecord
                    })
                    var completionDate = copyRecord.getValue({
                        fieldId : 'custrecord_p_custcol_completion_date' 
                    })
                    var beforExpectedshipdate = copyRecord.getText({
                        fieldId : 'custrecord_p_expectedshipdate' 
                    })
                    var parentQuantity = copyRecord.getValue({
                        fieldId : 'custrecord_p_quantity' 
                    })
                    var scale = operation.div(
                        item.quantity || 0,
                        parentQuantity
                    ).toFixed(2)
                    var planNumber = getPlanNumber(orderRecord,item)

                    copyRecord.setValue({
                        fieldId : 'custrecord_p_custcol_boxes_numbers',
                        value : Math.ceil(operation.mul(scale,copyRecord.getValue({ //箱数
                            fieldId : 'custrecord_p_custcol_boxes_numbers'
                        })))
                    })

                    copyRecord.setValue({ 
                        fieldId : 'custrecord_p_custcol_total_net_weight',
                        value : operation.mul(scale,copyRecord.getValue({ //总净重
                            fieldId : 'custrecord_p_custcol_total_net_weight'
                        }))
                    })

                    copyRecord.setValue({ 
                        fieldId : 'custrecord_p_custcol_total_gross_weight',
                        value : operation.mul(scale,copyRecord.getValue({ //总毛重
                            fieldId : 'custrecord_p_custcol_total_gross_weight'
                        }))
                    })

                    copyRecord.setValue({ 
                        fieldId : 'custrecord_p_custcol_total_cubic_number',
                        value : operation.mul(scale,copyRecord.getValue({ //总立方
                            fieldId : 'custrecord_p_custcol_total_cubic_number'
                        }))
                    })

                    copyRecord.setValue({ 
                        fieldId : 'custrecord_p_custcol_sup_total',
                        value : Math.ceil( operation.mul(scale,copyRecord.getValue({ //总托数
                            fieldId : 'custrecord_p_custcol_sup_total'
                        })))
                    })

                    copyRecord.setValue({
                        fieldId : 'custrecord_p_custcol_plan_number',
                        value : planNumber
                    })

                    copyRecord.setValue({
                        fieldId : 'custrecord_p_quantity',
                        value : item.quantity
                    })
    
                    copyRecord.setValue({
                        fieldId : 'custrecord_p_custcol_line',
                        value : item.line
                    })
    
                    copyRecord.setValue({
                        fieldId : 'custrecord_p_expectedshipdate',
                        value : item.expectedshipdate
                    })

                    copyRecord.setValue({
                        fieldId : 'custrecord_p_custcol_suggest_date',
                        value : item.expectedshipdate
                    })

                    if(copyRecord.getValue('custrecord_p_custcol_pick_id') !== '1')
                    {
                        if(completionDate)
                        {
                            if(item.expectedshipdate.valueOf() > completionDate.valueOf())
                            {
                                inseterOrderSublistLine(orderRecord,copyRecord,item)
                            }
                            else
                            {
                                copyRecord.setValue({ //设置待审批
                                    fieldId : 'custrecord_p_custcol_approval_status',
                                    value : '1'
                                })

                                copyRecord.setValue({
                                    fieldId : 'custrecord_approval_type',
                                    value : '1'
                                })
                                
                                copyRecord.setValue({ //设置缓存所需
                                    fieldId : 'custrecord_cache_change',
                                    value : JSON.stringify({
                                        fromrecord : fromrecord,
                                        beforExpectedshipdate : beforExpectedshipdate
                                    })
                                })
                            }
                        }
                        else
                        {
                            inseterOrderSublistLine(orderRecord,copyRecord,item)
                        }
                    }

                    planRecords.push({
                        index : item.index,
                        recordId : copyRecord.save()
                    })
                })
            }
        }

        updatePlanRecord(newRecord,planRecords,updateParent)
    }

    function editOrderSublistLine(orderRecord,item,newRecord,oldRecord){
        var line = orderRecord.findSublistLineWithValue({
            sublistId : 'item',
            fieldId : 'custcol_line',
            value : item.line
        })

        orderRecord.setValue({
            fieldId : 'custbody_planchange',
            value : true
        })

        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'quantity',
            line : line,
            value : item.quantity 
        })

        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'expectedshipdate',
            line : line,
            value : item.expectedshipdate
        })

        if(item.changeExpected)
        {
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_before_date',
                line : line,
                value : item.beforeExpected
            })
        }

        var oldQuantity = oldRecord.getSublistValue({
            sublistId : 'recmachcustrecord_l_link',
            fieldId : 'custrecord_l_quantity',
            line : item.index
        })

        if(oldQuantity !== item.quantity)
        {
            var parentIndex = orderRecord.findSublistLineWithValue({
                sublistId : 'item',
                fieldId : 'custcol_line',
                value : item.line.slice(0,item.line.indexOf('.'))
            })

            if(parentIndex > -1)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'quantity',
                line : parentIndex,
                value : operation.add(
                    orderRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'quantity',
                        line : parentIndex
                    }) ,
                    operation.sub(oldQuantity , item.quantity )
                )
            })
        }
    }

    function getPlanNumber(orderRecord,item){
        var prix = orderRecord.getValue('tranid')

        return prix.replace(/[0]{1,}/,'') + item.line.replace('.','-')
    }

    function inseterOrderSublistLine(orderRecord,copyRecord,item){
        var index = getInsetIndex(item.line,orderRecord)
        var planNumber = getPlanNumber(orderRecord,item)
 
        orderRecord.setValue({
            fieldId : 'custbody_planchange',
            value : true
        })

        orderRecord.insertLine({
            sublistId : 'item',
            line : index
        })

        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_plan_number',
            line : index,
            value : planNumber
        })

        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_salesorder',
            line : index,
            value : orderRecord.id
        })

        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_line',
            line : index,
            value : item.line
        })

        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'quantity',
            line : index,
            value : item.quantity
        })

        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'expectedshipdate',
            line : index,
            value : item.expectedshipdate
        })

        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_suggest_date',
            line : index,
            value : item.expectedshipdate
        }) 

        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'item',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_item'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_bom_version'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_bom_version',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_bom_version'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_bom_status'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_bom_status',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_bom_status'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_row_id'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_row_id',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_row_id'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_software_version'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_software_version',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_software_version'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_cgoodsname'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_cgoodsname',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_cgoodsname'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_cgoodscode'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_cgoodscode',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_cgoodscode'})
        })

        
        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_completion_date'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_completion_date',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_completion_date'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_work_order_number'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_work_order_number',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_work_order_number'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_boxes_numbers'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_boxes_numbers',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_boxes_numbers'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_total_net_weight'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_total_net_weight',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_total_net_weight'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_total_cubic_number'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_total_cubic_number',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_total_cubic_number'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_total_gross_weight'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_total_gross_weight',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_total_gross_weight'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_sup_total'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_sup_total',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_sup_total'})
        })
 
        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_customsname'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_customsname',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_customsname'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_supply_company'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_supply_company',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_supply_company'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_compdiscount'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_compdiscount',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_compdiscount'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_description'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'description',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_description'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_unit_notax'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_unit_notax',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_unit_notax'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_rate'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'rate',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_rate'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_taxcode'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'taxcode',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_taxcode'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_cdiscount'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_cdiscount',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_cdiscount'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_fdiscount'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_fdiscount',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_fdiscount'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_unit_tax'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_unit_tax',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_unit_tax'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_funit'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_funit',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_funit'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_suggest_date'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_suggest_date',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_suggest_date'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_indiscount'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_indiscount',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_indiscount'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_inrate'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_inrate',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_inrate'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_effective_mode'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_effective_mode',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_effective_mode'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_custorder'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_custorder',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_custorder'})
        })

        if(copyRecord.getValue({fieldId : 'custrecord_p_custcol_cn_cfi'}))
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_cseg_cn_cfi',
            line : index,
            value : copyRecord.getValue({fieldId : 'custrecord_p_custcol_cn_cfi'})
        })

        var parentIndex =  orderRecord.findSublistLineWithValue({
            sublistId : 'item',
            fieldId : 'custcol_line',
            value : item.line.slice(0,item.line.indexOf('.'))
        })

        if(parentIndex > -1)
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'quantity',
            line : parentIndex,
            value : operation.sub(
                orderRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'quantity',
                    line : parentIndex
                }),
                item.quantity
            )
        })
    }

    function getInsetIndex(lineNum,orderRecord){
        var currIndex = -1
        var lineCount = orderRecord.getLineCount({
            sublistId : 'item'
        })
       
        if(lineNum.indexOf('.') > -1)
        {
            var star = lineNum.slice(0,lineNum.indexOf('.'))
            currIndex = orderRecord.findSublistLineWithValue({
                sublistId : 'item',
                fieldId : 'custcol_line',
                value : (++star).toString()
            })
        }

        return currIndex === -1 ? lineCount : currIndex
    }

    function deleteOrderSublistLine(orderRecord,item){
        var currIndex = orderRecord.findSublistLineWithValue({
            sublistId : 'item',
            fieldId : 'custcol_line',
            value : item.line
        })
        var parentIndex =  orderRecord.findSublistLineWithValue({
            sublistId : 'item',
            fieldId : 'custcol_line',
            value : item.line.slice(0,item.line.indexOf('.'))
        })

        orderRecord.setValue({
            fieldId : 'custbody_planchange',
            value : true
        })

        orderRecord.removeLine({
            sublistId : 'item',
            line : currIndex
        })

        if(parentIndex > -1)
        orderRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'quantity',
            line : parentIndex,
            value : operation.add(
                item.quantity ,
                orderRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'quantity',
                    line : parentIndex
                })
            )
        })
    }

    function updatePlanRecord(newRecord,planRecords,updateParent){
        if(updateParent)    updateParentRecordQuantity(newRecord)

        // var parentRecord = record.load({
        //     type : newRecord.type,
        //     id : newRecord.id
        // })

        // planRecords.map(function(res){
        //     parentRecord.setSublistValue({
        //         sublistId : 'recmachcustrecord_l_link',
        //         fieldId : 'id',
        //         line : res.index,
        //         value : res.recordId
        //     })
        // })

        // try{
        //     parentRecord.save()
        // }
        // catch(e){
        //     parentRecord.save()
        // } 
    }

    return {
        beforeLoad: beforeLoad,
        afterSubmit : afterSubmit,
        beforeSubmit : beforeSubmit
    }
});

/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/record',
    'N/workflow'
], function(record , workflow) {
    function beforeLoad(context) {
        if(context.type === 'create')
        setDefaulltValue(context)
    }

    function afterSubmit(context) {
        if(context.type === 'create')
        {
            var newRecord = record.load({
                type : 'customrecord_order_changereq',
                id : context.newRecord.id
            })
            var lineCount = newRecord.getLineCount({
                sublistId : 'recmachcustrecord_link_changestimate'
            })

            
            while(lineCount > 0)
            {
                --lineCount
                var beforeQuantity = newRecord.getSublistValue({
                    sublistId : 'recmachcustrecord_link_changestimate',
                    fieldId : 'custrecord_quantity_beforech',
                    line : lineCount
                })

                if(beforeQuantity)
                workflow.initiate({
                    recordType: 'customrecord_order_changereqline',
                    recordId : newRecord.getSublistValue({
                        sublistId : 'recmachcustrecord_link_changestimate',
                        fieldId : 'id',
                        line : lineCount
                    }),
                    workflowId: 'customworkflow_changeorder'
                })
            }
        }
    }

    function beforeSubmit(context){
        if(context.type === 'create')
        {
            var newRecord = context.newRecord
            var lineCount = newRecord.getLineCount({
                sublistId : 'recmachcustrecord_link_changestimate'
            })
            var estRec    = record.load({
                type : 'estimate',
                id : newRecord.getValue('custrecord_estimatechange_order')
            })
            var quantityChanged = volidLineQuantity(estRec,newRecord,lineCount)

            if(quantityChanged)
            {
                newRecord.setValue({
                    fieldId : 'custrecord_quantity_changed',
                    value : true
                })
            }

            upDateEstimate(estRec,volidOtherFields(estRec,newRecord,lineCount))
        }   
    }

    function upDateEstimate(estRec,differ){
        if(Object.keys(differ.headDiffer).length || differ.lineDiffer.length)
        {
            differ.lineDiffer.map(function(item){
                var estRecLine  = estRec.findSublistLineWithValue({
                    sublistId : 'item',
                    fieldId : 'custcol_plan_number',
                    value : item.plaNumber
                })

                if(estRecLine > -1)
                {
                    estRec.setSublistValue({
                        sublistId : 'item',
                        fieldId : item.fieldId,
                        value : item.value,
                        line : estRecLine
                    })
                }
            })

            Object.keys(differ.headDiffer).map(function(item){
                estRec.setValue({
                    fieldId : item,
                    value : differ.headDiffer[item]
                })
            })

            estRec.save()
        }
    }

    function volidOtherFields(estRec,newRecord,lineCount){
        var dateFields = getDateFields()
        var lineDiffer = new Array()
        var headDiffer = new Object()
        var headFields = getFields('customrecord_order_changereq')
        var lienFields = getFields('customrecord_order_changereqline')

        headFields.map(function(id){
            var newValue = newRecord.getValue({
                fieldId : id
            })
            var oldValue = estRec.getValue({
                fieldId : id.replace('custrecord_c_' , '')
            })

            if(dateFields.indexOf(id) > -1)
            {
                if(newValue.toString() !== oldValue.toString())
                {
                    headDiffer[id.replace('custrecord_c_' , '')] = newValue
                }
            }
            else if(newValue !== oldValue)
            {
                headDiffer[id.replace('custrecord_c_' , '')] = newValue
            }
        })

        for(var i = 0 ; i < lineCount ; i ++)
        {
            lienFields.map(function(lineFieldId){
                if(lineFieldId === 'custrecord_c_quantity') return true

                var newValue = newRecord.getSublistValue({
                    sublistId : 'recmachcustrecord_link_changestimate',
                    fieldId : lineFieldId,
                    line : i
                })
                var oldValue = estRec.getSublistValue({
                    sublistId : 'item',
                    fieldId : lineFieldId.replace('custrecord_c_' , ''),
                    line : i
                })

                if(dateFields.indexOf(lineFieldId) > -1)
                {
                    if(newValue.toString() !== oldValue.toString())
                    {
                        var item = new Object()

                        item.value = newValue
                        item.fieldId = lineFieldId.replace('custrecord_c_' , '')
                        item.plaNumber = newRecord.getSublistValue({
                            sublistId : 'recmachcustrecord_link_changestimate',
                            fieldId : 'custrecord_c_custcol_plan_number',
                            line : i
                        })
                        lineDiffer.push(item)
                    }
                }
                else if(newValue !== oldValue)
                {
                    var item = new Object()

                    item.value = newValue
                    item.fieldId = lineFieldId.replace('custrecord_c_' , '')
                    item.plaNumber = newRecord.getSublistValue({
                        sublistId : 'recmachcustrecord_link_changestimate',
                        fieldId : 'custrecord_c_custcol_plan_number',
                        line : i
                    })
                    lineDiffer.push(item)
                }
            })  
        }

        if(newRecord.getValue('custrecord_whether_mass_production') !== estRec.getValue('custbody_whether_mass_production'))
        headDiffer['custbody_whether_mass_production'] = newRecord.getValue('custrecord_whether_mass_production')

        if(newRecord.getValue('custrecord_wip_customer_order') !== estRec.getValue('custbody_wip_customer_order_number'))
        headDiffer['custbody_wip_customer_order_number'] = newRecord.getValue('custrecord_wip_customer_order')

        if(newRecord.getValue('custrecord_whether_ntercompany_transact') !== estRec.getValue('custbody_whether_ntercompany_transact'))
        headDiffer['custbody_whether_ntercompany_transact'] = newRecord.getValue('custrecord_whether_ntercompany_transact')

        if(newRecord.getValue('custrecord_sales_order_inter_discount') !== estRec.getValue('custbody_sales_order_inter_discount'))
        headDiffer['custbody_sales_order_inter_discount'] = newRecord.getValue('custrecord_sales_order_inter_discount')

        return {
            headDiffer : headDiffer,
            lineDiffer : lineDiffer
        }
    }

    function getDateFields(){
        return [
            'custrecord_c_custbody_ordering_time',
            'custrecord_c_custbody_suspense_date',
            'custrecord_c_custbody_back_suspense_date',
            'custrecord_c_custbody_closing_date',
            'custrecord_c_trandate',
            'custrecord_c_expectedshipdate',
            'custrecord_c_custcol_suggest_date',
            'custrecord_c_custcol_before_date',
            'custrecord_c_custcol_completion_date',
            'custrecord_c_custcol_change_date',
            'custrecord_c_custcol_line_close',
            'custrecord_c_custcol_close_date',
            'custrecord_c_custcol_freezing_date',
            'custrecord_c_custcol_unfreezing'
        ]
    }

    function volidLineQuantity(estRec,newRecord,lineCount){
        for(var i = 0 ; i < lineCount ; i ++)
        {
            var currQuantity = newRecord.getSublistValue({
                sublistId : 'recmachcustrecord_link_changestimate',
                fieldId : 'custrecord_c_quantity',
                line : i
            })
            var plaNumber   = newRecord.getSublistValue({
                sublistId : 'recmachcustrecord_link_changestimate',
                fieldId : 'custrecord_c_custcol_plan_number',
                line : i
            })
            var estRecLine  = estRec.findSublistLineWithValue({
                sublistId : 'item',
                fieldId : 'custcol_plan_number',
                value : plaNumber
            })

            if(estRecLine > -1)
            {
                var estLineQuantity = estRec.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'quantity',
                    line : estRecLine
                })

                if(estLineQuantity.toString() !== currQuantity.toString())
                {
                    newRecord.setSublistValue({
                        sublistId : 'recmachcustrecord_link_changestimate',
                        fieldId : 'custrecord_quantity_beforech',
                        value : estLineQuantity,
                        line : i
                    })
                }
            }
        }
    }

    function setDefaulltValue(context){
        var params = getParams(context)

        if(params && params.estimate)
        {
            var estRec = record.load({
                type : 'estimate',
                id : params.estimate
            })

            setHeadValue(context.newRecord , estRec , 'customrecord_order_changereq')
            setLineValue(context.newRecord , estRec , 'customrecord_order_changereqline')
        }
    }

    function setHeadValue(newRecord,estRec,type){
        var allFields = getFields(type)
         
        allFields.map(function(id){
            newRecord.setValue({
                fieldId : id,
                value : estRec.getValue(id.replace('custrecord_c_' , ''))
            })
        })

        newRecord.setValue({
            fieldId : 'custrecord_estimatechange_order',
            value : estRec.id
        })

        newRecord.setValue({
            fieldId : 'custrecord_whether_mass_production',
            value : estRec.getValue('custbody_whether_mass_production')
        })

        newRecord.setValue({
            fieldId : 'custrecord_wip_customer_order',
            value : estRec.getValue('custbody_wip_customer_order_number')
        })

        newRecord.setValue({
            fieldId : 'custrecord_whether_ntercompany_transact',
            value : estRec.getValue('custbody_whether_ntercompany_transact')
        })

        newRecord.setValue({
            fieldId : 'custrecord_sales_order_inter_discount',
            value : estRec.getValue('custbody_sales_order_inter_discount')
        })
    }

    function setLineValue(newRecord,estRec,type){
        var allFields = getFields(type)
        var lineCount = estRec.getLineCount({
            sublistId : 'item'
        })

        for(var index = 0 ; index < lineCount ; index ++)
        {
            allFields.map(function(id){
                newRecord.setSublistValue({
                    sublistId : 'recmachcustrecord_link_changestimate',
                    fieldId : id,
                    line : index,
                    value : estRec.getSublistValue({
                        sublistId : 'item',
                        fieldId : id.replace('custrecord_c_' , ''),
                        line : index
                    })
                })
             })
        }
    }

    function getFields(type){
        var rec = record.create({
            type : type
        })
        var allFields = rec.getFields()

        return  allFields.filter(function(item){
            return item.indexOf('custrecord_c_') > -1
        })
    }

    function getParams(context){
        if(context.request)
        {
            if(context.request.parameters)
            {
                return {
                    estimate : context.request.parameters.estimate
                }
            }
        }  
    }

    return {
        beforeLoad: beforeLoad,
        afterSubmit : afterSubmit,
        beforeSubmit: beforeSubmit
    }
});

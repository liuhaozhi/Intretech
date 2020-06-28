/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define([
    'N/util',
    'N/search',
    'N/record',
    'N/format',
    '../../helper/operation_assistant'
], function(
    util,
    search,
    record,
    format,
    operation
) {

    function onRequest(context) {
        var request = context.request
        var response= context.response
        var params  = request.parameters
            
        if(request.method === 'GET')
        {
            if(params.action === 'ratify') 
            ratifyPlan(params,response) //批准

            if(params.action === 'refuse')
            refusePlan(params,response) //拒绝
        }
    }

    function ratifyPlan(params,response){ //批准 
        var summarize = getSummarize(params)

        for(var key in summarize){
            var estimateRec = record.load({
                type : 'estimate',
                id : key
            })

            for(var childKey in summarize[key])
            switch(childKey)
            {
                case '1' : 
                    insterSublists(estimateRec,summarize[key][childKey])
                break
                case '2' : 
                    editSublists(estimateRec,summarize[key][childKey])
                break
                case '3' : 
                    deleteSublists(estimateRec,summarize[key][childKey])
                break
                default :
                break
            }

            estimateRec.save()
            updatePlanApproStatus(summarize[key],'2')
        }

        response.write('sucess')
        log.error('ratifyPlan', JSON.stringify(summarize))
    }

    function updatePlanApproStatus(items,status){
        for(var key in items){
            items[key].map(function(item){
                if(key === '3'){
                    record.delete({
                        type : 'customrecord_shipping_plan',
                        id : item.recordId
                    })
                }
                else
                {
                    record.submitFields({
                        type : 'customrecord_shipping_plan',
                        id : item.recordId,
                        values : {
                            custrecord_p_custcol_approval_status : status
                        }
                    })
                }
            })
        }
    }

    function deleteSublists(orderRecord,items){
        items.map(function(item){
            var line = item.custrecord_p_custcol_line
            var currIndex = orderRecord.findSublistLineWithValue({
                sublistId : 'item',
                fieldId : 'custcol_line',
                value : line
            })
            var parentIndex =  orderRecord.findSublistLineWithValue({
                sublistId : 'item',
                fieldId : 'custcol_line',
                value : line.slice(0,line.indexOf('.'))
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
                    item.custrecord_p_quantity ,
                    orderRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'quantity',
                        line : parentIndex
                    })
                )
            })
        })
    }

    function editSublists(orderRecord,items){
        items.map(function(item){
            var line = orderRecord.findSublistLineWithValue({
                sublistId : 'item',
                fieldId : 'custcol_line',
                value : item.custrecord_p_custcol_line
            })

            if(line)
            {
                orderRecord.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'quantity',
                    line : line,
                    value : item.custrecord_p_quantity 
                })
        
                orderRecord.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'expectedshipdate',
                    line : line,
                    value : format.parse({
                        type : format.Type.DATE,
                        value : item.custrecord_p_expectedshipdate
                    })
                })

                orderRecord.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_before_date',
                    line : line,
                    value : format.parse({
                        type : format.Type.DATE,
                        value : item.custrecord_p_custcol_before_date
                    })
                })
        
                if(item.oldQuantity !== item.custrecord_p_quantity)
                {
                    var parentIndex = orderRecord.findSublistLineWithValue({
                        sublistId : 'item',
                        fieldId : 'custcol_line',
                        value : item.custrecord_p_custcol_line.slice(0,item.custrecord_p_custcol_line.indexOf('.'))
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
                            operation.sub(item.oldQuantity , item.custrecord_p_quantity)
                        )
                    })
                }
            }
            else
            {
                insterSublists(orderRecord,[item])
            }
        })
    }

    function insterSublists(orderRecord,items){
        items.map(function(item){
            var prix  = orderRecord.getValue('tranid')
            var index = getInsetIndex(item.custrecord_p_custcol_line,orderRecord)
            
            orderRecord.insertLine({
                sublistId : 'item',
                line : index
            })
  
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_plan_number',
                line : index,
                value : prix.replace(/[0]{1,}/,'') + item.custrecord_p_custcol_line.replace('.','-')
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
                value : item.custrecord_p_custcol_line
            })
    
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'quantity',
                line : index,
                value : item.custrecord_p_quantity
            })
    
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'expectedshipdate',
                line : index,
                value : format.parse({
                    type : format.Type.DATE,
                    value : item.custrecord_p_expectedshipdate
                })    
            })

            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_suggest_date',
                line : index,
                value : format.parse({
                    type : format.Type.DATE,
                    value : item.custrecord_p_expectedshipdate
                })    
            })
    
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'item',
                line : index,
                value : item.custrecord_p_item
            })
 
            if(item.custrecord_p_custcol_bom_version)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_bom_version',
                line : index,
                value : item.custrecord_p_custcol_bom_version
            })

            if(item.custrecord_p_custcol_bom_status)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_bom_status',
                line : index,
                value : item.custrecord_p_custcol_bom_status
            })

            if(item.custrecord_p_custcol_row_id)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_row_id',
                line : index,
                value : item.custrecord_p_custcol_row_id
            })

            if(item.custrecord_p_custcol_software_version)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_software_version',
                line : index,
                value : item.custrecord_p_custcol_software_version
            })

            if(item.custrecord_p_custcol_completion_date)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_completion_date',
                line : index,
                value : format.parse({
                    type : format.Type.DATE,
                    value : item.custrecord_p_custcol_completion_date
                })
            })

            if(item.custrecord_p_custcol_work_order_number)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_work_order_number',
                line : index,
                value :item.custrecord_p_custcol_work_order_number
            })

            if(item.custrecord_p_custcol_boxes_numbers)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_boxes_numbers',
                line : index,
                value :item.custrecord_p_custcol_boxes_numbers
            })

            if(item.custrecord_p_custcol_total_net_weight)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_total_net_weight',
                line : index,
                value :item.custrecord_p_custcol_total_net_weight
            })

            if(item.custrecord_p_custcol_total_cubic_number)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_total_cubic_number',
                line : index,
                value :item.custrecord_p_custcol_total_cubic_number
            })

            if(item.custrecord_p_custcol_total_gross_weight)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_total_gross_weight',
                line : index,
                value :item.custrecord_p_custcol_total_gross_weight
            })

            if(item.custrecord_p_custcol_sup_total)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_sup_total',
                line : index,
                value :item.custrecord_p_custcol_sup_total
            })

            if(item.custrecord_p_custcol_customsname)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_customsname',
                line : index,
                value :item.custrecord_p_custcol_customsname
            })

            if(item.custrecord_p_custcol_supply_company)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_supply_company',
                line : index,
                value :item.custrecord_p_custcol_supply_company
            })

            if(item.custrecord_p_custcol_compdiscount)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_compdiscount',
                line : index,
                value : parseFloat(item.custrecord_p_custcol_compdiscount)
            })
    
            if(item.custrecord_p_custcol_cgoodsname)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_cgoodsname',
                line : index,
                value : item.custrecord_p_custcol_cgoodsname
            })
    
            if(item.custrecord_p_description)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'description',
                line : index,
                value : item.custrecord_p_description
            })
    
            if(item.custrecord_p_custcol_unit_notax)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_unit_notax',
                line : index,
                value : item.custrecord_p_custcol_unit_notax
            })
    
            if(item.custrecord_p_rate)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'rate',
                line : index,
                value : item.custrecord_p_rate
            })
    
            if(item.custrecord_p_taxcode)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'taxcode',
                line : index,
                value : item.custrecord_p_taxcode
            })

            if(item.item.custcol_cgoodscode)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_cgoodscode',
                line : index,
                value : item.custrecord_p_custcol_cgoodscode
            })
    
            if(item.custrecord_p_custcol_cdiscount)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_cdiscount',
                line : index,
                value : parseFloat(item.custrecord_p_custcol_cdiscount)
            })
    
            if(item.custrecord_p_custcol_fdiscount)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_fdiscount',
                line : index,
                value : parseFloat(item.custrecord_p_custcol_fdiscount)
            })
    
            if(item.custrecord_p_custcol_unit_tax)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_unit_tax',
                line : index,
                value : item.custrecord_p_custcol_unit_tax
            })
    
            if(item.custrecord_p_custcol_funit)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_funit',
                line : index,
                value : item.custrecord_p_custcol_funit
            })
    
            if(item.custrecord_p_custcol_suggest_date)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_suggest_date',
                line : index,
                value : format.parse({
                    type : format.Type.DATE,
                    value : item.custrecord_p_custcol_suggest_date
                })
            })
    
            if(item.custrecord_p_custcol_indiscount)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_indiscount',
                line : index,
                value : parseFloat(item.custrecord_p_custcol_indiscount)
            })
    
            if(item.custrecord_p_custcol_inrate)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_inrate',
                line : index,
                value : item.custrecord_p_custcol_inrate
            })
    
            if(item.custrecord_p_custcol_effective_mode)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_effective_mode',
                line : index,
                value : item.custrecord_p_custcol_effective_mode
            })

            if(item.custrecord_p_custcol_cn_cfi)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_cseg_cn_cfi',
                line : index,
                value : item.custrecord_p_custcol_cn_cfi
            })

            if(item.custrecord_p_custcol_custorder)
            orderRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_custorder',
                line : index,
                value : item.custrecord_p_custcol_custorder
            })
    
            var parentIndex =  orderRecord.findSublistLineWithValue({
                sublistId : 'item',
                fieldId : 'custcol_line',
                value : item.custrecord_p_custcol_line.slice(0,item.custrecord_p_custcol_line.indexOf('.'))
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
                    item.custrecord_p_quantity
                )
            })
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

    function getSummarize(params){
        var i = 0
        var k = 0
        var summarize = new Object()
        var checkedInfo = util.extend(
            getCheckInfo(params.cacheid),
            JSON.parse(params.checked)
        )
        var planIds = getCheck(checkedInfo)
        var mySearch = getSearch(planIds)
        var currResult = mySearch.getRange({
            start : 0,
            end   : 1000
        })

        while(i < currResult.length){
            var item = currResult[i]
            var list = {recordId : item.id}
            var appType  = item.getValue({name : 'custrecord_approval_type'})
            var salesId  = item.getValue({name : 'custrecord_p_custcol_salesorder'})
     
            if(!summarize[salesId])
            summarize[salesId] = new Object()

            if(!summarize[salesId][appType])
            summarize[salesId][appType] = new Array()

            mySearch.columns.forEach(function(col){
                if(col.name !== 'custrecord_cache_change')
                {
                    list[col.name] = item.getValue(col.name)
                }
                else
                {
                    var cache = JSON.parse(item.getValue(col.name))

                    if(cache.oldQuantity)
                    list.oldQuantity = cache.oldQuantity
                }
            })
            summarize[salesId][appType].push(list)

            i ++
            k ++

            if(i === 1000){
                i = 0
                currResult = mySearch.getRange({
                    start : k,
                    end   : k + 1000
                })
            }
        }

        return summarize
    }

    function getSearch(planIds){
        return search.create({
            type : 'customrecord_shipping_plan',
            filters : [
                ['internalid' , 'anyof' , planIds]
            ],
            columns : [
                'custrecord_p_custcol_salesorder',
                'custrecord_p_custcol_line',
                'custrecord_p_quantity',
                'custrecord_p_expectedshipdate',
                'custrecord_p_item',
                'custrecord_p_custcol_cgoodsname',
                'custrecord_p_description',
                'custrecord_p_custcol_unit_notax',
                'custrecord_p_rate',
                'custrecord_p_taxcode',
                'custrecord_p_custcol_cgoodscode',
                'custrecord_p_custcol_cdiscount',
                'custrecord_p_custcol_fdiscount',
                'custrecord_p_custcol_unit_tax',
                'custrecord_p_custcol_funit',
                'custrecord_p_custcol_suggest_date',
                'custrecord_p_custcol_indiscount',
                'custrecord_p_custcol_inrate',
                'custrecord_p_custcol_effective_mode',
                'custrecord_approval_type',
                'custrecord_cache_change',
                'custrecord_p_custcol_before_date',
                'custrecord_p_custcol_bom_version',
                'custrecord_p_custcol_bom_status',
                'custrecord_p_custcol_row_id',
                'custrecord_p_custcol_software_version',
                'custrecord_p_custcol_completion_date',
                'custrecord_p_custcol_work_order_number',
                'custrecord_p_custcol_plan_number',
                'custrecord_p_custcol_boxes_numbers',
                'custrecord_p_custcol_total_net_weight',
                'custrecord_p_custcol_total_cubic_number',
                'custrecord_p_custcol_total_gross_weight',
                'custrecord_p_custcol_sup_total',
                'custrecord_p_custcol_customsname',
                'custrecord_p_custcol_supply_company',
                'custrecord_p_custcol_compdiscount',
                'custrecord_p_custcol_cn_cfi'
            ]
        }).run()
    }

    function getCheck(checkedInfo){
        var planIds = new Array()

        for(var key in checkedInfo)
        {
            if(checkedInfo[key] === 'T')
            {
                planIds.push(key)
            }
        }

        return planIds
    }

    function refusePlan(params,response){ //拒绝
        var summarize = getSummarize(params)

        for(var key in summarize){
            updatePlanApproStatus(summarize[key],'3')
        }

        response.write('sucess')
    }

    function getCheckInfo(cacheId){
        var checkCache = undefined

        if(cacheId)
        {
            checkCache = search.lookupFields({
                type : 'customrecord_cache_record',
                id : cacheId,
                columns : ['custrecord_salesorder_cache']
            }).custrecord_salesorder_cache
        }

        return checkCache ? JSON.parse(checkCache) : new Object()
    }

    return {
        onRequest: onRequest
    }
});

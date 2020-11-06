/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define([
    'N/search',
    'N/record',
    'N/runtime',
    '../../helper/operation_assistant'
], (search , record , runtime , assistant) => {
        const currSc  = () => runtime.getCurrentScript()

        const estimateLists = () => currSc().getParameter({
            name : 'custscript_eatimate_sum'
        })

        const planItemLists = () => currSc().getParameter({
            name : 'custscript_planitems_sum'
        })

        const getInputData = context => {
            return JSON.parse(estimateLists())
        }

        const map = context => {
            const {key , value} = context
            const parseVal = JSON.parse(value)
            const estmOrd  = record.load({ type : 'estimate', id : key, isDynamic : true })

            Object.keys(parseVal).map(plaNum => {
                  const index = estmOrd.findSublistLineWithValue({
                      sublistId : 'item',
                      fieldId : 'custcol_plan_number',
                      value : plaNum
                  })

                  if(index > -1){
                    estmOrd.selectLine({
                        sublistId : 'item',
                        line : index
                    })

                    estmOrd.setCurrentSublistValue({
                        sublistId : 'item',
                        fieldId : 'quantity',
                        value : parseVal[plaNum]
                    })

                    estmOrd.commitLine({
                        sublistId : 'item'
                    })
                  }
            })

            estmOrd.save({ignoreMandatoryFields : true})
        }

        const summarize = context => {
            const planLists = JSON.parse(planItemLists())
            const sublistId = 'recmachcustrecord_l_link'

            log.debug('planItemLists',planLists)

            search.create({
                type : 'customrecord_planning_seal',
                filters : [
                    ['custrecord_inv_source' , 'anyof' , Object.keys(planLists)]
                ],
                columns : ['custrecord_inv_source']
            })
            .run().each(res => {
                const source = res.getValue({name : 'custrecord_inv_source'})
                const cutOrd = record.load({
                    type : res.recordType,
                    id : res.id
                })

                let lineCount = cutOrd.getLineCount({
                    sublistId : sublistId
                })

                while(lineCount > 0){
                    const line = cutOrd.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_l_custcol_line',
                        line : --lineCount
                    })

                    log.debug(res.id,planLists[source])
                    planLists[source].map(item => {
                        if(!item.line.includes('.')){
                            cutOrd.setValue({
                                fieldId : 'custrecord_s_quantity',
                                value : assistant.sub(
                                    cutOrd.getValue({fieldId : 'custrecord_s_quantity'}),
                                    assistant.sub(cutOrd.getValue({fieldId : 'custrecord_s_quantity'}) , item.quantity)
                                )
                            })

                            cutOrd.setValue({
                                fieldId : 'custrecord_s_former_quantity',
                                value : assistant.sub(
                                    cutOrd.getValue({fieldId : 'custrecord_s_former_quantity'}),
                                    assistant.sub(cutOrd.getValue({fieldId : 'custrecord_s_former_quantity'}) , item.quantity)
                                )
                            })
                        }else{
                            if(item.line == line){
                                const oldQty = cutOrd.getSublistValue({
                                    sublistId : sublistId,
                                    fieldId : 'custrecord_l_quantity',
                                    line : lineCount,
                                    value : item.quantity
                                })
    
                                cutOrd.setValue({
                                    fieldId : 'custrecord_s_former_quantity',
                                    value : assistant.sub(
                                        cutOrd.getValue({fieldId : 'custrecord_s_former_quantity'}),
                                        assistant.sub(oldQty , item.quantity)
                                    )
                                })
    
                                cutOrd.setSublistValue({
                                    sublistId : sublistId,
                                    fieldId : 'custrecord_l_quantity',
                                    line : lineCount,
                                    value : item.quantity
                                })
                            }
                        }
                    })
                }

                cutOrd.save({ignoreMandatoryFields : true})
            })
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize : summarize
        }
    }
)

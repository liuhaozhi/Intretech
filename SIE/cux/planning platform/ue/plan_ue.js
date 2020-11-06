/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([
    'N/search',
    'N/record',
    '../../helper/operation_assistant'
], 
    (search , record , operation) => {
        const afterSubmit = context => {
            const {type , UserEventType} = context
            log.error(type,UserEventType.EDIT)
            if(type === UserEventType.EDIT || type === UserEventType.XEDIT){
                const {newRecord , oldRecord} = context

                if(newRecord && oldRecord){
                    const newDate = newRecord.getValue({fieldId : 'custrecord_p_custcol_dedate'})
                    const oldDate = oldRecord.getValue({fieldId : 'custrecord_p_custcol_dedate'})
    
                    if(newDate){
                        if(!oldDate || newDate.valueOf() !== oldDate.valueOf()){
                            const line = newRecord.getValue({fieldId : 'custrecord_p_custcol_line'})
                            const editLink = newRecord.getValue({fieldId : 'custrecord_edit_link'})
                            const recordId = editLink.slice(editLink.lastIndexOf('fromrecord=') + 11)
    
                            if(line.includes('.')){
                                search.create({
                                    type : 'customrecord_planning_seal_list',
                                    filters : [
                                        ['custrecord_l_custcol_line' , 'is' , line],
                                        'AND',
                                        ['custrecord_l_link.custrecord_inv_source' , 'anyof' , [recordId]]
                                    ]
                                })
                                .run().each(res => {
                                    record.submitFields({
                                        type : res.recordType,
                                        id : res.id,
                                        values : {
                                            custrecord_l_expectedshipdate : newDate
                                        }
                                    })
                                })
                            }else{
                                search.create({
                                    type : 'customrecord_planning_seal',
                                    filters : [
                                        ['custrecord_inv_source' , 'anyof' , [recordId]]
                                    ]
                                })
                                .run().each(res => {
                                    record.submitFields({
                                        type : res.recordType,
                                        id : res.id,
                                        values : {
                                            custrecord_s_expectedshipdate : newDate
                                        }
                                    })
                                })
                            }
                        }
                    }
    
                    const newQuantity = newRecord.getValue('custrecord_p_quantity')
                    const oldQuantity = oldRecord.getValue('custrecord_p_quantity')
    
                    log.error(newQuantity,oldQuantity)
                    if(newQuantity !== oldQuantity)
                    updateItemProperty(newRecord,newQuantity,oldQuantity,oldRecord)
                }
            }
        }

        const updateItemProperty = (newRecord,newQuantity,oldQuantity,oldRecord) => {
            log.error('entersub')
            var scale = newQuantity / oldQuantity

            // newRecord.setValue({
            //     fieldId : 'custrecord_p_custcol_total_net_weight',
            //     value : operation.mul(scale,oldRecord.getValue({ //总净重
            //         fieldId : 'custrecord_p_custcol_total_net_weight'
            //     }) ||0)
            // })

            // newRecord.setValue({
            //     fieldId : 'custrecord_p_custcol_boxes_numbers',
            //     value : Math.ceil(operation.mul(scale,oldRecord.getValue({ //箱数
            //         fieldId : 'custrecord_p_custcol_boxes_numbers'
            //     }) ||0))
            // })

            // newRecord.setValue({
            //     fieldId : 'custrecord_p_custcol_total_gross_weight',
            //     value : operation.mul(scale,oldRecord.getValue({ //总毛重
            //         fieldId : 'custrecord_p_custcol_total_gross_weight'
            //     }) ||0)
            // })

            // newRecord.setValue({
            //     fieldId : 'custrecord_p_custcol_total_cubic_number',
            //     value : operation.mul(scale,oldRecord.getValue({ //总立方
            //         fieldId : 'custrecord_p_custcol_total_cubic_number'
            //     }) ||0)
            // })

            // newRecord.setValue({
            //     fieldId : 'custrecord_p_custcol_sup_total',
            //     value : Math.ceil( operation.mul(scale,oldRecord.getValue({ //总托数
            //         fieldId : 'custrecord_p_custcol_sup_total'
            //     }) ||0))
            // })

            // newRecord.setValue({
            //     fieldId : 'custrecord_p_custcol_om_before_discount',
            //     value :operation.mul(scale,oldRecord.getValue({ //总托数
            //         fieldId : 'custrecord_p_custcol_om_before_discount'
            //     }))
            // })

            // newRecord.setValue({
            //     fieldId : 'custrecord_p_amount',
            //     value :operation.mul(scale,oldRecord.getValue({ //总托数
            //         fieldId : 'custrecord_p_amount'
            //     }))
            // })

            // newRecord.setValue({
            //     fieldId : 'custrecord_p_custcol_before_tax',
            //     value :operation.mul(scale,oldRecord.getValue({ //总托数
            //         fieldId : 'custrecord_p_custcol_before_tax'
            //     }))
            // })

            // newRecord.setValue({
            //     fieldId : 'custrecord_p_grossamt',
            //     value :operation.mul(scale,oldRecord.getValue({ //总托数
            //         fieldId : 'custrecord_p_grossamt'
            //     }))
            // })

            // newRecord.setValue({
            //     fieldId : 'custrecord_p_custcol_discount',
            //     value :operation.mul(scale,oldRecord.getValue({ //总托数
            //         fieldId : 'custrecord_p_custcol_discount'
            //     }))
            // })

            // newRecord.setValue({
            //     fieldId : 'custrecord_p_custcol_om_total_discount',
            //     value :operation.mul(scale,oldRecord.getValue({ //总托数
            //         fieldId : 'custrecord_p_custcol_om_total_discount'
            //     }))
            // })

            // newRecord.setValue({
            //     fieldId : 'custrecord_p_custcol_trueamount',
            //     value :operation.mul(scale,oldRecord.getValue({ //总托数
            //         fieldId : 'custrecord_p_custcol_trueamount'
            //     }))
            // })
            
            record.submitFields({
                type : 'customrecord_shipping_plan',
                id : newRecord.id,
                values : {
                    custrecord_p_custcol_total_net_weight : operation.mul(scale,oldRecord.getValue({ //总净重
                        fieldId : 'custrecord_p_custcol_total_net_weight'
                    }) ||0),
                    custrecord_p_custcol_boxes_numbers :  Math.ceil(operation.mul(scale,oldRecord.getValue({ //箱数
                        fieldId : 'custrecord_p_custcol_boxes_numbers'
                    }) ||0)),
                    custrecord_p_custcol_total_gross_weight : operation.mul(scale,oldRecord.getValue({ //总毛重
                        fieldId : 'custrecord_p_custcol_total_gross_weight'
                    }) ||0),
                    custrecord_p_custcol_total_cubic_number : operation.mul(scale,oldRecord.getValue({ //总立方
                        fieldId : 'custrecord_p_custcol_total_cubic_number'
                    }) ||0),
                    custrecord_p_custcol_sup_total :  Math.ceil( operation.mul(scale,oldRecord.getValue({ //总托数
                        fieldId : 'custrecord_p_custcol_sup_total'
                    }) ||0)),
                    custrecord_p_custcol_trueamount : operation.mul(scale,oldRecord.getValue({ //总托数
                        fieldId : 'custrecord_p_custcol_trueamount'
                    })),
                    custrecord_p_custcol_om_total_discount : operation.mul(scale,oldRecord.getValue({ //总托数
                        fieldId : 'custrecord_p_custcol_om_total_discount'
                    })),
                    custrecord_p_custcol_discount : operation.mul(scale,oldRecord.getValue({ //总托数
                        fieldId : 'custrecord_p_custcol_discount'
                    })),
                    custrecord_p_grossamt : operation.mul(scale,oldRecord.getValue({ //总托数
                        fieldId : 'custrecord_p_grossamt'
                    })),
                    custrecord_p_custcol_before_tax : operation.mul(scale,oldRecord.getValue({ //总托数
                        fieldId : 'custrecord_p_custcol_before_tax'
                    })),
                    custrecord_p_custcol_om_before_discount : operation.mul(scale,oldRecord.getValue({ //总托数
                        fieldId : 'custrecord_p_custcol_om_before_discount'
                    }))
                }
            })
        }

        return { afterSubmit }
    }
)

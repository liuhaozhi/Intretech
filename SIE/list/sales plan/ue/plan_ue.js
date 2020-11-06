/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([
    'N/search',
    'N/record'
], 
    (search , record) => {
        const afterSubmit = context => {
            const {type , UserEventType} = context

            if(type === UserEventType.EDIT){
                const {newRecord , oldRecord} = context
                const newDate = newRecord.getValue({fieldId : 'custrecord_p_custcol_dedate'})
                const oldDate = oldRecord.getValue({fieldId : 'custrecord_p_custcol_dedate'})
                log.error('newDate',newDate.toString())
                if(newDate){
                    if(!oldDate || newDate.valueOf() !== oldDate.valueOf()){
                        const line = newRecord.getValue({fieldId : 'custrecord_p_custcol_line'})
                        const editLink = newRecord.getValue({fieldId : 'custrecord_edit_link'})
                        const recordId = editLink.slice(editLink.lastIndexOf('fromrecord=') + 11)
                        log.error('line',line)
                        log.error('recordId',recordId)
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
            }
        }

        return { afterSubmit }
    }
)

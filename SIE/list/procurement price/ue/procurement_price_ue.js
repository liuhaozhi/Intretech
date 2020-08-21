/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

define(['N/search' , 'N/record'], 
    (search , record) => {
        function afterSubmit(context){
            if(context.type === 'create')
            {
                const newRecord = context.newRecord

                search.create({
                    type : 'customrecord_price_apply',
                    filters : [
                        ['internalid' , 'noneof' , [newRecord.id]],
                        'AND',
                        ['custrecord_field_stop' , 'equalto' , [newRecord.getValue('custrecord_field_stop')]],
                        'AND',
                        ['custrecord_field_start1' , 'equalto' , [newRecord.getValue('custrecord_field_start1')]],
                        'AND',
                        ['custrecord_field_vendor' , 'anyof' , [newRecord.getValue('custrecord_field_vendor')]],
                        'AND',
                        ['custrecord_field_item' , 'anyof' , [newRecord.getValue('custrecord_field_item')]],
                        'AND',
                        ['custrecord_field_currencies' , 'anyof' , [newRecord.getValue('custrecord_field_currencies')]],
                    ]
                })
                .run()
                .each(function(res){
                    record.submitFields({
                        type : res.recordType,
                        id : res.id,
                        values : {
                            isinactive : true
                        }
                    })

                    return true
                })
            }
        }

        return {
            afterSubmit : afterSubmit
        }
    }
)

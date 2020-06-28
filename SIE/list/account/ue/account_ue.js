/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/record',
    'N/search',
    'N/workflow'
], function(
    record,
    search,
    workflow
) {
    function afterSubmit(context) {
        if(context.type !== context.UserEventType.DELETE)
        {
            seTier(context.newRecord)
        }
    }

    function seTier(newRecord){
        var tier = getTier(newRecord.id , 1)

        record.submitFields({
            type : newRecord.type,
            id : newRecord.id,
            values : {
                custrecord_account_level_a : tier
            }
        })
    }

    function getTier(recordId , tier){    
        var rec = record.load({
            type : 'account',
            id : recordId
        })
        var parent = rec.getValue('parent')

        while(parent)
        {
            ++tier
            rec = record.load({
                type : 'account',
                id : parent
            })
            parent = rec.getValue('parent')
        }

        return tier
    }

    return {
        afterSubmit: afterSubmit
    }
});

/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([], function() {

    function beforeLoad(context) {
        if(context.type === 'create')
        delateItemFullMent(context.newRecord)
    }

    function delateItemFullMent(newRecord){
        var lineCount = newRecord.getLineCount({
            sublistId  : 'item'
        })

        while(lineCount > 0)
        {
            newRecord.removeSublistSubrecord({
                sublistId : 'item',
                fieldId : 'inventorydetail',
                line : --lineCount
            })
        }
    }

    return {
        beforeLoad: beforeLoad
    }
});

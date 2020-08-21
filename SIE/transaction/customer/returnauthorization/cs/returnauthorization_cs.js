/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([], function() {

    function pageInit(context) {
        if(context.mode === 'create' || context.mode === 'copy')
        deleteItemFullment(context.currentRecord)
    }

    function deleteItemFullment(currentRecord){
        var lineCount = currentRecord.getLineCount({
            sublistId : 'item'
        })

        while(lineCount > 0)
        {
            currentRecord.selectLine({
                sublistId : 'item',
                line : --lineCount
            })
            
            currentRecord.removeCurrentSublistSubrecord({
                sublistId : 'item',
                fieldId : 'inventorydetail'
            })
        }
    }

    return {
        pageInit : pageInit
    }
});

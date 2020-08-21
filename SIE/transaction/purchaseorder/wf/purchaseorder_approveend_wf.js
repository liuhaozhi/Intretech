/**
 *@NApiVersion 2.1
 *@NScriptType WorkflowActionScript
 */
define([] , 
    () => {
        function onAction(context){
            const lineCache = Object.create(null)
            const newRecord = context.newRecord

            let lineCount = newRecord.getLineCount({
                sublistId : 'item'
            })

            if(!newRecord.getValue('custbody_linequantitys_cache'))
            {
                while(lineCount > 0)
                {
                    lineCache[newRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'id',
                        line : --lineCount
                    })] = newRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'quantity',
                        line : lineCount
                    })
                }
    
                newRecord.setValue({
                    fieldId : 'custbody_linequantitys_cache',
                    value : JSON.stringify(lineCache)
                })
            }
        }
        
        return {
            onAction : onAction
        }
    }
)

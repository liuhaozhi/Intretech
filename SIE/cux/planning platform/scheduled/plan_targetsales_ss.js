/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define([
    'N/record',
    'N/runtime'
], 
    (record , runtime) => {
        const currScriptContext = runtime.getCurrentScript()
        // const estimateRecordId  = currScriptContext.getParameter({
        //     name : 'custscript_estimate_recordid'
        // })

        function execute(context) {
            
        }

        return { execute }
    }
)

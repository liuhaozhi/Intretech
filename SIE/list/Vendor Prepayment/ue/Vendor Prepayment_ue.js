/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([

], 
    () => {
        const afterSubmit = context => {
            if(context.type === 'edit')
            doSomtThing(context.newRecord)
        }
    
        const doSomtThing = newRecord => {
            log.error('hi')
        }
        return {afterSubmit}
    }   
)

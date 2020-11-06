/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([], () => {
    function beforeLoad(context) {
        const {form , type , UserEventType} = context

        if(type === UserEventType.VIEW){
            const {newRecord} = context
            const journalId   = newRecord.getValue({fieldId : 'custrecord_ap_journal'})
            const appStatus   = newRecord.getValue({fieldId : 'custrecord_ap_approval_node'})

            if(appStatus === '3' && !journalId)
            addJorButton(form , newRecord)
        }
    }

    function addJorButton(form,newRecord){
        form.clientScriptModulePath = '../cs/vendor_payanthor_cs'

        form.addButton({
            id : 'custpage_paytojor',
            label : '转销日记账',
            functionName : 'payToJor('+ newRecord.id +')'
        })
    }

    return { beforeLoad }
})

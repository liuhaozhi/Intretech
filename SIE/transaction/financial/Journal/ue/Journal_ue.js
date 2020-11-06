/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([
    'N/record'
], (record) => {
    const payOtherType = 'customrecord_ayment_by_supplier'
    const writeBackVdpayOther = (payOtherId , newRecord) => record.submitFields({type : payOtherType , id : payOtherId , values : {custrecord_ap_journal : newRecord.id}})


    function beforeLoad(context) {
        const {type , UserEventType} = context
        
        if(type === UserEventType.CREATE)
        setDefaultFeildsValue(context)
    }

    function setDefaultFeildsValue(context){
        const {request , newRecord} = context

        if(request){
            const {parameters} = request
            const {type , payid} = parameters

            if(type === 'vdotherpay' && payid)
            newRecord.setValue({fieldId : 'custbody_ap_ayment_gl' , value : payid})
        }
    }

    function afterSubmit(context){
        const {type , UserEventType} = context

        if(type === UserEventType.CREATE){
            const {newRecord} = context
            const payOtherId  = newRecord.getValue({fieldId : 'custbody_ap_ayment_gl'})

            if(payOtherId)
            writeBackVdpayOther(payOtherId , newRecord)
        }
    }

    return {beforeLoad , afterSubmit}
})

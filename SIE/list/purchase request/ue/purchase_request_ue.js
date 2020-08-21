/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([], 
    () => {
        function beforeLoad(context){
            if(context.type === 'view')
            {
                const newRecord = context.newRecord

                if(newRecord.getValue('custrecord_po_complete') !== true && newRecord.getValue('custrecord_potype_approvalstatus') === '2')
                {
                    const form = context.form

                    form.clientScriptModulePath = '../cs/purchase_request_cs'
                    form.addButton({
                        id : 'custpage_createpo',
                        label : '生成采购订单',
                        functionName : 'createPo('+ newRecord.id +')'
                    })
                }
            }
        }

        return {
            beforeLoad : beforeLoad
        } 
    }
);

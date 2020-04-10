/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define({
    entryFields : function (params){
        return  [
            {
                id : 'invoicentry' ,
                label : '发票号' ,
                type : 'text' ,
                container : 'custpage_entry' ,
                defaultValue : params.invoicentry || ''
            },
            {
                id : 'outputype' ,
                label : '输出类型' , 
                type : 'select' ,
                source : 'customlist_output_type',
                container : 'custpage_entry' ,
                isMandatory : true,
                defaultValue : params.outputype || ''
            }
        ]
    }
})
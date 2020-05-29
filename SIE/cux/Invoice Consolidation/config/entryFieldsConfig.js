/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define({
    entryFields : function (params){
        return  [
            {
                id : 'outputype' ,
                label : 'Output type/输出类型' , 
                type : 'select' ,
                source : 'customlist_output_type',
                container : 'custpage_entry' ,
                isMandatory : true,
                defaultValue : params.outputype || ''
            },
            {
                id : 'invoicentry' ,
                label : 'Invoice No./发票号' ,
                type : 'text' ,
                container : 'custpage_entry' ,
                defaultValue : params.invoicentry || ''
            }
        ]
    }
})
/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/record',
    '../../helper/operation_assistant'
], function(
    record,
    operation
) {
    function afterSubmit(context) {
        if(context.type === 'edit')
        {
            var newRecord = context.newRecord
            var oldRecord = context.oldRecord
            var newQuantity = newRecord.getValue('custrecord_p_quantity')
            var oldQuantity = oldRecord.getValue('custrecord_p_quantity')

            if(newQuantity !== oldQuantity)
            updateItemProperty(oldRecord,newQuantity,oldQuantity)
        }
    }

    function updateItemProperty(oldRecord,newQuantity,oldQuantity){
        var scale = operation.div(
            newQuantity,
            oldQuantity
        ).toFixed(2)

        record.submitFields({
            type : 'customrecord_shipping_plan',
            id : oldRecord.id,
            values : {
                custrecord_p_custcol_total_net_weight : operation.mul(scale,oldRecord.getValue({ //总净重
                    fieldId : 'custrecord_p_custcol_total_net_weight'
                }) ||0),
                custrecord_p_custcol_boxes_numbers :  Math.ceil(operation.mul(scale,oldRecord.getValue({ //箱数
                    fieldId : 'custrecord_p_custcol_boxes_numbers'
                }) ||0)),
                custrecord_p_custcol_total_gross_weight : operation.mul(scale,oldRecord.getValue({ //总毛重
                    fieldId : 'custrecord_p_custcol_total_gross_weight'
                }) ||0),
                custrecord_p_custcol_total_cubic_number : operation.mul(scale,oldRecord.getValue({ //总立方
                    fieldId : 'custrecord_p_custcol_total_cubic_number'
                }) ||0),
                custrecord_p_custcol_sup_total :  Math.ceil( operation.mul(scale,oldRecord.getValue({ //总托数
                    fieldId : 'custrecord_p_custcol_sup_total'
                }) ||0))
            }
        })
    }

    return {
        afterSubmit: afterSubmit
    }
});

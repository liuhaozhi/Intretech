/**
 * @NApiVersion 2.0
 * @NScriptType clientscript
 */
                
define([], function(){ 
    function fieldChanged(context){
        var fieldId = context.fieldId
        var recCurrent = context.currentRecord
        var poAmt = recCurrent.getValue('custrecord_nsts_vp_po_amount')

        if(fieldId === 'custrecord_vp_percentage'){
            var parset = recCurrent.getValue(fieldId)

            if(parset){
                recCurrent.setValue({
                    fieldId : 'custrecord_nsts_vp_prepay_amount',
                    value : poAmt * parset / 100
                })
            }
        }

        if(fieldId === 'custrecord_nsts_vp_prepay_amount'){
            var VPamount = recCurrent.getValue(fieldId)

            if(VPamount > poAmt){
                recCurrent.setValue({
                    fieldId : fieldId,
                    value : poAmt
                })
            }
        }
    }

    return {
        fieldChanged : fieldChanged
    };
});
/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define({
    pageInit : function(context){
      	if(context.mode == 'edit'){//禁止修改编号，makaay
            var cuRecord = context.currentRecord;
            var codeField = cuRecord.getField({'fieldId':'entityid'});
            //codeField.isDisabled = true;
        }else if(context.mode == 'create'){//禁止取消自动编码，makaay
            var cuRecord = context.currentRecord;
            var autoField = cuRecord.getField({'fieldId':'autoname'});
            autoField.isDisabled = true;
        }
        console.log('pageinit')
    },
    fieldChanged : function(context){
        var fieldId = context.fieldId
        if(fieldId === 'custentity_credit_per' || fieldId === 'custentity_credit_amount')
        {
            var currRec = context.currentRecord
            var per = currRec.getValue('custentity_credit_per') / 100
            var amount = currRec.getValue('custentity_credit_amount')

            if(per && amount)
            {
                currRec.setValue({
                    fieldId : 'custentity_credit_alarm_limit',
                    value : amount * per
                })
            }
            else
            {
                currRec.setValue({
                    fieldId : 'custentity_credit_alarm_limit',
                    value : amount
                })
            }
            console.log(currRec.getValue('custentity_credit_alarm_limit'))
        }
    }
});

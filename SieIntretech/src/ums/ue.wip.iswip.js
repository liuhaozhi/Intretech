/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/error', 'N/email', 'N/url', 'N/runtime'], function (error, email, url, runtime) {

    function beforeLoad(context) {
        
    }

    function beforeSubmit(context) {
        if (context.type == context.UserEventType.CREATE) {
            if (runtime.executionContext != runtime.ContextType.USER_INTERFACE) {
                return false;
            }
            //验证某些字段的值
            var newRecord = context.newRecord;
         
            var iswip = newRecord.getValue({
                fieldId: 'iswip'
            });
            
            if (iswip==false || iswip=='F' ||iswip=='false'){
                newRecord.setValue({
                    fieldId: 'iswip',
                    value: true
                });
            }
        } else if (context.type == context.UserEventType.EDIT) {
            try {
                //检测某些字段的值是否改变
                var oldRecord = context.oldRecord;
                var newRecord = context.newRecord;
               /* var oldVendor = oldRecord.getValue({
                    fieldId: 'entity'
                });
                var newVendor = newRecord.getValue({
                    fieldId: 'entity'
                });
           */

          var iswip = newRecord.getValue({
            fieldId: 'iswip'
        });
        
        if (iswip==false || iswip=='F' ||iswip=='false'){
            newRecord.setValue({
                fieldId: 'iswip',
                value: true
            });
        }

            } catch (ex) {
                log.error({
                    title: '设置ISWIP失败',
                    details: ex
                });
                if(ex.name == ''){
                    throw ex.message;
                }
            }

        }
    }

    function afterSubmit(context) {
       
    }

    //entry points
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
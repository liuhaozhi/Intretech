/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search','N/log','N/record'],

function(search,log,record) {
    


    function pageInit(scriptContext) {
  
        return true;
        
    }

    function fieldChanged(scriptContext) {
        var cuRecord = scriptContext.currentRecord;
        var sublistId = scriptContext.sublistId;
        var fieldId = scriptContext.fieldId;
        var line = scriptContext.line;
        //console.log("获取的sublistId="+sublistId+"，获取的fieldId="+fieldId+"，获取的line="+line);
        if(fieldId=="custrecordcustbody_customer"){
            var customer = cuRecord.getValue({
                fieldId:"custrecordcustbody_customer"

            })
            cuRecord.setValue({
                fieldId:"custrecordcustbody_drawer",
                value:customer
            });
        }
        

        return true;
    }


    function postSourcing(scriptContext) {
       
        return true;
    }

    function sublistChanged(scriptContext) {
        
        return true;
    }


    function lineInit(scriptContext) {
        
        return true;
    }

    function validateField(scriptContext) {
        
        return true;
    }

    function validateLine(scriptContext) {

        return true;
    }

    function validateInsert(scriptContext) {
        
        return true;
    }


    function validateDelete(scriptContext) {
        
        return true;
    }


    function saveRecord(scriptContext) {
        
        return true;
    }



    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        sublistChanged: sublistChanged,
        lineInit: lineInit,
        validateField: validateField,
        validateLine: validateLine,
        validateInsert: validateInsert,
        validateDelete: validateDelete,
        saveRecord: saveRecord
    };
    
});

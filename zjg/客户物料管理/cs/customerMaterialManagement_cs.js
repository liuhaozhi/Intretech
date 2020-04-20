/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

function() {
	var mode="";
    function pageInit(scriptContext) {
    	console.log("页面加载开始进入脚本");
    	//禁用
    	mode = scriptContext.mode;
    	var cuuRecord = scriptContext.currentRecord;
    	var nameField = cuuRecord.getField({
    		fieldId: 'name'
    	})
    	nameField.isDisabled=true;
    	return true;
    }

    function fieldChanged(scriptContext) {
    	materialNameSplic(scriptContext);
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
    //物料名称拼接 创建时出发  名称不允许修改
    function  materialNameSplic(scriptContext){
    	var name = "";
  
    	//console.log("custrecord_customer_product_code="+productCode+",custrecord_customer_product_name="+productName);
    	if(mode="create"){
    	  	var cuuRecord = scriptContext.currentRecord;
        	//客户物料编码 
        	var productCode = cuuRecord.getValue({
        		fieldId:"custrecord_customer_product_code"
        	})
        	var productName = cuuRecord.getValue({
        		fieldId:"custrecord_customer_product_name"
        	})
        	name = productCode+" "+productName;
        	console.log(name);
        	cuuRecord.setValue({
        		fieldId:"name",
        		value:name,
        		ignoreFieldChange:true,
        		fireSyncSlaving:true
        	});
    	}
    	
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

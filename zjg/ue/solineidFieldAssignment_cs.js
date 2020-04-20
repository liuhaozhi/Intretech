/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/record","N/currentRecord"],

function(record,currentRecord) {
    

    function pageInit(scriptContext) {
    	return true;
    }


    function fieldChanged(scriptContext) {
    	
    	var changCurrentRecord = scriptContext.currentRecord;
    
    	//console.log("当前子列表的类型typ="+typ);
    	var sublistId = scriptContext.sublistId;
    	var fieldId = scriptContext.fieldId;
    	var line = scriptContext.line;
    	var column = scriptContext.column;
    	//if(sublistId == "item"|| fieldId=="custcol_unit_price_after_discount"){
    	console.log("获取的sublistId="+sublistId+"获取子记录id="+fieldId+"，获取的行line="+line+"，获取的列column="+column)
    	
    	addcuu(scriptContext);
    	//}
    	/*var numLines = changCurrentRecord.getMatrixHeaderCount({
    	    sublistId: 'item',
    	    fieldId: 'custcol_pso2c_soco_solineid'
    	});
    	console.log("获取的列="+numLines);

    	if( sublistId == "item"){
        	var subList = changCurrentRecord.getSublist({
        		sublistId: 'item'
        	});
        	var column = subList.getColumn({
        		fieldId: 'item'
        	});
        	var typ = subList.type;
        	var id = subList.id;
        	console.log("获取的typ="+typ+"，获得的id="+id);
    	}*/
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
    	//addcuu(scriptContext);
    	return true;
    }
    
    
    function addcuu(scriptContext){
    	var cuuRecord = scriptContext.currentRecord;
    	var tranid = cuuRecord.getValue({
    		fieldId:"tranid"
    	});
    	var id = cuuRecord["id"];
    	console.log("获取的id="+id);
/*		var recordLoad = record.load({
			type:"estimate",
			id:id,
			isDynamic:false
		});
		console.log("获取的recordLoad="+recordLoad);*/
		//折后不含税合计金额
		/*recordLoad.setSublistText({
			sublistId:"item",
			fieldId:"custcoltotal_amount_excluding_tax_aft",
			line:0,
			text:"sadsa555555"
		});
		recordLoad.setSublistValue({
			sublistId:"item",
			fieldId:"custcoltotal_amount_excluding_tax_aft",
			line:0,
			value:"sadsa555555"
		});*/
    	cuuRecord.selectLine({
    		sublistId:"item",
    		line:0
    	});
    	
		cuuRecord.setCurrentSublistValue({
		    sublistId: 'item',
		    fieldId: 'custcoltotal_amount_excluding_tax_aft',
		    value: "88888",
		    ignoreFieldChange: true,
		    forceSyncSourcing:true
		});
		cuuRecord.setCurrentSublistText({
		    sublistId: 'item',
		    fieldId: 'custcoltotal_amount_excluding_tax_aft',
		    text: "88888",
		    ignoreFieldChange: true,
		    forceSyncSourcing:true
		});
		cuuRecord.setValue({
			 fieldId: 'custcoltotal_amount_excluding_tax_aft',
			 value: "6666666",
			 ignoreFieldChange:true
			 
			    
		})

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

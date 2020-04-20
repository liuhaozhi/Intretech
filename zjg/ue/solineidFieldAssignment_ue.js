/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search','N/log'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search,log) {
   

    function beforeLoad(scriptContext) {
    	
    }


    function beforeSubmit(scriptContext) {
		
    }


    function afterSubmit(scriptContext) {
    	solineidFieldAssignment(scriptContext);
    }
    
    function solineidFieldAssignment(scriptContext){
		var newRe = scriptContext.newRecord;
		var oldre=scriptContext.oldRecord
        
    	var newRecordId = newRe['id'];
    	//获取子列表货品长度
		var len = newRe.getLineCount({
			sublistId:"item"
		});
 
    	log.error({
   		 title: '获取该条记录的id', 
   		 details:newRecordId
    	});
    	
    	    	
    	//根据id查询对应的已保存搜索
    	var my = search.load({
    		id:"customsearch_sales_order_search"
    	});
    	var lists = my.run().getRange({
            start: 0,
            end: 1000
    	});
    	//
   		for (var i = 0; i < lists.length; i++) {
    		var listsId = parseInt(lists[i]["id"]);
    		if(listsId == newRecordId){
    			//修改子列表数据
    			//获取编号
    			var tranid = lists[i].getValue({
    				name:"tranid"
    	    	});
    			
    			log.error({
    		   		 title: '获取该条记录的订单编号', 
    		   		 details:tranid
    		    });
    			//加载现有记录
    			var recordLoad = record.load({
    				type:"estimate",
    				id:62775,
    				isDynamic:true
    			});
    			newRe.setValue({
					fieldId: 'memo',
					value: "我在测试",
					ignoreFieldChange: true
				});

				record.submitFields({
					type: "estimate",
					id: newRecordId,
					values: {
						memo: '我在用submitFields测试',
						custcol_pso2c_soco_solineid:'sdsd123456'
					 },
			  });
		
			

    			for (var j = 0; j < len; j++) {
    				newRe.setSublistText({
        				sublistId:"item",
        				fieldId:"custcol_pso2c_soco_solineid",
        				line:j,
        				text:"55555"
        			});
    				
    				//折后不含税合计金额
    				newRe.setSublistText({
        				sublistId:"item",
        				fieldId:"custcoltotal_amount_excluding_tax_aft",
        				line:j,
        				text:"666"
        			});
    				//折后单价
    				newRe.setSublistText({
        				sublistId:"item",
        				fieldId:"custcol_unit_price_after_discount",
        				line:j,
        				text:"77777"
        			});
    				//selectLine(options)
/*    				recordLoad.selectLine({
    					sublistId:"item",
    					line:j
    				});
    				recordLoad.setCurrentSublistValue({
    					sublistId:"item",
    					fieldId:"custcol_pso2c_soco_solineid",
    					value:tranid
    				});
    				recordLoad.commitLine({
    					sublistId: 'item'
    				});*/
    				log.error({
	       		   		 title: '执行第次数', 
	       		   		 details:j
    				});
    			
				}
    			
    			
    		}
		}
   		return true;
    }
    

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});

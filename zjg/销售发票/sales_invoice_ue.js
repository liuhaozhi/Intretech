/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/log','N/record','N/search','N/url'],

function(log,record,search,url) {
 
   
	//数据加载到界面之前执行
    function beforeLoad(scriptContext) {

    }

    //数据被提交到数据库之前执行
    function beforeSubmit(scriptContext) {
 

    }
    //数据被提交到数据库之后执行
    function afterSubmit(scriptContext) {
        if(scriptContext.type === 'create')
        {
            setLineItemSaleId(scriptContext);
        }

    }



    function get11(){
        log.error("get方法调用开始");
        //var ide = getShuJu(Context);
        log.error("直接返回数据"+tranid);
        ide= tranid;
        log.error("ide="+ide);
        return ide;
    }

    // function GetRequest(scriptContext) {  
    //     //var url = location.search; //获取url中"?"符后的字串  
    //     var recordIn = scriptContext.newRecord;
    //     var urll = url.resolveRecord({
    //         recordType: 'invoice',
    //         recordId: recordIn.id,
    //         isEditMode: true
    //     });
    //     log.error("获取的链接="+urll);
    //     var theRequest = new Object();  
    //     if (urll.indexOf("?") != -1) {  
    //        var str = urll.substr(1);  
    //        strs = str.split("&");  
    //        for(var i = 0; i < strs.length; i ++) {  
    //           theRequest[strs[i].split("=")[0]]=unescape(strs[i].split("=")[1]);  
    //        }  
    //     }  
    //     return theRequest;  
    // } 


    //将所有
    function setLineItemSaleId(scriptContext){
        var recordInfo = scriptContext.newRecord;
        var newRecord = record.load({
            type : recordInfo.type,
            id : recordInfo.id
        })
        var itemCount = newRecord.getLineCount({
            sublistId : 'item'
        })
        //总计金额
        var total = newRecord.getValue({
            fieldId:"total"
        });
        //custbody_ordering_time 制造单日期
        var custbody_ordering_time = newRecord.getText({
            fieldId:"custbody_ordering_time"
        });
        log.error("获取的制单日期="+custbody_ordering_time);
        //custbody_cross_customer_invoice 来源单据
        var custbody_cross_customer_invoice = newRecord.getValue({
            fieldId:"custbody_cross_customer_invoice"
        });
        

        var objRecord = record.create({
		    type: "customrecord_cross_client", 
        });

        objRecord.setValue({
            fieldId: 'custrecord_total_sum',
            value: total,
         
        });
        objRecord.setValue({
            fieldId: 'custrecord_date_invoice',
            value: custbody_ordering_time,
         
        });
        objRecord.setValue({
            fieldId: 'custrecord_cross_customer_invoice',
            value: recordInfo.id,
         
        });
        objRecord.setValue({
            fieldId: 'custrecord_links',
            value: custbody_cross_customer_invoice,
         
        });

        //修改后保存
        objRecord.save({
            ignoreMandatoryFields : true
        });



    }


    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit,
        get11:get11
    };
    
});

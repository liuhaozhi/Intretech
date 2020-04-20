/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/log'],

function(log) {

    var form="";
   
	//数据加载到界面之前执行
    function beforeLoad(scriptContext) {
        log.error("销售订单ue模块加载开始")
        Context = scriptContext;
        form = scriptContext.form;

        //from.clientScriptModulePath="./sales_order_cs.js";
    }

    //数据被提交到数据库之前执行
    function beforeSubmit(scriptContext) {
 

    }

 
    //数据被提交到数据库之后执行
    function afterSubmit(scriptContext) {

    }


    function getFrom(){
        log.error("get方法调用开始");
        //var ide = getShuJu(Context);
        log.error("直接返回数据"+form);
        return form;
    }


    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit,
        getFrom:getFrom
    };
    
});

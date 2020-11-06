/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/log','N/record','N/search'],

function(log,record,search) {
    //var shuju="";
    //var Context ="";
    var tranid="";
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
	//数据加载到界面之前执行
    function beforeLoad(scriptContext) {
        Context = scriptContext;
        var from = scriptContext.form;
        var type = scriptContext.type;

        //approve 确认发货按钮id
        //id:'billremaining' 开票按钮
        
        //log.error("当前页面的操作模式是="+type);
        var approve = from.getButton({
            id:'approve'
        });
        var neRecord = scriptContext.newRecord;
        tranid = neRecord['id'];
        var total = neRecord.getValue({
            fieldId:'total'
        });
        
        if(approve == null && type =="view"){
            from.addButton({
                id : 'custpage_search',
             label : '跨客户开发票',
                functionName :'butClick('+tranid+','+total+')'
            })
        }



        

        //log.error("获取的trandate="+tranid);
        //log.error("获取的total="+total);
        //get11();
        //添加要使用的js文件路径
        from.clientScriptModulePath="./delivery_notice_cs.js";
        //762
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
        //(scriptContext);

    }



    function get11(){
        log.error("get方法调用开始");
        //var ide = getShuJu(Context);
        log.error("直接返回数据"+tranid);
        ide= tranid;
        log.error("ide="+ide);
        return ide;
    }



    function setLineItemSaleId(scriptContext){
        var recordInfo = scriptContext.newRecord;
        var newRecord = record.load({
            type : recordInfo.type,
            id : recordInfo.id
        })
        var itemCount = newRecord.getLineCount({
            sublistId : 'item'
        })

        // for(var i = 0 ; i < itemCount ; i ++)
        // {
        //     newRecord.setSublistValue({
        //         sublistId : 'item',
        //         fieldId : 'custcol_salesorder',
        //         line : i,
        //         value : recordInfo.id
        //     })
        // }
        newRecord.setValue({
            fieldId:"CUSTBODY_CROSS_CUSTOMER_INVOICE",
            value:recordInfo.id
        })



        var mySearch = search.load({
            id: 'customsearch_om_pay'
        });

        var filters= mySearch.filters;

        log.error("获得的已保存搜索的过滤条件"+JSON.stringify(filters));
        //修改后保存
        newRecord.save({
            ignoreMandatoryFields : true
        });



    }

    //actualshipdate实际字段 custbody_datetime 到货日期  custbody_expected_receipt_date预计签收日期
    function calculation(scriptContext){
        var recordInfo = scriptContext.newRecord;
        var newRecord = record.load({
            type : recordInfo.type,
            id : recordInfo.id
        })
        var iid = recordInfo.id;
        var customFilter=[];
        //internalId
        customFilter.push({
            'name':'internalidnumber',
            'operator':"equalto",
            'values':[iid]
        })
        var orodeSerrch =search.create({
            type: search.Type.SALES_ORDER,
            filters:customFilter,
            columns: [   
                        {name:'actualshipdate'}
                    ]   
        }).run().getRange({
            start : 0,
            end   : 3
        });
        var actualshipdate =orodeSerrch[0].getValue({
            name:"actualshipdate"
        })

        log.error("获取的actualshipdate="+actualshipdate);
        var custbody_datetime = newRecord.getValue({
            fieldId:'custbody_datetime'
        })

        log.error("获取的custbody_datetime="+custbody_datetime);

        var receipt_date = '';
        if(actualshipdate&&custbody_datetime){

            receipt_date = getNewData(actualshipdate, custbody_datetime);
            newRecord.setValue({
                fieldId:"custbody_expected_receipt_date",
                value:receipt_date
            })

            //修改后保存
            newRecord.save({
                ignoreMandatoryFields : true
            });

        }
        
        
        
       // return receipt_date;



    }
    //计算时间
    function getNewData(dateTemp, days) {  
        var dateTemp = dateTemp.split("-");  
        var nDate = new Date(dateTemp[1] + '-' + dateTemp[2] + '-' + dateTemp[0]); //转换为MM-DD-YYYY格式    
        var millSeconds = Math.abs(nDate) + (days * 24 * 60 * 60 * 1000);  
        var rDate = new Date(millSeconds);  
        var year = rDate.getFullYear();  
        var month = rDate.getMonth() + 1;  
        if (month < 10) month = "0" + month;  
        var date = rDate.getDate();  
        if (date < 10) date = "0" + date;  
        return (year + "-" + month + "-" + date);  
    } 


    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit,
        get11:get11
    };
    
});

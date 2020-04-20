/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search','N/log','./delivery_notice_ue.js','N/record','N/url','N/https','N/format'],

function(search,log,noticeUe,record,url,https,format) {



    

    var cuuID="";
    function pageInit(scriptContext) {
        var cuuRecord = scriptContext.currentRecord;
        //console.log("获取的cuuRecord="+cuuRecord);
        cuuID = cuuRecord['id'];
        //console.log("获取的tranidCs="+tranidCs);
        var test = '2019-10-01';
        var test2 = '5';
        var test3 = getNewData(test,test2);
        console.log("时间计算测试="+test3);
        return true;
        
    }

    function fieldChanged(scriptContext) {
        var cuRecord = scriptContext.currentRecord;
        var sublistId = scriptContext.sublistId;
        var fieldId = scriptContext.fieldId;
        var line = scriptContext.line;
        console.log("获取的sublistId="+sublistId+"，获取的fieldId="+fieldId+"，获取的line="+line);
        if(fieldId=='custbody_merge_id'){
            var mySearch = search.load({
                id: 'customsearch_customer_pay'
            });
    
            var filters= mySearch.filters;
            for (var i = 0; i < filters.length; i++) {
                console.log("第一次获得的已保存搜索的过滤条件"+JSON.stringify(filters[i]));
                
            }
            filters.push({
                name: "custbody_cross_customer_invoice",
                operator: "anyof",
                values: ["92128"]
            })
            mySearch = search.load({
                id: 'customsearch_customer_pay'
            });
            for (var i = 0; i < filters.length; i++) {
                console.log("22222222222222222获得的"+JSON.stringify(filters[i]));
                
            }
            mySearch.save();
 
    

        }


        if(sublistId != null){
            var fieldName = cuRecord.getCurrentSublistText({
                sublistId: sublistId,
                fieldId: fieldId
            });
            console.log("获取的文本值"+fieldName);
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
        var cuuRecord = scriptContext.currentRecord;
        // var receipt_date = calculation(scriptContext);

        // var newriqi = format.parse({
        //     value:receipt_date,
        //     type:format.Type.DATE
        // });
        // if(receipt_date){
        //     cuuRecord.setValue({
        //         fieldId:'custbody_expected_receipt_date',
        //         value:newriqi
        //     })
        // }
  
        
        return true;
    }


    function butClick(tranid,total){
        console.log("获取的tranid ="+tranid);
    
        window.open('/app/accounting/transactions/custinvc.nl?whence='+"&cuuID="+tranid+"&total="+total);
       
               
    }


    function getData(){
        var customFilter = [];
        //log.error("加载的js文件"+noticeUe);
        //console.log("获取的noticeUe ="+noticeUe);
        var shuju2 =noticeUe.get11();
        //console.log("获取的shuju2 ="+shuju2);
        //log.error("获取的数据"+shuju2);
        // if(shuju2 != null){
        //     customFilter.push({
        //         'name':'internalid',
        //         'operator':search.Operator.ANYOF,
        //         'values':[shuju2]
        //     })
        // }
        return shuju2;
    }
    //actualshipdate实际字段 custbody_datetime 到货日期  custbody_expected_receipt_date预计签收日期
    function calculation(scriptContext){
        var cuRecord = scriptContext.currentRecord;
        var iid = cuRecord.id;

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
        //console.log('获取到的actualshipdate='+actualshipdate);
        var custbody_datetime = cuRecord.getText({
            fieldId:'custbody_datetime'
        })
        //console.log('获取到的custbody_datetime='+custbody_datetime);
        var receipt_date = '';
        if(actualshipdate&&custbody_datetime){

            receipt_date = getNewData(actualshipdate,custbody_datetime);
            //console.log("获取日期相加后的值="+receipt_date);

        }
        
        
        
        return receipt_date;



    }


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
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        sublistChanged: sublistChanged,
        lineInit: lineInit,
        validateField: validateField,
        validateLine: validateLine,
        validateInsert: validateInsert,
        validateDelete: validateDelete,
        saveRecord: saveRecord,
        butClick:butClick,
        getData:getData
    };
    
});

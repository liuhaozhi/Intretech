/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/https','N/search','N/log','N/record','N/url','../../SIE/cux/helper/operation_assistant'],

function(https,search,log,record,urll,operation) {
    
         //tranid发货通知单编号  就是来源单据字段
        //exchangerate交易汇率
        //custbody_cust_ordertype订单类型
        //subsidiary子公司
        //department部门
        //custbody_pc_salesman业务员
       
        //custbody_trade_mode贸易方式
        //custbody_expected_receipt_date预计签收日期
        //custbody_date_of_acceptance 验收日期
        //shipcarrier承运人
  
    function pageInit(scriptContext) {
        console.log('pageinit')
        var urlsj = GetRequest();
        var cuID = urlsj.cuuID;
        var mode = scriptContext.mode;

        console.log("mode="+mode);
        var custom= setShuJu();
        var mod= scriptContext.mode;
        //console.log("当前的模式mod="+mod);

        //正常下推时发货通知单的id
        var iid = urlsj.id;
        console.log("获取的iid="+iid);
        if(iid && mode=="copy"){
            //正常下推开票时计算已开票总额
            var cuRecord = scriptContext.currentRecord;
            var sumTotal = normalInvoice();
            console.log("正常下推获取的计算已开发票总额=="+sumTotal);
            //发货通知单的总额
            var total = obtainTotal();

            cuRecord.setValue({
                fieldId: 'custbody_invoiced_amount',
                value: sumTotal
            });

            cuRecord.setValue({
                fieldId: 'custbody_delivery_notic',
                value: total
            });

            var Surplus = operation.sub(total || 0 , sumTotal || 0)
            Surplus =Surplus.toFixed(2)
            cuRecord.setValue({
                fieldId: 'custbody_reference_invoice_amount',
                value: Surplus
            });



        }



        if(custom[0] != '' && mod == "create" && cuID != undefined){
            console.log("进入字段赋值");
            
            //console.log("来源单据的id="+custom[0]['id']);
            //发货通知单编号
            var cuRecord = scriptContext.currentRecord;
            var fieldId = scriptContext.fieldId;
            //custbody_cross_customer_invoice 来源单据
            cuRecord.setValue({
                fieldId: 'custbody_cross_customer_invoice',
                value: custom[0]['id']
            });

            //custbody_cust_ordertype订单类型
            var custbody_cust_ordertype = custom[0].getValue({
                name: 'custbody_cust_ordertype'
            });
            cuRecord.setValue({
                fieldId: 'custbody_cust_ordertype',
                value: custbody_cust_ordertype
            });

            var custbody_pc_salesman = custom[0].getValue({
                name: 'custbody_pc_salesman'
            });
            cuRecord.setValue({
                fieldId: 'custbody_pc_salesman',
                value: custbody_pc_salesman
            });
            //custbody_trade_mode贸易方式
            var custbody_trade_mode = custom[0].getValue({
                name: 'custbody_trade_mode'
            });
            cuRecord.setValue({
                fieldId: 'custbody_trade_mode',
                value:  custbody_trade_mode
            });
            //custbody_expected_receipt_date预计签收日期
            var receipt_date = custom[0].getValue({
                name: 'custbody_expected_receipt_date'
            });
            // cuRecord.setValue({
            //     fieldId: 'custbody_expected_receipt_date',
            //     value:  receipt_date
            // });
            //custbody_date_of_acceptance 验收日期
            var date_of_acceptance = custom[0].getValue({
                name: 'custbody_date_of_acceptance'
            });
            cuRecord.setValue({
                fieldId: 'custbody_date_of_acceptance',
                value:  date_of_acceptance
            });
            //shipcarrier承运人 
            var shipcarrier = custom[0].getValue({
                name: 'shipcarrier'
            });
            cuRecord.setValue({
                fieldId: 'shipcarrier',
                value:  shipcarrier
            });
            //跨客户开票 打钩
            cuRecord.setValue({
                fieldId:'custbody_kuakehufapiao',
                value: true
            });

            
            //exchangerate交易汇率
            var exchangerate = custom[0].getValue({
                name: 'exchangerate'
            });
            cuRecord.setValue({
                fieldId: 'exchangerate',
                value: exchangerate
            });

          
            //已开票金额总和
            var sum = AmountMetermination();
            //custbody_invoiced_amount 已开票金额
            cuRecord.setValue({
                fieldId: 'custbody_invoiced_amount',
                value: sum
            });

            var cuTotal =  urlsj.total;
            console.log("获取的cuTotal="+cuTotal);
            //custbody_delivery_notic  发货通知单总金额字段
            if(cuTotal){
                cuRecord.setValue({
                    fieldId: 'custbody_delivery_notic',
                    value: cuTotal
                });
                //剩余开票金额
                var Surplus = operation.sub(cuTotal||0,sum||0)
                Surplus =Surplus.toFixed(2)
                cuRecord.setValue({
                    fieldId: 'custbody_reference_invoice_amount',
                    value: Surplus
                });

            }


            
       


        }   
      


        return true;
    }
    //物料编码/名称:item  

    function fieldChanged(scriptContext) {
        var urlsj = GetRequest();
        var cuID = urlsj.cuuID;
        var cuRecord = scriptContext.currentRecord;
        var sublistId = scriptContext.sublistId;
        var fieldId = scriptContext.fieldId;
        var column = scriptContext.column;
        var line = scriptContext.line;
        //console.log("获得的cuID="+cuID);
        if(cuID != undefined ){

            console.log("获取的sublistId="+sublistId+"，获取的fieldId="+fieldId+"，获取的line="+line+"，获得的column="+column);
            if(sublistId != null){
                var fieldName = cuRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: fieldId
                });
                console.log("获取的文本值"+fieldName);
            }

            if(sublistId=="item"  &&  fieldId=="custcol_itemtype"){
                //进入字段赋值
                //console.log("进入字段赋值")
                var iid = setItem(scriptContext);
                // for (var i = 0; i < iid.length; i++) {
                    
                    
                // }

                //console.log("获取到的对应物料编码的id="+iid);
                var id2 = cuRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_cgoodscode',
                    value: iid,
                });
                //console.log("赋值完成="+id2);
            }
            //rate最终单价//quantity 数量
            //(sublistId=="item"  &&  fieldId=="rate")||
            if(fieldId=="entity"){
                var custom= setShuJu();
                //currency 交易币别
                var currency =custom[0].getValue({
                    name: 'currency'
                })
                console.log("获取的交易币别="+currency);

                var exchangerate =custom[0].getValue({
                    name: 'exchangerate'
                })
                cuRecord.setValue({
                    fieldId: 'currency',
                    value:  currency,
                    ignoreFieldChange:true
                })

                cuRecord.setValue({
                    fieldId: 'exchangerate',
                    value:  exchangerate,
                    ignoreFieldChange:true
                })
            

            }



        }

        if(fieldId=="custbody_final_billing_amount"){

            var line = cuRecord.getLineCount({
                sublistId: 'item'
            });
            //total 总金额
            var total = cuRecord.getValue({
                fieldId: "total"
            });
            console.log("获取的总金额="+total);
            console.log("获取的货品行长度="+line);
            for (var i = 0; i <line; i++) {
                console.log("for循坏赋值开始");
                var rateZ = cuRecord.getSublistText({
                    sublistId: 'item',
                    fieldId: 'rate',
                    line: i
                });
                var lineNum = cuRecord.selectLine({
                    sublistId: 'item',
                    line: i
                });
                //console.log("获取第"+i+"行的最终单价="+rateZ);
                var zRate =FinalUnitPrice(scriptContext,rateZ,total);
                if(zRate == '-99'){
                    return true;
                }
                zRate =zRate.toFixed(4)
                if(zRate=="" || zRate=="NaN" || zRate==null){
                    zRate=0;
                }
                var fdiscount = parseFloat(cuRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_fdiscount',
                    line: i
                }))
                //console.log("将要赋值的zRate = "+ zRate);
                cuRecord.setCurrentSublistValue({
                    sublistId:"item",
                    fieldId:"rate",
                    value:zRate
                });
                cuRecord.setCurrentSublistValue({
                    sublistId:"item",
                    fieldId:"custcol_unit_notax",
                    value: zRate / (isNaN(fdiscount) ? 1 :  fdiscount / 100)
                });
                cuRecord.commitLine({
                    sublistId: 'item'
                });
                
            }


        }


        if(sublistId=="item"  &&  fieldId=="custcol_itemtype"){
            console.log("bom信息变更开始");
            obtainBom(scriptContext);

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
        var cuRecordd =scriptContext.currentRecord;

        var cuuSum =0;
        var urlsj = GetRequest();
        var cuID = urlsj.cuuID;
        var cuRecord= scriptContext.currentRecord;
        if(cuID != undefined){
            //发货通知单的总计
            // console.log("进入保存金额判定");
            var total = Number(urlsj.total);
            // console.log("发货通知单的总计="+total);
            //所有移开发票的总计
            var sum = AmountMetermination();
            // console.log("有有已开发票之和="+sum);
            //当前页面的总计
            var cuuTotal = cuRecord.getValue({
                fieldId:"total"
            });
            // console.log("当前要开的总计="+cuuTotal);
            if(sum>total){
                alert("该发货通知单的开票金额已超标,已开"+sum);
                return false;
            }
            if(sum<total){
                cuuSum =operation.add(sum || 0 , cuuTotal || 0)
                if(cuuSum>total){
                    alert("已开发票金额"+sum+', 加上当前页面开票金额'+cuuTotal+",超过发货通知单总计金额,请确认后保存");
                    return false;
                }
            }


        }
   
 

     
        return true;
    }


    //当选择物料时自动带出对应物料的bom状态和bom
    //custcol_bom_status  bom状态
    function obtainBom(scriptContext){
        var bomRecord =scriptContext.currentRecord;
        var sublistId = scriptContext.sublistId;
        var fieldId = scriptContext.fieldId;
        if(sublistId =="item"){
            console.log("进入obtainBom方法")
            var item = bomRecord.getCurrentSublistValue({
                sublistId:"item",
                fieldId:"item"
            });
            //customdeploy_sales_invoice_sl
            //customscript_sales_invoice_sl
            console.log("获取到的item="+item);
            var slUrl = urll.resolveScript({
                scriptId : 'customscript_sales_invoice_sl',
                deploymentId : 'customdeploy_sales_invoice_sl'
            });
            https.post.promise({
                'url' : slUrl,
                'body': {
                    'item': item
                }
            }).then(function(res){
                //这里没搞懂  记得问问
                var resDate = JSON.parse(res.body);
                console.log('返回的banbNmae本='+ resDate.banbNmae);
                //设置当前行custcol_bom_status 版本状态
                bomRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId  : "custcol_bom_status",
                    value    : resDate.banbNmae
                });
            })


        }

        
    }


    //在任何视图模式下触发。给跨客户开票列表字段赋值  assignment：赋值 创建对应的记录。记录会和发货通知单做关联
    function assignment(scriptContext){
            var bomRecord =scriptContext.currentRecord;
            var cuiID= bomRecord.id;
            //customscript_update_sales_invoice_sl
            //customdeploy_update_sales_invoice_sl
            var slUrl = urll.resolveScript({
                scriptId : 'customscript_update_sales_invoice_sl',
                deploymentId : 'customdeploy_update_sales_invoice_sl'
            });
    
            https.post.promise({
                'url':slUrl,
                'body':{
                    deliveryNoticeID:cuiID
                }
            }).then(function(res){
                var resDate = JSON.parse(res.body);
                console.log(resDate.length);
                for (var i = 0; i < resDate.length; i++) {
                    resDate[i].getValue({
                    })
                    console.log()
                    
                }
    
    
            })
    
            
    }
     //将所有
     function setLineItemSaleId(scriptContext,cuuID){
        var recordInfo = scriptContext.currentRecord;
        var newRecord = record.load({
            type : recordInfo.type,
            id : recordInfo.id
        })
        //总计金额
        var total = newRecord.getValue({
            fieldId:"total"
        })
        //custbody_ordering_time 制单日期
        var custbody_ordering_time = newRecord.getValue({
            fieldId:"custbody_ordering_time"
        })



        var objRecord = record.create({
		    type: "customrecord_cross_client", 
        });
        objRecord.setValue({
            fieldId: 'custrecord8',
            value: averagecost,
         
        });

        //修改后保存
        objRecord.save({
            ignoreMandatoryFields : true
        });



    }
    


    function datWriting(scriptContext){
        var urlsj = GetRequest();
        var cuID = urlsj.cuuID;
        if(cuID != ""){
            console.log("进入数据回写到发货通知单");
            var slUrl = urll.resolveScript({
                scriptId : 'customscript_sales_invoice_sl',
                deploymentId : 'customdeploy_sales_invoice_sl'
            });
            https.post.promise({
                'url' : slUrl,
                'body': {
                    'item': item
                }
            }).then(function(res){
                //这里没搞懂  记得问问
                var resDate = JSON.parse(res.body);
                console.log('返回的banbNmae本='+ resDate.banbNmae);
                //设置当前行custcol_bom_status 版本状态
                bomRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId  : "custcol_bom_status",
                    value    : resDate.banbNmae
                });
            })


        }

    }

    function GetRequest() {  
        var url = location.search; //获取url中"?"符后的字串  
        var theRequest = new Object();  
        if (url.indexOf("?") != -1) {  
           var str = url.substr(1);  
           strs = str.split("&");  
           for(var i = 0; i < strs.length; i ++) {  
              theRequest[strs[i].split("=")[0]]=unescape(strs[i].split("=")[1]);  
           }  
        }  
        return theRequest;  
    } 

    function setShuJu(){
        var urlsj = GetRequest();
        var cuuID = urlsj.cuuID;
        //console.log("获取的数据"+urlsj.cuuID);
        var customFilter = [];
        // customFilter.push({
        //     'name':'isinactive',
        //     'operator':'is',
        //     'values':['F']
        // });
        if(cuuID != null && cuuID != ""){
            console.log("进行条件添加");
            customFilter.push({
                'name':'internalid',
                'operator':search.Operator.ANYOF,
                'values':[cuuID]
            })
        }
        //tranid发货通知单编号  就是来源单据字段
        //exchangerate交易汇率
        //custbody_cust_ordertype订单类型
        //subsidiary子公司
        //department部门
        //custbody_pc_salesman业务员
        //custbody_trade_mode贸易方式
        //custbody_expected_receipt_date预计签收日期
        //custbody_date_of_acceptance 验收日期
        //shipcarrier承运人
        var resultSet = search.create({
            type: search.Type.SALES_ORDER,
            filters:customFilter,
            columns: [   
                         {name:'internalid'},
                         {name:'tranid'},
                         {name:'exchangerate'},
                         {name:'custbody_cust_ordertype'},
                         {name:'subsidiary'},
                         {name:'department'},
                         {name:'custbody_pc_salesman'},
                         {name:'custbody_trade_mode'},
                         {name:'custbody_expected_receipt_date'},
                         {name:'custbody_date_of_acceptance'},
                         {name:'shipcarrier'},
                         {name:'currency'}
                     ]
         }).run();
         
         var custom = resultSet.getRange({
             start : 0,
             end   : 10
         });
        //  for (var i = 0; i < custom.length-1; i++) {

        //     var item = custom[i].getValue({
        //         name: 'item'
        //     });

        //     var description = custom[i].getText(resultSet.columns[1]);
        //     console.log("获取的货品行字段值="+item );
        //     console.log("获取的货品行备注字段值="+description );
             
        //  }
        // console.log("获取的custom的长度="+custom.length);
        return custom;
        
    }

    function setItem(scriptContext){
        //customrecord_customer_product_admini 客户物料管理类型 id
        var  sta = 0;
        var  end = 200;
        var allData = [];
        var empdat  = search.load({
          id:"customsearch_customer_product_admini"
        });

        do{
          var shujuRange =  empdat.run().getRange({
            start: sta,
            end: end
          });
          for (var i = 0; i < shujuRange.length; i++) {

            allData.push(shujuRange[i]);
            
          }
          sta=sta+200;
          end=end+200;
        }while(shujuRange && shujuRange.length>0)
        //console.log("获取的search数据长度="+allData.length);

        var itemRecord= scriptContext.currentRecord;
        //客户id
        var entity = itemRecord.getValue({
            fieldId: 'entity'
        });
        //console.log("获取的当前页面的entity="+entity);
        //物料id
        var item = itemRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "item"
        });
        //console.log("获取的当前页面的item="+item);

        //var itemId=[];
        var itemId="";
        for (var i = 0; i < allData.length; i++) {
            //发货通知单里的客户
            var custrecord_customer = allData[i].getValue({
                name: 'custrecord_customer'
            });
            //发货通知单里的货品
            var intretech_goods = allData[i].getValue({
                name: 'custrecord_intretech_goods'
            });
            if(entity == custrecord_customer && item == intretech_goods){
                itemId=allData[i].getValue({
                    name:"custrecord_customer_product_name"
                });
                //itemId=allData[i]['id'];
                //itemId.push(allData[i]['id']);
            }
            
        }
        //console.log("获取的itemId="+itemId);
        return itemId;

    }

    //计算最终单价并赋值
    //custbody_final_billing_amount 最终开票金额
    //total 含税总金额
    //折前单价custcol_unit_tax
    //custcol_unit_notax 折后单价
    //rate给最终单价赋值
    function FinalUnitPrice(scriptContext,rateZ,total){
        console.log("获取的rateZ="+rateZ);
        var urlsj = GetRequest();
        //var total = urlsj.total;
        var cuRecord = scriptContext.currentRecord;
        //console.log("获取的发货通知单含税总金额="+total);

        //发票最终开票金额字段
        var final_billing_amount = cuRecord.getValue({
            fieldId: 'custbody_final_billing_amount'
        })

        console.log("获取的最终开票金额="+final_billing_amount);


        
        //grossamt当前货品行的总金额
        // var grossamt = cuRecord.getCurrentSublistValue({
        //     sublistId: "item",
        //     fieldId: "grossamt"
        // });

        //custcol_unit_notax   最终单价
        // var rate = cuRecord.getCurrentSublistValue({
        //     sublistId: "item",
        //     fieldId: "rate"
        // });
        //console.log("获取的最终单价="+rate);
        if(total == ""){
            return "-99";
        }
        console.log("获取的最终单价="+rate);
        if(final_billing_amount=="" ){
            return "-99";
        }
        if(rateZ==""){
            return "-99";
        }

        var zRate = Number(final_billing_amount)/Number(total)*Number(rateZ);
        console.log("计算结果="+zRate);
        if(zRate=="" || zRate=="NaN" || zRate==null){
            zRate=0;
        }
        return zRate;
        

    }
    
    

    //Kauai客户开票时 基于该发货通知单的发票的总计金额不能大于发货通知单的总计
    function AmountMetermination(){
        var urlsj = GetRequest();
        //发货通知单的id
        var cuuID = urlsj.cuuID;
        //发货通知单的总计金额
       

        //createdfrom创建自   系统自带开票功能赋值的字段
        //custbody_cross_customer_invoice 来源单据   夸客户开票的字段  
        var customFilter = [];
        if(cuuID != null && cuuID != ""){
            // console.log("创建对应的已保存搜索");
            customFilter.push({
                'name':'createdfrom',
                'operator':search.Operator.ANYOF,
                'values':[cuuID]
            });
            customFilter.push({
                'name':'mainline',
                'operator':"is",
                'values':["T"]
            });

            // customFilter.push({
            //     'name':'custbody_cross_customer_invoice',
            //     'operator':search.Operator.ANYOF,
            //     'values':[cuuID]
            // })
        }

        var custom = search.create({
            type: search.Type.INVOICE,
            filters:customFilter,
            columns: [   
                         {name:'total'},
                         {name:"exchangerate"}
                     ]
         }).run().getRange({
             start : 0,
             end   : 20
         });
         var sum1 = 0;
        //  console.log("获取的通过‘开票’按钮创建已保存搜索的长度="+custom.length);
         for (var i = 0; i < custom.length; i++) {
            var total1 = custom[i].getValue({
                name: 'total'
            });
            var exchangerate = custom[i].getValue({
                name: 'exchangerate'
            });
            total1 = operation.div(total1||0,exchangerate)
            //console.log("第一个已保存搜索的total值="+total1)
            sum1=operation.add(sum1||0,total1||0)
         }
        //  console.log("改发票的内部id="+custom[0].id);
        //  console.log("获取的发票按钮金额="+sum1);
        //  console.log("获取的发票按钮的长度="+custom.length);
         //alert("获取的通过‘开票’按钮创建的发票总和="+sum1);

         var customFilter1 = [];
         var sum2 = 0;
         if(cuuID != null && cuuID != ""){
            //console.log("创建第二个已保存搜索");
         
            customFilter1.push({
                'name':'custbody_cross_customer_invoice',
                'operator':search.Operator.ANYOF,
                'values':[cuuID]
            });
            customFilter1.push({
                'name':'mainline',
                'operator':"is",
                'values':["T"]
            });
        }

        var custom2 = search.create({
            type: search.Type.INVOICE,
            filters:customFilter1,
            columns: [   
                         {name:'total'},
                         {name:"internalId"},
                         {name:"exchangerate"}

                     ]
         }).run().getRange({
             start : 0,
             end   : 20
         });
        
        //  console.log("获取的通过‘夸客户’按钮创建已保存搜索的长度="+custom2.length);
        //  console.log('result='+JSON.stringify());//debug
        var tempRes  = [];
         for (var j = 0; j < custom2.length; j++) {
            var total2 = custom2[j].getValue({
                name: 'total'
            });
            var iid = custom2[j].getValue({
                name: 'internalId'
            });
            tempRes.push({
                'id':iid,
                'total':total2,
            });
            var exchangerate2 = custom2[j].getValue({
                name: 'exchangerate'
            });
            total2 = operation.div(total2||0,exchangerate2)
            // console.log("第2个已保存搜索的total值="+total2+",id="+iid);
             sum2=operation.add(sum2||0,total2||0)
             
         }

        return operation.add(sum1 || 0,sum2 || 0 )
        
    }



    //正常下推开票时计算已开票总额
    function normalInvoice(){
            var urlsj = GetRequest();
            //发货通知单的id
            var cuuID = urlsj.id;
            //发货通知单的总计金额
           
    
            //createdfrom创建自   系统自带开票功能赋值的字段
            //custbody_cross_customer_invoice 来源单据   夸客户开票的字段  
            var customFilter = [];
            if(cuuID != null && cuuID != ""){
                // console.log("创建对应的已保存搜索");
                customFilter.push({
                    'name':'createdfrom',
                    'operator':search.Operator.ANYOF,
                    'values':[cuuID]
                });
                customFilter.push({
                    'name':'mainline',
                    'operator':"is",
                    'values':["T"]
                });
    
                // customFilter.push({
                //     'name':'custbody_cross_customer_invoice',
                //     'operator':search.Operator.ANYOF,
                //     'values':[cuuID]
                // })
            }
    
            var custom = search.create({
                type: search.Type.INVOICE,
                filters:customFilter,
                columns: [   
                             {name:'total'},
                             {name:"exchangerate"}
                         ]
             }).run().getRange({
                 start : 0,
                 end   : 20
             });
             var sum1 = 0;
            //  console.log("获取的通过‘开票’按钮创建已保存搜索的长度="+custom.length);
             for (var i = 0; i < custom.length; i++) {
                var total1 = custom[i].getValue({
                    name: 'total'
                });
                var exchangerate = custom[i].getValue({
                    name: 'exchangerate'
                });
                total1 = operation.div(total1 || 0 , exchangerate)
                //console.log("第一个已保存搜索的total值="+total1)
                sum1= operation.add(sum1||0,total1||0)
             }
            //  console.log("改发票的内部id="+custom[0].id);
            //  console.log("获取的发票按钮金额="+sum1);
            //  console.log("获取的发票按钮的长度="+custom.length);
             //alert("获取的通过‘开票’按钮创建的发票总和="+sum1);
    
             var customFilter1 = [];
             var sum2 = 0;
             if(cuuID != null && cuuID != ""){
                //console.log("创建第二个已保存搜索");
             
                customFilter1.push({
                    'name':'custbody_cross_customer_invoice',
                    'operator':search.Operator.ANYOF,
                    'values':[cuuID]
                });
                customFilter1.push({
                    'name':'mainline',
                    'operator':"is",
                    'values':["T"]
                });
            }
    
            var custom2 = search.create({
                type: search.Type.INVOICE,
                filters:customFilter1,
                columns: [   
                             {name:'total'},
                             {name:"internalId"},
                             {name:"exchangerate"}
    
                         ]
             }).run().getRange({
                 start : 0,
                 end   : 20
             });
            
            //  console.log("获取的通过‘夸客户’按钮创建已保存搜索的长度="+custom2.length);
            //  console.log('result='+JSON.stringify());//debug
            var tempRes  = [];
             for (var j = 0; j < custom2.length; j++) {
                var total2 = custom2[j].getValue({
                    name: 'total'
                });
                var iid = custom2[j].getValue({
                    name: 'internalId'
                });
                tempRes.push({
                    'id':iid,
                    'total':total2,
                });
                var exchangerate2 = custom2[j].getValue({
                    name: 'exchangerate'
                });
                 total2 = operation.div(total2 || 0 , exchangerate2)
                // console.log("第2个已保存搜索的total值="+total2+",id="+iid);
                 sum2=operation.add(sum2 || 0 , total2 || 0)
                 
             }

            return operation.add(sum1||0,sum2||0)
            
    }
    //通过发货通知单id创建搜索获取总额
    function obtainTotal(){
        var urlsj = GetRequest();
        //发货通知单的id
        var iid = urlsj.id;
        console.log("正常下推开票时获取到的发货通知单id="+iid);
        var filters=[];
        var total ='';
        if(iid){
            filters.push({
                'name':'mainline',
                'operator':"is",
                'values':["T"]
            });
            filters.push({
                'name':'internalId',
                'operator':"is",
                'values':[iid]

            })
            //发货通知单的已保存搜索
            var salesorderSearch = search.create({
                type: 'transaction',
                filters:filters,
                columns: [   
                             {name:'total'},
                             {name:"exchangerate"}
    
                         ]
             }).run().getRange({
                 start : 0,
                 end   : 3
            });
            console.log("通过id获取的发货通知单的搜索长度==="+salesorderSearch.length);
            total = salesorderSearch[0].getValue({
                name:"total"
            })
            var exchangerate2 = salesorderSearch[0].getValue({
                name: 'exchangerate'
            });

            total=operation.div(total||0,exchangerate2)
        }

        return total;
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

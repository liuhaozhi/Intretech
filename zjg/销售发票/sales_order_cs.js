/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/search','N/url','N/https',
], function(
    search,
    urll,
    https
) {
    function pageInit(context){

        return true
    }

    function validateLine(context){
        return true
    }

    function fieldChanged(context){
        var sublistId = context.sublistId;
        var fieldId = context.fieldId;
        var line = context.line;
        console.log("sublistId="+sublistId+",fieldId="+fieldId+",行line="+line);
        
        
        if(sublistId=="item"  &&  fieldId=="custcol_itemtype"){
            console.log("bom信息变更开始");
            obtainBom(context);
            console.log("bom信息变更结束");

        }
        if(fieldId =="entity"){
            console.log("entity开始");
            var department = DepartmentalSet(context);
            var cuRecord =context.currentRecord;
            cuRecord.setValue({
                fieldId:"department",
                value:department
            })
            console.log("entity结束");

        }
        // if(sublistId=="item" && fieldId =="custcol_change_reason"){
        //     var bomRecord = context.currentRecord;
        //     var item = bomRecord.getCurrentSublistValue({
        //         sublistId:"item",
        //         fieldId:"item"
        //     });
        //     //箱数（Ctns）：出货数量/每箱数量;
        //     var quantity = bomRecord.getCurrentSublistValue({
        //         sublistId: "item",
        //         fieldId  : "quantity"
        //     })
        //     console.log("获取的数量="+quantity);
        //     //custcol_quantity_per_carton 每箱数量
        //     var custcol_quantity_per_carton = bomRecord.getCurrentSublistValue({
        //         sublistId: "item",
        //         fieldId  : "custcol_quantity_per_carton"
        //     })   
        //     var custcol_boxes_numbers = '';
        //     if(!custcol_quantity_per_carton){custcol_quantity_per_carton=0};
        //     console.log("获取的custcol_quantity_per_carton="+custcol_quantity_per_carton );
        //     custcol_boxes_numbers = Number(quantity)/Number(custcol_quantity_per_carton);
        //     if(custcol_boxes_numbers ==Infinity){custcol_boxes_numbers=0};
        //     console.log("计算后的值="+custcol_boxes_numbers);
        //     bomRecord.setCurrentSublistValue({
        //         sublistId: "item",
        //         fieldId  : "custcol_boxes_numbers",
        //         value    : custcol_boxes_numbers
        //     });
        //     console.log("箱数计算结束 箱数="+custcol_boxes_numbers);
        // }
        if(sublistId=="item" && fieldId =="quantity"){
            console.log("calculatedValue 开始");
            calculatedValue(context)
            console.log("calculatedValue 结束");
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
                    fieldId  : "custcol_bom_version",
                    value    : resDate.banbNmae
                });

                bomRecord.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId  : "custcol_bom_status",
                    value    : resDate.bom_approvestatus2
                });
            })


        }

        
    }


    //custcol_customer_product_cod客户物料编码字段



    // function fieldChanged(context) {
    //     var cuRecord = context.currentRecord;
    //     var fieldId = context.fieldId;
    //     var sublistId = context.sublistId;
    //     var line = context.line;
    //    // console.log(",获得的sublistId="+sublistId+",获取的fieldId="+fieldId+",获取的行="+line);
    //     if(fieldId ==="item"){
    //         var customer_discount8=Assignment(context);
    //         console.log("调用方法返回的customer_discount8="+customer_discount8);
    //         calculatedDiscount(context,customer_discount8);

    //         //console.log("字段值="+sublistValue);
    //     }
    //     if(context.fieldId === "entity"){
    //         var entityId = cuRecord.getValue({
    //             fieldId:"entity"
    //         });
    //         console.log("获取的客户id"+entityId);
    //         var shuju = FieldAssignment(entityId)
    //         // cuRecord.setValue({
    //         //     fieldId: 'custbody_sales_order_customer_discount',
    //         //     value: shuju[0],
    //         //     ignoreFieldChange: true,
    //         //     fireSlavingSync: true
    //         // });

    //         cuRecord.setValue({
    //             fieldId: 'custbody_subsidiary_default_curency',
    //             value: shuju[1],
    //             ignoreFieldChange: true,
    //             fireSlavingSync: true
    //         });


    //        //calculatedDiscount(context,shuju);
    //     }
    //     return true;

    // }

       //计算最终折扣  赵金根
       //获得的sublistId=item,获取的fieldId=custcol_row_customer_discount,获取的行=0  客户折扣字段
       //item  货品字段

       //获得的sublistId=item,获取的fieldId=custcol_row_final_discount,获取的行=0   最终折扣
       function calculatedDiscount(context,customer_discount2){
        var cuRecord = context.currentRecord;
        //客户折扣(%)
        var customerDiscount = customer_discount2;
        //公司间交易折扣(%)
        var interDiscount = cuRecord.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_row_inter_transaction_dis'
        });

        //custcol_row_final_discount最终折扣
        var interDiscountSp = interDiscount.toString().split("%");
        if(interDiscount == "" && customerDiscount==""){
            console.log("两个都为空");
            cuRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_row_final_discount',
                value: "",
                ignoreFieldChange: true
            });
            return;
        }
        if(customerDiscount ==""){
            console.log("客户折扣为空最终折扣="+interDiscountSp[0]);
            cuRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_row_final_discount',
                value: interDiscount,
                ignoreFieldChange: true
            });
            return;
        }

        if(interDiscount == ""){
            cuRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_row_final_discount',
                value: customerDiscount,
                ignoreFieldChange: true
            });
            return;
        }

        var zuizhong  =  (customerDiscount)*(interDiscountSp[0])/100
        cuRecord.setValue({
            fieldId : 'custbody_final_discount',
            value : zuizhong
        });
        cuRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_row_final_discount',
            value: zuizhong,
            ignoreFieldChange: true
        });
       
    }

    //当选择客户时给客户折扣字段custbody_sales_order_customer_discount和子公司本位币(基准货币）字段custbody_subsidiary_default_curency赋值
    function FieldAssignment(entityId){
        //console.log("进入按条件查询");
        var customFilter = [];
        var shuju = [];
        customFilter.push({
            'name': 'internalid',
            'operator' : search.Operator.ANYOF,
            'values':[entityId]
        });
        var custom = search.create({
            type: search.Type.CUSTOMER,
            filters:customFilter,
 
         //    filters:[
         //     ['internalid','anyof',[empId]],
         //     'and',
         //     ['custentity8','anyof',[empZhiwei]],
         //     // ['custentity_post_rank',search.Operator.IS,postrank]
         //    ],
             columns: [  
                         {name: 'custentity_customer_discount'}, 
                         {name: 'currency'}
                     ]
         }).run().getRange({
             start : 0,
             end   : 3
         });

         


        var customerDiscount = custom[0].getValue({
            name:"custentity_customer_discount"
        });

        var currency = custom[0].getText({
            name:"currency"
        });
        var newcustomerDiscount = customerDiscount.toString().split("%");
        
        //  console.log("获取的以保存搜索的长度="+custom.length);

        //  console.log("获取的customerDiscount="+customerDiscount);

        //  console.log("获取的currencyt="+currency);
        //  console.log("获取的newcustomerDiscount="+newcustomerDiscount);
         shuju.push(newcustomerDiscount[0]);
         shuju.push(currency);
         return shuju;

    }
    //获得的sublistId=item,获取的fieldId=custcol_row_customer_discount,获取的行=0
    function  Assignment(context){
        var cuuRecord = context.currentRecord;
        //客户
        var entity = cuuRecord.getValue({
            fieldId:'entity'
        })
        console.log("获取的销售订单上的客户entity="+entity)
        //subsidiary 子公司
        var subsidiary = cuuRecord.getValue({
            fieldId:'subsidiary'
        });
        //货品item
        var itema = cuuRecord.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item'
        });

        //customsearch_selling_price  销售价格表已保存搜索
        var sellingPrice = search.load({
			id:"customsearch_selling_price"
        });
        var sellingPriceData = sellingPrice.run().getRange({
			start: 0,
			end: 1000
         });
        var customer_discount3='';
        for (var  i = 0; i < sellingPriceData.length; i++) {
            //客户
            var price_client = sellingPriceData[i].getValue({
                name:"custrecord_selling_price_client"
            });

            //子公司
            var item_name = sellingPriceData[i].getValue({
                name:"custrecord_selling_price_subsidiary"
            });
            //货品名称
            //custrecord_cust_price_item_name
            var price_item_name = sellingPriceData[i].getValue({
                name:"custrecord_cust_price_item_name"
            });
            console.log("获取的货品名称itema="+itema+"，获取的销售表price_item_name="+price_item_name);
            console.log("获取的客户entity="+entity+"，获取的销售表price_client="+price_client);
            if(entity==price_client && itema==price_item_name){
                var customer_discount = sellingPriceData[i].getValue({
                    name:'custrecord_cust_customer_discount'
                });
                console.log("获取的customer_discount客户折扣="+customer_discount);
                var customer_discount2 = customer_discount.split("%");
                customer_discount3=customer_discount2[0];
                console.log("获取的customer_discount3客户折扣="+customer_discount3);
                cuuRecord.setCurrentSublistText({
                    sublistId: 'item',
                    fieldId: 'custcol_row_customer_discount',
                    text: customer_discount3,
                    ignoreFieldChange: true
                });
                break;
            }else{
                customer_discount3='';
                cuuRecord.setCurrentSublistText({
                    sublistId: 'item',
                    fieldId: 'custcol_row_customer_discount',
                    text: "",
                    ignoreFieldChange: true
                });
                cuuRecord.setCurrentSublistText({
                    sublistId: 'item',
                    fieldId:'custcol_row_final_discount',
                    text: "",
                    ignoreFieldChange: true
                });

            }

            
       
            
            
        }

        return customer_discount3;
    }


    function DepartmentalSet(context){
        var customFilter= [];
        var cuRecord = context.currentRecord;
        var entity = cuRecord.getValue({
            fieldId:"entity" 
        })
        if(entity){
            customFilter.push({
                'name':'internalId',
                'operator':"is",
                'values':[entity]
            });
        }
        //subsidiary 子公司
        //custentity_department 部门
        var customerSearch = search.create({
            type:search.Type.CUSTOMER,
            filters:customFilter,
            columns:[
                {name:"custentity_department"},
                {name:"subsidiary"}
            ]

        }).run().getRange({
            start : 0,
            end   : 3
        });
        var custentity_department = customerSearch[0].getValue({
            name:"custentity_department"
        })

        //DEPARTMENT  部门 

        return custentity_department;

    }
    //从货品里拿值  并计算赋值给
    //custitem_quantity_per_box 每箱数量
    //custitem_single_net_weight 单个净重
    //custitem_single_case_package_weight 单箱包材重
    //custitem_weight_per_pallet 单栈板重量
    //custitem_cubic_meter_per_case 单箱立方数
    //custitem_cubic_meter_per_pallet 单栈板立方数
    //custitem_standard_box_qty_per_pallet  标准单栈箱数
    //栈板数量

    // （2）     箱数（Ctns）：出货数量/每箱数量;
    // （3）     总净重（KGS）：单个净重*出货数量；
    //           总托数：箱数/标准单栈箱数 ；
    // （4）     总毛重（KGS）：净重+单箱包材重*箱数+单栈板重量*栈板数量；
    // （5）     总立方数（CBM）：单箱立方数*箱数+单栈板立方数*栈板数量；
  
    //quantity 数量
    //custcol_boxes_numbers 箱数
    function calculatedValue(context){
    
            var bomRecord = context.currentRecord;
            //箱数（Ctns）：出货数量/每箱数量;
            var quantity = bomRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId  : "quantity"
            })
            //custcol_quantity_per_carton 每箱数量
            var custcol_quantity_per_carton = bomRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_quantity_per_carton"
            })   
        
            if(!custcol_quantity_per_carton){custcol_quantity_per_carton=0};
           
            var custcol_boxes_numbers = Number(quantity)/Number(custcol_quantity_per_carton);
            if(custcol_boxes_numbers ==Infinity){custcol_boxes_numbers=0};
            console.log("计算后的值="+custcol_boxes_numbers);
            bomRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_boxes_numbers",
                value    : custcol_boxes_numbers
            });
            console.log("箱数计算结束 箱数="+custcol_boxes_numbers);

            //custcol_total_net_weight 总净重
            //总净重（KGS）：单个净重*出货数量；
            //custcol_sinweight 单个净重 
            var custcol_sinweight = bomRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_sinweight"
            }) 
            if(!custcol_sinweight){custcol_sinweight=0};
            if(!quantity){quantity=0};  
            var custcol_total_net_weight = Number(custcol_sinweight)*Number(quantity);
            console.log("总净重计算结束 总净重="+custcol_total_net_weight);
            if(custcol_total_net_weight ==Infinity){custcol_total_net_weight=0};
            bomRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_total_net_weight",
                value    : custcol_total_net_weight
            });

            //custcol_standard_single_number 标准单栈箱数
            //custcol_sup_total 总托数
            //总托数：箱数/标准单栈箱数
            var custcol_standard_single_number = bomRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_standard_single_number"
            }) 
            if(!custcol_boxes_numbers){custcol_boxes_numbers=0};
            if(!custcol_standard_single_number){custcol_standard_single_number=0};
            var custcol_sup_total = Number(custcol_boxes_numbers)/Number(custcol_standard_single_number);
            if(!custcol_sup_total){custcol_sup_total=0};
            console.log("总托数计算结束 总托数="+custcol_sup_total);
            
            bomRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_sup_total",
                value    : custcol_sup_total
            });
            //
            //总毛重（KGS）：净重+单箱包材重*箱数+单栈板重量*栈板数量；
            //custcol_total_gross_weight 总毛重
            //custcol_material_weight 单箱包材重 
            //custcol_number_of_single_pallet 单栈板重量 
            var custcol_material_weight = bomRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_material_weight"
            }) 
            if(!custcol_material_weight){custcol_material_weight=0;}
            var custcol_number_of_single_pallet = bomRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_number_of_single_pallet"
            }) 
            if(!custcol_number_of_single_pallet){    custcol_number_of_single_pallet=0;}
            var custcol_total_gross_weight = Number(custcol_total_net_weight)+Number(custcol_material_weight)*Number(custcol_boxes_numbers)+Number(custcol_number_of_single_pallet)*Number(custcol_sup_total);
            console.log("总毛重计算结束 总毛重="+custcol_total_gross_weight);
            bomRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_total_gross_weight",
                value    : custcol_total_gross_weight
            });
            console.log("总毛重计算结束 总毛重="+custcol_total_gross_weight);
            //custcol_total_cubic_number 总立方数
            //总立方数（CBM）：单箱立方数*箱数+单栈板立方数*栈板数量；
            //custcol_cubic_number 单箱立方数
            //custcol_cubic_number_of_single 单栈板立方数
            var custcol_cubic_number = bomRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_cubic_number"
            }) 

            var custcol_cubic_number_of_single  = bomRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_cubic_number_of_single"
            }) 
            if(!custcol_cubic_number){custcol_cubic_number=0;}
            if(!custcol_cubic_number_of_single){custcol_cubic_number_of_single=0;}
            var custcol_total_cubic_number = Number(custcol_cubic_number)*Number(custcol_boxes_numbers)+Number(custcol_cubic_number_of_single)*Number(custcol_sup_total);
            console.log("总立方数计算结束 总立方数="+custcol_total_cubic_number);
            bomRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_total_cubic_number",
                value    : custcol_total_cubic_number
            });
            console.log("总立方数计算结束 总立方数="+custcol_total_cubic_number);

    }

    
    
    return {
        pageInit : pageInit,
        validateLine : validateLine,
        fieldChanged: fieldChanged
    }
})

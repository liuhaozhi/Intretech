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
          
        if(sublistId=="item"  &&  fieldId=="custcol_itemtype"){
            obtainBom(context);
        }
        if(fieldId =="entity"){
            var department = DepartmentalSet(context);
            var cuRecord =context.currentRecord;
            cuRecord.setValue({
                fieldId:"department",
                value:department
            })
        }

        if(sublistId=="item" && fieldId =="quantity"){
            calculatedValue(context)
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
            var item = bomRecord.getCurrentSublistValue({
                sublistId:"item",
                fieldId:"item"
            });

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
                var resDate = JSON.parse(res.body);
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

       function calculatedDiscount(context,customer_discount2){
        var cuRecord = context.currentRecord;
        var customerDiscount = customer_discount2;
        var interDiscount = cuRecord.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_row_inter_transaction_dis'
        });

        var interDiscountSp = interDiscount.toString().split("%");
        if(interDiscount == "" && customerDiscount==""){
            cuRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_row_final_discount',
                value: "",
                ignoreFieldChange: true
            });
            return;
        }
        if(customerDiscount ==""){
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

    function FieldAssignment(entityId){
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
         shuju.push(newcustomerDiscount[0]);
         shuju.push(currency);
         return shuju;

    }
    function  Assignment(context){
        var cuuRecord = context.currentRecord;
        //客户
        var entity = cuuRecord.getValue({
            fieldId:'entity'
        })
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

            if(entity==price_client && itema==price_item_name){
                var customer_discount = sellingPriceData[i].getValue({
                    name:'custrecord_cust_customer_discount'
                });
                var customer_discount2 = customer_discount.split("%");
                customer_discount3=customer_discount2[0];
     
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

            bomRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_boxes_numbers",
                value    : Math.ceil(custcol_boxes_numbers) 
            });

            var custcol_sinweight = bomRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_sinweight"
            }) 
            if(!custcol_sinweight){custcol_sinweight=0};
            if(!quantity){quantity=0};  
            var custcol_total_net_weight = Number(custcol_sinweight)*Number(quantity);
            if(custcol_total_net_weight ==Infinity){custcol_total_net_weight=0};
            bomRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_total_net_weight",
                value    : custcol_total_net_weight
            });

            var custcol_standard_single_number = bomRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_standard_single_number"
            }) 
            if(!custcol_boxes_numbers){custcol_boxes_numbers=0};
            if(!custcol_standard_single_number){custcol_standard_single_number=0};
            var custcol_sup_total = Number(custcol_boxes_numbers)/Number(custcol_standard_single_number);
            if(!custcol_sup_total){custcol_sup_total=0};
            
            bomRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_sup_total",
                value    : Math.ceil(custcol_sup_total) 
            });
            
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

            bomRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_total_gross_weight",
                value    : custcol_total_gross_weight
            });

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

            bomRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId  : "custcol_total_cubic_number",
                value    : custcol_total_cubic_number
            });
    }

    
    
    return {
        pageInit : pageInit,
        validateLine : validateLine,
        fieldChanged: fieldChanged
    }
})

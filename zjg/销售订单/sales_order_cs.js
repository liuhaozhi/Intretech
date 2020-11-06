/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(
    ['N/search','N/url','N/https'], function(
    search,
    urll,
    https
) {
    var currentRecord;
    function pageInit(context){
        currentRecord = context.currentRecord;
        return true
    }

    function fieldChanged(context){
        var sublistId = context.sublistId;
        var fieldId = context.fieldId;
        var line = context.line;

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
        fieldChanged: fieldChanged
    }
})

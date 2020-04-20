/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search','N/log','N/record'],

function(search,log,record) {
    


    function pageInit(scriptContext) {
        console.log("进入货品11111111111111111111111");
  
        return true;
        
    }

    function fieldChanged(scriptContext) {
        var cuRecord = scriptContext.currentRecord;
        var sublistId = scriptContext.sublistId;
        var fieldId = scriptContext.fieldId;
        var line = scriptContext.line;
        console.log("获取的sublistId="+sublistId+"，获取的fieldId="+fieldId+"，获取的line="+line);
    
        

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
        
        //custitem_single_case_gross_weight 单箱毛重(KGS)=custitem_single_net_weight 单个净重(KGS) * custitem_quantity_per_box每箱数量(PCS) + custitem_single_case_package_weight单箱包材重(KGS)
        var cuRecord = scriptContext.currentRecord;
        var custitem_single_case_gross_weight ='';
        var custitem_single_net_weight = cuRecord.getValue({
            fieldId:'custitem_single_net_weight'
        });
        var custitem_quantity_per_box = cuRecord.getValue({
            fieldId:'custitem_quantity_per_box'
        });

        var custitem_single_case_package_weight = cuRecord.getValue({
            fieldId:'custitem_single_case_package_weight'
        });
        if(custitem_single_net_weight&&custitem_quantity_per_box&&custitem_single_case_package_weight){
            custitem_single_case_gross_weight = Number(custitem_single_net_weight)*Number(custitem_quantity_per_box)+Number(custitem_single_case_package_weight);
            cuRecord.setValue({
                fieldId:'custitem_single_case_gross_weight',
                value:custitem_single_case_gross_weight
            });

        }
        var  custitem_standard_item_gwgt_per_pallet =''
        //custitem_standard_item_gwgt_per_pallet标准单栈货毛重（含栈和货）= custitem_single_case_gross_weight单箱毛重*custitem_standard_box_qty_per_pallet标准单栈箱数+custitem_weight_per_pallet单栈板重量；
        var custitem_standard_box_qty_per_pallet = cuRecord.getValue({
            fieldId:'custitem_standard_box_qty_per_pallet'
        });

        var custitem_weight_per_pallet = cuRecord.getValue({
            fieldId:'custitem_weight_per_pallet'
        });
        if(custitem_single_case_gross_weight&&custitem_standard_box_qty_per_pallet&&custitem_weight_per_pallet){
            custitem_standard_item_gwgt_per_pallet = Number(custitem_single_case_gross_weight)*Number(custitem_standard_box_qty_per_pallet)+Number(custitem_weight_per_pallet);
            cuRecord.setValue({
                fieldId:'custitem_standard_item_gwgt_per_pallet',
                value:custitem_standard_item_gwgt_per_pallet
            });

        }

        //custitem_cubic_meter_per_case 单箱立方数（CBM）= custitem_carton_specification_length纸箱规格（长M）*custitem_carton_specification_width纸箱规格（宽M）*custitem_carton_specification_height纸箱规格（高M）；
       var custitem_carton_specification_length = cuRecord.getValue({
           fieldId:'custitem_carton_specification_length'
       }) 
       var custitem_carton_specification_width = cuRecord.getValue({
           fieldId:'custitem_carton_specification_width'
       })
       var custitem_carton_specification_height = cuRecord.getValue({
            fieldId:'custitem_carton_specification_height'
       })
       if(custitem_carton_specification_length&&custitem_carton_specification_width&&custitem_carton_specification_height){
            var custitem_cubic_meter_per_case=Number(custitem_carton_specification_length)*Number(custitem_carton_specification_width)*Number(custitem_carton_specification_height);
            cuRecord.setValue({
                fieldId:'custitem_cubic_meter_per_case',
                value:custitem_cubic_meter_per_case
            });
        }

        //custitem_cubic_meter_per_pallet 单栈板立方数（CBM）= custitem_pallet_specification_length栈板规格（长M）*custitem_pallet_specification_width栈板规格（宽M）*custitem_pallet_specification_height栈板规格（高M）；
        var custitem_pallet_specification_length = cuRecord.getValue({
            fieldId:'custitem_pallet_specification_length'
        }) 
        var custitem_pallet_specification_width = cuRecord.getValue({
            fieldId:'custitem_pallet_specification_width'
        })
        var custitem_pallet_specification_height = cuRecord.getValue({
             fieldId:'custitem_pallet_specification_height'
        })
        if(custitem_pallet_specification_length&&custitem_pallet_specification_width&&custitem_pallet_specification_height){
             var custitem_cubic_meter_per_pallet=Number(custitem_pallet_specification_length)*Number(custitem_pallet_specification_width)*Number(custitem_pallet_specification_height);
             cuRecord.setValue({
                 fieldId:'custitem_cubic_meter_per_pallet',
                 value:custitem_cubic_meter_per_pallet
             });
        }
        return true;
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

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/search','N/log'],

function(search,log) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
        var res={};
        //https请求的参数 parameters返回的是对象类型参数
        var params  = context.request.parameters;
        var item =params.item;
        log.error("获取的货品字段Value字段值="+item);
        var temporarySearch = itmSearch(item);
            //custitem_quantity_per_box 每箱数量
            //custitem_single_net_weight 单个净重
            //custitem_single_case_package_weight 单箱包材重
            //custitem_weight_per_pallet 单栈板重量
            //custitem_cubic_meter_per_case 单箱立方数
            //custitem_cubic_meter_per_pallet 单栈板立方数
            //custitem_standard_box_qty_per_pallet  标准单栈箱数
        var custitem_quantity_per_box = temporarySearch.getValue({
            name:"custitem_quantity_per_box"
        })
        var custitem_single_net_weight = temporarySearch.getText({
            name:"custitem_single_net_weight"
        })
        var custitem_single_case_package_weight = temporarySearch.getValue({
            name:"custitem_single_case_package_weight"
        })
        var custitem_weight_per_pallet = temporarySearch.getText({
            name:"custitem_weight_per_pallet"
        })
        var custitem_cubic_meter_per_case = temporarySearch.getValue({
            name:"custitem_cubic_meter_per_case"
        })
        var custitem_cubic_meter_per_pallet = temporarySearch.getText({
            name:"custitem_cubic_meter_per_pallet"
        })
        var custitem_standard_box_qty_per_pallet = temporarySearch.getValue({
            name:"custitem_standard_box_qty_per_pallet"
        })
        res['custitem_quantity_per_box']=custitem_quantity_per_box;
        res['custitem_single_net_weight']=custitem_single_net_weight;
        res['custitem_single_case_package_weight']=custitem_single_case_package_weight;
        res['custitem_weight_per_pallet']=custitem_weight_per_pallet;
        res['custitem_cubic_meter_per_case']=custitem_cubic_meter_per_case;
        res['custitem_cubic_meter_per_pallet']=custitem_cubic_meter_per_pallet;
        res['custitem_standard_box_qty_per_pallet']=custitem_standard_box_qty_per_pallet;
        //对象转为字符串返回
        context.response.write({
            output: JSON.stringify(res)
        });

       


    }

    //查询对应的search搜索
    function itmSearch(item){
        var customFilter=[];

        if(item != ""){
            customFilter.push({
                'name':'internalId',
                'operator':'is',
                'values':[item]
            });
        
            //itemid物料代码字段
            //lotnumberedinventoryitem
            //LOT_NUMBERED_INVENTORY_ITEM
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
            // （4）     总毛重（KGS）：净重+单箱包材重*箱数+单栈板重量*栈板数量；
            // （5）     总立方数（CBM）：单箱立方数*箱数+单栈板立方数*栈板数量；
            // （6）     总托数：箱数/标准单栈箱数 ；
            var custom = search.create({
                type: search.Type.ITEM,
                filters:customFilter,
                columns: [   
                            {name:'itemid'},
                            {name:'custitem_quantity_per_box'},
                            {name:'custitem_single_net_weight'},
                            {name:'custitem_single_case_package_weight'},
                            {name:'custitem_weight_per_pallet'},
                            {name:'custitem_cubic_meter_per_case'},
                            {name:'custitem_cubic_meter_per_pallet'},
                            {name:'custitem_standard_box_qty_per_pallet'},

                        ]
            }).run().getRange({
                start : 0,
                end   : 3
            });
            log.error("获取的物料搜索长度="+custom.length);

            return custom[0];

        }
        

    }



    return {
        onRequest: onRequest
    };
    
});

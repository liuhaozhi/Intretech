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
        var temporarySearch = maxBOM(item);
        //effectivestartdate  有效开始日期
        //name 版本号
        //custrecord_ps_bom_approvestatus2 审核状态    
        var banbNmae = temporarySearch.getValue({
            name:"name"
        })
        var bom_approvestatus2 = temporarySearch.getText({
            name:"custrecord_ps_bom_approvestatus2"
        })
        log.error("获取的版本号banbNmae="+banbNmae+"  ，获取的bom_approvestatus2="+bom_approvestatus2);
        res['banbNmae']=banbNmae;
        res['bom_approvestatus2']=bom_approvestatus2;
        log.error("res里的banbNmae数据是="+res.banbNmae);
        //对象转为字符串返回
        context.response.write({
            output: JSON.stringify(res)
        });

       


    }

    //获取bom开始日期最大的search对象
    function maxBOM(item){
        var customFilter=[];
        var bomCustomFilter=[];
        var bomRevisionCustomFilter =[];
        if(item != ""){
            customFilter.push({
                'name':'internalId',
                'operator':search.Operator.ANYOF,
                'values':[item]
            });
        
            //itemid物料代码字段
            //lotnumberedinventoryitem
            //LOT_NUMBERED_INVENTORY_ITEM

            var custom = search.create({
                type: search.Type.ITEM,
                filters:customFilter,
                columns: [   
                            {name:'itemid'}
                        ]
            }).run().getRange({
                start : 0,
                end   : 3
            });
            log.error("获取的物料搜索长度="+custom.length);
            //itemid物料代码id 
            var itemid = custom[0].getValue({
                name:'itemid'
            })

            log.error("获取的itemid="+itemid);
            var shuju='name';
            if(itemid != ""){
                log.error("itemId不为空");

                bomCustomFilter.push({
                    'name':'name',
                    'operator':'is',
                    'values':[itemid]
                });
            }
            var bom = search.create({
                type: search.Type.BOM,
                filters:bomCustomFilter,
                columns: [   
                            {name:'name'},
                            {name:'internalId'}
                        ]
            }).run().getRange({
                start : 0,
                end   : 100
            });
            log.error("获取的货品对应的物料单bom的长度="+bom.length);
            var iid = bom[0].getValue({
                name:"internalId"
            })
            log.error("获取的iid="+iid);
            var namea = bom[0].getValue({
                name:"name"
            })
            log.error("获取的namea="+namea);
            var bomId=bom[0]["id"];
            log.error("获取的bomId="+bomId);


            if(bomId != ""){
                bomRevisionCustomFilter.push({
                    'name':'billofmaterials',
                    'operator':search.Operator.ANYOF,
                    'values':[bomId]
                })
            }
            //effectivestartdate  有效开始日期
            //name 版本号
            //custrecord_ps_bom_approvestatus2 审核状态
            var bomrevision = search.create({
                type: search.Type.BOM_REVISION,
                filters:bomRevisionCustomFilter,
                columns: [   
                            {name:"name"},
                            {name :"effectivestartdate"},
                            {name:"custrecord_ps_bom_approvestatus2"}
                        ]
            }).run().getRange({
                start : 0,
                end   : 100
            });
            log.error("获取的bom对应的bom版本号bomrevision的长度="+bomrevision.length);
            //临时变量
            var temporaryDate ="1990-01-01";
            var temporarySearch="";
            for (var i = 0; i < bomrevision.length; i++) {

                var effectivestartdate = bomrevision[i].getValue({
                    name:"effectivestartdate"
                })
                if(effectivestartdate >temporaryDate){
                    temporary=effectivestartdate;
                    temporarySearch=bomrevision[i];
                }


            }
            //BOM_REVISION
            //bomrevision 物料单版本号的type


            return temporarySearch;

        }
        

    }



    return {
        onRequest: onRequest
    };
    
});

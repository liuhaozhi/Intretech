/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define({
    searchColumns : function (params){
        return  [
            { //订单
                name : 'custrecord_p_custcol_salesorder',
                sort : 'ASC'
            },{ //行号
                name : 'custrecord_p_custcol_line',
                sort : 'ASC'
            },{ //物料编码
                name : 'custrecord_p_item'
            },{ //物料名称
                name : 'displayname',
                join : 'custrecord_p_item'
            },{ //新数量
                name : 'custrecord_p_quantity'
            },{ //变更前交期
                name : 'custrecord_p_custcol_before_date'
            },{ //交期
                name : 'custrecord_p_expectedshipdate'
            },{
                name : 'custrecord_cache_change'
            }, {
                name : 'custrecord_p_custcol_completion_date'
            },{ //初始交期
                name : 'custrecord_p_custcol_suggest_date'
            },{
                name : 'custrecord_p_custbody_wip_documentmaker'
            }
        ]
    }
})
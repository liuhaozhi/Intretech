/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define({
    searchColumns : function (params){
        return  [
            {
                name : 'custrecord_p_item'
            },{
                name : 'displayname',
                join : 'custrecord_p_item'
            },{
                name : 'custrecord_p_custcol_salesorder',
                sort : 'ASC'
            },{
                name : 'custrecord_p_custcol_itemtype'
            },{
                name : 'custrecord_p_quantity'
            }, {
                name : 'custrecord_p_expectedshipdate'
            },{
                name : 'custrecord_p_custcol_boxes_numbers'
            },{
                name : 'custrecord_edit_link'
            },{
                name : 'custrecord_p_custcol_line',
                sort : 'ASC'
            },{
                name : 'custrecord_p_custcol_sup_total'
            }
        ]
    }
})
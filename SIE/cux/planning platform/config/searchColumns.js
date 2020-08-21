/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define({
    searchColumns : function (params){
        var quantityCol = undefined

        if(params.disposetype === '2')
        {
            quantityCol = {
                name : 'formulanumeric',
                formula: 'TO_NUMBER({custrecord_p_quantity}) - TO_NUMBER( NVL({custrecord_quantity_shipped} , 0) )'
            }
        }
        else
        {
            quantityCol = {
                name : 'custrecord_p_quantity'
            }
        }

        return  [
            {
                name : 'custrecord_p_item'
            },{
                name : 'custrecord_p_custcol_pick_id'
            },{
                name : 'displayname',
                join : 'custrecord_p_item'
            },{
                name : 'custrecord_p_custcol_salesorder',
                sort : 'ASC'
            },{
                name : 'custrecord_p_custcol_itemtype'
            }, quantityCol, {
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
            },{
                name : 'custrecord_p_custbody_ifexport'
            },{
                name : 'custrecord_p_quantity'
            },{
                name : 'custrecord_quantity_shipped'
            }
        ]
    }
})
/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/format',
    '../../../helper/operation_assistant'
], function(format , operation) {
    function beforeLoad(context){
        if(context.type === 'view' || context.type === 'edit')
        {
            setDomesticTotal(context)
        }

        if(context.type === 'create')
        {
            setDomesticField(context)
        }
    }

    function setDomesticField(context){
        context.form.addField({
            type : 'inlinehtml',
            id : 'custpage_hackscript',
            label : 'custpage_hackscript'
        }).defaultValue = getDefaultValue()
    }

    function getDefaultValue(domesticTotal){
        if(domesticTotal === undefined)
        domesticTotal = '0.00'

        return '<script>var parentNode = jQuery("#total_fs_lbl_uir_label").parent().parent(); '+
        'var defaultValue  =' + 
        '\'<div class="uir-field-wrapper" data-field-type="currency">' +
            '<span id="total_domesticTotal" class="smalltextnolink uir-label ">' +
                '<span id="" class="smalltextnolink" style="">总计(本币)</span>' +
            '</span>' +
            '<span class="uir-field inputreadonly" id="domesticTotal">' +
                domesticTotal +
            '</span>' +
        '</div>\'' +
        ';parentNode.html(parentNode.html()+defaultValue)</script>'
    }

    function setDomesticTotal(context){
        var newRecord = context.newRecord
        var domesticTotal = operation.mul(newRecord.getValue('total') , newRecord.getValue('exchangerate'))

        context.form.addField({
            type : 'inlinehtml',
            id : 'custpage_hackscript',
            label : 'custpage_hackscript'
        }).defaultValue = getDefaultValue(format.format({
            type : format.Type.CURRENCY,
            value :domesticTotal
          }))
    }

    function beforeSubmit(context) {
        log.error('enterbeforeSubmit')
        if(context.type === 'create' || context.type === 'edit')
        {
            var newRecord = context.newRecord
            var lineCount = newRecord.getLineCount({
                sublistId : 'item'
            })

            while(lineCount > 0)
            {
                --lineCount
                //金额部分
                var exchangerate = newRecord.getValue('exchangerate') || 1
                var quantity = getSubValue('quantity',lineCount,newRecord) || 0
                var price = getSubValue('custcol_unit_notax',lineCount,newRecord) || 0
                var textRate = parseFloat(getSubValue('taxrate1',lineCount,newRecord))
                var fdiscount = parseFloat(getSubValue('custcol_fdiscount',lineCount,newRecord))
                var rate = operation.mul(price || 0, isNaN(fdiscount) ? 1 :  fdiscount / 100)
                var hasTaxRate = operation.mul(price || 0, operation.add(1 , isNaN(textRate) ? 0 : textRate / 100 ))
                var disHasTaxRate = operation.mul(rate , operation.add(1 , isNaN(textRate) ? 0 : textRate / 100 ))
                var discountAmount = operation.mul(operation.sub(hasTaxRate, disHasTaxRate)  , quantity)
                var amount = operation.mul(rate,quantity).toFixed(2)
                var taxAmt = operation.mul(amount,isNaN(textRate) ? 0 : textRate / 100).toFixed(2)
    
                setSubValue('rate' , rate , lineCount , newRecord) //折后单价 不含税
                setSubValue('custcol_unit_tax' , hasTaxRate , lineCount , newRecord) //折前单价（含税)
                setSubValue('custcol_funit' , disHasTaxRate , lineCount , newRecord) //折后单价 (含税)
                setSubValue('custcol_om_before_discount' , operation.mul(price , quantity) , lineCount , newRecord) //折前金额（不含税）
                setSubValue('custcol_before_tax' , operation.mul(hasTaxRate , quantity) , lineCount , newRecord) //折前金额（含税）
                setSubValue('custcol_discount' , discountAmount , lineCount , newRecord) //总折扣额
                setSubValue('custcol_om_total_discount' , operation.mul(discountAmount , exchangerate) , lineCount , newRecord) //总折扣额(本币)
                setSubValue('custcol_trueamount' , operation.add(operation.mul(amount,exchangerate).toFixed(2),operation.mul(taxAmt,exchangerate).toFixed(2)
                ) , lineCount , newRecord) //折后含税总金额（本币）

                //物料相关
                var carton = getSubValue('custcol_quantity_per_carton',lineCount,newRecord) || 0
                var sinweight = getSubValue('custcol_sinweight',lineCount,newRecord) || 0

                setSubValue('custcol_boxes_numbers' , Math.ceil(isInfinity(operation.div(quantity , carton))) , lineCount , newRecord)
                setSubValue('custcol_total_net_weight' , operation.mul(quantity , sinweight) , lineCount , newRecord)

                var materialWeight = getSubValue('custcol_material_weight',lineCount,newRecord) || 0
                var totalBoxes  = getSubValue('custcol_boxes_numbers',lineCount,newRecord) || 0
                var totalWeight = getSubValue('custcol_total_net_weight',lineCount,newRecord) || 0
                var singlePallet = getSubValue('custcol_number_of_single_pallet',lineCount,newRecord) || 0
                var standardNumber = getSubValue('custcol_standard_single_number',lineCount,newRecord) || 0

                setSubValue('custcol_sup_total' , Math.ceil(isInfinity(operation.div(totalBoxes , standardNumber))) , lineCount , newRecord)

                var supTotal = getSubValue('custcol_sup_total',lineCount,newRecord) || 0

                setSubValue('custcol_total_gross_weight' , operation.add( totalWeight ,operation.add(
                    operation.mul(materialWeight, totalBoxes) , operation.mul(singlePallet , supTotal))) , lineCount , newRecord)

                var cubicNumber = getSubValue('custcol_cubic_number' , lineCount , newRecord) || 0
                var cubicSingle = getSubValue('custcol_cubic_number_of_single' , lineCount , newRecord) || 0
                setSubValue('custcol_total_cubic_number' , operation.add(operation.mul(cubicNumber , totalBoxes) , operation.mul(cubicSingle , supTotal)) ,lineCount , newRecord)
            }
        }
    }

    function isInfinity(num){
        if(num === Infinity) return 0
        if(isNaN(num)) return 0

        return num
    }

    function setSubValue(fieldId,value,line,newRecord){
        newRecord.setSublistValue({ 
            sublistId : 'item',
            fieldId : fieldId,
            value : value,
            line : line
        })
    }

    function getSubValue(fieldId,line,newRecord){
        return newRecord.getSublistValue({
            sublistId : 'item',
            fieldId : fieldId,
            line : line
        })
    }
    
    return {
        beforeLoad : beforeLoad,
        beforeSubmit : beforeSubmit
    }
});

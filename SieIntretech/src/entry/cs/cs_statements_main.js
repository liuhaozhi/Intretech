/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    'N/search'
], function(search) {
    var SUBLISTID = 'recmachcustrecord_check_parent'
    var QUANTITYCACHE = Object.create(null)

    function pageInit(context){
        if(context.mode === 'edit')
        quantityInit(context)
    }

    function quantityInit(context){
        var currentRec = context.currentRecord
        var lineCount = currentRec.getLineCount({
            sublistId : SUBLISTID
        })

        while(lineCount > 0){
            var line = --lineCount
            var quantity = +currentRec.getSublistValue({
                sublistId : SUBLISTID,
                fieldId : 'custrecord_check_amount',
                line : lineCount
            })

            QUANTITYCACHE[line] = quantity
        }
    }

    function fieldChanged(context) {
        var fieldId = context.fieldId
        var currentRec = context.currentRecord

        if(fieldId === 'custrecord_check_amount' || fieldId === 'custrecord_check_rate' || fieldId === 'custrecord_tax_code'){
            changeAmt(currentRec)
        }

        if(fieldId === 'custrecord_check_amount'){
            // volidQuantity(currentRec , fieldId)
        }
    }

    function volidQuantity(currentRec , fieldId){
        var line = currentRec.getCurrentSublistIndex({
            sublistId : SUBLISTID
        })
        var newQuantity = +currentRec.getCurrentSublistValue({
            sublistId : SUBLISTID,
            fieldId : fieldId,
        })

        if(!newQuantity || Math.abs(newQuantity) > Math.abs(QUANTITYCACHE[line])){
            currentRec.setCurrentSublistValue({
                sublistId : SUBLISTID,
                fieldId : fieldId,
                value : QUANTITYCACHE[line]
            })
        }
    }

    function changeAmt(currentRec){
        var grossamount
        var rate = currentRec.getCurrentSublistValue({
            sublistId : SUBLISTID,
            fieldId : 'custrecord_check_rate'
        })
        var taxcode = currentRec.getCurrentSublistValue({
            sublistId : SUBLISTID,
            fieldId : 'custrecord_tax_code'
        })
        var quantity = currentRec.getCurrentSublistValue({
            sublistId : SUBLISTID,
            fieldId : 'custrecord_check_amount'
        })
        var amount  = mul(quantity || 0 , rate || 0)

        if(taxcode)
        var taxRate = salestaxitemRate(taxcode)

        if(taxRate)
        grossamount = mul(amount , add(taxRate , 1))
       
        currentRec.setCurrentSublistValue({
            sublistId : SUBLISTID,
            fieldId : 'custrecord_amount_tax',
            value : grossamount ? grossamount : amount
        })

        currentRec.setCurrentSublistValue({
            sublistId : SUBLISTID,
            fieldId : 'custrecord_check_grossamount',
            value : amount 
        })
    }

    function salestaxitemRate(taxcode){
        return parseFloat(search.lookupFields({
            type : 'salestaxitem',
            id : taxcode,
            columns : ['rate']
        }).rate) / 100
    }

    function add(a, b) {
        a = a || 0, b = b || 0
        var c, d, e;
        try {
            c = a.toString().split(".")[1].length
        } catch (f) {
            c = 0;
        }
        try {
            d = b.toString().split(".")[1].length;
        } catch (f) {
            d = 0;
        }
        return e = Math.pow(10, Math.max(c, d)), (mul(a, e) + mul(b, e)) / e;
    }
        
    function sub(a, b) {
        a = a || 0, b = b || 0
        var c, d, e;
        try {
            c = a.toString().split(".")[1].length
        } catch (f) {
            c = 0
        }
        try {
            d = b.toString().split(".")[1].length
        } catch (f) {
            d = 0
        }
        return e = Math.pow(10, Math.max(c, d)), (a * e - b * e) / e
    }
      
    function mul(a, b) {
        a = a || 0, b = b || 0
        var c = 0,
        d = a.toString(),
        e = b.toString();
        try {
            c += d.split(".")[1].length
        } catch (f) {}
        try {
            c += e.split(".")[1].length
        } catch (f) {}
        return Number(d.replace(".", "")) * Number(e.replace(".", "")) / Math.pow(10, c)
    }
      
    function div(a, b) {
        a = a || 0, b = b || 0
        var c, d, e = 0,
            f = 0
        try {
            e = a.toString().split(".")[1].length
        } catch (g) {}
        try {
            f = b.toString().split(".")[1].length
        } catch (g) {}
        return c = Number(a.toString().replace(".", "")), d = Number(b.toString().replace(".", "")), c / d * Math.pow(10, f - e)
    }

    function saveRecord(context){
        var Repeat = new Array()
        var poTags = new Array()
        var currentRec = context.currentRecord
        var lineCount  = currentRec.getLineCount({
            sublistId : SUBLISTID
        })

        while(lineCount > 0){
            var poId = currentRec.getSublistText({
                sublistId : SUBLISTID,
                fieldId : 'custrecord_po_no',
                line : --lineCount
            })
            var poLine = currentRec.getSublistValue({
                sublistId : SUBLISTID,
                fieldId : 'custrecord__ns_poline_number',
                line : lineCount
            })
            var poTag = poId + ',行号' + poLine    
            
            if(poTags.indexOf(poTag) > -1){
                Repeat.push(poTag + '重复,请合并')
            }else{
                poTags.push(poTag)
            }
        }

        if(Repeat.length > 0){
            var prompt = new String()

            Repeat.map(function(item){
                prompt += (item + '\r\n')
            })

            alert(prompt)

            return false
        }

        return true
    }

    return {
        pageInit : pageInit,
        saveRecord : saveRecord,
        fieldChanged: fieldChanged
    }
});

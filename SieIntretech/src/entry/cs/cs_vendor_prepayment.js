/**
 * @NApiVersion 2.0
 * @NScriptType clientscript
 */
                
define(['N/record', 'N/search'], function(record, search){
    var currentRecord;
    function pageInit(context) {
        currentRecord = context.currentRecord;
        setBuyerDefaultValue(context.currentRecord);
        //console.log(search.load("customsearch969"));
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
        var vpPercentage, vpAmount;
        if(scriptContext.fieldId == "custrecord_vp_percentage" || scriptContext.fieldId == "custrecord_nsts_vp_prepay_amount") {
            vpPercentage = +(currentRecord.getValue(scriptContext.fieldId) / 100) || 0;
            vpAmount = +currentRecord.getValue("custrecord_nsts_vp_po_amount") || 0;
            currentRecord.setValue("custrecord_nsts_vp_prepay_amount", vpPercentage * vpAmount);
        }
    }

    function setBuyerDefaultValue(currentRecord) {
        var context = nlapiGetContext();
        currentRecord.setValue("custrecord_psap_vendorprepayment_franchi", context.name);
    }
    
    return {
        pageInit : pageInit,
        //saveRecord: saveRecord,
        fieldChanged: fieldChanged
    };
});
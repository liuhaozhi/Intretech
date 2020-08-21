/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 @author RhysLan
 *@description 采购订单批量退货
 */
define([ 'N/search', 'N/record', 'N/format', 'N/runtime'
], function (search, record, format, runtime) {
    function getInputData() {
        var currentScript = runtime.getCurrentScript(),
            parameters = currentScript.getParameter({
                name: 'custscriptpo_return_sales_params'
            }),
            inputData = JSON.parse(parameters);
        log.debug({
            title: 'TEST',
            details: parameters
        });
        return inputData;
    }

    function map(context) {
        try{
            var tfRecord = record.transform({
                fromType: "purchaseorder",
                fromId: context.key,
                toType: "vendorreturnauthorization",
                isDynamic: true,
            });
            for(var i = tfRecord.getLineCount({ sublistId: "item" }) - 1; i > -1; i--) {
                tfRecord.removeLine({ sublistId: "item", line: i, ignoreRecalc: true });
            }
            setPageDataByStruct(tfRecord, JSON.parse(context.value));
            log.debug("Create Author Successfully", "批量退货创建成功！");
        } catch(e) {
            log.debug("Create Author Fail", e.message);
        }
    }

    function reduce(context) {
    }

    function summarize(summary) {
        //记录错误
        if (summary.inputSummary.error) {
            log.error({
                title: 'Input Error',
                details: summary.inputSummary.error
            });
        }
        summary.mapSummary.errors.iterator().each(function (key, error, executionNo) {
            log.error({
                title: 'Map error key: ' + key,
                details: error
            });
            return true;
        });
        summary.reduceSummary.errors.iterator().each(function (key, error, executionNo) {
            log.error({
                title: 'Reduce error key: ' + key,
                details: error
            });
            return true;
        });
    }

    function setPageDataByStruct(currentRecord, value, fieldId) {
        if(typeof value != "object") {
            return currentRecord.setValue(fieldId, value);
        } else if(Array.isArray(value)) {
            for(var line in value) {
                var lineData = value[line];
                currentRecord.selectNewLine({ sublistId: fieldId });
                for(var lineFieldId in lineData) {
                    var lineFieldValue = lineData[lineFieldId];
                    if(typeof lineFieldValue != "object") {
                        if(lineFieldId == "line") {
                            lineFieldValue = currentRecord.getLineCount({ sublistId: fieldId }) - 1;
                        }
                        currentRecord.setCurrentSublistValue({ sublistId: fieldId, fieldId: lineFieldId, value: lineFieldValue });
                        continue;
                    }
                    var subRecord = currentRecord.getCurrentSublistSubrecord({ sublistId: fieldId, fieldId: lineFieldId });
                    setPageDataByStruct(subRecord, lineFieldValue);
                }
                currentRecord.commitLine({ sublistId: fieldId });
            }
        } else if(typeof value == "object") {
            for(var fieldId in value) {
                setPageDataByStruct(currentRecord, value[fieldId], fieldId);
            }
            currentRecord.save? currentRecord.save(): currentRecord.commit? currentRecord.commit(): true;
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 @author RhysLan
 *@description 采购订单批量关闭
 */
define([ 'N/search', 'N/record', 'N/format', 'N/runtime'
], function (search, record, format, runtime) {
    function getInputData() {
        var currentScript = runtime.getCurrentScript(),
            parameters = currentScript.getParameter({
                name: 'custscriptpo_close_line_params'
            }),
            inputData = JSON.parse(parameters); 
        log.debug({
            title: 'Input Data',
            details: inputData
        });
        return inputData;
    }

    function map(context) {
        var poId = context.key;
        var values = JSON.parse(context.value);
        var poRecord = record.load({
            type: "purchaseorder",
            id: poId,
            isDynamic: true
        });
        var sublistId = "item";
        for(var index in values) {
            var lineData = values[index];
            lineData.linesequencenumber = +lineData.linesequencenumber - 1;
            poRecord.selectLine({ sublistId: sublistId, line: lineData.linesequencenumber });
            poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "custcol_close_reason", value: lineData.custcol_close_reason });
            if(!lineData.custcol_line_close_employee) {
                poRecord.commitLine({ sublistId: sublistId });
                return poRecord.save();
            }
            
            poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "custcol_line_close_employee", value: lineData.custcol_line_close_employee });
            poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "custcol_close_date", value: getFormatDateValue() });
            if(lineData.quantityshiprecv != 0 && lineData.quantity != lineData.quantityshiprecv) {
                var leaveQuantity = lineData.quantity - lineData.quantityshiprecv;
                poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "quantity", value: lineData.quantityshiprecv });
                poRecord.commitLine({ sublistId: sublistId });
                poRecord.insertLine({ sublistId: sublistId, line: lineData.linesequencenumber + 1 });
                var fields = ["item", "units", "rate", "taxcode", "taxrate1", "custcol_po_moq_number", "expectedreceiptdate", "custcolcustcol_pr_mim_quantutity",
                                "custcol_pr_cancel_window", "custcol_pr_suggest_date", "custcol_po_price_updatest_date", "custcol_pr_cux_pr_doc_number"];
                //poRecord.getSublistFields({ sublistId: sublistId });
                /*货品、采购单位 、单价 、税码、税率、MOQ、预计收货日期、批量增量、订单取消窗口期、建议采购日期，最新价格对应生效日期、CUX-PR单号  */
                for(var index in fields) {
                    var fieldId = fields[index];
                    var value = poRecord.getSublistValue({ sublistId: sublistId, fieldId: fieldId, line: lineData.linesequencenumber});
                    try{
                        poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: fieldId, value: value });
                    } catch(e) {
                        poRecord.setCurrentSublistText({ sublistId: sublistId, fieldId: fieldId, value: value });
                        log.debug("Set Value Error", e.message);
                    }
                }
                poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "quantity", value: leaveQuantity });
                poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "quantityonshipments", value: "0" });
                poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "isclosed", value: true });
            } else {
                poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "isclosed", value: lineData.closed == "F" });
            }
            poRecord.commitLine({ sublistId: sublistId });
        }
        poRecord.save();
        log.debug("Success", "提交处理成功");
    }

    function getFormatDateValue(value) {
        var today = new Date();
        today.setHours(today.getHours() + 8);
        var date = format.format({
            type: format.Type.DATE,
            value: today
        });
        return format.parse({ value: date, type: format.Type.DATE })
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

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
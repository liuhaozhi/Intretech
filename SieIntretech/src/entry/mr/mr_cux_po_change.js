/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 @author RhysLan
 *@description 采购订单批量关闭
 */
define([ 'N/search', 'N/record', 'N/format', 'N/runtime', 'N/workflow'
], function (search, record, format, runtime, workflow) {
    function getInputData() {
        var currentScript = runtime.getCurrentScript(),
            parameters = currentScript.getParameter({
                name: 'custscript_mr_cux_po_change_params'
            }),
            inputData = JSON.parse(parameters);
        log.debug({
            title: 'Input Data',
            details: inputData
        });
        return inputData;
    }

    function map(context) {
        var poId = context.key, recType = "purchaseorder";
        var pageInfo;
        try{
            pageInfo = JSON.parse(context.value);
        } catch(e){
            pageInfo = context.value;
        }
        try{
            if(typeof pageInfo == "string") {//提交审批
                try{
                    var poType = poRec.getValue("custbody_po_list_pur_type");
                    var nextapprover = poRec.getValue("nextapprover");
                    if(pageInfo == "BatchSubmit") {
                        poRec.setValue("approvalstatus", "1");
                        if(poType == "7" || poType == "3") {//委外和公司间
                            poRec.setValue("nextapprover", poRec.getValue("employee"));
                        } else {
                            poRec.setValue("nextapprover", poRec.getValue("employee"));//getDepartmentManager(poRec));//应为部门经理
                        }
                    } else if(pageInfo == "BatchApprove") {//公司间
                        if(poType == "7" && nextapprover != "454") {
                            poRec.setValue("approvalstatus", "1");
                            poRec.setValue("nextapprover", "454");
                        } else if(poType == "3") {//委外
                            poRec.setValue("approvalstatus", "1");
                            poRec.setValue("nextapprover", poRec.getValue("employee"));
                        } else {
                            poRec.setValue("approvalstatus", "2");//已核准
                            poRec.setValue("nextapprover", "");
                        }
                    } else {
                        poRec.setValue("approvalstatus", "3");//已拒绝
                        /* workflow.trigger({
                            recordType: recType,
                            recordId: poId,
                            workflowId: "customworkflow26",
                            actionId: "workflowaction2142"
                        }); */
                    }
                    poRec.save();
                    log.debug("审批成功", "触发工作流成功");
                } catch(e) {
                    log.debug("触发工作流失败", e);
                }
            } else {
                var poRec = record.load({
                    type: recType,
                    id: poId,
                    isDynamic: true
                });
                poRec.setValue("custbody_wip_change_number", (+poRec.getValue("custbody_wip_change_number") || 0) + 1);
                for(var lineId in pageInfo) {
                    var lineItem = pageInfo[lineId];
                    poRec.selectLine({ sublistId: "item", line: lineId });
                    for(var fieldId in lineItem) {
                        setFieldValue(poRec, fieldId, lineItem[fieldId], "item");
                    }
                    poRec.commitLine({ sublistId: "item" });
                }
                poRec.save();
                log.debug("变更成功", "success");
            }
        } catch(e) {
            log.debug("失败", e);
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

    function setFieldValue(pageRec, fieldId, value, sublistId) {
        var sublistFields = pageRec.getSublistFields({ sublistId: sublistId });
        var fieldType = "";
        try{
            if(sublistFields.indexOf(fieldId) > -1) {
                try{
                    fieldType = "Sublist Value";
                    pageRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: fieldId, value: value });
                }catch(e) {
                    fieldType = "Sublist Text";
                    pageRec.setCurrentSublistText({ sublistId: sublistId, fieldId: fieldId, value: value });
                }
            } else {
                try{
                    fieldType = "Form Value";
                    pageRec.setValue(fieldId, value);
                }catch(e) {
                    fieldType = "Form Text";
                    pageRec.setText(fieldId, value);
                }
            }
            if(fieldId == "expectedreceiptdate") {
                pageRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: fieldId, value: new Date(value) });
                log.debug("Exp Date", pageRec.getCurrentSublistValue({ sublistId: sublistId, fieldId: fieldId }));
            }
        }catch(e) {
            log.debug("Set Field Error", fieldType + "  " + fieldId + ": " + value);
        }
    }

    function getDepartmentManager(poRec) {
        var departmentManager;
        search.create({
            type: "department",
            columns: ["custrecord_department_manager"],
            filters: ["user.entityid", "is", poRec.getValue("custbody_pc_salesman")]
        }).run().each(function(result){
            departmentManager = result.getValue(result.columns[0]);
        });
        log.debug("Manager", departmentManager);
        return departmentManager;
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
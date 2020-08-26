/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 @author RhysLan
 *@description 工程变更单
 */
define([ 'N/search', 'N/record', 'N/format', 'N/runtime'
], function (search, record, format, runtime) {
    var cSublistId = "component";
    function getInputData() {
        var currentScript = runtime.getCurrentScript(),
            parameters = currentScript.getParameter({
                name: 'custscript_param_eco_change_detail'
            }),
            inputData = JSON.parse(parameters);
        log.debug({
            title: 'Input Data',
            details: inputData
        });
        return inputData;
    }

    function map(context) {
        try{
            var dataObj = JSON.parse(context.value);
            var rec, ecoRecord, copyRec;
            ecoRecord = record.load({
                type: 'customrecord_engineering_change_notice',
                id: findEcoId(dataObj),
                isDynamic: true,
            });
            var bomId = context.key;
            var bomRevisionRecs = [];
            var revisionSch = search.create({
                type: "bomrevision",
                columns: ["internalid"],
                filters: [
                    ["billofmaterials", "anyof", bomId],
                    "AND",
                    [["effectivestartdate", "onorbefore", "today"], "OR", ["effectivestartdate", "isempty", ""]],
                    "AND",
                    [["effectiveenddate", "onorafter", "today"], "OR", ["effectiveenddate", "isempty", ""]],
                    "AND",
                    ["custrecord_ps_bom_approvestatus2", "anyof", "1"]
                ]
            });
            revisionSch.run().each(function(result){
                rec = record.load({
                    type: 'bomrevision',
                    id: result.id,
                    isDynamic: true,
                });
                if(!rec) {
                    log.debug({
                        title: 'Not Record',
                        details: "RecordId " + result.id + " does not found!"
                    });
                    return true;
                }
                var reDate = rec.getValue("effectivestartdate") || "";
                var today = getDateByChangeHours(new Date(), 8);
                var isCreateNewReversion = reDate.getFullYear() + reDate.getMonth() + reDate.getDate() != today.getFullYear() + today.getMonth() + today.getDate();
                if(isCreateNewReversion) {
                    copyRec = record.copy({
                        type: rec.type,
                        id: rec.id,
                        isDynamic: true
                    });
                    var revisionName = rec.getValue("name").split('.');
                    var revisionNum = (parseInt(revisionName[1] || 0) + 1);
                    var approveTime = copyRec.getValue("custrecord_approve_time");
                    revisionNum = (revisionNum < 10? "00": revisionNum < 100? "0": "") + revisionNum;
                    copyRec.setValue("name", (revisionName.length > 1? revisionName[0] + "." + revisionNum: "V0.001"));
                    copyRec.setValue("effectivestartdate", approveTime);
                    copyRec.setValue("custrecord_ps_bom_approvestatus2", "1");
                    approveTime = getDateByChangeHours(new Date(), 32);
                    rec.setValue("custrecord_ps_bom_approvestatus2", "1");
                    rec.setValue("effectiveenddate", approveTime);
                    rec.save();
                    
                } else {
                    copyRec = rec;
                }
                copyRec.setValue("custrecord_approve_time", today);
                copyRec.setValue("custrecordcustrecord_lately_update_time", today);
                processComponent(copyRec, ecoRecord, dataObj["1"], "Add");
                processComponent(copyRec, ecoRecord, dataObj["2"], "Modify");
                processComponent(copyRec, ecoRecord, dataObj["3"], "Delete");
                bomRevisionRecs.push(copyRec);
                ecoRecord.setValue("custrecord_eco_status", "3");
                ecoRecord.setValue("custrecord_eco_process", "100%");
                log.debug("BomReversionId", copyRec.id);
                return true;
            });
            for(var i = 0; i < bomRevisionRecs.length; i++){
                bomRevisionRecs[i].save();
            }
            log.debug("变更成功", "变更成功！");
        } catch(e) {
            if(rec) {
                rec.setValue("effectiveenddate", "");
                rec.save();
            }
            // if((e.message || "").indexOf("item") > -1) {
            //     var itemId = /\d+/gmi.exec(e.message) || [];
            //     if(itemId[0]) {
            //         var itemCode = "";
            //         search.create({
            //             type: "item",
            //             columns: ["itemid"],
            //             filters: ["internalid", "anyof", itemId[0]]
            //         }).run().each(function(item) {
            //             itemCode = item.getValue(item.columns[0]);
            //         });
            //         if(itemCode) {
            //             var message = (e.message + "").replace(/\d+\s*/gmi, itemCode);
            //             ecoRecord.setValue("custrecord_eco_check_message", "创建新版本失败:\n原因: " + message);
            //         }
            //     }
            // } else {
            //     ecoRecord.setValue("custrecord_eco_check_message", "创建新版本失败:\n原因: " + e.message);
            // }
            ecoRecord.setValue("custrecord_eco_check_message", "创建新版本失败:\n第" + (e.line || 1) + "行的数据有误！原因是：" + e.message + "，审核日期：" +
            approveTime + ", 系统的当天日期：" + today);
            ecoRecord.setValue("custrecord_eco_process", "100%");
            ecoRecord.setValue("custrecord_eco_status", "6");
            log.error('Create New Reversion Faile', e.message + ", BOM Id:" + bomId);
        }
        ecoRecord.save();
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

    function findEcoId(dataObj) {
        var ecoId;
        for(var ecoType in dataObj) {
            if(typeof dataObj[ecoType][0] != "object") { continue; }
            ecoId = dataObj[ecoType][0]["custrecord_eco_record_id"];
            if(ecoId) { break; }
        }
        log.debug("ECO ID", ecoId);
        return ecoId;
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }

    function getDateByChangeHours(date, hours) {
        date.setTime(date.getTime() - hours * 60 * 60 * 1000);
        return date;
    }

    function processComponent(rec, ecoRecord, values, type) {
        if(!values || !type) { return; }
        for(var i = 0; i < values.length; i++) {
            var lineData = values[i];
            var line = rec.findSublistLineWithValue({
                sublistId: cSublistId,
                fieldId: "item",
                value: lineData.item
            });
            if(type == "Modify" && i % 2 == 0) {
                lineData = values[++i];
            }
            if(type == "Add" && line == -1) {
                rec.selectNewLine({ sublistId: cSublistId });
            } else if(type != "Add" && line > -1) {
                rec.selectLine({ sublistId: cSublistId, line: line });
            }
            try{
                var currLine = lineData._line_ + 1;
                var oaRecordName = rec.getCurrentSublistValue({ sublistId: cSublistId, fieldId: "custrecord_eco_record" });
                for(var fieldId in lineData) {
                    if(fieldId == "_line_" || fieldId == "_totalLine_" || fieldId == "custrecord_eco_record_id") { continue; }
                    var fieldValue = (fieldId == "custrecord_eco_record"? (oaRecordName? oaRecordName + ",": ""): "") + lineData[fieldId];
                    if(fieldValue == "" && fieldId != "custrecord_version_location_number" && fieldId != "custrecord_remarks") { continue; }
                    rec.setCurrentSublistValue({
                        sublistId: cSublistId,
                        fieldId: fieldId,
                        value: fieldValue
                    });
                }
                rec.commitLine({ sublistId: cSublistId });
                if(type == "Delete") {
                    rec.removeLine({ sublistId: cSublistId, line: line--, ignoreRecalc: true });
                }
            } catch(e) {
                throw { message: e.message, line: currLine };
            }
        }
    }
});
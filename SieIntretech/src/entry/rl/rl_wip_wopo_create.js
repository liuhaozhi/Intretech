/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/search', 'N/record', 'N/runtime', 'N/format'], function (search, record, runtime, format) {
    var workOrderInfo = {};
    function _get(context) {
        return _post(context);
    }

    function _post(context) {
        var currentTime = new Date();
        var rspMsg = {
            successed: [],
            successedCount: 0
        };
        var logMsg = {
            successed: [],
            failed: [],
            lastRemainUsage: 6666,
            startTime: format.format({
                type: format.Type.DATETIMETZ,
                value: currentTime
            }),
            startTimeStamp: currentTime.getTime()
        };
        log.debug('接口调用开始时间: ' + logMsg.startTimeStamp, logMsg.startTime);
        var currentScript = runtime.getCurrentScript();

        try {
            if (currentScript.getRemainingUsage() < 15) {
                throw { message: 'script goverence will excceed' }
            } else if(!context || !context.list) {
                throw { message: "context or context.list parameter cannot null!" };
            }
            var msgInfo = createRecordByData(context);
            rspMsg.successed = msgInfo.successed || [];
            rspMsg.failed = msgInfo.failed || [];
            rspMsg.code = rspMsg.successed.length? "S": "F";
            rspMsg.message = "";
        } catch (e) {
            log.error({
                title: 'create all po error',
                details: e
            });
            rspMsg.message = e.message;
        }

        rspMsg.successedCount = rspMsg.successed.length;
        logMsg.lastRemainUsage = currentScript.getRemainingUsage();

        var endTime = new Date();
        logMsg.endTime = format.format({
            type: format.Type.DATETIMETZ,
            value: endTime
        });
        logMsg.endTimeStamp = endTime.getTime();
        log.debug('接口调用结束时间：' + logMsg.endTimeStamp, logMsg.endTime);

        //log msg
        log.debug({
            title: 'logMsg',
            details: logMsg
        });
        log.debug({
            title: 'rspMsg',
            details: rspMsg
        });

        return rspMsg;
    }

    function _delete(context) {
   
    }

    function createRecordByData(context) {
        var message = {};
        for(var recIndex = 0, length = context.list.length; recIndex < length; recIndex++) {
            try {
                var itemInfo = context.list[recIndex],
                    skipPropertyName = { type: true, defaultValues: true, orderkey: true },
                    sch = {
                        type: itemInfo.type,
                        isDynamic: true,
                        defaultValues: itemInfo.defaultValues
                    };
                if(typeof itemInfo.defaultValues != "object") { delete itemInfo.defaultValues; }
                var itemRcord = record.create(sch);
                typeof beforeSetValueEvent == 'function' && beforeSetValueEvent(itemInfo, itemRcord);
                for(var propertyName in itemInfo) {
                    if(skipPropertyName[propertyName]) { continue; }
                    var sublist = itemInfo[propertyName], sublistId = propertyName;
                    if(typeof sublist != "object") {
                        sublist = getFormatDateValue(sublist);
                        itemRcord.setValue({ fieldId: sublistId, value: sublist });
                        continue;
                    }
                    for(var line in sublist) {
                        var fieldidObj = sublist[line];
                        itemRcord.selectNewLine({ sublistId: sublistId });
                        for(var fieldId in fieldidObj) {
                            var fieldValue = fieldidObj[fieldId];
                            if(typeof fieldValue != "object") { 
                                fieldValue = getFormatDateValue(fieldValue);
                                itemRcord.setCurrentSublistValue({ 
                                    sublistId: sublistId,
                                    fieldId: fieldId,
                                    value: fieldValue ,
                                    line: line
                                });
                            } else{
                                
                            }
                        }
                        itemRcord.commitLine({ sublistId: sublistId });
                    }
                }
                var recordId = itemRcord.save({ ignoreMandatoryFields: true }), succInfo = {};
                succInfo[itemInfo.type || itemInfo.orderkey || recIndex] = recordId;
                message.successed = message.successed || [];
                message.successed.push(succInfo);
                typeof afterSaveRecordEvent == 'function' && afterSaveRecordEvent(itemInfo, recordId);
            } catch (e) {
                message.failed = message.failed || [];
                message.failed.push({ type: itemInfo.type, message: e.message });
            }
        }
        return message;
    }

    function beforeSetValueEvent(info, rec) {
        switch(info.type) {
            case 'workorder':
                var location = getLocationValue(rec);
                if(location) {
                    info.location = location;
                    info.iswip = true;
                }
                break;
            case 'purchaseorder':
                info["createdfrom"] = workOrderInfo["id"];
                info["custbody_po_list_pur_type"] = "3";
                info["trandate"] = workOrderInfo["trandate"];
                info["custbody_wip_createdfrom"] = workOrderInfo["id"];
                var woRec = record.load({
                    type: "workorder",
                    id: info["custbody_wip_createdfrom"],
                    isDynamic: true
                });
                if(!woRec) { return info; }
                var sublistId = "item";
                var itemLineMap = {}, items = [], allCount = woRec.getLineCount({ sublistId: sublistId });
                info[sublistId] = info[sublistId] || [];
                for(var line = 0; line < allCount; line++) {
                    woRec.selectLine({
                        sublistId: sublistId,
                        line: line
                    });
                    var itemValue = woRec.getCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: "item",
                        line: line
                    });
                    items.push(itemValue);
                    itemLineMap[itemValue] = itemLineMap[itemValue] || {};
                    itemLineMap[itemValue]["item"] = itemValue;
                    itemLineMap[itemValue]["quantity"] = woRec.getValue({ fieldId: "quantity" });
                    itemLineMap[itemValue]["custcol_outsource_location"] = woRec.getValue({ fieldId: "location" });
                }
                var subsidiary = woRec.getValue("subsidiary");
                if(!items.length || !subsidiary) { return info; }
                var allResults = getAllSearchResults({
                    type: sublistId,
                    columns: ["internalid"],
                    filters: [
                        ["internalid", "anyof", items],
                        "AND",
                        ["custrecord_link_field.custrecord_intercompany_subsidiary", "anyof", subsidiary],
                        "AND",
                        ["custrecord_link_field.custrecord_is_outsource_purchase_cost", "is", "T"]
                    ]
                });
                for(var i = 0; i < allResults.length; i++) {
                    info[sublistId].push(itemLineMap[allResults[i].id]);
                }
                break;
        }
        return info;
    }

    function afterSaveRecordEvent(info, recId) {
        if(info["type"] == "workorder") {
            workOrderInfo["id"] = recId;
            workOrderInfo["trandate"] = info["trandate"];
        }
    }

    function getFormatDateValue(value) {
        if(value && /\d{1,2}\/\d{1,2}\/\d{1,4}/.test(value)) {
            var date = format.format({
                type: format.Type.DATE,
                value: new Date(value)
            });
            return format.parse({ value: date, type: format.Type.DATE })
        }
        return value;
    }

    function getLocationValue(rec) {
        var location = [],
            bomCode = rec.getValue("billofmaterials"),
            subsidiary = rec.getValue("subsidiary");
        if(!bomCode || !subsidiary) { return ''; }
        var allResults = getAllSearchResults({
            type: "manufacturingrouting",
            columns: ["location"],
            filters: [
                ["billofmaterials", "anyof", bomCode],
                "AND",
                ["subsidiary", "anyof"].concat(subsidiary),
                "AND",
                ["isdefault", "is", "T"]
            ]
        });
        for(var i = 0; i < allResults.length; i++) {
            location.push(allResults[i].getValue(allResults[i].columns[0]));
        }
        return location + "";
    }

    function getAllSearchResults(options) {
        var allResults = [], searchObj = options;
    
        if(typeof options != "object") {
            searchObj = search.load({ id: options });
        } else if(options.type) {
            searchObj = search.create(options);
        }
        var resultPagedData = searchObj.runPaged({
            pageSize: 1000
        });
        resultPagedData.pageRanges.forEach(function (pageRange) {
            var currentPageData = resultPagedData.fetch({
                index: pageRange.index
            }).data;
            allResults = allResults.concat(currentPageData);
        });
    
        return allResults;
    }

    return {
        get: _get,
        post: _post,
        delete: _delete
    }
});
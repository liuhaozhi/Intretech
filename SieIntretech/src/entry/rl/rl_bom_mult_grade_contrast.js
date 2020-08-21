/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/search', 'N/record', 'N/url', 'N/format', 'N/file'], function (search, record, url, format, file) {
    var funcList = {
        getSublistData: getSublistData,
        multGradContrast: multGradContrast,
        getCompareNumber: getCompareNumber,
        getSearchGridInnerHtml: getSearchGridInnerHtml,
        getBomReversionInfo: getBomReversionInfo,
        getBomCodeSubsidiary: getBomCodeSubsidiary
    }
    function _get(context) {
        if(funcList[context.funcName]) {
            return funcList[context.funcName](context);
        }
        return ;
    }

    function _post(context) {
        if(funcList[context.funcName]) {
            return funcList[context.funcName](context);
        }
        return ;
    }

    function _delete(context) {
   
    }
    
    //单阶BOM对比开始
    function getSearchGridInnerHtml(parameters) {
        var bomReversionSch = {
            type: "bomrevision",
            columns: [
                        "name",
                        "billofmaterials",
                        { name: "item", join: "component" },
                        { name: "custrecord_display_name", join: "component" },
                        { name: "description", join: "component" },
                        { name: "units", join: "component" },
                        { name: "bomquantity", join: "component" },
                        { name: "custrecord_version_location_number", join: "component" }
                    ],
            filters: [
                        [
                            ["internalid", "anyof", parameters.bomReversionInof1.internalId.value],
                            "AND",
                            ["billofmaterials", "anyof", parameters.bomReversionInof1.bomId]
                        ], 
                        "OR",
                        [
                            ["internalid", "anyof", parameters.bomReversionInof2.internalId.value],
                            "AND",
                            ["billofmaterials", "anyof", parameters.bomReversionInof2.bomId]
                        ]
                    ]
        };
        var allResults = getAllSearchResults(bomReversionSch);
        var linesHtml = "", line = 1, prefix = "(StartPlaceHolder", suffix = "FinishPlaceHolder)";
        for(var index in allResults)  {
            var item = allResults[index];
            var values = item.getAllValues();
            var itemName = values["component.item"][0].text;
            var serialNum = values.billofmaterials[0].text == parameters.bomReversionInof1.bomName? 1: 2;
            var qPlacheHolder = prefix + itemName + "_bomquantity" + suffix;
            var lPlacheHolder = prefix + itemName + "_locationnumber" + suffix;
            var regExp = new RegExp(qPlacheHolder, "gmi");
            if(regExp.test(linesHtml)) {
                linesHtml = linesHtml.replace(qPlacheHolder, values["component.bomquantity"]).replace(lPlacheHolder, values["component.custrecord_version_location_number"]);
                continue;
            }
            linesHtml += "<tr class='uir-list-row-tr uir-list-row-" + (line++ % 2? "even": "odd") + "'><td class='listtext uir-list-row-cell'>" + itemName + "</td><td class='listtext uir-list-row-cell'>" + 
            values["component.custrecord_display_name"] + "</td><td class='listtext uir-list-row-cell'>" + values["component.description"] + "</td><td class='listtext uir-list-row-cell'>" + values["component.units"] + "</td><td class='listtext uir-list-row-cell'>" +
            (serialNum == 1? values["component.bomquantity"]: qPlacheHolder) + "</td><td class='listtext uir-list-row-cell'>" + (serialNum == 1? values["component.custrecord_version_location_number"]: lPlacheHolder) + "</td><td class='listtext uir-list-row-cell'>" +
            (serialNum == 2? values["component.bomquantity"]: qPlacheHolder) + "</td><td class='listtext uir-list-row-cell'>" + (serialNum == 2? values["component.custrecord_version_location_number"]: lPlacheHolder) + "</td></tr>";
        };
        return linesHtml;
    }

    function getBomReversionInfo(parameters) {
        var sch = {
            type: "bom",
            columns: [
                        { name: "name", join: "revision" }, 
                        { name: "custrecord_ps_bom_approvestatus2", join: "revision" },
                        "subsidiary",
                        { name: "internalid", join: "revision" },
                        "name",
                        { name: "effectivestartdate", join: "revision" },
                        { name: "effectiveenddate", join: "revision" },
                        { name: "custrecord_ps_bom_approvestatus2", join: "revision" },
                    ],
            filters: [
                        ["subsidiary", "anyof", parameters.subsidiaryValue],
                        "AND",
                        ["internalid", "anyof", parameters.bomCodeValue]
                    ]
        };
        var allResults = getAllSearchResults(sch), result = {};
        for(var i = 0; i < allResults.length; i++) {
            var item = allResults[i];
            result[item.id] = result[item.id] || [];
            result[item.id].push(item.getAllValues());
        }
        return result;
    }

    function getBomCodeSubsidiary(parameters) {
        var allResults = getAllSearchResults({
            type: "bom",
            columns: ["subsidiary"],
            filters: ["internalid", "anyof", parameters.bomCode]
        });
        var result = [];
        for(var i = 0; i < allResults.length; i++) {
            result.push(allResults[i].getValue(allResults[i].columns[0]));
        }
        return result;
    }

    //单阶BOM对比结束
    function getCompareNumber() {
        var date = new Date(), month = date.getMonth() + 1, day = date.getDate() + 1;
        var number = date.getFullYear() + (month < 10? "0": "") + month + (day < 10? "0": "") + day;
        var numSch = {
            type: "customrecord_bom_multi_grade_contrast",
            columns: ["custrecord_mult_contrast_bill_number"],
            filters: ["custrecord_mult_contrast_bill_number", "contains", number]
        };
        var allResults = getAllSearchResults(numSch);
        for(var i = 0, _num = 0; i < allResults.length; i++) {
            var value = +(allResults[i].getValue(numSch.columns[0]).slice(-4));
            _num = _num < value? value: _num;
        }
        _num++;
        number += ((_num < 10? "000": _num < 100? "00": "") + _num);
        return number;
    }

    function getSublistData(param) {
        var bomSch = {
            type: "bom",
            columns: [
                { name: "internalid", label: "custrecord_multi_bom_code" },
                { name: "name", label: "custrecord_multi_bom_code_display" }
            ],
            filters: [
                [["revision.effectivestartdate", "onorbefore", "today"], "OR", ["revision.effectivestartdate", "isempty", ""]],
                "AND",
                [["revision.effectiveenddate", "onorafter", "today"], "OR", ["revision.effectiveenddate", "isempty", ""]],
                "AND",
                ["revision.custrecord_ps_bom_approvestatus2", "anyof", "1"]
            ]
        };
        if(param.sBomCode && param.eBomCode) {
            if(param.sBomCode > param.eBomCode) {
                var temp = param.sBomCode;
                param.sBomCode = param.eBomCode, param.eBomCode = temp;
            }
            bomSch.filters.push("AND", ["internalidnumber", "between", param.sBomCode, param.eBomCode]);
        } else if(param.sBomCode) {
            bomSch.filters.push("AND", ["internalidnumber", "greaterthanorequalto", param.sBomCode]);
        } else if(param.eBomCode) {
            bomSch.filters.push("AND", ["internalidnumber", "lessthanorequalto", param.eBomCode]);
        }
        if(param.subsidiary) {
            bomSch.filters.push("AND", ["subsidiary", "anyof", param.subsidiary]);
        }
        var datas = getSearchData(bomSch);
        var ids = [];
        for(var id in datas) {
            ids.push(id);
        }
        if(!ids.length) { return []; }
        datas = getSearchData({
            type: "item",
            columns: [
                { name: "displayname", label: "custrecord_mult_bom_name" },
                { name: "billofmaterials", join: "assemblyitembillofmaterials" },
            ],
            filters: ["assemblyitembillofmaterials.billofmaterials", "anyof", ids]
        }, datas, function(item, column) {
            return item.getValue(column[1]);
        });
        var _datas = [];
        for(var id in datas) {
            _datas.push(datas[id]);
        }
        return _datas;
    }

    function getSearchData(sch, ret, getIds) {
        var ret = ret || {};
        var allResults = getAllSearchResults(sch);
        for(var i = 0; i < allResults.length; i++) {
            var item = allResults[i];
            for(var j = 0; j < sch.columns.length; j++) {
                var column = sch.columns[j];
                if(column.label == undefined) { continue; }
                var id = getIds? getIds(item, sch.columns): item.id;
                ret[id] = ret[id] || {};
                var value = item.getValue(column);
                var text = item.getText(column);
                ret[id][column.label] = value;
                text !== undefined && (ret[id][column.label + "_display"] = text);
            }
        }
        return ret;
    }

    function multGradContrast(param) {
        var qArrays = ["物料编码", "物料名称", "规格型号", "计量单位", "BOM用量汇总"], cObject = {};
        var info = getComponentInfo({ bomIds: param.bomIds, bomMap: {}, componentInfo: {}, bomIdText: {}, itemMap: {} }, 0);
        for(var index in param.bomIds) {
            var bomId = param.bomIds[index];
            var components = calcBomQuantity(info, bomId, 1, bomId, 0);
            qArrays.push(info.bomIdText[bomId]);
            for(var cIndex in components) {
                var item = components[cIndex];
                var bomValue = item.getValue(item.columns[1]);
                cObject[bomValue] = cObject[bomValue] || 
                ['"' + item.getText(item.columns[1]) + '"', '"' + (item.getValue(item.columns[2]) || " ") + '"', 
                '"' + (item.getValue(item.columns[3]) || " ") + '"', '"' + (item.getValue(item.columns[4]) || " ") + '"', ""];
                cObject[bomValue][qArrays.length - 1] = '"' + (item[bomId] || "0") + '"';
            }
        }
        var fileContents = "";
        for(var bomValue in cObject) {
            cObject[bomValue][4] = 0;
            for(var i = 5; i < cObject[bomValue].length; i++) {
                cObject[bomValue][4] += JSON.parse(cObject[bomValue][i] || '"0"') * 1;
            }
            cObject[bomValue][4] = '"' + cObject[bomValue][4] + '"';
            fileContents += cObject[bomValue] + "\n";
        }
        fileContents = qArrays + "\n" + fileContents;
        return createFile("多阶BOM差异分析报表", fileContents.replace(/null/gm, ""));
    }

    function calcBomQuantity(info, bomId, bomQuantity, ceilBomId, deep) {
        var floorComponents = [], components = info.componentInfo[ceilBomId + "_" + bomId + "_" + deep];
        for(var index in components) {
            var schItem = components[index];
            var itemValue = schItem.getValue(schItem.columns[1]);
            schItem[ceilBomId] = schItem[ceilBomId] == undefined? +schItem.getValue(schItem.columns[5]): schItem[ceilBomId];
            if(info.bomMap[itemValue]) {
                for(var i = 0; i < info.bomMap[itemValue].length; i++) {
                    floorComponents = floorComponents.concat(calcBomQuantity(info, info.bomMap[itemValue][i], schItem[ceilBomId], ceilBomId, ++deep));
                    schItem[ceilBomId] *= bomQuantity;
                }
            } else {
                schItem[ceilBomId] *= bomQuantity;
                for(var i = floorComponents.length - 1; i > -1 && floorComponents[i].getValue(floorComponents[i].columns[1]) != itemValue; i--);
                i > -1? floorComponents[i][ceilBomId] += schItem[ceilBomId]: floorComponents.push(schItem);
            }
        }
        return floorComponents;
    }

    function getComponentInfo(info, deep, ceilBomId) {
        var sch = {
            type: "bomrevision",
            columns: [
                        "billofmaterials",
                        { name: "item", join: "component" },
                        { name: "custrecord_display_name", join: "component" },
                        { name: "description", join: "component" },
                        { name: "units", join: "component" },
                        { name: "bomquantity", join: "component" }
                     ],
            filters: [
                        [["effectivestartdate", "onorbefore", "today"], "OR", ["effectivestartdate", "isempty", ""]],
                        "AND",
                        [["effectiveenddate", "onorafter", "today"], "OR", ["effectiveenddate", "isempty", ""]],
                        "AND",
                        ["custrecord_ps_bom_approvestatus2", "anyof", "1"],
                        "AND",
                        ["billofmaterials", "anyof", info.bomIds]
                     ]
        };
        var searchResults = getAllSearchResults(sch);
        if(!searchResults.length) { return info; }
        var componentIds = [], bomIds = [];
        for(var index in searchResults) {
            var item = searchResults[index];
            var bomId = item.getValue(sch.columns[0]);
            var infoId = (ceilBomId && ceilBomId[bomId]? ceilBomId[bomId]: bomId)  + "_" + bomId + "_" + deep;
            info.componentInfo[infoId] = info.componentInfo[infoId] || [];
            info.componentInfo[infoId].push(item);
            componentIds.push(item.getValue(sch.columns[1]));
            info.bomIdText[bomId] = item.getText(sch.columns[0]);
            ceilBomId = ceilBomId || {};
            ceilBomId[item.getValue(sch.columns[1])] = bomId;
        }
        sch = {
            type: "item",
            columns: [{ name: "billofmaterials", join: "assemblyitembillofmaterials" }],
            filters: ["internalid", "anyof", componentIds]
        }
        searchResults = getAllSearchResults(sch);
        if(!searchResults.length) { return info; }
        for(var index in searchResults) {
            var item = searchResults[index];
            var bomId = item.getValue(sch.columns[0]);
            info.bomMap[item.id] = info.bomMap[item.id] || [];
            info.bomMap[item.id].push(bomId);
            bomIds.push(bomId);
            ceilBomId[bomId] = ceilBomId[item.id];
        }
        info.bomIds = bomIds;
        return getComponentInfo(info, ++deep, ceilBomId);
    }

    function createFile(fileName, contents) {
        try {
            var fileObj = file.create({
                name: fileName, ///'test.txt',
                fileType: file.Type.CSV, //file.Type.PLAINTEXT,file.Type.CSV,// file.Type.PLAINTEXT,
                contents: contents
            });
            fileObj.folder = 5418;
            fileObj.encoding = file.Encoding.GB2312;
            var fileId = fileObj.save();
        } catch (e) {
            log.audit({
                title: "文件创建失败",
                details: e.name + ':' + e.message
            });
        }
        fileObj = file.load({
            id: fileId
        });
        return fileObj.url;
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
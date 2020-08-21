/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/search', 'N/record', 'N/url', 'N/format', 'N/file'], function (search, record, url, format, file) {
    var funcList = {
        getComponentList: getComponentList,
        getBomcodeUnits: getBomcodeUnits,
        getBomSearchGridData: getBomSearchGridData,
        getComponentItemInfo: getComponentItemInfo
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

    function getBomcodeUnits(context) {
        var result = {};
        if(!context.itemCodeList.length) { return result; }
        var sch = {
            type: "bomrevision",
            columns: ["component.units", "component.item", "component.custrecord_version_location_number", 
            "component.custrecord_remarks", "billofmaterials.internalid",//4
            "component.custrecord_version_subitem_attribute", "component.bomquantity",
            "component.componentyield", "name"],
            filters: [
                [["effectivestartdate", "onorbefore", "today"], "OR", ["effectivestartdate", "isempty", ""]],
                "AND",
                [["effectiveenddate", "onorafter", "today"], "OR", ["effectiveenddate", "isempty", ""]],
                "AND",
                ["custrecord_ps_bom_approvestatus2", "anyof", "1"],
                "AND",
                ["billofmaterials.internalid", "anyof", context.bomCodeList],
                "AND",
                ["component.item", "anyof", context.itemCodeList]
            ]
        };
        if(context.signal == "Add" || context.signal == "To") {
            sch = {
                type: "item",
                columns: ["consumptionunit", "internalid", "custitem_output_rate"],
                filters: ["internalid", "anyof", context.itemCodeList]
            };
        } else if(!context.bomCodeList.length) { return result; }
        var allResults = getAllSearchResults(sch);
        var isBomVersion = sch.columns[8];
        var copAttrObj = getCorporateAttributes(context);
        for(var i = 0; i < allResults.length; i++) {
            var itemResult = allResults[i];
            var value = itemResult.getValue(itemResult.columns[0]);
            var text = itemResult.getText(itemResult.columns[0]);
            var itemid = itemResult.getValue(itemResult.columns[1]);
            var bomCode = isBomVersion? itemResult.getValue(itemResult.columns[4]): "";
            var unkeyId = itemid + (bomCode && ",") + bomCode;
            if(context.signal != "Add" && context.signal != "To") {//由于组件的单位查出来是文本类型，所以需要取版本行上的单位值
                var reversionRec = record.load({ type: "bomrevision", id: itemResult.id, isDynamic: false });
                var line = reversionRec.findSublistLineWithValue({
                    sublistId: "component",
                    fieldId: "item",
                    value: itemid
                });
                if(line != -1) {
                    value = reversionRec.getSublistValue({ fieldId: "units", sublistId: "component", line: line });
                    text = reversionRec.getSublistText({ fieldId: "units", sublistId: "component", line: line });
                }
            }
            result[unkeyId] = result[unkeyId] || {};
            result[unkeyId]["custrecord_eco_bom_unit"] = { value: value, text: text || value };
            result[unkeyId]["custrecord_eco_line_memo"] = { value: isBomVersion? itemResult.getValue(itemResult.columns[3]): "" };
            result[unkeyId]["custrecord_location_code"] = { value: isBomVersion? itemResult.getValue(itemResult.columns[2]): "" };
            result[unkeyId]["custrecord_product_attribute"] = copAttrObj[itemid] || "";
            result[unkeyId]["custrecord_component_quantity"] = { value: isBomVersion? itemResult.getValue(itemResult.columns[6]): "" };
            result[unkeyId]["custrecord_component_yield"] = { value: itemResult.getValue(itemResult.columns[isBomVersion? 7: 2]) + "%" };
            result[unkeyId]["custrecord_former_revision"] = { value: isBomVersion? itemResult.getValue(itemResult.columns[8]): "" };
        }
        return result;

        function getCorporateAttributes(context) {
            var retObj = {};
            if(!context.subsidiary) { return retObj; }
            var sch = {
                type: "customrecord_intercompany_fields",
                columns: ["custrecord_link_field", "custrecord_material_attribute"],
                filters: [
                    ["custrecord_intercompany_subsidiary", "anyof", context.subsidiary],
                    ["custrecord_link_field", "anyof", context.bomCodeList]
                ]
            }
            var result = getAllSearchResults(sch);
            for(var i = 0; i < result.length; i++) {
                var item = result[i];
                var bomCode = item.getValue(item.columns[0]);
                for(var index = context.bomCodeList.length - 1; i > -1 && item.bomCodeList[index] != bomCode; i--);
                retObj[context.itemCodeList[index]] = { value: item.getValue(item.columns[1]), text: item.getText(item.columns[1]) };
            }
            return retObj;
        }
    }

    function getComponentItemInfo(context) {
        var result = {};
        if(!context.bomCodeList || !context.bomCodeList.length) { return result; }
        var sch = {
            type: "bomrevision",
            columns: ["billofmaterials.internalid", "component.item"],
            filters: [
                [["effectivestartdate", "onorbefore", "today"], "OR", ["effectivestartdate", "isempty", ""]],
                "AND",
                [["effectiveenddate", "onorafter", "today"], "OR", ["effectiveenddate", "isempty", ""]],
                "AND",
                ["custrecord_ps_bom_approvestatus2", "anyof", "1"],
                "AND",
                ["billofmaterials.internalid", "anyof", context.bomCodeList]
            ]
        };
        if(context.componentList && context.componentList.length) {
            sch.filters.push("AND", ["component.item", "anyof", context.componentList]);
        }
        var allResults = getAllSearchResults(sch);
        for(var i = 0; i < allResults.length; i++) {
            var item = allResults[i], itemValue = item.getValue(item.columns[1]), bomValue = item.getValue(item.columns[0]);
            result[bomValue + "," + itemValue] = true;
        }
        return result;
    }

    function getComponentList(context) {
        if(!context.bomNameList.length) { return []; }
        var bomCodeList = [];
        var allResults = getAllSearchResults({
            type: "item",
            columns: ["internalid", "itemid", "description", "custitem_item_english_desc", "custitem_item_material_attribute", "custitem_output_rate", "isinactive", "consumptionunit"],
            filters: ["itemid", "contains", context.bomNameList]
        });
        var itemDatas = {};
        for(var i = 0; i < allResults.length; i++) {
            var item = allResults[i];
            bomCodeList.push(item.id);
            itemDatas[item.id] = itemDatas[item.id] || {};
            itemDatas[item.id]["value"] = item.id;
            itemDatas[item.id]["text"] = item.getValue(item.columns[1]) || "";
            itemDatas[item.id]["cstm_bom_specification"] = item.getValue(item.columns[2]) || "";
            itemDatas[item.id]["cstm_bom_en_specification"] = item.getValue(item.columns[3]) || "";
            itemDatas[item.id]["cstm_bom_attribute"] = item.getValue(item.columns[4]) || "";
            itemDatas[item.id]["cstm_bom_attribute_display"] = item.getText(item.columns[4]) || "";
            itemDatas[item.id]["cstm_bom_quantity"] = "";
            itemDatas[item.id]["cstm_bom_output"] = item.getValue(item.columns[5]) || "";
            itemDatas[item.id]["cstm_bom_position"] = "";
            itemDatas[item.id]["cstm_bom_name"] = itemDatas[item.id]["text"];
            itemDatas[item.id]["cstm_bom_memo"] = "";
            itemDatas[item.id]["isinactive"] = item.getValue(item.columns[6]) || "";
            itemDatas[item.id]["cstm_bom_units"] = item.getValue(item.columns[7]) || "";
            itemDatas[item.id]["cstm_bom_units_display"] = item.getText(item.columns[7]) || "";
        }
        var result = [{
            value: "",
            text: "",
            cstm_bom_specification: "",
            cstm_bom_en_specification: "",
            cstm_bom_attribute: "",
            cstm_bom_attribute_display: "",
            cstm_bom_quantity: "",
            cstm_bom_output: "",
            cstm_bom_position: "",
            cstm_bom_name: ""
        }];
        for(var itemId in itemDatas) {
            result.push(itemDatas[itemId]);
        }
        return result;
    }

    function getBomSearchGridData(context) {
        var bomFilters = context.filters["bomrevision"] || [], itemFilters = context.filters["item"] || [], lineArray = [], item, allResults;
        var sch = {
            type: "bomrevision",
            columns: [
                { name: "internalid" },
                { name: "internalid", join: "billofmaterials", label: "cstm_bom_code_name" },
                { name: "name", join: "billofmaterials", label: "cstm_bom_code_name_display" },
                { name: "subsidiary", join: "billofmaterials", label: "cstm_bom_subsidiary" },
                { name: "name", label: "cstm_revision_name" },
                { name: "isinactive", label: "cstm_bom_active_status" },
                { name: "custrecord_ps_bom_approvestatus2", label: "cstm_approve_status" },
                { name: "custrecord_approve_time", label: "cstm_approve_time" },
                { name: "bomquantity", join: "component", label: "cstm_bom_quantity"},
                { name: "componentyield", join: "component", label: "cstm_bom_output"},
                { name: "custrecord_version_location_number", join: "component", label: "cstm_bom_location_number"},
                { name: "units", join: "component", label: "cstm_assembly_unit"},
            ],
            filters: [
                [["effectivestartdate", "onorbefore", "today"], "OR", ["effectivestartdate", "isempty", ""]],
                "AND",
                [["effectiveenddate", "onorafter", "today"], "OR", ["effectiveenddate", "isempty", ""]],
                "AND",
                ["custrecord_ps_bom_approvestatus2", "anyof", "1"]
            ]
        };
        for(var i = bomFilters.length - 1; i > -1 && !(bomFilters[i].name == "name" && bomFilters[i].join == "billofmaterials"); i--);
        if(i > -1) {
            sch.filters.push("AND", ["billofmaterials." + bomFilters[i].name, bomFilters[i].operator, bomFilters[i].values]);
            bomFilters.splice(i, 1);
        }
        if(context.status == "Add") {
            var bomReversionIds = [];
            allResults = getAllSearchResults({
                type: "bomrevision",
                columns: ["component.item"],
                filters: ["component.item", "anyof", context.bomCodeList]
            });
            for(var i = 0; i < allResults.length; i++) {
                bomReversionIds.push(allResults[i].id);
            }
            bomReversionIds.length && sch.filters.push("AND", ["internalid", "noneof", bomReversionIds]);
        } else {
            sch.filters.push("AND", ["component.item", "anyof", context.bomCodeList[0]]);
            if(context.bomQuantity && context.bomQuantity.length) {
                sch.filters.push("AND", ["component.bomquantity", "equalto", context.bomQuantity]);
            }
        }
        allResults = getAllSearchResults(sch), itemCodeList = [], bomMap = {}, existItem = {}, bomSubsidiarys = {}, itemSubsidiarys = [];
        for(var i = 0; i < allResults.length; i++) {
            item = allResults[i];
            var codeValue = item.getValue(item.columns[1]);
            bomSubsidiarys[codeValue] = bomSubsidiarys[codeValue] || [];
            bomSubsidiarys[codeValue].push(item.getValue(item.columns[3]));
        }
        var itemAllResults = getAllSearchResults({
            type: "item",
            columns: ["subsidiary"],
            filters: ["internalid", "anyof", context.bomCodeList[0]]
        });
        for(var i = 0; i < itemAllResults.length; i++) {
            itemSubsidiarys.push(itemAllResults[i].getValue(itemAllResults[i].columns[0]));
        }
        
        for(var i = 0; i < allResults.length; i++) {
            item = allResults[i];
            if(context.bomCodeList[1]) {
                var itemSchResults = getAllSearchResults({
                    type: "bomrevision",
                    columns: ["internalid"],
                    filters: [
                        ["internalid", "anyof", item.id],
                        "AND",
                        ["component.item", "anyof", context.bomCodeList[1]]
                    ]
                });
                if(itemSchResults.length) { continue; }
            }
            var codeValue = item.getValue(item.columns[1]);
            var existId = codeValue + "_" + item.id;
            for(var j = bomSubsidiarys[codeValue].length - 1; j > -1 && itemSubsidiarys.indexOf(bomSubsidiarys[codeValue][j]) > -1; j--);
            if(!existItem[existId] && j == -1 && isValidLine(item, bomFilters || [])) {
                existItem[existId] = true;
                bomMap[codeValue] = lineArray.length;
                lineArray.push([
                    item.getValue(item.columns[1]),
                    item.getValue(item.columns[2]),
                    "", "", "", "",
                    context.status == "Add"? "": item.getValue(item.columns[8]),
                    item.getValue(item.columns[9]),
                    item.getValue(item.columns[10]),
                    item.getValue(item.columns[4]),
                    item.getValue(item.columns[11]),
                    item.getValue(item.columns[11]),
                    item.getValue(item.columns[5]),
                    item.getValue(item.columns[6]),
                    item.getText(item.columns[6]),
                    item.getValue(item.columns[7]),
                    item.getText(item.columns[7]),
                ]);
            }
        }
        for(var codeValue in bomMap) {
            itemCodeList.push(codeValue);
        }
        if(!itemCodeList.length) { return lineArray; }
        allResults = getAllSearchResults({
            type: "bom",
            columns: ["assemblyItem.assembly"],
            filters: ["internalid", "anyof", itemCodeList]
        });
        itemCodeList = [];
        for(var i = 0; i < allResults.length; i++) {
            var assemblyId = allResults[i].getValue(allResults[i].columns[0]);
            itemCodeList.push(assemblyId);
        }
        if(!itemCodeList.length) { return lineArray; }
        itemAllResults = getAllSearchResults({
            type: "item",
            columns: [
                { name: "internalid", label: "" },
                { name: "displayname", label: "cstm_item_code_name" },
                { name: "description", label: "cstm_ps_item_specification" },
                //{ name: "stockunit", label: "cstm_assembly_unit" },
                { name: "billofmaterials", join: "assemblyitembillofmaterials", label: "cstm_bom_code_name" },
                { name: "itemid" }
            ],
            filters: ["internalid", "anyof", itemCodeList]
        });
        var _lineArray = [];
        for(var i = 0; i < itemAllResults.length; i++) {
            var item = itemAllResults[i], itemId = item.id;
            var j = bomMap[item.getValue(item.columns[3])];
            if(lineArray[j] === undefined || !isValidLine(item, itemFilters || [])) { continue; }
            lineArray[j][2] = itemId;
            lineArray[j][3] = item.getValue(item.columns[4]);
            lineArray[j][4] = item.getValue(item.columns[1]);
            lineArray[j][5] = item.getValue(item.columns[2]);
            // lineArray[j][10] = item.getValue(item.columns[3]);
            // lineArray[j][11] = item.getText(item.columns[3]);
            if(!lineArray[j][1]) {
                lineArray[j][1] = item.getValue(item.columns[3]);
                lineArray[j][2] = item.getText(item.columns[3]);
            }
            _lineArray.push(lineArray[j]);
        }
        return _lineArray;
    }

    function isValidLine(lineArrayLine, cstmFilters, getFieldPos){
        var isValidLine = true;
        for(var fIndex = 0; fIndex < cstmFilters.length && isValidLine; fIndex++) {
            var filterInfo = cstmFilters[fIndex];
            var value = getFilterValue(lineArrayLine, filterInfo, getFieldPos);
            var fValues = filterInfo.values;
            var fValues0 = fValues[0] == undefined? "": fValues[0];
            value = value == undefined? "": value;
            if(value == "" && fValues0 != "" && ["any", "isempty"].indexOf(filterInfo.operator) == -1) {
                isValidLine = false;
                continue;
            }
            var index = value.indexOf(fValues[0]);
            switch(filterInfo.operator) {
                case "after":
                case "notbefore":
                    isValidLine = (isNaN(+value) && isNaN(+fValues[0])? value: +value) > fValues[0];
                    break;
                case "allof": 
                    for(var i = fValues.length - 1; i > -1 && value.indexOf(fValues[i]) > -1; i--);
                    isValidLine = i == -1;
                    break;
                case "any": 
                    isValidLine = true;
                    break;
                case "haskeywords": 
                case "notallof":
                    for(var i = fValues.length - 1; i > -1 && value.indexOf(fValues[i]) == -1; i--);
                    isValidLine = i != -1;
                    break;
                case "anyof": 
                    isValidLine = fValues.indexOf(value) > -1;
                    break;
                case "notafter":
                case "before": 
                    isValidLine = (isNaN(+value) && isNaN(+fValues[0])? value: +value) < fValues[0];
                    break;
                case "between": 
                case "within":
                    value = isNaN(+value) && isNaN(+fValues[0]) && isNaN(+fValues[1])? value: +value;
                    isValidLine = value >= fValues[0] && value <= fValues[1];
                    break;
                case "contains": 
                    isValidLine = index > -1;
                    break;
                case "doesnotcontain": 
                    isValidLine = index == -1;
                    break;
                case "doesnotstartwith": 
                    isValidLine = !!index;
                    break;
                case "is": 
                case "equalto": 
                    isValidLine = fValues[0] == value;
                    break;
                case "notlessthanorequalto":
                case "greaterthan": 
                    isValidLine = (isNaN(+value) && isNaN(+fValues[0])? value: +value) > fValues[0];
                    break;
                case "notlessthan":
                case "greaterthanorequalto": 
                    isValidLine = (isNaN(+value) && isNaN(+fValues[0])? value: +value) >= fValues[0];
                    break;
                case "isempty": 
                    isValidLine = value == "" || value == null;
                    break;
                case "isnot": 
                case "notequalto":
                    isValidLine = value != fValues[0];
                    break;
                case "isnotempty": 
                    isValidLine = value != "" && value != null;
                    break;
                case "notgreaterthanorequalto":
                case "lessthan": 
                    isValidLine = (isNaN(+value) && isNaN(+fValues[0])? value: +value) < fValues[0];
                    break;
                case "notgreaterthan":
                case "lessthanorequalto": 
                    isValidLine = (isNaN(+value) && isNaN(+fValues[0])? value: +value) <= fValues[0];
                    break;
                case "noneof": 
                    for(var i = fValues.length - 1; i > -1 && fValues[i] != value; i--);
                    isValidLine = i == -1;
                    break;
                case "notbetween": 
                case "notwithin":
                    value = isNaN(+value) && isNaN(+fValues[0]) && isNaN(+fValues[1])? value: +value;
                    isValidLine = value < fValues[0] && value > fValues[1];
                    break;
                case "notonorbefore": 
                    index = index;
                    isValidLine = fValues[0].length - index != value.length;
                    break;
                case "noton":
                    isValidLine = !(index != -1 && index > 1 && (fValues[0].length - index != value.length));
                    break;
                case "on": 
                    isValidLine = index != -1 && index > 1 && (fValues[0].length - index != value.length);
                    break;
                case "onorafter": 
                    isValidLine = index != -1 && index > 1;
                    break;
                case "onorbefore": 
                    isValidLine = index != -1 && !(fValues[0].length - index != value.length);
                    break;
                case "startswith": 
                case "notonorafter":
                    isValidLine = !index;
                break;
            }
        }
        return isValidLine;
    }

    function getFilterValue(lineArrayLine, filterItem, getFieldPos) {
        var value = "", name = filterItem.name;
        if(typeof lineArrayLine.getAllValues == "function") {
            value = lineArrayLine.getAllValues();
            value = value[(filterItem.join? filterItem.join + ".": "") + name];
            if(typeof value == "object") {
                value = !isNaN(+filterItem.values[0])? value[0].value: value[0].text;
            }
        } else if(lineArrayLine[name] != undefined){
            value = lineArrayLine[name]
        } else if(typeof getFieldPos == "function"){
            value = lineArrayLine(getFieldPos(name));
        }
        return value;
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
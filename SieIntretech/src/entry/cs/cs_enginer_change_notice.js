/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/url', 'N/https', 'N/ui/message', '../../../lib/common_rhysdefine_standardgrid'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function(record, search, url, https, message, myGrid) {
        var popup, itemExist = {};
        var sublistId = "recmachcustrecord_change_detail_link_field";
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            window.currentRecord = scriptContext.currentRecord;
            if(scriptContext.mode == "create") {
                ecoNumberAutoGenerate(scriptContext);
            }
            registerSerachBomEvent();
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
            var sameLine = -1;
            if(sublistId) {//Form字段没sublistid
                var bomCode = getFieldValue("custrecord_change_detail_bom_code", sublistId, scriptContext.line);
                var itemCode = getFieldValue("custrecord_subitem_code", sublistId, scriptContext.line);
                scriptContext.oldValue = getSublistFieldOldValue(scriptContext);
            }
            switch(scriptContext.fieldId) {
                case "custrecord_eco_type":
                case "custrecord_eco_signal":
                    setFieldValue("custrecord_eco_checkout_reason", "", sublistId, scriptContext.line, true);
                    setTimeout(function (){
                        var type = getFieldValue("custrecord_eco_type", sublistId, scriptContext.line);
                        sameLine = findEqualCodeIndex(bomCode, itemCode, scriptContext.line);
                        if(type == "2") {
                            if(sameLine > -1) {
                                setFieldValue(scriptContext.fieldId, scriptContext.oldValue || "", sublistId, scriptContext.line, true);
                                return alert("已经存在相同的行不能将类型改为修改！");
                            } else if(!bomCode) {
                                return setFieldValue(scriptContext.fieldId, scriptContext.oldValue || "", sublistId, scriptContext.line, true);;
                            }
                        }
                        ecoTypeAndSingleFieldChange(scriptContext);
                        var single = getFieldValue("custrecord_eco_signal", sublistId, scriptContext.line);
                        type = getFieldValue("custrecord_eco_type", sublistId, scriptContext.line);
                        if(!itemCode || !bomCode || !type) { }
                        else if(type == "1" && itemExist[bomCode + "," + itemCode]) {
                            setFieldValue("custrecord_eco_checkout_reason", "添加失败，组件已存在。", sublistId, scriptContext.line, true);
                            return alert("不能添加已经存在的组件！");
                        } else if(type != "1" && !itemExist[bomCode + "," + itemCode] && single != "4") {
                            setFieldValue("custrecord_eco_checkout_reason", "删除或修改失败，组件不存在。", sublistId, scriptContext.line, true);
                            return alert("组件不存在不能修改或删除！");
                        }
                        setBomcodeUnits({ sublistId: sublistId, line: scriptContext.line, callBack: formToAutoComplete});
                    }, 0);
                    break;
                case "custrecord_change_detail_bom_code":
                case "custrecord_subitem_code":
                    setTimeout(function() {
                        sameLine = findEqualCodeIndex(bomCode, itemCode, scriptContext.line);
                        var single1 = getFieldValue("custrecord_eco_signal", sublistId, scriptContext.line);
                        var single2 = getFieldValue("custrecord_eco_signal", sublistId, sameLine);
                        if(sameLine > -1 && single1 == single2/*  && single1 != "4" */) {
                            setFieldValue(scriptContext.fieldId, "", sublistId, scriptContext.line, true);
                            if(scriptContext.fieldId == "custrecord_subitem_code" && getFieldValue("custrecord_eco_type", sublistId, scriptContext.line) == "2") {
                                setFieldValue(scriptContext.fieldId, "", sublistId, scriptContext.line + 1, true);
                            }
                            return alert("BOM编号和Item编号与第" + (sameLine + 1) + "相同。请保证两个字段与其它行不一致。");
                        }
                        setFieldValue("custrecord_eco_checkout_reason", "", sublistId, scriptContext.line, true);
                        setBomcodeUnits(scriptContext);
                        autoCompleteCodes(scriptContext);
                    }, 0);
                    break;
            }
            return true;
        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {

        }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {
        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {

        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {
            
            return true;
        }

        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {
            var bomCode = currentRecord.getCurrentSublistText({fieldId:"custrecord_subitem_code", sublistId:sublistId})
            var bomQty = getFieldValue("custrecord_component_quantity", sublistId);
            var posNum = getFieldValue("custrecord_location_code", sublistId);
            setTimeout(function() {
                var currLine = currentRecord.getCurrentSublistIndex({ sublistId: sublistId }) - 1;
                var lineArrayLine = getSublistMachine(sublistId).getLineArrayLine(currLine);
                if(!lineArrayLine) { return; }
                for(var i = lineArrayLine.length - 1; i > -1 && !lineArrayLine[i]; i--);
                if(i == -1) {
                    currentRecord.removeLine({ sublistId: sublistId, line: currLine, ignoreRecalc: true });
                    alert("不能提交空行,空行将被删除！");
                }
                updateLineNumber(scriptContext.sublistId);
            }, 0);
            if(companyPostionNumber(bomCode, bomQty, posNum)) {
                return alert("Bom位号与用量不一致！");
            }
            return true;
        }

        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {
        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {
            var isValidDelete = true;
            var single = getFieldValue("custrecord_eco_signal", sublistId);
            var currLine = currentRecord.getCurrentSublistIndex({ sublistId: sublistId });
            if(single == "3") {
                currentRecord.removeLine({ sublistId: sublistId, line: currLine, ignoreRecalc: true });
                if(getFieldValue("custrecord_eco_signal", sublistId, currLine) == "4") {
                    currentRecord.removeLine({ sublistId: sublistId, line: currLine, ignoreRecalc: true });
                }
                isValidDelete = false;
            } else if(single == "4") {
                currentRecord.removeLine({ sublistId: sublistId, line: currLine, ignoreRecalc: true });
                if(getFieldValue("custrecord_eco_signal", sublistId, currLine - 1) == "3") {
                    currentRecord.removeLine({ sublistId: sublistId, line: currLine - 1, ignoreRecalc: true });
                }
                isValidDelete = false;
            }
            return isValidDelete;
        }

        function searchBomEvent(scriptContext) {
        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {
            var errorMsg = "";
            var allCount = currentRecord.getLineCount({ sublistId: sublistId });
            for(var line = 0; line < allCount; line++) {
                var ecoSignal = getFieldValue("custrecord_eco_signal", sublistId, line);
                if(ecoSignal == "3") {
                    if(getFieldValue("custrecord_eco_signal", sublistId, line + 1) != "4") {
                        errorMsg = "行的From行下面没有To行。";
                        break;
                    }
                    line++;
                } else if(ecoSignal == "4") {
                    errorMsg = "行的To行上面没有From行。";
                    break;
                }
            }
            line != allCount && alert("保存失败！第" + (+line + 1) + errorMsg);
            return line == allCount;
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            //postSourcing: postSourcing,
            //sublistChanged: sublistChanged,
            //lineInit: lineInit,
            validateField: validateField,
            validateLine: validateLine,
            //validateInsert: validateInsert,
            //validateDelete: validateDelete,
            saveRecord: saveRecord
        };

        function formToAutoComplete(line) {
            if(getFieldValue("custrecord_eco_signal", sublistId, line) != "3" || getFieldValue("custrecord_eco_signal", sublistId, +line + 1) != "4") { return; }
            var copyFields = ["custrecord_eco_bom_unit", "custrecord_eco_line_memo", "custrecord_location_code", "custrecord_component_yield", "custrecord_component_quantity"];
            var isSameItemCode = getFieldValue("custrecord_subitem_code", sublistId, line) == getFieldValue("custrecord_subitem_code", sublistId, +line + 1);

            for(var index in copyFields) {
                var fieldId = copyFields[index];
                if(getFieldValue(fieldId, sublistId, +line + 1)) { continue; }
                if(!isSameItemCode && ["custrecord_eco_bom_unit", "custrecord_component_yield"].indexOf(fieldId) > -1) { continue; }
                setFieldValue(fieldId, getFieldValue(fieldId, sublistId, line), sublistId, +line + 1);
                if(fieldId == "custrecord_eco_bom_unit") {
                    setFieldValue("custrecord_eco_bom_unit_display", currentRecord.getSublistText({ sublistId: sublistId, fieldId: fieldId, line: line }), sublistId, +line + 1);
                }
            }
            if(!isSameItemCode) {
                setBomcodeUnits({ sublistId: sublistId, line: +line + 1 });
            }
        }

        function setBomcodeUnits(scriptContext) {
            var lines = Array.isArray(scriptContext.line)? scriptContext.line: [scriptContext.line];
            var ecoSignal = getFieldValue("custrecord_eco_signal", sublistId, lines[0]);
            var signal = { 2: "Add", 1: "Delete", 3: "From", 4: "To" }[ecoSignal];
            var itemCodeList = [], bomCodeList = [];
            for(var index = 0; index < lines.length; index++) {
                var tempValue = getFieldValue("custrecord_subitem_code", sublistId, lines[index]);
                tempValue && itemCodeList.push(tempValue);
                tempValue = getFieldValue("custrecord_change_detail_bom_code", sublistId, lines[index]);
                tempValue && bomCodeList.push(tempValue);
            }
            if(!signal) { return ; }
            if(!itemCodeList.length || (!bomCodeList && (signal == "Delete" || signal == "From"))) { return ; }
            ajaxPost(url.resolveScript({
                scriptId: 'customscript_rl_eco_change_notice',
                deploymentId: 'customdeploy_rl_eco_change_notice'
            }), {
                funcName: "getBomcodeUnits",
                signal: signal,
                bomCodeList: bomCodeList,
                itemCodeList: itemCodeList,
                subsidiary: currentRecord.getValue("custrecord_eco_subsidiary")
            }, function(result) {
                var unitObj = JSON.parse(result.body);
                for(index = 0; index < lines.length; index++) {
                    var line = lines[index];
                    var bomCode = getFieldValue("custrecord_change_detail_bom_code", sublistId, line);
                    var itemCode = getFieldValue("custrecord_subitem_code", sublistId, line);
                    var unkeyId = itemCode + (signal == "Add" || signal == "To"? "" : "," + bomCode);
                    if(!unitObj[unkeyId]) { continue ; }
                    var emptyFieldIds = ["custrecord_eco_bom_unit", "custrecord_eco_line_memo", "custrecord_location_code"]
                    for(var fieldId in unitObj[unkeyId]) {
                        var valueObj = unitObj[unkeyId][fieldId];
                        var oldValue = getFieldValue(fieldId, sublistId, line);
                        if(emptyFieldIds.indexOf(fieldId) > -1 && (oldValue || (valueObj.bomCode && valueObj.bomCode != bomCode))) {
                            continue;
                        } else if(emptyFieldIds.indexOf(fieldId) == -1 && oldValue) { continue; }
                        setFieldValue(fieldId, valueObj.value, sublistId, line);
                        valueObj.text != undefined && setFieldValue(fieldId + "_display", valueObj.text, sublistId, line);
                    }
                }
                typeof scriptContext.callBack == "function" && scriptContext.callBack(lines[0]);
                getSublistMachine(sublistId).buildtable();
            });
        }
        
        function autoCompleteCodes(scriptContext) {
            var bomCode = getFieldValue("custrecord_change_detail_bom_code", sublistId);
            var itemCode = getFieldValue("custrecord_subitem_code", sublistId);
            ajaxPost(url.resolveScript({
                scriptId: 'customscript_rl_eco_change_notice',
                deploymentId: 'customdeploy_rl_eco_change_notice'
            }), {
                funcName: "getComponentItemInfo",
                bomCodeList: bomCode,
                componentList: itemCode
            }, function(result) {
                var type = getFieldValue("custrecord_eco_type", sublistId, scriptContext.line);
                var single = getFieldValue("custrecord_eco_signal", sublistId, scriptContext.line);
                if(result.body == "{}") {
                    if(!itemCode) {
                        setFieldValue("custrecord_eco_checkout_reason", "没有有效的版本。", sublistId, scriptContext.line);
                        alert("获取失败，该BOM里不包含有效的BOM版本！");
                    }
                    else if(!bomCode) {
                        alert("请输入BOM编号的值！");
                    } else if(type != "1" && single != "4") {
                        setFieldValue("custrecord_eco_checkout_reason", "删除或修改失败，组件不存在。", sublistId, scriptContext.line);
                        alert("组件不存在不能修改或删除！");
                    }
                    itemExist[bomCode + "," + itemCode] = false;
                } else if(type == "1") {
                    setFieldValue("custrecord_eco_checkout_reason", "添加失败，组件已存在。", sublistId, scriptContext.line);
                    alert("不能添加已经存在的组件！");
                    itemExist[bomCode + "," + itemCode] = false;
                } else {
                    itemExist = JSON.parse(result.body);
                }
            });
        }

        function ecoTypeAndSingleFieldChange(scriptContext) {
            var ecoTypeMap = { "": "", 1: 2, 2: 3, 3: 1 },
                ecoSingleMap = { "": "", 1: 3, 2: 1, 3: 2, 4: 2 },
                machine = getSublistMachine(sublistId),
                currLine = currentRecord.getCurrentSublistIndex({ sublistId: sublistId }),
                value = getFieldValue(scriptContext.fieldId, sublistId);
            if(scriptContext.fieldId == "custrecord_eco_type") {
                var single = getFieldValue("custrecord_eco_signal", sublistId);
                setFieldValue("custrecord_eco_signal", ecoTypeMap[value], sublistId, true);
                if(value == 2) {
                    currentRecord.commitLine({ sublistId: sublistId });
                    machine.copyline(currLine);
                    currentRecord.commitLine({ sublistId: sublistId });
                    setFieldValue("custrecord_eco_signal", "4", sublistId, currLine + 1, true);
                    machine.buildtable();
                } else if(single == "3") {
                    currentRecord.removeLine({ sublistId: sublistId, line: currLine + 1, ignoreRecalc: true });
                } else if(single == "4") {
                    setFieldValue("custrecord_eco_type", "2", sublistId, true);
                    setFieldValue("custrecord_eco_signal", "4", sublistId, true);
                    return alert("不能更改To行的类型！");
                }
            } else {
                if(value == "4") {
                    setFieldValue("custrecord_eco_signal", scriptContext.oldValue, sublistId, true);
                    return alert("不能将其它类型改为To！");
                } else if(scriptContext.oldValue == "3") {
                    setFieldValue("custrecord_eco_type", ecoSingleMap[value], sublistId, true);
                    return currentRecord.removeLine({ sublistId: sublistId, line: currLine + 1, ignoreRecalc: true });
                } else if(scriptContext.oldValue == "4") {
                    setFieldValue("custrecord_eco_signal", "4", sublistId, true);
                    return alert("不能更改To行的类型！");
                } else if(value == "3") {
                    setFieldValue("custrecord_eco_type", "2", sublistId, true);
                    currentRecord.commitLine({ sublistId: sublistId });
                    machine.copyline(currLine);
                    currentRecord.commitLine({ sublistId: sublistId });
                    setFieldValue("custrecord_eco_signal", "4", sublistId, currLine + 1, true);
                    return machine.buildtable();
                }
                setFieldValue("custrecord_eco_type", ecoSingleMap[value], sublistId, true);
            }
        }
        
        function getSublistFieldOldValue(scriptContext) {
            if(!scriptContext.sublistId) { return ; }
            var machine = getSublistMachine(scriptContext.sublistId);
            var lineArrayLine = machine.getLineArrayLine(scriptContext.line);
            return lineArrayLine && lineArrayLine[machine.getFieldPosition(scriptContext.fieldId)];
        }

        function registerSerachBomEvent(scriptContext) {
            var searchBomBtn = document.querySelector("#custformbutton0");
            searchBomBtn.onclick = searchBomBtn.onclick || function() {
                popup = popup || createPopup({
                    id: "eco_search_component_bom_popup",
                    title: "物料单搜索",
                    gridConfig: {
                        showCheckBox: true,
                        showSerialNumber: true,
                        //showHeaderRow: true,
                        height: "400px",
                        columns: [
                                    { label: "BOM 编号", fieldId: "cstm_bom_code_name", type: "select", width: 200 },
                                    { label: "装配件编号", fieldId: "cstm_assembly_name", type: "select", display: "hidden" },
                                    { label: "名称", fieldId: "cstm_item_code_name" },
                                    { label: "规格", fieldId: "cstm_ps_item_specification" },
                                    { label: "用量", fieldId: "cstm_bom_quantity", width: 50 },
                                    { label: "产出率", fieldId: "cstm_bom_output", display: "hidden" },
                                    { label: "位号", fieldId: "cstm_bom_location_number", display: "hidden" },
                                    { label: "版本号", fieldId: "cstm_revision_name", width: 100 },
                                    { label: "活动状态", fieldId: "cstm_bom_active_status", display: "hidden" },
                                    { label: "审核状态", fieldId: "cstm_approve_status", type: "select", display: "hidden" },
                                    { label: "审核时间", fieldId: "cstm_approve_time", type: "select", display: "hidden" },
                                ],
                        data: []
                    },
                    filters: [
                        { fieldId: "", searchType: "", label: " ", type: "text" },
                        { fieldId: "subsidiary", searchType: "bomrevision", join: "billofmaterials", label: "公司", type: "select" },
                        { fieldId: "name", searchType: "bomrevision", join: "billofmaterials", label: "BOM 编号", type: "text" },
                        { fieldId: "name", searchType: "bomrevision", label: "版本号", type: "text" },
                        { fieldId: "isinactive", label: "", searchType: "bomrevision", type: "text" },
                        { fieldId: "itemid", searchType: "item", label: "装配件编号", type: "select" },
                        { fieldId: "internalid", label: "", type: "select", searchType: "item" },
                        { fieldId: "displayname", label: "名称", type: "text", searchType: "item" },
                        { fieldId: "description",  label: "规格", type: "text", searchType: "item" },
                        { fieldId: "custitem_item_english_desc",  label: "英文规格", type: "text", searchType: "item" },
                        { fieldId: "stockunit", label: "", type: "text", searchType: "item" },
                        { fieldId: "billofmaterials", join: "assemblyitembillofmaterials", label: "装配件BOM编号", type: "select", searchType: "item" }
                    ],
                    filterExpFilters: [{ fieldId: "name", join: "billofmaterials", searchType: "bomrevision", operator: "contains" }]
                });
                popup.switchPopup(true);
            };
            var popupStyle = document.querySelector("#ns_popup_style");
            if(!popupStyle) {
                var style = document.createElement("style");
                style.innerHTML += "#ns_popup_search_component_sublist>:first-child>div{display:inline-block;line-height:28px;;padding:0px 5px;}";
                document.head.append(style);
            }
            return true;
        }

        function createPopup(option) {
            option = option || {};
            var filtersExp = new FilterExpression(option.filters);
            var schGrid = new myGrid.SearchListGrid(option.gridConfig);
            var popup = document.createElement("div");
            var maskDiv = document.createElement("div");
            var width = option.width || 1300;
            var height = option.gridConfig.height;
            var title = option.title || "Popup";
            var id = option.id || document.querySelectorAll("div[id*='cstm_devloper_define_popup_']").length + 1;
            var btnsHeight = 35;
            var popupBodyHeight = height * 2.5 - 30 - btnsHeight;
            var schGridNode = schGrid.create(), filtersNode = filtersExp.create();
            var cmpInfo = searchComponentContent();

            popup.id = "cstm_devloper_define_popup_" + id;
            popup.className = "x-window x-resizable-pinned x-window-mc";
            popup.style = "display:none;min-width:1000px;width:" + width + "px;max-height:" + popupBodyHeight + "px;height:auto;position:absolute;overflow:auto;overflow-y:hidden;top:80px;left:" + ((window.innerWidth - width) / 2) + "px;z-index:9999;";
            popup.innerHTML = '<div id="popup_header" class="x-window-tl" style="width:100%;height:30px;overflow:hidden;\
            position:absolute;left:0;top:0;"><div id="popup_header_title" class="x-window-header x-unselectable x-window-draggable" style="float:left;"><span class="x-window-header-text">' + title + 
            '</span></div><div id="popup_header_btn_close" class="x-tool x-tool-close" style="float:right;margin-top:6px;margin-right:8px;"><span>&nbsp;</span></div></div>\
            <div id="popup_body_buttons" style="height:' + btnsHeight + 'px;margin-top:20px;"><button style="cursor: pointer;padding:2px 6px;margin-left:10px;">新增查询</button>\
            <button style="cursor: pointer;padding:2px 6px;margin-left:10px;">添加至变更明细</button></div>\
            <div id="popup_body" style="max-height:' + popupBodyHeight + 'px;min-height:500px;height:auto;width:100%;"><div id="ns_popup_group_search_component_contains">' + addGroup("ns_popup_group_search_component", "物料查询") + cmpInfo.innerHTML +
            "</div><div id='ns_popup_group_search_bom_contains'>" + addGroup("ns_popup_group_search_bom", "BOM查询") + 
            '<div id="popup_body_filters" style="width:100%;overflow:hidden;height:auto;max-height:35%;padding:5px;"></div>\
                <div id="popup_body_filters_result" style="width:100%;overflow:hidden;max-height:' + (popupBodyHeight * 0.8) + 'px;height:auto;padding:5px;margin-top:5px;"></div></div>\
            </div>';
            maskDiv.id = "cstm_devloper_define_popup_mask_" + id;
            maskDiv.style = "position:absolute;height:" + document.querySelector("html").scrollHeight + "px;width:" + document.querySelector("html").scrollWidth + "px;z-index:9998;backgroundcolor:gray;\
            top:0;left:0;background-color:rgba(152, 143, 143, 0.5);";
            popup.querySelector("#popup_body_filters").appendChild(filtersNode);
            popup.querySelector("#popup_body_filters_result").appendChild(schGridNode);
            document.body.appendChild(maskDiv);
            document.body.appendChild(popup);
            //schGridNode.style = "max-height:" + (height * 0.5) + "px;height:auto;overflow:hidden;position:relative;";
            schGridNode.firstChild.className += "uir-machine-table-container";
            setTimeout(function() {
                option.filterExpFilters && filtersExp.setFilters(option.filterExpFilters);
                //schGridNode.firstChild.style = "width:" + (schGridNode.parentNode.clientWidth - 17) + "px;float:left;height:100%;overflow-y:hidden;overflow-x:auto;max-height:" + (height * 0.5) + "px;";
                //filtersNode.lastChild.style = "max-height:" + (popupBodyHeight * 0.22 - filtersNode.clientHeight) + "px;height:auto;";
            }, 0);
            var btnsArray = popup.querySelectorAll("#popup_body_buttons>button");
            window.cstmDfnFiltersExpandClickEvent = cstmDfnFiltersExpandClickEvent;
            btnsArray[0].onclick = function() {
                var gridIntance = getActiveGridIntance();
                var status = gridIntance.gridNode.parentNode.className.indexOf("add") > -1? "Add": "Other";
                var bomQuantity = [], bomCodeList = [];
                var queryObj = { status: status };
                //for(var i = gridIntance.getLineCount() - 1; i > -1; i--) {
                    var bQ = gridIntance.getFieldValue("cstm_bom_quantity", 0);
                    bQ && bomQuantity.push(bQ);
                    bomCodeList.push(gridIntance.getFieldValue("cstm_bom_code", 0));
                    var bomValue = gridIntance.getFieldValue("cstm_bom_code", 1);
                    if(bomValue && bomValue != gridIntance.getFieldValue("cstm_bom_code", 0)) {
                        bomCodeList.push(bomValue);
                    }
                //}
                if(!bomCodeList[0]) { alert("请至少在物料查询里填一个物料代码！"); }
                queryObj["bomQuantity"] = bomQuantity, queryObj["bomCodeList"] = bomCodeList;
                queryObj["filters"] = filtersExp.filters;
                queryObj["funcName"] = "getBomSearchGridData";
                ajaxPost(url.resolveScript({
                    scriptId: 'customscript_rl_eco_change_notice',
                    deploymentId: 'customdeploy_rl_eco_change_notice'
                }), queryObj, function(result) {
                    if(result.code != 200) {
                        return alert("执行脚本发生异常：" + result.body);
                    }
                    var lineArray = JSON.parse(result.body);
                    if(!lineArray.length) { alert("没有查询到数据！"); }
                    schGrid.setLineArray(lineArray);
                });
                //schGrid.setLineArray(getBomSearchGridData(queryObj));
            }
            btnsArray[1].onclick = function() {
                var gridIntance = getActiveGridIntance();
                var selectLines = schGrid.getSelectLines();

                if(!selectLines.length) { return alert("请至少在BOM查询表格里勾选一条数据！"); }

                var ecoTypeMap = { "Add": 1, "Delete": 3, "From": 2, "To": 2 }, ecoSignalMap = { "Add": 2, "Delete": 1, "From": 3, "To": 4 };
                var ecoMarker = gridIntance.getFieldValue("cstm_bom_single", 0);
                var existLines = [], line, bomCode, itemCode, fromLines = [], toLines = [];
                var status = gridIntance.gridNode.parentNode.className.indexOf("add") > -1? "Add": gridIntance.gridNode.parentNode.className.indexOf("delete")? "Delete": "Modify";
                
                for(var i = 0; i < selectLines.length; i++) {
                    bomCode = schGrid.getFieldValue("cstm_bom_code_name", selectLines[i]);
                    itemCode = gridIntance.getFieldValue("cstm_bom_code", 0);
                    line = findEqualCodeIndex(bomCode, itemCode);
                    if(line != -1) {
                        existLines.push(+selectLines[i] + 1);
                    }
                }
                if(existLines.length) {
                    return alert("添加失败，您勾选的第" + existLines + "行这些条目已经存在于变更明细!");
                }
                for(var i = 0; i < selectLines.length; i++) {
                    if(!gridIntance.getFieldValue("cstm_bom_code", 0)) {
                        return alert("请在物料查询里至少填一个物料代码！");
                    } else if(ecoMarker == "From" && !gridIntance.getFieldValue("cstm_bom_code", 1)) {
                        return alert("请在物料查询修改表格里把To字段填上一个物料代码！");
                    }
                    bomCode = schGrid.getFieldValue("cstm_bom_code_name", selectLines[i]);
                    itemCode = gridIntance.getFieldValue("cstm_bom_code", 0);
                    line = getInsertLine(bomCode, itemCode, ecoMarker == "From");
                    addToChangeDetailSublist({
                        recordischanged: "T",
                        custrecord_eco_type: ecoTypeMap[ecoMarker],
                        custrecord_eco_signal: ecoSignalMap[ecoMarker],
                        custrecord_product_attribute: gridIntance.getFieldValue("cstm_bom_attribute", 0),
                        custrecord_product_attribute_display: gridIntance.getFieldValue("cstm_bom_attribute_display", 0),
                        custrecord_component_quantity: getQuantity(status == "Add"? gridIntance.getFieldValue("cstm_bom_quantity", 0): schGrid.getFieldValue("cstm_bom_quantity", selectLines[i])),
                        custrecord_component_yield: getOutput((status == "Add"? gridIntance.getFieldValue("cstm_bom_output", 0): schGrid.getFieldValue("cstm_bom_output", selectLines[i]))),
                        custrecord_location_code: status == "Add"? gridIntance.getFieldValue("cstm_bom_position", 0): "",
                        custrecord_change_detail_bom_code: bomCode,
                        custrecord_change_detail_bom_code_display: schGrid.getFieldValue("cstm_bom_code_name_display", selectLines[i]),
                        custrecord_bomid: schGrid.getFieldValue("cstm_assembly_name", selectLines[i]),
                        custrecord_bomid_display: schGrid.getFieldValue("cstm_assembly_name_display", selectLines[i]),
                        custrecordbom_name: schGrid.getFieldValue("cstm_ps_item_specification", selectLines[i]),
                        custrecord_former_revision: schGrid.getFieldValue("cstm_revision_name", selectLines[i]),
                        custrecord_subitem_code: itemCode,
                        custrecord_subitem_code_display: gridIntance.getFieldValue("cstm_bom_code_display", 0),
                        custrecord_subitem_name: gridIntance.getFieldValue("cstm_bom_specification", 0),
                        custrecord_eco_line_memo: gridIntance.getFieldValue("cstm_bom_memo", 0)
                    }, line);
                    (status == "Add"? toLines: fromLines).push(line);
                    if(ecoMarker == "From") {
                        addToChangeDetailSublist({
                            recordischanged: "T",
                            custrecord_eco_type: ecoTypeMap[gridIntance.getFieldValue("cstm_bom_single", 1)],
                            custrecord_eco_signal: ecoSignalMap[gridIntance.getFieldValue("cstm_bom_single", 1)],
                            custrecord_product_attribute: gridIntance.getFieldValue("cstm_bom_attribute", 1),
                            custrecord_product_attribute_display: gridIntance.getFieldValue("cstm_bom_attribute_display", 1),
                            custrecord_component_quantity: getQuantity(gridIntance.getFieldValue("cstm_bom_quantity", 1) || gridIntance.getFieldValue("cstm_bom_quantity", 0)),
                            custrecord_component_yield: getOutput(gridIntance.getFieldValue("cstm_bom_output", 1) || gridIntance.getFieldValue("cstm_bom_output", 0)),
                            custrecord_location_code: gridIntance.getFieldValue("cstm_bom_position", 1),
                            custrecord_change_detail_bom_code: bomCode,
                            custrecord_change_detail_bom_code_display: schGrid.getFieldValue("cstm_bom_code_name_display", selectLines[i]),
                            custrecord_bomid: schGrid.getFieldValue("cstm_assembly_name", selectLines[i]),
                            custrecord_bomid_display: schGrid.getFieldValue("cstm_assembly_name_display", selectLines[i]),
                            custrecordbom_name: schGrid.getFieldValue("cstm_ps_item_specification", selectLines[i]),
                            custrecord_former_revision: schGrid.getFieldValue("cstm_revision_name", selectLines[i]),
                            custrecord_subitem_code: gridIntance.getFieldValue("cstm_bom_code", 1),
                            custrecord_subitem_code_display: gridIntance.getFieldValue("cstm_bom_code_display", 1),
                            custrecord_subitem_name: gridIntance.getFieldValue("cstm_bom_specification", 1),
                            custrecord_eco_line_memo: gridIntance.getFieldValue("cstm_bom_memo", 1) || gridIntance.getFieldValue("cstm_bom_memo", 0)
                        }, line + 1);
                        (itemCode == gridIntance.getFieldValue("cstm_bom_code", 1)? fromLines: toLines).push(line + 1);
                    }
                }
                var newLineArray = [];
                var newLineArrayLine = gridIntance.getEmptyLine();
                newLineArrayLine[0] = ecoMarker;
                newLineArray.push(newLineArrayLine);
                if(ecoMarker == "From") {
                    newLineArrayLine = gridIntance.getEmptyLine();
                    newLineArrayLine[0] = "To";
                    newLineArray.push(newLineArrayLine);
                }
                gridIntance.setLineArray(newLineArray);
                updateLineNumber("recmachcustrecord_change_detail_link_field");
                setBomcodeUnits({ sublistId: sublistId, line: fromLines });
                setBomcodeUnits({ sublistId: sublistId, line: toLines });
                message.create({
                    title: "添加成功", 
                    message: "成功添加至变更明细！", 
                    type: message.Type.CONFIRMATION
                }).show({ duration: 3000 });
                document.querySelector("#div__alert").style = "position:absolute;width:100%;z-index:9999;top:0;left:0;";

                function getOutput(value) {
                    if(!value) { return value; }
                    value = parseFloat(value || 0);
                    value = value <= 0? "0.0": value + "";
                    if(value.indexOf('.') == -1) { value += ".0"; }
                    return value + "%";
                }

                function getQuantity(value) {
                    if(!value) { return value; }
                    value = parseFloat(value);
                    return value + "";
                }
            }
            popup.querySelector("#popup_header_btn_close").onclick = function() {
                option.closeClick && option.closeClick(schGrid);
                switchPopup(false);
            }

            popup.querySelector("#ns_popup_search_component_sublist>:first-child").onclick = function(e) {
                var target = e.target || e.srcElement, btnValue = "查询";
                for(var i = 0; i < this.children.length; i++) {
                    var child = this.children[i], content = this.parentNode.querySelector("." + child.id + "_content");
                    child.className = child.className.replace(/\s*formtabon/gmi, "");
                    content.style.display = "none";
                    if(child == target || child == target.parentNode) {
                        child.className += " formtabon";
                        content.style.display = "";
                        if(child.id.indexOf("add") > -1) {
                            btnValue = "新增查询";
                        } else if(child.id.indexOf("delete") > -1) {
                            btnValue = "删除查询";
                        } else {
                            btnValue = "修改查询";
                        }
                        schGrid.clear();
                    }
                }
                btnsArray[0].innerText = btnValue;
            }

            function switchPopup(isOpen) {
                popup.style.display = popup.style.display = isOpen? "": "none";
                maskDiv.style.display = popup.style.display = isOpen? "": "none";
            }

            function addGroup(groupId, groupName) {
                return '<div id="' + groupId + '" class="bgsubtabbar fgroup_title" style="line-height:28px;">\
                <div onclick="cstmDfnFiltersExpandClickEvent(this)" style="display:inline-block;font-size: 16px;margin: 0 5px;\
                cursor: pointer;"><span>-</span></div><div style="display:inline-block;margin-left:5px;"><span>' + groupName + '</span></div></div>';
            }

            function cstmDfnFiltersExpandClickEvent(clickNode) {
                var displayValue = clickNode.parentNode.nextElementSibling.style.display;
                clickNode.parentNode.nextElementSibling.style.display = displayValue? "": "none";
                clickNode.firstChild.innerText = displayValue? "-": "+";
            }

            function searchComponentContent() {
                var checkQtyAndPosNum = function(e) {
                    var target = e.target || e.srcElement;
                    var gridIntance = getActiveGridIntance();
                    var line = target.parentNode.parentNode.getAttribute("row");
                    var type = gridIntance.getFieldValue("cstm_bom_single", line);
                    if(type != "Add" && type != "To") { return; }
                    var bomCode = gridIntance.getFieldValue("cstm_bom_code_display", line);
                    var qty = gridIntance.getFieldValue("cstm_bom_quantity", line);
                    var posNum = gridIntance.getFieldValue("cstm_bom_position", line);
                    if(companyPostionNumber(bomCode, qty, posNum)) {
                        gridIntance.setFieldValue("cstm_bom_position", "", line);
                        gridIntance.refrashGrid();
                        return alert("用量和位号不一致！位号将会被清除！");
                    }
                };
                var gridConfig = {
                    showCheckBox: false,
                    showSerialNumber: false,
                    height: "100px",
                    columns: [
                                { label: "标识", fieldId: "cstm_bom_single" },
                                { label: "物料代码", fieldId: "cstm_bom_code", type: "text", display: "hidden" },
                                { label: "物料代码", fieldId: "cstm_bom_code_display", width: 150, type: "text", editable: true, data: [], onchange: bomCodeChange },
                                { label: "名称", fieldId: "cstm_bom_name", display: "hidden" },
                                { label: "规格", fieldId: "cstm_bom_specification" },
                                { label: "英文规格", fieldId: "cstm_bom_en_specification" },
                                { label: "物料属性", fieldId: "cstm_bom_attribute" },
                                { label: "用量", fieldId: "cstm_bom_quantity", type: "text", editable: true, onchange: checkQtyAndPosNum },
                                { label: "产出率", fieldId: "cstm_bom_output", type: "text", editable: true },
                                { label: "位号", fieldId: "cstm_bom_position", type: "text", editable: true, onchange: checkQtyAndPosNum },
                                { label: "备注", fieldId: "cstm_bom_memo", type: "text", editable: true }
                            ],
                    data: [],
                    style: "width:100%;height:90px;",
                    cellEdit: function(gridMachine, tdNode, column) {
                        var line = tdNode.parentNode.getAttribute("row");
                        var bomSingle = gridMachine.getFieldValue("cstm_bom_single", line);
                        if(bomSingle == "From" || bomSingle == "Delete") {
                            return column.fieldId == "cstm_bom_code_display" || column.fieldId == "cstm_bom_code";
                        }
                        return true;
                    }
                };
                var aGridConfig = deepCopy(gridConfig);
                aGridConfig.data.push(["Add", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
                var aGrid = new myGrid.SearchListGrid(aGridConfig);
                var dGridConfig = deepCopy(gridConfig);
                dGridConfig.data.push(["Delete", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
                var dGrid = new myGrid.SearchListGrid(deepCopy(dGridConfig));
                var mConfige = deepCopy(gridConfig);
                mConfige.data = [];
                mConfige.data.push(["From", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["To", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
                var mGrid = new myGrid.SearchListGrid(mConfige);
                return {
                    innerHTML: "<div id='ns_popup_search_component_sublist'><div class='bgtabbar'>\
                    <div id='ns_poup_add_component' class='formtaboff formtabon'><a href='#' class='formtabtext formtabtextoff'>新增</a></div>\
                    <div id='ns_poup_delete_component' class='formtaboff'><a href='#' class='formtabtext formtabtextoff'>删除</a></div>\
                    <div id='ns_poup_modify_component' class='formtaboff'><a href='#' class='formtabtext formtabtextoff'>修改</a></div>\</div>\
                    <div>\
                    <div class='ns_poup_add_component_content'>" + aGrid.create().outerHTML + "</div>\
                    <div class='ns_poup_delete_component_content' style='display:none;'>" + dGrid.create().outerHTML + "</div>\
                    <div class='ns_poup_modify_component_content' style='display:none;'>" + mGrid.create().outerHTML + "</div>\
                    </div>",
                    aGrid: aGrid,
                    dGrid: dGrid,
                    mGrid: mGrid
                };

                function bomCodeChange(e) {
                    var gridIntance = getActiveGridIntance();
                    var target = e.target || e.srcElement;
                    var value = target.value.trim(), row = target.parentNode.getAttribute("row");
                    var status = gridIntance.getFieldValue("cstm_bom_single", row);
                    getBomCodeData(value, function(bomCodeDatas) {
                        for(var i = bomCodeDatas.length - 1; i > -1 && bomCodeDatas[i].text != value; i--);
                        if(i > -1) {
                            var fieldIds = ["cstm_bom_name", "cstm_bom_specification", "cstm_bom_en_specification", 
                            "cstm_bom_attribute", "cstm_bom_attribute_display", "cstm_bom_quantity", "cstm_bom_output", "cstm_bom_position"];
                            gridIntance.setFieldValue("cstm_bom_code", bomCodeDatas[i].value, row);
                            gridIntance.setFieldValue("cstm_bom_code_display", bomCodeDatas[i].text, row);
                            if(bomCodeDatas[i]["isinactive"]) {
                                gridIntance.setFieldValue("cstm_bom_code", "", row);
                                gridIntance.setFieldValue("cstm_bom_code_display", "", row);
                                gridIntance.refrashGrid();
                                return alert("添加失败！原因是：该物料已被禁用！");
                            }
                            for(var index in fieldIds) {
                                if(fieldIds[index] == "cstm_bom_output") {
                                    if(status != "Add" && status != "To") {
                                        bomCodeDatas[i][fieldIds[index]] = "";
                                    }else if(status == "To" && !bomCodeDatas[i][fieldIds[index]] && gridIntance.getFieldValue("cstm_bom_code", 0) == gridIntance.getFieldValue("cstm_bom_code", 1)) {
                                        bomCodeDatas[i][fieldIds[index]] = gridIntance.getFieldValue("cstm_bom_output", 0);
                                    }
                                }
                                gridIntance.setFieldValue(fieldIds[index], bomCodeDatas[i][fieldIds[index]], row) || "";
                            }
                            gridIntance.refrashGrid();
                            schGrid.clear();
                        }
                    });
                    checkQtyAndPosNum(e);
                }
            }

            function getActiveGridIntance() {
                var activeTabe = document.querySelector("#ns_popup_search_component_sublist .formtabon");
                if(activeTabe) {
                    activeTabe = document.querySelector("." + activeTabe.id + "_content").lastElementChild;
                    return activeTabe.machine;
                }
                return ;
            }

            function getInsertLine(bomCode, itemCode, isFrom) {
                var machine = getSublistMachine(sublistId);
                var line = findEqualCodeIndex(bomCode, itemCode);
                NS.form.setInited(true);
                if(line == -1) {
                    line = currentRecord.getLineCount({ sublistId: sublistId });
                    machine.addline();
                    if(isFrom) { machine.addline(); }
                }
                return line;
            }

            function addToChangeDetailSublist(detailObj, line) {
                for(var fieldId in detailObj) {
                    try{
                        setFieldValue(fieldId, detailObj[fieldId], "recmachcustrecord_change_detail_link_field", line, true);
                    } catch(e) {}
                }
            }

            return {
                popupNode: popup,
                switchPopup: switchPopup
            };
        }

        function companyPostionNumber(itemValue, bomquantityValue, value) {
            if(!itemValue) { return; }
            bomquantityValue = bomquantityValue || 0;
            value = value || "";
            itemValue = itemValue.split('.');
            itemValue = itemValue[0] + "." + itemValue[1];
            if(value === "" || (itemValue.length != 5 || (itemValue < "1.001" || itemValue > "1.099"))) { return false; }
            //item是1.001到1.099的范围内才要做Bom数量和位号数量校验。
            value = value.split(/[,，，]/gmi);
            for(var newValue = [], i = 0; i < value.length; i++) {
                (value[i] || value[i] === 0) && newValue.push(value[i]);
            }
            newValue = newValue.sort(function(num1, num2) {
                return num1 > num2? 1: num1 == num2? 0: -1;
            });
            return bomquantityValue != newValue.length
        }

        function getBomCodeData(bomNameList, callBack) {
            ajaxPost(url.resolveScript({
                scriptId: 'customscript_rl_eco_change_notice',
                deploymentId: 'customdeploy_rl_eco_change_notice'
            }), {
                funcName: "getComponentList",
                bomNameList: bomNameList
            }, function(result) {
                if(result.code != 200) {
                    return alert("执行脚本发生异常：" + result.body);
                }
                callBack && callBack(JSON.parse(result.body));
            });
        }

        function findEqualCodeIndex(bomCodeValue, assemblycodeValue, currLine) {
            if(!assemblycodeValue || !bomCodeValue) { return -1; }
            var lineCount = currentRecord.getLineCount({ sublistId: sublistId });
            var i = lineCount;
            while(--i > -1) {
                var value = getFieldValue("custrecord_change_detail_bom_code", sublistId, i);
                var ecoSignal = getFieldValue("custrecord_eco_signal", sublistId, i);
                if(value == bomCodeValue && (ecoSignal == "4" && i - 1 != currLine)) {
                    value = getFieldValue("custrecord_subitem_code", sublistId, i);
                    if(value == assemblycodeValue && i != currLine) { return i; }
                }
            }
            return i;
        }

        function updateLineNumber(sublistId) {
            var machine = getSublistMachine(sublistId);
            for(var i = 0, lineArray = machine.getLineArray(); i < lineArray.length; i++) {
                lineArray[i][4] = i + 1;
            }
            machine.buildtable();
            ischanged = true;
        }
        
        function ecoNumberAutoGenerate(scriptContext) {
            var companyNum = "IX", currentData = new Date();
            var month = currentData.getMonth() + 1;
            var ecoNumValue = companyNum + "-" + "ECN" + currentData.getFullYear() + (month < 10? "0" + month: month);
            search.create.promise({
                type: currentRecord.type,
                columns: ["custrecord_eco_number"],
                filters: [{
                    name: 'custrecord_eco_number',
                    operator: search.Operator.CONTAINS,
                    values: ecoNumValue
                }]
            }).then(function(result) {
                var serialNumn = 1;
                result.run().each(function(item) {
                    var itemSerialNum = item.getAllValues()["custrecord_eco_number"] || "0001";
                    itemSerialNum = parseInt(itemSerialNum.slice(-3));
                    serialNumn = serialNumn < itemSerialNum? itemSerialNum: serialNumn;
                    return true;
                });
                serialNumn++;
                ecoNumValue += ((serialNumn < 10? "00": serialNumn < 100? "0": "") + serialNumn);
                currentRecord.setValue({
                    fieldId: 'custrecord_eco_number',
                    value: ecoNumValue,
                    ignoreFieldChange: true
                });
            });
        }

        function getFieldValue(fieldId, sublistId, line) {
            var value = "";
            if(sublistId !== undefined) {
                var currSelectLine = currentRecord.getCurrentSublistIndex({ sublistId: sublistId });
                if(line === undefined || currSelectLine == line) {
                    value = currentRecord.getCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: fieldId
                    });
                } else {
                    var machine = getSublistMachine(sublistId);
                    //var fieldIdIndex = machine.getFieldIdxMap()[fieldId];
                    value = machine.getLineFieldValue(machine.getLineArrayLine(line), fieldId);
                }
            } else {
                value = currentRecord.getValue({ fieldId: fieldId });
            }
            return value;
        }

        function setFieldValue(fieldId, value, sublistId, line, ignoreFieldChange) {
            if(typeof fieldId == "object") {
                for(var name in fieldId) {
                    setFieldValue(fieldId[name], value, sublistId, line, ignoreFieldChange);
                }
            }
            if(typeof sublistId == "boolean") {
                ignoreFieldChange = sublistId;
                sublistId = undefined;
            } else if(typeof line == "boolean") {
                ignoreFieldChange = line;
                line = undefined;
            }
            if(sublistId === undefined) {
                currentRecord.setValue({
                    fieldId: fieldId,
                    value: value,
                    ignoreFieldChange: ignoreFieldChange
                });
            } else {
                var currSelectLine = currentRecord.getCurrentSublistIndex({ sublistId: sublistId });
                if(line === undefined || line == currSelectLine) {
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: fieldId,
                        value: value,
                        ignoreFieldChange: ignoreFieldChange
                    });
                } else {
                    var machine = getSublistMachine(sublistId);
                    machine.setFieldValue(line + 1, fieldId, value);
                }
            }
        }

        function getSublistMachine(sublistId) {
            return Ext.get(sublistId + "_splits").dom.machine;
        }

        function ajaxPost(url, params, callBack) {
            https.post.promise({
                url: url,
                header: {
                    'Content-Type': 'application/json'
                },
                body: params
            }).then(function (result) {
                callBack && callBack(result);
            });
        }

        function deepCopy(p, c) {
        　　var c = c || {};
        　　for (var i in p) {
        　　　　if (typeof p[i] === 'object') {
        　　　　　　c[i] = Array.isArray(p[i]) ? [] : {};
        　　　　　　deepCopy(p[i], c[i]);
        　　　　} else {
        　　　　　　　c[i] = p[i];
        　　　　}
        　　}
        　　return c;
        }
        
        function FilterExpression(paramFilters) {
            var _FilterExpObj = {}, _FilterExpFunc = function() {}, filters = {}, fields = getFieldsInfo(paramFilters);
            _FilterExpObj.create = function () {
                var expContains = document.createElement("div"),
                    expContainsWrapper = expContains.cloneNode(true);
                expContains.id = "ns_filters_expression_contains";
                expContainsWrapper.id = "ns_filters_expression_wrapper";
                expContains.appendChild(expContainsWrapper);
                expContainsWrapper.appendChild(createFiedsSelectNode(fields));
                return expContains;
            };
            
            _FilterExpObj.setFilters = function(filters) {
                if(!Array.isArray(filters)) { return; }
                for(var i = 0; i < filters.length; i++) {
                    var selNode = document.querySelector("#cstm_schdfn_select_fields select");
                    var specialId = getSpecialFieldId(filters[i]);
                    if(fields[specialId] == undefined) { continue; }
                    selNode.value = specialId;
                    cstmDfnSelectFieldChangeEvent(selNode, filters[i].operator, filters[i].values);
                }
            };
            Object.defineProperty(_FilterExpObj, "filters", {
                get: function() {
                    var _NsFilter = [], _NsFilters = {};
                    for(var index in filters) {
                        var filter = filters[index];
                        if(filter.searchType) {
                            var copyFilter = {};
                            for(var attrName in filter) {
                                copyFilter[attrName] = filter[attrName];
                            }
                            _NsFilters[copyFilter.searchType] = _NsFilters[copyFilter.searchType] || [];
                            _NsFilters[copyFilter.searchType].push(copyFilter);
                            delete copyFilter.searchType;
                        } else { 
                            _NsFilter.push(filter);
                        }
                    }
                    return _NsFilter.length? _NsFilter: _NsFilters;
                },
                set: function(value) {
                    if(typeof value !== "object") { return; }
                    for(var index in value) {
                        var item = value[index];
                        if((item.name == undefined || item.name == "") || !item.operator || (item.values == undefined || item.values == "")) { continue; }
                        filters[item.name] = item;
                    }
                }
            });
            Object.defineProperty(_FilterExpObj, "fields", {
                get: function() {
                    var _NsFields = [];
                    for(var index in fields) {
                        _NsFields.push(fields[index]);
                    }
                    return _NsFields;
                },
                set: function(value) {
                    if(typeof value !== "object") { return; }
                    for(var index in value) {
                        var item = value[index];
                        if((item.name == undefined || item.name == "") || (item.type == undefined || item.type == "")) { continue; }
                        fields[item.name] = item;
                    }
                }
            });
            
            setTimeout(function() {
                FilterExpression.prototype.searchOperators = searchOperators;
                FilterExpression.prototype.isValidLine = isValidLine;
            }, 0);
            insertStyles();
            window.cstmDfnSelectFieldChangeEvent = cstmDfnSelectFieldChangeEvent;
            window.cstmDfnSelectOperatorNameEvent = cstmDfnSelectOperatorNameEvent;
            window.cstmDfnInputFilterValuesEvent = cstmDfnInputFilterValuesEvent;
            _FilterExpObj.filters = filters;
            return _FilterExpObj;

            function searchOperators (type) {
                var STR1 = ",list,record", STR2 = ",currency,decimalnumber,timeofday,float", STR3 = ",date", STR4 = ",checkbox", STR5 = ",document,image", 
                    STR6 = ",emailaddress,free-formtext,longtext,password,percent,phonenumber,richtext,textarea,text", STR7 = ",multiselect,select";
                var schOps = {
                    startswith: STR6,
                    anyof: STR1 + STR5 + STR7,
                    between: STR2,
                    contains: STR6,
                    any: STR2 + STR6,
                    after: STR3,
                    allof: STR7,
                    before: STR3,
                    doesnotcontain: STR6,
                    doesnotstartwith: STR6,
                    equalto: STR2 + STR4 + STR6,
                    greaterthan: STR2,
                    greaterthanorequalto: STR2,
                    haskeywords: STR6,
                    is: STR4 + STR6,
                    isempty: STR2 + STR3 + STR6,
                    isnot: STR6,
                    isnotempty: STR2 + STR3 + STR6,
                    lessthan: STR2,
                    lessthanorequalto: STR2,
                    noneof: STR1 + STR5 + STR7,
                    notafter: STR3,
                    notallof: STR7,
                    notbefore: STR3,
                    notbetween: STR2,
                    notequalto: STR2,
                    notgreaterthan: STR2,
                    notgreaterthanorequalto: STR2,
                    notlessthan: STR2,
                    notlessthanorequalto: STR2,
                    noton: STR3,
                    notonorafter: STR3,
                    notonorbefore: STR3,
                    notwithin: STR3,
                    on: STR3,
                    onorafter: STR3,
                    onorbefore: STR3,
                    within: STR3
                };
                if(type) {
                    type = type.toLowerCase();
                    if(schOps[type]) {
                        schOps = schOps[type];
                    } else {
                        var _schOps = [];
                        for(var opName in schOps) {
                            schOps[opName].indexOf("," + type) > -1 && _schOps.push(opName);
                        }
                        schOps = _schOps;
                    }
                }
                return schOps;
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

            function transcationOpertor(opName) {
                return ({
                    after: "值之后",
                    allof: "包含每项值",
                    any: "任意值",
                    anyof: "值等于某项",
                    before: "值之前",
                    between: "在两个值之间",
                    contains: "包含值",
                    doesnotcontain: "不包含",
                    doesnotstartwith: "不与值开头",
                    equalto: "相等",
                    greaterthan: "大于",
                    greaterthanorequalto: "大于等于",
                    haskeywords: "是否有值",
                    is: "等于",
                    isempty: "空值",
                    isnot: "不是该值",
                    isnotempty: "非空",
                    lessthan: "小于",
                    lessthanorequalto: "小于或等于",
                    noneof: "不包含所有值",
                    notafter: "值之前",
                    notallof: "不包含每项值",
                    notbefore: "值之后",
                    notbetween: "不在两值之间",
                    notequalto: "不等于",
                    notgreaterthan: "不大于",
                    notgreaterthanorequalto: "不大于等于",
                    notlessthan: "不小于",
                    notlessthanorequalto: "不小于等于",
                    noton: "不在值中间",
                    notonorafter: "值开头",
                    notonorbefore: "值在结尾",
                    notwithin: "不在两者之间",
                    on: "值在中间",
                    onorafter: "值不在开头",
                    onorbefore: "值不在结尾",
                    startswith: "值开头",
                    within: "在两值之间"
                })[opName] || opName;
            }

            function createFiedsSelectNode(fieldsInfo) {
                var node = "<div><div><span>请选择字段</span></div><div><select onchange='cstmDfnSelectFieldChangeEvent(this)'>";
                var tmpDiv = document.createElement("div");
                tmpDiv.id = "cstm_schdfn_select_fields";
                for(var value in fieldsInfo) {
                    var item = fieldsInfo[value];
                    node += "<option value='" + value + "' text='" + item.name + "'>" + item.name + "</option>";
                }
                node += "</select></div></div>";
                tmpDiv.innerHTML = node;
                return tmpDiv;
            }

            function cstmDfnSelectFieldChangeEvent(selectNode, opValue, values) {
                var value = selectNode.value,
                    fieldInfo = fields[value],
                    opNames = fieldInfo && searchOperators(fieldInfo.type),
                    tmpDivHtml = "",
                    selGradeParentNode = selectNode.parentNode.parentNode.parentNode,
                    tmpDiv0 = document.createElement("div"),
                    tmpDiv = document.createElement("div"),
                    searchType = fieldInfo && fieldInfo.searchType,
                    oldvalue = selectNode.getAttribute("oldValue");

                if(value == "" || oldvalue != value) {
                    if(value == "") {
                        removeFilter(oldvalue);
                        selGradeParentNode.parentNode.lastChild.remove();
                        selGradeParentNode.parentNode.appendChild(createFiedsSelectNode(fields));
                        return selGradeParentNode.remove();
                    } else {
                        var existItem = document.querySelector("div[id='cstm_schdfn_select_fields_" + value + "']");
                        if(existItem) {
                            selectNode.value = oldvalue;
                            var existItemSelectNode = existItem.firstChild.querySelector("select");
                            return existItemSelectNode.focus();
                        } else {
                            removeFilter(oldvalue);
                        }
                    }
                }
                
                filters[value] = { name: fieldInfo.fieldId, join: fieldInfo.join, values: [], searchType: searchType };
                selGradeParentNode.querySelector("span").innerHTML = fieldInfo.name;
                tmpDivHtml = "<div><span>操作符</span></div><div><select onchange='cstmDfnSelectOperatorNameEvent(this)'>";
                for(var opName in opNames) {
                    var chineseOpName = transcationOpertor(opNames[opName]);
                    tmpDivHtml += "<option value='" + opNames[opName] + "' text='" + chineseOpName + "'>" + chineseOpName + "</option>"
                }
                tmpDivHtml += "</select></div>";
                tmpDiv.innerHTML = tmpDivHtml;
                tmpDiv0.appendChild(selGradeParentNode.firstChild.firstChild);
                tmpDiv0.appendChild(selGradeParentNode.firstChild.firstChild);
                selGradeParentNode.id = "cstm_schdfn_select_fields_" + getSpecialFieldId(fieldInfo);
                selGradeParentNode.innerHTML = "";
                selGradeParentNode.appendChild(tmpDiv0);
                selGradeParentNode.appendChild(tmpDiv);
                if(selGradeParentNode.parentNode.lastChild.id == "cstm_schdfn_select_fields") {
                    selGradeParentNode.parentNode.lastChild.remove();
                }
                selGradeParentNode.parentNode.appendChild(createFiedsSelectNode(fields));
                selectNode.setAttribute("oldvalue", value);
                var opNode = tmpDiv.querySelector("select");
                opValue && (opNode.value = opValue);
                cstmDfnSelectOperatorNameEvent(opNode, values);
            }

            function cstmDfnSelectOperatorNameEvent(selectNode, values) {
                var value = findFiltersValue(selectNode),
                    selGradeParentNode = selectNode.parentNode.parentNode.parentNode,
                    tmpDiv = document.createElement("div");
                filters[value].operator = selectNode.value;
                values = Array.isArray(values)? values: [];
                if(/(after)|(before)|(between)|(within)/gmi.test(selectNode.value)) {
                    tmpDiv.className = "cstm_schdfn_select_op_values";
                    tmpDiv.innerHTML = "<div><div><span>从</span></div><div>" + createHtmlControlByFieldType(fields[value], values[0]) + "\
                    </div></div><div><div><span>至</span></div><div>" + createHtmlControlByFieldType(fields[value], values[1]) + "</div></div>";
                } else {
                    tmpDiv.innerHTML = "<div><div><span>值</span></div><div>" + createHtmlControlByFieldType(fields[value], values.join(';')) + "</div></div>";
                }
                if(selGradeParentNode.childNodes.length > 2) {
                    selGradeParentNode.lastChild.remove();
                }
                selGradeParentNode.appendChild(tmpDiv);
            }

            function cstmDfnInputFilterValuesEvent(inputNode, controlType) {
                var filterInfo = filters[findFiltersValue(inputNode)],
                    selGradeParentNode = inputNode.parentNode.parentNode.parentNode,
                    inputNodes = selGradeParentNode.querySelectorAll("input,select,textarea") || [];
                filterInfo.values = [];
                for(var index = 0; index < inputNodes.length; index++) {
                    var node = inputNodes[index],
                        validValues = [];
                        values = (node.value || "").split(/[,;|]/) || [];
                    for(var i = 0; i < values.length; i++) {
                        var tmpValue = "";
                        if(values[i] == "") { continue; }
                        try {
                            switch(controlType) {
                                case "decimalnumber":
                                case "float":
                                    tmpValue = parseFloat(values[i]);
                                    if(isNaN(tmpValue)) { throw "Error"; }
                                    break;
                                case "percent":
                                    tmpValue = parseFloat(values[i]);
                                    if(isNaN(tmpValue)) { throw "Error"; }
                                    if(/%/g.test(values[i])) { tmpValue += "%"; }
                                    else if(-1 <= values[i] && values[i] <= 1) { tmpValue = (tmpValue * 100) + "%"; }
                                    else { tmpValue = (tmpValue * 100) + "%"; }
                                    break;
                                case "emailaddress":
                                    tmpValue = /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.exec(values[i]);
                                    if(!tmpValue) { throw "Error"; }
                                    tmpValue = tmpValue[tmpValue.index];
                                    break;
                                case "phonenumber":
                                    tmpValue = /^(\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,14}$/.exec(values[i]);
                                    if(!tmpValue) { throw "Error"; }
                                    tmpValue = tmpValue[tmpValue.index];
                                    break;
                                default:
                                    tmpValue = values[i];
                            }
                            validValues.push(tmpValue + "");
                        } catch(e) {
                            node.focus();
                            alert("Invalid " + controlType + " format " + values[i]);
                        }
                    }
                    if(validValues.length) {
                        node.value = validValues + "";
                        filterInfo.values = filterInfo.values.concat(validValues);
                    } else {
                        node.value = "";
                        node.focus();
                    }
                }
            }

            function createHtmlControlByFieldType(filterInfo, value) {
                var typeControl = "";
                var type = filterInfo.type;
                value = value == undefined? "": value;
                switch(type) {
                    case "decimalnumber":
                    case "free-formtext":
                    case "percent":
                    case "password":
                    case "emailaddress":
                    case "phonenumber":
                    case "currency":
                    case "checkbox":
                    case "text":
                    case "float":
                    case "select":
                        var inptType = { "password": "password", "checkbox": "checkbox", "image": "file" };
                        typeControl = "<input type=" + (inptType[type] || "text") + " value='" + value +"' onchange='cstmDfnInputFilterValuesEvent(this, \"" + type + "\")' />";
                        break;
                    case "longtext":
                    case "textarea":
                        typeControl = "<textarea value='" + value + "' onchange='cstmDfnInputFilterValuesEvent(this, \"" + type + "\")'></textarea>";
                        break;
                    case "multiselect":
                        typeControl = "<select onchange='cstmDfnInputFilterValuesEvent(this, \"" + type + "\")'><option value=' '> </option></select>";
                        break;
                    case "date":
                        "<input type=" + (inptType[type] || "text") + " value='" + value + "' onchange='cstmDfnInputFilterValuesEvent(this, \"" + type + "\")' />"
                        break;
                    case "timeofday":
                        break;
                    case "image":
                        typeControl = "<img src='' alert='Loading.....' />";
                        break;
                }
                return typeControl;
            }

            function removeFilter(value) {
                if(!value || !filters[value]) { return; }
                delete filters[value];
            }

            function findFiltersValue(node) {
                var value = "", id = "";
                while(node) {
                    id = node.id || "";
                    if(id.indexOf("cstm_schdfn_select_fields_") == 0) {
                        value = node.firstChild.querySelector("select").value;
                        break;
                    }
                    node = node.parentNode;
                }
                return value;
            }
            
            function insertStyles() {
                var styleNode = document.querySelector("#cstm_filter_expression_styles") || document.createElement("style");
                styleNode.id = "cstm_filter_expression_styles";
                styleNode.innerHTML += "#ns_filters_expression_contains{\
                    font-size:13px;\
                    overflow:hidden;\
                }\
                #ns_filters_expression_wrapper{\
                    overflow:auto;\
                }\
                #ns_filters_expression_wrapper>div{\
                    overflow: hidden;\
                    float:left;\
                    width:50%;\
                }\
                #ns_filters_expression_wrapper>div>div{\
                    float: left;\
                    margin-left: 10px;\
                    padding: 1px 0px;\
                }\
                #ns_filters_expression_wrapper>div>:first-child{\
                    margin-left: 0px;\
                }\
                .cstm_schdfn_select_op_values{\
                    overflow: hidden;\
                }\
                .cstm_schdfn_select_op_values>div{\
                    float: left;\
                }\
                .cstm_schdfn_select_op_values>div:not(:first-child){\
                    margin-left: 10px;\
                }\
                #ns_filters_expression_wrapper>div>:first-child select,#ns_filters_expression_wrapper>div>:last-child select{\
                    width: 130px;\
                    font-weight: normal;\
                    font-size: 12px;\
                    background-color: rgb(255, 255, 255);\
                    color: #262626;\
                    border: 1px solid #cccccc !important;\
                    padding: 3px;\
                    height: 25px;\
                }\
                #ns_filters_expression_wrapper>div>:first-child+div select{\
                    width: 80px;\
                    font-weight: normal;\
                    font-size: 12px;\
                    background-color: rgb(255, 255, 255);\
                    color: #262626;\
                    border: 1px solid #cccccc !important;\
                    padding: 3px;\
                    height: 25px;\
                }\
                #ns_filters_expression_wrapper input{\
                    height: 25px;\
                    width: 120px;\
                }\
                #ns_filters_expression_wrapper select>option{\
                    font-weight: normal;\
                    font-size: 13px;\
                    background-color: rgb(255, 255, 255);\
                }\
                #ns_filters_expression_topmenu {\
                    height: 30px;\
                    line-height: 30px;\
                    overflow: hidden;\
                }\
                #ns_filters_expression_topmenu>div {\
                    float: left;\
                    height: 100%;\
                }\
                #ns_filters_expression_topmenu>:first-child{\
                    width: 15px;\
                    height: 15px;\
                    border: 1px solid black;\
                    line-height: 10px;\
                    text-align: center;\
                    margin-top: 7px;\
                    margin-left: 5px;\
                    cursor: pointer;\
                }\
                #ns_filters_expression_wrapper span{\
                    font-size: 14px;\
                    font-weight: normal !important;\
                    color: #6f6f6f !important;\
                    text-transform: uppercase;\
                }";
                document.body.appendChild(styleNode);
            }
            
            function getFieldsInfo(filters) {
                var fields = {};
                for(var index in filters) {
                    var info = filters[index];
                    if(!info.label) { continue; }
                    fields[getSpecialFieldId(info)] = {
                        name: info.label,
                        fieldId: info.fieldId,
                        type: info.type,
                        join: info.join,
                        searchType: info.searchType || "sublist_field_search_type"
                    };
                }
                return fields;
            }

            function getSpecialFieldId(fieldInfo) {
                return (fieldInfo.searchType? fieldInfo.searchType + "-": "") + (fieldInfo.join? fieldInfo.join + "-": "") + (fieldInfo.fieldId || "");
            }
        }
    }
);
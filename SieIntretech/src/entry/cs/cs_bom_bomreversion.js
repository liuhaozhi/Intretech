/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/ui/message', 'N/ui/dialog'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function(record, search, message, dialog) {
        var currentRecord;
        var sublistId = "component";
        try{
            initComponentSublistLineItems();
        } catch(e) {}
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
            currentRecord = scriptContext.currentRecord;
            initSublist();
            setPermission();
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
            if(!scriptContext.sublistId || !scriptContext.fieldId){
                return true;
            }
            var currentRecord = scriptContext.currentRecord;
            var value = getFieldValue(scriptContext.fieldId, scriptContext.sublistId);
            if(scriptContext.fieldId == "item"){
                var isFieldValueExist = !value && value != 0? false: currentRecord.findSublistLineWithValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: scriptContext.fieldId,
                    value: value
                }) > -1;
                if(isFieldValueExist) {
                    alert("添加失败，该物料已存在！\nAdd unsuccessfully, the itemid already exists.");
                    setTimeout(function() {
                        currentRecord.cancelLine({ sublistId: scriptContext.sublistId });
                    }, 0);
                    return true;
                }
                var line = scriptContext.line, needUpdateLineNumber = false;
                var serialNumValue = getFieldValue("custrecord_serial_number", scriptContext.sublistId, ++line) || "0";
                while(!isNaN(+value) && serialNumValue.indexOf("-Sub") > -1) {
                    setFieldValue("custrecord_serial_number", 0, scriptContext.sublistId, line++, true);
                    serialNumValue = getFieldValue("custrecord_serial_number", scriptContext.sublistId, line);
                    needUpdateLineNumber = true;
                }
                if(needUpdateLineNumber) {
                    //updateLineNumber(scriptContext.sublistId, "custrecord_serial_number");
                }
            } else if(scriptContext.fieldId == "custrecord_main_ingredient_code"){
                var line = currentRecord.findSublistLineWithValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: "item",
                    value: value
                });
                var isFieldValueExist = !value && value != 0? false: line > -1;
                if(scriptContext.line == line){
                    isFieldValueExist = false;
                    setFieldValue(scriptContext.fieldId, "", scriptContext.sublistId, true);
                    alert("自身的主料编码不能和货品编码相同！");
                    return true;
                }
                var lineNum = getFieldValue("custrecord_serial_number", scriptContext.sublistId, line);
                setFieldValue("bomquantity", Number(!isFieldValueExist), scriptContext.sublistId);
                setFieldValue("custrecord_serial_number", lineNum? lineNum + "-Sub": "", scriptContext.sublistId, true);
            }/*  else if(scriptContext.fieldId == "bomquantity") {
                var line = currentRecord.findSublistLineWithValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: "item",
                    value: getFieldValue("custrecord_main_ingredient_code", "component")
                });
                if(line > -1 && value !== 0) {
                    setFieldValue(scriptContext.fieldId, 0, scriptContext.sublistId, true);
                    alert("该组件作为替代料时BOM数量只能为0！");
                } else if(line == -1 && value === 0) {
                    setFieldValue(scriptContext.fieldId, 1, scriptContext.sublistId, true);
                    alert("该组件作为主料时BOM数量不能为0！");
                }
            } */
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
            var currentRecord = scriptContext.currentRecord;
            if(scriptContext.fieldId == "item"){
                var value = currentRecord.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: scriptContext.fieldId
                });
                if(value) {
                    var objRecord = search.lookupFields({
                        type: 'item',
                        id: value,
                        columns: ['custitem_output_rate']
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'componentyield',
                        line: scriptContext.line,
                        value: objRecord.custitem_output_rate.replace(/%/g, '')
                    });
                    /*currentRecord.commitLine({
                        sublistId: scriptContext.sublistId
                    });*/
                }
            } else if(scriptContext.fieldId == "custrecord_version_location_number" || scriptContext.fieldId == "bomquantity") {
                checkBomNumberAndPostionNumber(scriptContext.currentRecord);
            }
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
            return checkBomNumberAndPostionNumber(scriptContext.currentRecord);
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
        var isMachineDelete = false;
        function validateDelete(scriptContext) {
            if(getFieldValue("custrecord_ps_bom_approvestatus2") == "2" || isMachineDelete) { return true; }
            //审批日期字段custrecord_approve_time
            //创建日期字段custrecord_create_time
            var currentRecord = scriptContext.currentRecord;
            var approveTime = currentRecord.getValue({
                sublistId: scriptContext.sublistId,
                fieldId: "custrecord_approve_time"
            });
            var lineCreateTime = currentRecord.getCurrentSublistValue({
                sublistId: scriptContext.sublistId,
                fieldId: "custrecord_create_time"
            });
            var oldApproveTime = approveTime;
            approveTime = new Date(approveTime || Date.now()), lineCreateTime = new Date(lineCreateTime || Date.now());
            if(approveTime > lineCreateTime && oldApproveTime) {
                return alert("删除失败！该行的创建日期应该在审批日期之后才能删除！");
            }
            var line  = currentRecord.getCurrentSublistIndex({
                sublistId: scriptContext.sublistId
            });
            var mainCode = getFieldValue("custrecord_main_ingredient_code", scriptContext.sublistId, line);
            if(mainCode) {
                /* currentRecord.removeLine({
                    sublistId: scriptContext.sublistId,
                    line: line,
                    ignoreRecalc: true
                });
                while(true) {
                    var subSerialNum = getFieldValue("custrecord_serial_number", scriptContext.sublistId, line);
                    if(!/Sub/gmi.test(subSerialNum)) { break; }
                    currentRecord.removeLine({
                        sublistId: scriptContext.sublistId,
                        line: line,
                        ignoreRecalc: true
                    });
                } */
            } else if(getFieldValue("item", scriptContext.sublistId, line)) {
                return alert("主料不能被删除，只能通过ECO进行删除！");
            }
            setTimeout(function() {
                updateLineNumber(scriptContext.sublistId, "custrecord_serial_number", true);
            }, 0);
            return true;
        }

        function checkBomNumberAndPostionNumber(currentRecord) {
            var value = currentRecord.getCurrentSublistValue({ sublistId: "component", fieldId: "custrecord_version_location_number" });
            var bomquantityValue = getFieldValue("bomquantity", "component") || 0;
            var itemValue = currentRecord.getCurrentSublistText({ sublistId: "component", fieldId: "item" }).split('.');
            itemValue = itemValue[0] + "." + itemValue[1];
            debugger;
            if(value === "" || (itemValue.length != 5 || (itemValue < "1.001" || itemValue > "1.099"))) { return true; }
            //item是1.001到1.099的范围内才要做Bom数量和位号数量校验。
            value = value.split(/[,，，]/gmi);
            for(var newValue = [], i = 0; i < value.length; i++) {
                (value[i] || value[i] === 0) && newValue.push(value[i]);
            }
            newValue = newValue.sort(function(num1, num2) {
                return num1 > num2? 1: num1 == num2? 0: -1;
            });
            currentRecord.setCurrentSublistValue({
                sublistId: "component",
                fieldId: "custrecord_version_location_number",
                value: newValue + "",
                ignoreFieldChange: true
            });
            if(bomquantityValue != newValue.length) {
                return alert("Bom数量与位号的数量不一致！");
            }
            return true;
        }

        function initSublist() {
            var allCount = currentRecord.getLineCount({ sublistId: sublistId }), hasAdjust = false;
            var machine = getSublistMachine(sublistId), lineArray = machine.getLineArray();
            var itemMapIdx = machine.getFieldPosition("item"), gredientIdx = machine.getFieldPosition("custrecord_main_ingredient_code");
            var lineNumIdx = machine.getFieldPosition("custrecord_serial_number");
            for(var line = allCount - 1; line > -1; line--) {
                lineArray[line] = machine.getLineArrayLine(line);
            }
            debugger
            for(var line = 0; line < allCount; line++) {
                var index = findItemIndex(lineArray[line][gredientIdx]);
                lineArray[line][lineNumIdx] = "1";
                if(index == -1 || index == line) { continue; }
                lineArray[line][lineNumIdx] = "-Sub";
                if(line - 1 > 0 && lineArray[line - 1][gredientIdx] == lineArray[line][gredientIdx] || index + 1 == line) { continue; }
                lineArray.splice(index + 1, 0, lineArray[line].slice(0));
                lineArray.splice(line + Number(index < line), 1);
                index > line && line--;
                hasAdjust = true;
            }
            if(hasAdjust) {
                machine.setLineArray(lineArray);
            }
            updateLineNumber(sublistId, "custrecord_serial_number", true);

            function findItemIndex(itemValue) {
                for(var line = allCount - 1; line > -1 && lineArray[line][itemMapIdx] != itemValue; line--) ;
                return line;
            }
        }

        function getPermission() {
            var context = nlapiGetContext();
            var roleSch = {
                type: search.Type.ROLE,
                columns: ["custrecorditemsubstitutionsbtnclickevent", "custrecordlossratebtnclickevent"],
                filters: [
                    ["internalid", "anyof", context.role]
                ]
            };
            var permiss = { itemsub: false, lossrate: false}
            search.create(roleSch).run().each(function(result){
                permiss.itemsub = result.getValue(roleSch.columns[0]);
                permiss.lossrate = result.getValue(roleSch.columns[1]);
            });
            return permiss;
        }

        function setPermission() {
            var approveStatus = getFieldValue("custrecord_ps_bom_approvestatus2");
            if(approveStatus == "2") { return; }
            var permiss = getPermission();
            if(permiss.lossrate) {
                setFormFieldsDisabled();
                setSublistFieldsDisabled({component: ["componentyield"], type: "lossRate"}, false);
            } else if(permiss.itemsub) {
                setFormFieldsDisabled();
                setSublistFieldsDisabled({component: ["custrecord_main_ingredient_level", "custrecord_substitute_material_level", "custrecord_use_priority_level",
                "custrecord_purchase_priority_level", "custrecord_switching_scheme", "bomquantity"], type: "subItem"});
            }
        }

        function setFormFieldsDisabled(skipFields, isDisabled) {
            skipFields = Array.isArray(skipFields)? skipFields: [];
            isDisabled = isDisabled === undefined? !!skipFields: isDisabled;
            for(var fieldId in window.ftypes) {
                try{
                    var field = currentRecord.getField({ fieldId: fieldId });
                    field.isDisabled = skipFields.indexOf(fieldId) > -1? false: isDisabled;
                } catch(e) {}
            }
        }

        function setSublistFieldsDisabled(skipFieldObj, isDisabled) {
            skipFields = typeof skipFieldObj == "object"? skipFieldObj: {};
            isDisabled = isDisabled === undefined? !!skipFields: isDisabled;
            for(var sublistId in window.fieldnamesArray) {
                var tbody = document.querySelector("#" + sublistId + "_splits>tbody");
                tbody.onmouseup = sublistMousedownEvent;
                /* var separatorNode = tbody.querySelector(".uir-machinebutton-separator");
                separatorNode.style.display = "none";
                separatorNode.nextElementSibling.style.display = "none";
                separatorNode.nextElementSibling.nextElementSibling.style.display = "none";
                separatorNode.nextElementSibling.nextElementSibling.nextElementSibling.style.display = "none"; */
            }

            function setSublistFieldRequire(fieldId, isRequire) {
                var machine = getSublistMachine("component");
                machine.setElementRequired(fieldId, !!isRequire);
                machine.buildtable();
            }

            function sublistMousedownEvent(e) {
                setTimeout(function(){
                    var currLine = currentRecord.getCurrentSublistIndex({ sublistId: sublistId });
                    var isNewLine = !getFieldValue("id", sublistId);
                    if(skipFieldObj.type == "subItem") {
                        var mainIngredientCodeValue = getFieldValue("custrecord_main_ingredient_code_display", sublistId, currLine);
                        isDisabled = mainIngredientCodeValue? false: true;
                    }
                    _setSublistFieldsDisabled(skipFieldObj, isDisabled, currLine);
                    if(isNewLine) {
                        _setSublistFieldsDisabled({component: skipFieldObj.component.concat(["item", "custrecord_main_ingredient_code"])}, false, 0);
                        /* var upLineItemValue = getFieldValue("item", sublistId, currLine - 1);
                        upLineItemValue && setFieldValue("custrecord_main_ingredient_code", upLineItemValue, sublistId); */
                        if(getFieldValue("custrecord_main_ingredient_code", sublistId) && getFieldValue("item", sublistId)) {
                            setFieldValue("bomquantity", "0", sublistId);
                        }
                        setSublistFieldRequire("custrecord_main_ingredient_code", true);
                    } else {
                        setSublistFieldRequire("custrecord_main_ingredient_code", false);
                    }
                }, 0);
            }

            function _setSublistFieldsDisabled(skipFieldObj, isDisabled, line) {
                var fieldnamesArray = getSublistMachine(sublistId).form_elems || {};
                for(var index in fieldnamesArray) {
                    try{
                        var fieldId = fieldnamesArray[index];
                        var field = currentRecord.getSublistField({
                            sublistId: sublistId,
                            fieldId: fieldId,
                            line: line
                        });
                        var _isDisabled = skipFieldObj[sublistId].indexOf(fieldId) == -1? true: isDisabled;
                        var fieldEl = document.forms['component_form'].elements[fieldId];
                        field.isDisabled != _isDisabled && (field.isDisabled = _isDisabled);
                        fieldEl && (fieldEl.disabled = field.isDisabled);
                    } catch(e) {
                        console.log(e);
                    }
                }
            }
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
            validateDelete: validateDelete,
            //saveRecord: saveRecord
        };

        function updateLineNumber(sublistId, lineNumFieldId) {
            var machine = getSublistMachine(sublistId);
            var allCount = currentRecord.getLineCount({ sublistId: sublistId });
            allCount += (currentRecord.getCurrentSublistIndex({ sublistId: sublistId }) > allCount? 1 : 0);
            for(var line = 0, realLine = 1; line < allCount; line++, realLine++) {
                var value = getFieldValue(lineNumFieldId, sublistId, line) || 0;
                if(!isNaN(+value)) {
                    setFieldValue(lineNumFieldId, realLine, sublistId, line++, true);
                    value = getFieldValue(lineNumFieldId, sublistId, line) || 0;
                    while(isNaN(+value) && line < allCount) {
                        setFieldValue(lineNumFieldId, realLine + "-Sub", sublistId, line++, true);
                        value = getFieldValue(lineNumFieldId, sublistId, line) || 0;
                    }
                    line--;
                }
            }
            setTimeout(function(){
                machine.buildtable();
            }, 0);
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
                    try{
                        value = currentRecord.getSublistValue({ sublistId: sublistId, fieldId: fieldId, line: line });
                    } catch(e) {
                        value = "";
                    }
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
            return document.querySelector("#" + sublistId + "_splits").machine;
        }

        function initComponentSublistLineItems() {
            var machine = getSublistMachine(sublistId);
            if(machine) { return; }
            var gridNode = document.querySelector("#" + sublistId + "_splits");
            var allRows = gridNode.querySelectorAll(".uir-machine-row");
            for(var line = 0; line < allRows.length; line++) {
                var mainIngredientCodeNode = allRows[line].querySelectorAll(".dottedlink")[1];
                allRows[line].firstElementChild.innerHTML = "1";
                if(!mainIngredientCodeNode) { continue; }
                var index = findSublistIndexWidthValue(mainIngredientCodeNode.innerHTML);
                if(index == line || index++ == -1) { continue; }
                allRows[line].firstElementChild.innerHTML = "1-Sub";
                if(isDonotMoveLine(allRows, mainIngredientCodeNode, line - 1)) { continue; }
                if(allRows[index]) {
                    allRows[line].parentElement.insertBefore(allRows[line], allRows[index]);
                } else {
                    allRows[line].parentElement.append(allRows[line]);
                }
                line < index && line--;
                allRows = gridNode.querySelectorAll(".uir-machine-row");
            }
            for(var line = 0, realLine = 1; line < allRows.length; line++, realLine++) {
                var lineNumber = allRows[line].firstElementChild.innerHTML;
                if(!/-Sub/gmi.test(lineNumber)) {
                    allRows[line++].firstElementChild.innerHTML = realLine;
                    lineNumber = allRows[line].firstElementChild.innerHTML;
                    while(/-Sub/gmi.test(lineNumber) && line < allRows.length) {
                        allRows[line++].firstElementChild.innerHTML = realLine + "-Sub";
                        lineNumber = allRows[line].firstElementChild.innerHTML;
                    }
                    line--;
                }
            }

            function isDonotMoveLine(allRows, mainIngredientCodeNode, line){
                if(!allRows[line]) { return false; }
                return (allRows[line].querySelectorAll(".dottedlink")[1] || {}).innerHTML == mainIngredientCodeNode.innerHTML;
            }

            function findSublistIndexWidthValue(mainIngredientCodeValue) {
                var allRows = document.querySelectorAll("#" + sublistId + "_splits .uir-machine-row");
                for(var line = 0; line < allRows.length; line++) {
                    var itemNode = allRows[line].querySelector(".dottedlink");
                    if(mainIngredientCodeValue == itemNode.innerHTML) {
                        return line;
                    }
                }
                return -1;
            }
        }
    }
);
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
        var machineDelete = false;
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
            updateLineNumber("component", "custrecord_serial_number");
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
            } else if(scriptContext.fieldId == "custrecord_version_location_number") {
                debugger
                var value = currentRecord.getCurrentSublistValue({ sublistId: "component", fieldId: scriptContext.fieldId });
                var bomquantityValue = getFieldValue("bomquantity", "component") || 0;
                if(value === "") { return true; }
                value = value.split(/[,，，]/gmi);
                for(var newValue = [], i = 0; i < value.length; i++) {
                    (value[i] || value[i] === 0) && newValue.push(value[i]);
                }
                newValue = newValue.sort(function(num1, num2) {
                    return num1 > num2? 1: num1 == num2? 0: -1;
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: "component",
                    fieldId: scriptContext.fieldId,
                    value: newValue + "",
                    ignoreFieldChange: true
                });
                if(bomquantityValue != newValue.length) {
                    setTimeout(function() { alert("Bom数量与位号的数量不一致！"); }, 0);
                }
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
            var currentRecord = scriptContext.currentRecord;
            var mainIngredientCodeValue = currentRecord.getCurrentSublistValue({
                sublistId: scriptContext.sublistId,
                fieldId: "custrecord_main_ingredient_code"
            });
            var line = currentRecord.findSublistLineWithValue({
                sublistId: scriptContext.sublistId,
                fieldId: "item",
                value: mainIngredientCodeValue
            });
            if(line != -1) {
                var currLine = currentRecord.getCurrentSublistIndex({ sublistId: scriptContext.sublistId });
                var moveCount = line - currLine;
                component_machine.moveline(moveCount < 0? moveCount + 1: moveCount);
            }
            updateLineNumber(scriptContext.sublistId, "custrecord_serial_number");
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
            if(machineDelete) { return true; }
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
            machineDelete = true;
            currentRecord.removeLine({
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
            }
            machineDelete = false;
            setTimeout(function() {
                updateLineNumber(scriptContext.sublistId, "custrecord_serial_number", true);
            }, 0);
        }

        function getPermission() {
            var context = nlapiGetContext();
            var ipPermission = 0;
            var roleSch = {
                type: search.Type.ROLE,
                columns: ["custrecorditemsubstitutionsbtnclickevent", "custrecordlossratebtnclickevent"],
                filters: [
                    ["internalid", "anyof", context.role]
                ]
            };
            var permiss = { itemsub: false, lossrate: false}
            search.create(roleSch).run().each(function(result){
                permiss.itemsub = result.getValue(roleSch.columns[0]) == "T";
                permiss.lossrate = result.getValue(roleSch.columns[1]) == "T";
            });
            return ipPermission;
        }

        function setPermission() {
            var permiss = getPermission();
            if(permiss.lossrate) {
                setFormFieldsDisabled();
                setSublistFieldsDisabled({component: ["componentyield"], isLossRate: true}, false);
            } else if(permiss.itemsub) {
                setFormFieldsDisabled();
                setSublistFieldsDisabled({component: ["custrecord_main_ingredient_level", "custrecord_substitute_material_level", "custrecord_use_priority_level",
                "custrecord_purchase_priority_level", "custrecord_switching_scheme", "bomquantity"], isLossRate: false});
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
                var separatorNode = tbody.querySelector(".uir-machinebutton-separator");
                separatorNode.style.display = "none";
                separatorNode.nextElementSibling.style.display = "none";
                separatorNode.nextElementSibling.nextElementSibling.style.display = "none";
                separatorNode.nextElementSibling.nextElementSibling.nextElementSibling.style.display = "none";
            }

            function sublistMousedownEvent(e) {
                var el = e.target || e.srcElement;
                var lineNode = el, sublistId = el.parentNode.id.slice(0, -6);
                while(lineNode != this && (lineNode.id || "").indexOf(sublistId + "_row_") == -1) {
                    lineNode = lineNode.parentNode;
                }
                if(!lineNode) { return; }
                var idSplit = (lineNode.id || "").split('_') || [];
                var line = parseInt(idSplit[idSplit.length - 1]) - 1;
                if(isNaN(line)) { return; }
                if(!skipFieldObj.isLossRate) {
                    var mainIngredientCodeValue = getFieldValue("custrecord_main_ingredient_code_display", sublistId, line);
                    isDisabled = mainIngredientCodeValue? false: true;
                }
                _setSublistFieldsDisabled(skipFieldObj, isDisabled, line);
                var _disableSelect = disableSelect;
                disableSelect = function () {
                    _disableSelect.call(arguments);
                    _setSublistFieldsDisabled(skipFieldObj, isDisabled, line);
                }
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

        function updateLineNumber(sublistId, lineNumFieldId, render) {
            var machine = getSublistMachine(sublistId);
            var allCount = currentRecord.getLineCount({ sublistId: sublistId });
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
                    var machine = getSublistMachine(sublistId);
                    //var fieldIdIndex = machine.getFieldIdxMap()[fieldId];
                    value = machine.getLineFieldValue(machine.getLineArray()[line], fieldId);
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
    }
);
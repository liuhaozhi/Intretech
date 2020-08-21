/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/url'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function(record, search, url) {
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
            window.RhysLanGolbalObject = window.RhysLanGolbalObject || {};
            window.RhysLanGolbalObject.sch = {};
            window.currentRecord = scriptContext.currentRecord;
            loadSchText();
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
            if(scriptContext.sublistId == "recmachcustrecord_defiend_mapping_columns_dfn") {
                setFieldValue("custrecord_intergration_spec_dfn_json", getHoleJson());
            } else if(scriptContext.fieldId == "custrecord_wms_table_name") {
                var sublistId = "recmachcustrecord_defiend_mapping_columns_dfn";
                var allCount = currentRecord.getLineCount({ sublistId: sublistId }) + 1;
                var value = getFieldValue(scriptContext.fieldId);
                while(--allCount > -1) {
                    setFieldValue("custrecord_defiend_mapping_wms_table", value, sublistId, allCount, true);
                }
                getSublistMachine(sublistId).refresheditmachine();
                setFieldValue("custrecord_intergration_spec_dfn_json", getHoleJson());
            } else if(scriptContext.fieldId == "custrecord_intergration_spec_dfn_savesch") {
                loadSchText();
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

        function searchClickEvent() {
            var umsTableName = getFieldValue("custrecord_wms_table_name"),
                sublistId = "recmachcustrecord_defiend_mapping_columns_dfn",
                machine = getSublistMachine(sublistId),
                sch = search.load({ id: getFieldValue("custrecord_intergration_spec_dfn_savesch") });
            RhysLanGolbalObject.sch = sch;
            if(!sch) { return ; }
            setFieldValue("custrecord_intergration_spec_dfn_ns_tbl", sch.searchType);
            var mapObj = getFieldValue("custrecord_intergration_spec_dfn_json"), umsColName = "";
            mapObj = mapObj? JSON.parse(mapObj)[getFieldText("custrecord_wms_table_name")]: {};
            machine.removeAllLines();
            for(var index = 0; index < sch.columns.length; index++) {
                var column = sch.columns[index],
                    nsColumnName = ((column.join? column.join + ".": "") + column.name) || column,
                    umsColName = getUmsColNameFromJsonText(mapObj, nsColumnName);
                setFieldValue("custrecord_defiend_mapping_ns_column", nsColumnName, sublistId, true);
                setFieldValue("custrecord_defiend_mapping_wms_table", umsTableName, sublistId, true);
                umsColName != undefined && currentRecord.setCurrentSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_defiend_mapping_wms_column',
                    text: umsColName,
                    ignoreFieldChange: false,
                    forceSyncSourcing: true
                });
                NS.form.setInited(true);
                machine.addline();
            }
            setFieldValue("custrecord_intergration_spec_dfn_json", getHoleJson(sch.searchType));
        }

        function testIntegrationClickEvent() {
            var iHeight = 700,
                iWidth = 800,
                iTop = (window.screen.height - 30- iHeight) / 2,
                iLeft = (window.screen.width- 10 - iWidth) / 2,
                excURL = url.resolveScript({
                    scriptId: 'customscriptrl_wms_interface_api_script',
                    deploymentId: 'customdeploy_rl_wms_interface_api'
                }),
                specname = getFieldValue("name");
            window.open(excURL + "&specname=" + specname + "&rows=10", "",
                        "width=" + iWidth + ",height=" + iHeight + ",top=" + iTop + ",left=" + iLeft + ",toolbar=no,menubar=no,scrollbars=auto,location=no,status=no");
        }

        function getUmsColNameFromJsonText(mapObj, nsColumnName) {
            var umsColName = undefined;
            for(var umsName in mapObj) {
                if(mapObj[umsName] == nsColumnName) {
                    umsColName = umsName;
                    break;
                }
            }
            return umsColName;
        }

        function getHoleJson(type) {
            var sublistId = "recmachcustrecord_defiend_mapping_columns_dfn",
                umsTableName = getFieldText("custrecord_wms_table_name"),
                jsonObj = {},
                allCount = currentRecord.getLineCount({ sublistId: sublistId }) + 1;
            jsonObj[umsTableName] = { 'NS_SYSTEM_DEFAULT_TABLE_NAME': RhysLanGolbalObject.sch.searchType || getFieldText("custrecord_intergration_spec_dfn_ns_tbl") };
            for(var i = 0; i < allCount; i++) {
                var wmsValue = getFieldText("custrecord_defiend_mapping_wms_column", sublistId, i),
                    nsValue = getFieldText("custrecord_defiend_mapping_ns_column", sublistId, i);
                if((!wmsValue && !(wmsValue === false || wmsValue === 0)) || (!nsValue && !(nsValue === false || nsValue === 0))) { continue; }
                jsonObj[umsTableName][wmsValue] = nsValue;
            }
            jsonObj[umsTableName].filters = RhysLanGolbalObject.sch.filters;
            return JSON.stringify(jsonObj);
        }

        function loadSchText() {
            //var f = search.createFilter(["internalid","anyof",[75655,75656]]);
            var saveSch = getFieldValue("custrecord_intergration_spec_dfn_savesch");
            var sch = saveSch && search.load({ id: saveSch });
            RhysLanGolbalObject.sch = sch || {};
            setFieldValue("custrecord_check_search_quert", sch? JSON.stringify(sch): "");
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

        function getFieldText(fieldId, sublistId, line) {
            var value = "";
            if(sublistId !== undefined) {
                var currSelectLine = currentRecord.getCurrentSublistIndex({ sublistId: sublistId });
                if(line === undefined || currSelectLine == line) {
                    value = currentRecord.getCurrentSublistText({
                        sublistId: sublistId,
                        fieldId: fieldId
                    });
                } else {
                    var machine = getSublistMachine(sublistId);
                    var fieldPos = machine.getFieldPosition(fieldId);
                    if(machine.miniform_elem_types[fieldPos] == "slaveselect") {
                        fieldPos--;
                    }
                    var lineArrayLine = machine.getLineArray()[line];
                    value = lineArrayLine? lineArrayLine[fieldPos]: "";
                }
            } else {
                value = currentRecord.getText({ fieldId: fieldId });
            }
            return value;
        }

        function setFieldValue(fieldId, value, sublistId, line, ignoreFieldChange) {
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

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            //postSourcing: postSourcing,
            //sublistChanged: sublistChanged,
            //lineInit: lineInit,
            //validateField: validateField,
            //validateLine: validateLine,
            //validateInsert: validateInsert,
            //validateDelete: validateDelete,
            //saveRecord: saveRecord,
            searchClickEvent: searchClickEvent,
            testIntegrationClickEvent: testIntegrationClickEvent
        };
    }
);
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/ui/message', 'N/ui/dialog', 'N/https', 'N/url'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function(record, search, message, dialog, https, url) {
        var currentRecord;
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

        function getPermission() {
            var context = nlapiGetContext();
            var ipPermission = 0;
            var roleSch = {
                type: search.Type.ROLE,
                columns: ["custrecord_cux_role_item_recipt_update"],
                filters: [
                    ["internalid", "anyof", context.role]
                ]
            };
            search.create(roleSch).run().each(function(result){
                ipPermission = result.getValue(roleSch.columns[0]);
            });
            return ipPermission;
        }

        function setPermission() {
            var value = getPermission();
            if(value == "2") {
                setFormFieldsDisabled(true);
                setSublistFieldsDisabled({"item": ["landedcost"]});
            } else if(value == "3") {
                setFormFieldsDisabled(true);
                setSublistFieldsDisabled(true)
            }
            var tabNode = document.querySelector("#tb");
            if(tabNode) {
                tabNode.onclick = setPermission;
            }
        }

        function setFormFieldsDisabled(isDisabled, skipFields) {
            isDisabled = !!isDisabled;
            skipFields = Array.isArray(isDisabled)? isDisabled: skipFields;
            skipFields = Array.isArray(skipFields)? skipFields: [];
            for(var fieldId in window.ftypes) {
                try{
                    var field = currentRecord.getField({ fieldId: fieldId });
                    field.isDisabled = skipFields.indexOf(fieldId) > -1? false: isDisabled;
                } catch(e) {}
            }
        }

        function setSublistFieldsDisabled(isDisabled, skipFields) {
            skipFields = typeof isDisabled == "object"? isDisabled: skipFields;
            skipFields = typeof skipFields == "object"? skipFields: {};
            isDisabled = !!isDisabled;
            for(var sublistId in fieldnamesArray) {
                var sublistFields = fieldnamesArray[sublistId];
                var tbody = document.querySelector("#" + sublistId + "_splits>tbody");
                var separatorNode = tbody.querySelector(".uir-machine-button-row");
                var allCount = currentRecord.getLineCount({sublistId: sublistId}) + 1;
                if(separatorNode) {
                    separatorNode.style.display = "none";
                }
                for(var line = 0; line < allCount; line++) {
                    for(var index in sublistFields) {
                        var fieldId = sublistFields[index];
                        if(!isNaN(+fieldId)) { continue; }
                        try{
                            var field = currentRecord.getSublistField({
                                sublistId: sublistId,
                                fieldId: fieldId,
                                line: line
                            });
                            if(skipFields[sublistId] && skipFields[sublistId].indexOf(fieldId) > -1) { debugger; continue; }
                            field.isDisabled != isDisabled && (field.isDisabled = isDisabled);
                        } catch(e) {}
                    }
                }
            }
        }

        return {
            pageInit: pageInit,
            //fieldChanged: fieldChanged,
            //postSourcing: postSourcing,
            //sublistChanged: sublistChanged,
            //lineInit: lineInit,
            //validateField: validateField,
            //validateLine: validateLine,
            //validateInsert: validateInsert,
            //validateDelete: validateDelete,
            //saveRecord: saveRecord
        };
    }
);
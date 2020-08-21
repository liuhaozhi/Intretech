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
            switch(currentRecord.type) {
                case "purchaseorder":
                    ExtendStandardGrid("item", 800);
                    break;
            }
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

        function ExtendStandardGrid(sublistId, height) {
            var gridNode = document.querySelector("#" + sublistId + "_splits");
            if(!gridNode) { return {}; }
            var parentElement = gridNode.parentElement;
            var headerRow = document.createElement("div");
            var gridHeaderRow = gridNode.lastElementChild.firstElementChild;
            headerRow.id = sublistId + "_splits_headerrow_contains";
            parentElement.append(headerRow);
            headerRow.append(gridHeaderRow.cloneNode(true));
            var gridConainer = document.createElement("div");
            gridConainer.id = sublistId + "_splits_contanis";
            gridConainer.className = "extend_standard_grid_contanis";
            parentElement.append(gridConainer);
            gridConainer.append(gridNode);
            gridConainer.style = "height:auto;width:auto;overflow:visible;max-height:" + (height || 800) + "px;min-height:100px;";
            parentElement.style.position = "relative";
            var styleNode = document.querySelector("rhys_defined_extend_standard_grid_css") || document.createElement("style");
            styleNode.id = "rhys_defined_extend_standard_grid_css";
            styleNode.innerHTML = "\
            #" + sublistId + "_splits_contanis div.#recmachcustrecord_multibom_top_headerrow{\
                display:block;\
                width:100%;\
            }\
            #" + sublistId + "_splits_headerrow_contains .uir-machine-headerrow>td{\
                display:inline-block;\
            ";
            gridNode.addEventListener("click", function(e) {
                var that = this;
                setTimeout(function() {
                    changeHeaderRowWidth(that.machine.name);
                }, 0);
            });
            parentElement.addEventListener("scroll", function(e) {
                headerRow.style.top = this.scrollTop + "px";
            });
            headerRow.style = "background:none;background-color:rgb(229, 229, 229) !important;position:absolute;z-index:999;";
            changeHeaderRowWidth(sublistId);
            document.head.append(styleNode);
            function changeHeaderRowWidth(sublistId) {
                var machineRow = document.querySelector("#" + sublistId + "_splits tbody tr.uir-machine-headerrow");
                var headerRow = document.querySelector("#" + sublistId + "_splits_headerrow_contains");
                headerRow.style.width = gridNode.offsetWidth + "px";
                for(var i = 0, rows = headerRow.firstElementChild.children; i < rows.length; i++) {
                    rows[i].style.width = (machineRow.children[i].offsetWidth) + "px";
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
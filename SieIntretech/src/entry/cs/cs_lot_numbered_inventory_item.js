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
        var isSaveFailure = false;
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
            var currentRecord = scriptContext.currentRecord,
                typeObj = { "lotnumberedassemblyitem": true };
            if (typeObj[currentRecord.type] && scriptContext.mode == "create") {
                initValueFromSessionStorage(currentRecord);
            } else if(scriptContext.mode == "copy") {
                removeSomeFieldWhenCopy(scriptContext);
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
            debugger;
            var currentRecord = scriptContext.currentRecord
            var displaynameExistId = getRecordFromFields(currentRecord, "custitem_ps_item_specification", currentRecord.getValue("custitem_ps_item_specification"));
            var itemIdExistId = getRecordFromFields(currentRecord, "itemid", currentRecord.getValue("itemid"));
            var isDescriptionExist = getRecordFromFields(currentRecord, "description", currentRecord.getValue("description").trim());
            var msg = "";
            if (displaynameExistId.length && displaynameExistId.indexOf(currentRecord.id+"") == -1) {
               msg = "注意，已存在相同的规格！<br>Attention please,the item specification existed.";
            } else if (itemIdExistId.length && itemIdExistId.indexOf(currentRecord.id+"") == -1) {
               msg = "注意，已存在相同的物料代码！<br>Attention please,the item name/number existed.";
            } else if(isDescriptionExist.length && isDescriptionExist.indexOf(currentRecord.id+"") == -1) {
                msg = "注意，已存在相同的描述属性！<br>Attention please,the description existed.";
            }
            if (msg) {
                !isSaveFailure && showDialog("Alert", { title: "注意创建 <br>Attention", message: msg }, [], function() {
                    isSaveFailure = true;
                });
                return isSaveFailure;
            } else {
                if (["lotnumberedassemblyitem"].indexOf(currentRecord.type) > -1 && currentRecord.id == "") {
                    var obj = {
                        itemId: currentRecord.getValue("itemid"),
                        _custitem_parent_category: currentRecord.getValue("custitem_it_numbering_segment1"),
                        _custitem_medium_category: currentRecord.getValue("custitem_it_numbering_segment2"),
                        _custitem_sub_category: currentRecord.getValue("custitem_it_numbering_segment3"),
                    };
                    localStorage[currentRecord.type + "_itemid"] = JSON.stringify(obj);
                }
                return true;
            }
        }

        return {
            pageInit: pageInit,
            /*fieldChanged: fieldChanged,
            postSourcing: postSourcing,
            sublistChanged: sublistChanged,
            lineInit: lineInit,
            validateField: validateField,
            validateLine: validateLine,
            validateInsert: validateInsert,
            validateDelete: validateDelete,*/
            saveRecord: saveRecord
        };

        function removeSomeFieldWhenCopy(scriptContext) {
            var removedFields = ["custitem_old_item_number", "custitem_outsideitems", 
            "parent", "displayname", "custitem_ps_item_specification", "custitem_item_material_name",
            "custitem_item_english_desc", "description"];
            for(var index in removedFields) {
                try{
                    scriptContext.currentRecord.setValue({
                        fieldId: removedFields[index],
                        value: "",
                        ignoreFieldChange: true
                    });
                } catch(e) {
                    
                }
            }
        }

        function showDialog(type, options, buttons, succFunc, faileFunc) {
            var _types = ["alert", "confirm", "create"];
            var defaultFunc = function(result) {};
            type = (type || "").toLowerCase();
            type = _types.indexOf(type) > -1 ? type : _types[0];
            options = options || {};
            options.title = options.title; // || (type[0].toUpperCase() + type.slice(1));
            options.message = options.message || "";
            buttons = buttons || [];
            if (typeof buttons == "object") {
                if (buttons.label !== undefined && buttons.value !== undefined) {
                    buttons = [buttons];
                }
            }
            dialog[type](options).then(succFunc || defaultFunc).catch(faileFunc || defaultFunc);
        }

        function initValueFromSessionStorage(currentRecord) {
            var lastCreateRecord = localStorage[currentRecord.type + "_itemid"];
            if(!lastCreateRecord){ return ; }
            lastCreateRecord = JSON.parse(lastCreateRecord);
            currentRecord.setValue("custitem_it_numbering_segment1", lastCreateRecord._custitem_parent_category);
            currentRecord.setValue("custitem_it_numbering_segment2", lastCreateRecord._custitem_medium_category);
            currentRecord.setValue("custitem_it_numbering_segment3", lastCreateRecord._custitem_sub_category);
        }

        function getRecordFromFields(currentRecord, fieldName, value) {
            if (!fieldName || !value) { return []; }
            var itemsSearch = search.create({
                type: currentRecord.type,
                filters: [{
                    name: fieldName,
                    operator: search.Operator.IS,
                    values: [value]
                }]
            });
            var existIds = [];
            var allResults = getAllSearchResults(itemsSearch);
            for(var index in allResults) {
                var rec = allResults[index];
                existIds.push(rec.id);
            }
            return existIds;
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
    }
);
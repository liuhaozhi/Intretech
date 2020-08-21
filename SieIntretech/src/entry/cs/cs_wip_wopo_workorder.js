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
        var currentRecord, sublistId = "item";
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
            operatorRefrashItemSublsitButton();
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
            var fieldId = scriptContext.fieldId;
            switch(fieldId) {
                case "assemblyitem":
                    var invalId = setInterval(function() {
                        var bomCode = currentRecord.getValue("billofmaterials");
                        if(bomCode) { clearInterval(invalId); }
                        else { return; }
                        lastBomCode = bomCode;
                        var subsidiary = currentRecord.getValue("subsidiary");
                        var bondStatus = currentRecord.getValue("custbody_wip_so_line_if_under_bond");
                        var mfType = currentRecord.getValue("custbody_wip_manufacturing_type");
                        var location = getLocationValue({ subsidiary: subsidiary, bondStatus: bondStatus, bomCode: bomCode, mfType: mfType });
                        currentRecord.setValue("location", location || "");
                        if(!location) {
                            alert("该子公司下物料长代码的地点不存在！");
                        } else {
                            var newIntervalId = setInterval(function() {
                                nlapiSetFieldValue("iswip",true);
                                var value = currentRecord.getValue("manufacturingrouting");
                                if(value) {
                                    clearInterval(newIntervalId);
                                }
                            }, 3000);
                        }
                    }, 3000);
                    break;
                case "custbody_wip_manufacturing_type":
                    operatorRefrashItemSublsitButton();
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

        function getLocationValue(context) {
            if(!context.bomCode || !context.subsidiary) { return; }
            var sch = {
                type: "manufacturingrouting",
                columns: ["location", "location.custrecord_bonded_under_bond", "location.custrecordcustrecord_if_trustee_location"],
                filters: [
                    ["billofmaterials", "anyof", context.bomCode],
                    "AND",
                    ["subsidiary", "anyof"].concat(context.subsidiary),
                    "AND",
                    ["isdefault", "is", "T"]
                ]
            };
            var location = "";
            getAllSearchResults(sch).forEach(function(item) {
                var bondStatus = item.getValue(item.columns[1]);
                var trustee = item.getValue(item.columns[2])
                location = item.getValue(item.columns[0]);
                if((context.mfType == "3" && trustee) || (context.bondStatus == bondStatus)) {
                    return false;
                }
                return true;
            });
            
            return location;
        }

        function operatorRefrashItemSublsitButton() {
            var mfType = currentRecord.getValue("custbody_wip_manufacturing_type");
            var btnNonde = document.querySelector("#tbl_custformbutton0").parentElement;
            var secBtnNode = document.querySelector("#tbl_secondarycustformbutton0").parentElement;
            if(mfType == "4" || mfType == "5") {
                btnNonde.onclick = secBtnNode.onclick = refrashItemSublist;
                secBtnNode.style.display = btnNonde.style.display = "";
            } else {
                secBtnNode.style.display = btnNonde.style.display = "none";
            }
        }

        function refrashItemSublist(e) {
            var machine = Ext.get(sublistId + "_splits").dom.machine;
            var lineCount = currentRecord.getLineCount({ sublistId: sublistId });
            machine.deletelines(0, lineCount);
            machine.refresheditmachine();
            var lineFields = {
                item: currentRecord.getValue("assemblyitem"),
                quantity: currentRecord.getValue("quantity")
            }
            if(!lineFields.item) { return ; }
            for(var fieldId in lineFields) {
                currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: fieldId, value: lineFields[fieldId] });
            }
            var valId = setInterval(function(){
                lineCount = currentRecord.getLineCount({ sublistId: sublistId });
                lineCount == 0? currentRecord.commitLine({ sublistId: sublistId }): clearInterval(valId);
            }, 500);
            message.create({
                title: "刷新用料表", 
                message: "用料表刷新成功！", 
                type: message.Type.CONFIRMATION
            }).show({ duration: 3000 });
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

            return {
                allResults: allResults,
                forEach: function(callBack) {
                    for(var i = 0; i < this.allResults.length && callBack(this.allResults[i]); i++) ;
                }
            };
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            // postSourcing: postSourcing,
            // sublistChanged: sublistChanged,
            // lineInit: lineInit,
            // validateField: validateField,
            // validateLine: validateLine,
            // validateInsert: validateInsert,
            // validateDelete: validateDelete,
            // saveRecord: saveRecord
        };
    }
);
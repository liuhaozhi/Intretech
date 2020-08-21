/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/ui/message', 'N/https', 'N/url'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function(record, search, message, https, url) {
        var currentRecord;
        var globalObject = {};
        var comparison = "single";
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
            hiddenPlaceHoldField("comparison1");
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
            var bomFieldCount = scriptContext.fieldId.slice(-1);
            if(/bomcode/gmi.test(scriptContext.fieldId)) {
                setBomCodeSubsidiary(bomFieldCount, function() {
                    setBomRevisonOptions(bomFieldCount);
                });
            } else if(/bomrevision/gmi.test(scriptContext.fieldId)) {
                var revisionValue = currentRecord.getValue({ fieldId: scriptContext.fieldId });
                currentRecord.setValue({
                    fieldId: "bomstatus" + bomFieldCount,
                    value: ((globalObject["bomRevisionStatus" + bomFieldCount] || {})[revisionValue] || {}).text || ""
                });
            } else if(/subsidiaryfield/gmi.test(scriptContext.fieldId)) {
                var bomCode1 = currentRecord.getValue({ fieldId: "bomcode1" });
                var bomCode2 = currentRecord.getValue({ fieldId: "bomcode2" });
                /* if(bomCode1) {
                    setBomRevisonOptions(1);
                } */
                if(bomCode2) {
                    !bomCode1 && setBomRevisonOptions(2);
                    bomCode1 && search.create.promise({type: "bom"}).then(function (params) {
                        setBomRevisonOptions(2);
                    });
                }
            } else if(scriptContext.fieldId == "comparison") {
                comparison = currentRecord.getValue({ fieldId: scriptContext.fieldId }) == "0"? "single": "mult";
                var bomR1Field = currentRecord.getField({ fieldId: "bomrevision1" });
                var bomR2Field = currentRecord.getField({ fieldId: "bomrevision2" });
                bomR1Field.isDisabled = comparison == "mult";
                bomR2Field.isDisabled = comparison == "mult";
                document.querySelector("#bom_differenc_analysis_tabtxt span").innerText = (comparison == "mult"? "多": "单") + "阶BOM差异分析";
                if(comparison == "mult") {
                    currentRecord.setValue({ fieldId: "bomrevision1", value: (globalObject["actBomRevision1"] || [])[0] || 0 });
                    currentRecord.setValue({ fieldId: "bomrevision2", value: (globalObject["actBomRevision2"] || [])[0] || 0 });
                }
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

        function searchButtonEvent() {
            var fieldIds = [ "bomrevision1", "bomrevision2"], values = {},
                gridDom = document.querySelector("#bom_differenc_analysis_sbulist_splits tbody");
            for(var index in fieldIds) {
                var fieldId = fieldIds[index];
                values[fieldId] = currentRecord.getValue({ fieldId: fieldId });
                if(values[fieldId] === "" || values[fieldId] === "0") { return alert("BOM Reversion 不能为空！"); }
            }
            var bomReversionInof1 = globalObject["bomRevision1"][values.bomrevision1],
                bomReversionInof2 = globalObject["bomRevision2"][values.bomrevision2];
            
            ajaxPost(url.resolveScript({
                scriptId: 'customscript_rl_bom_mult_grade_contrast',
                deploymentId: 'customdeploy_rl_bom_mult_grade_contrast'
            }), {
                funcName: "getSearchGridInnerHtml",
                bomReversionInof1: bomReversionInof1,
                bomReversionInof2: bomReversionInof2
            }, function(result) {
                var linesHtml = JSON.parse(result.body);
                linesHtml = linesHtml.replace(/\(StartPlaceHolder[^)]*\)/gmi, "");
                gridDom.innerHTML = gridDom.firstElementChild.outerHTML + linesHtml + gridDom.lastElementChild.outerHTML;
                gridDom.lastElementChild.style.display = "none";
                var rows = gridDom.querySelector(".uir-list-row-tr");
                for(var i = 0; i < rows.length; i++) {
                    if(rows[i].children[4].innerText == rows[i].children[6].innerText &&
                        rows[i].children[5].innerText == rows[i].children[7].innerText) {
                        rows[i].remove();
                    }
                }
            });
        }
        

        function setBomRevisonOptions(bomFieldCount) {
            var subsidiaryValue = currentRecord.getValue({ fieldId: "subsidiaryfield" + bomFieldCount }),
                bomCodeValue = currentRecord.getValue({ fieldId: "bomcode" + bomFieldCount });
            subsidiaryValue = subsidiaryValue || (currentRecord.getValue({ fieldId: "subsidiaryfield" + (bomFieldCount == 1? 2: 1) }));
            if(!subsidiaryValue || !bomCodeValue) { return ; };
            var statusField = "bomRevisionStatus" + bomFieldCount, reversionField = "bomRevision" + bomFieldCount, actRevisionField = "actBomRevision" + bomFieldCount;
            var today = Date.now();
            currentRecord.setValue({ fieldId: "bomstatus" + bomFieldCount });
            globalObject[statusField] = {};
            globalObject[reversionField] = {};
            globalObject[actRevisionField] = [];
            ajaxPost(url.resolveScript({
                scriptId: 'customscript_rl_bom_mult_grade_contrast',
                deploymentId: 'customdeploy_rl_bom_mult_grade_contrast'
            }), {
                funcName: "getBomReversionInfo",
                subsidiaryValue: subsidiaryValue,
                bomCodeValue: bomCodeValue
            }, function(result) {
                var revision1DropDown = getDropdown(document.querySelector("input[id*='inpt_bomrevision" + bomFieldCount + "']"));
                revision1DropDown.deleteAllOptions();
                revision1DropDown.addOption("", 0);
                var allValues = JSON.parse(result.body)[bomCodeValue];
                for(var i = 0; i < allValues.length; i++) {
                    var values = allValues[i];
                    if(values.subsidiary[0].value != subsidiaryValue) { continue; }
                    var revisionText = values["revision.name"], revisionValue = values["revision.internalid"][0].value;
                    var startDate = values["revision.effectivestartdate"], endDate = values["revision.effectiveenddate"];
                    var status = values["revision.custrecord_ps_bom_approvestatus2"][0] || {}
                    globalObject[statusField][revisionValue] = status;//{value: '1', text: ''}
                    globalObject[statusField][revisionText] = status;
                    globalObject[reversionField][revisionValue] = { text: revisionText, value: revisionValue, bomName: values.name, bomId: bomCodeValue, internalId: values["revision.internalid"][0] };
                    revision1DropDown.addOption(revisionText, revisionValue);
                    if(status.value == "1" && (!startDate || !endDate) || (new Date(startDate) <= today && new Date(endDate) >= today)) {
                        globalObject[actRevisionField].push(revisionValue);
                    }
                }
                if(comparison == "mult") {
                    setTimeout(function() {
                        currentRecord.setValue({ fieldId: "bomrevision" + bomFieldCount, value: globalObject[actRevisionField][0] });
                    }, 0);
                }
            });
        }

        function setBomCodeSubsidiary(bomFieldCount, promiseCallback) {
            var bomCode = currentRecord.getValue({ fieldId: "bomcode" + bomFieldCount });
            if(!bomCode) { return; }
            ajaxPost(url.resolveScript({
                scriptId: 'customscript_rl_bom_mult_grade_contrast',
                deploymentId: 'customdeploy_rl_bom_mult_grade_contrast'
            }), {
                funcName: "getBomCodeSubsidiary",
                bomCode: bomCode
            }, function(result) {
                var subsidiaryFieldId = "subsidiaryfield" + bomFieldCount;
                var subsidiaryValue = currentRecord.getValue({ fieldId: subsidiaryFieldId });
                var allSubsidiary = JSON.parse(result.body);
                if(!subsidiaryValue) {
                    allSubsidiary[0] && currentRecord.setValue({ fieldId: subsidiaryFieldId, value: allSubsidiary[0], ignoreFieldChange: true });
                } else if(allSubsidiary.indexOf(subsidiaryValue) == -1){
                    currentRecord.setValue({ fieldId: "bomcode" + bomFieldCount, value: "", ignoreFieldChange: true });
                    return alert("这个BOM编号不属于该公司!");
                }
                typeof promiseCallback == "function" && promiseCallback();
            });
        }

        function hiddenPlaceHoldField(fieldId) {
            var fieldNode = document.querySelector("#" + fieldId + "_fs");
            while(fieldNode && (fieldNode.nodeName || "a").toLocaleLowerCase() != "tr") {
                fieldNode = fieldNode.parentNode;
            }
            fieldNode && (fieldNode.style.visibility = "hidden");
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
            searchButtonEvent: searchButtonEvent
        };
    }
);
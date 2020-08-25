/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/url', 'N/https', 'N/ui/dialog', '../../../lib/common_rhysdefine_standardgrid'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function(record, search, url, https, dialog, myGrid) {
        var currentRecord, chgFieldsInfo = {};
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
            initSublistTab();
            console.log(search.load("customsearch1284_2"));
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
        }

        function searchButtonClickEvent(e) {
            var filters = [];
            var opMapping = { "entity": "anyof", "item": "anyof", "custbody_po_buyer": "anyof",
                              "custbody_po_list_pur_type": "anyof", "tranid": "haskeywords", "custcol_external_2": "anyof" };
            var submitGridInstance = getCurrentSublistGridInstance();
            for(var fieldId in opMapping) {
                var fieldValue = currentRecord.getValue(fieldId);
                if(!fieldValue) { continue; }
                filters.push("AND", [fieldId.replace('__', '.'), opMapping[fieldId], fieldValue]);
            }
            var dataCreateFrom = currentRecord.getText("datecreated_from");
            var dateCreateTo = currentRecord.getText("datecreated_to");
            var expDateFrom = currentRecord.getText("expectedreceiptdate_from");
            var expDateTo = currentRecord.getText("expectedreceiptdate_to");
            if(dataCreateFrom && dateCreateTo) {
                filters.push("AND", ["datecreated", "within", dataCreateFrom, dateCreateTo]);
            } else if(dataCreateFrom || dateCreateTo) {
                filters.push("AND", ["datecreated", "onorafter", dataCreateFrom]);
            }
            if(expDateFrom && expDateTo) {
                filters.push("AND", ["expectedreceiptdate", "within", expDateFrom, expDateTo]);
            } else if(dataCreateFrom || dateCreateTo) {
                filters.push("AND", ["expectedreceiptdate", "onorafter", expDateFrom]);
            }
            filters.push("AND", ["approvalstatus", "anyof", "1"]);
            if(sCurrentlySelectedTab == "po_batch_auditral_submit_tab") {
                filters.push("AND", ["custbody_pc_salesman", "anyof", nlapiGetContext().user]);
            } else if(sCurrentlySelectedTab == "po_batch_auditral_confirm_tab") {
                filters.push("AND", ["nextapprover", "anyof", nlapiGetContext().user]);
            }
            ajaxPost({
                funcName: "getDetailSublsitData",
                filters: filters
            }, function(result) {
                if(!result.length) { return alert("没有查找到数据！"); }
                var lineArray = [], existPoId = {};
                for(var line = 0; line < result.length; line++) {
                    var lineData = result[line], poId = lineData["tranid"];
                    var emptyLine = submitGridInstance.getEmptyLine();
                    lineData["entityid"] = lineData["vendor__internalid"];
                    lineData["entityid_display"] = lineData["vendor__entityid"] + " " + lineData["vendor__altname"];
                    for(var fieldId in lineData) {
                        var fieldPos = submitGridInstance.getFieldPos(fieldId);
                        fieldPos > -1 && (emptyLine[fieldPos] = lineData[fieldId]);
                    }
                    if(!existPoId[poId]) {
                        var totalLine = submitGridInstance.getEmptyLine();
                        totalLine[submitGridInstance.getFieldPos("totalline")] = "是";
                        totalLine[submitGridInstance.getFieldPos("tranid")] = lineData["tranid"];
                        totalLine[submitGridInstance.getFieldPos("entityid")] = lineData["entityid"];
                        totalLine[submitGridInstance.getFieldPos("entityid_display")] = lineData["entityid_display"];
                        totalLine[submitGridInstance.getFieldPos("internalid")] = lineData["internalid"];
                        totalLine[submitGridInstance.getFieldPos("custbody_k3_po_number")] = lineData["custbody_k3_po_number"];
                        lineArray.push(totalLine);
                    }
                    lineArray.push(emptyLine);
                    existPoId[poId] = true;
                }
                submitGridInstance.setLineArray(lineArray);
            });
        }

        function searchBatchAuditSubmitButtonClickEvent(type) {
            var machine = getCurrentSublistGridInstance();
            var allCount = machine.getLineCount();
            var datas = {}, selectedLines = machine.getSelectLines();
            if(!allCount || !selectedLines.length) {
                return dialog.alert({
                    title: '提交失败',
                    message: !allCount? '您提交的表格没有数据!': '请至少选择一行再进行提交！' 
                }).then(function() {}).catch(function() {});
            }
            type = type || "BatchSubmit";
            for(var line = selectedLines.length - 1; (datas[machine.getFieldValue("internalid", selectedLines[line])] = type) && line; line--);
            ajaxPost({
                funcName: "executeMapReduceChange",
                datas: datas
            }, function(result) {
                var taskId = result;
                dialog.alert({
                    title: '提交成功',
                    message: '批量审批提交成功！' 
                }).then(function() {}).catch(function() {});
                machine.clear();
            });
        }

        function searchBatchAuditRejectButtonClickEvent() {
            searchBatchAuditSubmitButtonClickEvent("BatchReject");
        }

        function  searchBatchAuditApproveButtonClickEvent() {
            searchBatchAuditSubmitButtonClickEvent("BatchApprove");
        }

        function ajaxPost(params, callBack) {
            https.post.promise({
                url: url.resolveScript({
                    scriptId: 'customscript_rl_cux_po_change',
                    deploymentId: 'customdeploy_rl_cux_po_change'
                }),
                header: {
                    'Content-Type': 'application/json'
                },
                body: params
            }).then(function (result) {
                callBack && callBack(JSON.parse(result.body));
            });
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
            //saveRecord: saveRecord,
            searchButtonClickEvent: searchButtonClickEvent,
            searchBatchAuditSubmitButtonClickEvent: searchBatchAuditSubmitButtonClickEvent,
            searchBatchAuditRejectButtonClickEvent: searchBatchAuditRejectButtonClickEvent,
            searchBatchAuditApproveButtonClickEvent: searchBatchAuditApproveButtonClickEvent
        };

        function initSublistTab() {
            var gridConfig = {
                showCheckBox: true,
                showSerialNumber: true,
                showHeaderRow: true,
                height: "700px",
                columns: [
                    {"fieldId":"totalline","type":"TEXT","label":"是否总行"},
                    {"fieldId":"tranid","type":"TEXT","label":"采购订单号"},
                    {"fieldId":"entityid","type":"SELECT","label":"供应商","source":"vendor"},
                    {"fieldId":"internalid","type":"TEXT","label":"内部标识"},
                    {"fieldId":"custbody_k3_po_number","type":"TEXT","label":"K3采购订单号"},
                    {"fieldId":"custcol_k3_line_number","type":"TEXT","label":"K3行Id"},
                    {"fieldId":"line","type":"TEXT","label":"行Id"},
                    {"fieldId":"item","type":"SELECT","label":"货品","source":"item"},
                    {"fieldId":"item__salesdescription","type":"TEXT","label":"规格型号"},
                    {"fieldId":"quantity","type":"TEXT","label":"采购数量", /* editable: true */},
                    {"fieldId":"rate","type":"TEXT","label":"单价"},
                    {"fieldId":"taxcode","type":"PERCENT","label":"税率"},
                    {"fieldId":"fxrate","type":"PERCENT","label":"货品价格（外币）"},
                    {"fieldId":"currency","type":"SELECT","label":"货币","source":"currency"},
                    {"fieldId":"fxamount","type":"CURRENCY","label":"金额（外币）"},
                    {"fieldId":"netamount","type":"CURRENCY","label":"金额（净额）"},
                    {"fieldId":"taxamount","type":"CURRENCY","label":"金额（税）"},
                    {"fieldId":"expectedreceiptdate","type":"DATE","label":"预计交货日期"},
                    {"fieldId":"approvalstatus","type":"SELECT","label":"审核状态"},
                    {"fieldId":"statusref","type":"TEXT","label":"状态"},
                    {"fieldId":"datecreated","type":"DATE","label":"创建日期"},
                    {"fieldId":"custbody_po_list_pur_type","type":"SELECT","label":"采购类型","source":"customlist_po_list_pur_type"},
                    {"fieldId":"custcolcustfiled_po_changereason","type":"TEXT","label":"采购变更原因"},
                    {"fieldId":"custbody_po_buyer","type":"SELECT","label":"专营采购员","source":"employee"}
                ],
                data: [],
                style: "width:150%;height:100%;",
                event: {
                    click: function gridClickEvent(el, gridInstance) {
                        var target = el.srcElement || el.target;
                        if(target.name == "search_list_grid_selectone") {
                            var cellNode = target.parentElement.parentElement.parentElement;
                            var line = cellNode.getAttribute("row"), selectedLines = [];
                            var poId = gridInstance.getFieldValue("internalid", line);
                            var lineCount = gridInstance.getLineCount();
                            while(--lineCount > -1) {
                                gridInstance.getFieldValue("internalid", lineCount) == poId && selectedLines.push(lineCount);
                            }
                            gridInstance[target.checked? "selectedLines": "unSelectedLines"](selectedLines);
                        }
                    }
                }
            };
            var submitGridInstance = new myGrid.SearchListGrid(gridConfig);
            document.querySelector("#po_batch_auditral_submit_sublist_splits").parentElement.innerHTML = submitGridInstance.create().outerHTML;
            var auditralGridInstance = new myGrid.SearchListGrid(deepCopy(gridConfig));
            document.querySelector("#po_batch_auditral_confirm_sublist_splits").parentElement.innerHTML = auditralGridInstance.create().outerHTML;
            document.querySelector("#po_batch_auditral_confirm_tabtxt").parentElement.parentElement.addEventListener("click", function(e) {
                initPageWidthSublistFocus();
            });
            initPageWidthSublistFocus();
        }

        function getCurrentSublistGridInstance() {
            return document.querySelector("#" + sCurrentlySelectedTab.slice(0, -4) + "_sublist_div>:first-child").machine;
        }

        function initPageWidthSublistFocus() {
            var submitBtn = document.querySelector("#tbl_cstm_page_audit_submit_btn").parentElement;
            var approveBtn = document.querySelector("#cstm_page_audit_approve_btn").parentElement;
            var rejectBtn = document.querySelector("#cstm_page_audit_reject_btn").parentElement;
            var secSubmitBtn = document.querySelector("#secondarycstm_page_audit_submit_btn").parentElement;
            var secApproveBtn = document.querySelector("#secondarycstm_page_audit_approve_btn").parentElement;
            var secRejectBtn = document.querySelector("#secondarycstm_page_audit_reject_btn").parentElement;
            if(sCurrentlySelectedTab == "po_batch_auditral_submit_tab") {
                secSubmitBtn.style.display = submitBtn.style.display = "";
                secApproveBtn.style.display = approveBtn.style.display = "none";
                secRejectBtn.style.display = rejectBtn.style.display = "none";
            } else if(sCurrentlySelectedTab == "po_batch_auditral_confirm_tab") {
                secSubmitBtn.style.display = submitBtn.style.display = "none";
                secApproveBtn.style.display = approveBtn.style.display = "";
                secRejectBtn.style.display = rejectBtn.style.display = "";
            }
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
    }
);
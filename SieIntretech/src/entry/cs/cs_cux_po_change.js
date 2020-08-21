/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/url', 'N/https', 'N/ui/dialog', 'N/ui/message'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function(record, search, url, https, dialog, message) {
        var currentRecord, chgFieldsInfo = {}, dataFormatType = "";
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
            var a = search.load("customsearch_po_pochange");
            console.log(a);
            //注册分页提交事件
            var detailNode = document.querySelector('#pochange_detail_sublist_layer');
            var detailTableNode = document.querySelector("div[data-machine-name='pochange_detail_sublist']");
            detailNode.firstChild.onclick = detailNode.lastChild.onclick = divSublistPageClickEvent;
            detailTableNode.onclick = poChangeDetailSublistClickEvent;
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
            if(scriptContext.sublistId == "pochange_confirm_sublist") {
                var internalid = getFieldValue("internalid", scriptContext.sublistId);
                var lineId = getFieldValue("line", scriptContext.sublistId) - 1;
                var fldValue = getFieldValue(fieldId, scriptContext.sublistId);
                if(fldValue instanceof Date) {
                    fldValue = fldValue.format("yy/m/d");
                }
                chgFieldsInfo[internalid] = chgFieldsInfo[internalid] || {};
                chgFieldsInfo[internalid][lineId] = chgFieldsInfo[internalid][lineId] || {};
                chgFieldsInfo[internalid][lineId][fieldId.replace("aftermodify__", "")] = fldValue;
                
                if(fieldId == "aftermodify__quantity" || fieldId == "aftermodify__rate") {
                    var afterQty = currentRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: "aftermodify__quantity" }) || 0;
                    var rate = currentRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: "aftermodify__rate" }) || 0;
                    currentRecord.setCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: "taxamount", value: afterQty * rate, ignoreFieldChange: true });
                    if(fieldId == "aftermodify__quantity") {
                        var qty = currentRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: "quantity" }) || 0;
                        if(afterQty > qty * 1.2) {
                            currentRecord.setCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: scriptContext.fieldId, value: "" });
                            return alert("变更后数量不能大于采购数量的120%，请重新填写！");
                        }
                    }
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

        function searchButtonClickEvent(e) {
            var filters = [];
            var opMapping = { "entity": "anyof", "item": "anyof", "custbody_po_buyer": "anyof",
                              "custbody_po_list_pur_type": "anyof", "tranid": "haskeywords", "custcol_external_2": "anyof" };
            for(var fieldId in opMapping) {
                var fieldValue = currentRecord.getValue(fieldId);
                if(!fieldValue) { continue; }
                filters.push("AND", [fieldId.replace('__', '.'), opMapping[fieldId], fieldValue]);
            }
            var dataCreateFrom = currentRecord.getText("datecreated_from");
            var dateCreateTo = currentRecord.getText("datecreated_to");
            var expDateFrom = currentRecord.getText("expectedreceiptdate_from");
            var expDateTo = currentRecord.getText("expectedreceiptdate_to");
            var machine = getSublistMachine("pochange_detail_sublist");
            var pageInfo = operatorDivPage();
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
            ajaxPost({
                funcName: "getDetailSublsitData",
                filters: filters,
                pageSize: pageInfo.pageSize,
                pageIndex: pageInfo.pageDataIndex
            }, function(result) {
                var lineCount = currentRecord.getLineCount({ sublistId: "pochange_detail_sublist" });
                operatorDivPage({ pageIndex: pageInfo.pageIndex, totalPage: result.totalPage, pageCount: result.dataCount });
                if(lineCount - result.data.length > -1) {
                    machine.removeAllLines();
                    lineCount = 0;
                }
                for(var line = 0, pageIndex = (pageInfo.pageDataIndex - 1) * pageInfo.pageSize + 1; line < result.data.length; line++, pageIndex++) {
                    if(lineCount < line + 1) {
                        lineCount++;
                        machine.addline(true);
                    }
                    var lineItem = result.data[line];
                    lineItem["entity"] = lineItem["vendor__internalid"];
                    lineItem["entity_display"] = lineItem["vendor__entityid"] + " " + lineItem["vendor__altname"];
                    machine.setFieldValue(line + 1, "linenumber", pageIndex);
                    for(var fieldId in lineItem) {
                        try{
                            machine.setFieldValue(line + 1, fieldId, lineItem[fieldId]);
                        } catch(e) {
                            console.log("fieldId: " + fieldId + " value: " + lineItem[fieldId]);
                        }
                    }
                }
                machine.refresheditmachine();
                stockGridHeadRow();
                if(!result.data.length) { alert("没有查找到数据！"); }
            });
        }

        function searchSubmitButtonClickEvent() {
            if(JSON.stringify(chgFieldsInfo) == "{}") {
                return dialog.alert({
                    title: '提交失败',
                    message: '您提交的表格没有数据或者提交后没有对表格的数据进行过任何变更' 
                }).then(function() {}).catch(function() {});
            }
            var today = new Date(), datas = {};
            for(var internalid in chgFieldsInfo) {
                datas[internalid] = datas[internalid] || {};
                for(var lineId in chgFieldsInfo[internalid]) {
                    var fieldsInfo = chgFieldsInfo[internalid][lineId];
                    var textStr = "_display";
                    datas[internalid][lineId] = datas[internalid][lineId] || {};
                    datas[internalid][lineId]["custbody_om_change_date"] = today.format("yy/m/d");
                    datas[internalid][lineId]["custbody_wip_documentmaker"] = nlapiGetContext().user;
                    datas[internalid][lineId]["custbody_if_change"] = true;
                    datas[internalid][lineId]["approvalstatus"] = "1";
                    for(var fieldId in fieldsInfo) {
                        var joinIndex = fieldId.indexOf("__");
                        if(joinIndex > -1) {
                            fieldId = fieldId.slice(joinIndex + 2);
                        }
                        if(fieldId.slice(-textStr.length) == textStr) {
                            fieldId = fieldId.slice(0, -textStr.length);
                        }
                        datas[internalid][lineId][fieldId] = fieldsInfo[fieldId];
                    }
                }
            }
            ajaxPost({
                funcName: "executeMapReduceChange",
                datas: datas
            }, function(result) {
                var taskId = result;
                dialog.alert({
                    title: '提交成功',
                    message: '变更数据提交成功！' 
                }).then(function() {}).catch(function() {});
                getSublistMachine("pochange_confirm_sublist").removeAllLines();
            });
        }

        function searchBatchAuditButtonClickEvent() {
            var allCount = currentRecord.getLineCount({ sublistId: "pochange_confirm_sublist" });
            var datas = {};
            if(!allCount) {
                return dialog.alert({
                    title: '提交失败',
                    message: '您提交的表格没有数据!' 
                }).then(function() {}).catch(function() {});
            }
            for(var i = allCount - 1; (datas[getFieldValue("internalid", "pochange_confirm_sublist", i)] = "BatchAudit") && i; i--);
            ajaxPost({
                funcName: "executeMapReduceChange",
                datas: datas
            }, function(result) {
                var taskId = result;
                dialog.alert({
                    title: '提交成功',
                    message: '批量审批提交成功！' 
                }).then(function() {}).catch(function() {});
                getSublistMachine("pochange_confirm_sublist").removeAllLines();
            });
        }

        function searchSubmitToConfirmClickEvent(e) {
            var lineCount = currentRecord.getLineCount({ sublistId: "pochange_detail_sublist" });
            var detailMachine = getSublistMachine("pochange_detail_sublist");
            var confirmMachine = getSublistMachine("pochange_confirm_sublist");
            var confirmLineArray = confirmMachine.getLineArray();
            for(var line = 0; line < lineCount; line++) {
                var chk = getFieldValue("checkbox", "pochange_detail_sublist", line);
                if(!chk || chk == "F") { continue; }
                var existIndex = currentRecord.findSublistLineWithValue({
                    sublistId: 'pochange_confirm_sublist',
                    fieldId: 'linenumber',
                    value: getFieldValue("linenumber", "pochange_detail_sublist", line)
                });
                if(existIndex == -1) {
                    confirmMachine.addline();
                    existIndex = currentRecord.getLineCount({ sublistId: "pochange_confirm_sublist" }) - 1;
                }
                confirmLineArray[existIndex] = detailMachine.getLineArray()[line];
            }
            confirmMachine.setLineArray(confirmLineArray);
            confirmMachine.buildtable();
            message.create({
                title: "添加成功", 
                message: "添加至变更列表成功！", 
                type: message.Type.CONFIRMATION
            }).show({ duration : 1500 });
        }

        function stockGridHeadRow() {
            var windowHeight = window.outerHeight;
            var allTableNodes = document.querySelectorAll(".uir-machine-table-container");
            for(var i = 0; i < allTableNodes.length; i++) {
                var tableNode = allTableNodes[i];
                if(tableNode.offsetHeight > windowHeight) {
                    tableNode.style.height = '70vh';
                    tableNode.addEventListener("scroll", function(e) {
                        var target = e.target || e.srcElement;
                        var styleNode = document.querySelector("#stok_grid_headrow_style_node") || document.createElement("style");
                        var sublistSelector = "#" + target.firstElementChild.id.slice(0, -7) + "_form ";
                        sublistSelector += ".uir-machine-table-container .uir-machine-headerrow," + sublistSelector + ".uir-machine-table-container .uir-list-headerrow{transform:translate(0, ";
                        styleNode.id = "stok_grid_headrow_style_node";
                        var selectorIndex = styleNode.innerHTML.indexOf(sublistSelector);
                        if(selectorIndex > -1) {
                            selectorIndex += sublistSelector.length;
                            for(var endIndex = selectorIndex; /\d/gmi.test(styleNode.innerHTML[endIndex]); endIndex++);
                            styleNode.innerHTML = styleNode.innerHTML.slice(0, selectorIndex) + target.scrollTop + styleNode.innerHTML.slice(endIndex);
                        } else {
                            styleNode.innerHTML += sublistSelector + target.scrollTop + 'px);';
                        }
                        document.head.append(styleNode);
                    });
                }
            }
        }

        function operatorDivPage(options) {
            var allDivPageNodesUp = document.querySelectorAll("#pochange_detail_sublist_layer>:first-child div[page-index]");
            var allDivPageNodesDown = document.querySelectorAll("#pochange_detail_sublist_layer>:last-child div[page-index]");
            var selectPageNode = document.querySelectorAll("#pochange_detail_sublist_layer .div_detail_sublist_page_selected");
            var totalPageNodeUp = document.querySelector("#pochange_detail_sublist_layer>:first-child div[name='div_detail_sublist_page_total_page']");
            var totalPageNodeDown = document.querySelector("#pochange_detail_sublist_layer>:last-child div[name='div_detail_sublist_page_total_page']");
            var gotoPageNodes = document.querySelectorAll("#pochange_detail_sublist_layer div[name='div_detail_sublist_page_turnto_page'] input");
            if(options == undefined) {
                var pageSizeNode = document.querySelector("#pochange_detail_sublist_layer div[name='div_detail_sublist_page_showcount_page'] select");
                var pageIndex = selectPageNode[0].getAttribute("page-index");
                return {
                    pageIndex: +pageIndex,
                    totalPage: +totalPageNodeUp.firstElementChild.innerText,
                    pageCount: +totalPageNodeUp.lastElementChild.innerText,
                    pageSize: +pageSizeNode.value,
                    pageDataIndex: pageIndex,
                    upPageIndex: Math.max(1, Math.floor(+pageIndex / 10) * 10 - 9),
                    nextPageIndex: Math.min(Math.ceil(+pageIndex / 10) * 10 + 1, +totalPageNodeUp.firstElementChild.innerText),
                    gotoIndex: gotoPageNodes[0].value || gotoPageNodes[1].value
                };
            }
            if(options.pageIndex != undefined) {
                selectPageNode[0].className = selectPageNode[0].className.replace(/\s*div_detail_sublist_page_selected/gmi, "");
                selectPageNode[1].className = selectPageNode[1].className.replace(/\s*div_detail_sublist_page_selected/gmi, "");
                options.pageIndex = Math.max(1, +options.pageIndex);
                options.pageIndex = Math.min(options.totalPage, +options.pageIndex);
                allDivPageNodesUp[((options.pageIndex? options.pageIndex: 1) - 1) % 10].className += " div_detail_sublist_page_selected";
                allDivPageNodesDown[((options.pageIndex? options.pageIndex: 1) - 1) % 10].className += " div_detail_sublist_page_selected";
                gotoPageNodes[0].value = gotoPageNodes[1].value = "";
            }
            if(options.pageIndex != undefined && options.totalPage != undefined) {
                for(var i = 0, pageIndex = Math.floor(((options.pageIndex? options.pageIndex: 1) - 1) / 10) * 10 + 1; i < allDivPageNodesUp.length; i++, pageIndex++) {
                    allDivPageNodesUp[i].style.display = pageIndex <= options.totalPage? "": "none";
                    allDivPageNodesDown[i].style.display = pageIndex <= options.totalPage? "": "none";
                    allDivPageNodesUp[i].firstElementChild.innerText = pageIndex;
                    allDivPageNodesDown[i].firstElementChild.innerText = pageIndex;
                    allDivPageNodesUp[i].setAttribute("page-index", pageIndex);
                    allDivPageNodesDown[i].setAttribute("page-index", pageIndex);
                }
            }
            if(options.totalPage != undefined) {
                totalPageNodeUp.firstElementChild.innerText = options.totalPage;
                totalPageNodeDown.firstElementChild.innerText = options.totalPage;
            }
            if(options.pageCount != undefined) {
                totalPageNodeUp.lastElementChild.innerText = options.pageCount;
                totalPageNodeDown.lastElementChild.innerText = options.pageCount;
            }
        }

        function divSublistPageClickEvent(e) {
            var target = e.target || e.srcElement;
            var divPageInfo = operatorDivPage();
            var text = (target.innerText || "").trim(), currPageIndex;
            if(/首页/gmi.test(text)) {
                currPageIndex = 1;
            } else if(/尾页/gmi.test(text)) {
                currPageIndex = divPageInfo.totalPage;
            } else if(/上一页/gmi.test(text)) {
                currPageIndex = divPageInfo.upPageIndex;
            }  else if(/下一页/gmi.test(text)) {
                currPageIndex = divPageInfo.nextPageIndex;
            } else if(target.nodeName.toLowerCase() == "select") {

            } else if(/^\d+$/gmi.test(text)) {
                currPageIndex = text;
            } else if(/Go/gmi.test(text)) {
                currPageIndex = divPageInfo.gotoIndex;
            } else {
                return;
            }
            if(divPageInfo.pageIndex == currPageIndex || (!currPageIndex && currPageIndex != 0) || currPageIndex < 1 || currPageIndex > divPageInfo.totalPage) { return; }
            operatorDivPage({ pageIndex: currPageIndex, totalPage: divPageInfo.totalPage });
            searchButtonClickEvent();
        }

        function poChangeDetailSublistClickEvent(e) {
            var target = e.target || e.srcElement;
            var sublistId = "pochange_detail_sublist";
            var machine = getSublistMachine(sublistId);
            var lineCount = currentRecord.getLineCount({ sublistId: sublistId });
            if(target.parentElement.getAttribute("data-label", ' ')) {
                var setCheckboxValue = function(value) {
                    for(var i = 0; i < lineCount; i++) {
                        try{
                            setFieldValue("checkbox", value, sublistId, i);
                        } catch(e) {
                            setFieldValue("checkbox", value == "T", sublistId, i);
                        }
                    }
                    machine.buildtable();
                    target = document.querySelector("#pochange_detail_sublist_headerrow td[data-label=\" \"] .listheader");
                };
                if(/pochange_detail_sublist_headerrow_checkbox_selected/gmi.test(target.className)) {//取消全选
                    setCheckboxValue("F");
                    target.className = target.className.replace(/^\s*pochange_detail_sublist_headerrow_checkbox_selected$/gmi, "");
                } else {//全选
                    setCheckboxValue("T");
                    target.className += " pochange_detail_sublist_headerrow_checkbox_selected";
                }
            }
            setTimeout(function() {
                for(var i = lineCount - 1; i > -1 && (getFieldValue("checkbox", sublistId, i) == "T" || getFieldValue("checkbox", sublistId, i) === true); i--);
                target = document.querySelector("#pochange_detail_sublist_headerrow td[data-label=\" \"] .listheader");
                if(i == -1) {
                    target.className += " pochange_detail_sublist_headerrow_checkbox_selected";
                } else {
                    target.className = target.className.replace(/^\s*pochange_detail_sublist_headerrow_checkbox_selected$/gmi, "");
                }
            }, 100);
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

        function getSublistMachine(sublistId) {
            return Ext.get(sublistId + "_splits").dom.machine;
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
            searchButtonClickEvent: searchButtonClickEvent,
            searchSubmitButtonClickEvent: searchSubmitButtonClickEvent,
            searchSubmitToConfirmClickEvent: searchSubmitToConfirmClickEvent,
            searchBatchAuditButtonClickEvent: searchBatchAuditButtonClickEvent
        };
    }
);
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
                height: "600px",
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
            var submitGridInstance = new SearchListGrid(gridConfig);
            document.querySelector("#po_batch_auditral_submit_sublist_splits").parentElement.innerHTML = submitGridInstance.create().outerHTML;
            var auditralGridInstance = new SearchListGrid(deepCopy(gridConfig));
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

        function SearchListGrid(option) {
            option = option || {};
            var _lineArray = option.data || [], _columns = initColumns(option.columns);
            var gridId = createRandomId();
            var selectedLines = [];
            var gridNode = document.createElement("div");
            var showSerialNumber = option.showSerialNumber || false, showCheckBox = option.showCheckBox || false;
            var beforeMouseWheelEvent = document.onmousewheel;
            var lastTarget, height = option.height || "70vh";
            var notDataLine = '<tr><td class="uir-nodata-row listtexthl" colspan="' + (_columns.length + showCheckBox + showSerialNumber) + '">没有记录可显示。</td></tr>';
            var gridStyle = option.style || "";
            beforeMouseWheelEvent = beforeMouseWheelEvent || window.onmousewheel;
            lineHeight = 20, headerHeight = 24;
            gridNode.style = "max-height:" + height + ";height:auto;overflow:hidden;position:relative;padding: 5px 0 10px 0;";
            gridNode.id = gridId;
            window.searchListGridScrollEvent = rhysDefineGridEventCentre;
            var machine = {
                getLineArray: function() { return _lineArray; },
                setLineArray: function(lineArray) {
                    _lineArray = lineArray;
                    selectedLines = [];
                    this.setScrollHeight();
                    searchListGridScrollEvent();
                },
                getFieldValue: function(fieldId, line) {
                    var pos = this.getFieldPos(fieldId);
                    return _lineArray[line] && _lineArray[line][pos];
                },
                setFieldValue: function(fieldId, value, line) {
                    var pos = this.getFieldPos(fieldId);
                    _lineArray[line] && (_lineArray[line][pos] = value);
                },
                getLineCount: function() {
                    return _lineArray.length;
                },
                refrashGrid: function() {
                    this.setScrollHeight();
                    searchListGridScrollEvent();
                },
                buildGrid: function() {

                },
                getLineArrayLine: function(line) {
                    return _lineArray[line];
                },
                setLineArrayLine: function(lineArrayLine, line) {
                    if(isNaN(+line)) { return; }
                    _lineArray[+line] = lineArrayLine;
                    this.setScrollHeight();
                    searchListGridScrollEvent();
                },
                clear: function() {
                    _lineArray = [];
                    selectedLines = [];
                    this.setScrollHeight();
                    searchListGridScrollEvent();
                },
                splice: function(startLine, deleteCount, insertItems) {
                    //remove line from selectlines
                    var argumentsArray = Array.prototype.slice.call(arguments, 2);
                    _lineArray.splice(arguments[0], arguments[1], argumentsArray);
                    this.setScrollHeight();
                    searchListGridScrollEvent();
                },
                getEmptyLine: function() {
                    var emptyLine = [];
                    for(var i = 0; i < _columns.length; i++) {
                        emptyLine.push("");
                    }
                    return emptyLine;
                },
                getFieldPos: function(fieldId) {
                    if(fieldId == undefined || fieldId == "") { return -1; }
                    for(var i = 0; i < _columns.length && _columns[i].fieldId != fieldId; i++) ;
                    return i == _columns.length? -1: i;
                },
                getControlType: function(fieldId) {
                    return _columns[this.getFieldPos(fieldId)].type;
                },
                get columns() {
                    return _columns;
                },
                set columns(newColumns) {
                    _columns = newColumns;
                    _lineArray = [];
                    this.create();
                },
                getColumn: function(fieldId) {
                    return _columns[this.getFieldPos(fieldId)];
                },
                moveColumns: function(fieldId, columnOrStep) {
                    var nextFieldId = typeof columnOrStep == "string"? columnOrStep: "";
                    var setp = isNaN(+columnOrStep)? 0: +columnOrStep;
                    var currPos = this.getFieldPos(fieldId);
                    var nextPos = nextFieldId? this.getFieldPos(nextFieldId): -1;
                    var exItem, firstLineIndex;
                    if(nextPos == -1 && setp) {
                        firstLineIndex = +showSerialNumber + showCheckBox;
                        nextPos = currPos + setp;
                        nextPos = nextPos < firstLineIndex? firstLineIndex: nextPos >= _columns.length? _columns.length - 1: nextPos;
                    }
                    if(nextPos < 0 || currPos < 0) { return; }
                    exItem = _columns[currPos], _columns[currPos] = _columns[nextPos], _columns[nextPos] = exItem;
                    for(var i = 0, lineArrayLine; i < _lineArray.length; i++) {
                        lineArrayLine = _lineArray[i];
                        exItem = lineArrayLine[currPos], lineArrayLine[currPos] = lineArrayLine[nextPos], lineArrayLine[nextPos] = exItem;
                    }
                    this.create();
                },
                getSelectLines: function() { return selectedLines; },
                selectedLines: function(lines) {
                    lines = typeof lines != "object"? [lines]: lines;
                    for(var index in lines) {
                        var line = parseInt(lines[index]);
                        if(isNaN(line) || !(line > -1 && line < this.getLineCount()) || selectedLines.indexOf(line + "") > -1) { continue; }
                        selectedLines.push(line + "");
                    }
                    searchListGridScrollEvent(undefined, gridNode.querySelector("#search_list_grid>tbody>:first-child").getAttribute("row"));
                },
                unSelectedLines: function(lines) {
                    lines = typeof lines != "object"? [lines]: lines;
                    for(var index in lines) {
                        var idx = selectedLines.indexOf(lines[index] + "");
                        if(idx == -1) { continue; }
                        selectedLines.splice(idx, 1);
                    }
                    searchListGridScrollEvent(undefined, gridNode.querySelector("#search_list_grid>tbody>:first-child").getAttribute("row"));
                },
                create: function() {
                    _lineArray = Array.isArray(_lineArray)? _lineArray: [];
                    var tbody = "<div><table id='search_list_grid' class='listtable listborder openList uir-list-table' border='1' cellspacing='0' rules='all' style='width:100%;height:auto;max-height:100%;" + gridStyle + "'>\
                    <thead><tr class='uir-list-headerrow noprint'>" + (showSerialNumber? "<th class='listheadertdleft listheadertextb uir-list-header-td' style='width:40px;'>\
                    <span class='listheader'>序号</span></th>": "") + (showCheckBox? "<th class='listheadertdleft listheadertextb uir-list-header-td' style='width:60px;'>\
                    <span><input name='search_list_grid_selectall' style='margin: 0 4px !important;vertical-align: middle;padding:0 !important;' type='checkbox'/></span><span class='listheader'>全选</span></th>": "");
                    for(var i = 0; i < _columns.length; i++) {
                        if((_columns[i].type || "").toLowerCase() == "hidden") { continue; }
                        tbody += "<th class='listheadertdleft listheadertextb uir-list-header-td'" + (_columns[i].width > 30? " style='width:" + _columns[i].width + "px;'": "") 
                        + " fielid='" + _columns[i].fieldId + "'>" + getCellControl(_columns[i].label) + "<div class='search_list_grid_drag_flag'></div></th>";
                    }
                    tbody += "</tr></thead><tbody>" + notDataLine + "</tobdy></table></div><div id='search_list_grid_scroll' style='max-width:100%;'><div></div></div>";
                    gridNode.innerHTML = tbody;
                    this.setStyles();
                    this.setScrollHeight();
                    var that = this;
                    setTimeout(function() {
                        that.gridNode = gridNode = document.querySelector("#" + that.gridId);
                        var scrollHeight = parseInt(gridNode.style.maxHeight) || parseInt(gridNode.style.height) || gridNode.clientHeight || 50;
                        var scrollNode = gridNode.querySelector("#search_list_grid_scroll");
                        var tableNode = gridNode.querySelector("#search_list_grid");
                        gridNode.machine = that;
                        searchListGridScrollEvent();
                        scrollNode.onscroll = searchListGridScrollEvent;
                        tableNode.onclick  = tableNode.ondbclick = rhysDefineGridEventCentre;
                        document.body.addEventListener("mousedown", rhysDefineGridEventCentre);
                        document.body.addEventListener("mousemove", rhysDefineGridEventCentre);
                        document.body.addEventListener("mouseup", rhysDefineGridEventCentre);
                        window.onmousewheel = document.onmousewheel = mouseWheelEvent;
                        scrollNode.style = "max-height:" + scrollHeight + "px;";
                    }, 0);
                    return gridNode;
                },
                setStyles: function() {
                    var style = document.createElement("style");
                    style.id = "search_list_grid_styles";
                    style.innerHTML = "#search_list_grid_contains{\
                        overflow:hidden;\
                        height:100%;\
                    }\
                    #search_list_grid_contains>:first-child{\
                        overflow:auto;\
                        width:95%;\
                        overflow-y:hidden;\
                    }\
                    #search_list_grid_contains table>thead>tr>th>span{\
                        font-size:13px !important;\
                        cursor:default;\
                    }\
                    #search_list_grid_contains table>thead>tr>th{\
                        padding:6px 5px !important;\
                    }\
                    #search_list_grid_contains table input[type='checkbox']{\
                        height:15px;\
                        width:15px;\
                        margin: 0;\
                        border: 0;\
                    }\
                    #search_list_grid_contains table>tbody>tr>td{\
                        height: 16px !important;\
                        padding: 0 2px !important;\
                        border: 0 !important;\
                    }\
                    #search_list_grid_contains table>tbody>tr>td>span{\
                        font-size: 13px !important;\
                        cursor:default;\
                    }\
                    #search_list_grid_contains>div{\
                        height:100%;\
                        float:left;\
                    }\
                    #search_list_grid_scroll{\
                        overflow:auto;\
                        height:100%;\
                        width:17px;\
                        right:0;\
                        position:absolute;\
                    }\
                    #search_list_grid_scroll>div{\
                        width:17px;\
                    }\
                    #search_list_grid input.ns_grid_cell_text_css{\
                        width:100%;\
                        overflow:hidden;\
                        border:none !important;\
                        background:none !important;\
                        background-color:transparent;\
                        padding:0 !important;\
                        margin:0 !important;\
                        box-shadow:none;\
                        cursor:default;\
                    }\
                    #search_list_grid .listtext{\
                        line-height: " + (lineHeight - 1) + "px !important;\
                        height: " + (lineHeight - 1) + "px !important;\
                        padding: 0 5px !important;\
                    }\
                    #search_list_grid .uir-list-header-td, #search_list_grid .uir-machine-headerrow>td{\
                        padding: 3px 5px !important;\
                        vertical-align: middle;\
                        height: " + headerHeight + "px !important;\
                    }\
                    #search_list_grid .search_list_grid_drag_flag{\
                        width:5px;\
                        height:100%;\
                        top:0;\
                        right:0;\
                        position:absolute;\
                        border:none;\
                        padding:0;\
                        margin:0;\
                        background-color:transparent !important;\
                        cursor:ew-resize !important;\
                    }\
                    #search_list_grid thead th.uir-list-header-td{\
                        position:relative !important;\
                    }";
                    document.head.appendChild(style);
                },
                setScrollHeight: function() {
                    var scrollEl = gridNode.querySelector("#search_list_grid_scroll>div");
                    scrollEl.style = "height:" + ((_lineArray.length) * lineHeight + headerHeight) + "px;width:17px";
                },
                gridNode: gridNode,
                gridId: gridId
            };
            return machine;

            function getGridLoadCount() {
                return Math.floor(((parseInt(gridNode.style.maxHeight) || parseInt(gridNode.style.height) || gridNode.clientHeight || 50) - headerHeight) / lineHeight);
            }

            function initColumns(columns) {
                for(var col = 0, newColumns = []; col < columns.length; col++) {
                    if((columns[col].type || "").toLowerCase() == "select") {
                        newColumns.push({ fieldId: columns[col].fieldId, type: "HIDDEN", label: columns[col].label });
                        columns[col].fieldId += "_display";
                    }
                    newColumns.push(columns[col]);
                }
                return newColumns;
            }

            var dragStatus, sMousePos, thNode, tableNode, currCellWidth, lastCellWidth, tableWidth;
            function rhysDefineGridEventCentre(el) {
                el = el || window.event;
                var target = el.target || el.srcElement;
                var canDrag = target.className == "search_list_grid_drag_flag";
                var styleNode = document.querySelector("#search_list_grid_expand_cell_styles") || document.createElement("style");
                styleNode.id = "search_list_grid_expand_cell_styles";
                var replaceCellWidth = function(styleNode, str, width) {
                    var index = styleNode.innerHTML.indexOf(str);
                    if(index > -1) {
                        index += str.length;
                        for(var lastIndex = index + 1; lastIndex < styleNode.innerHTML.length && /\d/.test(styleNode.innerHTML[lastIndex]); lastIndex++);
                        styleNode.innerHTML = styleNode.innerHTML.slice(0, index) + width + styleNode.innerHTML.slice(lastIndex);
                    } else {
                        styleNode.innerHTML += "\n" + str + width + "px !important;}";
                    }
                }
                var e = {
                    click: function(e) {
                        gridClickEvent(e);
                        option.event && typeof option.event.click == "function" && option.event.click(el, machine);
                    },
                    mousedown: function(el) {
                        if(lastTarget && lastTarget != target.parentNode && lastTarget.firstElementChild && 
                        lastTarget.firstElementChild.className != "ns_grid_cell_text_css" && lastTarget.firstElementChild.value !== undefined) {
                            var value = lastTarget.firstElementChild.value;
                            if(lastTarget.firstElementChild.selectedOptions) {
                                _lineArray[lastTarget.getAttribute("row")][+lastTarget.getAttribute("col") - 1] = value;
                                value = lastTarget.firstElementChild.selectedOptions[0].getAttribute("text");
                            }
                            _lineArray[lastTarget.getAttribute("row")][lastTarget.getAttribute("col")] = value;
                            lastTarget.innerHTML = getCellControl(value);
                            lastTarget = null;
                        }
                        if(!canDrag) { return; }
                        dragStatus = true;
                        sMousePos = el.x;
                        while(target != document.body) {
                            if(target.nodeName.toLowerCase() == "th") {
                                thNode = target;
                            } else if(target.machine) {
                                tableNode = target;
                                break;
                            }
                            target = target.parentNode;
                        }
                        currCellWidth = thNode.offsetWidth;
                        lastCellWidth = thNode.parentNode.children[thNode.parentNode.children.length - 1].offsetWidth;
                        tableWidth = tableNode.offsetWidth;
                        styleNode.innerHTML += "\n*{cursor:ew-resize !important;}";
                        document.head.append(styleNode);
                    },
                    mousemove: function(el) {
                        if(!dragStatus) { return; }
                        var det = el.x - sMousePos;
                        var detWidth = currCellWidth + det;
                        detWidth = detWidth < 10? 10: detWidth;
                        var children = thNode.parentNode.children;
                        for(var i = children.length - 1, extendTabeWidth = thNode == children[i--]; i > -1 && !extendTabeWidth; i--) {
                            extendTabeWidth = children[i].offsetWidth <= 10 && children[i] != thNode;
                        }
                        for(var i = children.length - 1; i > -1 && children[i] != thNode; i--) ;
                        if(extendTabeWidth) {
                            replaceCellWidth(styleNode, "#" + tableNode.machine.gridId + " #search_list_grid{width: ", tableWidth + (det > 0? det: 0));
                        } else {
                            var tempStr = "#" + tableNode.machine.gridId + " #search_list_grid thead tr>:nth-child(";
                            replaceCellWidth(styleNode, tempStr + (i + 1) + "){width: ", detWidth);
                            replaceCellWidth(styleNode, tempStr + children.length + "){width: ", lastCellWidth - det);
                        }
                    },
                    mouseup: function(el) {
                        if(!dragStatus) { return; }
                        dragStatus = false;
                        styleNode.innerHTML = styleNode.innerHTML.replace(/\n\*{cursor:ew-resize !important;}/gmi, "");
                    }
                }
                e[el.type] && e[el.type](el);
            }

            function searchListGridScrollEvent(el, startLine) {
                var node = el? el.target || el.srcElement: { scrollTop: 0 };
                var startLine = +startLine > -1? +startLine: Math.round((node.scrollTop || 0) / lineHeight);
                var tr = "", endLine = startLine + getGridLoadCount();
                gridNode.firstElementChild.style = "width:" + (gridNode.clientWidth? (gridNode.clientWidth + (endLine - startLine <= _lineArray.length? 0: 17)) + "px": "100%")
                 + ";float:left;height:100%;overflow-y:hidden;overflow-x:auto;max-height:" + height + "px;";;
                for(var i = startLine; i < _lineArray.length && i < endLine; i++) {
                    var isSelected = selectedLines.indexOf(i + "") > -1;
                    tr += "<tr row='" + i + "' class='uir-list-row-tr uir-list-row-" + (i % 2? "even": "odd") + " " + (isSelected? " listfocusedrow": "") + "'>" + (showSerialNumber?
                         "<td class='listtext uir-list-row-cell'><span>" + (i + 1) + "</span></td>": "") +
                          (showCheckBox? "<td class='listtext uir-list-row-cell'><span><input style='margin: 0 4px !important;vertical-align: middle;padding:0 !important;'\
                          name='search_list_grid_selectone' " + (isSelected? "checked ": "") + "type='checkbox'></span></td>": "");
                    for(var j = 0; j < _columns.length; j++) {
                        if((_columns[j].type || "").toLowerCase() == "hidden") { continue; }
                        tr += "<td class='listtext uir-list-row-cell' row='" + i + "' col='" + j + "'>" + getCellControl(_lineArray[i][j]) + "</td>";
                    }
                    tr += "</tr>";
                }
                var checkboxNode = gridNode.querySelector("tr>th input[type='checkbox'][name='search_list_grid_selectall'");
                gridNode.querySelector("tbody").innerHTML = "<tbody>" + (tr || notDataLine) + "</tbody>";
                checkboxNode && (checkboxNode.checked = _lineArray.length && selectedLines.length == _lineArray.length);
            }
           
            function gridClickEvent(el) {
                el = el || window.event;
                var target = el.target || el.srcElement, checkboxs = [], trNode, row, tdNode = target;
                if(target.name == "search_list_grid_selectall") {
                    checkboxs = gridNode.querySelectorAll("tr>td input[type='checkbox'][name='search_list_grid_selectone']");
                    selectedLines = [];
                    for(var i = 0; i < checkboxs.length; i++) {
                        trNode = checkboxs[i].parentNode.parentNode.parentNode;
                        checkboxs[i].checked = target.checked;
                        trNode.className = (target.checked? trNode.className + " listfocusedrow": trNode.className.replace(/\s+listfocusedrow/gmi, ""));
                    }
                    for(var i = 0; i < _lineArray.length && target.checked; i++) {
                        selectedLines.push(i + "");
                    }
                } else if(target.name == "search_list_grid_selectone") {
                    trNode = target.parentNode.parentNode.parentNode;
                    row = trNode.getAttribute("row");
                    if(target.checked) {
                        selectedLines.push(row);
                        trNode.className += " listfocusedrow";
                    } else {
                        selectedLines.splice(selectedLines.indexOf(row), 1);
                        trNode.className = trNode.className.replace(/\s+listfocusedrow/gmi, "");
                    }
                    gridNode.querySelector("tr>th input[type='checkbox'][name='search_list_grid_selectall'").checked = _lineArray.length && selectedLines.length == _lineArray.length;
                }
                while(tdNode && tdNode.nodeName.toLowerCase() != "td") {
                    tdNode = tdNode.parentNode;
                }
                if(!tdNode) { return; }
                if(lastTarget && lastTarget.firstElementChild && lastTarget != tdNode) {
                    if(lastTarget.firstElementChild.value !== undefined) {
                        var value = lastTarget.firstElementChild.value;
                        if(lastTarget.firstElementChild.selectedOptions) {
                            _lineArray[lastTarget.getAttribute("row")][+lastTarget.getAttribute("col") - 1] = value;
                            value = lastTarget.firstElementChild.selectedOptions[0].getAttribute("text");
                        }
                        _lineArray[lastTarget.getAttribute("row")][lastTarget.getAttribute("col")] = value;
                        lastTarget.innerHTML = getCellControl(value);
                    }
                }
                if(lastTarget != tdNode){
                    for(var i = tdNode.parentNode.children.length - 1; i > -1 && tdNode.parentNode.children[i] != tdNode; i--);
                    if(i > -1) {
                        var fieldId = gridNode.querySelectorAll(".uir-list-headerrow>th")[i].getAttribute("fielid");
                        var pos = machine.getFieldPos(fieldId);
                        if(_columns[pos] === undefined) { return; }
                        if(typeof _columns[pos].data == "function") {
                            _columns[pos].data(function(data) {
                                _columns[pos].data = data;
                                tdNode.innerHTML = createControl(_columns[pos], _lineArray[tdNode.getAttribute("row")]
                                [+tdNode.getAttribute("col") + (["select", "date"].indexOf(_columns[pos].type) > -1? -1: 0)]);
                            });
                        } else {
                            var innerHTML = createControl(_columns[pos], _lineArray[tdNode.getAttribute("row")]
                            [+tdNode.getAttribute("col") + (["select", "date"].indexOf(_columns[pos].type) > -1? -1: 0)]);
                            if(innerHTML) {
                                tdNode.innerHTML = innerHTML;
                            }
                        }
                        if(typeof _columns[pos].onchange == "function") {
                            tdNode.style.position = "relative";
                            tdNode.firstElementChild.onchange = _columns[pos].onchange;
                        }
                    }
                }
                lastTarget = tdNode;
            }

            function getCellControl(value) {
                return "<input type='text' class='ns_grid_cell_text_css' title='" + value + "' value='" + value + "' readonly/>";
            }

            function createControl(column, value) {
                var control = "";
                if(!column.editable) { return control; }
                var type = (column.type || "").toLowerCase(), data = column.data;
                data = data == undefined? "": data;
                switch(type) {
                    case "text":
                    case "number":
                        control = "<input type='text' style='width:auto;height:19px !important;min-width:100px;max-width:300px;' value='" + value +  "'/>"
                        break;
                    case "select":
                        control = "<select style='width:auto;height:100%;min-width: 100px;max-width:300px;padding:0 5px !important;height:19px !important;'>";
                        control += setDropDownData(data, value);
                        control += "</select>";
                        break;
                }
                return control;
            }

            function setDropDownData(data, value) {
                var options = "";
                data = !data || !data.length? [{ value: "", text: "" }]: data;
                for(var i = 0; i < data.length; i++) {
                    options += "<option value='" + data[i].value + "' text=" + data[i].text + (value == data[i].value || value == data[i].text? " selected": "") + ">" + data[i].text + "</option>";
                }
                return options;
            }

            function mouseWheelEvent(e) {
                beforeMouseWheelEvent && beforeMouseWheelEvent(e);
                e = e || window.event;
                var target = e.target || e.srcElement;
                var value = 0;
                var table = target;
                while(table != document.body && table.nodeName.toLowerCase() != "table") {
                    table = table.parentNode;
                }
                if(table == document.body || table.id !== "search_list_grid") { return; }
                if(e.wheelDelta) {//IE/Opera/Chrome
                    value = e.wheelDelta;
                } else if(e.detail) {//Firefox
                    value = e.detail;
                }
                table.parentNode.nextElementSibling.scrollTop -= value;
                e.stopPropagation();
                return false;
            }

            function createRandomId() {
                return "grid_" + (Math.random() * 10000000).toString(16).substr(0,4) + '_' + (new Date()).getTime() +'_'+ Math.random().toString().substr(2,5);
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
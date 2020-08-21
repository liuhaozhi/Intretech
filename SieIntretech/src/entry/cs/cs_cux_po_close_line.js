/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/url', 'N/https', 'N/ui/dialog', "N/format"],
    /**
     * @param {record} record
     * @param {search} search
     */
    function(record, search, url, https, dialog, format) {
        var currentRecord, gridIntance, searchCount = 0;
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
            initPurchsOrderSublist();
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

        function initPurchsOrderSublist() {
            currentRecord.setValue("subsidiary", nlapiGetContext().subsidiary);
            gridIntance = new SearchListGrid({
                showCheckBox: true,
                showSerialNumber: true,
                height: 600,
                columns: [
                            { label: "POID", fieldId: "internalid", type: "hidden" },
                            { label: "货品", fieldId: "item", type: "hidden" },
                            { label: "货品", fieldId: "item_display", temple: function(context) {
                                var recordId = context.machine.getFieldValue("item", context.row);
                                var valueControl = '<input type="text" class="ns_grid_cell_text_css dottedlink" title="' + context.value + '" value="' + context.value + '" readonly="">';
                                return "<a class='dottedlink' target='_blank' href='/app/common/item/item.nl?id=" + recordId + "'>" + valueControl + "</a>";
                            }},
                            { label: "子公司", fieldId: "subsidiary", type: "hidden" },
                            { label: "子公司", fieldId: "subsidiary_display", temple: function(context) {
                                var recordId = context.machine.getFieldValue("subsidiary", context.row);
                                var valueControl = '<input type="text" class="ns_grid_cell_text_css dottedlink" title="' + context.value + '" value="' + context.value + '" readonly="">';
                                return "<a class='dottedlink' target='_blank' href='/app/common/otherlists/subsidiarytype.nl?id=" + recordId + "&e=T&whence='>" + valueControl + "</a>";
                            }},
                            { label: "数量", fieldId: "quantity" },
                            { label: "名称", fieldId: "vendor_altname" },
                            { label: "日期", fieldId: "trandate" },
                            { label: "文件号码", fieldId: "tranid", temple: function(context) {
                                var recordId = context.machine.getFieldValue("internalid", context.row);
                                var valueControl = '<input type="text" class="ns_grid_cell_text_css dottedlink" title="' + context.value + '" value="' + context.value + '" readonly="">';
                                return "<a class='dottedlink' target='_blank' href='/app/accounting/transactions/purchord.nl?id=" + recordId + "&e=T&whence='>" + valueControl + "</a>";
                            }},
                            { label: "行序号", fieldId: "linesequencenumber", type: "hidden"  },
                            { label: "已实施数量/已收货数量", fieldId: "quantityshiprecv" },
                            { label: "装运数量", fieldId: "quantityonshipments" },
                            { label: "已履行量/已收货量(行层次)", fieldId: "shiprecvstatusline", type: "hidden" },
                            { label: "已履行量/已收货量(行层次)", fieldId: "shiprecvstatusline_display", width: 100 },
                            { label: "已关闭", fieldId: "closed", type: "hidden" },
                            { label: "已关闭", fieldId: "closed_display" },
                            { label: "行关闭日期", fieldId: "custcol_close_date" },
                            { label: "行关闭人", fieldId: "custcol_line_close_employee", type: "hidden" },
                            { label: "行关闭人", fieldId: "custcol_line_close_employee_display" },
                            { label: "行关闭原因", fieldId: "custcol_close_reason", type: "text", width: 200 }
                        ],
                data: []
            });
            var sublistNode = document.querySelector("#cux_po_close_line_splits").parentElement;
            sublistNode.innerHTML = "";
            sublistNode.append(gridIntance.create());
        }

        function searchButtonClickEvent(e) {
            gridIntance.clear();
            searchCount++;
            dynamicGetLineArray(gridIntance, 0, 0, searchCount);
        }

        function searchSubmitClickEvent(e) {
            if(!gridIntance.getSelectLines().length) {
                return dialog.alert({
                    title: '提交失败',
                    message: '请至少选择一条记录提交。' 
                }).then(function() {}).catch(function() {});
            }
            ajaxPost(url.resolveScript({
                scriptId: 'customscript_rl_cux_po_close_line',
                deploymentId: 'customdeploy_rl_cux_po_close_line'
            }), {
                funcName: "closedPoLine",
                data: getPoCloseLineData()
            }, function(result) {
                dialog.alert({
                    title: '提交成功',
                    message: '提交成功！请到对应的PO行上查看进度！' 
                }).then(function() {}).catch(function() {});
                console.log("Map/Reduce Id: " + result.body);
            });
            // debugger
            // var data = getPoCloseLineData();
            // for(var poId in data) {
            //     map({ key: poId, value: JSON.stringify(data[poId]) });
            // }
            // function map(context) {
            //     var poId = context.key;
            //     var values = JSON.parse(context.value);
            //     var poRecord = record.load({
            //         type: "purchaseorder",
            //         id: poId,
            //         isDynamic: true
            //     });
            //     var sublistId = "item";
            //     for(var index in values) {
            //         var lineData = values[index];
            //         lineData.linesequencenumber = +lineData.linesequencenumber - 1;
            //         poRecord.selectLine({ sublistId: sublistId, line: lineData.linesequencenumber });
            //         poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "custcol_close_reason", value: lineData.custcol_close_reason });
            //         if(!lineData.custcol_line_close_employee) {
            //             poRecord.commitLine({ sublistId: sublistId });
            //             return poRecord.save();
            //         }
            //         lineData.custcol_line_close = format.parse({
            //             type: format.Type.DATE,
            //             value: new Date(lineData.custcol_line_close)
            //         });
            //         poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "custcol_line_close_employee", value: lineData.custcol_line_close_employee });
            //         poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "custcol_line_close", value: lineData.custcol_line_close });
            //         if(lineData.quantity && lineData.quantityshiprecv == 0) {
            //             poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "isclosed", value: true });
            //         } else if(lineData.quantity != lineData.quantityshiprecv) {
            //             var leaveQuantity = lineData.quantity - lineData.quantityshiprecv;
            //             poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "quantity", value: lineData.quantityshiprecv });
            //             poRecord.commitLine({ sublistId: sublistId });
            //             poRecord.insertLine({ sublistId: sublistId, line: lineData.linesequencenumber + 1 });
            //             var fields = ["item", "units", "rate", "taxcode", "taxrate1", "custcol_po_moq_number", "expectedreceiptdate", "custcolcustcol_pr_mim_quantutity",
            //                             "custcol_pr_cancel_window", "custcol_pr_suggest_date", "custcol_po_price_updatest_date", "custcol_pr_cux_pr_doc_number"];
            //             //poRecord.getSublistFields({ sublistId: sublistId });
            //             /*货品、采购单位 、单价 、税码、税率、MOQ、预计收货日期、批量增量、订单取消窗口期、建议采购日期，最新价格对应生效日期、CUX-PR单号  */
            //             for(var index in fields) {
            //                 var fieldId = fields[index];
            //                 var value = poRecord.getSublistValue({ sublistId: sublistId, fieldId: fieldId, line: lineData.linesequencenumber});
            //                 try{
            //                     poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: fieldId, value: value });
            //                 } catch(e) {
            //                     log.debug("Set Value Error", e.message);
            //                 }
            //             }
            //             poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "quantity", value: leaveQuantity });
            //             poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "quantityonshipments", value: "0" });
            //             poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "isclosed", value: true });
            //         } else {
            //             poRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: "isclosed", value: lineData.closed == "F" });
            //         }
            //         poRecord.commitLine({ sublistId: sublistId });
            //     }
            //     poRecord.save();
            //     log.debug("Success", "提交处理成功");
            // }
        }

        function searchSubmitMemoClickEvent(e) {
            var datas = {}, closeDate = (new Date).format("yy-m-d");
            var selectLines = gridIntance.getSelectLines();
            for(var index in selectLines) {
                var line = selectLines[index];
                var poId = gridIntance.getFieldValue("internalid", line);
                datas[poId] = datas[poId] || [];
                datas[poId].push({
                    custcol_close_reason: gridIntance.getFieldValue("custcol_close_reason", line)
                });
            }
            if(!selectLines.length) {
                return dialog.alert({
                    title: '提交失败',
                    message: '请至少选择一条记录提交。' 
                }).then(function() {}).catch(function() {});
            }
            ajaxPost(url.resolveScript({
                scriptId: 'customscript_rl_cux_po_close_line',
                deploymentId: 'customdeploy_rl_cux_po_close_line'
            }), {
                funcName: "closedPoLine",
                data: datas
            }, function(result) {
                dialog.alert({
                    title: '提交成功',
                    message: '提交成功！请到对应的PO行上查看进度！' 
                }).then(function() {}).catch(function() {});
                console.log("Map/Reduce Id: " + result.body);
            });
        }

        function addMemoButtonClickEvent(e) {
            var value = document.querySelector('#cstm_page_add_memo_btn').getAttribute('textareavalue');
            dialog.create({
                title: '添加行备注',
                message: '<div class="uir-field-wrapper" data-field-type="textarea"><span id="description_fs_lbl_uir_label" class="smallgraytextnolink uir-label "><span id="description_fs_lbl" class="labelSpanEdit smallgraytextnolink" style="">说明\
                </span></span><span class="uir-field uir-resizable"><span id="description_fs" data-fieldtype="" class="effectStatic" style="white-space: nowrap" data-helperbutton-count="0"><textarea name="description" id="description" rows="3"\
                 class="input textarea" wrap="VIRTUAL" onchange="document.querySelector(\'#cstm_page_add_memo_btn\').setAttribute(\'textareavalue\', this.value)" \
                 aria-labelledby="description_fs_lbl" style="width: 350px" cols="40" onfocus="this.isvalid=false;" onblur="return this.isvalid;" onkeypress="event.cancelBubble = true; return true;"></textarea>\
                </span></span></div>',
                buttons: [
                    { label: '添加', value: 1 },
                    { label: '取消', value: 2 }
                ]
            }).then(function() {
                if(arguments[0] == 2) {
                    return document.querySelector('#cstm_page_add_memo_btn').setAttribute('textareavalue', "");
                }
                var selectLines = gridIntance.getSelectLines();
                value = document.querySelector('#cstm_page_add_memo_btn').getAttribute('textareavalue');
                for(var index in selectLines) {
                    gridIntance.setFieldValue("custcol_close_reason", value, selectLines[index]);
                }
                gridIntance.refrashGrid();
            });
            setTimeout(function(){ document.querySelector("textarea#description").value = value; }, 0);
        }

        function getPoCloseLineData() {
            var datas = {};
            var selectLines = gridIntance.getSelectLines();
            for(var index in selectLines) {
                var line = selectLines[index];
                var poId = gridIntance.getFieldValue("internalid", line);
                datas[poId] = datas[poId] || [];
                datas[poId].push({
                    quantity: gridIntance.getFieldValue("quantity", line),
                    quantityshiprecv: gridIntance.getFieldValue("quantityshiprecv", line),
                    linesequencenumber: gridIntance.getFieldValue("linesequencenumber", line),
                    closed: gridIntance.getFieldValue("closed", line),
                    custcol_close_reason: gridIntance.getFieldValue("custcol_close_reason", line),
                    custcol_close_date: (new Date).format("yy-m-d"),
                    custcol_line_close_employee: nlapiGetContext().user
                });
            }
            return datas;
        }

        function dynamicGetLineArray(machine, index, startLine, count) {
            console.time("Fetch");
            ajaxPost(url.resolveScript({
                scriptId: 'customscript_rl_cux_po_close_line',
                deploymentId: 'customdeploy_rl_cux_po_close_line'
            }), {
                funcName: "getPageData",
                index: index,
                filters: {
                    subsidiary: currentRecord.getValue("subsidiary"),
                    vendor: currentRecord.getText("vendor"),
                    item: currentRecord.getValue("item"),
                    closed: currentRecord.getValue("closed")
                }
            }, setResultData);

            function setResultData(result) {
                debugger
                var datas = JSON.parse(result.body), lineArray = [];
                if(!datas.length) { return alert("没有查找到数据！"); }
                for(var line in datas) {
                    lineArray.push(machine.getEmptyLine());
                }
                machine.setLineArray(lineArray);
                for(var line in datas) {
                    var lineData = datas[line];
                    for(var fieldId in lineData) {
                        machine.setFieldValue(fieldId, lineData[fieldId], line);
                    }
                }
                machine.refrashGrid();
            }
        }

        function SearchListGrid(option) {
            option = option || {};
            var _lineArray = option.data || [], _columns = option.columns || [];
            var gridId = createRandomId();
            var selectedLines = [];
            var gridNode = document.createElement("div");
            var showSerialNumber = option.showSerialNumber || false, showCheckBox = option.showCheckBox || false;
            var beforeMouseWheelEvent = document.onmousewheel;
            var lastTarget, height = option.height > 50? option.height: 0;
            var notDataLine = '<tr><td class="uir-nodata-row listtexthl" colspan="100">无数据可显示.</td></tr>';
            beforeMouseWheelEvent = beforeMouseWheelEvent || window.onmousewheel;
            lineHeight = 20, headerHeight = 24;
            gridNode.style = "max-height:" + height + "px;height:auto;overflow:hidden;position:relative;padding: 0;";
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
                create: function() {
                    _lineArray = Array.isArray(_lineArray)? _lineArray: [];
                    var tbody = "<div><table id='search_list_grid' class='listtable listborder openList uir-list-table' border='1' cellspacing='0' rules='all' style='width:100%;height:auto;max-height:100%;'>\
                    <thead><tr class='uir-list-headerrow noprint'>" + (showSerialNumber? "<th class='listheadertdleft listheadertextb uir-list-header-td' style='width:40px;'>\
                    <span class='listheader'>序号</span></th>": "") + (showCheckBox? "<th class='listheadertdleft listheadertextb uir-list-header-td' style='width:60px;'>\
                    <span><input name='search_list_grid_selectall' style='margin: 0 4px !important;vertical-align: middle;padding:0 !important;' type='checkbox'/></span><span class='listheader'>全选</span></th>": "");
                    for(var i = 0; i < _columns.length; i++) {
                        if(_columns[i].type == "hidden") { continue; }
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
                    }\
                    #search_list_grid tbody input.dottedlink{\
                        cursor:pointer !important;\
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
                    click: gridClickEvent,
                    mousedown: function(el) {
                        if(lastTarget && lastTarget != target.parentNode && lastTarget.firstElementChild && 
                        lastTarget.firstElementChild.className != "ns_grid_cell_text_css" && lastTarget.firstElementChild.value !== undefined) {
                            var value = lastTarget.firstElementChild.value;
                            var row = lastTarget.getAttribute("row");
                            var col = lastTarget.getAttribute("col");
                            if(lastTarget.firstElementChild.selectedOptions) {
                                _lineArray[row][+col - 1] = value;
                                value = lastTarget.firstElementChild.selectedOptions[0].getAttribute("text");
                            }
                            _lineArray[row][col] = value;
                            lastTarget.innerHTML = getCellControl(value, row, col, _columns[col]);
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

            function searchListGridScrollEvent(el) {
                var node = el? el.target || el.srcElement: { scrollTop: 0 };
                var startLine = Math.round((node.scrollTop || 0) / lineHeight);
                var tr = "", endLine = startLine + getGridLoadCount();
                gridNode.firstElementChild.style = "width:" + (gridNode.clientWidth? (gridNode.clientWidth + (endLine - startLine <= _lineArray.length? 0: 17)) + "px": "100%")
                 + ";float:left;height:100%;overflow-y:hidden;overflow-x:auto;max-height:" + height + "px;";
                 startLine = startLine - (_lineArray.length && endLine > _lineArray.length? endLine - _lineArray.length: 0);
                for(var i = startLine < 0? 0: startLine; i < _lineArray.length && i < endLine; i++) {
                    var isSelected = selectedLines.indexOf(i + "") > -1;
                    tr += "<tr row='" + i + "' class='uir-list-row-tr uir-list-row-" + (i % 2? "even": "odd") + " " + (isSelected? " listfocusedrow": "") + "'>" + (showSerialNumber?
                         "<td class='listtext uir-list-row-cell'><span>" + (i + 1) + "</span></td>": "") +
                          (showCheckBox? "<td class='listtext uir-list-row-cell'><span><input style='margin: 0 4px !important;vertical-align: middle;padding:0 !important;'\
                          name='search_list_grid_selectone' " + (isSelected? "checked ": "") + "type='checkbox'></span></td>": "");
                    for(var j = 0; j < _columns.length; j++) {
                        if(_columns[j].type == "hidden") { continue; }
                        tr += "<td class='listtext uir-list-row-cell' row='" + i + "' col='" + j + "'>" + getCellControl(_lineArray[i][j], i, j, _columns[j]) + "</td>";
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
                        var row = lastTarget.getAttribute("row");
                        var col = lastTarget.getAttribute("col");
                        if(lastTarget.firstElementChild.selectedOptions) {
                            _lineArray[row][+col - 1] = value;
                            value = lastTarget.firstElementChild.selectedOptions[0].getAttribute("text");
                        }
                        _lineArray[row][col] = value;
                        lastTarget.innerHTML = getCellControl(value, row, col, _columns[col]);
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
                            if(_columns[pos].type == "inputselect") {
                                tdNode.firstElementChild.onchange = function(e) {
                                    var that = this, parentNode = that.parentNode;
                                    that.blur();
                                    getBomCodeData(that.value.split(','), function(data) {
                                        that.value = "";
                                        parentNode.firstElementChild.value = "";
                                        gridNode.machine.setFieldValue(_columns[pos].fieldId, "", parentNode.getAttribute("row"));
                                        _columns[pos].data = data;
                                        if(that.nextElementSibling) {
                                            that.nextElementSibling.innerHTML = setDropDownData(data, that.value);
                                        }
                                        that.focus();
                                    });
                                }
                                tdNode.lastElementChild.onchange = function(e) {
                                    this.previousElementSibling.value = this.selectedOptions[0].text;
                                    _columns[pos].onchange(e);
                                };
                            } else {
                                tdNode.firstElementChild.onchange = _columns[pos].onchange;
                            }
                        }
                    }
                }
                lastTarget = tdNode;
            }

            function getCellControl(value, row, col, column) {
                if(column && typeof column.temple == "function") {
                    return column.temple({ machine: machine, value: value, fieldId: column.fieldId, row: row });
                }
                return "<input type='text' class='ns_grid_cell_text_css' title='" + value + "' value='" + value + "' readonly/>";
            }

            function createControl(column, value) {
                var type = column.type, data = column.data;
                data = data == undefined? "": data;
                var control = "";
                switch(type) {
                    case "text":
                    case "number":
                        control = "<input type='text' style='width:95%;height:19px !important;min-width:100px;max-width:300px;' value='" + value +  "'/>"
                        break;
                    case "select":
                        control = "<select style='width:95%;height:100%;min-width: 100px;max-width:300px;padding:0 5px !important;height:19px !important;'>";
                        control += setDropDownData(data, value);
                        control += "</select>";
                        break;
                    case "inputselect":
                        control = "<input type='text' value='" + value + "' style='height:19px;width:85%;position:absolute;z-index:99;border-right: none !important;'/>\
                        <select style='width:100%;position:absolute;z-index:98;min-width:10%;max-width:100%;padding:0 5px !important;height:19px !important;'>";
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
            searchSubmitClickEvent: searchSubmitClickEvent,
            addMemoButtonClickEvent: addMemoButtonClickEvent,
            searchSubmitMemoClickEvent: searchSubmitMemoClickEvent
        };
    }
);
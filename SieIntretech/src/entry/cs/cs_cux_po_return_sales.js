/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/url', 'N/https', 'N/ui/dialog', 'N/ui/message', 'N/format'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function(record, search, url, https, dialog, message, format) {
        var currentRecord, gridIntance, authGridIntance;
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
            window.rhysDefineGlobalObject = {};
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
            var gridInfo = {
                showCheckBox: true,
                showSerialNumber: true,
                height: 600,
                columns: [
                            { label: "ItemRcpt", fieldId: "internalid", type: "hidden" },
                            { label: "创建日期", fieldId: "datecreated" },
                            { label: "货品", fieldId: "item", type: "hidden" },
                            { label: "货品", fieldId: "item_display", temple: function(context) {
                                var recordId = context.machine.getFieldValue("item", context.row);
                                var valueControl = '<input type="text" class="ns_grid_cell_text_css dottedlink" title="' + context.value + '" value="' + context.value + '" readonly="">';
                                return "<a class='dottedlink' target='_blank' href='/app/common/item/item.nl?id=" + recordId + "'>" + valueControl + "</a>";
                            } },
                            { label: "供应商名称", fieldId: "vendor__altname" },
                            { label: "入库单号", fieldId: "tranid", temple: function(context) {
                                var recordId = context.machine.getFieldValue("internalid", context.row);
                                var valueControl = '<input type="text" class="ns_grid_cell_text_css dottedlink" title="' + context.value + '" value="' + context.value + '" readonly="">';
                                return "<a class='dottedlink' target='_blank' href='/app/accounting/transactions/itemrcpt.nl?id=" + recordId + "&whence='>" + valueControl + "</a>";
                            } },
                            { label: "规格型号", fieldId: "item_custitem_ps_item_specification" },
                            { label: "入库/接收数量", fieldId: "quantity" },
                            { label: "退货数量", fieldId: "quantityret", type: "text", onchange: quantityretChangeEvent },
                            { label: "地点", fieldId: "location", type: "hidden" },
                            { label: "地点", fieldId: "location_display", type: "select", data: getLocationDropdownDatas(), onchange: function(e) {
                                var target = e.target || e.srcElement;
                                var line = target.parentElement.getAttribute("row");
                                var item = gridIntance.getFieldValue("item", line);
                                ajaxPost(url.resolveScript({
                                    scriptId: 'customscript_rl_cux_po_return_sales',
                                    deploymentId: 'customdeploy_rl_cux_po_return_sales'
                                }), {
                                    funcName: "getLocationQuantity",
                                    items: item,
                                    locations: target.value
                                }, function(result) {
                                    gridIntance.setFieldValue("quantitylocation", JSON.parse(result.body)[item + "_" + target.value] || "0", line);
                                    gridIntance.refrashGrid();
                                });
                            } },
                            { label: "仓库可用数量", fieldId: "quantitylocation" },
                            { label: "实际发货/收货日期", fieldId: "actualshipdate" },
                            { label: "采购订单号", fieldId: "createdfrom", type: "hidden" },
                            { label: "采购订单号", fieldId: "createdfrom_display", width: 100, temple: function(context) {
                                var recordId = context.machine.getFieldValue("createdfrom", context.row);
                                var valueControl = '<input type="text" class="ns_grid_cell_text_css dottedlink" title="' + context.value + '" value="' + context.value + '" readonly="">';
                                return "<a class='dottedlink' target='_blank' href='/app/accounting/transactions/purchord.nl?id=" + recordId + "&e=T&whence='>" + valueControl + "</a>";
                            } },
                            { label: "审批状态", fieldId: "custbody_outbound_3", type: "hidden" },
                            { label: "审批状态", fieldId: "custbody_outbound_3_display" },
                            { label: "创建人", fieldId: "createdby", type: "hidden" },
                            { label: "创建人", fieldId: "createdby_display" },
                            { label: "备注", fieldId: "memo", type: "text" },
                            { label: "批次编号", fieldId: "inventoryDetail__inventorynumber", type: "hidden" },
                            { label: "批次编号", fieldId: "inventoryDetail__inventorynumber_display", type: "text", width: 180 }
                        ],
                data: []
            },
            authGridInfo = deepCopy(gridInfo);
            gridIntance = new SearchListGrid(gridInfo);
            var sublistNode = document.querySelector("#cux_po_close_line_splits").parentElement;
            sublistNode.innerHTML = "";
            sublistNode.append(gridIntance.create());

            authGridInfo.showCheckBox = false;
            authGridInfo.columns.splice(11, 1);
            authGridInfo.columns[7].type = "";
            authGridInfo.columns[10].type = "";
            authGridInfo.columns.unshift({ label: "状态", fieldId: "submitstatus", width: 60, temple: function(context) {
                return '<input type="text" style="color:' + (context.value == "未处理"? "red": "blue") + ' !important;" class="ns_grid_cell_text_css" title="' + context.value + '" value="' + context.value + '" readonly="">';
            }});
            authGridInfo.columns.unshift({ label: "操作", fieldId: "operator", width: 80, temple: function(context) {
                var valueArray = context.value.split(/[,，]/gmi) || [];
                rhysDefineGlobalObject.operatorCellClickEvent = function(target) {
                    var isDelete = target.firstElementChild.value == "删除";
                    var row = target.parentElement.getAttribute("row");
                    if(isDelete) {
                        authGridIntance.splice(row, 1);
                    } else {
                        ajaxPost(url.resolveScript({
                            scriptId: 'customscript_rl_cux_po_return_sales',
                            deploymentId: 'customdeploy_rl_cux_po_return_sales'
                        }), {
                            funcName: "getReturnSalesOrder",
                            createdfrom: authGridIntance.getFieldValue("createdfrom", row),
                            item: authGridIntance.getFieldValue("item", row)
                        }, function(result) {
                            message.create({
                                title: "刷新成功", 
                                message: "退货授权单状态已更新！", 
                                type: message.Type.CONFIRMATION
                            }).show({ duration: 1000 });
                            var datas = JSON.parse(result.body), values = "";
                            for(var vendorId in datas) {
                                values += vendorId + "#" + datas[vendorId] + ",";
                            }
                            authGridIntance.setFieldValue("returnsales", values.slice(0, -1), row);
                            authGridIntance.refrashGrid();
                        });
                    }
                };
                for(var i = 0, ctrl = ""; i < valueArray.length; i++) {
                    ctrl += "<span onclick='rhysDefineGlobalObject.operatorCellClickEvent(this)' class='dottedlink'><input style='width:33px !important;' type='text' class='ns_grid_cell_text_css dottedlink' title='" + 
                    valueArray[i] + "' value='" + valueArray[i] + "' readonly=></span> ";
                }
                return ctrl;
            }});
            authGridInfo.columns.push({ label: "退货授权单", fieldId: "returnsales", temple: function(context) {
                var valueArray = context.value.split(/[,，]/gmi) || [];
                for(var i = 0, ctrl = ""; i < valueArray.length; i++) {
                    var values = valueArray[i].split("#");
                    ctrl += "<a target='_blank' class='dottedlink' href='/app/accounting/transactions/vendauth.nl?id=" + (values[0] || "") + "&e=T&whence='><input class='ns_grid_cell_text_css dottedlink' title='" + 
                    (values[1] || "") + "' value='" + (values[1] || "") + "' readonly=></span> ";
                }
                return ctrl;
            }});
            authGridIntance = new SearchListGrid(authGridInfo);
            sublistNode = document.querySelector("#alreadyaddlist_splits").parentElement;
            sublistNode.innerHTML = "";
            sublistNode.append(authGridIntance.create());

            function getLocationDropdownDatas() {
                var allResults = getAllSearchResults({
                    type: "location",
                    columns: ["name"]
                });
                var datas = [{ value: "", text: "" }];
                for(var i = 0; i < allResults.length; i++) {
                    datas.push({ value: allResults[i].id, text: allResults[i].getValue(allResults[i].columns[0]) });
                }
                return datas;
            }

            function quantityretChangeEvent(e) {
                var target = e.target || e.srcElement;
                var line = target.parentElement.getAttribute("row");
                var quantity = gridIntance.getFieldValue("quantity", line) - gridIntance.getFieldValue("quantityret", line);
                if(isNaN(quantity) || quantity < 0) {
                    gridIntance.setFieldValue("quantityret", "", line);
                    gridIntance.refrashGrid();
                    return alert("输入的退货数量必须大于等于0且小于等于接收数量才可以！");
                }
            }
        }

        function searchButtonClickEvent(e) {
            gridIntance.clear();
            dynamicGetLineArray(gridIntance);
        }

        function searchSubmitClickEvent(e) {
            var datas = getGroupPoIdsInfo();
            if(JSON.stringify(datas) == "{}") {
                return dialog.alert({
                    title: '提交失败',
                    message: '请至少选择一条记录提交。' 
                }).then(function() {}).catch(function() {});
            }
            //return createRetAuthor(datas);
            ajaxPost(url.resolveScript({
                scriptId: 'customscript_rl_cux_po_return_sales',
                deploymentId: 'customdeploy_rl_cux_po_return_sales'
            }), {
                funcName: "createRetAuthors",
                data: datas
            }, function(result) {
                dialog.alert({
                    title: '提交成功',
                    message: '提交成功！请到对应的PO授权退货上查看进度！' 
                }).then(function() {}).catch(function() {});
                console.log("Map/Reduce Id: " + result.body);
            });
            /* 
            行里的采购订单（分组，根据不同的采购订单进行分组）=》创建供应商退货授权{ API:transform(fromTYpe,..) } =>赋值：数量、货品、仓库=》Save
            */
           function createRetAuthor(datas) {
                try{
                    for(var poId in datas) {
                        var tfRecord = record.transform({
                            fromType: "purchaseorder",
                            fromId: poId,
                            toType: "vendorreturnauthorization",
                            isDynamic: true,
                        });
                        for(var i = tfRecord.getLineCount({ sublistId: "item" }) - 1; i > -1; i--) {
                            tfRecord.removeLine({ sublistId: "item", line: i, ignoreRecalc: true });
                        }
                        setPageDataByStruct(tfRecord, datas[poId]);
                        log.debug("Create Author Successfully", e.message);
                    }
                } catch(e) {
                    log.debug("Create Author Fail", e.message);
                }
           }

           function setPageDataByStruct(currentRecord, value, fieldId) {
                if(typeof value != "object") {
                    return currentRecord.setValue(fieldId, value);
                } else if(Array.isArray(value)) {
                    for(var line in value) {
                        var lineData = value[line];
                        currentRecord.selectNewLine({ sublistId: fieldId });
                        for(var lineFieldId in lineData) {
                            var lineFieldValue = lineData[lineFieldId];
                            if(typeof lineFieldValue != "object") {
                                currentRecord.setCurrentSublistValue({ sublistId: fieldId, fieldId: lineFieldId, value: lineFieldValue });
                                continue;
                            }
                            var subRecord = currentRecord.getCurrentSublistSubrecord({ sublistId: fieldId, fieldId: lineFieldId });
                            setPageDataByStruct(subRecord, lineFieldValue);
                        }
                        currentRecord.commitLine({ sublistId: fieldId });
                    }
                } else if(typeof value == "object") {
                    for(var fieldId in value) {
                        setPageDataByStruct(currentRecord, value[fieldId], fieldId);
                    }
                    currentRecord.save? currentRecord.save(): currentRecord.commit? currentRecord.commit(): true;
                }
            }
        }

        function searchAddClickEvent(e) {
            var selectLines = gridIntance.getSelectLines();
            var lineArray = authGridIntance.getLineArray();
            var authRow = lineArray.length, fialLines = [];
            var skipFields = ["submitstatus", "quantityret", "location", "location_display", "quantitylocation", "memo"];
            for(var index in selectLines) {
                var row = selectLines[index];
                var quantityret = gridIntance.getFieldValue("quantityret", row);
                if(!quantityret || quantityret == 0) {
                    fialLines.push(+row + 1);
                    continue;
                }
                lineArray.push(authGridIntance.getEmptyLine());
                for(var i in gridIntance.columns) {
                    var column = gridIntance.columns[i];
                    var col = authGridIntance.getFieldPos(column.fieldId);
                    if(col < 0) { continue; }
                    lineArray[authRow][col] = gridIntance.getFieldValue(column.fieldId, row);
                }
                lineArray[authRow][0] = "删除, 刷新";
                lineArray[authRow++][1] = "未处理";
            }
            for(var i = 0; i < lineArray.length; i++) {
                for(var j = i + 1; j < lineArray.length; j++) {
                    for(var k = lineArray[j].length - 1; k > -1 && (lineArray[i][k] == lineArray[j][k] || skipFields.indexOf(authGridIntance.columns[k].fieldId) != -1); k--);
                    if(k != -1) { continue; }
                    lineArray[i] = lineArray[j];
                    lineArray.splice(j--, 1);
                    break;
                }
            }
            authGridIntance.setLineArray(lineArray);
            var title = "添加成功", msg = "成功添加至授权单列表！";
            if(fialLines.length == selectLines.length) {
                title = "添加失败", msg = fialLines.length? "所有提交的行退货数量不能为0或空！": "请至少勾选一行再进行添加！";
            } else if(fialLines.length){
                title = "部分添加失败", msg = "第" + fialLines.join('、') + "行添加失败：退货数量不能为0或空！";
            }
            if(title.indexOf("成功") > -1) {
                message.create({
                    title: title, 
                    message: msg, 
                    type: message.Type.CONFIRMATION
                }).show({ duration: 1000 });
            } else {
                return dialog.alert({
                    title: title,
                    message: msg 
                }).then(function() {}).catch(function() {});
            }
        }

        function getGroupPoIdsInfo() {
            var datas = {};
            for(var line = 0, len = authGridIntance.getLineCount(); line < len; line++) {
                var poId = authGridIntance.getFieldValue("createdfrom", line);
                var quantity = authGridIntance.getFieldValue("quantity", line);
                var quantityret = authGridIntance.getFieldValue("quantityret", line);
                var location = authGridIntance.getFieldValue("location", line);
                if(!location || quantity == "") {
                    alert("第" + (+line + 1) + "行的数据将不会被提交。原因是：数量或者地点不能为空！");
                    continue;
                }
                if(authGridIntance.getFieldValue("submitstatus", line) == "已提交") { continue; }
                datas[poId] = datas[poId] || {};
                datas[poId]["memo"] = authGridIntance.getFieldValue("memo", line);
                datas[poId]["item"] = datas[poId]["item"] || [];
                datas[poId]["item"].push({
                    item: authGridIntance.getFieldValue("item", line),
                    tranid: authGridIntance.getFieldValue("tranid", line),
                    location: location,
                    quantity: quantityret,
                    inventorydetail: {
                        inventoryassignment: [{
                            issueinventorynumber: authGridIntance.getFieldValue("inventoryDetail__inventorynumber", line),
                            quantity: quantityret
                        }]
                    }
                });
                authGridIntance.setFieldValue("submitstatus", "已提交", line);
            }
            authGridIntance.refrashGrid();
            return datas;
        }

        function dynamicGetLineArray(machine) {
            var operator = { "select": "anyof", "text": "haskeywords", "date": "within", "float": "equalto"};
            var filters = [];
            for(var fieldId in window.ftypes) {
                var value = currentRecord.getValue({ fieldId: fieldId });
                var type = window.ftypes[fieldId];
                if((!value && value !== 0 && value !== false) || fieldId.indexOf("__to") > -1) { continue; }
                value = value === true? "T": value === false? "F": value;
                value = value instanceof Date? format.format({ value: value, type: type }): value;
                var schFieldId = fieldId.replace("__from", "").replace("__to", "").replace("__", ".");
                if(/(within)|(between)/g.test(operator[type])) {
                    var toValue = currentRecord.getValue({ fieldId: fieldId.replace("__from") + "__to" });
                    if(toValue) {
                        filters.push("AND", [schFieldId, operator[type], value, toValue]);
                    } else {
                        filters.push("AND", [schFieldId, "after", value]);
                    }
                    continue;
                }
                filters.push("AND", [schFieldId, operator[type], value]);
            }
            ajaxPost(url.resolveScript({
                scriptId: 'customscript_rl_cux_po_return_sales',
                deploymentId: 'customdeploy_rl_cux_po_return_sales'
            }), {
                funcName: "getPageData",
                filters: filters
            }, function(result) {
                var datas = JSON.parse(result.body), lineArray = [], items = [], locations = [];
                if(!datas.length) { return alert("没有查找到数据！"); }
                for(var line in datas) {
                    var lineData = datas[line];
                    lineArray.push(machine.getEmptyLine());
                    for(var fieldId in lineData) {
                        var pos = machine.getFieldPos(fieldId);
                        lineArray[line][pos] = lineData[fieldId];
                    }
                    items.indexOf(lineData["item"]) == -1 && items.push(lineData["item"]);
                    items.indexOf(lineData["location"]) == -1 && locations.push(lineData["location"]);
                }
                machine.setLineArray(lineArray);
                ajaxPost(url.resolveScript({
                    scriptId: 'customscript_rl_cux_po_return_sales',
                    deploymentId: 'customdeploy_rl_cux_po_return_sales'
                }), {
                    funcName: "getLocationQuantity",
                    items: items,
                    locations: locations
                }, function(result) {
                    if(result.body == "{}") { return; }
                    datas = JSON.parse(result.body);
                    for(var line = 0; line < lineArray.length; line++) {
                        machine.setFieldValue("quantitylocation", datas[machine.getFieldValue("item", line) + "_" + machine.getFieldValue("location", line)] || "", line);
                    }
                    machine.refrashGrid();
                });
            });
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
            var notDataLine = '<tr><td class="uir-nodata-row listtexthl" colspan="' + _columns.length + '">无数据可显示.</td></tr>';
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
                    if(argumentsArray.length) {
                        _lineArray.splice(arguments[0], arguments[1], argumentsArray);
                    } else {
                        _lineArray.splice(arguments[0], arguments[1]);
                    }
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
                    var value = lastTarget.firstElementChild.value;
                    if(value !== undefined) {
                        setCellValue(lastTarget);
                        var row = lastTarget.getAttribute("row");
                        var col = lastTarget.getAttribute("col");
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
                            tdNode.firstElementChild.onchange = function(e) {
                                setCellValue(tdNode);
                                _columns[pos].onchange(e);
                            }
                        }
                    }
                }

                lastTarget = tdNode;
            }

            function setCellValue(tdNode) {
                var value = tdNode.firstElementChild.value;
                var row = tdNode.getAttribute("row");
                var col = tdNode.getAttribute("col");
                if(tdNode.firstElementChild.selectedOptions) {
                    _lineArray[row][col - 1] = value;
                    value = tdNode.firstElementChild.selectedOptions[0].getAttribute("text");
                }
                _lineArray[row][col] = value;
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
                    options += "<option value='" + data[i].value + "' text='" + data[i].text + "'" + (value == data[i].value || value == data[i].text? " selected": "") + ">" + data[i].text + "</option>";
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
            searchAddClickEvent: searchAddClickEvent
        };
    }
);
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/url', 'N/https', 'N/ui/dialog', 'N/ui/message', 'N/format', '../../../lib/common_rhysdefine_standardgrid'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function(record, search, url, https, dialog, message, format, myGrid) {
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
                showHeaderRow: true,
                height: "700px",
                columns: [
                            { label: "ItemRcpt", fieldId: "internalid", display: "hidden" },
                            { label: "行号", fieldId: "line", display: "hidden" },
                            { label: "创建日期", fieldId: "datecreated" },
                            { label: "货品", fieldId: "item", type: "select", temple: function(context) {
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
                            { label: "退货数量", fieldId: "quantityret", type: "text", onchange: quantityretChangeEvent, editable: true },
                            { label: "地点", fieldId: "location", type: "select", editable: true, data: getLocationDropdownDatas(), onchange: function(e) {
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
                            { label: "采购订单号", fieldId: "createdfrom", width: 100, type: "select", temple: function(context) {
                                var recordId = context.machine.getFieldValue("createdfrom", context.row);
                                var valueControl = '<input type="text" class="ns_grid_cell_text_css dottedlink" title="' + context.value + '" value="' + context.value + '" readonly="">';
                                return "<a class='dottedlink' target='_blank' href='/app/accounting/transactions/purchord.nl?id=" + recordId + "&e=T&whence='>" + valueControl + "</a>";
                            } },
                            { label: "审批状态", fieldId: "custbody_outbound_3", type: "select" },
                            { label: "创建人", fieldId: "createdby", type: "select" },
                            { label: "备注", fieldId: "memo", type: "text", editable: true },
                            { label: "批次编号", fieldId: "inventoryDetail__inventorynumber", type: "select", width: 180 }
                        ],
                data: []
            },
            authGridInfo = deepCopy(gridInfo);
            gridIntance = new myGrid.SearchListGrid(gridInfo);
            var sublistNode = document.querySelector("#cux_po_close_line_splits").parentElement;
            sublistNode.innerHTML = "";
            sublistNode.append(gridIntance.create());

            authGridInfo.showCheckBox = false;
            authGridInfo.columns[7].editable = false;
            authGridInfo.columns[10].editable = false;
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
                    ctrl += "<a target='_blank' class='dottedlink' href='/app/accounting/transactions/vendauth.nl?id=" + (values[0] || "") + "&whence='><input class='ns_grid_cell_text_css dottedlink' title='" + 
                    (values[1] || "") + "' value='" + (values[1] || "") + "' readonly=></span> ";
                }
                return ctrl;
            }});
            authGridIntance = new myGrid.SearchListGrid(authGridInfo);
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
                    //item: authGridIntance.getFieldValue("item", line),
                    //tranid: authGridIntance.getFieldValue("tranid", line),
                    location: location,
                    quantity: quantityret,
                    line: authGridIntance.getFieldValue("line", line) - 1,
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
            machine.setLoading();
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
                if(!datas.length) {
                    machine.setNoDataLine();
                    return alert("没有查找到数据！");
                }
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
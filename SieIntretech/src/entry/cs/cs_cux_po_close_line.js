/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/url', 'N/https', 'N/ui/dialog', "N/format", '../../../lib/common_rhysdefine_standardgrid'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function(record, search, url, https, dialog, format, myGrid) {
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
            gridIntance = new myGrid.SearchListGrid({
                showCheckBox: true,
                showSerialNumber: true,
                showHeaderRow: true,
                height: "700px",
                columns: [
                            { label: "POID", fieldId: "internalid", display: "hidden" },
                            { label: "货品", fieldId: "item", type: "select", temple: function(context) {
                                var recordId = context.machine.getFieldValue("item", context.row);
                                var valueControl = '<input type="text" class="ns_grid_cell_text_css dottedlink" title="' + context.value + '" value="' + context.value + '" readonly="">';
                                return "<a class='dottedlink' target='_blank' href='/app/common/item/item.nl?id=" + recordId + "'>" + valueControl + "</a>";
                            }},
                            { label: "子公司", fieldId: "subsidiary", type: "select", temple: function(context) {
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
                            { label: "行序号", fieldId: "linesequencenumber", display: "hidden" },
                            { label: "已实施数量/已收货数量", fieldId: "quantityshiprecv" },
                            { label: "装运数量", fieldId: "quantityonshipments" },
                            { label: "已履行量/已收货量(行层次)", type: "select", fieldId: "shiprecvstatusline", width: 100 },
                            { label: "已关闭", fieldId: "closed", type: "select" },
                            { label: "行关闭日期", fieldId: "custcol_close_date" },
                            { label: "行关闭人", fieldId: "custcol_line_close_employee", type: "select" },
                            { label: "行关闭原因", fieldId: "custcol_close_reason", type: "text", width: 200, editable: true }
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
            machine.setLoading();
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
                if(!datas.length) {
                    machine.setNoDataLine();
                    return alert("没有查找到数据！");
                }
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
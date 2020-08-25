/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/ui/message', 'N/ui/dialog', 'N/https', 'N/url', '../../../lib/common_rhysdefine_standardgrid'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function(record, search, message, dialog, https, url, myGrid) {
        var currentRecord, updatGridInstance, isSearching = false, hasDealData = false;
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
            initBatchUpdateSublist(scriptContext);
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

        function searchButtonClickEvent(scriptContext) {
            if(isSearching) { return alert("还有搜索正在进行中，请勿重新提交搜索！"); }
            isSearching = true;
            var opMaping = { select: "anyof", date: "within", text: "contains", decimalnumber: "between", checkbox: "is" };
            var filters = [], filterExp = [];
            updatGridInstance.setLoading();
            for(var fieldId in ftypes) {
                var type = ftypes[fieldId], value = currentRecord.getValue(fieldId);
                if(fieldId.indexOf("__to") > -1 || !value) { continue; }
                type = fieldId == "custrecord_tiering_price"? "checkbox": type;
                fieldId = fieldId.replace("__from", "").replace("__to", "").replace("__", ".");
                filterExp = [fieldId, opMaping[type], value];
                if(["within", "between"].indexOf(opMaping[type]) > -1) {
                    var toFieldId = fieldId.replace(".", "__") + "__to";
                    var toValue = currentRecord.getText(toFieldId);
                    filterExp[2] = currentRecord.getText(fieldId + "__from");
                    if(toValue) {
                        filterExp.push(toValue);
                    } else {
                        filterExp[1] = "onorafter";
                    }
                }
                filters.push("AND", filterExp);
            }
            ajaxPost({
                funcName: "getPriceBatchUpadeDatas",
                filters: filters
            }, function(result) {
                if(!result.length) {
                    updatGridInstance.setNoDataLine();
                    isSearching = false;
                    return alert("没有查找到数据！");
                }
                var lineArray = [];
                for(var line = 0; line < result.length; line++) {
                    var lineData = result[line];
                    var emptyLine = updatGridInstance.getEmptyLine();
                    for(var fieldId in lineData) {
                        var fieldPos = updatGridInstance.getFieldPos(fieldId);
                        fieldPos > -1 && (emptyLine[fieldPos] = lineData[fieldId]);
                    }
                    lineArray.push(emptyLine);
                }
                updatGridInstance.setLineArray(lineArray);
                isSearching = false;
            });
        }

        function searchSubmitClickEvent() {
            if(hasDealData) { return alert("还有数据正在处理中，请勿重复提交！"); }
            hasDealData = true;
            var priceIds = { 0: [] }, selectLines = updatGridInstance.getSelectLines(), pageIndex = 0;
            if(!selectLines.length) { return alert("您没有勾选任何数据！"); }
            for(var index = selectLines.length - 1; index > -1; index--) {
                var id = updatGridInstance.getFieldValue("internalid", selectLines[index]);
                if(priceIds[pageIndex].length % 200 == 0) {
                    priceIds[++pageIndex] = priceIds[pageIndex] || [];
                }
                priceIds[pageIndex].push(id);
            }
            updatGridInstance.clear();
            var allResult = { success: [], faile: [] };
            inernalSubmit(1);
            function inernalSubmit(index) {
                ajaxPost({
                    funcName: "excuteBatchUpdateOrAuditralPriceApply",
                    priceIds: priceIds[index],
                    type: "Update"
                }, function(result) {
                    allResult.success = allResult.success.concat(result.success);
                    allResult.faile = allResult.faile.concat(result.faile);
                    if(allResult.success.length + allResult.faile.length == selectLines.length) {
                        var msg = "<span style='font-weight:bold;'>采购价格明细批量提交成功</span><br/>提交更新的总数量：<span style='color:#FFC107;'>" + selectLines.length +"</span> 条<br/>成功数量：<span style='color:blue;'>" + allResult.success.length + "</span> 条;" +
                        "失败数量：<span style='color:red;'>" + allResult.faile.length + "</span> 条;";
                        dialog.alert({
                            title: '提交成功',
                            message: msg
                        });
                        hasDealData = false;
                    } else {
                        inernalSubmit(++index);
                    }
                });
            }
        }

        function initBatchUpdateSublist(scriptContext) {
            var gridConfig = {
                showCheckBox: true,
                showSerialNumber: true,
                showHeaderRow: true,
                height: "700px",
                columns: [
                    {label: "内部标识", fieldId: "internalid", type: "text", temple: function(context) {
                        var recordId = context.machine.getFieldValue("internalid", context.row);
                        var valueControl = '<input style="cursor:pointer;" type="text" class="ns_grid_cell_text_css dottedlink" title="' + context.value + '" value="' + context.value + '" readonly="">';
                        return "<a class='dottedlink' target='_blank' href='/app/common/custom/custrecordentry.nl?rectype=235&id=" + recordId + "'>" + valueControl + "</a>";
                    }},
                    {label: "价格类型", fieldId: "custrecord_price_type", type: "select"},
                    {label: "供应商编码", fieldId: "custrecord_field_vendor", type: "select"},
                    {label: "供应商名称", fieldId: "custrecord_vendor_name_2", type: "text"},
                    {label: "物料编码", fieldId: "custrecord_field_item", type: "select", temple: function(context) {
                        var recordId = context.machine.getFieldValue("custrecord_field_item", context.row);
                        var valueControl = '<input style="cursor:pointer;" type="text" class="ns_grid_cell_text_css dottedlink" title="' + context.value + '" value="' + context.value + '" readonly="">';
                        return "<a class='dottedlink' target='_blank' href='/app/common/item/item.nl?id=" + recordId + "'>" + valueControl + "</a>";
                    }},
                    {label: "物料名称", fieldId: "custrecord_item_name_2", type: "text"},
                    {label: "物料规格型号", fieldId: "custrecord_item_specification_1", type: "text"},
                    {label: "计量单位", fieldId: "custrecord_item_uom", type: "select"},
                    {label: "币种", fieldId: "custrecord_field_currencies", type: "select"},
                    {label: "阶梯数量起", fieldId: "custrecord_field_start1", type: "text"},
                    {label: "阶梯数量止", fieldId: "custrecord_field_stop", type: "text"},
                    {label: "阶梯采购价", fieldId: "custrecord_unit_price_vat", type: "text", temple: function(context) {
                        var recordId = context.machine.getFieldValue("internalid", context.row);
                        var valueControl = '<input style="cursor:pointer;" type="text" class="ns_grid_cell_text_css dottedlink" title="' + context.value + '" value="' + context.value + '" readonly="">';
                        return "<a class='dottedlink' target='_blank' href='/app/common/custom/custrecordentry.nl?rectype=235&id=" + recordId + "'>" + valueControl + "</a>";
                    }},
                    {label: "是否阶梯价", fieldId: "custrecord_tiering_price", type: "text"},
                    {label: "状态", fieldId: "custrecord_field_status", type: "select"},
                    {label: "生效日期", fieldId: "custrecord_field_start_date", type: "date"},
                    {label: "失效日期", fieldId: "custrecord_field_stop_date", type: "date"},
                    {label: "价格维护人", fieldId: "custrecord_po_price_people", type: "select"},
                    {label: "下一审核人", fieldId: "custrecord_vp_field_next_auditor", type: "select"},
                    {label: "审批日期", fieldId: "custrecord_approval_date_time", type: "date"},
                    {label: "子公司", fieldId: "custrecord_price_company", type: "select"},
                    {label: "最后维护时间", fieldId: "custrecord_last_maintenance_time", type: "date"},
                    {label: "K3旧物料代码", fieldId: "custrecordk3_old_item_num", type: "text"},
                    {label: "当前处理人", fieldId: "custrecord_current_handler", type: "select"},
                    {label: "创建日期", fieldId: "created", type: "date"}
                ],
                data: [],
                style: "width:150%;height:100%;"
            };
            updatGridInstance = new myGrid.SearchListGrid(gridConfig);
            document.querySelector("#cux_po_batch_update_price_splits").parentElement.innerHTML = updatGridInstance.create().outerHTML;
        }

        function ajaxPost(params, callBack) {
            https.post.promise({
                url: url.resolveScript({
                    scriptId: 'customscript_rl_cux_po_common',
                    deploymentId: 'customdeploy_rl_cux_po_common'
                }),
                header: {
                    'Content-Type': 'application/json'
                },
                body: params
            }).then(function (result) {
                callBack && callBack(JSON.parse(result.body));
            }).catch(function(e) {
                alert("由于网络原因导致请求失败！");
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
            //saveRecord: saveRecordf,
            searchButtonClickEvent: searchButtonClickEvent,
            searchSubmitClickEvent: searchSubmitClickEvent,
        };
    }
);
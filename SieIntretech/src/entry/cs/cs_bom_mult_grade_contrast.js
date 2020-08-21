/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/ui/message', 'N/ui/dialog', 'N/https', 'N/url'],
    /**
     * @param {record} record
     * @param {search} search
     */
    function(record, search, message, dialog, https, url) {
        var currentRecord;
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
            addSublistHeadButton("recmachcustrecord_multibom_top", "btn_select_all", "全选");
            addSublistHeadButton("recmachcustrecord_multibom_top", "btn_clear_all", "全不选");
            setCompareNumber();
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

        function addSublistHeadButton(sublistId, id, text) {
            var div = document.createElement("div");
            div.innerHTML = '<table cellpadding="0" cellspacing="0" border="0" class="uir-button" style="margin-right:6px;cursor:hand;" role="presentation">\
            <tbody><tr id="tr_newrec5567" class="tabBnt"><td height="20" valign="top" nowrap="" class="bntBgB">\
            <input type="button" style="" class="rndbuttoninpt bntBgT" value="' + text + '" id="' + (id || "") + '" name="' + (id || "") + '" \
            onclick="cstmDefineBtnsClickEvent(\'' + id + '\');" onmousedown="this.setAttribute("_mousedown","T"); setButtonDown(true, false, this);" onmouseup="this.setAttribute("_mousedown","F");\
            setButtonDown(false, false, this);" onmouseout="if(this.getAttribute("_mousedown")=="T") setButtonDown(false, false, this);"\
            onmouseover="if(this.getAttribute("_mousedown")=="T") setButtonDown(true, false, this);" _mousedown="F">\
            </td></tr> </tbody></table>';
            var sublistFormNode = document.querySelector("#" + sublistId + "_form");
            var insertParentNode = document.querySelector("#" + sublistId + "_top_form");
            if(insertParentNode) {
                insertParentNode.appendChild(div.firstChild);
            } else{
                sublistFormNode.insertBefore(div.firstChild, sublistFormNode.firstChild);
            }
            window.cstmDefineBtnsClickEvent = cstmDefineBtnsClickEvent;
        }

        function cstmDefineBtnsClickEvent(id) {
            var sublistId = "recmachcustrecord_multibom_top";
            var allCount = currentRecord.getLineCount({ sublistId: sublistId });
            currentRecord.cancelLine({ sublistId: sublistId });
            for(var line = 0; line < allCount; line++) {
                setFieldValue("custrecord_multi_selection", id == "btn_select_all"? "T": "F", sublistId, line, true);
            }
            getSublistMachine(sublistId).buildtable();
        }

        function searchButtonEvent() {
            var subsidiary = getFieldValue("custrecord_mult_grad_contrast_subsidiary");
            var startBomCode = getFieldValue("custrecord_mult_contrast_start_bomcode");
            var endBomCode = getFieldValue("custrecord_mult_contrast_finish_bomcode");
            if(!subsidiary && !startBomCode && !endBomCode) {
                return alert("请至少输入一个字段的值才能进行过滤。");
            }
            var sublistId = "recmachcustrecord_multibom_top";
            var machine = getSublistMachine(sublistId);
            NS.form.setInited(true);
            machine.removeAllLines();
            ajaxPost(url.resolveScript({
                scriptId: 'customscript_rl_bom_mult_grade_contrast',
                deploymentId: 'customdeploy_rl_bom_mult_grade_contrast'
            }), {
                funcName: "getSublistData",
                subsidiary: subsidiary,
                sBomCode: startBomCode,
                eBomCode: endBomCode
            }, function(result) {
                if(result.code != 200) {
                    return alert("执行脚本发生异常：" + result.body);
                }
                pageRangeLoadLines(JSON.parse(result.body), 100, 0);
            });

            function pageRangeLoadLines(datas, size, index) {
                size = size < 1? 100: size;
                for(var line = index, endLine = index + size; line < datas.length && line < endLine; line++) {
                    machine.addline();
                    setFieldValue("custrecord_multibom_line_number", line + 1, sublistId, line, true);
                    for(var fieldId in datas[line]) {
                        setFieldValue(fieldId, datas[line][fieldId], sublistId, line, true);
                    }
                }
                machine.renderTable();
                if(line != datas.length) {
                    setTimeout(function() { pageRangeLoadLines(datas, size, line);  }, 0);
                }
            }
        }

        function downloadExcelEvent() {
            var sublistId = "recmachcustrecord_multibom_top";//get select items id
            var allCount = currentRecord.getLineCount({ sublistId: sublistId });
            for(var line = 0, bomIds = []; line < allCount; line++) {
                if(getFieldValue("custrecord_multi_selection", sublistId, line) != "T") { continue; }
                bomIds.push(getFieldValue("custrecord_multi_bom_code", sublistId, line));
            }
            if(!bomIds.length) {
                return alert("请至少选择一个BOM才会开始下载！");
            }
            //return multGradContrast({bomIds: bomIds})
            ajaxPost(url.resolveScript({
                scriptId: 'customscript_rl_bom_mult_grade_contrast',
                deploymentId: 'customdeploy_rl_bom_mult_grade_contrast'
            }), {
                funcName: "multGradContrast",
                bomIds: bomIds
            }, function(result) {
                if(result.code != 200) {
                    return alert("执行脚本发生异常：" + result.body);
                }
                downloadFile(location.origin + JSON.parse(result.body));
            });
        }

        function setCompareNumber() {
            var numberValue = getFieldValue("custrecord_mult_contrast_bill_number");
            if(numberValue) { return; }
            ajaxPost(url.resolveScript({
                scriptId: 'customscript_rl_bom_mult_grade_contrast',
                deploymentId: 'customdeploy_rl_bom_mult_grade_contrast'
            }), {
                funcName: "getCompareNumber"
            }, function(result) {
                if(result.code != 200) {
                    return alert("执行脚本发生异常：" + result.body);
                }
                setFieldValue("custrecord_mult_contrast_bill_number", JSON.parse(result.body), true);
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

        function downloadFile(sUrl) {
            //iOS devices do not support downloading. We have to inform user about this.
            if (/(iP)/g.test(navigator.userAgent)) {
                alert('Your device does not support files downloading. Please try again in desktop browser.');
                return false;
            }
            var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
            var isSafari = navigator.userAgent.toLowerCase().indexOf('safari') > -1;
            //If in Chrome or Safari - download via virtual link click
            if (isChrome || isSafari) {
                //Creating new link node.
                var link = document.createElement('a');
                link.href = sUrl;
        
                if (link.download !== undefined) {
                    //Set HTML5 download attribute. This will prevent file from opening if supported.
                    var fileName = sUrl.substring(sUrl.lastIndexOf('/') + 1, sUrl.length);
                    link.download = fileName;
                }
        
                //Dispatching click event.
                if (document.createEvent) {
                    var e = document.createEvent('MouseEvents');
                    e.initEvent('click', true, true);
                    link.dispatchEvent(e);
                    return true;
                }
            }
        
            // Force file download (whether supported by server).
            if (sUrl.indexOf('?') === -1) {
                sUrl += '?download';
            }
            window.open(sUrl, '_self');
            return true;
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
        
        function getSublistMachine(sublistId) {
            return Ext.get(sublistId + "_splits").dom.machine;
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
            searchButtonEvent: searchButtonEvent,
            downloadExcelEvent: downloadExcelEvent
        };
    }
);
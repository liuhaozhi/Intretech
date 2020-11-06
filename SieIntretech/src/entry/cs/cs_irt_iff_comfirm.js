/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description  此程序用于搜索系统标准Invoice，然后合并生成发票单号的页面逻辑验证
 */
define([
    'N/currentRecord', 
    'N/ui/dialog',
    '../../app/app_ui_component_client.js'
], function (
    currentRecord,
    dialog,
    uiComponent
) {
    var sublistId = 'custpage_paged_sublist';
    var checkBoxId = 'custpage_paged_checked';
    var pageIdId = 'custpage_pageid';

    function pageInit(context) {
        debugger
        processCount(context, sublistId);
        var callFunc = window.custpage_paged_sublistMarkAll;
        custpage_paged_sublistMarkAll = function() {
            callFunc.apply(this, arguments);
            processCount(context, sublistId);
        };
    }

    function clickStandSubmit(){
        document.getElementById('submitter').click();
    }

    function cancelStatement() {
        var pageRec = currentRecord.get(),
            cancelValue = 'cancel';
        
        pageRec.setValue({
            fieldId: 'custpage_operation_type',
            value : cancelValue
        });
        var operateType = pageRec.getValue({
            fieldId: 'custpage_operation_type'
        });
        if(operateType === cancelValue){
            clickStandSubmit();
            return true;
        }else{
            dialog.alert({
                title: '错误',
                message: '操作错误，请稍后再试'
            });
            return false;
        }
    }

    function confirmStatement() {
        var pageRec = currentRecord.get()
            confirmValue = 'confirm';
        
        pageRec.setValue({
            fieldId: 'custpage_operation_type',
            value : confirmValue
        });
        var operateType = pageRec.getValue({
            fieldId: 'custpage_operation_type'
        });
        if(operateType === confirmValue){
            clickStandSubmit();
            return true;
        }else{
            dialog.alert({
                title: '错误',
                message: '操作错误，请稍后再试'
            });
            return false;
        }
    }

    //entry points
    // function pageInit(context) {
        
    // }

    function saveRecord(context) {
        var suiteletPage = context.currentRecord;
        var lineCount = suiteletPage.getLineCount({
            sublistId: sublistId
        });
        var totalSelected = 0;
        var operateType = suiteletPage.getValue({
            fieldId: 'custpage_operation_type'
        });
        var alertMsg = operateType === 'confirm' ? '您确定要同意申请单并生成账单吗？' : '您确定要撤回申请单吗？';

        for (var i = 0; i < lineCount; i++) {
            var isChecked = suiteletPage.getSublistValue({
                sublistId: sublistId,
                fieldId: checkBoxId,
                line: i
            });
            if (isChecked) {
                var billType = suiteletPage.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custpage_paged_custom_bill_type',
                    line: i
                });
                var rellInvoice = suiteletPage.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custpage_paged_custrecord_real_bill_number',
                    line: i
                });
                if(billType == '未知'){
                    dialog.alert({
                        title: '错误',
                        message: '您勾选了未知的类型，有可能是使用了其他语言所致，请使用中文或者英文。'
                    });
                    return false;
                }

                if(!rellInvoice){
                    dialog.alert({
                        title: '错误',
                        message: '您勾选了无实际发票号的选项，请核验。'
                    });
                    return false;
                }

                totalSelected++;
            }
        }

        if (!totalSelected) {
            dialog.alert({
                title: '错误',
                message: '您没有勾选任何条目'
            });
            return false;
        } else {
            return window.confirm(alertMsg);
        }
    }

    function fieldChanged(context) {
        if (context.fieldId == pageIdId) {//先检查是否为页码跳转
            var pageRec = context.currentRecord;
            var pageId = pageRec.getValue({
                fieldId: pageIdId
            });
            uiComponent.goToPage(pageId);
            processCount(context, sublistId);
        } else if(context.fieldId == checkBoxId) {
            processCount(context, sublistId);
        }
    }

    function processCount(context, sublidId, leaveFields) {
        var columns = getSublistColumns();
        var lineCount = context.currentRecord.getLineCount({
            sublistId: sublistId
        });
        var allCounts = columns.slice(0), scCounts = columns.slice(0);
        leaveFields = leaveFields || [];
        for (var i = 0; i < lineCount; i++) {
            var isChecked = context.currentRecord.getSublistValue({
                sublistId: sublistId,
                fieldId: checkBoxId,
                line: i
            });
            for(var j in columns) {
                var fieldId = columns[j];
                if(!fieldId || leaveFields.indexOf(fieldId) > -1 || leaveFields[fieldId]) { continue; }
                var fieldValue = context.currentRecord.getSublistValue({
                    sublistId: sublistId,
                    fieldId: fieldId,
                    line: i
                });
                if(typeof fieldValue == "number") {
                    allCounts[j] = typeof allCounts[j] == "number"? allCounts[j]: 0;
                    allCounts[j] = fieldValue + (allCounts[j] || 0);
                    if(isChecked) {
                        scCounts[j] = typeof scCounts[j] == "number"? scCounts[j]: 0;
                        scCounts[j] = fieldValue + (scCounts[j] || 0);
                    }
                }
            }
        }
        var allEl = "<tr class='machine-manul-row uir-list-row-tr uir-list-row-odd'>", scEl = "<tr class='machine-manul-row uir-list-row-tr uir-list-row-odd'>";
        for(var i = 0; i < columns.length; i++) {
            allEl += "<td class='uir-list-row-cell' style='text-align:right;'>" + '<span style="font-weight:bold;">' +  (i? "": "合计") + (typeof allCounts[i] == "number"? allCounts[i].toFixed(2): "") + "</span></td>";
            scEl += "<td class='uir-list-row-cell' style='text-align:right;'>" + '<span style="font-weight:bold;">' +  (i? "": "勾选合计") + (typeof scCounts[i] == "number"? scCounts[i].toFixed(2): "") + "</span></td>";
        }
        allEl += "</tr>", allEl += "</tr>";
        var tbody = document.querySelector("#" + sublidId + "_splits>tbody");
        while(!(tbody.firstChild.className || "").indexOf("machine-manul-row")) {
            tbody.firstChild.remove();
            tbody.lastChild.remove();
        }
        var div = document.createElement("tbody");
        div.innerHTML = allEl + scEl;
        tbody.insertBefore(div.lastChild, tbody.firstChild), tbody.insertBefore(div.lastChild, tbody.firstChild);
        div.innerHTML = scEl + allEl;
        tbody.appendChild(div.firstChild), tbody.appendChild(div.firstChild);

        function getSublistColumns(col) {
            var headerNode = document.querySelectorAll("#custpage_paged_sublistheader>td");
            var columns = [];
            for(var i = 0; i < headerNode.length; i++) {
                var text = headerNode[col !== undefined? col: i].getAttribute("onclick") || "";
                var reg = new RegExp("\([^\)]*\)", "gmi");
                text = (reg.exec(text)[0]).split(",")[5] || "";
                columns.push(text.slice(1, -1));
                if(col !== undefined) { break; }
            }
            return columns;
        }
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        goToPage: uiComponent.goToPage,
        searchResults: uiComponent.searchResults,
        cancelStatement: cancelStatement,
        confirmStatement : confirmStatement
    }
});

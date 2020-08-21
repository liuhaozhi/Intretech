/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description 采购订单平台对应的客户端脚本
 */
define([
    'N/currentRecord',
    'N/https',
    'N/ui/dialog',
    'N/ui/message',
    'N/url',
    '../../app/app_ui_component_client'
], function (
    currentRecord,
    https,
    dialog,
    message,
    url,
    uiComponent
) {

    function getMarkUrl() {
        var _self = getMarkUrl;
        if (!_self.url) {
            _self.url = url.resolveScript({
                scriptId: 'customscript_rl_po_mark_line_read_status',
                deploymentId: 'customdeploy_rl_po_mark_line_read_status'
            });
        }

        return _self.url;
    }

    function getSelectedEntries() {
        var $ = jQuery,
            selectedCheckbox,
            platformSublist,
            lineIndexs = [],
            selectLines = [];

        selectedCheckbox = $('#platformFreezeSelector input[name^="custpage_sublist_line"]:checked');
        platformSublist = $('#platformSublist');

        selectedCheckbox.each(function (checkIndex, element) {
            var selectName,
                checkbox,
                selectLine = {};

            checkbox = $(element);
            selectName = checkbox.attr('name');
            platformSublist.find('tr.' + selectName + ' input').each(function (inputIndex, input) {
                var key;
                input = $(input);
                key = input.attr('name').match(/^(\D+)/);
                key = key ? key[0] : '';
                selectLine[key] = input.val();
            });

            selectLines.push(selectLine);
            lineIndexs.push(checkbox.closest('tr').index());
        });

        return {
            selectLines: selectLines,
            lineIndexs: lineIndexs
        }
    }

    function markReadStatus(type, msg) {
        var selectResults = getSelectedEntries(),
            selectLines = selectResults.selectLines,
            lineIndexs = selectResults.lineIndexs,
            notifyMsg,
            orderLines = {},
            $ = jQuery,
            selectedCheckbox = $('#platformFreezeSelector tr'),
            platformSublist = $('#platformSublist tr:not(:first-child)');

        console.log('selectResults', selectResults);

        if (selectLines.length) {
            //禁用按钮，防止重复提交
            $('#custpage_mark_as_read, #custpage_mark_as_unread').attr('disabled', 'disabled');
            selectLines.forEach(function (line) {
                var orderId = line.custpage_internalid,
                    lineId = line.custpage_line;

                if (!orderLines[orderId]) {
                    orderLines[orderId] = [];
                }

                orderLines[orderId].push(lineId);
            });

            notifyMsg = message.create({
                title: '提示',
                message: '标记处理中...',
                type: message.Type.INFORMATION
            });
            notifyMsg.show();

            //远程修改状态
            https.post.promise({
                url: getMarkUrl(),
                headers: {
                    'Content-Type': 'application/json'
                },
                body: {
                    operateType: type,
                    orderLines: orderLines
                }
            }).then(function (response) {
                var rspBody,
                    successCount,
                    reqCount = Object.keys(orderLines).length;
                console.log('response.body', response.body);

                notifyMsg.hide();
                $('#custpage_mark_as_read, #custpage_mark_as_unread').removeAttr('disabled');

                try {
                    rspBody = JSON.parse(response.body);
                } catch (ex) {
                    console.log('parse response.body error', ex);
                }
                if (rspBody) {
                    successCount = rspBody.success.length;
                    if (successCount === reqCount) {
                        dialog.alert({
                            title: '提示',
                            message: '标记' + msg + '全部成功，您可以点击查询按钮重新查询'
                        });
                        if (type === 'markAsRead') {
                            lineIndexs.forEach(function (index) {
                                selectedCheckbox.eq(index).addClass('platformDisableLine');
                                platformSublist.eq(index).addClass('platformDisableLine');
                            });
                        } else {
                            lineIndexs.forEach(function (index) {
                                selectedCheckbox.eq(index).removeClass('platformDisableLine');
                                platformSublist.eq(index).removeClass('platformDisableLine');
                            });
                        }
                    } else if (successCount > 0) {
                        dialog.alert({
                            title: '提示',
                            message: '标记' + msg + '部分成功，部分失败，您可以点击查询按钮重新查询'
                        });
                    } else {
                        dialog.alert({
                            title: '提示',
                            message: '标记' + msg + '全部失败，请稍后再试'
                        });
                    }
                } else {
                    dialog.alert({
                        title: '提示',
                        message: '标记' + msg + '全部失败，可能是网络原因，请稍后再试'
                    });
                }
            }).catch(function (ex) {
                notifyMsg.hide();
                $('#custpage_mark_as_read, #custpage_mark_as_unread').removeAttr('disabled');
                dialog.alert({
                    title: '提示',
                    message: '标记' + msg + '全部失败，错误提示:' + ex.toString()
                });
            });
        } else {
            dialog.alert({
                title: '提示',
                message: '您没有勾选任何条目'
            });
            return false;
        }
    }

    function markAsRead() {
        markReadStatus('markAsRead', '已读');
    }

    function markAsUnread() {
        markReadStatus('markAsUnread', '未读');
    }

    //entry point
    // function pageInit(context) {

    // }

    // function saveRecord(context) {

    // }

    function fieldChanged(context) {
        if (context.fieldId === 'custpage_pageid') {//先检查是否为页码跳转
            var pageRec = context.currentRecord,
                pageId = pageRec.getValue({
                    fieldId: context.fieldId
                });
            uiComponent.goToPage(pageId);
        }
    }

    return {
        // pageInit: pageInit,
        // saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        goToPage: uiComponent.goToPage,
        searchResults: uiComponent.searchResults,
        markAsRead: markAsRead,
        markAsUnread: markAsUnread
    }
});
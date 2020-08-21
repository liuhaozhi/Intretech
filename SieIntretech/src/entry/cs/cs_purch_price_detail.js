/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description 采购价格明细页面验证
 */
define(['N/search', 'N/ui/dialog'], function (search, dialog) {

    var pageMode;

    function checkIsDuplicate(context) {
        var pageRec = context.currentRecord,
            item = pageRec.getValue({
                fieldId: 'custrecord_field_item'
            }),
            vendor = pageRec.getValue({
                fieldId: 'custrecord_field_vendor'
            }),
            currency = pageRec.getValue({
                fieldId: 'custrecord_field_currencies'
            }),
            startQty = pageRec.getValue({
                fieldId: 'custrecord_field_start1'
            }),
            endQty = pageRec.getValue({
                fieldId: 'custrecord_field_stop'
            }),
            filters = [
                ['isinactive', 'is', 'F'],
                'AND',
                ['custrecord_field_status', 'is', '1'/* '2' */],
                'AND',
                ['custrecord_field_start_date', 'onorbefore', 'today'],
                'AND',
                ['custrecord_field_stop_date', 'onorafter', 'today'],
                'AND',
                ['custrecord_field_item', 'anyof', [item]],
                'AND',
                ['custrecord_field_vendor', 'anyof', [vendor]],
                'AND',
                ['custrecord_field_currencies', 'anyof', [currency]],
                'AND',
                [
                    ['formulanumeric:CASE WHEN ' + startQty + ' BETWEEN {custrecord_field_start1} AND {custrecord_field_stop} THEN 1 ELSE 0 END', 'equalto', 1],
                    'OR',
                    ['formulanumeric:CASE WHEN ' + endQty + ' BETWEEN {custrecord_field_start1} AND {custrecord_field_stop} THEN 1 ELSE 0 END', 'equalto', 1]
                ]
            ],
            columns = [
                'custrecord_field_start1',
                'custrecord_field_stop'
            ],
            duplicateRange = null;

        if (startQty > endQty) {
            dialog.alert({
                title: '错误',
                message: '结束数量不能大于开始数量'
            });
            return true;
        }

        if (pageMode == 'edit' && pageRec.id) {
            filters.push(
                'AND',
                ['internalid', 'noneof', [pageRec.id]]
            );
        }

        try {
            search.create({
                type: pageRec.type,
                filters: filters,
                columns: columns
            }).run().each(function (result) {
                duplicateRange = {
                    startQty: result.getValue({
                        name: 'custrecord_field_start1'
                    }),
                    endQty: result.getValue({
                        name: 'custrecord_field_stop'
                    })
                }
                return false;
            });

            if (duplicateRange) {
                // dialog.alert({
                //     title: '错误',
                //     message: '您输入的数量区间和现有的价格表数量有重复区间，请修改后重试。重复的价格区间为：' + duplicateRange.startQty + '-' + duplicateRange.endQty
                // });
                return !window.confirm('您输入的数量区间和现有的价格表数量有重复区间，确定提交吗？\n重复的价格区间为：' + duplicateRange.startQty + '-' + duplicateRange.endQty);
            } else {
                return false;
            }
        } catch (ex) {
            dialog.alert({
                title: '错误',
                message: '验证数量区间错误，请稍后再试。错误提示：' + ex.message
            });
            return true;
        }
    }

    function setEndDate(context) {
        var pageRec = context.currentRecord,
            startDate = pageRec.getValue({
                fieldId: context.fieldId
            });

        if (startDate) {
            try {
                startDate.setDate(startDate.getDate() + 400);
                pageRec.setValue({
                    fieldId: 'custrecord_field_stop_date',
                    value: startDate
                });
            } catch (ex) {
                console.log('set end date error', ex);
            }
        }
    }

    //entry points
    function pageInit(context) {
        pageMode = context.mode;
    }

    function saveRecord(context) {
        var isRangeDuplicate = checkIsDuplicate(context);
        if (isRangeDuplicate) {
            return false;
        }

        return true;
    }

    function fieldChanged(context) {
        if (context.fieldId === 'custrecord_field_start_date') {
            setEndDate(context);
        }
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        fieldChanged: fieldChanged//,
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});

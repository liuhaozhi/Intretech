/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *@author Charles Zhang
 *@description 采购价格明细页面验证
 */
define(['N/search', 'N/record'], function (search, record) {

    function checkIsDuplicate(context) {
        var pageRec = context.newRecord,
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
            throw '结束数量不能大于开始数量';
        }

        // if (context.type === context.UserEventType.EDIT) {
        //     filters.push(
        //         'AND',
        //         ['internalid', 'noneof', [pageRec.id]]
        //     );
        // }

        // //查询区间是否重复
        // search.create({
        //     type: pageRec.type,
        //     filters: filters,
        //     columns: columns
        // }).run().each(function (result) {
        //     duplicateRange = {
        //         startQty: result.getValue({
        //             name: 'custrecord_field_start1'
        //         }),
        //         endQty: result.getValue({
        //             name: 'custrecord_field_stop'
        //         })
        //     };
        //     return false;
        // });

        // if (duplicateRange) {
        //     throw '您输入的数量区间和现有的价格表数量有重复区间，请修改后重试。重复的价格区间为：' + duplicateRange.startQty + '-' + duplicateRange.endQty;
        // }
    }

    function checkIfFirstLevel(context) {
        var pageRec = context.newRecord,
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
                ['custrecord_field_currencies', 'anyof', [currency]]
            ],
            columns = [
                'custrecord_field_start1',
                'custrecord_field_stop'
            ],
            isLevelPrice = false;

        try {
            search.create({
                type: pageRec.type,
                filters: filters,
                columns: columns
            }).run().each(function (result) {
                if(startQty != result.getValue(result.columns[0]) || endQty != result.getValue(result.columns[1])) {
                    isLevelPrice = true;
                }
                return !isLevelPrice;
            });

            if (isLevelPrice) {
                pageRec.setValue({
                    fieldId: 'custrecord_tiering_price',
                    value: true
                });
            }
        } catch (ex) {
            log.error({
                title: 'set price is level error',
                details: ex
            });
        }
    }

    function autoFillParent(context) {
        var pageRec = context.newRecord,
            item = pageRec.getValue({
                fieldId: 'custrecord_field_item'
            }),
            subsidiary = pageRec.getValue({
                fieldId: 'custrecord_price_company'
            }),
            vendor = pageRec.getValue({
                fieldId: 'custrecord_field_vendor'
            }),
            curParentId = pageRec.getValue({
                fieldId: 'custrecord_po_price_list'
            }),
            parentId = null,
            parentRec,
            subsidiaryId = '',
            vendorId,
            itemId,
            parentType = 'customrecord_price_apply_main_form';

        try {
            if (curParentId) {
                return true;
            }

            search.create({
                type: parentType,
                filters: [
                    ['custrecord_vql_field_entity', 'is', vendor],
                    'AND',
                    ['custrecord_item_in_list', 'is', item],
                    'AND',
                    ['custrecord_company_name_1', 'is', subsidiary]
                ],
                columns: [
                    {
                        name: 'internalid',
                        sort: search.Sort.DESC
                    }
                ]
            }).run().each(function (result) {
                parentId = result.id;
                return false;
            });

            if (!parentId) {
                subsidiaryId = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['name']
                })['name'];
                vendorId = search.lookupFields({
                    type: 'vendor',
                    id: vendor,
                    columns: ['entityid']
                })['entityid'];
                itemId = search.lookupFields({
                    type: 'item',
                    id: item,
                    columns: ['itemid']
                })['itemid'];

                parentRec = record.create({
                    type: parentType
                });
                parentRec.setValue({
                    fieldId: 'name',
                    value: subsidiaryId + '+' + vendorId + '+' + itemId
                });
                parentRec.setValue({
                    fieldId: 'custrecord_vql_field_entity',
                    value: vendor
                });
                parentRec.setValue({
                    fieldId: 'custrecord_item_in_list',
                    value: item
                });
                parentRec.setValue({
                    fieldId: 'custrecord_company_name_1',
                    value: subsidiary
                });
                parentId = parentRec.save({
                    ignoreMandatoryFields: true
                });
            }

            pageRec.setValue({
                fieldId: 'custrecord_po_price_list',
                value: parentId
            });
        } catch (ex) {
            log.error({
                title: 'auto set parent id error',
                details: ex
            });
            throw '自动设置采购价格申请父记录失败，请手动更新。错误提示：' + ex.message;
        }
    }

    function beforeSubmit(context) {
        if (context.type === context.UserEventType.EDIT) {
            //检测区间是否重复
            checkIsDuplicate(context);
        }

        if (context.type === context.UserEventType.CREATE) {
            //自动检测父记录
            autoFillParent(context);
            //检测区间是否重复
            checkIsDuplicate(context);
            //检测是否为阶梯价格
            checkIfFirstLevel(context);
        }
    }

    return {
        // beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        // afterSubmit: afterSubmit
    }
});
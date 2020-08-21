/**
 *@NApiVersion 2.0
 *@author yuming Hu
 *@description UI组件对应的服务端程序
 */
define([
    'N/ui/serverWidget',
    'N/url',
    'N/runtime'
], function (
    serverWidget,
    url,
    runtime
) {

    var sublistCheckedId = 'custpage_checked';
    var pageSizeId = 'custpage_pagesize';
    var pageIdId = 'custpage_pageid';
    var sublistPushFlagId = 'custpage_pushflag';
    var pushFlagSourceId = 'customlist_whether_list';
    var cacheFieldId = 'custpage_pagecache';
    var cpnpFieldId = 'custpage_no_pushdown'; //工单下推未下推数量
    var cqnpdFieldId = 'custpage_quantity_not_pushed_down'; //销售订单下推，未下推数量
    var defaultPageSize = 500;
    var defaultPushValue = 1;

    function createForm(option) {
        var title = option.title;
        var csPath = option.csPath;
        var submitLabel = option.submitLabel;
        var resetLabel = option.resetLabel;
        var buttons = option.buttons;

        //创建Form
        var form = serverWidget.createForm({
            title: title
        });

        //设置客户端脚本
        if (csPath) {
            form.clientScriptModulePath = csPath;
        }

        //提交按钮
        if (submitLabel) {
            form.addSubmitButton({
                label: submitLabel
            });
        }

        //重置按钮
        if (resetLabel) {
            form.addResetButton({
                label: resetLabel
            });
        }

        //自定义按钮
        if (buttons) {
            buttons.forEach(function (info) {
                form.addButton(info);
            });
        }

        return form;
    }

    function createFields(option) {
        var form = option.form;
        var fields = option.fields;
        var container = option.container;
        var group = option.group;
        var parameters = option.parameters || {};
        //var addFilters = option.addFilters;
        var refreshParams = option.refreshParams;

        if (group) {
            if (container) group.tab = container;
            form.addFieldGroup(group);
            container = group.id;
        }

        //创建字段
        fields.forEach(function (property) {
            var fieldId = property.id;
            var fieldLabel = property.label;
            var fieldType = property.type;
            var fieldSource = property.source;
            var fieldLayout = property.layout;
            var fieldBreak = property.break;
            var fieldDisplay = property.display;
            var defaultValue = property.defaultValue;
            var fieldWidth = property.width;
            var fieldHeight = property.height;
            var fieldFilter = property.filter;
            var fieldOperator = property.operator;
            var searchValue = parameters[fieldId];

            var newFieldProp = {
                id: fieldId,
                label: fieldLabel,
                type: serverWidget.FieldType[fieldType]
            };

            if (container) {
                newFieldProp.container = container;
            }

            //引用系统数据的下拉字段
            if (util.isString(fieldSource)) {
                newFieldProp.source = fieldSource;
            }

            //创建字段
            var newField = form.addField(newFieldProp);

            //自定义的下拉数据
            if (util.isArray(fieldSource)) {
                fieldSource.forEach(function (selectOpt) {
                    newField.addSelectOption(selectOpt);
                });
            }

            //设置格式
            if (fieldLayout) {
                newField.updateLayoutType({
                    layoutType: serverWidget.FieldLayoutType[fieldLayout]
                });
            }

            if (fieldBreak) {
                newField.updateBreakType({
                    breakType: serverWidget.FieldBreakType[fieldBreak]
                });
            }

            if (fieldDisplay) {
                newField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType[fieldDisplay]
                });
            }

            if (fieldWidth) {
                newField.updateDisplaySize({
                    width: fieldWidth,
                    height: fieldHeight
                });
            }

            if (defaultValue) {
                newField.defaultValue = defaultValue;
            }

            //设置搜索条件和页面初始化的值
            if (searchValue && fieldFilter && fieldOperator) {
                if (fieldType === 'MULTISELECT') {
                    searchValue = searchValue.trim().split(',');
                }

                //记录过滤器
                // addFilters.push(
                //     'AND',
                //     [fieldFilter, fieldOperator, searchValue]
                // );

                //记录刷新字段信息
                refreshParams[fieldId] = searchValue;
            }
        });

        log.debug('refreshParams', refreshParams);

        return form;
    }


    function createPagedSublist(option) {
        var form = option.form;
        var container = option.container;
        var sublist = option.sublist;
        var searchResults = [];
        var sublistColumnConfig = option.sublistColumnConfig;
        var searchObj = option.searchObj;
        var parameters = option.parameters;
        var pageSize = parseInt(parameters[pageSizeId]) || defaultPageSize;
        var pageId = parseInt(parameters[pageIdId]) || 1;
        var pageSelectOptions = [];
        var refreshParams = option.refreshParams;
        var pushFlagFieldId = option.pushFlagFieldId;

        //处理越界
        if (pageSize < 5) {
            pageSize = 5;
        } else if (pageSize > 1000) {
            pageSize = 1000;
        }

        var pagedData = searchObj.runPaged({
            pageSize: pageSize
        });

        log.debug('pagedData', pagedData);

        pageCount = pagedData.pageRanges.length;

        //处理越界
        if (pageId < 1) {
            pageId = 1
        } else if (pageId > pageCount) {
            pageId = pageCount;
        }

        //创建页面显示数量和页码下拉选项字段
        for (i = 1; i <= pageCount; i++) {
            pageSelectOptions.push({
                value: i,
                text: i
            });
        }
        createFields({
            form: form,
            container: container,
            group: {
                id: 'custpage_paged_pagerange',
                label: '分页选项'
            },
            fields: [{
                    id: pageIdId, //分页下拉选项
                    label: '共' + pageCount + '页',
                    type: 'SELECT',
                    source: pageSelectOptions,
                    layout: 'OUTSIDEBELOW'
                },
                {
                    id: pageSizeId, //每页显示数量
                    label: '每页数量(5-1000)',
                    type: 'INTEGER',
                    layout: 'OUTSIDEBELOW'
                }
            ]
        });

        //默认值
        refreshParams[pageIdId] = pageId.toString();
        refreshParams[pageSizeId] = pageSize;

        //创建Sublist
        if (container) sublist.tab = container;
        var sublistObj = form.addSublist(sublist);

        //设置上一页，下一页按钮和全选按钮
        if (pageId !== 1) {
            sublistObj.addButton({
                id: 'custpage_previous',
                label: '上一页',
                functionName: 'goToPage(' + (pageId - 1) + ')'
            });
        }
        if (pageId !== pageCount) {
            sublistObj.addButton({
                id: 'custpage_next',
                label: '下一页',
                functionName: 'goToPage(' + (pageId + 1) + ')'
            });
        }

        sublistObj.addMarkAllButtons();

        sublistObj.addField({
            id: sublistCheckedId,
            type: serverWidget.FieldType.CHECKBOX,
            label: '选择'
        });

        if (pushFlagFieldId) {
            sublistObj.addField({
                id: sublistPushFlagId,
                type: serverWidget.FieldType.SELECT,
                label: '是否下推',
                source: pushFlagSourceId
            }).defaultValue = defaultPushValue
        };

        for (var key in sublistColumnConfig) {
            if (sublistColumnConfig.hasOwnProperty(key)) {

                var sublistField;

                if (sublistColumnConfig[key].source) {
                    //if (sublistColumnConfig[key]) {
                    sublistField = sublistObj.addField({
                        id: key,
                        type: serverWidget.FieldType[sublistColumnConfig[key].type],
                        label: sublistColumnConfig[key].label,
                        source: sublistColumnConfig[key].source
                    });
                } else {
                    sublistField = sublistObj.addField({
                        id: key,
                        type: serverWidget.FieldType[sublistColumnConfig[key].type],
                        label: sublistColumnConfig[key].label
                    });
                }

                //设置格式
                if (sublistColumnConfig[key].fieldLayout) {
                    sublistField.updateLayoutType({
                        layoutType: serverWidget.FieldLayoutType[sublistColumnConfig[key].fieldLayout]
                    });
                }

                if (sublistColumnConfig[key].fieldBreak) {
                    sublistField.updateBreakType({
                        breakType: serverWidget.FieldBreakType[sublistColumnConfig[key].fieldBreak]
                    });
                }

                if (sublistColumnConfig[key].displayType) {
                    sublistField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType[sublistColumnConfig[key].displayType]
                    });
                }

                if (sublistColumnConfig[key].fieldWidth || sublistColumnConfig[key].fieldHeight) {
                    sublistField.updateDisplaySize({
                        width: sublistColumnConfig[key].fieldWidth,
                        height: sublistColumnConfig[key].fieldHeight
                    });
                }
            }
        }

        var columns = searchObj.columns;
        searchResults = [];
        //获取当页数据
        pageId--; //page 数组从0开始，而page id从1开始

        if (pagedData.count) {
            pagedData.fetch({
                index: pageId
            }).data.forEach(function (result) {
                var searchResultsObj = {};

                for (var i = 0; i < columns.length; i++) {
                    searchResultsObj[columns[i].name] = result.getValue(columns[i]);
                }

                searchResults.push(searchResultsObj);
                return true;
            });
        }

        log.debug('111', 111);

        searchResults.forEach(function (reslult, i) {

            for (var key in reslult) {
                if (reslult.hasOwnProperty(key)) {
                    var reg = /cust(\S+?_)/g;
                    var fieldId = key.match(reg) ? key.replace(/cust(\S+?_)/g, 'custpage_') : 'custpage_' + key; //a.replace(/cust(\S+?_)/g,'custpage_');

                    var curQty;

                    if (!reslult[key] && (fieldId == cpnpFieldId || fieldId == cqnpdFieldId)) {
                        curQty = reslult['quantity'];
                    } else {
                        curQty = reslult[key];
                    }

                    //cqnpdFieldId
                    // if (!reslult[key] && fieldId == cqnpdFieldId) {
                    //     curQty = reslult['quantity'];
                    // } else {
                    //     curQty = reslult[key];
                    // }

                    if (curQty) {
                        sublistObj.setSublistValue({
                            id: fieldId,
                            value: curQty,
                            line: i
                        });
                    }

                    // if (reslult[key]) {
                    //     if (fieldId == cpnpFieldId) {
                    //         log.debug('fieldId', fieldId);
                    //         if (reslult[key]) {
                    //             sublistObj.setSublistValue({
                    //                 id: fieldId,
                    //                 value: reslult[key],
                    //                 line: i
                    //             });
                    //         } else {
                    //             sublistObj.setSublistValue({
                    //                 id: fieldId,
                    //                 value: reslult['quantity'],
                    //                 line: i
                    //             });
                    //         }
                    //     } else {
                    //         sublistObj.setSublistValue({
                    //             id: fieldId,
                    //             value: reslult[key],
                    //             line: i
                    //         });
                    //     }
                    // }
                }
            };
        });

        return form;
    }

    function cachePageInfo(option) {
        var form = option.form;
        var refreshParams = option.refreshParams;
        var searchFields = option.searchFields;
        var sublistFields = option.sublistFields;
        var otherInfo = option.otherInfo;
        var currentScript = runtime.getCurrentScript();

        var cache = {
            refreshParams: refreshParams,
            searchFields: [],
            sublistFields: sublistFields,
            otherInfo: otherInfo,
            refreshURL: url.resolveScript({
                scriptId: currentScript.id,
                deploymentId: currentScript.deploymentId
            })
        };

        //收集需要搜索的字段
        searchFields.forEach(function (fieldConfig) {
            if (fieldConfig.filter && fieldConfig.operator) {
                cache.searchFields.push(fieldConfig.id);
            }
        });

        //设置一些默认信息在页面上，以便进行页面跳转或者查询的时候使用
        form.addField({
            id: cacheFieldId,
            label: 'Page Cache',
            type: serverWidget.FieldType.LONGTEXT
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        }).defaultValue = JSON.stringify(cache);
    }

    return {
        createForm: createForm,
        createFields: createFields,
        createPagedSublist: createPagedSublist,
        cachePageInfo: cachePageInfo
    }
});
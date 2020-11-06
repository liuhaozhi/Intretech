/**
 *@NApiVersion 2.0
 *@author Charles Zhang
 *@description UI组件对应的服务端程序
 */
define([
    'N/ui/serverWidget',
    'N/search',
    'N/url',
    'N/runtime'
], function (
    serverWidget,
    search,
    url,
    runtime
) {

    var sublistCheckedId = 'custpage_paged_checked',
        pageSizeId = 'custpage_pagesize',
        pageIdId = 'custpage_pageid',
        cacheFieldId = 'custpage_pagecache',
        defaultPageSize = 100;

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
        var addFilters = option.addFilters;
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

            //设置搜索条件和页面初始化的值
            if (searchValue && fieldFilter && fieldOperator) {
                if (fieldType === 'MULTISELECT') {
                    searchValue = searchValue.trim().split(',');
                }

                //记录过滤器
                addFilters.push(
                    'AND',
                    [fieldFilter, fieldOperator, searchValue]
                );

                //记录刷新字段信息
                refreshParams[fieldId] = searchValue;
            }
        });

        return form;
    }

    function createPagedSublist(option) {
        var form = option.form;
        var container = option.container;
        var sublist = option.sublist;
        var searchCriteria = option.searchCriteria;
        var sublistMark = option.sublistMark || 'paged';
        var sublistColumnConfig = option.sublistColumnConfig;
        var showAllCols = option.showAllCols;
        var parameters = option.parameters;
        var pageSize = parseInt(parameters[pageSizeId]) || option.origPageSize || defaultPageSize;
        var pageId = parseInt(parameters[pageIdId]) || 1;
        var addFilters = option.addFilters;
        var refreshParams = option.refreshParams;
        var fillOutSublist = option.fillOutSublist;
        var pageCount = 0;
        var searchObj;
        var formulaIndex = 0;
        var pageSelectOptions = [];
        var valueList = [];
        var addColumnIds = [];
        var sublistFields = [];

        //加载搜索
        if (util.isString(searchCriteria)) {
            searchObj = search.load({
                id: searchCriteria
            });
        } else {
            searchObj = search.create(searchCriteria);
        }
        if (addFilters.length) {
            searchObj.filterExpression = searchObj.filterExpression.concat(addFilters);
        }

        //处理越界
        if (pageSize < 5) {
            pageSize = 5;
        } else if (pageSize > 1000) {
            pageSize = 1000;
        }

        //搜索预览
        var pagedData = searchObj.runPaged({
            pageSize: pageSize
        });
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

        //如果没有结果，就直接返回
        if (!pagedData.count) {
            return {
                sublistFields: sublistFields
            }
        }

        //设置上一页，下一页按钮和全选按钮
        if (pageId !== 1) {
            sublistObj.addButton({
                id: 'custpage_' + sublistMark + '_previous',
                label: '上一页',
                functionName: 'goToPage(' + (pageId - 1) + ')'
            });
        }
        if (pageId !== pageCount) {
            sublistObj.addButton({
                id: 'custpage_' + sublistMark + '_next',
                label: '下一页',
                functionName: 'goToPage(' + (pageId + 1) + ')'
            });
        }
        sublistObj.addMarkAllButtons();

        //创建列字段
        //勾选框
        sublistObj.addField({
            id: sublistCheckedId,
            type: serverWidget.FieldType.CHECKBOX,
            label: '选择'
        });

        //创建其他列
        searchObj.columns.forEach(function (column) {
            //计算Sublist 字段ID
            var sublistField;
            var fieldId = column.name;
            var fieldJoin = column.join;
            var fieldFormula = column.formula;
            if (fieldJoin) {
                fieldId = fieldJoin + '_' + fieldId;
            }
            if (fieldFormula) {
                fieldId = fieldId + '_' + formulaIndex++;
            }
            fieldId = 'custpage_' + sublistMark + '_' + fieldId;
            fieldId = fieldId.toLowerCase();

            //记录字段id和column的对应关系，用于后续Sublist的值填写
            var columnConfig = sublistColumnConfig[fieldId];
            if (columnConfig) {
                sublistColumnConfig[fieldId].column = column;
            } else {
                sublistColumnConfig[fieldId] = {
                    column: column
                };
            }

            //创建字段
            if (columnConfig) {
                sublistField = sublistObj.addField({
                    id: fieldId,
                    type: serverWidget.FieldType[columnConfig.type],
                    label: columnConfig.label || column.label,
                    source: columnConfig.source
                });
                if (columnConfig.displayType) {
                    sublistField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType[columnConfig.displayType]
                    });
                }

                //如果有附加字段，则添加
                if (columnConfig.nextFields) {
                    util.each(columnConfig.nextFields, function (fieldInfo, nextFieldId) {
                        var nextField = sublistObj.addField({
                            id: nextFieldId,
                            type: serverWidget.FieldType[fieldInfo.type],
                            label: fieldInfo.label,
                            source: fieldInfo.source
                        });
                        if (fieldInfo.displayType) {
                            nextField.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType[fieldInfo.displayType]
                            });
                        }
                        addColumnIds.push(nextFieldId);
                    });
                }
            } else {
                sublistField = sublistObj.addField({
                    id: fieldId,
                    type: serverWidget.FieldType.TEXT,
                    label: column.label
                });
                if (!showAllCols) {
                    sublistField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                }
            }
        });

        //缓存Sublist字段ID，以备前端代码使用
        sublistFields = Object.keys(sublistColumnConfig).concat(addColumnIds);

        //获取当页数据
        pageId--; //page 数组从0开始，而page id从1开始
        pagedData.fetch({
            index: pageId
        }).data.forEach(function (result) {
            var sublistLine = {};
            util.each(sublistColumnConfig, function (columnConfig, sublistFieldId) {
                var resultColumn = columnConfig.column;
                sublistLine[sublistFieldId] = columnConfig.useText ? result.getText(resultColumn) : result.getValue(resultColumn);
            });
            valueList.push(sublistLine);
            return true;
        });

        // log.debug('valueList', valueList);

        // 填充sublist的值
        if (fillOutSublist) { //进一步处理子列表数据
            fillOutSublist({
                sublistObj: sublistObj,
                valueList: valueList
            });
        } else { //直接渲染子列表
            valueList.forEach(function (sublistLine, index) {
                util.each(sublistLine, function (value, id) {
                    if (value || value === 0) {
                        sublistObj.setSublistValue({
                            id: id,
                            value: value,
                            line: index
                        });
                    }
                });
            });
        }

        return {
            sublistFields: sublistFields
        }
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

    function getOrderTypeSelection(form, needUrl) {
        var orderTypeField,
            orderTypeList = [{
                    text: '采购订单',
                    scriptId: 'customscript_sl_po_platform',
                    deploymentId: 'customdeploy_sl_po_platform'
                },
                {
                    text: '采购请求',
                    scriptId: 'customscript_sl_purchase_platform',
                    deploymentId: 'customdeploy_sl_purchase_platform'
                },
                {
                    text: '采购计划单',
                    scriptId: 'customscript_sl_purchase_platform',
                    deploymentId: 'customdeploy_sl_purchase_platform'
                },
                {
                    text: '销售订单',
                    scriptId: 'customscript_sl_purchase_platform',
                    deploymentId: 'customdeploy_sl_purchase_platform'
                },
                {
                    text: '工单',
                    scriptId: 'customscript_sl_purchase_platform',
                    deploymentId: 'customdeploy_sl_purchase_platform'
                }
            ];


        //获取平台的URL
        if (needUrl) {
            orderTypeList.forEach(function (currentSelect) {
                currentSelect.value = url.resolveScript({
                    scriptId: currentSelect.scriptId,
                    deploymentId: currentSelect.deploymentId
                });
            });
        } else {
            orderTypeList.forEach(function (currentSelect) {
                currentSelect.value = currentSelect.scriptId + '@' + currentSelect.deploymentId
            });
        }

        if (form) {
            orderTypeField = form.addField({
                id: 'custpage_order_type',
                type: serverWidget.FieldType.SELECT,
                label: '订单类型'
            });

            orderTypeList.reduce(function (fieldObj, currentSelect) {
                fieldObj.addSelectOption(currentSelect);
                return fieldObj;
            }, orderTypeField);

            orderTypeField.isMandatory = true;
        }

        return orderTypeList;
    }

    return {
        createForm: createForm,
        createFields: createFields,
        createPagedSublist: createPagedSublist,
        cachePageInfo: cachePageInfo,
        getOrderTypeSelection: getOrderTypeSelection
    }
});
/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 采购订单平台
 */
define([
    'N/ui/serverWidget',
    'N/search',
    // 'N/redirect',
    // 'N/format',
    // 'N/runtime',
    // 'N/task',
    'N/file',
    'N/render',
    '../../app/app_ui_component_server.js',
    // '../../../lib/common_lib.js'
], function (
    serverWidget,
    search,
    // redirect,
    // format,
    // runtime,
    // task,
    file,
    render,
    uiComponent//,
    // commonLib
) {

    var sublistId = 'custpage_sublist';
    var pageSizeId = 'custpage_pagesize';
    var pageIdId = 'custpage_pageid';
    var defaultPageSize = 500;

    function createHtmlField(option) {
        var type = option.type,
            fieldId = option.fieldId,
            value = option.value,
            text = option.text,
            elementHtml;

        if (type === 'text') {
            elementHtml = text + '<input type="hidden" value="' + value + '" name="' + fieldId + '" />';
        } else if (type === 'input') {
            elementHtml = '<input type="text" value="' + value + '" name="' + fieldId + '" />';
        } else {
            elementHtml = text;
        }

        return elementHtml;
    }

    function createPagedSublistHTML(option) {
        var form = option.form;
        var searchCriteria = option.searchCriteria;
        var sublistColumnConfig = option.sublistColumnConfig || {};
        var parameters = option.parameters;
        var pageSize = parseInt(parameters[pageSizeId]) || defaultPageSize;
        var pageId = parseInt(parameters[pageIdId]) || 1;
        var addFilters = option.addFilters;
        var refreshParams = option.refreshParams;
        var pageCount = 0;
        var searchObj;
        var formulaIndex = 0;
        var pageSelectOptions = [];
        var valueList = [];
        var sublistFields = [];
        var singleColumnSep = 8;
        var columnCount = 0;
        var fieldPrefix = 'custpage_';
        var htmlSublist;
        var renderData = {
            titles: [],
            lines: [],
            columnSeparates: 1,
            totalLineCount: 0,
            defaultWidth : 1200
        };

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
        uiComponent.createFields({
            form: form,
            fields: [
                {
                    id: pageIdId,//分页下拉选项
                    label: '共' + pageCount + '页',
                    type: 'SELECT',
                    source: pageSelectOptions,
                    layout: 'OUTSIDEBELOW'
                },
                {
                    id: pageSizeId,//每页显示数量
                    label: '每页数量(5-1000)',
                    type: 'INTEGER',
                    layout: 'OUTSIDEBELOW',
                    display: 'HIDDEN'
                }
            ]
        });
        //默认值
        refreshParams[pageIdId] = pageId.toString();
        refreshParams[pageSizeId] = pageSize;

        //创建Sublist
        htmlSublist = form.addField({
            type: 'inlinehtml',
            id: sublistId,
            label: '搜索结果'
        });
        htmlSublist.updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
        });
        htmlSublist.updateBreakType({
            breakType: serverWidget.FieldBreakType.STARTROW
        });

        //如果没有结果，就直接返回
        if (!pagedData.count) {
            htmlSublist.defaultValue = '<b>没有查询到任何结果</b>';
            return {
                sublistFields: sublistFields
            };
        }

        //设置上一页，下一页按钮和全选按钮
        if (pageId !== 1) {
            form.addButton({
                id: 'custpage_previous',
                label: '上一页',
                functionName: 'goToPage(' + (pageId - 1) + ')'
            });
        }
        if (pageId !== pageCount) {
            form.addButton({
                id: 'custpage_next',
                label: '下一页',
                functionName: 'goToPage(' + (pageId + 1) + ')'
            });
        }

        //根据动态创建列
        searchObj.columns.forEach(function (column) {
            //计算Sublist 字段ID
            var fieldId = column.name,
                fieldJoin = column.join,
                fieldFormula = column.formula,
                columnConfig;

            if (fieldJoin) {
                fieldId = fieldJoin + '_' + fieldId;
            }
            if (fieldFormula) {
                fieldId = fieldId + '_' + formulaIndex++;
            }
            fieldId = fieldPrefix + fieldId;
            fieldId = fieldId.toLowerCase();

            //记录字段id和column的对应关系，用于后续Sublist的值填写
            columnConfig = sublistColumnConfig[fieldId];
            
            if (columnConfig) {
                sublistColumnConfig[fieldId].column = column;
            } else {
                sublistColumnConfig[fieldId] = {
                    column: column,
                    type: 'view'
                };
            }
        });

        // log.debug('sublistColumnConfig', sublistColumnConfig);

        //缓存Sublist字段ID，以备前端代码使用
        // sublistFields = Object.keys(sublistColumnConfig);

        //获取当页数据
        pageId--;//page 数组从0开始，而page id从1开始
        // log.debug('pageId', pageId);
        pagedData.fetch({ index: pageId }).data.forEach(function (result, resultIndex) {
            var sublistLine = {
                values: [],
                lineId: sublistId + '_line' + resultIndex
            };

            util.each(sublistColumnConfig, function (columnConfig, sublistFieldId) {
                var resultColumn = columnConfig.column;
                if(!resultColumn){
                    return true;
                }
                var fieldType = columnConfig.type,
                    fieldId = sublistFieldId + resultIndex,
                    fieldDisplay = columnConfig.display || '',
                    columnText = result.getText(resultColumn),
                    columnValue = result.getValue(resultColumn);

                if (!columnText) {
                    columnText = columnValue;
                }

                sublistLine.values.push({
                    html : createHtmlField({
                        type: fieldType,
                        fieldId: fieldId,
                        value: columnValue,
                        text: columnText
                    }),
                    display : fieldDisplay
                });

                //插入标题
                if (resultIndex === 0) {
                    renderData.titles.push({
                        display : fieldDisplay,
                        value : resultColumn.label || 'unknown'
                    });
                }
            });

            valueList.push(sublistLine);
            return true;
        });

        // log.debug('valueList', valueList);

        //输出渲染数据
        columnCount = searchObj.columns.length;
        renderData.lines = valueList;
        renderData.columnSeparates = Math.ceil(columnCount / singleColumnSep);
        renderData.totalLineCount = valueList.length;
        renderData.defaultWidth = renderData.columnSeparates * 1200;

        //生成表格
        var renderer = render.create(),
            fileObj = file.load({
                id: '../../templates/po_platform_tpl.html'
            });
        renderer.templateContent = fileObj.getContents();
        renderer.addCustomDataSource({
            format: render.DataSource.OBJECT,
            alias: 'renderData',
            data: renderData
        });
        htmlSublist.defaultValue = renderer.renderAsString();

        return {
            sublistFields: sublistFields
        }
    }

    function viewPage(request, response) {
        var inputParams = request.parameters,
            parameters,
            form,
            addFilters = [],
            refreshParams = {},
            clientScript = '../entry/cs/cs_po_platform',
            searchId = 'customsearch_material_plan_platform_po',
            sublistConfig = {},
            searchBodyFields = [
                {
                    id: 'custpage_order_vendor',
                    label: '供应商',
                    type: 'SELECT',
                    source: 'vendor',
                    filter: 'mainname',
                    operator: 'anyof',
                    layout: 'OUTSIDEBELOW'
                },
                {
                    id: 'custpage_order_date',
                    label: '订单日期',
                    type: 'DATE',
                    filter: 'trandate',
                    operator: 'on',
                    layout: 'OUTSIDEBELOW'
                },
                {
                    id: 'custpage_read_status',
                    label: '读取状态',
                    type: 'SELECT',
                    source: [
                        {
                            text: '未读',
                            value: 'F'
                        },
                        {
                            text: '已读',
                            value: 'T'
                        }
                    ],
                    filter: 'custcol_po_line_whether_read',
                    operator: 'is',
                    layout: 'OUTSIDEBELOW'
                }
            ],
            sublistColumnConfig = {
                'custpage_internalid': {
                    type: 'text',
                    display : 'hidden'
                },
                'custpage_line' : {
                    type : 'text',
                    display : 'hidden'
                }
            };

        try {
            parameters = util.extend({}, inputParams);
            if(!parameters.custpage_read_status){
                parameters.custpage_read_status = 'F';
            }

            //创建表单
            form = uiComponent.createForm({
                title: '采购订单执行平台',
                csPath: clientScript,
                submitLabel: '提交',
                buttons: [
                    {
                        id: 'custpage_search',
                        label: '查询',
                        functionName: 'searchResults'
                    },
                    {
                        id: 'custpage_mark_as_read',
                        label: '标记为已读',
                        functionName: 'markAsRead'
                    },
                    {
                        id: 'custpage_mark_as_unread',
                        label: '标记为未读',
                        functionName: 'markAsUnread'
                    }
                ]
            });

            //创建搜索字段
            uiComponent.createFields({
                form: form,
                // group: {
                //     id: 'custpage_group_search_fields',
                //     label: '搜索条件'
                // },
                fields: searchBodyFields,
                parameters: parameters,
                addFilters: addFilters,
                refreshParams: refreshParams
            });

            //创建显示结果的子列表
            sublistConfig = createPagedSublistHTML({
                form: form,
                searchCriteria: searchId,
                sublistColumnConfig: sublistColumnConfig,
                parameters: parameters,
                addFilters: addFilters,
                refreshParams: refreshParams
            });

            //设置默认值
            form.updateDefaultValues(refreshParams);
 
            //缓存结果
            uiComponent.cachePageInfo({
                form: form,
                refreshParams: refreshParams,
                searchFields: searchBodyFields,
                sublistFields: sublistConfig.sublistFields,
                otherInfo: {
                    defaultPageSize: defaultPageSize
                }
            });

            response.writePage({
                pageObject: form
            });
        } catch (ex) {
            log.error({
                title: 'render page error',
                details: ex
            });
            response.write({
                output: '采购订单工作台页面生成失败，错误提示：' + ex.message
            });
        }
    }

    function submitPage(request, response) {
        try {
            var parameters = request.parameters;
            response.write({
                output: JSON.stringify(parameters)
            });
            return;
        } catch (ex) {
            log.error({
                title: 'submit page error',
                details: ex
            });
            response.write({
                output: '页面提交失败，错误提示：' + ex.message
            });
        }
    }

    function onRequest(context) {
        var request = context.request,
            response = context.response;

        if (request.method === 'GET') {
            viewPage(request, response);
        } else {
            submitPage(request, response);
        }
    }

    return {
        onRequest: onRequest
    }
});
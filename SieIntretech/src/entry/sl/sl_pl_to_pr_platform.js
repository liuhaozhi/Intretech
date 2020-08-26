/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 此程序主要用于计划单到自定义请购单的批量操作平台
 */
define([
    'N/ui/serverWidget',
    'N/search',
    'N/url',
    'N/runtime',
    'N/file',
    'N/render',
    '../../app/app_get_platform_user_prefs',
    'N/format',
], function (
    serverWidgetMod,
    searchMod,
    urlMod,
    runtimeMod,
    fileMod,
    renderMod,
    userPrefsMod,
    formatMod,
) {

    const textType = Symbol('text');
    const inputType = Symbol('input');
    const selectType = Symbol('select');
    const viewType = Symbol('view');
    const linkType = Symbol('link');
    var hasFilters = false;

    function createForm({ formTitle: title = '批量处理页面', hideNavBar = false, formCSPath, submitLabel, resetLabel, customButtons, fieldGroup, } = {}) {
        //创建Form
        const form = serverWidgetMod.createForm({
            title,
            hideNavBar
        });

        //设置客户端脚本
        if (formCSPath) {
            form.clientScriptModulePath = formCSPath;
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
        if (customButtons) {
            for (const btnInfo of customButtons) {
                form.addButton(btnInfo);
            }
        }

        return form;
    }

    function createFields({ form, tab, subtab, fieldGroup, fields, addFilters, refreshParams, parameters = {} } = {}) {
        const _self = createFields;
        const container = fieldGroup || subtab || tab;
        const utilMod = util;//全局模块

        //初始化标签和字段组管理
        if (!_self.existingTabs) {
            _self.existingTabs = new Set();
            _self.existingSubtabs = new Set();
            _self.existingFieldGroups = new Set();
        }

        const { existingTabs, existingSubtabs, existingFieldGroups } = _self;

        //创建标签
        if (tab && !existingTabs.has(tab.id)) {
            form.addTab(tab);
            existingTabs.add(tab.id);
        }

        //创建子标签
        if (subtab && !existingSubtabs.has(subtab.id)) {
            if (tab) {
                subtab.tab = tab.id;
            }
            form.addSubtab(subtab);
            existingSubtabs.add(subtab.id);
        }

        //创建字段组
        if (fieldGroup && !existingFieldGroups.has(fieldGroup.id)) {
            if (subtab) {
                fieldGroup.tab = subtab.id;
            } else if (tab) {
                fieldGroup.tab = tab.id;
            }
            form.addFieldGroup(fieldGroup);
            existingFieldGroups.add(fieldGroup.id)
        }

        //创建字段
        for (const fieldProperties of fields) {
            const {
                id,
                label,
                type,
                source,
                layoutType,
                breakType,
                displayType,
                displayWidth,
                displayHeight,
                isMandatory,
                linkText,
                helpText,
                filter,
                operator,
            } = fieldProperties;
            let { [id]: searchValue } = parameters;
            const newFieldProp = {
                id,
                label,
                type: serverWidgetMod.FieldType[type]
            };

            //属于哪个区域
            if (container) {
                newFieldProp.container = container.id;
            }

            //引用系统数据的下拉字段
            if (utilMod.isString(source) || utilMod.isNumber(source)) {
                newFieldProp.source = source;
            }

            //创建字段
            const newField = form.addField(newFieldProp);

            //自定义的下拉数据
            if (utilMod.isArray(source)) {
                source.forEach(opt => newField.addSelectOption(opt));
            }

            //设置演示样式
            if (layoutType) {
                newField.updateLayoutType({
                    layoutType: serverWidgetMod.FieldLayoutType[layoutType]
                });
            }
            if (breakType) {
                newField.updateBreakType({
                    breakType: serverWidgetMod.FieldBreakType[breakType]
                });
            }
            if (displayType) {
                newField.updateDisplayType({
                    displayType: serverWidgetMod.FieldDisplayType[displayType]
                });
            }
            if (displayWidth && displayHeight) {
                newField.updateDisplaySize({
                    width: displayWidth,
                    height: displayHeight
                });
            }

            //是否强制
            if (isMandatory !== undefined) {
                newField.isMandatory = isMandatory;
            }

            //链接文字
            if (linkText) {
                newField.linkText = linkText;
            }

            //帮助信息
            if (helpText) {
                newField.helpText = helpText;
            }

            //设置搜索条件和页面初始化的值
            if (filter && operator && searchValue) {
                searchValue = decodeURIComponent(searchValue);
                if (type === 'MULTISELECT') {
                    searchValue = searchValue.trim().split(',');
                } else if (type === 'CHECKBOX') {
                    searchValue = searchValue == 'true' ? 'T' : 'F';
                }

                //记录过滤器值
                addFilters.push('AND', [filter, operator, searchValue]);

                //记录刷新字段信息
                refreshParams[id] = searchValue;
            }
        }

        return form;
    }

    function createSelectFields(literals, ...params) {
        let html = '';
        for (const [index, param] of params.entries()) {
            html += literals[index];
            if (Array.isArray(param)) {
                const { curValue } = param;
                for (const { value, text } of param) {
                    html += `<option value="${value}" ${curValue == value ? 'selected' : ''}>${text}</option>`;
                }
            } else {
                html += (param === null ? '' : param);
            }
        }
        html += literals[literals.length - 1];

        return html;
    }

    function createLinkFields({ baseUrl, text, value } = {}) {
        let html = new Set();
        if (value) {
            const textList = text.split(',');
            const valueList = value.split(',');
            for (const [index, element] of textList.entries()) {
                html.add(`<a href="${baseUrl + valueList[index]}" target="_blank">${element}</a>`);
            }
        }
        html = [...html].join('');

        return html;
    }

    function parseLocalDate(sysDateStr) {
        let convertedDateStr = '';
        if (sysDateStr) {
            const dateObj = formatMod.parse({
                type: formatMod.Type.DATE,
                value: sysDateStr,
            });
            convertedDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        }

        return convertedDateStr;
    }

    function setPlLink(valueList) {
        const plIdFieldId = 'custpage_internalid';
        const plNumFieldId = 'custpage_custrecord_plan_order_num';
        for (const { values } of valueList) {
            const plIdCol = values.find(({ data: { fieldId } }) => fieldId.startsWith(plIdFieldId));
            const prNumCol = values.find(({ data: { fieldId } }) => fieldId.startsWith(plNumFieldId));
            if (prNumCol && plIdCol) {
                prNumCol.data.value = plIdCol.data.value;
            }
        }

        return valueList;
    }

    function createHtmlField({ type, fieldId, value, text, editType = 'text', isInlineEdit, baseUrl, options = null, isMulti = null } = {}) {
        let elementHtml;

        if (options) {
            options.curValue = value;
        }

        switch (type) {
            case textType:
                elementHtml = `${text}<input type="hidden" value="${value}" name="${fieldId}" />`;
                break;
            case inputType:
                elementHtml = `<input type="${editType}" ${editType === 'checkbox' && value === true ? 'checked' : ''} value="${editType === 'date' ? parseLocalDate(value) : value}" data-original-value="${value}" name="${fieldId}" />${isInlineEdit ? `<button type="button" data-target-for="${fieldId}">确认</button>` : ''}`;
                break;
            case selectType:
                elementHtml = createSelectFields`<select name="${fieldId}" ${isMulti ? 'multiple' : ''}>${options}</select>${isInlineEdit ? `<button type="button" data-target-for="${fieldId}">确认</button>` : ''}`;
                break;
            case linkType:
                elementHtml = createLinkFields({ baseUrl, text, value });
                break;
            case viewType:
            default:
                elementHtml = text;
                break;
        }

        return elementHtml;
    }

    function createPagedSublistHTML({
        form,
        searchDefine,
        sublistColumnConfig = {},
        columnFreezeCount = 2,
        singColumnWidth = 150,
        pageSizeDisplayType = 'ENTRY',
        parameters,
        addFilters,
        refreshParams,
        sortField,
        sortOrder,
    } = {}) {
        const utilMod = util;
        const sublistId = 'custpage_sublist';
        const pageIndexFieldId = 'custpage_pageindexid';
        const pageSizeFieldId = 'custpage_pagesizeid';
        const defaultPageSize = 1000;
        let sublistFields = [];
        let searchObj;
        const renderData = {
            titles: [],
            lines: [],
            columnFreezeCount,
            singColumnWidth,
            defaultWidth: singColumnWidth * 40
        };
        var pageInitScript = 
        "<script>\
            if(localStorage.pltoprplatformfilters && localStorage.pltoprplatformfilters != 'null' && localStorage.pltoprplatformfilters != location.href) {\
                location.href = localStorage.pltoprplatformfilters;\
            }debugger;\
            document.querySelector('#fg_custpage_custrecord_fields_group .fgroup_title').innerHTML=\"<img id='filters_field_group_expand'\
            onclick='filtersFieldsExpand(this)' src='/images/nav/tree/minus.png' border='0' style='vertical-align:top;margin:2px 3px 0px 0px;cursor:pointer;'>过滤条件\";\
            var filterCols = document.querySelectorAll('#main_form #detail_table_lay table>tbody>tr>td>table.uir-outside-fields-table');\
            for(var index = 1; index < filterCols.length; index++) {\
                filterCols[index].parentElement.parentElement.style = 'width:50%;display:'+(index>1?'none;':'inline-block;');\
            }\
            filterCols[0].parentElement.parentElement.parentElement.parentElement.style.width='100%';\
            function filtersFieldsExpand(img){\
                var cNode=img.parentNode.parentNode.parentNode.nextElementSibling;\
                if(/minus/gmi.test(img.src)){\
                    cNode.style.display='none';\
                    img.src=img.src.replace('minus', 'plus');\
                }else{\
                    cNode.style.display='';\
                    img.src=img.src.replace('plus', 'minus');\
                }\
            }\
        </script>";
        //获取页码和每页数量
        let { [pageSizeFieldId]: pageSize, [pageIndexFieldId]: pageIndex } = parameters;
        pageSize = Number.parseInt(pageSize) || defaultPageSize;
        pageIndex = Number.parseInt(pageIndex) || 0;

        //处理每页数量越界
        if (pageSize < 5) {
            pageSize = 5;
        } else if (pageSize > 1000) {
            pageSize = 1000;
        }
        //加载搜索
        if (utilMod.isString(searchDefine)) {
            searchObj = searchMod.load({
                id: searchDefine
            });
        } else {
            searchObj = searchMod.create(searchDefine);
        }
        if (addFilters.length) {//添加过滤器
            const { filterExpression } = searchObj;
            if (filterExpression.length === 0) {
                addFilters.shift();//删除第一个AND
            }
            searchObj.filterExpression = [
                ...filterExpression,
                ...addFilters
            ];
        }

        //搜索预览
        const pagedData = searchObj.runPaged({
            pageSize: pageSize
        });
        const pageCount = pagedData.pageRanges.length;

        //处理页码越界
        if (pageIndex < 0) {
            pageIndex = 0;
        } else if (pageIndex >= pageCount) {
            pageIndex = pageCount - 1;
        }

        //创建页面显示数量和页码下拉选项字段
        const pageSelectOptions = [];
        for (let i = 0; i < pageCount; i++) {
            pageSelectOptions.push({
                value: i,
                text: i + 1//显示的实际从1开始
            });
        }
        createFields({
            form,
            fields: [
                {
                    id: pageIndexFieldId,//分页下拉选项
                    label: '共' + pageCount + '页/' + pagedData.count + "条数据",
                    type: 'SELECT',
                    source: pageSelectOptions,
                    layoutType: 'OUTSIDEBELOW'
                },
                {
                    id: pageSizeFieldId,//每页显示数量
                    label: '当前页数量',
                    type: 'INTEGER',
                    layoutType: 'OUTSIDEBELOW',
                    displayType: "DISABLED"
                }
            ]
        });
        //默认值
        refreshParams[pageIndexFieldId] = pageIndex.toString(10);
        refreshParams[pageSizeFieldId] = 0;

        //创建Sublist
        const htmlSublist = form.addField({
            type: 'inlinehtml',
            id: sublistId,
            label: '搜索结果'
        });
        htmlSublist.updateLayoutType({
            layoutType: serverWidgetMod.FieldLayoutType.OUTSIDEBELOW
        }).updateBreakType({
            breakType: serverWidgetMod.FieldBreakType.STARTROW
        });

        //如果没有结果，就直接返回
        if (!pagedData.count) {
            htmlSublist.defaultValue = '<b>没有查询到任何结果</br>' + pageInitScript;
            return {
                sublistFields,
            };
        }

        //设置上一页，下一页按钮和全选按钮
        if (pageIndex !== 0) {
            form.addButton({
                id: 'custpage_previous_page',
                label: '上一页',
                functionName: `goToPage(${pageIndex - 1})`
            });
        }
        if (pageIndex !== pageCount - 1) {
            form.addButton({
                id: 'custpage_next_page',
                label: '下一页',
                functionName: `goToPage(${pageIndex + 1})`
            });
        }

        //根据动态创建列
        let formulaIndex = 0;
        const sublistColumnList = [];
        const custPrefix = 'custpage_';
        searchObj.columns.forEach(column => {
            let { name: fieldId, join, formula } = column;
            //计算Sublist字段ID
            if (join) {
                fieldId = join + '_' + fieldId;
            }
            if (formula) {
                fieldId += '_' + formulaIndex++;
            }
            fieldId = custPrefix + fieldId;
            fieldId = fieldId.toLowerCase();

            const { [fieldId]: columnConfig = {} } = sublistColumnConfig;
            const { type = viewType, display = 'show', editType, options, isMulti, isInlineEdit, baseUrl } = columnConfig;
            sublistColumnList.push({
                sublistFieldId: fieldId,
                resultColumn: column,
                type,
                editType,
                display,
                options,
                isMulti,
                isInlineEdit,
                baseUrl,
            });
        });
        // log.debug('sublistColumnList', sublistColumnList);

        //缓存Sublist字段ID，以备前端代码使用
        sublistFields = sublistColumnList.map(col => col.sublistFieldId);

        //获取当页数据
        // const valueList = [];
        let valueList = [];
        const { data: resultData } = pagedData.fetch({
            index: pageIndex
        });
        //当页数量
        refreshParams[pageSizeFieldId] = resultData.length;
        for (const [index, result] of resultData.entries()) {
            const sublistLine = {
                values: [],
                lineId: `${sublistId}_line${index}`
            };

            for (const { sublistFieldId, resultColumn, type, display, editType, options, isMulti, isInlineEdit, baseUrl } of sublistColumnList) {
                const fieldId = sublistFieldId + index;
                const value = result.getValue(resultColumn);
                const text = result.getText(resultColumn) || value;
                // const html = createHtmlField({
                //     type,
                //     fieldId,
                //     value,
                //     text,
                //     options,
                //     isMulti,
                //     editType,
                //     isInlineEdit,
                //     baseUrl,
                // });

                sublistLine.values.push({
                    // html,
                    display,
                    data: {
                        type,
                        fieldId,
                        value,
                        text,
                        options,
                        isMulti,
                        editType,
                        isInlineEdit,
                        baseUrl,
                    },
                });

                //插入标题
                if (index === 0) {
                    const { name: columnName } = resultColumn;
                    renderData.titles.push({
                        display,
                        value: resultColumn.label || 'UNKNOWN',
                        columnName,
                        sortOrder: sortField === columnName && sortOrder ? sortOrder : ''
                    });
                }
            }

            valueList.push(sublistLine);
        }
        // log.debug('valueList', valueList);

        //对中间数据进行进一步的处理
        setPlLink(valueList);

        //填充子列表
        for (const { values } of valueList) {
            for (const fieldInfo of values) {
                fieldInfo.html = createHtmlField(fieldInfo.data);
                delete fieldInfo.data;
            }
        }
        
        //输出渲染数据
        renderData.lines = hasFilters? valueList: valueList.slice(-1);
        //计算样式所需的数据
        const columnCount = searchObj.columns.length;
        renderData.defaultWidth = singColumnWidth * columnCount;

        //生成表格
        const tplPath = '../../templates/tpl_pr_to_po_platform.html';
        const renderer = renderMod.create();
        const fileObj = fileMod.load({
            id: tplPath
        });
        renderer.templateContent = pageInitScript + fileObj.getContents();
        renderer.addCustomDataSource({
            format: renderMod.DataSource.OBJECT,
            alias: 'renderData',
            data: renderData
        });
        htmlSublist.defaultValue = renderer.renderAsString();

        return {
            sublistFields,
            singColumnWidth,
            columnCount,
            columnFreezeCount
        }
    }

    function cachePageInfo({ form, ...cacheInfo } = {}) {
        //默认缓存当前页面的URL
        const currentScript = runtimeMod.getCurrentScript();
        const refreshURL = urlMod.resolveScript({
            scriptId: currentScript.id,
            deploymentId: currentScript.deploymentId
        });
        cacheInfo.refreshURL = refreshURL;

        //设置一些默认信息在页面上，以便进行页面跳转或者查询的时候使用
        const cacheFieldId = 'custpage_pagecache';
        const cacheField = form.addField({
            id: cacheFieldId,
            label: 'Page Cache',
            type: serverWidgetMod.FieldType.LONGTEXT
        });
        cacheField.updateDisplayType({
            displayType: serverWidgetMod.FieldDisplayType.HIDDEN
        });
        cacheField.defaultValue = JSON.stringify(cacheInfo);

        return cacheInfo;
    }

    function viewPage(request, response) {
        const { parameters } = request;
        const sortFieldId = 'custpage_sort_field';
        const sortOrderFieldId = 'custpage_sort_order';
        const { [sortFieldId]: sortField, [sortOrderFieldId]: sortOrder, ispopup: isPopup } = parameters;
        const addFilters = [];
        const refreshParams = {};
        const formTitle = '采购计划执行平台';
        const formCSPath = '../cs/cs_pl_to_pr_platform';
        const setPrefScriptId = 'customscript_sl_pl_to_pr_set_pref';
        const setPrefDeployId = 'customdeploy_sl_pl_to_pr_set_pref_pl';
        const splitScriptId = 'customscript_sl_pl_to_pr_split_line';
        const splitDeployId = 'customdeploy_sl_pl_to_pr_split_line';
        const mergeScriptId = 'customscript_sl_pl_to_pr_merge_line';
        const mergeDeployId = 'customdeploy_sl_pl_to_pr_merge_line';
        const transformScriptId = 'customscript_sl_pl_to_pr_transform_line';
        const transformDeployId = 'customdeploy_sl_pl_to_pr_transform_line';
        const inlineEditScriptId = 'customscript_sl_pl_to_pr_inline_edit';
        const inlineEditDeployId = 'customdeploy_sl_pl_to_pr_inline_edit';
        const approveScriptId = 'customscript_sl_pl_to_pr_approve';
        const approveDeployId = 'customdeploy_sl_pl_to_pr_approve';
        // const cancelScriptId = 'customscript_sl_pl_to_pr_cancel';
        // const cancelDeployId = 'customdeploy_sl_pl_to_pr_cancel';
        const prPlatformScriptId = 'customscript_sl_pr_to_po_platform';
        const prPlatformDeployId = 'customdeploy_sl_pr_to_po_platform';
        const prefTypeId = '1';
        const mrpOrderTypeFieldId = 'custscript_q_plplat_order_type';
        const mrpOrderTypeScriptId = 'customrecordmrp_planned_order';
        const planStatusFieldId = 'custrecord_status_plan';
        const itemFieldId = 'custrecord_item_nums';
        const cuxPrRecType = 'customrecord_purchase_application';
        const currentScript = runtimeMod.getCurrentScript();
        const mrpOrderType = currentScript.getParameter({
            name: mrpOrderTypeFieldId
        });
        const customButtons = [
            {
                id: 'custpage_pl_separate',
                label: '计划单分拆',
                functionName: 'plSeparate'
            },
            {
                id: 'custpage_pl_combine',
                label: '计划单合并',
                functionName: 'plCombine'
            },
            {
                id: 'custpage_pl_transform',
                label: '计划单投放',
                functionName: 'plTransform'
            },
            {
                id: 'custpage_pl_approve',
                label: '审批',
                functionName: 'plApprove'
            },
            // {
            //     id: 'custpage_pl_calcel',
            //     label: '取消',
            //     functionName: 'plCancel'
            // },
            {
                id: 'custpage_pl_mass_update',
                label: '批量更新',
                functionName: 'plMassUpdate'
            },
            {
                id: 'custpage_custom_search_fields',
                label: '自定义平台选项',
                functionName: 'setCustomPreference'
            },
            {
                id: 'custpage_search',
                label: '查询',
                functionName: 'searchResults'
            },
            {
                id: 'custpage_go_to_pr_platform',
                label: '前往采购请求执行平台',
                functionName: 'goToPrPlatform'
            },
        ];
        const searchFilterFields = [
            {
                id: sortFieldId,
                label: '排序字段',
                type: 'TEXT',
                displayType: 'HIDDEN',
            },
            {
                id: sortOrderFieldId,
                label: '排序方法',
                type: 'TEXT',
                displayType: 'HIDDEN',
            },
        ];
        const assistColumns = [
            {
                name: 'internalid',
                label: '内部ID'
            },
            {
                name: planStatusFieldId,
                label: '状态'
            },
            {
                name: itemFieldId,
                label: '物料代码'
            },
            {
                name: "custrecord_cux_mrp_k3_po_number",
                label: "K3采购单行号"
            },
            {
                name: "custrecord_cux_mrp_k3_po_line",
                label: "K3采购订单号"
            }
        ];
        const searchDefine = {
            type: mrpOrderTypeScriptId,
            filters: [
                ['isinactive', 'is', 'F'],//非禁用
                'AND',
                ['custrecord_splited', 'is', 'F'],//没有被分拆过
                'AND',
                ['custrecord_platform_merged', 'is', 'F']//没有被合并过
                // 'AND',
                // ['custrecord_to_line', 'anyof', ['@NONE@']],//没有关联单据
                // 'AND',
                // ['custrecord_platform_related_pr', 'anyof', ['@NONE@']],//没有被投放过
                // 'AND',
                // [planStatusFieldId, 'anyof', ['1', '3']]//计划中,已审核
            ],
            columns: []
        };
        const closeMemoOptions = [
            {
                value: '',
                text: ''
            }
        ];
        parameters.filters = JSON.parse(parameters.filters || "[]");
        if(parameters.filters.length) {
            if(searchDefine.filters.length) { searchDefine.filters.push("AND"); }
            searchDefine.filters = searchDefine.filters.concat(parameters.filters);
            hasFilters = true;
        }
        delete parameters.filters;
        try {
            //搜索关闭方式字段的选项
            searchMod.create({
                type: 'customlist_pl_close_method',
                filters: [
                    {
                        name: 'isinactive',
                        operator: 'is',
                        values: 'F'
                    }
                ],
                columns: [
                    {
                        name: 'name'
                    }
                ]
            }).run().each(result => {
                closeMemoOptions.push({
                    text: result.getValue({ name: 'name' }),
                    value: result.id,
                });
                return true;
            });

            //搜索计划单和CUX-PR的记录类型内部ID
            const recTypeIdMap = new Map();
            searchMod.create({
                type: 'customrecordtype',
                filters: [
                    {
                        name: 'formulanumeric',
                        formula: `CASE WHEN {scriptid} IN ('${cuxPrRecType.toUpperCase()}') THEN 1 ELSE 0 END`,
                        operator: 'equalto',
                        values: 1
                    },
                    // {
                    //     name: 'scriptid',
                    //     operator: 'is',
                    //     values: cuxPrRecType
                    // }
                ],
                columns: [
                    {
                        name: 'scriptid'
                    }
                ]
            }).run().each(result => {
                const { id: recTypeId } = result;
                const recType = result.getValue({ name: 'scriptid' }).toLowerCase();
                recTypeIdMap.set(recType, recTypeId);
                return true;
            });

            //子类表字段类型设置
            const sublistColumnConfig = {
                'custpage_internalid': {
                    type: textType,
                    display: 'hidden',
                },
                'custpage_custrecord_suggested_order_quantity': {
                    type: inputType,
                    editType: 'number',
                    isInlineEdit: true,
                },
                /* 'custpage_custrecord_cux_mrp_k3_po_number': {
                    type: inputType,
                    editType: 'text',
                    isInlineEdit: true,
                },
                'custpage_custrecord_cux_mrp_k3_po_line': {
                    type: inputType,
                    editType: 'number',
                    isInlineEdit: true,
                }, */
                'custpage_custrecord_memo_plan': {
                    type: inputType,
                    isInlineEdit: true,
                },
                'custpage_custrecord_platform_end_date': {
                    type: inputType,
                    isInlineEdit: true,
                    editType: "date"
                },
                'custpage_custrecord_demand_date': {
                    type: inputType,
                    isInlineEdit: true,
                    editType: "date"
                },
                'custpage_custrecord_close_memo': {
                    type: selectType,
                    options: closeMemoOptions,
                    isInlineEdit: true,
                },
                'custpage_custrecord_status_plan': {
                    type: textType
                },
                'custpage_custrecord_item_nums': {
                    type: textType
                },
                'custpage_custrecord_from_line': {
                    type: linkType,
                    baseUrl: `/app/common/custom/custrecordentry.nl?rectype=${mrpOrderType}&id=`,
                },
                'custpage_custrecord_platform_related_pr': {
                    type: linkType,
                    baseUrl: `/app/common/custom/custrecordentry.nl?rectype=${recTypeIdMap.get(cuxPrRecType)}&id=`,
                },
                'custpage_custrecord_to_line': {
                    type: linkType,
                    baseUrl: `/app/common/custom/custrecordentry.nl?rectype=${mrpOrderType}&id=`,
                },
                'custpage_custrecord_platform_source_number': {
                    type: linkType,
                    baseUrl: `/app/accounting/transactions/transaction.nl?id=`,
                },
                'custpage_custrecord_platform_forecast_number': {
                    type: linkType,
                    baseUrl: `/app/accounting/transactions/transaction.nl?id=`,
                },
                'custpage_custrecord_related_weiwai_wo': {
                    type: linkType,
                    baseUrl: `/app/accounting/transactions/transaction.nl?id=`,
                },
                'custpage_custrecord_related_weiwai_po': {
                    type: linkType,
                    baseUrl: `/app/accounting/transactions/transaction.nl?id=`,
                },
                'custpage_custrecord_plan_order_num': {
                    type: linkType,
                    baseUrl: `/app/common/custom/custrecordentry.nl?rectype=${mrpOrderType}&id=`,
                },
            };

            //搜索用户平台首选项
            const {
                currentFieldDefine,
                prefDetail:
                {
                    columnFreezeCount,
                    userFilters,
                    userColumns,
                },
            } = userPrefsMod.getUserPreference(prefTypeId, mrpOrderType);

            //匹配过滤器
            userPrefsMod.getFieldTypeMapOperator(currentFieldDefine);

            //指定结果列
            for (const { id, show } of userColumns) {
                if (show) {
                    const matchedDefine = currentFieldDefine.find(({ id: defineId }) => defineId == id);
                    if (matchedDefine) {
                        const currentColumn = {
                            name: id,
                            label: matchedDefine.label
                        };
                        if (sortField && sortOrder && sortField == id) {
                            currentColumn.sort = searchMod.Sort[sortOrder];
                        }
                        searchDefine.columns.push(currentColumn);
                    }
                }
            }

            //插入辅助的字段
            for (const assistColumn of assistColumns) {
                const { name } = assistColumn;
                if (searchDefine.columns.every(({ name: colName }) => colName != name)) {
                    searchDefine.columns.push(assistColumn);
                    //需要特殊的状态字段，以判断是否可执行特定的操作
                    if (name === planStatusFieldId) {
                        sublistColumnConfig['custpage_custrecord_status_plan']['display'] = 'hidden';
                    } else if (name === itemFieldId) {
                        sublistColumnConfig['custpage_custrecord_item_nums']['display'] = 'hidden';
                    }
                }
            }

            //过滤器
            var allFields = [{value: '', text: ''}];
            searchFilterFields.push({
                id: `fieldid_fields_custpage_`,
                label: '字段名称',
                type: 'SELECT',
                source: allFields,
                layoutType: 'OUTSIDEBELOW',
                breakType: 'STARTROW'
            })
            for (const { id, show } of userFilters) {
                if (show) {
                    const matchedDefine = currentFieldDefine.find(({ id: defineId }) => defineId == id);
                    if (matchedDefine) {
                        const { label, operator, source, showType } = matchedDefine;
                        var operators = searchOperators(source? "list": showType), opSource = [];
                        for(var opIndex = 0; opIndex < operators.length; opIndex++) {
                            opSource.push({ value: operators[opIndex], text: transcationOpertor(operators[opIndex]) });
                        }
                        searchFilterFields.push({
                            id: `fieldid_fields_custpage_${id}`,
                            label: '字段名称',
                            type: 'SELECT',
                            source: allFields,
                            layoutType: 'OUTSIDEBELOW',
                            breakType: 'STARTROW'
                        });
                        allFields.push({ value: id, text: label });
                        searchFilterFields.push({
                            id: `operator_fields_custpage_${id}`,
                            label: '操作符',
                            type: 'SELECT',
                            source: opSource,
                            layoutType: 'OUTSIDEBELOW'
                        });
                        if (operators.indexOf('within') > -1 || operators.indexOf('notwithin') > -1) {
                            searchFilterFields.push(
                                {
                                    id: `operator_fields_left_custpage_${id}`,
                                    label: '从',
                                    type: showType,
                                    source,
                                    layoutType: 'OUTSIDEBELOW'
                                },
                                {
                                    id: `operator_fields_right_custpage_${id}`,
                                    label: '至',
                                    type: showType,
                                    source,
                                    layoutType: 'OUTSIDEBELOW'
                                }
                            );
                        } else if (operators.indexOf('between') > -1 || operators.indexOf('notbetween') > -1) {
                            searchFilterFields.push(
                                {
                                    id: `operator_fields_min_custpage_${id}`,
                                    label: '从',
                                    type: showType,
                                    source,
                                    layoutType: 'OUTSIDEBELOW'
                                },
                                {
                                    id: `operator_fields_max_custpage_${id}`,
                                    label: '至',
                                    type: showType,
                                    source,
                                    layoutType: 'OUTSIDEBELOW'
                                }
                            );
                        }
                        searchFilterFields.push({
                            id: `values_fields_custpage_${id}`,
                            label: '过滤值',
                            type: showType,
                            source,
                            layoutType: 'OUTSIDEBELOW'
                        });
                    }
                }
            }

            //创建表单
            const form = createForm({
                formTitle,
                formCSPath,
                hideNavBar: isPopup === 'T',
                customButtons,
            });

            //创建搜索字段
            createFields({
                form,
                fields: searchFilterFields,
                parameters,
                addFilters,
                refreshParams,
                fieldGroup: { id: "custpage_custrecord_fields_group", label: "过滤条件" }
            });

            //创建显示结果的子列表
            const sublistConfig = createPagedSublistHTML({
                form,
                searchDefine,
                sublistColumnConfig,
                pageSizeDisplayType: 'HIDDEN',
                parameters,
                addFilters,
                refreshParams,
                columnFreezeCount,
                sortField,
                sortOrder,
            });

            //设置排序字段
            if (sortField && sortOrder) {
                refreshParams[sortFieldId] = sortField;
                refreshParams[sortOrderFieldId] = sortOrder;
            }

            //设置默认值
            form.updateDefaultValues(refreshParams);

            //缓存结果
            const searchFields = searchFilterFields.filter(config => !!config.filter && !!config.operator).map(config => config.id);
            const setPrefUrl = urlMod.resolveScript({
                scriptId: setPrefScriptId,
                deploymentId: setPrefDeployId,
                params: {
                    ispopup: 'T'
                }
            });
            const splitLineUrl = urlMod.resolveScript({
                scriptId: splitScriptId,
                deploymentId: splitDeployId,
                params: {
                    ispopup: 'T'
                }
            });
            const mergeLineUrl = urlMod.resolveScript({
                scriptId: mergeScriptId,
                deploymentId: mergeDeployId,
                params: {
                    ispopup: 'T'
                }
            });
            const transformLineUrl = urlMod.resolveScript({
                scriptId: transformScriptId,
                deploymentId: transformDeployId,
                params: {
                    ispopup: 'T'
                }
            });
            const inlineEditUrl = urlMod.resolveScript({
                scriptId: inlineEditScriptId,
                deploymentId: inlineEditDeployId,
                params: {
                    ispopup: 'T'
                }
            });
            const approveUrl = urlMod.resolveScript({
                scriptId: approveScriptId,
                deploymentId: approveDeployId,
                params: {
                    ispopup: 'T'
                }
            });
            // const cancelUrl = urlMod.resolveScript({
            //     scriptId: cancelScriptId,
            //     deploymentId: cancelDeployId,
            //     params: {
            //         ispopup: 'T'
            //     }
            // });
            const prPlatformUrl = urlMod.resolveScript({
                scriptId: prPlatformScriptId,
                deploymentId: prPlatformDeployId,
            });
            cachePageInfo({
                form,
                refreshParams,
                searchFields,
                setPrefUrl,
                splitLineUrl,
                mergeLineUrl,
                transformLineUrl,
                inlineEditUrl,
                approveUrl,
                // cancelUrl,
                prPlatformUrl,
                ...sublistConfig
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
        const { parameters } = request;

        response.write({
            output: JSON.stringify(parameters)
        });
    }

    function searchOperators(type) {
        var STR1 = ",list,record", STR2 = ",currency,decimalnumber,timeofday,float", STR3 = ",date", STR4 = ",checkbox", STR5 = ",document,image", 
            STR6 = ",emailaddress,free-formtext,longtext,password,percent,phonenumber,richtext,textarea,text", STR7 = ",multiselect,select";
        var schOps = {
            startswith: STR6,
            anyof: STR1 + STR5 + STR7,
            between: STR2,
            contains: STR6,
            any: STR2 + STR6,
            after: STR3,
            allof: STR7,
            before: STR3,
            doesnotcontain: STR6,
            doesnotstartwith: STR6,
            equalto: STR2 + STR4 + STR6,
            greaterthan: STR2,
            greaterthanorequalto: STR2,
            haskeywords: STR6,
            is: STR4 + STR6,
            isempty: STR2 + STR3 + STR6,
            isnot: STR6,
            isnotempty: STR2 + STR3 + STR6,
            lessthan: STR2,
            lessthanorequalto: STR2,
            noneof: STR1 + STR5 + STR7,
            notafter: STR3,
            notallof: STR7,
            notbefore: STR3,
            notbetween: STR2,
            notequalto: STR2,
            notgreaterthan: STR2,
            notgreaterthanorequalto: STR2,
            notlessthan: STR2,
            notlessthanorequalto: STR2,
            noton: STR3,
            notonorafter: STR3,
            notonorbefore: STR3,
            notwithin: STR3,
            on: STR3,
            onorafter: STR3,
            onorbefore: STR3,
            within: STR3
        };
        if(type) {
            type = type.toLowerCase();
            if(schOps[type]) {
                schOps = schOps[type];
            } else {
                var _schOps = [];
                for(var opName in schOps) {
                    schOps[opName].indexOf("," + type) > -1 && _schOps.push(opName);
                }
                schOps = _schOps;
            }
        }
        return schOps;
    }

    function transcationOpertor(opName) {
        return ({
            after: "值之后",
            allof: "包含每项值",
            any: "任意值",
            anyof: "值等于某项",
            before: "值之前",
            between: "在两个值之间",
            contains: "包含值",
            doesnotcontain: "不包含",
            doesnotstartwith: "不与值开头",
            equalto: "等于",
            greaterthan: "大于",
            greaterthanorequalto: "大于等于",
            haskeywords: "是否有值",
            is: "是",
            isempty: "空值",
            isnot: "不是该值",
            isnotempty: "非空",
            lessthan: "小于",
            lessthanorequalto: "小于或等于",
            noneof: "不等于某项值",
            notafter: "值之前",
            notallof: "不包含每项值",
            notbefore: "值之后",
            notbetween: "不在两值之间",
            notequalto: "不等于",
            notgreaterthan: "不大于",
            notgreaterthanorequalto: "不大于等于",
            notlessthan: "不小于",
            notlessthanorequalto: "不小于等于",
            noton: "不在值中间",
            notonorafter: "值开头",
            notonorbefore: "值在结尾",
            notwithin: "不在两者之间",
            on: "值在中间",
            onorafter: "值不在开头",
            onorbefore: "值不在结尾",
            startswith: "值开头",
            within: "在两值之间"
        })[opName] || opName;
    }

    //entry points
    function onRequest(context) {
        const {
            request,
            response,
            request: {
                method: httpMethod
            }
        } = context;

        switch (httpMethod) {
            case 'GET':
                viewPage(request, response);
                break;
            case 'POST':
                submitPage(request, response);
                break;
            default:
                break;
        }
    }

    return {
        onRequest
    }
});
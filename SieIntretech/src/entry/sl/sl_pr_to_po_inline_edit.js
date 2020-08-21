/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 此程序主要用于自定义PR的行内编辑和批量更新
 */
define([
    'N/ui/serverWidget',
    'N/record',
    'N/search',
    'N/runtime',
    'N/url',
], function (
    serverWidgetMod,
    recordMod,
    searchMod,
    runtimeMod,
    urlMod,
) {

    const custElementPrefix = 'custpage_';
    const recType = 'customrecord_purchase_application';
    const updateSublistId = 'custpage_update_sublist';
    const recIdFieldId = 'custpage_internalid';
    const successFlag = 'success';
    const failFlag = 'fail';
    const updateSublistFields = [
        {
            id: recIdFieldId,
            label: '请购单号',
            type: 'SELECT',
            source: recType,
            displayType: 'INLINE',
        },
        {
            id: 'custrecord_order_type_pr',
            label: '业务类型',
            type: 'SELECT',
            source: 'customlist_po_list_pur_type_2',
        },
        {
            id: 'custrecord_apply_for_department_pr',
            label: '部门',
            type: 'SELECT',
            source: 'department',
        },
        {
            id: 'custrecord_plan_vendor_pr',
            label: '供应商',
            type: 'SELECT',
            source: 'vendor',
        },
        {
            id: 'custrecord_platform_pr_currency',
            label: '货币',
            type: 'SELECT',
            source: 'currency',
        },
        {
            id: 'custrecord_platform_pr_applier',
            label: '申请人',
            type: 'SELECT',
            source: 'employee',
        },
        {
            id: 'custrecord_memo_plan_pr',
            label: '备注（头）',
            type: 'TEXT',
            displayType: 'ENTRY',
        },
        {
            id: 'custrecord_platform_pr_sign',
            label: '作废标志',
            type: 'CHECKBOX',
        },
        {
            id: 'custrecord_platform_pr_receipt_date',
            label: '到货日期',
            type: 'DATE',
            displayType: 'ENTRY',
        },
        {
            id: 'custrecord_platform_pr_line_close',
            label: '行关闭',
            type: 'CHECKBOX',
        },
        {
            id: 'custrecord_platform_pr_line_memo',
            label: '行备注',
            type: 'TEXT',
            displayType: 'ENTRY',
        },
    ];

    function createForm({ formTitle: title = '批量处理页面', hideNavBar = false, formCSPath, submitLabel, resetLabel, customButtons } = {}) {
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

    function createFields({ form, tab, subtab, fieldGroup, fields, addFilters = [], refreshParams = {}, parameters = {} } = {}) {
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
            if (utilMod.isString(source)) {
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
                if (type === 'MULTISELECT') {
                    searchValue = searchValue.trim().split(',');
                }

                //记录过滤器值
                addFilters.push('AND', [filter, operator, searchValue]);

                //记录刷新字段信息
                refreshParams[id] = searchValue;
            }
        }

        return form;
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
        let { parameters: { ispopup: isPopup, recids: recIds } } = request;
        const formTitle = '请购单批量更新';
        const formCSPath = '../cs/cs_pr_to_po_inline_edit';
        const submitLabel = '确认更新';
        const mainGroup = {
            id: 'custpage_group_main_info',
            label: '辅助填充字段'
        };
        const customButtons = [
            {
                id: 'custpage_fill_all',
                label: '填充全部',
                functionName: `autoFill`
            },
        ];
        const bodyFields = [];

        if (!recIds) {
            response.write({
                output: `缺少请购单ID`
            });
            return false;
        }

        try {
            //动态计算主体填充字段信息和按钮信息
            const [, ...customSublistFields] = updateSublistFields;
            for (const { ...fieldInfoCopy } of customSublistFields) {
                const { id, label, type } = fieldInfoCopy;

                //填充字段
                fieldInfoCopy.id = custElementPrefix + id;
                // fieldInfoCopy.layoutType = 'OUTSIDEBELOW';
                // if (type === 'TEXT') {
                //     fieldInfoCopy.displayWidth = 50;
                //     fieldInfoCopy.displayHeight = 30;
                // } else if (type === 'SELECT') {
                //     fieldInfoCopy.displayWidth = 50;
                //     fieldInfoCopy.displayHeight = 30;
                // }
                bodyFields.push(fieldInfoCopy);

                //填充按钮
                customButtons.push({
                    id: `${custElementPrefix}fill_${id}`,
                    label: `填充${label}`,
                    functionName: `autoFill('${id}')`
                });
            }

            //搜索计划单信息
            recIds = recIds.split(',');
            const resultList = [];
            const filters = [
                {
                    name: 'internalid',
                    operator: 'anyof',
                    values: recIds
                }
            ];
            const columns = customSublistFields.map(({ id: name }) => ({ name }));
            const recSearch = searchMod.create({
                type: recType,
                filters,
                columns,
            });
            recSearch.run().each(result => {
                const resultObj = new Map([
                    [recIdFieldId, result.id]
                ]);
                result.columns.forEach(column => resultObj.set(column.name, result.getValue(column)));
                resultList.push(resultObj);
                return true;
            });

            //创建表单
            const form = createForm({
                formTitle,
                hideNavBar: isPopup === 'T',
                formCSPath,
                customButtons,
                submitLabel
            });

            //创建头部字段
            createFields({
                form,
                fieldGroup: mainGroup,
                fields: bodyFields
            });

            //创建子列表
            const updateSublist = form.addSublist({
                id: updateSublistId,
                label: '请购单明细',
                type: serverWidgetMod.SublistType.LIST,
            });
            //创建子列表字段
            createFields({
                form: updateSublist,
                fields: updateSublistFields
            });

            //设置计划单列表详细信息
            for (const [line, valueMap] of resultList.entries()) {
                for (let [id, value] of valueMap) {
                    if (value !== '') {
                        if (value === true) {
                            value = 'T';
                        } else if (value === false) {
                            value = 'F';
                        }
                        updateSublist.setSublistValue({
                            id,
                            value,
                            line,
                        });
                    }
                }
            }

            //缓存信息
            cachePageInfo({
                form,
                sublistFields: customSublistFields.map(({ id }) => id),
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
                output: `批量更新页面生成失败，错误提示：${ex.message}`
            });
        }
    }

    function submitPage(request, response) {
        let { parameters: { islinlineedit: isInlineEdit, updateLines } } = request;
        const rspMsg = [];
        const lineCloseFieldId = 'custrecord_platform_pr_line_close';
        const remainQtyFieldId = 'custrecord_platform_pr_not_order_number';
        const statusFieldId = 'custrecord_status_plan_pr';
        const closedStatus = '6';
        const approvedStatus = '2';

        try {
            if (isInlineEdit === 'T') {
                updateLines = JSON.parse(updateLines);
            } else {
                updateLines = [];
                const lineCount = request.getLineCount({
                    group: updateSublistId
                });
                for (let i = 0; i < lineCount; i++) {
                    const updateLine = {};
                    updateSublistFields.forEach(({ id: name }) => {
                        updateLine[name] = request.getSublistValue({
                            group: updateSublistId,
                            name,
                            line: i
                        });
                    });
                    updateLines.push(updateLine);
                }
            }

            //检测是否有行关闭的更新
            if (updateLines.find(({ [lineCloseFieldId]: lineClose }) => lineClose !== undefined)) {
                const prIds = updateLines.map(({ [recIdFieldId]: recId }) => recId);
                searchMod.create({
                    type: recType,
                    filters: [
                        {
                            name: 'internalid',
                            operator: 'anyof',
                            values: prIds
                        }
                    ],
                    columns: [
                        {
                            name: remainQtyFieldId
                        }
                    ]
                }).run().each(result => {
                    const { id: prId } = result;
                    const remainQty = +result.getValue({ name: remainQtyFieldId }) || 0;
                    const targetLine = updateLines.find(({ [recIdFieldId]: recId }) => recId == prId);
                    if (targetLine.hasOwnProperty(lineCloseFieldId)) {
                        const currentCloseValue = targetLine[lineCloseFieldId];
                        if (currentCloseValue === 'T' || currentCloseValue === true) {
                            targetLine[statusFieldId] = closedStatus;
                        } else {
                            if (remainQty > 0) {
                                targetLine[statusFieldId] = approvedStatus;
                            } else {
                                targetLine[statusFieldId] = closedStatus;
                            }
                        }
                    }
                    return true;
                });
            }

            //逐个更新
            for (let { [recIdFieldId]: recId, ...valueMap } of updateLines) {
                recId = String(recId);
                try {
                    //更新计划单
                    recordMod.submitFields({
                        type: recType,
                        id: recId,
                        values: valueMap,
                        options: { ignoreMandatoryFields: true }
                    });

                    rspMsg.push({
                        recId,
                        status: successFlag,
                        message: '',
                    });
                } catch (e) {
                    rspMsg.push({
                        recId,
                        status: failFlag,
                        message: e.message,
                    });

                    log.error({
                        title: `更新PR单${recId}失败`,
                        details: e
                    });
                }
            }
        } catch (ex) {
            rspMsg.push({
                recId: '',
                status: failFlag,
                message: ex.message,
            });

            log.error({
                title: `${isInlineEdit === 'T' ? '行内编辑' : '批量更新'}失败`,
                details: {
                    ex,
                    updateLines,
                    exStr: ex.toString()
                }
            });
        }

        //如果是接口返回
        if (isInlineEdit === 'T') {
            response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });
            response.write({
                output: JSON.stringify(rspMsg)
            });
            return true;
        } else {//界面返回
            //查询计划单号
            let pageContent = '';
            const recIds = rspMsg.filter(({ recId }) => !!recId).map(({ recId }) => recId);
            const idNumMap = new Map(recIds.map(recId => new Array(2).fill(recId)));
            if (recIds.length) {
                try {
                    searchMod.create({
                        type: recType,
                        filters: [
                            {
                                name: 'internalid',
                                operator: 'anyof',
                                values: recIds
                            }
                        ],
                        columns: [
                            {
                                name: 'name'
                            }
                        ]
                    }).run().each(result => {
                        idNumMap.set(String(result.id), result.getValue({ name: 'name' }));
                        return true;
                    });
                } catch (er) {
                    log.error({
                        title: '查询单号失败',
                        details: er
                    });
                }
            }

            for (const { recId, status, message } of rspMsg) {
                pageContent += `<tr><td>${idNumMap.get(recId)}</td><td>${status === successFlag ? '成功' : '失败'}</td><td>${message}</td></tr>`;
            }

            let rspPageHTML = `
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="utf-8">
            <title>更新结果</title>
            </head>
            <body style="text-align:center;">
                <h1>批量更新结果</h1>
                <table border="1" cellpadding="10" style="border-collapse:collapse;margin:10px auto;font-size:14px;">
                <tr><th>请购单号</th><th>处理状态</th><th>提示</th></tr>
                ${pageContent}
                </table>
                <script>window.opener && window.opener.custSearchResults && window.opener.custSearchResults();</script>
            </body>
            </html>
            `;

            response.write({
                output: rspPageHTML
            });
            return true;
        }
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
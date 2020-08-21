/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 此程序主要用于计划单的行内编辑和批量更新
 */
define([
    'N/ui/serverWidget',
    'N/record',
    'N/search',
], function (
    serverWidgetMod,
    recordMod,
    searchMod,
) {

    const custElementPrefix = 'custpage_';
    const mrpRecType = 'customrecordmrp_planned_order';
    const updateSublistId = 'custpage_update_sublist';
    const mrpRecIdFieldId = 'custpage_internalid';
    const suggestQtyFieldId = 'custpage_custrecord_suggested_order_quantity';
    const memoFieldId = 'custpage_custrecord_memo_plan';
    const closeMethodFieldId = 'custpage_custrecord_close_memo';
    const successFlag = 'success';
    const failFlag = 'fail';

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

    function viewPage(request, response) {
        let { parameters: { ispopup: isPopup, planids: planIds } } = request;
        const formTitle = '计划单批量更新';
        const formCSPath = '../cs/cs_pl_to_pr_inline_edit';
        const submitLabel = '确认更新';
        const closeMethodSource = 'customlist_pl_close_method_2';
        const mainGroup = {
            id: 'custpage_group_main_info',
            label: '辅助填充字段'
        };
        const customButtons = [
            {
                id: 'custpage_fill_custrecord_suggested_order_quantity',
                label: '填充建议订单量',
                functionName: 'fillSuggestOrderQty'
            },
            {
                id: 'custpage_fill_custpage_custrecord_memo_plan',
                label: '填充备注',
                functionName: 'fillMemo'
            },
            {
                id: 'custpage_fill_custrecord_close_memo',
                label: '填充关闭方式',
                functionName: 'fillCloseMethod'
            },
            {
                id: 'custpage_fill_all',
                label: '填充全部',
                functionName: 'autoFill'
            },
        ];
        const bodyFields = [
            {
                id: 'custpage_assist_custrecord_suggested_order_quantity',
                label: '建议订单量',
                type: 'FLOAT',
                layoutType : 'OUTSIDEBELOW',
            },
            {
                id: 'custpage_assist_custrecord_memo_plan',
                label: '备注',
                type: 'TEXT',
                layoutType : 'OUTSIDEBELOW',
                displayWidth: 50,
                displayHeight : 30,
            },
            {
                id: 'custpage_assist_custrecord_close_memo',
                label: '关闭方式',
                type: 'SELECT',
                source: closeMethodSource,
                layoutType : 'OUTSIDEBELOW',
                
            },
        ];
        const updateSublistFields = [
            {
                id: mrpRecIdFieldId,
                label: '计划订单号',
                type: 'SELECT',
                source: mrpRecType,
                displayType: 'INLINE',
            },
            {
                id: suggestQtyFieldId,
                label: '建议订单量',
                type: 'FLOAT',
                displayType: 'ENTRY',
            },
            {
                id: memoFieldId,
                label: '备注',
                type: 'TEXT',
                displayType: 'ENTRY',
            },
            {
                id: closeMethodFieldId,
                label: '关闭方式',
                type: 'SELECT',
                source: closeMethodSource,
            },
        ];

        if (!planIds) {
            response.write({
                output: `缺少计划单ID`
            });
            return false;
        }

        try {
            //搜索计划单信息
            planIds = planIds.split(',');
            const resultList = [];
            const prefixLength = custElementPrefix.length;
            const filters = [
                {
                    name: 'internalid',
                    operator: 'anyof',
                    values: planIds
                }
            ];
            const columns = updateSublistFields.map(({ id }) => ({ name: id.slice(prefixLength) }));//.filter(({ id }) => id !== mrpRecIdFieldId)
            const mrpSearch = searchMod.create({
                type: mrpRecType,
                filters,
                columns,
            });
            mrpSearch.run().each(result => {
                const resultObj = new Map();
                result.columns.forEach(column => resultObj.set(custElementPrefix + column.name, result.getValue(column)));
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
                label: '计划单明细',
                type: serverWidgetMod.SublistType.LIST,
            });
            //创建子列表字段
            createFields({
                form: updateSublist,
                fields: updateSublistFields
            });

            //设置计划单列表详细信息
            for (const [line, valueMap] of resultList.entries()) {
                for (const [id, value] of valueMap) {
                    if (value !== '') {
                        updateSublist.setSublistValue({
                            id,
                            value,
                            line,
                        });
                    }
                }
            }

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

        try {
            if (isInlineEdit === 'T') {
                updateLines = JSON.parse(updateLines);
            } else {
                updateLines = [];
                const lineCount = request.getLineCount({
                    group: updateSublistId
                });
                for (let i = 0; i < lineCount; i++) {
                    updateLines.push({
                        [mrpRecIdFieldId]: request.getSublistValue({
                            group: updateSublistId,
                            name: mrpRecIdFieldId,
                            line: i
                        }),
                        [suggestQtyFieldId]: request.getSublistValue({
                            group: updateSublistId,
                            name: suggestQtyFieldId,
                            line: i
                        }),
                        [memoFieldId]: request.getSublistValue({
                            group: updateSublistId,
                            name: memoFieldId,
                            line: i
                        }),
                        [closeMethodFieldId]: request.getSublistValue({
                            group: updateSublistId,
                            name: closeMethodFieldId,
                            line: i
                        }),
                    });
                }
            }

            // log.error('updateLines', updateLines);

            //逐个更新
            const prefixLength = custElementPrefix.length;
            for (const { [mrpRecIdFieldId]: planId, ...valueMap } of updateLines) {
                try {
                    const submitValues = {};
                    Object.entries(valueMap).forEach(([key, value]) => {
                        submitValues[key.slice(prefixLength)] = value;
                    });
                    //更新计划单
                    recordMod.submitFields({
                        type: mrpRecType,
                        id: planId,
                        values: submitValues,
                        options: {
                            ignoreMandatoryFields: true
                        }
                    });

                    rspMsg.push({
                        planId,
                        status: successFlag,
                        message: '',
                    });
                } catch (e) {
                    rspMsg.push({
                        planId,
                        status: failFlag,
                        message: e.message,
                    });

                    log.error({
                        title: `更新计划单${planId}失败`,
                        details: e
                    });
                }
            }
        } catch (ex) {
            rspMsg.push({
                planId: '',
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
            const plIdNumMap = new Map();
            const plIds = rspMsg.filter(({ planId }) => !!planId).map(({ planId }) => planId);
            if (plIds.length) {
                try {
                    searchMod.create({
                        type: mrpRecType,
                        filters: [
                            {
                                name: 'internalid',
                                operator: 'anyof',
                                values: plIds
                            }
                        ],
                        columns: [
                            {
                                name: 'name'
                            }
                        ]
                    }).run().each(result => {
                        plIdNumMap.set(String(result.id), result.getValue({ name: 'name' }));
                        return true;
                    });
                } catch (er) {
                    log.error({
                        title: '查询计划单号失败',
                        details: er
                    });
                }
            }

            for (const { planId, status, message } of rspMsg) {
                pageContent += `<tr><td>${plIdNumMap.get(String(planId)) || planId}</td><td>${status === successFlag ? '成功' : '失败'}</td><td>${message}</td></tr>`;
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
                <tr><th>计划单号</th><th>处理状态</th><th>提示</th></tr>
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
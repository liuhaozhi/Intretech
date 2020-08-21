/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 此程序主要用于平台上设置临时周期天数
 */
define([
    'N/ui/serverWidget',
    'N/search',
], function (
    serverWidgetMod,
    searchMod,
) {

    const updateSublistId = 'custpage_update_sublist';

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
        let { parameters: { ispopup: isPopup, lastlastvalues: lastUpdatedValues } } = request;
        const formTitle = '设置临时子公司合并周期天数';
        const formCSPath = '../cs/cs_pr_to_po_set_merge_periods';
        const subsidiaryPeriodFieldId = 'custrecord_merge_periods';
        const subsidiaryFieldId = 'custpage_list_subsidiary';
        const subsidiaryNameFieldId = 'custpage_list_subsidiary_name';
        const periodFieldId = 'custpage_list_period';
        const customButtons = [
            {
                id: 'custpage_confirm_periods',
                label: '确定',
                functionName: `confirmPeriods`
            },
        ];

        try {
            if(lastUpdatedValues){
                lastUpdatedValues = decodeURIComponent(lastUpdatedValues);
                lastUpdatedValues = JSON.parse(lastUpdatedValues);
            }

            //搜索各个子公司的周期天数
            const resultList = [];
            searchMod.create({
                type: 'subsidiary',
                filters: [
                    {
                        name: 'isinactive',
                        operator: 'is',
                        values: 'F',
                    },
                    {
                        name: 'iselimination',
                        operator: 'is',
                        values: 'F',
                    },
                ],
                columns: [
                    {
                        name: 'name'
                    },
                    {
                        name: subsidiaryPeriodFieldId
                    },
                ]
            }).run().each(result => {
                const { id: subsidiaryId } = result;
                const subsidiaryName = result.getValue({
                    name: 'name'
                });
                const period = result.getValue({
                    name: subsidiaryPeriodFieldId
                });
                resultList.push({
                    subsidiaryId,
                    subsidiaryName,
                    period,
                });
                return true;
            });

            //创建表单
            const form = createForm({
                formTitle,
                hideNavBar: isPopup === 'T',
                formCSPath,
                customButtons,
            });

            //创建子列表
            const updateSublist = form.addSublist({
                id: updateSublistId,
                label: '周期天数列表',
                type: serverWidgetMod.SublistType.LIST,
            });
            //创建子列表字段
            createFields({
                form: updateSublist,
                fields: [
                    {
                        id: subsidiaryFieldId,
                        label: '子公司ID',
                        type: 'SELECT',
                        source: 'subsidiary',
                        displayType:'HIDDEN',
                    },
                    {
                        id: subsidiaryNameFieldId,
                        label: '子公司',
                        type: 'TEXT',
                        displayType:'INLINE',
                    },
                    {
                        id: periodFieldId,
                        label: '周期天数',
                        type: 'FLOAT',
                        displayType: 'ENTRY',
                    },
                ]
            });

            //设置计划单列表详细信息
            for (const [line, { subsidiaryId, period, subsidiaryName }] of resultList.entries()) {
                updateSublist.setSublistValue({
                    id: subsidiaryFieldId,
                    value: subsidiaryId,
                    line,
                });
                updateSublist.setSublistValue({
                    id: subsidiaryNameFieldId,
                    value: subsidiaryName,
                    line,
                });
                const currentPeriod = lastUpdatedValues ? (lastUpdatedValues[subsidiaryId] || '') : period;
                if(currentPeriod !== ''){
                    updateSublist.setSublistValue({
                        id: periodFieldId,
                        value: currentPeriod,
                        line,
                    });
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
                output: `设置临时子公司合并周期天数页面生成失败，错误提示：${ex.message}`
            });
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
            default:
                break;
        }
    }

    return {
        onRequest
    }
});
/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 此程序主要用于计划单的设置员工个人的搜索偏好
 */
define([
    'N/ui/serverWidget',
    'N/record',
    'N/url',
    'N/query',
    'N/runtime',
    '../../app/app_get_platform_user_prefs',
], function (
    serverWidgetMod,
    recordMod,
    urlMod,
    queryMod,
    runtimeMod,
    userPrefsMod,
) {

    const filterSublistId = 'custpage_filter_sublist';
    const resultSublistId = 'custpage_result_sublist';
    const filterSelectFieldId = 'custpage_filter_sublist_filter_options';
    const resultSelectFieldId = 'custpage_result_sublist_result_options';
    const freeCountFieldId = 'custpage_freeze_count';
    const prefRecFieldId = 'custpage_preference_rec_id';

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
        const { parameters: { ispopup: isPopup } } = request;
        const formTitle = '设置平台个人偏好';
        const formCSPath = '../cs/cs_pl_to_pr_set_pref';
        const submitLabel = '提交';
        const mainGroup = {
            id: 'custpage_group_main_info',
            label: '主要信息'
        };
        const bodyFields = [
            {
                id: freeCountFieldId,
                label: '冻结列数',
                type: 'INTEGER',
                isMandatory: true
            },
            {
                id: prefRecFieldId,
                label: '偏好记录ID',
                type: 'INTEGER',
                displayType: 'HIDDEN'
            },
        ];
        const currentScript = runtimeMod.getCurrentScript();
        const targetRecType = currentScript.getParameter({
            name: 'custscript_q_set_pref_rec_type'
        });
        const prefTypeId = currentScript.getParameter({
            name: 'custscript_q_set_pref_type'
        });

        try {
            //获取用户的首选项
            const {
                prefId,
                currentFieldDefine,
                prefDetail:
                {
                    columnFreezeCount,
                    userFilters,
                    userColumns,
                },
            } = userPrefsMod.getUserPreference(prefTypeId, targetRecType);

            //创建表单
            const form = createForm({
                formTitle,
                hideNavBar: isPopup === 'T',
                formCSPath,
                submitLabel
            });

            //创建头部字段
            createFields({
                form,
                fieldGroup: mainGroup,
                fields: bodyFields
            });

            const filterSublistTabId = 'custpage_filter_tab';
            const resultSublistTabId = 'custpage_result_tab';
            form.addTab({
                id: filterSublistTabId,
                label: '过滤器'
            });
            form.addTab({
                id: resultSublistTabId,
                label: '结果'
            });
            const filterSublist = form.addSublist({
                id: filterSublistId,
                label: '列表',
                type: serverWidgetMod.SublistType.INLINEEDITOR,
                tab: filterSublistTabId
            });
            const resultSublist = form.addSublist({
                id: resultSublistId,
                label: '列表',
                type: serverWidgetMod.SublistType.INLINEEDITOR,
                tab: resultSublistTabId
            });
            const filterSelectField = filterSublist.addField({
                id: filterSelectFieldId,
                label: '过滤器名称',
                type: serverWidgetMod.FieldType.SELECT
            });
            const resultSelectField = resultSublist.addField({
                id: resultSelectFieldId,
                label: '结果名称',
                type: serverWidgetMod.FieldType.SELECT
            });

            //设置所有下拉选项
            currentFieldDefine.forEach(({ id: value, label: text }) => {
                filterSelectField.addSelectOption({
                    value,
                    text,
                });
                resultSelectField.addSelectOption({
                    value,
                    text,
                });
            });

            //设置列表值
            let filterLineIndex = 0;
            let resultLineIndex = 0;
            for (const { id, show } of userFilters) {
                if (show && currentFieldDefine.some(({ id: defineId }) => defineId == id)) {
                    filterSublist.setSublistValue({
                        id: filterSelectFieldId,
                        line: filterLineIndex,
                        value: id
                    });
                    filterLineIndex++;
                }
            }
            for (const { id, show } of userColumns) {
                if (show && currentFieldDefine.some(({ id: defineId }) => defineId == id)) {
                    resultSublist.setSublistValue({
                        id: resultSelectFieldId,
                        line: resultLineIndex,
                        value: id
                    });
                    resultLineIndex++;
                }
            }

            //设置冻结列数和偏好ID字段
            form.updateDefaultValues({
                [freeCountFieldId]: columnFreezeCount,
                [prefRecFieldId]: prefId
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
                output: '设置个人偏好页面生成失败，错误提示：' + ex.message
            });
        }
    }

    function submitPage(request, response) {
        const { parameters: { [freeCountFieldId]: columnFreezeCount, [prefRecFieldId]: prefRecId } } = request;
        const filterLineCount = request.getLineCount({
            group: filterSublistId
        });
        const resultLineCount = request.getLineCount({
            group: resultSublistId
        });
        const userFilters = [];
        const userColumns = [];

        //获取过滤器列表
        for (let i = 0; i < filterLineCount; i++) {
            const filterFieldId = request.getSublistValue({
                group: filterSublistId,
                name: filterSelectFieldId,
                line: i
            });

            userFilters.push({
                id: filterFieldId,
                show: true
            });
        }

        //获取结果列表
        for (let i = 0; i < resultLineCount; i++) {
            const resultFieldId = request.getSublistValue({
                group: resultSublistId,
                name: resultSelectFieldId,
                line: i
            });

            userColumns.push({
                id: resultFieldId,
                show: true
            });
        }

        try {
            //更新用户首选项
            const { prefRecordType, prefDetailFieldId } = userPrefsMod;
            recordMod.submitFields({
                type: prefRecordType,
                id: prefRecId,
                values: {
                    [prefDetailFieldId]: JSON.stringify({ columnFreezeCount, userFilters, userColumns })
                },
                options: {
                    ignoreMandatoryFields: true
                }
            });
            response.write({
                output: `<p style="font-weight:bold;font-size:16px;text-align:center;">个人偏好更新成功。请您回到平台刷新页面，更改即会生效。此窗口将于5秒后自动关闭......</p><script>setTimeout(() => window.close(), 5000)</script>`
            });
            return true;
        } catch (ex) {
            log.error({
                title: '更新个人首选项失败',
                details: ex
            });
            response.write({
                output: `<p style="color:red;font-size:14px;text-align:center;">个人偏好更新失败，请您稍后再试。错误提示：${ex.message}`
            });
            return false;
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
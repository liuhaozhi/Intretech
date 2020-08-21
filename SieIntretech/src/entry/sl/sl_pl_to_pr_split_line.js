/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 此程序主要用于计划单的行分拆功能
 */
define([
    'N/ui/serverWidget',
    'N/record',
    'N/format',
    'N/query',
    'N/search'
], function (
    serverWidgetMod,
    recordMod,
    formatMod,
    queryMod,
    searchMod,
) {

    const mrpRecType = 'customrecordmrp_planned_order';
    const splitSublistId = 'custpage_split_sublist';
    const mrpRecIdFieldId = 'custpage_mrp_rec_id';
    const planNumFieldId = 'name';
    // const cancelStatus = '8';
    // const approvedStatus = '2';
    const fromLineFieldId = 'custrecord_from_line';
    const planedStatus = '1';
    const approveStatus = '2';
    const successFlag = '成功';
    const failFlag = '失败';

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

    function validateParent(parentRec) {
        const inactiveFieldId = 'isinactive';
        const splitedFieldId = 'custrecord_splited';
        const mergedFieldId = 'custrecord_platform_merged';
        const toLineFieldId = 'custrecord_to_line';
        const relatePrFieldId = 'custrecord_platform_related_pr';
        const planStatusFieldId = 'custrecord_status_plan';

        const isParentInactive = parentRec.getValue({
            fieldId: inactiveFieldId
        });
        const isParentSplited = parentRec.getValue({
            fieldId: splitedFieldId
        });
        const isParentMerged = parentRec.getValue({
            fieldId: mergedFieldId
        });
        const relatedLines = parentRec.getValue({
            fieldId: toLineFieldId
        });
        const replatedPr = parentRec.getValue({
            fieldId: relatePrFieldId
        });
        const planStatus = parentRec.getValue({
            fieldId: planStatusFieldId
        });

        if (isParentInactive === true) {
            throw new Error('该记录已被禁用');
        }
        if (isParentSplited === true) {
            throw new Error('该记录已被拆分');
        }
        if (isParentMerged === true) {
            throw new Error('该记录已被合并');
        }
        if (relatedLines.length !== 0) {
            throw new Error('该记录已有相关To Line记录');
        }
        if (replatedPr) {
            throw new Error('该记录已被投放');
        }
        if(planStatus != planedStatus){
            throw new Error('该记录状态不是计划中');
        }

        return {
            inactiveFieldId,
            splitedFieldId,
            mergedFieldId,
            toLineFieldId,
            relatePrFieldId,
            planStatusFieldId,
        }
    }

    function viewPage(request, response) {
        const { parameters: { ispopup: isPopup, mrprecid: mrpRecId } } = request;
        const formTitle = '计划行分拆';
        const formCSPath = '../cs/cs_pl_to_pr_split_line';
        const submitLabel = '确认分拆';
        const notSearchBodyFields = new Set([
            'custrecord_suggested_order_quantity_split',
            mrpRecIdFieldId
        ]);
        const mainGroup = {
            id: 'custpage_group_main_info',
            label: '原计划行数据'
        };
        const bodyFields = [
            {
                id: 'custrecord_plan_order_num',
                label: '原订单号',
                type: 'TEXT',
                displayType: 'INLINE'
            },
            {
                id: 'custrecord_suggested_order_quantity',
                label: '建议订单数量',
                type: 'FLOAT',
                displayType: 'INLINE'
            },
            {
                id: 'custrecord_suggested_order_quantity_split',
                label: '可分拆数量',
                type: 'FLOAT',
                displayType: 'INLINE',
            },
            {
                id: 'custrecord_plan_date',
                label: '建议订单日期',
                type: 'DATE',
                displayType: 'INLINE'
            },
            {
                id: 'custrecord_platform_end_date',
                label: '建议到货日期',
                type: 'DATE',
                displayType: 'INLINE'
            },
            {
                id: 'custrecord_item_nums',
                label: '物料编码',
                type: 'SELECT',
                source: 'item',
                displayType: 'INLINE'
            },
            {
                id: 'custrecord_platform_item_name',
                label: '物料名称',
                type: 'TEXT',
                displayType: 'INLINE'
            },
            {
                id: 'custrecord_item_model',
                label: '规格型号',
                type: 'TEXT',
                displayType: 'INLINE'
            },
            {
                id: 'custrecord_platform_uom',
                label: '采购单位',
                type: 'SELECT',
                source: '-221',
                displayType: 'INLINE'
            },
            {
                id: 'custrecord_plan_vendor',
                label: '供应商',
                type: 'SELECT',
                source: 'vendor',
                displayType: 'INLINE'
            },
            {
                id: 'custrecord_apply_for_department',
                label: '部门',
                type: 'SELECT',
                source: 'department',
                displayType: 'INLINE'
            },
            {
                id: mrpRecIdFieldId,
                label: 'Parent MRP ID',
                type: 'SELECT',
                source: mrpRecType,
                displayType: 'HIDDEN'
            },
            {
                id: 'custrecord_net_requirement',
                label: '净需求',
                type: 'FLOAT',
                displayType: 'HIDDEN'
            }
        ];
        const splitSublistFields = [
            {
                id: 'custpage_split_sub_order_num',
                label: '子单号',
                type: 'TEXT',
                displayType: 'DISABLED'
            },
            {
                id: 'custpage_split_suggest_num',
                label: '建议订单量',
                type: 'FLOAT'
            },
            {
                id: 'custpage_split_suggest_order_date',
                label: '建议订单日期',
                type: 'DATE',
            },
            {
                id: 'custpage_split_suggest_receive_date',
                label: '建议到货日期',
                type: 'DATE',
            },
            {
                id: 'custpage_split_vendor',
                label: '供应商',
                type: 'SELECT',
                source: 'vendor',
            },
            {
                id: 'custpage_split_status',
                label: '状态',
                type: 'SELECT',
                source: 'customlist_mrp_pl_status_2',
                displayType: 'HIDDEN'
            },
        ];

        if (!mrpRecId) {
            response.write({
                output: `缺少待拆分的记录ID`
            });
            return false;
        }

        try {
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

            //查询原计划单信息
            // const mrpQuery = queryMod.create({
            //     type: mrpRecType
            // });
            // const mrpConditions = [
            //     mrpQuery.createCondition({
            //         fieldId: 'id',
            //         operator: queryMod.Operator.ANY_OF,
            //         values: [mrpRecId]
            //     }),
            // ];
            // const mrpColumns = [];
            // for (const { id: fieldId } of bodyFields) {
            //     if (!notSearchBodyFields.has(fieldId)) {
            //         mrpColumns.push(mrpQuery.createColumn({ fieldId }));
            //     }
            // }
            // mrpQuery.condition = mrpQuery.and(...mrpConditions);
            // mrpQuery.columns = mrpColumns;
            // const mrpResultSet = mrpQuery.run();
            // const [resultObj] = mrpResultSet.asMappedResults();
            // if (!resultObj) {
            //     throw new Error(`没有找到ID：${mrpRecId} 对应的信息`);
            // }

            //Workbook搜索不到单位字段，故改用Saved Search-2020-4-3
            const resultObj = {};
            let isParentFound = false;
            const filters = [
                {
                    name : 'internalid',
                    operator : 'anyof',
                    values : [mrpRecId]
                }
            ];
            const columns = [];
            for (const { id: name } of bodyFields) {
                if (!notSearchBodyFields.has(name)) {
                    columns.push({
                        name,
                    });
                }
            }
            const mrpSearch = searchMod.create({
                type : mrpRecType,
                filters,
                columns,
            });
            mrpSearch.run().each(result => {
                result.columns.forEach(column => resultObj[column.name] = result.getValue(column));
                isParentFound = true;
                return false;
            });
            if (!isParentFound) {
                throw new Error(`没有找到ID：${mrpRecId} 对应的信息`);
            }

            //设置头部字段值
            form.updateDefaultValues({
                ...resultObj,
                'custrecord_suggested_order_quantity_split': resultObj['custrecord_suggested_order_quantity'],
                [mrpRecIdFieldId]: mrpRecId
            });

            //创建子列表
            const splitSublist = form.addSublist({
                id: splitSublistId,
                label: '分拆子行',
                type: serverWidgetMod.SublistType.INLINEEDITOR,
            });
            //创建子列表字段
            createFields({
                form: splitSublist,
                fields: splitSublistFields
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
                output: '分拆页面生成失败，错误提示：' + ex.message
            });
        }
    }

    function submitPage(request, response) {
        const { parameters: { [mrpRecIdFieldId]: mrpRecId } } = request;
        const splitLineList = new Set();
        const custFieldPrefix = 'custrecord';
        const lineCount = request.getLineCount({
            group: splitSublistId
        });
        
        try {
            //获取父记录信息
            const parentRec = recordMod.load({
                type: mrpRecType,
                id: mrpRecId
            });
            const parentNum = parentRec.getValue({
                fieldId: planNumFieldId
            });
            //净需求
            const netReqNum = parentRec.getValue({
                fieldId: "custrecord_net_requirement"
            });
            //建议拆分数量
            const suggestOrderQty = parentRec.getValue({
                fieldId: "custrecord_suggested_order_quantity"
            });
            const { inactiveFieldId, splitedFieldId, toLineFieldId } = validateParent(parentRec);
            const parentCustomFields = parentRec.getFields().filter(id => id.startsWith(custFieldPrefix) && id !== fromLineFieldId);
            let parentCustomValues = parentCustomFields.map(fieldId => ({ fieldId, value: parentRec.getValue({ fieldId }) }));
            parentCustomValues = parentCustomValues.filter(({ value }) => value !== '');

            // log.debug('parentCustomValues', parentCustomValues);

            //获取结果列表
            for (let i = 0; i < lineCount; i++) {
                const currentStatus = request.getSublistValue({
                    group: splitSublistId,
                    name: 'custpage_split_status',
                    line: i
                });
                let curSuggestOrderDate = request.getSublistValue({
                    group: splitSublistId,
                    name: 'custpage_split_suggest_order_date',
                    line: i
                });
                let curSuggestReceiveDate = request.getSublistValue({
                    group: splitSublistId,
                    name: 'custpage_split_suggest_receive_date',
                    line: i
                });
                if (curSuggestOrderDate) {
                    curSuggestOrderDate = formatMod.parse({
                        type: formatMod.Type.DATE,
                        value: curSuggestOrderDate
                    });
                }
                if (curSuggestReceiveDate) {
                    curSuggestReceiveDate = formatMod.parse({
                        type: formatMod.Type.DATE,
                        value: curSuggestReceiveDate
                    });
                }
                //在服务器端编码，客户端编码不甚准确
                const curSubOrderNum = `${parentNum}-${i + 1}`;
                const splitSuggestNum = request.getSublistValue({
                    group: splitSublistId,
                    name: 'custpage_split_suggest_num',
                    line: i
                });
                splitLineList.add([
                    {
                        fieldId: 'autoname',
                        value: false,
                    },
                    {
                        fieldId: planNumFieldId,
                        value: curSubOrderNum,
                    },
                    {
                        fieldId: 'custrecord_suggested_order_quantity',
                        value: splitSuggestNum,
                    },
                    {
                        fieldId: 'custrecord_plan_date',
                        value: curSuggestOrderDate,
                    },
                    {
                        fieldId: 'custrecord_platform_end_date',
                        value: curSuggestReceiveDate,
                    },
                    {
                        fieldId: 'custrecord_plan_vendor',
                        value: request.getSublistValue({
                            group: splitSublistId,
                            name: 'custpage_split_vendor',
                            line: i
                        }),
                    },
                    {
                        fieldId: 'custrecord_net_requirement',
                        value: Math.round(+netReqNum * (+splitSuggestNum / +suggestOrderQty))
                    },
                    {
                        fieldId: 'custrecord_status_plan',
                        value: i == lineCount - 1? planedStatus: approveStatus,
                    },
                    {
                        fieldId: fromLineFieldId,
                        value: mrpRecId
                    },
                ]);
            }

            const childIds = new Set();
            const processResuls = [];
            for (const splitLine of splitLineList) {
                const { value: subOrderNum } = splitLine.find(({ fieldId }) => fieldId === planNumFieldId) || {};
                try {
                    const childRec = recordMod.create({
                        type: mrpRecType,
                        isDynamic: true
                    });
                    //先复制父记录的值
                    parentCustomValues.forEach(valEntry => childRec.setValue(valEntry));
                    //然后复制分拆信息
                    splitLine.filter(({ value }) => value !== '').forEach(valEntry => childRec.setValue(valEntry));
                    //保存
                    const childRecId = childRec.save({
                        ignoreMandatoryFields: true
                    });
                    childIds.add(childRecId);
                    processResuls.push({
                        subOrderNum,
                        status: successFlag,
                        details: `内部ID：${childRecId}`,
                        childId: childRecId
                    });
                } catch (e) {
                    log.error({
                        title: `创建子记录失败${subOrderNum}失败`,
                        details: e
                    });
                    processResuls.push({
                        subOrderNum,
                        status: failFlag,
                        details: `${e.message}, 请您手动创建`
                    });
                }
            }

            //如果有成功分拆的记录，更新父记录
            if (childIds.size > 0) {
                parentRec.setValue({
                    fieldId: inactiveFieldId,
                    value: true
                });
                parentRec.setValue({
                    fieldId: splitedFieldId,
                    value: true
                });
                parentRec.setValue({
                    fieldId: toLineFieldId,
                    value: [...childIds]
                });
                parentRec.save({
                    ignoreMandatoryFields: true
                });
            }

            let pageContent = '';
            for (const { subOrderNum, status, details } of processResuls) {
                pageContent += `<tr><td>${subOrderNum}</td><td>${status}</td><td>${details}</td></tr>`;
            }

            let rspPageHTML = `
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="utf-8">
            <title>拆分结果</title>
            </head>
            <body style="text-align:center;">
                <h1>单号：${parentNum} 拆分结果</h1>
                <table border="1" cellpadding="10" style="border-collapse:collapse;margin:10px auto;font-size:14px;">
                <tr><th>子单号</th><th>处理状态</th><th>提示信息</th></tr>
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
        } catch (ex) {
            log.error({
                title: `拆分${mrpRecId}失败`,
                details: ex
            });
            response.write({
                output: `<p style="color:red;font-size:14px;text-align:center;">拆分失败，请您稍后再试。错误提示：${ex.message}`
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
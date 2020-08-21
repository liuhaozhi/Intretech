/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 *@author Charles Zhang
 *@description 计划单合并的处理
 */
define([
    'N/record',
    'N/search',
    'N/runtime',
    'N/format',
], function (
    recordMod,
    searchMod,
    runtimeMod,
    formatMod,
) {

    const mrpRecType = 'customrecordmrp_planned_order';
    const mrpItemFieldId = 'custrecord_item_nums';
    const taskRecType = 'customrecord_pl_platform_task_record';
    const taskDetailFieldId = 'custrecord_pl_platform_task_detail';
    const fromLineFieldId = 'custrecord_from_line';
    const successFlag = 'success';
    const failFlag = 'fail';
    const planedStatus = '1';
    const approveStatus = '2';

    function sortEntriesByDate(arr, dateKey, isAsc) {
        arr.sort((left, right) => {
            let { [dateKey]: leftDate } = left;
            let { [dateKey]: rightDate } = right;
            if (leftDate) {
                leftDate = formatMod.parse({
                    type: formatMod.Type.DATE,
                    value: leftDate
                });
            } else {
                leftDate = new Date(0);
            }

            if (rightDate) {
                rightDate = formatMod.parse({
                    type: formatMod.Type.DATE,
                    value: rightDate
                });
            } else {
                rightDate = new Date(0);
            }

            return isAsc ? leftDate.getTime() - rightDate.getTime() : rightDate.getTime() - leftDate.getTime();
        });

        return arr;
    }

    function parseDate(dateStr) {
        let dateObj = '';
        if (dateStr) {
            dateObj = formatMod.parse({
                type: formatMod.Type.DATE,
                value: dateStr
            });
        }
        return dateObj;
    }

    function validateSource(valueMap, isinactive, internalid) {
        const inactiveFieldId = 'isinactive';
        const splitedFieldId = 'custrecord_splited';
        const mergedFieldId = 'custrecord_platform_merged';
        const toLineFieldId = 'custrecord_to_line';
        const relatePrFieldId = 'custrecord_platform_related_pr';
        const planStatusFieldId = 'custrecord_status_plan';
        const isParentInactive = isinactive;
        const { 
            [splitedFieldId]: isParentSplited,
            [mergedFieldId]: isParentMerged,
            [toLineFieldId]: relatedLines,
            [relatePrFieldId] : replatedPr,
            [planStatusFieldId] : planStatus,
        } = valueMap;

        if (isParentInactive === true || isParentInactive === 'T') {
            throw new Error(`记录${internalid}已被禁用`);
        }
        if (isParentSplited === true || isParentSplited === 'T') {
            throw new Error(`记录${internalid}已被拆分`);
        }
        if (isParentMerged === true || isParentMerged === 'T') {
            throw new Error(`记录${internalid}已被合并`);
        }
        if (relatedLines) {
            throw new Error(`记录${internalid}已有相关To Line记录`);
        }
        if(replatedPr){
            throw new Error(`记录${internalid}已被投放`);
        }
        if(planStatus != planedStatus){
            throw new Error(`记录${internalid}的状态不是计划中`);
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

    //entry points
    function getInputData(context) {
        const paramFieldId = 'custscript_q_merge_source_data';
        const currentScript = runtimeMod.getCurrentScript();
        const inputParams = currentScript.getParameter({ name: paramFieldId });
        const { lines, taskRecId } = JSON.parse(inputParams);
        const mergeMap = new Map();

        //搜索物料，因为根据物料合并
        const searchObj = searchMod.create({
            type: mrpRecType,
            filters: [
                {
                    name: 'internalid',
                    operator: 'anyof',
                    values: lines.map(({ custpage_internalid: plId }) => plId)
                }
            ],
            columns: [
                {
                    name: mrpItemFieldId
                }
            ]
        });
        searchObj.run().each(result => {
            const { id: planId } = result;
            const itemId = result.getValue({ name: mrpItemFieldId });
            if (!mergeMap.has(itemId)) {
                mergeMap.set(itemId, { taskRecId, planIds: [] });
            }
            mergeMap.get(itemId).planIds.push(planId);
            return true;
        });
        const mergeObj = Object.fromEntries(mergeMap);

        // log.debug('mergeObj', mergeObj);

        return mergeObj;
    }

    function map(context) {
        const { key, value, isRestarted } = context;
        const custFieldPrefix = 'custrecord';
        let taskRecId = '';
        let planIds = [];
        const dateFieldIds = new Set([
            'custrecord_plan_date',//建议采购或开工日期
            'custrecord_platform_end_date',//建议到货完工日期
            'custrecord_demand_date',//需求日期
            'custrecord_platform_approve_date'//审核日期
        ]);

        try {
            ({ taskRecId, planIds } = JSON.parse(value));

            //少于两条的不允许合并
            if(planIds.length < 2){
                throw {
                    name : 'CUSTOMERROR',
                    message : '属于同一物料但少于两条的计划单不允许合并'
                }
            }

            //重复数据检测
            if (isRestarted) {
                let mergeRecId = null;
                searchMod.create({
                    type: mrpRecType,
                    filters: [
                        {
                            name: fromLineFieldId,
                            operator: 'anyof',
                            values: planIds
                        }
                    ],
                    columns: [
                        {
                            name: 'internalid',
                            sort: searchMod.Sort.DESC
                        }
                    ]
                }).run().each(result => {
                    mergeRecId = result.id;
                    return false;
                });
                if (mergeRecId) {
                    //输出
                    context.write({
                        key,
                        value: {
                            status: successFlag,
                            mergeRecId,
                            planIds,
                            taskRecId,
                        }
                    });
                    return true;
                }
            }

            //先创建合并的记录
            const mergedRec = recordMod.create({
                type: mrpRecType,
                isDynamic: true
            });

            //搜索原单据信息
            const resultList = [];
            const filters = [
                {
                    name: 'internalid',
                    operator: 'anyof',
                    values: planIds
                }
            ];
            const columns = mergedRec.getFields().filter(id => id.startsWith(custFieldPrefix)).map(name => ({ name }));
            columns.push(
                {
                    name: 'internalid',
                    sort: searchMod.Sort.DESC
                },
                {
                    name: 'isinactive'
                }
            );
            const searchObj = searchMod.create({
                type: mrpRecType,
                filters,
                columns,
            });
            searchObj.run().each(result => {
                const { columns } = result;
                const resultEntry = {};
                for (const column of columns) {
                    resultEntry[column.name] = result.getValue(column);
                }
                resultList.push(resultEntry);
                return true;
            });

            //先设置不变的值-这里循环所有的记录，是因为不想漏掉某些为空的数据
            const multiType = Symbol('multipe');
            const textType = Symbol('text');
            const mergeValueList = new Set([
                {
                    fieldId: 'custrecord_platform_source_number',
                    mergeType: multiType,
                    value: []
                },
                {
                    fieldId: 'custrecord_platform_forecast_number',
                    mergeType: multiType,
                    value: []
                },
                {
                    fieldId: 'custrecord_platform_so_type',
                    mergeType: multiType,
                    value: []
                },
                {
                    fieldId: 'custrecord_platform_cus_num',
                    mergeType: multiType,
                    value: []
                },
                {
                    fieldId: 'custrecord_platform_project_num',
                    mergeType: multiType,
                    value: []
                },
                {
                    fieldId: 'custrecord_platform_calculate_num',
                    mergeType: textType,
                    value: ''
                },
                {
                    fieldId: 'custrecord_plaform_source_line_num',
                    mergeType: textType,
                    value: ''
                },
            ]);
            resultList.forEach(({ internalid, isinactive, ...valueMap }) => {
                //先验证被合并的记录是否有效
                validateSource(valueMap, isinactive, internalid);

                //赋予默认值
                for (let [fieldId, value] of Object.entries(valueMap)) {
                    const currentValue = mergedRec.getValue({ fieldId });
                    if (currentValue === '' && value !== '') {
                        if (dateFieldIds.has(fieldId)) {
                            value = parseDate(value);
                        }
                        mergedRec.setValue({
                            fieldId,
                            value
                        });
                    }
                }

                //统计合计的值
                for (const entry of mergeValueList) {
                    const { mergeType, fieldId, value } = entry;
                    const { [fieldId]: fieldValue } = valueMap;
                    if (fieldValue !== '') {
                        switch (mergeType) {
                            case multiType:
                                entry.value = [
                                    ...value,
                                    ...fieldValue.split(','),
                                ];
                                break;
                            case textType:
                                entry.value += (entry.value ? '/' : '') + fieldValue;
                                break;
                            default:
                                break;
                        }
                    }
                }
            });

            // log.debug('mergeValueList', [...mergeValueList]);

            //设置合并的值
            for (const { mergeType, fieldId, value } of mergeValueList) {
                if (mergeType === multiType && value.length > 0) {
                    mergedRec.setValue({
                        fieldId,
                        value: [...new Set(value)],
                    });
                } else if (mergeType === textType && value !== '') {
                    mergedRec.setValue({
                        fieldId,
                        value,
                    });
                }
            }

            //再设置特殊的规则的值
            //来源类型
            mergedRec.setValue({
                fieldId: 'custrecord_create_type',
                value: '4'//MRP合并
            });
            //状态
            mergedRec.setValue({
                fieldId: 'custrecord_status_plan',
                value: approveStatus
            });
            //已下推数量
            mergedRec.setValue({
                fieldId: 'custrecord_has_the_amount',
                value: ''
            });
            //数量合并
            const yuanJianYiQtyFieldId = 'custrecord_planned_order_quantity';
            const jianYiQtyFieldId = 'custrecord_suggested_order_quantity';
            const netRequirement = 'custrecord_net_requirement';
            const totalNums = resultList.reduce((total, current) => {
                total[yuanJianYiQtyFieldId] += +current[yuanJianYiQtyFieldId] || 0;
                total[jianYiQtyFieldId] += +current[jianYiQtyFieldId] || 0;
                total[netRequirement] = +total[netRequirement] || 0;
                total[netRequirement] += +current[netRequirement] || 0;
                return total;
            }, { [yuanJianYiQtyFieldId]: 0, [jianYiQtyFieldId]: 0 });
            //净需求合并
            mergedRec.setValue({
                fieldId: netRequirement,
                value: +totalNums[netRequirement].toFixed(6)
            });
            //原建议订单量
            mergedRec.setValue({
                fieldId: yuanJianYiQtyFieldId,
                value: +totalNums[yuanJianYiQtyFieldId].toFixed(6)
            });
            //建议订单量
            mergedRec.setValue({
                fieldId: jianYiQtyFieldId,
                value: +totalNums[jianYiQtyFieldId].toFixed(6)
            });

            //日期排序
            const resultListCopy = [...resultList];
            const jianYiPurchDateFieldId = 'custrecord_plan_date';
            const jianYiReceiveDateFieldId = 'custrecord_platform_end_date';
            const demandDateFieldId = 'custrecord_demand_date';

            //建议到货或完工日期
            sortEntriesByDate(resultListCopy, jianYiReceiveDateFieldId, true);
            mergedRec.setValue({
                fieldId: jianYiReceiveDateFieldId,
                value: parseDate(resultListCopy[0][jianYiReceiveDateFieldId])
            });
            //需求日期
            sortEntriesByDate(resultListCopy, demandDateFieldId, true);
            mergedRec.setValue({
                fieldId: demandDateFieldId,
                value: parseDate(resultListCopy[0][demandDateFieldId])
            });
            //固定提前期
            const leadTimeValue = mergedRec.getValue({ fieldId: "custrecord_lead_time" }) || 0;
            const demandDateValue = new Date(resultListCopy[0][demandDateFieldId]);
            demandDateValue.setDate(demandDateValue.getDate() - leadTimeValue);
            //建议采购或开工日期
            //sortEntriesByDate(resultListCopy, jianYiPurchDateFieldId, true);
            mergedRec.setValue({
                fieldId: jianYiPurchDateFieldId,
                value: parseDate(demandDateValue)
            });
            //审核人
            const currentUser = runtimeMod.getCurrentUser();
            mergedRec.setValue({
                fieldId: 'custrecord_platform_approver',
                value: currentUser.id
            });
            //审核日期
            mergedRec.setValue({
                fieldId: 'custrecord_platform_approve_date',
                value: new Date()
            });

            //Splited
            mergedRec.setValue({
                fieldId: 'custrecord_splited',
                value: false
            });
            //Merged
            mergedRec.setValue({
                fieldId: 'custrecord_platform_merged',
                value: false
            });
            //To_Line
            mergedRec.setValue({
                fieldId: 'custrecord_to_line',
                value: []
            });
            //From Line
            mergedRec.setValue({
                fieldId: fromLineFieldId,
                value: planIds
            });

            const mergeRecId = mergedRec.save({
                ignoreMandatoryFields: true
            });

            //再逐个更新被合并的原纪录
            for (const planId of planIds) {
                try {
                    recordMod.submitFields({
                        type: mrpRecType,
                        id: planId,
                        values: {
                            isinactive: true,
                            custrecord_platform_merged: true,
                            custrecord_to_line: mergeRecId
                        },
                        options: {
                            ignoreMandatoryFields: true
                        }
                    });
                } catch (e) {
                    log.error({
                        title: `回写原纪录${planId}错误`,
                        details: e
                    });
                }
            }

            //输出
            context.write({
                key,
                value: {
                    status: successFlag,
                    mergeRecId,
                    planIds,
                    taskRecId,
                }
            });
            return true;
        } catch (ex) {
            log.error({
                title: `合并物料${key}的计划单时出错`,
                details: {
                    ex,
                    value
                }
            });

            //输出
            context.write({
                key,
                value: {
                    status: failFlag,
                    message: ex.message,
                    planIds,
                    taskRecId,
                }
            });
            return false;
        }
    }

    function summarize(summary) {
        const { mapSummary, output } = summary;
        let targetTaskRecId;

        //记录系统级错误
        mapSummary.errors.iterator().each((key, error, executionNo) => {
            log.error({
                title: `第${executionNo}次合并物料${key}的计划单时出错`,
                details: error
            });
            return true;
        });

        //遍历结果
        const resultSummary = new Set();
        output.iterator().each((itemId, info) => {
            const { taskRecId, ...resultInfo } = JSON.parse(info);
            if (!targetTaskRecId) {
                targetTaskRecId = taskRecId;
            }

            resultSummary.add(resultInfo);
            return true;
        });

        try {
            recordMod.submitFields({
                type: taskRecType,
                id: targetTaskRecId,
                values: {
                    [taskDetailFieldId]: JSON.stringify([...resultSummary])
                },
                options: {
                    ignoreMandatoryFields: true
                }
            });
        } catch (ex) {
            log.error({
                title: `更新任务记录${targetTaskRecId}详情失败`,
                details: ex
            });
        }
    }

    return {
        getInputData,
        map,
        summarize
    }
});
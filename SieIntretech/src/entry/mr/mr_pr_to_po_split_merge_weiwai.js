/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 *@author Charles Zhang
 *@description CUX-PR的分拆与合并-为下推委外PO和WO
 */
define([
    'N/record',
    'N/search',
    'N/runtime',
    'N/format',
    'N/error',
    'N/task',
], function (
    recordMod,
    searchMod,
    runtimeMod,
    formatMod,
    errorMod,
    taskMod,
) {

    const prRecType = 'customrecord_purchase_application';
    const prSubsidiaryFieldId = 'custrecord_platform_pr_subsidiary';
    const prVendorFieldId = 'custrecord_plan_vendor_pr';
    const taskRecType = 'customrecord_pl_platform_task_record';
    const taskDetailFieldId = 'custrecord_pl_platform_task_detail';
    const secondTaskIdFieldId = 'custrecord_pl_platform_task_id_p2';
    const prStatusFieldId = 'custrecord_status_plan_pr';
    const prRemainQtyFieldId = 'custrecord_platform_pr_not_order_number';
    const prOrderTypeFieldId = 'custrecord_order_type_pr';
    const prDepartmentFieldId = 'custrecord_apply_for_department_pr';
    const prCurrencyFieldId = 'custrecord_platform_pr_currency';
    const prCreatorFieldId = 'custrecord_platform_pr_creator';
    const prMemoFieldId = 'custrecord_memo_plan_pr';
    const prApplierFieldId = 'custrecord_platform_pr_applier';
    const prItemFieldId = 'custrecord_item_num_pr';
    const approvedStatus = '2';
    const custFieldPrefix = 'custrecord';
    const prQtyFieldId = 'custrecord_platform_pr_number';
    const prToLineFieldId = 'custrecord_to_line_pr';
    const prFromLineFieldId = 'custrecord_from_line_pr';
    const prSplitedFieldId = 'custrecord_splited_pr';
    const prMergedFieldId = 'custrecord_platform_pr_merged';
    const prReceiveDateFieldId = 'custrecord_platform_pr_receipt_date';
    const mrpRunRecType = 'customrecord_cux_mrp_running_record';
    const mrpRunTimeFieldId = 'custrecord_cux_mrp_running_datetime';
    const subsidiaryPeriodFieldId = 'custrecord_merge_periods';
    const createPoTaskScriptId = 'customscript_mr_pr_to_po_weiwai_transf';
    const createPoTaskScriptInputId = 'custscript_q_weiwei_data_source';

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

    function formatDate(dateObj) {
        let dateStr = '';
        if (dateObj) {
            dateStr = formatMod.format({
                type: formatMod.Type.DATE,
                value: dateObj
            });
        }

        return dateStr;
    }

    function validateSource(resultList) {
        //验证货币是否一致
        const [{ [prCurrencyFieldId]: baseCurrency }, ...restEntries] = resultList;
        for (const { [prCurrencyFieldId]: currentCurrency } of restEntries) {
            if (currentCurrency != baseCurrency) {
                throw errorMod.create({
                    name: 'CURRENCY_MISMATCH',
                    message: '合并的条目货币不一致'
                });
            }
        }

        //验证状态 和 剩余下推数量
        for (const { [prStatusFieldId]: currentStatus, [prRemainQtyFieldId]: currentRemainQty, internalid } of resultList) {
            if (currentStatus != approvedStatus) {
                throw errorMod.create({
                    name: 'INVALID_STATUS',
                    message: `ID为${internalid}的自定义PR的状态不是已审核`
                });
            }
            const currentRemainQtyNum = +currentRemainQty;
            if (currentRemainQtyNum <= 0) {
                throw errorMod.create({
                    name: 'NONE_REMAIN_QTY',
                    message: `ID为${internalid}的自定义PR的已没有剩余可推数量`
                });
            }
        }

        return true;
    }

    function getOneOfPrResult(resultList, prFieldId) {
        const result = resultList.find(({ [prFieldId]: value }) => !!value);
        return result ? result[prFieldId] : '';
    }

    function getStringCombinedResult(resultList, prFieldId) {
        return resultList.map(({ [prFieldId]: value }) => value).filter(value => !!value).join('/').slice(0, 300);
    }

    function getGroupKey(...elements) {
        return elements.join('-');
    }

    //entry points
    function getInputData(context) {
        const paramFieldId = 'custscript_q_split_merge_weiwai';
        const currentScript = runtimeMod.getCurrentScript();
        const inputParams = currentScript.getParameter({ name: paramFieldId });
        const { lines, taskRecId, periods } = JSON.parse(inputParams);

        if (!periods.length) {//如果用户没有填写合并周期天数，则使用默认天数
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
                        name: subsidiaryPeriodFieldId
                    },
                ]
            }).run().each(result => {
                const { id: subsidiaryId } = result;
                const period = result.getValue({
                    name: subsidiaryPeriodFieldId
                });
                periods.push({
                    subsidiaryId,
                    period,
                });
                return true;
            });
        }

        for (const line of lines) {
            line.taskRecId = taskRecId;
            line.periods = periods;
        }

        return lines;
    }

    function map(context) {//分拆
        const { value, isRestarted } = context;
        let { internalid: prId, transformQty, taskRecId, periods } = JSON.parse(value);
        let willCombineSplitRecId = null;
        let theOtherSplitRecId = null;
        let subsidiaryId = '';
        let vendorId = '';
        let message = '';
        let currentPeriod = null;
        const excludeCopyFields = new Set([
            'custrecord_plan_order_num_pr',
            'custrecord_from_line_pr',
            'custrecord_to_line_pr',
            'custrecord_platform_related_po_id',
            'custrecord_pr_related_pr',
            'custrecord_platform_work_order',
        ]);

        try {
            transformQty = +transformQty || 0;

            //加载父记录
            const parentPrRec = recordMod.load({
                type: prRecType,
                id: prId,
            });

            //获取父记录的值
            subsidiaryId = parentPrRec.getValue({
                fieldId: prSubsidiaryFieldId,
            });
            vendorId = parentPrRec.getValue({
                fieldId: prVendorFieldId,
            });
            const parentRemainQty = parentPrRec.getValue({
                fieldId: prRemainQtyFieldId,
            });

            //计算当前子公司的合并周期天数
            currentPeriod = periods.find(({ subsidiaryId: currentSubsidiaryId }) => currentSubsidiaryId == subsidiaryId);
            currentPeriod = currentPeriod ? (+currentPeriod.period || 0) : 0;

            //如果父记录的数量正好符合下推数量，直接使用父记录
            if (parentRemainQty === transformQty) {
                const groupKey = getGroupKey(subsidiaryId, vendorId);
                context.write({
                    key: groupKey,
                    value: {
                        prId,
                        transformQty,
                        message,
                        taskRecId,
                        currentPeriod,
                        subsidiaryId,
                        vendorId,
                    }
                });
                return true;
            }

            //获取自定义字段值列表
            const parentCustomFields = parentPrRec.getFields().filter(id => id.startsWith(custFieldPrefix));
            let parentCustomValues = parentCustomFields.map(fieldId => ({ fieldId, value: parentPrRec.getValue({ fieldId }) }));
            parentCustomValues = parentCustomValues.filter(({ fieldId, value }) => value !== '' && !excludeCopyFields.has(fieldId));

            //重复数据检测
            if (isRestarted) {

            }

            //验证父记录


            //创建分拆子记录-将会被合并的那一个
            const willCombineSplitRec = recordMod.create({
                type: prRecType,
                isDynamic: true,
            });

            //复制父记录的值
            parentCustomValues.forEach(valEntry => willCombineSplitRec.setValue(valEntry));

            //修改数量
            willCombineSplitRec.setValue({
                fieldId: prQtyFieldId,
                value: transformQty,
            });

            //From Line
            willCombineSplitRec.setValue({
                fieldId: prFromLineFieldId,
                value: [prId]
            });

            willCombineSplitRecId = willCombineSplitRec.save({
                ignoreMandatoryFields: true,
            });

            //创建第二个子记录
            const theOtherSplitRec = recordMod.create({
                type: prRecType,
                isDynamic: true,
            });

            //复制父记录的值
            parentCustomValues.forEach(valEntry => theOtherSplitRec.setValue(valEntry));

            //设置数量
            const remainQty = +(parentRemainQty - transformQty).toFixed(6);
            theOtherSplitRec.setValue({
                fieldId: prQtyFieldId,
                value: remainQty,
            });

            //From Line
            theOtherSplitRec.setValue({
                fieldId: prFromLineFieldId,
                value: [prId]
            });

            theOtherSplitRecId = theOtherSplitRec.save({
                ignoreMandatoryFields: true,
            });

            //更新父记录
            parentPrRec.setValue({
                fieldId: 'isinactive',
                value: true,
            });

            //To Line
            parentPrRec.setValue({
                fieldId: prToLineFieldId,
                value: [
                    willCombineSplitRecId,
                    theOtherSplitRecId,
                ],
            });

            //Splited
            parentPrRec.setValue({
                fieldId: prSplitedFieldId,
                value: true,
            });

            parentPrRec.save({
                ignoreMandatoryFields: true,
            });
        } catch (ex) {
            message = `分拆CUX-PR:${prId}发生错误，错误提示：${ex.message}`;
            log.error({
                title: `分拆CUX-PR:${prId}失败`,
                details: {
                    ex,
                    value,
                    willCombineSplitRecId,
                    theOtherSplitRecId,
                }
            });
        }

        //输出
        const groupKey = getGroupKey(subsidiaryId, vendorId);
        context.write({
            key: groupKey,
            value: {
                prId: willCombineSplitRecId,
                transformQty,
                message,
                taskRecId,
                currentPeriod,
                subsidiaryId,
                vendorId,
            }
        });
    }

    function reduce(context) {//合并-以子公司+供应商为维度
        const { key, values, isRestarted } = context;
        const willMergeLines = values.map(value => JSON.parse(value));
        const [{ currentPeriod, taskRecId, subsidiaryId, vendorId, }] = willMergeLines;
        const utilMod = util;
        const mergedOrderList = [];
        const rangeCount = 1000;
        let mrpLastRunDate = null;
        const mergeMessages = new Set();
        const dateFields = new Set([
            prReceiveDateFieldId,
            'custrecord_platform_pr_pur_date',
            'custrecord_platform_pr_approval_date',
            'custrecord_platform_pr_create_date',
        ]);
        const multiSelectFields = new Set([
            'custrecord_create_num_pr',
            'custrecord_platform_pr_order_type',
            'custrecord_platform_pr_cus_id',
            'custrecord_platform_pr_pro_id',
        ]);
        const excludeCopyFields = new Set([
            'custrecord_plan_order_num_pr',
            'custrecord_from_line_pr',
            'custrecord_to_line_pr',
            'custrecord_platform_related_po_id',
            'custrecord_pr_related_pr',
            'custrecord_platform_work_order',
        ]);

        try {
            //重复检测
            if (isRestarted) {

            }

            //搜集CUX-PR的物料信息等
            const mergeGroups = new Map();
            const prIdQtyMap = new Map();
            for (const { prId, transformQty, message } of willMergeLines) {
                if (prId) {
                    prIdQtyMap.set(String(prId), { transformQty });
                }
                if (message) {
                    mergeMessages.add(message);
                }
            }

            //检测当前子公司的周期天数
            if (!utilMod.isNumber(currentPeriod) || currentPeriod < 0) {
                throw errorMod.create({
                    name: 'NO_VALID_MERGE_PERIOD',
                    message: `对于子公司${subsidiaryId}无效的合并周期天数${currentPeriod}`
                });
            }

            //搜索最近一次运行MRP的时间
            searchMod.create({
                type: mrpRunRecType,
                filters: [
                    {
                        name: 'custrecord_cux_mrp_last_running_flag',
                        operator: 'is',
                        values: 'T'
                    },

                ],
                columns: [
                    {
                        name: mrpRunTimeFieldId,
                    },
                    {
                        name: 'internalid',
                        sort: searchMod.Sort.DESC,
                    },
                ]
            }).run().each(result => {
                mrpLastRunDate = result.getValue({ name: mrpRunTimeFieldId });
                return !mrpLastRunDate;
            });
            if (!mrpLastRunDate) {
                throw errorMod.create({
                    name: 'NO_LAST_MRP_RUN_DATE',
                    message: '没有找到MRP最后一次运行的日期'
                });
            }
            mrpLastRunDate = parseDate(mrpLastRunDate);

            // log.debug('mrpLastRunDate', mrpLastRunDate.toString());

            //计算合并周期
            const mergePeriods = [];
            for (let i = 0; i < rangeCount; i++) {
                const startDate = new Date(mrpLastRunDate);
                mrpLastRunDate.setDate(mrpLastRunDate.getDate() + currentPeriod);
                const endDate = new Date(mrpLastRunDate);

                mergePeriods.push({
                    startDate,
                    endDate,
                    startDateText: formatDate(startDate),
                });
            }

            // log.debug('mergePeriods', mergePeriods);

            //搜集CUX-PR的物料信息等，并进行取料和区间的分组
            if (prIdQtyMap.size) {
                const tempPrRec = recordMod.create({
                    type: prRecType,
                });
                const columns = tempPrRec.getFields().filter(id => id.startsWith(custFieldPrefix));
                searchMod.create({
                    type: prRecType,
                    filters: [
                        ['internalid', 'anyof', [...prIdQtyMap.keys()]]
                    ],
                    columns,
                }).run().each(result => {
                    const { id: prId, columns } = result;
                    const itemId = result.getValue(prItemFieldId);
                    let receiveDate = result.getValue(prReceiveDateFieldId);
                    receiveDate = parseDate(receiveDate) || new Date();//为了防止日期报错

                    //查找日期区间
                    const targetPeriod = mergePeriods.find(({ startDate, endDate }) => {
                        const receiveDateTime = receiveDate.getTime();
                        return startDate.getTime() <= receiveDateTime && receiveDateTime < endDate.getTime();
                    });
                    let startDate;
                    let startDateText;
                    if (targetPeriod) {
                        ({ startDateText, startDate } = targetPeriod);
                    } else {
                        startDate = receiveDate;
                        startDateText = prId;
                    }

                    //查找设置区间
                    const groupKey = getGroupKey(itemId, startDateText);
                    if (!mergeGroups.has(groupKey)) {
                        mergeGroups.set(groupKey, [])
                    }

                    //记录PR所有信息，用于合并
                    const { transformQty, message } = prIdQtyMap.get(String(prId));
                    const resultEntry = {
                        prId,
                        mergeReceiveDate: startDate,
                        transformQty,
                        message,
                    };
                    for (const column of columns) {
                        resultEntry[column.name] = result.getValue(column);
                    }
                    mergeGroups.get(groupKey).push(resultEntry);
                    return true;
                });
            }

            //创建合并记录
            for (const [groupKey, prList] of mergeGroups) {
                try {
                    if (prList.length === 1) {//如果该组只有一个PR，则直接输出
                        const [{ prId, transformQty, }] = prList;
                        mergedOrderList.push({
                            prId,
                            transformQty,
                            subsidiaryId,
                            vendorId,
                        });
                    } else {//否则，合并CUX-PR
                        const [{ mergeReceiveDate }] = prList;

                        const mergedPrRec = recordMod.create({
                            type: prRecType,
                            isDynamic: true,
                        });

                        //先设置统一处理的值
                        const customFieldIds = mergedPrRec.getFields().filter(id => id.startsWith(custFieldPrefix));
                        for (const fieldId of customFieldIds) {
                            if (!excludeCopyFields.has(fieldId)) {
                                let newValue = '';
                                if (dateFields.has(fieldId)) {//日期
                                    newValue = parseDate(getOneOfPrResult(prList, fieldId));
                                } else if (multiSelectFields.has(fieldId)) {//多选
                                    const mergedEntries = prList.reduce((total, { [fieldId]: current }) => {
                                        return [
                                            ...total,
                                            ...current.split(','),
                                        ];
                                    }, []);
                                    newValue = [
                                        ...new Set(mergedEntries.filter(entry => !!entry))
                                    ];
                                } else {//其他只取其一
                                    newValue = getOneOfPrResult(prList, fieldId);
                                }

                                if (newValue !== '') {
                                    try {
                                        mergedPrRec.setValue({
                                            fieldId,
                                            value: newValue
                                        });
                                    } catch {
                                        log.debug('set merge value for field error', { fieldId, newValue });
                                    }
                                }
                            }
                        }

                        //状态-已审核
                        mergedPrRec.setValue({
                            fieldId: prStatusFieldId,
                            value: approvedStatus
                        });

                        //数量进行合并
                        const totalQty = prList.reduce((total, { transformQty }) => total + (+transformQty || 0), 0);
                        mergedPrRec.setValue({
                            fieldId: prQtyFieldId,
                            value: +totalQty.toFixed(6)
                        });

                        //到货日期
                        mergedPrRec.setValue({
                            fieldId: prReceiveDateFieldId,
                            value: mergeReceiveDate
                        });

                        //From Line
                        mergedPrRec.setValue({
                            fieldId: prFromLineFieldId,
                            value: prList.map(({ prId }) => prId)
                        });

                        const mergedPrId = mergedPrRec.save({
                            ignoreMandatoryFields: true
                        });

                        //输出
                        mergedOrderList.push({
                            prId: mergedPrId,
                            transformQty: totalQty,
                            subsidiaryId,
                            vendorId,
                        });

                        //回写CUX-PR
                        prList.forEach(({ prId }) => {
                            try {
                                recordMod.submitFields({
                                    type: prRecType,
                                    id: prId,
                                    values: {
                                        isinactive: 'T',
                                        [prToLineFieldId]: mergedPrId,
                                        [prMergedFieldId]: 'T',
                                    },
                                    options: {
                                        ignoreMandatoryFields: true,
                                    }
                                });
                            } catch (eee) {
                                const writeBackErrMsg = `合并的CUX-PR${mergedPrId}创建成功，但是回写CUX-PR${prId}失败, 提示：${eee.message}`;
                                mergeMessages.add(writeBackErrMsg);
                                log.error({
                                    title: `回写CUX-PR${prId}失败`,
                                    details: { mergedPrId, eee }
                                });
                            }
                        });
                    }
                } catch (err) {
                    const singleMergeErrMsg = `合并单个物料和周期的组合为${groupKey}的CUX-PR时出错，错误提示: ${err.message}`;
                    mergeMessages.add(singleMergeErrMsg);
                    log.error({
                        title: `合并单个物料和周期的组合为${groupKey}的CUX-PR时出错`,
                        details: { err, prList }
                    });
                }
            }
        } catch (ex) {
            const flowErrorMsg = `为组合为子公司为${subsidiaryId},供应商为${vendorId}进行合并失败，错误提示：${ex.message}`;
            mergeMessages.add(flowErrorMsg);
            log.error({
                title: `为组合为子公司为${subsidiaryId},供应商为${vendorId}进行合并失败`,
                details: {
                    key,
                    values,
                    ex,
                }
            });
        }

        //输出
        context.write({
            key,
            value: {
                taskRecId,
                list: mergedOrderList,
                messages: [...mergeMessages],
            }
        });
    }

    function summarize(summary) {
        const { output } = summary;
        const submitData = {};
        const logData = {};
        let targetTaskRecId;

        //遍历结果-将有效的结果提交到生成采购单的任务
        output.iterator().each((groupKey, info) => {
            const { taskRecId, list, messages } = JSON.parse(info);
            if (!targetTaskRecId) {
                targetTaskRecId = taskRecId;
            }

            //先记录所有值，记录到任务详情
            logData[groupKey] = {
                list,
                messages,
            };

            //记录有效的可生成采购单的值
            if (list.length) {
                submitData[groupKey] = {
                    list,
                    taskRecId,
                };
            }
            return true;
        });

        //提交到采购订单生成的任务
        let poCreateTaskId = '';
        if (Reflect.ownKeys(submitData).length) {
            try {
                const taskObj = taskMod.create({
                    taskType: taskMod.TaskType.MAP_REDUCE,
                    scriptId: createPoTaskScriptId,
                    params: {
                        [createPoTaskScriptInputId]: JSON.stringify(submitData)
                    }
                });
                poCreateTaskId = taskObj.submit();
            } catch (ex) {
                log.error({
                    title: `提交创建采购订单的任务失败`,
                    details: { ex, submitData }
                });
            }
        }

        //写入任务记录
        try {
            recordMod.submitFields({
                type: taskRecType,
                id: targetTaskRecId,
                values: {
                    [taskDetailFieldId]: JSON.stringify(logData),
                    [secondTaskIdFieldId]: poCreateTaskId
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
        reduce,
        summarize,
    }
});
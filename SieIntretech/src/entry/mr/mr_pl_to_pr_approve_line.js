/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 *@author Charles Zhang
 *@description 计划单审批的处理
 */
define([
    'N/record',
    'N/runtime',
], function (
    recordMod,
    runtimeMod,
) {

    const mrpRecType = 'customrecordmrp_planned_order';
    const taskRecType = 'customrecord_pl_platform_task_record';
    const taskDetailFieldId = 'custrecord_pl_platform_task_detail';
    const successFlag = 'success';
    const failFlag = 'fail';
    const planedStatus = '1';
    const approvedStatus = '2';

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

    //entry points
    function getInputData(context) {
        const paramFieldId = 'custscript_q_pl_pr_app_data_source';
        const currentScript = runtimeMod.getCurrentScript();
        const inputParams = currentScript.getParameter({ name: paramFieldId });
        const { lines, taskRecId } = JSON.parse(inputParams);
        const dataList = {};
        for (const { custpage_internalid: planId } of lines) {
            dataList[planId] = { planId, taskRecId };
        }

        return dataList;
    }

    function map(context) {
        const { key: planId, value, isRestarted } = context;
        const planStatusFieldId = 'custrecord_status_plan';
        let taskRecId = '';

        try {
            ({ taskRecId } = JSON.parse(value));

            //加载计划单
            const planRec = recordMod.load({
                type: mrpRecType,
                id: planId
            });

            //重复数据检测
            if (isRestarted) {
                const planStatus = planRec.getValue({
                    fieldId: planStatusFieldId
                });
                if (planStatus == approvedStatus) {
                    //输出
                    context.write({
                        key: planId,
                        value: {
                            status: successFlag,
                            planId,
                            taskRecId,
                        }
                    });
                    return true;
                }
            }

            //验证计划单是否可被审批
            validateParent(planRec);

            //修改审批状态和审批人
            planRec.setValue({
                fieldId: planStatusFieldId,
                value: approvedStatus
            });
            const currentUser = runtimeMod.getCurrentUser();
            planRec.setValue({
                fieldId: 'custrecord_platform_approver',
                value: currentUser.id,
            });
            planRec.save({
                ignoreMandatoryFields: true
            });

            //输出
            context.write({
                key: planId,
                value: {
                    status: successFlag,
                    planId,
                    taskRecId,
                }
            });
            return true;
        } catch (ex) {
            log.error({
                title: `审批计划单${planId}时出错`,
                details: {
                    ex,
                    value
                }
            });

            //输出
            context.write({
                key: planId,
                value: {
                    status: failFlag,
                    message: ex.message,
                    planId,
                    taskRecId,
                }
            });
            return false;
        }
    }

    function summarize(summary) {
        const { mapSummary, output } = summary;
        let targetTaskRecId = null;

        //记录系统级错误
        mapSummary.errors.iterator().each((key, error, executionNo) => {
            log.error({
                title: `第${executionNo}次审批计划单${key}时出错`,
                details: error
            });
            return true;
        });

        //遍历结果
        const resultSummary = new Set();
        output.iterator().each((planId, info) => {
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
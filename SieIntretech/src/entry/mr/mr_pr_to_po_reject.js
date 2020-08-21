/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 *@author Charles Zhang
 *@description 自定义请购单审批拒绝的处理
 */
define([
    'N/record',
    'N/runtime',
    'N/workflow',
    'N/search',
    'N/error',
], function (
    recordMod,
    runtimeMod,
    workflowMod,
    searchMod,
    errorMod,
) {

    const prRecType = 'customrecord_purchase_application';
    const taskRecType = 'customrecord_pl_platform_task_record';
    const taskDetailFieldId = 'custrecord_pl_platform_task_detail';
    const currentStateScriptId = 'custscript_q_prpo_rejct_state';
    const workflowId = 'customworkflow_pr_approval_routing';
    const actionId = 'workflowaction_pr_route_reject';
    const pendingApproveStatus = '1';//待审核
    const successFlag = 'success';
    const failFlag = 'fail';

    function validateParent(prInfo) {
        const currentScript = runtimeMod.getCurrentScript();
        const currentUser = runtimeMod.getCurrentUser();
        const pendingApproveState = currentScript.getParameter({ name: currentStateScriptId }).trim();

        //验证工作流状态
        const currentSates = prInfo.get('currentSates');
        if(![...currentSates].includes(pendingApproveState)){
            throw errorMod.create({
                name: 'INCORRECT_WORKFLOW_STATE',
                message: '该记录不处于待审批节点'
            });
        }
        
        //验证当前用户是不是下一审批人
        if (prInfo.get('prNextApprover') != currentUser.id) {
            throw errorMod.create({
                name: 'INVALID_APPROVER',
                message: '您不是该单据下一个审批人'
            });
        }

        //验证单据状态
        if (prInfo.get('prStatus') != pendingApproveStatus) {
            throw errorMod.create({
                name: 'INCORRECT_STATUS',
                message: '该记录不处于待审核状态'
            });
        }
        //验证剩余可用数量
        const prRemainQty = +prInfo.get('prRemainQty') || 0;
        if (prRemainQty <= 0) {
            throw errorMod.create({
                name: 'NO_ENOUGH_REMAIN_QTY',
                message: '该记录已没有剩余可推数量'
            });
        }

        return true;
    }

    //entry points
    function getInputData(context) {
        const paramFieldId = 'custscript_q_prpo_reject_data_source';
        const currentScript = runtimeMod.getCurrentScript();
        const inputParams = currentScript.getParameter({ name: paramFieldId });
        const { lines, taskRecId } = JSON.parse(inputParams);
        const dataList = {};
        for (const { custpage_internalid: prId } of lines) {
            dataList[prId] = { prId, taskRecId };
        }

        return dataList;
    }

    function map(context) {
        const { key: prId, value, isRestarted } = context;
        const prStatusFieldId = 'custrecord_status_plan_pr';
        const prRemainQtyFieldId = 'custrecord_platform_pr_not_order_number';
        const nextApproverFieldId = 'custrecord_pr_next_approver';
        let taskRecId = '';

        try {
            ({ taskRecId } = JSON.parse(value));

            //搜索PR的状态信息
            const prInfo = new Map();
            searchMod.create({
                type: prRecType,
                filters: [
                    {
                        name: 'internalid',
                        operator: 'anyof',
                        values: [prId]
                    },
                ],
                columns: [
                    {
                        name: 'currentstate',
                        join: 'workflow',
                    },
                    {
                        name: prStatusFieldId
                    },
                    {
                        name: prRemainQtyFieldId
                    },
                    {
                        name: nextApproverFieldId
                    },
                ]
            }).run().each(result => {
                const prStatus = result.getValue({
                    name: prStatusFieldId
                });
                const prRemainQty = result.getValue({
                    name: prRemainQtyFieldId
                });
                const prNextApprover = result.getValue({
                    name: nextApproverFieldId
                });
                const currentSate = result.getText({
                    name: 'currentstate',
                    join: 'workflow',
                });

                if (!prInfo.has('prStatus')) {
                    prInfo.set('prStatus', prStatus);
                }
                if (!prInfo.has('prRemainQty')) {
                    prInfo.set('prRemainQty', prRemainQty);
                }
                if (!prInfo.has('prNextApprover')) {
                    prInfo.set('prNextApprover', prNextApprover);
                }
                if (!prInfo.has('currentSates')) {
                    prInfo.set('currentSates', new Set());
                }
                prInfo.get('currentSates').add(currentSate);
                return true;
            });

            //重复数据检测
            if (isRestarted) {
                if (prInfo.get('prStatus') != pendingApproveStatus) {
                    context.write({
                        key: prId,
                        value: {
                            status: successFlag,
                            message: '',
                            prId,
                            taskRecId,
                        }
                    });
                    return true;
                }
            }

            //验证计划单是否可被审批
            validateParent(prInfo);

            //工作流跳转
            workflowMod.trigger({
                recordType: prRecType,
                recordId: prId,
                workflowId,
                actionId,
            });

            //输出
            context.write({
                key: prId,
                value: {
                    status: successFlag,
                    message: '',
                    prId,
                    taskRecId,
                }
            });
            return true;
        } catch (ex) {
            log.error({
                title: `审批拒绝PR ${prId}时出错`,
                details: {
                    ex,
                    value,
                }
            });

            //输出
            context.write({
                key: prId,
                value: {
                    status: failFlag,
                    message: ex.message,
                    prId,
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
                title: `第${executionNo}次审批拒绝PR ${key}时出错`,
                details: error
            });
            return true;
        });

        //遍历结果
        const resultSummary = new Set();
        output.iterator().each((prId, info) => {
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
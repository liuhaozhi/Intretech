/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 此程序主要用于计划单的审批功能
 */
define([
    'N/search',
    '../../app/app_pl_pr_platform_server',
], function (
    searchMod,
    appPlatformCommon,
) {

    const jobName = '审批';

    function getResultHtml(taskResultset, taskCurrentStatus = '完成') {
        const taskDetailFieldId = 'custrecord_pl_platform_task_detail';
        const mrpRecType = 'customrecordmrp_planned_order';
        const planIdNumMap = new Map();
        const successFlag = 'success';
        const failFlag = 'fail';
        let summaryObj = null;
        let html = '';

        //查询任务记录
        taskResultset.each(result => {
            const summary = result.getValue({ name: taskDetailFieldId });
            if (summary) {
                summaryObj = JSON.parse(summary);
                for (const { planId } of summaryObj) {
                    planIdNumMap.set(String(planId), planId);
                }
            }
            return false;
        });

        //搜索计划单ID对应的单号
        if (planIdNumMap.size) {
            searchMod.create({
                type: mrpRecType,
                filters: [
                    {
                        name: 'internalid',
                        operator: 'anyof',
                        values: [...planIdNumMap.keys()]
                    }
                ],
                columns: [
                    {
                        name: 'name'
                    }
                ]
            }).run().each(result => {
                const { id } = result;
                const num = result.getValue({ name: 'name' });
                planIdNumMap.set(String(id), num);
                return true;
            });
        }

        //构建输出消息
        if (summaryObj) {
            let tableContent = '';
            for (const { status, planId, message = '' } of summaryObj) {
                const planNum = planIdNumMap.get(String(planId));
                if (status === successFlag) {
                    tableContent += `<tr><td>${planNum}</td><td>成功</td><td></td></tr>`;
                } else if (status === failFlag) {
                    tableContent += `<tr><td>${planNum}</td><td>失败</td><td>${message}</td></tr>`;
                }
            }
                        html = `
                            <div style="text-align:center;">
                                <style>
                                #custpage_result_summary td, #custpage_result_summary th {
                                    padding:10px;
                                    text-align:center;
                                    font-size:14px;
                                }
                                #custpage_result_summary {
                                    border-collapse:collapse;
                                    margin:10px auto;
                                    min-width:200px;
                                }
                                </style>
                                <h1 style="font-size:20px;">${jobName}状态：${taskCurrentStatus}</h1>
                                <table id="custpage_result_summary" border="1" cellpadding="10">
                                <tr><th>计划单号</th><th>状态</th><th>提示</th></tr>
                                ${tableContent}
                                </table>
                            </div>
                        `;
        }

        return html;
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
        const taskScriptId = 'customscript_mr_pl_to_pr_approve_line';
        const taskInputScriptId = 'custscript_q_pl_pr_app_data_source';

        switch (httpMethod) {
            case 'GET':
                appPlatformCommon.viewPage({ request, response, jobName, getResultHtml });
                break;
            case 'POST':
                appPlatformCommon.submitPage({ request, response, jobName, taskScriptId, taskInputScriptId });
                break;
            default:
                break;
        }
    }

    return {
        onRequest
    }
});
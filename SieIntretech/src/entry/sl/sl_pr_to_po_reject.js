/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 此程序主要用于自定义请购单审批拒绝的处理
 */
define([
    'N/search',
    '../../app/app_pl_pr_platform_server',
], function (
    searchMod,
    appPlatformCommon,
) {

    const jobName = '审批拒绝';
    const taskScriptId = 'customscript_mr_pr_to_po_reject';
    const taskInputScriptId = 'custscript_q_prpo_reject_data_source';

    function getResultHtml(taskResultset, taskCurrentStatus = '完成') {
        const taskDetailFieldId = 'custrecord_pl_platform_task_detail';
        const prRecType = 'customrecord_purchase_application';
        const prIdNumMap = new Map();
        const successFlag = 'success';
        const failFlag = 'fail';
        let summaryObj = null;
        let html = '';

        //查询任务记录
        taskResultset.each(result => {
            const summary = result.getValue({ name: taskDetailFieldId });
            if (summary) {
                summaryObj = JSON.parse(summary);
                for (const { prId } of summaryObj) {
                    prIdNumMap.set(String(prId), prId);
                }
            }
            return false;
        });

        //搜索PR ID对应的单号
        if (prIdNumMap.size) {
            searchMod.create({
                type: prRecType,
                filters: [
                    {
                        name: 'internalid',
                        operator: 'anyof',
                        values: [...prIdNumMap.keys()]
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
                prIdNumMap.set(String(id), num);
                return true;
            });
        }

        //构建输出消息
        if (summaryObj) {
            let tableContent = '';
            for (const { status, prId, message = '' } of summaryObj) {
                const prNum = prIdNumMap.get(String(prId));
                tableContent += `<tr><td>${prNum}</td><td>${status === successFlag ? '成功' : '失败'}</td><td>${message}</td></tr>`;
            }
            html = `<div style="text-align:center;">
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
                            <tr><th>请购单号</th><th>状态</th><th>提示</th></tr>
                            ${tableContent}
                        </table>
                    </div>`;
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
        const { viewPage, submitPage } = appPlatformCommon;

        switch (httpMethod) {
            case 'GET':
                viewPage({ request, response, jobName, getResultHtml });
                break;
            case 'POST':
                submitPage({ request, response, jobName, taskScriptId, taskInputScriptId });
                break;
            default:
                break;
        }
    }

    return {
        onRequest
    }
});
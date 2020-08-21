/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 此程序主要用于计划单的行合并功能
 */
define([
    'N/ui/serverWidget',
    'N/redirect',
    'N/runtime',
    'N/task',
    'N/record',
    'N/url',
    'N/search'
], function (
    serverWidgetMod,
    redirectMod,
    runtimeMod,
    taskMod,
    recordMod,
    urlMod,
    searchMod,
) {

    function viewPage(request, response) {
        const { parameters: { mergetaskid: mergeTaskId, ispopup: isPopup, gettaskstatus: getTaskStatus } } = request;
        const csPath = '../cs/cs_pl_to_pr_merge_line';
        const taskIdFieldId = 'custpage_task_id';
        const statusFieldId = 'custpage_task_status';
        const progressBarFieldId = 'custpage_progress_bar';
        const taskSearchUrlFieldId = 'custpage_task_search_url';
        const taskRecType = 'customrecord_pl_platform_task_record';
        const taskDetailFieldId = 'custrecord_pl_platform_task_detail';
        const taskRecIdFieldId = 'custrecord_pl_platform_task_id';
        const mrpRecType = 'customrecordmrp_planned_order';
        const successFlag = 'success';
        const failFlag = 'fail';

        if (getTaskStatus === 'T') {//查询任务状态
            let status = '';
            let percentCompleted = 0;
            let html = '';
            let taskCurrentStatus = null;
            try {
                const taskStatus = taskMod.checkStatus({
                    taskId: mergeTaskId
                });

                ({ status: taskCurrentStatus } = taskStatus);

                if (taskCurrentStatus === taskMod.TaskStatus.PENDING) {
                    percentCompleted = 0;
                } else if (taskCurrentStatus === taskMod.TaskStatus.PROCESSING) {
                    switch (taskStatus.stage) {
                        case taskMod.MapReduceStage.GET_INPUT:
                            percentCompleted = 0;
                            break;
                        case taskMod.MapReduceStage.MAP:
                            percentCompleted = taskStatus.getPercentageCompleted();
                            break;
                        case taskMod.MapReduceStage.SHUFFLE:
                            percentCompleted = 100;
                            break;
                        case taskMod.MapReduceStage.SUMMARIZE:
                            percentCompleted = 100;
                            break;
                        default:
                            percentCompleted = 100;
                            break;
                    }
                } else if (taskCurrentStatus === taskMod.TaskStatus.COMPLETE || taskCurrentStatus === taskMod.TaskStatus.FAILED) {
                    percentCompleted = 100;
                    let summaryObj = null;
                    const planIdNumMap = new Map();

                    //查询处理结果信息
                    searchMod.create({
                        type: taskRecType,
                        filters: [
                            {
                                name: taskRecIdFieldId,
                                operator: 'is',
                                values: mergeTaskId
                            }
                        ],
                        columns: [
                            {
                                name: taskDetailFieldId
                            }
                        ]
                    }).run().each(result => {
                        const summary = result.getValue({ name: taskDetailFieldId });
                        if (summary) {
                            summaryObj = JSON.parse(summary);
                            for (const { mergeRecId, planIds } of summaryObj) {
                                planIds.forEach(planId => planIdNumMap.set(String(planId), ''));
                                if (mergeRecId) {
                                    planIdNumMap.set(String(mergeRecId), '');
                                }
                            }
                        }
                        return false;
                    });

                    //搜索ID对应的单号
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
                            let { id } = result;
                            let num = result.getValue({ name: 'name' });
                            planIdNumMap.set(String(id), num);
                            return true;
                        });
                    }

                    //构建输出消息
                    if (summaryObj) {
                        let tableContent = '';
                        for (const { status, mergeRecId, message, planIds } of summaryObj) {
                            const planNums = planIds.map(planId => planIdNumMap.get(String(planId))).join('<br />');
                            if (status === successFlag) {
                                const mergeRecNum = planIdNumMap.get(String(mergeRecId));
                                tableContent += `<tr><td>${planNums}</td><td>${mergeRecNum}</td><td>成功</td><td></td></tr>`;
                            } else if (status === failFlag) {
                                tableContent += `<tr><td>${planNums}</td><td></td><td>失败</td><td>${message}</td></tr>`;
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
                                <h1 style="font-size:20px;">合并状态：${taskCurrentStatus}</h1>
                                <table id="custpage_result_summary" border="1" cellpadding="10">
                                <tr><th>待合并单号</th><th>合并单号</th><th>状态</th><th>提示</th></tr>
                                ${tableContent}
                                </table>
                            </div>
                        `;
                    }
                }

                status = successFlag;
            } catch (ex) {
                log.error({
                    title: `查询任务${mergeTaskId}状态失败`,
                    details: ex
                });
                status = failFlag;
                html = ex.message;
            }

            response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });
            response.write({
                output: JSON.stringify({ status, percentCompleted, html, taskCurrentStatus })
            });

            return true;
        } else {//否则输出查询页面
            if (!mergeTaskId) {
                response.write({
                    output: '没有找到对应的任务'
                });
                return false;
            }

            try {
                let rspPageHTML = `
                <style>
                    .uir-page-title-firstline {
                        text-align: center;
                    }
                    @keyframes progress-bar-stripes {
                        from  { background-position: 40px 0; }
                        to    { background-position: 0 0; }
                    }
                    .progress-bar.active, .progress.active .progress-bar {
                        animation: progress-bar-stripes 2s linear infinite;
                    }
                    .progress-bar-striped, .progress-striped .progress-bar {
                        background-image: linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent);
                        background-size: 40px 40px;
                    }
                    .progress-bar {
                        float: left;
                        width: 0;
                        height: 100%;
                        font-size: 12px;
                        line-height: 20px;
                        color: #fff;
                        text-align: center;
                        background-color: #337ab7;
                        box-shadow: inset 0 -1px 0 rgba(0,0,0,.15);
                        transition: width .6s ease;
                        box-sizing: border-box;
                    }
                    .progress {
                        height: 20px;
                        margin-bottom: 20px;
                        overflow: hidden;
                        background-color: #f5f5f5;
                        border-radius: 4px;
                        box-shadow: inset 0 1px 2px rgba(0,0,0,.1);
                    }
                </style>
                <div class="progress">
                    <div id="${progressBarFieldId}" class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;min-width: 2em;">
                        <span class="sr-only">0%</span>
                    </div>
                </div>
                `;

                //创建表单
                const form = serverWidgetMod.createForm({
                    title: '查询合并状态',
                    hideNavBar: isPopup === 'T',
                });
                form.clientScriptModulePath = csPath;

                //创建进度条字段
                form.addField({
                    id: statusFieldId,
                    label: '查询任务状态',
                    type: serverWidgetMod.FieldType.INLINEHTML,
                }).defaultValue = rspPageHTML;

                //创建隐藏字段，以存储任务ID
                form.addField({
                    id: taskIdFieldId,
                    label: '任务ID',
                    type: serverWidgetMod.FieldType.TEXT,
                }).updateDisplayType({
                    displayType: serverWidgetMod.FieldDisplayType.HIDDEN
                }).defaultValue = mergeTaskId;

                //设置刷新URL
                const currentScript = runtimeMod.getCurrentScript();
                const taskSearchUrl = urlMod.resolveScript({
                    scriptId: currentScript.id,
                    deploymentId: currentScript.deploymentId
                });
                form.addField({
                    id: taskSearchUrlFieldId,
                    label: '任务状态刷新URL',
                    type: serverWidgetMod.FieldType.TEXT,
                }).updateDisplayType({
                    displayType: serverWidgetMod.FieldDisplayType.HIDDEN
                }).defaultValue = taskSearchUrl;

                //输出页面
                response.writePage({
                    pageObject: form
                });
                return true;
            } catch (ex) {
                log.error({
                    title: `为任务${mergeTaskId}创建刷新页面失败`,
                    details: ex
                });
                response.write({
                    output: `任务刷新失败, 错误提示：${ex.message}`
                });
                return false;
            }

            return true;
        }
    }

    function submitPage(request, response) {
        const { parameters: { mergeEntries, ispopup: isPopup } } = request;
        const mergeTaskScriptId = 'customscript_mr_pl_to_pr_merge_line';
        const mergeTaskInputId = 'custscript_q_merge_source_data';
        const taskDetailRecordType = 'customrecord_pl_platform_task_record';
        const taskIdRecordFieldId = 'custrecord_pl_platform_task_id';

        try {
            const mergeEntriesObj = JSON.parse(mergeEntries);
            if (!mergeEntriesObj.length) {
                throw new Error('没有可合并的条目');
            }

            //先创建任务记录，以便于后续查询
            const currentUser = runtimeMod.getCurrentUser();
            const nowTimeStamp = `${currentUser.id}-${Date.now()}`;
            const taskDetailRec = recordMod.create({
                type: taskDetailRecordType
            });
            taskDetailRec.setValue({
                fieldId: 'name',
                value: nowTimeStamp
            });
            const taskRecId = taskDetailRec.save({
                ignoreMandatoryFields: true
            });

            //创建并提交任务
            const taskParams = {
                lines: mergeEntriesObj,
                taskRecId: taskRecId
            };
            const mergeTask = taskMod.create({
                taskType: taskMod.TaskType.MAP_REDUCE,
                scriptId: mergeTaskScriptId,
                params: {
                    [mergeTaskInputId]: JSON.stringify(taskParams)
                }
            });
            const mergeTaskId = mergeTask.submit();

            //将任务ID写入到任务记录上面
            recordMod.submitFields({
                type: taskDetailRecordType,
                id: taskRecId,
                values: {
                    [taskIdRecordFieldId]: mergeTaskId
                },
                options: {
                    ignoreMandatoryFields: true
                }
            });

            //跳转到状态查看页面
            const currentScript = runtimeMod.getCurrentScript();
            const { id: scriptId, deploymentId } = currentScript;
            redirectMod.toSuitelet({
                scriptId,
                deploymentId,
                parameters: {
                    mergetaskid: mergeTaskId,
                    ispopup: isPopup
                }
            });
            return true;
        } catch (ex) {
            log.error({
                title: `合并计划单失败`,
                details: { ex, mergeEntries }
            });
            const errorMsg = `<p style="color:red;font-size:14px;text-align:center;">合并失败，请您稍后再试。错误提示：${ex.message}`;
            response.write({
                output: errorMsg
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
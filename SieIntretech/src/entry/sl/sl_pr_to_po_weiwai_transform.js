/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 此程序主要用于请购单下推委外工单和采购单
 */
define([
    'N/search',
    'N/ui/serverWidget',
    'N/runtime',
    'N/task',
    'N/url',
    'N/record',
    'N/redirect',
], function (
    searchMod,
    serverWidgetMod,
    runtimeMod,
    taskMod,
    urlMod,
    recordMod,
    redirectMod,
) {

    const jobName = '委外下推';
    const taskScriptId = 'customscript_mr_pr_to_po_split_merge_ww';
    const taskInputScriptId = 'custscript_q_split_merge_weiwai';
    const csPath = '../cs/cs_pr_to_po_merge_transform';

    function viewPage({ request, response, jobName = '', } = {}) {
        const { parameters: { taskid: taskId, ispopup: isPopup, gettaskstatus: getTaskStatus } } = request;
        const taskIdFieldId = 'custpage_task_id';
        const statusFieldId = 'custpage_task_status';
        const progressBarFieldId = 'custpage_progress_bar';
        const taskSearchUrlFieldId = 'custpage_task_search_url';
        const taskRecType = 'customrecord_pl_platform_task_record';
        const taskDetailFieldId = 'custrecord_pl_platform_task_detail';
        const taskRecIdFieldId = 'custrecord_pl_platform_task_id';
        const secondTaskDetailFieldId = 'custrecord_pl_platform_task_detail_p2';
        const secondRecIdFieldId = 'custrecord_pl_platform_task_id_p2';
        const prRecType = 'customrecord_purchase_application';
        const successFlag = 'success';
        const failFlag = 'fail';

        if (getTaskStatus === 'T') {//查询任务状态
            let status = '';
            let percentCompleted = 0;
            let html = '';
            let taskCurrentStatus = null;

            try {
                const taskStatus = taskMod.checkStatus({
                    taskId: taskId
                });
                ({ status: taskCurrentStatus } = taskStatus);

                //判断状态
                if (taskCurrentStatus === taskMod.TaskStatus.PENDING) {
                    percentCompleted = 0;
                } else if (taskCurrentStatus === taskMod.TaskStatus.PROCESSING) {
                    switch (taskStatus.stage) {
                        case taskMod.MapReduceStage.GET_INPUT:
                            percentCompleted = 0;
                            break;
                        case taskMod.MapReduceStage.MAP:
                            percentCompleted = taskStatus.getPercentageCompleted() / 4;
                            break;
                        case taskMod.MapReduceStage.SHUFFLE:
                            percentCompleted = 25;
                            break;
                        case taskMod.MapReduceStage.REDUCE:
                            percentCompleted = taskStatus.getPercentageCompleted() / 4 + 25;
                            break;
                        case taskMod.MapReduceStage.SUMMARIZE:
                            percentCompleted = 50;
                            break;
                        default:
                            percentCompleted = 50;
                            break;
                    }
                } else if (taskCurrentStatus === taskMod.TaskStatus.COMPLETE || taskCurrentStatus === taskMod.TaskStatus.FAILED) {
                    let splitMergeTaskDetail = null;
                    let secondTaskId = null;
                    let secondTaskDetail = null;

                    //搜索任务详情
                    searchMod.create({
                        type: taskRecType,
                        filters: [
                            {
                                name: taskRecIdFieldId,
                                operator: 'is',
                                values: taskId
                            }
                        ],
                        columns: [
                            {
                                name: taskDetailFieldId
                            },
                            {
                                name: secondRecIdFieldId
                            },
                            {
                                name: secondTaskDetailFieldId
                            },
                        ]
                    }).run().each(result => {
                        splitMergeTaskDetail = result.getValue({
                            name: taskDetailFieldId
                        });
                        secondTaskId = result.getValue({
                            name: secondRecIdFieldId
                        });
                        secondTaskDetail = result.getValue({
                            name: secondTaskDetailFieldId
                        });
                        return false;
                    });

                    //检测是否有提交采购单生成的任务
                    if (secondTaskId) {//如果有采购单的任务提交
                        percentCompleted = 50;
                        const secondTaskStatusObj = taskMod.checkStatus({
                            taskId: secondTaskId
                        });
                        const { status: secondTaskStatus } = secondTaskStatusObj;
                        taskCurrentStatus = secondTaskStatus;
                        if (secondTaskStatus === taskMod.TaskStatus.PENDING) {
                            percentCompleted = 50;
                        } else if (secondTaskStatus === taskMod.TaskStatus.PROCESSING) {
                            switch (taskStatus.stage) {
                                case taskMod.MapReduceStage.GET_INPUT:
                                    percentCompleted = 50;
                                    break;
                                case taskMod.MapReduceStage.MAP:
                                    percentCompleted = taskStatus.getPercentageCompleted() / 4 + 50;
                                    break;
                                case taskMod.MapReduceStage.SHUFFLE:
                                    percentCompleted = 75;
                                    break;
                                case taskMod.MapReduceStage.REDUCE:
                                    percentCompleted = taskStatus.getPercentageCompleted() / 4 + 75;
                                    break;
                                case taskMod.MapReduceStage.SUMMARIZE:
                                    percentCompleted = 100;
                                    break;
                                default:
                                    percentCompleted = 100;
                                    break;
                            }
                        } else if (secondTaskStatus === taskMod.TaskStatus.COMPLETE || secondTaskStatus === taskMod.TaskStatus.FAILED) {
                            percentCompleted = 100;
                            if (secondTaskDetail) {
                                const prIdNumMap = new Map();
                                const woIdNumMap = new Map();
                                const poIdNumMap = new Map();
                                const subsidiaryIdNameMap = new Map();
                                const vendorIdNameMap = new Map();
                                const summaryObj = JSON.parse(secondTaskDetail);

                                for (const { lines, subsidiaryId, vendorId, poId, } of summaryObj) {
                                    subsidiaryIdNameMap.set(String(subsidiaryId), subsidiaryId);
                                    vendorIdNameMap.set(String(vendorId), vendorId);
                                    if (poId) {
                                        poIdNumMap.set(String(poId), { poNum: poId, poStatus: '' });
                                    }
                                    for (const { prId, woId } of lines) {
                                        prIdNumMap.set(String(prId), prId);
                                        if(woId){
                                            woIdNumMap.set(String(woId), woId);
                                        }
                                    }
                                }

                                //搜索ID对应的单号
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
                                if (woIdNumMap.size) {
                                    searchMod.create({
                                        type: 'workorder',
                                        filters: [
                                            {
                                                name: 'internalid',
                                                operator: 'anyof',
                                                values: [...woIdNumMap.keys()]
                                            },
                                            {
                                                name: 'mainline',
                                                operator: 'is',
                                                values: 'T'
                                            },
                                        ],
                                        columns: [
                                            {
                                                name: 'tranid'
                                            }
                                        ]
                                    }).run().each(result => {
                                        const { id } = result;
                                        const num = result.getValue({ name: 'tranid' });
                                        woIdNumMap.set(String(id), num);
                                        return true;
                                    });
                                }
                                if (poIdNumMap.size) {
                                    searchMod.create({
                                        type: 'purchaseorder',
                                        filters: [
                                            {
                                                name: 'internalid',
                                                operator: 'anyof',
                                                values: [...poIdNumMap.keys()]
                                            },
                                            {
                                                name: 'mainline',
                                                operator: 'is',
                                                values: 'T'
                                            },
                                        ],
                                        columns: [
                                            {
                                                name: 'tranid'
                                            },
                                            {
                                                name: 'status'
                                            },
                                        ]
                                    }).run().each(result => {
                                        const poId = String(result.id);
                                        const poNum = result.getValue({ name: 'tranid' });
                                        const poStatus = result.getText({ name: 'status' });
                                        const poInfo = poIdNumMap.get(poId);
                                        poInfo.poNum = poNum;
                                        poInfo.poStatus = poStatus;
                                        return true;
                                    });
                                }
                                if (subsidiaryIdNameMap.size) {
                                    searchMod.create({
                                        type: 'subsidiary',
                                        filters: [
                                            {
                                                name: 'internalid',
                                                operator: 'anyof',
                                                values: [...subsidiaryIdNameMap.keys()]
                                            },
                                        ],
                                        columns: [
                                            {
                                                name: 'name'
                                            },
                                        ]
                                    }).run().each(result => {
                                        const { id } = result;
                                        const name = result.getValue({ name: 'name' });
                                        subsidiaryIdNameMap.set(String(id), name);
                                        return true;
                                    });
                                }
                                if (vendorIdNameMap.size) {
                                    searchMod.create({
                                        type: 'vendor',
                                        filters: [
                                            {
                                                name: 'internalid',
                                                operator: 'anyof',
                                                values: [...vendorIdNameMap.keys()]
                                            },
                                        ],
                                        columns: [
                                            {
                                                name: 'companyname'
                                            },
                                        ]
                                    }).run().each(result => {
                                        const { id } = result;
                                        const name = result.getValue({ name: 'companyname' });
                                        vendorIdNameMap.set(String(id), name);
                                        return true;
                                    });
                                }

                                //构建输出消息
                                let tableContent = '';
                                const lineSeparator = '<br />';
                                for (const { lines, subsidiaryId, vendorId, poId, } of summaryObj) {
                                    let poLink = '';
                                    let poStatus = '';
                                    let prNums = [];
                                    let woLinks = [];
                                    let messages = new Set();
                                    let statusText = '失败';
                                    const subsidiaryName = subsidiaryIdNameMap.get(String(subsidiaryId)) || '';
                                    const vendorName = vendorIdNameMap.get(String(vendorId)) || '';

                                    if (poId) {
                                        const poInfo = poIdNumMap.get(String(poId)) || {};
                                        const { poNum = '' } = poInfo;
                                        ({ poStatus = '' } = poInfo);
                                        poLink = `<a href="/app/accounting/transactions/purchord.nl?id=${poId}&e=T" target="_blank">${poNum}</a>`;
                                        statusText = '部分成功';
                                    }

                                    for (const { prId, transformQty, message, woId, } of lines) {
                                        prNums.push(prIdNumMap.get(String(prId)) + ':' + transformQty);
                                        messages.add(message);
                                        if(woId){
                                            const woNum = woIdNumMap.get(String(woId));
                                            const woLink = `<a href="/app/accounting/transactions/workord.nl?id=${woId}" target="_blank">${woNum}</a>`
                                            woLinks.push(woLink);
                                        }
                                    }

                                    if(woLinks.length === prNums.length){
                                        statusText = '成功';
                                    }

                                    prNums = prNums.join(lineSeparator);
                                    woLinks = woLinks.join(lineSeparator);
                                    messages = [...messages].join(lineSeparator);

                                    tableContent += `<tr><td>${subsidiaryName}</td><td>${vendorName}</td><td>${poLink}</td><td>${poStatus}</td><td>${woLinks}</td><td>${prNums}</td><td>${statusText}</td><td>${messages}</td></tr>`;
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
                                                    min-width:200px;R
                                                }
                                                </style>
                                                    <button type="button" id="customRefreshButton">刷新</button>
                                                    <h1 style="font-size:20px;display:inline-block;vertical-align: middle;margin-left: 10px;">${jobName}状态：${taskCurrentStatus}</h1>
                                                    <table id="custpage_result_summary" border="1" cellpadding="10">
                                                    <tr><th>子公司</th><th>供应商</th><th>委外采购订单</th><th>PO状态</th><th>委外工单</th><th>请购单号:下推数量</th><th>创建状态</th><th>提示信息</th></tr>
                                                    ${tableContent}
                                                </table>
                                            </div>`;
                            }
                        }
                    } else {//如果没有提交采购单生成任务
                        percentCompleted = 100;
                        if (splitMergeTaskDetail) {
                            splitMergeTaskDetail = JSON.parse(splitMergeTaskDetail);
                            const prIdNumMap = new Map();
                            const subsidiaryIdNameMap = new Map();
                            const vendorIdNameMap = new Map();
                            Reflect.ownKeys(splitMergeTaskDetail).forEach(groupKey => {
                                const [subsidiaryId, vendorId] = groupKey.split('-');
                                const { [groupKey]: { list } } = splitMergeTaskDetail;
                                if (subsidiaryId) {
                                    subsidiaryIdNameMap.set(String(subsidiaryId), subsidiaryId);
                                }
                                if (vendorId) {
                                    vendorIdNameMap.set(String(vendorId), vendorId);
                                }
                                list.forEach(({ prId }) => {
                                    if (prId) {
                                        prIdNumMap.set(String(prId), prId);
                                    }
                                });
                            });

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
                            if (subsidiaryIdNameMap.size) {
                                searchMod.create({
                                    type: 'subsidiary',
                                    filters: [
                                        {
                                            name: 'internalid',
                                            operator: 'anyof',
                                            values: [...subsidiaryIdNameMap.keys()]
                                        },
                                    ],
                                    columns: [
                                        {
                                            name: 'name'
                                        },
                                    ]
                                }).run().each(result => {
                                    const { id } = result;
                                    const name = result.getValue({ name: 'name' });
                                    subsidiaryIdNameMap.set(String(id), name);
                                    return true;
                                });
                            }
                            if (vendorIdNameMap.size) {
                                searchMod.create({
                                    type: 'vendor',
                                    filters: [
                                        {
                                            name: 'internalid',
                                            operator: 'anyof',
                                            values: [...vendorIdNameMap.keys()]
                                        },
                                    ],
                                    columns: [
                                        {
                                            name: 'companyname'
                                        },
                                    ]
                                }).run().each(result => {
                                    const { id } = result;
                                    const name = result.getValue({ name: 'companyname' });
                                    vendorIdNameMap.set(String(id), name);
                                    return true;
                                });
                            }

                            //构建输出消息
                            let tableContent = '';
                            const lineSeparator = '<br />';
                            Reflect.ownKeys(splitMergeTaskDetail).forEach(groupKey => {
                                const [subsidiaryId, vendorId] = groupKey.split('-');
                                const { [groupKey]: { list, messages } } = splitMergeTaskDetail;
                                let prInfo = [];
                                const subsidiaryName = subsidiaryIdNameMap.get(String(subsidiaryId)) || '';
                                const vendorName = vendorIdNameMap.get(String(vendorId)) || '';
                                list.forEach(({ prId, transformQty }) => {
                                    if (prId) {
                                        prInfo.push(`${prIdNumMap.get(String(prId)) || ''}:${transformQty}`);
                                    }
                                });

                                tableContent += `<tr><td>${subsidiaryName}</td><td>${vendorName}</td><td>${prInfo.join(lineSeparator)}</td><td>${messages.join(lineSeparator)}</td></tr>`;
                            });

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
                                                min-width:200px;R
                                            }
                                            </style>
                                                <button type="button" id="customRefreshButton">刷新</button>
                                                <h1 style="font-size:20px;display:inline-block;vertical-align: middle;margin-left: 10px;">${jobName}状态：分拆合并出现错误</h1>
                                                <table id="custpage_result_summary" border="1" cellpadding="10">
                                                <tr><th>子公司</th><th>供应商</th><th>请购单号:数量</th><th>错误信息</></tr>
                                                ${tableContent}
                                            </table>
                                        </div>`;
                        }
                    }
                }

                status = successFlag;
            } catch (ex) {
                log.error({
                    title: `查询任务状态失败`,
                    details: {
                        taskId,
                        ex,
                    }
                });
                status = failFlag;
                html = ex.message;
            }

            if (percentCompleted === 100) {
                if (taskCurrentStatus === 'COMPLETE') {
                    taskCurrentStatus = '完成';
                } else if (taskCurrentStatus === 'FAILED') {
                    taskCurrentStatus = '失败';
                } else {
                    taskCurrentStatus = '';
                }
            } else {
                taskCurrentStatus = '进行中';
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
            if (!taskId) {
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
                <div id="custpage_preview_container"></div>
                `;

                //创建表单
                const form = serverWidgetMod.createForm({
                    title: `查询${jobName}状态`,
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
                }).defaultValue = taskId;

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
                    title: `为任务${taskId}创建刷新页面失败`,
                    details: ex
                });
                response.write({
                    output: `任务刷新失败, 错误提示：${ex.message}`
                });
                return false;
            }
        }
    }

    function submitPage({ request, response, jobName = '', taskScriptId, taskInputScriptId } = {}) {
        const { parameters: { dataEntries, ispopup: isPopup, subsidiaryPeriods } } = request;
        const taskDetailRecordType = 'customrecord_pl_platform_task_record';
        const taskIdRecordFieldId = 'custrecord_pl_platform_task_id';

        try {
            const dataEntriesObj = JSON.parse(dataEntries);
            const subsidiaryPeriodsObj = JSON.parse(subsidiaryPeriods);

            //先创建任务记录，以便于后续查询
            const currentUser = runtimeMod.getCurrentUser();
            const nowTimeStamp = `${currentUser.name}-${currentUser.id}-${Date.now()}`;
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
                lines: dataEntriesObj,
                periods: subsidiaryPeriodsObj,
                taskRecId,
            };
            const taskObj = taskMod.create({
                taskType: taskMod.TaskType.MAP_REDUCE,
                scriptId: taskScriptId,
                params: {
                    [taskInputScriptId]: JSON.stringify(taskParams)
                }
            });
            const taskId = taskObj.submit();

            //将任务ID写入到任务记录上面
            recordMod.submitFields({
                type: taskDetailRecordType,
                id: taskRecId,
                values: {
                    [taskIdRecordFieldId]: taskId
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
                    taskid: taskId,
                    ispopup: isPopup
                }
            });
            return true;
        } catch (ex) {
            log.error({
                title: `${jobName}失败`,
                details: {
                    ex,
                    dataEntries,
                    subsidiaryPeriods,
                }
            });
            const errorMsg = `<p style="color:red;font-size:14px;text-align:center;">${jobName}失败，请您稍后再试。错误提示：${ex.message}`;
            response.write({
                output: errorMsg
            });
            return false;
        }
    }

    function onRequest(context) {
        const {
            request,
            response,
            request: {
                method: httpMethod
            }
        } = context;
        // const { submitPage, viewPage } = appPlatformCommon;

        switch (httpMethod) {
            case 'GET':
                viewPage({ request, response, jobName });
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
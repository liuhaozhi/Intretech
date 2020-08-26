/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 查看状态的页面
 */
define([
    'N/ui/serverWidget',
    'N/task'
], function (
    serverWidget,
    task
) {

    function viewPage(request, response) {
        var parameters = request.parameters,
            taskId = parameters.mrtaskid,
            taskName = parameters.taskname || '其他',
            taskCreator = parameters.taskcreator || '未知',
            taskCreateTime = parameters.taskcreatetime || '未知',
            clientScript = '../cs/cs_get_task_status.js',
            percentCompleted;
            log.debug('parameters',parameters);
            var   batchid= parameters.batchid||'批次';


        try {
            //创建列表
            var list = serverWidget.createList({
                title: '查看任务状态'
            });
            list.style = serverWidget.ListStyle.NORMAL;
            list.clientScriptModulePath = clientScript;

            list.addButton({
                id: 'custpage_refresh',
                label: '刷新',
                functionName: 'refreshPage'
            });

            list.addColumn({
                id: 'custpage_task_name',
                type: serverWidget.FieldType.TEXT,
                label: '任务名称'
            });

            list.addColumn({
                id: 'custpage_task_status',
                type: serverWidget.FieldType.TEXT,
                label: '任务状态'
            });

            list.addColumn({
                id: 'custpage_task_stage',
                type: serverWidget.FieldType.TEXT,
                label: '任务阶段'
            });

            list.addColumn({
                id: 'custpage_task_percent_completed',
                type: serverWidget.FieldType.TEXT,
                label: '当前阶段完成百分比'
            });

            list.addColumn({
                id: 'custpage_task_creator',
                type: serverWidget.FieldType.TEXT,
                label: '创建人'
            });

            list.addColumn({
                id: 'custpage_task_created_time',
                type: serverWidget.FieldType.TEXT,
                label: '创建时间'
            });

            list.addColumn({
                id: 'custpage_task_batchid',
                type: serverWidget.FieldType.TEXT,
                label: '创建批号'
            });

            // list.addEditColumn({
            //     column : 'internalid',
            //     showHrefCol: false,
            //     showView : true,
            //     link: '/app/common/entity/employee.nl',
            //     linkParam: 'internalid',
            //     linkParamName: 'id',
            // });

            if(taskId){
                var taskStatus = task.checkStatus({
                    taskId : taskId
                });
                
                percentCompleted = taskStatus.getPercentageCompleted() || 0;
                percentCompleted += '%';

                var rowData = {
                    'custpage_task_name' : taskName,
                    'custpage_task_status' : taskStatus.status,
                    'custpage_task_stage' : taskStatus.stage,
                    'custpage_task_percent_completed' : percentCompleted,
                    'custpage_task_creator' : taskCreator,
                    'custpage_task_created_time' : taskCreateTime,
                    'custpage_task_batchid':batchid
                };

                list.addRow({
                    row : rowData
                });
            }

            response.writePage({
                pageObject: list
            });
        } catch (ex) {
            log.error({
                title: 'search task status error',
                details: ex
            });
            response.write({
                output: '查询任务状态失败，错误提示：' + ex.message
            });
        }
    }

    function onRequest(context) {
        var request = context.request,
            response = context.response;

        if (request.method === 'GET') {
            viewPage(request, response);
        }
    }

    return {
        onRequest: onRequest
    }
});
/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 *@author yuming Hu
 *@description 工单下推自工单
 */
define([
    'N/ui/serverWidget',
    'N/search',
    'N/redirect',
    'N/format',
    'N/runtime',
    'N/task',
    '../../app/app_ui_wip_component_server.js'
], function (
    serverWidget,
    search,
    redirect,
    format,
    runtime,
    task,
    uiComponent) {

    var sublistId = 'custpage_sublist';
    var savedSearch = '';
    var sublistCheckedId = 'custpage_checked';
    var slStatusScriptId = 'customscript_sl_get_task_status';
    var slStatusDeployId = 'customdeploy_sl_get_task_status';
    var mrScriptId = 'customscript_mr_wip_wo_create';

    function searchObjGetter(addFilters) {
        var searchObj;

        var columns = [{
                name: 'tranid' //工单号
            },
            {
                name: 'custbody_wip_so' //销售订单号
            },
            {
                name: 'custbody_wip_so_line_information' //计划号
            },
            {
                name: 'item' //货品
            },
            {
                name: 'custbody_wip_itme_name' //货品名称
            },
            {
                name: 'custbody_wip_specifications_models' //产品规格
            },
            {
                name: 'quantity' //数量
            },
            {
                name: 'unit' //单位
            },
            {
                name: 'trandate' //日期
            },
            {
                name: 'statusref' //状态
            },
            {
                name: 'custbody_wip_executing_state' //执行状态
            },
            {
                name: 'firmed' //已确认
            },
            {
                name: 'custbody_wip_manufacturing_type' //生产类型
            },
            {
                name: 'custbody_wip_planned_commencement_date' //计划开工时间
            },
            {
                name: 'custbody_wip_planned_completion_date' //计划完工时间
            },
            {
                name: 'custbody_wip_so_abstract' //销售订单摘要
            },
            {
                name: 'custbody_wip_so_memo' //销售订单备注
            },
            {
                name: 'custbody_wip_software_version' //软件版本
            },
            {
                name: 'internalid' //是否保税
            },
            {
                name: 'subsidiary'
            },
            {
                name: 'custbody_wip_so_line_if_under_bond'
            }
        ];

        var filters = [
            ["mainline", "is", "T"],
            "AND",
            ["type", "anyof", "WorkOrd"]
        ];

        if (addFilters.length) {
            filters = filters.concat(addFilters);
        }

        var sublistSearchCriteria = {
            type: 'workorder',
            filters: filters,
            columns: columns
        };

        searchObj = search.create(sublistSearchCriteria);

        return searchObj;
    }

    function viewPage(request, response) {
        var parameters = request.parameters;
        var addFilters = [];
        var refreshParams = {};
        var searchObj;
        var clientScript = '../entry/cs/cs_wip_wofw_platform';
        var sublistTab = 'custpage_sublist_tab';
        //var otherInfo = {};
        var searchBodyFields = [{
                id: 'custpage_customer',
                label: '客户',
                type: 'SELECT',
                source: 'customer',
                filter: 'mainname',
                operator: 'anyof',
                layout: 'OUTSIDEABOVE'
            },
            {
                id: 'custpage_item', //
                label: '货品',
                type: 'SELECT',
                source: 'item',
                filter: 'mainname',
                operator: 'anyof',
                layout: 'OUTSIDEABOVE'
            },
            {
                id: 'custpage_workorder', //custpage_workorder
                label: '工作单',
                type: 'SELECT',
                source: 'workorder',
                filter: 'mainname',
                operator: 'anyof',
                layout: 'OUTSIDEABOVE'
            },
            {
                id: 'custpage_estimate',
                label: '销售订单',
                type: 'SELECT',
                source: 'estimate',
                filter: 'mainname',
                operator: 'anyof',
                layout: 'OUTSIDEBELOW'
            },
            {
                id: 'custpage_estimateline',
                label: '计划号',
                type: 'TEXT',
                //source: 'estimate',
                filter: 'mainname',
                operator: 'anyof',
                layout: 'OUTSIDEBELOW'
            },
            {
                id: 'custpage_start_date',
                label: '自',
                type: 'DATE',
                filter: 'trandate',
                operator: 'onorafter',
                layout: 'OUTSIDEBELOW'
            },
            {
                id: 'custpage_end_date',
                label: '至',
                type: 'DATE',
                filter: 'trandate',
                operator: 'onorbefore',
                layout: 'OUTSIDEBELOW'
            }
        ];
        var sublistColumnConfig = {
            'custpage_entity': { //custpage_paged_type
                type: 'SELECT',
                label: '客户',
                source: 'customer',
                displayType: 'HIDDEN'
                //useText: true
            },
            'custpage_tranid': {
                type: 'TEXT',
                label: '工单号',
                displayType: 'INLINE'
            },
            'custpage_wip_so': {
                type: 'SELECT',
                label: '销售订单号',
                source: 'estimate',
                displayType: 'INLINE'
            },
            'custpage_wip_so_line_information': {
                type: 'TEXT',
                label: '计划号',
                displayType: 'INLINE'
            },
            'custpage_item': {
                type: 'SELECT',
                label: '货品',
                displayType: 'INLINE',
                source: 'item'
            },
            'custpage_wip_itme_name': {
                type: 'TEXT',
                label: '货品名称',
                displayType: 'INLINE'
            },
            'custpage_wip_specifications_models': {
                type: 'TEXT',
                label: '规格型号',
                displayType: 'INLINE'
            },
            'custpage_unit': {
                type: 'TEXT',
                label: '单位',
                displayType: 'INLINE'
            },
            'custpage_quantity': {
                type: 'FLOAT',
                label: '数量',
                displayType: 'INLINE'
            },
            'custpage_trandate': {
                type: 'DATE',
                label: '日期',
                displayType: 'INLINE'
            },
            'custpage_statusref': {
                type: 'TEXT',
                label: '状态',
                displayType: 'INLINE',
                TextFlag: true
            },
            'custpage_wip_executing_state': {
                type: 'SELECT',
                label: '执行状态',
                displayType: 'INLINE',
                source: 'customlist_wip_executing_state'
            },
            'custpage_firmed': {
                type: 'TEXT',
                label: '已确认',
                displayType: 'INLINE'
            },
            'custpage_wip_manufacturing_type': {
                type: 'SELECT',
                label: '生产类型',
                displayType: 'INLINE',
                source: 'customlist_wip_manufacturing_type'
            },
            'custpage_wip_planned_commencement_date': {
                type: 'DATE',
                label: '计划开工日期',
                displayType: 'INLINE'
            },
            'custpage_wip_planned_completion_date': {
                type: 'DATE',
                label: '计划完工日期',
                displayType: 'INLINE'
            },
            'custpage_wip_planned_completion_date': {
                type: 'DATE',
                label: '计划完工日期',
                displayType: 'INLINE'
            },
            'custpage_wip_so_abstract': {
                type: 'TEXT',
                label: '销售订单摘要',
                displayType: 'INLINE'
            },
            'custpage_wip_so_memo': {
                type: 'TEXT',
                label: '销售订单备注',
                displayType: 'INLINE'
            },
            'custpage_wip_software_version': {
                type: 'TEXT',
                label: '软件版本',
                displayType: 'INLINE'
            },
            'custpage_internalid': {
                type: 'SELECT',
                label: '单据ID',
                source: 'transaction',
                displayType: 'HIDDEN'
            },
            'custpage_subsidiary': {
                type: 'SELECT',
                label: '单据ID',
                source: 'subsidiary',
                displayType: 'HIDDEN'
            },
            'custpage_wip_so_line_if_under_bond': {
                type: 'SELECT',
                label: '是否保税',
                displayType: 'INLINE',
                source: 'customlist_if_under_bond'
            },
        };

        try {
            //加载搜索
            if (savedSearch) {
                searchObj = search.load({
                    id: savedSearch
                });
            } else {
                // if (parameters.custpage_subsidiary) {
                //     addFilters = addFilters.concat(["AND",
                //         ["subsidiary", "anyof"].concat(parameters.custpage_subsidiary)
                //     ]);
                // }

                if (parameters.custpage_customer) {
                    addFilters = addFilters.concat(["AND",
                        ["entity", "anyof"].concat(parameters.custpage_customer)
                    ]);
                }

                if (parameters.custpage_item) {
                    addFilters = addFilters.concat(["AND",
                        ["item", "anyof"].concat(parameters.custpage_item)
                    ]);
                }
                //custpage_workorder
                if (parameters.custpage_workorder) {
                    addFilters = addFilters.concat(["AND",
                        ["internalid", "anyof"].concat(parameters.custpage_workorder)
                    ]);
                }

                if (parameters.custpage_estimate) {
                    addFilters = addFilters.concat(["AND",
                        ["custbody_wip_so", "anyof"].concat(parameters.custpage_estimate)
                    ]);
                }

                searchObj = searchObjGetter(addFilters);
            }

            //创建表单
            var form = uiComponent.createForm({
                title: '工单下推子工单工作台',
                csPath: clientScript,
                submitLabel: '提交',
                buttons: [
                    // {
                    //     id: 'custpage_view_vb',
                    //     label: '查询销售订单',
                    //     functionName: 'viewSo'
                    // },
                    {
                        id: 'custpage_search',
                        label: '查询',
                        functionName: 'searchResults'
                    }
                ]
            });

            //创建搜索字段
            uiComponent.createFields({
                form: form,
                group: {
                    id: 'custpage_group_search_fields',
                    label: '搜索条件'
                },
                fields: searchBodyFields,
                parameters: parameters,
                refreshParams: refreshParams
            });

            //创建显示结果的子列表
            form.addSubtab({
                id: sublistTab,
                label: '搜索结果'
            });

            uiComponent.createPagedSublist({
                form: form,
                container: sublistTab,
                sublist: {
                    id: sublistId,
                    label: '结果列表',
                    type: serverWidget.SublistType.LIST
                },
                sublistColumnConfig: sublistColumnConfig,
                parameters: parameters,
                refreshParams: refreshParams,
                furProcessSublist: true,
                searchObj: searchObj,
                pushFlagFieldId: false
            });

            //设置默认值
            form.updateDefaultValues(refreshParams);

            uiComponent.cachePageInfo({
                form: form,
                refreshParams: refreshParams,
                searchFields: searchBodyFields,
                sublistFields: Object.keys(sublistColumnConfig)
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
                output: '工作台生成失败，错误提示：' + ex.message
            });
        }
    }

    function submitPage(request, response) {
        var lineCount = request.getLineCount({
            group: sublistId
        });
        var bsValue = 1;

        try {
            var selectedEntries = [],
                lineCount = request.getLineCount({
                    group: sublistId
                }),
                isChecked,
                orderId;

            //收集勾选信息
            var currentDate = new Date();

            var currentDateStr = format.format({
                value: currentDate,
                type: format.Type.DATETIME
            });

            for (var i = 0; i < lineCount; i++) {
                isChecked = request.getSublistValue({
                    group: sublistId,
                    name: sublistCheckedId,
                    line: i
                });
                orderId = request.getSublistValue({
                    group: sublistId,
                    name: 'custpage_internalid',
                    line: i
                });

                if ((isChecked === 'T' || isChecked === true) && orderId) {
                    selectedLine = {};

                    var mainPayload = {};

                    var pushFlag = 'Y';

                    var option = {
                        mode: 'LOAD',
                        pushFlag: pushFlag,
                        recId: request.getSublistValue({
                            group: sublistId,
                            name: 'custpage_internalid',
                            line: i
                        }),
                        //dateOption: {},
                        dateOption: {
                            subsidiary: request.getSublistValue({
                                group: sublistId,
                                name: 'custpage_subsidiary',
                                line: i
                            }),
                            isFreeTax: request.getSublistValue({
                                group: sublistId,
                                name: 'custpage_wip_so_line_if_under_bond',
                                line: i
                            }) ? request.getSublistValue({
                                group: sublistId,
                                name: 'custpage_wip_so_line_if_under_bond',
                                line: i
                            }) : bsValue
                        }
                    };

                    selectedEntries.push({
                        mainPayload: mainPayload,
                        option: option
                    });
                }
            }

            log.debug('selectedEntries', selectedEntries);

            //提交数据给后台处理
            if (selectedEntries.length) {
                var currentUser = runtime.getCurrentUser();
                var userName = currentUser.name;


                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: mrScriptId,
                    params: {
                        custscript_dosomething: JSON.stringify(selectedEntries)
                    }
                });
                var taskId = mrTask.submit();

                var nowChinaTime = format.format({
                    type: format.Type.DATETIME,
                    value: new Date(),
                    timezone: format.Timezone.ASIA_HONG_KONG
                });

                redirect.toSuitelet({
                    scriptId: slStatusScriptId,
                    deploymentId: slStatusDeployId,
                    parameters: {
                        mrtaskid: taskId,
                        taskname: '工单下推子工单',
                        taskcreator: userName,
                        taskcreatetime: nowChinaTime
                    }
                });
            } else {
                response.write({
                    output: '无勾选的提交数据'
                });
            }
        } catch (ex) {
            log.error({
                title: 'submit page error',
                details: ex
            });
            response.write({
                output: '页面提交失败，错误提示：' + ex.message
            });
        }
    }

    function onRequest(context) {
        var request = context.request,
            response = context.response;

        if (request.method === 'GET') {
            viewPage(request, response);
        } else {
            submitPage(request, response);
        }
    }

    return {
        onRequest: onRequest
    }
});
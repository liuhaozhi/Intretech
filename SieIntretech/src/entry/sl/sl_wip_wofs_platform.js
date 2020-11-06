/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 *@author yuming Hu
 *@description 销售订单下推工单平台
 */
define([
    'N/ui/serverWidget',
    'N/record',
    'N/search',
    'N/redirect',
    'N/format',
    'N/runtime',
    'N/task',
    '../../app/app_ui_wip_component_server.js'
], function (
    serverWidget,
    record,
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
            name: 'entity', //客户
        },
        {
            name: 'tranid' //销售订单号
        },
        {
            name: 'custcol_plan_number' //计划号
        },
        {
            name: 'custbody_cust_ordertype' //订单类型
        },
        {
            name: 'custbody_wip_customer_order_number' //客户订单号
        },
        {
            name: 'item' //货品
        },
        {
            name: 'custcol_goodsname' //物料名称 custcol_intretech_goods_code
        },
        {
            name: 'custcol_itemtype' //规格
        },
        {
            name: 'unit' //单位
        },
        {
            name: 'quantity' //数量
        },
        {
            name: 'custcol_no_pushdown' //未下推数量
        },
        {
            name: 'custcol_number_pushed_down' //已下推数量
        },
        {
            name: 'shipdate' //预计交货日期
        },
        {
            name: "custbody_document_old"//原K3销售订单号
        },
        {
            name: "custbody_pc_salesman"//业务员
        },
        {
            name: 'memo' //摘要
        },
        {
            name: 'memomain' //备注（主要）
        },
        {
            name: 'custcol_whether_bonded' //是否保税
        },
        {
            name: 'custcol_whether_bonded' //是否保税
        },
        {
            name: 'internalid', //是否保税
            sortdir: "ASC"
        },
        {
            name: 'subsidiary'
        },
        {
            name: 'custcol_line',
            sortdir: "ASC"
        }
        ];

        var filters = [
            ["type", "anyof", "Estimate"],
            "AND",
            ["mainline", "is", "F"],
            "AND",
            ["taxline", "is", "F"],
            "AND",
            ["custbody_cust_ordertype", "anyof", "2", "3", "9", "5"], //"2", "3", "9", "5"
            "AND",
            ["custcol_line_closure", "anyof", "@NONE@"],
            "AND",
            ["custbody_order_status", "anyof", "3"],
            "AND",
            ["custcol_wip_if_push_down_comple", "is", "F"],
            "AND",
            ["custcol_wip_material_properties", "is", "3"]
        ];

        if (addFilters.length) {
            filters = filters.concat(addFilters);
        }

        var sublistSearchCriteria = {
            type: 'estimate',
            filters: filters,
            columns: columns
        };

        log.debug('filters', filters);

        searchObj = search.create(sublistSearchCriteria);

        return searchObj;
    }

    function viewPage(request, response) {
        var currentUser = runtime.getCurrentUser();
        var subsidiary = currentUser.subsidiary;
        var parameters = request.parameters;
        var addFilters = [];
        var refreshParams = {};
        var searchObj;
        var clientScript = '../entry/cs/cs_wip_wofs_platform';
        var sublistTab = 'custpage_sublist_tab';
        //var otherInfo = {};
        var searchBodyFields = [{
            id: 'custpage_subsidiary',
            label: '子公司',
            type: 'SELECT',
            source: 'subsidiary',
            filter: 'subsidiary',
            operator: 'anyof',
            layout: 'OUTSIDEABOVE',
            display: 'DISABLED',
            defaultValue: subsidiary
        },
        {
            id: 'custpage_customer',
            label: '客户',
            type: 'SELECT',
            source: 'customer',
            filter: 'mainname',
            operator: 'anyof',
            layout: 'OUTSIDEABOVE'
        },
        {
            id: 'custpage_item',
            label: '货品',
            type: 'SELECT',
            source: 'item',
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
            id: 'custpage_document_old',
            label: '原K3销售订单号',
            type: 'TEXT',
            //source: 'estimate',
            filter: 'mainname',
            operator: 'contains',
            layout: 'OUTSIDEBELOW'
        },
        {
            id: 'custpage_pc_salesman',
            label: '业务员',
            type: 'SELECT',
            source: 'employee',
            filter: 'mainname',
            operator: 'anyof',
            layout: 'OUTSIDEBELOW'
        }
        ];
        var sublistColumnConfig = {
            'custpage_entity': { //custpage_paged_type
                type: 'SELECT',
                label: '客户',
                source: 'customer',
                displayType: 'INLINE'
                //useText: true
            },
            'custpage_tranid': {
                type: 'TEXT',
                label: '销售订单号',
                displayType: 'INLINE'
            },
            'custpage_line': {
                type: 'TEXT',
                label: '销售订单行号',
                displayType: 'HIDDEN'
            },
            'custpage_plan_number': {
                type: 'TEXT',
                label: '计划号',
                displayType: 'INLINE'
            },
            'custpage_cust_ordertype': {
                type: 'SELECT',
                label: '订单类型',
                displayType: 'INLINE',
                source: 'customlist_cust_ordertype'
            },
            'custpage_wip_customer_order_number': {
                type: 'TEXT',
                label: '客户订单号',
                displayType: 'INLINE'
            },
            'custpage_item': { //custpage_item,custpage_quantity,custpage_shipdate,custpage_internalid,custpage_subsidiary
                type: 'SELECT',
                label: '货品',
                displayType: 'INLINE',
                source: 'item'
            },
            'custpage_goodsname': {//custpage_intretech_goods_code
                type: 'TEXT',
                label: '货品名称',
                displayType: 'INLINE'
            },
            'custpage_itemtype': {//custpage_item_configuration
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
            'custpage_number_pushed_down': {
                type: 'FLOAT',
                label: '已下推数量',
                displayType: 'INLINE'
            },
            'custpage_no_pushdown': {
                type: 'FLOAT',
                label: '下推数量',
                displayType: 'ENTRY'
            },
            'custpage_shipdate': {
                type: 'DATE',
                label: '预计交货日期',
                displayType: 'INLINE'
            },
            'custpage_memomain': {
                type: 'TEXT',
                label: '总摘要',
                displayType: 'INLINE'
            },
            'custpage_memo': {
                type: 'TEXT',
                label: '行备注',
                displayType: 'INLINE'
            },
            'custpage_whether_bonded': {
                type: 'SELECT',
                label: '是否保税',
                displayType: 'INLINE',
                source: 'customlist_if_under_bond'
            },
            'custpage_document_old': {
                type: 'TEXT',
                label: '原K3销售订单号',
                displayType: 'INLINE'
            },
            'custpage_pc_salesman': {
                type: 'SELECT',
                label: '业务员',
                source: 'employee',
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
            }
        };

        try {
            //加载搜索
            if (savedSearch) {
                searchObj = search.load({
                    id: savedSearch
                });
            } else {
                //if (parameters.custpage_subsidiary) {
                addFilters = addFilters.concat(["AND",
                    ["subsidiary", "anyof", subsidiary]
                ]);
                //}

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

                if (parameters.custpage_estimate) {
                    addFilters = addFilters.concat(["AND",
                        ["internalid", "anyof"].concat(parameters.custpage_estimate)
                    ]);
                }

                if (parameters.custpage_estimateline) {
                    addFilters = addFilters.concat(["AND",
                        ["custcol_plan_number", "contains"].concat(parameters.custpage_estimateline)
                    ]);
                }

                if (parameters.custpage_document_old) {
                    addFilters = addFilters.concat(["AND",
                        ["custbody_document_old", "contains"].concat(parameters.custpage_document_old)
                    ]);
                }

                if (parameters.custpage_pc_salesman) {
                    addFilters = addFilters.concat(["AND",
                        ["custbody_pc_salesman", "anyof"].concat(parameters.custpage_pc_salesman)
                    ]);
                }

                log.debug('addFilters', addFilters);

                searchObj = searchObjGetter(addFilters);

                log.debug('searchObj', searchObj);
            }

            //创建表单
            var form = uiComponent.createForm({
                title: '销售订单下推工单工作台',
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
                pushFlagFieldId: true
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
        var bsValue, pushFlagValue = 1;
        var lineCount = request.getLineCount({
            group: sublistId
        });
        // add by andy
        var batchid = '20200824001', logRecID = null;

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

                    var woOrderTypeValue;
                    var soOrderTypeValue = request.getSublistValue({
                        group: sublistId,
                        name: 'custpage_cust_ordertype',
                        line: i
                    });

                    log.debug('soOrderTypeValue', soOrderTypeValue);

                    switch (soOrderTypeValue) {
                        case '2': //量产订单
                            woOrderTypeValue = '1';
                            break;
                        case '3': //工程订单
                            woOrderTypeValue = '2';
                            break;
                        case '5': //退货（返工）订单
                            woOrderTypeValue = '5';
                            break;
                        case '9': //受拖加工订单
                            woOrderTypeValue = '3';
                    };

                    log.debug('woOrderTypeValue', woOrderTypeValue);

                    //记录日志表

                    try {
                        log.debug('开始记录日志......');
                        var customRecord = record.create({
                            type: 'customrecord_cux_salesorder_to_wip_list',
                            isDynamic: true
                        });
                        customRecord.setValue({
                            fieldId: 'custrecord_cux_sales_order', value: request.getSublistValue({
                                group: sublistId,
                                name: 'custpage_internalid',
                                line: i
                            })
                        });//    销售订单    
                        //   customRecord.setValue({ fieldId: 'custrecord_cux_sales_order_line', value:               });//    销售订单行号
                        customRecord.setValue({
                            fieldId: 'custrecord_cux_plan_num', value: request.getSublistValue({
                                group: sublistId,
                                name: 'custpage_plan_number',
                                line: i
                            })
                        });//    计划号      
                        customRecord.setValue({ fieldId: 'custrecord_cux_salesorder_data', value: { mainPayload: mainPayload, option: option } });//    数据        
                        customRecord.setValue({ fieldId: 'custrecord_cux_sales_order_to_wip_status', value: '开始处理' });//    状态        
                        //customRecord.setValue({ fieldId: 'custrecord_cux_sales_order_to_wip_msg', value:         });//    处理信息    
                        // customRecord.setValue({ fieldId: 'custrecord_cux_sales_order_to_wip_taskid', value:     });//    taskID      
                        logRecID = customRecord.save();

                    }
                    catch (e) {
                        log.debug('记录日志错误', e);
                    }
                    //记录日志表结束



                    var mainPayload = {
                        subsidiary: request.getSublistValue({
                            group: sublistId,
                            name: 'custpage_subsidiary',
                            line: i
                        }),
                        assemblyitem: request.getSublistValue({
                            group: sublistId,
                            name: 'custpage_item',
                            line: i
                        }),
                        //iswip: true,
                        orderstatus: 'A',
                        schedulingmethod: 'FORWARD',
                        location: '', //location要在quantity的前面，要不然bom数据不会动态更新
                        iswip: true,
                        quantity: request.getSublistValue({
                            group: sublistId,
                            name: 'custpage_no_pushdown', //custpage_quantity,custpage_no_pushdown
                            line: i
                        }),
                        custbody_wip_so: request.getSublistValue({
                            group: sublistId,
                            name: 'custpage_internalid',
                            line: i
                        }),
                        custbody_wip_so_line_information: request.getSublistValue({
                            group: sublistId,
                            name: 'custpage_plan_number',
                            line: i
                        }),
                        custbody_wip_manufacturing_type: woOrderTypeValue,
                        // add by andy
                        batchid: batchid,
                        logRecID: logRecID
                    };

                    var pushFlag = request.getSublistValue({
                        group: sublistId,
                        name: 'custpage_pushflag',
                        line: i
                    }) == pushFlagValue ? 'Y' : 'N';

                    var option = {
                        mode: 'CREATE',
                        pushFlag: pushFlag,
                        dateOption: {
                            itemIds: request.getSublistValue({
                                group: sublistId,
                                name: 'custpage_item',
                                line: i
                            }),
                            subsidiary: request.getSublistValue({
                                group: sublistId,
                                name: 'custpage_subsidiary',
                                line: i
                            }),
                            isFreeTax: request.getSublistValue({
                                group: sublistId,
                                name: 'custpage_whether_bonded',
                                line: i
                            }) ? request.getSublistValue({
                                group: sublistId,
                                name: 'custpage_whether_bonded',
                                line: i
                            }) : bsValue,
                            expectReceiveDate: currentDateStr,
                            quantity: request.getSublistValue({
                                group: sublistId,
                                name: 'custpage_quantity',
                                line: i
                            }),
                            ordertype: request.getSublistValue({
                                group: sublistId,
                                name: 'custpage_cust_ordertype',
                                line: i
                            }) //add 20200601
                        }
                        //recId: 77077
                    };




                    selectedEntries.push({
                        mainPayload: mainPayload,
                        option: option,
                        logRecID: logRecID //ADD BY ANDY
                    });
                }
            }

            //提交数据给后台处理
            if (selectedEntries.length) {
                log.debug('line 615', ' 开始提交数据给后台处理.......');
                var currentUser = runtime.getCurrentUser();
                var userName = currentUser.name;


                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: mrScriptId,
                    params: {
                        custscript_dosomething: JSON.stringify(selectedEntries),
                        batchid: batchid // add by andy
                    }
                });
                var taskId = mrTask.submit();

                var nowChinaTime = format.format({
                    type: format.Type.DATETIME,
                    value: new Date(),
                    timezone: format.Timezone.ASIA_HONG_KONG
                });

                log.debug(' 开始查看状态,taskId=' + taskId);

                redirect.toSuitelet({
                    scriptId: slStatusScriptId,
                    deploymentId: slStatusDeployId,
                    parameters: {
                        mrtaskid: taskId,
                        taskname: '销售订单下推工单',
                        taskcreator: userName,
                        taskcreatetime: nowChinaTime,
                        batchid: batchid //add by andy
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
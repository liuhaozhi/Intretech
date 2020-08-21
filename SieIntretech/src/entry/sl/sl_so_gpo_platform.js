/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 *@author yuming Hu
 *@description 销售订单下推采购订单（主要用于公司间交易）
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
    var mrScriptId = 'customscript_mr_po_create';

    function searchObjGetter(addFilters) {
        var searchObj;

        var columns = [{
                name: 'entity', //客户
            },
            {
                name: 'tranid' //销售订单号
            },
            {
                name: 'trandate' //销售订单号
            },
            {
                name: 'shipdate' //预计交货日期
            },
            // {
            //     name: 'currency' //货币
            // },
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
            // {
            //     name: 'rate' //货品
            // },
            {
                name: 'fxrate' //货品
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
                name: 'expectedreceiptdate' //预计交货日期
            },
            {
                name: 'custbody_po_remark' //摘要
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
                name: 'internalid' //是否保税
            },
            {
                name: 'subsidiary'
            },
            {
                name: 'lineuniquekey' //行唯一键
            },
            {
                name: 'linesequencenumber' //行序号
            },
            {
                name: 'custcol_external' //来源订单号
            },
            {
                name: 'custcol_sales_bank' //来源订单行号
            },
            {
                name: 'custcol_quantity_pushed_down' //已下推数量（0210）
            },
            {
                name: 'custcol_quantity_not_pushed_down' //未下推数量（0210）
            },
            {
                name: 'custcol_inter_vendor' //公司间交易供应商
            },
            {
                name: 'custcol_inter_pur_rate' //采购流程公司间交易单价
            },
            {
                name: 'custcol_inter_pur_currency' //采购流程公司间交易货币
            },
            {
                name: 'custcol_inter_pur_rate' //采购流程公司间交易货币
            }
        ];

        var filters = [
            ["type", "anyof", "Estimate"],
            "AND",
            ["mainline", "is", "F"],
            "AND",
            ["shipping", "is", "F"],
            "AND",
            ["cogs", "is", "F"],
            "AND",
            ["taxline", "is", "F"],
            "AND",
            ["quantity", "isnotempty", ""],
            "AND",
            ["custcol_po_pushed_down", "is", "F"]
            //"AND",
            //["custbody_cust_ordertype", "anyof", "2", "3", "5", "9"]
        ];

        if (addFilters.length) {
            filters = filters.concat(addFilters);
        }

        var sublistSearchCriteria = {
            type: 'estimate',
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
        var clientScript = '../entry/cs/cs_so_gpo_platform';
        var sublistTab = 'custpage_sublist_tab';
        var isnbjyFieldId = 'custpage_isnbjy';
        //var otherInfo = {};
        var searchBodyFields = [{
                id: 'custpage_subsidiary',
                label: '子公司',
                type: 'SELECT',
                source: 'subsidiary',
                filter: 'subsidiary',
                operator: 'anyof',
                layout: 'OUTSIDEABOVE'
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
                layout: 'OUTSIDEABOVE',
                break: 'STARTROW'
            },
            {
                id: 'custpage_orderdate',
                label: '下单日期',
                type: 'DATE',
                //source: 'estimate',
                filter: 'mainname',
                operator: 'anyof',
                layout: 'OUTSIDEABOVE'
                //break: 'STARTROW'
            },
            {
                id: 'custpage_p_shipdate',
                label: '交期',
                type: 'DATE',
                //source: 'estimate',
                filter: 'mainname',
                operator: 'anyof',
                layout: 'OUTSIDEABOVE'
                //break: 'STARTROW'
            },
            {
                id: 'custpage_isnbjy',
                label: '是否内部交易',
                type: 'CHECKBOX',
                //source: 'estimate',
                filter: 'mainname',
                operator: 'anyof',
                layout: 'OUTSIDEABOVE',
                break: 'STARTROW',
                defaultValue: 'T',
                display: 'INLINE'
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
            'custpage_trandate': {
                type: 'DATE',
                label: '下单日期',
                displayType: 'INLINE'
            },
            'custpage_shipdate': {
                type: 'DATE',
                label: '交期',
                displayType: 'INLINE'
            },
            'custpage_plan_number': {
                type: 'TEXT',
                label: '计划号',
                displayType: 'HIDDEN'
            },
            'custpage_cust_ordertype': {
                type: 'SELECT',
                label: '订单类型',
                displayType: 'HIDDEN',
                source: 'customlist_cust_ordertype'
            },
            'custpage_wip_customer_order_number': {
                type: 'TEXT',
                label: '客户订单号',
                displayType: 'HIDDEN'
            },
            'custpage_item': { //custpage_item,custpage_quantity,custpage_expectedreceiptdate,custpage_internalid,custpage_subsidiary
                type: 'SELECT',
                label: '货品',
                displayType: 'INLINE',
                source: 'item'
            },
            'custpage_intretech_goods_code': {
                type: 'TEXT',
                label: '货品名称',
                displayType: 'HIDDEN'
            },
            'custpage_item_configuration': {
                type: 'TEXT',
                label: '规格型号',
                displayType: 'HIDDEN'
            },
            'custpage_unit': {
                type: 'TEXT',
                label: '单位',
                displayType: 'INLINE'
            },
            'custpage_fxrate': {
                type: 'FLOAT',
                label: '单价',
                displayType: 'INLINE'
            },
            'custpage_inter_pur_rate': { //custcol_inter_pur_rate
                type: 'FLOAT',
                label: '对外部供应商单价',
                displayType: 'INLINE'
            },
            'custpage_quantity': {
                type: 'FLOAT',
                label: '数量',
                displayType: 'INLINE'
            },
            'custpage_quantity_pushed_down': {
                type: 'FLOAT',
                label: '已采购数量',
                displayType: 'INLINE'
            },
            // 'custpage_currency': {
            //     type: 'SELECT',
            //     label: '货币',
            //     source: 'currency'
            // },
            'custpage_inter_pur_currency': {
                type: 'SELECT',
                label: '货币',
                source: 'currency'
            },
            'custpage_quantity_not_pushed_down': {
                type: 'FLOAT',
                label: '采购数量',
                displayType: 'ENTRY'
            },
            // 'custpage_vendor': {
            //     type: 'SELECT',
            //     label: '外部供应商',
            //     source: 'vendor'
            // },
            'custpage_inter_vendor': {
                type: 'SELECT',
                label: '外部供应商',
                source: 'vendor'
            },
            'custpage_expectedreceiptdate': {
                type: 'DATE',
                label: '预计交货日期',
                displayType: 'HIDDEN'
            },
            'custpage_po_remark': {
                type: 'TEXT',
                label: '摘要',
                displayType: 'INLINE'
            },
            'custpage_memomain': {
                type: 'TEXT',
                label: '备注',
                displayType: 'INLINE'
            },
            'custpage_whether_bonded': {
                type: 'SELECT',
                label: '是否保税',
                displayType: 'HIDDEN',
                source: 'customlist_if_under_bond'
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
            'custpage_lineuniquekey': {
                type: 'INTEGER',
                label: '行唯一建',
                displayType: 'HIDDEN'
            },
            'custpage_linesequencenumber': {
                type: 'INTEGER',
                label: '行序号',
                displayType: 'HIDDEN'
            },
            'custpage_external': {
                type: 'SELECT',
                label: '来源采购订单号Id',
                source: 'transaction',
                displayType: 'HIDDEN'
            },
            'custpage_sales_bank': {
                type: 'TEXT',
                label: '来源采购订单行号',
                displayType: 'HIDDEN'
            },
        };

        log.debug('parameters', parameters);

        try {
            //加载搜索
            if (savedSearch) {
                searchObj = search.load({
                    id: savedSearch
                });
            } else {
                if (parameters.custpage_subsidiary) {
                    addFilters = addFilters.concat(["AND",
                        ["subsidiary", "anyof"].concat(parameters.custpage_subsidiary)
                    ]);
                }

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

                if (parameters.custpage_orderdate) {
                    addFilters = addFilters.concat(["AND",
                        ["trandate", "on"].concat(parameters.custpage_orderdate)
                    ]);
                }

                if (parameters.custpage_p_shipdate) {
                    addFilters = addFilters.concat(["AND",
                        ["shipdate", "on"].concat(parameters.custpage_p_shipdate)
                    ]);
                }

                if (parameters.custpage_isnbjy || true) {
                    addFilters = addFilters.concat(["AND",
                        ["custbody_source_purchase", "is", "T"]
                    ]);
                }

                searchObj = searchObjGetter(addFilters);
            }

            //创建表单
            log.debug('1', 1);
            var form = uiComponent.createForm({
                title: '内部销售订单下推外部采购订单工作台',
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

            if (parameters[isnbjyFieldId]) {
                parameters[isnbjyFieldId] = 'T';
            }

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

                    var mainPayload = {
                        entity: request.getSublistValue({
                            group: sublistId,
                            name: 'custpage_inter_vendor',
                            line: i
                        }),
                        currency: request.getSublistValue({
                            group: sublistId,
                            name: 'custpage_inter_pur_currency',
                            line: i
                        }),
                        item: request.getSublistValue({
                            group: sublistId,
                            name: 'custpage_item',
                            line: i
                        }),
                        // rate: request.getSublistValue({
                        //     group: sublistId,
                        //     name: 'custpage_rate',
                        //     line: i
                        // }),
                        rate: 1,
                        quantity: request.getSublistValue({
                            group: sublistId,
                            name: 'custpage_quantity_not_pushed_down',
                            line: i
                        }),
                        custcol_source_sales_order_line_numbe: request.getSublistValue({
                            group: sublistId,
                            name: 'custpage_linesequencenumber',
                            line: i
                        }),
                        custcol_source_sales_order_number: request.getSublistValue({
                            group: sublistId,
                            name: 'custpage_internalid',
                            line: i
                        }),
                        custcol_external: request.getSublistValue({
                            group: sublistId,
                            name: 'custpage_external',
                            line: i
                        }),
                        custcol_sales_bank: request.getSublistValue({
                            group: sublistId,
                            name: 'custpage_sales_bank',
                            line: i
                        }),
                        custpage_subsidiary: request.getSublistValue({
                            group: sublistId,
                            name: 'custpage_subsidiary',
                            line: i
                        })
                    };

                    selectedEntries.push(mainPayload);
                }
            }

            //提交数据给后台处理
            if (selectedEntries.length) {
                var currentUser = runtime.getCurrentUser();
                var userName = currentUser.name;
                log.debug('selectedEntries', selectedEntries);

                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: mrScriptId,
                    params: {
                        custscript_podosomething: JSON.stringify(selectedEntries)
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
                        taskname: '公司间交易',
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
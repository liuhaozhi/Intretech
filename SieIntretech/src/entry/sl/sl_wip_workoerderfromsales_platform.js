/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@author yuming Hu
 *@description 销售订单下推平台
 */
define([
    'N/ui/serverWidget',
    'N/search',
    'N/redirect',
    'N/currency',
    'N/format',
    'N/runtime',
    'N/task',
    '../../app/app_ui_wip_component_server.js',
    '../../../lib/common_lib.js',
    'N/url'
], function (
    serverWidget,
    search,
    redirect,
    currency,
    format,
    runtime,
    task,
    uiComponent,
    commonLib,
    url) {

    var sublistId = 'custpage_paged_sublist';
    var sublistCheckedId = 'custpage_paged_checked';
    var pageSizeId = 'custpage_pagesize';
    var pageIdId = 'custpage_pageid';
    var sublistFields = [];
    var defaultPageSize = 100;
    var mrScriptId = 'customscript_mr_vb_bc_combine';
    var mrDeployId = 'customdeploy_mr_vb_bc_combine';
    var slStatusScriptId = 'customscript_sl_get_task_status';
    var slStatusDeployId = 'customdeploy_sl_get_task_status';

    function viewPage(request, response) {
        var parameters = request.parameters;
        var addFilters = [];
        var refreshParams = {};
        var clientScript = '../entry/cs/cs_irt_iff_platform';
        var sublistTab = 'custpage_sublist_tab';
        var searchId = 'customsearch_irt_iff_platform_v2';
        var otherInfo = {};
        var searchBodyFields = [{
                id: 'custpage_subsidiary',
                label: '子公司',
                type: 'SELECT',
                source: 'subsidiary',
                filter: 'subsidiary',
                operator: 'anyof',
                layout: 'OUTSIDEBELOW'
            },
            {
                id: 'custpage_vendor',
                label: '供应商',
                type: 'SELECT',
                source: 'vendor',
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
            'custpage_paged_type': {
                type: 'TEXT',
                label: '类型',
                useText: true
            },
            'custpage_paged_tranid': {
                type: 'TEXT',
                label: '文件编号'
            },
            'custpage_paged_internalid': {
                type: 'SELECT',
                label: '单据ID',
                source: 'transaction',
                displayType: 'HIDDEN'
            },
            'custpage_paged_formulatext_0': {
                type: 'SELECT',
                label: 'PO ID',
                source: 'transaction',
                displayType: 'HIDDEN'
            },
            'custpage_paged_formulatext_1': {
                type: 'TEXT',
                label: 'PO编号'
            },
            'custpage_paged_mainname': {
                type: 'SELECT',
                label: '供应商',
                source: 'vendor',
                displayType: 'INLINE'
            },
            'custpage_paged_trandate': {
                type: 'DATE',
                label: '日期',
            },
            'custpage_paged_currency': {
                type: 'SELECT',
                label: '货币',
                source: 'currency',
                displayType: 'INLINE'
            },
            'custpage_paged_subsidiary_currency': {
                type: 'SELECT',
                label: '本位币',
                source: 'currency',
                displayType: 'INLINE'
            },
            'custpage_paged_subsidiary': {
                type: 'SELECT',
                label: '子公司',
                source: 'subsidiary',
                displayType: 'HIDDEN'
            },
            'custpage_paged_quantityuom': { //old-custpage_paged_formulanumeric_2
                type: 'FLOAT',
                label: '数量'
            },
            'custpage_paged_fxamount': { //old-custpage_paged_formulanumeric_3
                type: 'FLOAT',
                label: '总金额'
            }
        };
        var additionColumns = {
            'tax_rate': {
                type: 'TEXT',
                label: '税率'
            },
            'tax_code': {
                type: 'TEXT',
                label: '税码',
                // source : '-128',
                displayType: 'HIDDEN'
            },
            'tax_amt': {
                type: 'FLOAT',
                label: '税额'
            },
            'amt_with_tax': {
                type: 'FLOAT',
                label: '含税总额'
            },
            'amt_tax_compare': {
                type: 'FLOAT',
                label: '含税对账总额'
            },
            'amt_base_with_tax': {
                type: 'FLOAT',
                label: '本位币含税总额'
            },
            'amt_base_tax_compare': {
                type: 'FLOAT',
                label: '本位币含税对账总额'
            },
            'compare_order': {
                type: 'SELECT',
                label: '对账单号',
                source: 'customrecord_reconciliation'
            },
            'compare_order_date': {
                type: 'TEXT',
                label: '对账期间'
            }
        }

        try {
            //创建表单
            var form = uiComponent.createForm({
                title: '发票工作台',
                csPath: clientScript,
                submitLabel: '提交',
                buttons: [{
                        id: 'custpage_view_vb',
                        label: '查看发票',
                        functionName: 'viewVb'
                    },
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
                addFilters: addFilters,
                refreshParams: refreshParams
            });

            //创建显示结果的子列表
            form.addSubtab({
                id: sublistTab,
                label: '搜索结果'
            });
            createPagedSublist({
                form: form,
                container: sublistTab,
                sublist: {
                    id: sublistId,
                    label: '结果列表',
                    type: serverWidget.SublistType.LIST
                },
                searchCriteria: searchId,
                sublistColumnConfig: sublistColumnConfig,
                additionColumns: additionColumns,
                parameters: parameters,
                addFilters: addFilters,
                refreshParams: refreshParams,
                furProcessSublist: true,
                // showAllCols: true
            });

            //设置默认值
            form.updateDefaultValues(refreshParams);

            //缓存结果
            //缓存查看发票的url
            otherInfo.viewBillUrl = url.resolveScript({
                scriptId: 'customscript_sl_irt_iff_comfirm',
                deploymentId: 'customdeploy_sl_irt_iff_comfirm'
            });
            uiComponent.cachePageInfo({
                form: form,
                refreshParams: refreshParams,
                searchFields: searchBodyFields,
                sublistFields: sublistFields,
                otherInfo: otherInfo
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
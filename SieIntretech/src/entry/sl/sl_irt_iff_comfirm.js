/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 发票确认
 */
define([
    'N/ui/serverWidget',
    'N/search',
    'N/redirect',
    'N/currency',
    'N/format',
    'N/runtime',
    'N/task',
    'N/url',
    '../../app/app_ui_component_server.js',
    '../../../lib/common_lib.js'
], function(
    serverWidget,
    search,
    redirect,
    currency,
    format, 
    runtime,
    task,
    url,
    uiComponent,
    commonLib
) {

    var sublistId = 'custpage_paged_sublist';
    var sublistCheckedId = 'custpage_paged_checked';
    var pageSizeId = 'custpage_pagesize';
    var pageIdId = 'custpage_pageid';
    var sublistFields = [];
    var defaultPageSize = 100;
    var mrScriptId = 'customscript_mr_vb_bc_create';
    var cancelMrScriptId = 'customscript_mr_vb_bc_cancel';
    var slStatusScriptId = 'customscript_sl_get_task_status';
    var slStatusDeployId = 'customdeploy_sl_get_task_status';
    var operateConfirm = 'confirm';
    var operateCancel = 'cancel';

    function getMapKey(items, separator) {
        return items.join(separator || '#');
    }

    function createPagedSublist(option) {
        var form = option.form;
        var container = option.container;
        var sublist = option.sublist;
        var searchCriteria = option.searchCriteria;
        var sublistMark = option.sublistMark || 'paged';
        var sublistColumnConfig = option.sublistColumnConfig;
        var additionColumns = option.additionColumns || {};
        var showAllCols = option.showAllCols;
        var parameters = option.parameters;
        var pageSize = parseInt(parameters[pageSizeId]) || defaultPageSize;
        var pageId = parseInt(parameters[pageIdId]) || 1;
        var addFilters = option.addFilters;
        var refreshParams = option.refreshParams;
        var pageCount = 0;
        var searchObj;
        var formulaIndex = 0;
        var pageSelectOptions = [];
        var valueList = [];
        var fillOutSublistFunc = option.fillOutSublist;

        //加载搜索
        if (util.isString(searchCriteria)) {
            searchObj = search.load({
                id: searchCriteria
            });
        } else {
            searchObj = search.create(searchCriteria);
        }
        if (addFilters.length) {
            searchObj.filterExpression = searchObj.filterExpression.concat(addFilters);
        }

        //处理越界
        if (pageSize < 5) {
            pageSize = 5;
        } else if (pageSize > 1000) {
            pageSize = 1000;
        }

        //搜索预览
        var pagedData = searchObj.runPaged({
            pageSize: pageSize
        });
        pageCount = pagedData.pageRanges.length;

        //处理越界
        if (pageId < 1) {
            pageId = 1
        } else if (pageId > pageCount) {
            pageId = pageCount;
        }

        //创建页面显示数量和页码下拉选项字段
        for (i = 1; i <= pageCount; i++) {
            pageSelectOptions.push({
                value: i,
                text: i
            });
        }
        uiComponent.createFields({
            form: form,
            container: container,
            group: {
                id: 'custpage_paged_pagerange',
                label: '分页选项'
            },
            fields: [
                {
                    id: pageIdId,//分页下拉选项
                    label: '共' + pageCount + '页',
                    type: 'SELECT',
                    source: pageSelectOptions,
                    layout: 'OUTSIDEBELOW'
                },
                {
                    id: pageSizeId,//每页显示数量
                    label: '每页数量(5-1000)',
                    type: 'INTEGER',
                    layout: 'OUTSIDEBELOW'
                }
            ]
        });
        //默认值
        refreshParams[pageIdId] = pageId.toString();
        refreshParams[pageSizeId] = pageSize;


        //创建Sublist
        if (container) sublist.tab = container;
        var sublistObj = form.addSublist(sublist);

        //如果没有结果，就直接返回
        if (!pagedData.count) {
            return {
                sublistObj: sublistObj,
                valueList: valueList
            }
        }

        //设置上一页，下一页按钮和全选按钮
        if (pageId !== 1) {
            sublistObj.addButton({
                id: 'custpage_' + sublistMark + '_previous',
                label: '上一页',
                functionName: 'goToPage(' + (pageId - 1) + ')'
            });
        }
        if (pageId !== pageCount) {
            sublistObj.addButton({
                id: 'custpage_' + sublistMark + '_next',
                label: '下一页',
                functionName: 'goToPage(' + (pageId + 1) + ')'
            });
        }
        sublistObj.addMarkAllButtons();

        //创建列字段
        //勾选框
        sublistObj.addField({
            id: sublistCheckedId,
            type: serverWidget.FieldType.CHECKBOX,
            label: '选择'
        });

        //创建其他列
        var extraColumnIds = [];
        //throw { message: JSON.stringify(searchObj.columns) };
        searchObj.columns.forEach(function (column) {
            //计算Sublist 字段ID
            var sublistField;
            var fieldId = column.name;
            var fieldJoin = column.join;
            var fieldFormula = column.formula;
            if (fieldJoin) {
                fieldId = fieldJoin + '_' + fieldId;
            }
            if (fieldFormula) {
                fieldId = fieldId + '_' + formulaIndex++;
            }
            fieldId = 'custpage_' + sublistMark + '_' + fieldId;
            fieldId = fieldId.toLowerCase();

            // log.debug('fieldId', fieldId);

            //记录字段id和column的对应关系，用于后续Sublist的值填写
            var columnConfig = sublistColumnConfig[fieldId];
            if (columnConfig) {
                sublistColumnConfig[fieldId].column = column;
            } else {
                sublistColumnConfig[fieldId] = {
                    column: column
                };
            }

            //创建字段
            if (columnConfig) {
                sublistField = sublistObj.addField({
                    id: fieldId,
                    type: serverWidget.FieldType[columnConfig.type],
                    label: columnConfig.label || column.label,
                    source: columnConfig.source
                });

                //为了字段顺序，需要再特定字段后面插入一些字段
                if(fieldId === 'custpage_paged_custrecord_type_voucher'){
                    var exTypeFieldId = 'custpage_paged_custom_bill_type';
                    sublistObj.addField({
                        id: exTypeFieldId,
                        type: serverWidget.FieldType.TEXT,
                        label: '类型'
                    });
                    extraColumnIds.push(exTypeFieldId);
                }else if (fieldId === 'custpage_paged_custrecord_trasations_currency') {
                    var exRateFieldId = 'custpage_paged_add_exchange_rate';//汇率
                    sublistObj.addField({
                        id: exRateFieldId,
                        type: serverWidget.FieldType.FLOAT,
                        label: '汇率'
                    });
                    extraColumnIds.push(exRateFieldId);
                } else if (fieldId === 'custpage_paged_custrecord_amount_tax') {
                    var amtWithTaxBaseFieldId = 'custpage_paged_amout_base_with_tax';//本位币含税总额
                    sublistObj.addField({
                        id: amtWithTaxBaseFieldId,
                        type: serverWidget.FieldType.FLOAT,
                        label: '本位币含税总额'
                    });
                    extraColumnIds.push(amtWithTaxBaseFieldId);
                }
            } else {
                sublistField = sublistObj.addField({
                    id: fieldId,
                    type: serverWidget.FieldType.TEXT,
                    label: column.label
                });
            }
            
            //设置字段显示属性
            if (!showAllCols && !columnConfig) {
                sublistField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                return true;
            }
            if (columnConfig && columnConfig.displayType) {
                sublistField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType[columnConfig.displayType]
                });
                return true;
            }
        });

        // log.debug('sublistColumnConfig', sublistColumnConfig);

        //创建辅助列
        var addColumnIds = [];
        util.each(additionColumns, function (columnConfig, fieldId) {
            var addColumnId = 'custpage_' + sublistMark + '_' + fieldId;
            var sublistField = sublistObj.addField({
                id: addColumnId,
                type: serverWidget.FieldType[columnConfig.type],
                label: columnConfig.label,
                source: columnConfig.source
            });
            sublistField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType[columnConfig.displayType || 'INLINE']
            });
            addColumnIds.push(addColumnId);
        });

        //缓存Sublist字段ID，以备前端代码使用
        sublistFields = Object.keys(sublistColumnConfig).concat(addColumnIds).concat(extraColumnIds);

        //获取当页数据
        pageId--;//page 数组从0开始，而page id从1开始
        pagedData.fetch({ index: pageId }).data.forEach(function (result) {
            var sublistLine = {};
            util.each(sublistColumnConfig, function (columnConfig, sublistFieldId) {
                var resultColumn = columnConfig.column;
                sublistLine[sublistFieldId] = columnConfig.useText ? result.getText(resultColumn) : result.getValue(resultColumn);
            });
            valueList.push(sublistLine);
            return true;
        });

        // log.debug('valueList', valueList);

        // 填充sublist的值
        if (fillOutSublistFunc) {
            fillOutSublistFunc({
                sublistObj: sublistObj,
                valueList: valueList
            });
        } else {//进一步处理子列表数据
            valueList.forEach(function (sublistLine, index) {
                util.each(sublistLine, function (value, id) {
                    if (value) {
                        sublistObj.setSublistValue({
                            id: id,
                            value: value,
                            line: index
                        });
                    }
                });
            });
        }

        return {
            sublistObj: sublistObj,
            valueList: valueList
        }
    }

    function fillOutSublist(options) {
        var sublistObj = options.sublistObj,
            valueList = options.valueList,
            dateStrObjMap = {},
            exchangeRateMap = {},
            subsidiaryMap = {};

        valueList.forEach(function (sublistLine) {
            var subsidiaryId = sublistLine['custpage_paged_custrecord_state_subsidiary'];
            subsidiaryMap[subsidiaryId] = '';
        });

        //搜索子公司本位币
        search.create({
            type : 'subsidiary',
            filters : [
                ['internalid', 'anyof', Object.keys(subsidiaryMap)]
            ],
            columns : [
                'currency'
            ]
        }).run().each(function(result){
            subsidiaryMap[result.id] = result.getValue(result.columns[0]);
            return true;
        });

        valueList.forEach(function (sublistLine) {
            var orderDate = sublistLine['custpage_paged_formuladate_1'],
                orderCurrency = String(sublistLine['custpage_paged_custrecord_trasations_currency']),
                subsidiaryId = sublistLine['custpage_paged_custrecord_state_subsidiary'],
                targetCurrency = subsidiaryMap[subsidiaryId];

            if (!dateStrObjMap[orderDate]) {
                var orderDateObj = format.parse({
                    type: format.Type.DATE,
                    value: orderDate
                });
                var monthStartDateObj = new Date(orderDateObj.getFullYear(), orderDateObj.getMonth(), 1);
                var monthStartDateStr = format.format({
                    type: format.Type.DATE,
                    value: monthStartDateObj
                });
                dateStrObjMap[orderDate] = {
                    str: monthStartDateStr,
                    obj: monthStartDateObj,
                    toStr: monthStartDateObj.toString()
                };
            }

            var exRateKey = getMapKey([orderCurrency, targetCurrency, dateStrObjMap[orderDate].str]);
            if (!exchangeRateMap[exRateKey]) {
                exchangeRateMap[exRateKey] = {
                    source: orderCurrency,
                    target: targetCurrency,
                    date: dateStrObjMap[orderDate].obj
                };
            }
        });

        //获取订单日期对应的月份的第一天的汇率
        util.each(exchangeRateMap, function (mapValue, mapKey) {
            var exRate;
            if (mapValue.source == mapValue.target) {
                exRate = 1;
            } else {
                exRate = currency.exchangeRate(mapValue) || 0;
            }
            mapValue.exRate = exRate;
        });

        // log.debug('exchangeRateMap', exchangeRateMap);

        //合并所有数据
        valueList.forEach(function (sublistLine, index) {
            var orderDate = sublistLine['custpage_paged_formuladate_1'],
                subsidiaryId = sublistLine['custpage_paged_custrecord_state_subsidiary'],
                orderCurrency = String(sublistLine['custpage_paged_custrecord_trasations_currency']),
                amtWithTax = +sublistLine['custpage_paged_custrecord_amount_tax'] || 0,
                orderType = sublistLine['custpage_paged_custrecord_type_voucher'],
                taxRate = sublistLine['custpage_paged_custrecord_tax_code_rate'],
                targetCurrency = subsidiaryMap[subsidiaryId],
                monthStartDateStr = dateStrObjMap[orderDate].str,
                exRateKey = getMapKey([orderCurrency, targetCurrency, monthStartDateStr]),
                exRate = exchangeRateMap[exRateKey].exRate,
                billTypeList = [
                    '入库单',
                    'Item Receipt'
                ],
                billCreditTypeList = [
                    '出库单',
                    'Item Fulfillment'
                ],
                billType = '';

            //汇率
            sublistLine['custpage_paged_add_exchange_rate'] = exRate;

            //本位币含税总额
            sublistLine['custpage_paged_amout_base_with_tax'] = commonLib.accMul(amtWithTax, exRate);

            //税率转换
            sublistLine['custpage_paged_custrecord_tax_code_rate'] = +taxRate + '%';

            //自定义类型
            if(billTypeList.indexOf(orderType) > -1){
                billType = '账单';
            }else if(billCreditTypeList.indexOf(orderType) > -1){
                billType = '贷项通知单';
            }else{
                billType = '未知';
            }
            sublistLine['custpage_paged_custom_bill_type'] = billType;
        });

        //填充Sublist
        valueList.forEach(function (sublistLine, index) {
            util.each(sublistLine, function (value, id) {
                if (value || util.isNumber(value)) {
                    if(id == "custpage_paged_custrecord_check_parent_name") {
                        if(value != undefined && value != "") {
                            var recId = '';
                            search.create({
                                type: 'customrecord_reconciliation',
                                filters: [{
                                        name: 'name',
                                        operator: 'contains',
                                        values: value
                                }],
                                columns: [{
                                    name: 'internalid',
                                    summary: search.Summary.MAX
                                }]
                            }).run().each(function(result) {
                                recId = result.getValue(result.columns[0]);
                            });
                            value = "<a class='dottedlink' href='" + url.resolveRecord({recordType: "customrecord_reconciliation", recordId: recId}) + "&whence='>" + value + "</a>";
                        }
                    }
                    sublistObj.setSublistValue({
                        id: id,
                        value: value,
                        line: index
                    });
                }
            });
        });
    }

    function viewPage(request, response) {
        var parameters = request.parameters;
        var addFilters = [];
        var refreshParams = {};
        var clientScript = '../entry/cs/cs_irt_iff_comfirm.js';
        var sublistTab = 'custpage_sublist_tab';
        var searchId = 'customsearch_avail_confirm_statement_v2';
        var searchBodyFields = [
            {
                id: 'custpage_vendor',
                label: '供应商',
                type: 'SELECT',
                source: 'CUSTRECORD_CHECK_PARENT',
                filter: 'custrecord_vendor_name',
                operator: 'anyof',
                layout: 'OUTSIDEBELOW'
            },
            {
                id: 'custpage_start_date',
                label: '自',
                type: 'DATE',
                filter: 'custrecord_application_date',
                operator: 'onorafter',
                layout: 'OUTSIDEBELOW'
            },
            {
                id: 'custpage_end_date',
                label: '至',
                type: 'DATE',
                filter: 'custrecord_application_date',
                operator: 'onorbefore',
                layout: 'OUTSIDEBELOW'
            },
            {
                id: 'custpage_operation_type',
                label: '操作类型',
                type: 'SELECT',
                source: [
                    {
                        text : '撤回',
                        value : operateCancel
                    },
                    {
                        text : '确认',
                        value : operateConfirm,
                        isSelected : true
                    }
                ],
                display: 'HIDDEN'
            }
        ];
        var sublistColumnConfig = {
            'custpage_paged_formulatext_0': {
                type: 'TEXT',
                label: '提起日期',
            },
            'custpage_paged_formuladate_1': {
                type: 'DATE',
                label: '发票日期'
            },
            'custpage_paged_custrecord_type_voucher': {
                type: 'TEXT',
                label: '类型',
                displayType: 'HIDDEN'
            },
            'custpage_paged_custrecord_check_parent_custrecord_vendor_name': {
                type: 'SELECT',
                label: '供应商',
                source: 'vendor',
                displayType: 'INLINE'
            },
            'custpage_paged_custrecord_trasations_currency': {
                type: 'SELECT',
                label: '货币',
                source: 'currency',
                displayType: 'INLINE'
            },
            'custpage_paged_custrecord_state_subsidiary': {
                type: 'SELECT',
                label: '子公司',
                source: 'subsidiary',
                displayType: 'HIDDEN'
            },
            'custpage_paged_custrecord_check_grossamount': {
                type: 'FLOAT',
                label: '金额'
            },
            'custpage_paged_custrecord_tax_code_rate': {
                type: 'TEXT',
                label: '税率'
            },
            'custpage_paged_custrecord_tax_code': {
                type: 'TEXT',
                label: '税码',
                displayType: 'HIDDEN'
            },
            'custpage_paged_formulanumeric_2': {
                type: 'FLOAT',
                label: '税额'
            },
            'custpage_paged_custrecord_amount_tax': {
                type: 'FLOAT',
                label: '含税总额'
            },
            'custpage_paged_custrecord_real_bill_number': {
                type: 'TEXT',
                label: '实际发票号' 
            },
            'custpage_paged_custrecord_check_parent_name': {
                type: 'TEXT',
                label: '对账单号'
            }
        };

        try {
            //创建表单
            var form = uiComponent.createForm({
                title: '发票确认',
                csPath: clientScript,
                submitLabel: '标准提交',
                buttons: [
                    {
                        id: 'custpage_confirm_statement',
                        label: '确认',
                        functionName: 'confirmStatement'
                    },
                    {
                        id: 'custpage_cancle_statement',
                        label: '撤回',
                        functionName: 'cancelStatement'
                    },
                    {
                        id: 'custpage_search',
                        label: '查询',
                        functionName: 'searchResults'
                    }
                ]
            });
            //插入CSS以便隐藏标准的提交按钮
            form.addField({
                type : 'inlinehtml',
                id : 'custpage_insert_html',
                label : 'Extra HTML'
            }).defaultValue = '<style type="text/css">#submitter,#secondarysubmitter,#tbl_submitter,#tdbody_secondarysubmitter,.rndbuttoncaps {display:none !important;}</style>';

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
                parameters: parameters,
                addFilters: addFilters,
                refreshParams: refreshParams,
                fillOutSublist: fillOutSublist,
                showAllCols: true
            });

            //设置默认值
            form.updateDefaultValues(refreshParams);

            //缓存结果
            uiComponent.cachePageInfo({
                form: form,
                refreshParams: refreshParams,
                searchFields: searchBodyFields,
                sublistFields: sublistFields
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
                output: '发票确认页面生成失败，错误提示：' + ex.message
            });
        }
    }

    function submitPage(request, response) {
        try {
            var reqParams = request.parameters,
                selectedEntries = [],
                lineCount = request.getLineCount({
                    group: sublistId
                }),
                currentUser = runtime.getCurrentUser(),
                userName = currentUser.name,
                cacheInfo = reqParams['custpage_pagecache'],
                sublistFields = JSON.parse(cacheInfo).sublistFields,
                operateType = reqParams['custpage_operation_type'],
                isChecked,
                mrTask,
                taskId,
                nowChinaTime,
                selectedLine;

            //收集勾选信息
            for (var i = 0; i < lineCount; i++) {
                isChecked = request.getSublistValue({
                    group: sublistId,
                    name: sublistCheckedId,
                    line: i
                });
                if (isChecked === true || isChecked === 'T') {
                    selectedLine = {};
                    sublistFields.forEach(function(fieldId){
                        selectedLine[fieldId] = request.getSublistValue({
                            group: sublistId,
                            name: fieldId,
                            line: i
                        });
                        if(selectedLine[fieldId] && selectedLine[fieldId].indexOf('<a ') == 0) {
                            selectedLine[fieldId] = selectedLine[fieldId].slice(selectedLine[fieldId].indexOf('>') + 1, -4);
                        }
                    });
                    selectedEntries.push(selectedLine);
                }
            }

            log.error('selectedEntries',selectedEntries)
            //提交数据给后台处理
            if (selectedEntries.length) {
                nowChinaTime = format.format({
                    type: format.Type.DATETIME,
                    value: new Date(),
                    timezone: format.Timezone.ASIA_HONG_KONG
                });

                if(operateType === operateConfirm){//确认的操作
                    mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: mrScriptId,
                        params: {
                            'custscript_vbbc_arg_structure': JSON.stringify(selectedEntries)
                        }
                    });
                    taskId = mrTask.submit();
                    
                    redirect.toSuitelet({
                        scriptId: slStatusScriptId, 
                        deploymentId: slStatusDeployId,
                        parameters: {
                            mrtaskid: taskId,
                            taskname: '生成供应商账单和贷项通知单',
                            taskcreator: userName,
                            taskcreatetime: nowChinaTime
                        }
                    });
                }else if(operateType === operateCancel){//撤回的操作
                    mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: cancelMrScriptId,
                        params: {
                            'custscript_vbbc_input_structure': JSON.stringify(selectedEntries)
                        }
                    });
                    taskId = mrTask.submit();
                    
                    redirect.toSuitelet({
                        scriptId: slStatusScriptId,
                        deploymentId: slStatusDeployId,
                        parameters: {
                            mrtaskid: taskId,
                            taskname: '撤回供应商账单和贷项通知单申请',
                            taskcreator: userName,
                            taskcreatetime: nowChinaTime
                        }
                    });
                }else{
                    response.write({
                        output: '无效的操作类型'
                    });
                }                
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

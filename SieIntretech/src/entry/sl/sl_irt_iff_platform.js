/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 发票工作台
 */
define([
    'N/ui/serverWidget',
    'N/search',
    'N/redirect',
    'N/currency',
    'N/format',
    'N/runtime',
    'N/task',
    '../../app/app_ui_component_server.js',
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
    url
) {

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
        log.error('addFilters',addFilters)
        var refreshParams = option.refreshParams;
        var pageCount = 0;
        var searchObj;
        var formulaIndex = 0;
        var pageSelectOptions = [];
        var valueList = [];
        var furProcessSublist = option.furProcessSublist;
        var cstmFilters = JSON.parse(option.parameters.filters || "[]");

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
        }else{
            return false
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
                if (fieldId === 'custpage_paged_currency') {//货币
                    var exRateFieldId = 'custpage_paged_exchange_rate';
                    sublistObj.addField({
                        id: exRateFieldId,
                        type: serverWidget.FieldType.FLOAT,
                        label: '汇率'
                    });
                    extraColumnIds.push(exRateFieldId);
                } else if (fieldId === 'custpage_paged_quantityuom') {//数量
                    var compQtyFieldId = 'custpage_paged_compare_qty';
                    sublistObj.addField({
                        id: compQtyFieldId,
                        type: serverWidget.FieldType.FLOAT,
                        label: '对账数量'
                    });
                    extraColumnIds.push(compQtyFieldId);
                } else if (fieldId === 'custpage_paged_fxamount') {//总金额
                    var compAmtFieldId = 'custpage_paged_compare_amt';
                    sublistObj.addField({
                        id: compAmtFieldId,
                        type: serverWidget.FieldType.FLOAT,
                        label: '对账总额'
                    });
                    extraColumnIds.push(compAmtFieldId);
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
        if (!furProcessSublist) {
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
        } else {//进一步处理子列表数据
            fillOutSublist({
                sublistObj: sublistObj,
                valueList: valueList,
                cstmFilters: cstmFilters
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
            cstmFilters = options.cstmFilters,
            enlarge = 100000,
            orderInfoMap = {},
            dateStrObjMap = {},
            exchangeRateMap = {},
            poTaxMap = {};

        valueList.forEach(function (sublistLine) {
            var orderId = sublistLine['custpage_paged_internalid'],
                orderDate = sublistLine['custpage_paged_trandate'],
                orderCurrency = String(sublistLine['custpage_paged_currency']),
                targetCurrency = String(sublistLine['custpage_paged_subsidiary_currency']),
                poId = sublistLine['custpage_paged_formulatext_0'];

            orderInfoMap[orderId] = {
                'custpage_paged_compare_qty': 0,
                'custpage_paged_compare_amt': 0,
                'custpage_paged_amt_tax_compare': 0,
                'custpage_paged_compare_order': 0,
                'custpage_paged_compare_order_date': 0
            };

            if (!dateStrObjMap[orderDate]) {
                var orderDateObj = format.parse({
                    type: format.Type.DATE,
                    value: orderDate
                });
                var monthStartDateObj = new Date(orderDateObj.getFullYear(), orderDateObj.getMonth(), 1);
                // log.error('monthStartDateObj', monthStartDateObj);
                // log.error('orderId', orderId);
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

            poTaxMap[poId] = null;
        });

        // log.debug('dateStrObjMap', dateStrObjMap);

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

        //查询税率和税码
        search.create({
            type: 'purchaseorder',
            filters: [
                {
                    name: 'internalid',
                    operator: 'anyof',
                    values: Object.keys(poTaxMap)
                },
                {
                    name: 'mainline',
                    operator: 'is',
                    values: 'F'
                },
                {
                    name: 'taxline',
                    operator: 'is',
                    values: 'F'
                },
            ],
            columns: [
                {
                    name: 'internalid',
                    summary: search.Summary.GROUP
                },
                {
                    name: 'rate',
                    join: 'taxitem',
                    summary: search.Summary.MAX
                },
                {
                    name: 'formulatext',
                    formula : '{taxitem.ID}',
                    summary: search.Summary.MAX
                }
            ]
        }).run().each(function (result) {
            var poId = result.getValue(result.columns[0]);
            var taxRate = +result.getValue(result.columns[1]) || 0;
            var taxCode = result.getValue(result.columns[2]);
            poTaxMap[poId] = {
                taxRate : taxRate,
                taxCode : taxCode
            };
            return true;
        });

        var searhFilters = [{
            name: 'custrecord_receipt_nub',
            join: 'custrecord_check_parent',
            operator: 'anyof',
            values: Object.keys(orderInfoMap)
        }]

        cstmFilters.map(function(filter, index){
            if(filter.name === 'custpage_paged_compare_order'){
                cstmFilters.splice(index,1)

                searhFilters.push({
                    name : 'name',
                    operator : 'contains',
                    values : filter.values.join('')
                }) 
            }
        })
        //查询对账数量, 对账金额, 含税对账总额, 对账单号, 对账期间
        search.create({
            type: 'customrecord_reconciliation',
            filters: searhFilters
            ,
            columns: [
                {
                    name: 'formulanumeric',
                    formula: '{custrecord_check_parent.custrecord_receipt_nub.ID}',
                    summary: search.Summary.GROUP
                },
                {
                    name: 'custrecord_check_amount',
                    join: 'custrecord_check_parent',
                    summary: search.Summary.SUM
                },
                {
                    name: 'custrecord_check_grossamount',
                    join: 'custrecord_check_parent',
                    summary: search.Summary.SUM
                },
                {
                    name: 'custrecord_amount_tax',
                    join: 'custrecord_check_parent',
                    summary: search.Summary.SUM
                },
                {
                    name: 'internalid',
                    summary: search.Summary.MAX
                },
                {
                    name: 'custrecord_period_reconciliation',
                    summary: search.Summary.MAX
                }
            ]
        }).run().each(function (result) {
            var orderId = result.getValue(result.columns[0]);
            var compQty = +result.getValue(result.columns[1]) || 0;
            var compAmt = +result.getValue(result.columns[2]) || 0;
            var compAmtWithTax = +result.getValue(result.columns[3]) || 0;
            var compOrder = result.getValue(result.columns[4]);
            var compPeriod = result.getValue(result.columns[5]);

            orderInfoMap[orderId]['custpage_paged_compare_qty'] = compQty;
            orderInfoMap[orderId]['custpage_paged_compare_amt'] = compAmt;
            orderInfoMap[orderId]['custpage_paged_amt_tax_compare'] = compAmtWithTax;
            orderInfoMap[orderId]['custpage_paged_compare_order'] = compOrder;
            orderInfoMap[orderId]['custpage_paged_compare_order_date'] = compPeriod;
            return true;
        });

        //合并所有数据
        var totalLine = {}, relValueList = [];
        var inValidLines = [];
        valueList.forEach(function (sublistLine, index) {
            var orderId = sublistLine['custpage_paged_internalid'],
                orderDate = sublistLine['custpage_paged_trandate'],
                poId = sublistLine['custpage_paged_formulatext_0'],
                taxRate = poTaxMap[poId] ? poTaxMap[poId].taxRate : 0,
                taxCode = poTaxMap[poId] ? poTaxMap[poId].taxCode : '',
                orderAmt = +sublistLine['custpage_paged_fxamount'] || 0,
                orderCurrency = String(sublistLine['custpage_paged_currency']),
                targetCurrency = String(sublistLine['custpage_paged_subsidiary_currency']),
                monthStartDateStr = dateStrObjMap[orderDate].str,
                exRateKey = getMapKey([orderCurrency, targetCurrency, monthStartDateStr]);

            //汇率
            sublistLine['custpage_paged_exchange_rate'] = exchangeRateMap[exRateKey].exRate;

            //税率，税额，含税总额和税码
            sublistLine['custpage_paged_tax_rate'] = taxRate + '%';
            sublistLine['custpage_paged_tax_code'] = taxCode;
            sublistLine['custpage_paged_tax_amt'] = commonLib.accDiv(commonLib.accMul(orderAmt, taxRate), 100);
            sublistLine['custpage_paged_amt_with_tax'] = commonLib.accAdd(orderAmt, sublistLine['custpage_paged_tax_amt']);

            //对账数量,对账金额和含税对账总额
            sublistLine['custpage_paged_compare_qty'] = orderInfoMap[orderId]['custpage_paged_compare_qty'];
            sublistLine['custpage_paged_compare_amt'] = orderInfoMap[orderId]['custpage_paged_compare_amt'];
            sublistLine['custpage_paged_amt_tax_compare'] = orderInfoMap[orderId]['custpage_paged_amt_tax_compare'];

            //本位币含税总额=含税总额*汇率
            sublistLine['custpage_paged_amt_base_with_tax'] = commonLib.accMul(sublistLine['custpage_paged_amt_with_tax'], sublistLine['custpage_paged_exchange_rate']);

            //本位币含税对账总额=含税对账总额*汇率
            sublistLine['custpage_paged_amt_base_tax_compare'] = commonLib.accMul(sublistLine['custpage_paged_amt_tax_compare'], sublistLine['custpage_paged_exchange_rate']);

            //对账单号
            sublistLine['custpage_paged_compare_order'] = orderInfoMap[orderId]['custpage_paged_compare_order'];

            //对账期间
            sublistLine['custpage_paged_compare_order_date'] = orderInfoMap[orderId]['custpage_paged_compare_order_date'];

            //数量和总金额转换
            sublistLine['custpage_paged_quantityuom'] = +sublistLine['custpage_paged_quantityuom'] || 0;
            sublistLine['custpage_paged_fxamount'] = orderAmt;

            if(!filtersWithSublistLineArray(sublistLine, cstmFilters)) {
                return inValidLines.push(sublistLine);
            }
            relValueList.push(sublistLine);
            //合计-对数量、税额、总金额、含税总额、本位币含税总额进行合计
            util.each(sublistLine, function (value, id) {
                if (id !== 'custpage_paged_exchange_rate') {
                    if (isNumber(value)) {
                        if (!totalLine.hasOwnProperty(id)) {
                            totalLine[id] = 0;
                        }
                        totalLine[id] = commonLib.accAdd(totalLine[id], value);
                    }
                }
            });
        });
 
        valueList.push(totalLine);//未过滤的值
        relValueList.push(totalLine);//过滤后的值

        //填充Sublist
        relValueList.forEach(function (sublistLine, index) {
            util.each(sublistLine, function (value, id) {
                if (value || util.isNumber(value)) {
                    if(id == "custpage_paged_formulatext_1") {
                        value = "<a class='dottedlink' href='" + url.resolveRecord({recordType: "purchaseorder", recordId: sublistLine['custpage_paged_formulatext_0']}) + "&whence='>" + value + "</a>";
                    } else if(id == "custpage_paged_type") {
                        var tmpURL = value == "入库单" || value.toLowerCase().indexOf("receipt") > -1?
                        url.resolveRecord({ recordType: "itemreceipt", recordId: sublistLine['custpage_paged_internalid'] }):
                        url.resolveRecord({ recordType: "itemfulfillment", recordId: sublistLine['custpage_paged_internalid'] });
                        value = "<a class='dottedlink' href='" + tmpURL + "'>" + value + "</a>";
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

    function isNumber(val) {
        var regPos = /^\d+(\.\d+)?$/; //非负浮点数
        var regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数
        if(regPos.test(val) || regNeg.test(val)) {
            return true;
        } else {
            return false;
        }
    }

    function viewPage(request, response) {
        var parameters = request.parameters;
        var addFilters = [];
        var refreshParams = {};
        var clientScript = '../entry/cs/cs_irt_iff_platform';
        var sublistTab = 'custpage_sublist_tab';
        var searchId = 'customsearch_irt_iff_platform_v2';
        var otherInfo = {};
        var searchBodyFields = [
            {
                id: 'custpage_subsidiary',
                label: '子公司',
                type: 'SELECT',
                source: 'subsidiary',
                filter: 'subsidiary',
                operator: 'anyof',
                layout: 'OUTSIDEBELOW'
            },
            {
                id: 'custpage_start_date',
                label: '自',
                type: 'DATE',
                filter: 'trandate',
                operator: 'onorafter',
                layout: 'OUTSIDEBELOW',
                width : 60,
                height : 60
            },
            {
                id: 'custpage_end_date',
                label: '至',
                type: 'DATE',
                filter: 'trandate',
                operator: 'onorbefore',
                layout: 'OUTSIDEBELOW',
                width : 60,
                height : 60
            },
            {
                id: 'custpage_vendor',
                label: '供应商',
                type: 'MULTISELECT',
                source: 'vendor',
                filter: 'mainname',
                operator: 'anyof',
                layout: 'OUTSIDEBELOW'
            },
            {
                id: 'custpage_po',
                label: 'po编号',
                type: 'MULTISELECT',
                filter: 'createdfrom',
                source: 'purchaseorder',
                operator: 'anyof',
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
            'custpage_paged_quantityuom': {//old-custpage_paged_formulanumeric_2
                type: 'FLOAT',
                label: '数量'
            },
            'custpage_paged_fxamount': {//old-custpage_paged_formulanumeric_3
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
                displayType : 'HIDDEN'
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
                buttons: [
                    {
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
                otherInfo : otherInfo
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
                isChecked,
                orderId,
                selectedLine;

            //收集勾选信息
            for (var i = 0; i < lineCount; i++) {
                isChecked = request.getSublistValue({
                    group: sublistId,
                    name: sublistCheckedId,
                    line: i
                });
                orderId = request.getSublistValue({
                    group: sublistId,
                    name: 'custpage_paged_internalid',
                    line: i
                });
                if ((isChecked === 'T' || isChecked === true) && orderId) {
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

            // log.error('selectedEntries', selectedEntries);
            //throw { message: JSON.stringify(selectedEntries) };
            //提交数据给后台处理
            if (selectedEntries.length) {
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: mrScriptId,
                    params: {
                        'custscript_vbbc_data_structure': JSON.stringify(selectedEntries)
                    }
                });
                var taskId = mrTask.submit();

                var nowChinaTime = format.format({
                    type: format.Type.DATETIME,
                    value: new Date(),
                    timezone: format.Timezone.ASIA_HONG_KONG
                });

                redirect.toSuitelet({
                    scriptId: "customscript_sl_irt_iff_comfirm",
                    deploymentId: "customdeploy_sl_irt_iff_comfirm",
                    parameters: {
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

    //entry points
    function onRequest(context) {
        var request = context.request,
            response = context.response;

        if (request.method === 'GET') {
            viewPage(request, response);
        } else {
            submitPage(request, response);
        }
    }

    function filtersWithSublistLineArray(sublistLine, cstmFilters){
        var isValidLine = true;
        for(var fIndex = 0; fIndex < cstmFilters.length && isValidLine; fIndex++) {
            var filterInfo = cstmFilters[fIndex];
            var value = sublistLine[filterInfo.name];
            var fValues = filterInfo.values;
            if(value === undefined || fValues[0] == undefined) { continue; }
            value = value == undefined? "": value;
            var index = fValues[0].indexOf(value);
            switch(filterInfo.operator) {
                case "after":
                case "notbefore":
                    isValidLine = (isNaN(+value) && isNaN(+fValues[0])? value: +value) > fValues[0];
                    break;
                case "allof": 
                    for(var i = fValues.length - 1; i > -1 && fValues[i].indexOf(value) > -1; i--);
                    isValidLine = i == -1;
                    break;
                case "any": 
                case "haskeywords": 
                case "notallof":
                    for(var i = fValues.length - 1; i > -1 && fValues[i].indexOf(value) == -1; i--);
                    isValidLine = i != -1;
                    break;
                case "anyof": 
                    isValidLine = fValues.indexOf(value) > -1;
                    break;
                case "notafter":
                case "before": 
                    isValidLine = (isNaN(+value) && isNaN(+fValues[0])? value: +value) < fValues[0];
                    break;
                case "between": 
                case "within":
                    value = isNaN(+value) && isNaN(+fValues[0]) && isNaN(+fValues[1])? value: +value;
                    isValidLine = value >= fValues[0] && value <= fValues[1];
                    break;
                case "contains": 
                    isValidLine = index > -1;
                    break;
                case "doesnotcontain": 
                    isValidLine = index == -1;
                    break;
                case "doesnotstartwith": 
                    isValidLine = !!index;
                    break;
                case "is": 
                case "equalto": 
                    isValidLine = fValues[0] == value;
                    break;
                case "notlessthanorequalto":
                case "greaterthan": 
                    isValidLine = (isNaN(+value) && isNaN(+fValues[0])? value: +value) > fValues[0];
                    break;
                case "notlessthan":
                case "greaterthanorequalto": 
                    isValidLine = (isNaN(+value) && isNaN(+fValues[0])? value: +value) >= fValues[0];
                    break;
                case "isempty": 
                    isValidLine = value == "" || value == null;
                    break;
                case "isnot": 
                case "notequalto":
                    isValidLine = value != fValues[0];
                    break;
                case "isnotempty": 
                    isValidLine = value != "" && value != null;
                    break;
                case "notgreaterthanorequalto":
                case "lessthan": 
                    isValidLine = (isNaN(+value) && isNaN(+fValues[0])? value: +value) < fValues[0];
                    break;
                case "notgreaterthan":
                case "lessthanorequalto": 
                    isValidLine = (isNaN(+value) && isNaN(+fValues[0])? value: +value) <= fValues[0];
                    break;
                case "noneof": 
                    for(var i = fValues.length - 1; i > -1 && fValues[i] != value; i--);
                    isValidLine = i == -1;
                    break;
                case "notbetween": 
                case "notwithin":
                    value = isNaN(+value) && isNaN(+fValues[0]) && isNaN(+fValues[1])? value: +value;
                    isValidLine = value < fValues[0] && value > fValues[1];
                    break;
                case "notonorbefore": 
                    index = index;
                    isValidLine = fValues[0].length - index != value.length;
                    break;
                case "noton":
                    index = index;
                    isValidLine = !(index != -1 && index > 1 && (fValues[0].length - index != value.length));
                    break;
                case "on": 
                    index = index;
                    isValidLine = index != -1 && index > 1 && (fValues[0].length - index != value.length);
                    break;
                case "onorafter": 
                    index = index;
                    isValidLine = index != -1 && index > 1;
                    break;
                case "onorbefore": 
                    index = index;
                    isValidLine = index != -1 && !(fValues[0].length - index != value.length);
                    break;
                case "startswith": 
                case "notonorafter":
                    isValidLine = !index;
                break;
            }
        }
        return isValidLine;
    }

    return {
        onRequest: onRequest
    }
});
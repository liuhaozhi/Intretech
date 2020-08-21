/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 *@author Charles Zhang
 *@description 计划单投放的处理
 */
define([
    'N/record',
    'N/search',
    'N/runtime',
    'N/query',
    'N/format',
    '../../app/app_get_purchase_price',
], function (
    recordMod,
    searchMod,
    runtimeMod,
    queryMod,
    formatMod,
    appGetPurPrice,
) {

    const mrpRecType = 'customrecordmrp_planned_order';
    const taskRecType = 'customrecord_pl_platform_task_record';
    const taskDetailFieldId = 'custrecord_pl_platform_task_detail';
    const prRecType = 'customrecord_purchase_application';
    const successFlag = 'success';
    const failFlag = 'fail';
    const approvedStatus = '2';
    const touFangStatus = '3';
    const prApprovedStatus = '2';

    function getCurrentChinaDate() {
        const dateString = formatMod.format({
            value: new Date(),
            type: formatMod.Type.DATETIMETZ,
            timezone: formatMod.Timezone.ASIA_HONG_KONG
        });
        const dateObj = formatMod.parse({
            value: dateString,
            type: formatMod.Type.DATE
        });
        return dateObj;
    }

    function validateParent(parentRec) {
        const inactiveFieldId = 'isinactive';
        const splitedFieldId = 'custrecord_splited';
        const mergedFieldId = 'custrecord_platform_merged';
        const toLineFieldId = 'custrecord_to_line';
        const relatePrFieldId = 'custrecord_platform_related_pr';
        const planStatusFieldId = 'custrecord_status_plan';

        const isParentInactive = parentRec.getValue({
            fieldId: inactiveFieldId
        });
        const isParentSplited = parentRec.getValue({
            fieldId: splitedFieldId
        });
        const isParentMerged = parentRec.getValue({
            fieldId: mergedFieldId
        });
        const relatedLines = parentRec.getValue({
            fieldId: toLineFieldId
        });
        const replatedPr = parentRec.getValue({
            fieldId: relatePrFieldId
        });
        const planStatus = parentRec.getValue({
            fieldId: planStatusFieldId
        });

        if (isParentInactive === true) {
            throw new Error('该记录已被禁用');
        }
        if (isParentSplited === true) {
            throw new Error('该记录已被拆分');
        }
        if (isParentMerged === true) {
            throw new Error('该记录已被合并');
        }
        if (relatedLines.length !== 0) {
            throw new Error('该记录已有相关TO Line记录');
        }
        if (replatedPr) {
            throw new Error('该记录已被投放');
        }
        if(planStatus != approvedStatus){
            throw new Error('该记录状态不是已审核');
        }

        return {
            inactiveFieldId,
            splitedFieldId,
            mergedFieldId,
            toLineFieldId,
            relatePrFieldId,
            planStatusFieldId,
        }
    }

    //entry points
    function getInputData(context) {
        const paramFieldId = 'custscript_q_pl_to_pr_trans';
        const currentScript = runtimeMod.getCurrentScript();
        const inputParams = currentScript.getParameter({ name: paramFieldId });
        const { lines, taskRecId } = JSON.parse(inputParams);
        const transformList = {};
        for (const { custpage_internalid: planId } of lines) {
            transformList[planId] = { planId, taskRecId };
        }

        return transformList;
    }

    function map(context) {
        const { key: planId, value, isRestarted } = context;
        const relatePrFieldId = 'custrecord_platform_related_pr';
        const relatePlFieldId = 'custrecord_plan_order_num_pr';
        let taskRecId = '';
        const plToPrFieldMap = new Map([
            ['custrecord_plan_people', 'custrecord_platform_pr_applier'],//申请人
            ['custrecord_plan_date', 'custrecord_platform_pr_pur_date'],//建议采购日期
            ['custrecord_item_nums', 'custrecord_item_num_pr'],//物料长代码
            ['custrecord_platform_item_name', 'custrecord_platform_pr_item_name'],//物料名称
            ['custrecord_item_model', 'custrecord_item_model_pr'],//规格型号
            ['custrecord_common_mode', 'custrecord_common_mode_pr'],//是否共模
            ['custrecord_suggested_order_quantity', 'custrecord_platform_pr_number'],//数量
            ['custrecord_net_requirement', 'custrecord_net_requirement_pr'],//净需求
            ['custrecord_platform_uom', 'custrecord_platform_pr_unit'],//采购单位
            ['custrecord_platform_end_date', 'custrecord_platform_pr_receipt_date'],//到货日期
            ['custrecord_platform_attributes', 'custrecord_platform_pr_attributes'],//辅助属性
            ['custrecord_platform_assist_attribute', 'custrecord_platform_pr_attri_id'],//辅助属性代码
            ['custrecord_lead_time', 'custrecord_lead_time_p'],//固定提前期
            ['custrecord_commonly_used_models', 'custrecord_commonly_used_models_pr'],//适用机型
            ['custrecord_minimum_packing_quantity', 'custrecord_minimum_packing_quantity_p'],//批量增量
            ['custrecord_platform_item_sub', 'custrecord_platform_pr_item_sub'],//物料替代
            ['custrecord_platform_so_type', 'custrecord_platform_pr_order_type'],//销售订单类别
            ['custrecord_platform_cus_num', 'custrecord_platform_pr_cus_id'],//客户代码
            ['custrecord_platform_project_num', 'custrecord_platform_pr_pro_id'],//项目代码
            ['custrecord_whether_to_sign_samples', 'custrecord_whether_to_sign_samples_pr'],//是否签样
            ['custrecord_humidity_sensitivity', 'custrecord_humidity_sensitivity_pr'],//湿敏等级
            ['custrecord_specifications_and_models', 'custrecord_specifications_and_models_pr'],//原厂规格型号
            ['custrecord_whether_conventional', 'custrecord_whether_conventional_pr'],//是否常规
            ['custrecord_safety_regulations', 'custrecord_safety_regulations_pr'],//是否安规器件
            ['custrecord_crux', 'custrecord_crux_pr'],//是否关键件
            ['custrecord_ncnr', 'custrecord_ncnr_pr'],//是否NCNR
            ['custrecord_cancellation_window_peri', 'custrecord_cancellation_window_peri_pr'],//订单取消窗口期
            ['custrecord_theoriginal', 'custrecord_theoriginal_pr'],//是否盈趣专用（原厂处）
            ['custrecord_agency', 'custrecord_agency_pr'],//是否盈趣专用（代理处）
            ['custrecord_item_status_plan', 'custrecord_item_status_plan_pr'],//物料状态
            ['custrecord_wo_item', 'custrecord_pr_wo_item'],//
            ['custrecord_software_version', 'custrecord_software_version_pr'],//
            ['custrecord_wip_so_memo', 'custrecord_wip_so_memo_pr'],//
            ['custrecord_wip_so_abstract', 'custrecord_wip_so_abstract_pr'],//
            ['custrecord_platform_pl_subsidiary', 'custrecord_platform_pr_subsidiary'],//
            ['custrecord_cux_mrp_k3_po_number', 'custrecord_cux_mrp_k3_po_number_pr'],
            ['custrecord_cux_mrp_k3_po_line', 'custrecord_cux_mrp_k3_po_line_pr'],
            ['custrecord_platform_approver', 'custrecord_platform_pr_applier']
        ]);

        try {
            ({ taskRecId } = JSON.parse(value));

            //加载计划单
            const planRec = recordMod.load({
                type: mrpRecType,
                id: planId
            });

            //重复数据检测
            if (isRestarted) {
                let prId = null;
                searchMod.create({
                    type: prRecType,
                    filters: [
                        {
                            name: relatePlFieldId,
                            operator: 'anyof',
                            values: [planId]
                        }
                    ],
                    columns: [
                        {
                            name: 'internalid',
                            sort: searchMod.Sort.DESC
                        }
                    ]
                }).run().each(result => {
                    prId = result.id;
                    return false;
                });
                if (prId) {
                    const prOnPlan = planRec.getValue({ fieldId: relatePrFieldId });
                    if (!prOnPlan) {
                        planRec.setValue({
                            fieldId: relatePrFieldId,
                            value: prId
                        });
                        planRec.save({
                            ignoreMandatoryFields: true
                        });
                    }

                    //输出
                    context.write({
                        key: planId,
                        value: {
                            status: successFlag,
                            planId,
                            prId,
                            taskRecId,
                        }
                    });
                    return true;
                }
            }

            //验证计划单是否可被投放
            validateParent(planRec);

            //创建合并的记录
            const prRec = recordMod.create({
                type: prRecType,
                isDynamic: true
            });

            //先设置直接流转的字段值
            for (const [plFieldId, prFieldId] of plToPrFieldMap) {
                const plValue = planRec.getValue({ fieldId: plFieldId });
                if (plValue !== '') {
                    prRec.setValue({
                        fieldId: prFieldId,
                        value: plValue
                    });
                }
            }

            //再设置特殊的规则的值
            //计划单号
            prRec.setValue({
                fieldId: relatePlFieldId,
                value: planId
            });
            //日期
            const todayDateObj = getCurrentChinaDate();
            prRec.setValue({
                fieldId: 'custrecord_platform_pr_create_date',
                value: todayDateObj
            });
            //业务类型
            prRec.setValue({
                fieldId: 'custrecord_order_type_pr',
                value: '1'//生产类采购
            });
            //审批状态
            prRec.setValue({
                fieldId: 'custrecord_status_plan_pr',
                value: prApprovedStatus//已审核
            });
            //制单人
            const currentUser = runtimeMod.getCurrentUser();
            prRec.setValue({
                fieldId: 'custrecord_platform_pr_creator',
                value: currentUser.id
            });

            //查询价格和供应商信息
            const itemId = prRec.getValue({ fieldId: 'custrecord_item_num_pr' });
            const itemQty = prRec.getValue({ fieldId: 'custrecord_platform_pr_number' }) || 0;
            const currency = prRec.getValue({ fieldId: 'custrecord_platform_pr_currency' });
            const subsidiary = prRec.getValue({ fieldId: 'custrecord_platform_pr_subsidiary' });
            const itemInfo = { [itemId]: itemQty };
            let lowestPriceVendor = '';
            let lastestPriceVendor = '';
            let isLevelPrice = false;
            const { status, results: priceInfo } = appGetPurPrice.getOutPurchPrice({
                itemInfo,
                subsidiary,
                currency,
                reqLatest: true,
            });
            // log.debug('currency', currency);
            // log.debug('priceInfo', priceInfo);
            // log.debug('status', status);
            if (status === 'success') {
                const { [itemId]: curItemPrice } = priceInfo;
                if (curItemPrice) {
                    const { lowest, latest } = curItemPrice;
                    if (lowest) {
                        ({ vendorId: lowestPriceVendor, isLevelPrice } = lowest);
                    }
                    if (latest) {
                        ({ vendorId: lastestPriceVendor } = latest);
                    }
                }
            }
            //供应商
            prRec.setValue({
                fieldId: 'custrecord_plan_vendor_pr',
                value: lowestPriceVendor
            });
            //最新供应商名称
            prRec.setValue({
                fieldId: 'custrecord_platform_reference_vender',
                value: lastestPriceVendor
            });
            //是否阶梯报价
            prRec.setValue({
                fieldId: 'custrecord_step_price_pr',
                value: isLevelPrice
            });

            //换算率-取该物料记录上采购单位和库存单位的换算，比率为：采购单位：库存单位
            let { purchaseunit: [purchaseUnit], stockunit: [stockUnit] } = searchMod.lookupFields({
                type: 'item',
                id: itemId,
                columns: ['purchaseunit', 'stockunit']
            });
            //查询单位换算
            let unitRate = 0;
            if (purchaseUnit && stockUnit) {
                const { value: purchUnitId } = purchaseUnit;
                const { value: stockUnitId } = stockUnit;
                if (purchUnitId === stockUnitId) {
                    unitRate = 1;
                } else {
                    const queryObj = queryMod.create({
                        type: queryMod.Type.UNITS_TYPE
                    });
                    const unitLineJoin = queryObj.autoJoin({
                        fieldId: 'uom'
                    });
                    queryObj.condition = unitLineJoin.createCondition({
                        fieldId: 'internalid',
                        operator: queryMod.Operator.ANY_OF,
                        values: [purchUnitId, stockUnitId]
                    });
                    queryObj.columns = [
                        unitLineJoin.createColumn({
                            fieldId: 'internalid'
                        }),
                        unitLineJoin.createColumn({
                            fieldId: 'conversionrate'
                        }),
                    ];
                    const resultSet = queryObj.run();
                    const [firstUnit, secondUnit] = resultSet.asMappedResults();
                    if (+firstUnit.internalid === +purchUnitId) {
                        unitRate = firstUnit.conversionrate / secondUnit.conversionrate;
                    } else {
                        unitRate = secondUnit.conversionrate / firstUnit.conversionrate;
                    }

                    unitRate = +unitRate.toFixed(6);
                }
            }
            const assistQty = +(itemQty * unitRate).toFixed(6) || 0;
            //换算率
            prRec.setValue({
                fieldId: 'custrecord_platform_pr_exc_rate',
                value: unitRate
            });
            //辅助数量
            prRec.setValue({
                fieldId: 'custrecord_platform_pr_assist_number',
                value: assistQty
            });

            //源单单号
            const plSourceSo = planRec.getValue({ fieldId: 'custrecord_platform_source_number' });
            const plForecastSo = planRec.getValue({ fieldId: 'custrecord_platform_forecast_number' });
            let prSourceOrder = [];
            let prSourceOrderType = '';
            if (plSourceSo.length) {
                prSourceOrder = plSourceSo;
                prSourceOrderType = '1';//销售订单
            } else if (plForecastSo.length) {
                prSourceOrder = plForecastSo;
                prSourceOrderType = '2';//预测单
            }
            prRec.setValue({
                fieldId: 'custrecord_create_num_pr',
                value: prSourceOrder
            });
            //源单类型
            prRec.setValue({
                fieldId: 'custrecord_platform_pr_source_type',
                value: prSourceOrderType
            });
            //审核日期
            prRec.setValue({
                fieldId: 'custrecord_platform_pr_approval_date',
                value: todayDateObj
            });

            const prId = prRec.save({
                ignoreMandatoryFields: true
            });

            //更新父记录
            planRec.setValue({
                fieldId: relatePrFieldId,
                value: prId
            });
            // planRec.setValue({
            //     fieldId: 'isinactive',
            //     value: true,
            // });
            planRec.setValue({
                fieldId: 'custrecord_status_plan',
                value: touFangStatus,//已投放
            });
            planRec.save({
                ignoreMandatoryFields: true
            });

            //输出
            context.write({
                key: planId,
                value: {
                    status: successFlag,
                    planId,
                    prId,
                    taskRecId,
                }
            });
            return true;
        } catch (ex) {
            log.error({
                title: `投放计划单${planId}时出错`,
                details: {
                    ex,
                    value
                }
            });

            //输出
            context.write({
                key: planId,
                value: {
                    status: failFlag,
                    message: ex.message,
                    planId,
                    taskRecId,
                }
            });
            return false;
        }
    }

    function summarize(summary) {
        const { mapSummary, output } = summary;
        let targetTaskRecId = null;

        //记录系统级错误
        mapSummary.errors.iterator().each((key, error, executionNo) => {
            log.error({
                title: `第${executionNo}次投放计划单${key}时出错`,
                details: error
            });
            return true;
        });

        //遍历结果
        const resultSummary = new Set();
        output.iterator().each((planId, info) => {
            const { taskRecId, ...resultInfo } = JSON.parse(info);
            if (!targetTaskRecId) {
                targetTaskRecId = taskRecId;
            }
            resultSummary.add(resultInfo);
            return true;
        });

        try {
            recordMod.submitFields({
                type: taskRecType,
                id: targetTaskRecId,
                values: {
                    [taskDetailFieldId]: JSON.stringify([...resultSummary])
                },
                options: {
                    ignoreMandatoryFields: true
                }
            });
        } catch (ex) {
            log.error({
                title: `更新任务记录${targetTaskRecId}详情失败`,
                details: ex
            });
        }
    }

    return {
        getInputData,
        map,
        summarize
    }
});
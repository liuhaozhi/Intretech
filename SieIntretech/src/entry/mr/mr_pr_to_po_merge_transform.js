/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 *@author Charles Zhang
 *@description 请购单合并下推的处理
 */
define([
    'N/record',
    'N/search',
    'N/runtime',
    'N/format',
    'N/error',
], function (
    recordMod,
    searchMod,
    runtimeMod,
    formatMod,
    errorMod,
) {

    const prRecType = 'customrecord_purchase_application';
    const poRecType = 'purchaseorder';
    const taskRecType = 'customrecord_pl_platform_task_record';
    const secondTaskDetailFieldId = 'custrecord_pl_platform_task_detail_p2';
    const prStatusFieldId = 'custrecord_status_plan_pr';
    const prRemainQtyFieldId = 'custrecord_platform_pr_not_order_number';
    const prOrderTypeFieldId = 'custrecord_order_type_pr';
    const prDepartmentFieldId = 'custrecord_apply_for_department_pr';
    const prCurrencyFieldId = 'custrecord_platform_pr_currency';
    const prCreatorFieldId = 'custrecord_platform_pr_creator';
    const prMemoFieldId = 'custrecord_memo_plan_pr';
    const prApplierFieldId = 'custrecord_platform_pr_applier';
    const prItemFieldId = 'custrecord_item_num_pr';
    const approvedStatus = '2';
    const closedStatus = '6';

    function parseDate(dateStr) {
        let dateObj = '';
        if (dateStr) {
            dateObj = formatMod.parse({
                type: formatMod.Type.DATE,
                value: dateStr
            });
        }

        return dateObj;
    }

    function validateSource(resultList) {
        //验证货币是否一致
        const [{ [prCurrencyFieldId]: baseCurrency }, ...restEntries] = resultList;
        for (const { [prCurrencyFieldId]: currentCurrency } of restEntries) {
            if (currentCurrency != baseCurrency) {
                throw errorMod.create({
                    name: 'CURRENCY_MISMATCH',
                    message: '合并的条目货币不一致'
                });
            }
        }

        //验证状态 和 剩余下推数量
        for (const { [prStatusFieldId]: currentStatus, [prRemainQtyFieldId]: currentRemainQty, internalid } of resultList) {
            if (currentStatus != approvedStatus) {
                throw errorMod.create({
                    name: 'INVALID_STATUS',
                    message: `ID为${internalid}的自定义PR的状态不是已审核`
                });
            }
            const currentRemainQtyNum = +currentRemainQty;
            if (currentRemainQtyNum <= 0) {
                throw errorMod.create({
                    name: 'NONE_REMAIN_QTY',
                    message: `ID为${internalid}的自定义PR的已没有剩余可推数量`
                });
            }
        }

        return true;
    }

    function getOneOfPrResult(resultList, prFieldId) {
        const result = resultList.find(({ [prFieldId]: value }) => !!value);
        return result ? result[prFieldId] : '';
    }

    function getStringCombinedResult(resultList, prFieldId) {
        return resultList.map(({ [prFieldId]: value }) => value).filter(value => !!value).join('/').slice(0, 300);
    }

    //entry points
    function getInputData(context) {
        const paramFieldId = 'custscript_q_pr_po_merge_trans_source';
        const currentScript = runtimeMod.getCurrentScript();
        const inputParams = currentScript.getParameter({ name: paramFieldId });
        const mergeObj = JSON.parse(inputParams);
        // const { lines, taskRecId } = JSON.parse(inputParams);
        // const mergeMap = new Map();
        // const lineMap = new Map();
        // const prIds = new Set();

        //将数据源转换为键值对，方便查找
        // for (const { internalid, transformQty } of lines) {
        //     lineMap.set(String(internalid), transformQty);
        //     prIds.add(internalid);
        // }

        // //搜索请购单的子公司和供应商，以此进行合并下推
        // const searchObj = searchMod.create({
        //     type: prRecType,
        //     filters: [
        //         {
        //             name: 'internalid',
        //             operator: 'anyof',
        //             values: [...prIds]
        //         }
        //     ],
        //     columns: [
        //         {
        //             name: prSubsidiaryFieldId
        //         },
        //         {
        //             name: prVendorFieldId
        //         },
        //     ]
        // });
        // searchObj.run().each(result => {
        //     const { id: prId } = result;
        //     const subsidiaryId = result.getValue({ name: prSubsidiaryFieldId });
        //     const vendorId = result.getValue({ name: prVendorFieldId });
        //     const groupKey = `${subsidiaryId}-${vendorId}`;
        //     const transformQty = lineMap.get(String(prId));
        //     //初始化
        //     if (!mergeMap.has(groupKey)) {
        //         mergeMap.set(groupKey, { taskRecId, list: [] });
        //     }
        //     mergeMap.get(groupKey).list.push({ prId, transformQty, subsidiaryId, vendorId });
        //     return true;
        // });

        // const mergeObj = Object.fromEntries(mergeMap);
        // log.debug('mergeObj', mergeObj);

        return mergeObj;
    }

    function map(context) {
        const { key, value, isRestarted } = context;
        let transformList = [];
        let prIds = [];
        let stPrId = null;
        let poId = null;
        let message = '';
        let taskRecId = '';
        const stPrItemSublistId = 'item';
        const poItemSublistId = 'item';
        const prToStPrLineFieldMap = new Map([
            ['custrecord_plan_vendor_pr', 'custcol_pr_cheapest_vendor'],
            ['custrecord_platform_pr_pur_date', 'custcol_pr_suggest_date'],
            ['custrecord_common_mode_pr', 'custcol_whether_common_mode_send'],
            ['custrecord_net_requirement_pr', 'custcol_pr_gross_demand'],
            ['custrecord_platform_pr_assist_number', 'custcol_pr_assist_number'],
            ['custrecord_platform_pr_unit', 'units'],
            ['custrecord_platform_pr_reference_unit', 'custcol_pr_assist_unit'],
            ['custrecord_platform_pr_exc_rate', 'custcol_po_conversion_rate'],
            ['custrecord_platform_pr_sign', 'custcol_pr_invalid_sign_send'],
            ['custrecord_platform_pr_receipt_date', 'expectedreceiptdate'],
            ['custrecord_create_num_pr', 'custcol_pr_source_number'],
            ['custrecord_plan_order_num_pr', 'custcol_pr_plan_order'],
            ['custrecord_platform_pr_item_usage', 'custcol_pr_usage'],
            ['custrecord_platform_pr_attributes', 'custcol_pr_assis_type'],
            ['custrecord_platform_pr_attri_id', 'custcol_pr_assist_attribute_code'],
            ['custrecord_platform_pr_source_type', 'custcol_pr_source_type'],
            ['custrecord_lead_time_p', 'custcol_po_lead_time'],
            ['custrecord_platform_pr_change_note', 'custcol_pr_change_memo'],
            ['custrecord_platform_pr_line_memo', 'custcol_po_line_memo'],
            ['custrecord_commonly_used_models_pr', 'custcol_pr_machine_type'],
            ['custrecord_minimum_packing_quantity_p', 'custcol_pr_mim_quantutity'],
            ['custrecord_platform_pr_item_sub', 'custcol_po_item_subsitution'],
            ['custrecord_platform_pr_order_type', 'custcol_pr_sale_order_type'],
            ['custrecord_platform_pr_cus_id', 'custcol_pr_customer_list'],
            ['custrecord_platform_pr_pro_id', 'custcol_pr_project_list'],
            ['custrecord_whether_to_sign_samples_pr', 'custcol_po_sample_or_not_send'],
            ['custrecord_humidity_sensitivity_pr', 'custcol_pr_humidity_grade'],
            ['custrecord_specifications_and_models_pr', 'custcol_pr_factory_model'],
            ['custrecord_whether_conventional_pr', 'custcol_pr_convention_or_not_send'],
            ['custrecord_safety_regulations_pr', 'custcol_pr_safety_regular_send'],
            ['custrecord_crux_pr', 'custcol_pr_key_component'],
            ['custrecord_ncnr_pr', 'custcol_pr_ncnr_or_not_send'],
            ['custrecord_cancellation_window_peri_pr', 'custcol_pr_cancel_window'],
            ['custrecord_theoriginal_pr', 'custcol_pr_throriginal_or_not_send'],
            ['custrecord_agency_pr', 'custcol_pr_agency_or_not'],
            ['custrecord_item_status_plan_pr', 'custcol_pr_item_status'],
            ['custrecord_cux_mrp_k3_po_line_pr', 'custcol_k3_line_number'],
            ['custrecord_cux_mrp_k3_po_number_pr', 'custcol_cux_k3_po_number']
        ]);
        const assistColumns = new Set([
            prOrderTypeFieldId,//业务类型
            prDepartmentFieldId,
            prCurrencyFieldId,
            prCreatorFieldId,
            prMemoFieldId,
            prApplierFieldId,
            prItemFieldId,
            prStatusFieldId,
            prRemainQtyFieldId,
        ]);
        const dateFieldIds = new Set([
            'custrecord_platform_pr_pur_date',
            'custrecord_platform_pr_receipt_date',
        ]);
        const multiSelectFieldIds = new Set([
            'custrecord_create_num_pr',
            'custrecord_platform_pr_order_type',
            'custrecord_platform_pr_cus_id',
            'custrecord_platform_pr_pro_id',
        ]);

        try {
            ({ taskRecId, list: transformList } = JSON.parse(value));
            prIds = transformList.map(({ prId }) => prId);
            const currentUser = runtimeMod.getCurrentUser();

            //将数量和计划单转换为map结构，方便查找数量
            const prIdQtyMap = transformList.reduce((total, { prId, transformQty }) => {
                total[prId] = transformQty;
                return total;
            }, Object.create(null));

            //重复数据检测-这里由于自定义PR和标准的PR，PO形成一对多的关系，很难检测是否重复，故直接输出
            if (isRestarted) {
                //直接输出
                for (const { prId, transformQty, subsidiaryId, vendorId } of transformList) {
                    context.write({
                        key: prId,
                        value: {
                            prId,
                            stPrId,
                            poId,
                            transformQty,
                            message,
                            taskRecId,
                            subsidiaryId,
                            vendorId,
                        }
                    });
                }
            }

            //验证子公司，供应商
            const [{ subsidiaryId, vendorId }] = transformList;
            if (!subsidiaryId) {
                throw errorMod.create({
                    name: 'NO_SUBSIDIARY',
                    message: '请购单缺少子公司'
                });
            }
            if (!vendorId) {
                throw errorMod.create({
                    name: 'NO_VENDOR',
                    message: '请购单缺少供应商'
                });
            }

            //收集供应商信息
            const vendorSubsidarySublistId = 'submachine';
            const vendorRec = recordMod.load({
                type: 'vendor',
                id: vendorId,
            });
            const vendorSubsidaryLineCount = vendorRec.getLineCount({
                sublistId: vendorSubsidarySublistId
            });
            let specifiedPurchaser = '';
            let vendorTaxCode = '';
            for (let i = 0; i < vendorSubsidaryLineCount; i++) {
                const currentSubsidary = vendorRec.getSublistValue({
                    sublistId: vendorSubsidarySublistId,
                    fieldId: 'subsidiary',
                    line: i,
                });
                if (currentSubsidary == subsidiaryId) {
                    specifiedPurchaser = vendorRec.getSublistValue({
                        sublistId: vendorSubsidarySublistId,
                        fieldId: 'custrecord_vendor_maintentor',
                        line: i,
                    });
                    vendorTaxCode = vendorRec.getSublistValue({
                        sublistId: vendorSubsidarySublistId,
                        fieldId: 'taxitem',
                        line: i,
                    });
                    break;
                }
            }
            //如果供应商没有维护税码，直接报错
            if (!vendorTaxCode) {
                throw errorMod.create({
                    name: 'NO_VENDOR_TAX_CODE',
                    message: `供应商${vendorId}在子公司${subsidiaryId}下没有维护税码`
                });
            }

            //搜索原请购单单据信息
            const resultList = [];
            const filters = [
                {
                    name: 'internalid',
                    operator: 'anyof',
                    values: prIds
                }
            ];
            const columns = [
                ...[...prToStPrLineFieldMap.keys()].map(name => ({ name })),
                ...[...assistColumns].map(name => ({ name })),
                {
                    name: 'internalid',
                    sort: searchMod.Sort.DESC
                },
                {
                    name: 'isinactive'
                }
            ];
            const searchObj = searchMod.create({
                type: prRecType,
                filters,
                columns,
            });
            searchObj.run().each(result => {
                const { columns } = result;
                const resultEntry = {};
                for (const column of columns) {
                    resultEntry[column.name] = result.getValue(column);
                }
                resultList.push(resultEntry);
                return true;
            });

            //验证自定义PR是否有效
            validateSource(resultList);
            //创建采购订单
            const poRec = recordMod.create({
                type: poRecType,
                isDynamic: true,
            });
            //设置头部字段
            //请求者
            const prApplier = getOneOfPrResult(resultList, prApplierFieldId) || currentUser.id;
            if (!prApplier) {
                throw errorMod.create({
                    name: 'NO_APPLIER',
                    message: '采购订单单缺少申请人'
                });
            }
            //供应商
            poRec.setValue({
                fieldId: 'entity',
                value: vendorId,
            });
            //子公司
            poRec.setValue({
                fieldId: 'subsidiary',
                value: subsidiaryId,
            });
            //采购类型
            poRec.setValue({
                fieldId: 'custbody_po_list_pur_type',
                value: getOneOfPrResult(resultList, prOrderTypeFieldId),
            });
            //部门
            poRec.setValue({
                fieldId: 'department',
                value: getOneOfPrResult(resultList, prDepartmentFieldId),
            });
            //币别
            poRec.setValue({
                fieldId: 'currency',
                value: getOneOfPrResult(resultList, prCurrencyFieldId),
            });
            //制单人
            poRec.setValue({
                fieldId: 'custbody_po_buyer',
                value: currentUser.id,
            });
            //备注
            poRec.setValue({
                fieldId: 'memo',
                value: getStringCombinedResult(resultList, prMemoFieldId),
            });
            //业务员
            poRec.setValue({
                fieldId: 'custbody_pc_salesman',
                value: prApplier,
            });
            //审批状态
            poRec.setValue({
                fieldId: 'approvalstatus',
                value: '1',//等待核准
            });
            //专营采购员-从供应商表单中的“子公司”子列表中根据当前采购订单的子公司选择“专营采购员”
            poRec.setValue({
                fieldId: 'employee',
                value: specifiedPurchaser,
            });
            var fieldIds = [];
            //设置行上的值
            for (resultEntry of resultList) {
                poRec.selectNewLine({
                    sublistId: stPrItemSublistId
                });

                //物料
                poRec.setCurrentSublistValue({
                    sublistId: stPrItemSublistId,
                    fieldId: 'item',
                    value: resultEntry[prItemFieldId]
                });

                //数量
                poRec.setCurrentSublistValue({
                    sublistId: stPrItemSublistId,
                    fieldId: 'quantity',
                    value: prIdQtyMap[resultEntry.internalid]
                });

                //CUX-PR单号
                poRec.setCurrentSublistValue({
                    sublistId: stPrItemSublistId,
                    fieldId: 'custcol_pr_cux_pr_doc_number',
                    value: resultEntry['internalid']
                });
                
                //统一处理一一对应的值
                for (const [prFieldId, stPrFieldId] of prToStPrLineFieldMap) {
                    let { [prFieldId]: prValue } = resultEntry;
                    if (prValue !== '') {
                        if (dateFieldIds.has(prFieldId)) {
                            prValue = parseDate(prValue);
                        } else if (multiSelectFieldIds.has(prFieldId)) {
                            prValue = Array.isArray(prValue)? prValue.join(','): prValue ;
                        }
                        try{
                            poRec.setCurrentSublistValue({
                                sublistId: stPrItemSublistId,
                                fieldId: stPrFieldId,
                                value: prValue
                            });
                        }catch(e) {
                            fieldIds.push(stPrFieldId);
                        }
                    }
                }
                poRec.commitLine({
                    sublistId: stPrItemSublistId
                });
            }
            log.debug("NotExistField", fieldIds + "");

            //收集行上的值
            let itemIds = new Set();
            const poLineCount = poRec.getLineCount({
                sublistId: poItemSublistId
            });
            for (let i = 0; i < poLineCount; i++) {
                const itemId = poRec.getSublistValue({
                    sublistId: poItemSublistId,
                    fieldId: 'item',
                    line: i
                });
                itemIds.add(itemId);
            }
            itemIds = [...itemIds];

            //搜索本年累计采购量
            const itemPurchThisYearMap = new Map();
            const itemPurchThisYearSearch = searchMod.load({
                id: 'customsearch_item_purchased_this_year_2'
            });
            itemPurchThisYearSearch.filters = [
                ...itemPurchThisYearSearch.filters,
                {
                    name: 'item',
                    operator: 'anyof',
                    values: itemIds
                }
            ];
            itemPurchThisYearSearch.run().each(result => {
                const { columns } = result;
                const itemId = result.getValue(columns[0]);
                const itemQty = result.getValue(columns[1]);
                itemPurchThisYearMap.set(itemId, itemQty);
                return true;
            });

            //搜索未交总数
            const unreceiptMap = new Map();
            const unreceiptSearch = searchMod.load({
                id: 'customsearch_po_unreceipt_2'
            });
            unreceiptSearch.filters = [
                ...unreceiptSearch.filters,
                {
                    name: 'item',
                    operator: 'anyof',
                    values: itemIds
                }
            ];
            unreceiptSearch.run().each(result => {
                const { columns } = result;
                const itemId = result.getValue(columns[0]);
                const itemQty = result.getValue(columns[1]);
                unreceiptMap.set(itemId, itemQty);
                return true;
            });

            //搜索物料默认仓库
            const itemDefaultWarehouseMap = new Map();
            searchMod.create({
                type: 'item',
                filters: [
                    {
                        name: 'internalid',
                        operator: 'anyof',
                        values: itemIds
                    },
                    {
                        name: 'custrecord_intercompany_subsidiary',
                        join: 'custrecord_link_field',
                        operator: 'anyof',
                        values: [subsidiaryId]
                    }
                ],
                columns: [
                    {
                        name: 'custrecord_default_warehouse',
                        join: 'custrecord_link_field',
                    }
                ]
            }).run().each(result => {
                const itemId = String(result.id);
                const defaultWarehouse = result.getValue({
                    name: 'custrecord_default_warehouse',
                    join: 'custrecord_link_field',
                });
                itemDefaultWarehouseMap.set(itemId, defaultWarehouse);
                return true;
            });

            //设置行上的值
            for (let i = 0; i < poLineCount; i++) {
                poRec.selectLine({
                    sublistId: poItemSublistId,
                    line: i
                });
                let itemId = poRec.getCurrentSublistValue({
                    sublistId: poItemSublistId,
                    fieldId: 'item',
                });
                itemId = String(itemId);

                //含税单价-单价*（1+税率）-交由价格表功能处理，因为单价在价格表获取
                // poRec.setCurrentSublistValue({
                //     sublistId: poItemSublistId,
                //     fieldId: '',
                //     value: ''
                // });

                //交货日期
                let poReceiptDate = resultList[i]['custrecord_platform_pr_receipt_date'];
                if (poReceiptDate) {
                    poReceiptDate = parseDate(poReceiptDate);
                    poRec.setCurrentSublistValue({
                        sublistId: poItemSublistId,
                        fieldId: 'expectedreceiptdate',
                        value: poReceiptDate
                    });
                }

                //本年累计采购量
                poRec.setCurrentSublistValue({
                    sublistId: poItemSublistId,
                    fieldId: 'custcol_po_accumulate_number',
                    value: itemPurchThisYearMap.get(itemId) || ''
                });

                //未交总数
                poRec.setCurrentSublistValue({
                    sublistId: poItemSublistId,
                    fieldId: 'custcol_po_undelivered_total',
                    value: unreceiptMap.get(itemId) || ''
                });

                //交货地点
                poRec.setCurrentSublistValue({
                    sublistId: poItemSublistId,
                    fieldId: 'location',
                    value: itemDefaultWarehouseMap.get(itemId) || ''
                });

                //税码
                poRec.setCurrentSublistValue({
                    sublistId: poItemSublistId,
                    fieldId: 'taxcode',
                    value: vendorTaxCode
                });
                poRec.commitLine({
                    sublistId: poItemSublistId,
                });
            }

            //保存po
            poId = poRec.save({
                ignoreMandatoryFields: true
            });
        } catch (ex) {
            message = `下推失败，错误提示：${ex.message}`;
            log.error({
                title: `下推${key}组合的PR时出错`,
                details: {
                    ex,
                    value
                }
            });
        }

        //输出
        for (const { prId, transformQty, subsidiaryId, vendorId } of transformList) {
            context.write({
                key: prId,
                value: {
                    prId,
                    stPrId,
                    poId,
                    transformQty,
                    message,
                    taskRecId,
                    subsidiaryId,
                    vendorId,
                }
            });
        }
    }

    function reduce(context) {//由于下推数量可能较大，所以需要reduce来处理回写
        const { key: prId, values, isRestarted } = context;
        const [prInfo] = values;
        let { stPrId, poId, transformQty, message, taskRecId, subsidiaryId, vendorId, } = JSON.parse(prInfo);
        const qtyFieldId = 'custrecord_platform_pr_number';
        const alreadyTransQtyFieldId = 'custrecord_platform_pr_related_number';
        const statusFieldId = prStatusFieldId;
        const stPrFieldId = 'custrecord_pr_related_pr';
        const poFieldId = 'custrecord_platform_related_po_id';

        try {
            if (prId && (stPrId || poId)) {
                const prRec = recordMod.load({
                    type: prRecType,
                    id: prId,
                });

                //重复检测
                if (isRestarted) {
                    const existStPrIds = prRec.getValue({
                        fieldId: stPrFieldId
                    });
                    if (existStPrIds.map(id => String(id)).includes(String(stPrId))) {
                        context.write({
                            key: prId,
                            value: {
                                prId,
                                stPrId,
                                poId,
                                transformQty,
                                message,
                                taskRecId,
                                subsidiaryId,
                                vendorId,
                            }
                        });
                        return true;
                    }
                }

                //更新剩余可推数量和关联数量（已下推数量）
                const allQty = prRec.getValue({
                    fieldId: qtyFieldId
                }) || 0;
                const transformedQty = prRec.getValue({
                    fieldId: alreadyTransQtyFieldId
                }) || 0;
                let newTransformedQty = +transformQty + transformedQty;
                newTransformedQty = +newTransformedQty.toFixed(6);
                prRec.setValue({
                    fieldId: alreadyTransQtyFieldId,
                    value: newTransformedQty,
                });

                //更新状态-全部下推之后设置为已关闭，否则保持已审核不变
                if (newTransformedQty >= allQty) {
                    prRec.setValue({
                        fieldId: statusFieldId,
                        value: closedStatus,
                    });
                }

                //设置-关联标准PR
                if (stPrId) {
                    const currentStPrs = prRec.getValue({
                        fieldId: stPrFieldId
                    });
                    prRec.setValue({
                        fieldId: stPrFieldId,
                        value: [
                            ...currentStPrs,
                            stPrId,
                        ],
                    });
                }

                //设置-关联标准PO
                if (poId) {
                    const currentPos = prRec.getValue({
                        fieldId: poFieldId
                    });
                    prRec.setValue({
                        fieldId: poFieldId,
                        value: [
                            ...currentPos,
                            poId,
                        ],
                    });
                }

                prRec.save({
                    ignoreMandatoryFields: true
                });
            }
        } catch (ex) {
            message += `${message ? '<br />' : ''}自定义请购单${prId}回写失败，失败提示:${ex.message}`
            log.error({
                title: 'update custom pr error',
                details: {
                    ex,
                    values,
                }
            });
        }

        context.write({
            key: prId,
            value: {
                prId,
                stPrId,
                poId,
                transformQty,
                message,
                taskRecId,
                subsidiaryId,
                vendorId,
            }
        });
    }

    function summarize(summary) {
        const { mapSummary, reduceSummary, output } = summary;
        const groupMap = new Map();
        let targetTaskRecId;

        //记录系统级错误
        mapSummary.errors.iterator().each((key, error, executionNo) => {
            log.error({
                title: `第${executionNo}次下推组合为${key}的自定义请购单时出错`,
                details: error
            });
            return true;
        });
        reduceSummary.errors.iterator().each((key, error, executionNo) => {
            log.error({
                title: `第${executionNo}次更新回写自定义请购单${key}时出错`,
                details: error
            });
            return true;
        });

        //遍历结果-将结果重新组合为子公司和供应商分组的模式
        output.iterator().each((prId, info) => {
            const { taskRecId, subsidiaryId, vendorId, stPrId, poId,  ...resultInfo } = JSON.parse(info);
            if (!targetTaskRecId) {
                targetTaskRecId = taskRecId;
            }

            const groupKey = `${subsidiaryId}-${vendorId}`;
            if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, { subsidiaryId, vendorId, stPrId, poId, lines: [] });
            }
            groupMap.get(groupKey).lines.push(resultInfo);
            return true;
        });

        try {
            recordMod.submitFields({
                type: taskRecType,
                id: targetTaskRecId,
                values: {
                    [secondTaskDetailFieldId]: JSON.stringify([...groupMap.values()])
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
        reduce,
        summarize,
    }
});
/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 *@author Charles Zhang
 *@description 请购单下推委外工单和采购单
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
    const woRecType = 'workorder';
    const prSubsidiaryFieldId = 'custrecord_platform_pr_subsidiary';
    const prVendorFieldId = 'custrecord_plan_vendor_pr';
    const taskRecType = 'customrecord_pl_platform_task_record';
    const taskDetailFieldId = 'custrecord_pl_platform_task_detail';
    const secondDetailFieldId = 'custrecord_pl_platform_task_detail_p2';
    const prStatusFieldId = 'custrecord_status_plan_pr';
    const prRemainQtyFieldId = 'custrecord_platform_pr_not_order_number';
    const prOrderTypeFieldId = 'custrecord_order_type_pr';
    const prDepartmentFieldId = 'custrecord_apply_for_department_pr';
    const prCurrencyFieldId = 'custrecord_platform_pr_currency';
    const prCreatorFieldId = 'custrecord_platform_pr_creator';
    const prMemoFieldId = 'custrecord_memo_plan_pr';
    const prApplierFieldId = 'custrecord_platform_pr_applier';
    const prItemFieldId = 'custrecord_item_num_pr';
    const prReceiptDateFieldId = 'custrecord_platform_pr_receipt_date';
    const prWoItemFieldId = 'custrecord_pr_wo_item';
    const approvedStatus = '2';
    const partTransStatus = '4';
    const closedStatus = '6';
    const alreadyTransQtyFieldId = 'custrecord_platform_pr_related_number';
    const poFieldId = 'custrecord_platform_related_po_id';
    const woFieldId = 'custrecord_platform_work_order';
    const qtyFieldId = 'custrecord_platform_pr_number';
    const custFieldPrefix = 'custrecord';
    const poWoFieldId = 'custbody_wip_createdfrom';
    const poWoLineFieldId = 'custcol_wip_wo_text_link';

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
            if (currentStatus != approvedStatus && currentStatus != partTransStatus) {
                throw errorMod.create({
                    name: 'INVALID_STATUS',
                    message: `ID为${internalid}的自定义PR的状态不是已审核或部分下推`
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

    function getOneOfPrResult(resultList, prFieldId) {
        const result = resultList.find(({ [prFieldId]: value }) => !!value);
        return result ? result[prFieldId] : '';
    }

    function getStringCombinedResult(resultList, prFieldId) {
        return resultList.map(({ [prFieldId]: value }) => value).filter(value => !!value).join('/').slice(0, 300);
    }

    function getPRResultEntries(prIds) {
        const resultList = [];
        const tempPrRec = recordMod.create({
            type: prRecType
        });
        const customColumns = tempPrRec.getFields().filter(id => id.startsWith(custFieldPrefix));
        searchMod.create({
            type: prRecType,
            filters: [
                {
                    name: 'internalid',
                    operator: 'anyof',
                    values: prIds
                }
            ],
            columns: [
                {
                    name: 'internalid',
                    sort: searchMod.Sort.DESC
                },
                {
                    name: 'isinactive'
                },
                ...customColumns.map(name => ({ name })),
            ],
        }).run().each(result => {
            const { columns } = result;
            const resultEntry = {};
            for (const column of columns) {
                resultEntry[column.name] = result.getValue(column);
            }
            resultList.push(resultEntry);
            return true;
        });

        return resultList;
    }

    //entry points
    function getInputData(context) {
        const paramFieldId = 'custscript_q_weiwei_data_source';
        const currentScript = runtimeMod.getCurrentScript();
        const inputParams = currentScript.getParameter({ name: paramFieldId });
        const mergeObj = JSON.parse(inputParams);
        // const { lines, taskRecId } = JSON.parse(inputParams);
        // const transformMap = {};

        // for (const { internalid: prId, transformQty } of lines) {
        //     transformMap[prId] = { prId, transformQty, taskRecId, };
        // }

        return mergeObj;
    }

    function map(context) {
        const { key, value, isRestarted } = context;
        const { list: transformList, taskRecId, } = JSON.parse(value);
        const [{ subsidiaryId, vendorId }] = transformList;
        const poItemSublistId = 'item';
        const vendorSubsidarySublistId = 'submachine';
        let poId = null;
        let message = '';
        const multiSelectFieldIds = new Set([
            'custrecord_create_num_pr',
            'custrecord_platform_pr_order_type',
            'custrecord_platform_pr_cus_id',
            'custrecord_platform_pr_pro_id',
        ]);
        const dateFieldIds = new Set([
            'custrecord_platform_pr_pur_date',
            'custrecord_platform_pr_receipt_date',
        ]);
        const prToPoLineFieldMap = new Map([
            ['custrecord_plan_vendor_pr', 'custcol_pr_cheapest_vendor'],
            ['custrecord_platform_pr_pur_date', 'custcol_pr_suggest_date'],
            ['custrecord_common_mode_pr', 'custcol_whether_common_mode_send'],
            ['custrecord_net_requirement_pr', 'custcol_pr_gross_demand'],
            ['custrecord_platform_pr_assist_number', 'custcol_pr_assist_number'],
            ['custrecord_platform_pr_unit', 'units'],
            ['custrecord_platform_pr_reference_unit', 'custcol_pr_assist_unit'],
            ['custrecord_platform_pr_exc_rate', 'custcol_po_conversion_rate'],
            ['custrecord_platform_pr_sign', 'custcol_pr_invalid_sign_send'],
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
        ]);

        try {
            const currentUser = runtimeMod.getCurrentUser();
            const { id: userId } = currentUser;

            //转换合并数据
            const prIdQtyMap = new Map();
            for (const { prId, transformQty } of transformList) {
                prIdQtyMap.set(String(prId), +transformQty);
            }

            //验证子公司和供应商
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

            //收集供应商信息-并验证供应商税码
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
            const resultList = getPRResultEntries([...prIdQtyMap.keys()]);

            //重复数据检测
            if (isRestarted) {

            }

            //验证父记录
            // validateSource(resultList);

            //创建委外采购单
            const poRec = recordMod.create({
                type: poRecType,
                isDynamic: true,
            });

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

            //业务员
            const prApplier = getOneOfPrResult(resultList, prApplierFieldId) || userId;
            poRec.setValue({
                fieldId: 'custbody_po_buyer',
                value: prApplier,
            });

            //审批状态
            poRec.setValue({
                fieldId: 'approvalstatus',
                value: '1',//等待核准
            });

            //专营采购员
            poRec.setValue({
                fieldId: 'employee',
                value: specifiedPurchaser,
            });

            //采购类型
            poRec.setValue({
                fieldId: 'custbody_po_list_pur_type',
                value: '3',//委外采购
            });

            //制单人
            poRec.setValue({
                fieldId: 'custbody_pr_doc_owner',
                value: userId,
            });

            //备注
            poRec.setValue({
                fieldId: 'memo',
                value: getStringCombinedResult(resultList, prMemoFieldId),
            });

            const itemIds = resultList.map(({ [prItemFieldId]: itemId }) => itemId);

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
                    values: itemIds,
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
                id: 'customsearch_po_unreceipt_2_2'
            });
            unreceiptSearch.filters = [
                ...unreceiptSearch.filters,
                {
                    name: 'item',
                    operator: 'anyof',
                    values: itemIds,
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

            //设置行上相关信息
            for (resultEntry of resultList) {
                let { [prItemFieldId]: itemId, [prReceiptDateFieldId]: receiptDate, internalid: prId } = resultEntry;
                poRec.selectNewLine({
                    sublistId: poItemSublistId,
                });

                //物料
                poRec.setCurrentSublistValue({
                    sublistId: poItemSublistId,
                    fieldId: 'item',
                    value: itemId,
                });

                //数量
                poRec.setCurrentSublistValue({
                    sublistId: poItemSublistId,
                    fieldId: 'quantity',
                    value: prIdQtyMap.get(String(prId)),
                });

                //交货日期-不知道为何，采购单持续报日期格式错误-2020-5-27
                if (receiptDate) {
                    const receiptDateObj = parseDate(receiptDate);
                    try {
                        poRec.setCurrentSublistValue({
                            sublistId: poItemSublistId,
                            fieldId: 'expectedreceiptdate',
                            value: receiptDateObj
                        });
                    } catch (e1) {
                        try {
                            poRec.setCurrentSublistValue({
                                sublistId: poItemSublistId,
                                fieldId: 'expectedreceiptdate',
                                value: receiptDate
                            });
                        } catch (e2) {
                            try {
                                poRec.setCurrentSublistText({
                                    sublistId: poItemSublistId,
                                    fieldId: 'expectedreceiptdate',
                                    text: receiptDate
                                });
                            } catch { }
                        }
                    }
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

                //CUX-PR单号
                poRec.setCurrentSublistValue({
                    sublistId: poItemSublistId,
                    fieldId: 'custcol_pr_cux_pr_doc_number',
                    value: prId,
                });

                //统一处理一一对应的值
                for (const [prFieldId, poFieldId] of prToPoLineFieldMap) {
                    let { [prFieldId]: prValue } = resultEntry;
                    if (prValue !== '') {
                        if (dateFieldIds.has(prFieldId)) {
                            prValue = parseDate(prValue);
                        } else if (multiSelectFieldIds.has(prFieldId)) {
                            prValue = prValue.join(',');
                        }
                        poRec.setCurrentSublistValue({
                            sublistId: poItemSublistId,
                            fieldId: poFieldId,
                            value: prValue
                        });
                    }
                }

                poRec.commitLine({
                    sublistId: poItemSublistId,
                });
            }

            //保存po
            poId = poRec.save({
                ignoreMandatoryFields: true
            });
        } catch (ex) {
            message = `下推子公司${subsidiaryId},供应商${vendorId}的委外采购单出错，错误提示：${ex.message}.`;
            log.error({
                title: `下推子公司${subsidiaryId},供应商${vendorId}的委外采购单出错`,
                details: {
                    key,
                    ex,
                    value,
                }
            });
        }

        //输出
        for (const { prId, transformQty, subsidiaryId, vendorId } of transformList) {
            context.write({
                key: prId,
                value: {
                    prId,
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

    function reduce(context) {
        const { key: prId, values, isRestarted } = context;
        const prInfo = JSON.parse(values[0]);//每组只有一个PR
        const { poId, taskRecId, subsidiaryId, vendorId, } = prInfo;
        let { message, transformQty } = prInfo;
        let woId = null;
        let prRec = null;
        const poItemSublistId = 'item';

        if (prId && poId) {//如果委外采购单下推成功
            try {
                prRec = recordMod.load({
                    type: prRecType,
                    id: prId,
                });

                //重复检测
                if (isRestarted) {

                }

                const prWoItem = prRec.getValue({
                    fieldId: prWoItemFieldId
                });
                if (!prWoItem) {
                    throw errorMod.create({
                        name: 'NO_WO_ITEM',
                        message: `CUX-PR${prId}缺少工单物料`
                    });
                }

                //创建委外工单
                const woRec = recordMod.create({
                    type: woRecType,
                    isDynamic: true,
                });

                //子公司
                woRec.setValue({
                    fieldId: 'subsidiary',
                    value: subsidiaryId
                });

                //物料
                woRec.setValue({
                    fieldId: 'assemblyitem',
                    value: prWoItem
                });

                //查找主默认BOM
                let masterBom = null;
                searchMod.create({
                    type: 'item',
                    filters: [
                        {
                            name: 'internalid',
                            operator: 'anyof',
                            values: [prWoItem]
                        },
                        {
                            name: 'default',
                            join: 'assemblyitembillofmaterials',
                            operator: 'is',
                            values: 'T'
                        },
                    ],
                    columns: [
                        {
                            name: 'billofmaterials',
                            join: 'assemblyitembillofmaterials',
                        }
                    ]
                }).run().each(result => {
                    masterBom = result.getValue({
                        name: 'billofmaterials',
                        join: 'assemblyitembillofmaterials',
                    });
                    return false;
                });
                if (!masterBom) {
                    throw errorMod.create({
                        name: 'NO_MASTER_BOM_FOUND',
                        message: `工单装配件物料${prWoItem}没有找到主默认物料清单`
                    });
                }

                //查找工艺路线
                let masterLocation;
                searchMod.create({
                    type: 'manufacturingrouting',
                    filters: [
                        {
                            name: 'billofmaterials',
                            operator: 'anyof',
                            values: [masterBom]
                        },
                        {
                            name: 'subsidiary',
                            operator: 'anyof',
                            values: [subsidiaryId]
                        },
                        {
                            name: 'isdefault',
                            operator: 'is',
                            values: 'T'
                        },
                    ],
                    columns: [
                        {
                            name: 'location'
                        }
                    ]
                }).run().each(result => {
                    masterLocation = result.getValue({
                        name: 'location'
                    });
                    return false;
                });
                if (!masterLocation) {
                    throw errorMod.create({
                        name: 'NO_MASTER_MANU_ROUTING_LOCATION_FOUND',
                        message: `没有找到主默认BOM${masterBom}下对应主默认的工艺路线的地点`
                    });
                }
                ([masterLocation] = masterLocation.split(','));

                //地点
                woRec.setValue({
                    fieldId: 'location',
                    value: masterLocation
                });

                //状态
                woRec.setValue({
                    fieldId: 'orderstatus',
                    value: 'B'//准备生产
                });

                //WIP
                woRec.setValue({
                    fieldId: 'iswip',
                    value: true
                });

                //数量
                woRec.setValue({
                    fieldId: 'quantity',
                    value: transformQty
                });

                //执行状态
                woRec.setValue({
                    fieldId: 'custbody_wip_executing_state',
                    value: '9'//下达
                });

                //生产类型
                woRec.setValue({
                    fieldId: 'custbody_wip_manufacturing_type',
                    value: '6'//委外加工工单
                });

                //软件版本
                const prSoftVer = prRec.getValue({
                    fieldId: 'custrecord_software_version_pr'
                });
                woRec.setValue({
                    fieldId: 'custbody_wip_software_version',
                    value: prSoftVer
                });

                //销售订单备注
                const prSoMemo = prRec.getValue({
                    fieldId: 'custrecord_wip_so_memo_pr'
                });
                woRec.setValue({
                    fieldId: 'custbody_wip_so_memo',
                    value: prSoMemo
                });

                //销售订单摘要
                const prSoAbstract = prRec.getValue({
                    fieldId: 'custrecord_wip_so_abstract_pr'
                });
                woRec.setValue({
                    fieldId: 'custbody_wip_so_abstract',
                    value: prSoAbstract
                });

                //委外采购订单
                woRec.setValue({
                    fieldId: 'custbody_wip_outsource_po',
                    value: poId
                });

                //计划完工日期
                const prReceiptDate = prRec.getValue({
                    fieldId: prReceiptDateFieldId
                });
                if (prReceiptDate) {
                    woRec.setValue({
                        fieldId: 'custbody_wip_planned_completion_date',
                        value: prReceiptDate
                    });
                }

                //委外加工单位
                woRec.setValue({
                    fieldId: 'custbody_wip_commissioned_processing_u',
                    value: vendorId
                });

                //委外供应商库位
                let vendorBin = '';
                searchMod.create({
                    type: 'bin',
                    filters: [
                        ['custrecord_os_vendor', 'anyof', [vendorId]]
                    ],
                }).run().each(result => {
                    vendorBin = result.id;
                    return false;
                });
                woRec.setValue({
                    fieldId: 'custbody_osp_vendor_bin',
                    value: vendorBin
                });

                //保存工单
                woId = woRec.save({
                    ignoreMandatoryFields: true
                });
            } catch (ex) {
                message += `为CUX-PR${prId}下推委外工单失败，失败提示：${ex.message}.`;
                log.error({
                    title: `为CUX-PR${prId}下推委外工单失败`,
                    details: {
                        prId,
                        poId,
                        ex,
                    }
                });
            }
        }

        //回写采购单-5-29更改为把工单信息回写到PO行上
        if (woId) {
            try {
                const poRec = recordMod.load({
                    type: poRecType,
                    id: poId
                });
                const lineCount = poRec.getLineCount({
                    sublistId: poItemSublistId,
                });
                let isTargetFound = false;
                for (let i = 0; i < lineCount; i++) {
                    const linePrId = poRec.getSublistValue({
                        sublistId: poItemSublistId,
                        fieldId: 'custcol_pr_cux_pr_doc_number',
                        line: i,
                    });
                    if (linePrId == prId) {
                        poRec.setSublistValue({
                            sublistId: poItemSublistId,
                            fieldId: poWoLineFieldId,
                            line: i,
                            value: woId,
                        });
                        isTargetFound = true;
                        break;
                    }
                }
                if(isTargetFound){
                    poRec.save({
                        ignoreMandatoryFields: true
                    });
                }

                // const { [poWoFieldId]: woList } = searchMod.lookupFields({
                //     type: poRecType,
                //     id: poId,
                //     columns: [poWoFieldId]
                // });
                // recordMod.submitFields({
                //     type: poRecType,
                //     id: poId,
                //     values: {
                //         [poWoFieldId]: [
                //             ...woList.map(({ value }) => value),
                //             woId,
                //         ]
                //     },
                //     options: {
                //         ignoreMandatoryFields: true,
                //     },
                // });
            } catch (ex) {
                message += `回写WO ${woId} 到PO ${poId}错误，错误提示:${ex.message}`;
                log.error({
                    title: `回写WO ${woId} 到PO ${poId}错误`,
                    details: {
                        woId,
                        poId,
                        ex,
                    }
                });
            }
        }

        //回写CUX-PR
        if (poId || woId) {
            try {
                transformQty = +transformQty;

                //更新剩余可推数量和关联数量（已下推数量）
                const allQty = prRec.getValue({
                    fieldId: qtyFieldId
                }) || 0;
                const transformedQty = prRec.getValue({
                    fieldId: alreadyTransQtyFieldId
                }) || 0;
                let newTransformedQty = transformQty + transformedQty;
                newTransformedQty = +newTransformedQty.toFixed(6);
                prRec.setValue({
                    fieldId: alreadyTransQtyFieldId,
                    value: newTransformedQty,
                });

                //更新状态
                if (newTransformedQty >= allQty) {
                    prRec.setValue({
                        fieldId: prStatusFieldId,
                        value: closedStatus,
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

                //设置关联的WO
                if (woId) {
                    const currentWos = prRec.getValue({
                        fieldId: woFieldId
                    });
                    prRec.setValue({
                        fieldId: woFieldId,
                        value: [
                            ...currentWos,
                            woId,
                        ]
                    });
                }

                prRec.save({
                    ignoreMandatoryFields: true
                });
            } catch (ex) {
                message += `回写CUX-PR${prId}失败，错误提示：${ex.message}.`;
                log.error({
                    title: `回写CUX-PR${prId}失败`,
                    details: {
                        prId,
                        poId,
                        woId,
                        ex,
                    }
                });
            }
        }

        context.write({
            key: prId,
            value: {
                prId,
                poId,
                woId,
                transformQty,
                message,
                taskRecId,
                subsidiaryId,
                vendorId,
            }
        });
    }

    function summarize(summary) {
        const { mapSummary, output } = summary;
        const groupMap = new Map();
        let targetTaskRecId;

        //记录系统级错误
        mapSummary.errors.iterator().each((key, error, executionNo) => {
            log.error({
                title: `第${executionNo}次下推CUX-PR${key}的委外采购单时出错`,
                details: error
            });
            return true;
        });

        //遍历结果-将结果重新组合为子公司和供应商分组的模式
        output.iterator().each((prId, info) => {
            const { taskRecId, subsidiaryId, vendorId, poId, ...resultInfo } = JSON.parse(info);
            if (!targetTaskRecId) {
                targetTaskRecId = taskRecId;
            }

            const groupKey = `${subsidiaryId}-${vendorId}-${poId}`;
            if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, { subsidiaryId, vendorId, poId, lines: [] });
            }
            groupMap.get(groupKey).lines.push(resultInfo);
            return true;
        });

        try {
            recordMod.submitFields({
                type: taskRecType,
                id: targetTaskRecId,
                values: {
                    [secondDetailFieldId]: JSON.stringify([...groupMap.values()])
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
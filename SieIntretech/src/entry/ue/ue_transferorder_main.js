/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 *@author Charles Zhang
 *@description Transfer Order UE主程序
 */
define([
    'N/runtime',
    'N/ui/message',
    '../../app/app_workorder_transfer_items',
], function (
    runtimeMod,
    messageMod,
    woInfoMod,
) {

    const invtWoLineKeyField = 'custcol_po_replenish_source';
    const transQtyFieldId = 'quantity';
    const itemSublist = 'item';

    //检查是否是批准动作
    function checkApproveEvent({
        type,
        oldRecord,
        newRecord,
        UserEventType: eventType
    }) {
        const pendFulStatus = 'B';
        if (type === eventType.APPROVE) {
            return true;
        } else {
            let oldAppStatus = '';
            if (oldRecord) {
                oldAppStatus = oldRecord.getValue({
                    fieldId: 'orderstatus'
                });
            }
            const newAppStatus = newRecord.getValue({
                fieldId: 'orderstatus'
            });
            if (oldAppStatus !== pendFulStatus && newAppStatus === pendFulStatus) {
                return true;
            }
        }

        return false;
    }

    function checkIfWoRelated({
        newRecord
    }) {
        const woFieldId = 'custbody_wip_work_order_id';
        const tranTypeFieldId = 'custbody_wip_transfer_type';
        const woId = newRecord.getValue({
            fieldId: woFieldId
        });
        const transferType = newRecord.getValue({
            fieldId: tranTypeFieldId
        });

        return woId && transferType ? true : false;
    }

    function checkHasUpWo({
        newRecord
    }) {
        const ciwoFieldId = 'custbody_if_up_wo';
        const ciwoValue = newRecord.getValue({
            fieldId: ciwoFieldId
        });

        return ciwoValue ? false : true;
    }

    //查询工单并赋值到库存转移上面
    function initWorkOderInfo({
        newRecord,
        request: {
            parameters: {
                workorderid: workOrderId,
                taoshu: taoShu = 1,
                lingliaotype: lingLiaoType = '1'
            }
        }
    }) {
        taoShu = Number.parseFloat(taoShu) || 0;

        if (workOrderId) {
            try {
                //搜索工单信息
                const {
                    woInfo,
                    subsidiaryKey,
                    locationKey,
                    assemblyQtyKey,
                    itemsKey
                } = woInfoMod.getWorkOrderInfo(workOrderId);

                const totalTaoShu = woInfo.get(assemblyQtyKey);
                if (totalTaoShu === 0) {
                    throw new Error('工单装配件总数量为0');
                }

                //设置转移单
                newRecord.setValue({
                    fieldId: 'subsidiary',
                    value: woInfo.get(subsidiaryKey)
                });
                newRecord.setValue({
                    fieldId: 'custbody_wip_work_order_id',
                    value: workOrderId
                });
                newRecord.setValue({
                    fieldId: 'custbody_wip_transfer_type',
                    value: lingLiaoType
                });
                newRecord.setValue({ //套数
                    fieldId: 'custbody_wip_quantity',
                    value: taoShu
                });
                newRecord.setValue({
                    fieldId: 'transferlocation',
                    value: woInfo.get(locationKey) || ''
                });

                //设置物料行
                let itemList = woInfo.get(itemsKey);
                for (const [index, line] of itemList.entries()) {
                    let {
                        quantity: totalQty,
                        custcol_quantity_issued: issuedQty,
                        custcol_wip_returned_quantity: returnedQty,
                        custcol_wip_already_kitting: cwakQty //add by yuming hu
                    } = line;
                    let bomStandQty = totalQty / totalTaoShu;
                    bomStandQty = +bomStandQty.toFixed(5);
                    let transferQty = taoShu * bomStandQty;

                    newRecord.setSublistValue({ //物料
                        sublistId: itemSublist,
                        fieldId: 'item',
                        line: index,
                        value: line.item
                    });
                    newRecord.setSublistValue({ //全部用量
                        sublistId: itemSublist,
                        fieldId: 'custcol_all_the_quantity',
                        line: index,
                        value: totalQty
                    });
                    newRecord.setSublistValue({ //已发料数量
                        sublistId: itemSublist,
                        fieldId: 'custcol_quantity_issued',
                        line: index,
                        value: issuedQty || 0
                    });
                    newRecord.setSublistValue({ //已发料套数
                        sublistId: itemSublist,
                        fieldId: 'custcol_wip_already_kitting',
                        line: index,
                        value: cwakQty || 0
                    }); //add by yuming hu
                    newRecord.setSublistValue({ //退料数量
                        sublistId: itemSublist,
                        fieldId: 'custcol_wip_returned_quantity',
                        line: index,
                        value: returnedQty || 0
                    });
                    newRecord.setSublistValue({ //超领料数量
                        sublistId: itemSublist,
                        fieldId: 'custcol_over_issue_quantity',
                        line: index,
                        value: line.custcol_over_issue_quantity || 0
                    });
                    newRecord.setSublistValue({ //BOM标准用量
                        sublistId: itemSublist,
                        fieldId: 'custcol_bom_standard_quantity',
                        line: index,
                        value: bomStandQty
                    });
                    newRecord.setSublistValue({ //要转移之数量
                        sublistId: itemSublist,
                        fieldId: transQtyFieldId,
                        line: index,
                        value: transferQty
                    });
                    newRecord.setSublistValue({ //组件产出
                        sublistId: itemSublist,
                        fieldId: 'custcol_wip_components_of_output',
                        line: index,
                        value: line.componentyield * 100
                    });
                    newRecord.setSublistValue({ //BOM数量
                        sublistId: itemSublist,
                        fieldId: 'custcol_wip_bom_quantity',
                        line: index,
                        value: line.bomquantity
                    });
                    newRecord.setSublistValue({ //主料等级
                        sublistId: itemSublist,
                        fieldId: 'custcol_main_ingredient_level',
                        line: index,
                        value: line.custcol_main_ingredient_level || ''
                    });
                    newRecord.setSublistValue({ //主料编码
                        sublistId: itemSublist,
                        fieldId: 'custcol_main_ingredient_code',
                        line: index,
                        value: line.custcol_main_ingredient_code || ''
                    });
                    newRecord.setSublistValue({ //替代料等级
                        sublistId: itemSublist,
                        fieldId: 'custcol_substitute_material_level',
                        line: index,
                        value: line.custcol_substitute_material_level || ''
                    });
                    newRecord.setSublistValue({ //记录工单行ID
                        sublistId: itemSublist,
                        fieldId: invtWoLineKeyField,
                        line: index,
                        value: line.uniquekey.toString(10)
                    });
                }
            } catch (ex) {
                log.error({
                    title: `设置库存转移默认工单信息失败, 工单ID: ${workOrderId}`,
                    details: ex
                });
            }
        }
    }

    //添加前端同步按钮
    function addSycnWoButton({
        form
    }) {
        try {
            form.addButton({
                id: 'custpage_sync_wo',
                label: '刷新工单信息',
                functionName: 'window.custSyncWoLines'
            });
        } catch (ex) {
            log.error({
                title: 'add sync wo button error',
                details: ex
            });
        }
    }

    function checkAndSetNoticeMsg({
        form,
        newRecord: {
            id: orderId
        }
    }) {
        const {
            id: userId
        } = runtimeMod.getCurrentUser();
        const toNoticeCache = woInfoMod.getTransOrderCache({
            orderId,
            userId
        });
        if (toNoticeCache) {
            try {
                const {
                    status,
                    msg
                } = JSON.parse(toNoticeCache);
                switch (status) {
                    case 'success':
                        form.addPageInitMessage({
                            type: messageMod.Type.CONFIRMATION,
                            title: '提示',
                            message: msg
                        });
                        woInfoMod.clearTransOrderCache({
                            orderId,
                            userId
                        });
                        break;
                    case 'fail':
                        form.addPageInitMessage({
                            type: messageMod.Type.ERROR,
                            title: '提示',
                            message: msg
                        });
                        woInfoMod.clearTransOrderCache({
                            orderId,
                            userId
                        });
                        break;
                    default:
                        break;
                }
            } catch (ex) {
                log.error({
                    title: `add notify message error for transfer order:${orderId}`,
                    details: ex
                });
            }
        }
    }

    //entry points
    function beforeLoad(context) {
        const {
            type,
            UserEventType: eventType
        } = context;
        const {
            executionContext: executContext,
            ContextType: contextType
        } = runtimeMod;
        if (type === eventType.CREATE) {
            log.debug('0..', 'initWorkOderInfo');
            if (executContext === contextType.USER_INTERFACE) {
                //添加同步按钮
                addSycnWoButton(context);
                log.debug('1..', 'initWorkOderInfo');
                initWorkOderInfo(context);
            }
        } else if (type === eventType.VIEW) {
            if (executContext === contextType.USER_INTERFACE) {
                checkAndSetNoticeMsg(context);
            }
        }
    }

    function afterSubmit(context) {
        const isApproveOccured = checkApproveEvent(context);
        const isWoRelated = checkIfWoRelated(context);
        const isHasUpWo = checkHasUpWo(context);
        if (isApproveOccured && isWoRelated) { //工单相关的转移订单，实行自动收发货
            woInfoMod.autoFulReceiveFlow(context);
        }
    }

    return {
        beforeLoad,
        afterSubmit
    }
});
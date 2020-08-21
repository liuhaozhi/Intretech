/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@description 工单完工申请 CS主程序, 主要用于验证工单信息
 */
define([
    'N/https',
    'N/ui/dialog',
    'N/currentRecord',
    'N/url',
    'N/ui/message',
    '../../app/moment'
], function (
    httpsMod,
    dialogMod,
    currentRecordMod,
    urlMod,
    messageMod,
    moment
) {
    var gIwilSublistId = 'recmachcustrecord_woc_item_line',
        gRwprSublistId = 'recmachcustrecordcustrecord__woc_process_route';

    function clearAllItems(sublistId) {
        try {
            clear_splits(sublistId);
        } catch (ex) {
            console.error('clear all items error', ex);
        }
    }

    function initWorkOrderComplation(woInfo) {
        var pageRec = currentRecordMod.get(),
            complateQuantity = pageRec.getValue({
                fieldId: 'custrecord_woc_completedquantity'
            }),
            itemFailedLines = [],
            isItemLastLineDone = false,
            operationFailedLines = [],
            isOperationLastLineDone = false,
            woQty = woInfo.main.quantity;

        //先删除原有的所有行
        clearAllItems(gIwilSublistId);
        clearAllItems(gRwprSublistId);

        //装配件
        pageRec.setValue({
            fieldId: 'custrecord_woc_item',
            value: woInfo.main.assemblyitem
        });

        //工单数量
        pageRec.setValue({
            fieldId: 'custrecord_woc_orderquantity',
            value: woInfo.main.quantity
        });

        //物料单
        pageRec.setValue({
            fieldId: 'custrecord_woc_billofmaterials',
            value: woInfo.main.billofmaterials
        });

        //物料单版本
        pageRec.setValue({
            fieldId: 'custrecord_woc_billofmaterialsrevision',
            value: woInfo.main.billofmaterialsrevision
        });

        //制造工艺流程
        pageRec.setValue({
            fieldId: 'custrecord_woc_manufacturingrouting',
            value: woInfo.main.manufacturingrouting
        });

        //单位
        pageRec.setValue({
            fieldId: 'custrecord_woc_units',
            value: woInfo.main.units
        });

        //子公司
        pageRec.setValue({
            fieldId: 'custrecord_woc_subsidiary',
            value: woInfo.main.subsidiary
        });

        //地点
        pageRec.setValue({
            fieldId: 'custrecord_woc_location',
            value: woInfo.main.location
        });

        //部门
        pageRec.setValue({
            fieldId: 'custrecord_woc_department',
            value: woInfo.main.department
        });

        //类
        pageRec.setValue({
            fieldId: 'custrecord_woc_class',
            value: woInfo.main.class
        });

        if (woInfo.main.life) {
            //到期日
            now = moment().add(Number(woInfo.main.life), 'days');

            pageRec.setValue({
                fieldId: 'custrecord_woc_date_due',
                value: now.toDate()
            });
        }

        //批次
        if (woInfo.main.subsidiary != '26') {
            pageRec.setValue({
                fieldId: 'custrecord_woc_inventorydetail',
                value: woInfo.main.issueNumber
            });
        }

        //上层工单号
        pageRec.setValue({
            fieldId: 'custrecord_woc_up_wo',
            value: woInfo.main.custbody_wip_up_wo_id
        });

        //默认仓库
        pageRec.setValue({
            fieldId: 'custrecord_woc_default_warehouse',
            value: woInfo.main.defaultwarehouse
        });

        //上层工单号地点
        pageRec.setValue({
            fieldId: 'custrecord_woc_up_location',
            value: woInfo.main.toplocation
        });

        //添加货品新行
        woInfo.item.forEach(function (itemLine) {

            try {
                if (!isItemLastLineDone) {
                    pageRec.cancelLine({
                        sublistId: gIwilSublistId
                    });
                }
                pageRec.selectNewLine({
                    sublistId: gIwilSublistId
                });
                pageRec.setCurrentSublistValue({
                    sublistId: gIwilSublistId,
                    fieldId: 'custrecord_woc_il_item',
                    value: itemLine.item,
                    forceSyncSourcing: true
                });

                pageRec.setCurrentSublistValue({
                    sublistId: gIwilSublistId,
                    fieldId: 'custrecord_woc_il_quantity',
                    //value: complateQuantity * itemLine.ratio,
                    value: complateQuantity / (itemLine.componentyield * 0.01),
                    //forceSyncSourcing: true
                });

                pageRec.setCurrentSublistValue({
                    sublistId: gIwilSublistId,
                    fieldId: 'custrecord_woc_il_quantityper',
                    value: itemLine.ratio,
                    // forceSyncSourcing: true
                });

                //单耗
                pageRec.setCurrentSublistValue({
                    sublistId: gIwilSublistId,
                    fieldId: 'custrecord_component_consump',
                    value: itemLine.componentyield
                    // forceSyncSourcing: true
                });

                pageRec.setCurrentSublistValue({
                    sublistId: gIwilSublistId,
                    fieldId: 'custrecord_woc_il_unitcost',
                    value: itemLine.units
                    // forceSyncSourcing: true
                });

                pageRec.setCurrentSublistValue({ //控制行
                    sublistId: gIwilSublistId,
                    fieldId: 'custrecord_control_itemline',
                    value: 'Y'
                });

                pageRec.commitLine({
                    sublistId: gIwilSublistId
                });
                isItemLastLineDone = true;
            } catch (ex) {
                itemFailedLines.push({
                    itemId: itemId,
                    msg: ex.message
                });
                isItemLastLineDone = false;
            }
        });

        //添加操作新行
        woInfo.operation.forEach(function (operationLine) {

            try {
                if (!isOperationLastLineDone) {
                    pageRec.cancelLine({
                        sublistId: gRwprSublistId
                    });
                }
                pageRec.selectNewLine({
                    sublistId: gRwprSublistId
                });
                pageRec.setCurrentSublistValue({
                    sublistId: gRwprSublistId,
                    fieldId: 'custrecord_woc_pr_laborresources',
                    value: operationLine.laborresources
                    //forceSyncSourcing: true
                });

                //人工运行时间（分钟）
                pageRec.setCurrentSublistValue({
                    sublistId: gRwprSublistId,
                    fieldId: 'custrecord_woc_pr_laborruntime',
                    value: operationLine.runrate * complateQuantity
                    //forceSyncSourcing: true
                });

                //人工设置时间（分钟）
                pageRec.setCurrentSublistValue({
                    sublistId: gRwprSublistId,
                    fieldId: 'custrecord_woc_pr_laborsetuptime',
                    value: operationLine.setuptime //operationLine.runrate
                    //forceSyncSourcing: true
                });

                //机器资源
                pageRec.setCurrentSublistValue({
                    sublistId: gRwprSublistId,
                    fieldId: 'custrecord_woc_pr_machineresources',
                    value: operationLine.machineresources
                    //forceSyncSourcing: true
                });

                //机器运行时间（分钟）
                pageRec.setCurrentSublistValue({
                    sublistId: gRwprSublistId,
                    fieldId: 'custrecord_woc_pr_machineruntime',
                    value: operationLine.runrate * complateQuantity
                    //forceSyncSourcing: true
                });

                //机器设置时间（分钟）
                pageRec.setCurrentSublistValue({
                    sublistId: gRwprSublistId,
                    fieldId: 'custrecord_woc_pr_machinesetuptime',
                    value: operationLine.setuptime
                    //forceSyncSourcing: true
                });

                //工序名称
                pageRec.setCurrentSublistValue({
                    sublistId: gRwprSublistId,
                    fieldId: 'custrecord_woc_pr_operationname',
                    value: operationLine.name
                    //forceSyncSourcing: true
                });

                //操作顺序
                pageRec.setCurrentSublistValue({
                    sublistId: gRwprSublistId,
                    fieldId: 'custrecord_woc_pr_operationsequence',
                    value: operationLine.sequence
                    //forceSyncSourcing: true
                });

                //制造工作中心
                pageRec.setCurrentSublistValue({
                    sublistId: gRwprSublistId,
                    fieldId: 'custrecord_woc_pr_workcenter',
                    value: operationLine.manufacturingworkcenter
                    //forceSyncSourcing: true
                });

                pageRec.setCurrentSublistValue({
                    sublistId: gRwprSublistId,
                    fieldId: 'custrecord_control_line',
                    value: 'Y'
                    //forceSyncSourcing: true
                });

                pageRec.commitLine({
                    sublistId: gRwprSublistId
                });
                isOperationLastLineDone = true;
            } catch (ex) {
                operationFailedLines.push({
                    itemId: itemId,
                    msg: ex.message
                });
                isOperationLastLineDone = false;
            }
        });

        //关闭提示
        switchSearchMessge(true);

        if (itemFailedLines.length) {
            var errorMsg = itemFailedLines.reduce(function (total, current) {
                return total + '<br />物料ID：' + current.itemId + ', 错误提示: ' + current.msg;
            }, '');

            dialogMod.alert({
                title: '提示',
                message: '某些工单行同步失败，请手动操作: ' + errorMsg
            });
            return false;
        }

        if (operationFailedLines.length) {
            var errorMsg = operationFailedLines.reduce(function (total, current) {
                return total + '<br />操作：' + current.itemId + ', 错误提示: ' + current.msg;
            }, '');

            dialogMod.alert({
                title: '提示',
                message: '某些工单行同步失败，请手动操作: ' + errorMsg
            });
            return false;
        }
    }

    function switchSearchMessge(toClose) {
        var _self = arguments.callee;
        if (!_self.message) {
            _self.message = messageMod.create({
                title: '提示',
                message: '工单信息正在同步中，请耐心等待......',
                type: messageMod.Type.INFORMATION
            });
        }

        if (toClose) {
            _self.message.hide();
        } else {
            _self.message.show();
        }
    }

    function getSearchWoURL(params) {
        var _self = arguments.callee,
            scriptId = 'customscript_sl_collector',
            deploymentId = 'customdeploy_sl_collector';

        params = params || {};

        if (!_self.searchURL) {
            _self.searchURL = urlMod.resolveScript({
                scriptId: scriptId,
                deploymentId: deploymentId
            });
        }

        return urlMod.format(_self.searchURL, params);
    }

    function syncWoLines() {
        var pageRec = currentRecordMod.get(),
            woId = pageRec.getValue({
                fieldId: 'custrecord_woc_createdfrom'
            }),
            complateQuantity = pageRec.getValue({
                fieldId: 'custrecord_woc_completedquantity'
            }),
            cwi = pageRec.getValue({
                fieldId: 'custrecord_woc_inventorydetail'
            });

        if (!complateQuantity) {
            dialogMod.alert({
                title: '提示',
                message: '请输入完工数量'
            });
            return false;
        }

        // if (!cwi) {
        //     dialogMod.alert({
        //         title: '提示',
        //         message: '请输入已完成数量批次'
        //     });
        //     return false;
        // }

        //用户确认
        dialogMod.confirm({
            title: '提示',
            message: '获取工单信息将刷新现有的行信息，是否继续？'
        }).then(function (result) {
            if (result === true) {
                //打开提示
                switchSearchMessge();
                var reqUrl = getSearchWoURL({
                    workorderid: woId,
                    action: 'getWorkorder'
                });

                console.log(reqUrl);
                return httpsMod.get.promise({
                    url: reqUrl
                });
            } else {
                return Promise.reject('用户取消')
            }
        }).then(function (rspObj) {
            var rspBody = rspObj.body;
            console.log('rspBody', rspBody);
            rspBody = JSON.parse(rspBody);
            if (rspBody.status === 'S') {
                initWorkOrderComplation(rspBody.data);
            } else {
                throw new Error(rspBody.data);
            }
        }).catch(function (reason) {
            //关闭提示
            switchSearchMessge(true);
            if (reason !== '用户取消') {
                dialogMod.alert({
                    title: '错误',
                    message: '同步工单信息失败，错误提示：' + (reason instanceof Error ? reason.message : reason)
                });
            }
        });
    }

    function validateQuantity(context) {
        var pageRec = context.currentRecord,
            woId = pageRec.getValue({
                fieldId: 'custrecord_woc_createdfrom'
            }),
            locationId = pageRec.getValue({
                fieldId: 'custrecord_woc_location'
            }),
            onhandTotal = [],
            curItemText,
            lineCount,
            i,
            currentItemObj = {},
            currentItemList = [],
            reqUrl,
            rspObj,
            outOfStockList = [];

        lineCount = pageRec.getLineCount({
            sublistId: gIwilSublistId
        });

        for (var i = 0; i < lineCount; i++) {
            currentItemObj = {
                custrecord_woc_il_item: '',
                custrecord_woc_il_quantity: 0,
                custrecord_control_itemline: ''
            };

            for (var key in currentItemObj) {
                if (currentItemObj.hasOwnProperty(key)) {
                    currentItemObj[key] = pageRec.getSublistValue({
                        sublistId: gIwilSublistId,
                        fieldId: key,
                        line: i
                    });
                }
            }

            currentItemList.push(currentItemObj);
        }

        console.log(currentItemList);

        //查询库存现有量信息
        try {
            reqUrl = getSearchWoURL({
                workorderid: woId,
                location: locationId,
                action: 'getQuantityOnhand'
            });

            console.log(reqUrl);
            rspObj = JSON.parse(httpsMod.get({
                url: reqUrl
            }).body);

            console.log(rspObj);
            console.log(111);

            if (rspObj.status == 'S') {
                onhandTotal = rspObj.data.onhandTotal;
                console.log(onhandTotal);

                for (var i = 0; i < currentItemList.length; i++) {
                    for (var j = 0; j < onhandTotal.length; j++) {
                        if (currentItemList[i]['custrecord_woc_il_item'] == onhandTotal[j]['item'] &&
                            (currentItemList[i]['custrecord_woc_il_quantity'] > onhandTotal[j]['quantity'] ||
                                currentItemList[i]['custrecord_woc_il_quantity'] > onhandTotal[j]['inventoryNumberquantityonhand'])) {
                            curItemText = pageRec.getSublistText({
                                sublistId: gIwilSublistId,
                                fieldId: 'custrecord_woc_il_item',
                                line: i
                            });
                            outOfStockList.push('第' + (i + 1) + '行物料 ' + curItemText + ' 可用量不足 ' + '可用量为 ' +
                                (onhandTotal[j]['quantity'] < onhandTotal[j]['inventoryNumberquantityonhand'] ? onhandTotal[j]['quantity'] : onhandTotal[j]['inventoryNumberquantityonhand']));
                        }
                    }
                }

                console.log(outOfStockList);
                if (outOfStockList.length) {
                    dialogMod.alert({
                        title: '提示',
                        message: '以下物料的库存信息不足，请修改后重试：<br />' + outOfStockList.join('<br />')
                    });
                    return false;
                } else {
                    pageRec.setValue({
                        fieldId: 'custrecord_cache',
                        //value: JSON.stringify(rspObj.data.onHandDetail)
                        value: JSON.stringify(rspObj)
                    });
                }
            } else {
                throw new Error(rspBody.result);
            }
        } catch (ex) {
            dialogMod.alert({
                title: '提示',
                message: '验证物料的库存信息失败，请稍后提交重试。错误提示：' + ex.message
            });
            return false;
        }

        return true;
    }

    function validateIsWoLine(context) {
        var pageRec = context.currentRecord,
            woId = pageRec.getValue({
                fieldId: 'custrecord_woc_createdfrom'
            }),
            cItemLine,
            cOpLine;

        if (woId) {
            cItemLine = pageRec.getCurrentSublistValue({
                sublistId: gIwilSublistId,
                fieldId: 'custrecord_control_itemline'
            });

            cOpLine = pageRec.getCurrentSublistValue({
                sublistId: gRwprSublistId,
                fieldId: 'custrecord_control_line'
            });

            if (!(cItemLine || cOpLine)) {
                dialogMod.alert({
                    title: '提示',
                    message: '工单完工申请不允许添加非工单行'
                });
                return false;
            }
        }

        return true;
    }

    //entry points
    function pageInit(context) {
        if (context.mode == 'create') {
            window.custSyncWoLines = syncWoLines;
            getSearchWoURL();
        }
    }

    function saveRecord(context) {
        //验证工单信息
        var isWoInfoOk = validateQuantity(context);

        if (!isWoInfoOk) {
            return false;
        }

        return true;
    }

    function validateLine(context) {
        //验证是否为工单行
        if (!validateIsWoLine(context)) {
            return false;
        }

        return true;
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        validateLine: validateLine,
        custSyncWoLines: syncWoLines
    }
});
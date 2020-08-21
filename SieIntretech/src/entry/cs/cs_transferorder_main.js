/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description Inventory Transfer CS主程序, 主要用于验证工单信息
 */
define([
    'N/https',
    'N/ui/dialog',
    'N/currentRecord',
    'N/url',
    'N/ui/message',
], function (
    httpsMod,
    dialogMod,
    currentRecordMod,
    urlMod,
    messageMod
) {

    //util
    function clearAllItems(sublistId) {
        try {
            clear_splits(sublistId);
        } catch (ex) {
            console.error('clear all items error', ex);
        }
    }

    function addItemLines(woInfo) {
        var pageRec = currentRecordMod.get(),
            totalTaoShu = +woInfo.assemblyQty,
            woLocation = woInfo.location,
            //sllocation = woInfo.sllocation, //add by yuming hu
            covb = woInfo.covb, //add by yuming hu
            taoShu = pageRec.getValue({
                fieldId: 'custbody_wip_quantity'
            }),
            transferType = pageRec.getValue({
                fieldId: 'custbody_wip_transfer_type'
            }),
            failedLines = [],
            isLastLineDone = false;

        if (totalTaoShu === 0) {
            dialogMod.alert({
                title: '错误',
                message: '此工单总套数为0, 无法同步'
            });
            return false;
        }

        //先设置相应地点
        if (transferType == '1' || transferType == '2' || transferType == '5' || transferType == '7') { //正常发料和超领料
            pageRec.setValue({
                fieldId: 'transferlocation',
                value: woLocation,
                forceSyncSourcing: true
            });
        } else if (transferType == '3' || transferType == '6') { //退料
            pageRec.setValue({
                fieldId: 'location',
                value: woLocation,
                forceSyncSourcing: true
            });
            // pageRec.setValue({
            //     fieldId: 'transferlocation',
            //     value: sllocation,
            //     forceSyncSourcing: true
            // }); //add by yuming hu
        }

        //设置库位 custbody_osp_vendor_bin
        pageRec.setValue({
            fieldId: 'custbody_osp_vendor_bin',
            value: covb,
            forceSyncSourcing: true
        });

        //先删除原有的所有行
        clearAllItems('item');

        //添加新行
        woInfo.items.forEach(function (itemLine) {
            var totalQty = +itemLine.quantityuom,
                issuedQty = +itemLine.custcol_quantity_issued || 0,
                returnedQty = +itemLine.custcol_wip_returned_quantity || 0,
                bomStandQty = +(totalQty / totalTaoShu).toFixed(5),
                //yflTaoSHu = +itemLine.custcol_wip_already_kitting || 0,
                yflTaoSHu = itemLine.custcol_wip_already_kitting ? itemLine.custcol_wip_already_kitting : 0,
                transferQty = taoShu * bomStandQty,
                itemId = itemLine.item,
                isQtyCeil = itemLine.custcol_if_round_numbers,
                xflTaoShu = totalTaoShu - yflTaoSHu > taoShu ? taoShu : totalTaoShu - yflTaoSHu,
                curItemStock = itemLine.custItemStockTotal,
                itemName = itemLine.itemName,
                itemSublist = 'item';

            try {
                if (!isLastLineDone) {
                    pageRec.cancelLine({
                        sublistId: itemSublist
                    });
                }

                //检测库存是否充足
                if(curItemStock <= 0 ){
                    throw new Error('物料库存不足，当前剩余库存为' + curItemStock);
                }

                pageRec.selectNewLine({
                    sublistId: itemSublist
                });
                pageRec.setCurrentSublistValue({
                    sublistId: itemSublist,
                    fieldId: 'item',
                    value: itemId,
                    forceSyncSourcing: true
                });
                pageRec.setCurrentSublistValue({ //单位
                    sublistId: itemSublist,
                    fieldId: 'units',
                    value: itemLine.unitid || '',
                    forceSyncSourcing: true
                });
                //是否进位取整
                isQtyCeil = pageRec.getCurrentSublistValue({
                    sublistId: itemSublist,
                    fieldId: 'custcol_if_round_numbers',
                });
                if (isQtyCeil === true) {
                    transferQty = Math.ceil(transferQty);
                }
                // pageRec.setCurrentSublistValue({ //要转移之数量
                //     sublistId: itemSublist,
                //     fieldId: 'quantity',
                //     value: transferQty,
                //     forceSyncSourcing: true,
                // });
                pageRec.setCurrentSublistValue({ //全部用量
                    sublistId: itemSublist,
                    fieldId: 'custcol_all_the_quantity',
                    value: totalQty
                });
                pageRec.setCurrentSublistValue({ //已发料数量
                    sublistId: itemSublist,
                    fieldId: 'custcol_quantity_issued',
                    value: issuedQty
                });
                pageRec.setCurrentSublistValue({ //退料数量
                    sublistId: itemSublist,
                    fieldId: 'custcol_wip_returned_quantity',
                    value: returnedQty
                });
                pageRec.setCurrentSublistValue({ //超领料数量
                    sublistId: itemSublist,
                    fieldId: 'custcol_over_issue_quantity',
                    value: itemLine.custcol_over_issue_quantity || 0
                });
                pageRec.setCurrentSublistValue({ //BOM标准用量
                    sublistId: itemSublist,
                    fieldId: 'custcol_bom_standard_quantity',
                    value: bomStandQty
                });
                pageRec.setCurrentSublistValue({ //组件产出
                    sublistId: itemSublist,
                    fieldId: 'custcol_wip_components_of_output',
                    value: itemLine.componentyield //* 100
                });
                pageRec.setCurrentSublistValue({ //BOM数量
                    sublistId: itemSublist,
                    fieldId: 'custcol_wip_bom_quantity',
                    value: itemLine.bomquantity
                });
                pageRec.setCurrentSublistValue({ //主料等级
                    sublistId: itemSublist,
                    fieldId: 'custcol_main_ingredient_level',
                    value: itemLine.custcol_main_ingredient_level || ''
                });
                pageRec.setCurrentSublistValue({ //主料编码
                    sublistId: itemSublist,
                    fieldId: 'custcol_main_ingredient_code',
                    value: itemLine.custcol_main_ingredient_code || ''
                });
                pageRec.setCurrentSublistValue({ //替代料等级
                    sublistId: itemSublist,
                    fieldId: 'custcol_substitute_material_level',
                    value: itemLine.custcol_substitute_material_level || ''
                });
                pageRec.setCurrentSublistValue({ //记录工单行ID
                    sublistId: itemSublist,
                    fieldId: 'custcol_po_replenish_source',
                    value: itemLine.line.toString(10)
                });
                pageRec.setCurrentSublistValue({ //第一次发料
                    sublistId: itemSublist,
                    fieldId: 'custcol_wip_first_store_issue',
                    value: itemLine.custcol_wip_first_store_issue || ''
                });
                pageRec.setCurrentSublistValue({ //第二次发料
                    sublistId: itemSublist,
                    fieldId: 'custcol_wip_second_store_issue',
                    value: itemLine.custcol_wip_second_store_issue || ''
                });
                pageRec.setCurrentSublistValue({ //第三次发料
                    sublistId: itemSublist,
                    fieldId: 'custcol_wip_third_store_issue',
                    value: itemLine.custcol_wip_third_store_issue || ''
                });
                pageRec.setCurrentSublistValue({ //第四次发料
                    sublistId: itemSublist,
                    fieldId: 'custcol_wip_fourth_store_issue',
                    value: itemLine.custcol_wip_fourth_store_issue || ''
                });
                pageRec.setCurrentSublistValue({ //第五次发料
                    sublistId: itemSublist,
                    fieldId: 'custcol_wip_fifith_store_issue',
                    value: itemLine.custcol_wip_fifith_store_issue || ''
                });
                pageRec.setCurrentSublistValue({ //需发料套数
                    sublistId: itemSublist,
                    fieldId: 'custcol_wip_need_kitting',
                    value: xflTaoShu //taoShu || ''
                });
                pageRec.setCurrentSublistValue({ //已发料套数
                    sublistId: itemSublist,
                    fieldId: 'custcol_wip_already_kitting',
                    value: yflTaoSHu || ''
                });
                pageRec.setCurrentSublistValue({ //需求总套数
                    sublistId: itemSublist,
                    fieldId: 'custcol_wip_sum_kitting',
                    value: totalTaoShu || ''
                });
                pageRec.setCurrentSublistValue({ //要转移之数量
                    sublistId: itemSublist,
                    fieldId: 'quantity',
                    value: transferQty,
                });
                pageRec.commitLine({
                    sublistId: itemSublist
                });
                isLastLineDone = true;
            } catch (ex) {
                failedLines.push({
                    itemId: itemId,
                    itemName: itemName,
                    msg: ex.message
                });
                isLastLineDone = false;
            }
        });

        //关闭提示
        switchSearchMessge(true);

        if (failedLines.length) {
            var errorMsg = failedLines.reduce(function (total, current) {
                return total + '<br />物料名称(ID)：' + current.itemName + '(' + current.itemId + '), 原因提示: ' + current.msg;
            }, '');

            dialogMod.alert({
                title: '提示',
                message: '某些工单行同步失败: ' + errorMsg
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
            scriptId = 'customscript_sl_get_wo_info',
            deploymentId = 'customdeploy_sl_get_wo_info';

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
            subsidiary = pageRec.getValue({
                fieldId: 'subsidiary'
            }),
            fromLocation = pageRec.getValue({
                fieldId: 'location'
            }),
            toLocation = pageRec.getValue({
                fieldId: 'transferlocation'
            }),
            woId = pageRec.getValue({
                fieldId: 'custbody_wip_work_order_id'
            }),
            transferType = pageRec.getValue({
                fieldId: 'custbody_wip_transfer_type'
            }),
            taoShu = pageRec.getValue({
                fieldId: 'custbody_wip_quantity'
            }),
            tllx = pageRec.getValue({
                fieldId: 'custbody_wip_stores_returne'
            }); //add by yuming hu

        if (!subsidiary) {
            dialogMod.alert({
                title: '提示',
                message: '请先选择子公司'
            });
            return false;
        }
        if (!woId) {
            dialogMod.alert({
                title: '提示',
                message: '请先选择工单'
            });
            return false;
        }
        if (!taoShu) {
            dialogMod.alert({
                title: '提示',
                message: '请先输入套数'
            });
            return false;
        }

        if (transferType == '1' || transferType == '2' || transferType == '5' || transferType == '7') { //正常发料和超领料
            if (!fromLocation) {
                dialogMod.alert({
                    title: '提示',
                    message: '请选择起始地点'
                });
                return false;
            }
        } else if (transferType == '3' || transferType == '6') { //退料
            if (!toLocation) {
                dialogMod.alert({
                    title: '提示',
                    message: '请先选择收货地点'
                });
                return false;
            }
        } else {
            dialogMod.alert({
                title: '提示',
                message: '请选择正确的转移类型'
            });
            return false;
        }

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
                    getaction: 'getwoinfo',
                    lingliaotype: transferType,
                    fromlocation: fromLocation,
                });
                // var reqUrl = getSearchWoURL({
                //     workorderid: woId,
                //     subsidiary: subsidiary,
                //     tllx: tllx || 0,
                //     getaction: 'getwoinfo'
                // });
                return httpsMod.get.promise({
                    url: reqUrl
                });
            } else {
                return Promise.reject('用户取消');
            }
        }).then(function (rspObj) {
            var rspBody = rspObj.body;
            // console.log('rspBody', rspBody);
            rspBody = JSON.parse(rspBody);
            if (rspBody.status === 'success') {
                addItemLines(rspBody.result);
            } else {
                throw new Error(rspBody.result);
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

    function validateWoInfo(context) {
        var pageRec = context.currentRecord,
            transferType = pageRec.getValue({
                fieldId: 'custbody_wip_transfer_type'
            }),
            woId = pageRec.getValue({
                fieldId: 'custbody_wip_work_order_id'
            }),
            itemSublist = 'item',
            curTransferQty,
            curIssuedQty,
            curReturnedQty,
            curAllQty,
            curBorderQty,
            curItemText,
            lineCount,
            i;

        if (woId) { //如果有工单，视为工单发料
            lineCount = pageRec.getLineCount({
                sublistId: itemSublist
            });
            if (transferType == '1') { //正常发料
                for (i = 0; i < lineCount; i++) {
                    curTransferQty = pageRec.getSublistValue({
                        sublistId: itemSublist,
                        fieldId: 'quantity',
                        line: i
                    });
                    curIssuedQty = pageRec.getSublistValue({
                        sublistId: itemSublist,
                        fieldId: 'custcol_quantity_issued',
                        line: i
                    }) || 0;
                    curReturnedQty = pageRec.getSublistValue({
                        sublistId: itemSublist,
                        fieldId: 'custcol_wip_returned_quantity',
                        line: i
                    }) || 0;
                    curAllQty = pageRec.getSublistValue({
                        sublistId: itemSublist,
                        fieldId: 'custcol_all_the_quantity',
                        line: i
                    }) || 0;
                    curBorderQty = curAllQty - (curIssuedQty - curReturnedQty);
                    curBorderQty = +curBorderQty.toFixed(5);
                    if (curTransferQty > curBorderQty) {
                        curItemText = pageRec.getSublistText({
                            sublistId: itemSublist,
                            fieldId: 'item',
                            line: i
                        });
                        dialogMod.alert({
                            title: '提示',
                            message: '第' + (i + 1) + '行的物料 ' + curItemText + ' 发料数量大于可发数量 ' + curBorderQty
                        });
                        return false;
                    }
                }
            } else if (transferType == '2') { //超领料
                for (i = 0; i < lineCount; i++) {
                    curTransferQty = pageRec.getSublistValue({
                        sublistId: itemSublist,
                        fieldId: 'quantity',
                        line: i
                    });
                    curIssuedQty = pageRec.getSublistValue({
                        sublistId: itemSublist,
                        fieldId: 'custcol_quantity_issued',
                        line: i
                    }) || 0;
                    curReturnedQty = pageRec.getSublistValue({
                        sublistId: itemSublist,
                        fieldId: 'custcol_wip_returned_quantity',
                        line: i
                    }) || 0;
                    curAllQty = pageRec.getSublistValue({
                        sublistId: itemSublist,
                        fieldId: 'custcol_all_the_quantity',
                        line: i
                    }) || 0;
                    curBorderQty = curAllQty - (curIssuedQty - curReturnedQty);
                    curBorderQty = +curBorderQty.toFixed(5);
                    if (curBorderQty > 0) {
                        curItemText = pageRec.getSublistText({
                            sublistId: itemSublist,
                            fieldId: 'item',
                            line: i
                        });
                        dialogMod.alert({
                            title: '提示',
                            message: '第' + (i + 1) + '行的物料 ' + curItemText + ' 仍有 ' + curBorderQty + ' 可正常发料，因此无法进行超领料'
                        });
                        return false;
                    }
                }
            } else if (transferType == '3') { //退料
                for (i = 0; i < lineCount; i++) {
                    curTransferQty = pageRec.getSublistValue({
                        sublistId: itemSublist,
                        fieldId: 'quantity',
                        line: i
                    });
                    curIssuedQty = pageRec.getSublistValue({
                        sublistId: itemSublist,
                        fieldId: 'custcol_quantity_issued',
                        line: i
                    }) || 0;
                    curReturnedQty = pageRec.getSublistValue({
                        sublistId: itemSublist,
                        fieldId: 'custcol_wip_returned_quantity',
                        line: i
                    }) || 0;
                    curAllQty = pageRec.getSublistValue({
                        sublistId: itemSublist,
                        fieldId: 'custcol_all_the_quantity',
                        line: i
                    }) || 0;
                    curBorderQty = curIssuedQty - curReturnedQty;
                    curBorderQty = +curBorderQty.toFixed(5);
                    if (curTransferQty > curBorderQty) {
                        curItemText = pageRec.getSublistText({
                            sublistId: itemSublist,
                            fieldId: 'item',
                            line: i
                        });
                        dialogMod.alert({
                            title: '提示',
                            message: '第' + (i + 1) + '行的物料 ' + curItemText + ' 退料数量大于可退数量 ' + curBorderQty
                        });
                        return false;
                    }
                }
            } else {
                // dialogMod.alert({
                //     title: '提示',
                //     message: '工单相关的转移只能选择正常发料，退料和超领料三种转移类型'
                // });
                // return false;
            }
        }

        return true;
    }

    function validateStockInfo(context) {
        var pageRec = context.currentRecord,
            transferType = pageRec.getValue({
                fieldId: 'custbody_wip_transfer_type'
            }),
            woId = pageRec.getValue({
                fieldId: 'custbody_wip_work_order_id'
            }),
            // fromLocation = pageRec.getValue({
            //     fieldId: 'location'
            // }),
            // itemIds = [],
            itemSublist = 'item',
            curItemId,
            curItemText,
            lineCount = pageRec.getLineCount({
                sublistId: itemSublist
            }),
            // reqUrl,
            // rspObj,
            // rspBody,
            itemStock,
            curTransferQty,
            outOfStockList = [],
            i;

        if (woId) {
            if (transferType == '1' || transferType == '2' || transferType == '3') {
                // for (i = 0; i < lineCount; i++) {
                //     curItemId = pageRec.getSublistValue({
                //         sublistId: itemSublist,
                //         fieldId: 'item',
                //         line: i
                //     });
                //     if (itemIds.indexOf(curItemId) === -1) {
                //         itemIds.push(curItemId);
                //     }
                // }

                //查询库存信息
                try {
                    // reqUrl = getSearchWoURL({
                    //     getaction: 'getstockinfo'
                    // });
                    // rspObj = httpsMod.post({
                    //     url: reqUrl,
                    //     body: {
                    //         fromlocation: fromLocation,
                    //         itemids: itemIds.join(',')
                    //     }
                    // });

                    // if (rspObj.code == 200) {
                    // console.log('validate stock', rspObj.body);
                    // rspBody = JSON.parse(rspObj.body);
                    // if (rspBody.status == 'success') {
                    for (i = 0; i < lineCount; i++) {
                        curItemId = pageRec.getSublistValue({
                            sublistId: itemSublist,
                            fieldId: 'item',
                            line: i
                        });
                        curTransferQty = pageRec.getSublistValue({
                            sublistId: itemSublist,
                            fieldId: 'quantity',
                            line: i
                        });
                        itemStock = pageRec.getSublistValue({
                            sublistId: itemSublist,
                            fieldId: 'quantityavailable',
                            line: i
                        });

                        // if (rspBody.result[curItemId]) {
                        //     itemStock = rspBody.result[curItemId].reduce(function (total, current) {
                        //         return total + current.quantityavailable;
                        //     }, 0);
                        // } else {
                        //     itemStock = 0;
                        // }

                        //验证库存量
                        if (curTransferQty > itemStock) {
                            curItemText = pageRec.getSublistText({
                                sublistId: itemSublist,
                                fieldId: 'item',
                                line: i
                            });
                            outOfStockList.push('第' + (i + 1) + '行物料 ' + curItemText + ', 现有可用量为' + itemStock + ', 转移量为' + curTransferQty);
                        }
                    }
                    //提示
                    if (outOfStockList.length) {
                        dialogMod.alert({
                            title: '提示',
                            message: '以下物料的库存信息不足，请修改后重试：<br />' + outOfStockList.join('<br />')
                        });
                        return false;
                    }
                    // } else {
                    //     throw new Error(rspBody.result);
                    // }
                    // } else {
                    //     throw new Error('网络超时');
                    // }
                } catch (ex) {
                    dialogMod.alert({
                        title: '提示',
                        message: '验证物料的库存信息失败，请稍后提交重试。错误提示：' + ex.message
                    });
                    return false;
                }
            }
        }

        return true;
    }

    function validateIsWoLine(context) {
        var pageRec = context.currentRecord,
            woId = pageRec.getValue({
                fieldId: 'custbody_wip_work_order_id'
            }),
            transferType = pageRec.getValue({
                fieldId: 'custbody_wip_transfer_type'
            }),
            woLineId;

        if (woId && (transferType)) {
            woLineId = pageRec.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_po_replenish_source'
            });
            if (!woLineId) {
                dialogMod.alert({
                    title: '提示',
                    message: '工单转移单不允许添加非工单行'
                });
                return false;
            }
        }

        return true;
    }

    function getRemainTaoShu(context) {
        var pageRec = context.currentRecord,
            woId = pageRec.getValue({
                fieldId: context.fieldId
            });

        if (woId) {
            var reqUrl = getSearchWoURL({
                workorderid: woId,
                getaction: 'getremaintaoshu'
            });
            httpsMod.get.promise({
                url: reqUrl
            }).then(function (rspObj) {
                var rspBody = rspObj.body;
                // console.log('rspBody', rspBody);
                rspBody = JSON.parse(rspBody);
                if (rspBody.status === 'success') {
                    pageRec.setValue({
                        fieldId: 'custbody_wip_quantity',
                        value: rspBody.result.remainTaoShu
                    });
                } else {
                    throw new Error(rspBody.result);
                }
            }).catch(function (reason) {
                dialogMod.alert({
                    title: '错误',
                    message: '获取剩余套数信息失败，请您手动输入，错误提示：' + (reason instanceof Error ? reason.message : reason)
                });
            });
        } else {
            pageRec.setValue({
                fieldId: 'custbody_wip_quantity',
                value: ''
            });
        }
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
        var isWoInfoOk = validateWoInfo(context);
        if (!isWoInfoOk) {
            return false;
        }

        //验证物料库存信息是否足够，防止自动发货报错
        var isStockInfoOk = validateStockInfo(context);
        if (!isStockInfoOk) {
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

    function chargeTaoshu(context) {
        var pageRec = context.currentRecord,
            wnkQty,
            bomQty;

        wnkQty = pageRec.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_wip_need_kitting'
        });

        //custcol_bom_standard_quantity
        //bom标准用量
        bomQty = pageRec.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_bom_standard_quantity'
        });


        pageRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            value: Number(wnkQty) * Number(bomQty) || ''
        });

        // console.log(wnkQty);
        // console.log(bomQty);
    }

    function chargeLocation(context) {
        var pageRec = context.currentRecord,
            transferType,
            subsidiaryValue,
            tllxValue; //custbody_wip_stores_returne

        transferType = pageRec.getValue({
            fieldId: 'custbody_wip_transfer_type'
        });

        subsidiaryValue = pageRec.getValue({
            fieldId: 'subsidiary'
        });

        tllxValue = pageRec.getValue({
            fieldId: 'custbody_wip_stores_returne'
        });

        // console.log(subsidiaryValue);
        // console.log('tllxValue', tllxValue);

        if (transferType == '3' && tllxValue) {
            var reqUrl = getSearchWoURL({
                subsidiary: subsidiaryValue,
                tllx: tllxValue,
                getaction: 'getloction'
            });
            httpsMod.get.promise({
                url: reqUrl
            }).then(function (rspObj) {
                var rspBody = rspObj.body;
                console.log('rspBody', rspBody);
                rspBody = JSON.parse(rspBody);
                if (rspBody.status === 'success') {
                    pageRec.setValue({
                        fieldId: 'transferlocation',
                        value: rspBody.sllocation
                    });
                } else {
                    throw new Error(rspBody.result);
                }
            }).catch(function (reason) {
                dialogMod.alert({
                    title: '错误',
                    message: '获取地点失败，请您手动输入，错误提示：' + reason
                });
            });
        }
    }

    function fieldChanged(context) {
        if (context.fieldId === 'custbody_wip_work_order_id') {
            getRemainTaoShu(context);
        }

        if (context.fieldId === 'custbody_wip_stores_returne') {
            chargeLocation(context);
        }

        if (context.sublistId === 'item' && context.fieldId === 'custcol_wip_need_kitting') {
            chargeTaoshu(context);
        }
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        // validateLine: validateLine,
        custSyncWoLines: syncWoLines
    }
});
/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define([
    'N/task',
    '../../app/app_inv_common.js'
], function (
    task,
    invCommon
) {
    var gIwilSublistId = 'recmachcustrecord_woc_item_line',
        gRwprSublistId = 'recmachcustrecordcustrecord__woc_process_route',
        mrScriptId = 'customscript_mr_wwoc_transfer';

    function beforeLoad(context) {

        if (context.type === context.UserEventType.CREATE) {
            addSycnWoButton(context.form);
        }
    }

    function beforeSubmit(context) {

    }

    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE) {
            var woCompRecId = workordercomplationCreation(context);
            if (woCompRecId) {
                transferOrderCreation(context);
            }
        }
    }

    function workordercomplationCreation(context) {
        var newRecord = context.newRecord,
            cache = newRecord.getValue({
                fieldId: 'custrecord_cache'
            }),
            createdfrom = newRecord.getValue({
                fieldId: 'custrecord_woc_createdfrom'
            }),
            completedquantity = newRecord.getValue({
                fieldId: 'custrecord_woc_completedquantity'
            }),
            cwBatch = newRecord.getValue({
                fieldId: 'custrecord_woc_inventorydetail'
            }),
            cwdd = newRecord.getValue({
                fieldId: 'custrecord_woc_date_due'
            }),
            inventorydetail = [],
            inventorydetailObj = {
                receiptinventorynumber: cwBatch,
                quantity: completedquantity,
                expirationdate: cwdd
            },
            itemLineCount,
            componentObj = {},
            componentList = [],
            fOnhandList = [],
            fMap = {},
            fKey,
            tOnhandList = [],
            inQty,
            main = {},
            option = {},
            sequence = [],
            cacheParse = {},
            operationLineCount;

        log.debug('cache', cache);
        log.debug('newRecord', newRecord);
        inventorydetail.push(inventorydetailObj);

        //fOnhandList = JSON.parse(cache);
        cacheParse = JSON.parse(cache);
        log.debug('cacheParse', cacheParse);

        fOnhandList = cacheParse.data.onHandDetail;
        //operation = cacheParse.data.operation;
        log.debug('fOnhandList', fOnhandList);
        //log.debug('operation', operation);

        var operationLineCount = newRecord.getLineCount({
            sublistId: gRwprSublistId
        });

        for (var i = 0; i < operationLineCount; i++) {

            var cwpoValue = newRecord.getSublistValue({
                sublistId: gRwprSublistId,
                fieldId: 'custrecord_woc_pr_operationsequence',
                line: i
            });
            sequence.push(cwpoValue);
        }

        log.debug('sequence', sequence);

        main = {
            createdfrom: createdfrom,
            startoperation: (Math.min.apply(null, sequence)).toString(), //'5', //10
            endoperation: (Math.max.apply(null, sequence)).toString(), //10
            completedquantity: completedquantity,
            quantity: completedquantity,
            inventorydetail: inventorydetail
        };

        log.debug('main', main);

        log.debug('fOnhandList', fOnhandList);

        for (var i = 0; i < fOnhandList.length; i++) {
            fKey = fOnhandList[i]['item'];

            if (!fMap[fKey]) {

                fMap[fKey] = {
                    item: fKey,
                    batch: []
                };

                fMap[fKey]['batch'].push({
                    inventorynumber: fOnhandList[i]['inventorynumber'],
                    quantity: (fOnhandList[i]['quantity'] < fOnhandList[i]['inventoryNumberquantityonhand'] ? fOnhandList[i]['quantity'] : fOnhandList[i]['inventoryNumberquantityonhand'])
                });

            } else {
                fMap[fKey]['batch'].push({
                    inventorynumber: fOnhandList[i]['inventorynumber'],
                    quantity: (fOnhandList[i]['quantity'] < fOnhandList[i]['inventoryNumberquantityonhand'] ? fOnhandList[i]['quantity'] : fOnhandList[i]['inventoryNumberquantityonhand'])
                });
            }
        }

        log.debug('fMap', fMap);

        Object.keys(fMap).forEach(function (result) {
            tOnhandList.push(fMap[result]);
            return true;
        });

        log.debug('tOnhandList', tOnhandList);

        var itemLineCount = newRecord.getLineCount({
            sublistId: gIwilSublistId
        });

        for (var i = 0; i < itemLineCount; i++) {
            componentObj = {
                item: '',
                quantity: 0,
                componentinventorydetail: []
            };

            componentObj.item = newRecord.getSublistValue({
                sublistId: gIwilSublistId,
                fieldId: 'custrecord_woc_il_item',
                line: i
            });

            componentObj.quantity = newRecord.getSublistValue({
                sublistId: gIwilSublistId,
                fieldId: 'custrecord_woc_il_quantity',
                line: i
            });

            componentList.push(componentObj);
        }

        log.debug('componentList', componentList);

        //f
        for (var i = 0; i < componentList.length; i++) {
            for (var j = 0; j < tOnhandList.length; j++) {
                if (componentList[i]['item'] == tOnhandList[j]['item']) {
                    var _batch = tOnhandList[j]['batch'];
                    inQty = componentList[i]['quantity'];
                    for (var k = 0; k < _batch.length; k++) {
                        // if (inQty <= _batch[k]['quantity']) {
                        //     componentList[i]['componentinventorydetail'].push({
                        //         issueinventorynumber: _batch[k]['inventorynumber'],
                        //         quantity: inQty
                        //     });
                        //     break;
                        // } else {
                        //     inQty = inQty - _batch[k]['quantity'];
                        // }

                        //Charles Zhang 2020.8.4修改
                        var lineQty = Math.min(inQty, _batch[k]['quantity']);
                        componentList[i]['componentinventorydetail'].push({
                            issueinventorynumber: _batch[k]['inventorynumber'],
                            quantity: lineQty
                        });
                        inQty -= lineQty;
                        inQty = +inQty.toFixed(6);
                        if (inQty <= 0) {
                            break;
                        }
                    }
                }
            }
        }

        log.debug('componentList', componentList);

        option = {
            main: main,
            component: componentList,
            enableSourcing: true,
            ignoreMandatoryFields: true
        };

        log.debug('option', option);

        var recId = invCommon.workordercompletionCreationSt(option);

        log.debug('recId', recId);

        return recId;

    }

    function transferOrderCreation(context) {
        var wrMain = {
            custrecord_woc_item: '', //装配件
            custrecord_woc_createdfrom: '', //创建自（工单）
            custrecord_woc_subsidiary: '', //子公司
            custrecord_woc_location: '', //地点 from
            custrecord_woc_completedquantity: 0, //已完工数量
            custrecord_woc_inventorydetail: '', //已完工批次
            custrecord_woc_default_warehouse: '', //默认仓库
            custrecord_woc_whether_item_transfer: false, //物料是否转移
            custrecord_woc_up_wo: '',
            custrecord_woc_up_location: ''
        },
            newRecord = context.newRecord;

        for (var key in wrMain) {
            if (wrMain.hasOwnProperty(key)) {

                wrMain[key] = newRecord.getValue({
                    fieldId: key
                })
            }
        }

        log.debug('wrMain', wrMain);

        //如果不勾选转移，则直接返回
        if (!wrMain.custrecord_woc_whether_item_transfer) {
            return;
        }

        mrTask = task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: mrScriptId,
            params: {
                custscript_dosomething_forwwoctransfer: JSON.stringify({
                    wrMain: wrMain
                })
            }
        });

        mrTask.submit();
    }

    //添加前端同步按钮
    function addSycnWoButton(form) {
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

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
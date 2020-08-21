/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/ui/serverWidget'], function (record, search, serverWidget) {

    //�����˻���
    function addReturns(context) {
        var thisRecord = context.newRecord,
            lineCount = thisRecord.getLineCount({
                sublistId: 'item'
            }),
            replenishLines = [],
            replenishFieldId = 'custcol_vender_return_or_not',
            poRec,
            poLineCount,
            isReplenish,
            createdFrom = thisRecord.getValue({
                fieldId: 'createdfrom'
            }),
            itemIds = [],
            itemId,
            poCustColumnIds = [],
            excludeCustColumns = [
                'custcol_po_replenish_or_not',
                'custcol_po_replenish_source'
            ],
            i;
        if (!createdFrom) {
            return true;
        }
        
        for (var i = 0; i < lineCount; i++) {
            isReplenish = thisRecord.getSublistValue({
                sublistId: 'item',
                fieldId: replenishFieldId,
                line: i
            });
            
            if (isReplenish === true) {//����ǳ���po���У������Ϊ�貹��
                itemId = thisRecord.getSublistValue({//��ȡ����id
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                }) + '';

                replenishLines.push({
                    itemId: itemId,
                    itemQty: thisRecord.getSublistValue({//��ȡ��������
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    }) + '',
                    lineId: thisRecord.getSublistValue({//��ȡ��������
                        sublistId: 'item',
                        fieldId: 'line',
                        line: i
                    }) + ''
                });
                if (itemIds.indexOf(itemId) === -1) {
                    itemIds.push(itemId);
                }
            }
        }
        //var itemQtys = getItemFulfillmentQty(thisRecord.id, itemIds);

        if (replenishLines.length) {
            try {
                //������Ӧ��po����Ϣ
                search.create({
                    type: thisRecord.type,
                    filters: [
                        ['mainline', 'is', 'F'],
                        'AND',
                        ['taxline', 'is', 'F'],
                        'AND',
                        ['internalid', 'is', thisRecord.id],
                        'AND',
                        ['item', 'anyof', itemIds],
                        'AND',
                        ['appliedtotransaction', 'anyof', createdFrom]
                    ],
                    columns: [
                        {
                            name: 'item'
                        },
                        {
                            name: 'line'
                        },
                        {
                            name: 'line',
                            join: 'appliedtotransaction'
                        }
                    ]
                }).run().each(function (result) {
                    var item = result.getValue({
                        name: 'item'
                    }) + '';
                    var itemLine = result.getValue({
                        name: 'line'
                    }) + '';
                    var poLine = result.getValue({
                        name: 'line',
                        join: 'appliedtotransaction'
                    }) + '';
                    replenishLines.some(function (currentLine) {
                        if (currentLine.itemId === item && currentLine.lineId === itemLine) {
                            currentLine.poLine = poLine;
                            return true;
                        }
                        return false;
                    });

                    return true;
                });

                log.debug('replenishLines after search', replenishLines);
                
                //��po�Ͻ��в���
                poRec = record.load({
                    type: 'purchaseorder',
                    id: createdFrom,
                    isDynamic: true
                });
                poLineCount = poRec.getLineCount({
                    sublistId: 'item'
                });
                poCustColumnIds = poRec.getSublistFields({
                    sublistId: 'item'
                });
                poCustColumnIds = poCustColumnIds.filter(function (columnId) {
                    return columnId.indexOf('custcol') === 0 && excludeCustColumns.indexOf(columnId) === -1;
                });

                //�������
                replenishLines.forEach(function (eachLine) {
                    var itemRate,
                        itemUnit,
                        itemTax,
                        // memo,
                        department,
                        location,
                        poItem,
                        poLine,
                        isTargetFound = false,
                        valueMap = {},
                        i;

                    for (i = 0; i < poLineCount; i++) {
                        poItem = poRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        }) + '';
                        poLine = poRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'line',
                            line: i
                        }) + '';
                        if (poItem === eachLine.itemId && poLine === eachLine.poLine) {
                            itemRate = 0;/* poRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: i
                            }); *///退货补货行单价固定为0，仅仅只是为了能够入库而已。
                            itemUnit = poRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'units',
                                line: i
                            });
                            itemTax = poRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'taxcode',
                                line: i
                            });
                            // memo = poRec.getSublistValue({
                            //     sublistId : 'item',
                            //     fieldId : 'memo',
                            //     line : i
                            // });
                            department = poRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'department',
                                line: i
                            });
                            location = poRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'location',
                                line: i
                            });
                            poCustColumnIds.reduce(function (total, columnId) {
                                total[columnId] = poRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: columnId,
                                    line: i
                                });
                                return total;
                            }, valueMap);
                            isTargetFound = true;
                            break;
                        }
                    }

                    //����
                    if (isTargetFound) {
                        poRec.selectNewLine({
                            sublistId: 'item'
                        });
                        //��ǲ�����
                        poRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_po_replenish_or_not',
                            value: true
                        });
                        poRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_po_replenish_source',
                            value: eachLine.poLine
                        });
                        //���ñ�׼�ֶ�
                        poRec.setCurrentSublistValue({//��Ʒ
                            sublistId: 'item',
                            fieldId: 'item',
                            value: eachLine.itemId
                        });
                        poRec.setCurrentSublistValue({//����
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: eachLine.itemQty
                        });
                        poRec.setCurrentSublistValue({//��λ
                            sublistId: 'item',
                            fieldId: 'units',
                            value: itemUnit
                        });
                        poRec.setCurrentSublistValue({//����
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: itemRate
                        });
                        poRec.setCurrentSublistValue({//˰��
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            value: itemTax
                        });
                        // poRec.setCurrentSublistValue({//��ע
                        //     sublistId : 'item',
                        //     fieldId : 'memo',
                        //     value : memo
                        // });
                        poRec.setCurrentSublistValue({//����
                            sublistId: 'item',
                            fieldId: 'department',
                            value: department
                        });
                        poRec.setCurrentSublistValue({//�ص�
                            sublistId: 'item',
                            fieldId: 'location',
                            value: location
                        });

                        //�����Զ����ֶ�
                        util.each(valueMap, function (value, id) {
                            try {
                                //��ֹ���Զ����ֶ��й��˹�ϵ��ʧ��
                                poRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: id,
                                    value: value
                                });
                            } catch (e) { }
                        });

                        poRec.commitLine({
                            sublistId: 'item'
                        });
                    }
                });

                poRec.save({
                    ignoreMandatoryFields: true
                });
                throw JSON.stringify(replenishLines);
            } catch (ex) {
                log.error({
                    title: '��PO����ʧ�ܣ��˻���ȨID��' + thisRecord.id,
                    details: ex
                });
            }
        }
    }

    //Ĭ�Ϲ�ѡ����
    function autoSelectBuhuo(context) {
        var newRecord = context.newRecord,
            lineCount = newRecord.getLineCount({
                sublistId: 'item'
            }),
            replenishFieldId = 'custcol_vender_return_or_not',
            i;

        try {
            for (i = lineCount - 1; i >= 0; i--) {
                newRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId : replenishFieldId,
                    line: i,
                    value : true
                });
            }
        } catch (ex) {
            log.error({
                title: '�Զ���ѡ��������',
                details: ex
            });
        }
    }

    //ɾ�������˻���
    // function deleteAllLines(context) {
    //     var newRecord = context.newRecord,
    //         lineCount = newRecord.getLineCount({
    //             sublistId: 'item'
    //         }),
    //         i;

    //     try {
    //         for (i = lineCount - 1; i >= 0; i--) {
    //             newRecord.removeLine({
    //                 sublistId: 'item',
    //                 line: i
    //             });
    //         }
    //     } catch (ex) {
    //         log.error({
    //             title: 'remove all lines error',
    //             details: ex
    //         });
    //     }
    // }

    function hdnPriceFields(form, fields) {
        for(var fieldId in fields) {
            var sublistFields = fields[fieldId];
            if(typeof sublistFields != "object") {
                form.getField(fieldId).updateDisplayType({displayType: 'hidden'});
            } else {
                for(var sublistFieldId in sublistFields) {
                    var subFieldId = Array.isArray(sublistFields)? sublistFields[sublistFieldId]: sublistFieldId;
                    form.getSublist({
                        id: fieldId
                    }).getField(subFieldId).updateDisplayType({displayType: 'hidden'});
                }
            }
        }
    }

    function getItemFulfillmentQty(createFrom, itemId) {
        var ret = {};
        debugger
        search.create({
            type: "itemfulfillment",
            columns: ["item", "quantity"],
            filters: [
                ["type", "anyof", "ItemShip"],
                "AND",
                ["createdfrom", "anyof", createFrom],
                "AND",
                ["item", "anyof", itemId]
            ]
        }).run().each(function(result) {
            var col0Value = result.getValue(result.columns[0]);
            var col1Value = result.getValue(result.columns[1]);
            ret[col0Value] = Math.abs(ret[col1Value] || col1Value);
            return true;
        });
        return ret;
    }

    //entry points
    function beforeLoad(scriptContext) {
        if (scriptContext.type == scriptContext.UserEventType.CREATE) {
            autoSelectBuhuo(scriptContext);
        }
        hdnPriceFields(scriptContext.form, {
            "usertotal": true,
            "item": ["amount", "grossamt", "tax1amt", "taxrate1"]
        });
    }

    function afterSubmit(scriptContext) {
        //if (scriptContext.type == scriptContext.UserEventType.APPROVE) {
            try{
                addReturns(scriptContext);
            } catch(e) {
                throw JSON.stringify(e)
            }
        //}
    }

    return {
        beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});
/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/ui/serverWidget'], function (record, search, serverWidget) {

    //�1�7�1�7�1�7�1�7�1�7�0�1�1�7�1�7�1�7
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
            
            if (isReplenish === true) {//�1�7�1�7�1�7�1�7�0�5�1�7�1�7�1�7po�1�7�1�7�1�7���1�7�1�7�1�7�1�7�1�7�1�7�0�2�1�7�K�1�7�1�7
                itemId = thisRecord.getSublistValue({//�1�7�1�7�0�0�1�7�1�7�1�7�1�7id
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                }) + '';

                replenishLines.push({
                    itemId: itemId,
                    itemQty: thisRecord.getSublistValue({//�1�7�1�7�0�0�1�7�1�7�1�7�1�7�1�7�1�7�1�7�1�7
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    }) + '',
                    lineId: thisRecord.getSublistValue({//�1�7�1�7�0�0�1�7�1�7�1�7�1�7�1�7�1�7�1�7�1�7
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
                //�1�7�1�7�1�7�1�7�1�7�1�7�0�8�1�7�1�7po�1�7�1�7�1�7�1�7�0�4
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
                
                //�1�7�1�7po�1�7�0�1�1�7�1�7�ӄ1�7�1�7�1�7
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

                //�1�7�1�7�1�7�1�7�1�7�1�7�1�7
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
                            itemRate = poRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: i
                            }); //�˻������е��۹̶�Ϊ0������ֻ��Ϊ���ܹ������ѡ�
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

                    //�1�7�1�7�1�7�1�7
                    if (isTargetFound) {
                        poRec.selectNewLine({
                            sublistId: 'item'
                        });
                        //�1�7�1�7�0�4�1�7�1�7�1�7�1�7�1�7
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
                        //�1�7�1�7�1�7�0�9�1�7�0�6�1�7�0�6�1�7
                        poRec.setCurrentSublistValue({//�1�7�1�7�0�3
                            sublistId: 'item',
                            fieldId: 'item',
                            value: eachLine.itemId
                        });
                        poRec.setCurrentSublistValue({//�1�7�1�7�1�7�1�7
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: eachLine.itemQty
                        });
                        poRec.setCurrentSublistValue({//�1�7�1�7��
                            sublistId: 'item',
                            fieldId: 'units',
                            value: itemUnit
                        });
                        poRec.setCurrentSublistValue({//�1�7�1�7�1�7�1�7
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: itemRate
                        });
                        poRec.setCurrentSublistValue({//�0�0�1�7�1�7
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            value: itemTax
                        });
                        // poRec.setCurrentSublistValue({//�1�7�1�7�0�0
                        //     sublistId : 'item',
                        //     fieldId : 'memo',
                        //     value : memo
                        // });
                        poRec.setCurrentSublistValue({//�1�7�1�7�1�7�1�7
                            sublistId: 'item',
                            fieldId: 'department',
                            value: department
                        });
                        poRec.setCurrentSublistValue({//�1�7�1�3�1�7
                            sublistId: 'item',
                            fieldId: 'location',
                            value: location
                        });

                        log.debug(' add po line ',poLine + ".1");
                        poRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_line',
                            value: poLine + ".1"
                        });

                        //�1�7�1�7�1�7�1�7�1�7�0�8�1�7�1�7�1�7�1�7�0�6�1�7
                        util.each(valueMap, function (value, id) {
                            try {
                                //�1�7�1�7�0�9�1�7�1�7�1�7�0�8�1�7�1�7�1�7�1�7�0�6�1�7�1�7�ۄ1�7�1�7�0�9�1�7�0�3�1�7�1�7�0�2�1�7�1�7
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
            } catch (ex) {
                log.error({
                    title: '�1�7�1�7PO�1�7�1�7�1�7�1�7�0�2�1�7�1�1�1�7�1�7�0�1�1�7�1�7�1�7�0�7ID�1�7�1�7' + thisRecord.id,
                    details: ex
                });
            }
        }
    }

    //�0�8�1�7�0�7�1�7�0�5�1�7�1�7�1�7�1�7
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
                title: '�1�7�0�8�1�7�1�7�1�7�0�5�1�7�1�7�1�7�1�7�1�7�1�7�1�7�1�7',
                details: ex
            });
        }
    }

    //�0�1�1�7�1�7�1�7�1�7�1�7�1�7�1�7�0�1�1�7�1�7�1�7
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
        var isAddReturns = scriptContext.newRecord.getValue("custbody_purchase_replenishment");
        if (scriptContext.type == scriptContext.UserEventType.APPROVE && isAddReturns) {
            addReturns(scriptContext);
        }
    }

    return {
        beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});
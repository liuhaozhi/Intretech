/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 @author yuming Hu
 *@description 创建采购申请
 */
define([
    'N/search',
    'N/record',
    'N/format',
    '../../app/app_po_common.js'
], function (
    search,
    record,
    format,
    poCommon) {

    var gCustomPrRecord = 'customrecord_purchase_requisition',
        gStatusFieldId = 'custrecord_pr_imp_status',
        gErrMsgFieldId = 'custrecord_error_message',
        gPrNumber = 'custrecord_sdpr_number',
        gRunningCode = 2,
        gSuccessCode = 3,
        gErrorCode = 4;

    function prFromOAvalidation(oaNUmber) {
        var columns = [{
                name: 'internalid' //请求编号
            }],
            filters = [
                ["type", "anyof", "PurchReq"],
                "AND",
                ["mainline", "is", "T"],
                "AND",
                ["custbody_pr_oa_number_2", "is"].concat(oaNUmber)
            ],
            sublistSearchCriteria = {
                type: 'purchaserequisition',
                filters: filters,
                columns: columns
            },
            searchObj,
            isEx = false;
        try {
            searchObj = search.create(sublistSearchCriteria);
            searchObj.run().each(function (result, i) {
                isEx = true;
                return true;
            });

            return {
                errmsg: isEx ? '该采购申请已创建，请不要重复创建，修改后重试' : '',
                errFlag: isEx
            };
        } catch (ex) {
            log.error({
                title: 'getInputData 查询',
                details: ex
            });
        }
    }

    function getInputData() {
        //货品查询
        var columns = [{
                    name: 'custrecord_pr_subsidiary' //子公司
                },
                {
                    name: 'custrecord_pr_entity' //申请人
                },
                {
                    name: 'custrecord_pr_trandate' //日期
                },
                {
                    name: 'custrecord_po_list_pur_type' //采购类型
                },
                {
                    name: 'custrecord_pr_item' //货品
                },
                {
                    name: 'custrecord_pr_quantity' //数量
                },
                {
                    name: 'custrecord_line_number_cux' //行号
                },
                {
                    name: 'custrecord_oa_number' //oa编号
                },
                {
                    name: 'custrecord_is_created_pr' //创建过采购订单
                },
                {
                    name: 'custrecord_pr_imp_status' //状态
                },
                {
                    name: 'custrecord_error_message' //错误信息
                },
                {
                    name: 'custrecord_sdpr_number' //请求编号
                },
                {
                    name: 'internalid' //请求编号
                },
                {
                    name: 'custrecord_location_pr' //请求编号
                }
            ],
            filters = [
                ["custrecord_sdpr_number", "anyof", "@NONE@"],
                "AND",
                ["custrecord_is_created_pr", "is", "F"],
                "AND",
                ["custrecord_pr_imp_status", "anyof", "@NONE@", "1"]
            ],
            sublistSearchCriteria = {
                type: gCustomPrRecord,
                filters: filters,
                columns: columns
            },

            searchObj = search.create(sublistSearchCriteria);

        return searchObj;
    }

    function map(context) {

        var custPrRec;

        var value = JSON.parse(context.value);

        log.debug('value', value);

        try {
            custPrRec = record.load({
                type: value.recordType,
                id: value.id,
                isDynamic: true
            });

            custPrRec.setValue({
                fieldId: gStatusFieldId,
                value: gRunningCode,
                ignoreFieldChange: false
            });

            custPrRec.save();
        } catch (ex) {
            log.error({
                title: '创建采购申请',
                details: ex
            });
        }

        context.write({
            key: value.values.custrecord_oa_number,
            value: value
        });

    }

    function reduce(context) {
        var custPrRec,
            prSubsidiary,
            prEntity,
            prTrandate,
            prTrandateParse,
            poLocation,
            purType,
            errmsg,
            errFlag = false,
            option = {
                main: {},
                items: []
            };

        var values = context.values;

        for (var i = 0; i < values.length; i++) {

            var value = JSON.parse(values[i]);

            var _prSubsidiary = value.values.custrecord_pr_subsidiary.value,
                _prEntity = value.values.custrecord_pr_entity.value,
                _prTrandate = value.values.custrecord_pr_trandate,
                _purType = value.values.custrecord_po_list_pur_type.value,
                _item = value.values.custrecord_pr_item.value,
                _quantity = value.values.custrecord_pr_quantity,
                _lineNumber = value.values.custrecord_line_number_cux,
                _poLocation = value.values.custrecord_location_pr.value;

            option.items.push({
                item: _item,
                //estimatedamount: _quantity,
                quantity: _quantity,
                custcol_pr_oa_line_number: _lineNumber
            });

            //交验是否可下采购申请
            if (prSubsidiary) {
                if (prSubsidiary !== _prSubsidiary) {
                    errFlag = true;
                    errmsg = '同一个采购申请必须为同一个子公司，请修改后重试';
                    break;
                }
            } else {
                prSubsidiary = _prSubsidiary;
            }

            if (prEntity) {
                if (prEntity !== _prEntity) {
                    errFlag = true;
                    errmsg = '同一个采购申请必须为同一个申请人，请修改后重试';
                    break;
                }
            } else {
                prEntity = _prEntity;
            }

            if (prTrandate) {
                if (prTrandate !== _prTrandate) {
                    errFlag = true;
                    errmsg = '同一个采购申请必须为同一个申请日期，请修改后重试';
                    break;
                }
            } else {
                prTrandate = _prTrandate;
            }

            if (purType) {
                if (purType !== _purType) {
                    errFlag = true;
                    errmsg = '同一个采购申请必须为同一个子公司，请修改后重试';
                    break;
                }
            } else {
                purType = _purType;
            }

            if (poLocation) {
                if (poLocation !== _poLocation) {
                    errFlag = true;
                    errmsg = '同一个采购申请必须为同一个地点，请修改后重试';
                    break;
                }
            } else {
                poLocation = _poLocation;
            }
        }

        //交验是否已经下单采购申请
        var rtn = prFromOAvalidation(context.key);
        var errFlag = rtn.errFlag;
        var errmsg = rtn.errmsg;

        if (errFlag) {

            for (var i = 0; i < values.length; i++) {

                var value = JSON.parse(values[i]);

                try {
                    custPrRec = record.load({
                        type: value.recordType,
                        id: value.id,
                        isDynamic: true
                    });

                    custPrRec.setValue({
                        fieldId: gStatusFieldId,
                        value: gErrorCode,
                        ignoreFieldChange: false
                    });

                    custPrRec.setValue({
                        fieldId: gErrMsgFieldId,
                        value: errmsg,
                        ignoreFieldChange: false
                    });

                    custPrRec.save();
                } catch (ex) {
                    log.error({
                        title: '创建采购申请',
                        details: ex
                    });
                }
            }
        } else {

            //解析日期
            prTrandateParse = format.parse({
                type: format.Type.DATE,
                value: prTrandate,
                timezone: format.Timezone.ASIA_HONG_KONG
            });

            log.debug('poLocation', poLocation);
            option.main = {
                entity: prEntity,
                subsidiary: prSubsidiary,
                location: poLocation,
                trandate: prTrandateParse, //new Date(),
                custbody_po_list_pur_type: purType,
                custbody_pr_oa_number: context.key
            };

            var recId = poCommon.prCreation(option);

            if (recId) {
                for (var i = 0; i < values.length; i++) {

                    var value = JSON.parse(values[i]);

                    try {
                        custPrRec = record.load({
                            type: value.recordType,
                            id: value.id,
                            isDynamic: true
                        });

                        custPrRec.setValue({
                            fieldId: gStatusFieldId,
                            value: gSuccessCode,
                            ignoreFieldChange: false
                        });

                        custPrRec.setValue({
                            fieldId: gPrNumber,
                            value: recId,
                            ignoreFieldChange: false
                        });

                        custPrRec.save();
                    } catch (ex) {
                        log.error({
                            title: '创建采购申请',
                            details: ex
                        });
                    }
                }
            }
        }

        context.write({
            key: context.key,
            value: JSON.parse(context.values[0])
        });
    }

    function summarize(summary) {
        var processResults = {};

        //记录错误
        if (summary.inputSummary.error) {
            log.error({
                title: 'Input Error',
                details: summary.inputSummary.error
            });
        }
        summary.mapSummary.errors.iterator().each(function (key, error, executionNo) {
            log.error({
                title: 'Map error key: ' + key,
                details: error
            });
            return true;
        });
        summary.reduceSummary.errors.iterator().each(function (key, error, executionNo) {
            log.error({
                title: 'Reduce error key: ' + key,
                details: error
            });
            return true;
        });

        //遍历结果
        summary.output.iterator().each(function (key, value) {
            processResults[key] = value;
            return true;
        });

        log.error({
            title: '成功处理结果摘要',
            details: processResults
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
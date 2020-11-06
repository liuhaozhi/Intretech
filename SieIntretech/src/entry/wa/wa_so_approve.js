/**
 *@NApiVersion 2.0
 *@NScriptType WorkflowActionScript
 *@author yuming Hu
 *@description  该脚本用于销售订单的审批
 */
define([
    'N/search',
    '../../app/app_so_common.js'
], function (
    search,
    soCommon
) {
    var gItemSublistId = 'item',
        gSubsidiaryFieldId = 'subsidiary', //可用于事务处理上的子公司字段、客户主数据上的主要子公司字段
        gInternalidFieldId = 'internalid', //内部标示Id
        gCurrencyFieldId = 'currency',
        gEntityFieldId = 'entity',
        gApprovalstatusFieldId = 'approvalstatus',
        gIdFieldId = 'id',
        gTranidFieldId = 'tranid',
        gSlItemFieldId = 'item',
        gSlRateFieldId = 'rate',
        gSlLineFieldId = 'line',
        gSlQuantityFieldId = 'quantity',
        gTrandateFieldId = 'trandate',
        gTaxitem = 'taxitem', //税项
        gSlAmountFieldId = 'amount',
        gSlexpectedshipdateFieldId = 'expectedshipdate'; //交货日期

    function onAction(scriptContext) {
        autoSoCreation(scriptContext);
    }

    //内部交易自动创建销售订单
    function autoSoCreation(scriptContext) {
        //这里有几个字段，使用了标准的字段，（折后单价(不含税)，折后合计金额(不含税)，含税总金额(原币)，含税总金额（本币））
        var fromSoRecord = scriptContext.newRecord,
            customformDefultValue = 152, //162，141为当前的id
            ordertypeDefultValue = 11,
            cosDefultValue = 3,
            cosFieldId = 'custbody_order_status',
            ifFromIctFieldId = 'custbody_customer_order', //来源订单判定条件
            isToIctFieldId = 'custbody_whether_ntercompany_transact', //目标订单是否公司间交易
            fromSoWdFieldId = 'custbody_wip_documentmaker', //来源单据制单人
            toSdcFieldId = 'custbody_source_doc_creator', //来源单据创建人
            ordertypeFieldId = 'custbody_cust_ordertype',
            toSoSoidFieldId = 'custbody_sales_order_inter_discount', //公司间交易折扣
            toSofcFieldId = 'custbody_final_customer', //最终客户

            //// add by andy list
            toSoDocOldFieldID = 'custbody_document_old',// 旧订单编号（K3销售订单编号）
            toSoMemoFieldID = 'memo',//MEMO
            toSoCustOrdNumFieldID = 'custbody_wip_customer_order_number',//     1、客户订单号： 
            toSoExpOrNotFieldID = 'custbody_om_export_or_not',//  3、是否出口：
            toSoIfExportFieldID = 'custbody_ifexport',//  4、是否出口（保税）：

            lsK3LnFieldId = 'custcol_k3line_number',//      “K3行号”          
            lsK3OrdNumFieldId = 'custcol_k3order_num',//      旧K3订单编号（行） 
            lsCustOrdFieldId = 'custcol_custorder',//  客户订单号
            lsCustOrdLnFieldId = 'custcol_row_id',//  客户订单行号

            lsDescFieldID = 'description',   //行备注
            LsSourceNoFieldId = 'custcol_sourceno',  //来源订单号（文本）：
            lsExternL = 'custcol_external', //来源订单号：
            lslnFidld = 'custcol_linedes',  

 



            ///end ad by and list

            toClFieldId = 'custcol_line', //行号
            fromSoMain = {}, //来源订单主体信息
            fromSoSlLineCount, //来源订单货品行数
            psmFieldId = 'custbody_pc_sales_methods', //销售方式
            smFieldId = 'custbody_sales_model', //销售模式
            slCdiscount = 'custcol_cdiscount', //客户折扣(%)
            slScFieldId = 'custcol_supply_company', //供货公司
            cscFieldId = 'custcol_suppl_company', //供货公司（0421）
            slSourceSoIdFieldId = 'custcol_external', //来源订单号
            slSourceLineFieldId = 'custcol_sales_bank', //来源订单行号
            slFdiscountFieldId = 'custcol_fdiscount', //最终折扣
            slClFieldId = 'custcol_line', //客制化行号
            lsCbdFieldId = 'custcol_before_date', //变更前交货日期
            lsCsdFieldId = 'custcol_suggest_date', //初始需求日期
            lsCbnFieldId = 'custcol_boxes_numbers', //箱数
            lsCtnwFieldId = 'custcol_total_net_weight', //总净重
            lsCtgwFieldId = 'custcol_total_gross_weight', //总毛重
            lsCtcnFieldId = 'custcol_total_cubic_number', //总立方数
            lsCstFieldId = 'custcol_sup_total', //总拖数
            taxrateFieldId = 'taxrate',
            slUnitNotaxFieldId = 'custcol_unit_notax', //折前单价(不含税)
            lsCutFieldId = 'custcol_unit_tax', //折前单价（含税）
            lsFunitFieldId = 'custcol_funit', //折后单价(含税)
            lsKhFunitNotaxFieldId = 'custcol_custcol_kehuunit_notax', //客户折后单价（不含税）=gSlRateFieldId
            lsKhFunitFieldId = 'custcol_custcol_kehufunit', //客户折后单价（含税）=lsFunitFieldId
            lsKhAmtKhdFieldId = 'custcol_custcol_kehutrueamount_khd', //客户含税总金额（原币）	=gSlAmountFieldId
            lsKhAmtLcFieldId = 'custcol_custcol_kehutrueamount_lc', //客户含税总金额（本币）	=lsTrueamoutFieldId
            lsCbtFieldId = 'custcol_before_tax', //折前合计金额（含税）
            lsDiscountFieldId = 'custcol_discount', //折扣额（原币）
            lsIndiscountFieldId = 'custcol_indiscount', //公司间交易折扣(%)=toSoSoidFieldId
            lsTrueamoutFieldId = 'custcol_trueamount', //总金额（本币）
            fromSoSlItemObj = {},
            cdValues = [],
            csValues = [],
            fromSoSlItemList = [],
            customerDsFieldId = 'custentity_deputy_subsidiaries', //客户：代表子公司
            ictCustomerColumns = [{
                name: gInternalidFieldId
            },
            {
                name: gSubsidiaryFieldId
            },
            {
                name: gTaxitem
            }
            ],
            ictCustomerFilters = [],
            ictCustomerSearchCriteria = {},
            ictCustomerObj = {},
            ictCustomerList = [], //内部客户
            taxitemIds = [], //缓存税码Id
            taxColumns = [],
            taxFilters = [],
            taxSearchCriteria = {},
            taxObj = {},
            taxList = [],
            icdScFieldId = 'custrecord_supply_company', //公司间交易主数据供货公司
            icdSacFieldId = 'custrecord_sales_company', //公司间交易主数据销售公司
            icdSlFcFieldId = 'custrecord_parents.custrecord_final_customer', //明细行最终客户
            icdScValue,
            idmRecordId = 'customrecord_ic_discount_maintenance',
            icdColumns = [{
                name: icdScFieldId
            },
            {
                name: 'formulanumeric',
                type: 'float',
                formula: 'to_number({custrecord_inter_company_discount_rate})*100'
            }
            ],
            icdFilters = [],
            icdSearchCriteria = {},
            idcObj = {},
            icdValueList = [],
            fMap = {},
            fList = [],
            fItemObj = {},
            toSoEntityValue, //目标销售订单客户值
            toSoSlRatevalue,
            toSoSlfcValue,
            toLineValue,
            cscColumns = [],
            cscFilters = [],
            cscSearchCriteria = {},
            cscObj = {},
            cscList = []; //内部客户;

        log.debug('fromSoRecord', fromSoRecord);

        //初始化来源销售订单主体字段
        fromSoMain[ifFromIctFieldId] = false;
        fromSoMain[gEntityFieldId] = 0;
        fromSoMain[gSubsidiaryFieldId] = 0;
        fromSoMain[gCurrencyFieldId] = 0;
        fromSoMain[gApprovalstatusFieldId] = 0;
        fromSoMain[ordertypeFieldId] = 0;
        fromSoMain[gTranidFieldId] = '';
        fromSoMain[fromSoWdFieldId] = 0;
        //fromSoMain[psmFieldId] = 0;
        fromSoMain[smFieldId] = 0;
        fromSoMain[gTrandateFieldId] = new Date();
        fromSoMain[toSoDocOldFieldID] = 0;
        fromSoMain[toSoMemoFieldID] = 0;

        fromSoMain[toSoCustOrdNumFieldID] = '';
        fromSoMain[toSoExpOrNotFieldID] = '';
        fromSoMain[toSoIfExportFieldID] = '';
        fromSoMain['custbody_nextapproval_1'] = ''


        //赋值
        for (var key in fromSoMain) {
            if (fromSoMain.hasOwnProperty(key)) {
                fromSoMain[key] = fromSoRecord.getValue({
                    fieldId: key
                });
            }
        }

        //赋值Id
        fromSoMain[gIdFieldId] = fromSoRecord.id;

        log.debug('fromSoMain', fromSoMain);

        //判断是否是公司间，如果是公司间，则执行公司间交易流程
        //if (fromSoMain[ifFromIctFieldId]) {

        //step1:获取行信息
        fromSoSlLineCount = fromSoRecord.getLineCount({
            sublistId: gItemSublistId
        });

        for (var i = 0; i < fromSoSlLineCount; i++) {
            //初始化货品行
            fromSoSlItemObj = {};
            fromSoSlItemObj[gSlItemFieldId] = 0;
            fromSoSlItemObj[gSlRateFieldId] = 0; //折后单价不含税
            fromSoSlItemObj[gSlLineFieldId] = 0;
            fromSoSlItemObj[slClFieldId] = 0;
            fromSoSlItemObj[slUnitNotaxFieldId] = 0; //折前单价不含税
            fromSoSlItemObj[lsFunitFieldId] = 0; //折前单价不含税
            fromSoSlItemObj[lsTrueamoutFieldId] = 0; //总金额（本币）
            fromSoSlItemObj[slCdiscount] = 0;
            //fromSoSlItemObj[slScFieldId] = 0;
            fromSoSlItemObj[cscFieldId] = 0;
            fromSoSlItemObj[gSlQuantityFieldId] = 0;
            fromSoSlItemObj[gSlexpectedshipdateFieldId] = new Date();
            fromSoSlItemObj[lsCbdFieldId] = new Date();
            fromSoSlItemObj[lsCsdFieldId] = new Date();
            fromSoSlItemObj[lsCbnFieldId] = '';
            fromSoSlItemObj[lsCtnwFieldId] = '';
            fromSoSlItemObj[lsCtgwFieldId] = '';
            fromSoSlItemObj[lsCtcnFieldId] = '';
            fromSoSlItemObj[lsCstFieldId] = '';
            fromSoSlItemObj[gSlAmountFieldId] = 0; //总金额（原币）



            fromSoSlItemObj[lsK3LnFieldId] = '';// “K3行号”      
            fromSoSlItemObj[lsK3OrdNumFieldId] = ''; // 旧K3订单编号（行） 
            fromSoSlItemObj[lsCustOrdFieldId] = ''; //客户订单号
            fromSoSlItemObj[lsCustOrdLnFieldId] = ''; //客户订单行号

            fromSoSlItemObj[lsDescFieldID] = '';
            fromSoSlItemObj[LsSourceNoFieldId] = '';
            fromSoSlItemObj[lsExternL] = '';
            fromSoSlItemObj[lslnFidld] = '';
            fromSoSlItemObj['custcol_cgoodscode'] = '';
            fromSoSlItemObj['custcol_cgoodsname'] = '';
           


         

            //赋值
            for (var key in fromSoSlItemObj) {

                if (fromSoSlItemObj.hasOwnProperty(key)) {
                    fromSoSlItemObj[key] = fromSoRecord.getSublistValue({
                        sublistId: gItemSublistId,
                        fieldId: key,
                        line: i
                    });

                    //换成供货公司
                    // if (key == slScFieldId) {
                    //     if (cdValues.indexOf(fromSoSlItemObj[key]) == -1) {
                    //         cdValues.push(fromSoSlItemObj[key]);
                    //     }
                    // }

                    //换成供货公司
                    if (key == cscFieldId) {
                        if (fromSoSlItemObj[key]) {

                            if (csValues.indexOf(fromSoSlItemObj[key]) == -1) {
                                csValues.push(fromSoSlItemObj[key]);
                            }
                        }
                    }

                }
            }

            fromSoSlItemObj[taxrateFieldId] = 0;

            fromSoSlItemList.push(fromSoSlItemObj);
        }

        log.debug('fromSoSlItemList', fromSoSlItemList);
        log.debug('csValues', csValues);

        if (csValues.length) {

            //查询供货公司自定义记录类型

            cscColumns = [{
                name: "custrecord_inter_subsidiary"
            },
            {
                name: "internalid"
            }
            ];

            cscFilters = [
                ["internalid", "anyof"].concat(csValues)
            ];

            cscSearchCriteria = {
                type: 'customrecord_supply_company',
                filters: cscFilters,
                columns: cscColumns
            };

            search.create(cscSearchCriteria).run().each(function (result, i) {

                cscObj = {};

                cscObj['custrecord_inter_subsidiary'] = result.getValue({
                    name: cscColumns[0]
                });
                cscObj['internalid'] = result.getValue({
                    name: cscColumns[1]
                });

                cscList.push(cscObj);
                return true;
            });

            log.debug('cscList', cscList);

            for (var i = 0; i < cscList.length; i++) {
                if (cdValues.indexOf(cscList[i]['custrecord_inter_subsidiary']) == -1) {
                    cdValues.push(cscList[i]['custrecord_inter_subsidiary']);
                }
            }

            log.debug('cdValues', cdValues);

            //查询供货公司公司间供应商
            ictCustomerFilters = [
                [customerDsFieldId, "anyof", fromSoMain[gSubsidiaryFieldId]],
                'AND',
                [gSubsidiaryFieldId, "anyof"].concat(cdValues)
            ];

            ictCustomerSearchCriteria = {
                type: 'customer',
                filters: ictCustomerFilters,
                columns: ictCustomerColumns
            };

            search.create(ictCustomerSearchCriteria).run().each(function (result, i) {

                ictCustomerObj = {};

                ictCustomerObj[gEntityFieldId] = result.getValue({
                    name: ictCustomerColumns[0]
                });
                ictCustomerObj[slScFieldId] = result.getValue({
                    name: ictCustomerColumns[1]
                });

                ictCustomerObj[gTaxitem] = result.getValue({
                    name: ictCustomerColumns[2]
                });

                ictCustomerList.push(ictCustomerObj);
                return true;
            });

            log.debug('ictCustomerList', ictCustomerList);

            for (var i = 0; i < ictCustomerList.length; i++) {
                for (var j = 0; j < cscList.length; j++) {
                    if (ictCustomerList[i][slScFieldId] == cscList[j]['custrecord_inter_subsidiary']) {
                        ictCustomerList[i][cscFieldId] = cscList[j][gInternalidFieldId];
                    }
                }
            }

            log.debug('ictCustomerList', ictCustomerList);

            //获取税值
            for (var i = 0; i < ictCustomerList.length; i++) {
                if (taxitemIds.indexOf(ictCustomerList[i][gTaxitem]) == -1) {
                    taxitemIds.push(ictCustomerList[i][gTaxitem]);
                }
            }

            log.debug('taxitemIds', taxitemIds);

            if (taxitemIds.length) {
                taxColumns = [{
                    name: gInternalidFieldId
                },
                {
                    name: 'formulanumeric',
                    type: 'float',
                    formula: 'to_number({rate})'
                }
                ];

                taxFilters = [
                    ['internalid', "anyof"].concat(taxitemIds)
                ];

                taxSearchCriteria = {
                    type: 'salestaxitem',
                    filters: taxFilters,
                    columns: taxColumns
                };

                search.create(taxSearchCriteria).run().each(function (result, i) {

                    taxObj = {};

                    taxObj[gTaxitem] = result.getValue({
                        name: taxColumns[0]
                    });
                    taxObj[taxrateFieldId] = result.getValue({
                        name: taxColumns[1]
                    });

                    taxList.push(taxObj);
                    return true;
                });
            }

            for (var i = 0; i < ictCustomerList.length; i++) {
                for (var j = 0; j < taxList.length; j++) {
                    if (ictCustomerList[i][gTaxitem] == taxList[j][gTaxitem]) {
                        ictCustomerList[i][taxrateFieldId] = taxList[j][taxrateFieldId];
                    }
                }
            }

            log.debug('ictCustomerList', ictCustomerList);

            //合并货品行和供货公司对应的客商
            for (var i = 0; i < fromSoSlItemList.length; i++) {
                for (var j = 0; j < ictCustomerList.length; j++) {
                    // cscFieldId
                    //if (fromSoSlItemList[i][slScFieldId] == ictCustomerList[j][slScFieldId]) {
                    if (fromSoSlItemList[i][cscFieldId] == ictCustomerList[j][cscFieldId]) {
                        fromSoSlItemList[i][gEntityFieldId] = ictCustomerList[j][gEntityFieldId];
                        fromSoSlItemList[i][taxrateFieldId] = ictCustomerList[j][taxrateFieldId];
                        fromSoSlItemList[i][slScFieldId] = ictCustomerList[j][slScFieldId];
                    }
                }
            }

            log.debug('fromSoSlItemList', fromSoSlItemList);

            //查询折扣
            //1:根据供货公司和销售公司查询
            icdFilters = [
                [icdScFieldId, 'anyof'].concat(cdValues),
                'AND',
                [icdSacFieldId, 'anyof', fromSoMain[gSubsidiaryFieldId]]
            ];

            icdSearchCriteria = {
                type: idmRecordId,
                filters: icdFilters,
                columns: icdColumns
            };

            search.create(icdSearchCriteria).run().each(function (result, i) {
                idcObj = {};
                idcObj[slScFieldId] = result.getValue({
                    name: icdColumns[0]
                })
                idcObj[toSoSoidFieldId] = result.getValue({
                    name: icdColumns[1]
                })

                icdValueList.push(idcObj);

                return true;
            });

            log.debug('icdValueList', icdValueList);

            if (icdValueList.length) {
                //2.根据销售公司、供货公司、客户查询
                icdColumns = [{
                    name: icdScFieldId
                },
                {
                    name: "formulanumeric",
                    type: "float",
                    formula: "to_number({custrecord_parents.custrecord_intercompany_discount})*100"
                }
                ];

                icdFilters = [
                    [icdScFieldId, 'anyof'].concat(cdValues),
                    'AND',
                    [icdSacFieldId, 'anyof', fromSoMain[gSubsidiaryFieldId]],
                    'AND',
                    [icdSlFcFieldId, 'anyof', fromSoMain[gEntityFieldId]]
                ];

                icdSearchCriteria = {
                    type: idmRecordId,
                    filters: icdFilters,
                    columns: icdColumns
                };
                log.debug('icdSearchCriteria', icdSearchCriteria);

                search.create(icdSearchCriteria).run().each(function (result, i) {

                    icdScValue = result.getValue({
                        name: icdColumns[0]
                    });

                    for (var j = 0; j < icdValueList.length; j++) {
                        if (icdScValue == icdValueList[j][slScFieldId]) {
                            icdValueList[j][toSoSoidFieldId] = result.getValue({
                                name: icdColumns[1]
                            });
                        }

                    }
                    return true;
                });

                log.debug('icdValueList', icdValueList);
            }

            //合并货品行和客户折扣
            for (var i = 0; i < fromSoSlItemList.length; i++) {
                for (var j = 0; j < icdValueList.length; j++) {
                    if (fromSoSlItemList[i][slScFieldId] == icdValueList[j][slScFieldId]) {
                        fromSoSlItemList[i][toSoSoidFieldId] = icdValueList[j][toSoSoidFieldId];
                    }
                }
            }

            log.debug('fromSoSlItemList', fromSoSlItemList);

            //分组合并处理
            for (var i = 0; i < fromSoSlItemList.length; i++) {
                toSoEntityValue = fromSoSlItemList[i][gEntityFieldId];
                log.debug('toSoEntityValue', toSoEntityValue);
                if (!fMap[toSoEntityValue]) {
                    //初始化行号
                    toLineValue = 1;

                    fMap[toSoEntityValue] = {
                        customform: customformDefultValue,
                        entity: toSoEntityValue,
                        subsidiary: fromSoSlItemList[i][slScFieldId],
                        currency: fromSoMain[gCurrencyFieldId],
                        trandate: fromSoMain[gTrandateFieldId],
                        custbody_nextapproval_1 : fromSoMain['custbody_nextapproval_1'],
                        items: []
                    };

                    fMap[toSoEntityValue][toSofcFieldId] = fromSoMain[gEntityFieldId];
                    fMap[toSoEntityValue][toSoSoidFieldId] = fromSoSlItemList[i][toSoSoidFieldId];
                    fMap[toSoEntityValue][isToIctFieldId] = true;
                    fMap[toSoEntityValue][ordertypeFieldId] = fromSoMain[ordertypeFieldId]; //ordertypeDefultValue;
                    fMap[toSoEntityValue][toSdcFieldId] = fromSoMain[fromSoWdFieldId];
                    //fMap[toSoEntityValue][psmFieldId] = fromSoMain[psmFieldId];
                    fMap[toSoEntityValue][smFieldId] = fromSoMain[smFieldId];

                    fMap[toSoEntityValue][toSoDocOldFieldID] = fromSoMain[toSoDocOldFieldID];// add by andy 旧订单编号（K3销售订单编号）
                    fMap[toSoEntityValue][toSoMemoFieldID] = fromSoMain[toSoMemoFieldID];// add by andy 旧订单编号（K3销售订单编号）

                    fMap[toSoEntityValue][toSoCustOrdNumFieldID] = fromSoMain[toSoCustOrdNumFieldID];// add by andy 旧订单编号（K3销售订单编号）
                    fMap[toSoEntityValue][toSoExpOrNotFieldID] = fromSoMain[toSoExpOrNotFieldID];// add by andy 旧订单编号（K3销售订单编号）
                    fMap[toSoEntityValue][toSoIfExportFieldID] = fromSoMain[toSoIfExportFieldID];// add by andy 旧订单编号（K3销售订单编号）




                    fMap[toSoEntityValue][cosFieldId] = cosDefultValue;

                    //计算最终折扣与单价
                    toSoSlfcValue = (fromSoSlItemList[i][slCdiscount] / 100) * fromSoSlItemList[i][toSoSoidFieldId];
                    toSoSlRatevalue = (fromSoSlItemList[i][toSoSoidFieldId] / 100) * fromSoSlItemList[i][gSlRateFieldId];
                    //lsFunitFieldId
                    fItemObj = {};
                    //add by andy 
                    fItemObj[lsK3LnFieldId] = fromSoSlItemList[i][lsK3LnFieldId];
                    fItemObj[lsK3OrdNumFieldId] = fromSoSlItemList[i][lsK3OrdNumFieldId];
                    fItemObj[lsCustOrdFieldId] = fromSoSlItemList[i][lsCustOrdFieldId];
                    fItemObj[lsCustOrdLnFieldId] = fromSoSlItemList[i][lsCustOrdLnFieldId];


                    fItemObj[lsDescFieldID] = fromSoSlItemList[i][lsDescFieldID];

                    fItemObj[LsSourceNoFieldId] = fromSoSlItemList[i][LsSourceNoFieldId];

                    fItemObj[lsExternL] = fromSoSlItemList[i][lsExternL];

                    fItemObj[lslnFidld] = fromSoSlItemList[i][lslnFidld];

              

                    log.debug('fItemObj[lsCustOrdLnFieldId]', fItemObj[lsCustOrdLnFieldId]);
                    //end by andy

                    fItemObj[toClFieldId] = toLineValue.toString();
                    fItemObj[gSlItemFieldId] = fromSoSlItemList[i][gSlItemFieldId];
                    fItemObj[gSlQuantityFieldId] = fromSoSlItemList[i][gSlQuantityFieldId];
                    fItemObj[slUnitNotaxFieldId] = fromSoSlItemList[i][slUnitNotaxFieldId];
                    fItemObj[slCdiscount] = fromSoSlItemList[i][slCdiscount];
                    fItemObj[slSourceSoIdFieldId] = fromSoMain[gIdFieldId];
                    fItemObj[slSourceLineFieldId] = fromSoSlItemList[i][slClFieldId];
                    fItemObj[gSlRateFieldId] = toSoSlRatevalue;
                    fItemObj[slFdiscountFieldId] = toSoSlfcValue;
                    fItemObj[gSlexpectedshipdateFieldId] = fromSoSlItemList[i][gSlexpectedshipdateFieldId];
                    fItemObj[lsCbdFieldId] = fromSoSlItemList[i][lsCbdFieldId];
                    fItemObj[lsCsdFieldId] = fromSoSlItemList[i][lsCsdFieldId];
                    fItemObj[lsCbnFieldId] = fromSoSlItemList[i][lsCbnFieldId];
                    fItemObj[lsCtnwFieldId] = fromSoSlItemList[i][lsCtnwFieldId];
                    fItemObj[lsCtgwFieldId] = fromSoSlItemList[i][lsCtgwFieldId];
                    fItemObj[lsCtcnFieldId] = fromSoSlItemList[i][lsCtcnFieldId];
                    fItemObj[lsCstFieldId] = fromSoSlItemList[i][lsCstFieldId];
                    fItemObj[lsCutFieldId] = fromSoSlItemList[i][slUnitNotaxFieldId] *
                        (1 + (fromSoSlItemList[i][taxrateFieldId] / 100));
                    fItemObj[lsFunitFieldId] = toSoSlRatevalue *
                        (1 + (fromSoSlItemList[i][taxrateFieldId] / 100));
                    // fItemObj[lsFunitFieldId] = fromSoSlItemList[i][gSlRateFieldId] *
                    //     (1 + (fromSoSlItemList[i][taxrateFieldId] / 100));
                    fItemObj[lsCbtFieldId] = fromSoSlItemList[i][slUnitNotaxFieldId] * fromSoSlItemList[i][gSlQuantityFieldId] *
                        (1 + (fromSoSlItemList[i][taxrateFieldId] / 100));

                    //20200526
                    fItemObj[lsKhFunitNotaxFieldId] = fromSoSlItemList[i][gSlRateFieldId];
                    fItemObj[lsKhFunitFieldId] = fromSoSlItemList[i][lsFunitFieldId];
                    fItemObj[lsKhAmtKhdFieldId] = fromSoSlItemList[i][gSlAmountFieldId];
                    fItemObj[lsKhAmtLcFieldId] = fromSoSlItemList[i][lsTrueamoutFieldId];
                    fItemObj[lsIndiscountFieldId] = fromSoSlItemList[i][toSoSoidFieldId];
                    fItemObj['custcol_cgoodscode'] = fromSoSlItemList[i]['custcol_cgoodscode'];
                    fItemObj['custcol_cgoodsname'] = fromSoSlItemList[i]['custcol_cgoodsname'];

                    fItemObj[lsDiscountFieldId] = (fromSoSlItemList[i][slUnitNotaxFieldId] - toSoSlRatevalue) *
                        fromSoSlItemList[i][gSlQuantityFieldId] *
                        (1 + (fromSoSlItemList[i][taxrateFieldId] / 100));
                    //lsDiscountFieldId = 'custcol_discount', //折扣额（原币）
                    //lsIndiscountFieldId = 'custcol_indiscount', //公司间交易折扣(%)=toSoSoidFieldId
                    // lsKhFunitNotaxFieldId = 'custcol_custcol_kehuunit_notax', //客户折后单价（不含税）=gSlRateFieldId
                    //     lsKhFunitFieldId = 'custcol_custcol_kehufunit', //客户折后单价（含税）=lsFunitFieldId
                    //     lsKhAmtKhdFieldId = 'custcol_custcol_kehutrueamount_khd', //客户含税总金额（原币）	=gSlAmountFieldId
                    //     lsKhAmtLcFieldId = 'custcol_custcol_kehutrueamount_lc', //客户含税总金额（本币）	=lsTrueamoutFieldId

                    fMap[toSoEntityValue]['items'].push(fItemObj);
                    log.debug(' line 640', fItemObj);
                } else {
                    toLineValue++;
                    fItemObj = {};

                    //add by andy
                    fItemObj[lsK3LnFieldId] = fromSoSlItemList[i][lsK3LnFieldId];
                    fItemObj[lsK3OrdNumFieldId] = fromSoSlItemList[i][lsK3OrdNumFieldId];
                    fItemObj[lsCustOrdFieldId] = fromSoSlItemList[i][lsCustOrdFieldId];
                    fItemObj[lsCustOrdLnFieldId] = fromSoSlItemList[i][lsCustOrdLnFieldId];

                    fItemObj[lsDescFieldID] = fromSoSlItemList[i][lsDescFieldID];
                    fItemObj[LsSourceNoFieldId] = fromSoSlItemList[i][LsSourceNoFieldId];
                    fItemObj[lsExternL] = fromSoSlItemList[i][lsExternL];
                    fItemObj[lslnFidld] = fromSoSlItemList[i][lslnFidld];                    

                    log.debug('fItemObj[lsCustOrdLnFieldId]', fItemObj[lsCustOrdLnFieldId]);
                    //and by andy


                    fItemObj[toClFieldId] = toLineValue.toString();
                    fItemObj[gSlItemFieldId] = fromSoSlItemList[i][gSlItemFieldId];
                    fItemObj[gSlQuantityFieldId] = fromSoSlItemList[i][gSlQuantityFieldId];
                    fItemObj[slUnitNotaxFieldId] = fromSoSlItemList[i][slUnitNotaxFieldId];
                    fItemObj[slCdiscount] = fromSoSlItemList[i][slCdiscount];
                    fItemObj[slSourceSoIdFieldId] = fromSoMain[gIdFieldId];
                    fItemObj[slSourceLineFieldId] = fromSoSlItemList[i][slClFieldId];
                    fItemObj[gSlRateFieldId] = toSoSlRatevalue;
                    fItemObj[slFdiscountFieldId] = toSoSlfcValue;
                    fItemObj[gSlexpectedshipdateFieldId] = fromSoSlItemList[i][gSlexpectedshipdateFieldId];
                    fItemObj[lsCbdFieldId] = fromSoSlItemList[i][lsCbdFieldId];
                    fItemObj[lsCsdFieldId] = fromSoSlItemList[i][lsCsdFieldId];
                    fItemObj[lsCbnFieldId] = fromSoSlItemList[i][lsCbnFieldId];
                    fItemObj[lsCtnwFieldId] = fromSoSlItemList[i][lsCtnwFieldId];
                    fItemObj[lsCtgwFieldId] = fromSoSlItemList[i][lsCtgwFieldId];
                    fItemObj[lsCtcnFieldId] = fromSoSlItemList[i][lsCtcnFieldId];
                    fItemObj[lsCstFieldId] = fromSoSlItemList[i][lsCstFieldId];
                    fItemObj['custcol_cgoodscode'] = fromSoSlItemList[i]['custcol_cgoodscode'];
                    fItemObj['custcol_cgoodsname'] = fromSoSlItemList[i]['custcol_cgoodsname'];

                    fItemObj[lsCutFieldId] = fromSoSlItemList[i][slUnitNotaxFieldId] *
                        (1 + (fromSoSlItemList[i][taxrateFieldId] / 100));
                    fItemObj[lsFunitFieldId] = toSoSlRatevalue *
                        (1 + (fromSoSlItemList[i][taxrateFieldId] / 100));
                    // fItemObj[lsFunitFieldId] = fromSoSlItemList[i][gSlRateFieldId] *
                    //     (1 + (fromSoSlItemList[i][taxrateFieldId] / 100));
                    fItemObj[lsCbtFieldId] = fromSoSlItemList[i][slUnitNotaxFieldId] * fromSoSlItemList[i][gSlQuantityFieldId] *
                        (1 + (fromSoSlItemList[i][taxrateFieldId] / 100));

                    //20200526
                    fItemObj[lsKhFunitNotaxFieldId] = fromSoSlItemList[i][gSlRateFieldId];
                    fItemObj[lsKhFunitFieldId] = fromSoSlItemList[i][lsFunitFieldId];
                    fItemObj[lsKhAmtKhdFieldId] = fromSoSlItemList[i][gSlAmountFieldId];
                    fItemObj[lsKhAmtLcFieldId] = fromSoSlItemList[i][lsTrueamoutFieldId];
                    fItemObj[lsIndiscountFieldId] = fromSoSlItemList[i][toSoSoidFieldId];

                    fItemObj[lsDiscountFieldId] = (fromSoSlItemList[i][slUnitNotaxFieldId] - toSoSlRatevalue) *
                        fromSoSlItemList[i][gSlQuantityFieldId] *
                        (1 + (fromSoSlItemList[i][taxrateFieldId] / 100));
                    fMap[toSoEntityValue]['items'].push(fItemObj);
                    log.debug(' line 640', fItemObj);
                }


            }

            log.debug('fMap', fMap);

            Object.keys(fMap).forEach(function (result) {
                fList.push(fMap[result]);
            });

            log.debug('fList', fList);

            for (var i = 0; i < fList.length; i++) {

                var toSoMainPayload = {},
                    toSoSlItems = [];

                for (var key in fList[i]) {
                    if (fList[i].hasOwnProperty(key)) {

                        if (key != 'items') {
                            toSoMainPayload[key] = fList[i][key];
                        } else {
                            toSoSlItems = fList[i][key];
                        }
                    }
                }

                log.debug('toSoMainPayload', toSoMainPayload);
                log.debug('toSoSlItems', toSoSlItems);

                var option = {

                    mainPayload: toSoMainPayload,
                    items: toSoSlItems
                };

                log.debug('option', option);

                var recId = soCommon.estimateCreationSTM(option);

                log.debug('recId', recId);
            }

        }

    }

    return {
        onAction: onAction
    }
});
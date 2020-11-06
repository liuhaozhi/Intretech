/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description po的主要Client脚本
 */
define(['N/https', 'N/url', 'N/ui/dialog', 'N/format', 'N/record'], function (https, url, dialog, format, record) {

    var $,
        currentRecord,
        pageMode;

    function insertRefreshButton(context) {
        var priceRefreshButton,
            priceRefreshCell,
            poRec = context.currentRecord;

        $ = jQuery;

        //插入按钮-系统标准按钮只能插入到顶部和底部
        priceRefreshButton = $('<input type="button" class="rndbuttoninpt bntBgT" value="刷新采购价格" id="customRefreshPrice" style="border: 1px solid gray;width: 120px;height: 27px;border-radius: 5px;font-weight: bold;font-size: 14px;background-color: rgb(242,242,242) !important;" />');
        priceRefreshCell = $('<td id="customRefreshCell" class="bntBgB" style="vertical-align: top;"></td>');
        priceRefreshButton.on('click', function (event) {
            var isInterCompOrder = poRec.getValue({
                    fieldId: 'custbody_dont_generate_sales' //custbody_whether_ntercompany_transact modify by yuming,原字段为生成的单据要勾选，不是判断依据，修改为custbody_dont_generate_sales
                }),
                vendorId = poRec.getValue({
                    fieldId: 'entity'
                }),
                interVendorReqUrl,
                interVendorRspObj,
                isInterPur = false,
                interSub;

            //查询公司间交易，代表子公司
            interVendorReqUrl = getSearchVendorURL({
                entity: vendorId,
                action: 'getInterPurchInfo'
            });

            interVendorRspObj = JSON.parse(https.get({
                url: interVendorReqUrl
            }).body);

            //如果查询到代表子公司，标示为公司间交易，同时用isInterCompOrder控制是否走公司间交易流程
            if (interVendorRspObj.status == 'S') {
                if (!isInterCompOrder) {
                    interSub = interVendorRspObj.data.vendor.custentity_deputy_subsidiaries;
                    isInterPur = true;
                }
            }

            //if (isInterCompOrder === true) {
            if (isInterPur) {
                refreshInterCompPrices(context, interSub);
            } else {
                refreshPrices(context);
            }
        });
        priceRefreshCell.append(priceRefreshButton);
        $('#item_form > table tr.uir-listheader-button-row:first-child').append(priceRefreshCell);
        
        if(currentRecord.getValue("approvalstatus") == "2") { return; }
        var expDateButton = $('<input type="date" class="rndbuttoninpt bntBgT" value="" id="expDateUpdateInput" style="border: 1px solid black;line-height: 25px;display: inline-block;height: 25px;" />');
        var expDateCell = $('<td id="customRefreshCell" class="bntBgB" style="vertical-align: top;"></td>');
        expDateCell.append(expDateButton);
        $('#item_form > table tr.uir-listheader-button-row:first-child').append(expDateCell);

        expDateButton = $('<input type="button" class="rndbuttoninpt bntBgT" value="更新交货日期" id="expDateUpdateRefresh" style="border: 1px solid gray;width: 120px;height: 27px;border-radius: 5px;font-weight: bold;font-size: 14px;background-color: rgb(242,242,242) !important;" />');
        expDateCell = $('<td id="customRefreshCell" class="bntBgB" style="vertical-align: top;"></td>');
        expDateButton.on('click', function(event) {
            var expDateValue = document.querySelector("#expDateUpdateInput").value;
            var machine = document.querySelector("#item_splits").machine;
            if(!expDateValue) { alert("请填上日期值！"); return; }
            expDateValue = new Date(expDateValue);
            for(var line = poRec.getLineCount({ sublistId: "item" }) - 1; line > -1; line--) {
                poRec.selectLine({ sublistId: "item", line: line });
                poRec.setCurrentSublistValue({ sublistId: "item", fieldId: "expectedreceiptdate", value: expDateValue });
                poRec.commitLine({ sublistId: "item" });
            }
            machine.refresheditmachine();
        });
        expDateCell.append(expDateButton);
        $('#item_form > table tr.uir-listheader-button-row:first-child').append(expDateCell);
    }

    function getPriceSearchUrl() {
        var _self = getPriceSearchUrl;
        if (!_self.url) {
            _self.url = url.resolveScript({
                scriptId: 'customscript_rl_search_purchprice',
                deploymentId: 'customdeploy_rl_search_purchprice'
            });
        }

        return _self.url;
    }

    function getSearchVendorURL(params) {
        var _self = arguments.callee,
            scriptId = 'customscript_sl_collector',
            deploymentId = 'customdeploy_sl_collector';

        params = params || {};

        if (!_self.searchURL) {
            _self.searchURL = url.resolveScript({
                scriptId: scriptId,
                deploymentId: deploymentId
            });
        }

        return url.format(_self.searchURL, params);
    }

    function parseDate(dateStr, returnStr) {
        var dateObj = format.parse({
            type: format.Type.DATE,
            value: dateStr
        });
        return returnStr ? formatDate(dateObj) : dateObj;
    }

    function formatDate(dateObj) {
        return format.format({
            type: format.Type.DATE,
            value: dateObj,
        });
    }

    function refreshPrices(context) {
        var newRecord = context.currentRecord,
            vendorId = newRecord.getValue({
                fieldId: 'entity'
            }),
            currencyId = newRecord.getValue({
                fieldId: 'currency'
            }),
            subsidiaryId = newRecord.getValue({
                fieldId: 'subsidiary'
            }),
            lineCount = newRecord.getLineCount({
                sublistId: 'item'
            }),
            itemInfo = {},
            curItemId,
            curItemQty,
            curLineLowestPrice = 0,
            curLineIsLevel = false,
            curLineLatestPrice = 0,
            curLineLatestVendor = '',
            curLineLatestAppDate = '',
            i;

        //标记已经刷新过价格
        if (!window.confirm('刷新价格将覆盖现有的所有价格，是否继续?')) {
            return false;
        }

        //标记为已刷新
        refreshPrices.isRreshed = true;

        //收集物料信息
        for (i = 0; i < lineCount; i++) {
            curItemId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });
            curItemQty = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: i
            });
            curItemQty = +curItemQty;
            if (itemInfo.hasOwnProperty(curItemId)) {
                itemInfo[curItemId] += curItemQty;
            } else {
                itemInfo[curItemId] = curItemQty;
            }
        }

        console.log('查询的是对外价格')

        //查询价格
        https.post.promise({
            url: getPriceSearchUrl(),
            header: {
                'Content-Type': 'application/json'
            },
            body: {
                itemInfo: itemInfo,
                currency: currencyId,
                vendor: vendorId,
                subsidiary: subsidiaryId,
                reqLatest: true,
            }
        }).then(function (searchSummary) {
            var searchResultBody = JSON.parse(searchSummary.body),
                priceInfo,
                curItemId,
                curItemRate,
                curItemIsLevel,
                promptMessage = new Array(),
                curItemLatestPrice,
                curItemLatestVendor,
                curItemLatestAppDate,
                curItemTaxRate,
                curItemIsReplenish,
                isLevelFieldId = 'custcol_po_tier_price',
                latestPriceId = 'custcol_updatest_price',
                latesVendorId = 'custcol_updatest_vendor',
                latestAppDateId = 'custcol_po_price_updatest_date',
                i;

            if (searchResultBody.status === 'success') {
                priceInfo = searchResultBody.results;

                console.log('priceInfo for outer po', priceInfo);

                //设置最低价格和最新价格供应商
                for (i = 0; i < lineCount; i++) {
                    curItemId = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    curItemRate = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: i
                    });
                    curItemIsLevel = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: isLevelFieldId,
                        line: i
                    });
                    curItemLatestPrice = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: latestPriceId,
                        line: i
                    });
                    curItemLatestVendor = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: latesVendorId,
                        line: i
                    });
                    curItemLatestAppDate = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: latestAppDateId,
                        line: i
                    });
                    curItemTaxRate = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxrate1',
                        line: i
                    });
                    curItemIsReplenish = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_po_replenish_or_not',
                        line: i
                    });
                    curItemTaxRate = parseFloat(curItemTaxRate) || 0;
                    curItemTaxRate /= 100;

                    if (priceInfo[curItemId]) {
                        if (priceInfo[curItemId].lowest) {
                            curLineLowestPrice = priceInfo[curItemId].lowest.purPrice;
                            curLineIsLevel = priceInfo[curItemId].lowest.isLevelPrice;
                        }
                        if (priceInfo[curItemId].latest) {
                            curLineLatestPrice = priceInfo[curItemId].latest.purPrice;
                            curLineLatestVendor = priceInfo[curItemId].latest.vendorId;
                            curLineLatestAppDate = priceInfo[curItemId].latest.approveDate;
                        }
                        if(priceInfo[curItemId].nextPrice){	
                            promptMessage.push({	
                                index : i + 1,	
                                difff : priceInfo[curItemId].nextPrice.difference,	
                                purPrice : priceInfo[curItemId].nextPrice.purPrice	
                            })	
                        }
                    }

                    //转换格式
                    curItemRate = +curItemRate;
                    curItemLatestPrice = +curItemLatestPrice;
                    curItemLatestVendor = String(curItemLatestVendor);
                    curLineLowestPrice = +curLineLowestPrice;
                    curLineLatestPrice = +curLineLatestPrice;
                    curLineLatestVendor = String(curLineLatestVendor);
                    curItemLatestAppDate = curItemLatestAppDate ? formatDate(curItemLatestAppDate) : '';
                    curLineLatestAppDate = curLineLatestAppDate ? parseDate(curLineLatestAppDate, true) : '';

                    //设置价格和供应商
                    if (curItemRate !== curLineLowestPrice ||
                        curItemIsLevel !== curLineIsLevel ||
                        curItemLatestPrice !== curLineLatestPrice ||
                        curItemLatestVendor !== curLineLatestVendor ||
                        curItemLatestAppDate !== curLineLatestAppDate) {
                        newRecord.selectLine({
                            sublistId: 'item',
                            line: i
                        });
                        newRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: curItemIsReplenish? 0: curLineLowestPrice//补货行值固定为0
                        });
                        newRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: isLevelFieldId,
                            value: curLineIsLevel
                        });
                        newRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: latestPriceId,
                            value: curLineLatestPrice
                        });
                        newRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: latesVendorId,
                            value: curLineLatestVendor
                        });
                        //最新价格对应生效日期
                        if (curLineLatestAppDate) {
                            newRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: latestAppDateId,
                                value: parseDate(curLineLatestAppDate)
                            });
                        }
                        //含税单价-单价*（1+税率）
                        newRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_po_tax_price',
                            value: +((1 + curItemTaxRate) * curLineLowestPrice).toFixed(6)
                        });
                        newRecord.commitLine({
                            sublistId: 'item'
                        });
                    }
                }
                if(promptMessage.length){	
                    dialog.alert({	
                        title: '提示',	
                        message: promptMessage.map(function(item){	
                            return '第' + item.index + '行物料离下个阶梯还有' + item.difff + '个,' + '下个阶梯价是' + item.purPrice + ',是否多采购进入下个阶梯价</br>'	
                        }).join('')	
                    });	
                }
            } else {
                dialog.alert({
                    title: '错误',
                    message: '查询采购价格失败，请稍后再试。错误提示：' + searchResultBody.message
                });
            }
        }).catch(function () {
            dialog.alert({
                title: '错误',
                message: '设置最低和最新采购价格失败，可能是由于网络连接未成功，请稍后再试'
            });
        });
    }

    function refreshInterCompPrices(context, interSub) {

        var interPriceReqUrl,
            interPriceRspObj,
            ldblTypeDefaultValue = '1', //联动比例
            newRecord = context.currentRecord,
            currencyId = newRecord.getValue({
                fieldId: 'currency'
            }),
            subsidiaryId = newRecord.getValue({
                fieldId: 'subsidiary'
            }),
            lineCount = newRecord.getLineCount({
                sublistId: 'item'
            }),
            itemInfo = {},
            curItemId,
            curItemQty,
            curItemLowestPrice = 0,
            curItemLowestVendor,
            curInterPrice = 0,
            curCurrency,
            ldblInfo = {},
            ldblTypeValue,
            ldblHead,
            searchResultBody = {},
            priceInfo,
            curItemId,
            ldblorgdjg,
            ciiupFieldId = 'custcol_inter_is_update_price', //采购流程是否需要更新价格
            cildblFieldId = 'custcol_inter_ldbl'; //采购流程联动比例

        //标记已经刷新过价格
        if (!window.confirm('刷新价格将覆盖现有的所有价格，是否继续?')) {
            return false;
        }

        //标记为已刷新
        refreshPrices.isRreshed = true;

        //console.log('interSub', interSub);

        //查询联动比例
        interPriceReqUrl = getSearchVendorURL({
            subsidiary: subsidiaryId,
            intersub: interSub,
            currency: currencyId,
            action: 'getInterPriceListInfo'
        });

        interPriceRspObj = JSON.parse(https.get({
            url: interPriceReqUrl
        }).body);

        //console.log(interPriceRspObj);

        if (interPriceRspObj.status == 'S') {
            ldblInfo = interPriceRspObj.data.lines;
            ldblHead = interPriceRspObj.data.head;
            //console.log('ldblInfo', ldblInfo);
        }
        var items = new Array()
        //收集物料信息
        for (var i = 0; i < lineCount; i++) {
            curItemId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });
            curItemQty = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: i
            });
            curItemQty = +curItemQty;
            if (itemInfo.hasOwnProperty(curItemId)) {
                itemInfo[curItemId] += curItemQty;
            } else {
                itemInfo[curItemId] = curItemQty;
            }

            items.push(curItemId)
        }

        var firmLevel = JSON.parse(https.get({
            url: getSearchVendorURL({
                items : JSON.stringify(items),
                action: 'getFirmLevel'
            })
        }).body)

        // console.log('firmLevel', firmLevel);

        https.post.promise({
            url: getPriceSearchUrl(),
            header: {
                'Content-Type': 'application/json'
            },
            body: {
                itemInfo: itemInfo,
                currency: currencyId,
                //vendor: vendorId,
                subsidiary: interSub
                //reqLatest: true
            }
        }).then(function (searchSummary) {
            searchResultBody = JSON.parse(searchSummary.body);
            //console.log(searchResultBody);

            if (searchResultBody.status === 'success') {
                priceInfo = searchResultBody.results;

                //console.log('priceInfo', priceInfo);
                //console.log('lineCount', lineCount);

                //设置最低价格和最新价格供应商
                for (var i = 0; i < lineCount; i++) {
                    ldblTypeValue = '1';
                    ldblorgdjg = 0;
                    curItemId = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });

                    if (ldblInfo[curItemId]) {
                        ldblTypeValue = ldblInfo[curItemId].jglx;
                        ldblorgdjg = ldblInfo[curItemId].sz;
                    }

                    if(firmLevel[curItemId]){
                        ldblorgdjg = firmLevel[curItemId]
                    }

                    //console.log('ldblTypeValue', ldblTypeValue);
                    //console.log('ldblorgdjg', ldblorgdjg);

                    if (!ldblorgdjg) {
                        ldblorgdjg = ldblHead;
                    }

                    if (priceInfo[curItemId]) {
                        if (priceInfo[curItemId].lowest) {

                            curItemLowestPrice = priceInfo[curItemId].lowest.purPrice;
                            curItemLowestVendor = priceInfo[curItemId].lowest.vendorId;
                            curCurrency = priceInfo[curItemId].lowest.currencyId;
                        }
                    }

                    if (curItemLowestVendor) {

                        //如果类型是联动比例则*联动比例，如果类型是固定价格，则为固定价格
                        if (ldblTypeValue == ldblTypeDefaultValue) {
                            curInterPrice = curItemLowestPrice * ldblorgdjg;
                        } else {
                            curInterPrice = ldblorgdjg;
                        }

                        newRecord.selectLine({
                            sublistId: 'item',
                            line: i
                        });
                        newRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_inter_vendor',
                            value: curItemLowestVendor
                        });

                        newRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_inter_pur_rate',
                            value: curItemLowestPrice
                        });

                        newRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_inter_pur_currency',
                            value: curCurrency
                        });

                        newRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: curInterPrice
                        });

                        if (ldblTypeValue == ldblTypeDefaultValue) {
                            newRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: ciiupFieldId,
                                value: 'Y'
                            });

                            newRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: cildblFieldId,
                                value: ldblorgdjg
                            });
                        }

                        newRecord.commitLine({
                            sublistId: 'item'
                        });
                    }
                }
            } else {
                dialog.alert({
                    title: '错误',
                    message: '查询采购价格失败，请稍后再试。错误提示：' + searchResultBody.message
                });
            }
        }).catch(function () {
            dialog.alert({
                title: '错误',
                message: '设置公司间最低采购价格失败，可能是由于网络连接未成功，请稍后再试'
            });
        });

        return false;
    }

    function confirmOrder(context) {
        var pageRec = context.currentRecord,
            lineCount = pageRec.getLineCount({
                sublistId: 'item'
            }),
            maxLineCount = 10,
            confirmMsg = '当前订单信息如下，确定提交订单吗？',
            itemName,
            itemQty,
            moqQty,
            mpqQty,
            i;

        for (i = 0; i < lineCount; i++) {
            if (i === maxLineCount) {
                confirmMsg += '\n......';
                break;
            } else {
                itemName = pageRec.getSublistText({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                itemQty = pageRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });
                moqQty = pageRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_po_moq_number',
                    line: i
                });
                mpqQty = pageRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcolcustcol_pr_mim_quantutity',
                    line: i
                });
                confirmMsg += '\n当前第' + (i + 1) + '行"' + itemName + '"的订单数为"' + itemQty + '", MOQ数量为"' + moqQty + '"，MPQ数量为"' + mpqQty + '"';
            }
        }

        return window.confirm(confirmMsg);
    }

    function validateReceiptDate(context) {
        var pageRec = context.currentRecord,
            lineCount = pageRec.getLineCount({
                sublistId: 'item'
            }),
            receiptDate,
            createDate = pageRec.getValue("trandate");
            i;
        for (i = 0; i < lineCount; i++) {
            receiptDate = pageRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'expectedreceiptdate',
                line: i
            });
            if (receiptDate) {
                if (receiptDate.format('yy-m-d') < createDate.format('yy-m-d')) {
                    dialog.alert({
                        title: '提示',
                        message: '第' + (i + 1) + '行的预计收货日期要大于主表的日期：' + createDate.format('yy-m-d')
                    });
                    return false;
                }
            }
        }

        return true;
    }

    function getItemCache(context) {
        var pageRec,
            lineCount,
            itemId,
            lineId,
            itemQty,
            _self = getItemCache,
            i;

        if (!_self.cache) {
            pageRec = context.currentRecord;
            _self.cache = {};
            lineCount = pageRec.getLineCount({
                sublistId: 'item'
            });

            for (i = 0; i < lineCount; i++) {
                itemId = pageRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                lineId = pageRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'line',
                    line: i
                });
                itemQty = pageRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });

                _self.cache[getMapKey(itemId, lineId)] = {
                    qty: itemQty
                };
            }
        }

        return _self.cache;
    }

    function getMapKey(itemId, lineId) {
        return itemId + '-' + lineId;
    }

    function setBuyerDefaultValue(currentRecord) {
        var context = nlapiGetContext();
        currentRecord.setValue("custbody_po_buyer", context.user);
        currentRecord.setValue("custbody_wip_documentmaker", "");
    }

    function updateLineNumber(sublistId, lineFieldId) {
        if(!sublistId || !lineFieldId) { return; }
        var machine = document.querySelector("#" + sublistId + "_splits");
        if(!machine || !machine.machine) { return; }
        machine = machine.machine;
        setTimeout(function() {
            var lineCount = currentRecord.getLineCount({ sublistId: sublistId });
            var currLine = currentRecord.getCurrentSublistIndex({ sublistId: sublistId });
            for(var line = 0; line < lineCount; line++) {
                if(currLine != line) {
                    machine.setFieldValue(line + 1, lineFieldId, line + 1);
                } else {
                    currentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: lineFieldId, value: line + 1 });
                }
            }
            machine.buildtable();
            ischanged = true;
        }, 0);
    }

    //entry points
    function pageInit(context) {
        pageMode = context.mode;
        currentRecord = context.currentRecord;
        //缓存物料信息
        if (pageMode == 'edit') {
            getItemCache(context);
        }

        //插入刷新采购价格按钮
        insertRefreshButton(context);
        if(pageMode == 'create') {
            //设置专营采购员默认值为当前用户
            setBuyerDefaultValue(context.currentRecord);
        }
        //console.log(search.load("customsearch_subsidiary_field"));
        //根据From类型来变更采购类型
        var formMap = { "7": "173", "3": "174", "1": "125", "2": "175", "5": "139" };
        var purTypeValue;
        if(/cf=\d+/gmi.test(location.href)) {
            formMap = { "173": "7", "174": "3", "125": "1", "175": "2", "139":"5" };
            purTypeValue = formMap[currentRecord.getValue("customform")];
            purTypeValue && currentRecord.setValue({ fieldId:  "custbody_po_list_pur_type", value: purTypeValue });
        } else {
            purTypeValue = formMap[currentRecord.getValue("custbody_po_list_pur_type")];
            if(purTypeValue == currentRecord.getValue("customform")) { return; }
            purTypeValue && currentRecord.setValue({ fieldId:  "customform", value: purTypeValue });
        }
    }

    function saveRecord(context) {
        var isReceiptDateValidated,
            wantToSubmitPrice;

        //验证接收日期
        isReceiptDateValidated = validateReceiptDate(context);
        if (!isReceiptDateValidated) {
            return false;
        }

        //询问是否刷新价格
        if (!refreshPrices.isRreshed && (pageMode == 'create' || pageMode == 'copy')) {
            wantToSubmitPrice = window.confirm('您还未刷新过采购最低价格，是否确定提交？');
            if (!wantToSubmitPrice) {
                return false;
            }
        }

        //订单信息确认
        return confirmOrder(context);
    }

    function fieldChanged(context) {
        currentRecord = context.currentRecord;
        var fieldId = context.fieldId;
        var item = currentRecord.getCurrentSublistValue('item', 'item');
        var sublistId = context.sublistId;
        var vendor = currentRecord.getValue('entity');
        var subsidiary = currentRecord.getValue('subsidiary');
        if (fieldId === 'entity' || fieldId === 'subsidiary') {
            https.post.promise({
                url: getPriceSearchUrl(),
                header: {
                    'Content-Type': 'application/json'
                },
                body: {
                    vendor: vendor,
                    subsidiary: subsidiary,
                    function: "getVendorInfo"
                }
            }).then(function (result) {
                if(result.body == "{}") { return; }
                var result = JSON.parse(result.body);
                var vendorSpecId = vendor + "_" + subsidiary;
                /* currentRecord.setValue({
                    fieldId: 'custbody_po_buyer',
                    value: result[vendorSpecId]["custrecord_vendor_maintentor"][0].value
                }); *///专营采购员不变
                currentRecord.setValue({
                    fieldId: 'employee',
                    value: result[vendorSpecId]["custrecord_vendor_maintentor"][0].value
                });
                currentRecord.setValue({
                    fieldId: 'terms',
                    value: result[vendorSpecId]["custrecord_vendor_terms"][0].value
                });
            });
        } else if(sublistId == "item") {
            if(fieldId == "item" || fieldId == "expectedreceiptdate") {
                https.post.promise({
                    url: getPriceSearchUrl(),
                    header: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        vendor: item,
                        subsidiary: subsidiary,
                        function: "getIntercompanyInfo"
                    }
                }).then(function (result) {
                    var result = JSON.parse(result.body);
                    if(fieldId == "item") {
                        var today = new Date();
                        //log.error('日期',currentRecord.getCurrentSublistValue('item','expectedreceiptdate'));
                        //  var recdate = currentRecord.getCurrentSublistValue('item','expectedreceiptdate');
                        // recdate.setDate(recdate.getDate()+parseInt(rec.getValue(rec.columns[0])));//
                        var leadTime = rec.getValue(rec.columns[0]) === '' ? 0 : rec.getValue(rec.columns[0]);
                        today.setDate(today.getDate() + parseInt(leadTime));
                        result["expectedreceiptdate"] = today;
                        for(var fieldId in result) {
                            currentRecord.setCurrentSublistValue('item', fieldId, result[fieldId]);
                        }
                    } else if(fieldId == "expectedreceiptdate") {
                        currentRecord.setCurrentSublistValue('item', 'custcol_po_lead_time', result["custcol_po_lead_time"]);
                        var leadTime = rec.getValue(rec.columns[0]) === '' ? 0 : rec.getValue(rec.columns[0]);
                        expectedreceiptdate.setDate(expectedreceiptdate.getDate() - parseInt(leadTime));
                        var date1 = new Date();
                        date1.setDate(date1.getDate()+0);
                        expectedreceiptdate = (expectedreceiptdate <= date1)? date1: expectedreceiptdate;
                        currentRecord.setCurrentSublistValue('item', 'custcol_pr_suggest_date', expectedreceiptdate);
                    }
                });
            }
        }
        if(fieldId == "memo")
        currentRecord.setCurrentSublistText({ sublistId: "item", fieldId: "expectedreceiptdate", value: "2020/9/13" });
        return true;
    }

    function validateField(context) {
        var pageRec = context.currentRecord,
            approveStatus,
            itemId,
            itemQty,
            lineId,
            originalQty,
            itemCache;

        if (context.sublistId === 'item' && context.fieldId === 'quantity') {
            approveStatus = pageRec.getValue({
                fieldId: 'approvalstatus'
            });
            if (pageMode == 'edit' && approveStatus == '2') {
                itemCache = getItemCache(context);
                itemId = pageRec.getCurrentSublistValue({
                    sublistId: context.sublistId,
                    fieldId: 'item'
                });
                itemQty = pageRec.getCurrentSublistValue({
                    sublistId: context.sublistId,
                    fieldId: context.fieldId
                });
                lineId = pageRec.getCurrentSublistValue({
                    sublistId: context.sublistId,
                    fieldId: 'line'
                });
                if (itemId && lineId) {
                    originalQty = itemCache[getMapKey(itemId, lineId)].qty;
                    if (itemQty > originalQty) { //审批之后不允许数量增加
                        alert('审批之后不能调增物料数量');
                        return false;
                    }
                }
            }
        }

        return true;
    }

    function validateLine(context) {
        var pageRec = context.currentRecord,
            approveStatus = pageRec.getValue({
                fieldId: 'approvalstatus'
            }),
            lineId;

        if (pageMode == 'edit' && approveStatus == '2') { //审批后不允许加行
            lineId = pageRec.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'line'
            });
            if (!lineId) {
                dialog.alert({
                    title: '错误',
                    message: '审批之后不允许添加行'
                });
                return false;
            }
        }
        updateLineNumber(context.sublistId, "custcol_line");
        return true;
    }

    function validateDelete(context) {
        updateLineNumber(context.sublistId, "custcol_line");
        return true;
    }

    function validateInsert(context) {
        updateLineNumber(context.sublistId, "custcol_line");
        return true;
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        validateField: validateField,
        validateLine: validateLine,
        validateDelete: validateDelete,
        validateInsert: validateInsert
    }
});
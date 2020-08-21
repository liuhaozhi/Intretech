/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Rhys Lan
 *@description po的主要Client脚本
 */
define(['N/https', 'N/url', 'N/ui/dialog', 'N/format', 'N/record'], function (https, url, dialog, format, record) {
    var sublistId = "item";
    try{
        setPriceListLinkFields();
        setReplenishLineBackGroundColor();
    }catch(e){}
    
    function setPriceListLinkFields() {
        if(!document.querySelector("#edit")) { return; }
        var recId = (/id=\d+/gmi.exec(location.href)[0] || "").slice(3);
        var newRecord = record.load({
            type: "purchaseorder",
            id: recId,
            isDynamic: true
        }),
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
            i;

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
            var searchResultBody = JSON.parse(searchSummary.body);
            if (searchResultBody.status === 'success') {
                var itemIdx = 0, rateIdx = 8;//物料代码和单阶的索引。
                var rowNodes = document.querySelectorAll("#item_splits .uir-machine-row");
                for(var line = 0; line < rowNodes.length; line++) {
                    var linkNode = rowNodes[line].children[itemIdx].firstElementChild;
                    var itemValue = (/id=\d+/gmi.exec(linkNode.href)[0] || "").slice(3);
                    if(searchResultBody.results[itemValue]) {
                        rowNodes[line].children[rateIdx].innerHTML = "<a target='_blank' href='/app/common/custom/custrecordentry.nl?rectype=236&id=" + 
                        searchResultBody.results[itemValue].lowest.pricelistId  + "' class='dottedlink'>" + rowNodes[line].children[rateIdx].innerText + "</a>";
                    }
                }
            } else {
            }
        }).catch(function () {
        });
    }

    function setReplenishLineBackGroundColor() {
        if(!document.querySelector("#edit")) { return; }
        debugger
        var poRec = record.load({
            type: 'purchaseorder',
            id: nlapiGetRecordId(),
            isDynamic: false
        });
        var sublistRowsNode = document.querySelectorAll("#" + sublistId + "_splits>tbody .uir-machine-row");
        var line = poRec.getLineCount({ sublistId: sublistId }), lineStyle = "background-color:#c77f02 !important;";
        while(line-- > -1){
            if(!poRec.getSublistValue({ sublistId: sublistId, fieldId: "custcol_po_replenish_or_not", line: line }) || 
            poRec.getSublistValue({ sublistId: sublistId, fieldId: "quantity", line: line }) == 
            poRec.getSublistValue({ sublistId: sublistId, fieldId: "quantityreceived", line: line })) { continue; }
            sublistRowsNode[line].style = lineStyle;
            for(var col = 0; col < sublistRowsNode[line].children.length; col++) {
                sublistRowsNode[line].children[col].style = lineStyle;
            }
        } 
    }

    //entry points
    function pageInit(context) {
    }

    function saveRecord(context) {
    }

    function fieldChanged(context) {
    }

    function validateField(context) {
    }

    function validateLine(context) {
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

    return {
        pageInit: pageInit,
        /* saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        validateField: validateField,
        validateLine: validateLine, */
    }
});
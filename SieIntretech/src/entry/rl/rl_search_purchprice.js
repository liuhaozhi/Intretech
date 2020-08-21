/**
 *@NApiVersion 2.0
 *@NScriptType Restlet
 @author Charles Zhang
 @description 查询采购价格
 */
define([
    '../../app/app_get_purchase_price', "N/search"
], function (
    purchPriceMod,
    search
) {
    var functionList = {
        getVendorInfo: getVendorInfo,
        getIntercompanyInfo: getIntercompanyInfo,
        getEmployeeInfo: getEmployeeInfo
    };
    function _post(parameters) {
        var itemInfo = parameters.itemInfo,
            currency = parameters.currency,
            vendor = parameters.vendor,
            subsidiary = parameters.subsidiary,
            reqLatest = parameters.reqLatest,
            searchIn = parameters.searchIn,
            funcName = parameters.function,
            rsp = {};
        if(typeof functionList[funcName] == "function") {
            return functionList[funcName](parameters);
        }
        else if (!searchIn) {
            rsp = purchPriceMod.getOutPurchPrice({
                itemInfo: itemInfo,
                currency: currency,
                vendor: vendor,
                subsidiary : subsidiary,
                reqLatest: reqLatest
            });
        } else {
            rsp = purchPriceMod.getInPurchPrice({
                itemInfo: itemInfo,
                currency: currency,
                vendor: vendor,
                subsidiary : subsidiary,
                reqLatest: reqLatest
            });
        }

        return rsp;
    }

    function getEmployeeInfo(params) {
        var result = {};
        if(!params.employee) { return result; }
        var allResults = getAllSearchResults({
            type: "employee",
            columns: ["subsidiary", "department"],
            filters: [
                ["internalid", "anyof", params.employee]
            ]
        });
        
        for(var i = 0; i < allResults.length; i++) {
            var item = allResults[i];
            //result["subsidiary"] = item.getValue(item.columns[0]);
            result["department"] = item.getValue(item.columns[1]);
        }
        return result;
    }

    function getVendorInfo(params) {
        var result = {};
        if(!params.vendor || !params.subsidiary) { return result; }
        var allResults = getAllSearchResults({
            type: "vendorsubsidiaryrelationship",
            columns: ["entity", "subsidiary", "custrecord_vendor_terms", "custrecord_vendor_maintentor"],
            filters: [
                ["entity", "anyof", params.vendor],
                "AND",
                ["subsidiary", "anyof", params.subsidiary]
            ]
        });
        
        for(var i = 0; i < allResults.length; i++) {
            var item = allResults[i];
            result[item.getValue(item.columns[0]) + "_" + item.getValue(item.columns[1])] = item.getAllValues();
        }
        return result;
    }

    function  getIntercompanyInfo(params) {
        var result = {};
        if(!params.item || !params.subsidiary) { return result; }
        var allResults = getAllSearchResults({
            type: "customrecord_intercompany_fields",
            columns: ['custrecord_interco_fixed_lead_time', 'custrecord_interco_minimum_order_quantit', 'custrecord_interco_min_package_quantity', 'custrecord_interco_order_cancel_window_p'],
            filters: [
                ['custrecord_link_field', 'IS', params.item],
                "AND",
                ['custrecord_intercompany_subsidiary', 'IS', params.subsidiary]
            ]
        });
        
        for(var i = 0; i < allResults.length; i++) {
            var item = allResults[i];
            result = {
                "custcol_po_lead_time": item.getValue(item.columns[0]),
                "custcol_po_moq_number": item.getValue(item.columns[1]),
                "custcolcustcol_pr_mim_quantutity": item.getValue(item.columns[2]),
                "custcol_pr_cancel_window": item.getValue(item.columns[3])
            };
        }
        return result;
    }

    function getAllSearchResults(options) {
        var allResults = [], searchObj = options;
    
        if(typeof options != "object") {
            searchObj = search.load({ id: options });
        } else if(options.type) {
            searchObj = search.create(options);
        }
        var resultPagedData = searchObj.runPaged({
            pageSize: 1000
        });
        resultPagedData.pageRanges.forEach(function (pageRange) {
            var currentPageData = resultPagedData.fetch({
                index: pageRange.index
            }).data;
            allResults = allResults.concat(currentPageData);
        });
    
        return allResults;
    }

    return {
        post: _post
    }
});
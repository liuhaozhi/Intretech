/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/search', 'N/record', 'N/runtime', 'N/format'], function (search, record, runtime, format) {

    function _get(context) {
        return deleteRecords(context);
    }

    function _post(context) {
        return deleteRecords(context);
    }

    function _delete(context) {
        return deleteRecords(context);
    }

    function deleteRecords(param) {
        var rspMsg = {
            successed: [],
            successedCount: 0,
            fail: []
        };
        try{
            var sch = search.load({ id: param.id });
        } catch(e) {
            rspMsg.fail = "Save Search不存在！"
            return JSON.stringify(rspMsg);;
        }
        var allResults = getAllSearchResults(sch);
        for(var i = 0; i < allResults.length; i++) {
            try{
                var item = allResults[i];
                var rec = record.delete({
                    type: param.type || sch.searchType,
                    id: item.id,
                 });
                 rspMsg.successed.push(rec);
            } catch(e) {
                rspMsg.fail.push({ id: item.id, message: e, type: sch.searchType });
            }
        }
        rspMsg.successedCount = rspMsg.successed.length;
        rspMsg.failCount = rspMsg.fail.length;
        return JSON.stringify(rspMsg);
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
        get: _get,
        post: _post,
        delete: _delete
    }
});
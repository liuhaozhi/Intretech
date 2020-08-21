/**
 *@NApiVersion 2.0
 *@author Charles Zhang
 *@description 通用查询功能
 */
define(['N/search'], function(search) {

    function getAllSearchResults(options) {
        var allResults = [];
        var searchObj = options.searchId ? search.load({ id: options.searchId }) : search.create(options.searchDefine);
        if (options.addFilters) {
            searchObj.filters = searchObj.filters.concat(options.addFilters);
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
        getAllSearchResults : getAllSearchResults
    }
});

/**
 *@NApiVersion 2.0
 *@author yuming Hu
 *@description wip处理公共程序
 */
define([
    'N/ui/serverWidget',
    'N/search',
    'N/url',
    'N/runtime',
    'N/record'
], function (
    serverWidget,
    search,
    url,
    runtime,
    record
) {
    function createWorkOrderComplation(option) {
        log.debug('log', option);
    }

    return {
        createWorkOrderComplation: createWorkOrderComplation
    }
});
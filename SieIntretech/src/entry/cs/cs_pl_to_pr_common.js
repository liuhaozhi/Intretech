/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description 计划单和请购单平台相关通用客户端程序
 */
define(['../../app/app_pl_pr_platform_client'], function(platformClientCommon) {

    function pageInit(context) {
        platformClientCommon.pageInit(context);
    }

    return {
        pageInit: pageInit,
    }
});
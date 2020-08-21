/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description 此程序主要用于平台上设置临时周期天数的客户端处理
 */
define(['N/currentRecord'], function(currentRecord) {

    function confirmPeriods(){
        var sublistId = 'custpage_update_sublist';
        var subsidiaryFieldId = 'custpage_list_subsidiary';
        var periodFieldId = 'custpage_list_period';
        var pageRec = currentRecord.get();
        var lineCount = pageRec.getLineCount({
            sublistId: sublistId,
        });
        var subsidiaryPeriodList = [];
        var parentWin = window.opener;

        for(var i = 0; i < lineCount; i++){
            var subsidiaryId = pageRec.getSublistValue({
                sublistId: sublistId,
                fieldId: subsidiaryFieldId,
                line: i,
            });
            var subsidiaryText = pageRec.getSublistText({
                sublistId: sublistId,
                fieldId: subsidiaryFieldId,
                line: i,
            });
            var period = pageRec.getSublistValue({
                sublistId: sublistId,
                fieldId: periodFieldId,
                line: i,
            });
            if(period < 0){
                alert('周期天数不能是负数');
                return false;
            }

            subsidiaryPeriodList.push({
                subsidiaryId: subsidiaryId,
                subsidiaryText: subsidiaryText,
                period: period,
            });
        }

        if(parentWin && parentWin.custUpdateMergePeriods){
            parentWin.custUpdateMergePeriods(subsidiaryPeriodList);
        }

        window.onbeforeunload = null;
        window.close();
    }

    function pageInit(context) {
        
    }

    return {
        pageInit: pageInit,
        confirmPeriods: confirmPeriods,
    }
});
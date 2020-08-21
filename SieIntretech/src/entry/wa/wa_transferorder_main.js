/**
 *@NApiVersion 2.1
 *@NScriptType WorkflowActionScript
 */
define([
    '../../app/app_workorder_transfer_items'
], function (
    woInfoMod
) {

    function onAction(scriptContext) {
        const successMark = 'success';
        const failMark = 'fail';
        let newStatus = null;
        let status = successMark;
        let msg = '您已成功转移工单物料';

        const receiveResult = woInfoMod.autoReceive(scriptContext);
        if (receiveResult.status === successMark) {
            newStatus = '3'; //已发货已收货
            //回写工单信息
            const updateWoResult = woInfoMod.updateWoLines(scriptContext);
            if (updateWoResult.status !== successMark) {
                status = failMark;
                msg = `发货收货均成功，但是更新工单信息失败，请您稍后手动更新工单信息。失败提示：${updateWoResult.detail}`;
            }
        } else {
            status = failMark;
            msg = `发货成功，但是收货失败，请您稍后重新收货。失败提示：${receiveResult.detail}`;
        }
    }

    return {
        onAction: onAction
    }
});
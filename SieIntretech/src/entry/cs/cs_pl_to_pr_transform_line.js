/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description 查询计划单投放的任务状态客户端处理
 */
define(['N/https', 'N/currentRecord'], function (httpsMod, currentRecordMod) {
    var $,
        $progressBar,
        timeInterval = 2000,
        failCount = 0;

    function getTaskStatus() {
        var pageRec = currentRecordMod.get(),
            taskId = pageRec.getValue({
                fieldId: 'custpage_task_id'
            }),
            searchUrl = pageRec.getValue({
                fieldId: 'custpage_task_search_url'
            });

        if(failCount > 50){//失败次数过多，不再尝试
            return false;
        }

        httpsMod.get.promise({
            url: searchUrl + '&transtaskid=' + taskId + '&gettaskstatus=T',
        }).then(function (rsp) {
            rspBody = JSON.parse(rsp.body);
            // console.log('rspBody', rspBody);
            if (rspBody.status === 'success') {
                var percent = rspBody.percentCompleted;
                var html = rspBody.html;
                $progressBar.attr('aria-valuenow', percent);
                $progressBar.css('width', percent + '%');
                $progressBar.find('.sr-only').text(percent + '%');
                if (html) {
                    $progressBar.removeClass('active');
                    $progressBar.parent().after(html);
                    window.opener && window.opener.custSearchResults && window.opener.custSearchResults();
                } else {//没有完成，继续轮询
                    setTimeout(getTaskStatus, timeInterval);
                }
            } else {
                throw new Error(rspBody.html);
            }
        }).catch(function (reason) {
            setTimeout(getTaskStatus, timeInterval);
            failCount++;
            console.log('查询任务状态失败', reason);
        });
    }

    function pageInit(context) {
        $ = jQuery;
        $progressBar = $('#custpage_progress_bar');
        getTaskStatus();
    }

    return {
        pageInit: pageInit,
    }
});
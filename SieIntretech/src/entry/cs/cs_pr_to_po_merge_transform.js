/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description 请购单平台合并下推客户端程序
 */
define(['N/https', 'N/currentRecord'], function (httpsMod, currentRecordMod) {

    var $,
        $progressBar,
        $previewContainer,
        timeInterval = 2000,
        failCount = 0;

    function getTaskStatus(isManual) {
        var pageRec = currentRecordMod.get(),
            taskId = pageRec.getValue({
                fieldId: 'custpage_task_id'
            }),
            searchUrl = pageRec.getValue({
                fieldId: 'custpage_task_search_url'
            });

        if (failCount > 50) {//失败次数过多，不再尝试
            return false;
        }

        httpsMod.get.promise({
            url: searchUrl + '&taskid=' + taskId + '&gettaskstatus=T',
        }).then(function (rsp) {
            rspBody = JSON.parse(rsp.body);
            // console.log('rspBody', rspBody);
            // console.log('isManual', isManual);
            if (rspBody.status === 'success') {
                var percent = rspBody.percentCompleted;
                var html = rspBody.html;
                $progressBar.attr('aria-valuenow', percent);
                $progressBar.css('width', percent + '%');
                $progressBar.find('.sr-only').text(percent + '%');
                if (html) {
                    $progressBar.removeClass('active');
                    $previewContainer.html(html);
                    if(!isManual){
                        window.opener && window.opener.custSearchResults && window.opener.custSearchResults();
                    }
                } else if(!isManual){//没有完成，继续轮询
                    setTimeout(getTaskStatus, timeInterval);
                }
            } else {
                Promise.reject(rspBody.html);
            }
        }).catch(function (reason) {
            if(!isManual){
                setTimeout(getTaskStatus, timeInterval);
            }
            failCount++;
            console.log('查询任务状态失败', reason);
        });
    }

    //entry points
    function pageInit(context) {
        $ = jQuery;
        $progressBar = $('#custpage_progress_bar');
        $previewContainer = $('#custpage_preview_container');
        getTaskStatus();

        //给刷新按钮绑定刷新事件
        $previewContainer.on('click', '#customRefreshButton', function(){
            $previewContainer.html('');
            getTaskStatus(true);
        });
    }

    return {
        pageInit: pageInit,
    }
});
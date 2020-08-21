/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 *@author Charles Zhang
 *@description 采购执行平台入口
 */
define([
    'N/redirect',
    '../../app/app_ui_component_server.js',
], function(
    redirect,
    uiComponent
) {

    function viewPage(request, response){
        var form;

        form = uiComponent.createForm({
            title: '请选择订单类型',
            submitLabel: '确认'
        });

        uiComponent.getOrderTypeSelection(form);

        response.writePage({
            pageObject: form
        });
    }

    function submitPage(request, response){
        var parameters = request.parameters,
            selectType = parameters.custpage_order_type;

        if(selectType){
            selectType = selectType.split('@');
            redirect.toSuitelet({
                scriptId: selectType[0] ,
                deploymentId: selectType[1]
            });
        }else{
            response.write({
                output : '无效的单据类型'
            });
        }
    }

    function onRequest(context) {
        var request = context.request,
            response = context.response;

        if (request.method === 'GET') {
            viewPage(request, response);
        } else {
            submitPage(request, response);
        }
    }

    return {
        onRequest: onRequest
    }
});
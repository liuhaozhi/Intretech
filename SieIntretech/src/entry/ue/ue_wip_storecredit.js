/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@author yuming Hu
 *@description  该脚本用于退料单后端验证和执行更改工作单完成的用料情况
 */
define(['N/log',
    'N/url'
], function (log,
    url) {

    function beforeLoad(context) {
        log.debug('before context', context);

        try {
            //缓存url和type
            var daoURL = url.resolveScript({
                scriptId: 'customscript_sl_wip_dao',
                deploymentId: 'customdeploy_sl_wip_dao'
                //returnExternalUrl: true
            });

            var cache = {
                type: context.type,
                daoURL: daoURL
            };

            var field = context.form.addField({
                id: 'custpage_for_dev',
                type: 'TEXT',
                //type: serverWidget.FieldType.TEXT,
                label: '开发隐藏字段'
            }).updateDisplayType({
                displayType: 'HIDDEN'
            });

            field.defaultValue = JSON.stringify(cache);

        } catch (e) {
            log.error({
                title: e.name,
                details: e.message
            });

        }
    }

    return {
        beforeLoad: beforeLoad
    }
});
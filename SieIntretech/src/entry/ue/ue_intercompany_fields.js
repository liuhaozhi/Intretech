/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/search',
    'N/log',
    '../../app/app_wip_common.js',
    'N/record',
    '../../app/app_inv_common.js',
    'N/task'
], function (search,
    log,
    wipCommon,
    record,
    invCommon,
    task) {

    function updateItemSource(context) {

        var newRecord = context.newRecord;

        var itemId = newRecord.getValue({
            fieldId: 'custrecord_link_field'
        });

        var material_attribute = newRecord.getValue({
            fieldId: 'custrecord_material_attribute'
        });
        var isphantom = false, RecType=null;
        //1.0 查询物料编码相关信息
        {
            var columns = [{
                name: 'isphantom'
            },
            {
                name: 'internalid'
            }
            ];

            var filters = [
                ["internalid", "anyof", itemId]
            ];

            var sublistSearchCriteria = {
                type: 'item',
                filters: filters,
                columns: columns
            };

            var searchObj = search.create(sublistSearchCriteria);

            searchObj.run().each(function (result, i) {
                isphantom = result.getValue({
                    name: columns[0]
                });
                RecType=result.recordType;
                log.debug('item id info ', {RecType:RecType, material_attribute: material_attribute, id: result.id, isphantom: isphantom, result: result });
                return true;
            });
        }
        log.debug('get item info ', {RecType:RecType, material_attribute: material_attribute, isphantom: isphantom });
        if (material_attribute == 5 && (isphantom==false ||isphantom=='F' || isphantom=='false')) {
            var id = record.submitFields({
                type: RecType,
                id: itemId,
                values: {
                    isphantom: true
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });
        }

       else if (material_attribute != 5 && (isphantom==true ||isphantom=='T' || isphantom=='true')) {
            var id = record.submitFields({
                type: RecType,
                id: itemId,
                values: {
                    isphantom: false
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });
        }

    }

    /**
     * 
     * @param {*} context 
     * @description 更新订单转移状态
     */


    function beforeLoad(context) {
        // autoCreation(context);
    }

    function beforeSubmit(context) {
        //   if (context.type == 'create') {            
        //  }
    }

    function afterSubmit(context) {
        updateItemSource(context);
        //  if (context.type == 'create') {  
        //}
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
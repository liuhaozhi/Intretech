/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/record'], function(record) {

    function execute(context) {
        var vbRec = record.create({
            type : 'vendorbill',
            // isDynamic : true
        });
        vbRec.setValue({
            fieldId : 'entity',
            value : '86'
        });
        vbRec.setValue({
            fieldId : 'account',
            value : '114'
        });
        var lineCount = 5000;
        for(var i = 0; i < lineCount; i++){
            // vbRec.selectNewLine({
            //     sublistId : 'item'
            // });
            // vbRec.setCurrentSublistValue({
            //     sublistId : 'item',
            //     fieldId : 'item',
            //     value : '49721'
            // });
            vbRec.setSublistValue({
                sublistId : 'item',
                fieldId : 'item',
                line : i,
                value : '49721'
            });
            // vbRec.setCurrentSublistValue({
            //     sublistId : 'item',
            //     fieldId : 'quantity',
            //     value : 1
            // });
            vbRec.setSublistValue({
                sublistId : 'item',
                fieldId : 'quantity',
                value : 5,
                line : i
            });
            // vbRec.setCurrentSublistValue({
            //     sublistId : 'item',
            //     fieldId : 'rate',
            //     value : '10'
            // });
            vbRec.setSublistValue({
                sublistId : 'item',
                fieldId : 'rate',
                value : 10,
                line : i
            });
            // vbRec.setCurrentSublistValue({
            //     sublistId : 'item',
            //     fieldId : 'location',
            //     value : 1
            // });
            vbRec.setSublistValue({
                sublistId : 'item',
                fieldId : 'location',
                value : 1,
                line : i
            });
            // var subRec = vbRec.getCurrentSublistSubrecord({
            //     sublistId : 'item',
            //     fieldId : 'inventorydetail'
            // });
            var subRec = vbRec.getSublistSubrecord({
                sublistId : 'item',
                fieldId : 'inventorydetail',
                line : i
            });
            subRec.setSublistValue({
                sublistId : 'inventoryassignment',
                fieldId : 'inventorystatus',
                value : 1,
                line : 0
            });
            subRec.setSublistValue({
                sublistId : 'inventoryassignment',
                fieldId : 'quantity',
                value : 5,
                line : 0
            });
            // subRec.selectNewLine({
            //     sublistId : 'inventoryassignment'
            // });
            // subRec.setCurrentSublistValue({
            //     sublistId : 'inventoryassignment',
            //     fieldId : 'inventorystatus',
            //     value : 1
            // });
            // subRec.setCurrentSublistValue({
            //     sublistId : 'inventoryassignment',
            //     fieldId : 'quantity',
            //     value : 1
            // });
            // subRec.commitLine({
            //     sublistId : 'inventoryassignment'
            // });
            // vbRec.commitLine({
            //     sublistId : 'item'
            // });
        }
        var vbId = vbRec.save({
            ignoreMandatoryFields : true
        });
    
        log.debug('vbId', vbId);
    }

    return {
        execute: execute
    }
});

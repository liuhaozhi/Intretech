/**
 *@NApiVersion 2.0
 *@NScriptType WorkflowActionScript
 */
define(['N/search', 'N/record'], function (search, record) {

    function onAction(scriptContext) {
        try {
            var pageRec = scriptContext.newRecord,
                item = pageRec.getValue({
                    fieldId: 'custrecord_field_item'
                }),
                vendor = pageRec.getValue({
                    fieldId: 'custrecord_field_vendor'
                }),
                currency = pageRec.getValue({
                    fieldId: 'custrecord_field_currencies'
                }),
                startQty = pageRec.getValue({
                    fieldId: 'custrecord_field_start1'
                }),
                endQty = pageRec.getValue({
                    fieldId: 'custrecord_field_stop'
                }),
                newStartDate = pageRec.getText({
                    fieldId: 'custrecord_field_start_date'
                }),
                filters = [
                    ['isinactive', 'is', 'F'],
                    'AND',
                    ['custrecord_field_status', 'is', '1'/* '2' */],
                    'AND',
                    ['custrecord_field_start_date', 'onorbefore', 'today'],
                    'AND',
                    ['custrecord_field_stop_date', 'onorafter', 'today'],
                    'AND',
                    ['custrecord_field_stop_date', 'onorafter', newStartDate],
                    'AND',
                    ['custrecord_field_item', 'anyof', [item]],
                    'AND',
                    ['custrecord_field_vendor', 'anyof', [vendor]],
                    'AND',
                    ['custrecord_field_currencies', 'anyof', [currency]],
                    'AND',
                    ['custrecord_field_start1', 'equalto', startQty],
                    'AND',
                    ['custrecord_field_stop', 'equalto', endQty]
                ],
                columns = [
                    'custrecord_field_start1',
                    'custrecord_field_stop'
                ],
                duplicateEntries = [],
                recType = pageRec.type;

            search.create({
                type: recType,
                filters: filters,
                columns: columns
            }).run().each(function (result) {
                duplicateEntries.push(result.id);
                return true;
            });

            // log.error('duplicateEntries', duplicateEntries);

            duplicateEntries.forEach(function(duplicateId){
                record.submitFields({
                    type : recType,
                    id : duplicateId,
                    values : {
                        'isinactive' : true
                    },
                    options : {
                        ignoreMandatoryFields : true
                    }
                });
            });
        } catch (ex) {
            log.error({
                title: 'inactive duplicate price error',
                details: ex
            });
        }
    }

    return {
        onAction: onAction
    }
});

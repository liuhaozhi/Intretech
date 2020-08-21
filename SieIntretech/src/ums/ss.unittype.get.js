/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define([
    'N/search',
    'N/record'
], function (
    search,
    record
) {


    function execute(context) {
        log.debug('start....');
        var recType = 'unitstype', cux_recType = 'customrecord_cux_unit_list';
        var lc = null;
        var custrecord_cux_uom_classid,
            custrecord_cux_uom_classname,
            custrecord_cux_uom_itemid,
            custrecord_cux_uom_fname,
            custrecord_cux_uom_names,
            custrecord_cux_uom_abbreviation,
            custrecord_cux_uom_isbaseunit,
            custrecord_cux_uom_conversion,
            custrecord_cux_uom_number,
            custrecord_cux_uom_isinactive,
            custrecord_cux_baseunit;
        try {
            var unitSearch = search.create({
                type: recType,
                columns: [{
                    name: 'name'
                }, {
                    name: 'isinactive'
                }]
            });

            unitSearch.run().each(function (rec) {

                log.debug('rec', rec);
                custrecord_cux_unit_type = rec.id;
                custrecord_cux_uom_classid = rec.id;
                custrecord_cux_uom_classname = rec.getValue(rec.columns[0]),
                    custrecord_cux_uom_isinactive = rec.getValue(rec.columns[1])


                var unitRec = record.load({
                    type: recType,
                    id: rec.id
                });
                //   {"recordType":"unitstype","id":"22","values":{"name":"顶","isinactive":false}}
                log.debug(rec.id + 'unit info', unitRec);


                lc = unitRec.getLineCount({
                    sublistId: 'uom'
                });
                for (var ln = 0; ln < lc; ln++) {
                    //unitRec.selectLine({ sublistId: 'uom', line: ln }); getCurrentSublistValue


                    custrecord_cux_uom_itemid = unitRec.getSublistValue({
                        sublistId: 'uom',
                        fieldId: 'internalid',
                        line: ln
                    });
                    custrecord_cux_uom_fname = unitRec.getSublistValue({
                        sublistId: 'uom',
                        fieldId: 'pluralname',
                        line: ln
                    });


                    custrecord_cux_uom_names = unitRec.getSublistValue({
                        sublistId: 'uom',
                        fieldId: 'unitname',
                        line: ln
                    });
                    custrecord_cux_uom_abbreviation = unitRec.getSublistValue({
                        sublistId: 'uom',
                        fieldId: 'abbreviation',
                        line: ln
                    });
                    custrecord_cux_uom_isbaseunit = unitRec.getSublistValue({
                        sublistId: 'uom',
                        fieldId: 'baseunit',
                        line: ln
                    });
                    custrecord_cux_uom_conversion = unitRec.getSublistValue({
                        sublistId: 'uom',
                        fieldId: 'conversionrate',
                        line: ln
                    });
                    custrecord_cux_uom_number = unitRec.getSublistValue({
                        sublistId: 'uom',
                        fieldId: 'unitname',
                        line: ln
                    });




                    log.debug('uom data', {
                        custrecord_cux_uom_classid: custrecord_cux_uom_classid,
                        custrecord_cux_uom_classname: custrecord_cux_uom_classname,
                        custrecord_cux_uom_itemid: custrecord_cux_uom_itemid,
                        custrecord_cux_uom_fname: custrecord_cux_uom_fname,
                        custrecord_cux_uom_names: custrecord_cux_uom_names,
                        custrecord_cux_uom_abbreviation: custrecord_cux_uom_abbreviation,
                        custrecord_cux_uom_isbaseunit: custrecord_cux_uom_isbaseunit,
                        custrecord_cux_uom_conversion: custrecord_cux_uom_conversion,
                        custrecord_cux_uom_number: custrecord_cux_uom_number,
                        custrecord_cux_uom_isinactive: custrecord_cux_uom_isinactive,

                    });




                    var customRecord = record.create({
                        type: cux_recType,
                        isDynamic: true
                    });

                    customRecord.setValue({ fieldId: 'custrecord_cux_unit_type', value: custrecord_cux_uom_classid });
                    customRecord.setValue({ fieldId: 'custrecord_cux_uom', value: custrecord_cux_uom_itemid });

                    //以下字段用于UMS集成

                    customRecord.setValue({ fieldId: 'custrecord_cux_uom_classid', value: custrecord_cux_uom_classid });
                    customRecord.setValue({ fieldId: 'custrecord_cux_uom_classname', value: custrecord_cux_uom_classname });
                    customRecord.setValue({ fieldId: 'custrecord_cux_uom_itemid', value: custrecord_cux_uom_itemid });
                    customRecord.setValue({ fieldId: 'custrecord_cux_uom_fname', value: custrecord_cux_uom_fname });
                    customRecord.setValue({ fieldId: 'custrecord_cux_uom_names', value: custrecord_cux_uom_names });
                    customRecord.setValue({ fieldId: 'custrecord_cux_uom_abbreviation', value: custrecord_cux_uom_abbreviation });
                    customRecord.setValue({ fieldId: 'custrecord_cux_uom_isbaseunit', value: custrecord_cux_uom_isbaseunit });
                    customRecord.setValue({ fieldId: 'custrecord_cux_uom_conversion', value: custrecord_cux_uom_conversion });
                    customRecord.setValue({ fieldId: 'custrecord_cux_uom_number', value: custrecord_cux_uom_number });
                    customRecord.setValue({ fieldId: 'custrecord_cux_uom_isinactive', value: custrecord_cux_uom_isinactive });
                    customRecord.setValue({ fieldId: 'custrecord_cux_baseunit', value: custrecord_cux_baseunit });

                    var cuxid = customRecord.save();
                    log.debug('cuxid', cuxid);
                }


                return true;

            });




        }
        catch (e) {
            log.debug('err', e.stack);
        }
    }




    return {
        execute: execute
    }
});

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
        var adjustmentId = 20104;
        try {
            var adjrecord = record.load({
                type: 'inventoryadjustment',
                id: adjustmentId,
                isDynamic: true
            });

            log.debug({
                title: 'adjrectostr',
                details: adjrecord
            });

            var lc = adjrecord.getLineCount({
                sublistId: 'inventory'
            });
            log.debug('have lines :' + lc);
            lc = 2;
            var new_cost;

            for (var ln = 0; ln < lc; ln++) {
                new_cost=null;
                new_cost=1;
                var lineNum = adjrecord.selectLine({
                    sublistId: 'inventory',
                    line: ln
                });
          
                log.debug('lineNum',lineNum);
               
                lineNum.setValue({
                  //  sublistId: 'inventory',
                    fieldId: 'unitcost',
                    value: new_cost
                });
 
              //  lineNum.commitline( {sublistId: 'inventory'});

            //  adjrecord.commitline('inventory');
              
             // lineNum.commit();

             adjrecord.commitLine({
                sublistId: 'inventory'
            });

                log.debug(' update line:'+ln,' cost to '+new_cost);

            };

            adjrecord.save();
            return true;
        } catch (e) {
            log.audit({
                title: 'update Adjustinventory',
                details: e.message + ' ' + e.stack
            });

        }
    }




    return {
        execute: execute
    }
});

/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    'N/search'
], function(
    search
) {

    function pageInit(context) {
        console.log('enter')
        window.currentRec = context.currentRecord
    }

    return {
        pageInit: pageInit
    }
});

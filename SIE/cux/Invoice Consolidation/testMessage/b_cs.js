/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([], function() {

    function pageInit(context) {
        console.log(2)
    }

    function saveRecord(context) {
        window.postMessage('hello', '*')
        window.opener.nlapiSetFieldValue(
          'custpage_text',
            '1'
        )
        return false
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    }
});

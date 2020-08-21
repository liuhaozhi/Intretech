/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget'], function (serverWidget) {
    function onRequest(context) {
        context.response.write('<script>\
        location.href="http://119.8.47.216:7101/nsmrp-ViewController-context-root/faces/querymdm.jspx"\
        </script>');
    }

    return {
        onRequest: onRequest
    };
});
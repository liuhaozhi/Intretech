/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define([], function() {

    function onRequest(context) {
        var request = context.request 
        var params  = request.parameters
        if(params.action  === 'test')
        {
            context.response.write('hello')
        }   
    }

    return {
        onRequest: onRequest
    }
});

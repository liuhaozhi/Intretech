/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define([
    'N/search'
], function(
    search
) {

    function onRequest(context) {
        var request = context.request
        var response= context.response
        var params  = request.parameters
  
        if(request.method === 'GET' && params.action === 'searchAvailable')
        {
            response.write(JSON.stringify({
                quantity : getAvailableQuantity(params)
            }))
        }
    }

    function getAvailableQuantity(params){
        var availableQuantity = 0

        search.create({
            type : 'inventorynumber',
            filters : [
                ['isonhand' , 'is' , 'T'],
                'AND',
                ['item' , 'anyof' , [params.item]],
                'AND',
                ['quantityavailable' , 'greaterthan' , 0],
                'AND',
                ['location' , 'anyof' , [params.location]]
            ],
            columns : [
                {name : 'quantityavailable' , summary: 'SUM'}
            ]
        })
        .run()
        .each(function(res){
            availableQuantity = res.getValue({
                name : 'quantityavailable',
                summary: 'SUM' 
            })

            return true
        })

        return availableQuantity
    }

    return {
        onRequest: onRequest
    }
});

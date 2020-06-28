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

        if(request.method === 'GET' && params.action === 'getCustomerSelectOption')
        {
            response.write(JSON.stringify({
                selectOption : getCustomerSelectOption(params)
            }))
        }

        if(request.method === 'GET' && params.action === 'getLocationSelectOption')
        {
            response.write(JSON.stringify({
                selectOption : getLocationSelectOption(params)
            }))
        }
    }

    function getLocationSelectOption(params){
        var filters = new Array()
        var selectOption = new Array()

        if(params.subsidiary)
        filters.push(['subsidiary' , 'anyof' , [params.subsidiary]])

        if(params.isExport)
        filters.push(
            'AND',
            ['custrecord_bonded_under_bond' , 'anyof' , [params.isExport]]
        )

        search.create({
            type : 'location',
            filters : filters,
            columns : [
                'name',
                'internalid'
            ]
        }).run().each(function(res){
            selectOption.push({
                id : res.getValue('internalid'),
                name : res.getValue('name') 
            })

            return true
        })

        return selectOption
    }

    function getCustomerSelectOption(params){
        var selectOption = new Array()

        search.create({
            type : 'customer',
            filters : [
                ['msesubsidiary.internalid' , 'anyof' , [params.subsidiary]]
            ],
            columns : [
                'internalid',
                'entityid',
                'companyname'
            ]
        }).run().each(function(res){
            selectOption.push({
                id : res.getValue('internalid'),
                entityid : res.getValue('entityid') ,
                companyname :  res.getValue('companyname')
            })

            return true
        })

        return selectOption
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

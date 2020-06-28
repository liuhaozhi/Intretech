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
        
        if(params.action === 'volidRepeat')
        {
            response.write(JSON.stringify(volidRepeat(params)))
        }
    }

    function volidRepeat(params){
        var filters = new Array()
        
        if(params.fieldId === 'name')
        filters.push(['name' , 'is' , params.value])

        if(params.fieldId === 'custrecord_intretech_goods')
        filters.push(['custrecord_intretech_goods' , 'anyof' , [params.value]])
        
        if(params.companys)
        filters.push(
          'AND',
          ['custrecord_connactid.custrecord_companys' , 'anyof' , [params.companys]]
        )
      
        if(params.department)
        filters.push(
          'AND',
          ['custrecord_connactid.custrecord_departments' , 'anyof' , [params.department]]
        )
      
        if(params.customer)
        filters.push(
          'AND',
          ['custrecord_connactid.custrecord_cust' , 'anyof' , [params.customer]]
        )
      
        log.error('filters',filters)

        try{
            var repeatInfo = {status : 'sucess' , isRepeat : false}

            search.create({
                type : 'customrecord_customer_product_admini',
                filters : filters
            })
            .run()
            .each(function(res){
                log.error(res.id)
                repeatInfo.isRepeat = true
            })

            return repeatInfo
        }
        catch(e)
        {
            return {
                status : 'error',
                message : e.message
            }
        }
    }

    return {
        onRequest: onRequest
    }
});

/** 
 * price update
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

define([
   'N/record',
   './price_search',
   'N/log'
], function(
    record,
    priceSearch,
    log
) {
    var oneDayMs = 24 * 60 * 60 * 1000

    function isString(parm){
        return typeof parm === 'string'
    }

    function currDate(date){
        var Dat = date || new Date()
        if(isString(Dat)) Dat = new Date(Dat)
        var offset = Dat.getTimezoneOffset()

        return new Date(Dat.getTime() + offset * 60 * 1000)
    }

    function yesterday(){
        return new Date(new Date().getTime() - oneDayMs)
    }

    function updatEffect(params){
        try{
            priceSearch.priceSearch(params)
            .each(function(res){
                record.submitFields({
                    type : params.type,
                    id : res.id,
                    values : {
                        custrecord_item_expiry_date : yesterday(),
                        custrecord_selling_price_effective_stat : '3'
                    }
                })
                return true
            })

            record.submitFields({
                type : params.type,
                id : params.id,
                values : {
                    custrecord_selling_price_effective_stat : '2'
                }
            })
        }
        catch(e){
            log.error('error',e)
        }
    }

    return {
        currDate : currDate,
        yesterday : yesterday,
        updatEffect : updatEffect
    }
})
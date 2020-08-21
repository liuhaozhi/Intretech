/** 
 * default value
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define([
    'N/search'
], function(search) {
        function getCustomerSelectOption(subsidiary){
            var customerSelectOption = [{
                text : ' ',
                value : -1
            }]

            search.create({
                type : 'customer',
                filters : [
                    ['msesubsidiary.internalid' , 'anyof' , [subsidiary]]
                ],
                columns : [
                    'internalid',
                    'entityid',
                    'companyname'
                ]
            }).run().each(function(res){
                customerSelectOption.push({
                    value : res.getValue('internalid'),
                    text : res.getValue('entityid') + '&nbsp;&nbsp;' + res.getValue('companyname')
                })

                return true
            })

            return customerSelectOption
        }
    
        return {

        }
    })
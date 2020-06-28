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

        if(params.action === 'getRelated')
        response.write(JSON.stringify(relatedValue(params)))
    }

    function relatedValue(params){
        if(params.fieldId === 'item')
        {
            return {
                cashFlow : getCashFlow(params.item),
                material : getLinkAttr(params.item,params.subsidiary),
                customerItem : getCustomerItem(params.item)
            }
        }

        if(params.fieldId === 'custcol_cgoodscode')
        {
            return {
                intreItem : getIntreItem(params.customerItem)
            }
        }

        if(params.fieldId === 'department')
        {
            return {
                department : getSalesDepartment(params.salesMan)
            }
        }
    }

    function getSalesDepartment(salesMan){
        var salesBu  = search.lookupFields({
            type : 'employee',
            id : salesMan,
            columns : ['department']
        }).department

        if(salesBu[0]) return salesBu[0].value 
        return null
    }

    function getIntreItem(customerItem){
        var intreItem = null

        search.create({
            type : 'customrecord_customer_product_admini',
            filters : [
                ['internalid' , 'is' , customerItem]
            ],
            columns : ['custrecord_intretech_goods']
        })
        .run()
        .each(function(res){
            intreItem = res.getValue('custrecord_intretech_goods')
        })

        return intreItem
    }

    function getCashFlow(item){
       var account = search.lookupFields({
            type : 'item',
            id : item,
            columns : ['incomeaccount']
        }).incomeaccount

        if(account[0])
        {
            var cashFlow = search.lookupFields({
                type : 'account',
                id : account[0].value,
                columns : ['custrecord_n112_cseg_cn_cfi']
            }).custrecord_n112_cseg_cn_cfi

            if(cashFlow[0])
            return cashFlow[0].value
        }

        return null
    }

    function getLinkAttr(item,subsidiary){
        var material = null

        search.create({
            type : 'customrecord_intercompany_fields',
            filters : [
                ['custrecord_link_field' , 'anyof' , [item]],
                'AND',
                ['custrecord_intercompany_subsidiary' , 'anyof' , [subsidiary]]
            ],
            columns : ['custrecord_material_attribute']
        }).run().each(function(res){
            material = res.getValue('custrecord_material_attribute')
        })

        return material
    }

    function getCustomerItem(item){
        var customerItem = null

        search.create({
            type : 'customrecord_customer_product_admini',
            filters : [
                ['custrecord_intretech_goods' , 'anyof' , [item]]
            ]
        })
        .run()
        .each(function(res){
            customerItem = res.id
        })

        return customerItem
    }

    return {
        onRequest: onRequest
    }
});

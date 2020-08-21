/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define([
    'N/search',
    'N/record',
    'N/runtime',
    '../../../helper/operation_assistant'
], function(
    search,
    record,
    runtime,
    assistant
) {
    function onRequest(context) {
        var request = context.request
        var response= context.response
        var params  = request.parameters

        if(params.action === 'addPrOrd')
        response.write(JSON.stringify(addPrOrd(params)))

        if(params.action === 'getRelated')
        response.write(JSON.stringify(relatedValue(params)))
    }

    function addPrOrd(params){
        var estimateOrd = record.load({
            type : 'estimate',
            id : params.estimateId
        })
        var lineCount = estimateOrd.getLineCount({
            sublistId : 'item'
        })

        while(lineCount > 0)
        {
            addPrOrdList(estimateOrd , --lineCount)
        }

        return {
            msg : 'hello world'
        }
    }

    function addPrOrdList(estimateOrd , index){
        var item = estimateOrd.getSublistValue({
            sublistId : 'item',
            fieldId : 'item',
            line : index
        })
        var prord = record.create({
            type : 'customrecord_purchase_application'
        })
        var subsidiary = estimateOrd.getValue('subsidiary')
  
        prord.setValue({
            fieldId : 'custrecord_create_num_pr',
            value : estimateOrd.id
        })

        prord.setValue({
            fieldId : 'custrecord_order_type_pr',
            value : '1'
        })

        prord.setValue({
            fieldId : 'custrecord_platform_pr_pur_date',
            value : assistant.getDateWithTimeZone({
                date: new Date(),
                timezone : runtime.getCurrentUser().getPreference('TIMEZONE')
            })
        }) 

        prord.setValue({
            fieldId : 'custrecord_platform_pr_unit',
            value : estimateOrd.getSublistValue({
                sublistId : 'item',
                fieldId : 'units',
                line : index
            })
        }) 

        prord.setValue({
            fieldId : 'custrecord_platform_pr_applier',
            value : estimateOrd.getValue('custbody_pc_salesman') 
        })

        prord.setValue({
            fieldId : 'custrecord_item_num_pr',
            value : item
        })

        prord.setValue({
            fieldId : 'custrecord_pr_wo_item',
            value : item
        })

        prord.setValue({
            fieldId : 'custrecord_platform_pr_source_type',
            value : 1
        })

        prord.setValue({
            fieldId : 'custrecord_wip_so_memo_pr',
            value : estimateOrd.getValue('memo')
        })

        prord.setValue({
            fieldId : 'custrecord_platform_pr_subsidiary',
            value : subsidiary
        })

        prord.setValue({
            fieldId : 'custrecord_apply_for_department_pr',
            value : estimateOrd.getValue('department')
        })

        prord.setValue({
            fieldId : 'custrecord_plan_people_pr',
            value : ''
        })

        prord.setValue({
            fieldId : 'custrecord_close_memo_pr',
            value : estimateOrd.getValue('custbody_manualclosereason')
        })

        prord.setValue({
            fieldId : 'custrecord_platform_pr_currency',
            value : estimateOrd.getValue('currency')
        })

        prord.setValue({
            fieldId : 'custrecord_platform_pr_number',
            value : estimateOrd.getSublistValue({
                sublistId : 'item',
                fieldId : 'quantity',
                line : index
            })
        })

        prord.setValue({
            fieldId : 'custrecord_platform_pr_line_close', 
            value : estimateOrd.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_close_manually',
                line : index
            }) || false
        })

        prord.setValue({
            fieldId : 'custrecord_wip_so_abstract_pr', 
            value : estimateOrd.getSublistValue({
                sublistId : 'item',
                fieldId : 'descriptions',
                line : index
            })
        })

        prord.setValue({
            fieldId : 'custrecord_platform_pr_order_type', 
            value : estimateOrd.getValue('custbody_cust_ordertype')
        })

        prord.setValue({
            fieldId : 'custrecord_platform_pr_cus_id', 
            value : estimateOrd.getValue('customer')
        })

        setItemCorrelation(prord , item , subsidiary)

        prord.save({ignoreMandatoryFields : true})
    }

    function setItemCorrelation(prord , item , subsidiary){
        search.create({
            type : 'customrecord_intercompany_fields',
            filters : [
                ['custrecord_link_field' , 'anyof' , [item]],
                'AND',
                ['custrecord_intercompany_subsidiary' , 'anyof' , [subsidiary]]
            ],
            columns : [
                'custrecord_interco_order_interval_day' , 'custrecord_interco_fixed_lead_time',
                'custrecord_interco_minimum_order_quantit' , 'custrecord_interco_min_package_quantity'
            ]
        })
        .run()
        .each(function(res){
            if(res.getValue('custrecord_interco_fixed_lead_time'))
            prord.setValue({
                fieldId : 'custrecord_lead_time_p',
                value : res.getValue('custrecord_interco_fixed_lead_time')
            })

            if(res.getValue('custrecord_interco_minimum_order_quantit'))
            prord.setValue({
                fieldId : 'custrecord_minimum_order_quantity_pr',
                value : res.getValue('custrecord_interco_minimum_order_quantit')
            })

            if(res.getValue('custrecord_interco_min_package_quantity'))
            prord.setValue({
                fieldId : 'custrecord_minimum_packing_quantity_p',
                value : res.getValue('custrecord_interco_min_package_quantity')
            })
        })
    }

    function relatedValue(params){
        if(params.fieldId === 'item')
        {
            return {
                cashFlow : getCashFlow(params.item),
                material : getLinkAttr(params.item,params.subsidiary),
                customerItem : getCustomerItem(params.item , params.department , params.customer , params.subsidiary)
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
        }).department || []

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

    function getCustomerItem(item , department , customer , subsidiary){
        var customerItem = null
        var filters =  [ ['custrecord_intretech_goods' , 'anyof' , [item]]]

        if(department)
        filters.push('AND',['custrecord_depart' , 'anyof' , [department]])

        if(customer)
        filters.push('AND',['custrecord_customer' , 'anyof' , [customer]])

        if(subsidiary)
        filters.push('AND',['custrecord_company_son' , 'anyof' , [subsidiary]])

        search.create({
            type : 'customrecord_customer_product_admini',
            filters : filters
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

/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/runtime',
    'N/record',
    'N/search',
    '../helper/operation_assistant'
], function(
    runtime,
    record,
    search,
    operation
) {
    function afterSubmit(context) {
        if(context.type === context.UserEventType.CREATE)
        {
            try{
                setLineInventory(record.load({
                    type : 'salesorder',
                    id : context.newRecord.id
                }))
            }catch(e){
                log.error('error', e.message)
            }
        }

        if(context.type === 'edit')
        updatePlanAndEstimate(context.oldRecord,context.newRecord)
    }

    function beforeLoad(context){
        if(context.type === 'edit')
        setSalesCache(context.newRecord)    
   
        // if(context.type === 'view'){
        //     var currUser = runtime.getCurrentUser().role
    
        //     if(currUser === 3){
        //         try{
        //             Object.keys(context).map(function(res){log.error(res)})
        //             log.error('context.newRecord',context.newRecord)
        //             context.newRecord.setValue({
        //                 fieldId : 'memo',
        //                 value : '169'
        //             })
        //         }catch(e){
        //             throw '错误' + e.message
        //         }
        //     }
        // }
    }

    function setSalesCache(newRecord){
        var planINums = new Array()
        var quantitys = Object.create(null)
        var lineCount = newRecord.getLineCount({
            sublistId : 'item'
        })
        var quantitysFulfilled = Object.create(null)

        while(lineCount > 0)
        {
            var planNum = getPlaNum(newRecord , --lineCount)

            planINums.push(planNum)  
            quantitys[planNum] = getQuantity(newRecord , lineCount)
            quantitysFulfilled[planNum] = getQuantityFulfilled(newRecord , lineCount)
        }

        newRecord.setValue({
            fieldId : 'custbody_sales_cache',
            value : JSON.stringify({
                quantitys : quantitys,
                salesInfo :getSalesInfo(planINums),
                quantitysFulfilled : quantitysFulfilled
            })
        })
    }

    function getQuantityFulfilled(record,line){
        return record.getSublistValue({
            sublistId : 'item',
            fieldId : 'quantityfulfilled',
            line : line
        })
    }

    function getSalesInfo(planINums){
        var salesInfo = Object.create(null)

        if(planINums.length && planINums[0])
        search.create({
            type : 'customrecord_shipping_plan',
            filters : getFilters(planINums),
            columns : [
                'custrecord_p_quantity' ,
                'custrecord_p_custcol_plan_number' , 
                'custrecord_quantity_shipped' 
            ]
        })
        .run()
        .each(function(res){
            var planNum = res.getValue('custrecord_p_custcol_plan_number')

            if(!salesInfo[planNum])
            {
                salesInfo[planNum] = operation.sub(
                    res.getValue('custrecord_p_quantity'),
                    res.getValue('custrecord_quantity_shipped')
                )
            }else{
                salesInfo[planNum] = operation.add(salesInfo[planNum] , operation.sub(
                    res.getValue('custrecord_p_quantity'),
                    res.getValue('custrecord_quantity_shipped')
                ) ) 
            }

            return true
        })

        return salesInfo
    }

    function updatePlanAndEstimate(oldRecord,newRecord){
        var difference  = getDifference(oldRecord,newRecord)

        if(!Object.keys(difference).length) return false

        search.create({
            type : 'customrecord_shipping_plan',
            filters : getFilters(Object.keys(difference)),
            columns : [
                'custrecord_p_quantity' ,
                'custrecord_p_custcol_salesorder' ,
                'custrecord_p_custcol_plan_number' , 
                'custrecord_quantity_shipped' 
            ]
        })
        .run()
        .each(function(res){
            var currShiped   = undefined
            var planNumber   = res.getValue('custrecord_p_custcol_plan_number')
            var itemQuantity = res.getValue('custrecord_p_quantity')
            var itemShipped  = res.getValue('custrecord_quantity_shipped')

            operation.add(difference[planNumber],itemShipped) <= itemQuantity ? 
            currShiped = difference[planNumber] :
            currShiped = operation.sub(itemQuantity,itemShipped)
           
            difference[planNumber] = operation.sub(difference[planNumber] , currShiped)

            // var itemShipped  = operation.sub(res.
            // getValue('custrecord_quantity_shipped'),
            //     difference[planNumber]
            // )

            // var estimateOrd  = res.getValue('custrecord_p_custcol_salesorder')

            // if(!estimateInfo[estimateOrd])
            // estimateInfo[estimateOrd] = Object.create(null)

            // estimateInfo[estimateOrd][planNumber] = itemShipped
            log.error('currShiped',currShiped)
            log.error('itemShipped',itemShipped)
            try{
                record.submitFields({
                    type : 'customrecord_shipping_plan',
                    id : res.id,
                    values : {
                        custrecord_quantity_shipped : operation.add(itemShipped , currShiped),
                        custrecord_salesorder_shipped : itemQuantity == operation.add(currShiped , itemShipped) 
                    }
                })
            }catch(e){
                throw e.message
            }

            return true
        })

        // updateEstimate(estimateInfo)
    }

    function updateEstimate(estimateInfo){
        log.error('estimateInfo',estimateInfo)
        // Object.keys(estimateInfo).map(function(id){
        //     var estOrd = record.load({
        //         type : 'estimate',
        //         id : id
        //     })

        //     Object.keys(estimateInfo[id]).map(function(plan){
        //         var  index = estOrd.findIndexWithValue({
        //             sublistId : 'item',
        //             fieldId : 'custcol_plan_number',
        //             value : plan
        //         })

        //         if(index > -1)
        //         {
        //             estOrd.setSublistValue({
        //                 sublistId : 'item',
        //                 fieldId : ''
        //             })
        //         }
        //     })
        // })
    }

    function getFilters(planINums){
        var filters = new Array()
        
        planINums.map(function(item){
            filters.length === 0 ? filters.push(['custrecord_p_custcol_plan_number' , 'is' , item]) :
            filters.push('OR' , ['custrecord_p_custcol_plan_number' , 'is' , item]) 
        })

        return filters
    }

    function getDifference(oldRecord,newRecord){
        var difference= Object.create(null)
        var lineCount = newRecord.getLineCount({
            sublistId : 'item'
        })

        while(lineCount > 0)
        {
            var newRecPlanNum = getPlaNum(newRecord ,--lineCount)
            var oldRecPlanNum = getPlaNum(oldRecord , lineCount)

            if(newRecPlanNum === oldRecPlanNum)
            {
                var newQuantity = getQuantity(newRecord , lineCount)
                var oldQuantity = getQuantity(oldRecord , lineCount)

                if(newQuantity !== oldQuantity)
                {
                    difference[newRecPlanNum] = operation.sub(newQuantity , oldQuantity) 
                }
            }
        }

        return difference
    }

    function getPlaNum(record,line){
        return record.getSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_plan_number',
            line : line
        })
    }

    function getQuantity(record,line){
        return record.getSublistValue({
            sublistId : 'item',
            fieldId : 'quantity',
            line : line
        })
    }
    
    function getItems(newRecord){
        var items = new Array()
        var lineCount = newRecord.getLineCount({
            sublistId : 'item'
        })

        for(var i = 0 ; i < lineCount ; i ++)
        {
            items.push(newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'item',
                line : i
            }))
        }

        return items
    }

    function setLineInventory(salesorder){
        var salesOrds = new Array()
        var inventory = getInventory(getItems(salesorder) , salesorder.getValue('subsidiary'))
        var lineCount = salesorder.getLineCount({
            sublistId : 'item'
        })

        for(var i = 0 ; i < lineCount ; i ++)
        {
            if(!salesorder.hasSublistSubrecord({
                sublistId : 'item',
                fieldId : 'inventorydetail',
                line : i
            }))
            var subDetail = salesorder.getSublistSubrecord({
                sublistId : 'item',
                fieldId : 'inventorydetail',
                line : i
            })
            
            var item = salesorder.getSublistValue({
                sublistId : 'item',
                fieldId : 'item',
                line : i
            })
            var quantity  = +salesorder.getSublistValue({
                sublistId : 'item',
                fieldId : 'quantity',
                line : i
            })
            
            log.error('subDetail',subDetail)
            salesOrds.push(salesorder.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_salesorder',
                line : i
            }))

            if(inventory[item])
            {
                for(var key in inventory[item])
                {
                    if(+inventory[item][key].count >= quantity)
                    {
                        // salesorder.setSublistValue({
                        //     sublistId : 'item',
                        //     fieldId : 'inventorylocation',
                        //     value : key,
                        //     line : i
                        // })

                        salesorder.setSublistValue({
                            sublistId : 'item',
                            fieldId : 'location',
                            value : key,
                            line : i
                        })

                        log.error(salesorder.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'inventorylocation',
                            line : i
                        }),salesorder.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'location',
                            line : i
                        }))

                        // var subDetail = salesorder.getSublistSubrecord({
                        //     sublistId : 'item',
                        //     fieldId : 'inventorydetail',
                        //     line : i
                        // })

                        setInventorySublist(subDetail, quantity , inventory[item][key].details)

                        break
                    }
                }
            }
        }

        salesorder.setValue({
            fieldId : 'custbody_lead',
            value : salesOrds
        })

        salesorder.save({ignoreMandatoryFields : false})
    }

    function setInventorySublist(subDetail, quantity , details){
        for(var key in details)
        {
            var index = 0
            var invListQuantity = details[key]
            
            if(quantity > invListQuantity)
            {
                subDetail.insertLine({
                    sublistId: 'inventoryassignment',
                    line: index
                })
                
                subDetail.setSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity',
                    value: invListQuantity,
                    line : index
                })
                
                subDetail.setSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'receiptinventorynumber',
                    value: key,
                    line : index
                })

                quantity = operation.sub(quantity , invListQuantity)
            }
            else
            {
                subDetail.insertLine({
                    sublistId: 'inventoryassignment',
                    line: index
                })
                
                subDetail.setSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity',
                    value: quantity,
                    line : index
                })
                
                subDetail.setSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'receiptinventorynumber',
                    value: key,
                    line : index
                })

                break
            }

            index ++
        }
    }

    function getInventory(items , subsidiary){
        var inventory = new Object()
        var mySearch  = search.load({
            id : 'customsearch_om_invennum'
        })

        mySearch.filters = mySearch.filters.concat(
            {
                name : 'item',
                operator : 'anyof',
                values : items
            },
            {
                name : 'subsidiary',
                join : 'item',
                operator : 'is',
                values : [subsidiary]
            }
        )

        mySearch.run().each(function(res){
            var item = res.getValue('item')
            var location = res.getValue('location')
            var inventorynumber = res.getValue('inventorynumber')
            var quantityavailable = res.getValue('quantityavailable')

            if(!inventory[item])
            inventory[item] = new Object()

            if(!inventory[item][location])
            inventory[item][location] = new Object()

            if(!inventory[item][location].count)
            inventory[item][location].count = 0

            if(!inventory[item][location].details)
            inventory[item][location].details = new Object()

            inventory[item][location].count = operation.add(inventory[item][location].count , quantityavailable)

            inventory[item][location].details[inventorynumber] = quantityavailable

            return true
        })

        return  filtersInventory(inventory , subsidiary)
    }

    function filtersInventory(inventory , subsidiary){
        for(var key in inventory)
        {
            var item = inventory[key]

            for(var location in item)
            {
                var locationRec = record.load({
                    type : 'location',
                    id : location
                })

                if(locationRec.getValue('subsidiary')  !== subsidiary)
                {

                    delete item[location]
                }
               
            }
        }

        return inventory
    }

    return {
        beforeLoad : beforeLoad,
        afterSubmit : afterSubmit
    }
});

/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/record',
    'N/search',
    '../helper/operation_assistant'
], function(
    record,
    search,
    operation
) {
    function afterSubmit(context) {
        if(context.type === context.UserEventType.CREATE)
        {
            setLineInventory(record.load({
                type : 'salesorder',
                id : context.newRecord.id
            }))
        }
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
        var inventory = getInventory(getItems(salesorder) , salesorder.getValue('subsidiary'))
        var lineCount = salesorder.getLineCount({
            sublistId : 'item'
        })

        for(var i = 0 ; i < lineCount ; i ++)
        {
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
            var subDetail = salesorder.getSublistSubrecord({
                sublistId : 'item',
                fieldId : 'inventorydetail',
                line : i
            })

            if(inventory[item])
            {
                for(var key in inventory[item])
                {
                    log.error(inventory,quantity)
                    if(+inventory[item][key].count >= quantity)
                    {
                        log.error('enter')
                        salesorder.setSublistValue({
                            sublistId : 'item',
                            fieldId : 'location',
                            value : key,
                            line : i
                        })

                        setInventorySublist(subDetail, quantity , inventory[item][key].details)

                        break
                    }
                }
            }
        }

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

                log.error(locationRec.getValue('subsidiary'),subsidiary)

                if(locationRec.getValue('subsidiary')  !== subsidiary)
                {

                    delete item[location]
                }
               
            }
        }

        return inventory
    }

    return {
        afterSubmit: afterSubmit
    }
});

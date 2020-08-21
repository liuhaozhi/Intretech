/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/search',
    '../../../helper/operation_assistant'
], function(
    search,
    operation
) {
    function beforeSubmit(context) {
        if(context.type === context.UserEventType.CREATE)
        {
            setInventory(context.newRecord)
        }
    }

    function setInventory(newRecord){
        var lineCount = newRecord.getLineCount({
            sublistId : 'item'
        })

        for(var line = 0 ; line < lineCount ; line ++)
        {
            var itemreceive = newRecord.getSublistText({
                sublistId : 'item',
                fieldId : 'itemreceive',
                line : line
            })

            if(itemreceive === 'T')
            {
                setInventoryDetails({
                    line : line,
                    item : newRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'item',
                        line : line
                    }),
                    quantity : newRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'quantity',
                        line : line
                    }),
                    location : newRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'location',
                        line : line
                    }),
                    newRecord : newRecord,
                })
            }
        }
    }

    function setInventoryDetails(params){
        var line  = 0
        var subDetail = params.newRecord.getSublistSubrecord({
			sublistId : 'item',
            fieldId : 'inventorydetail',
            line : params.line
		})
		var mySearch = search.load({
			id : 'customsearch_inventory_number'  //库存编号搜索
		})
		var columns = mySearch.columns

		mySearch.filters = mySearch.filters.concat(
			{
				name : 'item',
				operator : 'anyof',
				values : [params.item]
			},
			{
				name : 'location',
				operator : 'anyof',
				values : [params.location]
			}
		)

		mySearch.run().each(function(res){
			var inventoryCount = +res.getValue(columns[4])
			if(inventoryCount >= params.quantity){
				inventoryLine({
                    line : line,
                    quantity : params.quantity,
                    subDetail : subDetail,
                    value : res.getValue(columns[0])
                })  
				return false
			}else{
				params.quantity = operation.sub(params.quantity , inventoryCount)
				inventoryLine({
                    line : line,
                    quantity : inventoryCount,
                    subDetail : subDetail,
                    value : res.getValue(columns[0])
                })
				return true
            }
            line ++
        })
    }

    function inventoryLine(params){
        params.subDetail.setSublistValue({
            sublistId: 'inventoryassignment',
			fieldId: 'quantity',
            value: params.quantity,
            line : params.line
        })

        params.subDetail.setSublistValue({
			sublistId: 'inventoryassignment',
			fieldId: 'receiptinventorynumber',
            value: params.value,
            line : params.line
		})
    }
    
    function afterSubmit(context) {
        
    }

    return {
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});

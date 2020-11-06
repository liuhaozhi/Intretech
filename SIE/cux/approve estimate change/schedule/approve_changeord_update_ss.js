/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define([
    'N/task',
    'N/search',
    'N/record',
    'N/runtime'
], 
    (task , search , record , runtime) => {
        const currSc  = () => runtime.getCurrentScript()

        const approvelists = () => currSc().getParameter({
            name : 'custscript_approvelists'
        })

        const searchFilters = items => {
            const filters = new Array()

            items.map(item => {
                if(filters.length) filters.push('OR')
                filters.push(['custrecord_p_custcol_plan_number' , 'is' , item.plaNum])
            })

            return filters
        }

        function execute(context) {
            const items = JSON.parse(approvelists())
            const filters = searchFilters(items)
            const estimateItems = Object.create(null)
            const planEditItems = Object.create(null)

            log.error('filters',filters)
            search.create({
                type : 'customrecord_shipping_plan',
                filters : filters,
                columns : [
                    'custrecord_p_custcol_line','custrecord_edit_link',
                    'custrecord_p_custcol_salesorder','custrecord_p_custcol_plan_number'
                ]
            })
            .run().each(res => {
                const edLink  = res.getValue({name : 'custrecord_edit_link'})
                const line    = res.getValue({name : 'custrecord_p_custcol_line'})
                const salesId = res.getValue({name : 'custrecord_p_custcol_salesorder'})
                const plaNum  = res.getValue({name : 'custrecord_p_custcol_plan_number'})
                const editId  = edLink.slice(edLink.lastIndexOf('fromrecord=') + 11)
                const quantity= updateQty(plaNum , items)

                if(!planEditItems[editId]) planEditItems[editId] = new Array()
                planEditItems[editId].push({line : line , quantity : quantity})
               
                if(!estimateItems[salesId]) estimateItems[salesId] = Object.create(null)
                estimateItems[salesId][plaNum] = quantity
                
                record.submitFields({
                    type : res.recordType,
                    id : res.id,
                    values : {
                        custrecord_p_quantity : estimateItems[salesId][plaNum]
                    }
                })
                
                return true
            })

            task.create({
                taskType : task.TaskType.MAP_REDUCE,
                scriptId : 'customscript_mp_estimatechange_update',
                params : {
                    custscript_eatimate_sum : JSON.stringify(estimateItems),
                    custscript_planitems_sum : JSON.stringify(planEditItems),
                }
            }).submit()
        }

        const updateQty = (plaNum , items) => {
            const that = JSON.parse(JSON.stringify(items)) 

            for(let index in items){
                log.error(items[index].plaNum,plaNum)
                if(items[index].plaNum == plaNum){
                    items.splice(index , 1)
                    return that[index].quantity
                }
            }
        }

        return {
            execute: execute
        }
    }
)

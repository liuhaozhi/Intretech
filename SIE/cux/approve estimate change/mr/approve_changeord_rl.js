/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define([
    'N/task',
    'N/search',
    'N/workflow'
], 
    (task , search , workflow) => {
        function post(context) {
            const {action , checked} = context

            if(action)
            return approveRecord(action , checked)
        }

        const getCheckEle = checked => {
            const items = Object.create(null)
            const parseChecked = getParseChecked(checked)
  
            Object.keys(parseChecked).map(key => {
                if(parseChecked[key].check === 'T') items[key] = parseChecked[key].nexts
            })

            log.error('items',items)
    
            return items
        }

        const getParseChecked = checked => JSON.parse(checked)

        const approveRecord = (action , checked) => {
            const errorArr = new Array()
            const pendingUp = new Array()
            const checkedEle = getCheckEle(checked)
            const mySearch = search.load({id : 'customsearch_changeline_2'})

            mySearch.filterExpression = mySearch.filterExpression.concat([
                'AND', ['internalid' , 'anyof' , Object.keys(checkedEle)]
            ])

            mySearch.run().each(res => {
                try{
                    if(action === 'ratify'){
                        if(checkedEle[res.id] === '1'){
                            workflow.trigger({
                                recordType : 'customrecord_order_changereqline',
                                recordId   : res.id,
                                workflowId : 'customworkflow_changeorder',
                                actionId : 'workflowaction3434'
                            })
                        }

                        if(checkedEle[res.id] === '4'){
                            workflow.trigger({
                                recordType : 'customrecord_order_changereqline',
                                recordId   : res.id,
                                workflowId : 'customworkflow_changeorder',
                                actionId : 'workflowaction3441'
                            })

                            pendingUp.push({quantity : res.getValue(mySearch.columns[2]) , plaNum : res.getValue(mySearch.columns[1])})
                        }
                    }

                    if(action === 'refuse'){
                        if(checkedEle[res.id] === '1'){
                            workflow.trigger({
                                recordType : 'customrecord_order_changereqline',
                                recordId   : res.id,
                                workflowId : 'customworkflow_changeorder',
                                actionId : 'workflowaction3435'
                            })
                        }

                        if(checkedEle[res.id] === '4'){
                            workflow.trigger({
                                recordType : 'customrecord_order_changereqline',
                                recordId   : res.id,
                                workflowId : 'customworkflow_changeorder',
                                actionId : 'workflowaction3442'
                            })
                        }
                    }

                }catch(e){
                    log.error('e',e.message)
                    errorArr.push('订单：' + res.getValue(mySearch.columns[0]) + ';客户订单行号:' + res.getValue(mySearch.columns[1]) + '处理失败')
                }

                return true
            })

            log.error(pendingUp.length,pendingUp)
            if(pendingUp.length > 0)
            task.create({
                taskType : task.TaskType.SCHEDULED_SCRIPT,
                scriptId : 'customscript_update_planestimate',
                params : {
                    custscript_approvelists : JSON.stringify(pendingUp)
                }
            }).submit()

            return JSON.stringify({
                status : 'sucess',
                errorMsg : errorArr,
                count : Object.keys(checkedEle).length
            })
        }

        return { post }
    }
)

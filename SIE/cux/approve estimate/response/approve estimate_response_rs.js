/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */

define([
    'N/search',
    'N/workflow',
    '../../helper/wrapper_runtime',
    '../../helper/operation_assistant'
], 
    ( search, workflow, runtime, operation) => {
        const currentScript = () => runtime.getCurrentScript()

        const getCheckEle = checked => {
            const items = Object.create(null)
            const parseChecked = getParseChecked(checked)

            Object.keys(parseChecked).map(key => Object.keys(parseChecked[key]).map(Ckey => {
                if(parseChecked[key][Ckey] === 'T')
                items[key] = (items[key] || 0) + 1
            }))
    
            return items
        }

        const getParseChecked = checked => JSON.parse(checked)

        const post = context => {
            const {action , checked} = context

            if(action)
            return approveRecord(action , checked)
        }

        const approveRecord = (action , checked) => {
            let msg
            let count = 0
            let errorArr   = new Array()
            let checkedEle = getCheckEle(checked)
            let userRole   = runtime.getCurrentUser().role
            let mySearch   = search.load({id : 'customsearch_transaction_linecount'})
            let currScript = currentScript()

            mySearch.filters = mySearch.filters.concat({
                name : 'internalid',
                operator : 'anyof',
                values : Object.keys(checkedEle)
            })
    
            mySearch.run().each(function(res){
                let unit = currScript.getRemainingUsage()

                if(unit < 30){
                    msg = {
                        out : true,
                        count : count,
                        status : 'sucess',
                        errorMsg : errorArr
                    }

                    return false
                }

                ++count
                log.error('count',count)
                let orderType  = res.getValue(mySearch.columns[5])
                let newxtAppro = res.getValue(mySearch.columns[4])
                let difference = operation.sub(res.getValue(mySearch.columns[3]) , checkedEle[res.getValue(mySearch.columns[0])])
                let companies  = res.getValue(mySearch.columns[6])
    
                if(userRole.toString() !== res.getValue(mySearch.columns[2]) && userRole.toString() !== '1112')
                {
                    errorArr.push('订单号:' + res.getValue(mySearch.columns[1]) + '，审批角色错误,处理失败')
                    return true
                }
    
                if(difference)
                {
                    errorArr.push('订单号:' + res.getValue(mySearch.columns[1]) + '，未选行数' + difference + ',处理失败')
                    return true
                }

                // if(res.getValue(mySearch.columns[9]) === false)
                // {
                //     errorArr.push('订单号:' + res.getValue(mySearch.columns[1]) + '，Bom状态存在未审核,处理失败')
                //     return true
                // }
    
                if(action === 'ratify')
                {
                    if(orderType !== '1' && orderType !== '7')
                    {
                        if(companies === true && newxtAppro === '1' )
                        {
                            workflow.trigger({
                                recordType : 'estimate',
                                recordId   : res.getValue(mySearch.columns[0]),
                                workflowId : 'customworkflow35',
                                actionId : 'workflowaction3258'
                            })
                        }
                        else
                        {
                            workflow.trigger({
                                recordType : 'estimate',
                                recordId   : res.getValue(mySearch.columns[0]),
                                workflowId : 'customworkflow35',
                                actionId : newxtAppro === '1' ? 'workflowaction2292' : 'workflowaction2771'
                            })
                        }
                    }
                    else
                    {
                        workflow.trigger({
                            recordType : 'estimate',
                            recordId   : res.getValue(mySearch.columns[0]),
                            workflowId : 'customworkflow37',
                            actionId : 'workflowaction2332'
                        })   
                    }
                }
    
                if(action === 'refuse')
                {
                    if(orderType !== '1' && orderType !== '7')
                    {
                        workflow.trigger({
                            recordType : 'estimate',
                            recordId   : res.getValue(mySearch.columns[0]),
                            workflowId : 'customworkflow35',
                            actionId : newxtAppro === '1' ? 'workflowaction2293' : 'workflowaction2296'
                        })
                    }
                    else
                    {
                        workflow.trigger({
                            recordType : 'estimate',
                            recordId   : res.getValue(mySearch.columns[0]),
                            workflowId : 'customworkflow37',
                            actionId : 'workflowaction2333'
                        })
                    }
                }
    
                return true
            })

            if(msg) return JSON.stringify(msg)
            
            return JSON.stringify({
                count : count,
                status : 'sucess',
                errorMsg : errorArr
            })
        }

        // const post = context => {
            
        // }

        return { post }
    }
)

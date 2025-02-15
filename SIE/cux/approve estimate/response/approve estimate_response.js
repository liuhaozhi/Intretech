/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define([
    'N/search',
    'N/record',
    'N/workflow',
    '../../helper/wrapper_runtime',
    '../../helper/operation_assistant'
], function(
    search,
    record,
    workflow,
    runtime,
    operation
) {

    function onRequest(context) {
        var request = context.request
        var response= context.response
        var params  = request.parameters
            
        if(request.method === 'GET')
        {
            if(params.action)
            approveRecord(params,response,params.action)
        }
    }

    function getCheckInfo(params){
        return JSON.parse(params.checked)
    }

    function approveRecord(params,response,action){ //批准 
        var count = 0
        var errorArr   = new Array()
        var userRole   = runtime.getCurrentUser().role
        var checkedEle = getCheckEle(getCheckInfo(params))
        var mySearch   = search.load({id : 'customsearch_transaction_linecount'})

        mySearch.filters = mySearch.filters.concat({
            name : 'internalid',
            operator : 'anyof',
            values : Object.keys(checkedEle)
        })

        mySearch.run().each(function(res){
            ++count
            var orderType  = res.getValue(mySearch.columns[5])
            var newxtAppro = res.getValue(mySearch.columns[4])
            var difference = operation.sub(res.getValue(mySearch.columns[3]) , checkedEle[res.getValue(mySearch.columns[0])])
            var companies  = res.getValue(mySearch.columns[6])

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

            if(action === 'ratify')
            {
                if(orderType !== '1' && orderType !== '7')
                {
                    log.error('companies',companies)
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

        response.write(JSON.stringify({
            count : count,
            status : 'sucess',
            errorMsg : errorArr
        }))
    }

    function getCheckEle(checkedInfo){
        var items = new Object()

        for(var key in checkedInfo)
        {
            for(var ckey in checkedInfo[key])
            {
                if(checkedInfo[key][ckey] === 'T')
                {
                    items[key] = operation.add(items[key] || 0 , 1)
                }
            }
        }

        return items
    }

    return {
        onRequest: onRequest
    }
});

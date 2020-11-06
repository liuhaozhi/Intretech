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
            var difference = operation.sub(res.getValue(mySearch.columns[3]) , checkedEle[res.getValue(mySearch.columns[0])])

            log.error(res.getValue(mySearch.columns[7]) , res.getValue(mySearch.columns[7]) === '- None -')

            if(userRole.toString() !== res.getValue(mySearch.columns[2]))
            {
                errorArr.push('单号:' + res.getValue(mySearch.columns[1]) + '，审批角色错误,处理失败')
                return true
            }

            if(res.getValue(mySearch.columns[7]) === '- None -' && res.getValue(mySearch.columns[8]) === '- None -'){
                errorArr.push('单号:' + res.getValue(mySearch.columns[1]) + '，装箱号，发票号都未维护')
                return true
            }

            if(difference)
            {
                errorArr.push('单号:' + res.getValue(mySearch.columns[1]) + '，未选行数' + difference + ',处理失败')
                return true
            }

            if(action === 'ratify')
            {
                workflow.trigger({
                    recordType : 'salesorder',
                    recordId   : res.getValue(mySearch.columns[0]),
                    workflowId : 'customworkflow_out_approve',
                    actionId : 'workflowaction2977'
                })
            }

            if(action === 'refuse')
            {
                workflow.trigger({
                    recordType : 'salesorder',
                    recordId   : res.getValue(mySearch.columns[0]),
                    workflowId : 'customworkflow_out_approve',
                    actionId : 'workflowaction2978'
                })
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

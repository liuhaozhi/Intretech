/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    'N/url',
    'N/https',
    'N/ui/message',
    '../../../helper/operation_assistant'
], function(
    url,
    https,
    message,
    operation
) {
    var mode = undefined
    var underway = false
    var oldQuantity = new Object()
    function pageInit(context){
        console.log('pageinit')
        mode = context.mode

        if(mode === 'edit')
        {
            setOldQuantity(context.currentRecord)
        }

        changeTitle(context)
    }

    function changeTitle(context){
        var currentRec = context.currentRecord
        var title = currentRec.getText('custbody_ordtype')

        jQuery('h1.uir-record-type').text(title)
    }

    function setOldQuantity(currentRec){
        var lineCount = currentRec.getLineCount({
            sublistId : 'item'
        })

        for(var i = 0 ; i < lineCount ; i ++)
        {
            oldQuantity[i] = currentRec.getSublistValue({
                sublistId : 'item',
                fieldId : 'quantity',
                line : i
            })
        }
    }

    function validateLine(context) {
        var currentRec = context.currentRecord
        var lineCount = currentRec.getLineCount({
            sublistId : 'item'
        })
        var currIndex = currentRec.getCurrentSublistIndex({
            sublistId : 'item'
        })

        currentRec.setCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_line',
            value : operation.add(currIndex, 1)
        })

        if(currentRec.getValue('custbody_order_status') !== '1')
        {
            if(mode === 'edit')
            {
                var lineCount = currentRec.getLineCount({
                    sublistId : 'item'
                })
                var currIndex = currentRec.getCurrentSublistIndex({
                    sublistId : 'item'
                })
    
                if(lineCount === currIndex)
                {
                    return false
                }
            }
        }

        return true
    }

    function fieldChanged(context){
        var currentRec = context.currentRecord

        if(context.fieldId === 'custcol_cgoodscode')
        {
            var customerItem = currentRec.getCurrentSublistValue({
                sublistId : 'item',
                fieldId : context.fieldId
            })

            if(customerItem)
            setIntreItem({
                currentRec : currentRec,
                body : {
                    action : 'getRelated',
                    fieldId : 'custcol_cgoodscode',
                    customerItem : customerItem
                }
            })
        }

        if(context.fieldId === 'item')
        {
            var item = currentRec.getCurrentSublistValue({
                sublistId : 'item',
                fieldId : context.fieldId
            })

            if(item)
            {
                setItemRelated({
                    currentRec : currentRec,
                    body : {
                        item : item,
                        fieldId : 'item',
                        action : 'getRelated',
                        customer : currentRec.getValue('entity'),
                        department : currentRec.getValue('department'),
                        subsidiary : currentRec.getValue('subsidiary')
                    }
                })
            }
        }

        // if(currentRec.getValue('custbody_order_status') !== '1')
        // {
        //     if(mode === 'edit')
        //     {
        //         if(context.fieldId === 'quantity')
        //         {
        //             var lineCount = currentRec.getLineCount({
        //                 sublistId : 'item'
        //             })
        //             var currIndex = currentRec.getCurrentSublistIndex({
        //                 sublistId : 'item'
        //             })
        
        //             if(lineCount !== currIndex)
        //             {
        //                 if(validQuantity(currentRec,currIndex))
        //                 {
        //                     currentRec.setCurrentSublistValue({
        //                         sublistId : 'item',
        //                         fieldId : 'quantity',
        //                         value : oldQuantity[currIndex]
        //                     })
        //                 }   
        //             }
        //         }
        //     }
        // }
    }

    function setItemRelated(params){
        var currentRec = params.currentRec
        var response = https.post({
            url : url.resolveScript({
                scriptId : 'customscript_om_changefield_response',
                deploymentId : 'customdeploy_om_changefield_response'
            }),
            body : params.body
        })
        var body = JSON.parse(response.body)

        if(body.cashFlow)
        currentRec.setCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_cseg_cn_cfi',
            value : body.cashFlow
        })

        if(body.material)
        currentRec.setCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_wip_material_properties',
            value : body.material
        })

        if(body.customerItem)
        {
            if(currentRec.getCurrentSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_cgoodscode',
            }) !== body.customerItem)
            currentRec.setCurrentSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_cgoodscode',
                value : body.customerItem
            })
        }
    }

    function setIntreItem(params){
        var currentRec = params.currentRec
        var response = https.post({
            url : url.resolveScript({
                scriptId : 'customscript_om_changefield_response',
                deploymentId : 'customdeploy_om_changefield_response'
            }),
            body : params.body
        })
        var body = JSON.parse(response.body)

        if(body.intreItem)
        {
            if(currentRec.getCurrentSublistIndex({
                sublistId : 'item',
                fieldId : 'item',
            }) !== body.intreItem)
            currentRec.setCurrentSublistValue({
                sublistId : 'item',
                fieldId : 'item',
                value : body.intreItem
            })
        }
    } 

    function validQuantity(currentRec,currIndex){
        var newValue = currentRec.getCurrentSublistValue({
            sublistId : 'item',
            fieldId : 'quantity'
        })

        return Number(newValue) > Number(oldQuantity[currIndex])
    }

    function validateInsert(context){
        var currentRec = context.currentRecord
        
        if(currentRec.getValue('custbody_order_status') !== '1')
        return mode !== 'edit'

        return true
    }

    function lineInit(context){
        var currentRec = context.currentRecord
        var salesMan = currentRec.getValue('custbody_pc_salesman')
        var department = currentRec.getValue('department')

        if(!department)
        {
            if(salesMan)
            {
                var response = https.post({
                    url : url.resolveScript({
                        scriptId : 'customscript_om_changefield_response',
                        deploymentId : 'customdeploy_om_changefield_response'
                    }),
                    body : {
                        action : 'getRelated',
                        salesMan : salesMan,
                        fieldId : 'department'
                    }
                })
                var body = JSON.parse(response.body)
        
                if(body.department)
                {
                    currentRec.setValue({
                        fieldId : 'department',
                        value : body.department
                    })
                }
            }
        }
    }

    function changethis(id){
        window.open('/app/common/custom/custrecordentry.nl?rectype=677' + '&estimate=' + id)
    }

    function addprord(id){
        if(underway) return false

        underway = !underway

        var msg = message.create({
            title : '处理中！' , 
            type :  message.Type.CONFIRMATION , 
            message : '请稍后。。。'
        })
        
        msg.show()

        https.post.promise({
            url : url.resolveScript({
                scriptId : 'customscript_om_changefield_response',
                deploymentId : 'customdeploy_om_changefield_response'
            }),
            body : {
                action : 'addPrOrd',
                estimateId : id
            }
        })
        .then(function(response){
            var body = JSON.parse(response.body)

            if(body.msg === 'hello world')
            {
                msg.hide()
                message.create({
                    title : '已完成！' , 
                    type :  message.Type.CONFIRMATION , 
                    message : '处理完成！'
                }).show()

                setTimeout(function(){location.reload()} , 1000)

                return true
            }

            console.log(body)
        })
        .catch(function(e){
            console.log(e.message)
        })
    }

    return {
        addprord : addprord,
        lineInit : lineInit,
        pageInit : pageInit,
        fieldChanged : fieldChanged,
        validateLine : validateLine,
        validateInsert : validateInsert,
        changethis : changethis
    }
});

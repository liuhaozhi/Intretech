/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    'N/url',
    'N/https',
    'N/ui/message'
], function(url , https , message) {
    var off = false
    var pedingMsg = {
        title : '处理中！' , 
        type :  message.Type.INFORMATION , 
        message : '请稍后。。。' 
    }
    var sucessMsg = {
        title : '已完成！' , 
        type :  message.Type.CONFIRMATION , 
        message : '处理完成！'
    }
    var errorMsg = {
        title : '生成失败!' , 
        type : message.Type.WARNING 
    }

    function pageInit(context) {
        
    }

    function createPo(id){
        if(off) return false

        off = !off
        var msg = message.create(pedingMsg)
        msg.show()

        https.get.promise({
            url : url.resolveScript({
                scriptId : 'customscript_purchase_request_response',
                deploymentId : 'customdeploy_purchase_request_response',
                params : {
                    action : 'createPo',
                    fromId : id,
                    toType : 'purchaseorder',
                    fromType : 'customrecord_poreq_cusdefined'
                }
            })
        })
        .then(function(res){
            msg.hide()
            var body = JSON.parse(res.body)

            if(body.status === 'sucess')
            { 
                message.create(sucessMsg).show()

                setTimeout(function(){
                    location.reload()
                }, 500)
            }
            
            if(body.status === 'error')
            {
                message.create(Object.assign({message : body.message}, errorMsg)).show()
            }
           
        })
        .catch(function(e){
            message.create(Object.assign({message : e.message}, errorMsg)).show()
        })
    }

    return {
        pageInit : pageInit,
        createPo : createPo
    }
});

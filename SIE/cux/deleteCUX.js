/**
 *@NApiVersion 2.0
 *@NScriptType Restlet
 */
define(['N/search', 'N/record', 'N/runtime', 'N/format'], function (search, record, runtime, format) {

    function _get(context) {
        return deleteRecords(context);
    }

    function _post(context) {
        return deleteRecords(context);
    }

    function _delete(context) {
        return deleteRecords(context);
    }

    function deleteRecords(param) {
        var rspMsg = {
            successed: [],
            successedCount: 0,
            fail: []
        };
        var param = JSON.parse(context);
        if(isNaN(+param.id) || +param.id < 0) {
            rspMsg.fail = "Save Search的ID值非法或者不存在！"
            return rspMsg;
        }
        try{
            var sch = search.load({ id: param.id });
        } catch(e) {
            rspMsg.fail = "Save Search不存在！"
            return rspMsg;
        }
        
        sch.run().each(function(result) {
            try{
                var rec = record.delete({
                    type: result.type,
                    id: result.id,
                 });
                 rspMsg.successed.push(rec);
            } catch(e) {
                rspMsg.fail.push({ id: result.id, message: e });
            }
        });
        rspMsg.successedCount = rspMsg.successed.length;
        rspMsg.fail = rspMsg.fail.length;
        return rspMsg;
    }

    return {
        get: _get,
        post: _post,
        delete: _delete
    }
});
/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([], function() {
    function saveRecord(context) {
        debugger
        var recCurrent = context.currentRecord
        var vprePayRef = recCurrent.getValue({
            fieldId : 'custbody_nsts_vp_prepay_ref'
        })

        if(vprePayRef){
            var curAmount = 0
            var RefAmount = +getParaFromURL('amount')
            var lineCount = recCurrent.getLineCount({
                sublistId : 'line'
            })

            while(lineCount > 0){
                curAmount = add(curAmount , recCurrent.getSublistValue({
                    sublistId : 'line',
                    fieldId : 'credit',
                    line : --lineCount
                }) || 0)
            }

            if(curAmount > RefAmount){
                alert('超出可退金额')
                return false
            }
        }

        return true
    }

    function getParaFromURL(key) {
        var self = getParaFromURL;
        if (!self.map) {
            var paraMap = {};
            var paraArray = window.location.search.substring(1).split('&');
            paraArray.forEach(function (para) {
                para = para.split('=');
                paraMap[para[0]] = decodeURIComponent(para[1]);
            });
            self.map = paraMap;
        }
        return self['map'][key];
    }

    function add(a, b) {
        a = a || 0, b = b || 0
        var c, d, e;
        try {
            c = a.toString().split(".")[1].length
        } catch (f) {
            c = 0;
        }
        try {
            d = b.toString().split(".")[1].length;
        } catch (f) {
            d = 0;
        }
        return e = Math.pow(10, Math.max(c, d)), (mul(a, e) + mul(b, e)) / e;
    }
        
    function mul(a, b) {
        a = a || 0, b = b || 0
        var c = 0,
        d = a.toString(),
        e = b.toString();
        try {
            c += d.split(".")[1].length
        } catch (f) {}
        try {
            c += e.split(".")[1].length
        } catch (f) {}
        return Number(d.replace(".", "")) * Number(e.replace(".", "")) / Math.pow(10, c)
    }
      
    return {
        saveRecord: saveRecord
    }
});

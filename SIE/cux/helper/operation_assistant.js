/** 
 * operation assistant
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define([], function(
) {
    function add(a, b) {
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
        
    function sub(a, b) {
        var c, d, e;
        try {
            c = a.toString().split(".")[1].length
        } catch (f) {
            c = 0
        }
        try {
            d = b.toString().split(".")[1].length
        } catch (f) {
            d = 0
        }
        return e = Math.pow(10, Math.max(c, d)), (a * e - b * e) / e
    }
      
    function mul(a, b) {
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
      
    function div(a, b) {
        var c, d, e = 0,
            f = 0
        try {
            e = a.toString().split(".")[1].length
        } catch (g) {}
        try {
            f = b.toString().split(".")[1].length
        } catch (g) {}
        return c = Number(a.toString().replace(".", "")), d = Number(b.toString().replace(".", "")), c / d * Math.pow(10, f - e)
    }

    function getDateWithTimeZone(params) {
        var timezoneList = {
            Asia_Hong_Kong: 'Asia/Hong_Kong'
        }
        var localTime = params.date.getTime()
        var localOffset = params.date.getTimezoneOffset() * 60000
        var utc = localTime + localOffset

        if (params.timezone === timezoneList.Asia_Hong_Kong) {
            var timezoneDate = new Date(utc + 3600000 * 8)
        } else {
            var timezoneDate = params.date
        }

        return timezoneDate
    }

    return {
        add : add,
        mul : mul,
        div : div,
        sub : sub,
        getDateWithTimeZone : getDateWithTimeZone
    }
});
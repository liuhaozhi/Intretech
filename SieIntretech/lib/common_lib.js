/**
 *@NApiVersion 2.0
 *@author Charles Zhang
 *@description 通用功能库
 */
define([], function () {

    /**
    ** 加法函数，用来得到精确的加法结果
    ** 说明：javascript的加法结果会有误差，在两个浮点数相加的时候会比较明显。这个函数返回较为精确的加法结果。
    ** 调用：accAdd(arg1,arg2)
    ** 返回值：arg1加上arg2的精确结果
    ** Reviesed by Charles
    **/
    function accAdd(arg1, arg2) {
        var r1, r2, m, c, d1, d2, rs1, rs2, s1 = arg1.toString(), s2 = arg2.toString();
        d1 = s1.split('.')[1];
        r1 = d1 ? d1.length : 0;
        d2 = s2.split('.')[1];
        r2 = d2 ? d2.length : 0;
        c = Math.abs(r1 - r2);
        m = Math.pow(10, Math.max(r1, r2));
        if (c > 0) {
            var cm = Math.pow(10, c);
            if (r1 > r2) {
                rs1 = Number(s1.replace('.', ''));
                rs2 = Number(s2.replace('.', '')) * cm;
            } else {
                rs1 = Number(s1.replace('.', '')) * cm;
                rs2 = Number(s2.replace('.', ''));
            }
        } else {
            rs1 = Number(s1.replace('.', ''));
            rs2 = Number(s2.replace('.', ''));
        }
        return (rs1 + rs2) / m;
    }

    /**
     ** 减法函数，用来得到精确的减法结果
     ** 说明：javascript的减法结果会有误差，在两个浮点数相减的时候会比较明显。这个函数返回较为精确的减法结果。
     ** 调用：accSub(arg1,arg2)
     ** 返回值：arg1加上arg2的精确结果
     ** Reviesed by Charles
     **/
    function accSub(arg1, arg2) {
        var r1, r2, m, c, d1, d2, rs1, rs2, s1 = arg1.toString(), s2 = arg2.toString();
        d1 = s1.split('.')[1];
        r1 = d1 ? d1.length : 0;
        d2 = s2.split('.')[1];
        r2 = d2 ? d2.length : 0;
        c = Math.abs(r1 - r2);
        m = Math.pow(10, Math.max(r1, r2));
        if (c > 0) {
            var cm = Math.pow(10, c);
            if (r1 > r2) {
                rs1 = Number(s1.replace('.', ''));
                rs2 = Number(s2.replace('.', '')) * cm;
            } else {
                rs1 = Number(s1.replace('.', '')) * cm;
                rs2 = Number(s2.replace('.', ''));
            }
        } else {
            rs1 = Number(s1.replace('.', ''));
            rs2 = Number(s2.replace('.', ''));
        }
        return (rs1 - rs2) / m;
    }

    /**
     ** 乘法函数，用来得到精确的乘法结果
     ** 说明：javascript的乘法结果会有误差，在两个浮点数相乘的时候会比较明显。这个函数返回较为精确的乘法结果。
     ** 调用：accMul(arg1,arg2)
     ** 返回值：arg1乘以 arg2的精确结果
     ** Reviesed by Charles
     **/
    function accMul(arg1, arg2) {
        var m = 0, d1, d2, s1 = arg1.toString(), s2 = arg2.toString();
        d1 = s1.split('.')[1];
        if(d1) m += d1.length;
        d2 = s2.split('.')[1];
        if(d2) m += d2.length;
        return Number(s1.replace('.', '')) * Number(s2.replace('.', '')) / Math.pow(10, m);
    }

    /** 
     ** 除法函数，用来得到精确的除法结果
     ** 说明：javascript的除法结果会有误差，在两个浮点数相除的时候会比较明显。这个函数返回较为精确的除法结果。
     ** 调用：accDiv(arg1,arg2)
     ** 返回值：arg1除以arg2的精确结果
     ** Reviesed by Charles
     **/
    function accDiv(arg1, arg2) {
        var t1, t2, d1, d2, rs1, rs2, s1 = arg1.toString(), s2 = arg2.toString();
        d1 = s1.split('.')[1];
        t1 = d1 ? d1.length : 0;
        d2 = s2.split('.')[1];
        t2 = d2 ? d2.length : 0;
        rs1 = Number(s1.replace('.', ''));
        rs2 = Number(s2.replace('.', ''));
        if(t1 < t2){
            rs1 *= Math.pow(10, t2 - t1);
        }else{
            rs2 *= Math.pow(10, t1 - t2);
        }
        
        return rs1 / rs2;
    }

    //服务器时间非中国时间，转换为中国时间
    function getCurChinaDate() {
        var dateObj = new Date();
        var utcHours = dateObj.getUTCHours();
        var utcYear = dateObj.getUTCFullYear();
        var utcMonth = dateObj.getUTCMonth();
        var utcDate = dateObj.getUTCDate();
        dateObj.setFullYear(utcYear);
        dateObj.setMonth(utcMonth);
        dateObj.setDate(utcDate);
        dateObj.setHours(utcHours + 8);
        return dateObj;
    }

    return {
        accAdd: accAdd,
        accSub: accSub,
        accMul: accMul,
        accDiv: accDiv,
        getCurChinaDate : getCurChinaDate
    }
});

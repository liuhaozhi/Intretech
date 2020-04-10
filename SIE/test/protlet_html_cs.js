/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    'N/url',
    'N/https'
], function(
    url,
    https
) {
    function pageInit(context) {
        
        var suiteletUrlTest = url.resolveScript({
            scriptId : 'customscript769',
            deploymentId : 'customdeploy1'
        })

        https.post.promise({
            url : suiteletUrlTest,
            body : {
                action : 'test'
            }
        }).then(function(res){
            console.log(res)
        })
        var dom = document.getElementById("test");
        var myChart = echarts.init(dom);
        option = null;
        option = {
            xAxis: {
                type: 'category',
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                data: [820, 932, 901, 934, 1290, 1330, 1320],
                type: 'line'
            }]
        };
        ;
        if (option && typeof option === "object") {
            myChart.setOption(option, true);
        }
            
    }

    return {
        pageInit: pageInit
    }
});

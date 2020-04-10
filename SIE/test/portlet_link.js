/**
 *@NApiVersion 2.x
 *@NScriptType Portlet
 */
define([], function() {

    function render(params) {
        params.portlet.title = 'linkTest'
        params.portlet.addLine({
            text : 'custpage_test',
            url : 'https://www.baidu.com',
            align : 4  
        })
    }

    return {
        render: render
    }
});

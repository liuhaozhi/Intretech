/**
 *@NApiVersion 2.x
 *@NScriptType Portlet
 */
define([], function() {

    function render(params) {
        var field = params.portlet.addField({
            id : 'custpage_test',
            label : 'test',
            type : 'INLINEHTML'
        })

        field.defaultValue = '<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script><div id ="test" style="height : 200px"></div>'
        params.portlet.clientScriptModulePath = './protlet_html_cs'
    }

    return {
        render: render
    }
});

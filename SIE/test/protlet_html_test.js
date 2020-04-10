/**
 *@NApiVersion 2.x
 *@NScriptType Portlet
 */
define([], function() {

    function render(params) {
        params.portlet.title = 'test'
        params.portlet.html = '<div id=“test”>test</div>'
        params.portlet.clientScriptModulePath = './protlet_html_cs'
    }

    return {
        render: render
    }
});

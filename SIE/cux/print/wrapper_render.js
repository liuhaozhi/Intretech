/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define([
    'N/render'
],function(render) {
    var templateRenderer

    function getRenderer() {
        if (!templateRenderer) { 
            templateRenderer = render.create()
        }

        return templateRenderer
    }

    function setTemplateContents(contents) {
        getRenderer().templateContent = contents
    }

    function addCustomDataSource(params) {
        getRenderer().addCustomDataSource(params)
    }

    function renderAsString() {
        return getRenderer().renderAsString()
    }

    function renderAsPdf() {
        return getRenderer().renderAsPdf()
    }

    return {
        setTemplateContents: setTemplateContents,
        addCustomDataSource: addCustomDataSource,
        renderAsString: renderAsString,
        renderAsPdf: renderAsPdf,
        DataSource: render.DataSource
    };

});

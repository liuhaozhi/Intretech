/**
 * @NApiVersion 2.0
 * @NModuleScope TargetAccount
 */  
define([
    'N/file',
    './wrapper_render'
],function(file, render){
    function handleAsPDF(path , data) { 
        render.setTemplateContents(file.load({
            id : path
        }).getContents())

        render.addCustomDataSource({
            alias :'data', 
            format : render.DataSource.OBJECT, 
            data : data
        })

        var pdfFile = render.renderAsPdf()
        pdfFile.name = 'test.pdf'

        return pdfFile
    }

    function handleAsExcel(path , data) {
        render.setTemplateContents(file.load({
            id : path
        }).getContents())

        render.addCustomDataSource({
            alias : 'data', 
            format : render.DataSource.OBJECT, 
            data : data
        })

        var excelFile = file.create({
            name: 'test.xls',
            fileType: file.Type.PLAINTEXT,
            contents: render.renderAsString()
        })

        return excelFile
    }
    return {
        handleAsExcel: handleAsExcel,
        handleAsPDF: handleAsPDF
    };

});
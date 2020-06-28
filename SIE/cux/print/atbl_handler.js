/**
 * @NApiVersion 2.0
 * @NModuleScope TargetAccount
 */  
define([
    'N/file',
    './wrapper_render'
],function(file, render){
    function handleAsPDF(path , data , name) { 
        render.setTemplateContents(file.load({
            id : path
        }).getContents())

        render.addCustomDataSource({
            alias :'data', 
            format : render.DataSource.OBJECT, 
            data : data
        })

        var pdfFile = render.renderAsPdf()
        pdfFile.name = name + '.pdf'

        return pdfFile
    }

    function handleAsExcel(path , data , name) {
        render.setTemplateContents(file.load({
            id : path
        }).getContents())

        render.addCustomDataSource({
            alias : 'data', 
            format : render.DataSource.OBJECT, 
            data : data
        })

        var excelFile = file.create({
            name: name + '.xls',
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
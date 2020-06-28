/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 */
define([
    './atbl_handler',
    './print_data'
], function(
    handler,
    printData
) {
    function onRequest(context) {
        var request = context.request
        var response= context.response
        var params  = request.parameters
            
        if(request.method === 'GET' && params.action === 'print')
        {
            print(params,response)
        }
    }

    function print(params,response){
        if(params.type === 'pdf')
        {
            if(params.printType === 'packlist')
            response.writeFile(handler.handleAsPDF('./template/packing_list_pdf.ftl' , printData.getPackListData(params.id) , '装箱单'))
            
            if(params.printType === 'transportInvoice')
            response.writeFile(handler.handleAsPDF('./template/transport_invoice_pdf.ftl' , printData.getTransportInvData(params.id) , '运输发票'))

            if(params.printType === 'paymentInvoice')
            response.writeFile(handler.handleAsPDF('./template/payment_invoice_pdf.ftl' , printData.getPaymentInvData(params.id) , '收款发票'))

            if(params.printType === 'creditInvoice')
            response.writeFile(handler.handleAsPDF('./template/credit_invoice_pdf.ftl' , printData.getCreditInvoiceDate(params.id) , '贷项发票'))
        }
        else if(params.type === 'excel')
        {
            if(params.printType === 'packlist')
            response.writeFile(handler.handleAsExcel('./template/packing_list_Excel.ftl' , printData.getPackListData(params.id) , '装箱单'))

            if(params.printType === 'transportInvoice')
            response.writeFile(handler.handleAsExcel('./template/transport_invoice_Excel.ftl' , printData.getTransportInvData(params.id) , '运输发票'))

            if(params.printType === 'paymentInvoice')
            response.writeFile(handler.handleAsExcel('./template/payment_invoice_Excel.ftl' , printData.getPaymentInvData(params.id) , '收款发票'))

            if(params.printType === 'creditInvoice')
            response.writeFile(handler.handleAsExcel('./template/credit_invoice_Excel.ftl' , printData.getCreditInvoiceDate(params.id) , '贷项发票'))
        }
    }

    return {
        onRequest: onRequest
    }
});

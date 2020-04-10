<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
    <head>
        <style type="text/css">
            table {
            <#if .locale == "zh_CN">
                font-family: STSong, sans-serif;
            <#else>
                font-family: Arial, sans-serif, STSong;
            </#if>
                font-size: 9pt;
                table-layout: fixed;
                border-collapse: collapse;
            }	

            #itemTitle td,#itemAmount td,.itemRows td, .itemSpace td{
                border-left:thin solid #000;
                border-top:thin solid #000;
            }

            p.title{
                font-size : 18px;
            }
        </style>
    </head>
    <#function makesure value>
        <#if !value??><#return ''></#if>
        <#if value == ''><#return ''></#if>
        <#if !value?has_content><#return ''></#if>
        <#return value>
    </#function>

    <#function makenumber value>
        <#if !value??><#return '0'></#if>
        <#if value == ''><#return '0'></#if>
        <#if !value?has_content><#return '0'></#if>
        <#return value>
    </#function>
    <body padding="0.5in 0.5in 0.5in 0.5in" size="A4">
        <div style="position:relative;margin : 0;padding: 0;">
            <#if  "${data.subsidiaryInfo.logoUrl}" != "" >
                <img src="${data.subsidiaryInfo.logoUrl}" style="position:absolute;left:50px;top:0.1in;width:110px;height:50px" />
            </#if>
            <table id="container" style="width:100%;overflow: hidden;" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center" colspan="8" style="vertical-align: middle;">
                         <p class="title">${makesure(data.subsidiaryInfo.legalname)}</p>
                    </td>
                </tr>
                <tr>
                    <td align="center" colspan="8" style="vertical-align: middle;">
                        ${makesure(data.subsidiaryInfo.mainaddress_text)}
                    </td>
                </tr>
                <tr>
                    <td align="center" colspan="8" style="vertical-align: middle;">
                        TEL:${makesure(data.subsidiaryInfo.custrecord_subsidiary_phone)};FAX:${makesure(data.subsidiaryInfo.fax)}
                    </td>
                </tr>
                <tr><td align="center" colspan="8" style="height:20px;"></td></tr>
                <tr>
                    <td align="center" colspan="8" style="vertical-align: middle;">
                        <p class="title">INVOICE</p>
                    </td>
                </tr>
                <tr class="borderRow">
                    <td colspan="5" style="border-left:thin solid #000;border-top:thin solid #000;">
                       <table id="shipExport">
                            <tr><td>Shipper / Exporter:</td></tr>
                            <tr><td>${makesure(data.subsidiaryInfo.legalname)}</td></tr>
                            <tr><td>${makesure(data.subsidiaryInfo.mainaddress_text)}</td></tr>
                            <tr><td>Telephone：${makesure(data.subsidiaryInfo.custrecord_subsidiary_phone)}</td></tr>
                        </table>
                    </td>
                    <td colspan="3" style="border-left:thin solid #000;border-top:thin solid #000;border-right:thin solid #000;">
                        <table id="shipMethod">
                            <tr><td>Invoice No:${makesure(data.shipInfo.invNum)}</td></tr>
                            <tr><td>Invoice Date:${makesure(data.shipInfo.invDay)}</td></tr>
                            <tr><td>Ship method:${makesure(data.shipInfo.method)}</td></tr>
                        </table>
                    </td>
                </tr>
                <tr class="borderRow" >
                    <td colspan="5" style="border-left:thin solid #000;border-top:thin solid #000;">
                        <table id="bill">
                            <tr><td>Bill to</td></tr>
                            <tr><td>${makesure(data.customerName)}</td></tr>
                            <tr><td>${makesure(data.billInfo.adress)}</td></tr>
                            <tr><td>${makesure(data.billInfo.emp)}</td></tr>
                        </table>
                    </td>
                    <td colspan="3" rowspan="2" style="border-left:thin solid #000;border-right:thin solid #000;border-top:thin solid #000;">
                        <table id="bankinfo">
                            <tr><td>Bank information</td></tr>
                            <tr><td>${makesure(data.bankInfo.name)}</td></tr>
                            <tr><td align="left">${makesure(data.bankInfo.account)}</td></tr>
                        </table>
                    </td>
                </tr>
                <tr class="borderRow">
                    <td colspan="5" style="border-left:thin solid #000;border-top:thin solid #000;">
                        <table id="consigenee">
                            <tr><td>Consigenee</td></tr>
                            <tr><td>${makesure(data.customerName)}</td></tr>
                            <tr><td>${makesure(data.shipInfo.adress)}</td></tr>
                            <tr><td align="left">${makesure(data.shipInfo.phone)}</td></tr>
                            <tr><td>Atten : ${makesure(data.shipInfo.emp)}</td></tr>
                        </table>
                    </td>
                </tr>
                <tr id="itemTitle">
                    <td align="center">Item</td>
                    <td align="center">Po No.</td>
                    <td align="center"></td>
                    <td align="center">Part Number</td>
                    <td align="center">Description</td>
                    <td align="center">Q'ty(PCS)</td>
                    <td align="center">Unit Price(${makesure(data.currencySymbol)})</td>
                    <td align="center" style="border-right:thin solid #000;">Amount(${makesure(data.currencySymbol)})</td>
                </tr>
                <tr id="itemAmount">
                    <td align="center">/</td>
                    <td align="center">/</td>
                    <td></td>
                    <td align="center">/</td>
                    <td align="center">Plastic Case</td>
                    <td align="center">${makenumber(data.itemTotal.quantity)}</td>
                    <td></td>
                    <td align="center" style="border-right:thin solid #000;">${makenumber(data.itemTotal.amount)}</td>
                </tr>
                <#list data.items as item>
                    <tr class="itemRows">
                        <td align="center">${item?counter}</td>
                        <td align="center">${makesure(item.orderNum)}</td>
                        <td align="center">${makesure(item.lineNum)}</td>
                        <td align="center">${makesure(item.itemNum)}</td>
                        <td align="center">${makesure(item.itemDes)}</td>
                        <td align="center">${makenumber(item.quantity)}</td>
                        <td align="center">${makenumber(item.price)}</td>
                        <td align="center" style="border-right:thin solid #000;">${makenumber(item.amount)}</td>
                    </tr>
                </#list>
                <tr class="itemSpace" style="height:20px;">
                    <td colspan="8" style="border-right:thin solid #000;">合计：${makesure(data.itemTotal.chinaAmount)}</td>
                </tr>
                <tr class="borderRow">
                    <td colspan="5" style="border-left:thin solid #000;border-bottom:thin solid #000;border-top:thin solid #000;height:200px">
                        Country if Origin: china
                    </td>
                    <td colspan="3" style="border:thin solid #000;height:200px">
                        Company Chop
                    </td>
                </tr>
            </table>
        </div>
    </body>
</pdf>
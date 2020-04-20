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
                vertical-align: middle;
            }

            #itemTitle td:last-child,#itemAmount td:last-child,.itemRows td:last-child, .itemSpace td:last-child{
                border-right:thin solid #000;
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
                    <td align="center" colspan="9" style="vertical-align: middle;">
                        <p class="title">${makesure(data.subsidiaryInfo.legalname)}</p>
                    </td>
                </tr>
                <tr><td align="center" colspan="9" style="vertical-align: middle;">${makesure(data.subsidiaryInfo.mainaddress_text)}</td></tr>
                <tr>
                    <td align="center" colspan="9" style="vertical-align: middle;">
                    TEL:${makesure(data.subsidiaryInfo.custrecord_subsidiary_phone)};FAX:${makesure(data.subsidiaryInfo.fax)}
                    </td>
                </tr>
                <tr><td align="center" colspan="9" style="height:20px;"></td></tr>
                <tr>
                    <td align="center" colspan="9" style="vertical-align: middle;">
                        <p class="title">Credit Note</p>
                    </td>
                </tr>
                <tr class="borderRow">
                    <td colspan="4" style="border-left:thin solid #000;border-top:thin solid #000;">
                        <table id="shipExport">
                            <tr><td>Shipper / Exporter:</td></tr>
                            <tr><td>${makesure(data.subsidiaryInfo.legalname)}</td></tr>
                            <tr><td>${makesure(data.subsidiaryInfo.mainaddress_text)}</td></tr>
                            <tr><td>TelePhone：${makesure(data.subsidiaryInfo.custrecord_subsidiary_phone)}</td></tr>
                        </table>
                    </td>
                    <td colspan="4" rowspan="2" style="border-left:thin solid #000;border-top:thin solid #000;border-right:thin solid #000;">
                        <table id="shipMethod">
                            <tr><td>Note Number:${makesure(data.tranid)}</td></tr>
                            <tr><td>Date:${makesure(data.trandate)}</td></tr>
                            <tr>
                                <td>
                                     <table id="bankinfo">
                                        <tr><td>Paying bank information</td></tr>
                                        <tr><td>Account Name:${makesure(data.bankInfo.subsidiary)}</td></tr>
                                        <tr><td>Account No:${makesure(data.bankInfo.account)}</td></tr>
                                        <tr><td>Bank Name:${makesure(data.bankInfo.branch)}</td></tr>
                                        <tr><td>Bank Address:${makesure(data.bankInfo.adress)}</td></tr>
                                        <tr><td>Swift Code:${makesure(data.bankInfo.code)}</td></tr>
                                        <tr><td align="left">Beneficiary's TEL:${makesure(data.bankInfo.tel)}</td></tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr class="borderRow" >
                    <td colspan="4" style="border-left:thin solid #000;border-top:thin solid #000;">
                        <table id="consigenee">
                            <tr><td>Credit to:</td></tr>
                            <tr><td>${makesure(data.bill.adress)}</td></tr>
                            <tr><td>Atten : ${makesure(data.bill.emp)}</td></tr>
                        </table>
                    </td>
                </tr>
                <tr id="itemTitle">
                    <td align="center">Item</td>
                    <td align="center">PO NO.</td>
                    <td align="center">PN</td>
                    <td align="center">Desprtion</td>
                    <td align="center">Q'ty(PCS)</td>
                    <td align="center">Unit price（${makesure(data.currencySymbol)}）</td>
                    <td align="center">Amount（${makesure(data.currencySymbol)}）</td>
                    <td align="center">Remark</td>
                </tr>
                <#list data.items as item>
                    <tr class="itemRows">
                        <td align="center">${item?counter}</td>
                        <td align="center">${makenumber(item.orderNum)}</td>
                        <td align="center">${makesure(item.itemNum)}</td>
                        <td align="center">${makesure(item.itemDes)}</td>
                        <td align="center">${makenumber(item.quantity)}</td>
                        <td align="center">${makenumber(item.price)}</td>
                        <td align="center">${makenumber(item.amount)}</td>
                        <td align="center">${makesure(item.remark)}</td>
                    </tr>
                </#list>
                <tr id="itemAmount">
                    <td>Total</td>
                    <td align="center"></td>
                    <td align="center"></td>
                    <td align="center"></td>
                    <td align="center">${makenumber(data.itemTotal.quantity)}</td>
                    <td align="center"></td>
                    <td align="center">${makenumber(data.itemTotal.amount)}</td>
                    <td></td>
                </tr>
                <tr class="itemSpace" style="height:20px;">
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
                <tr class="itemSpace" style="height:20px;">
                    <td colspan="8" style="border-right:thin solid #000;">合计：${makesure(data.itemTotal.chinaAmount)}</td>
                </tr>
                <tr class="borderRow">
                    <td colspan="4" style="border-left:thin solid #000;border-bottom:thin solid #000;border-top:thin solid #000;height:200px">
                        Country if Origin: china
                    </td>
                    <td colspan="4" style="border:thin solid #000;height:200px">
                        Company Chop
                    </td>
                </tr>
            </table>
        </div>
    </body>
</pdf>
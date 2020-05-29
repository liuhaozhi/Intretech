<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta name=ProgId content=Excel.Sheet>
        <meta name=Generator content="Microsoft Excel 11">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
            <x:Name>Account Balance</x:Name>
            <x:WorksheetOptions><x:DisplayGridlines/>
            </x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
        </xml><![endif]-->
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
                        <p class="title">PACKING LIST/装箱单</p>
                    </td>
                </tr>
                <tr class="borderRow">
                    <td colspan="5" style="border-left:thin solid #000;border-top:thin solid #000;">
                        <table id="shipExport">
                            <tr><td>Shipper / Exporter/（发货人/出口商）：</td></tr>
                            <tr><td>${makesure(data.subsidiaryInfo.legalname)}</td></tr>
                            <tr><td>${makesure(data.subsidiaryInfo.mainaddress_text)}</td></tr>
                            <tr><td>TEL/电话：${makesure(data.subsidiaryInfo.custrecord_subsidiary_phone)}</td></tr>
                            <tr><td>FAX/传真：${makesure(data.subsidiaryInfo.fax)}</td></tr>
                        </table>
                    </td>
                    <td colspan="4" style="border-left:thin solid #000;border-top:thin solid #000;border-right:thin solid #000;">
                        <table id="shipMethod">
                            <tr><td>Ship Method/运输方式：${makesure(data.shipInfo.method)}</td></tr>
                            <tr><td>Shipping  Date/发运日期：${makesure(data.shipInfo.packDate)}</td></tr>
                            <tr><td>Invoice No./发票号：${makesure(data.shipInfo.invNum)}</td></tr>
                        </table>
                    </td>
                </tr>
                <tr class="borderRow" >
                    <td colspan="5" style="border-left:thin solid #000;border-top:thin solid #000;">
                        <table id="consigenee">
                            <tr><td>Consignee/收货人:</td></tr>
                            <tr><td>${makesure(data.customerName)}</td></tr>
                        </table>
                    </td>
                    <td colspan="4" rowspan="2" style="border-left:thin solid #000;border-right:thin solid #000;border-top:thin solid #000;">
                    </td>
                </tr>
                <tr class="borderRow">
                    <td colspan="5" style="border-left:thin solid #000;border-top:thin solid #000;">
                        <table>
                            <tr><td>Ship to Addres/收货地址：</td></tr>
                            <tr><td>${makesure(data.shipInfo.adress)}</td></tr>
                            <tr><td>Attn/联系人：${makesure(data.shipInfo.emp)}</td></tr>
                            <tr><td>TEL/联系电话：${makesure(data.shipInfo.phone)}</td></tr>
                        </table>
                    </td>
                </tr>
                <tr id="itemTitle">
                    <td align="center">Item/项目：</td>
                    <td align="center">Package /箱数(CTNS)：</td>
                    <td align="center">PO No./订单单号：</td>
                    <td align="center">PN/货号：</td>
                    <td align="center">Description/规格描述：</td>
                    <td align="center">Qty. /数量（PCS）:</td>
                    <td align="center">Net Weight/总净重（KGS）:</td>
                    <td align="center">Gross Weight/总毛重（KGS）:</td>
                    <td align="center" style="border-right:thin solid #000;">Measurement /立方数（CBM）:</td>
                </tr>
                <tr class="itemSpace">
                    <td colspan="9" style="height:20px;border-right:thin solid #000;"></td>
                </tr>
                <#list data.items as item>
                    <tr class="itemRows">
                        <td align="center">${item?counter}</td>
                        <td align="center">${makenumber(item.boxNum)}</td>
                        <td align="center">${makesure(item.orderNum)}</td>
                        <td align="center">${makesure(item.itemNum)}</td>
                        <td align="center">${makesure(item.itemDes)}</td>
                        <td align="center">${makenumber(item.quantity)}</td>
                        <td align="center">${makenumber(item.suttle)}</td>
                        <td align="center">${makenumber(item.rough)}</td>
                        <td align="center" style="border-right:thin solid #000;">${makenumber(item.cube)}</td>
                    </tr>
                </#list>
                <tr id="itemAmount">
                     <td>Total/总计</td>
                    <td align="center">${makenumber(data.itemTotal.boxNum)}</td>
                    <td align="center">/</td>
                    <td align="center">/</td>
                    <td></td>
                    <td align="center">${makenumber(data.itemTotal.quantity)}</td>
                    <td align="center">${makenumber(data.itemTotal.suttle)}</td>
                    <td align="center">${makenumber(data.itemTotal.rough)}</td>
                    <td align="center" style="border-right:thin solid #000;">${makenumber(data.itemTotal.cube)}</td>
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
                    <td style="border-right:thin solid #000;"></td>
                </tr>
                <tr class="borderRow">
                    <td colspan="5" style="border-left:thin solid #000;border-bottom:thin solid #000;border-top:thin solid #000;height:200px">
                        xxxx
                    </td>
                    <td colspan="4" style="border:thin solid #000;height:200px">
                        xxx
                    </td>
                </tr>
            </table>
        </div>
    </body>
</html>
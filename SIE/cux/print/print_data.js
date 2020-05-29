/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define([
    'N/file',
    'N/search',
    'N/record',
    'N/format',
    '../helper/wrapper_runtime',
    '../helper/operation_assistant'
],function(file , search , record , format , runtime , operation) {
    var sublistId = 'recmachcustrecord185'

    function getPackListData(id){
        var recordInfo = record.load({
            type : 'customrecord_hebingfapiao',
            id : id
        })
        var packListLineInfo = getPackListLineInfo(recordInfo)
        var subsidiaryInfo = getSubsidiaryInfo(recordInfo.getValue({
            fieldId : 'custrecord_ci_zigongsi'
        }))
        var customerInfo = getCustomerInfo(recordInfo.getValue({
            fieldId : 'custrecord_kehu_fapiao'
        }))

        return {
            customerName : customerInfo.companyname,
            subsidiaryInfo : subsidiaryInfo,
            shipInfo : {
                adress : recordInfo.getValue({
                    fieldId : 'custrecord_shouhuodizhi'
                }),
                phone : recordInfo.getValue({
                    fieldId : 'custrecord_shouhuorendianhua'
                }),
                emp : recordInfo.getText({
                    fieldId : 'custrecord_shouhuoren'
                }),
                method : recordInfo.getText({
                    fieldId : 'custrecord_yunshufangshi'
                }),
                invNum : recordInfo.getValue({
                    fieldId : 'custrecord_ci_fapiaohao'
                }),
                packDate : packListLineInfo.packDate
            },
            items : packListLineInfo.itemLines,
            itemTotal : packListLineInfo.itemTotal
        }
    }

    function getBankInfo(bank){
        if(bank)
        {
            var bankInfo = search.lookupFields({
                type : 'customrecord_yinhangxinxi',
                id : bank,
                columns : [
                    'custrecord_yinhangzhanghumc',
                    'custrecord_account_no',
                    'custrecordfenzhihang_name',
                    'custrecordbank_address',
                    'custrecord_swift_code',
                    'custrecord_beneficiarys_tel'
                ]
            })

            return {
                subsidiary : bankInfo.custrecord_yinhangzhanghumc[0] ? bankInfo.custrecord_yinhangzhanghumc[0].text : '',
                account : bankInfo.custrecord_account_no ? bankInfo.custrecord_account_no : '',
                branch : bankInfo.custrecordfenzhihang_name ? bankInfo.custrecordfenzhihang_name : '',
                adress : bankInfo.custrecordbank_address ? bankInfo.custrecordbank_address : '',
                code : bankInfo.custrecord_swift_code ? bankInfo.custrecord_swift_code : '',
                tel : bankInfo.custrecord_beneficiarys_tel ? bankInfo.custrecord_beneficiarys_tel : ''
            }
        }
         
        return {}
    }

    function getTransportInvData(id){
        var recordInfo = record.load({
            type : 'customrecord_hebingfapiao',
            id : id
        })
        var currencySymbol = getCurrencySymbol(recordInfo.getValue({
            fieldId : 'custrecord_huobi_fapiao'
        }))
        var subsidiaryInfo = getSubsidiaryInfo(recordInfo.getValue({
            fieldId : 'custrecord_ci_zigongsi'
        }))
        var customerInfo = getCustomerInfo(recordInfo.getValue({
            fieldId : 'custrecord_kehu_fapiao'
        }))
        var transportInvLineInfo = getTransportInvLineInfo(recordInfo)
        var bankInfo = getBankInfo(recordInfo.getValue({
            fieldId : 'custrecord_p_custentity_bankinfo'
        }))

        return {
            subsidiaryInfo : subsidiaryInfo,
            customerName : customerInfo.companyname,
            currencySymbol : currencySymbol,
            shipInfo : {
                adress : recordInfo.getValue({
                    fieldId : 'custrecord_shouhuodizhi'
                }),
                invDay : format.format({
                    type : format.Type.DATE , 
                    value : operation.getDateWithTimeZone({
                        date: new Date(),
                        timezone: runtime.getUserTimezone()
                    })
                }),
                port : recordInfo.getText({
                    fieldId : 'custrecord_port_of_loading'
                }),
                method : recordInfo.getText({
                    fieldId : 'custrecord_yunshufangshi'
                }),
                invNum : recordInfo.getValue({
                    fieldId : 'custrecord_ci_fapiaohao'
                }),
                terms : recordInfo.getValue({
                    fieldId : 'custrecord_payment_term'
                })
            },
            billInfo : {
                    adress : recordInfo.getValue({
                    fieldId : 'custrecord_kehudizhi'
                })
            },
            bankInfo :bankInfo,
            items : transportInvLineInfo.itemLines,
            itemTotal : transportInvLineInfo.itemTotal,
        }
    }

    function getPaymentInvData(id){
        var recordInfo = record.load({
            type : 'customrecord_hebingfapiao',
            id : id
        })
        var currencySymbol = getCurrencySymbol(recordInfo.getValue({
            fieldId : 'custrecord_huobi_fapiao'
        }))
        var subsidiaryInfo = getSubsidiaryInfo(recordInfo.getValue({
            fieldId : 'custrecord_ci_zigongsi'
        }))
        var customerInfo = getCustomerInfo(recordInfo.getValue({
            fieldId : 'custrecord_kehu_fapiao'
        }))
        var paymentInvLineInfo = getPaymentInvLineInfo(recordInfo)
        var bankInfo = getBankInfo(recordInfo.getValue({
            fieldId : 'custrecord_p_custentity_bankinfo'
        }))

        return {
            subsidiaryInfo : subsidiaryInfo,
            customerName : customerInfo.companyname,
            currencySymbol : currencySymbol,
            shipInfo : {
                emp :  recordInfo.getText({
                    fieldId : 'custrecord_shouhuoren'
                }),
                adress : recordInfo.getValue({
                    fieldId : 'custrecord_shouhuodizhi'
                }),
                invDay : format.format({
                    type : format.Type.DATE , 
                    value : operation.getDateWithTimeZone({
                        date : new Date(),
                        timezone : runtime.getUserTimezone()
                    })
                }),
                method : recordInfo.getText({
                    fieldId : 'custrecord_yunshufangshi'
                }),
                invNum : recordInfo.getValue({
                    fieldId : 'custrecord_ci_fapiaohao'
                }),
                phone : recordInfo.getValue({
                    fieldId : 'custrecord_shouhuorendianhua'
                })
            },
            billInfo : {
                adress : recordInfo.getValue({
                    fieldId : 'custrecord_kehudizhi'
                }),
                emp : recordInfo.getText({
                    fieldId : 'custrecord_shoupiaoren'
                })
            },
            bankInfo : bankInfo,
            items : paymentInvLineInfo.itemLines,
            itemTotal : paymentInvLineInfo.itemTotal,
        }
    }

    function getPaymentInvLineInfo(detailRecord){
        var itemLines = new Array()
        var lineCount = detailRecord.getLineCount({
            sublistId : sublistId
        })
        var itemTotal = {
            amount : detailRecord.getValue({
                fieldId : 'custrecord_ci_zongjine'
            }),
            chinaAmount : changeNumMoneyToChinese(detailRecord.getValue({
                fieldId : 'custrecord_ci_zongjine'
            }))
        }
       
        for(var index = 0 ; index < lineCount ; index++)
        {
            var quantity =  getSublistValue(detailRecord,'custrecord_ci_shuliang',index)

            itemTotal.quantity = itemTotal.quantity ? operation.add(itemTotal.quantity , quantity) : quantity 
        
            itemLines.push({
                orderNum : getSublistValue(detailRecord,'custrecord_ci_kehudingdanhao',index), //客户订单号
                lineNum : getSublistValue(detailRecord,'custrecord_ci_kehudingdanhanghao',index), //客户订单行号
                itemNum : getSublistText(detailRecord,'custrecord_ci_kehuwuliaobianma',index),
                itemDes : getSublistValue(detailRecord,'custrecord_ci_kehuwuliaomingchen',index),
                quantity : quantity,
                price : getSublistValue(detailRecord,'custrecord_ci_danjia',index),
                amount : getSublistValue(detailRecord,'custrecord_ci_zongjine_',index),
                interItem : getSublistValue(detailRecord,'custrecord_ci_wuliaobianma',index)
            })
        }

        itemLines = detailRecord.getValue('custrecord_hebingxiangtonghuoping') === '2' ?
        CombineSameGoods(itemLines , ['itemNum','price'] , ['quantity','amount']) :
        CombineSameGoods(itemLines , ['interItem','price'] , ['quantity','amount'])

        return {
            itemTotal : itemTotal,
            itemLines : itemLines
        }
    }

    function getCreditInvoiceDate(id){
        var recordInfo = record.load({
            type : 'creditmemo',
            id : id
        })
        var currencySymbol = getCurrencySymbol(recordInfo.getValue({
            fieldId : 'currency'
        }))
        var subsidiaryInfo = getSubsidiaryInfo(recordInfo.getValue({
            fieldId : 'subsidiary'
        }))
        var creditInvLineInfo = getCreditInvLineInfo(recordInfo)
        var bankInfo = getBankInfo(recordInfo.getValue({
            fieldId : 'custbody_custentity_bankinfo'
        }))

        return {
            subsidiaryInfo : subsidiaryInfo,
            currencySymbol : currencySymbol,
            tranid : recordInfo.getValue('tranid'),
            trandate : recordInfo.getText('trandate'),
            bankInfo : bankInfo,
            bill : {
                emp : recordInfo.getValue('custbody_vperson'),
                adress : recordInfo.getValue('billaddress')
            },
            items : creditInvLineInfo.itemLines,
            itemTotal : creditInvLineInfo.itemTotal
        }
    }

    function getCreditInvLineInfo(detailRecord){
        var itemLines = new Array()
        var lineCount = detailRecord.getLineCount({
            sublistId : 'item'
        })
        var itemTotal = {
            amount : detailRecord.getValue({
                fieldId : 'total'
            }),
            chinaAmount : changeNumMoneyToChinese(detailRecord.getValue({
                fieldId : 'total'
            }))
        }
       
        for(var index = 0 ; index < lineCount ; index++)
        {
            var quantity = detailRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'quantity',
                line : index
            })

            itemTotal.quantity = itemTotal.quantity ? operation.add(itemTotal.quantity , quantity) : quantity 
        
            itemLines.push({
                orderNum : detailRecord.getValue('custbody_wip_customer_order_number'),
                itemNum : detailRecord.getSublistText({
                    sublistId : 'item',
                    fieldId : 'custcol_cgoodscode',
                    line : index
                }),
                itemDes : detailRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_cgoodsname',
                    line : index
                }),
                quantity : quantity,
                price :  detailRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'rate',
                    line : index
                }),
                amount : detailRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'grossamt',
                    line : index
                }),
                remark : detailRecord.getValue('custbody_invoice_number'),
                interItem : detailRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'item',
                    line : index
                })
            })
        }

        itemLines = detailRecord.getValue('custrecord_hebingxiangtonghuoping') === '2' ?
        CombineSameGoods(itemLines , ['itemNum','price'] , ['quantity','amount']) :
        CombineSameGoods(itemLines , ['interItem','price'] , ['quantity','amount'])

        return {
            itemTotal : itemTotal,
            itemLines : itemLines
        }
    }

    function getTransportInvLineInfo(detailRecord){
        var itemLines = new Array()
        var lineCount = detailRecord.getLineCount({
            sublistId : sublistId
        })
        var itemTotal = {
            amount : detailRecord.getValue({
                fieldId : 'custrecord_ci_zongjine'
            }),
            chinaAmount : changeNumMoneyToChinese(detailRecord.getValue({
                fieldId : 'custrecord_ci_zongjine'
            }))
        }
       
        for(var index = 0 ; index < lineCount ; index++)
        {
            var quantity =  getSublistValue(detailRecord,'custrecord_ci_shuliang',index)

            itemTotal.quantity = itemTotal.quantity ? operation.add(itemTotal.quantity , quantity) : quantity 
        
            itemLines.push({
                orderNum : getSublistValue(detailRecord,'custrecord_ci_kehudingdanhao',index),
                itemNum : getSublistText(detailRecord,'custrecord_ci_kehuwuliaobianma',index),
                itemDes : getSublistValue(detailRecord,'custrecord_ci_kehuwuliaomingchen',index),
                quantity : quantity,
                price : getSublistValue(detailRecord,'custrecord_ci_danjia',index),
                amount : getSublistValue(detailRecord,'custrecord_ci_zongjine_',index),
                interItem : getSublistValue(detailRecord,'custrecord_ci_wuliaobianma',index)
            })
        }

        itemLines = detailRecord.getValue('custrecord_hebingxiangtonghuoping') === '2' ?
        CombineSameGoods(itemLines , ['itemNum','price'] , ['quantity','amount']) :
        CombineSameGoods(itemLines , ['interItem','price'] , ['quantity','amount'])

        return {
            itemTotal : itemTotal,
            itemLines : itemLines
        }
    }

    function getPackListLineInfo(detailRecord){
        var packDate  = undefined
        var itemTotal = new Object()
        var itemLines = new Array()
        var lineCount = detailRecord.getLineCount({
            sublistId : sublistId
        })

        for(var index = 0 ; index < lineCount ; index++)
        {
            var boxNum = getSublistValue(detailRecord,'custrecord_ci_xiangshu',index)
            var orderNum =  getSublistValue(detailRecord,'custrecord_ci_kehudingdanhao',index)
            var itemNum = getSublistText(detailRecord,'custrecord_ci_kehuwuliaobianma',index)
            var itemDes = getSublistValue(detailRecord,'custrecord_ci_kehuwuliaomingchen',index)
            var quantity =  getSublistValue(detailRecord,'custrecord_ci_shuliang',index)
            var suttle =  getSublistValue(detailRecord,'custrecord_ci_zongjingzhong',index)
            var rough = getSublistValue(detailRecord,'custrecord_ci_zongmaozhong',index)
            var cube = getSublistValue(detailRecord,'custrecord_ci_zonglifangshu',index)
            var interItem = getSublistValue(detailRecord,'custrecord_ci_wuliaobianma',index)

            if(!packDate)
            packDate = getSublistText(detailRecord,'custrecord_ci_jiaoqi',index)

            itemTotal.boxNum = itemTotal.boxNum ? operation.add(itemTotal.boxNum , boxNum) : boxNum 
            itemTotal.quantity = itemTotal.quantity? operation.add(itemTotal.quantity , quantity) : quantity 
            itemTotal.suttle = itemTotal.suttle ? operation.add(itemTotal.suttle , suttle) : suttle 
            itemTotal.rough = itemTotal.rough ? operation.add(itemTotal.rough , rough) : rough 
            itemTotal.cube = itemTotal.cube ? operation.add(itemTotal.cube , cube) : cube 

            itemLines.push({
                boxNum : boxNum,
                orderNum : orderNum,
                itemNum : itemNum,
                itemDes : itemDes,
                quantity : quantity,
                suttle : suttle,
                rough : rough,
                cube : cube,
                interItem : interItem
            })
        }

        itemLines = detailRecord.getValue('custrecord_hebingxiangtonghuoping') === '2' ?
        CombineSameGoods(itemLines , ['itemNum'] , ['quantity','boxNum','suttle','rough','cube']) :
        CombineSameGoods(itemLines , ['interItem'] , ['quantity','boxNum','suttle','rough','cube'])

        return {
            packDate : packDate,
            itemTotal : itemTotal,
            itemLines : itemLines
        }
    }

    function CombineSameGoods(itemLines,filters,columns){
        var i = 0
        var newLines = new Array()

        for(; i < itemLines.length ; i ++)
        {
            var indexs = new Array()
            var item1 = itemLines[i]

            itemLines.splice(i,1)
            i--

            itemLines.map(function(item2,index){
                var g = 0
                var same = true

                for(; g < filters.length ; g ++)
                {
                    if(item1[filters[g]] !== item2[filters[g]])
                    {
                        same = false
                        break
                    }
                }

                if(same)
                {
                    var k = 0

                    for(; k < columns.length ; k ++)
                    {
                        item1[columns[k]] = operation.add(
                            item1[columns[k]] || 0,
                            item2[columns[k]] || 0
                        )
                    }

                    indexs.push(index)
                }
            })
            
            for(var x = indexs.length - 1 ; x >= 0 ; x --)
            {
                itemLines.splice(indexs[x],1)
            }

            newLines.push(item1)
        }

        return newLines
    }

    function getSublistValue(detailRecord,fieldId,index){
        return detailRecord.getSublistValue({
            sublistId : sublistId,
            fieldId : fieldId,
            line : index
        })
    }

    function getSublistText(detailRecord,fieldId,index){
        return detailRecord.getSublistText({
            sublistId : sublistId,
            fieldId : fieldId,
            line : index
        })
    }

    function getCustomerInfo(customer){
        return search.lookupFields({
            type : 'customer',
            id : customer,
            columns : ['companyname','terms']
        })
    }

    function getCurrencySymbol(currency){
        var currencyRec = record.load({
            type : 'currency',
            id : currency
        })

        return currencyRec.getValue('displaysymbol')
    }

    function getSubsidiaryInfo(subsidiary){
        var logoUrl = ''
        var subsidiaryInfo = record.load({
            type : 'subsidiary',
            id : subsidiary
        })
        var logoId = subsidiaryInfo.getValue({
            fieldId : 'pagelogo'
        })

        if(logoId){
            logoUrl = file.load({id : logoId}).url
            logoUrl = logoUrl.replace(/\&/g,'&amp;')
        }

        return {
            logoUrl : logoUrl,
            fax : subsidiaryInfo.getValue({fieldId : 'fax'}),
            legalname : subsidiaryInfo.getValue({fieldId : 'legalname'}),
            mainaddress_text : subsidiaryInfo.getValue({fieldId : 'mainaddress_text'}),
            custrecord_subsidiary_phone : subsidiaryInfo.getValue({fieldId : 'custrecord_subsidiary_phone'})
        }
    }

    function changeNumMoneyToChinese(money)
    {
        var cnNums = new Array('零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖')
        var cnIntRadice = new Array('', '拾', '佰', '仟')
        var cnIntUnits = new Array('', '万', '亿', '兆')
        var cnDecUnits = new Array('角', '分', '毫', '厘')
        var cnInteger = '整'
        var cnIntLast = '元'
        var maxNum = 999999999999999.9999
        var IntegerNum
        var DecimalNum
        var ChineseStr = ''
        var parts 
        var Symbol = ''

        if (money === '') {
            return ''
        }
    
        money = parseFloat(money)

        if (money >= maxNum) {
            return ''
        }

        if (money === 0) {
            ChineseStr = cnNums[0] + cnIntLast + cnInteger
            return ChineseStr
        }

        if(money<0)
        {
            money = -money
            Symbol = '负 '    
        }

        money = money.toString()

        if (money.indexOf('.') === -1) 
        {
            IntegerNum = money
            DecimalNum = ''
        } 
        else
        {
            parts = money.split('.')
            IntegerNum = parts[0]
            DecimalNum = parts[1].substr(0, 4)
        }

        if (parseInt(IntegerNum, 10) > 0) {
            var zeroCount = 0
            var IntLen = IntegerNum.length

            for (var i = 0; i < IntLen; i++) {
                var n = IntegerNum.substr(i, 1)
                var p = IntLen - i - 1
                var q = p / 4
                var m = p % 4
                if (n == '0') 
                {
                    zeroCount++
                }
                else
                {
                    if (zeroCount > 0) 
                    {
                        ChineseStr += cnNums[0];
                    }

                    zeroCount = 0
                    ChineseStr += cnNums[parseInt(n)] + cnIntRadice[m]
                }

                if (m === 0 && zeroCount < 4) {
                    ChineseStr += cnIntUnits[q]
                }
            }
            ChineseStr += cnIntLast;
        }

        if(DecimalNum != '') {
            var decLen = DecimalNum.length

            for (var i = 0; i < decLen; i++) {
                var n = DecimalNum.substr(i, 1)

                if (n != '0') 
                {
                    ChineseStr += cnNums[Number(n)] + cnDecUnits[i];
                }
            }
        }

        if(ChineseStr == '') 
        {
            ChineseStr += cnNums[0] + cnIntLast + cnInteger
        } 
        else if(DecimalNum == '') 
        {
            ChineseStr += cnInteger
        }
        
        return Symbol + ChineseStr
    }

    return {
        getPackListData : getPackListData ,
        getPaymentInvData : getPaymentInvData,
        getTransportInvData : getTransportInvData,
        getCreditInvoiceDate : getCreditInvoiceDate
    };

})

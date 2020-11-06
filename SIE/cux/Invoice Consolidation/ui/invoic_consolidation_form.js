/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 */
define([
    'N/currency',
    'N/cache',
    'N/search',
    'N/record',
    'N/redirect',
    'N/ui/serverWidget',
    '../config/searchFilters',
    '../config/searchColumns',
    '../config/entryFieldsConfig',
    '../config/searchFiltersConfig',
    '../config/sublistFieldsConfig',
    '../../helper/wrapper_runtime',
    '../../helper/operation_assistant'
], function(
    currency , cache , search , record , redirect , ui , searchFilters , searchColumns , entryFields , searchFiltersConfig , 
    sublistFieldsConfig , runtime , operation
) {
    var FIELDPR = 'custpage_'
    var defaultPageSize = 200

    function onRequest(context) {
        var request = context.request
        var response= context.response
        var params  = request.parameters

        if(request.method === 'GET')
        {
            searchPage(params,response)
        }
        if(request.method === 'POST')
        {
            invoiceOrdCreate(params,request,response)
        }
    }

    function searchPage(params,response){
        var currentUser = runtime.getCurrentUser()
        var form = ui.createForm({
            title : 'Invoice execution platform/发票执行平台'
        })

        form.addFieldGroup({
            id : 'custpage_filters',
            label : 'Query criteria/查询条件'
        })

        form.addFieldGroup({
            id : 'custpage_entry',
            label : 'Input area/输入区'
        })

        form.addFieldGroup({
            id : 'custpage_lists',
            label : '计划信息'
        })

        form.clientScriptModulePath = '../cs/invoic_consolidation_cs'

        if(!params.subsidiary) params.subsidiary = currentUser.subsidiary

        if(params.subsidiary)
        {
            params.customerSelectOptions = getCustomerSelectOption(params.subsidiary)
        }

        if(!params.action)
        {
            addButtons(form,params)
            addSublist(form,params)
            addFields(form,entryFields.entryFields(params))
            addFields(form,searchFiltersConfig.searchFields(params))
        }

        if(params.action === 'search')
        {
            addButtons(form,params)
            addSublist(form,params,bindSublists)
            addFields(form,entryFields.entryFields(params))
            addFields(form,searchFiltersConfig.searchFields(params))
        }

        response.writePage(form)
    }

    function addButtons(form){
        form.addSubmitButton({
            label : 'Invoice/开票'
        })

        form.addButton({
            id : 'custpage_search',
            label : 'Search/查询',
            functionName : 'searchLines'
        })
    }

    function getCustomerSelectOption(subsidiary){
        var customerSelectOption = [{
            text : ' ',
            value : -1
        }]

        search.create({
            type : 'customer',
            filters : [
                ['msesubsidiary.internalid' , 'anyof' , [subsidiary]]
            ],
            columns : [
                'internalid',
                'entityid',
                'companyname'
            ]
        }).run().each(function(res){
            customerSelectOption.push({
                value : res.getValue('internalid'),
                text : res.getValue('entityid') + '&nbsp;&nbsp;' + res.getValue('companyname')
            })
            return true
        })

        return customerSelectOption
    }

    function addFields(target,data){
        data.map(function(item){
            var field = target.addField({
                id : FIELDPR + item.id,
                label : item.label,
                type : item.type,
                source : item.source,
                container : item.container
            })

            if(item.selectOptions)
            {
                for(var i = 0 ; i < item.selectOptions.length; i ++)
                {
                    field.addSelectOption({
                        text : item.selectOptions[i].text,
                        value : item.selectOptions[i].value
                    })
                }
            }
            
            if(item.displayType)     
            field.updateDisplayType({
                displayType : item.displayType
            })
            
            if(item.layoutType)
            field.updateLayoutType({
                layoutType : item.layoutType
            })
            
            if(item.breakType)
            field.updateBreakType({
                breakType : item.breakType
            })
            
            if(item.displaySize)
            field.updateDisplaySize(item.displaySize)
            
            if(item.isMandatory === true)
            field.isMandatory = item.isMandatory 

            if(item.defaultValue)
            field.defaultValue = item.defaultValue 
        })
    }

    function addPageFields(params){
        var currPageField = params.form.addField({
            id : FIELDPR + 'currpage',
            label : 'Currpage/当前页',
            type : 'select',
            container : params.target
        })

        var pageSizeField = params.form.addField({
            id : FIELDPR + 'pagesize',
            label : 'PageSize/每页数据条数',
            type : 'select',
            container : params.target
        })

        for(var i = 1 ; i <= params.pageCount; i ++){
            currPageField.addSelectOption({
                text : i + '/' + params.pageCount,
                value : i,
                isSelected : i === +params.currPage
            })
        }

        for(var j = 1000 ; j >= 200 ; j -= 200){
            pageSizeField.addSelectOption({
                text : j,
                value : j,
                isSelected : j === +params.pageSize
            })
        }
    }

    var custbody_loading_port = ''

    function invoiceOrdCreate(params,request,response){
        try{
            createInvoice(
                params,
                getPlanListIds(
                    params,
                    response,
                    extendChechInfo(
                        getCheckInfo(params.custpage_cacheid),
                        request
                    )
                )
            )

            redirect.toSuitelet({
                scriptId : 'customscript_invoice_consolidation',
                deploymentId : 'customdeploy_invoice_consolidation',
                parameters : {
                    action : 'search',
                    status : 'sucess',
                    pagetype : 'create',
                    pageSize : params.custpage_pagesize,
                    receipt : params.custpage_receipt,  
                    invoice : params.custpage_invoice,
                    currency : params.custpage_currency,
                    emoloyee : params.custpage_emoloyee,
                    printype : params.custpage_printype,
                    customer : params.custpage_customer,
                    trandate : params.custpage_trandate,
                    outputype : params.custpage_outputype,
                    dateclose : params.custpage_dateclose,
                    samegoods : params.custpage_samegoods,
                    boxnumber : params.custpage_boxnumber,
                    salesorder : params.custpage_salesorder,
                    subsidiary : params.custpage_subsidiary,
                    invoicentry : params.custpage_invoicentry
                }
            })
        }
        catch(e)
        {
            throw e.message
        }
    }

    function setAmountInfo(newRecord,amountInfo,disCountTotal){
        newRecord.setValue({
            fieldId : 'custrecord_ci_duplicate_top',
            value : disCountTotal
        })

        newRecord.setValue({
            fieldId : 'custrecord_buhanshuiheji_hebing',
            value : amountInfo.amount
        })

        newRecord.setValue({
            fieldId : 'custrecord_ci_shui',
            value : amountInfo.taxamount
        })

        newRecord.setValue({
            fieldId : 'custrecord_ci_zongjine',
            value : amountInfo.total
        })
    }

    function batchInvoice(params,lines){
        var amountInfo = {
            amount : 0,
            taxamount : 0,
            total : 0
        }

        for(var key in lines)
        {
            var newRecord = record.create({
                type : 'customrecord_hebingfapiao',
                isDynamic : true
            })

            var disCountTotal = setLineItemValue(amountInfo,newRecord,key,lines[key])
            setHeadFieldsValue(newRecord,params,[key],'batch')
            setAmountInfo(newRecord,amountInfo,disCountTotal)
            newRecord.save()
        }
    }

    function combineInvoice(params,lines){
        var amountInfo = {
            amount : 0,
            taxamount : 0,
            total : 0
        }
        var orderDetails = new Array()
        var newRecord = record.create({
            type : 'customrecord_hebingfapiao',
            isDynamic : true
        })
        var disCountTotal = 0

        for(var key in lines)
        {
            orderDetails.push(key)
            disCountTotal = operation.add(disCountTotal , setLineItemValue(amountInfo,newRecord,key,lines[key]))
        }

        setAmountInfo(newRecord,amountInfo,disCountTotal)
        setHeadFieldsValue(newRecord,params,orderDetails,'combine')
       
        newRecord.save()
    }

    function createInvoice(params,lines){
        var outputype = params.custpage_outputype

        if(outputype === '1')
        {
            batchInvoice(params,lines)
        }
        else if(outputype === '2')
        {
            combineInvoice(params,lines)
        }
    }

    function setLineItemValue(amountInfo,newRecord,orderId,lines){
        var disCountTotal = 0
        var salesRecord = record.load({
            type : 'salesorder',
            id : orderId
        })

        for(var line in lines)
        {
            var index = salesRecord.findSublistLineWithValue({
                sublistId : 'item',
                fieldId : 'line',
                value : line
            })

            if(lines[line].invnumber){
                if(!newRecord.getValue({fieldId : 'custrecord_ci_fapiaohao'}))
                newRecord.setValue({
                    fieldId : 'custrecord_ci_fapiaohao',
                    value : lines[line].invnumber
                })
            }

            if(index > -1)
            {
                var rate = salesRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'rate',
                    line : index
                })
                var taxcode = salesRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'taxcode',
                    line : index
                }) || 0
                if(taxcode)
                taxcode = search.lookupFields({
                    type : 'salestaxitem',
                    id : taxcode,
                    columns : ['rate']
                }).rate
                var scale = operation.div(
                    lines[line].quantity || 0,
                    salesRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'quantity',
                        line : index
                    })
                ).toFixed(2)
                var noDisCountPrice = salesRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_unit_notax',
                    line : index
                })
                var amount = operation.mul(rate , lines[line].quantity)
                var taxamount = operation.mul(amount , parseFloat(taxcode) / 100)
                var total = operation.add(amount , taxamount)
                var noDisCountTotal = operation.mul(operation.mul(noDisCountPrice,lines[line].quantity) , 1 + parseFloat(taxcode) / 100) 
                var hasDiscountTotal = operation.mul(operation.mul(rate,lines[line].quantity) , 1 + parseFloat(taxcode) / 100) 
                var LineDisCountTotal = operation.sub(noDisCountTotal || 0,hasDiscountTotal || 0)

                disCountTotal = operation.add(disCountTotal,LineDisCountTotal)
                amountInfo.total = operation.add(amountInfo.total , total)
                amountInfo.amount = operation.add(amountInfo.amount , amount)
                amountInfo.taxamount = operation.add(amountInfo.taxamount , taxamount)

                newRecord.selectNewLine({
                    sublistId : 'recmachcustrecord185'
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_danjubianhao',
                    value : orderId
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_zheqiandanjia',
                    value : noDisCountPrice
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_total_before_discount',
                    value : operation.mul(noDisCountPrice || 0,lines[line].quantity)
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_buhanshuiheji',
                    value : operation.mul(rate,lines[line].quantity)
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_zongjine_',
                    value : hasDiscountTotal
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_total_amount_before_discou',
                    value : noDisCountTotal
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : '	custrecord_ci_duplicate_top',
                    value : LineDisCountTotal
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_hanghao',
                    value : salesRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'custcol_line',
                        line : index
                    })
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_wuliaobianma',
                    value : salesRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'item',
                        line : index
                    })
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_danjia',
                    value : rate
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_planum',
                    value : lines[line].planum
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_shuliang',
                    value : lines[line].quantity
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_buhanshuiheji',
                    value : amount
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_shuie',
                    value : taxamount
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_zongjine_',
                    value : total
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_jiaoqi',
                    value : salesRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'expectedshipdate',
                        line : index
                    })
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_xiangshu',
                    value : Math.ceil(operation.mul(
                        salesRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_boxes_numbers',
                            line : index
                        }) || 0,
                        scale) 
                    )
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_kehudingdanhao',
                    value : salesRecord.getValue({                     
                        fieldId : 'custbody_wip_customer_order_number'
                    })
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_kehudingdanhanghao',
                    value : salesRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'custcol_row_id',
                        line : index
                    })
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_kehuwuliaobianma',
                    value : salesRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'custcol_cgoodscode',
                        line : index
                    })
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_zongjingzhong',
                    value : operation.mul(
                        salesRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_total_net_weight',
                            line : index
                        }) || 0,
                        scale
                    )
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_zongmaozhong',
                    value : operation.mul(
                        salesRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_total_gross_weight',
                            line : index
                        }) || 0,
                        scale
                    )
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_zonglifangshu',
                    value : operation.mul(
                        salesRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_total_cubic_number',
                            line : index
                        }) || 0,
                        scale
                    )
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_zongtuoshu',
                    value : Math.ceil(operation.mul(
                        salesRecord.getSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_sup_total',
                            line : index
                        }) || 0,
                        scale
                    )) 
                })

                newRecord.setCurrentSublistValue({
                    sublistId : 'recmachcustrecord185',
                    fieldId : 'custrecord_ci_shuilv',
                    value : salesRecord.getSublistValue({
                        sublistId : 'item',
                        fieldId : 'taxcode',
                        line : index
                    })
                })

                newRecord.commitLine({
                    sublistId : 'recmachcustrecord185'
                })
            }
        }

        return disCountTotal
    }

    function getCustomerAdress(customer){
        var customerAdress = new Object()
        var customerRec   = record.load({
            type : 'customer',
            id : customer
        })

        var defaultAdresShipsLine = getDefaultAdresShipsLine(customerRec)
        var defaultAdresBillsLine = getDefaultAdresBillsLine(customerRec)
   
        if(defaultAdresShipsLine || defaultAdresShipsLine === 0)
        {
            var adressRec = customerRec.getSublistSubrecord({
                sublistId : 'addressbook',
                fieldId : 'addressbookaddress',
                line : defaultAdresShipsLine
            })

            if(adressRec)
            {
                customerAdress.ship = {
                    emp : adressRec.getValue({
                        fieldId : 'attention'
                    }),
                    empFax : adressRec.getValue({
                        fieldId : 'custrecord186'
                    }), 
                    empIphone : adressRec.getValue({
                        fieldId : 'addrphone'
                    }),
                    empEmail : adressRec.getValue({
                        fieldId : 'custrecord_addressee_email'
                    }),
                    adress : adressRec.getValue({
                        fieldId : 'addrtext'
                    })
                }
            }
        }

        if(defaultAdresBillsLine || defaultAdresBillsLine === 0)
        {
            var adressRec = customerRec.getSublistSubrecord({
                sublistId : 'addressbook',
                fieldId : 'addressbookaddress',
                line : defaultAdresBillsLine
            })

            if(adressRec)
            {
                customerAdress.bill = {
                    emp : adressRec.getValue({
                        fieldId : 'attention'
                    }),
                    empFax : adressRec.getValue({
                        fieldId : 'custrecord186'
                    }), 
                    empIphone : adressRec.getValue({
                        fieldId : 'addrphone'
                    }),
                    empEmail : adressRec.getValue({
                        fieldId : 'custrecord_addressee_email'
                    }),
                    adress : adressRec.getValue({
                        fieldId : 'addrtext'
                    })
                }
            }
        }

        return customerAdress
    }

    function getDefaultAdresBillsLine(customerRec){
        var lineCount = customerRec.getLineCount({
            sublistId : 'addressbook'
        })

        for(var line = 0 ; line <  lineCount ; line ++)
        {
            var isDefault = customerRec.getSublistValue({
                sublistId : 'addressbook',
                fieldId : 'defaultbilling',
                line : line
            })
    
            if(isDefault === true)
            return line
        }

        return false
    }

    function getDefaultAdresShipsLine(customerRec){
        var lineCount = customerRec.getLineCount({
            sublistId : 'addressbook'
        })

        for(var line = 0 ; line <  lineCount ; line ++)
        {
            var isDefault = customerRec.getSublistValue({
                sublistId : 'addressbook',
                fieldId : 'defaultshipping',
                line : line
            })
    
            if(isDefault === true)
            return line
        }

        return false
    }

    function setHeadFieldsValue(newRecord,params,salesorders,type){
        var customer = params.custpage_customer

        newRecord.setValue({
            fieldId : 'custrecord_port_of_loading',
            value : custbody_loading_port
        })

        newRecord.setValue({
            fieldId : 'custrecord_kehu_fapiao',
            value : customer
        })

        newRecord.setValue({
            fieldId : 'custrecord_huobi_fapiao',
            value : params.custpage_currency
        })

        newRecord.setValue({
            fieldId : 'custrecord_riqi_fapiao',
            value : operation.getDateWithTimeZone({
                date: new Date(),
                timezone: runtime.getUserTimezone()
            })
        })

        newRecord.setValue({
            fieldId : 'custrecord_danjuleixing',
            value : params.custpage_printype
        })

        if(!newRecord.getValue({
            fieldId : 'custrecord_ci_fapiaohao'
        }))
        newRecord.setValue({
            fieldId : 'custrecord_ci_fapiaohao',
            value : params.custpage_invoicentry || params.custpage_invoice
        })

        newRecord.setValue({
            fieldId : 'custrecord_ci_shuchuleix',
            value : params.custpage_outputype
        })

        newRecord.setValue({
            fieldId : 'custrecord_fahuotongzhidanmingxi',
            value : salesorders
        })

        newRecord.setValue({
            fieldId : 'custrecord_ci_zigongsi',
            value : params.custpage_subsidiary
        })   

        newRecord.setValue({
            fieldId : 'custrecord_hebingxiangtonghuoping',
            value : params.custpage_samegoods
        })   

        newRecord.setValue({
            fieldId : 'custrecord_huilv_fapiao',
            value : currency.exchangeRate({
                source: params.custpage_currency,
                target: search.lookupFields({
                    type : 'subsidiary',
                    id : params.custpage_subsidiary,
                    columns : ['currency']
                }).currency[0].value,
                date: operation.getDateWithTimeZone({
                    date: new Date(),
                    timezone: runtime.getUserTimezone()
                })
            })
        })

        setOtherFields(newRecord,salesorders)
        // if(type === 'batch')
        // {
        //     setOtherFields(newRecord,salesorders)
        // }
        // else
        // {
        //     if(params.custpage_internalid)
        //     setOtherFields(newRecord,[params.custpage_internalid])
        // }
    }

    function setOtherFields(newRecord,salesorders){
        var billaddress = true
        var shipaddress = true
        var shipMethods = true

        search.create({
            type : 'salesorder',
            filters : [
                ['mainline' , 'is' , 'T'],'AND',
                ['taxline' , 'is' , 'F'],'AND',
                ['internalid' , 'anyof' , salesorders]
            ],
            columns : [
                'tranid','terms','custbody_loading_port', 'custbody_vperson',
                'custbody_tel', 'custbody_emailss', 'custbody_vtax','shipaddress',
                'custbody_goodsman', 'custbody_phones','custbody_emails', 'custbody_taxs',
                'billaddress','custbody_shipmethod'
            ]
        })
        .run()
        .each(function(res){
            if(billaddress !== true && billaddress != res.getValue('billaddress')){
                billaddress = false
            }else if(billaddress === true){
                billaddress = res.getValue('billaddress')
            }

            if(shipaddress !== true && shipaddress != res.getValue('shipaddress')){
                shipaddress = false
            }else if(shipaddress === true){
                shipaddress = res.getValue('shipaddress')
            }

            if(shipMethods !== true && shipMethods != res.getValue('custbody_shipmethod')){
                shipMethods = false
            }else if(shipMethods === true){
                shipMethods = res.getValue('custbody_shipmethod')
            }
            
            newRecord.setValue({
                fieldId : 'custrecord_port_of_loading',
                value : res.getValue('custbody_loading_port')
            })   
            
            newRecord.setValue({
                fieldId : 'custrecord_payment_term',
                value : res.getText('terms')
            })   

            setSalesAdressInfo(newRecord,res,billaddress,shipaddress,shipMethods)

            return true
        })
    }

    function setSalesAdressInfo(newRecord,res,billaddress,shipaddress,shipMethods){
        if(billaddress)
        newRecord.setValue({
            fieldId : 'custrecord_kehudizhi',
            value : billaddress
        })   

        if(!billaddress)
        newRecord.setValue({
            fieldId : 'custrecord_kehudizhi',
            value : ''
        })   

        if(shipaddress)
        newRecord.setValue({
            fieldId : 'custrecord_shouhuodizhi',
            value : shipaddress
        })   

        if(!shipaddress)
        newRecord.setValue({
            fieldId : 'custrecord_shouhuodizhi',
            value : ''
        })   

        if(shipMethods)
        newRecord.setValue({
            fieldId : 'custrecord_yunshufangshi',
            value : shipMethods
        })   

        if(!shipMethods)
        newRecord.setValue({
            fieldId : 'custrecord_yunshufangshi',
            value : ''
        })   

        newRecord.setValue({
            fieldId : 'custrecord_shoupiaoren',
            value : res.getValue('custbody_vperson')
        })   
        newRecord.setValue({
            fieldId : 'custrecord_shoupiaorendianhua',
            value : res.getValue('custbody_tel')
        })   
        newRecord.setValue({
            fieldId : 'custrecord_shoupiaorenyoujian',
            value : res.getValue('custbody_emailss')
        }) 
        newRecord.setValue({
            fieldId : 'custrecord_shoupiaorenchuanzhen',
            value : res.getValue('custbody_vtax')
        }) 
        newRecord.setValue({
            fieldId : 'custrecord_shouhuoren',
            value : res.getValue('custbody_goodsman')
        }) 
        newRecord.setValue({
            fieldId : 'custrecord_shouhuorendianhua',
            value : res.getValue('custbody_phones')
        }) 
        newRecord.setValue({
            fieldId : 'custrecord_shouhuorenyoujian',
            value : res.getValue('custbody_emails')
        }) 
        newRecord.setValue({
            fieldId : 'custrecord_shouhuorenchuanzhen',
            value : res.getValue('custbody_taxs')
        }) 
    }

    function getPlanListIds(params,response,checkInfo){
        var lines = new Object()

        for(var key in checkInfo)
        {
            for(var line in checkInfo[key])
            {
                if(checkInfo[key][line].checked === 'T')
                {
                    if(!lines[key])                  
                    lines[key] = new Object()
                    
                    lines[key][line] = {
                        planum : checkInfo[key][line].planum ,
                        quantity : checkInfo[key][line].quantity , 
                        invnumber : checkInfo[key][line].invnumber 
                    }
                }
            }
        }

        if(params.custpage_outputype === '2')
        {
            var terms = undefined
            var ports = undefined
    
            search.create({
                type : 'salesorder',
                filters : [
                    ['mainline' , 'is' , 'F'],
                    'AND',
                    ['taxline' , 'is' , 'F'],
                    'AND',
                    ['internalid' , 'anyof' , Object.keys(lines)]
                ],
                columns : [
                    'tranid',
                    'terms',
                    'custbody_loading_port'
                ]
            })
            .run()
            .each(function(res){
                if(!terms)
                terms = res.getValue({
                    name : 'terms'
                })
                
                if(!ports)
                ports = res.getValue({
                    name : 'custbody_loading_port'
                })

                custbody_loading_port = ports
    
                if(terms)
                {
                    var thisTerms = res.getValue({
                        name : 'terms'
                    })
    
                    if(terms !== thisTerms)
                    {
                        response.write({output : '所选项有账期不同，本次检查单号' + res.getValue('tranid')})
                        throw 'out'
                    }
                }
    
                // if(ports)
                // {
                //     var thisPorts = res.getValue({
                //         name : 'custbody_loading_port'
                //     })
  
                //     if(ports !== thisPorts)
                //     {
                //         response.write({output : '所选项有装货港不同，本次检查单号' + res.getValue('tranid')})
                //         throw 'out'
                //     }
                // }
    
                return true
            })
        }

        return lines
    }

    function extendChechInfo(checkInfo,request){
        var lineCount = request.getLineCount({
            group : FIELDPR + 'lines'
        })
   
        for(var i = 0 ; i < lineCount ; i ++)
        {
            var internalid = request.getSublistValue({
                group : FIELDPR + 'lines',
                name : 'custpage_internalid',
                line : i
            })

            if(!checkInfo[internalid])
            checkInfo[internalid] = new Object()

            checkInfo[internalid][request.getSublistValue({
                group : FIELDPR + 'lines',
                name : 'custpage_line',
                line : i
            })] = {
                checked : request.getSublistValue({
                    group : FIELDPR + 'lines',
                    name : 'custpage_check',
                    line : i
                }),
                quantity : request.getSublistValue({
                    group : FIELDPR + 'lines',
                    name : 'custpage_currquantity',
                    line : i
                }),
                invnumber : request.getSublistValue({
                    group : FIELDPR + 'lines',
                    name : 'custpage_invnumber',
                    line : i
                }),
                planum : request.getSublistValue({
                    group : FIELDPR + 'lines',
                    name : 'custpage_planum',
                    line : i
                })
            }  
        }

        return checkInfo
    }

    function getCheckInfo(cacheid){
        var checkCache = undefined

        if(cacheid)
        {
            checkCache = search.lookupFields({
                type : 'customrecord_cache_record',
                id : cacheid,
                columns : ['custrecord_salesorder_cache']
            }).custrecord_salesorder_cache
        }

        return checkCache ? JSON.parse(checkCache) : new Object()
    }

    function bindSublists(params,form,sublist){
        var filters = getSearchFilters(params , runtime.getCurrentUserId() + 'InvConsolidCache' , 'searchFilters')
        var Mysearch= search.create({
            type : 'salesorder',
            filters : filters,
            columns : searchColumns.searchColumns()
        })
        var pageDate = Mysearch.runPaged({pageSize : params.pageSize || defaultPageSize})

        if(pageDate.pageRanges.length > 0)
        {
            var checkInfo = getCheckInfo(params.cacheid)

            addPageFields({
                form : form,
                target : 'custpage_lists',
                pageCount : pageDate.pageRanges.length,
                currPage : params.currPage || 1,
                pageSize : pageDate.pageSize
            })

            pageDate.fetch({
                index : params.currPage ? --params.currPage : 0
            }).data.forEach(function(res,index){
                addSublistLine(sublist,index,res,params,checkInfo,Mysearch.columns)
            })
        }
    }

    function saveCache(cacheName,key,cacheData){
        var myCache = cache.getCache({
            name : cacheName
        })

        myCache.put({
            key   : key,
            value : cacheData,
            ttl   : 9999999
        })
    }

    function getSearchFilters(params,cacheName,key){
        if(params.pagetype === 'create')
        {
            var filters = searchFilters.searchFilters(params)
            removeCheckCache(params.cacheid)
            saveCache(cacheName,key,JSON.stringify(filters))
            return filters
        }

        if(params.pagetype === 'turnpage')
        {
            var myCache = cache.getCache({
                name : cacheName
            })

            return JSON.parse(myCache.get({
                key : key,
                loader : loader(params)
            }))
        }
    }

    function removeCheckCache(cacheid){
        if(cacheid)
        {
            record.submitFields({
                type : 'customrecord_cache_record',
                id : cacheid,
                values : {
                    custrecord_salesorder_cache : ''
                }
            })
        }
    }

    function loader(params){
        return searchFilters.searchFilters(params)
    }

    function addSublistLine(sublist,index,res,params,checkInfo,columns){
        var line = res.getValue('line')
        var quantity = Math.abs(res.getValue('quantity'))
        var quantitybilled = 0
        var quantityshiprecv = 0
        var taxamount = res.getValue(columns[12])
        var netamountnotax = res.getValue(columns[11])
        
        sublist.setSublistValue({
            id : FIELDPR + 'internalid',
            line : index,
            value : res.id
        })

        sublist.setSublistValue({
            id : FIELDPR + 'line',
            line : index,
            value : line
        })

        if(params.printype === '1')
        {
            if(res.getValue('custcol_ci_yunshudaying'))
            quantitybilled = operation.add(0,res.getValue('custcol_ci_yunshudaying')) 
            quantityshiprecv = quantity
        }
        else
        {
            if(res.getValue('quantitybilled'))
            quantitybilled = res.getValue('quantitybilled')
            quantityshiprecv = res.getValue('quantityshiprecv')
        }   

        if(checkInfo[res.id])
        {
            if(checkInfo[res.id][line])
            {
                if(checkInfo[res.id][line].checked === 'T')
                {
                    sublist.setSublistValue({
                        id : FIELDPR + 'check',
                        line : index,
                        value : 'T'
                    })
                }
    
                if(checkInfo[res.id][line].quantity)
                {
                    sublist.setSublistValue({
                        id : FIELDPR + 'currquantity',
                        line : index,
                        value : checkInfo[res.id][line].quantity
                    })

                    sublist.setSublistValue({
                        id : FIELDPR + 'abbprovequantity',
                        line : index,
                        value : checkInfo[res.id][line].quantity
                    })  
                }
            }
            else
            {
                sublist.setSublistValue({
                    id : FIELDPR + 'currquantity',
                    line : index,
                    value : operation.sub(quantityshiprecv , quantitybilled).toString()
                })

                sublist.setSublistValue({
                    id : FIELDPR + 'abbprovequantity',
                    line : index,
                    value : operation.sub(quantityshiprecv , quantitybilled).toString()
                })  
            }
        }
        else
        {
            sublist.setSublistValue({
                id : FIELDPR + 'currquantity',
                line : index,
                value : operation.sub(quantityshiprecv , quantitybilled).toString()
            })

            sublist.setSublistValue({
                id : FIELDPR + 'abbprovequantity',
                line : index,
                value : operation.sub(quantityshiprecv , quantitybilled).toString()
            })  
        }

        sublist.setSublistValue({
            id : FIELDPR + 'quantityshiprecv',
            line : index,
            value : res.getValue('quantityshiprecv')
        }) //已实施
       
        sublist.setSublistValue({
            id : FIELDPR + 'quantitybilled',
            line : index,
            value : quantitybilled.toString()
        }) //已开票

        if(res.getValue('tranid'))
        sublist.setSublistValue({
            id : FIELDPR + 'tranid',
            line : index,
            value : res.getValue('tranid')
        }) //单据编号

        if(res.getValue('custbody_goodsman'))
        sublist.setSublistValue({
            id : FIELDPR + 'consignee',
            line : index,
            value : res.getValue('custbody_goodsman')
        }) //收货人

        if(res.getValue('shipaddress'))
        sublist.setSublistValue({
            id : FIELDPR + 'shipaddress',
            line : index,
            value : res.getValue('shipaddress')
        }) //收获地址

        if(res.getValue('billaddress'))
        sublist.setSublistValue({
            id : FIELDPR + 'billaddress',
            line : index,
            value : res.getValue('billaddress')
        }) //收票地址

        if(res.getValue('trandate'))
        sublist.setSublistValue({
            id : FIELDPR + 'trandate',
            line : index,
            value : res.getValue('trandate')
        }) //创建日期

        if(res.getValue('item'))
        sublist.setSublistValue({
            id : FIELDPR + 'item',
            line : index,
            value : res.getValue('item')
        }) //物料

        if(res.getValue('currency'))
        sublist.setSublistValue({
            id : FIELDPR + 'currency',
            line : index,
            value : res.getText('currency')
        }) //货币

        if(res.getValue('quantity'))
        sublist.setSublistValue({
            id : FIELDPR + 'quantity',
            line : index,
            value : quantity.toString()
        }) //数量

        if(res.getValue(columns[10]))
        sublist.setSublistValue({
            id : FIELDPR + 'rate',
            line : index,
            value : Number(res.getValue(columns[10])) 
        }) //单价

        if(res.getValue(columns[13]))
        sublist.setSublistValue({
            id : FIELDPR + 'planum',
            line : index,
            value : res.getValue(columns[13])
        }) //计划号

        if(netamountnotax)
        sublist.setSublistValue({
            id : FIELDPR + 'netamountnotax',
            line : index,
            value : netamountnotax
        }) //净额

        if(taxamount)
        sublist.setSublistValue({
            id : FIELDPR + 'taxamount',
            line : index,
            value : taxamount
        }) //税额

        sublist.setSublistValue({
            id : FIELDPR + 'grossamount',
            line : index,
            value : operation.add(netamountnotax || 0 ,taxamount || 0)
        }) //总金额

        if(res.getValue('custcol_line'))
        sublist.setSublistValue({
            id : FIELDPR + 'custline',
            line : index,
            value : res.getValue('custcol_line')
        }) //订单行号

        if(res.getValue('custbody_invoice_number'))
        sublist.setSublistValue({
            id : FIELDPR + 'invnumber',
            line : index,
            value : res.getValue('custbody_invoice_number')
        }) //发票号
    }

    function addSublist(form,params,callBackFun){
        var sublist = form.addSublist({
            id : FIELDPR + 'lines',
            label : 'Query results/查询结果',
            tab : 'custpage_lists',
            type : 'list'
        })

        sublist.addMarkAllButtons()
        
        addFields(sublist,sublistFieldsConfig.sublistFields())
  
        if(callBackFun) callBackFun(params,form,sublist)
    }

    return {
        onRequest: onRequest
    }
});

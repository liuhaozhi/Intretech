/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

define(['N/search' , 'N/runtime', 'N/record' , 'N/format' , '../../../lib/common_lib'], 
    (search , runtime , record , format , comLib) => {

        const salestaxitemRate = taxcode => { 
            return parseFloat(search.lookupFields({
                type : 'salestaxitem',
                id : taxcode,
                columns : ['rate']
            }).rate) / 100
        }

        const beforeSubmit = context => {
            const {type , UserEventType} = context

            if(type !== UserEventType.DELETE){
                const newRecord = context.newRecord
                const relInvoice = newRecord.getValue({fieldId : 'custrecord_practical_bill_num'})

                if(!!relInvoice){
                    const newId = newRecord.id

                    search.create({
                        type : newRecord.type,
                        filters : [
                            ['custrecord_practical_bill_num' , 'is' , relInvoice]
                        ]
                    })
                    .run().each(res => {
                        if(newId && res.id != newId){
                            throw '实际发票号重复'
                        }

                        return true
                    })
                }
            }

            if(type === UserEventType.EDIT){
                const newLines  = new Array()
                const newRecord = context.newRecord
                const oldRecord = context.oldRecord
                const isMeg = newRecord.getValue({fieldId : 'custrecord_merger_or_not'})

                if(isMeg === true || isMeg === 'T') return true

                const sublistId = 'recmachcustrecord_check_parent'
    
                let newline = newRecord.getLineCount({
                    sublistId : sublistId
                })
                let oldline = oldRecord.getLineCount({
                    sublistId : sublistId
                })
    
                while(oldline > 0){
                    let isDel = true
                    let oldItemReceipt = oldRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_receipt_nub',
                        line : --oldline
                    })
                    let oldItemReceiptLine = oldRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_id_line',
                        line : oldline
                    })

                    for(let line = 0 ; line < newline ; line ++){ 
                        let newItemReceipt = newRecord.getSublistValue({
                            sublistId : sublistId,
                            fieldId : 'custrecord_receipt_nub',
                            line : line
                        })
                        let newItemReceiptLine = newRecord.getSublistValue({
                            sublistId : sublistId,
                            fieldId : 'custrecord_id_line',
                            line : line
                        })

                        if(newItemReceipt === oldItemReceipt && newItemReceiptLine === oldItemReceiptLine){
                            isDel = !isDel
                            let newQuantity = newRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_check_amount',
                                line : line
                            })
                            let oldQuantity = oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_check_amount',
                                line : oldline
                            })

                            if(newQuantity !== oldQuantity){
                                let taxRate = undefined
        
                                const quantity = comLib.accSub(oldQuantity , newQuantity)
                                const taxcode  = newRecord.getSublistValue({
                                    sublistId : sublistId,
                                    fieldId : 'custrecord_tax_code',
                                    line : line
                                })
                                const checkRate= newRecord.getSublistValue({
                                    sublistId : sublistId,
                                    fieldId : 'custrecord_check_rate',
                                    line : line
                                })
        
                                if(taxcode){
                                    taxRate = salestaxitemRate(taxcode)
                                }
        
                                const amount  = comLib.accMul(quantity || 0 , checkRate || 0)
                                const grossAmt = comLib.accMul(amount , comLib.accAdd(taxRate || 0 , 1))
        
                                newLines.push({
                                    custrecord_type_voucher : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_type_voucher',
                                        line : line
                                    }),
                                    custrecord_receipt_nub : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_receipt_nub',
                                        line : line
                                    }),
                                    custrecord_po_no : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_po_no',
                                        line : line
                                    }),
                                    custrecord_name_item : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_name_item',
                                        line : line
                                    }),
                                    custrecord_check_rate : checkRate,
                                    custrecord_check_amount : quantity,
                                    custrecord_recipt_date : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_recipt_date',
                                        line : line
                                    }),
                                    custrecord_warehouse : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_warehouse',
                                        line : line
                                    }),
                                    custrecord_trasations_currency : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_trasations_currency',
                                        line : line
                                    }),
                                    custrecord_check_grossamount : amount,
                                    custrecord_amount_tax : grossAmt,
                                    custrecord_id_line : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_id_line',
                                        line : line
                                    }),
                                    custrecord_tax_code : taxcode,
                                    custrecord_bill_or_credit : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_bill_or_credit',
                                        line : line
                                    }),
                                    custrecord_real_bill_number : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_real_bill_number',
                                        line : line
                                    }),
                                    custrecord_bill_status : 1,
                                    custrecord_application_date : newRecord.getSublistText({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_application_date',
                                        line : line
                                    }),
                                    custrecord_bill_date : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_bill_date',
                                        line : line
                                    }),
                                    custrecord_state_subsidiary : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_state_subsidiary',
                                        line : line
                                    }),
                                    custrecord_k3_po_number : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_k3_po_number',
                                        line : line
                                    }),
                                    custrecord_k3_poline_number : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_k3_poline_number',
                                        line : line
                                    }),
                                    custrecord_statement_oa_number : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_statement_oa_number',
                                        line : line
                                    }),
                                    custrecord_number_line : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_number_line',
                                        line : line
                                    }),
                                    custrecord_rate_inc_tax : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_rate_inc_tax',
                                        line : line
                                    }),
                                    custrecord_tax_r : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_tax_r',
                                        line : line
                                    }),
                                    custrecord_unit_duizhang : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_unit_duizhang',
                                        line : line
                                    }),
                                    custrecord_item_interid : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_item_interid',
                                        line : line
                                    }),
                                    custrecord_item_mod : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_item_mod',
                                        line : line
                                    }),
                                    custrecord_item_num : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_item_num',
                                        line : line
                                    }),
                                    custrecord_delivery_note : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_delivery_note',
                                        line : line
                                    }),
                                    custrecord_purchase_ty : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_purchase_ty',
                                        line : line
                                    }),
                                    custrecord_internalid_employ : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_internalid_employ',
                                        line : line
                                    }),
                                    custrecord_num_employ : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_num_employ',
                                        line : line
                                    }),
                                    custrecord_name_em : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord_name_em',
                                        line : line
                                    }),
                                    custrecord__ns_poline_number : newRecord.getSublistValue({
                                        sublistId : sublistId,
                                        fieldId : 'custrecord__ns_poline_number',
                                        line : line
                                    })
                                })
                            }
                            break
                        }
                    }

                    if(isDel){
                        newLines.push({
                            custrecord_type_voucher : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_type_voucher',
                                line : oldline
                            }),
                            custrecord_receipt_nub : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_receipt_nub',
                                line : oldline
                            }),
                            custrecord_po_no : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_po_no',
                                line : oldline
                            }),
                            custrecord_name_item : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_name_item',
                                line : oldline
                            }),
                            custrecord_check_rate : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_check_rate',
                                line : oldline
                            }),
                            custrecord_check_amount : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_check_amount',
                                line : oldline
                            }),
                            custrecord_recipt_date : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_recipt_date',
                                line : oldline
                            }),
                            custrecord_warehouse : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_warehouse',
                                line : oldline
                            }),
                            custrecord_trasations_currency : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_trasations_currency',
                                line : oldline
                            }),
                            custrecord_check_grossamount : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_check_grossamount',
                                line : oldline
                            }),
                            custrecord_amount_tax : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_amount_tax',
                                line : oldline
                            }),
                            custrecord_id_line : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_id_line',
                                line : oldline
                            }),
                            custrecord_tax_code :  oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_tax_code',
                                line : oldline
                            }),
                            custrecord_bill_or_credit : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_bill_or_credit',
                                line : oldline
                            }),
                            custrecord_real_bill_number : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_real_bill_number',
                                line : oldline
                            }),
                            custrecord_bill_status : 1,
                            custrecord_application_date : oldRecord.getSublistText({
                                sublistId : sublistId,
                                fieldId : 'custrecord_application_date',
                                line : oldline
                            }),
                            custrecord_bill_date : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_bill_date',
                                line : oldline
                            }),
                            custrecord_state_subsidiary : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_state_subsidiary',
                                line : oldline
                            }),
                            custrecord_k3_po_number : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_k3_po_number',
                                line : oldline
                            }),
                            custrecord_k3_poline_number : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_k3_poline_number',
                                line : oldline
                            }),
                            custrecord_statement_oa_number : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_statement_oa_number',
                                line : oldline
                            }),
                            custrecord_number_line : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_number_line',
                                line : oldline
                            }),
                            custrecord_rate_inc_tax : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_rate_inc_tax',
                                line : oldline
                            }),
                            custrecord_tax_r : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_tax_r',
                                line : oldline
                            }),
                            custrecord_unit_duizhang : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_unit_duizhang',
                                line : oldline
                            }),
                            custrecord_item_interid : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_item_interid',
                                line : oldline
                            }),
                            custrecord_item_mod : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_item_mod',
                                line : oldline
                            }),
                            custrecord_item_num : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_item_num',
                                line : oldline
                            }),
                            custrecord_delivery_note : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_delivery_note',
                                line : oldline
                            }),
                            custrecord_purchase_ty : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_purchase_ty',
                                line : oldline
                            }),
                            custrecord_internalid_employ : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_internalid_employ',
                                line : oldline
                            }),
                            custrecord_num_employ : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_num_employ',
                                line : oldline
                            }),
                            custrecord_name_em : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord_name_em',
                                line : oldline
                            }),
                            custrecord__ns_poline_number : oldRecord.getSublistValue({
                                sublistId : sublistId,
                                fieldId : 'custrecord__ns_poline_number',
                                line : oldline
                            })
                        })
                    }
                }
    
                if(newLines.length){
                    const childRec = record.create({
                        type : newRecord.type,
                        id : newRecord.id,
                    })

                    const DATETIME =  format.format({
                        type: format.Type.DATETIME,
                        value: new Date(),
                        timezone: format.Timezone.ASIA_HONG_KONG
                    }) 
    
                    childRec.setValue({
                        fieldId : 'name',
                        value : newRecord.getValue('custrecord_vendor_name') + '-' + DATETIME
                    })

                    childRec.setValue({
                        fieldId : 'custrecord_vendor_name',
                        value : newRecord.getValue('custrecord_vendor_name')
                    })
    
                    childRec.setValue({
                        fieldId : 'custrecord_period_reconciliation',
                        value : newRecord.getValue('custrecord_period_reconciliation')
                    })
    
                    childRec.setValue({
                        fieldId : 'custrecord_source',
                        value : newRecord.getValue('custrecord_source')
                    })
    
                    childRec.setValue({
                        fieldId : 'custrecord_supplier_intid',
                        value : newRecord.getValue('custrecord_supplier_intid')
                    })
    
                    childRec.setValue({
                        fieldId : 'custrecord_supplier_num',
                        value : newRecord.getValue('custrecord_supplier_num')
                    })
    
                    childRec.setValue({
                        fieldId : 'custrecord_practical_bill_num',
                        value : newRecord.getValue('custrecord_practical_bill_num')
                    })
    
                    newLines.map(function(item , index){
                        Object.keys(item).map(function(id){
                            let value = item[id]

                            if(id === 'custrecord_application_date'){
                                value = format.parse({
                                    type: format.Type.DATETIME,
                                    value: DATETIME,
                                    timezone: format.Timezone.ASIA_HONG_KONG
                                })
                            }
                            
                            childRec.setSublistValue({
                                sublistId : sublistId,
                                fieldId : id,
                                value : value,
                                line : index
                            })
                        })
                    })
    
                    childRec.save({
                        ignoreMandatoryFields: true
                    })
                }
            }
        }

        return { beforeSubmit }
    }
)

/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/record' , 'N/format'], 
    (record , format) => {
        const onRequest = (context) => {
            const {request , response} = context
            const params  = request.parameters

            if(params.action === 'createPo')
            createPo(params,response)
        }
        
        const createPo = (params , response) => {
            const po = new createPoRec(params)
            const msg = po.savePoRec()
            const sucessValue = {custrecord_po_complete : true}

            if(msg.status === 'sucess')
            record.submitFields({
                type : params.fromType,
                id : params.fromId,
                values : {custrecord_poreq_pono : msg.poId , ...sucessValue}
            })

            response.write(JSON.stringify(msg))
        }

        class purchaseRecRequsetInfo{
            constructor(params){
                this.id = params.fromId
                this.type = params.fromType
            }

            purchaseRecord() {
                return record.load({
                    type : this.type,
                    id : this.id
                })
            }

            purchaseHeaderInfo(poReqRecord) {
                return {
                    oano : poReqRecord.getValue('custrecord_potype_oano'),
                    remark : poReqRecord.getValue('custrecord_potype_remark'),
                    personal : poReqRecord.getValue('custrecord_potype_personal'),
                    currency : poReqRecord.getValue('custrecord_potype_currencyhead'),
                    trancpono : poReqRecord.getValue('custrecord_potype_trancpono'),
                    department : poReqRecord.getValue('custrecord_potype_group'),
                    createdate : poReqRecord.getText('custrecord_potype_createdate'),
                    headvendor : poReqRecord.getValue('custrecord_potype_headvendor'),
                    purchasetype : poReqRecord.getValue('custrecord_potype_purchasetype'),
                    intercompany : poReqRecord.getValue('custrecord_potype_intercompany'),
                    unpurchasetype : poReqRecord.getValue('custrecord_potype_unpurchasetype'),
                    applicationperson : poReqRecord.getValue('custrecord_potype_applicationperson'),
                }
            }

            purchaseLineInfo(poReqRecord) {
                const lineInfo = new Array()
                const sublistId = 'recmachcustrecord_potype_purchasetypehead'

                let lineCount = poReqRecord.getLineCount({
                    sublistId : sublistId
                })

                while(lineCount > 0)
                {
                    lineInfo.push({
                        item : poReqRecord.getSublistValue({
                            sublistId : sublistId,
                            fieldId : 'custrecord_potype_itemname',
                            line : --lineCount
                        }),
                        quantity : poReqRecord.getSublistValue({
                            sublistId : sublistId,
                            fieldId : 'custrecord_potype_poquantity',
                            line : lineCount
                        }), 
                        price : poReqRecord.getSublistValue({
                            sublistId : sublistId,
                            fieldId : 'custrecord_potype_price',
                            line : lineCount
                        }),  
                        memo : poReqRecord.getSublistValue({
                            sublistId : sublistId,
                            fieldId : 'custrecord_potype_lineremark',
                            line : lineCount
                        }),   
                        remarkvendor : poReqRecord.getSublistValue({
                            sublistId : sublistId,
                            fieldId : 'custrecord_potype_remarkvendor',
                            line : lineCount
                        }),    
                        projectname : poReqRecord.getSublistValue({
                            sublistId : sublistId,
                            fieldId : 'custrecord_potype_projectname',
                            line : lineCount
                        }),
                        oalineno : poReqRecord.getSublistValue({
                            sublistId : sublistId,
                            fieldId : 'custrecord_potype_oalineno',
                            line : lineCount
                        })
                    })
                }

                return lineInfo
            }

            purchaseRecVaues(){
                const purchaseRec = this.purchaseRecord()

                return {
                    headInfo : this.purchaseHeaderInfo(purchaseRec),
                    lineInfo : this.purchaseLineInfo(purchaseRec)
                }
            }
        }

        class createPoRec extends purchaseRecRequsetInfo{
            constructor(params) {
                super(params)
                this.toType = params.toType
                this.error = {status : 'error'}
                this.sucess= {status : 'sucess', message : 'xixixixi'}
                this.isDynamic = {isDynamic : false}
                this.mandatoryFields = {ignoreMandatoryFields : true}
            }

            savePoRec() {
                let respon
                const poRec  = this.initPoRec()
                const values = this.purchaseRecVaues()

                try
                {
                    this.setPoHeadFieldsValue(poRec , values.headInfo)
                    this.setPoLineFieldsValue(poRec , values.lineInfo)
               
                    let poId = poRec.save({...this.mandatoryFields})

                    respon = {poId : poId , ...this.sucess}
                }
                catch(e)
                {
                    respon = {message : e.message , ...this.error}
                }

                return respon
            }

            initPoRec() {
                return record.create({
                    type : 'purchaseorder',
                    ...this.isDynamic
                })
            }

            setPoHeadFieldsValue (poRec , headInfo){
                poRec.setValue({
                    fieldId : 'customform',
                    value : 175
                })

                if(headInfo.headvendor)
                poRec.setValue({
                    fieldId : 'entity',
                    value : headInfo.headvendor
                })

                if(headInfo.purchasetype)
                poRec.setValue({
                    fieldId : 'custbody_po_list_pur_type',
                    value : headInfo.purchasetype
                })

                if(headInfo.applicationperson)
                poRec.setValue({
                    fieldId : 'custbody_po_buyer',
                    value : headInfo.applicationperson
                })

                if(headInfo.currency)
                poRec.setValue({
                    fieldId : 'currency',
                    value : headInfo.currency
                })

                if(headInfo.personal)
                poRec.setValue({
                    fieldId : 'employee',
                    value : headInfo.personal
                })

                if(headInfo.department)
                poRec.setValue({
                    fieldId : 'department',
                    value : headInfo.department
                })

                if(headInfo.subsidiary)
                poRec.setValue({
                    fieldId : 'subsidiary',
                    value : headInfo.subsidiary
                })

                if(headInfo.createdate)
                poRec.setValue({
                    fieldId : 'trandate',
                    value : format.parse({
                        type : format.Type.DATE,
                        value : headInfo.createdate
                    })
                })

                if(headInfo.unpurchasetype)
                poRec.setValue({
                    fieldId : 'custbodycusttranlsit_po_unmanlist',
                    value : headInfo.unpurchasetype
                })
            }

            setPoLineFieldsValue (poRec , lineInfo){
                lineInfo.map((item , index) => {
                    if(item.item)
                    poRec.setSublistValue({
                        sublistId : 'item',
                        fieldId : 'item',
                        value : item.item,
                        line : index
                    })

                    if(item.quantity)
                    poRec.setSublistValue({
                        sublistId : 'item',
                        fieldId : 'quantity',
                        value : item.quantity,
                        line : index
                    })

                    if(item.price)
                    poRec.setSublistValue({
                        sublistId : 'item',
                        fieldId : 'rate',
                        value : item.price,
                        line : index
                    })

                    if(item.remarkvendor)
                    poRec.setSublistValue({
                        sublistId : 'item',
                        fieldId : 'custcol_pounman_remarkvendor',
                        value : item.remarkvendor,
                        line : index
                    })

                    if(item.oalineno)
                    poRec.setSublistValue({
                        sublistId : 'item',
                        fieldId : 'custcol_oa_num',
                        value : item.oalineno,
                        line : index
                    })

                    if(item.memo)
                    poRec.setSublistValue({
                        sublistId : 'item',
                        fieldId : 'custcol_po_line_memo',
                        value : item.memo,
                        line : index
                    })
                })
            }
        }

        return { onRequest }
    }    
)
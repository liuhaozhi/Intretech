/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([
    'N/record',
    'N/search',
    'N/format',
    'N/runtime'
], 
    (record , search , format , runtime) => {
        const POTYPE = 'purchaseorder'
        const ITEMRECEIPT = 'itemreceipt'
        const RECONCIORTYPE = 'customrecord_reconciliation'
        const matchNumber = str => Number(str.replace(/[^0-9]/gi,'')) 

        const beforeSubmit = context => {
            const {type , UserEventType , newRecord} = context

            if(type === UserEventType.CREATE){
                const aboutOrds = sublistAbtOrds(newRecord)

                setReconciOrs(newRecord , aboutOrds)

                if(newRecord.type !== 'vendorcredit'){
                    volidQuanty(newRecord , aboutOrds)
                    setSublistOaNum(newRecord , aboutOrds)
                    setBillTrimAnduedate(newRecord , aboutOrds)
                }
            }

            return true
        }

        const volidQuanty = (newRecord , aboutOrds) => {
            const purchaOrds = aboutOrds.purchaOrds
            const lineQuanty = aboutOrds.lineQuanty
            const mySearch = search.load({id : 'customsearch_ap_bill'})

            if(purchaOrds.size){
                mySearch.filters = mySearch.filters.concat({
                    name : 'internalid',
                    operator : 'anyof',
                    values : Array.from(purchaOrds)
                })
    
                mySearch.run().each(res => {
                    let line = res.getValue(mySearch.columns[3])
                    let quantity = res.getValue(mySearch.columns[9])

                    if(line){
                        if(lineQuanty[res.id][line]){
                            if(+lineQuanty[res.id][line].quantity > +quantity){
                                throw '对账单号:' + lineQuanty[res.id][line].seatement + ', 已超出可开票数量'
                            }
                        } 
                    }

                    return true
                })
            }
        }

        const setReconciOrs = (newRecord , aboutOrds) => {
            const reconciOrs = aboutOrds.reconciOrs

            log.error('reconciOrs' , Array.from(reconciOrs))

            if(reconciOrs.size){
                reconciOrs.forEach(reconciOr => {
                    if(reconciOr){
                        let invoice = search.lookupFields({
                            type : RECONCIORTYPE,
                            id : reconciOr,
                            columns : ['custrecord_practical_bill_num']
                        }).custrecord_practical_bill_num

                        if(invoice){
                            newRecord.setValue({
                                fieldId : 'tranid',
                                value : invoice
                            })
                        }
                    }
                })
            }
        }

        const setSublistOaNum = (newRecord , aboutOrds) => {
            const purchasoAs = aboutOrds.purchasoAs

            log.error('purchasoAs',purchasoAs)

            Object.keys(purchasoAs).map(PO => {
                Object.keys(purchasoAs[PO]).map(OA => {
                    purchasoAs[PO][OA].map(index => {
                        newRecord.setSublistValue({
                            sublistId : 'item',
                            fieldId : 'custcol_oa_num',
                            line : index,
                            value : OA
                        })
                    })
                })
            })
        }

        const getBillTrem = (purchaOrds , entity , subsidiary) => {
            let terms = new Set()
            
            if(purchaOrds.size){
                purchaOrds.forEach(POID => {
                    if(POID){
                        try{
                            let term = search.lookupFields({
                                type : POTYPE,
                                id : POID,
                                columns : ['terms']
                            }).terms
    
                            if(term[0] && term[0].value){
                                terms.add(term[0].text)
                                terms.add(term[0].value)
                            }
                        }catch(e){
                            throw e.message
                        }
                    }
                })

                if(terms.size > 2){
                    if(entity){
                        terms = getVendorTerm(entity , subsidiary)
                    }else{
                        terms.clear()
                    }
                }
            }else{
                if(entity){
                    terms = getVendorTerm(entity , subsidiary)
                }
            }

            return terms
        }

        const getVendorTerm = (entity , subsidiary) =>{
            const terms = new Set()

            search.create({
                type : 'vendorsubsidiaryrelationship',
                filters : [
                    ['entity' , 'anyof' , [entity]],
                    'AND',
                    ['subsidiary' , 'anyof' , [subsidiary]]
                ],
                columns : ['custrecord_vendor_terms']
            })
            .run()
            .each(function(res){
                terms.add(res.getText('custrecord_vendor_terms'))
                terms.add(res.getValue('custrecord_vendor_terms'))
            })

            return terms
        }

        const getBillDuedate = fulfillIds => {
            const trandates = new Array()

            if(fulfillIds.size){
                fulfillIds.forEach(FULFILLID => {
                    if(FULFILLID){
                        try{
                            let trandate = search.lookupFields({
                                type : ITEMRECEIPT,
                                id : FULFILLID,
                                columns : ['trandate']
                            }).trandate

                            if(trandate){
                                let formatDate = format.parse({
                                    type : format.Type.DATE,
                                    value : trandate
                                })

                                trandates.push(formatDate)
                            }
                        }catch(e){
                            throw e.message
                        }
                    }
                })
            }

            return trandates.sort((curr , next) => (next.valueOf() - curr.valueOf()))
        }

        const getDateWithTimeZone = date => {
            let timezoneDate

            const UsertimeZone = getUserTimezone()
            const timezoneList = {
                Asia_Hong_Kong: 'Asia/Hong_Kong'
            }
            const localTime = date.valueOf()
            const localOffset = date.getTimezoneOffset() * 60000
            const utc = localTime + localOffset
    
            if (UsertimeZone === timezoneList.Asia_Hong_Kong) {
                timezoneDate = new Date(utc + 3600000 * 8)
            } else {
                timezoneDate = date
            }
    
            return timezoneDate
        }

        const getUserTimezone = () => {
            return runtime.getCurrentUser().getPreference('TIMEZONE')
        }

        const addCreatedfromFulfills = (purchaOrds , fulfillIds) => {
            if(purchaOrds.size)
            search.create({
                type : ITEMRECEIPT,
                filters : [
                    ['mainline' , 'is' , 'T'],
                    'AND',
                    ['createdfrom' , 'anyof' , Array.from(purchaOrds)]
                ]
            })
            .run()
            .each(itemreceipt => {
                fulfillIds.add(itemreceipt.id)

                return true
            })
        }

        const setBillTrimAnduedate = (newRecord , aboutOrds) => {
            const purchaOrds = aboutOrds.purchaOrds
            const fulfillIds = aboutOrds.fulfillIds
            const entity = newRecord.getValue({ fieldId : 'entity' })
            const trandate = newRecord.getValue({ fieldId : 'trandate' })
            const subsidiary = newRecord.getValue({ fieldId : 'subsidiary'})

            if(!fulfillIds.size){
                addCreatedfromFulfills(purchaOrds , fulfillIds)
            }

            log.error('purchaOrds' , Array.from(purchaOrds))
            
            const lastDate = getBillDuedate(fulfillIds)
            const billTerms = getBillTrem(purchaOrds , entity , subsidiary)

            if(billTerms.size === 2){
                let values = billTerms.values()
                let termText = values.next().value
                let termValue = values.next().value
                let daysuntilnetdue = termDaysuntilnetdue(termText)
                
                if(lastDate.length && daysuntilnetdue){
                    const formatDate = getDateWithTimeZone(new Date())
                    const dateObj = daysuntilnetdue.type === 'AMS' ? lastDate[0] : trandate

                    formatDate.setFullYear(dateObj.getFullYear())
                
                    if(dateObj.getMonth() !== 1 ){
                        formatDate.setMonth(dateObj.getMonth())
                        formatDate.setDate(30)
                    }else{
                        formatDate.setMonth(dateObj.getMonth() + 1)
                        formatDate.setDate(0)
                    }

                    log.error('formatDate',formatDate.toString())

                    const DateWithTimeZone = new Date(formatDate.valueOf() + daysuntilnetdue.value * 86400000)

                    log.error(formatDate.valueOf(),daysuntilnetdue.value * 86400000)
                    log.error('DateWithTimeZone',DateWithTimeZone.toString())
                    newRecord.setValue({
                        fieldId : 'duedate',
                        value : DateWithTimeZone
                    })
                }
      
                newRecord.setValue({
                    fieldId : 'terms',
                    value : termValue
                })
            }
        }

        const termDaysuntilnetdue = termText => {
            if(!termText) return false
            
            if(termText.includes('AMS')){
                return {
                    type : 'AMS',
                    value : matchNumber(termText)
                }
            }

            if(termText.includes('票到60天（厦门）')){
                return {
                    type : 'XM',
                    value : matchNumber(termText)
                }
            }

            return false
        }

        const sublistAbtOrds = newRecord => {
            let lineCount = newRecord.getLineCount({
                sublistId : 'item'
            })

            const reconciOrs = new Set()
            const purchaOrds = new Set()
            const fulfillIds = new Set()
            const lineQuanty = Object.create(null)
            const purchasoAs = Object.create(null)

            while(lineCount > 0){
                --lineCount
                let seatementText
                let custlinen = newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_line',
                    line : lineCount
                })
                let purchaOrd = newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'orderdoc',
                    line : lineCount
                })
                let fulfillId = newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_warehousing_no',
                    line : lineCount
                })
                let reconciOr = newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_statement_number',
                    line : lineCount
                })
                let quantity  = newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'quantity',
                    line : lineCount
                })
                let seatementId  = newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_statement_number',
                    line : lineCount
                })

                if(seatementId){
                    seatementText = search.lookupFields({
                        type : 'customrecord_reconciliation',
                        id : seatementId,
                        columns : ['name']
                    }).name
                }

                if(fulfillId) fulfillIds.add(fulfillId)
                if(reconciOr) reconciOrs.add(reconciOr)

                if(!lineQuanty[purchaOrd]) lineQuanty[purchaOrd] = Object.create(null)
                if(custlinen) lineQuanty[purchaOrd][custlinen] = {quantity : quantity , seatement : seatementText}

                if(purchaOrd){
                    purchaOrds.add(purchaOrd)

                    if(!purchasoAs[purchaOrd]){
                        let purchoA = search.lookupFields({
                            type : POTYPE,
                            id : purchaOrd,
                            columns : ['custbody_pr_oa_number']
                        }).custbody_pr_oa_number

                        if(purchoA){
                            purchasoAs[purchaOrd] = {[purchoA] : [lineCount]}
                        }
                    }else{
                        Object.keys(purchasoAs[purchaOrd]).map(purchoA => 
                            purchasoAs[purchaOrd][purchoA].push(lineCount)
                        )
                    }
                }
            }

            return {reconciOrs , purchaOrds , fulfillIds , purchasoAs , lineQuanty}
        }

        const afterSubmit = context => {
            const {type , UserEventType} = context

            if(type === UserEventType.CREATE){
                const {newRecord} = context
                const {type , id} = newRecord 
                const currRec = record.load({type : type , id : id , isDynamic : true})
                const terms = currRec.getValue({fieldId : 'terms'})
                const termText = currRec.getText({fieldId : 'terms'})

                if(!termDaysuntilnetdue(termText)){
                    currRec.setValue({fieldId : 'terms', value : ''})
                    currRec.setValue({fieldId : 'terms', value : terms})
    
                    currRec.save({
                        ignoreMandatoryFields : true
                    })
                }
            }
        }

        return { beforeSubmit , afterSubmit}
    }
)

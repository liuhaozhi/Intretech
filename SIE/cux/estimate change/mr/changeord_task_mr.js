/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define([
    'N/search',
    'N/email',
    'N/format',
    'N/record',
    'N/runtime'
], 
    (search , email , format , record , runtime) => {
        const dateFields = [
            'custrecord_c_custcol_dedate',
            'custrecord_c_trandate','custrecord_c_custbody_suspense_date' ,
            'custrecord_c_custcol_unfreezing','custrecord_c_custcol_close_date',
            'custrecord_c_custbody_om_change_date','custrecord_c_expectedshipdate',
            'custrecord_c_custcol_suggest_date','custrecord_c_custcol_freezing_date',
            'custrecord_c_custbody_back_suspense_date','custrecord_c_custbody_closing_date'
        ]

        const x  = [
            'custcol_close_date',
            'custcol_if_frozen',
            'custcol_suppl_company',
            'custcol_salesorder',
            // // 'units',
            'custcol_change_reason',
            'custcol_linedes',
            // 'checked',
            'custcol_plan_number',
            'custcol_row_id',
            'custcol_close_manually',
            'taxcode',
            'custcol_dedate',
            'custcol_freezing_date',
            'custcol_unit_notax',
            'custcol_unfreezing',
            'custcol_close_reason',
            'custcol_whether_bonded',
            'custcol_itemtype',
            // 'department',
            'quantity',
            'custbody_order_status',
            // 'item',
            'custcol_suggest_date',
            // // 'unit',
            'custcol_goodsname'
        ]

        const currSc  = () => runtime.getCurrentScript()

        const chaType = () => currSc().getParameter({
            name : 'custscript_change_type'
        })

        const lineItems = () => currSc().getParameter({
            name : 'custscript_change_items'
        })

        const getInputData = () => {
            const inputLines = lineItems()

            return JSON.parse(inputLines)
        }

        const map = context => {
            const type = chaType()
            const {key , value} = context
            const custOrd  = createCustOrd(type)
            const ordList = setFieldsValue(custOrd , value , key , type)

            try{
                let ordId = ordList.save({
                    ignoreMandatoryFields : true
                })

                if(ordId){
                    const values = fieldsValue(ordList , allFields(custOrd,'custrecord_c_'))

                    if(type === '2') upDateEstimateHead(ordList,custOrd,values)
                    if(type === '1') upDateEstimateLine(ordList,custOrd,ordId,values)
                }
            }
            catch(e)
            {
                log.error('e',e)
            }
        }

        const formatPlanValues = (values , matchFields) => {
            const newValues = new Object()

            Object.keys(values).map(item => {
                if(matchFields.includes(item)) newValues['custrecord_p_' + item] = values[item]
            })

            return newValues
        }

        const upDatePlanRec = values => {
            const custOrd  = createCustOrd('3')     
            const allFieldIds = allFields(custOrd,'custrecord_p_')
            const matchFields = fieldsMatch(allFieldIds)
            const formatValues = formatPlanValues(values , matchFields)
            log.error('values',values)
            search.create({
                type : 'customrecord_shipping_plan',
                filters : [
                    ['custrecord_p_custcol_plan_number' , 'is' , values.custcol_plan_number]
                ]
            })
            .run().each(res => {
                delete formatValues.custrecord_p_quantity

                // if(formatValues.custrecord_p_custcol_suggest_date) {
                //     formatValues.custrecord_p_expectedshipdate = formatValues.custrecord_p_custcol_suggest_date
                // }

                record.submitFields({
                    type : 'customrecord_shipping_plan',
                    id : res.id,
                    values : formatValues
                })

                return true
            })
        }

        const fieldsMatch = allFieldIds => {
            return allFieldIds.map(item => item.replace('custrecord_p_' , ''))
        }

        const upDateEstimateHead = (newRecord , custOrd , values) => {
            const orderId = newRecord.getValue('custrecord_c_salesorder')

            if(values.custbody_changedate){
                values.custbody_ifexport = values.custbody_changedate === '1' ? true : false
            }

            record.submitFields({
                type : 'estimate',
                id : orderId,
                values : values
            })

            upDatePlanRec(values)
            // upDateDepartment(orderId , {department : values.department})
        }

        const upDateDepartment = (orderId , department) => {
            search.create({
                type : 'customrecord_order_changereqline',
                filters : [
                    ['custrecord_c_custcol_salesorder' , 'anyof' , [orderId]]
                ]
            })
            .run().each(res => {
                record.submitFields({
                    type : res.recordType , 
                    id : res.id , 
                    values : department
                })

                return true
            })
        }

        const fieldsValue = (newRecord , fields) => {
            const values = new Object()

            fields.map(item => {
                let orderField = item.replace('custrecord_c_' , '')

                switch(orderField){
                    case 'wip_customer_order' :
                        orderField = 'custbody_wip_customer_order_number'
                    break;
                    case 'custbody_whether_mass' :
                        orderField = 'custbody_whether_mass_production'
                    break;
                    default : 
                    break;
                }
                
                values[orderField] = orderField === 'unit' ? newRecord.getText(item) : newRecord.getValue(item)
            })

            return values
        }

        const upDateEstimateLine = (newRecord,custOrd,ordId,values) => {
            const planNu = newRecord.getValue('custrecord_c_custcol_plan_number')
            const salesId  = newRecord.getValue('custrecord_c_custcol_salesorder')
            const orderOrd = record.load({type : 'estimate' , id : salesId})

            let index = orderOrd.findSublistLineWithValue({
                sublistId : 'item',
                fieldId : 'custcol_plan_number',
                value : planNu
            })

            if(index > -1)
            {
                let lineItem = orderOrd.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'item',
                    line : index
                })

                if(values.item != lineItem){
                    orderOrd.setSublistValue({
                        sublistId : 'item',
                        fieldId : 'item',
                        value : values.item,
                        line : index
                    })
                    //防止切换物料后没有金额单价会报错
                    orderOrd.setSublistValue({
                        sublistId : 'item',
                        fieldId : 'amount',
                        value : 1,
                        line : index
                    })
                }

                delete orderOrd.item

                Object.keys(values).map(item => {
                    if(item !== 'quantity')
                    {
                        if(x.includes(item))
                        orderOrd.setSublistValue({
                            sublistId : 'item',
                            fieldId : item,
                            value : values[item],
                            line : index
                        })

                        if(item === 'taxcode'){

                        }

                        if(item === 'custcol_dedate'){
                            orderOrd.setSublistValue({
                                sublistId : 'item',
                                fieldId : 'expectedshipdate',
                                value : values[item],
                                line : index
                            })
                        }

                        if(item === 'custcol_linedes'){
                            orderOrd.setSublistValue({
                                sublistId : 'item',
                                fieldId : 'description',
                                value : values[item],
                                line : index
                            })
                        }
                    }
                    else
                    {
                        let ordQuantity = orderOrd.getSublistValue({
                            sublistId : 'item',
                            fieldId : item,
                            line : index
                        })

                        if(values[item].toString() !== ordQuantity.toString()){
                            record.submitFields({
                                type : 'customrecord_order_changereqline',
                                id : ordId,
                                values : {
                                    custrecord_amtchange : true,
                                    custrecord_c_quantity : ordQuantity.toString(),
                                    custrecord_p_department : values.department,
                                    custrecord_changeamount : values[item].toString()
                                }
                            })
                        }

                    }
                })

                orderOrd.save({
                    ignoreMandatoryFields : true
                })

                upDatePlanRec(values)
            }
        }

        const allFields = (custOrd,prefix) => {
            const allFieldIds = custOrd.getFields()

            return allFieldIds.filter(item => item.indexOf(prefix) > -1)
        }

        const createCustOrd = type => {
            const options = Object.create(null)

            switch(type){
                case '1':
                    options.type = 'customrecord_order_changereqline'
                break;
                case '2':
                    options.type = 'customrecord_order_changereq'
                break;
                case '3':
                    options.type = 'customrecord_shipping_plan'
                break;
                default :
                break
            }
  
            if(options.type)
            return record.create({...options})
        }

        const setFieldsValue = (ord , value , key , type) => {
            value = JSON.parse(value)

            Object.keys(value).map(item => {
                let fieldId 
                let fieldValue = value[item]

                switch(item){
                    case 'custbody_wip_customer_order_number':
                        fieldId = 'custrecord_c_wip_customer_order'
                    break;
                    case 'custbody_whether_mass_production': 
                        fieldId = 'custrecord_c_custbody_whether_mass'
                    break;
                    default :
                        fieldId = 'custrecord_c_' + item
                    break;
                }

                if(dateFields.indexOf(fieldId) > -1)
                {
                    if(fieldValue) fieldValue = format.parse({type : format.Type.DATE,value : fieldValue})
                }

                if(fieldValue === 'T') fieldValue = true
                if(fieldValue === 'F') fieldValue = false
                if(fieldId === 'custrecord_c_unit'){
                    ord.setText({fieldId : fieldId , text : fieldValue})
                }else{
                    if(fieldValue) ord.setValue({fieldId : fieldId , value : fieldValue})
                }
            })

            if(type === '2') ord.setValue({fieldId : 'custrecord_c_salesorder', value : key})

            return ord
        }

        const summarize = context => {
            const currUser = runtime.getCurrentUser()

            email.send({
                author: currUser.id,
                recipients: currUser.id,
                subject: '批量变更处理提示信息',
                body: '已处理完成'
            })
        }

        return {getInputData , map , summarize}
    }
)


/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([
    'N/record'
],
    (record) => {
        function afterSubmit(context) {
            if(context.type === 'create')
            upDateEstimateHead(context)
        }

        const upDateEstimateHead = context => {
            const {newRecord} = context
            const orderId = newRecord.getValue('custrecord_c_salesorder')
            const values = fieldsValue(newRecord , allFields())

            if(values.custbody_changedate){
                values.custbody_ifexport = values.custbody_changedate === '1' ? true : false
            }

            log.error('values',values)
            record.submitFields({
                type : 'estimate',
                id : orderId,
                values : values
            })
        }

        const allFields = () => {
            const headOrd = record.create({
                type : 'customrecord_order_changereq'
            })

            const allFields = headOrd.getFields()

            return allFields.filter(item => item.indexOf('custrecord_c_') > -1)
        }

        const fieldsValue = (newRecord , fields) => {
            const values = new Object()

            fields.map(item => {
                let orderField = item.replace('custrecord_c_' , '')

                if(orderField === 'wip_customer_order'){
                    orderField = 'custbody_wip_customer_order_number'
                }else if(orderField === 'custbody_whether_mass'){
                    orderField = 'custbody_whether_mass_production'
                }
                
                if(newRecord.getValue(item) || newRecord.getValue(item) === false)
                values[orderField] = newRecord.getValue(item)
            })

            return values
        }

        return {
            afterSubmit: afterSubmit
        }
    }
)

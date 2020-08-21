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
                if(newRecord.getValue(item))
                values[item.replace('custrecord_c_' , '')] = newRecord.getValue(item)
            })

            return values
        }

        return {
            afterSubmit: afterSubmit
        }
    }
)

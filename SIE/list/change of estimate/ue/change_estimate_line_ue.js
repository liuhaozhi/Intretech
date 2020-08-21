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
            upDateEstimateLine(context)
        }

        const upDateEstimateLine = context => {
            const {newRecord} = context
            const orderOrd = record.load({
                type : 'estimate',
                id : newRecord.getValue('custrecord_c_custcol_salesorder')
            })
            const values = fieldsValue(newRecord , allFields())
            const planNu = newRecord.getValue('custrecord_c_custcol_plan_number')

            let index = orderOrd.findSublistLineWithValue({
                sublistId : 'item',
                fieldId : 'custcol_plan_number',
                value : planNu
            })

            if(index > -1)
            {
                Object.keys(values).map(item => {
                    if(item !== 'quantity')
                    {
                        log.error(item,values[item])
                        if(orderOrd.getSublistValue({
                            sublistId : 'item',
                            fieldId : item,
                            line : index
                        }).toString() !== values[item].toString())
                        orderOrd.setSublistValue({
                            sublistId : 'item',
                            fieldId : item,
                            value : values[item].toString(),
                            line : index
                        })
                    }
                    else
                    {
                        let ordQuantity =  orderOrd.getSublistValue({
                            sublistId : 'item',
                            fieldId : item,
                            line : index
                        })

                        if(values[item].toString() !== ordQuantity.toString())
                        record.submitFields({
                            type : 'customrecord_order_changereqline',
                            id : newRecord.id,
                            values : {
                                custrecord_amtchange : true,
                                custrecord_c_quantity : ordQuantity.toString()
                            }
                        })
                    }
                })

                orderOrd.save({
                    ignoreMandatoryFields : true
                })
            }
        }

        const allFields = () => {
            const headOrd = record.create({
                type : 'customrecord_order_changereqline'
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

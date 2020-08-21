/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define([
    'N/email',
    'N/format',
    'N/record',
    'N/runtime'
], 
    (email , format , record , runtime) => {
        const currSc  = () => runtime.getCurrentScript()

        const records = () => currSc().getParameter({
            name : 'custscript_change_items'
        })

        const chaType = () => currSc().getParameter({
            name : 'custscript_change_type'
        })

        const dateFields = [
            'custrecord_c_trandate','custrecord_c_custbody_suspense_date' ,
            'custrecord_c_custcol_unfreezing','custrecord_c_custcol_close_date',
            'custrecord_custbody_om_change_date','custrecord_c_expectedshipdate',
            'custrecord_c_custcol_suggest_date','custrecord_c_custcol_freezing_date',
            'custrecord_c_custbody_back_suspense_date','custrecord_c_custbody_closing_date'
        ]
        
        const getInputData = () => {
            return JSON.parse(records())
        }

        const map = (context) => {
            const type = chaType()
            const {key , value} = context
            const ordList = setFieldsValue(createOrd(type) , value , key , type)

            try{
                ordList.save({
                    ignoreMandatoryFields : true
                })
            }
            catch(e)
            {
                log.error('e',e)
            }
        }

        const createOrd = (type) => {
            return record.create({
                type : type === '2' ? 'customrecord_order_changereq' : 'customrecord_order_changereqline'
            })
        }

        const setFieldsValue = (ord , value , key , type) => {
            value = JSON.parse(value)

            Object.keys(value).map(item => {
                let fieldId = 'custrecord_c_' + item
                let fieldValue = value[item]

                if(dateFields.indexOf(fieldId) > -1)
                {
                    if(fieldValue)
                    fieldValue = format.parse({
                        type : format.Type.DATE,
                        value : fieldValue
                    })
                }

                if(fieldValue === 'T')
                fieldValue = true

                if(fieldValue === 'F')
                fieldValue = false

                if(fieldValue)
                ord.setValue({
                    fieldId : fieldId,
                    value : fieldValue
                })
            })

            if(type === '2')
            ord.setValue({
                fieldId : 'custrecord_c_salesorder',
                value : key
            })

            return ord
        }

        const summarize = (context) => {
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


/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([
    'N/search',
    'N/record'
], 
    (search , record) => {
        function afterSubmit(context) {
            const {type , UserEventType} = context

            if(type === UserEventType.CREATE){
                const {newRecord} = context
                const supplyCompanies = newRecord.getValue({
                    fieldId : 'custrecord_companies'
                })

                if(supplyCompanies){
                    createSupplyRec(newRecord , supplyCompanies)
                }
            }
        }

        const createSupplyRec = (newRecord , supplyCompanies) => {
            const {type} = newRecord
            const supplyRecord   = supplyInit(type)
            const supplyComAbt   = supplyInfo(supplyCompanies)
            const outEmployeeAbt = outEmployeeInfo({newRecord , supplyComAbt})
            const sublistLines   = getSublistLines(newRecord)

            log.error('supplyComAbt',supplyComAbt)
            log.error('sublistLines',sublistLines)
            log.error('outEmployeeAbt',outEmployeeAbt)

            try{
                setHead(supplyRecord , supplyComAbt , outEmployeeAbt)
                setLine(supplyRecord , sublistLines , supplyComAbt , outEmployeeAbt)
    
                supplyRecord.save({
                    ignoreMandatoryFields : true
                })
            }catch(e){
                throw '生成对内客户物料关系时发生错误:' + e.message
            }
        }

        const getSublistLines = newRecord => {
            let sublistId = 'recmachcustrecord_connactid'
            let lineCount = newRecord.getLineCount({
                sublistId : sublistId
            })

            const sublistLines = new Array()

            while(lineCount > 0){
                sublistLines.push({
                    name : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'name',
                        line : --lineCount
                    }),
                    custrecord_custname : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_custname',
                        line : lineCount
                    }),
                    custrecord_high_type : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_high_type',
                        line : lineCount
                    }),
                    custrecord_mid_type : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_mid_type',
                        line : lineCount
                    }),
                    custrecord_small_type : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_small_type',
                        line : lineCount
                    }),
                    custrecord_memo_for_customer_item : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_memo_for_customer_item',
                        line : lineCount
                    }),
                    custrecord_intretech_goods : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_intretech_goods',
                        line : lineCount
                    }),
                    custrecord_intretech_goods_code : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_intretech_goods_code',
                        line : lineCount
                    }),
                    custrecord_intretech_goods_name : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_intretech_goods_name',
                        line : lineCount
                    }),
                    custrecord_configuration : newRecord.getSublistValue({
                        sublistId : sublistId,
                        fieldId : 'custrecord_configuration',
                        line : lineCount
                    })
                })
            }

            return sublistLines
        }

        const setLine = (supplyRec , sublistLines , supplyComAbt , outEmployeeAbt) => {
            const sublistId = 'recmachcustrecord_connactid'
            
            sublistLines.map((item , line) => {
                Object.keys(item).map(fieldId => {
                    if(item[fieldId]){
                        supplyRec.setSublistValue({
                            sublistId : sublistId,
                            fieldId : fieldId,
                            line : line,
                            value : item[fieldId]
                        })
                    }
                })

                if(supplyComAbt.custrecord_intercust[0].value)
                supplyRec.setSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_customer',
                    line : line,
                    value : supplyComAbt.custrecord_intercust[0].value
                })

                if(outEmployeeAbt.inerDepartment)
                supplyRec.setSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_depart',
                    line : line,
                    value : outEmployeeAbt.inerDepartment
                })

                if(supplyComAbt.custrecord_inter_subsidiary[0].value)
                supplyRec.setSublistValue({
                    sublistId : sublistId,
                    fieldId : 'custrecord_company_son',
                    line : line,
                    value : supplyComAbt.custrecord_inter_subsidiary[0].value
                })
            })
        }

        const setHead = (supplyRec , supplyComAbt , outEmployeeAbt) => {
            supplyRec.setValue({
                fieldId : 'custrecord_yewu',
                value : outEmployeeAbt.inerEmployee
            })

            supplyRec.setValue({
                fieldId : 'custrecord_departments',
                value : outEmployeeAbt.inerDepartment
            })

            supplyRec.setValue({
                fieldId : 'custrecord_cust',
                value : supplyComAbt.custrecord_intercust[0].value
            })

            supplyRec.setValue({
                fieldId : 'custrecord_companys',
                value : supplyComAbt.custrecord_inter_subsidiary[0].value
            })
        }

        const outEmployeeInfo = params => {
            const {newRecord , supplyComAbt} = params
            const subsidiary = newRecord.getValue({
                fieldId : 'custrecord_companys'
            })
            const department = newRecord.getValue({
                fieldId : 'custrecord_departments'
            })
            const outEmployee = newRecord.getValue({
                fieldId : 'custrecord_yewu'
            })
            const filters = new Array()
            const employeeInfo = Object.create(null)

            if(subsidiary) filters.push(['custrecord_out_subs' , 'anyof' , [subsidiary]])
            if(department && filters.length) filters.push('AND' , ['custrecord_out_dept' , 'anyof' , [department]])
            if(outEmployee && filters.length) filters.push('AND' , ['custrecord_out_employee' , 'anyof' , [outEmployee]])

            if(supplyComAbt.custrecord_inter_subsidiary){
                if(supplyComAbt.custrecord_inter_subsidiary[0] && supplyComAbt.custrecord_inter_subsidiary[0].value){
                    filters.push('AND' , ['custrecord_inner_subs' , 'anyof' , [supplyComAbt.custrecord_inter_subsidiary[0].value]])
                }
            }

            search.create({
                type : 'customrecord_inter_employee',
                filters : filters,
                columns : ['custrecord_inner_dept' , 'custrecord_inner_employee']
            })
            .run().each(res => {
                const inerDepartment = res.getValue({name : 'custrecord_inner_dept'})
                const inerEmployee   = res.getValue({name : 'custrecord_inner_employee'})

                if(inerEmployee) employeeInfo.inerEmployee = inerEmployee
                if(inerDepartment) employeeInfo.inerDepartment = inerDepartment
            })

            return employeeInfo
        }

        const supplyInit = type => {
            return record.create({
                type : type
            })
        }

        const supplyInfo = supplyCompanies => {
            return search.lookupFields({
                type : 'customrecord_supply_company',
                id : supplyCompanies,
                columns : ['custrecord_intercust' , 'custrecord_inter_subsidiary']
            })
        }

        return { afterSubmit }
    }
)

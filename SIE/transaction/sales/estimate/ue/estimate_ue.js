/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define([
    'N/record',
    'N/search'
], function(record,search) {
    function beforeLoad(context){
        changeTitle(context)

        if(context.type === 'view')
        {
            addPrOrdButton(context)
            addChangeButton(context)
        }
    }

    function addPrOrdButton(context){
        var newRecord = context.newRecord
 
        if(newRecord.getValue('custbody_order_status') === '3' && newRecord.getValue('custbody_cux_mrp_flag') !== true)
        {
            var application = search.create({
                type :  'customrecord_purchase_application',
                filters : [
                    ['custrecord_create_num_pr' , 'anyof' , [context.newRecord.id]]
                ]
            })
            .run().getRange({
                start : 0,
                end   : 1
            })

            if(!application.length){
                context.form.clientScriptModulePath = '../cs/estimate_cs'

                context.form.addButton({
                    id : 'custpage_prord',
                    label : '下推请购平台',
                    functionName : 'addprord('+ context.newRecord.id +')'
                })
            }
        }
    }

    function beforeSubmit(context){ 
        try{
            upDateInterEmployee(context);
        } catch(e) {
            log.debug("设置值错误", e);
        }
    }

    function upDateInterEmployee(context) {
        var currentRecord = context.newRecord;
        if(!currentRecord.getValue("custbody_whether_ntercompany_transact")) { return; }
        var subsidiary = currentRecord.getValue("subsidiary");
        var salesFieldsInfo = search.lookupFields({
            type: "estimate",
            id: currentRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_external", line: 0 }),
            columns: ["subsidiary", "custbody_pc_salesman", "department"]
        });
        search.create({
            type: "customrecord_inter_employee",
            columns: ["custrecord_inner_dept", "custrecord_inner_employee", "custrecord_inner_creator"],
            filters: [
                ["custrecord_out_subs", "anyof", salesFieldsInfo["subsidiary"][0].value],
                "AND",
                ["custrecord_out_dept", "anyof", salesFieldsInfo["department"][0].value],
                "AND",
                ["custrecord_out_employee", "anyof", salesFieldsInfo["custbody_pc_salesman"][0].value],
                "AND",
                ["custrecord_inner_subs", "anyof", subsidiary]
            ]
        }).run().each(function(result) {
            currentRecord.setValue("custbody_pc_salesman", result.getValue(result.columns[1]));
            currentRecord.setValue("custbody_wip_documentmaker", result.getValue(result.columns[2]));
            currentRecord.setValue("department", result.getValue(result.columns[0]));
        });
    }

    function addChangeButton(context){
        context.form.clientScriptModulePath = '../cs/estimate_cs'

        context.form.addButton({
            id : 'custpage_changethis',
            label : '变更',
            functionName : 'changethis('+ context.newRecord.id +')'
        })
    }

    function changeTitle(context){
        var newRecord = context.newRecord
    
        if(newRecord){
            if(newRecord.getValue('custbody_ordtype'))
            {
                var title =  context.newRecord.getText('custbody_ordtype')

                if(title)
                context.form.title = title
            }
        }
    }

    function afterSubmit(context){
        if(context.type === 'create' || (context.type === 'edit' && context.newRecord.getValue('custbody_order_status') === '1'))
        {
            setLineItemSalesId(context.newRecord , context.type)
        }

        if(context.type === 'edit'){
            if(context.newRecord.getValue('custbody_workchange'))
            updatePlan(context.newRecord)
        }
    }

    function updatePlan(newRecord){
        var lineCount = newRecord.getLineCount({
            sublistId : 'item'
        })
        var workInfo = new Object()
 
        for(var i = 0 ; i < lineCount ; i ++){
            var line = newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_line',
                line : i
            })

            workInfo[line] = {
                workDate : newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_completion_date',
                    line : i
                }),
                picking : newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_pick_id',
                    line : i
                }),
                workNum : newRecord.getSublistValue({
                    sublistId : 'item',
                    fieldId : 'custcol_work_order_number',
                    line : i
                })
            }
        }

        updatePlanWorkInfo(workInfo,newRecord.id)
    }

    function updatePlanWorkInfo(workInfo,recordId){
        search.create({
            type : 'customrecord_shipping_plan',
            filters : [
                ['custrecord_p_custcol_salesorder' , 'anyof' , [recordId]]
            ],
            columns : ['custrecord_p_custcol_line']
        })
        .run()
        .each(function(res){
            var line = res.getValue('custrecord_p_custcol_line')
            var item = workInfo[line] ? workInfo[line] : workInfo[line.slice(0,line.indexOf('.'))]

            record.submitFields({
                type : 'customrecord_shipping_plan',
                id : res.id,
                values : {
                    custrecord_p_custcol_completion_date : item.workDate,
                    custrecord_p_custcol_pick_id : item.picking,
                    custrecord_p_custcol_work_order_number : item.workNum
                }
            })

            return true
        })

        record.submitFields({
            type : 'estimate',
            id : recordId,
            values : {
                custbody_workchange : false
            }
        })
    }

    function setSuggestDate(newRecord , i){
        var expectedshipdate = newRecord.getSublistValue({
            sublistId : 'item',
            fieldId : 'expectedshipdate',
            line : i
        })

        if(expectedshipdate)
        {
            var suggestDate = newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_suggest_date',
                line : i
            })

            if(!suggestDate)
            newRecord.setSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_suggest_date',
                line : i,
                value : expectedshipdate
            })
        }
    }

    function setLineNum(newRecord , i , line){
        newRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_line',
            line : i,
            value : line
        })
    }

    function setPlanNum(newRecord , i , newRranid , line){
        newRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_plan_number',
            line : i,
            value : newRranid.replace(/[0]{1,}/,'') + line
        })
    }

    function setLineSalesId(newRecord , i){
        newRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_salesorder',
            line : i,
            value : newRecord.id
        })
    }

    function setLineItemSalesId(recordInfo , type){
        var newRecord = record.load({
            type : recordInfo.type,
            id : recordInfo.id
        })
        var itemCount = newRecord.getLineCount({
            sublistId : 'item'
        })
        var newRranid = type === 'create' ? updateSalesOrderCode(newRecord) : newRecord.getValue('tranid')

        newRecord.setValue({
            fieldId : 'custbody_change',
            value : '/app/common/custom/custrecordentry.nl?rectype=677' + '&estimate=' + recordInfo.id
        })

        for(var i = 0 ; i < itemCount ; i ++)
        {
            var line = (i + 1).toString()
            setLineMemo(newRecord , i)
            setSuggestDate(newRecord , i)
            setLineNum(newRecord , i , line)
            setPlanNum(newRecord , i , newRranid , line)
            setLineSalesId(newRecord , i)
            setK3OrderNum(newRecord , i)
            setLineCustomerOrd(newRecord , i)
        }

        newRecord.save({
            ignoreMandatoryFields : true
        })
    }

    function setK3OrderNum(newRecord , i){
        newRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_k3order_num',
            line : i,
            value : newRecord.getValue('custbody_document_old')
        })
    }

    function setLineCustomerOrd(newRecord , i){
        newRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'custcol_custorder',
            line : i,
            value : newRecord.getValue('custbody_wip_customer_order_number')
        })
    }

    function setLineMemo(newRecord , i){
        newRecord.setSublistValue({
            sublistId : 'item',
            fieldId : 'description',
            line : i,
            value : newRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'custcol_linedes',
                line : i
            })
        })
    }

    function updateSalesOrderCode(orderRecord){
        var tranid = orderRecord.getValue({'fieldId': 'tranid'})
        var orderType = orderRecord.getValue({'fieldId' : 'custbody_cust_ordertype'})
        
        if(orderType)
        search.create({
            type : 'customrecord_sales_order_type_code',
            filters : [
                {
                    'name'    : 'custrecord_sales_order_type',
                    'operator': search.Operator.ANYOF,
                    'values'  : [orderType]
                }
            ],
            'columns' : [
                {'name':'custrecord_pre_code'}
            ]
        })
        .run()
        .each(function(res){
            var orderTypeCode = res.getValue({'name':'custrecord_pre_code'})
            tranid = orderTypeCode + tranid

            orderRecord.setValue({
                fieldId : 'tranid',
                value : tranid
            })
        })

        return tranid
    }


    return {
        beforeLoad : beforeLoad,
        beforeSubmit : beforeSubmit,
        afterSubmit: afterSubmit
    }
});

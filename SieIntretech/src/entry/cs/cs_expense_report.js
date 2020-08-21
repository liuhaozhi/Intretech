/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(['N/search'], function (search) {

    function autoSetStandCategory(context) {
        var expenseReport = context.currentRecord;
        var subsidiary = expenseReport.getValue({
            fieldId : 'subsidiary'
        });
        var nreZhiChuType = expenseReport.getCurrentSublistValue({
            sublistId: 'expense',
            fieldId: 'custcol_nre_expense'
        });
        if(!subsidiary){
            alert('请先选择员工和子公司');
            return false;
        }

        expenseReport.setCurrentSublistValue({
            sublistId: 'expense',
            fieldId: 'category',
            value: nreZhiChuType
        });
    }

    function fieldChanged(context) {
        if (context.fieldId == 'custcol_nre_expense') {
            autoSetStandCategory(context);
        } else if (context.fieldId == '') {

        }
        
//------------------YHR添加代码部分------------------------------↓↓↓
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var sublistFieldName = context.fieldId;
        
        if(sublistName == 'expense' && sublistFieldName == 'category'){//当变更《费用》子列表上的《类别》字段时
            
            var theType = currentRecord.getCurrentSublistValue({//获取《类别》
                sublistId: 'expense',
                fieldId: 'category'
            });
            if(!theType) { return; }//费用类别可能不存在
            var categorySearch = search.create({//搜索支付类型（设置》会计》费用类别）
                type: 'expensecategory',
                filters: [{
                    name: 'isinactive',
                    operator: search.Operator.IS,
                    values: false
                },{
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: theType
                }],
                columns:['custrecord_cash_flow_yq']//中国现金流量表项
            });
            var categoryResult = categorySearch.run().getRange({start: 0 ,end: 1});
            var cashFlow = categoryResult[0].getValue({name: 'custrecord_cash_flow_yq'});
            currentRecord.setCurrentSublistValue({//放入中国现金流量表项
                sublistId: 'expense',
                fieldId: 'custcol_cseg_cn_cfi',
                value: cashFlow
            });
        }
        
//-----------------------------------------------------------------↑↑↑
    }

    return {
        // pageInit: pageInit,
        // saveRecord: saveRecord,
        // validateField: validateField,
        fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});
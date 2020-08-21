/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @author YHR 供应商账单付款打印 SL
 */
define(['N/ui/serverWidget','N/log', 'N/render', 'N/file', 'N/search', 'N/record', 'N/runtime'],

function(serverWidget,log,render,file,search,record,runtime) {
	
    function onRequest(context) {
    	
    	var request  = context.request;
        var response = context.response;
        var method = request.method;
        var parameters = request.parameters;
        
        if(method == 'GET'){
        	
        	var billPaymentID = parameters.recordId;//获取供应商账单付款记录ID
            
        	var billPaymentRecord = record.load({
        		type: 'vendorpayment' ,
        		id: billPaymentID
        	});
        	
        	//获取接受订单数据
        	var payeeID = billPaymentRecord.getValue({fieldId: 'entity'});//收款人ID
        	var subsidiary = billPaymentRecord.getValue({fieldId: 'subsidiary'});//子公司
//        	var bankSearch = search.lookupFields({//搜索相关《供应商》记录
//                type: 'vendor' ,
//                id: payeeID ,
//                columns: ['accountnumber',//银行账户
//                          'custentity_open_bank_account']//开户银行账户
//            });
//        	var bankAccount = bankSearch.accountnumber;//银行账户
//        	var openBank = bankSearch.custentity_open_bank_account;//开户银行账户
        	var vendorRecord = record.load({//供应商
                type: 'vendor' ,
                id: payeeID
            });
            var vendorLine = vendorRecord.getLineCount({
                sublistId: 'submachine'
            });
            for(var c = 0 ; c < vendorLine ; c++){
                var lineSubsidiary = vendorRecord.getSublistValue({//行上子公司
                    sublistId: 'submachine',
                    fieldId: 'subsidiary',
                    line: c
                });
                if(subsidiary == lineSubsidiary){
                    var bankAccount = vendorRecord.getSublistValue({//银行账户
                        sublistId: 'submachine',
                        fieldId: 'custrecord_bank_num',
                        line: c
                    });
                    var openBank = vendorRecord.getSublistValue({//开户银行账户
                        sublistId: 'submachine',
                        fieldId: 'custrecord_deposit_bank_vendor',
                        line: c
                    });
                }
                
            }
        	
        	var terms;//账期（付款条件）
        	
        	var lineNumber = billPaymentRecord.getLineCount({
        	    sublistId: 'apply'
        	});
        	
            var dataGroup = [];//创建信息存储
        	
        	for(var a = 0 ; a < lineNumber ; a++){
        	    
                var theType = billPaymentRecord.getSublistValue({//获取类型
                    sublistId: 'apply',
                    fieldId: 'type',
                    line: a
                });
                var judge = billPaymentRecord.getSublistValue({//判断
                    sublistId: 'apply',
                    fieldId: 'apply',
                    line: a
                });
        	    var vendorBillID = billPaymentRecord.getSublistValue({//获取《账单》记录ID
        	        sublistId: 'apply',
        	        fieldId: 'internalid',
        	        line: a
        	    });
        	    
        	    if(vendorBillID && theType == '账单' && judge == true){
        	        
                    var vendorBillRecord = record.load({//账单
                        type: 'vendorbill' ,
                        id: vendorBillID
                    });
                    var theLineNumber = vendorBillRecord.getLineCount({sublistId: 'item'});//账单记录行数
                    terms = vendorBillRecord.getText({fieldId: 'terms'});//账期
                    var poType = vendorBillRecord.getValue({fieldId: 'custbody_po_list_pur_type'});//采购类型
                    var theNumber = vendorBillRecord.getValue({fieldId: 'transactionnumber'});//获取参考编号
                    var totalAmount = vendorBillRecord.getValue({fieldId: 'usertotal'});//不含税合计金额
                    var theMemo = vendorBillRecord.getValue({fieldId: 'memo'});//备注
                    var dateTime = vendorBillRecord.getValue({fieldId: 'trandate'});
                    
                    if(poType == '4'){
                        
                        for(var b = 0 ; b < theLineNumber ; b++){
                            
                            var oneData = {};
                            
                            oneData.type = vendorBillRecord.getText({fieldId: 'custbody_po_list_pur_type'});//采购类型(TEXT)
                            oneData.number = theNumber;//发票号
                            oneData.date = JSON.stringify(dateTime).substring(1,11);//日期
                            oneData.applytype = vendorBillRecord.getText({fieldId: 'custbody_mould_expense_ty'});//模具费用类型(TEXT)
                            oneData.mouldnumber = vendorBillRecord.getSublistValue({//获取《模具编码》
                                sublistId: 'item',
                                fieldId: 'item_display',
                                line: b
                            });
                            oneData.mouldname = vendorBillRecord.getSublistValue({//获取《模具名称》
                                sublistId: 'item',
                                fieldId: 'custcol_goodsname',
                                line: b
                            });
                            oneData.mouldformat = vendorBillRecord.getSublistValue({//获取《模具规格》
                                sublistId: 'item',
                                fieldId: 'custcol_itemtype',
                                line: b
                            });
                            oneData.amount = vendorBillRecord.getSublistValue({//获取《申请付款金额》
                                sublistId: 'item',
                                fieldId: 'grossamt',
                                line: b
                            });
                            oneData.memo = vendorBillRecord.getSublistValue({//获取《备注》
                                sublistId: 'item',
                                fieldId: 'custcol_pr_special_memo',
                                line: b
                            });
                            dataGroup.push(oneData);
                            
                        }
                        
                    }else{
                        
                        var oneData = {};
                        oneData.type = vendorBillRecord.getText({fieldId: 'custbody_po_list_pur_type'});//采购类型(TEXT)
                        oneData.number = theNumber;//发票号
                        oneData.date = JSON.stringify(dateTime).substring(1,11);//日期
                        oneData.applytype = '-';//模具费用类型(TEXT)
                        oneData.mouldnumber = '-';//模具编码
                        oneData.mouldname = '-';//模具名称
                        oneData.mouldformat = '-';//模具规格
                        oneData.amount = totalAmount;//合计金额
                        oneData.memo = theMemo;//备注
                        dataGroup.push(oneData);
                        
                    }
                    
                }
        	    
        	}
        	
        	//创建渲染对象
        	var renderData = {
        	        bankAccount: bankAccount ,
        	        openBank: openBank ,
        	        terms: terms ,
                    items: []
                };
        	var theSum = 0;
        	for(var i = 0 ; i < dataGroup.length ; i++){
        	    theSum = Number(theSum) + Number(dataGroup[i].amount);
        		renderData.items.push({
        		    type: dataGroup[i].type ,
        		    number: dataGroup[i].number ,
        		    date: dataGroup[i].date ,
        		    applytype: dataGroup[i].applytype ,
        		    mouldnumber: dataGroup[i].mouldnumber ,
        		    mouldname: dataGroup[i].mouldname ,
        		    mouldformat: dataGroup[i].mouldformat ,
        		    amount: dataGroup[i].amount ,
        		    memo: dataGroup[i].memo
        		});
        	}
        	renderData.theSum = theSum.toFixed(1);
        	
        	//创建渲染对象
            var renderer = render.create();
            
            //加载模板
            renderer.templateContent = file.load({
                id: '/SuiteScripts/SieIntretech/src/templates/vendorpayment_temp.html'
            }).getContents();
            
            //将系统的record传入模板
            renderer.addRecord({
                templateName: 'record',
                record: billPaymentRecord
            });
            
            //将自定义数据传入模板
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'renderData',
                data: renderData
            });
            
            renderer.renderPdfToResponse(response,true);
        	
        }

    }

    return {
        onRequest: onRequest
    };
    
});

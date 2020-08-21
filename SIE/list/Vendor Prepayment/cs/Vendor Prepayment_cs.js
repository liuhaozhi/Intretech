/**
 * Copyright (c) 1998-2016 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 * 
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 * 
 * (Module description here. Whole header length should not exceed 
 * 100 characters in width. Use another line if needed.)
 * 
 * Version    Date            Author           Remarks
 * 1.00       21 Apr 2016     Roxanne Audette   Initial version.
 * 
 */

/**
* @NApiVersion 2.0
* @NScriptType usereventscript
*/

var HC_MODULES = ['N/error',
                  'N/search',
                  'N/runtime',
                  'N/record',
                  '../Library/NSTS_VP_Lib_ObjectsAndFunctions.js', 
                  '../Library/NSTS_VP_Lib_Constants.js'];

define(HC_MODULES,
    function(error, search, runtime, record, lib){
        function isEditRole(context, stUserRole, stSubsidiary){
            var stAdminRolePref = lib.vpPreference(context, stSubsidiary).adminRoles;
            
            return lib.isAdminUser(context, stSubsidiary);
        }
        function validateEditDelete(context){
            var objFeature  = new lib.feature();
            var recCurrent = context.newRecord;
            var idPurchaseOrder = (context.type == context.UserEventType.CREATE) ? context.request.parameters.idPO : recCurrent.getValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PO);
            if(context.type == context.UserEventType.CREATE){
                idPurchaseOrder = context.request.parameters.idPO;
            }else if (context.type == context.UserEventType.DELETE){
                var objVp = search.lookupFields({
                    type: HC_VP_RECORDS.VP.ID,
                    id: recCurrent.id,
                    columns: [HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PO]
                });
                
                idPurchaseOrder =  lib.getValue(objVp.custrecord_nsts_vp_po);
            }else{
                idPurchaseOrder = recCurrent.getValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PO);
            }

            if(!lib.isEmpty(idPurchaseOrder)){
                var arExcludedVPStatus = [HC_REC_STATUS.FullyBilled, 
                                          HC_REC_STATUS.Closed,
                                          HC_REC_STATUS.Rejected,
                                          HC_REC_STATUS.PendingReceipt];
                var arColFlds = [HC_STATUSREF];
                if(objFeature.bOneWorld)
                    arColFlds.push(HC_SUBSIDIARY);
                
                var objPO = search.lookupFields({
                    type: search.Type.PURCHASE_ORDER,
                    id: idPurchaseOrder,
                    columns: arColFlds
                });
                
                var bIsEditRole = isEditRole(context, runtime.getCurrentUser().role, (objFeature.bOneWorld) ? objPO[HC_SUBSIDIARY][0].value : '');
                var intPrefLength = lib.vpPreference(context, (objFeature.bOneWorld) ? objPO[HC_SUBSIDIARY][0].value : '').length;
                
                if(context.type == context.UserEventType.CREATE && lib.isEmpty(intPrefLength))
                    throw 'Feature not available due to missing Vendor Prepayment Preference setup. Please Contact your Administrator for queries.';
                
                log.debug("VALIDATEEDITDELETE","bIsEditRole:" + bIsEditRole + '|' + objPO[HC_STATUSREF][0].value);
                if(!bIsEditRole){
                    if(context.type != context.UserEventType.DELETE){
                        lib.bFieldIsHidden(context, HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PO_VENDOR, true);
                        lib.bFieldIsHidden(context, HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PO_CURR, true);
                        lib.bFieldIsHidden(context, HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_BILL, true);
                        lib.bFieldIsHidden(context, HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_PAYMENT, true);
                        lib.bFieldIsHidden(context, HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_CREDIT, true);
                        lib.bFieldIsHidden(context, HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_APPLIED_AMOUNT, true);
                    }
                    log.debug("VALIDATEEDITDELETE","objPO[HC_STATUSREF][0].value:" + objPO[HC_STATUSREF][0].value);
                    if(arExcludedVPStatus.indexOf(objPO[HC_STATUSREF][0].value) != -1 && context.type != context.UserEventType.CREATE)
                        throw 'Cannot '+ context.type +' Vendor Prepayment request because Purchase Order is already approved/rejected.';
                }
            }
        }
        
        
        function vpBeforeLoad(context){
            var objFeature  = new lib.feature();
            var stRecordType   = (context.newRecord.type).toLowerCase();
            log.debug("VPBEFORELOAD", "stRecordType:" + stRecordType + " runtime.executionContext:" + runtime.executionContext);
            
            if(stRecordType == HC_VP_RECORDS.VP.ID){
                log.debug("BEFORELOAD EXECUTIONCONTEXT",runtime.executionContext + " runtime.ContextType.CSV_IMPORT:" + runtime.ContextType.CSV_IMPORT);
                if(runtime.executionContext == runtime.ContextType.USEREVENT || runtime.executionContext == runtime.ContextType.SUITELET){
                    return;
                }
                
                log.debug("VPBEFORELOAD", "runtime.executionContext:" + runtime.executionContext);
                if(runtime.executionContext == runtime.ContextType.CSV_IMPORT){
                    throw "CSV import it not allowed in Prepayment record."
                }
                
                var recCurrent = context.newRecord;
                var recCurrentId = context.newRecord.id;
                
                var recPO = null;
                var intPurchaseOrderId
                if(objFeature.bOneWorld && !lib.isEmpty(recCurrentId) && context.type != context.UserEventType.DELETE && context.type != context.UserEventType.CREATE){
                    try{
                        intPurchaseOrderId = (context.type == context.UserEventType.CREATE) ? context.request.parameters.idPO : recCurrent.getValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PO);
                        var objPOFld = record.load({
                            type: search.Type.PURCHASE_ORDER,
                            id: intPurchaseOrderId
                        });
                        recPO = objPOFld;
                        //if(!lib.subsidiaryHasAccess(objPOFld.getText(HC_SUBSIDIARY)))
                         //   throw 'You do not have sufficient permission to view this record';
                    }catch(e){
                        throw 'You do not have sufficient permission to view this record';
                    }
                }
                
                if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.COPY){
                    if(lib.isEmpty(recPO)){
                        intPurchaseOrderId = (context.type == context.UserEventType.CREATE) ? context.request.parameters.idPO : recCurrent.getValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PO);
                        log.debug("VPBEFORELOAD","PENDING : intPurchaseOrderId:" + intPurchaseOrderId);
                        
                        try{ 
                            recPO = record.load({
                                type: search.Type.PURCHASE_ORDER,
                                id: intPurchaseOrderId
                            });
                        }catch(e){
                            log.debug("VPBEFORELOAD",e)
                        }
                    }
                    
                    if(!lib.isEmpty(recPO)){
                        var intPOApprovalStatus = parseInt(recPO.getValue({
                            fieldId: HC_TRANS_RECORDS.COMMON.FIELDS.APPROVALSTATUS
                            })
                        );
                        var intPOStatus = recPO.getValue({
                            fieldId: "status"
                            });
                        
                        bsupervisorapproval   = recPO.getValue('supervisorapproval');

                        intPOStatus = (lib.isEmpty(intPOStatus))?"": intPOStatus.toLowerCase();
                        log.debug("VPBEFORELOAD","PENDING : intPOStatus:" + intPOStatus);
                        
                        if((intPOApprovalStatus != 2 || intPOStatus.indexOf('approved') < 0 || bsupervisorapproval == false || intPOStatus != 'b') && intPOStatus != "closed"){
                            var arrFils     = [];
                            arrFils.push(search.createFilter({
                                name: 'custrecord_nsts_vp_po',
                                operator: 'anyof',
                                values: [intPurchaseOrderId]}));
                            
                            arrFils.push(search.createFilter({
                                name: HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_BILL,
                                operator: 'anyof',
                                values: ["@NONE@"]}));
                            
                            var arrVP = lib.searchGetAllResult({
                                type       : HC_VP_RECORDS.VP.ID,
                                filters    : arrFils,
                            });
                            
                            log.debug("VPBEFORELOAD","PENDING : arrVP:" + arrVP.length)
                            if(arrVP.length >= 20){
                                throw "[PREPAYMENT VALIDATION] Only 20 prepayment records with no prepayment bills can be created for a PO that is not yet approved. Please approve PO to create more prepayments.";
                            }
                    }
                    }else{
                        log.debug("VPBEFORELOAD","NOT PENDING");
                    }
                }
                
                if(context.type == context.UserEventType.CREATE){
                    var idPurchaseOrder = context.request.parameters.idPO;

                    if(!lib.isEmpty(idPurchaseOrder)){
                        validateEditDelete(context);
                        recCurrent.setValue({fieldId: HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PO, value: idPurchaseOrder});
                    }else{
                        throw 'Vendor Prepayment request can only be created through the Purchase Order page.';
                    } 
                }else if(context.type == context.UserEventType.COPY){
                    //throw 'Copying of Vendor Prepayment is not allowed.';
                    var flRemainingAmt  = recCurrent.getValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_TOTAL_PO_PREPAY_AMT);
                    var flPoAmt         = recCurrent.getValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PO_AMOUNT);
                    flRemainingAmt      = parseFloat(flRemainingAmt);
                    flPoAmt      = parseFloat(flPoAmt);
                    flRemainingAmt = flPoAmt - flRemainingAmt;
                    
                    recCurrent.setValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_DETAILS,'');
                    recCurrent.setValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_AMOUNT,'');
                    recCurrent.setValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_BILL_DUEDATE,new Date());
                    
                    recCurrent.setValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_BILL,'');
                    recCurrent.setValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_PAYMENT,'');
                    recCurrent.setValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_CREDIT,'');
                    recCurrent.setValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_REVERSAL_BILL,'');
                    
                    recCurrent.setValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_APPLIED_AMOUNT,'');
                    recCurrent.setValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_UNAPPLIED_AMOUNT,'');
                }else if(context.type == context.UserEventType.EDIT){
                    validateEditDelete(context);
                    
                    context.form.removeButton({id : 'submitas'});
                }
                
                if(!objFeature.bMultiCurrency && context.type != context.UserEventType.DELETE)
                    lib.bFieldIsHidden(context, HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PO_CURR, true);
            }else if(stRecordType == HC_VP_RECORDS.VP_APPLICATION.ID && context.type == context.UserEventType.COPY){
                throw 'Copying of Vendor Prepayment Credit Application is not allowed.';
            }
        }
        
        function vpBeforeSubmit(context){
            if(runtime.executionContext == runtime.ContextType.CSV_IMPORT){
                return "CSV import it not allowed in Prepayment record."
            }
            
            if(context.type == context.UserEventType.DELETE){
                var idRecord = context.newRecord.id;
                validateEditDelete(context);
            }else{
                var idRecord = context.newRecord.id;
                var dateBillDue = context.newRecord.getValue({fieldId: HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_BILL_DUEDATE});
                var idPurchaseOrder = context.newRecord.getValue({fieldId: HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PO});
                
                if(lib.isEmpty(dateBillDue)){
                    context.newRecord.setValue({fieldId: HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_BILL_DUEDATE, value: new Date()});
                }
                
                var stPOAmountValidation = lib.poAmountValidation(idRecord, idPurchaseOrder, 
                        context.newRecord.getValue({fieldId: HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_AMOUNT}));
                
                if(!lib.isEmpty(stPOAmountValidation))
                    throw stPOAmountValidation.join('\n');
            }
        }
        
        function vpAfterSubmit(context){
            if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.CREATE){
                var recNewRec = context.newRecord;
                var stId = recNewRec.id;
                
//新增-------------------------------------------------------------------------------------↓↓↓
                var billID = recNewRec.getValue({ fieldId : 'custrecord_vp_intelid' });//抓取隐藏字段里的预付款账单ID
                var propayNumber = recNewRec.getValue({ fieldId : 'custrecord_nsts_vp_prepay_amount' });//抓取预付款金额
                if(!lib.isEmpty(billID)){
                    var billRecord = record.load({
                        type: 'vendorbill',
                        id: billID
                    });
                    billRecord.setValue({
                        fieldId: 'usertotal',
                        value: Number(propayNumber)
                    });
                    billRecord.setSublistValue({
                        sublistId: 'expense',
                        fieldId: 'amount',
                        line: 0,
                        value: Number(propayNumber)
                    });
                    billRecord.setSublistValue({
                        sublistId: 'expense',
                        fieldId: 'grossamt',
                        line: 0,
                        value: Number(propayNumber)
                    });
                    billRecord.setSublistValue({
                        sublistId: 'expense',
                        fieldId: 'custcol_cseg_cn_cfi',
                        line: 0,
                        value: '4'
                    });
                    
                    billRecord.save();
                }
//-----------------------------------------------------------------------------------------↑↑↑
                
                if (!lib.isEmpty(stId)) {
                    var stPrepayPO = recNewRec.getValue({ fieldId : HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PO });
                    if (!lib.isEmpty(stPrepayPO)) {
                        var objFieldValues = search.lookupFields({
                            type : search.Type.PURCHASE_ORDER,
                            id : stPrepayPO,
                            columns : [HC_TRANS_RECORDS.PURCHASE_ORDER.FIELDS.CUSTBODY_NSTS_VP_PREPAY_VP]
                        });

                        //var arrVal = objFieldValues[HC_TRANS_RECORDS.PURCHASE_ORDER.FIELDS.CUSTBODY_NSTS_VP_PREPAY_VP].value;
                        /*var objVal = objFieldValues[HC_TRANS_RECORDS.PURCHASE_ORDER.FIELDS.CUSTBODY_NSTS_VP_PREPAY_VP][0];
                        var arrVal = objFieldValues[HC_TRANS_RECORDS.PURCHASE_ORDER.FIELDS.CUSTBODY_NSTS_VP_PREPAY_VP].value;
                        if (!lib.isEmpty(objVal)) {
                            arrVal = objFieldValues[HC_TRANS_RECORDS.PURCHASE_ORDER.FIELDS.CUSTBODY_NSTS_VP_PREPAY_VP][0].value;
                        }
                        var arrPOVP = [];
                        if (!lib.isEmpty(arrVal)) {
//                            if (arrVal.indexOf(',') > 0) {
//                                arrPOVP = arrVal.split(',');
//                            } else {
//                                arrPOVP.push(arrVal);
//                            }
                            if(typeof arrVal == "string"){
                                arrPOVP = arrVal.split(',')
                            }
                            
                            for(var i = 0; i< arrPOVP.length; i++){
                                if(lib.isEmpty(arrPOVP[i])){
                                    arrPOVP.splice(i,1);
                                }
                            }
                        }*/
                        var arrVal = objFieldValues[HC_TRANS_RECORDS.PURCHASE_ORDER.FIELDS.CUSTBODY_NSTS_VP_PREPAY_VP];
                        var arrPOVP = [];
                        if (!lib.isEmpty(arrVal)) {
                            for(var i = 0; i< arrVal.length; i++){
                                if(arrPOVP.indexOf(arrVal[i].value) < 0)
                                    arrPOVP.push(arrVal[i].value);
                            }
                        }
                        
                        if (arrPOVP.indexOf(stId) < 0) {
                            arrPOVP.push(stId);
                            var objVal = {};
                            objVal[HC_TRANS_RECORDS.PURCHASE_ORDER.FIELDS.CUSTBODY_NSTS_VP_PREPAY_VP] = arrPOVP;
                            
                            record.submitFields({
                                type : search.Type.PURCHASE_ORDER,
                                id : stPrepayPO,
                                values : objVal
                            });
                            
                            //lib.createVpBill(stPrepayPO,context);
                            //MAP REDUCE:
                            if(context.type == context.UserEventType.EDIT && newRecord.getValue('custrecord_vp_approval') === '3')
                        	lib.executeMapReduceScript({
                        		scriptId: 'customscript_nsts_vp_mr_createtrans',
                        		params	: {
                        			custscript_nsts_vp_transactio_param_json:{
                        				'transToCreate' : 'prepaymentbill',
                                        'recordType'    : recNewRec.type,
                                        'id'            : recNewRec.id,
                                        'idPO'          : stPrepayPO,
                                        'execContext'   : runtime.executionContext
                        			}
                        		}
                        	});
                        }
                    }
                }
            }
        }
        
        return{
            beforeLoad: vpBeforeLoad,
            beforeSubmit: vpBeforeSubmit,
            afterSubmit: vpAfterSubmit
        };
   }
);
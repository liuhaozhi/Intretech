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

var HC_MODULES = ['N/ui/serverWidget', 'N/url',
                  'N/record','N/runtime', 'N/search','N/render','N/format',
                  '../Library/NSTS_VP_Lib_validations.js',
                  '../Library/NSTS_VP_Lib_ObjectsAndFunctions.js',
                  '../Library/NSTS_VP_Lib_Constants.js'];

define(HC_MODULES,
    function(ui, url, record,runtime,search,render,formatter,vpValidations,vpLib){
    
    Object.prototype.extend = function(obj) {
        for (var i in obj) {
           if (obj.hasOwnProperty(i)) {
              this[i] = obj[i];
           }
        }
     };
    
    function isVoided(context){
        var newrecord       = context.newRecord;
        if(vpLib.isEmpty(newrecord))
            return false;
        
        var intVPayStatus   = newrecord.getValue(HC_TRANS_RECORDS.COMMON.FIELDS.STATUS);
        intVPayStatus       = (vpLib.isEmpty(intVPayStatus))?"": intVPayStatus.toLowerCase();
        var jobjVPay        = newrecord.toJSON();
        var stVoid          = '';
        if(!vpLib.isEmpty(jobjVPay)){
            if(!vpLib.isEmpty(jobjVPay.fields)){
                if(!vpLib.isEmpty(jobjVPay.fields[HC_TRANS_RECORDS.COMMON.FIELDS.VOID])){
                    stVoid = jobjVPay.fields[HC_TRANS_RECORDS.COMMON.FIELDS.VOID].toLowerCase();
                }
            }
        }
        stVoid = vpLib.isEmpty(stVoid)? "": stVoid;
       
        if(stVoid.indexOf(HC_TRANS_RECORDS.COMMON.FIELDS.VOID)>=0 ||  intVPayStatus == 'voided'){
            return true;
        }
        
        return false;
    }
    
    function vpBeforeLoad(context){      
        if(vpLib.isEmpty(context)) return
        if(vpLib.isEmpty(context.newRecord)) return;
        if(runtime.executionContext == runtime.ContextType.USEREVENT || runtime.executionContext == runtime.ContextType.SUITELET){
            return;
        }
        
        vpLib.log("beforeLoad","USEREVENTTYPE:" + context.type + " TYPE:" + context.newRecord.type + " ID:" + context.newRecord.id);
        
         var stRecordType   = (context.newRecord.type).toLowerCase();
         var newrecord      = context.newRecord;
         var stRecordId     = context.newRecord.id;
         
         var FUNC_PO_ACTION = function(){
             if(context.type == context.UserEventType.VIEW){
                 var flPOTotal = vpLib.forceParseFloat(newrecord.getValue({ fieldId:'total'}));
                 var flVPTotal = vpLib.forceParseFloat(newrecord.getValue({ fieldId:'custbody_nsts_vp_prepay_total'}));
                 var stStatus = context.newRecord.getValue({fieldId: HC_TRANS_RECORDS.COMMON.FIELDS.ORDERSTATUS});
                 var arNoVPStatus = [HC_ORDER_STATUS.FullyBilled, 
                                     HC_ORDER_STATUS.Closed,
                                     HC_ORDER_STATUS.Rejected];
                 var intPrefLength = vpLib.vpPreference(context).length; 
                 
                 var flTotalBills = 0;
                 var objPOBillSearch = search.create({
                     type       : record.Type.VENDOR_BILL,
                     id         : 'customsearch_nsts_vp_total_po_bills',
                     filters    : [search.createFilter({name: 'appliedtotransaction', operator: 'is', values: stRecordId})],
                     columns    : [search.createColumn({name: 'appliedtotransaction', summary: search.Summary.GROUP}),
                                   search.createColumn({name: 'total', summary: search.Summary.SUM})]
                 }).run().each(function(results){
                     flTotalBills = vpLib.forceParseFloat(results.getValue({name: 'total', summary: search.Summary.SUM}));
                 });
                 
                 log.debug('flPOTotal : flTotalBills', flPOTotal +' : '+ flTotalBills);
                 
                 if(!vpLib.isEmpty(intPrefLength) && arNoVPStatus.indexOf(stStatus) == -1 && flVPTotal < flPOTotal && flTotalBills < flPOTotal){
                     var stNewVPURL = url.resolveRecord({
                         recordType: HC_VP_RECORDS.VP.ID,
                         isEditMode: true,
                         params: {idPO: stRecordId}
                     });
                     
                     context.form.addButton({id: HC_TRANS_RECORDS.PURCHASE_ORDER.FIELDS.CUSTPAGE_NSTS_VP_NEW_VP, 
                                             label: '新建预付款', 
                                             functionName: "var objNewVP = function(){window.open('"+stNewVPURL+"');}"});
                 }
                 
             }else if (context.type == context.UserEventType.COPY) {
                 newrecord.setValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TOTAL,"");
                 newrecord.setValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TOTAL_APPLIED,"");
                 newrecord.setValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TOTAL_UNAPPLIE,"");
                 newrecord.setValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS,false);
                 newrecord.setValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_WITH_PREPAYMENTS,false);
                 newrecord.setValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_VP,"");
             }else if(context.type == context.UserEventType.CREATE){
                 var bIncludeTax = vpLib.vpPreference(context).includeTax;
                 newrecord.setValue('custbody_nsts_vp_include_tax', bIncludeTax);
             }
             
             //Hide Auto Apply Prepayment
             var fldAutoApplyPrepayment = context.form.getField({id: 'custbody_nsts_vp_auto_apply_prepayment'});
             fldAutoApplyPrepayment.updateDisplayType({
                 displayType: ui.FieldDisplayType.HIDDEN
             });
         } //END : FUNC_PO_ACTION
         
         var FUNC_VENDORBILL_ACTION = function(){
             var bIsVPTran  = newrecord.getValue({ fieldId:HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS});
             var stStatusRef  = newrecord.getValue({ fieldId:HC_STATUSREF});
             var bReviewCredit = newrecord.getValue({fieldId: 'custbody_nsts_vp_auto_apply_prepayment'}); //vpLib.vpPreference(context).reviewCredit; 
             if (context.type == context.UserEventType.COPY && bIsVPTran) {
                 throw "Error: copy is not available on this Prepayment type bill.";
             }
             
             if(context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT){
                 var bisAdmin    = vpLib.isAdminUser(context);
                 var bIsVPTrans  =  newrecord.getValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS);
                 if(!bisAdmin && bIsVPTrans){
                     throw Error("[PREPAYMENT ERROR]: Only Vendor Prepayment admin user can edit this Prepayment Bill.");
                 }
                 
                 if(bIsVPTrans && context.type == context.UserEventType.EDIT){
                     var fldOldTotalAmt = context.form.addField({
                         id : 'custpage_nsts_vp_old_total_amount',
                         type : ui.FieldType.CURRENCY,
                         label : 'Old Total Amount'
                     });
                     fldOldTotalAmt.defaultValue = newrecord.getValue({ fieldId:'usertotal'});
                     fldOldTotalAmt.updateDisplayType({displayType : ui.FieldDisplayType.HIDDEN});
                 }
             }
             
             if(context.type == context.UserEventType.VIEW && !bIsVPTran && (stStatusRef == HC_REC_STATUS.PendingApproval || stStatusRef == HC_REC_STATUS.Open)){
                 var intOpenVPPO = vpLib.vpPOCount(newrecord.id, true).countOpenPO;
                 
                 if(!vpLib.isEmpty(intOpenVPPO) && !bReviewCredit){
                     var stVendor = newrecord.getValue({ fieldId:HC_ENTITY});
                     var stApplyVPURL = url.resolveScript({
                     scriptId: SCRIPT_NSTS_VP_APPLY_PREPAYMENTS,
                     deploymentId: DEPLOY_NSTS_VP_APPLY_PREPAYMENTS,
                     params: {loadtype: 'search',
                              idBill: stRecordId,
                              idBillVendor: stVendor}
                     });
                     context.form.addButton({id: HC_TRANS_RECORDS.COMMON.FIELDS.CUSTPAGE_NSTS_VP_APPLY_VP, 
                         label: 'Apply Prepayments',
                         functionName: "var objApplyVP = function(){window.open('"+stApplyVPURL+"');}" 
                     });
                 }
             }else if (context.type == context.UserEventType.COPY) {
                 newrecord.setValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TOTAL,"");
                 newrecord.setValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TOTAL_APPLIED,"");
                 newrecord.setValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TOTAL_UNAPPLIE,"");
                 newrecord.setValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS,false);
                 newrecord.setValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_WITH_PREPAYMENTS,false);
                 newrecord.setValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_VP,"");
             }
             
             if(bIsVPTran){
                 //Hide Auto Apply Prepayment
                 var fldAutoApplyPrepayment = context.form.getField({id: 'custbody_nsts_vp_auto_apply_prepayment'});
                 fldAutoApplyPrepayment.updateDisplayType({
                     displayType: ui.FieldDisplayType.HIDDEN
                 });
             }else if(context.type == context.UserEventType.CREATE){
                 var bAutoApplyPref = vpLib.vpPreference(context).reviewCredit;
                 newrecord.setValue('custbody_nsts_vp_auto_apply_prepayment', bAutoApplyPref);
             }else if(context.type == context.UserEventType.EDIT && stStatusRef != HC_REC_STATUS.PendingApproval &&  stStatusRef != HC_REC_STATUS.Open){
                 //Disable Auto Apply Prepayment
                 var fldAutoApplyPrepayment = context.form.getField({id: 'custbody_nsts_vp_auto_apply_prepayment'});
                 fldAutoApplyPrepayment.updateDisplayType({
                     displayType: ui.FieldDisplayType.DISABLED
                 });
             }
             
             //Hide Include Tax
             var fldIncludeTax = context.form.getField({id: 'custbody_nsts_vp_include_tax'});
             fldIncludeTax.updateDisplayType({
                 displayType: ui.FieldDisplayType.HIDDEN
             });
         }
         
         var FUNC_VENDORPAYMENT_ACTION = function(){
             var bIsVPPOBill = newrecord.getValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PO_BILL);
             
//             var intPaymentBillId = (vpLib.isEmpty(bIsVPPOBill)) ? context.request.parameters.bill : null;
             var intPaymentBillId = null;
             if (vpLib.isEmpty(bIsVPPOBill) &&
                    !vpLib.isEmpty(context) && !vpLib.isEmpty(context.request)) {
                 try {
                     if (context.request.parameters != null && context.request.parameters != undefined) {
                         intPaymentBillId = context.request.parameters.bill;    
                     }
                 } catch (e) {
                     log.debug('beforeLoad', 'No request/parameters');
                 }
             }
             var bIsVPTran  = newrecord.getValue({ fieldId:HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS});

             if(!vpLib.isEmpty(intPaymentBillId))
                 newrecord.setValue({fieldId: HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PO_BILL, value: intPaymentBillId});
             
             if (context.type == context.UserEventType.COPY && bIsVPTran) {
                 throw "Error: copy is not available on this Prepayment type bill payment."
             }else if(context.type == context.UserEventType.EDIT || context.type == context.UserEventType.CREATE){
//                 var stvpPaymentBill = context.request.parameters.bill;
                 var stvpPaymentBill = null;
                 if (!vpLib.isEmpty(context) && !vpLib.isEmpty(context.request)) {
                     try {
                         if (context.request.parameters != null && context.request.parameters != undefined) {
                             stvpPaymentBill = context.request.parameters.bill;
                         }
                     } catch (e) {
                         log.debug('beforeLoad', 'No request/parameters');
                     }
                 }
                 var bReviewCredit = true;//vpLib.vpPreference(context).reviewCredit; 
                 var bPrepayTran = true;
                 if(!vpLib.isEmpty(stvpPaymentBill)){
                     var objBillFld = search.lookupFields({
                         type: search.Type.VENDOR_BILL,
                         id: stvpPaymentBill,
                         columns: [HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS,
                                   'custbody_nsts_vp_auto_apply_prepayment']
                     });
                     bPrepayTran = objBillFld[HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS];
                     bReviewCredit = objBillFld['custbody_nsts_vp_auto_apply_prepayment'];
                 }
                 
                 var fldVPCreditsBills = context.form.addField({
                     id : HC_TRANS_RECORDS.COMMON.FIELDS.CUSTPAGE_NSTS_VP_CREDITS_BILLS,
                     type : ui.FieldType.LONGTEXT,
                     label : 'VP Credits and Bills'
                 });
                 fldVPCreditsBills.defaultValue = (!bPrepayTran) ? vpLib.parseJsonToString(vpLib.searchVPBillsAndCredits(newrecord, bReviewCredit, stvpPaymentBill), '') : '[]';
                 fldVPCreditsBills.updateDisplayType({displayType : ui.FieldDisplayType.HIDDEN});
                 var objApplySublist = context.form.getSublist({
                     id : HC_TRANS_RECORDS.COMMON.SUBLISTFIELD.APPLY
                 });
                 var arrBill = [];
                 if(!vpLib.isEmpty(stvpPaymentBill)){
                     arrBill.push(stvpPaymentBill);
                 }

                 if(!vpLib.isEmpty(arrBill)){
                     var arrFils = [];
                     
                     arrFils.push(search.createFilter({
                         name: 'custrecord_nsts_vp_prepay_bill',
                         operator: 'anyof',
                         values: arrBill}));
                     
                     arrFils.push(search.createFilter({
                         name: 'custbody_nsts_vp_prepay_trans',
                         join: 'custrecord_nsts_vp_prepay_bill',
                         operator: 'is',
                         values: 'T'}));
                     
                     arrFils.push(search.createFilter({
                         name: 'mainline',
                         join: 'custrecord_nsts_vp_prepay_bill',
                         operator: 'is',
                         values: 'T'}));
                     
                     
                     var arrCol = [];
                     arrCol.push(search.createColumn({name: 'custrecordnsts_vp_prepay_reversal_status'}));
                     arrCol.push(search.createColumn({name: 'custrecord_nsts_vp_prepay_reversal_bill'}));
                     var arrResBill = vpLib.searchGetAllResult({
                         isLimitedResult    : true,
                         type       : HC_VP_RECORDS.VP.ID,
                         filters    : arrFils,
                         columns    : arrCol
                     });
                     
                     if(arrResBill.length > 0){ 
                         newrecord.setValue({
                             fieldId: HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS,
                             value: 'T'});
                         
                         var objField_extraJs = context.form.addField({
                             id : 'custpage_vp_extrajs',
                             type : ui.FieldType.INLINEHTML, //INLINEHTML
                             label : 'extraJS'
                         });
                         
                         var func_xtraJs = function diableAppyInputs(){
                             NS.jQuery('form#apply_form input[id^="apply"],form#apply_form [id^="amount"]').each(function(){
                                 NS.jQuery(this).attr('disabled',true);
                             });
                         };
                         
                         var arr_xtraJs_val = [
                              '<script language="JavaScript" type="text/javascript">',
                              func_xtraJs.toString(),
                              'diableAppyInputs()',
                              '</script>'
                        ];
                         
                         objField_extraJs.defaultValue = arr_xtraJs_val.join("\n");
                         if(context.type == context.UserEventType.CREATE){
                             for (var ii = 0; ii < arrResBill.length; ii++){
                                 var rec        = arrResBill[ii];
                                 var intRevesalBillStatus   = rec.getValue("custrecordnsts_vp_prepay_reversal_status");
                                 var intReversalBillId      = rec.getValue("custrecord_nsts_vp_prepay_reversal_bill");
                                 var intReversalBillText    = rec.getText("custrecord_nsts_vp_prepay_reversal_bill");
                                 intRevesalBillStatus       = vpLib.isEmpty(intRevesalBillStatus)? "" : intRevesalBillStatus.toLowerCase();
                                 
                                 if(intRevesalBillStatus.indexOf('paid in full') < 0 && !vpLib.isEmpty(intReversalBillId)){//Bill:Paid In Full
                                     var stRevBillUrl = url.resolveRecord({
                                         recordType: 'vendorbill',
                                         recordId: intReversalBillId,
                                         isEditMode: false
                                     });
                                     var stError = "[VENDOR PREPAYMENT]: Please settle payment on reversal bill ";
                                     stError += "<a href='" + stRevBillUrl + "'>" + intReversalBillText + "</a>"
                                        
                                     throw Error(stError);
                                 }
                             }
                         }
                     }
                 }
             }
             
             if(context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT){
                 var bisAdmin    = vpLib.isAdminUser(context);
                 var bIsVPTrans  =  newrecord.getValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS);
                 if(!bisAdmin && bIsVPTrans){
                     throw Error("[PREPAYMENT ERROR]: Only Vendor Prepayment admin user can edit this Prepayment Payment.");
                 }
             }
         }
         
         var FUNC_VENDORCREDIT_ACTION = function(){
             if(context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT){
                 var bIsVPTrans  =  newrecord.getValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS);
                 var bisAdmin    = vpLib.isAdminUser(context);
                 if(!bisAdmin && bIsVPTrans){
                     throw Error("[PREPAYMENT ERROR]: Only Vendor Prepayment admin user can edit this Prepayment Credit.");
                 }
             }
             
             //Hide Auto Apply Prepayment
             var fldAutoApplyPrepayment = context.form.getField({id: 'custbody_nsts_vp_auto_apply_prepayment'});
             fldAutoApplyPrepayment.updateDisplayType({
                 displayType: ui.FieldDisplayType.HIDDEN
             });
             
             //Hide Include Tax
             var fldIncludeTax = context.form.getField({id: 'custbody_nsts_vp_include_tax'});
             fldIncludeTax.updateDisplayType({
                 displayType: ui.FieldDisplayType.HIDDEN
             });
         }
         
        if(stRecordType == HC_TRANS_RECORDS.COMMON.RECORDS.PURCHASEORDER){
            FUNC_PO_ACTION();
        }else if(stRecordType == HC_TRANS_RECORDS.COMMON.RECORDS.VENDORBILL){
            FUNC_VENDORBILL_ACTION();
        }else if(stRecordType == HC_TRANS_RECORDS.COMMON.RECORDS.VENDORPAYMENT){
            FUNC_VENDORPAYMENT_ACTION();
        }else if(stRecordType == HC_TRANS_RECORDS.COMMON.RECORDS.VENDORCREDIT){
            FUNC_VENDORCREDIT_ACTION();
        }
    }
    
    function vpBeforeSubmit(context){
        if(vpLib.isEmpty(context)) return
        if(vpLib.isEmpty(context.newRecord)) return;        
        vpLib.log("BEFORESUBMIT","USEREVENTTYPE" + context.type + " TYPE" + context.newRecord.type + " ID" + context.newRecord.id);

        var newrecord       = context.newRecord;
        var stRecordType    = (context.newRecord.type).toLowerCase();
        var intRecordId     = context.newRecord.id;

        var FUNC_PO_ACTION = function(){
            if(context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT){
                var bvalidateAmount = vpValidations.validatedTransactionAmount(context);
                var bisAdmin        = vpLib.isAdminUser(context);
                
                var recNRecord  = context.newRecord;
                var recORecord  = context.oldRecord;
                var bisOriginalAmount   = false;
                
                if(!vpLib.isEmpty(recORecord) && !vpLib.isEmpty(recNRecord)){
                    var flNAmount = recNRecord.getValue({fieldId: HC_TRANS_RECORDS.COMMON.FIELDS.TOTAL});
                    var flOAmount = recORecord.getValue({fieldId: HC_TRANS_RECORDS.COMMON.FIELDS.TOTAL});
                    
                    bisOriginalAmount = (flNAmount == flOAmount);
                }else{
                    bisOriginalAmount = true;
                }
                
                log.debug({title:'beforeSubmit',details: "bisAdmin:" + bisAdmin});
                if(bvalidateAmount && !bisAdmin && !bisOriginalAmount){
                    throw Error("[PREPAYMENT VALIDATION ERROR]: Purchase Order amount cannot be lower than the total amount of prepayment records.");
                }
            }
        } //END : FUNC_PO_ACTION
        
        var FUNC_VENDORBILL_ACTION = function(){
            if(context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT){
                var bisAdmin    = vpLib.isAdminUser(context);
                var bIsVPTrans  =  newrecord.getValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS);
                if(!bisAdmin && bIsVPTrans){
                    throw Error("[PREPAYMENT ERROR]: Only Vendor Prepayment admin user can edit this Prepayment Bill.");
                }
            }else if(context.type == context.UserEventType.DELETE){
                var oldrecord = context.oldRecord;
                var bisAdmin    = vpLib.isAdminUser(context);
                var bIsVPTrans  =  oldrecord.getValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS);
                if(!bisAdmin && bIsVPTrans){
                    throw Error("[PREPAYMENT ERROR]: Only Vendor Prepayment admin user can delete this Prepayment Bill.");
                }
            }
        } //END : FUNC_VENDORBILL_ACTION
        
        var FUNC_VENDORPAYMENT_ACTION = function(){
            var bIsVoid = isVoided(context);
                        
            if(bIsVoid){
                var oldrecord = context.oldRecord;
                var bisAdmin    = vpLib.isAdminUser(context);
                var bIsVPTrans  =  oldrecord.getValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS);
                if(!bisAdmin && bIsVPTrans){
                    throw Error("[PREPAYMENT ERROR]: Only Vendor Prepayment admin user can void this Prepayment Payment.");
                }
            }

            if(context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT){
                var bisAdmin    = vpLib.isAdminUser(context);
                var bIsVPTrans  =  newrecord.getValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS);
                if(!bisAdmin && bIsVPTrans){
                    throw Error("[PREPAYMENT ERROR]: Only Vendor Prepayment admin user can edit this Prepayment Payment.");
                }
            }else if(context.type == context.UserEventType.DELETE){
                var oldrecord = context.oldRecord;
                var bisAdmin    = vpLib.isAdminUser(context);
                var bIsVPTrans  =  oldrecord.getValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS);
                if(!bisAdmin && bIsVPTrans){
                    throw Error("[PREPAYMENT ERROR]: Only Vendor Prepayment admin user can delete this Prepayment Payment.");
                }else{
                    //processVoidedDeletedPayment(context);
                    //MAP REDUCE:
                    vpLib.executeMapReduceScript({
                        scriptId: 'customscript_nsts_vp_mr_createtrans',
                        params  : {
                            custscript_nsts_vp_transactio_param_json:{
                                'transToCreate' : 'reversalbill',
                                'recordType'    : context.newRecord.type,
                                'ueType'        : context.type,
                                'id'            : context.newRecord.id,
                                'idPO'          : context.newRecord.id,
                                'execContext'   : runtime.executionContext,
                                'trandate'      : context.newRecord.getValue(HC_TRANDATE),
                                'tranid'        : context.newRecord.getValue(HC_TRANID),
                                'subsidiary'    : context.newRecord.getValue(HC_TRANS_RECORDS.COMMON.FIELDS.SUBSIDIARY),
                                'void'          : isVoided(context)
                            }
                            
                        }
                    });
                }
            }
            
        }//END : FUNC_VENDORPAYMENT_ACTION
        
        var FUNC_VENDORCREDIT_ACTION = function(){
            if(context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT){
                var bisAdmin    = vpLib.isAdminUser(context);
                var bIsVPTrans  =  newrecord.getValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS);
                if(!bisAdmin && bIsVPTrans){
                    throw Error("[PREPAYMENT ERROR]: Only Vendor Prepayment admin user can edit this Prepayment Credit.");
                }
            }else if(context.type == context.UserEventType.DELETE){
                var oldrecord = context.oldRecord;
                var bisAdmin    = vpLib.isAdminUser(context);
                var bIsVPTrans  =  oldrecord.getValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS);
                if(!bisAdmin && bIsVPTrans){
                    throw Error("[PREPAYMENT ERROR]: Only Vendor Prepayment admin user can delete this Prepayment Credit.");
                }
            }
        }//END : FUNC_VENDORPAYMENT_ACTION
        
       if(stRecordType == HC_TRANS_RECORDS.COMMON.RECORDS.PURCHASEORDER){
           FUNC_PO_ACTION();
       }else if(stRecordType == HC_TRANS_RECORDS.COMMON.RECORDS.VENDORBILL && (runtime.executionContext).toLowerCase() != 'mapreduce'){
           FUNC_VENDORBILL_ACTION();
       }else if(stRecordType == HC_TRANS_RECORDS.COMMON.RECORDS.VENDORCREDIT){
           FUNC_VENDORCREDIT_ACTION();
       }else if(stRecordType == HC_TRANS_RECORDS.COMMON.RECORDS.VENDORPAYMENT){
           FUNC_VENDORPAYMENT_ACTION();
       }
       
    }

    function VpPreInfo(purchaseOrders){
        var  reports 

        search.create({
            type : 'purchaseorder',
            filters : [
                ['mainline' , 'is' , 'T'],
                'AND',
                ['tranid' , 'is' , purchaseOrders]
            ],
            columns : ['custbody_ap_vp_total']
        })
        .run()
        .each(function(res){
            reports = {
                vpId : res.id,
                total : res.getValue('custbody_ap_vp_total')
            }
        })

        return reports
    }
       
    function vpAfterSubmit(context){
        vpLib.log("AFTERSUBMIT","USEREVENTTYPE" + context.type + " TYPE" + context.newRecord.type + " ID" + context.newRecord.id + " STATUSREF" + context.newRecord.getValue('status'));

        var stRecordType    = (context.newRecord.type).toLowerCase();
        var newrecord       = context.newRecord;
        var intNewrecordid  = newrecord.id;
        
        var FUNC_VENDORBILL_ACTION = function(){
            if(context.type == context.UserEventType.CREATE){
                var bReviewCredit = newrecord.getValue({fieldId: 'custbody_nsts_vp_auto_apply_prepayment'});//vpLib.vpPreference(context).reviewCredit;
                var intOpenVPPO = vpLib.vpPOCount(newrecord.id, true, true).countOpenPO;
                var purchaseOrders = vpLib.vpPOCount(newrecord.id).purchaseOrders
				log.error('purchaseOrders',purchaseOrders)
                if(purchaseOrders)
                {
                    var vpInfo = VpPreInfo(purchaseOrders)

                    if(vpInfo.total){
                        var VpTotal = vpInfo.total || 0
                        var BillTotal = newrecord.getValue('usertotal')
                        var cTotal = BillTotal > VpTotal ? VpTotal : BillTotal
    
                        var jourId = BindJour({
                            memo :  newrecord.getValue('memo'),
                            dEntity : newrecord.getValue('entity'),
                            trandate :  newrecord.getValue('trandate'),
                            currency :  newrecord.getValue('currency'),
                            usertotal : cTotal,
                            subsidiary : newrecord.getValue('subsidiary'),
                            postingperiod : newrecord.getValue('postingperiod'),
                            debit :newrecord.getValue('account'),
                            credit : search.lookupFields({
                                type : 'customrecord_nsts_vp_pref',
                                id : 1,
                                columns : ['custrecord_nsts_vp_pref_clear_acct']}
                            ).custrecord_nsts_vp_pref_clear_acct[0].value
                        })
        
                        verificatJour(newrecord,jourId,purchaseOrders,newrecord.getValue('account'),vpInfo)
                    }
                }
                 
                record.submitFields({type: record.Type.VENDOR_BILL, id: newrecord.id, 
                    values: {
                             'paymenthold': (!bReviewCredit && !vpLib.isEmpty(intOpenVPPO)) ? true : false, 
                             'custbody_nsts_vp_with_prepayments' : (!vpLib.isEmpty(intOpenVPPO)) ? true : false,
                             'custbody_nsts_vp_purchase_order' : purchaseOrders
                             }, ignoreMandatoryFields: true});
            }else if(context.type == context.UserEventType.EDIT){
                var bIsPrepayTrans = newrecord.getValue({fieldId: 'custbody_nsts_vp_prepay_trans'});
                if(bIsPrepayTrans){
                    var flOldTotalAmt = context.oldRecord.getValue('usertotal');
                    var flTotalAmt    = newrecord.getValue('usertotal');
                    
                    if(flTotalAmt != flOldTotalAmt){
                        var objVP = vpLib.getVendorPrepayment({
                            bill : intNewrecordid
                        });
                        
                        if(!vpLib.isEmpty(objVP.prepaymentId)){
                            record.submitFields({type: 'customrecord_nsts_vp_vendorprepayment', id: objVP.prepaymentId, values: {custrecord_nsts_vp_prepay_amount: flTotalAmt}});
                        }
                    }
                    
                    log.debug('oldnewamt', flTotalAmt + ':' + flOldTotalAmt + ':' + bIsPrepayTrans);
                }
            }
        };

        var FUNC_VENDORPAYMENT_ACTION = function(){
            var objGetFeature = new vpLib.feature();
            var bIsVoid     = isVoided(context);
            
            if(context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT || context.type == context.UserEventType.CREATE || context.type == context.UserEventType.PAYBILLS){
                var intApplyCount       = newrecord.getLineCount(HC_TRANS_RECORDS.COMMON.SUBLIST.APPLY);
                var intPaymentBillId    = newrecord.getValue(HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PO_BILL);
                var intSubsidiary   = newrecord.getValue({fieldId: HC_TRANS_RECORDS.COMMON.FIELDS.SUBSIDIARY});
                
                if(vpLib.isEmpty(intSubsidiary)){
                    if(vpLib.isEmpty(context.oldRecord)){
                        intSubsidiary   = context.oldRecord.getValue({fieldId: HC_TRANS_RECORDS.COMMON.FIELDS.SUBSIDIARY});
                    }
                }
                var objClassification  = new vpLib.getDefaultClassification(intSubsidiary);
                
                var arrBill     = [];
                var arrPayment  = [];
                for(var i=0; i< intApplyCount; i++){
                    
                    var bIsApply    = newrecord.getSublistValue(HC_TRANS_RECORDS.COMMON.SUBLIST.APPLY,'apply',i); //apply
                    var intId       = newrecord.getSublistValue(HC_TRANS_RECORDS.COMMON.SUBLIST.APPLY,'internalid',i); //internalid
                    var flPayment   = newrecord.getSublistValue(HC_TRANS_RECORDS.COMMON.SUBLIST.APPLY,'amount',i); //amount
                    
                    if(bIsApply){
                        if(!vpLib.isEmpty(intId)){
                            arrBill.push(intId);
                            arrPayment.push(flPayment);
                        }
                    }
                }
                
                vpLib.log("AFTERSUBMIT FUNC_VENDORPAYMENT_ACTION","ARRBILL:" + arrBill);
                if(arrBill.length > 0){                    
                    var arrVpBillInfo   = getSelectAppliedRecord(arrBill,arrPayment);
                    var arrFils         = [];
                    var arrCols         = [HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_CREDIT,
                                           HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_AMOUNT];
                    arrFils.push(search.createFilter({
                        name: HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_CREDIT,
                        operator: 'anyof',
                        values: arrBill}));
                    if (objGetFeature.bMultiCurrency) {
                       arrCols.push(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PO_CURR);
                    }
                    
                    var objVPSearch = vpLib.searchGetAllResult({
                        isLimitedResult : true,
                        type       : HC_VP_RECORDS.VP.ID,
                        filters    : arrFils,
                        columns    : arrCols
                    });
                    
                    if(!vpLib.isEmpty(objVPSearch)){
                        var arrVendorPrepayment = [];
                        
                        for(var c = 0; c < objVPSearch.length; c++){
                            var recVP = objVPSearch[c];
                            var idCredit = recVP.getValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_CREDIT);
                            var flCreditPayment = Math.abs(vpLib.forceParseFloat(arrPayment[arrBill.indexOf(idCredit)]));
                            arrVendorPrepayment.push(recVP.id);
                        }
                        
                        if(context.type == context.UserEventType.PAYBILLS)
                            intPaymentBillId = arrBill;
                        
                        if(!vpLib.isEmpty(intPaymentBillId)){
                            var objAppSearch = vpLib.searchGetAllResult({
                                isLimitedResult : true,
                                type       : 'customrecord_nsts_vp_vpcreditapplication',
                                filters    :[search.createFilter({
                                            name: 'custrecord_nsts_vp_apply_prepayment',
                                            operator: 'anyof',
                                            values: arrVendorPrepayment}),
                                            search.createFilter({
                                            name: 'custrecord_nsts_vp_apply_bill',
                                            operator: 'anyof',
                                            values: intPaymentBillId})],
                                columns    : ['custrecord_nsts_vp_apply_credit',
                                              'custrecord_nsts_vp_apply_amount']
                            });
                            if(!vpLib.isEmpty(objAppSearch)){
                                for(var a = 0; a < objAppSearch.length; a++){
                                    var idAppCredit = objAppSearch[a].getValue('custrecord_nsts_vp_apply_credit');
                                    var flApplyAmt = vpLib.forceParseFloat(objAppSearch[a].getValue('custrecord_nsts_vp_apply_amount'));
                                    
                                    if(arrBill.indexOf(idAppCredit) != -1){
                                        var flAppPayment = Math.abs(vpLib.forceParseFloat(arrPayment[arrBill.indexOf(idAppCredit)]));
                                        var arrAppFld = {custrecord_nsts_vp_apply_amount: (flApplyAmt > flAppPayment) ? flApplyAmt - flAppPayment : 0.00 };
                                        record.submitFields({type: 'customrecord_nsts_vp_vpcreditapplication', id: objAppSearch[a].id, values: arrAppFld});
                                    }
                                    
                                }
                                
                            }
                        }
                    }
                    
                    if(!bIsVoid){
                        var arrVP   = vpValidations.getVPviaBill(arrBill);
                        if(!vpLib.isEmpty(arrVP)){
                            var feature         = new vpLib.featureServer();
                            objClassification = vpLib.isEmpty(objClassification)? {}: objClassification;
                            log.debug("AFTERSUBMIT FUNC_VENDORPAYMENT_ACTION CLASSIFICATION",JSON.stringify(objClassification))
                            
                            var intLoc      = newrecord.getValue({fieldId: 'location'});
                            var intClass    = newrecord.getValue({fieldId: 'class'});
                            var intDep      = newrecord.getValue({fieldId: 'department'});
                            
                            var fld_Loc      = newrecord.getField({fieldId: 'location'});
                            var fld_Class    = newrecord.getField({fieldId: 'class'});
                            var fld_Dep      = newrecord.getField({fieldId: 'department'});
                            
                            if((feature.accounting_preferences.bLocmandatory || fld_Loc.isMandatory) && vpLib.isEmpty(intLoc)){
                                intLoc      = objClassification.location;
                            }
                            if((feature.accounting_preferences.bClassmandatory || fld_Class.isMandatory) && vpLib.isEmpty(intClass)){
                                intClass    = objClassification.classification;
                            }
                            if((feature.accounting_preferences.bDeptmandatory || fld_Dep.isMandatory) && vpLib.isEmpty(intDep)){
                                intDep      = objClassification.department;
                            }
                            
                            var vpRef   = vpLib.vpPreference(context);
                            var stForm  = vpRef.vpCreditForm;
                            
                            for (var ii = 0; ii < arrVP.length; ii++){
                                var rec         = arrVP[ii];
                                var vpBillID    = rec.getValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_BILL);
                                var vpVCID      = rec.getValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_CREDIT);
                                
                                if(vpLib.isEmpty(vpVCID)){
                                    var recVC       = record.transform({fromType:HC_TRANS_RECORDS.COMMON.RECORDS.VENDORBILL,fromId: vpBillID, toType: HC_TRANS_RECORDS.COMMON.RECORDS.VENDORCREDIT, isDynamic: true});
                                    var flAmount    = parseFloat(recVC.getValue({fieldId: HC_TRANS_RECORDS.COMMON.FIELDS.TOTAL}));
                                    
                                    if(!vpLib.isEmpty(stForm)){
                                        recVC.setValue({
                                            fieldId : 'customform',
                                            value   : stForm
                                        });
                                    }

                                    recVC.setValue({
                                        fieldId : 'trandate',
                                        value   : newrecord.getValue('trandate')
                                    });

                                    if(feature.accounting_preferences.bLocmandatory){
                                        recVC.setValue({
                                            fieldId : 'location',
                                            value   : intLoc
                                        });
                                    }
                                    if(feature.accounting_preferences.bClassmandatory){
                                        recVC.setValue({
                                            fieldId : 'class',
                                            value   : intClass
                                        });
                                    }
                                    if(feature.accounting_preferences.bDeptmandatory){
                                        recVC.setValue({
                                            fieldId : 'department',
                                            value   : intDep
                                        });
                                    }
                                    
                                    recVC.setValue({
                                        fieldId : 'custbody_nsts_vp_with_prepayments',
                                        value   : true
                                    });

                                    var usertotal = recVC.getValue('usertotal')
                                    var purchaseOrder = recVC.getValue('custbody_nsts_vp_prepay_po')
                                    var vpTotal = search.lookupFields({
                                        type : 'purchaseorder',
                                        id : purchaseOrder,
                                        columns : ['custbody_ap_vp_total']
                                    }).custbody_ap_vp_total || 0
                                    
                                    record.submitFields({
                                        type : 'purchaseorder',
                                        id : purchaseOrder,
                                        values : {
                                            custbody_ap_vp_total : add(vpTotal , usertotal)
                                        }
                                    })

                                    log.error('custbody_ap_vp_total' , vpTotal)
                                    log.error('custbody_ap_vp_totalalll' , add(vpTotal , usertotal))

                                    BindJour({
                                        memo :  recVC.getValue('memo'),
                                        cEntity : recVC.getValue('entity'),
                                        credit : recVC.getValue('account'),
                                        trandate :  recVC.getValue('trandate'),
                                        currency :  recVC.getValue('currency'),
                                        usertotal : usertotal,
                                        subsidiary : recVC.getValue('subsidiary'),
                                        postingperiod : recVC.getValue('postingperiod'),
                                        debit : recVC.getSublistValue({
                                            sublistId : 'expense',
                                            fieldId : 'account',
                                            line : 0
                                        }),
                                        purchaseOrders : purchaseOrder
                                    })

                                    var vcId        = recVC.save({
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    });
                                    
                                    //Make sure that the VP Credit will not be applied to any bill on auto-create
                                    if(!vpLib.isEmpty(vcId)){
                                        var recCredit = record.load({
                                            type: HC_TRANS_RECORDS.COMMON.RECORDS.VENDORCREDIT,
                                            id: vcId
                                        });
                                        recCredit.setValue({fieldId: 'autoapply', value: false});
                                        var intApplyLine = recCredit.getLineCount(HC_TRANS_RECORDS.COMMON.SUBLIST.APPLY);
                                        
                                        for(var a=0; a< intApplyLine; a++){
                                            recCredit.setSublistValue({
                                                sublistId : HC_TRANS_RECORDS.COMMON.SUBLIST.APPLY,
                                                line : a,
                                                fieldId : HC_TRANS_RECORDS.COMMON.SUBLISTFIELD.APPLY,
                                                value : false
                                            });
                                        }
                                        recCredit.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });
                                    }

                                    var arrVPFldVal = {
                                            custrecord_nsts_vp_prepay_credit: vcId
                                    };
                                    
                                    if(parseInt(intNewrecordid)>0){
                                        arrVPFldVal.custrecord_nsts_vp_prepay_payment = intNewrecordid;
                                        arrVPFldVal.custrecord_nsts_vp_payment_id_holder = String(intNewrecordid);
                                    }

                                    var id = record.submitFields({type: HC_VP_RECORDS.VP.ID, id: rec.id, values:arrVPFldVal, options:{enableSourcing: true}});
                                }
                            }
                        } //if(!vpLib.isEmpty(arrVP))...
                        
                        try{
                            var objExecContext = (runtime.executionContext).toLowerCase();
                            var stCurrency = "";
                            if(!vpLib.isEmpty(arrVpBillInfo)){
                                stCurrency = arrVpBillInfo[0].currency;
                            }
                            if(objExecContext != 'mapreduce'){
                               sendNotificationOnPaidWithTemplate(context,{
                                 currency    : stCurrency,
                                 data        : arrVpBillInfo
                               });
                            }
                            
                        }catch(e){
                            log.debug("SENDNOTIFICATIONONPAIDWITHTEMPLATE ERROR",e);
                        }
                    }
                }//if(arrBill.length > 0)
                
            }
            
            //processVoidedDeletedPayment(context,objClassification);
            //MAP REDUCE:
            var intRecSubsidiary   = newrecord.getValue({fieldId: HC_TRANS_RECORDS.COMMON.FIELDS.SUBSIDIARY});
            var intRecTranId = newrecord.getValue({fieldId: HC_TRANID});
                
            if(vpLib.isEmpty(intRecSubsidiary)){
                if(vpLib.isEmpty(context.oldRecord)){
                    intRecSubsidiary   = context.oldRecord.getValue({fieldId: HC_TRANS_RECORDS.COMMON.FIELDS.SUBSIDIARY});
                }
            }
            
            if(vpLib.isEmpty(intRecTranId)){
                if(!vpLib.isEmpty(context.oldRecord)){
                    intRecTranId   = context.oldRecord.getValue({fieldId: HC_TRANID});
                }
            }
            
            vpLib.executeMapReduceScript({
                scriptId: 'customscript_nsts_vp_mr_createtrans',
                params  : {
                    custscript_nsts_vp_transactio_param_json:{
                        'transToCreate' : 'reversalbill',
                        'recordType'    : newrecord.type,
                        'ueType'        : context.type,
                        'id'            : intNewrecordid,
                        'idPO'          : intNewrecordid,
                        'execContext'   : runtime.executionContext,
                        'trandate'      : newrecord.getValue(HC_TRANDATE),
                        'tranid'        : intRecTranId,
                        'subsidiary'    : intRecSubsidiary,
                        'void'          : isVoided(context)
                    }
                    
                }
            });
        };
        
        var FUNC_PURCHASEORDERACTION = function(){
            if(context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT || context.type == context.UserEventType.APPROVE){
                var intPOApprovalStatus = parseInt(newrecord.getValue({
                    fieldId: HC_TRANS_RECORDS.COMMON.FIELDS.APPROVALSTATUS
                    })
                );
                
                var stPOStatus = newrecord.getValue({
                    fieldId: HC_TRANS_RECORDS.COMMON.FIELDS.STATUS
                    });

                stPOStatus = (vpLib.isEmpty(stPOStatus))?"": stPOStatus.toLowerCase();
                
                var arrSelectedVP   = newrecord.getValue({
                    fieldId: HC_TRANS_RECORDS.PURCHASE_ORDER.FIELDS.CUSTBODY_NSTS_VP_PREPAY_VP
                });
                
                try{
                    //vpLib.createVpBill(newrecord,context);
                    //MAP REDUCE:
                    vpLib.executeMapReduceScript({
                        scriptId: 'customscript_nsts_vp_mr_createtrans',
                        params  : {
                            custscript_nsts_vp_transactio_param_json:{
                                'transToCreate' : 'prepaymentbill',
                                'recordType'    : newrecord.type,
                                'id'            : intNewrecordid,
                                'idPO'          : intNewrecordid,
                                'execContext'   : runtime.executionContext
                            }
                            
                        }
                    });
                }catch(e){
                    throw Error(e.name + " - " + e.message);
                }
            }
        };
        
        var FUNC_JOURNALENRY_ACTION = function(){
            if(context.type == context.UserEventType.CREATE){
                var stCreatedFrom = context.newRecord.getValue({fieldId: 'createdfrom'});
                if(!vpLib.isEmpty(stCreatedFrom)){
                    var objFeature = new vpLib.feature();
                    var arrJECols = [HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS, 'tranid', 'trandate', 'internalid'];
                    
                    if(objFeature.bOneWorld)
                        arrJECols.push('subsidiary');
                    
                    var objJournalEntry = search.lookupFields({
                        type: search.Type.VENDOR_PAYMENT,
                        id: stCreatedFrom,
                        columns: arrJECols
                    });
                    var bIsPrepayTrans = objJournalEntry[HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS];
                    
                    if(bIsPrepayTrans){
                        //processVoidedDeletedPayment(context, null, objJournalEntry);
                        //MAP REDUCE:
                        vpLib.executeMapReduceScript({
                            scriptId: 'customscript_nsts_vp_mr_createtrans',
                            params  : {
                                custscript_nsts_vp_transactio_param_json:{
                                    'transToCreate' : 'reversalbill',
                                    'recordType'    : context.newRecord.type,
                                    'ueType'        : context.type,
                                    'id'            : context.newRecord.id,
                                    'idPO'          : context.newRecord.id,
                                    'idPay'         : objJournalEntry['internalid'][0].value,
                                    'execContext'   : runtime.executionContext,
                                    'trandate'      : objJournalEntry['trandate'],
                                    'tranid'        : objJournalEntry['tranid'],
                                    'subsidiary'    : (objFeature.bOneWorld) ? objJournalEntry['subsidiary'][0].value : null,
                                    'void'          : isVoided(context)
                                }
                                
                            }
                        });
                    }
                }
            }
        };

        if(stRecordType == HC_TRANS_RECORDS.COMMON.RECORDS.PURCHASEORDER){
            FUNC_PURCHASEORDERACTION();
        }else if(stRecordType == HC_TRANS_RECORDS.COMMON.RECORDS.VENDORBILL && (runtime.executionContext).toLowerCase() != 'mapreduce'){
            FUNC_VENDORBILL_ACTION();
        }else if(stRecordType == HC_TRANS_RECORDS.COMMON.RECORDS.VENDORPAYMENT){
            FUNC_VENDORPAYMENT_ACTION();
        }else if(stRecordType == 'journalentry'){
            FUNC_JOURNALENRY_ACTION();
        }
    }
    function add(a, b) {
        a = a || 0, b = b || 0
        var c, d, e;
        try {
            c = a.toString().split(".")[1].length
        } catch (f) {
            c = 0;
        }
        try {
            d = b.toString().split(".")[1].length;
        } catch (f) {
            d = 0;
        }
        return e = Math.pow(10, Math.max(c, d)), (mul(a, e) + mul(b, e)) / e;
    }
        
    function sub(a, b) {
        a = a || 0, b = b || 0
        var c, d, e;
        try {
            c = a.toString().split(".")[1].length
        } catch (f) {
            c = 0
        }
        try {
            d = b.toString().split(".")[1].length
        } catch (f) {
            d = 0
        }
        return e = Math.pow(10, Math.max(c, d)), (a * e - b * e) / e
    }
      
    function mul(a, b) {
        a = a || 0, b = b || 0
        var c = 0,
        d = a.toString(),
        e = b.toString();
        try {
            c += d.split(".")[1].length
        } catch (f) {}
        try {
            c += e.split(".")[1].length
        } catch (f) {}
        return Number(d.replace(".", "")) * Number(e.replace(".", "")) / Math.pow(10, c)
    }
      
    function div(a, b) {
        a = a || 0, b = b || 0
        var c, d, e = 0,
            f = 0
        try {
            e = a.toString().split(".")[1].length
        } catch (g) {}
        try {
            f = b.toString().split(".")[1].length
        } catch (g) {}
        return c = Number(a.toString().replace(".", "")), d = Number(b.toString().replace(".", "")), c / d * Math.pow(10, f - e)
    }

    function verificatJour(newRecord,jourId,purchaseOrders,account,vpInfo){
        log.error('vpInfo',vpInfo)
        var billPayment = record.create({
            type : record.Type.VENDOR_PAYMENT,
            isDynamic : true
        })

        billPayment.setValue({
            fieldId : 'entity',
            value : newRecord.getValue('entity')
        })

        billPayment.setValue({
            fieldId : 'apacct',
            value : account
        })

        billPayment.setValue({
            fieldId : 'account',
            value : 935
        })
        
        billPayment.setValue({
            fieldId : 'currency',
            value : newRecord.getValue('currency')
        })

        billPayment.setValue({
            fieldId : 'trandate',
            value : newRecord.getValue('trandate')
        })

        if(newRecord.getValue('postingperiod'))
        billPayment.setValue({
            fieldId : 'postingperiod',
            value : newRecord.getValue('postingperiod')
        })

        billPayment.setValue({
            fieldId : 'memo',
            value : newRecord.getValue('memo')
        })

        var lineCount = billPayment.getLineCount({
            sublistId : 'apply'
        })
        var internalIds = new Array()
        var jourAmount
        var jourAmountCopy

        for(var i = 0 ; i < lineCount ; i++)
        {
            var apply = billPayment.getSublistValue({
                sublistId : 'apply',
                fieldId : 'apply',
                line : i
            })
            var internalid = billPayment.getSublistValue({
                sublistId : 'apply',
                fieldId : 'internalid',
                line : i
            })
     
            if(internalid.toString() !== jourId.toString()){
                if(apply){
                    billPayment.selectLine({
                        sublistId : 'apply',
                        line : i
                    })

                    billPayment.setCurrentSublistValue({
                        sublistId : 'apply',
                        fieldId : 'apply',
                        value : false
                    })
                }

                internalIds.push(billPayment.getSublistValue({
                    sublistId : 'apply',
                    fieldId : 'internalid',
                    line : i
                }))
            }else{
                billPayment.selectLine({
                    sublistId : 'apply',
                    line : i
                })

                billPayment.setCurrentSublistValue({
                    sublistId : 'apply',
                    fieldId : 'apply',
                    value : true
                })

                jourAmount = jourAmountCopy = Math.abs(billPayment.getCurrentSublistValue({
                    sublistId : 'apply',
                    fieldId : 'amount'
                }))
            }
        }

        log.error(jourAmount ,jourAmountCopy)

        var VpOrd = jourVpOrd(internalIds)

        log.error('VpOrd' , VpOrd)

        for(var j = 0 ; j < lineCount ; j ++){
            var internalid = billPayment.getSublistValue({
                sublistId : 'apply',
                fieldId : 'internalid',
                line : j
            })

            log.error('purchaseOrders' , purchaseOrders)

            if(VpOrd[internalid] === purchaseOrders){
                billPayment.selectLine({
                    sublistId : 'apply',
                    line : j
                })

                billPayment.setCurrentSublistValue({
                    sublistId : 'apply',
                    fieldId : 'apply',
                    value : true
                })

                SubjourAmount = billPayment.getCurrentSublistValue({
                    sublistId : 'apply',
                    fieldId : 'amount'
                })

                log.error('jourAmount' ,jourAmount)
                log.error('SubjourAmount' ,SubjourAmount)
                log.error('jourAmount <= SubjourAmount' ,jourAmount <= SubjourAmount)

                if(jourAmount <= SubjourAmount){
                    billPayment.setCurrentSublistValue({
                        sublistId : 'apply',
                        fieldId : 'amount',
                        value : jourAmount
                    })

                    break
                }else{
                    jourAmount = sub(jourAmount  , SubjourAmount)
                }
            }
        }

        billPayment.save({
            ignoreMandatoryFields : true
        })

        record.submitFields({
            type : 'purchaseorder',
            id : vpInfo.vpId,
            values : {
                custbody_ap_vp_total : sub(vpInfo.total , jourAmountCopy)
            }
        })
    }

    function jourVpOrd(internalIds){
        var VpOrd = Object.create(null)

        search.create({
            type : 'journalentry',
            filters : [
                ['mainline' , 'is' , 'T'],
                'AND',
                ['internalid' , 'anyof' , internalIds]
            ],
            columns : [{name : 'tranid' , join : 'custbody_ap_vp_order'}]
        })
        .run()
        .each(function(res){
            VpOrd[res.id] = res.getValue({name : 'tranid' , join : 'custbody_ap_vp_order'})

            return true
        })

        return VpOrd
    }

    function BindJour(parmas){
        var joul = record.create({
            type : 'journalentry',
            isDynamic : true
        })

        joul.setValue({
            fieldId : 'approvalstatus',
            value : 2
        })

        joul.setValue({
            fieldId : 'subsidiary',
            value : parmas.subsidiary
        })

        joul.setValue({
            fieldId : 'trandate',
            value : parmas.trandate
        })

        joul.setValue({
            fieldId : 'currency',
            value : parmas.currency
        })
        
        joul.setValue({
            fieldId : 'memo',
            value : parmas.memo
        })

        joul.setValue({
            fieldId : 'postingperiod',
            value : parmas.postingperiod
        })

        if(parmas.dEntity)
        joul.setCurrentSublistValue({
            sublistId : 'line',
            fieldId : 'entity',
            value : parmas.dEntity
        })

        joul.selectNewLine({
            sublistId : 'line'
        })

        joul.setCurrentSublistValue({
            sublistId : 'line',
            fieldId : 'account',
            value : parmas.debit
        })

        joul.setCurrentSublistValue({  //借
            sublistId : 'line',
            fieldId : 'debit',
            value : parmas.usertotal
        })

        joul.commitLine({
            sublistId : 'line'
        })

        joul.selectNewLine({
            sublistId : 'line'
        })

        joul.setCurrentSublistValue({
            sublistId : 'line',
            fieldId : 'account',
            value : parmas.credit
        })

        if(parmas.cEntity)
        joul.setCurrentSublistValue({
            sublistId : 'line',
            fieldId : 'entity',
            value : parmas.cEntity
        })

        joul.setCurrentSublistValue({  //贷
            sublistId : 'line',
            fieldId : 'credit',
            value : parmas.usertotal
        })

        joul.commitLine({
            sublistId : 'line'
        })

        if(parmas.purchaseOrders)
        joul.setValue({
            fieldId : 'custbody_ap_vp_order',
            value : parmas.purchaseOrders
        })

        try
        {
            var joulId = joul.save({
                enableSourcing : true,
                ignoreMandatoryFields : true
            })

            return joulId
        }catch(e)
        {
            throw('error',e.message)
        }
    }
    
    /**
     * Send Email when a paying a PO BIll with the VP Credit
     * @param context
     * @param vpBillInfo.bill
     * @param vpBillInfo.billAmount
     * @param vpBillInfo.billAmountRemaining
     * @param vpBillInfo.billAmountPaid
     * @param vpBillInfo.data
     */
    function sendNotificationOnPaidWithTemplate(context,vpBillInfo){
        log.debug("sendNotificationOnPaidWithTemplate", "rec:" + JSON.stringify(vpBillInfo));
        
        var newrecord           = context.newRecord;
        var objVPRef               = vpLib.vpPreference(context);
        
        if(!vpLib.isEmpty(newrecord.id)){
            newrecord               = record.load({
                type: newrecord.type,
                id: newrecord.id
            });
        }

        if(objVPRef.notifyVendorWhenPaid && !vpLib.isEmpty(objVPRef.vendorEmailFieldId) && !vpLib.isEmpty(objVPRef.emailTemplateOnPaid) ){
            var intPurchaseOrderId = null;
            var arrPurchaseOrder = [];
            
            var bIsvptrans = false;
            if(!vpLib.isEmpty(vpBillInfo.data)){
                for (var ii in vpBillInfo.data){
                    var intBillPOId = vpBillInfo.data[ii].createdfrom;
                    if(!vpLib.isEmpty(intBillPOId)){
                        arrPurchaseOrder.push(intBillPOId);
                        intPurchaseOrderId = intBillPOId;
                    }
                    
                    if(vpBillInfo.data[ii].isvptrans == true){
                        bIsvptrans = true;
                    }
                }
            }
            
            if(!bIsvptrans){
                log.debug('SENDNOTIFICATIONONPAIDWITHTEMPLATE',"bIsvptrans is false");
                return;
            }
            
            if(vpLib.isEmpty(intPurchaseOrderId)){
                log.debug('SENDNOTIFICATIONONPAIDWITHTEMPLATE',"PO is null!");
                return;
            }

            var stEmailTemplate = record.load({
                type: 'emailtemplate',
                id: objVPRef.emailTemplateOnPaid
            });
            
            var stWhenPaidBody  = '';
            var serverFeature   = new vpLib.featureServer();
            var stVendorName    = newrecord.getValue('entity');
            stVendorName        = vpLib.isEmpty(stVendorName)? "": stVendorName + " ";
            var stSubject       = stEmailTemplate.getValue('subject');
            var stContent       = stEmailTemplate.getValue('content');
            stContent           = vpLib.isEmpty(stContent)? "": stContent;
            stSubject           = vpLib.isEmpty(stSubject)? "": stSubject;
            //stSubject           = stVendorName + stSubject;

            var arrColumns = ["entity",'custbody_nsts_vp_po_employee_email'];
            if(!vpLib.isEmpty(objVPRef.vendorEmailFieldId)){
                arrColumns.push(objVPRef.vendorEmailFieldId);
            }
            
            var arrPOFill       = [];
            var ArrVendorEmail  = [];
            var arrPoEmployee   = [];
            
            arrPOFill.push('internalid','anyof',arrPurchaseOrder);
            var objSearchTrans = search.create({
                type: 'transaction',
                filters: arrPOFill,
                columns: arrColumns
            }).run().each(function(result){
                var intVendor       = result.getValue('entity');
                var stVenEmail      = (!vpLib.isEmpty(objVPRef.vendorEmailFieldId))? result.getValue(objVPRef.vendorEmailFieldId): "";
                var stpoEmployee    = result.getValue('custbody_nsts_vp_po_employee_email');
                
                if(vpLib.isEmpty(stVenEmail)){
                    if( !vpLib.isEmpty(intVendor) && ArrVendorEmail.indexOf(intVendor) < 0){
                        ArrVendorEmail.push(intVendor);
                    }
                }else{
                    if(ArrVendorEmail.indexOf(stVenEmail) < 0){
                        ArrVendorEmail.push(stVenEmail);
                    }
                }

                if(!vpLib.isEmpty(stpoEmployee)){
                    if(arrPoEmployee.indexOf(stpoEmployee) < 0){
                        arrPoEmployee.push(stpoEmployee);
                    }

                }
                return true
            });
            

                
            var relateRec = (arrPurchaseOrder.length == 1)?{
                        transactionId   : arrPurchaseOrder[0],
                        recordtype      : "purchaseorder",
                        entityId        : objVPRef.vendorEmailSender
                    }:{
                        entityId        : objVPRef.vendorEmailSender
                    }

            stContent = stContent.replace(/\<\#assign +vpinfoline( *=.*?)\>/g,"");
            stContent = stContent.replace(/\<\#assign +vendorpayment( *=.*?)\>/g,"");
            stContent = stContent.trim();

            log.debug("SENDNOTIFICATIONONPAIDWITHTEMPLATE","stContent:" + stContent)
            var objRenderer = render.create();
            objRenderer.templateContent = stContent;
            objRenderer.addRecord( HC_TRANS_RECORDS.COMMON.RECORDS.VENDORPAYMENT,newrecord);
            objRenderer.addCustomDataSource({format : render.DataSource.OBJECT, alias: "vpinfoline", data: vpBillInfo});
            
            stWhenPaidBody = objRenderer.renderAsString();
            
            var objSubRenderer = render.create();
            objSubRenderer.templateContent = stSubject;
            objSubRenderer.addRecord(HC_TRANS_RECORDS.COMMON.RECORDS.TRANSACTION,newrecord);
            stSubject = objSubRenderer.renderAsString();
            
            vpLib.sendEmail({
                author  :  objVPRef.vendorEmailSender,
                cc      : arrPoEmployee,
                subject : stSubject,
                body    : stWhenPaidBody,
                recipients      : ArrVendorEmail,
                internalOnly    : false,
                relatedRecords  : relateRec
            });
            
        }
    }
    

    function processVoidedDeletedPayment(context, classification, objJournalEntry) {
        try {
            var newrecord = context.newRecord;
            var stRecordType = newrecord.type;
            var idPayment = newrecord.id;
            var stTranDate = newrecord.getValue('trandate');
            
            //var objSvrFeature = new vpLib.featureServer();
            var bIsVoid = isVoided(context);

            var objFeature = new vpLib.feature();
            var intSubsidiary = (objFeature.bOneWorld) ? newrecord.getValue({fieldId : 'subsidiary'}) : null;

            var intSubsidiary = newrecord.getValue({fieldId : 'subsidiary'});
            if (vpLib.isEmpty(intSubsidiary)) {
                if (vpLib.isEmpty(context.oldRecord)) {
                    intSubsidiary = context.oldRecord.getValue({
                        fieldId : 'subsidiary'
                    });
                };
            }

            var stVPPayTranId = newrecord.getValue({
                fieldId : 'tranid'
            });
            
            if (vpLib.isEmpty(stVPPayTranId)) {
                if (vpLib.isEmpty(context.oldRecord)) {
                    stVPPayTranId = context.oldRecord.getValue({
                        fieldId : 'tranid'
                    });
                };
            }
            
            if(stRecordType == 'journalentry'){
                stVPPayTranId = objJournalEntry['tranid'];
                intSubsidiary = objJournalEntry['subsidiary'][0].value;
                idPayment     = objJournalEntry['internalid'][0].value;
                
                stTranDate = new Date(objJournalEntry['trandate']); log.debug('timetrandate', stTranDate+':'+formatter.format(stTranDate, formatter.Type.DATETIME));
                
                bIsVoid = true;
            }
            
            var objVpPref = vpLib.vpPreference(context, intSubsidiary);

            if (vpLib.isEmpty(classification)) {
                classification = new vpLib.getDefaultClassification(
                        intSubsidiary);
            }

            // ===VOIDED===
            if (bIsVoid || context.type == context.UserEventType.DELETE) {
                var arrVP = vpValidations.getVPviaBillPayment(idPayment);
                var arrVC = [];
                for (var ii = 0; ii < arrVP.length; ii++) {
                    var rec = arrVP[ii];
                    var vpVCID = rec.getValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_CREDIT);
                    if (!vpLib.isEmpty(vpVCID)) {
                        arrVC.push(vpVCID);
                    }
                }
                
                var arrVPCred = vpValidations.getVendorCredit(arrVC);
                var arrObjVPCred = [];
                if (!vpLib.isEmpty(arrVPCred)) {
                    var stAmountRemaining = (objFeature.bMultiCurrency) ? 'fxamountremaining' : 'amountremaining';
                    var stAmountPaid = (objFeature.bMultiCurrency) ? 'fxamountpaid' : 'amountpaid';

                    for (var ii = 0; ii < arrVPCred.length; ii++) {
                        var rec = arrVPCred[ii];
                        var vpVCID = rec.id;
                        var vpCrdUnappliedAmt   = rec.getValue(stAmountRemaining);
                        var vpCrdAppliedAmt     = rec.getValue(stAmountPaid);

                        arrObjVPCred.push({
                                id : vpVCID,
                                applied : vpCrdAppliedAmt,
                                unapplied : vpCrdUnappliedAmt
                        })
                    }
                }


                for (var ii = 0; ii < arrVP.length; ii++) {
                    var rec = arrVP[ii];

                    var vpBillID        = rec.getValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_BILL);
                    var stVPBillTranId  = rec.getValue({name : 'tranid',join : HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_BILL});
                    var vpVCID          = rec.getValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_CREDIT);
                    var vpVCIDText      = rec.getText(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_CREDIT);
                    var vpRevBillID     = rec.getValue(HC_VP_RECORDS.VP.FIELDS.CUSTRECORD_NSTS_VP_PREPAY_REVERSAL_BILL);

                    var vpCrdAppliedAmt     = 0.00;
                    var vpCrdUnappliedAmt   = 0.00;
                    var intvpcreditIndex    = searchOnArrayObject(arrObjVPCred, "id", vpVCID);
                    
                    if (intvpcreditIndex >= 0) {
                        var objcred = arrObjVPCred[intvpcreditIndex];
                        vpCrdAppliedAmt = objcred.applied;
                        vpCrdUnappliedAmt = objcred.unapplied;
                    }

                    vpCrdUnappliedAmt   = vpLib.forceParseFloat(vpCrdUnappliedAmt);
                    vpCrdAppliedAmt     = vpLib.forceParseFloat(vpCrdAppliedAmt);
                    var flValidNonZeroCred = vpCrdAppliedAmt + vpCrdUnappliedAmt;

                    var stAction = "voided";
                    var stMemo = "Reversal Bill of Bill#" + stVPBillTranId + " due to voided Prepayment Payment";
                    if (context.type == context.UserEventType.DELETE) {
                        stAction = "deleted"
                        stMemo = "Reversal Bill of Bill#" + stVPBillTranId + " due to deleted Prepayment Payment";
                    }

                    vpLib.log("AFTERSUBMIT VOIDED","vpRevBillID:" + vpRevBillID  + " vpCrdUnappliedAmt:" + vpCrdUnappliedAmt + "vpCrdAppliedAmt:" + vpCrdAppliedAmt);
                    if (vpLib.isEmpty(vpRevBillID) && !vpLib.isEmpty(vpVCID) && !vpLib.isEmpty(vpBillID) && flValidNonZeroCred > 0) {
                        
                        var bDoEmailNotif   = false;
                        var bIsPayHold      = false;
                        var objRevBill      = {};
                        var stApprovalStatus = null;
                        var stSupApproval    = false;
                        var stTranId         = "REVERSAL:"+ stVPBillTranId;

                        if (vpCrdUnappliedAmt > 0) {
                            if (vpCrdAppliedAmt > 0) {
                                bIsPayHold = true;
                                bDoEmailNotif = true;
                            }
                            
                            stApprovalStatus = 2;
                            supervisorapproval = true;
                            
                            /*objRevBill = {
                                    approvalstatus      : 2,
                                    supervisorapproval  : true,
                                    tranid              : "REVERSAL:"+ stVPBillTranId,
                                    paymenthold         : bIsPayHold,
                                    custbody_nsts_vp_prepay_trans   : false,
                            };*/
                        } else {
                            bIsPayHold = true;
                            bDoEmailNotif = true;
                            /*objRevBill = {
                                    paymenthold : bIsPayHold,
                                    tranid : "REVERSAL:" + stVPBillTranId,
                                    custbody_nsts_vp_prepay_trans : false
                            };*/
                        }

                        var recRevBill = record.copy({
                            type : HC_TRANS_RECORDS.COMMON.RECORDS.VENDORBILL,
                            id : vpBillID,
                            isDynamic: true
                        });
                        
                        recRevBill.setValue({
                            fieldId : HC_TRANS_RECORDS.COMMON.FIELDS.TRANDATE,
                            value : stTranDate
                        });

                        recRevBill.setValue({
                            fieldId : HC_TRANS_RECORDS.COMMON.FIELDS.CUSTBODY_NSTS_VP_PREPAY_TRANS,
                            value : false
                        });

                        if(objFeature.bLocations){//if (objSvrFeature.accounting_preferences.bLocmandatory) {
                            recRevBill.setValue({
                                fieldId : HC_TRANS_RECORDS.COMMON.FIELDS.LOCATION,
                                value : classification.location
                            });
                        }
                        if(objFeature.bClasses){//if (objSvrFeature.accounting_preferences.bClassmandatory) {
                            recRevBill.setValue({
                                fieldId : HC_TRANS_RECORDS.COMMON.FIELDS.CLASS,
                                value : classification.classification
                            });
                        }
                        if(objFeature.bDepartments){//if (objSvrFeature.accounting_preferences.bDeptmandatory) {
                            recRevBill.setValue({
                                fieldId : HC_TRANS_RECORDS.COMMON.FIELDS.DEPARTMENT,
                                value : classification.department
                            });
                        }

                        recRevBill.setValue({
                            fieldId : HC_TRANS_RECORDS.COMMON.FIELDS.APPROVALSTATUS,
                            value : 2
                        });

                        /*recRevBill.setValue({
                            fieldId : HC_TRANS_RECORDS.COMMON.FIELDS.SUPERVISORAPPROVAL,
                            value : true
                        });*/

                        recRevBill.setValue({
                            fieldId : HC_TRANS_RECORDS.COMMON.FIELDS.TRANID,
                            value : stTranId//"REVERSAL:" + vpVCIDText
                        });

                        recRevBill.setValue({
                            fieldId : HC_TRANS_RECORDS.COMMON.FIELDS.MEMO,
                            value : stMemo
                        });

                        recRevBill.setValue({
                                fieldId : 'bIsPayHold',
                                value : bIsPayHold
                        });

                        var intRevBillId = recRevBill.save({
                            enableSourcing : true,
                            ignoreMandatoryFields : true
                        });

                        var arrBill = [intRevBillId];

                        /*var intRevBillId = record.submitFields({
                            type : HC_TRANS_RECORDS.COMMON.RECORDS.VENDORBILL,
                            id : intRevBillId,
                            values : objRevBill
                        });*/
                        
                        if (vpCrdUnappliedAmt > 0) {
                            applyBillOnCredit(vpVCID, arrBill, vpCrdUnappliedAmt);
                        }

                        var arrVPFldVal = {
                                custrecord_nsts_vp_prepay_reversal_bill : intRevBillId,
                                custrecord_nsts_vp_prepay_credit : '',
                                custrecord_nsts_vp_prepay_payment : ''
                        };

                        var id = record.submitFields({
                            type    : HC_VP_RECORDS.VP.ID,
                            id      : rec.id,
                            values  : arrVPFldVal,
                            options : {
                                enableSourcing : true
                            }
                        });
                        
                        if (!vpLib.isEmpty(objVpPref.payholdNotification) && bIsPayHold && bDoEmailNotif) {
                            var stPayHoldSubject = "";
                            var stPayHoldBody = "Reversal Bill <b>REVERSAL:" + stVPBillTranId  + "</b> dated " + formatter.format(stTranDate, formatter.Type.DATE) + " for Voided VP Payment ";
                            stPayHoldBody += "<b>" + stVPPayTranId + "</b> is currently put on hold. Kindly check and release hold manually.";

                            vpLib.sendEmail({
                                subject : '[Vendor Prepayment] Reversal Bill on Hold',
                                author  : objVpPref.vendorEmailSender,
                                body    : stPayHoldBody,
                                recipients      : objVpPref.payholdNotification,
                                relatedRecords  : {
                                    transactionId   : intRevBillId,
                                    recordtype      : HC_TRANS_RECORDS.COMMON.RECORDS.VENDORBILL,
                                    entityId        : objVpPref.payholdNotification
                                }
                            });
                        }

                    } else {
                        var arrVPFldVal = {
                                custrecord_nsts_vp_prepay_credit : '',
                                custrecord_nsts_vp_prepay_payment : ''
                        };

                        var id = record.submitFields({
                                type : HC_VP_RECORDS.VP.ID,
                                id : rec.id,
                                values : arrVPFldVal,
                                options : {
                                    enableSourcing : true
                                }
                        });
                    }
                }
            }//try{
        } catch (e) {
            log.debug("PROCESSVOIDEDDELETEDPAYMENT", e);
        }
    }
    
    function applyBillOnCredit(intCreditId,arrBill,flAmount){
        try{
            var recCredit = record.load({
                type: HC_TRANS_RECORDS.COMMON.RECORDS.VENDORCREDIT,
                id: intCreditId
            })
            
            if(!vpLib.isEmpty(recCredit)){
                for(var ind in arrBill){
                    var idBill  = arrBill[ind];
                    idBill      = vpLib.isEmpty(idBill)? "": idBill.toString();
                    
                    var intLine = recCredit.findSublistLineWithValue({
                        sublistId : HC_TRANS_RECORDS.COMMON.SUBLIST.APPLY,
                        fieldId : HC_TRANS_RECORDS.COMMON.SUBLISTFIELD.INTERNALID,
                        value : idBill
                    });
                    
                    if (intLine > -1) {
                        var blCurApp = recCredit.getSublistValue({
                            sublistId :  HC_TRANS_RECORDS.COMMON.SUBLIST.APPLY,
                            line : intLine,
                            fieldId : HC_TRANS_RECORDS.COMMON.SUBLISTFIELD.APPLY
                        });
                        
                        recCredit.setSublistValue({
                            sublistId : HC_TRANS_RECORDS.COMMON.SUBLIST.APPLY,
                            line : intLine,
                            fieldId : HC_TRANS_RECORDS.COMMON.SUBLISTFIELD.APPLY,
                            value : true
                        });
                        
                        recCredit.setSublistValue({
                            sublistId : HC_TRANS_RECORDS.COMMON.SUBLIST.APPLY,
                            line : intLine,
                            fieldId : HC_TRANS_RECORDS.COMMON.SUBLISTFIELD.AMOUNT,
                            value : flAmount
                        });
                    }
                }
                
                recCredit.save({
                    enableSourcing : false,
                    ignoreMandatory : true
                });

            }//try{
        }catch(e){
            log.debug("APPLYBILLONCREDIT",e);
        }
    }
    
    
    function getSelectAppliedRecord(arrBillCredit,arrApliedAmt){
        try{
            var arrAppliedInfo = [];
            var objGetFeature = new vpLib.feature();
            if(!vpLib.isEmpty(arrBillCredit)){
                var arrBill = [];
                var arrFils = [];
                var arrCols = [];
                
                var stAmount            = (objGetFeature.bMultiCurrency) ? 'fxamount' : 'amount';
                var stAmountRemaining   = (objGetFeature.bMultiCurrency) ? 'fxamountremaining' : 'amountremaining';
                var stAmountPaid        = (objGetFeature.bMultiCurrency) ? 'fxamountpaid' : 'amountpaid'; 
                
                arrFils.push(["internalid",'anyof',arrBillCredit]);
                arrFils.push("and");
                arrFils.push(["mainline",'is','T']);
                arrFils.push("and");
                arrFils.push(["recordtype",'is','vendorbill']);
                
                arrCols.push(search.createColumn({name: 'createdfrom'}));
                arrCols.push(search.createColumn({name: 'tranid'}));
                arrCols.push(search.createColumn({name: 'transactionnumber'}));
                arrCols.push(search.createColumn({name: 'recordtype', sort: search.Sort.ASC}));
                arrCols.push(search.createColumn({name: 'custbody_nsts_vp_prepay_trans'}));
                arrCols.push(search.createColumn({name: 'trandate'}));
                
                arrCols.push(search.createColumn({name: stAmount}));
                arrCols.push(search.createColumn({name: stAmountRemaining}));
                arrCols.push(search.createColumn({name: stAmountPaid}));
                arrCols.push(search.createColumn({name: stAmount}));
    
                if(objGetFeature.bMultiCurrency){
                    arrCols.push(search.createColumn({name: 'currency'}));
                }else{
                }
    
                var res = search.create({
                    type: HC_TRANS_RECORDS.COMMON.RECORDS.TRANSACTION,
                    filters: arrFils,
                    columns: arrCols,
                }).run().each(function(result){
                    var stType = result.getValue("recordtype");
                    var flCreditPayment = Math.abs(vpLib.forceParseFloat(arrApliedAmt[arrBillCredit.indexOf(result.id)]));
                    flCreditPayment = vpLib.forceParseFloat(flCreditPayment);
                    var flBillAmount = vpLib.forceParseFloat(result.getValue(stAmount));
                    var flBillAmountRemaining = vpLib.forceParseFloat(result.getValue(stAmountRemaining));
                    var flBillAmountPaid = vpLib.forceParseFloat(result.getValue(stAmountPaid));
                    var stTrandate = result.getValue('trandate');
                    
                    if(!vpLib.isEmpty(stTrandate)){
                        stTrandate = formatter.format({value: stTrandate , type: formatter.Type.DATE});
                    }else{
                        stTrandate = "";
                    }
    
                    if(stType == HC_TRANS_RECORDS.COMMON.RECORDS.VENDORBILL){
                        arrBill.push(result.id);
                        arrAppliedInfo.push({
                            id                      : result.id,
                            billId                  : result.id,
                            tranid                  : result.getValue("tranid"),
                            transactionnumber       : result.getValue("transactionnumber"),
                            recordtype              : stType,
                            isvptrans               : result.getValue("custbody_nsts_vp_prepay_trans"),
                            currency                : (objGetFeature.bMultiCurrency)? result.getText("currency"): "",
                            appliedAmount           : flCreditPayment,
                            billAmount              : flBillAmount,
                            billAmountRemaining     : flBillAmountRemaining,
                            billAmountPaid          : flBillAmountPaid,
                            date                    : stTrandate,
                            createdfrom             : result.getValue('createdfrom'),
                            applyingtransaction     : []
                            
                        });
                    }
                    return true;
                });
                
                var arrPOBILL = search.load({id: 'customsearch_nsts_vp_get_pobill' });
                arrFils = arrPOBILL.filters;
                arrCols = arrPOBILL.columns;
                
                var idPurchaseOrder = null;
                if(vpLib.isEmpty(arrFils)){
                    arrFils = [];
                }
                arrFils.push(search.createFilter({name: 'internalid', operator: 'anyof', values: arrBill}));
                
                if(vpLib.isEmpty(arrCols)){
                    arrCols = [];
                }
                
                var stApplyingAmt = (objGetFeature.bMultiCurrency) ? 'applyingforeignamount' : 'applyinglinkamount';
                arrCols.push(search.createColumn({name: stApplyingAmt}));
                arrCols.push(search.createColumn({name: stAmount,join: "applyingtransaction"}));
                arrCols.push(search.createColumn({name: stAmountRemaining,join: "applyingtransaction"}));
                arrCols.push(search.createColumn({name: stAmountPaid,join: "applyingtransaction"}));
                arrCols.push(search.createColumn({name: stAmount,join: "applyingtransaction"}));
                
                arrPOBILL.filters = arrFils;
                arrPOBILL.columns = arrCols;
                
                arrPOBILL.run().each(function(result){
                    var intIndex = searchOnArrayObject(arrAppliedInfo,"id",result.id);
                    var intApplyingId = result.getValue({name: "applyingtransaction"});
                    var intIndexBillCred = arrBillCredit.indexOf(intApplyingId);
                    var flCreditPayment = "";
                    var bIsCurrentInProcess = false;
                    if(intIndexBillCred>=0){
                        bIsCurrentInProcess = true;
                        flCreditPayment = Math.abs(vpLib.forceParseFloat(arrApliedAmt[intIndexBillCred]));
                    }
                    
                    
                    if(intIndex>=0){
                        if(!vpLib.isEmpty(arrAppliedInfo[intIndex])){
                            if(vpLib.isEmpty(arrAppliedInfo[intIndex].applyingtransaction)){
                                arrAppliedInfo[intIndex].applyingtransaction = [];
                            }
                            
                            var stTranId = result.getValue({name: "tranid",join:"applyingtransaction"});
                            var StTransactionnumber = result.getValue({name: "transactionnumber",join:"applyingtransaction"})
                            var bVPTran = result.getValue({name: "custbody_nsts_vp_prepay_trans",join:"applyingtransaction"});
                            var stType = result.getValue({name: "recordtype",join:"applyingtransaction"});
                            var stTrandate = result.getValue({name:'trandate',join:"applyingtransaction"})
                            if(!vpLib.isEmpty(stTrandate)){
                                stTrandate = formatter.format({value: stTrandate , type: formatter.Type.DATE});
                            }else{
                                stTrandate = "";
                            }
                            
                            
                            var stVpPo = "";
                            var stVp   = "";
                            if(bVPTran){
                                stTranId = vpLib.isEmpty(stTranId)? "": stTranId;
                                var arrTranId = stTranId.split('-');
                                stVpPo      = arrTranId[0];
                                stVp        = arrTranId[1];
                                
                                stVpPo        = vpLib.isEmpty(stVpPo)? "": stVpPo;
                                stVp        = vpLib.isEmpty(stVp)? "": stVp;                            
                            }
    
                            stType = vpLib.isEmpty(stType)? "": stType.toLowerCase();
    
                            if(stType == HC_TRANS_RECORDS.COMMON.RECORDS.VENDORCREDIT){ //"vendorcredit"
                                stType = "Other Credit";
                                if(bVPTran){
                                    stType = "Prepayment Credit";
                                }
                            }else if(stType == HC_TRANS_RECORDS.COMMON.RECORDS.VENDORPAYMENT){
                                stType = "Payment";
                            }
                            
                            var flAppltingAmt = result.getValue({name: stApplyingAmt});
                            var flAmount = result.getValue({name: stAmount,join:"applyingtransaction"});
                            var flAmountRemaining = result.getValue({name: stAmountRemaining,join:"applyingtransaction"});
                            var flAmountPaid = result.getValue({name: stAmountPaid,join:"applyingtransaction"})
    
                            flAppltingAmt = Math.abs(flAppltingAmt);
                            flAmount = Math.abs(flAmount);
                            flAmountRemaining = Math.abs(flAmountRemaining);
                            flAmountPaid = Math.abs(flAmountPaid);
                            
                            flAppltingAmt = vpLib.forceParseFloat(flAppltingAmt);
                            flAmount = vpLib.forceParseFloat(flAmount);
                            flAmountRemaining = vpLib.forceParseFloat(flAmountRemaining);
                            flAmountPaid = vpLib.forceParseFloat(flAmountPaid);
                            
                            if(bVPTran){
                                arrAppliedInfo[intIndex].isvptrans = true;
                            }
    
                            arrAppliedInfo[intIndex].applyingtransaction.push({
                                id                  : result.id,
                                tranid              : stTranId,
                                transactionnumber   : StTransactionnumber,
                                recordtype          : stType,
                                isvptrans           : bVPTran,
                                applyingAmount      : flAppltingAmt,
                                amount              : flAmount,
                                amountRemaining     : flAmountRemaining,
                                amountPaid          : flAmountPaid,
                                currentInProcess    : bIsCurrentInProcess,
                                appliedPayAmount    : flCreditPayment,
                                date                : stTrandate,
                                vpPO                : stVpPo,
                                vp                  : stVp,
                            });
                        }
                    }
                    return true;
                });
            }
    
            log.debug("GETSELECTAPPLIEDRECORD", JSON.stringify(arrAppliedInfo));
            
            return arrAppliedInfo;
        }catch(e){
            log.error("ERROR: getSelectAppliedRecord",e);
        }
    }
    
    function searchOnArrayObject(arrObj,key,findVal){
        if(!vpLib.isEmpty(arrObj)){
            for(var index in arrObj){
                var obj = arrObj[index];
                if(obj[key] == findVal){
                    return index;
                }
            }
        }
        return -1;
    }

    return{
        beforeLoad      : vpBeforeLoad,
        beforeSubmit    : vpBeforeSubmit,
        afterSubmit     : vpAfterSubmit
        
    }
});
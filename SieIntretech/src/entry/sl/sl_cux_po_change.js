/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/runtime'], function (serverWidget, search, runtime) {
    function onRequest(context) {
        if (context.request.method === 'GET') {//直接访问页面是GET方式
            var form;
            // 创建表单
            form = serverWidget.createForm({
                title: '采购订单变更单'
            });
            //普通按钮
            form.addButton({
                label : '搜索',
                id : 'cstm_page_search_btn',
                functionName: "searchButtonClickEvent"
            });
            form.addButton({
                label : '提交',
                id : 'cstm_page_submit_btn',
                functionName: "searchSubmitButtonClickEvent"
            });
            form.addButton({
                label : '添加至确认列表',
                id : 'cstm_page_submit_btn',
                functionName: "searchSubmitToConfirmClickEvent"
            });
            form.clientScriptModulePath = "./../cs/cs_cux_po_change.js";
            //创建下拉字段，数据源自系统数据
            createPageFields(form, getRecordFields());
            //输出这个表单到用户的浏览器
            context.response.writePage(form);
        } else {//当用户访问页面，填写了数据，并提交，数据会提交到当前Suitelet，只不过是以POST的方式，所以在这里处理提交后的逻辑
            //获取用户填写的字段的值
            context.response.write({
                output: JSON.stringify(context)
            });
        }
    }

    function getRecordFields() {
        var sublistDivPage = 
        "<script>\
            window.onload=function(){\
                page_init();\
                divSublistPage('pochange_detail_sublist');\
                function divSublistPage(sublistId){\
                    var div = document.createElement('div');\
                    var style = document.createElement('style');\
                    var detailNode = document.querySelector('#pochange_detail_sublist_layer');\
                    div.innerHTML = \"<div class='div_detail_sublist_page_wrapper'>\
                        <div id='div_detail_sublist_page_content'>\
                            <div name='div_detail_sublist_page_showcount_page' style='border:none;cursor:default;'><span>每页显示</span>\
                            <select><option value='25'>25</option>\
                            <option value='50'>50</option><option value='75'>75</option><option value='100'>100</option>\
                            </select><span>条</span></div>\
                            <div name='div_detail_sublist_page_first_page'><span>首页</span></div>\
                            <div name='div_detail_sublist_page_previous_page'><span>上一页</span></div>\
                            <div name='div_detail_sublist_page_detail_page' page-index='1' class='div_detail_sublist_page_selected'><span>1</span></div>\
                            <div name='div_detail_sublist_page_detail_page' page-index='2' style='display:none;' class=''><span>2</span></div>\
                            <div name='div_detail_sublist_page_detail_page' page-index='3' style='display:none;' class=''><span>3</span></div>\
                            <div name='div_detail_sublist_page_detail_page' page-index='4' style='display:none;' class=''><span>4</span></div>\
                            <div name='div_detail_sublist_page_detail_page' page-index='5' style='display:none;' class=''><span>5</span></div>\
                            <div name='div_detail_sublist_page_detail_page' page-index='6' style='display:none;' class=''><span>6</span></div>\
                            <div name='div_detail_sublist_page_detail_page' page-index='7' style='display:none;' class=''><span>7</span></div>\
                            <div name='div_detail_sublist_page_detail_page' page-index='8' style='display:none;' class=''><span>8</span></div>\
                            <div name='div_detail_sublist_page_detail_page' page-index='9' style='display:none;' class=''><span>9</span></div>\
                            <div name='div_detail_sublist_page_detail_page' page-index='10' style='display:none;' class=''><span>10</span></div>\
                            <div name='div_detail_sublist_page_next_page'><span>下一页</span></div>\
                            <div name='div_detail_sublist_page_last_page'><span>尾页</span></div>\
                            <div name='div_detail_sublist_page_total_page'>共<span>1</span>页/<span>0</span>条数据</div>\
                            <div name='div_detail_sublist_page_turnto_page' style='border:none;cursor:default;'><span>转到</span><input value=''/><span>页</span></div>\
                            <div name='div_detail_sublist_page_goto_page'><span>Go</span></div>\
                        </div>\
                    </div>\";\
                    style.innerHTML = '.div_detail_sublist_page_wrapper{width:100%;height:25px;line-height:25px;margin-top:10px;}\
                    #div_detail_sublist_page_content>div{height:100%;width:auto;border:none;border-radius:3px;margin:0px 1px;box-sizing: content-box;\
                        display:inline-block;min-width:30px;border:1px solid gray;background:white none;font-size:13px;color:gray;\
                        padding:0 10px;vertical-align: middle;text-align: center;cursor:pointer;}\
                        #div_detail_sublist_page_content>span{font-size:13px;}#div_detail_sublist_page_content>div:hover{background-color: #EBEBEB;}\
                        #div_detail_sublist_page_content>div:first-child:hover,#div_detail_sublist_page_content>div[name=\"div_detail_sublist_page_turnto_page\"]:hover{background-color: white;}\
                        div[name=\"div_detail_sublist_page_turnto_page\"] input{max-width:60px;margin: 0 5px;line-height: 20px;padding:0 3px;}\
                        div[name=\"div_detail_sublist_page_showcount_page\"] select{line-heigth:20px;max-width:50px;padding:2px;}\
                        #div_detail_sublist_page_content .div_detail_sublist_page_selected{background-color: #caa476;color: white;border: 1px solid #caa476;}\
                        #div_detail_sublist_page_content .div_detail_sublist_page_selected:hover{background-color: #caa476;color: white;border: 1px solid #caa476;}\
                        #pochange_detail_sublist_headerrow td[data-label=\" \"] .listheader{height:17px;width:17px;border: 1px solid #cccccc;\
                        background: white no-repeat 50% !important;cursor: pointer;left:0;right:0;}#pochange_detail_sublist_headerrow td[data-label=\" \"] .listheader:hover{border: 1px solid black;}\
                        #pochange_detail_sublist_headerrow td[data-label=\" \"]::after{content:\"选择\"}\
                        #pochange_detail_sublist_headerrow td[data-label=\" \"] .pochange_detail_sublist_headerrow_checkbox_selected{background-image:url(/uirefresh/img/field/checkmark.png) !important;}';\
                    document.head.append(style);\
                    detailNode.insertBefore(div.firstChild.cloneNode(true), detailNode.firstChild);\
                    detailNode.append(div.firstChild);\
                }\
            };\
        </script>";
        
        return {
            "entity": {
                id: 'entity',
                type: serverWidget.FieldType.SELECT,
                source: 'vendor',
                label: '供应商'
            },
            "datecreated_from": {
                id: 'datecreated_from',
                type: serverWidget.FieldType.DATE,
                label: '创建日期From'
            },
            "datecreated_to": {
                id: 'datecreated_to',
                type: serverWidget.FieldType.DATE,
                label: '创建日期To'
            },
            "expectedreceiptdate_from": {
                id: 'expectedreceiptdate_from',
                type: serverWidget.FieldType.DATE,
                label: '预计收货日期From'
            },
            "expectedreceiptdate_to": {
                id: 'expectedreceiptdate_to',
                type: serverWidget.FieldType.DATE,
                label: '预计收货日期To'
            },
            "item": {
                id: 'item',
                type: serverWidget.FieldType.SELECT,
                source: 'item',
                label: '物料编码'
            },
            "custbody_po_list_pur_type": {
                id: 'custbody_po_list_pur_type',
                type: serverWidget.FieldType.SELECT,
                source: 'customlist_po_list_pur_type',
                label: '采购类型'
            },
            "tranid": {
                id: 'tranid',
                type: serverWidget.FieldType.TEXT,
                label: '采购订单号'
            },
            "custcol_external_2": {
                id: 'custcol_external_2',
                type: serverWidget.FieldType.SELECT,
                source: 'estimate',
                label: '原销售订单号'
            },
            "custbody_po_buyer": {
                id: 'custbody_po_buyer',
                type: serverWidget.FieldType.SELECT,
                source: 'employee',
                label: '专营采购员'
            },
            "pochange_detail_tab": {
                id: 'pochange_detail_tab',
                type: "TAB",
                label: '采购订单数据列表',
                pochange_detail_sublist: {
                    id: "pochange_detail_sublist",
                    type: serverWidget.SublistType.INLINEEDITOR,
                    label: '采购订单数据列表',
                    tab: "pochange_detail_tab",
                    fields: [
                        {"id":"linenumber","type":"TEXT","label":"行号"},
                        fieldDisplayTypeDisabled,
                        {"id":"checkbox","type":"CHECKBOX","label":" "},
                        {"id":"entity","type":"SELECT","label":"供应商","source":"vendor"},
                        fieldDisplayTypeDisabled,
                        {"id":"internalid","type":"TEXT","label":"内部标识"},
                        fieldDisplayTypeDisabled,
                        {"id":"custbody_k3_po_number","type":"TEXT","label":"K3采购订单号"},
                        fieldDisplayTypeDisabled,
                        {"id":"tranid","type":"TEXT","label":"采购订单号"},
                        fieldDisplayTypeDisabled,
                        {"id":"custcol_k3_line_number","type":"TEXT","label":"K3行id"},
                        fieldDisplayTypeDisabled,
                        {"id":"line","type":"TEXT","label":"行Id"},
                        fieldDisplayTypeDisabled,
                        {"id":"item","type":"SELECT","label":"货品","source":"item"},
                        fieldDisplayTypeDisabled,
                        {"id":"item__salesdescription","type":"TEXT","label":"规格型号"},
                        fieldDisplayTypeDisabled,
                        {"id":"quantity","type":"TEXT","label":"采购数量"},
                        fieldDisplayTypeDisabled,
                        {"id":"aftermodify__quantity","type":"TEXT","label":"变更后数量"},
                        fieldDisplayTypeDisabled,
                        {"id":"rate","type":"TEXT","label":"单价"},
                        fieldDisplayTypeDisabled,
                        {"id":"aftermodify__rate","type":"TEXT","label":"变更后单价"},
                        fieldDisplayTypeDisabled,
                        {"id":"taxcode","type":"PERCENT","label":"税率"},
                        fieldDisplayTypeDisabled,
                        {"id":"fxrate","type":"PERCENT","label":"货品价格（外币）"},
                        fieldDisplayTypeDisabled,
                        {"id":"currency","type":"SELECT","label":"货币","source":"currency"},
                        fieldDisplayTypeDisabled,
                        {"id":"aftermodify__currency","type":"SELECT","label":"变更后货币","source":"currency"},
                        fieldDisplayTypeDisabled,
                        {"id":"fxamount","type":"CURRENCY","label":"金额（外币）"},
                        fieldDisplayTypeDisabled,
                        /* {"id":"total","type":"CURRENCY","label":"金额（交易总计）"},
                        fieldDisplayTypeDisabled, */
                        {"id":"netamount","type":"CURRENCY","label":"金额（净额）"},
                        fieldDisplayTypeDisabled,
                        {"id":"taxamount","type":"CURRENCY","label":"金额（税）"},
                        fieldDisplayTypeDisabled,
                        {"id":"expectedreceiptdate","type":"DATE","label":"预计交货日期"},
                        fieldDisplayTypeDisabled,
                        {"id":"aftermodify__expectedreceiptdate","type":"DATE","label":"变更后交期"},
                        fieldDisplayTypeDisabled,
                        {"id":"approvalstatus","type":"SELECT","label":"审核状态"},
                        fieldDisplayTypeDisabled,
                        function(sublist, field) {
                            if(!field) { return; }
                            sublist.helpText = sublistDivPage;
                            field.addSelectOption({ value: "1", text: "等待核准" });
                            field.addSelectOption({ value: "2", text: "已核准" });
                            field.addSelectOption({ value: "3", text: "已拒绝" });
                            field.updateDisplayType({
                                displayType : serverWidget.FieldDisplayType.DISABLED
                            });
                        },
                        {"id":"statusref","type":"TEXT","label":"状态"},
                        fieldDisplayTypeDisabled,
                        {"id":"datecreated","type":"DATE","label":"创建日期"},
                        fieldDisplayTypeDisabled,
                        {"id":"custbody_po_list_pur_type","type":"SELECT","label":"采购类型","source":"customlist_po_list_pur_type"},
                        fieldDisplayTypeDisabled,
                        {"id":"custcolcustfiled_po_changereason","type":"TEXT","label":"采购变更原因"},
                        fieldDisplayTypeDisabled,
                        {"id":"custbody_po_buyer","type":"SELECT","label":"专营采购员","source":"employee"},
                        fieldDisplayTypeDisabled
                    ]
                }
            },
            "pochange_comment_tab": {
                id: 'pochange_comment_tab',
                type: "TAB",
                label: '采购订单确认变更列表',
                pochange_comment_sublist: {
                    id: "pochange_confirm_sublist",
                    type: serverWidget.SublistType.INLINEEDITOR,
                    label: '采购订单确认变更列表',
                    tab: "pochange_comment_tab",
                    fields: [
                        {"id":"linenumber","type":"TEXT","label":"行号"},
                        fieldDisplayTypeDisabled,
                        {"id":"checkbox","type":"CHECKBOX","label":" "},
                        {"id":"entity","type":"SELECT","label":"供应商","source":"vendor"},
                        fieldDisplayTypeDisabled,
                        {"id":"internalid","type":"TEXT","label":"内部标识"},
                        fieldDisplayTypeDisabled,
                        {"id":"custbody_k3_po_number","type":"TEXT","label":"K3采购订单号"},
                        fieldDisplayTypeDisabled,
                        {"id":"tranid","type":"TEXT","label":"采购订单号"},
                        fieldDisplayTypeDisabled,
                        {"id":"custcol_k3_line_number","type":"TEXT","label":"K3行id"},
                        fieldDisplayTypeDisabled,
                        {"id":"line","type":"TEXT","label":"行Id"},
                        fieldDisplayTypeDisabled,
                        {"id":"item","type":"SELECT","label":"货品","source":"item"},
                        {"id":"item__salesdescription","type":"TEXT","label":"规格型号"},
                        fieldDisplayTypeDisabled,
                        {"id":"quantity","type":"TEXT","label":"采购数量"},
                        fieldDisplayTypeDisabled,
                        {"id":"aftermodify__quantity","type":"INTEGER","label":"变更后数量"},
                        {"id":"rate","type":"CURRENCY","label":"单价"},
                        fieldDisplayTypeDisabled,
                        {"id":"aftermodify__rate","type":"TEXT","label":"变更后单价"},
                        {"id":"taxcode","type":"PERCENT","label":"税率"},
                        fieldDisplayTypeDisabled,
                        {"id":"fxrate","type":"PERCENT","label":"货品价格（外币）"},
                        fieldDisplayTypeDisabled,
                        {"id":"currency","type":"SELECT","label":"货币","source":"currency"},
                        fieldDisplayTypeDisabled,
                        {"id":"aftermodify__currency","type":"SELECT","label":"变更后货币","source":"currency"},
                        {"id":"fxamount","type":"CURRENCY","label":"金额（外币）"},
                        fieldDisplayTypeDisabled,
                        /* {"id":"total","type":"CURRENCY","label":"金额（交易总计）"},
                        fieldDisplayTypeDisabled, */
                        {"id":"netamount","type":"CURRENCY","label":"金额（净额）"},
                        fieldDisplayTypeDisabled,
                        {"id":"taxamount","type":"CURRENCY","label":"金额（税）"},
                        fieldDisplayTypeDisabled,
                        {"id":"expectedreceiptdate","type":"DATE","label":"预计交货日期"},
                        fieldDisplayTypeDisabled,
                        {"id":"aftermodify__expectedreceiptdate","type":"DATE","label":"变更后交期"},
                        {"id":"approvalstatus","type":"SELECT","label":"审核状态"},
                        fieldDisplayTypeDisabled,
                        function(sublist, field) {
                            if(!field) { return; }
                            sublist.helpText = sublistDivPage;
                            field.addSelectOption({ value: "1", text: "等待核准" });
                            field.addSelectOption({ value: "2", text: "已核准" });
                            field.addSelectOption({ value: "3", text: "已拒绝" });
                            field.updateDisplayType({
                                displayType : serverWidget.FieldDisplayType.DISABLED
                            });
                        },
                        {"id":"statusref","type":"TEXT","label":"状态"},
                        fieldDisplayTypeDisabled,
                        {"id":"datecreated","type":"DATE","label":"创建日期"},
                        fieldDisplayTypeDisabled,
                        {"id":"custbody_po_list_pur_type","type":"SELECT","label":"采购类型","source":"customlist_po_list_pur_type"},
                        {"id":"custcolcustfiled_po_changereason","type":"TEXT","label":"采购变更原因"},
                        {"id":"custbody_po_buyer","type":"SELECT","label":"专营采购员","source":"employee"},
                        fieldDisplayTypeDisabled,
                    ]
                }
            }
        };
    }

    function fieldDisplayTypeDisabled(sublist, field) {
        field.updateDisplayType({
            displayType : serverWidget.FieldDisplayType.DISABLED
        });
    }

    function createPageFields(form, recFields, field) {
        for(var fieldId in recFields) {
            var fieldInfo = recFields[fieldId];
            if(typeof fieldInfo == "function") {
                fieldInfo(form, field);
            } else if(fieldInfo.type == 'TAB') {
                field = form.addTab({
                    id: fieldInfo.id,
                    label: fieldInfo.label
                });
                for(var sublistId in fieldInfo) {
                    if(typeof fieldInfo[sublistId] != "object") { continue; }
                    var sublistFields = fieldInfo[sublistId].fields;
                    delete fieldInfo[sublistId].fields;
                    field = form.addSublist(fieldInfo[sublistId]);
                    createPageFields(field, sublistFields, field);
                }
            } else {
                field = form.addField(fieldInfo);
            }
        }
    }

    return {
        onRequest: onRequest
    };
});
/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget'], function (serverWidget) {
    function onRequest(context) {
        if (context.request.method === 'GET') {//直接访问页面是GET方式
            // 创建表单
            var form = serverWidget.createForm({
                title: 'BOM Single Grade Contrast'
            });
            form.clientScriptModulePath = "../cs/cs_bom_single_grade_contrast.js";
            //创建下拉字段，数据源自系统数据
            var comparison = form.addField({
                id: 'comparison',
                type: serverWidget.FieldType.SELECT,
                label: '对比方式'
            });
            comparison.addSelectOption({
                value : '0',
                text : '单阶'
            });
            comparison.addSelectOption({
                value : '1',
                text : '多阶'
            });
            comparison.updateBreakType({
                breakType : serverWidget.FieldBreakType.STARTROW
            });
            var subsidiary1 = form.addField({
                id: 'subsidiaryfield1',
                type: serverWidget.FieldType.SELECT,
                label: '公司1',
                source : 'subsidiary'
            });
            subsidiary1.isMandatory = true;
            //创建下拉字段，自定义选项
            var bomcode1 = form.addField({
                id: 'bomcode1',
                type: serverWidget.FieldType.SELECT,
                label: 'BOM1代码',
                source : 'bom'
            });
            bomcode1.isMandatory = true;
            var bomrevision1 = form.addField({
                id: 'bomrevision1',
                type: serverWidget.FieldType.SELECT,
                label: 'BOM1版本号'
            });
            bomrevision1.addSelectOption({
                value : '0',
                text : ''
            });
            bomrevision1.isMandatory = true;
            var status1 = form.addField({
                id: 'bomstatus1',
                type: serverWidget.FieldType.TEXT,
                label: 'BOM1状态'
            });
            status1.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            var comparison1 = form.addField({
                id: 'comparison1',
                type: serverWidget.FieldType.TEXT,
                label: ' '
            });
            comparison1.updateBreakType({
                breakType : serverWidget.FieldBreakType.STARTROW
            });
            var subsidiary2 = form.addField({
                id: 'subsidiaryfield2',
                type: serverWidget.FieldType.SELECT,
                label: '公司2',
                source : 'subsidiary'
            });
            subsidiary2.isMandatory = true;
            var bomcode2 = form.addField({
                id: 'bomcode2',
                type: serverWidget.FieldType.SELECT,
                label: 'BOM2代码',
                source : 'bom'
            });
            bomcode2.isMandatory = true;
            var bomrevision2 = form.addField({
                id: 'bomrevision2',
                type: serverWidget.FieldType.SELECT,
                label: 'BOM2版本号'
            });
            bomrevision2.addSelectOption({
                value : '0',
                text : ''
            });
            bomrevision2.isMandatory = true;
            var status2 = form.addField({
                id: 'bomstatus2',
                type: serverWidget.FieldType.TEXT,
                label: 'BOM2状态'
            });
            status2.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            //普通按钮
            form.addButton({
                label : 'Search',
                id : 'cstm_page_search_btn',
                functionName: "searchButtonEvent"
            });
            //创建tab
            var diffAnalysisTab = form.addTab({
                id: 'bom_differenc_analysis_tab',
                label: '单阶BOM差异分析'
            });
            // 创建sublist
            var sublist = form.addSublist({
                id: 'bom_differenc_analysis_sbulist',
                type: serverWidget.SublistType.STATICLIST,
                label: '单阶BOM差异分析',
                tab: 'bom_differenc_analysis_tab'
            });
            sublist.addField({
                id: 'item',
                type: serverWidget.FieldType.TEXT,
                label: '物料代码'
            });
            sublist.addField({
                id: 'custrecord_display_name',
                type: serverWidget.FieldType.TEXT,
                label: '物料名称'
            });
            sublist.addField({
                id: 'custrecord_version_subitem_specification',
                type: serverWidget.FieldType.TEXT,
                label: '规格型号'
            });
            sublist.addField({
                id: 'units',
                type: serverWidget.FieldType.TEXT,
                label: '计量单位'
            });
            sublist.addField({
                id: 'quantity1',
                type: serverWidget.FieldType.FLOAT,
                label: 'BOM1用量'
            });
            sublist.addField({
                id: 'custrecord_version_location_number1',
                type: serverWidget.FieldType.TEXT,
                label: 'BOM1位号'
            });
            sublist.addField({
                id: 'quantity2',
                type: serverWidget.FieldType.FLOAT,
                label: 'BOM2用量'
            });
            sublist.addField({
                id: 'custrecord_version_location_number2',
                type: serverWidget.FieldType.TEXT,
                label: 'BOM2位号'
            });
            var notesTab = form.addTab({
                id: 'custpage_notes',
                label: '注释'
            });
            var sublists = form.addSublist({
                id: 'bom_notes',
                type: serverWidget.SublistType.STATICLIST,
                label: '注释',
                tab: 'custpage_notes'
            });
            sublists.helpText = 
            '<script>\
                window.onload=function(){\
                    page_init();\
                    var style = document.createElement("style");\
                    style.innerHTML = "#bom_differenc_analysis_sbulist_main_form,#bom_notes_main_form{display:none;}\
                    #inpt_subsidiaryfield1,#inpt_bomrevision12,#inpt_bomrevision23{width:420px !important;}\
                    .listheader{text-align:left;}.listheadersortup,.listheadersortdown{display:none;}#bom_differenc_analysis_sbulist_splits tbody tr td.uir-list-row-cell{padding-left:15px !important;}";\
                    document.head.append(style);\
                    var listHeadTds = document.querySelectorAll("#bom_differenc_analysis_sbulistheader td");\
                    for(var i = 0; i < listHeadTds.length; i++){\
                        listHeadTds[i].setAttribute("onclick", "");\
                        listHeadTds[i].style.cursor = "default";\
                    }\
                };\
            </script>';
            sublists.addField({
                id: 'bom_notes_item_code',
                type: serverWidget.FieldType.TEXT,
                label: 'Note'
            });
            //输出这个表单到用户的浏览器
            context.response.writePage(form);
        } else {//当用户访问页面，填写了数据，并提交，数据会提交到当前Suitelet，只不过是以POST的方式，所以在这里处理提交后的逻辑
            //获取用户填写的字段的值
        }
    }

    return {
        onRequest: onRequest
    };
});
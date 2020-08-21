/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description  此程序用于发票工作台页面相关逻辑
 */ 
define([
    'N/currentRecord',
    'N/ui/dialog',
    'N/search',
    'N/url',
    '../../app/app_ui_component_client.js'
], function (
    currentRecord_N,
    dialog,
    search,
    url,
    uiComponent
) {
        var sublistId = 'custpage_paged_sublist';
        var checkBoxId = 'custpage_paged_checked';
        var pageIdId = 'custpage_pageid';
        var currentRecord;

        function viewVb(){
            var confirmUrl = uiComponent.getCache('otherInfo').viewBillUrl;
            window.location.assign(confirmUrl);
        }

        //entry points
        function pageInit(context) {
            currentRecord = context.currentRecord;
            processTotalLine(context);
            processCheckTotalLine(context);
            processSublistLinekFields(context);
            var callFunc = window.custpage_paged_sublistMarkAll;
            custpage_paged_sublistMarkAll = function() {
                callFunc.apply(this, arguments);
                processTotalLine(context);
                processCheckTotalLine(context);
            };
            debugger
            var filterStartIndex = location.href.indexOf("&filters=");
            var filters;
            if(filterStartIndex != -1) {
                var filterEndIndex = location.href.indexOf("&", filterStartIndex + 9);
                filters = location.href.slice(filterStartIndex + 9, filterEndIndex == -1? location.href.length: filterEndIndex);
                try{
                    filters = JSON.parse(decodeURIComponent(filters));
                } catch(e){
                    filters = undefined;
                }
            }
            window.cstmFilterExpExtendInstance = new FilterExpression(filters);
            window.cstmFilterExpExtendInstance.create(document.querySelector("#detail_table_lay").parentElement);
            window.cstmFilterExpExtendInstance.setFilters(filters);
            //console.log(search.load({id: "customsearchrhys_search_vomversions"}));
        }

        function saveRecord(context) {
            var suiteletPage = context.currentRecord;
            var lineCount = suiteletPage.getLineCount({
                sublistId: sublistId
            });
            var totalSelected = 0;

            for (var i = 0; i < lineCount; i++) {
                var isChecked = suiteletPage.getSublistValue({
                    sublistId: sublistId,
                    fieldId: checkBoxId,
                    line: i
                });
                if (isChecked) {
                    totalSelected++;
                }
            }

            if (!totalSelected) {
                dialog.alert({
                    title: '错误',
                    message: '您没有勾选任何条目'
                });
                return false;
            }else{
                return window.confirm('确定提交所选出入库单据吗？');
            }

            return true;
        }

        function fieldChanged(context) {
            if (context.fieldId == pageIdId) {//先检查是否为页码跳转
                var pageRec = context.currentRecord;
                var pageId = pageRec.getValue({
                    fieldId: pageIdId
                });
                uiComponent.goToPage(pageId);
                processTotalLine(context);
                processCheckTotalLine(context);
            }
            if(context.fieldId == checkBoxId) {
                processTotalLine(context);
                processCheckTotalLine(context);
            }
        }

        function processTotalLine(context) {
            var lineCount = currentRecord.getLineCount({
                sublistId : sublistId
            });
            var listLineId = '#custpage_paged_sublistrow' + (lineCount - 1);
            var $ = jQuery;
            $(listLineId + '>td').each(function(index, element){
                var _self = $(element);
                var html = index === 0 ? '合计' : _self.html();
                html = '<span style="font-weight:bold;">' + html + '</span>';
                _self.html(html);
            });
        }

        function processCheckTotalLine(context) {
            var lineCount = currentRecord.getLineCount({
                sublistId : sublistId
            });
            var totalLine = document.querySelector('#custpage_paged_sublistrow' + (lineCount - 1)) || document.querySelector('#custpage_paged_sublistrow-4');
            if(!totalLine) { return; }
            var checkLine = document.querySelector("#custpage_paged_sublistrow-3") || totalLine.cloneNode(true);
            var total = getTotalChckedLine(context);
            var listCells = checkLine.querySelectorAll(".uir-list-row-cell");
            checkLine.id = id;
            listCells.forEach(function(item, index) {
                item.innerHTML = '<span style="font-weight:bold;">' + (index? "": "勾选合计") + '</span>';
            });
            for(var index in total) {
                var value = total[index].toFixed(2) + "", coreIndex = value.indexOf('.'), _value = "";
                coreIndex = coreIndex == -1? value.length - 1: coreIndex;
                for(var i = 0, max = value[0] == '-'? 4: 3; i < coreIndex && coreIndex > max; i++) {
                    _value += ((coreIndex - i - 2) % 4 == 1? ",": "") + value[i];
                }
                _value += (coreIndex > max? value.slice(coreIndex): value);
                listCells[index].innerHTML = '<span style="font-weight:bold;">' + _value + '</span>';
            }
            var sublistNode = document.querySelector("#custpage_paged_sublist_splits");
            checkLine.id = "custpage_paged_sublistrow-3";
            totalLine.id = "custpage_paged_sublistrow-4";
            sublistNode.append(checkLine);
            sublistNode.append(totalLine);
            if(jQuery("#custpage_paged_sublistrow-1").length) {
                jQuery("#custpage_paged_sublistrow-1").remove();
                jQuery("#custpage_paged_sublistrow-2").remove();
            }
            var headerRow = jQuery("#custpage_paged_sublist_splits tbody>:first-child");
            totalLine = totalLine.cloneNode(true);
            totalLine.id = "custpage_paged_sublistrow-2";
            checkLine = checkLine.cloneNode(true);
            checkLine.id = "custpage_paged_sublistrow-1";
            $(headerRow).before(totalLine);
            $(headerRow).before(checkLine);
        }

        function processSublistLinekFields(context) {
            var rowsNode = document.querySelectorAll("#" + sublistId + "_splits tbody tr[id*='custpage_paged_sublistrow']");
            for(var i = 2; i < rowsNode.length; i++) {
                var childNodes = rowsNode[i].childNodes, lastField = childNodes.length - 2;
                if((childNodes[6].innerHTML || "").trim()) {
                    childNodes[6].innerHTML = "<a class='dottedlink' recordType='vendor' onmousedown='linkFieldMainnameMousedownEvent(this)' href='www' row='" + (i - 2) + "' fieldId='custpage_paged_mainname'>" + childNodes[6].innerHTML + "</a>";
                }
                if((childNodes[lastField].innerHTML || "").trim()) {
                    childNodes[lastField].innerHTML = "<a class='dottedlink' recordType='customrecord_reconciliation' onmousedown='linkFieldMainnameMousedownEvent(this)' href='www' row='" + (i - 2) + "' fieldId='custpage_paged_compare_order'>" + childNodes[lastField].innerHTML + "</a>";
                }
            }
            window.linkFieldMainnameMousedownEvent = function(targetNode) {
                var recordId = currentRecord.getSublistValue({
                    sublistId: sublistId,
                    fieldId: targetNode.getAttribute("fieldId"),
                    line: +targetNode.getAttribute("row")
                });
                targetNode.setAttribute("href", url.resolveRecord({recordType: targetNode.getAttribute("recordType"), recordId: recordId}));
            }
        }

        function getTotalChckedLine(context) {
            var lineCount = currentRecord.getLineCount({
                sublistId : sublistId
            });
            var countField = getColumnFields();
            var checkTotalObj = {};
            var skipFieldIds = ["custpage_paged_exchange_rate", "custpage_paged_compare_order_date"];
            for (var i = 0; i < lineCount; i++) {
                var isChecked = currentRecord.getSublistValue({
                    sublistId: sublistId,
                    fieldId: checkBoxId,
                    line: i
                });
                if (!isChecked) { continue; }
                for(var j in countField) {
                    var fieldId = countField[j];
                    var fieldValue = currentRecord.getSublistValue({
                        sublistId: sublistId,
                        fieldId: fieldId,
                        line: i
                    });
                    if(typeof fieldValue == "number" && skipFieldIds.indexOf(fieldId) == -1) {
                        checkTotalObj[j] = fieldValue + (checkTotalObj[j] || 0);
                    }
                }
            }
            return checkTotalObj;
        }

        function getColumnFields(col) {
            var headerNode = document.querySelectorAll("#custpage_paged_sublistheader>td");
            var columns = {};
            for(var i = 0; i < headerNode.length; i++) {
                var text = headerNode[col !== undefined? col: i].getAttribute("onclick") || "";
                if(!text) { continue; }
                var reg = new RegExp("\([^\)]*\)", "gmi");
                text = (reg.exec(text)[0]).split(",")[5];
                text && (columns[i] = text.slice(1, -1));
                if(col !== undefined) { break; }
            }
            return columns;
        }

        function FilterExpression() {
            var _FilterExpObj = {}, _FilterExpFunc = function() {}, filters = {}, fields = getFieldsInfo();
            _FilterExpObj.create = function (containsNode) {
                var expContains = document.createElement("div"),
                    expContainsWrapper = expContains.cloneNode(true),
                    expTopMenu = expContains.cloneNode(true);
                expContains.id = "ns_filters_expression_contains";
                expContainsWrapper.id = "ns_filters_expression_wrapper";
                expTopMenu.id = "ns_filters_expression_topmenu";
                expTopMenu.className = "bgsubtabbar fgroup_title";
                expTopMenu.style = "padding:3px;color:#5A6F8F; border-bottom:1px solid #CCC; font-weight:600; white-space:nowrap; margin:0 0 2px 0";
                expContains.appendChild(expTopMenu);
                expContains.appendChild(expContainsWrapper);
                expContainsWrapper.appendChild(containsNode.querySelector(".uir-outside-fields-table"));
                expContainsWrapper.appendChild(createFiedsSelectNode(fields));
                expTopMenu.innerHTML = "<div onclick='cstmDfnFiltersExpandClickEvent(this)'><span>-</span></div><div style='margin-left:5px;'><span>过滤条件</span></div>";
                containsNode.innerHTML = "";
                containsNode.appendChild(expContains);
                return expContains;
            };
            _FilterExpObj.setFilters = function(filters) {
                if(!Array.isArray(filters)) { return; }
                for(var i = 0; i < filters.length; i++) {
                    var selNode = document.querySelector("#cstm_schdfn_select_fields select");
                    if(fields[filters[i].name] == undefined) { continue; }
                    selNode.value = filters[i].name;
                    cstmDfnSelectFieldChangeEvent(selNode, filters[i].operator, filters[i].values);
                }
            };
            Object.defineProperty(_FilterExpObj, "filters", {
                get: function() {
                    var _NsFilters = [];
                    for(var index in filters) {
                        _NsFilters.push(filters[index]);
                    }
                    return _NsFilters;
                },
                set: function(value) {
                    if(typeof value !== "object") { return; }
                    for(var index in value) {
                        var item = value[index];
                        if((item.name == undefined || item.name == "") || !item.operator || (item.values == undefined || item.values == "")) { continue; }
                        filters[item.name] = item;
                    }
                }
            });
            Object.defineProperty(_FilterExpObj, "fields", {
                get: function() {
                    var _NsFields = [];
                    for(var index in fields) {
                        _NsFields.push(fields[index]);
                    }
                    return _NsFields;
                },
                set: function(value) {
                    if(typeof value !== "object") { return; }
                    for(var index in value) {
                        var item = value[index];
                        if((item.name == undefined || item.name == "") || (item.type == undefined || item.type == "")) { continue; }
                        fields[item.name] = item;
                    }
                }
            });
            
            setTimeout(function() {
                FilterExpression.prototype.searchOperators = searchOperators;
            }, 0);
            insertStyles();
            window.cstmDfnSelectFieldChangeEvent = cstmDfnSelectFieldChangeEvent;
            window.cstmDfnSelectOperatorNameEvent = cstmDfnSelectOperatorNameEvent;
            window.cstmDfnInputFilterValuesEvent = cstmDfnInputFilterValuesEvent;
            window.cstmDfnFiltersExpandClickEvent = cstmDfnFiltersExpandClickEvent;
            _FilterExpObj.filters = filters;
            return _FilterExpObj;

            function searchOperators (type) {
                var STR1 = ",list,record", STR2 = ",currency,decimalnumber,timeofday,float", STR3 = ",date", STR4 = ",checkbox", STR5 = ",document,image", 
                    STR6 = ",emailaddress,free-formtext,longtext,password,percent,phonenumber,richtext,textarea,text", STR7 = ",multiselect,select";
                var schOps = {
                    after: STR3,
                    allof: STR7,
                    any: STR2 + STR6,
                    anyof: STR1 + STR5 + STR7,
                    before: STR3,
                    between: STR2,
                    contains: STR6,
                    doesnotcontain: STR6,
                    doesnotstartwith: STR6,
                    equalto: STR2 + STR4 + STR6,
                    greaterthan: STR2,
                    greaterthanorequalto: STR2,
                    haskeywords: STR6,
                    is: STR4 + STR6,
                    isempty: STR2 + STR3 + STR6,
                    isnot: STR6,
                    isnotempty: STR2 + STR3 + STR6,
                    lessthan: STR2,
                    lessthanorequalto: STR2,
                    noneof: STR1 + STR5 + STR7,
                    notafter: STR3,
                    notallof: STR7,
                    notbefore: STR3,
                    notbetween: STR2,
                    notequalto: STR2,
                    notgreaterthan: STR2,
                    notgreaterthanorequalto: STR2,
                    notlessthan: STR2,
                    notlessthanorequalto: STR2,
                    noton: STR3,
                    notonorafter: STR3,
                    notonorbefore: STR3,
                    notwithin: STR3,
                    on: STR3,
                    onorafter: STR3,
                    onorbefore: STR3,
                    startswith: STR6,
                    within: STR3
                };
                if(type) {
                    type = type.toLowerCase();
                    if(schOps[type]) {
                        schOps = schOps[type];
                    } else {
                        var _schOps = [];
                        for(var opName in schOps) {
                            schOps[opName].indexOf("," + type) > -1 && _schOps.push(opName);
                        }
                        schOps = _schOps;
                    }
                }
                return schOps;
            }

            function transcationOpertor(opName) {
                return {
                    after: "值之后",
                    allof: "所有值相等",
                    any: "包含在某项值",
                    anyof: "与某项值相等",
                    before: "值之前",
                    between: "在两个值之间",
                    contains: "包含值",
                    doesnotcontain: "不包含",
                    doesnotstartwith: "不与值开头",
                    equalto: "相等",
                    greaterthan: "大于",
                    greaterthanorequalto: "大于等于",
                    haskeywords: "包含值",
                    is: "等于",
                    isempty: "空值",
                    isnot: "不是该值",
                    isnotempty: "非空",
                    lessthan: "小于",
                    lessthanorequalto: "小于或等于",
                    noneof: "不包含所有值",
                    notafter: "值之前",
                    notallof: "不包含所有值",
                    notbefore: "值之后",
                    notbetween: "不在两值之间",
                    notequalto: "不等于",
                    notgreaterthan: "不大于",
                    notgreaterthanorequalto: "不大于等于",
                    notlessthan: "不小于",
                    notlessthanorequalto: "不小于等于",
                    noton: "不在值中间",
                    notonorafter: "值在开头",
                    notonorbefore: "值在结尾",
                    notwithin: "不在两者之间",
                    on: "值在中间",
                    onorafter: "值不在开头",
                    onorbefore: "值不在结尾",
                    startswith: "值开头",
                    within: "在两值之间"
                }[opName] || "";
            }

            function createFiedsSelectNode(fieldsInfo) {
                var node = "<div><div><span>请选择字段</span></div><div><select onchange='cstmDfnSelectFieldChangeEvent(this)'>";
                var tmpDiv = document.createElement("div");
                tmpDiv.id = "cstm_schdfn_select_fields";
                for(var i in fieldsInfo) {
                    var item = fieldsInfo[i];
                    node += "<option value='" + item.fieldId + "' text='" + item.name + "'>" + item.name + "</option>";
                }
                node += "</select></div></div>";
                tmpDiv.innerHTML = node;
                return tmpDiv;
            }

            function cstmDfnSelectFieldChangeEvent(selectNode, opValue, values) {
                var value = selectNode.value,
                    fieldInfo = fields[value],
                    opNames = fieldInfo && searchOperators(fieldInfo.type),
                    tmpDivHtml = "",
                    selGradeParentNode = selectNode.parentNode.parentNode.parentNode,
                    tmpDiv0 = document.createElement("div"),
                    tmpDiv = document.createElement("div"),
                    oldvalue = selectNode.getAttribute("oldValue");

                if(value == "" || oldvalue != value) {
                    if(value == "") {
                        removeFilter(oldvalue);
                        selGradeParentNode.parentNode.lastChild.remove();
                        selGradeParentNode.parentNode.appendChild(createFiedsSelectNode(fields));
                        return selGradeParentNode.remove();
                    } else {
                        var existItem = document.querySelector("div[id='cstm_schdfn_select_fields_" + value + "']");
                        if(existItem) {
                            selectNode.value = oldvalue;
                            var existItemSelectNode = existItem.firstChild.querySelector("select");
                            return existItemSelectNode.focus();
                        } else {
                            removeFilter(oldvalue);
                        }
                    }
                }
                
                filters[value] = { name: fieldInfo.fieldId, join: fieldInfo.source, values: [] };
                selGradeParentNode.querySelector("span").innerHTML = fieldInfo.name;
                tmpDivHtml = "<div><span>操作符</span></div><div><select onchange='cstmDfnSelectOperatorNameEvent(this)'>";
                for(var opName in opNames) {
                    tmpDivHtml += "<option value='" + opNames[opName] + "'>" + opNames[opName] + "</option>"
                }
                tmpDivHtml += "</select></div>";
                tmpDiv.innerHTML = tmpDivHtml;
                tmpDiv0.appendChild(selGradeParentNode.firstChild.firstChild);
                tmpDiv0.appendChild(selGradeParentNode.firstChild.firstChild);
                selGradeParentNode.id = "cstm_schdfn_select_fields_" + fieldInfo.fieldId;
                selGradeParentNode.innerHTML = "";
                selGradeParentNode.appendChild(tmpDiv0);
                selGradeParentNode.appendChild(tmpDiv);
                if(selGradeParentNode.parentNode.lastChild.id == "cstm_schdfn_select_fields") {
                    selGradeParentNode.parentNode.lastChild.remove();
                }
                selGradeParentNode.parentNode.appendChild(createFiedsSelectNode(fields));
                selectNode.setAttribute("oldvalue", value);
                var opNode = tmpDiv.querySelector("select");
                opValue && (opNode.value = opValue);
                cstmDfnSelectOperatorNameEvent(opNode, values);
            }

            function cstmDfnSelectOperatorNameEvent(selectNode, values) {
                var value = findFiltersValue(selectNode),
                    selGradeParentNode = selectNode.parentNode.parentNode.parentNode,
                    tmpDiv = document.createElement("div");
                filters[value].operator = selectNode.value;
                values = Array.isArray(values)? values: [];
                if(/(after)|(before)|(between)|(within)/gmi.test(selectNode.value)) {
                    tmpDiv.className = "cstm_schdfn_select_op_values";
                    tmpDiv.innerHTML = "<div><div><span>从</span></div><div>" + createHtmlControlByFieldType(fields[value], values[0]) + "\
                    </div></div><div><div><span>至</span></div><div>" + createHtmlControlByFieldType(fields[value], values[1]) + "</div></div>";
                } else {
                    tmpDiv.innerHTML = "<div><div><span>值</span></div><div>" + createHtmlControlByFieldType(fields[value], values.join(';')) + "</div></div>";
                }
                if(selGradeParentNode.childNodes.length > 2) {
                    selGradeParentNode.lastChild.remove();
                }
                selGradeParentNode.appendChild(tmpDiv);
            }

            function cstmDfnInputFilterValuesEvent(inputNode, controlType) {
                var filterInfo = filters[findFiltersValue(inputNode)],
                    selGradeParentNode = inputNode.parentNode.parentNode.parentNode,
                    inputNodes = selGradeParentNode.querySelectorAll("input,select,textarea") || [];
                filterInfo.values = [];
                for(var index = 0; index < inputNodes.length; index++) {
                    var node = inputNodes[index],
                        validValues = [];
                        values = (node.value || "").split(/[,;|]/) || [];
                    for(var i = 0; i < values.length; i++) {
                        var tmpValue = "";
                        if(values[i] == "") { continue; }
                        try {
                            switch(controlType) {
                                case "decimalnumber":
                                case "float":
                                    tmpValue = parseFloat(values[i]);
                                    if(isNaN(tmpValue)) { throw "Error"; }
                                    break;
                                case "percent":
                                    tmpValue = parseFloat(values[i]);
                                    if(isNaN(tmpValue)) { throw "Error"; }
                                    if(/%/g.test(values[i])) { tmpValue += "%"; }
                                    else if(-1 <= values[i] && values[i] <= 1) { tmpValue = (tmpValue * 100) + "%"; }
                                    else { tmpValue = (tmpValue * 100) + "%"; }
                                    break;
                                case "emailaddress":
                                    tmpValue = /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.exec(values[i]);
                                    if(!tmpValue) { throw "Error"; }
                                    tmpValue = tmpValue[tmpValue.index];
                                    break;
                                case "phonenumber":
                                    tmpValue = /^(\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,14}$/.exec(values[i]);
                                    if(!tmpValue) { throw "Error"; }
                                    tmpValue = tmpValue[tmpValue.index];
                                    break;
                                default:
                                    tmpValue = values[i];
                            }
                            validValues.push(tmpValue + "");
                        } catch(e) {
                            node.focus();
                            alert("Invalid " + controlType + " format " + values[i]);
                        }
                    }
                    if(validValues.length) {
                        node.value = validValues + "";
                        filterInfo.values = filterInfo.values.concat(validValues);
                    } else {
                        node.value = "";
                        node.focus();
                    }
                }
            }

            function cstmDfnFiltersExpandClickEvent(clickNode) {
                var displayValue = clickNode.parentNode.parentNode.lastChild.style.display;
                clickNode.parentNode.parentNode.lastChild.style.display = displayValue? "": "none";
                clickNode.firstChild.innerText = displayValue? "-": "+";
            }

            function createHtmlControlByFieldType(filterInfo, value) {
                var typeControl = "";
                var type = filterInfo.type;
                value = value == undefined? "": value;
                switch(type) {
                    case "decimalnumber":
                    case "free-formtext":
                    case "percent":
                    case "password":
                    case "emailaddress":
                    case "phonenumber":
                    case "currency":
                    case "checkbox":
                    case "text":
                    case "float":
                    case "select":
                        var inptType = { "password": "password", "checkbox": "checkbox", "image": "file" };
                        typeControl = "<input type=" + (inptType[type] || "text") + " value='" + value +"' onchange='cstmDfnInputFilterValuesEvent(this, \"" + type + "\")' />";
                        break;
                    case "longtext":
                    case "textarea":
                        typeControl = "<textarea value='" + value + "' onchange='cstmDfnInputFilterValuesEvent(this, \"" + type + "\")'></textarea>";
                        break;
                    case "multiselect":
                        typeControl = "<select onchange='cstmDfnInputFilterValuesEvent(this, \"" + type + "\")'><option value=' '> </option></select>";
                        break;
                    case "date":
                        "<input type=" + (inptType[type] || "text") + " value='" + value + "' onchange='cstmDfnInputFilterValuesEvent(this, \"" + type + "\")' />"
                        break;
                    case "timeofday":
                        break;
                    case "image":
                        typeControl = "<img src='' alert='Loading.....' />";
                        break;
                }
                return typeControl;
            }

            function removeFilter(value) {
                if(!value || !filters[value]) { return; }
                delete filters[value];
            }

            function findFiltersValue(node) {
                var value = "", id = "";
                while(node) {
                    id = node.id || "";
                    if(id.indexOf("cstm_schdfn_select_fields_") == 0) {
                        value = node.firstChild.querySelector("select").value;
                        break;
                    }
                    node = node.parentNode;
                }
                return value;
            }
            
            function insertStyles() {
                var styleNode = document.querySelector("#cstm_filter_expression_styles") || document.createElement("style");
                styleNode.id = "cstm_filter_expression_styles";
                styleNode.innerHTML += "#ns_filters_expression_contains{\
                    font-size:13px;\
                }\
                #ns_filters_expression_wrapper>div{\
                    overflow: hidden;\
                }\
                #ns_filters_expression_wrapper>div>div{\
                    float: left;\
                    margin-left: 38px;\
                    padding: 5px 0px;\
                }\
                #ns_filters_expression_wrapper>div>:first-child{\
                    margin-left: 0px;\
                }\
                .cstm_schdfn_select_op_values{\
                    overflow: hidden;\
                }\
                .cstm_schdfn_select_op_values>div{\
                    float: left;\
                }\
                .cstm_schdfn_select_op_values>div:not(:first-child){\
                    margin-left: 30px;\
                }\
                #ns_filters_expression_wrapper select, #ns_filters_expression_wrapper input{\
                    width: 327px;\
                    font-weight: normal;\
                    font-size: 13px;\
                    background-color: rgb(255, 255, 255);\
                    color: #262626;\
                    border: 1px solid #cccccc !important;\
                    padding: 3px;\
                    height: 25px;\
                }\
                #ns_filters_expression_wrapper select>option{\
                    font-weight: normal;\
                    font-size: 13px;\
                    background-color: rgb(255, 255, 255);\
                }\
                #ns_filters_expression_topmenu {\
                    height: 30px;\
                    line-height: 30px;\
                    overflow: hidden;\
                }\
                #ns_filters_expression_topmenu>div {\
                    float: left;\
                    height: 100%;\
                }\
                #ns_filters_expression_topmenu>:first-child{\
                    width: 15px;\
                    height: 15px;\
                    border: 1px solid black;\
                    line-height: 10px;\
                    text-align: center;\
                    margin-top: 7px;\
                    margin-left: 5px;\
                    cursor: pointer;\
                }\
                #ns_filters_expression_wrapper span{\
                    font-size: 14px;\
                    font-weight: normal !important;\
                    color: #6f6f6f !important;\
                    text-transform: uppercase;\
                }";
                document.body.appendChild(styleNode);
            }
            
            function getFieldsInfo() {
                var drpValues = [
                                 { value: "", text: ""},
                                 { value: "custpage_paged_compare_order", text: "对账单号", type: "select" },
                                 { value: "custpage_paged_fxamount", text: "总金额", type: "float" },
                                 { value: "custpage_paged_amt_with_tax", text: "含税总额", type: "float" },
                                 { value: "custpage_paged_amt_tax_compare", text: "含税对账总额", type: "float" },
                                 { value: "custpage_paged_amt_base_tax_compare", text: "本位币含税对账总额", type: "float" }
                                ];
                var fields = {};
                for(var index in drpValues) {
                    var info = drpValues[index];
                    fields[info.value] = { name: info.text, fieldId: info.value, type: info.type, source: info.source };
                }
                return fields;
            }
        }  

        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            fieldChanged: fieldChanged,
            goToPage: uiComponent.goToPage,
            searchResults: uiComponent.searchResults,
            viewVb : viewVb
        }
    });

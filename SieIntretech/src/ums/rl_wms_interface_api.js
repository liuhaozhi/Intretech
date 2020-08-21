/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/file', '../dao/dao_search_common.js', 'N/search'], function (file, searchCommon, search) {
    function get (reqParam){
        return JSON.stringify(post(reqParam));
    }

    function post(postParam) {
        var rspMsg = {};
        try{
            keyMap = getSchJsonText(postParam.specname);
            keyMap = JSON.parse(keyMap);//postParam.filters
            for(var key in keyMap) {
                var values = keyMap[key];
                var schId = values["NS_SYSTEM_LOAD_SEARCH_ID"];
                values = concatFilters(values, postParam.filters);
                rspMsg.data = createSearch(values).doSeach(schId) || [];
                rspMsg.datatype = key;
                rspMsg.nsrecordname = schId? (search.load({ id: schId }).searchType): values["NS_SYSTEM_DEFAULT_TABLE_NAME"];
            }
            rspMsg.status = "S";
            rspMsg.message = "";
            postParam.rows *= 1;
            if(postParam.rows > 0 && rspMsg.data.length > postParam.rows) {
                rspMsg.data = rspMsg.data.slice(0, postParam.rows);
            }
        } catch(ex) {
            rspMsg.status = 'E';
            rspMsg.message = '查询时发生错误, 错误提示:' + ex.message;
            log.debug('e',rspMsg.message+ex.stack);
        }
        return rspMsg
    }

    function concatFilters(schObj, filtersText) {
        if(!filtersText) { return schObj; }
        try {
            log.debug('filtersText', filtersText);
            var filters = typeof filtersText == "string"? JSON.parse(filtersText): filtersText;
            if(!filters.length) { return schObj; }
            schObj.filters = schObj.filters || [];
            var bomSch = search.create({
                type: "bom",
                columns: ["internalid"],
                filters: filters
            });
            schObj.filters = schObj.filters.concat(bomSch.filters);
        } catch (e) { log.debug('Error', e); }
        return schObj;
    }

    function getSchJsonText(name) {
        if(name == undefined) {
            throw { message: "Param name cannot be null!" };
        }
        var specSch = search.create({
            type: "customrecord_intergration_spec_define",
            columns: ["custrecord_wms_table_name", "custrecord_intergration_spec_dfn_ns_tbl", "custrecord_intergration_spec_dfn_json", "custrecord_intergration_spec_dfn_savesch"],
            filters: [ "name", "is", name ]
        }), jsonText = "";
        
        specSch.run().each(function (result) {
            jsonText = result.getAllValues()["custrecord_intergration_spec_dfn_json"];
        });
        
        return jsonText;
    }

    function findType(value, callback) {
        var type = Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
        callback && callback(type, value);
        return type;
    }

    function createSearch(wmsTableObject) {
        var nsWmsMap = {},
            resultSchItem = { 
                type: wmsTableObject["NS_SYSTEM_DEFAULT_TABLE_NAME"],
                columns: []
            },
            skipFieldids = ["NS_SYSTEM_LOAD_SEARCH_ID", "NS_SYSTEM_DEFAULT_TABLE_NAME"];
        if(findType(wmsTableObject.filters) == "array") {
            resultSchItem.filters = wmsTableObject.filters;
            delete wmsTableObject.filters;
        }
        for(fieldId in wmsTableObject) {
            if(skipFieldids.indexOf(fieldId) > -1) { continue; }
            var field = wmsTableObject[fieldId];
            if(findType(field) == "object") {
                nsWmsMap[field.name] = fieldId;
                resultSchItem.columns.push(field);
            } else if(findType(field) == "array") {
                nsWmsMap[field[0]] = fieldId;
                resultSchItem.columns.push({ name: field[0], join: field[field.length - 1] });
            } else {
                nsWmsMap[field] = fieldId;
                resultSchItem.columns.push(field);
            }
        }
        return {
            resultSchItem: resultSchItem,
            nsWmsMap: JSON.stringify(nsWmsMap) == "{}"? null: nsWmsMap,
            doSeach: function (nsSystemSearchId) {
                var schObj = nsSystemSearchId? { searchId: nsSystemSearchId }: { searchDefine: this.resultSchItem };
                log.debug('filters', schObj.searchDefine.filters);
                log.debug('searchDefine', schObj.searchDefine);
                var allResults = searchCommon.getAllSearchResults(schObj), retResults = [], that = this;
                allResults.reduce(function (results, currentResult) {
                    results = {};
                    currentResult.columns.forEach(function (column) {
                        var allValues = currentResult.getAllValues(),
                            colName = (column.join? column.join + ".": "") + column.name;
                        if(that.nsWmsMap) {
                            var mapColName = that.nsWmsMap[colName];
                            if(mapColName){ results[mapColName] = allValues[colName]; }
                        } else {
                            results[colName] = allValues[colName];
                        }
                    });
                    retResults.push(results);
                }, {});
                return  retResults;
            }
        };
    }

    //https://5399033-sb1.app.netsuite.com/app/common/scripting/scriptrecord.nl?id=1140&whence=
    //https://5399033-sb1.app.netsuite.com/app/site/hosting/restlet.nl?script=785&deploy=1&specname=BOM%20Integration
    //https://5399033-sb1.app.netsuite.com/app/common/custom/custrecord.nl?e=T&id=650&whence=
    return {
        get: get,
        post: post
    }
});
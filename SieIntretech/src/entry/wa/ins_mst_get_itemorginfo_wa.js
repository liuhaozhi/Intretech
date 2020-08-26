/**
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 * @NAmdConfig /SuiteScripts/intretech/src/config.json
 * @author Zhu Yanlong
 */
define(["N/search", 'N/runtime', 'N/record', 'N/redirect'], function (search, runtime, record, redirect) {


    function getBomCompanyId(BOMID) {
        var CompanID;
        var type = 'bom';
        var filters = [["internalid", "anyof", BOMID]];
        var columns = ["subsidiary"];       
        var searchOption = { type: type, filters: filters, columns: columns };
        var searchObj = search.create(searchOption);
        searchObj.run().each(function (result) {
             CompanID = result.getValue({ name: 'subsidiary' });
            log.debug("getBomCompanyIded CompanID for BOMID:"+BOMID, CompanID);
        });
        return CompanID;
    }

    function getOrgItemIsPHANTOM(itemId, CompanID) {
        var IsPHANTOM = 'N';
        log.error('getOrgItemIsPHANTOM   ',{itemId:itemId,CompanID:CompanID});
        try {
            var type = 'customrecord_intercompany_fields';
            var filters = [["isinactive", "is", "F"], "AND",
            ["custrecord_intercompany_subsidiary", "anyof", CompanID], "AND",
            ["custrecord_link_field", "anyof", itemId], "AND",
            ["custrecord_material_attribute", "anyof", 5]]; //PHANTOM
            
            var columns = ["internalid", "custrecord_material_attribute"];
            var searchOption = { type: type, filters: filters, columns: columns };
            var searchObj = search.create(searchOption);

            searchObj.run().each(function (result) {
                IsPHANTOM = 'Y';
                log.debug("IsPHANTOM", IsPHANTOM);

            });
        }
        catch (e) { log.error('getOrgItemIsPHANTOM error '+{itemId:itemId,CompanID:CompanID}, e.stack) }

        return IsPHANTOM;
    }


    function onAction(scriptContext) {
        var oldOrgItemIds = [];
        var needSaveFlag = 'N';
        log.debug('start script');
        var currentSubsidiary = runtime.getCurrentUser().subsidiary;
        var type = 'customrecord_intercompany_fields';
        var newRecord = scriptContext.newRecord;
        var billofmaterialsid = newRecord.getValue('billofmaterials');
        log.debug('billofmaterialsid',billofmaterialsid);

        var CompanyId = getBomCompanyId(billofmaterialsid);
        log.debug("return getBomCompanyIded CompanID for BOMID:"+billofmaterialsid, CompanyId);

        log.debug({ title: 'newRecord', details: newRecord });
        try {
            if (newRecord.id) {
                var recordObj = record.load({ type: 'bomrevision', id: newRecord.id });
                log.debug({ title: 'recordObj', details: recordObj });
                
                
                var componentsCount = newRecord.getLineCount({ sublistId: 'component' });
                log.debug('componentsCount:' + componentsCount);
                for (var i = 0; i < componentsCount; i++) {
                    var itemId = newRecord.getSublistValue({ sublistId: 'component', fieldId: 'item', line: i });
                    var oldOrgItemId = newRecord.getSublistValue({ sublistId: 'component', fieldId: 'custrecord_intercompany_fields', line: i });
                    var oldItemSource = newRecord.getSublistValue({ sublistId: 'component', fieldId: 'itemsource', line: i });
                    if (oldOrgItemId) { oldOrgItemIds.push(oldOrgItemId); }
                    var filters = [["isinactive", "is", "F"], "AND",
                    ["custrecord_intercompany_subsidiary", "anyof", currentSubsidiary], "AND",
                    ["custrecord_link_field", "anyof", itemId]];
                    var columns = ["internalid", "custrecord_material_attribute"];
                    var searchOption = { type: type, filters: filters, columns: columns };
                    var searchObj = search.create(searchOption);
                    // var searchResultCount = searchObj.runPaged().count;
                    // log.debug("customrecord_intercompany_fieldsSearchObj result count", searchResultCount);
                    searchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        var orgItemId = result.getValue({ name: 'internalid' });
                        var orgItemAttribue = result.getValue({ name: 'custrecord_material_attribute' });
                        log.debug("orgItemId", orgItemId);
                        //���ù�˾������
                        if (oldOrgItemId != orgItemId) {
                            needSaveFlag = 'Y';
                            recordObj.setSublistValue({ sublistId: 'component', fieldId: 'custrecord_intercompany_fields', line: i, value: orgItemId });
                        }
                        //���û�Ʒ��Դ
                        //if (orgItemAttribue == 5 && oldItemSource != 'PHANTOM') {
                        //  needSaveFlag = 'Y';
                        //recordObj.setSublistValue({ sublistId: 'component', fieldId: 'itemsource', line: i, value: 'PHANTOM' });
                        // }  
                    });

                    var isPHANTOM = getOrgItemIsPHANTOM(itemId, CompanyId);

                    log.debug('get info ', { itemId: itemId, CompanyId: CompanyId, isPHANTOM: isPHANTOM })

                    if (isPHANTOM == 'Y' && oldItemSource != 'PHANTOM') {
                        needSaveFlag = 'Y';
                        recordObj.setSublistValue({ sublistId: 'component', fieldId: 'itemsource', line: i, value: 'PHANTOM' });
                    }
                }
                if (needSaveFlag == 'Y') {
                    var recordId = recordObj.save();
                    log.debug('recordId: ' + recordId);
                    if (oldOrgItemIds.length == 0) {
                        redirect.toRecord({ type: 'bomrevision', id: recordId });
                    }
                }
                log.debug('oldOrgItemIds list: ' + oldOrgItemIds);
            }
        } catch (error) {
            log.debug({ title: error.name, details: error.message });
        }
        log.debug('end script');
    }
    return {
        onAction: onAction
    }
});
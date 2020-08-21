/**
 *@NApiVersion 2.1
 *@author Charles Zhang
 *@description 此程序主要用于搜索采购平台相关用户首选项
 */
define([
    'N/record',
    'N/query',
    'N/runtime',
], function (
    recordMod,
    queryMod,
    runtimeMod,
) {
    const prefRecordType = 'customrecord_platform_user_preference';
    const prefTypeFieldId = 'custrecord_user_pref_type';
    const prefDetailFieldId = 'custrecord_user_pref_detail';

    function getRecTypeFieldMetaData(recTypeId) {
        const custFieldTypeId = 'customfield';
        const fieldMetaQuery = queryMod.create({
            type: custFieldTypeId
        });
        const metaConditions = [
            fieldMetaQuery.createCondition({
                fieldId: 'recordtype',
                operator: queryMod.Operator.ANY_OF,
                values: [recTypeId]
            }),
        ];
        const metaColumns = [
            fieldMetaQuery.createColumn({
                fieldId: 'scriptid',
                alias: 'id'
            }),
            fieldMetaQuery.createColumn({
                fieldId: 'name',
                alias: 'label'
            }),
            fieldMetaQuery.createColumn({
                fieldId: 'fieldvaluetype',
                alias: 'type',
                context: queryMod.FieldContext.RAW
            }),
            fieldMetaQuery.createColumn({
                fieldId: 'fieldvaluetyperecord',
                alias: 'source'
            }),
        ];

        fieldMetaQuery.condition = fieldMetaQuery.and(...metaConditions);
        fieldMetaQuery.columns = metaColumns;

        const resultSets = fieldMetaQuery.run();
        const results = resultSets.asMappedResults();
        results.forEach(info => {
            info.id = info.id.toLowerCase();
            info.type = info.type.toLowerCase();
            return info;
        });

        return results;
    }

    function getUserPreference(prefTypeId, custOrderType) {
        const defaultFreezeCount = 1;
        const currentUser = runtimeMod.getCurrentUser();
        const { id: userId } = currentUser;
        let prefId, prefDetail;

        //搜索配置信息
        const prefQuery = queryMod.create({
            type: prefRecordType
        });
        const prefConditions = [
            prefQuery.createCondition({
                fieldId: 'owner',
                operator: queryMod.Operator.ANY_OF,
                values: [userId]
            }),
            prefQuery.createCondition({
                fieldId: prefTypeFieldId,
                operator: queryMod.Operator.ANY_OF,
                values: [prefTypeId]
            }),
        ];
        const prefIdColumn = prefQuery.createColumn({
            fieldId: 'id'
        });
        const prefColumns = [
            prefIdColumn,
            prefQuery.createColumn({
                fieldId: prefDetailFieldId
            }),
        ];
        const prefSorts = [
            prefQuery.createSort({
                column: prefIdColumn,
                ascending: true
            }),
        ];

        prefQuery.condition = prefQuery.and(...prefConditions);
        prefQuery.columns = prefColumns;
        prefQuery.sort = prefSorts;

        //run
        const resultSets = prefQuery.run();
        const results = resultSets.asMappedResults();
        const [prefResult] = results;
        const currentFieldDefine = getRecTypeFieldMetaData(custOrderType);

        if (results.length && prefResult) {//找到用户的配置，直接返回
            ({ id: prefId, [prefDetailFieldId]: prefDetail } = prefResult);
            //这里发现，workbook搜出Long Text类型字段会出现截断现象，导致解析失败，故使用record载入获取信息，以修复该问题-2020-3-30
            const prefRec = recordMod.load({
                type: prefRecordType,
                id: prefId
            });
            prefDetail = prefRec.getValue({
                fieldId: prefDetailFieldId
            });
            prefDetail = JSON.parse(prefDetail);
        } else {//如果没有找到该用户的首选项，直接新建
            const allShowColumns = currentFieldDefine.map(({ id }) => ({ id, show: true }));
            prefDetail = {
                columnFreezeCount: defaultFreezeCount,
                userFilters: allShowColumns,
                userColumns: allShowColumns
            };
            const prefRec = recordMod.create({
                type: prefRecordType,
            });
            prefRec.setValue({
                fieldId: prefTypeFieldId,
                value: prefTypeId
            });
            prefRec.setValue({
                fieldId: prefDetailFieldId,
                value: JSON.stringify(prefDetail)
            });
            prefId = prefRec.save({
                ignoreMandatoryFields: true
            });
        }

        return {
            prefId,
            prefDetail,
            currentFieldDefine
        }
    }

    function getFieldTypeMapOperator(fieldList) {
        const chineseMap = {
            '勾选方框': {
                operator: 'is',
                showType: 'CHECKBOX'
            },
            '货币': {
                operator: 'equalto',
                showType: 'CURRENCY'
            },
            '日期': {
                operator: 'within',
                showType: 'DATE'
            },
            '日期/时间': {
                operator: 'on',
                showType: 'DATETIME'
            },
            '小数': {
                operator: 'equalto',
                showType: 'FLOAT'
            },
            '文档': {
                operator: 'anyof',
                showType: 'FILE'
            },
            '电子邮件地址': {
                operator: 'contains',
                showType: 'EMAIL'
            },
            'free-form文本': {
                operator: 'contains',
                showType: 'TEXT'
            },
            '帮助': {
                operator: 'contains',
                showType: 'HELP'
            },
            '超链接': {
                operator: 'contains',
                showType: 'URL'
            },
            '图像': {
                operator: 'anyof',
                showType: 'IMAGE'
            },
            '内嵌 html': {
                operator: 'contains',
                showType: 'INLINEHTML'
            },
            '整数': {
                operator: 'equalto',
                showType: 'INTEGER'
            },
            '列表/记录': {
                operator: 'anyof',
                showType: 'SELECT'
            },
            '全文': {
                operator: 'contains',
                showType: 'LONGTEXT'
            },
            '多项选择': {
                operator: 'anyof',
                showType: 'MULTISELECT'
            },
            '密码': {
                operator: 'contains',
                showType: 'PASSWORD'
            },
            '百分比': {
                operator: 'equalto',
                showType: 'PERCENT'
            },
            '电话号码': {
                operator: 'contains',
                showType: 'PHONE'
            },
            '富文本': {
                operator: 'contains',
                showType: 'RICHTEXT'
            },
            '文本区域': {
                operator: 'contains',
                showType: 'TEXTAREA'
            },
            '一天中时间': {
                operator: 'equalto',
                showType: 'TIMEOFDAY'
            },
        };
        const englishMap = {
            'check box': {
                operator: 'is',
                showType: 'CHECKBOX'
            },
            'currency': {
                operator: 'equalto',
                showType: 'CURRENCY'
            },
            'date': {
                operator: 'within',
                showType: 'DATE'
            },
            'date/time': {
                operator: 'on',
                showType: 'DATETIME'
            },
            'decimal number': {
                operator: 'equalto',
                showType: 'FLOAT'
            },
            'document': {
                operator: 'anyof',
                showType: 'FILE'
            },
            'email address': {
                operator: 'contains',
                showType: 'EMAIL'
            },
            'free-form text': {
                operator: 'contains',
                showType: 'TEXT'
            },
            'help': {
                operator: 'contains',
                showType: 'HELP'
            },
            'hyperlink': {
                operator: 'contains',
                showType: 'URL'
            },
            'image': {
                operator: 'anyof',
                showType: 'IMAGE'
            },
            'inline html': {
                operator: 'contains',
                showType: 'INLINEHTML'
            },
            'integer number': {
                operator: 'equalto',
                showType: 'INTEGER'
            },
            'list/record': {
                operator: 'anyof',
                showType: 'SELECT'
            },
            'long text': {
                operator: 'contains',
                showType: 'LONGTEXT'
            },
            'multiple select': {
                operator: 'anyof',
                showType: 'MULTISELECT'
            },
            'password': {
                operator: 'contains',
                showType: 'PASSWORD'
            },
            'percent': {
                operator: 'equalto',
                showType: 'PERCENT'
            },
            'phone number': {
                operator: 'contains',
                showType: 'PHONE'
            },
            'rich text': {
                operator: 'contains',
                showType: 'RICHTEXT'
            },
            'text area': {
                operator: 'contains',
                showType: 'TEXTAREA'
            },
            'time of day': {
                operator: 'equalto',
                showType: 'TIMEOFDAY'
            },
        };

        for (const fieldInfo of fieldList) {
            const { type } = fieldInfo;
            const config = chineseMap[type] || englishMap[type];
            if (!config) {
                throw new ReferenceError(`没有找到字段类型: ${type} 相关的搜索逻辑选项，本功能只支持中文和英文两种语言，请修改个人语言或者联系管理员修改配置信息`);
            }
            
            Object.assign(fieldInfo, config);
        }

        return fieldList;
    }

    return {
        getUserPreference,
        getRecTypeFieldMetaData,
        getFieldTypeMapOperator,
        prefRecordType,
        prefTypeFieldId,
        prefDetailFieldId
    }
});
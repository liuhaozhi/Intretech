/**
 *@NApiVersion 2.0
 *@NScriptType Restlet
 */
define(['N/file', '../../dao/dao_search_common'], function (file, searchCommon) {

    function _post(context) {
        var startDate = context.startDate,
            endDate = context.endDate,
            reqColumns = context.reqColumns || [],
            keyMapPath = '../../res/mrp_field_map.json',
            filters = [
                ['mainline', 'is', 'F'],
                'AND',
                ['taxline', 'is', 'F']
            ],
            columns = [],
            keyMap,
            reversedKeyMap = Object.create(null),
            allResults = [],
            rspMsg = {
                status: '',
                results: [],
                message: ''
            };

        //筛选日期
        if (startDate) {
            filters.push(
                'AND',
                ['trandate', 'onorafter', startDate]
            );
        }
        if (endDate) {
            filters.push(
                'AND',
                ['trandate', 'onorbefore', endDate]
            );
        }

        try {
            //获取输出字段映射
            keyMap = file.load({
                id: keyMapPath
            }).getContents();
            keyMap = JSON.parse(keyMap);

            //反转映射表,用于输出结果给客户端
            Object.keys(keyMap).reduce(function (reversed, currentKey) {
                reversed[keyMap[currentKey]] = currentKey;
                return reversed;
            }, reversedKeyMap);

            //转换需求字段为NS字段
            columns = reqColumns.map(function (outKey) {
                return keyMap[outKey];
            });

            if(!columns.length){
                columns = Object.keys(reversedKeyMap);
            }

            //搜索
            allResults = searchCommon.getAllSearchResults({
                searchDefine: {
                    type: 'purchaseorder',
                    filters: filters,
                    columns: columns
                }
            });

            //转换为外部键的结果
            allResults.reduce(function (results, currentResult) {
                var resultMap = {};
                currentResult.columns.forEach(function (column) {
                    resultMap[reversedKeyMap[column.name]] = currentResult.getValue(column);
                });
                results.push(resultMap);
                return results;
            }, rspMsg.results);

            rspMsg.status = 'success';
        } catch (ex) {
            rspMsg.status = 'fail';
            rspMsg.message = '查询时发生错误, 错误提示:' + ex.message;
        }

        return rspMsg
    }

    return {
        post: _post
    }
});
/**
 *@NApiVersion 2.0
 *@author yuming Hu
 *@description 数据收集器
 */
define(['N/search'], function (search) {

    function bomGetter(itemIds, subsidiary) {
        var resultList = {
            itemIds: [],
            bomIds: [],
            fitemIds: []
        };
        var lItemIds = [];
        var lBomIds = []
        var tItemIds = [];
        //var resultList = [];

        if (itemIds.length == 0) {
            return resultList;
        }

        log.debug('subsidiary', subsidiary);

        var columns = [{
                name: 'name', //客户
            },
            {
                name: 'name',
                join: 'revision' //销售订单号
            },
            {
                name: 'effectivestartdate',
                join: 'revision' //销售订单号
            },
            {
                name: 'effectiveenddate',
                join: 'revision' //销售订单号
            },
            {
                name: 'assembly', //客户
                join: 'assemblyitem'
            }
        ];

        var filters = [
            ["assemblyitem.assembly", "anyof"].concat(itemIds), //["assemblyitem.assembly", "anyof", "1662"]
            "AND",
            ["assemblyitem.default", "is", "T"],
            "AND",
            [
                ["revision.effectivestartdate", "notafter", "today"],
                "OR",
                ["revision.effectivestartdate", "isempty", ""]
            ],
            "AND",
            [
                ["revision.effectiveenddate", "notbefore", "today"],
                "OR",
                ["revision.effectiveenddate", "isempty", ""]
            ]
        ];

        var sublistSearchCriteria = {
            type: 'bom',
            filters: filters,
            columns: columns
        };

        searchObj = search.create(sublistSearchCriteria);

        searchObj.run().each(function (result, i) {

            var itemId = result.getValue({
                name: columns[4]
            });

            var bomId = result.id;

            //if (resultList.itemIds.indexOf(itemId) == '-1') {
            if (lItemIds.indexOf(itemId) == '-1') {
                //resultList.itemIds.push(itemId);
                lItemIds.push(itemId);
            }

            // if (resultList.bomIds.indexOf(bomId) == '-1') {
            if (lBomIds.indexOf(bomId) == '-1') {
                //resultList.bomIds.push(bomId);
                lBomIds.push(bomId);
            }

            return true;
        });

        if (lItemIds.length) {
            var itemFilters = [
                ["internalid", "anyof"].concat(lItemIds),
                "AND",
                ["custrecord_link_field.custrecord_intercompany_subsidiary", "anyof", subsidiary], //"26"
                "AND",
                ["custrecord_link_field.custrecord_material_attribute", "anyof", "3"]
            ];
            var itemColumns = [{
                name: 'internalid', //客户
            }];
            var itemSearchCriteria = {
                type: 'item',
                filters: itemFilters,
                columns: itemColumns
            };

            search.create(itemSearchCriteria).run().each(function (result, i) {

                var itemId = result.getValue({
                    name: itemColumns[0]
                });

                //if (resultList.itemIds.indexOf(itemId) == '-1') {
                if (tItemIds.indexOf(itemId) == '-1') {
                    //resultList.itemIds.push(itemId);
                    tItemIds.push(itemId);
                }

                return true;
            });
        }

        //增加判断自制键的逻辑
        resultList.itemIds = tItemIds;
        resultList.bomIds = lBomIds;
        resultList.fitemIds = lItemIds;

        log.debug("查询：获取装配件的id数组", resultList);

        return resultList;
    }

    /**
     * 
     * @param {*} d 当前日期
     * @param {*} n 间隔天数
     * n>0，往后推算；n<0，往前推算；n=0,返回原值
     * @param {*} l 工作日程表
     * [0,1,1,1,1,1,0] 总共7项，从第一项开始分别为周日，周一，周二，周三，周四，周五，周六
     * true表示工作日，false表示非工作日
     * @description 工作日计算
     * @author zhihu Chen
     */
    function workDateGetter(d, n, l) {
        //n为0或者null,返回原值
        if (!n) return d;
        //默认周末双休
        if (!l) l = [0, 1, 1, 1, 1, 1, 0];
        var c = new Date(d);

        //每周工作日天数
        var workdayPerWeek = l.filter(function (item) {
            return item;
        }).length;;

        //应增加/减少周数
        var _w = parseInt(n / workdayPerWeek);

        //应增加/减少天数
        var _d = n % workdayPerWeek;

        if (_w != 0) c.setDate(c.getDate() + _w * 7);

        //当前是周几
        var _wd = c.getDay();
        var x = 0; //天数
        //往后推步长1，往前推步长为-1
        var step = n > 0 ? 1 : -1;

        //_d个工作日实际对应天数
        while (_d != 0) {
            var pos = (_wd + x + 7) % 7;
            if (l[pos]) {
                _d -= step;
            }
            x += step;
        }
        //结果为非工作日，调整到工作日
        while (!l[(_wd + x + 7) % 7]) {
            x += step;
        }

        c.setDate(c.getDate() + x);

        //log.debug('c', c);
        return c;
    }

    //function routingGetter(itemIds, isFreeTax) {
    function routingGetter(option) {
        var resultList = {};
        var weeklist = [];
        var stOrderTypeDefaultValue = '9';

        if (option.itemIds.length == 0) {
            return resultList;
        }

        //var bomIds = bomGetter(option.itemIds).bomIds;
        var bomIds = bomGetter(option.itemIds, option.subsidiary).bomIds;
        var itemIds = bomGetter(option.itemIds, option.subsidiary).fitemIds;
        //var itemIds = bomGetter(option.itemIds, option.subsidiary).itemIds;

        var columns = [{
                name: 'billofmaterials'
            },
            //lhz 此处因却分订单类型，导致除了指定类型，别的类型都没有查询location，此处将location放开，若需要别的location，查询完成在resultList 中返回
            {
                name: 'location'
            },
            {
                name: 'workcalendar',
                join: 'manufacturingWorkCenter'
            },
            {
                name: 'custrecord_bonded_under_bond',
                join: 'location'
            }
        ];

        var filters = [
            ["billofmaterials", "anyof"].concat(bomIds), //["assemblyitem.assembly", "anyof", "1662"]
            "AND",
            ["isdefault", "is", "T"] //,
            //"AND",
            //["location.custrecord_bonded_under_bond", "anyof", option.isFreeTax] //["location.custrecord_bonded_under_bond", "anyof", "1"]
        ];

        //add 20200601
        if (option.ordertype == stOrderTypeDefaultValue) {
            //如果是受托，并区分保税非保税
            if (option.isFreeTax) {
                columns = columns.concat([{
                        name: 'location'
                    },
                    {
                        name: 'custrecord_bonded_under_bond',
                        join: 'location'
                    }
                ]);

                filters = filters.concat(["AND",
                    ["location.custrecord_bonded_under_bond", "anyof", option.isFreeTax],
                    "AND",
                    ["location.custrecord_if_trustee_location", "is", "T"]
                ]);
            }

            var sublistSearchCriteria = {
                type: 'manufacturingrouting',
                filters: filters,
                columns: columns
            };

            var searchObj = search.create(sublistSearchCriteria);

            searchObj.run().each(function (result, i) {


                for (var j = 0; j < columns.length; j++) {
                    resultList[columns[j].name] = result.getValue({
                        name: columns[j]
                    });
                }

                return true;
            });

            //不区分保税非保税
            if (!resultList.location) {

                filters = [
                    ["billofmaterials", "anyof"].concat(bomIds), //["assemblyitem.assembly", "anyof", "1662"]
                    "AND",
                    ["isdefault", "is", "T"], //,
                    "AND",
                    ["location.custrecord_if_trustee_location", "is", "T"]
                    //"AND",
                    //["location.custrecord_bonded_under_bond", "anyof", option.isFreeTax] //["location.custrecord_bonded_under_bond", "anyof", "1"]
                ];

                sublistSearchCriteria = {
                    type: 'manufacturingrouting',
                    filters: filters,
                    columns: columns
                };

                searchObj = search.create(sublistSearchCriteria);

                searchObj.run().each(function (result, i) {

                    for (var j = 0; j < columns.length; j++) {
                        resultList[columns[j].name] = result.getValue({
                            name: columns[j]
                        });
                    }

                    return true;
                });
            }
        } else {
            if (option.isFreeTax) {
                columns = columns.concat([{
                        name: 'location'
                    },
                    {
                        name: 'custrecord_bonded_under_bond',
                        join: 'location'
                    }
                ]);

                filters = filters.concat(["AND",
                    ["location.custrecord_bonded_under_bond", "anyof", option.isFreeTax]
                ]);
            }

            var sublistSearchCriteria = {
                type: 'manufacturingrouting',
                filters: filters,
                columns: columns
            };

            var searchObj = search.create(sublistSearchCriteria);

            searchObj.run().each(function (result, i) {


                for (var j = 0; j < columns.length; j++) {
                    resultList[columns[j].name] = result.getValue({
                        name: columns[j]
                    });
                }

                return true;
            });
        }
        //add end 20200601

        // begin
        // if (option.isFreeTax) {
        //     columns = columns.concat([{
        //             name: 'location'
        //         },
        //         {
        //             name: 'custrecord_bonded_under_bond',
        //             join: 'location'
        //         }
        //     ]);

        //     filters = filters.concat(["AND",
        //         ["location.custrecord_bonded_under_bond", "anyof", option.isFreeTax]
        //     ]);
        // }

        // var sublistSearchCriteria = {
        //     type: 'manufacturingrouting',
        //     filters: filters,
        //     columns: columns
        // };

        // var searchObj = search.create(sublistSearchCriteria);

        // searchObj.run().each(function (result, i) {


        //     for (var j = 0; j < columns.length; j++) {
        //         resultList[columns[j].name] = result.getValue({
        //             name: columns[j]
        //         });
        //     }

        //     return true;
        // });

        //end

        //货品查询
        columns = [{
                name: 'custitem_fixed_lead_time' //固定提前期
            },
            {
                name: 'custitem_daily_yield' //日产量
            }
        ];

        filters = [
            ["internalid", "anyof"].concat(itemIds)
        ];

        sublistSearchCriteria = {
            type: 'item',
            filters: filters,
            columns: columns
        };

        searchObj = search.create(sublistSearchCriteria);

        searchObj.run().each(function (result, i) {
            for (var j = 0; j < columns.length; j++) {
                resultList[columns[j].name] = result.getValue({
                    name: columns[j]
                });
            };

            return true;
        });

        //工作日历查询
        columns = [{
                name: 'formulanumeric', //星期天
                type: "float",
                formula: "decode({sunday},'F',0,'T',1)"
            },
            {
                name: 'formulanumeric', //星期一
                type: "float",
                formula: "decode({monday},'F',0,'T',1)"
            },
            {
                name: 'formulanumeric', //星期二
                type: "float",
                formula: "decode({tuesday},'F',0,'T',1)"
            },
            {
                name: 'formulanumeric', //星期三
                type: "float",
                formula: "decode({wednesday},'F',0,'T',1)"
            },
            {
                name: 'formulanumeric', //星期死
                type: "float",
                formula: "decode({thursday},'F',0,'T',1)"
            },
            {
                name: 'formulanumeric', //星期五
                type: "float",
                formula: "decode({friday},'F',0,'T',1)"
            },
            {
                name: 'formulanumeric', //星期六
                type: "float",
                formula: "decode({saturday},'F',0,'T',1)"
            }
        ];

        filters = [
            ["internalid", "anyof"].concat(resultList.workcalendar)
        ];

        sublistSearchCriteria = {
            type: 'workcalendar',
            filters: filters,
            columns: columns
        };

        searchObj = search.create(sublistSearchCriteria);

        searchObj.run().each(function (result, i) {

            for (var j = 0; j < columns.length; j++) {
                weeklist.push(Number(result.getValue({
                    name: columns[j]
                })));
            }

            return true;
        });

        var b2eDays = resultList.custitem_daily_yield ? Math.ceil(option.quantity / resultList.custitem_daily_yield) : 0;

        var enddate = workDateGetter(option.expectReceiveDate,
            -1 * resultList.custitem_fixed_lead_time,
            weeklist);

        var startdate = workDateGetter(enddate,
            -1 * b2eDays,
            weeklist);

        resultList.startdate = startdate;
        resultList.enddate = enddate;

        log.debug('查询提前期及地点（dao_collection_utils.routingGetter）', resultList);

        return resultList;
    }
    return {
        bomGetter: bomGetter,
        routingGetter: routingGetter
    }
});
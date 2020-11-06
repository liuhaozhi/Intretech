/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 *@author yuming Hu
 *@description  该脚本用于获取所有数据
 */
define(['N/log',
    'N/record',
    'N/search',
    '../../app/moment'
], function (
    log,
    record,
    search,
    moment
) {
    var gWorkorderRecordTypeId = 'workorder',
        gSubsidiaryFieldId = 'subsidiary', //可用于事务处理上的子公司字段、客户主数据上的主要子公司字段
        gInternalidFieldId = 'internalid', //内部标示Id
        gCurrencyFieldId = 'currency',
        gEntityFieldId = 'entity';

    // function getNowString() {
    //     var now = new Date();

    //     log.debug('111', now.getTimezoneOffset());

    //     var nowString = now.getFullYear().toString() +
    //         (now.getMonth() + 1).toString().PadLeft(2, '0') +
    //         now.getDate().toString();
    //     log.debug('nowString', nowString);

    //     return nowString;
    // }

    function getNowString() {
        now = moment();
        var nowString = now.format('YYYYMMDD');
        return nowString;
    }

    String.prototype.PadLeft = function (len, charStr) {
        var s = this + '';
        return new Array(len - s.length + 1).join(charStr || '') + s;
    }

    function getWorkorder(option) {

        var woId = option.woId,
            resultMsg = {
                //workordercompletion: workordercompletion,
                //workorder: '', //createdfrom
                status: 'E',
                data: {
                    main: {
                        assemblyitem: '',
                        quantity: 0,
                        subsidiary: '',
                        location: '',
                        units: '',
                        billofmaterials: '',
                        manufacturingrouting: '',
                        department: '',
                        billofmaterialsrevision: '',
                        class: '',
                        custbody_wip_up_wo_id: '',
                        custbody_wip_so_line_if_under_bond: '', //销售订单行是否保税
						custbody_wip_manufacturing_shop: '',
						custbody_wip_up_wo_id: ''
                    },
                    item: [],
                    operation: []
                }
            },
            woRec,
            itemObj = {},
            operationObj = {},
            main,
            itemCount,
            operationFilters = [],
            operationColumns = [],
            operationSearchCriteria = {},
            operationObj = {},
            operationList = [],
            itemFilters = [],
            itemColumns = [],
            itemSearchCriteria = {},
            woFilters = [],
            woColumns = [],
            woSearchCriteria = {},
            batchFilters = [],
            batchColumns = [],
            batchSearchCriteria = {},
            nowString = getNowString(),
            batchSeq = 0,
            issueNumber,
            paramWarehouse,
            locationFilters = [],
            locationColumns = [],
            locationSearchCriteria = {};

        try {
            //加载记录类型
            var woRec = record.load({
                type: gWorkorderRecordTypeId,
                id: woId
                ///isDynamic: true,
            });

            main = resultMsg.data.main;

            for (var key in main) {

                if (main.hasOwnProperty(key)) {

                    resultMsg.data.main[key] = woRec.getValue({
                        fieldId: key
                    });
                }
            };

			// get vendorbin  200912 yq
            main.vendorbin = '';
			var binloaction=main.location,binmanshop= main.custbody_wip_manufacturing_shop;
					log.debug('vendorbin ',binloaction+'-'+binmanshop); 
          if ( binloaction !=''  &&  binmanshop !='') 
		 	{ 
		
            binFilters = [
                ["location", "anyof", binloaction] ,
                "AND",
                ["custrecord_work_center", "anyof",binmanshop]  
            ];
            binColumns = [{
                    name: 'internalid'  
                },
                {
                    name: 'custrecord_os_vendor' 
                } 
            ];
            var binSearchCriteria = {
                type: 'bin',
                filters: binFilters,
                columns: binColumns
            };

            search.create(binSearchCriteria).run().each(function (result, i) {
		
                main['vendorbin'] = result.getValue({
                    name: binColumns[0]
                });
				log.debug('vendorbin id',main.vendorbin); 
					 });					
				 
			}   
			// get father vendorbin  200912 yq			
           main.favendorbin = '';
		   var fawo=main.custbody_wip_up_wo_id;
　			if(fawo !='' )
　　　　　　{
	
			  var fawoRec = record.load({
					type: gWorkorderRecordTypeId,
					id: fawo
					
				});
                 
			  var fabinloaction= fawoRec.getValue({fieldId: 'location'}) ,fabinmanshop= fawoRec.getValue({fieldId: 'custbody_wip_manufacturing_shop'}) ;
						log.debug('favendorbin ',fabinloaction+'-'+fabinmanshop); 
			  if ( fabinloaction !=''  &&  fabinmanshop !='') 
				{ 
			
				fabinFilters = [
					["location", "anyof", fabinloaction] ,
					"AND",
					["custrecord_work_center", "anyof",fabinmanshop]  
				];
				fabinColumns = [{
						name: 'internalid'  
					},
					{
						name: 'custrecord_os_vendor' 
					} 
				];
				var fabinSearchCriteria = {
					type: 'bin',
					filters: fabinFilters,
					columns: fabinColumns
				};

				search.create(fabinSearchCriteria).run().each(function (result, i) {
			
					main['favendorbin'] = result.getValue({
						name: fabinColumns[0]
					});
					log.debug('favendorbin id',main.favendorbin); 
						 });					
					 
				}
　　　　    }


            //默认仓库
            main.defaultwarehouse = '';
            main.life = '';

            itemFilters = [
                ["internalid", "anyof"].concat(main.assemblyitem),
                "AND",
                ["custrecord_link_field.custrecord_intercompany_subsidiary", "anyof", main.subsidiary] //"26"
            ];
            itemColumns = [{
                    name: 'internalid' //客户
                },
                {
                    name: 'custrecord_default_warehouse', //客户
                    join: "CUSTRECORD_LINK_FIELD"
                },
                {
                    name: 'custrecord_shelf_life', //
                    join: "CUSTRECORD_LINK_FIELD"
                },
                {
                    name: 'custitem_shelf_life'
                }
            ];
            var itemSearchCriteria = {
                type: 'item',
                filters: itemFilters,
                columns: itemColumns
            };

            search.create(itemSearchCriteria).run().each(function (result, i) {

                var defaultwarehouse = result.getValue({
                    name: itemColumns[1]
                });

                var life = result.getValue({
                    name: itemColumns[3]
                });

                if (defaultwarehouse) {
                    //main.defaultwarehouse = defaultwarehouse;
                    paramWarehouse = defaultwarehouse;
                }

                if (life) {
                    main.life = life;
                }

                return true;
            });

            log.debug('paramWarehouse', paramWarehouse);

            //获取默认地点
            if (paramWarehouse) {
                locationFilters = [
                    ["internalid", "anyof", paramWarehouse]
                ];
                locationColumns = [{
                        name: 'custrecord_bonded_under_bond' //保税非保税
                    },
                    {
                        name: 'custrecord_bing_location' //绑定地点
                    },
                    {
                        name: 'internalid'
                    }
                ];
                locationSearchCriteria = {
                    type: 'location',
                    filters: locationFilters,
                    columns: locationColumns
                };

                search.create(locationSearchCriteria).run().each(function (result, i) {

                    var bsfbs = result.getValue({
                        name: itemColumns[0]
                    });

                    if (bsfbs == main.custbody_wip_so_line_if_under_bond) {
                        main.defaultwarehouse = result.getValue({
                            name: itemColumns[2]
                        });
                    } else {
                        main.defaultwarehouse = result.getValue({
                            name: itemColumns[1]
                        });
                    }

                    return true;
                });
            }

            //查询上次工单地点
            main.toplocation = '';

            //如果存在上层工单，则查询地点
            if (main.custbody_wip_up_wo_id) {
                woFilters = [
                    ["type", "anyof", "WorkOrd"],
                    "AND",
                    ["internalid", "anyof", main.custbody_wip_up_wo_id], //"26"
                    "AND",
                    ["mainline", "is", "T"]
                ];
                woColumns = [{
                    name: 'location' //客户
                }];
                var woSearchCriteria = {
                    type: 'workorder',
                    filters: woFilters,
                    columns: woColumns
                };

                search.create(woSearchCriteria).run().each(function (result, i) {

                    var topLocation = result.getValue({
                        name: woColumns[0]
                    });

                    if (topLocation) {
                        main.toplocation = topLocation;
                    }

                    return true;
                });
            }

            //获取当前的最大批次
            log.debug('nowString', nowString);

            batchFilters = [
                ["formulatext: SUBSTR({inventorynumber.inventorynumber},1,8)", "is", nowString]
            ];
            batchColumns = [{
                formula: "SUBSTR({inventorynumber.inventorynumber},9)",
                name: "formulanumeric",
                summary: "MAX"
            }];
            batchSearchCriteria = {
                type: 'item',
                filters: batchFilters,
                columns: batchColumns
            };

            search.create(batchSearchCriteria).run().each(function (result, i) {

                batchSeq = result.getValue({
                    name: batchColumns[0]
                });

                if (batchSeq) {
                    batchSeq = Number(batchSeq) + 1;
                } else {
                    batchSeq = 1;
                }

                return true;
            });

            issueNumber = nowString + batchSeq.toString().PadLeft(4, '0');

            main.issueNumber = issueNumber;

            itemCount = woRec.getLineCount({
                sublistId: 'item'
            });

            for (var i = 0; i < itemCount; i++) {
                itemObj = {
                    item: '',
                    bomquantity: 0,
                    componentyield: '',
                    quantity: 0,
                    units: '',
                    ratio: 0
                };

                for (var key in itemObj) {

                    if (itemObj.hasOwnProperty(key)) {

                        if (key != 'ratio') {
                            itemObj[key] = woRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: key,
                                line: i
                            });
                        } else {
                            itemObj[key] = woRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'bomquantity',
                                line: i
                            }) / main['quantity'];
                        }
                    }
                };

                resultMsg.data.item.push(itemObj);
            }

            //查询操作
            operationColumns = [{
                    name: 'sequence', //操作顺序
                    join: 'manufacturingOperationTask',
                    sortdir: "ASC"
                },
                {
                    name: 'name', //工序名称
                    join: 'manufacturingOperationTask'
                },
                {
                    name: 'manufacturingworkcenter', //制造工作中心
                    join: 'manufacturingOperationTask'
                },
                {
                    name: 'machineresources', //机器资源
                    join: 'manufacturingOperationTask'
                },
                {
                    name: 'laborresources', //人工资源
                    join: 'manufacturingOperationTask'
                },
                {
                    name: 'setuptime', //机器设置时间
                    join: 'manufacturingOperationTask'
                },
                {
                    name: 'runrate', //人工设置时间
                    join: 'manufacturingOperationTask'
                }
            ];

            operationFilters = [
                ["type", "anyof", "WorkOrd"],
                "AND",
                ["mainline", "is", "T"],
                "AND",
                ["internalid", "anyof", woId]
            ]

            operationSearchCriteria = {
                type: 'workorder',
                filters: operationFilters,
                columns: operationColumns
            };

            search.create(operationSearchCriteria).run().each(function (result, i) {

                operationObj = {};

                for (var j = 0; j < operationColumns.length; j++) {
                    var cc = operationColumns[j]['name'];

                    operationObj[cc] = result.getValue({
                        name: operationColumns[j]
                    });
                }

                operationList.push(operationObj);

                return true;
            });

            log.debug('operationList', operationList);

            resultMsg.data.operation = operationList;

            resultMsg.status = 'S';

            log.debug('operationList', resultMsg);

        } catch (e) {
            resultMsg.message = e.message;

            log.error({
                title: '提示',
                details: JSON.stringify(resultMsg)
            });
        }

        return resultMsg;
    }

    function getWorkorder_bak(option) {

        var woId = option.woId,
            resultMsg = {
                //workordercompletion: workordercompletion,
                //workorder: '', //createdfrom
                status: 'E',
                data: {
                    main: {
                        assemblyitem: '',
                        quantity: 0,
                        subsidiary: '',
                        location: '',
                        units: '',
                        billofmaterials: '',
                        manufacturingrouting: '',
                        department: '',
                        billofmaterialsrevision: '',
                        class: '',
                        custbody_wip_up_wo_id: ''

                    },
                    item: [],
                    operation: []
                }
            },
            woRec,
            itemObj = {},
            operationObj = {},
            main,
            itemCount,
            operationFilters = [],
            operationColumns = [],
            operationSearchCriteria = {},
            operationObj = {},
            operationList = [],
            itemFilters = [],
            itemColumns = [],
            itemSearchCriteria = {},
            woFilters = [],
            woColumns = [],
            woSearchCriteria = {},
            batchFilters = [],
            batchColumns = [],
            batchSearchCriteria = {},
            nowString = getNowString(),
            batchSeq = 0,
            issueNumber;

        try {
            //加载记录类型
            var woRec = record.load({
                type: gWorkorderRecordTypeId,
                id: woId
                ///isDynamic: true,
            });

            main = resultMsg.data.main;

            for (var key in main) {

                if (main.hasOwnProperty(key)) {

                    resultMsg.data.main[key] = woRec.getValue({
                        fieldId: key
                    });
                }
            };



            //默认仓库
            main.defaultwarehouse = '';
            main.life = '';

            itemFilters = [
                ["internalid", "anyof"].concat(main.assemblyitem),
                "AND",
                ["custrecord_link_field.custrecord_intercompany_subsidiary", "anyof", main.subsidiary] //"26"
            ];
            itemColumns = [{
                    name: 'internalid' //客户
                },
                {
                    name: 'custrecord_default_warehouse', //客户
                    join: "CUSTRECORD_LINK_FIELD"
                },
                {
                    name: 'custrecord_shelf_life', //
                    join: "CUSTRECORD_LINK_FIELD"
                }
            ];
            var itemSearchCriteria = {
                type: 'item',
                filters: itemFilters,
                columns: itemColumns
            };

            search.create(itemSearchCriteria).run().each(function (result, i) {

                var defaultwarehouse = result.getValue({
                    name: itemColumns[1]
                });

                var life = result.getValue({
                    name: itemColumns[2]
                });

                if (defaultwarehouse) {
                    main.defaultwarehouse = defaultwarehouse;
                }

                if (life) {
                    main.life = life;
                }

                return true;
            });

            //查询上次工单地点
            main.toplocation = '';

            //如果存在上层工单，则查询地点
            if (main.custbody_wip_up_wo_id) {
                woFilters = [
                    ["type", "anyof", "WorkOrd"],
                    "AND",
                    ["internalid", "anyof", main.custbody_wip_up_wo_id], //"26"
                    "AND",
                    ["mainline", "is", "T"]
                ];
                woColumns = [{
                    name: 'location' //客户
                }];
                var woSearchCriteria = {
                    type: 'workorder',
                    filters: woFilters,
                    columns: woColumns
                };

                search.create(woSearchCriteria).run().each(function (result, i) {

                    var topLocation = result.getValue({
                        name: woColumns[0]
                    });

                    if (topLocation) {
                        main.toplocation = topLocation;
                    }

                    return true;
                });
            }

            //获取当前的最大批次
            log.debug('nowString', nowString);

            batchFilters = [
                ["formulatext: SUBSTR({inventorynumber.inventorynumber},1,8)", "is", nowString]
            ];
            batchColumns = [{
                formula: "SUBSTR({inventorynumber.inventorynumber},9)",
                name: "formulanumeric",
                summary: "MAX"
            }];
            batchSearchCriteria = {
                type: 'item',
                filters: batchFilters,
                columns: batchColumns
            };

            search.create(batchSearchCriteria).run().each(function (result, i) {

                batchSeq = result.getValue({
                    name: batchColumns[0]
                });

                if (batchSeq) {
                    batchSeq = Number(batchSeq) + 1;
                } else {
                    batchSeq = 1;
                }

                return true;
            });

            issueNumber = nowString + batchSeq.toString().PadLeft(4, '0');

            main.issueNumber = issueNumber;

            itemCount = woRec.getLineCount({
                sublistId: 'item'
            });

            for (var i = 0; i < itemCount; i++) {
                itemObj = {
                    item: '',
                    bomquantity: 0,
                    componentyield: '',
                    quantity: 0,
                    units: '',
                    ratio: 0
                };

                for (var key in itemObj) {

                    if (itemObj.hasOwnProperty(key)) {

                        if (key != 'ratio') {
                            itemObj[key] = woRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: key,
                                line: i
                            });
                        } else {
                            itemObj[key] = woRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'bomquantity',
                                line: i
                            }) / main['quantity'];
                        }
                    }
                };

                resultMsg.data.item.push(itemObj);
            }

            //查询操作
            operationColumns = [{
                    name: 'sequence', //操作顺序
                    join: 'manufacturingOperationTask',
                    sortdir: "ASC"
                },
                {
                    name: 'name', //工序名称
                    join: 'manufacturingOperationTask'
                },
                {
                    name: 'manufacturingworkcenter', //制造工作中心
                    join: 'manufacturingOperationTask'
                },
                {
                    name: 'machineresources', //机器资源
                    join: 'manufacturingOperationTask'
                },
                {
                    name: 'laborresources', //人工资源
                    join: 'manufacturingOperationTask'
                },
                {
                    name: 'setuptime', //机器设置时间
                    join: 'manufacturingOperationTask'
                },
                {
                    name: 'runrate', //人工设置时间
                    join: 'manufacturingOperationTask'
                }
            ];

            operationFilters = [
                ["type", "anyof", "WorkOrd"],
                "AND",
                ["mainline", "is", "T"],
                "AND",
                ["internalid", "anyof", woId]
            ]

            operationSearchCriteria = {
                type: 'workorder',
                filters: operationFilters,
                columns: operationColumns
            };

            search.create(operationSearchCriteria).run().each(function (result, i) {

                operationObj = {};

                for (var j = 0; j < operationColumns.length; j++) {
                    var cc = operationColumns[j]['name'];

                    operationObj[cc] = result.getValue({
                        name: operationColumns[j]
                    });
                }

                operationList.push(operationObj);

                return true;
            });

            log.debug('operationList', operationList);

            resultMsg.data.operation = operationList;

            resultMsg.status = 'S';

            log.debug('operationList', resultMsg);

        } catch (e) {
            resultMsg.message = e.message;

            log.error({
                title: '提示',
                details: JSON.stringify(resultMsg)
            });
        }

        return resultMsg;
    }

    function getInterPurchInfo(option) {

        var entity = option.entity,
            cdsFieldId = 'custentity_deputy_subsidiaries', //代表子公司
            resultMsg = {
                status: 'E',
                data: {
                    vendor: {}
                }
            },
            vendorColumns = [],
            vendorFilters = [],
            vendorSearchCriteria = {},
            vendorObj = {};

        try {
            vendorColumns = [{
                    name: cdsFieldId
                },
                {
                    name: gSubsidiaryFieldId
                }
            ];

            vendorFilters = [
                [gInternalidFieldId, "anyof", entity],
                "AND",
                ["custentity_deputy_subsidiaries", "noneof", "@NONE@"]
            ];

            vendorSearchCriteria = {
                type: 'vendor',
                filters: vendorFilters,
                columns: vendorColumns
            };

            search.create(vendorSearchCriteria).run().each(function (result, i) {

                for (var j = 0; j < vendorColumns.length; j++) {
                    vendorObj[vendorColumns[j]['name']] = result.getValue({
                        name: vendorColumns[j]
                    });
                }
                return true;
            });

            if (Object.keys(vendorObj).length) {
                resultMsg.data.vendor = vendorObj;
                resultMsg.status = 'S';
                log.debug('resultMsg', resultMsg);
            }

        } catch (e) {
            resultMsg.message = e.message;

            log.error({
                title: '提示',
                details: JSON.stringify(resultMsg)
            });
        }

        return resultMsg;
    }

    function getInterPriceListInfo(option) {

        var subsidiary = option.subsidiary,
            intersub = option.intersub,
            currency = option.currency,
            cgfFieldId = 'custrecord_po', //采购方
            nbgysFieldId = 'custrecord_inter_sub', //内部供应商
            wlFieldId = 'custrecord_material', //物料
            jglxFieldId = 'custrecord_price_type_', //价格类型
            szFieldId = 'custrecord_num_', //数值 行联动比例
            ldblFieldId = 'custrecord_proportion', //联动比例 头
            bzFieldId = 'custrecord_currency__', //币种
            gsjjyListRecTypeId = 'customrecord_intercompany_price_list',
            joinRId = 'CUSTRECORD_FATHER_',
            resultMsg = {
                //workordercompletion: workordercompletion,
                //workorder: '', //createdfrom
                status: 'E',
                data: {
                    head: '',
                    lines: {}
                }
            },
            ipListColumns = [],
            ipListFilters = [],
            ipListSearchCriteria = {},
            ipListObj = {
                cgf: '',
                nbgys: '',
                wl: '',
                jglx: '',
                sz: '',
                ldbl: '',
                bz: ''
            },
            ipList = {},
            blValue = 0;

        try {
            ipListColumns = [{
                    name: cgfFieldId //采购方
                },
                {
                    name: nbgysFieldId //内部供应商
                },
                {
                    name: wlFieldId, //物料
                    join: joinRId
                },
                {
                    name: jglxFieldId, //价格类型
                    join: joinRId
                },
                {
                    name: szFieldId, //数值 行联动比例
                    join: joinRId
                },
                {
                    name: ldblFieldId //联动比例 头
                },
                {
                    name: bzFieldId //币种
                }
            ];

            ipListFilters = [
                [cgfFieldId, "anyof", subsidiary],
                "AND",
                [nbgysFieldId, "anyof", intersub],
                "AND",
                [bzFieldId, "anyof", currency]
            ];

            ipListSearchCriteria = {
                type: gsjjyListRecTypeId,
                filters: ipListFilters,
                columns: ipListColumns
            };

            log.debug('ipListSearchCriteria', ipListSearchCriteria);

            search.create(ipListSearchCriteria).run().each(function (result, i) {

                ipListObj = {
                    cgf: '',
                    nbgys: '',
                    wl: '',
                    jglx: '',
                    sz: '',
                    ldbl: '',
                    bz: ''
                };

                ipListObj.cgf = result.getValue({
                    name: ipListColumns[0]
                });

                ipListObj.nbgys = result.getValue({
                    name: ipListColumns[1]
                });

                ipListObj.wl = result.getValue({
                    name: ipListColumns[2]
                });

                ipListObj.jglx = result.getValue({
                    name: ipListColumns[3]
                });

                ipListObj.sz = result.getValue({
                    name: ipListColumns[4]
                });

                ipListObj.ldbl = result.getValue({
                    name: ipListColumns[5]
                });

                ipListObj.bz = result.getValue({
                    name: ipListColumns[6]
                });

                if (!blValue) {
                    blValue = ipListObj.ldbl;
                }

                //ipList.push(ipListObj);

                log.debug('ipListObj.wl', ipListObj.wl);

                if (!ipList[ipListObj.wl]) {
                    ipList[ipListObj.wl] = ipListObj;
                }

                return true;
            });

            log.debug('ipList', ipList);

            resultMsg.data = {
                head: blValue,
                lines: ipList
            };

            resultMsg.status = 'S';

            log.debug('resultMsg', resultMsg);

        } catch (e) {
            resultMsg.message = e.message;

            log.error({
                title: '提示',
                details: JSON.stringify(resultMsg)
            });
        }

        return resultMsg;
    }

    function getQuantityOnhand(option) {

        var woId = option.woId,
            location = option.location,
            resultMsg = {
                //workordercompletion: workordercompletion,
                //workorder: '', //createdfrom
                status: 'E',
                data: {
                    onhandTotal: [],
                    onHandDetail: []
                }
            },
            itemreceiptFilters = [],
            itemreceiptColumns = [],
            itemreceiptSearchCriteria = {},
            itemreceiptObj = {},
            itemreceiptList = [],
            itemIds = [],
            locationIds = [],
            inventorynumberIds = [],
            itemFilters = [],
            itemColumns = [],
            itemSearchCriteria = {},
            itemObj = {},
            itemList = [],
            sitemObj = {},
            sitemList = [],
            workordercompletionFilters = [],
            workordercompletionColumns = [],
            workordercompletionSearchCriteria = {},
            workordercompletionObj = {},
            workordercompletionList = [],
            totalObj = {},
            totalList = [],
            workorderRec,
            workorderLineCount,
            workorderItemList = [],
            workorderItemListIds = [],
            woSubsidiary,
            fisrtItemFilters = [],
            firstItemColumns = [],
            firstItemSearchCriteria = {},
            lockItemIds = [],
            unlockItemIds = [],
            fffList = [];

        try {

            //0.获取工单信息行
            workorderRec = record.load({
                type: 'workorder',
                id: woId
            });

            woSubsidiary = workorderRec.getValue({
                fieldId: 'subsidiary'
            });

            var workorderLineCount = workorderRec.getLineCount({
                sublistId: 'item'
            });

            for (var i = 0; i < workorderLineCount; i++) {

                var lineItemObj = {};

                lineItemObj.subsidiary = woSubsidiary;
                lineItemObj.item = workorderRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });

                workorderItemList.push(lineItemObj);
            }

            log.debug('1...workorderItemList', workorderItemList);

            for (var i = 0; i < workorderItemList.length; i++) {
                workorderItemListIds.push(workorderItemList[i].item);
            }

            log.debug('2...workorderItemListIds', workorderItemListIds);

            fisrtItemFilters = [
                ["internalid", "anyof"].concat(workorderItemListIds),
                "AND",
                ["custrecord_link_field.custrecord_intercompany_subsidiary", "anyof"].concat(woSubsidiary),
                "AND",
                ["custrecord_link_field.custrecord_release_wo_unit_lock_store", "is", "T"]
            ];

            firstItemColumns = [{
                name: 'internalid' //编号
                //summary: "GROUP",
            }];

            firstItemSearchCriteria = {
                type: 'item',
                filters: fisrtItemFilters,
                columns: firstItemColumns
            };

            search.create(firstItemSearchCriteria).run().each(function (result, i) {

                var fitemId = result.getValue({
                    name: firstItemColumns[0]
                });

                lockItemIds.push(fitemId);

                return true;
            });

            log.debug('3...lockItemIds', lockItemIds);
            log.debug('3...unlockItemIds', unlockItemIds);

            // for (var i = 0; i < workorderItemListIds.length; i++) {
            //     for (var j = 0; j < lockItemIds.length; j++) {
            //         if (workorderItemListIds[i] !== lockItemIds[j]) {
            //             unlockItemIds.push(workorderItemListIds[i]);
            //         }
            //     }
            // }

            unlockItemIds = workorderItemListIds.filter(function (val) {
                return lockItemIds.indexOf(val) === -1
            });

            log.debug('4...unlockItemIds', unlockItemIds);

            //3.完工单信息
            workordercompletionFilters = [
                ["type", "anyof", "WOCompl"],
                "AND",
                ["mainline", "is", "F"],
                "AND",
                ["taxline", "is", "F"],
                "AND",
                ["shipping", "is", "F"],
                "AND",
                ["cogs", "is", "F"],
                "AND",
                ["inventorydetail.inventorynumber", "noneof", "@NONE@"],
                "AND",
                ["createdfrom", "anyof", woId]
            ];

            workordercompletionColumns = [{
                    name: 'item', //编号
                    summary: "GROUP"
                },
                {
                    name: 'inventorynumber', //编号
                    join: "inventoryDetail",
                    summary: "GROUP"
                },
                {
                    name: 'quantity', //编号
                    join: "inventoryDetail",
                    summary: "SUM"
                }
                // {
                //     name: 'formulanumeric', //编号
                //     summary: "SUM",
                //     formula: "abs({quantity})"
                // }
            ];

            workordercompletionSearchCriteria = {
                type: 'workordercompletion',
                filters: workordercompletionFilters,
                columns: workordercompletionColumns
            };

            search.create(workordercompletionSearchCriteria).run().each(function (result, i) {

                workordercompletionObj = {};

                for (var j = 0; j < workordercompletionColumns.length; j++) {
                    var cc = workordercompletionColumns[j]['name'];

                    workordercompletionObj[cc] = result.getValue({
                        name: workordercompletionColumns[j]
                    });
                }

                workordercompletionList.push(workordercompletionObj);

                return true;
            });

            log.debug('workordercompletionList', workordercompletionList);

            //1.入库单查询
            itemreceiptColumns = [{
                    name: 'item', //货品
                    summary: "GROUP"
                },
                {
                    name: 'inventorynumber', //编号
                    join: 'inventoryDetail',
                    summary: "GROUP"
                },
                {
                    name: 'location', //地点
                    summary: "GROUP"
                },
                {
                    name: 'quantity', //批次数量
                    join: 'inventoryDetail',
                    summary: "SUM"
                }
            ];

            itemreceiptFilters = [
                ["type", "anyof", "ItemRcpt"],
                "AND",
                ["createdfrom.type", "anyof", "TrnfrOrd"],
                "AND",
                ["mainline", "is", "F"],
                "AND",
                ["createdfrom.custbody_wip_work_order_id", "anyof", woId],
                "AND",
                ["cogs", "is", "F"],
                "AND",
                ["shipping", "is", "F"],
                "AND",
                ["taxline", "is", "F"],
                "AND",
                ["createdfrom.custbody_wip_transfer_type", "anyof", "1", "2"],
                //"AND",
                //["internalid", "anyof", "150864"],
                "AND",
                ["inventorydetail.inventorynumber", "noneof", "@NONE@"]
            ]

            itemreceiptSearchCriteria = {
                type: 'itemreceipt',
                filters: itemreceiptFilters,
                columns: itemreceiptColumns
            };

            log.debug('itemreceiptSearchCriteria', itemreceiptSearchCriteria);

            search.create(itemreceiptSearchCriteria).run().each(function (result, i) {

                itemreceiptObj = {};

                for (var j = 0; j < itemreceiptColumns.length; j++) {
                    var cc = itemreceiptColumns[j]['name'];

                    itemreceiptObj[cc] = result.getValue({
                        name: itemreceiptColumns[j]
                    });
                }

                itemreceiptList.push(itemreceiptObj);

                return true;
            });

            log.debug('operationList', itemreceiptList);

            for (var i = 0; i < itemreceiptList.length; i++) {
                if (itemIds.indexOf(itemreceiptList[i]['item']) == -1) {
                    itemIds.push(itemreceiptList[i]['item']);
                }

                if (inventorynumberIds.indexOf(itemreceiptList[i]['inventorynumber']) == -1) {
                    inventorynumberIds.push(itemreceiptList[i]['inventorynumber']);
                }

                if (locationIds.indexOf(itemreceiptList[i]['location']) == -1) {
                    locationIds.push(itemreceiptList[i]['location']);
                }
            }

            log.debug('itemIds', itemIds);
            log.debug('inventorynumberIds', inventorynumberIds);
            log.debug('locationIds', locationIds);

            //2.1获取库存现有量
            if (unlockItemIds.length && inventorynumberIds.length && locationIds.length) {
                itemFilters = [
                    ["type", "anyof", "InvtPart", "Assembly"],
                    "AND",
                    ["internalid", "anyof"].concat(unlockItemIds),
                    "AND",
                    ["inventorynumber.quantityonhand", "greaterthan", "0"],
                    "AND",
                    ["inventorynumber.internalid", "anyof"].concat(inventorynumberIds),
                    "AND",
                    ["inventorynumber.location", "anyof"].concat(locationIds)
                ];

                itemColumns = [{
                        name: 'internalid' //编号
                        //summary: "GROUP",
                    },
                    {
                        name: 'internalid', //编号
                        join: "inventoryNumber",
                        //summary: "GROUP",
                        sortdir: "ASC"
                    },
                    {
                        name: 'quantityonhand', //现有量
                        join: "inventoryNumber"
                        //summary: "SUM"
                    }
                    // {
                    //     name: 'inventorynumber', //编号
                    //     join: "inventoryNumber",
                    //     summary: "GROUP",
                    //     sortdir: "ASC"
                    // },
                    // {
                    //     name: 'location', //地点
                    //     join: "inventoryNumber"
                    //     // summary: "GROUP"
                    // }
                ];

                itemSearchCriteria = {
                    type: 'item',
                    filters: itemFilters,
                    columns: itemColumns
                };

                log.debug('itemSearchCriteria', itemSearchCriteria);

                search.create(itemSearchCriteria).run().each(function (result, i) {

                    itemObj = {};

                    for (var j = 0; j < itemColumns.length; j++) {
                        var cc = itemColumns[j]['name'],
                            dd = itemColumns[j]['join'];

                        if (dd) {
                            itemObj[dd + cc] = result.getValue({
                                name: itemColumns[j]
                            });
                        } else {
                            itemObj[cc] = result.getValue({
                                name: itemColumns[j]
                            });
                        }
                    }

                    itemList.push(itemObj);

                    return true;
                });

                log.debug('itemList', itemList);

                for (var i = 0; i < itemList.length; i++) {
                    var ikey = itemList[i]['internalid'].toString() +
                        itemList[i]['inventoryNumberinternalid'].toString();

                    if (!sitemObj[ikey]) {
                        sitemObj[ikey] = {
                            internalid: itemList[i]['internalid'],
                            inventoryNumberinternalid: itemList[i]['inventoryNumberinternalid'],
                            inventoryNumberquantityonhand: itemList[i]['inventoryNumberquantityonhand']
                        };
                    } else {
                        sitemObj[ikey]['inventoryNumberquantityonhand'] += itemList[i]['inventoryNumberquantityonhand'];
                    }
                }

                log.debug('sitemObj', sitemObj);

                Object.keys(sitemObj).forEach(function (result) {
                    sitemList.push(sitemObj[result]);
                    return true;
                });

                log.debug('sitemList', sitemList);
            }

            //4.第一次转换
            // for (var i = 0; i < itemreceiptList.length; i++) {
            //     for (var j = 0; j < sitemList.length; j++) {
            //         if (itemreceiptList[i]['item'] == sitemList[j]['internalid'] &&
            //             itemreceiptList[i]['inventorynumber'] == sitemList[j]['inventoryNumberinternalid']) {
            //             //log.debug('dfd', itemreceiptList[i]['item']);
            //             itemreceiptList[i]['inventoryNumberquantityonhand'] = sitemList[j]['inventoryNumberquantityonhand'];
            //         }
            //     }
            // }
            for (var i = 0; i < sitemList.length; i++) {
                for (var j = 0; j < itemreceiptList.length; j++) {
                    if (sitemList[i]['internalid'] == itemreceiptList[j]['item'] && //item
                        sitemList[i]['inventoryNumberinternalid'] == itemreceiptList[j]['inventorynumber']) { //inventoryNumberinternalid
                        //log.debug('dfd', itemreceiptList[i]['item']);
                        sitemList[i]['quantity'] = itemreceiptList[j]['quantity'];
                        sitemList[i]['location'] = itemreceiptList[j]['location'];
                        sitemList[i]['item'] = itemreceiptList[j]['item'];
                        sitemList[i]['inventorynumber'] = itemreceiptList[j]['inventorynumber'];
                    }
                }
            }

            log.debug('sitemList', sitemList);

            //5.第二次转换
            for (var i = 0; i < sitemList.length; i++) {
                for (var j = 0; j < workordercompletionList.length; j++) {
                    if (sitemList[i]['item'] == workordercompletionList[j]['item'] &&
                        sitemList[i]['inventorynumber'] == workordercompletionList[j]['inventorynumber']) {
                        //log.debug('dfd', itemreceiptList[i]['item']);
                        sitemList[i]['quantity'] = sitemList[i]['quantity'] - workordercompletionList[j]['quantity'];
                    }
                }
            }


            // for (var i = 0; i < itemreceiptList.length; i++) {
            //     for (var j = 0; j < workordercompletionList.length; j++) {
            //         if (itemreceiptList[i]['item'] == workordercompletionList[j]['item'] &&
            //             itemreceiptList[i]['inventorynumber'] == workordercompletionList[j]['inventorynumber']) {
            //             //log.debug('dfd', itemreceiptList[i]['item']);
            //             itemreceiptList[i]['quantity'] = itemreceiptList[i]['quantity'] - workordercompletionList[j]['quantity'];
            //         }
            //     }
            // }

            log.debug('itemreceiptList', itemreceiptList);

            //6
            for (var i = 0; i < sitemList.length; i++) {
                if (!totalObj[sitemList[i]['item']]) {
                    totalObj[sitemList[i]['item']] = {
                        item: sitemList[i]['item'],
                        location: sitemList[i]['location'],
                        quantity: sitemList[i]['quantity'],
                        inventoryNumberquantityonhand: sitemList[i]['inventoryNumberquantityonhand'],
                    }
                } else {
                    totalObj[sitemList[i]['item']]['quantity'] = Number(totalObj[sitemList[i]['item']]['quantity']) +
                        Number(sitemList[i]['quantity']);
                    totalObj[sitemList[i]['item']]['inventoryNumberquantityonhand'] = Number(totalObj[sitemList[i]['item']]['inventoryNumberquantityonhand']) +
                        Number(sitemList[i]['inventoryNumberquantityonhand']);
                }
            }

            log.debug('totalObj', totalObj);

            for (var i = 0; i < sitemList.length; i++) {
                fffList.push({
                    item: sitemList[i].item,
                    inventorynumber: sitemList[i].inventorynumber,
                    location: sitemList[i].location,
                    quantity: sitemList[i].quantity,
                    inventoryNumberquantityonhand: sitemList[i].inventoryNumberquantityonhand
                });
            }

            log.debug('fffList', fffList);

            //重置sitemList
            sitemList = [];
            itemList = [];

            //2.2
            if (lockItemIds.length) {
                itemFilters = [
                    ["type", "anyof", "InvtPart", "Assembly"],
                    "AND",
                    ["internalid", "anyof"].concat(lockItemIds),
                    "AND",
                    ["inventorynumber.quantityonhand", "greaterthan", "0"],
                    "AND",
                    ["inventorynumber.location", "anyof", location]
                ];

                itemColumns = [{
                        name: 'internalid' //编号
                        //summary: "GROUP",
                    },
                    {
                        name: 'internalid', //编号
                        join: "inventoryNumber",
                        //summary: "GROUP",
                        sortdir: "ASC"
                    },
                    {
                        name: 'quantityonhand', //现有量
                        join: "inventoryNumber"
                        //summary: "SUM"
                    },
                    // {
                    //     name: 'inventorynumber', //编号
                    //     join: "inventoryNumber",
                    //     summary: "GROUP",
                    //     sortdir: "ASC"
                    // },
                    {
                        name: 'location', //地点
                        join: "inventoryNumber"
                        // summary: "GROUP"
                    }
                ];

                itemSearchCriteria = {
                    type: 'item',
                    filters: itemFilters,
                    columns: itemColumns
                };

                log.debug('itemSearchCriteria', itemSearchCriteria);

                search.create(itemSearchCriteria).run().each(function (result, i) {

                    itemObj = {};

                    for (var j = 0; j < itemColumns.length; j++) {
                        var cc = itemColumns[j]['name'],
                            dd = itemColumns[j]['join'];

                        if (dd) {
                            itemObj[dd + cc] = result.getValue({
                                name: itemColumns[j]
                            });
                        } else {
                            itemObj[cc] = result.getValue({
                                name: itemColumns[j]
                            });
                        }
                    }

                    itemList.push(itemObj);

                    return true;
                });

                log.debug('itemList', itemList);

                for (var i = 0; i < itemList.length; i++) {
                    var ikey = itemList[i]['internalid'].toString() +
                        itemList[i]['inventoryNumberinternalid'].toString();

                    if (!sitemObj[ikey]) {
                        sitemObj[ikey] = {
                            internalid: itemList[i]['internalid'],
                            inventoryNumberinternalid: itemList[i]['inventoryNumberinternalid'],
                            inventoryNumberquantityonhand: itemList[i]['inventoryNumberquantityonhand']
                        };
                    } else {
                        sitemObj[ikey]['inventoryNumberquantityonhand'] += itemList[i]['inventoryNumberquantityonhand'];
                    }
                }

                log.debug('sitemObj', sitemObj);

                Object.keys(sitemObj).forEach(function (result) {
                    sitemList.push(sitemObj[result]);
                    return true;
                });

                log.debug('sitemList', sitemList);

                //6
                for (var i = 0; i < sitemList.length; i++) {
                    if (!totalObj[sitemList[i]['internalid']]) {
                        totalObj[sitemList[i]['internalid']] = {
                            item: sitemList[i]['internalid'],
                            location: sitemList[i]['inventoryNumberlocation'],
                            quantity: sitemList[i]['inventoryNumberquantityonhand'],
                            inventoryNumberquantityonhand: sitemList[i]['inventoryNumberquantityonhand'],
                        }
                    } else {
                        totalObj[sitemList[i]['internalid']]['quantity'] = Number(totalObj[sitemList[i]['internalid']]['inventoryNumberquantityonhand']) +
                            Number(sitemList[i]['inventoryNumberquantityonhand']);
                        totalObj[sitemList[i]['internalid']]['inventoryNumberquantityonhand'] = Number(totalObj[sitemList[i]['internalid']]['inventoryNumberquantityonhand']) +
                            Number(sitemList[i]['inventoryNumberquantityonhand']);
                    }
                }

                log.debug('totalObj', totalObj);

                //转换为itemreceiptList
                itemreceiptColumns = [{
                        name: 'item', //货品
                        summary: "GROUP"
                    },
                    {
                        name: 'inventorynumber', //编号
                        join: 'inventoryDetail',
                        summary: "GROUP"
                    },
                    {
                        name: 'location', //地点
                        summary: "GROUP"
                    },
                    {
                        name: 'quantity', //批次数量
                        join: 'inventoryDetail',
                        summary: "SUM"
                    }
                ];

                for (var i = 0; i < itemList.length; i++) {
                    fffList.push({
                        item: itemList[i].internalid,
                        inventorynumber: itemList[i].inventoryNumberinternalid,
                        location: itemList[i].inventoryNumberlocation,
                        quantity: itemList[i].inventoryNumberquantityonhand,
                        inventoryNumberquantityonhand: itemList[i].inventoryNumberquantityonhand
                    });
                }
            }

            log.debug('fffList', fffList);

            Object.keys(totalObj).forEach(function (result) {
                totalList.push(totalObj[result]);
                return true;
            });

            log.debug('totalList', totalList);

            resultMsg.data.onhandTotal = totalList;
            resultMsg.data.onHandDetail = fffList;
            resultMsg.status = 'S';

            log.debug('resultMsg', resultMsg);

        } catch (e) {
            resultMsg.message = e.message;

            log.error({
                title: '提示',
                details: JSON.stringify(resultMsg)
            });
        }

        return resultMsg;
    }

    function getQuantityOnhand_bak(option) {

        var woId = option.woId,
            resultMsg = {
                //workordercompletion: workordercompletion,
                //workorder: '', //createdfrom
                status: 'E',
                data: {
                    onhandTotal: [],
                    onHandDetail: []
                }
            },
            itemreceiptFilters = [],
            itemreceiptColumns = [],
            itemreceiptSearchCriteria = {},
            itemreceiptObj = {},
            itemreceiptList = [],
            itemIds = [],
            locationIds = [],
            inventorynumberIds = [],
            itemFilters = [],
            itemColumns = [],
            itemSearchCriteria = {},
            itemObj = {},
            itemList = [],
            sitemObj = {},
            sitemList = [],
            workordercompletionFilters = [],
            workordercompletionColumns = [],
            workordercompletionSearchCriteria = {},
            workordercompletionObj = {},
            workordercompletionList = [],
            totalObj = {},
            totalList = [];

        try {
            //1.入库单查询
            itemreceiptColumns = [{
                    name: 'item', //货品
                    summary: "GROUP"
                },
                {
                    name: 'inventorynumber', //编号
                    join: 'inventoryDetail',
                    summary: "GROUP"
                },
                {
                    name: 'location', //地点
                    summary: "GROUP"
                },
                {
                    name: 'quantity', //批次数量
                    join: 'inventoryDetail',
                    summary: "SUM"
                }
            ];

            itemreceiptFilters = [
                ["type", "anyof", "ItemRcpt"],
                "AND",
                ["createdfrom.type", "anyof", "TrnfrOrd"],
                "AND",
                ["mainline", "is", "F"],
                "AND",
                ["createdfrom.custbody_wip_work_order_id", "anyof", woId],
                "AND",
                ["cogs", "is", "F"],
                "AND",
                ["shipping", "is", "F"],
                "AND",
                ["taxline", "is", "F"],
                "AND",
                ["createdfrom.custbody_wip_transfer_type", "anyof", "1", "2"],
                //"AND",
                //["internalid", "anyof", "150864"],
                "AND",
                ["inventorydetail.inventorynumber", "noneof", "@NONE@"]
            ]

            itemreceiptSearchCriteria = {
                type: 'itemreceipt',
                filters: itemreceiptFilters,
                columns: itemreceiptColumns
            };

            log.debug('itemreceiptSearchCriteria', itemreceiptSearchCriteria);

            search.create(itemreceiptSearchCriteria).run().each(function (result, i) {

                itemreceiptObj = {};

                for (var j = 0; j < itemreceiptColumns.length; j++) {
                    var cc = itemreceiptColumns[j]['name'];

                    itemreceiptObj[cc] = result.getValue({
                        name: itemreceiptColumns[j]
                    });
                }

                itemreceiptList.push(itemreceiptObj);

                return true;
            });

            log.debug('operationList', itemreceiptList);

            for (var i = 0; i < itemreceiptList.length; i++) {
                if (itemIds.indexOf(itemreceiptList[i]['item']) == -1) {
                    itemIds.push(itemreceiptList[i]['item']);
                }

                if (inventorynumberIds.indexOf(itemreceiptList[i]['inventorynumber']) == -1) {
                    inventorynumberIds.push(itemreceiptList[i]['inventorynumber']);
                }

                if (locationIds.indexOf(itemreceiptList[i]['location']) == -1) {
                    locationIds.push(itemreceiptList[i]['location']);
                }
            }

            log.debug('itemIds', itemIds);
            log.debug('inventorynumberIds', inventorynumberIds);
            log.debug('locationIds', locationIds);

            //2.获取库存现有量
            if (itemIds.length && inventorynumberIds.length && locationIds.length) {
                itemFilters = [
                    ["type", "anyof", "InvtPart", "Assembly"],
                    "AND",
                    ["internalid", "anyof"].concat(itemIds),
                    "AND",
                    ["inventorynumber.quantityonhand", "greaterthan", "0"],
                    "AND",
                    ["inventorynumber.internalid", "anyof"].concat(inventorynumberIds),
                    "AND",
                    ["inventorynumber.location", "anyof"].concat(locationIds)
                ];

                itemColumns = [{
                        name: 'internalid' //编号
                        //summary: "GROUP",
                    },
                    {
                        name: 'internalid', //编号
                        join: "inventoryNumber",
                        //summary: "GROUP",
                        sortdir: "ASC"
                    },
                    {
                        name: 'quantityonhand', //现有量
                        join: "inventoryNumber"
                        //summary: "SUM"
                    }
                    // {
                    //     name: 'inventorynumber', //编号
                    //     join: "inventoryNumber",
                    //     summary: "GROUP",
                    //     sortdir: "ASC"
                    // },
                    // {
                    //     name: 'location', //地点
                    //     join: "inventoryNumber"
                    //     // summary: "GROUP"
                    // }
                ];

                itemSearchCriteria = {
                    type: 'item',
                    filters: itemFilters,
                    columns: itemColumns
                };

                log.debug('itemSearchCriteria', itemSearchCriteria);

                search.create(itemSearchCriteria).run().each(function (result, i) {

                    itemObj = {};

                    for (var j = 0; j < itemColumns.length; j++) {
                        var cc = itemColumns[j]['name'],
                            dd = itemColumns[j]['join'];

                        if (dd) {
                            itemObj[dd + cc] = result.getValue({
                                name: itemColumns[j]
                            });
                        } else {
                            itemObj[cc] = result.getValue({
                                name: itemColumns[j]
                            });
                        }
                    }

                    itemList.push(itemObj);

                    return true;
                });

                log.debug('itemList', itemList);

                for (var i = 0; i < itemList.length; i++) {
                    var ikey = itemList[i]['internalid'].toString() +
                        itemList[i]['inventoryNumberinternalid'].toString();

                    if (!sitemObj[ikey]) {
                        sitemObj[ikey] = {
                            internalid: itemList[i]['internalid'],
                            inventoryNumberinternalid: itemList[i]['inventoryNumberinternalid'],
                            inventoryNumberquantityonhand: itemList[i]['inventoryNumberquantityonhand']
                        };
                    } else {
                        sitemObj[ikey]['inventoryNumberquantityonhand'] += itemList[i]['inventoryNumberquantityonhand'];
                    }
                }

                log.debug('sitemObj', sitemObj);

                Object.keys(sitemObj).forEach(function (result) {
                    sitemList.push(sitemObj[result]);
                    return true;
                });

                log.debug('sitemList', sitemList);
            }

            //3.完工单信息
            workordercompletionFilters = [
                ["type", "anyof", "WOCompl"],
                "AND",
                ["mainline", "is", "F"],
                "AND",
                ["taxline", "is", "F"],
                "AND",
                ["shipping", "is", "F"],
                "AND",
                ["cogs", "is", "F"],
                "AND",
                ["inventorydetail.inventorynumber", "noneof", "@NONE@"],
                "AND",
                ["createdfrom", "anyof", woId]
            ];

            workordercompletionColumns = [{
                    name: 'item', //编号
                    summary: "GROUP"
                },
                {
                    name: 'inventorynumber', //编号
                    join: "inventoryDetail",
                    summary: "GROUP"
                },
                {
                    name: 'quantity', //编号
                    join: "inventoryDetail",
                    summary: "SUM"
                }
                // {
                //     name: 'formulanumeric', //编号
                //     summary: "SUM",
                //     formula: "abs({quantity})"
                // }
            ];

            workordercompletionSearchCriteria = {
                type: 'workordercompletion',
                filters: workordercompletionFilters,
                columns: workordercompletionColumns
            };

            search.create(workordercompletionSearchCriteria).run().each(function (result, i) {

                workordercompletionObj = {};

                for (var j = 0; j < workordercompletionColumns.length; j++) {
                    var cc = workordercompletionColumns[j]['name'];

                    workordercompletionObj[cc] = result.getValue({
                        name: workordercompletionColumns[j]
                    });
                }

                workordercompletionList.push(workordercompletionObj);

                return true;
            });

            log.debug('workordercompletionList', workordercompletionList);

            //4.第一次转换
            for (var i = 0; i < itemreceiptList.length; i++) {
                for (var j = 0; j < sitemList.length; j++) {
                    if (itemreceiptList[i]['item'] == sitemList[j]['internalid'] &&
                        itemreceiptList[i]['inventorynumber'] == sitemList[j]['inventoryNumberinternalid']) {
                        //log.debug('dfd', itemreceiptList[i]['item']);
                        itemreceiptList[i]['inventoryNumberquantityonhand'] = sitemList[j]['inventoryNumberquantityonhand'];
                    }
                }
            }

            log.debug('itemreceiptList', itemreceiptList);

            //5.第二次转换
            for (var i = 0; i < itemreceiptList.length; i++) {
                for (var j = 0; j < workordercompletionList.length; j++) {
                    if (itemreceiptList[i]['item'] == workordercompletionList[j]['item'] &&
                        itemreceiptList[i]['inventorynumber'] == workordercompletionList[j]['inventorynumber']) {
                        //log.debug('dfd', itemreceiptList[i]['item']);
                        itemreceiptList[i]['quantity'] = itemreceiptList[i]['quantity'] - workordercompletionList[j]['quantity'];
                    }
                }
            }

            log.debug('itemreceiptList', itemreceiptList);

            //6
            for (var i = 0; i < itemreceiptList.length; i++) {
                if (!totalObj[itemreceiptList[i]['item']]) {
                    totalObj[itemreceiptList[i]['item']] = {
                        item: itemreceiptList[i]['item'],
                        location: itemreceiptList[i]['location'],
                        quantity: itemreceiptList[i]['quantity'],
                        inventoryNumberquantityonhand: itemreceiptList[i]['inventoryNumberquantityonhand'],
                    }
                } else {
                    totalObj[itemreceiptList[i]['item']]['quantity'] = Number(totalObj[itemreceiptList[i]['item']]['quantity']) +
                        Number(itemreceiptList[i]['quantity']);
                    totalObj[itemreceiptList[i]['item']]['inventoryNumberquantityonhand'] = Number(totalObj[itemreceiptList[i]['item']]['inventoryNumberquantityonhand']) +
                        Number(itemreceiptList[i]['inventoryNumberquantityonhand']);
                }
            }

            log.debug('totalObj', totalObj);

            Object.keys(totalObj).forEach(function (result) {
                totalList.push(totalObj[result]);
                return true;
            });

            log.debug('totalList', totalList);

            resultMsg.data.onhandTotal = totalList;
            resultMsg.data.onHandDetail = itemreceiptList;
            resultMsg.status = 'S';

            log.debug('resultMsg', resultMsg);

        } catch (e) {
            resultMsg.message = e.message;

            log.error({
                title: '提示',
                details: JSON.stringify(resultMsg)
            });
        }

        return resultMsg;
    }

    function getMapKey(itemId, lineId) {
        return itemId + '-' + lineId;
    }

    function getSoPushQtyInfo(option) {

        var purchaseorderid = option.purchaseorderid,
            cqpdFieldId = 'custcol_quantity_pushed_down', //已下推数量
            csbFieldId = 'custcol_sales_bank', //来源订单行号
            resultMsg = {
                status: 'E',
                data: {}
            },
            soColumns = [],
            soFilters = [],
            soSearchCriteria = {},
            item,
            line,
            counter = 0;

        try {
            soColumns = [{
                    name: 'item'
                },
                {
                    name: cqpdFieldId
                },
                {
                    name: csbFieldId
                }
            ];

            soFilters = [
                ["type", "anyof", "Estimate"],
                "AND",
                ["mainline", "is", "F"],
                "AND",
                ["taxline", "is", "F"],
                "AND",
                ["custcol_external", "anyof", purchaseorderid]
            ];

            soSearchCriteria = {
                type: 'estimate',
                filters: soFilters,
                columns: soColumns
            };

            search.create(soSearchCriteria).run().each(function (result, i) {


                item = result.getValue({
                    name: soColumns[0]
                });

                line = result.getValue({
                    name: soColumns[2]
                });

                resultMsg.data[getMapKey(item, line)] = {
                    qtypushed: result.getValue({
                        name: soColumns[1]
                    }) ? result.getValue({
                        name: soColumns[1]
                    }) : 0,
                };

                counter++;

                return true;
            });

            if (counter) {
                resultMsg.status = 'S';
                log.debug('resultMsg', resultMsg);
            }

        } catch (e) {
            resultMsg.message = e.message;

            log.error({
                title: '提示',
                details: JSON.stringify(resultMsg)
            });
        }

        return resultMsg;
    }

    function getFirmLevel(items){
        var firmLevel = Object.create(null)

        search.create({
            type : 'customrecord_ic_pricing_subsidiary_level',
            filters : [
                ['custrecord_ic_price_item_code' , 'anyof' , JSON.parse(items)]
            ],
            columns : ['custrecord_pricing_ratio' , 'custrecord_ic_price_item_code']
        })
        .run().each(function(res){
            firmLevel[res.getValue({name : 'custrecord_ic_price_item_code'})] = res.getValue({name : 'custrecord_pricing_ratio'})

            return true
        })

        return firmLevel
    }

    function onRequest(context) {

        //var rtn = getWorkorder(option);

        //log.debug('rtn', rtn);
        var request = context.request;
        var response = context.response;

        // var option = {
        //     woId: 165881
        // };

        // getWorkorder(option);

        // getQuantityOnhand(option);

        // var option = {
        //     entity: 13135
        // };

        // getInterPurchInfo(option);

        // var option = {
        //     subsidiary: 26,
        //     intersub: 2,
        //     currency: 2
        // };

        // getInterPriceListInfo(option);

        if (request.method === 'GET') {
            if (request.parameters.action == 'getWorkorder') {
                var option = {
                    woId: request.parameters.workorderid
                };
                var rtn = getWorkorder(option);
                response.write(JSON.stringify(rtn));
            } else if (request.parameters.action == 'getQuantityOnhand') {
                var option = {
                    woId: request.parameters.workorderid,
                    location: request.parameters.location
                };
                var rtn = getQuantityOnhand(option);
                response.write(JSON.stringify(rtn));
            } else if (request.parameters.action == 'getInterPurchInfo') {
                var option = {
                    entity: request.parameters.entity
                };
                var rtn = getInterPurchInfo(option);
                response.write(JSON.stringify(rtn));
            } else if (request.parameters.action == 'getInterPriceListInfo') {
                var option = {
                    subsidiary: request.parameters.subsidiary,
                    intersub: request.parameters.intersub,
                    currency: request.parameters.currency,
                    main: request.parameters.main
                };

                log.debug('option', option);
                var rtn = getInterPriceListInfo(option);
                response.write(JSON.stringify(rtn));
            } else if (request.parameters.action == 'getSoPushQtyInfo') {
                var option = {
                    purchaseorderid: request.parameters.purchaseorderid
                };

                log.debug('option', option);
                var rtn = getSoPushQtyInfo(option);
                response.write(JSON.stringify(rtn));
            } else if (request.parameters.action == 'getFirmLevel') {
                response.write(JSON.stringify(getFirmLevel(request.parameters.items)));
            }
        }
        // else {
        //     if (request.parameters.action == 'getQuantityOnhand') {
        //         var rtn = getItem(request.parameters.newItem);
        //         //返回结果
        //         response.write(JSON.stringify(rtn));
        //     }
        // }

        // if (request.method === 'POST') {
        //     log.debug('request.parameters.action', request.parameters.action);
        //     log.debug('request.parameters.completionValue', request.parameters.completionValue);
        //     if (request.parameters.action == 'getWorkorder') {
        //         var rtn = getWorkorder(option);
        //         response.write(JSON.stringify(rtn));
        //     }
        // }
    }

    return {
        onRequest: onRequest
    }
});
/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */


define(['N/search', 'N/record','N/format' ], function (search, record,format ) {

    //查询接口
    function _get(context) {
        //获取请求信息
        var rspMsg = '本程序目前没有get方法的返回数据';

        log.debug('context', context);
        log.debug(rspMsg);
        return rspMsg;
    }

    //批量写入接口
    function _post(context) {

       // log.debug('context', context);

        var recType = context[0].datatype;


        var contextdata = context[0].jsondata;

        var fidfield = 'fid'; //定义 第三方数据的每行数据KEY 字段

       // log.debug('recType', recType);
       // log.debug('contextdata', contextdata);
        //定义返回的JSON对象
        var rspMsg = {
            succeeded: [],
            failed: [],
            succeededCount: 0,
            result: []
        };

        var rtnresult = [];
        var rtnresultln = [];
        var fid = null;
        var code = null;
        var msg = null;
        var createRecSUSSID = null;
        var list = '[' + contextdata[0].list + ']';

        //   JSON.stringify(e)});}
       // log.debug('context.list is', list);

        var listobj = JSON.parse(list);
       // log.debug('context.list is', list);
        //log.debug('listobj is', listobj);

        //  log.debug('context.list',listobj.fid);
        //  log.debug('context.list', listobj[0].fid);
        //循环写入
        // contextdata[0].list.forEach(function (info) {
        listobj.forEach(function (info) {
           //log.debug('line 30 info', info);
            fid = null;
            code = null;
            msg = null;
            createRecSUSSID = null;

            try {
                //获取NS对应的数据类型

                try {
                    //创建记录类型
                    var createRec = record.create({
                        type: recType,
                        isDynamic: true
                    });



                    for (var key in info) {

                        //log.debug('key',key);//,infovalue:info[key]});
                        //  log.debug('info', info );//,infovalue:info[key]});

                        // log.debug('info fid',info[key].fid);//,infovalue:info[key]});
                        // log.debug('key fid',key.fid);//,infovalue:info[key]});
                        // log.debug('key fid',key.fid);//,infovalue:info[key]});
                        //  fid = info[key].fid;

                        // log.debug('data',{key:key});//,infovalue:info[key]});

                        if (key != fidfield) {
                            if (info.hasOwnProperty(key)) {

                                // var trndate = format.parse({value:transactionDateChar, type:format.Type.DATE});

                                if (key == 'custrecord_platform_end_date' || key == 'custrecord_plan_date' || key == 'custrecord_demand_date'

                                    || key == 'custrecord_plan_people' || key == 'custrecord_purchase_people'
                                ) {


                                    if (key == 'custrecord_platform_end_date' || key == 'custrecord_plan_date' || key == 'custrecord_demand_date') {
                                       
                                       // log.debug({ key: key, info: info[key] }, '设置为日期');
                                   

                                       var ddate =format.parse({ value: info[key], type: format.Type.DATE });
                                      // log.debug({ key: key, info: info[key], ddate: ddate }, '设置为日期');
                                        createRec.setValue({
                                            fieldId: key,
                                            value: ddate
                                        });

                                       // log.debug({ key: key, info: info[key], ddate: ddate }, '设置为日期');
                                    }
                                    else {

                                       // log.debug({ key: key, info: info[key] }, '设置为setText');
                                        createRec.setText({
                                            fieldId: key,
                                            text:info[key]
                                          // value: info[key]
                                        });
                                    }

                                }
                                else {
                                    // log.debug({ key: key, info: info[key] }, '置为setValue');
                                    createRec.setValue({
                                        fieldId: key,
                                        value: info[key]
                                    });
                                }
                            }
                        }

                        else { fid = info[key]; }


                    }
                    /*以下是子记录，先不处理
                                if (items) {
                                    for (var i = 0; i < items.length; i++) {
                                        purchaseorderRec.insertLine({
                                            sublistId: gItemSublistId,
                                            line: i
                                        });
                    
                                        for (var key in items[i]) {
                    
                                            if (items[i].hasOwnProperty(key)) {
                    
                                                //非批次字段处理
                                                if (key != gInventorydetailSlFieldId) {
                    
                                                    purchaseorderRec.setSublistValue({
                                                        sublistId: gItemSublistId,
                                                        fieldId: key,
                                                        line: i,
                                                        value: items[i][key]
                                                    });
                                                } else {
                    
                                                    //如果不存在地点，则退出当前循环
                                                    if (!main[gLocationFieldId]) {
                                                        continue;
                                                    }
                    
                                                    inventorydetailSubRec = purchaseorderRec.getSublistSubrecord({
                                                        sublistId: gItemSublistId,
                                                        fieldId: key,
                                                        line: i
                                                    });
                    
                                                    inventorydetailSlFieldValues = items[i][key];
                    
                                                    for (var j = 0; j < inventorydetailSlFieldValues.length; j++) {
                                                        for (var skey in inventorydetailSlFieldValues[j]) {
                                                            if (inventorydetailSlFieldValues[j].hasOwnProperty(skey)) {
                                                                inventorydetailSubRec.insertLine({
                                                                    sublistId: gInventoryassignmentSrecSlId,
                                                                    line: j
                                                                });
                    
                                                                sublistLocRecord.setSublistValue({
                                                                    sublistId: gInventoryassignmentSrecSlId,
                                                                    fieldId: skey,
                                                                    line: j,
                                                                    value: inventorydetailSlFieldValues[j][key]
                                                                });
                                                            }
                                                        }
                                                    }
                                                }
                    
                                            }
                                        }
                                    }
                                }
                                */

                    createRecSUSSID = createRec.save({
                          //enableSourcing: enableSourcing,
                          //ignoreMandatoryFields: ignoreMandatoryFields
                    });

                    code = 'S';
                    msg = '创建成功';

                } catch (ex) {
                  log.debug('context', context);

                    code = 'E';
                    msg = ex;
                    log.error({
                        title: '错误：',
                        details: ex
                    });
                }
                //将成功创建的写入返回对象
                rspMsg.succeeded.push({
                    fid: fid,
                    nsid: createRecSUSSID
                });
            } catch (err) {
                //将失败的也写入返回对象
                rspMsg.failed.push({
                    fid: fid,
                    error: err.message || err.toString()
                });
            }
        });

        rspMsg.succeededCount = rspMsg.succeeded.length;

        //返回结果
        return rspMsg;
    }

    //单个记录修改接口
    function _put(context) {
        //获取请求的参数
        var vendorId = context.vendorId;

        //定义返回的JSON对象
        var rspMsg = {};

        if (vendorId) {
            try {
                //加载现有的供应商
                var createRec = record.load({
                    type: 'vendor',
                    id: vendorId
                });
                //设置要修改的字段的值
                createRec.setValue({
                    fieldId: 'companyname',
                    value: context.newName
                });
                //保存
                rspMsg.vendorId = createRec.save({
                    ignoreMandatoryFields: true
                });
                rspMsg.status = 200;
            } catch (e) {
                log.error({
                    title: 'update vendor error',
                    details: e
                });
                //记录错误
                rspMsg.status = 400;
                rspMsg.details = e.message || e.toString();
            }
        }

        //返回结果
        return rspMsg;
    }

    //删除接口
    function _delete(context) {
        //定义返回的JSON对象
        var rspMsg = {
            deleted: [],
            failed: []
        };

        var deletedId = record.delete({
            type: 'vendor',
            id: context.vendorId
        });
        rspMsg.deleted.push({
            id: deletedId
        });
        //批量删除
        // context.list.forEach(function(vendorId, index){
        //     try {
        //         var deletedId = record.delete({
        //             type: 'vendor',
        //             id: vendorId
        //         });
        //         rspMsg.deleted.push({
        //             id : deletedId
        //         });
        //     } catch (e) {
        //         log.error({
        //             title : 'delete vendor error, vendorId is ' + vendorId,
        //             details : e
        //         });
        //         rspMsg.failed.push({
        //             id : vendorId,
        //             message : e.message
        //         });
        //     }
        // });

        rspMsg.totalDeleted = rspMsg.deleted.length;

        //返回删除的结果
        return rspMsg;
    }

    return {
        get: _get,
        post: _post,
        put: _put,
        delete: _delete
    }
});
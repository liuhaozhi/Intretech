/** 
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */

define ( ['N/record','N/search','N/ui/serverWidget'] ,
   
    function(record,search,serverWidget) {

        function myBeforeLoad (context) {
            
        }
       
        function myBeforeSubmit(context) {
           
        }
        
        function myAfterSubmit(context) {
            log.error('type',context.type);//debug
            if(context.type == 'create'){
                updateSalesOrderCode(context);//更新销售订单编号
            }
            
        }
        
        //custom functions

        /**
         * 更新销售订单编码
         * @author makaay
         * @date 2020-1-6
         */
        function updateSalesOrderCode(context){
            var orderRecord      = context.newRecord;
            var orderId          = orderRecord['id'];
            
            var newOrderRecord = record.load({
                'type': 'estimate',
                'id'  : orderId
            });
            var currentCode = newOrderRecord.getValue({'fieldId': 'tranid'});
          	 log.error('currentCode',currentCode);//debug
            var orderTypeId = orderRecord.getValue({'fieldId' : 'custbody_cust_ordertype'});
            var orderSearch = search.create({
                'type':'customrecord_sales_order_type_code',
                'filters':[
                    {
                        'name'    : 'custrecord_sales_order_type',
                        'operator': search.Operator.ANYOF,
                        'values'  : [orderTypeId]
                    }
                ],
                'columns':[
                    {'name':'custrecord_pre_code'}
                ]
            });
            var resOrderType = orderSearch.run().getRange(0,1);
			if(resOrderType.length){
                var orderTypeCode = resOrderType[0].getValue({'name':'custrecord_pre_code'});
           		var newCode   = orderTypeCode+currentCode;
            	log.error('newCode',newCode);//debug

                record.submitFields({
                    'type'  : record.Type.ESTIMATE,
                    'id'    : orderId,
                    'values': {'tranid': newCode}
                });
            }
        }

        
        return {
            beforeLoad  : myBeforeLoad,        
            beforeSubmit: myBeforeSubmit,
            afterSubmit : myAfterSubmit
        }; 
    }
);
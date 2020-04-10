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
                updateCuCode(context);//更新客户编号
            }
            
        }
        
        //custom functions

        /**
         * 更新客户编码
         * @author makaay
         * @date 2020-1-5 
         */
        function updateCuCode(context){
            var cuRecord      = context.newRecord;
            var cuId          = cuRecord['id'];
            log.error('cuId',cuId);//debug
            
            var newCuRecord = record.load({
                'type':'customer',
                'id':cuId
            });
            var currentCode = newCuRecord.getValue({'fieldId': 'entityid'});
            // log.error('tempNewCode',tempNewCode);//debug
            // var currentCode   = cuRecord.getValue({'fieldId': 'entityid'});
            var num           = currentCode.slice(-5);
            var continentId = cuRecord.getValue({'fieldId' : 'custentity_ps_mst_cuscontinent'});
            var continentSearch = search.create({
                'type':'customrecord_continue_context',
                'filters':[
                    {
                        'name':'internalId',
                        'operator':search.Operator.ANYOF,
                        'values':[continentId]
                    }
                ],
                'columns':[
                    {'name':'custrecord_continue_code'}
                ]
            });
            var resContinent = continentSearch.run().getRange(0,1);
            var continentNum = resContinent[0].getValue({'name':'custrecord_continue_code'});
            // var continentNum  = continentName.split(' ')[0];

            var countryId   = cuRecord.getValue({'fieldId' : 'custentity_ps_mst_cuscountry'});
            var countrySearch = search.create({
                'type':'customrecord_country_continue_contact',
                'filters':[
                    {
                        'name':'internalId',
                        'operator':search.Operator.ANYOF,
                        'values':[countryId]
                    }
                ],
                'columns':[
                    {'name':'name'}
                ]
            });
            var resCountry = countrySearch.run().getRange(0,1);
            var countryName = resCountry[0].getValue({'name':'name'});
            var countryCode   = countryName.split(' ')[0];

            var subsidiaryId  = cuRecord.getValue({'fieldId': 'subsidiary'});
            var subRecord = record.load({'type'          : 'subsidiary','id': subsidiaryId});
            var subCode   = subRecord.getValue({'fieldId': 'tranprefix'});

            var newCode   = subCode+'.'+continentNum+'.'+countryCode+'.'+num;
            log.error('newCode',newCode);//debug

            record.submitFields({
                'type'  : record.Type.CUSTOMER,
                'id'    : cuId,
                'values': {'entityid': newCode}
            });
        }

        
        return {
            beforeLoad  : myBeforeLoad,        
            beforeSubmit: myBeforeSubmit,
            afterSubmit : myAfterSubmit
        }; 
    }
);
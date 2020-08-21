/**
 * @NApiVersion 2.1
 * @NModuleScrope Public
 */

define([],
    () =>{
        const FIELDPR = 'custpage_'

        return {
            fieldGroups : () => [
                    {
                        id : FIELDPR + 'filters',
                        label : '查询条件'
                    },
                    {
                        id : FIELDPR + 'lists',
                        label : '查询结果'
                    }
                ]
            
        }
    }
)
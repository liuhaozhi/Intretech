/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([],
    () =>{
        return {
            formUiButtons : () => [
                    {
                        action : 'addButton',
                        id : 'custpage_search',
                        label : 'Search',
                        functionName : 'searchLines' 
                    },
                    {
                        action : 'addButton',
                        id : 'custpage_ratify',
                        label : '批准',
                        functionName : 'ratifyPlan'
                    },
                    {
                        action : 'addButton',
                        id : 'custpage_refuse',
                        label : '拒绝',
                        functionName : 'refusePlan'
                    }
                ]
            
        }
    }
)
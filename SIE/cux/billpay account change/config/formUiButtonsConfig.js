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
                        action : 'addSubmitButton',
                        label : '提交变更'
                    }
                ]
            
        }
    }
)
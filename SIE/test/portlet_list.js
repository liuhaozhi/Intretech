/**
 *@NApiVersion 2.x
 *@NScriptType Portlet
 */
define([], function() {

    function render(params) {
        params.portlet.title = 'listTest'
        params.portlet.addColumn({
            id : 'custpage_test1',
            label : 'test1',
            type : 'text',
            align : 'left'
        })
        params.portlet.addColumn({
            id : 'custpage_test2',
            label : 'test2',
            type : 'text'
        })

        params.portlet.addRows({
            rows : [
                {
                    'custpage_test1' : 'test',
                    'custpage_test2' : 'test'
                },
                {
                    'custpage_test1' : 'test',
                    'custpage_test2' : 'test'
                }
            ]
        })
    }

    return {
        render: render
    }
});

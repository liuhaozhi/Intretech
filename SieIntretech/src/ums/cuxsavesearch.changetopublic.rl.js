/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */

define(["require", "exports", "N/log", "N/search", 'N/format', "N/record", "N/transaction"],
    /**
     * @param {error} error
     * @param {format} format
     * @param {record} record
     * @param {runtime} runtime
     * @param {search} search
     */
    function (require, exports, log, search, format, record, transaction) {

        /**
         * Function called upon sending a GET request to the RESTlet.
         *
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.1
         */
        function doPut(requestBody) {


        }
        function doGet(requestParams) {
            var arrList = [
'customsearch_warehouse_detail_form_2',
'customsearch_subsidiary_detail_form_3',
'customsearch_manufacturing_routing_2',
'customsearch_item_detail_form_4',
'customsearch_employee_detail_form_2',
'customsearch_department_detail_form_2',
'customsearch_wip_wo_scrap_view',
'customsearch_wip_wo_item_view',
'customsearch_bom_revision_component_fo_2'

            ];

            var n = 0, saveSchID;



            for (var i = 0; i < arrList.length; i++) {

                saveSchID = arrList[i];//数组的索引是从0开始的du

               
                log.debug(saveSchID);

                //var saveSchID = 'customsearch1044', n = 0;
                try {
                    mySearch = search.load({
                        id: saveSchID
                    });
                    mySearch.isPublic = true;
                    mySearch.save();
                    n = n + 1;

                }


                catch (e) {
                    log.debug('error', e);
                }

            }





            log.debug('供处理订单数据：' + n);
            return '供处理订单数据：' + n;
        }



        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPost(requestBody) {


        }

        /**
         * Function called upon sending a DELETE request to the RESTlet.
         *
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doDelete(requestParams) {

        }


        return {
            'get': doGet,
            put: doPut,
            post: doPost,
            'delete': doDelete
        };

    });

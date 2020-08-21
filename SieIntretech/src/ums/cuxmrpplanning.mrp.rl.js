/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */

define(["require", "exports",  "N/log", "N/search", 'N/format', "N/record", "N/transaction", "N/task"],
    /**
     * @param {error} error
     * @param {format} format
     * @param {record} record
     * @param {runtime} runtime
     * @param {search} search
     */
    function (require, exports, log, search, format, record, transaction, task) {

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


            var mrTask = task.create({
                taskType : task.TaskType.MAP_REDUCE
             });
             mrTask.scriptId ='customscript_cuxmrpplanning_mrp';
             mrTask.deploymentId = 'customdeploy_cuxmrpplanning_mrp';
            // mrTask.params = {
                //custscriptcustom_data : 'data'
            // };
             mrTask.submit();
             return "MAP_REDUCE updated";

         

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

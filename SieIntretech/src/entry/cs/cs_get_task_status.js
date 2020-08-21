/**
 *@NApiVersion 2.0
 */
define([], function() {

    function refreshPage(context) {
        window.location.reload();
    }

    return {
        refreshPage: refreshPage
    }
});
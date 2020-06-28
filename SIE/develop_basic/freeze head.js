/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([], function() {
    function lineInit(context) {
        var windowHeight = jQuery(window).height()

        jQuery('.uir-machine-table-container').filter(function (index, elem) {
            return jQuery(elem).height() > windowHeight && jQuery(elem).attr('freenze') !== 'true';
        }).css('height', '70vh').attr('freenze','true').bind('scroll', function (event) {
            var headerElem = jQuery(event.target).find('.uir-machine-headerrow');
            headerElem.css('transform', "translate(0, ".concat(event.target.scrollTop, "px)"));
        }).bind('scroll', function (event) {
            var headerElem = jQuery(event.target).find('.uir-list-headerrow');
            headerElem.css('transform', "translate(0, ".concat(event.target.scrollTop, "px)"));
        })
    }

    return {
        lineInit: lineInit
    }
});

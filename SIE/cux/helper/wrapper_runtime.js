/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */
define([
    'N/runtime'
], function(runtime) {

    function isFeatureInEffect(feature) {
        return runtime.isFeatureInEffect(feature)
    }

    function isOW() {
        return isFeatureInEffect('SUBSIDIARIES')
    }

    function isLocationEnabled() {
        return isFeatureInEffect('LOCATIONS')
    }

    function isDepartmentEnabled() {
        return isFeatureInEffect('DEPARTMENTS')
    }

    function isClassesEnabled() {
        return isFeatureInEffect('CLASSES')
    }

    function isMultiCurrency() {
        return isFeatureInEffect('MULTICURRENCY')
    }

    function isMultipleCalendars() {
        return isFeatureInEffect('MULTIPLECALENDARS')
    }

    function isGLAuditNumbering() {
        return isFeatureInEffect('GLAUDITNUMBERING')
    }

    function getUserLanguage() {
        return runtime.getCurrentUser().getPreference('LANGUAGE')
    }

    function getUserTimezone() {
        return runtime.getCurrentUser().getPreference('TIMEZONE')
    }

    function getUserMaxdropdownsize() {
        return runtime.getCurrentUser().getPreference('MAXDROPDOWNSIZE')
    }

    function isUseAccountNumber() {
        return runtime.getCurrentUser().getPreference('ACCOUNTNUMBERS')
    }

    function getCurrentScript() {
        return runtime.getCurrentScript()
    }

    function getCurrentSession() {
        return runtime.getCurrentSession()
    }

    function getCurrentUser() {
        return runtime.getCurrentUser()
    }

    function  getCurrentUserId() {
        return runtime.getCurrentUser().id
    }

    return {
        isFeatureInEffect : isFeatureInEffect,
        isOW : isOW,
        isMultiCurrency : isMultiCurrency,
        isMultipleCalendars : isMultipleCalendars,
        getUserLanguage : getUserLanguage,
        getUserTimezone : getUserTimezone,
        getUserMaxdropdownsize : getUserMaxdropdownsize,
        isUseAccountNumber : isUseAccountNumber,
        getCurrentUser : getCurrentUser,
        isGLAuditNumbering : isGLAuditNumbering,
        getCurrentScript : getCurrentScript,
        getCurrentSession : getCurrentSession,
        isLocationEnabled : isLocationEnabled,
        isDepartmentEnabled : isDepartmentEnabled,
        isClassesEnabled : isClassesEnabled,
        getCurrentUserId : getCurrentUserId
    }
})

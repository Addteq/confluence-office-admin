"use strict";
$.fn.addteqNotification = function (options) {
    $.fn.addteqNotification.defaults = {
        title: "",
        fadeout: true,
        target: "body",
        delay: 3000
    };
    options = $.extend({}, $.fn.addteqNotification.defaults, options);
    this.showSuccessMsg = function () {
        if (jQuery(options.target).find(".adt-success-msg").length == 0) {
            AJS.messages.success({
                title: options.title,
                fadeout: options.fadeout,
                target: options.target,
                delay: options.delay
            }).addClass('adt-success-msg adt-aui-msg').prependTo(options.target);
        }
    };
    this.showWarningMsg = function () {
        if (jQuery(options.target).find(".adt-warning-msg").length == 0) {
            AJS.messages.warning({
                title: options.title,
                body: options.body,
                fadeout: options.fadeout,
                target: options.target,
                delay: options.delay
            }).addClass('adt-warning-msg adt-aui-msg').prependTo(options.target);
        }
    };
    this.showGenericMsg = function () {
        if (jQuery(options.target).find(".adt-generic-msg").length == 0) {
            AJS.messages.generic({
                title: options.title,
                fadeout: options.fadeout,
                target: options.target,
                delay: options.delay
            }).addClass('adt-generic-msg adt-aui-msg').prependTo(options.target);
        }
    };
    this.showErrorMsg = function () {
        if (jQuery(".adt-error-msg").length === 0) {
            var $msgObj = AJS.messages.error({
                title: options.title,
                body: options.body,
                fadeout: options.fadeout,
                target: options.target,
                delay: options.delay
            });
            $msgObj.addClass("adt-error-msg adt-aui-msg").prependTo(options.target);
        }
    };
    this.removeMsg = function () {
        jQuery(".adt-aui-msg").remove();
    };
    return this;
};
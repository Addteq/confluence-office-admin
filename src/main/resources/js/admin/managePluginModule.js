/**
 * Filename: managePluginModule.js
 * This file takes care of plugin module management on the Admin section.
 * @type {type}
 */
AJS.toInit(function () {
    var toggle = document.getElementById('userProfileModule');
    if (toggle == null) {
        return;
    }
    var requestRunning = false;
    var toggleValue = toggle.checked;
    // Cache error message
    var processingMsgTitle = AJS.I18n.getText("com.addteq.confluence.plugin.officeadmin.admin.manage-module.process.title");
    var processingMsgBody = AJS.I18n.getText("com.addteq.confluence.plugin.officeadmin.admin.manage-module.process.body");

    /**
     * To enable/disable Plugin Module
     */
    jQuery('#userProfileModule').on("click", function () {
        toggle.busy = true;
        if (requestRunning) {
            return;
        }
        requestRunning = true;
        toggle.disabled = true;
        // Show time to be taken in this process
        showHintMessage(processingMsgTitle, processingMsgBody, false);
        jQuery("#enableOrDisableUserProfile").submit();
    });

    //Show error message
    function showHintMessage(titleName, actualMessage, fadeout) {
        var $msgObj = AJS.messages.hint({
            title: titleName,
            body: actualMessage,
            fadeout: fadeout,
            closeable: false
        });
        $msgObj.addClass("eui-aui-msg").appendTo("#admin-body-content");
    }
});

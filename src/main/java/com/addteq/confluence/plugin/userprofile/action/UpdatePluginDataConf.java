package com.addteq.confluence.plugin.userprofile.action;

import com.atlassian.confluence.core.ConfluenceActionSupport;
import com.atlassian.confluence.setup.settings.SettingsManager;
import com.atlassian.upm.api.license.PluginLicenseManager;
import com.atlassian.upm.api.license.entity.PluginLicense;
import java.util.logging.Level;
import java.util.logging.Logger;

public class UpdatePluginDataConf extends ConfluenceActionSupport {

    private static final long serialVersionUID = -1154390784766196630L;

    private final PluginLicenseManager licenseManager;
    private String licenseErrorHtml;
     private final SettingsManager settingsManager;

    public UpdatePluginDataConf(PluginLicenseManager licenseManager, SettingsManager settingsManager) {
        this.licenseManager = licenseManager;
        this.settingsManager=settingsManager;
    }

    @Override
    public String execute() throws Exception {
        String contextPATH=settingsManager.getGlobalSettings().getBaseUrl();
        String redirectURL=contextPATH+"/plugins/servlet/upm/manage/all#manage";
        try {
            if (licenseManager.getLicense().isDefined()) {
                PluginLicense pluginLicense = licenseManager.getLicense().get();
                if (pluginLicense.getError().isDefined()) {
                    // handle license error scenario
                    // (e.g., expiration or user mismatch)
                    String msg = "Office Admin plugin: license " + pluginLicense.getError().get().name().toLowerCase();
                    String expirationMessage = "<div class=\"aui-message warning officeAdminUnlicensedError\">"
                            + "<p class=\"title\">"
                            + "<span class=\"aui-icon icon-warning\"></span>"
                            + "<strong>" + msg + ". Please "+"<a href='"+redirectURL+"'>install</a>"+" a license."+"</strong></p>"
                            + "</div>";
                    licenseErrorHtml = expirationMessage + "</br>";
                    return ERROR;
                } else {
                    return SUCCESS;
                }
            } else {
                // handle unlicensed scenario
                String expirationMessage = "<div class=\"aui-message warning officeAdminUnlicensedError\">"
                        + "<p class=\"title\">"
                        + "<span class=\"aui-icon icon-warning\"></span>"
                        + "<strong>Office Admin plugin: unlicensed. Please "+"<a href='"+redirectURL+"'>install</a>"+" a license.</strong></p>"
                        + "</div>";
                licenseErrorHtml = expirationMessage + "</br>";
                return ERROR;
            }
        } catch (Exception e) {
            Logger.getLogger(UpdatePluginDataConf.class.getName()).log(Level.SEVERE, null, e);
                String expirationMessage = "<div class=\"aui-message warning officeAdminUnlicensedError\">"
                        + "<p class=\"title\">"
                        + "<span class=\"aui-icon icon-warning\"></span>"
                        + "<strong>Office Admin plugin: unlicensed. Please "+"<a href='"+redirectURL+"'>install</a>"+" a license.</strong></p>"
                        + "</div>";
            licenseErrorHtml = expirationMessage + "</br>";
            return ERROR;
        }
    }

    public String getLicenseErrorHtml() {
        return licenseErrorHtml;
    }

    @Override
    public String doDefault() throws Exception {
        return SUCCESS;
    }

}

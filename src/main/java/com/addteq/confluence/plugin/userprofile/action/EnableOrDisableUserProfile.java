/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.addteq.confluence.plugin.userprofile.action;

import com.addteq.confluence.plugin.officeadmin.service.ModuleManagerService;
import com.addteq.confluence.plugin.officeadmin.utils.PluginModuleKeyUtils;
import com.atlassian.confluence.core.ConfluenceActionSupport;
import com.atlassian.upm.api.license.PluginLicenseManager;
import com.atlassian.upm.api.license.entity.PluginLicense;
import static com.opensymphony.xwork.Action.ERROR;
import static com.opensymphony.xwork.Action.SUCCESS;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Action class to enable or disable User Profile Module
 *
 * @author Vikash Kumar <vikash.kumar@addteq.com>
 */
public class EnableOrDisableUserProfile extends ConfluenceActionSupport {

    private final ModuleManagerService moduleManagerService;
    private Boolean isUserProfileEnabled;
    private final PluginLicenseManager licenseManager;
    private String licenseErrorHtml;
    private static final Logger LOGGER = LoggerFactory.getLogger(ModuleManager.class);

    public EnableOrDisableUserProfile(ModuleManagerService moduleManagerService,
            PluginLicenseManager licenseManager) {

        this.moduleManagerService = moduleManagerService;
        this.licenseManager = licenseManager;
    }


    @Override
    public String execute() throws Exception {
        String licenseCheck = licenseCheck();
        if (ERROR.equals(licenseCheck)) {
            return licenseCheck;
        }
        if (isUserProfileEnabled == null) {
            addActionError("The state of User Profile Module is Unknown. Please check Confluence log for more details.");
            return SUCCESS;
        }
        /**
         * If the value of userProfileEnabled is false means currently the user
         * profile is disable and in that case it has to be enabled and so on.
         */
        if (isUserProfileEnabled) {
            if (moduleManagerService.disable(PluginModuleKeyUtils.USER_PROFILE)) {
                isUserProfileEnabled = false;
            } else {
                addActionError("Something went wrong while disabling User Profile Module. Please check Confluence log for more details.");
            }
        } else {
            if (moduleManagerService.enable(PluginModuleKeyUtils.USER_PROFILE)) {
                isUserProfileEnabled = true;
            } else {
                addActionError("Something went wrong while disabling User Profile Module. Please check Confluence log for more details.");
            }
        }

        return SUCCESS;
    }

    private String licenseCheck() {
        try {
            if (licenseManager.getLicense().isDefined()) {
                PluginLicense pluginLicense = licenseManager.getLicense().get();
                if (pluginLicense.getError().isDefined()) {
                    // handle license error scenario
                    // (e.g., expiration or user mismatch)
                    licenseErrorHtml = "Please resolvle the Office Admin plugin license status: " + pluginLicense.getError().get().name().toLowerCase() + ".";
                    return ERROR;
                } else {
                    return SUCCESS;
                }
            } else {
                // handle unlicensed scenario
                licenseErrorHtml = "Office Admin plugin is unlicensed.";
                return ERROR;
            }
        } catch (Exception e) {
            LOGGER.error("Error while checking license: ", e);
            licenseErrorHtml = "The system was not able to check plugin license. Please check Confluence log for detail.";
            return ERROR;
        }
    }

    public Boolean getIsUserProfileEnabled() {
        return isUserProfileEnabled;
    }

    public void setIsUserProfileEnabled(Boolean isUserProfileEnabled) {
        this.isUserProfileEnabled = isUserProfileEnabled;
    }

    public String getLicenseErrorHtml() {
        return licenseErrorHtml;
    }

    public void setLicenseErrorHtml(String licenseErrorHtml) {
        this.licenseErrorHtml = licenseErrorHtml;
    }

}

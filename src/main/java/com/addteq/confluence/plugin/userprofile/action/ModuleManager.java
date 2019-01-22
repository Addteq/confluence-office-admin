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
 * ModuleManager is a Confluence Action class which shows the view in the admin
 * section where user can perform enable/disable operations.
 *
 * @author Vikash Kumar <vikash.kumar@addteq.com>
 */
public class ModuleManager extends ConfluenceActionSupport {

    private final ModuleManagerService moduleManagerService;
    private Boolean isUserProfileEnabled;
    private final PluginLicenseManager licenseManager;
    private String licenseErrorHtml;
    private static final Logger LOGGER = LoggerFactory.getLogger(ModuleManager.class);

    public ModuleManager(ModuleManagerService moduleManagerService,
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
        isUserProfileEnabled = moduleManagerService.isEnabled(PluginModuleKeyUtils.USER_PROFILE);
        return SUCCESS;
    }

    private String licenseCheck() {
        try {
            if (licenseManager.getLicense().isDefined()) {
                PluginLicense pluginLicense = licenseManager.getLicense().get();
                if (pluginLicense.getError().isDefined()) {
                    // handle license error scenario
                    // (e.g., expiration or user mismatch)
                    licenseErrorHtml = "Please resolvle the Office Admin plugin license status: "
                            + pluginLicense.getError().get().name().toLowerCase() + ".";
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
            licenseErrorHtml = "The plugin system was not able to check license. Please check Confluence log for detail.";
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

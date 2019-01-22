package com.addteq.confluence.plugin.officeadmin.service;

import com.addteq.confluence.plugin.officeadmin.utils.PluginModuleKeyUtils;
import com.atlassian.plugin.PluginAccessor;
import com.atlassian.plugin.PluginController;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;

/**
 * Implement the ModuleManagerService, intended to provide concrete behavior of
 * Enabling/Disabling various plug-in modules. Currently this only takes care of
 * `User Profile` modules. If you want to provide * enable/disable features to
 * other modules then you just need to add their module keys under
 * PluginModuleKeyutils and call methods of this class by pass the
 * moduleCompleteKey accordingly.
 *
 * @author Vikash Kumar <vikash.kumar@addteq.com>
 */
public class ModuleManagerServiceImpl implements ModuleManagerService {

    private final PluginAccessor pluginAccessor;
    private final PluginController pluginController;
    private static final Logger LOGGER = LoggerFactory.getLogger(ModuleManagerServiceImpl.class);

    public ModuleManagerServiceImpl(PluginAccessor pluginAccessor,
            @Qualifier("pluginController") PluginController pluginController) {

        this.pluginAccessor = pluginAccessor;
        this.pluginController = pluginController;
    }

    @Override
    public boolean isEnabled(String moduleCompleteKey) {
        List moduleKeys = PluginModuleKeyUtils.getModuleKey(moduleCompleteKey);
        for (Object moduleKey : moduleKeys) {
            if (!pluginAccessor.isPluginModuleEnabled(moduleKey.toString())) {
                return false;
            }
        }
        return true;
    }

    @Override
    public boolean enable(String moduleCompleteKey) {
        Boolean result = true;
        try {
            List moduleKeys = PluginModuleKeyUtils.getModuleKey(moduleCompleteKey);
            for (Object moduleKey : moduleKeys) {
                pluginController.enablePluginModule(moduleKey.toString());
            }
        } catch (Exception e) {
            LOGGER.debug("Module could not be enabled.", e);
            result = false;
        }
        return result;
    }

    @Override
    public boolean disable(String moduleCompleteKey) {
        Boolean result = true;
        try {
            List<String> moduleKeys = PluginModuleKeyUtils.getModuleKey(moduleCompleteKey);
            for (String moduleKey : moduleKeys) {
                pluginController.disablePluginModule(moduleKey);
            }
        } catch (Exception e) {
            LOGGER.debug("Module could not be enabled.", e);
            result = false;
        }
        return result;
    }
}

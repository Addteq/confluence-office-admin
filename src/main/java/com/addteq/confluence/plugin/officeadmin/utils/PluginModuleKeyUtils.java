package com.addteq.confluence.plugin.officeadmin.utils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * General Util class which contains all the modules keys for a particular
 * feature. Currently, it has only `User profile`. If you want to add other
 * modules then define a new variable e.g public static final String AVATAR =
 * "avatar" and add to new List<String> USER_AVATAR_MODULE_KEYS = new
 * ArrayList().
 *
 * @author Vikash Kumar <vikash.kumar@addteq.com>
 */
public class PluginModuleKeyUtils {

    static final Map<String, List> PLUGIN_MODULES = new HashMap();
    static final List<String> USER_PROFILE_MODULE_KEYS = new ArrayList();
    public static final String USER_PROFILE = "userprofile";
    public static final String ENABLE = "enable";
    public static final String DISABLE = "disable";
    public static final String PLUGIN_KEY_PREFIX = "com.addteq.officeadmin:";

    //private constructor to hide the implicit public one.
    private PluginModuleKeyUtils() {

    }

    static {
        // Add all the module keys related to user profile to the list
        USER_PROFILE_MODULE_KEYS.add(PLUGIN_KEY_PREFIX + "userprofile");
        USER_PROFILE_MODULE_KEYS.add(PLUGIN_KEY_PREFIX + "UserProfileUpdateData");
        USER_PROFILE_MODULE_KEYS.add(PLUGIN_KEY_PREFIX + "userprofile-rest-resource");
        USER_PROFILE_MODULE_KEYS.add(PLUGIN_KEY_PREFIX + "user-profile-resource-userprofile-admin");
        USER_PROFILE_MODULE_KEYS.add(PLUGIN_KEY_PREFIX + "user-profile-resource-general-admin-v-1.0");
        USER_PROFILE_MODULE_KEYS.add(PLUGIN_KEY_PREFIX + "user-profile-resource-admin");
        USER_PROFILE_MODULE_KEYS.add(PLUGIN_KEY_PREFIX + "user-profile-resource-userprofile-1");
        USER_PROFILE_MODULE_KEYS.add(PLUGIN_KEY_PREFIX + "bootstrap-resource-admin");
        USER_PROFILE_MODULE_KEYS.add(PLUGIN_KEY_PREFIX + "manage_revisions");
        /**
         * Add user profile key list to the map similarly you can add other
         * module key list to the map with a new key in future if there is a
         * need e.g pluginModules.put("avatar", avatarModuleKeys);
         */
        PLUGIN_MODULES.put(USER_PROFILE, USER_PROFILE_MODULE_KEYS);

    }
    /**
     * Return list of module key for the given module name (user defined) e.g
     * `userprofile`
     *
     * @param moduleName Name of the module defined by developer `userprofile`
     * @return List of plug-in module names.
     */
    public static List getModuleKey(String moduleName) {
        return PLUGIN_MODULES.get(moduleName);
    }

}

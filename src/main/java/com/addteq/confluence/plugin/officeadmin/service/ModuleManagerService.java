package com.addteq.confluence.plugin.officeadmin.service;

/**
 * Interface to provide enable or disable behavior to an implementing class.
 *
 * @author Vikash Kumar <vikash.kumar@addteq.com>
 */
public interface ModuleManagerService {

    /**
     * Return true or false if the given moduleCompleteKey is enabled or
     * disabled respectively.
     *
     * @param moduleCompleteKey: Complete key of the desired module.
     * @return true/false.
     */
    boolean isEnabled(String moduleCompleteKey);

    /**
     * Return true or false if the enabling happens successfully for the given
     * moduleCompletekey.
     *
     * @param moduleCompleteKey: Complete key of the desired module.
     * @return true/false.
     */
    boolean enable(String moduleCompleteKey);

    /**
     * Return true or false if the disabling happens successfully for the given
     * moduleCompletekey.
     *
     * @param moduleCompleteKey: Complete key of the desired module.
     * @return true/false.
     */
    boolean disable(String moduleCompleteKey);
}

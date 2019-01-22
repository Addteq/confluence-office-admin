/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package com.addteq.confluence.plugin.userprofile.db;

import net.java.ao.Entity;
import net.java.ao.schema.StringLength;

/**
 * Profile data string is a minimized version of the custom data against a user which is put in for 
 * searching optimization in the people directory
 *
 */
public interface SearchProfileDB extends Entity {

    String getUsername();
    void setUsername(String username);
    
    @StringLength(StringLength.UNLIMITED)
    String getProfileData();
    void setProfileData(String profileData);

}


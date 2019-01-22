/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package com.addteq.confluence.plugin.userprofile.bean;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "admin")
@XmlAccessorType(XmlAccessType.PUBLIC_MEMBER)

public class SearchProfileBean {

    private String username;
    private String profileData;
    private boolean hardUpdate;
    private String result;
    private int fromIndex;
    private int toIndex;

    public int getFromIndex() {
        return fromIndex;
    }

    public void setFromIndex(int fromIndex) {
        this.fromIndex = fromIndex;
    }

    public int getToIndex() {
        return toIndex;
    }

    public void setToIndex(int toIndex) {
        this.toIndex = toIndex;
    }
    
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getProfileData() {
        return profileData;
    }

    public void setProfileData(String profileData) {
        this.profileData = profileData;
    }

    public boolean isHardUpdate() {
        return hardUpdate;
    }

    public void setHardUpdate(boolean hardUpdate) {
        this.hardUpdate = hardUpdate;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }
 
}

package com.addteq.confluence.plugin.userprofile.bean;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlRootElement;

/**
 * Used to save and retrieve records of PowerGroupDB.
 * Type can be a individual user or a group.
 */
@XmlRootElement(name = "userProfilePowerGroupManager")
@XmlAccessorType(XmlAccessType.PUBLIC_MEMBER)
public class PowerGroupRestBean {

    private String type;
    private String name;

    public PowerGroupRestBean() {

    }

    public PowerGroupRestBean(String type, String name) {
        this.type = type;
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

}

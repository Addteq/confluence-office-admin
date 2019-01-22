/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.addteq.confluence.plugin.userprofile.bean;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * @author trupti kanase
 */


@XmlRootElement(name = "userProfilePowerGroupManager")
@XmlAccessorType(XmlAccessType.PUBLIC_MEMBER)


public class SearchPowerUserRestBean {
    String label,value,description,icon;

    public SearchPowerUserRestBean() {

    }

    public SearchPowerUserRestBean(String label,String value, String description,String icon) {
        this.label = label;
        this.value = value;
        this.description = description;
        this.icon= icon;
    }
    
    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }
    
    public String getValue(){
        return value;
    }
    
    public void setValue(String value) {
       this.value= value;
    }
    
}

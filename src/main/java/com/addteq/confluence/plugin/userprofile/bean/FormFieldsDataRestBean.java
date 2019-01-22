package com.addteq.confluence.plugin.userprofile.bean;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlRootElement;

/**
 * Used to save and retrieve records in FormFieldsDataDB 
 * @author neeraj bodhe
 */

@XmlRootElement(name = "UserProfileFieldsManager")
@XmlAccessorType(XmlAccessType.PUBLIC_MEMBER)
public class FormFieldsDataRestBean {

    private String userId;
    private String fieldId;
    private String value;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getFieldId() {
        return fieldId;
    }

    public void setFieldId(String fieldId) {
        this.fieldId = fieldId;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

}

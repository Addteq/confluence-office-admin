package com.addteq.confluence.plugin.userprofile.bean;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlRootElement;

/**
 * Used to save and retrieve records in FormBuilderDB
 * All the below fields are used for configuring HTML fields of a input or any other form field
 * @author neeraj bodhe
 */

@XmlRootElement(name = "userProfileManager")
@XmlAccessorType(XmlAccessType.PUBLIC_MEMBER)
public class FormBuilderRestBean {


    private String type;
    private String idOrName;
    private String label;
    private String helpDesk;
    private String placeholder;
    private String size;
    private String options;        
    private boolean required;
    private boolean removedField;   // This is to determine if it is temporarily removed and the user can restore it back in the configuration.

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getIdOrName() {
        return idOrName;
    }

    public void setIdOrName(String idOrName) {
        this.idOrName = idOrName;
    }
    
    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getHelpDesk() {
        return helpDesk;
    }

    public void setHelpDesk(String helpDesk) {
        this.helpDesk = helpDesk;
    }

    public String getPlaceholder() {
        return placeholder;
    }

    public void setPlaceholder(String placeholder) {
        this.placeholder = placeholder;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getOptions() {
        return options;
    }

    public void setOptions(String options) {
        this.options = options;
    }

    public boolean isRequired() {
        return required;
    }

    public void setRequired(boolean required) {
        this.required = required;
    }
    
    public boolean isRemovedField() {
        return removedField;
    }

    public void setRemovedField(boolean removedField) {
        this.removedField = removedField;
    }
}

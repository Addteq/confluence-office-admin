
package com.addteq.confluence.plugin.userprofile.db;

import net.java.ao.Entity;
import net.java.ao.schema.StringLength;

/**
 * 
 * @author neeraj bodhe
 */

/**
 * This entity is used for storing the fields configured by a user in General Settings ---> Configure Form 
 * All fields have some properties which describe them 
 * These properties are all HTML properties of a html element eg:- INPUT, TEXTAREA, SELECT etc
 * The properties which describe that html element are all defined in this class. 
 */
public interface FormBuilderDB extends Entity {

    public String getType();
    public void setType(String type);

    public String getIdOrName();
    public void setIdOrName(String IDorName);
    
    public String getLabel();
    public void setLabel(String label);

    public String getHelpDesk();
    public void setHelpDesk(String helpDesk);

    public String getPlaceholder();
    public void setPlaceholder(String placeholder);

    public String getSize();
    public void setSize(String size);

    @StringLength(StringLength.UNLIMITED)
    public String getOptions();
    public void setOptions(String options);

    public boolean isRequired();
    public void setRequired(boolean required);    
    
    public boolean isRemovedField();
    public void setRemovedField(boolean removedField);
}

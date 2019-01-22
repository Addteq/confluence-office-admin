
package com.addteq.confluence.plugin.userprofile.db;

import net.java.ao.Entity;
import net.java.ao.schema.StringLength;

/**
 * 
 * @author neeraj bodhe
 */

/**
 * This entity is responsible for storing the data against any custom configured field and for a particular user.
 * 
 */
public interface FormFieldsDataDB extends Entity {

    public String getUserId(); 
    public void setUserId(String userId);

    public String getFieldId();
    public void setFieldId(String fieldId);

    @StringLength(StringLength.UNLIMITED)
    public String getValue();
    public void setValue(String value);
    
}
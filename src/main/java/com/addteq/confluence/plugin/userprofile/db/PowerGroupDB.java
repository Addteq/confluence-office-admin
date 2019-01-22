package com.addteq.confluence.plugin.userprofile.db;

import net.java.ao.Entity;

/**
 * The power user functionality in the General Configuration --> Permissions section is maintained in this entity object
 * The type field here stores whether the name is a username or a confluence-group.
 * 
 */
public interface PowerGroupDB extends Entity {
    
    public String getType();

    public void setType(String type);

    public String getName();

    public void setName(String name);
}

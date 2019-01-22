
package com.addteq.confluence.plugin.floorplan;

import net.java.ao.Entity;

/**
 * This entity is used to maintain persistence between the original image checksum and resized image checksum related to the 
 * attached image to the page.
 * @author neeraj bodhe
 */
public interface ImageMappingDB extends Entity{
    
    public String getImageChecksum();
    public void setImageChecksum(String imageChecksum);
    
    public String getResizedImageChecksum();
    public void setResizedImageChecksum(String resizedImageChecksum);
    
    public String getAttachmentId();
    public void setAttachmentId(String attachmentId);
    
}

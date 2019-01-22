
package com.addteq.confluence.plugin.floorplan;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;

/**
 *
 * @author neeraj bodhe
 */
@XmlAccessorType(XmlAccessType.PUBLIC_MEMBER)
public class ImageMappingModel {

    private String imageChecksum;
    private String resizedImageChecksum;
    private String attachmentId;

    public String getImageChecksum() {
        return imageChecksum;
    }

    public void setImageChecksum(String imageChecksum) {
        this.imageChecksum = imageChecksum;
    }

    public String getResizedImageChecksum() {
        return resizedImageChecksum;
    }

    public void setResizedImageChecksum(String resizedImageChecksum) {
        this.resizedImageChecksum = resizedImageChecksum;
    }

    public String getAttachmentId() {
        return attachmentId;
    }

    public void setAttachmentId(String attachmentId) {
        this.attachmentId = attachmentId;
    }
    
}

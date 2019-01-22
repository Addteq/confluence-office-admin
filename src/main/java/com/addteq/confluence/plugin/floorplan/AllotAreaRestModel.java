/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package com.addteq.confluence.plugin.floorplan;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * @author vikashkumar
 */
@XmlRootElement(name = "allotedArea")
@XmlAccessorType(XmlAccessType.PUBLIC_MEMBER)
public class AllotAreaRestModel {
    private long id;
    private int type;
    private int x1;
    private int y1;
    private int height;
    private int width;
    private String note;
    private long pageId;
    private String userProfileUrl;
    private long created;
    private long modified;
    private String checksum;
    private String username;
    private long userId;
    private String userTitle;    
    //private boolean hasActionError;
    //private String actionError;
    // Below tow properties can be used for any types of message, error
    private boolean hasActionAlert;
    private String actionAlert;
    private boolean confirm;
    
    private String resourceUrl;
    private String seatNo;
    private String profilePicLink;
    private String macroId;
    private String macroName;
    private int viewportwidth;
    private int allotedId;
    private boolean showLabel;
    private boolean showAllRecords;
    
    public AllotAreaRestModel() {
        
    }
    
    public AllotAreaRestModel(int type,int pageId,String macroId,String checksum,long created) {
        this.type = type;
        this.pageId = pageId;
        this.macroId = macroId;
        this.checksum = checksum;
        this.created = created;
    }
    
    public AllotAreaRestModel(int id, int type, int x1, int y1, int height, int width, String note, int pageId, 

        String userProfileUrl, long created, long modified, String checksum, String username, int userId, String userTitle, String macroId, String macroName, int allotedId,boolean showLabel) {
        this.type =  type;
        this.id = id;
        this.x1 = x1;
        this.y1 = y1;
        this.height = height;
        this.width = width;
        this.note = note;
        this.pageId = pageId;
        this.userProfileUrl = userProfileUrl;
        this.created = created;
        this.modified = modified;
        this.checksum = checksum;
        this.username = username;
        this.userId = userId;
        this.userTitle = userTitle;
        this.macroId = macroId;
        this.macroName = macroName;
        this.allotedId = allotedId;
        this.showLabel = showLabel;
    }

    public int getType() {
        return type;
    }

    public void setType(int type) {
        this.type = type;
    }

    public int getX1() {
        return x1;
    }

    public void setX1(int x1) {
        this.x1 = x1;
    }

    public int getY1() {
        return y1;
    }

    public void setY1(int y1) {
        this.y1 = y1;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public int getWidth() {
        return width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public long getPageId() {
        return pageId;
    }

    public void setPageId(long pageId) {
        this.pageId = pageId;
    }

    public String getUserProfileUrl() {
        return userProfileUrl;
    }

    public void setUserProfileUrl(String userProfileUrl) {
        this.userProfileUrl = userProfileUrl;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public long getCreated() {
        return created;
    }

    public void setCreated(long created) {
        this.created = created;
    }

    public long getModified() {
        return modified;
    }

    public void setModified(long modified) {
        this.modified = modified;
    }

    public String getChecksum() {
        return checksum;
    }

    public void setChecksum(String checksum) {
        this.checksum = checksum;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public long getUserId() {
        return userId;
    }

    public void setUserId(long userId) {
        this.userId = userId;
    }

    public String getUserTitle() {
        return userTitle;
    }

    public void setUserTitle(String userTitle) {
        this.userTitle = userTitle;
    }

    public boolean getHasActionAlert() {
        return hasActionAlert;
    }

    public void setHasActionAlert(boolean hasActionAlert) {
        this.hasActionAlert = hasActionAlert;
    }

    public String getActionAlert() {
        return actionAlert;
    }

    public void setActionAlert(String actionAlert) {
        this.actionAlert = actionAlert;
    }

    public boolean isConfirm() {
        return confirm;
    }

    public void setConfirm(boolean confirm) {
        this.confirm = confirm;
    }

    public String getResourceUrl() {
        return resourceUrl;
    }

    public void setResourceUrl(String resourceUrl) {
        this.resourceUrl = resourceUrl;
    }

    public String getSeatNo() {
        return seatNo;
    }

    public void setSeatNo(String seatNo) {
        this.seatNo = seatNo;
    }

    public String getProfilePicLink() {
        return profilePicLink;
    }

    public void setProfilePicLink(String profilePicLink) {
        this.profilePicLink = profilePicLink;
    }

    public String getMacroId() {
        return macroId;
    }

    public void setMacroId(String macroId) {
        this.macroId = macroId;
    }

    public String getMacroName() {
        return macroName;
    }

    public void setMacroName(String macroName) {
        this.macroName = macroName;
    }

    public int getViewportwidth() {
        return viewportwidth;
    }

    public void setViewportwidth(int viewportwidth) {
        this.viewportwidth = viewportwidth;
    }
   
    public int getAllotedId() {
        return allotedId;
    }

    public void setAllotedId(int allotedId) {
        this.allotedId = allotedId;
    }
    
    public boolean equals(Object o) {
        return ((AllotAreaRestModel) o).pageId == this.pageId && ((AllotAreaRestModel) o).checksum.equals(this.checksum);
    }

    public int hashCode() {
        return Long.toString(pageId).hashCode() + checksum.hashCode();
    }
    
    public boolean getShowLabel() {
        return showLabel;
    }

    public void setShowLabel(boolean showLabel) {
        this.showLabel = showLabel;
    }

	public boolean isShowAllRecords() {
		return showAllRecords;
	}

	public void setShowAllRecords(boolean showAllRecords) {
		this.showAllRecords = showAllRecords;
	}
}
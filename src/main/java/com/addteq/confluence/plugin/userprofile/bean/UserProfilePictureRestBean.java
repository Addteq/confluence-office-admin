package com.addteq.confluence.plugin.userprofile.bean;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlRootElement;

/**
 * This bean is used for the purpose of storing a custom profile picture which is cropped and kept in the base directory
 * The details are temporarily used and are not used to access any AO
 * @author trupti kanase
 */
@XmlRootElement(name = "userProfilePictureManager")
@XmlAccessorType(XmlAccessType.PUBLIC_MEMBER)

public class UserProfilePictureRestBean {

    private String userName, profilePicString, profilePicType, changeSmallPic , crop, xcord, ycord, width, height,responseText;

    public UserProfilePictureRestBean() {

    }

    public UserProfilePictureRestBean(String userName, String profilePicString, String profilePicType, String changeSmallPic, String crop, String xcord, String ycord, String width, String height,String errorMessage) {
        this.userName = userName;
        this.profilePicString = profilePicString;
        this.profilePicType = profilePicType;
        this.crop = crop;
        this.xcord = xcord;
        this.ycord = ycord;
        this.width = width;
        this.height = height;
        this.changeSmallPic = changeSmallPic;
        this.responseText=responseText;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getProfilePicString() {
        return profilePicString;
    }

    public void setProfilePicString(String profilePicString) {
        this.profilePicString = profilePicString;
    }

    public String getProfilePicType() {
        return profilePicType;
    }

    public void setProfilePicType(String profilePicType) {
        this.profilePicType = profilePicType;
    }

    public String getCrop() {
        return crop;
    }

    public void setCrop(String crop) {
        this.crop = crop;
    }

    public String getXcord() {
        return xcord;
    }

    public void setXcord(String xcord) {
        this.xcord = xcord;
    }

    public String getYcord() {
        return ycord;
    }

    public void setYcord(String ycord) {
        this.ycord = ycord;
    }

    public String getWidth() {
        return width;
    }

    public void setWidth(String width) {
        this.width = width;
    }

    public String getHeight() {
        return height;
    }

    public void setHeight(String height) {
        this.height = height;
    }

    public String getChangeSmallPic() {
        return changeSmallPic;
    }

    public void setChangeSmallPic(String changeSmallPic) {
        this.changeSmallPic = changeSmallPic;
    }

    public String getResponseText() {
        return responseText;
    }

    public void setResponseText(String responseText) {
        this.responseText = responseText;
    }

}

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.addteq.confluence.plugin.avatar;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.confluence.pages.Attachment;
import com.atlassian.confluence.setup.settings.SettingsManager;
import com.atlassian.confluence.user.ConfluenceUser;
import com.atlassian.confluence.user.PersonalInformation;
import com.atlassian.confluence.user.PersonalInformationManager;
import com.atlassian.confluence.user.UserAccessor;
import com.atlassian.confluence.user.actions.ProfilePictureInfo;
import com.atlassian.confluence.user.service.UserProfileService;
import com.atlassian.sal.api.transaction.TransactionCallback;
import com.atlassian.user.User;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;
import javax.imageio.ImageIO;
import net.coobird.thumbnailator.Thumbnails;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.log4j.Logger;


/**
 *
 * @author vkumar
 */
public class AvatarManagerImpl implements AvatarManager {

    private final UserAccessor userAccessor;
    private final SettingsManager settingsManager;
    private final ActiveObjects ao;
    private final PersonalInformationManager personalInformationManager;
    private final String ADDTEQ_AVATAR = "/download/resources/com.addteq.officeadmin/images/addteqAvatar.png";
    private final Logger LOGGER = Logger.getLogger(AvatarManagerImpl.class.getName());
    public AvatarManagerImpl(UserProfileService userProfileService,
            UserAccessor userAccessor,
            SettingsManager settingsManager,
            ActiveObjects ao,
            PersonalInformationManager personalInformationManager) {

        this.userAccessor = userAccessor;
        this.settingsManager = settingsManager;
        this.ao = ao;
        this.personalInformationManager = personalInformationManager;
    }

    @Override
    public byte[] getAvatar(String secretKey, int size) throws Exception {
        InputStream is = null;
        if (!secretKey.equals("addteq")) {
            UserSecretDB[] usdb = ao.find(UserSecretDB.class, " SECRET_KEY = ?", secretKey);
            int n = (usdb.length) > 1 ? -1 : (usdb.length);
            switch (n) {
                case 1: // MD5 record found for the user
                    String username = usdb[0].getUsername();
                    ConfluenceUser confluenceUser = userAccessor.getUserByName(username);
                    ProfilePictureInfo profilePicInfo = userAccessor.getUserProfilePicture(confluenceUser);
                    if (!profilePicInfo.isDefault()) {
                        PersonalInformation userPersonalInformation = personalInformationManager.getOrCreatePersonalInformation(confluenceUser);
                        List<Attachment> attachments = userPersonalInformation.getAttachments();
                        is = attachments.get(attachments.size() - 1).getContentsAsStream();
                    } else {
                        is = getDefualtAvatar();
                    }
                    break;
                case 0: // No MD5 record found hence send default avatar
                    is = getDefualtAvatar();
                    break;
                case -1: // More than 2 MD5 found for this user, send default avatar and log the error
                    is = getDefualtAvatar();
                    LOGGER.error("More than one entries found for this user (secret key): " + secretKey);
            }
        } else {
            is = getDefualtAvatar();
        }
        
        byte[] imageBytes = resizeImage(is, size, size, "png");
        return imageBytes;

    }

    @Override
    public UserSecretDB generateMD5(final User user) {
        return ao.executeInTransaction(new TransactionCallback<UserSecretDB>() {
            @Override
            public UserSecretDB doInTransaction() {
                UserSecretDB[] usdb = ao.find(UserSecretDB.class, " USERNAME = ?", user.getName());
                UserSecretDB userSecretDB = null;
                if (usdb.length == 0) {
                    userSecretDB = ao.create(UserSecretDB.class);
                    userSecretDB.setUsername(user.getName());
                    userSecretDB.setSecretKey(DigestUtils.md5Hex(user.getEmail()));
                    userSecretDB.save();
                }
                return userSecretDB;
            }
        });
    }

    private byte[] resizeImage(InputStream is, int width, int height, String type) throws IOException {
        BufferedImage image = Thumbnails.of(is).size(width, height).outputFormat(type).asBufferedImage();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        byte[] bytes = baos.toByteArray();
        return bytes;
    }

    private InputStream getDefualtAvatar() throws MalformedURLException, IOException {
        String profilePicUrl = settingsManager.getGlobalSettings().getBaseUrl() + ADDTEQ_AVATAR;
        URL imageUrl = new URL(profilePicUrl);
        return imageUrl.openStream();
    }
}

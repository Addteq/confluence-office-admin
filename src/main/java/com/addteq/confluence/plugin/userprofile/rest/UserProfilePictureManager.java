package com.addteq.confluence.plugin.userprofile.rest;

import com.addteq.confluence.plugin.userprofile.bean.UserProfilePictureRestBean;
import com.atlassian.config.util.BootstrapUtils;
import com.atlassian.confluence.core.service.RunAsUserCommand;
import com.atlassian.confluence.user.UserAccessor;
import com.atlassian.confluence.user.service.SetProfilePictureCommand;
import com.atlassian.confluence.user.service.UserProfileService;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import com.atlassian.user.User;
import static com.opensymphony.xwork.Action.SUCCESS;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Iterator;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.FileImageOutputStream;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.log4j.Logger;
import sun.misc.BASE64Decoder;
import sun.misc.BASE64Encoder;

/**
 *
 * @author trupti kanase
 */
@Path("/userProfilePictureManager")
public class UserProfilePictureManager {

    private final UserProfileService userProfileService;
    private final UserAccessor userAccessor;
    private final Logger LOGGER =  Logger.getLogger(UserProfilePictureManager.class.getName());

    public UserProfilePictureManager(UserProfileService userProfileService, UserAccessor userAccessor) {
        this.userProfileService = userProfileService;
        this.userAccessor = userAccessor;
    }

    @POST
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/uploadProfilePic")
    public Response uploadProfilePic(final UserProfilePictureRestBean userProfilePictureRestBean) throws IOException {
        BufferedImage avatarImage;
        String userName = userProfilePictureRestBean.getUserName();
        String profilePicString = userProfilePictureRestBean.getProfilePicString();
        String profilePicType = userProfilePictureRestBean.getProfilePicType();
        String crop = userProfilePictureRestBean.getCrop();
        String changeSmallPic = userProfilePictureRestBean.getChangeSmallPic();
        if(changeSmallPic == null || "".equals(changeSmallPic) || !"false".equals(changeSmallPic)){
            changeSmallPic="true";
        }
        BASE64Decoder decoder = new BASE64Decoder();
        byte[] decodedBytes = decoder.decodeBuffer(profilePicString);
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(decodedBytes));

        User u=userAccessor.getUserByName(userName);       
        if(u == null){
            UserProfilePictureRestBean userProfilePictureResponseBean = new UserProfilePictureRestBean();
            userProfilePictureResponseBean.setResponseText("User "+userName+" does not exist.");
            return Response.status(Response.Status.BAD_REQUEST).entity(userProfilePictureResponseBean).build();
        }
        
        if("true".equals(changeSmallPic)){
            if (crop.equals("true")) {
                int xcord = (int) Float.parseFloat(userProfilePictureRestBean.getXcord());
                int ycord = (int) Float.parseFloat(userProfilePictureRestBean.getYcord());
                int width = (int) Float.parseFloat(userProfilePictureRestBean.getWidth());
                int height = (int) Float.parseFloat(userProfilePictureRestBean.getHeight());              
                if(width > image.getWidth()){
                    width=image.getWidth();
                }
                if(height > image.getHeight()){
                    height=image.getHeight();
                }
                
                avatarImage = image.getSubimage(xcord, ycord, width, height);
            } else {
                avatarImage = image;
            }
            uploadImageAsAvtar(userName, avatarImage, profilePicType);
        }
        saveImageInPluginsFolder(image, u.getEmail(), profilePicType);
        
        UserProfilePictureRestBean userProfilePictureResponseBean = new UserProfilePictureRestBean();
        userProfilePictureResponseBean.setResponseText("Uploaded Successfully...!!!");
        return Response.status(Response.Status.OK).entity(userProfilePictureResponseBean).build();
    }

    @GET
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/getProfilePic")
    public String getProfilePic(@QueryParam("user") String userName) throws IOException {
        File tempDir = new File(BootstrapUtils.getBootstrapManager().getApplicationHome());

        File requestedFileByEmail = new File(tempDir + "/UserProfilePlugin/ProfilePictures/" + userAccessor.getUserByName(userName).getEmail());
        File profilePic=requestedFileByEmail;
        if(!profilePic.exists()) {
            profilePic = new File(tempDir + "/UserProfilePlugin/ProfilePictures/" + userName);
            if(profilePic.exists()) {
                if(profilePic.renameTo(requestedFileByEmail)) {
                    profilePic = requestedFileByEmail;
                } else {
                    LOGGER.error("Profile picture could not renamed to email address");
                }
            }    
        }
               
        if(profilePic.exists()){
            BufferedImage img = ImageIO.read(profilePic);
            String encodedString = encodeToString(img, "jpg");
            
            // Set response body content. response body is returned as Ajax Response Text
            return "<img src=\"data:image/jpg;base64," + encodedString + "\" class=\"userPicture\">";

        } else{
            return "<div id=\"profilePicPlaceholder\" class=\"userPicture\"></div>";
        }
    }

    public String saveImageInPluginsFolder(BufferedImage image, String imageName, String profilePicType) throws IOException {

        File tempDir = new File(BootstrapUtils.getBootstrapManager().getApplicationHome());
        String uploadFile = tempDir + "/UserProfilePlugin/ProfilePictures/" + imageName;

        File f = new File(uploadFile);
        if (!f.exists()) {
            f.getParentFile().mkdirs();
            f.createNewFile();
        } else {
            f.delete();
        }
        compressAndStore(f, image, profilePicType);
        return SUCCESS;

    }

    public static void compressAndStore(File f, BufferedImage oldImage, String profilePicType) throws IOException {
        // Get a ImageWriter for jpg format.
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        ImageWriter writer = (ImageWriter) writers.next();

        BufferedImage newImage;
        if ("jpg".equals(profilePicType)) {
            newImage = oldImage;
        } else { //Convert all images in jpg format first otherwise some png images changes its color after upload
            newImage = new BufferedImage(oldImage.getWidth(), oldImage.getHeight(), BufferedImage.TYPE_INT_RGB);
            newImage.createGraphics().drawImage(oldImage, 0, 0, Color.WHITE, null);
        }

        // Create the ImageWriteParam to compress the image.
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_DEFAULT);

        FileImageOutputStream output = new FileImageOutputStream(f);
        writer.setOutput(output);
        writer.write(null, new IIOImage(newImage, null, null), param);
    }

    private void uploadImageAsAvtar(String userName, BufferedImage image, String profilePicType) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, profilePicType, baos);
        baos.flush();
        byte[] imageInByte = baos.toByteArray();
        baos.close();
        InputStream is = new ByteArrayInputStream(imageInByte);
        User user=userAccessor.getUserByName(userName);
        SetProfilePictureCommand setProfilePictureCommand = userProfileService.newSetProfilePictureCommand(user, is, userName);
        RunAsUserCommand runAsUser=new RunAsUserCommand(user,setProfilePictureCommand);
        runAsUser.execute();
    }

    public static String encodeToString(BufferedImage image, String type) {
        String imageString = null;
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try {
            ImageIO.write(image, type, bos);
            byte[] imageBytes = bos.toByteArray();
            BASE64Encoder encoder = new BASE64Encoder();
            imageString = encoder.encode(imageBytes);
            bos.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return imageString;
    }
}

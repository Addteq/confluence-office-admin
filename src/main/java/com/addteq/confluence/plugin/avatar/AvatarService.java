/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.addteq.confluence.plugin.avatar;

import com.atlassian.confluence.user.UserAccessor;
import com.atlassian.confluence.user.service.UserProfileService;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import com.atlassian.user.User;
import java.io.ByteArrayInputStream;
import java.util.List;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.log4j.Logger;

/**
 *
 * @author Vikash Kumar
 */
@Path("/")
public class AvatarService {

    private final UserProfileService userProfileService;
    private final UserAccessor userAccessor;
    private final AvatarManager avatarManager;
    private final Logger LOGGER = Logger.getLogger(AvatarService.class.getName());
    public AvatarService( UserProfileService userProfileService, 
                            UserAccessor userAccessor,
                            AvatarManager avatarManager
                          ) {
        this.userProfileService = userProfileService;
        this.userAccessor = userAccessor;
        this.avatarManager = avatarManager;
    } 

    @GET
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces("image/jpg")
    @Path("/avatar{noop: (/)?}{secretKey: .*}")
    public Response getProfilePic(@DefaultValue("addteq") @PathParam("secretKey") String secretKey,
                                  @DefaultValue("80") @QueryParam("size") String size,
                                  @DefaultValue("80") @QueryParam("s") String s
                                ) throws Exception {
        int tempS, tempSize;
        try{
            tempS = Integer.parseInt(s);
        } catch (Exception e) {
            LOGGER.error("Invalid avatar size: "+e);
            tempS = 80;
        }
        
        try{
            tempSize = Integer.parseInt(size);
        } catch (Exception e) {
            LOGGER.error("Invalid avatar size: "+e);
            tempSize = 80;
        }
        if(tempSize == 80) {
            if(tempS==80) {
                tempSize = 80;
            } else {
                tempSize = tempS;
            }
        }
        // Restrict size/s of avatar image from 1 to 400
        if(tempSize < 4) {
            tempSize = 4;
        } else if (tempSize > 400) {
            tempSize = 400;
        }
        
        secretKey = secretKey.length()>=32?secretKey.substring(0 , 32):"addteq";
        byte[] imageData = avatarManager.getAvatar(secretKey, tempSize);
        ByteArrayInputStream bais = new ByteArrayInputStream(imageData);
        return Response.ok(bais).build();
    }
    
    @GET
    @AnonymousAllowed
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/generateMD5")
    public Response populateUserSecretKey() {
        List<User> userNameList = userAccessor.getUsers().getCurrentPage();
        for (User user : userNameList) {
            avatarManager.generateMD5(user);
        }
        return Response.ok("Done").build();
    }
}

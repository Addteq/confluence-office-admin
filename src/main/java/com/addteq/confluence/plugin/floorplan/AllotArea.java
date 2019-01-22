/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package com.addteq.confluence.plugin.floorplan;

import com.addteq.confluence.plugin.userprofile.bean.PowerGroupRestBean;
import com.addteq.confluence.plugin.userprofile.db.PowerGroupDB;
import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.confluence.languages.LocaleManager;
import static com.atlassian.confluence.mail.template.AbstractMailNotificationQueueItem.MIME_TYPE_HTML;
import com.atlassian.confluence.mail.template.ConfluenceMailQueueItem;
import com.atlassian.confluence.pages.Page;
import com.atlassian.confluence.pages.PageManager;
import com.atlassian.confluence.renderer.radeox.macros.MacroUtils;
import com.atlassian.confluence.security.Permission;
import com.atlassian.confluence.security.PermissionManager;
import com.atlassian.confluence.setup.settings.SettingsManager;
import com.atlassian.confluence.user.AuthenticatedUserThreadLocal;
import com.atlassian.confluence.user.ConfluenceUser;
import com.atlassian.confluence.user.UserAccessor;
import com.atlassian.confluence.util.i18n.I18NBean;
import com.atlassian.confluence.util.i18n.I18NBeanFactory;
import com.atlassian.confluence.util.velocity.VelocityUtils;
import com.atlassian.core.task.MultiQueueTaskManager;
import com.atlassian.mail.queue.MailQueueItem;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import com.atlassian.sal.api.transaction.TransactionCallback;
import com.atlassian.spring.container.ContainerManager;
import com.atlassian.user.EntityException;
import com.atlassian.user.User;
import com.google.gson.Gson;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;

/**
 *
 * @author vikashkumar
 */
@Path("/allotArea")
public class AllotArea {

    private final ActiveObjects ao;
    private final PageManager pageManager;
    private UserAccessor userAccessor;
    private final LocaleManager localeManager;
    private final I18NBeanFactory i18nBeanFactory;
    private PermissionManager permissionManager;
    public static final String MAIL = "mail";
    private final MultiQueueTaskManager taskManager;
    private final SettingsManager settingsManager; 
    private final AllotAreaService allotAreaService;
    private static final Logger LOGGER = Logger.getLogger(AllotArea.class.getName());
    public AllotArea(ActiveObjects ao, PageManager pageManager, UserAccessor userAccessor, LocaleManager localeManager, 
            I18NBeanFactory i18nBeanFactory, PermissionManager permissionManager, MultiQueueTaskManager taskManager, 
            SettingsManager settingsManager,  AllotAreaService allotAreaService) {
        this.ao=ao;
        this.pageManager = pageManager;
        this.userAccessor = userAccessor;
        this.localeManager = localeManager;
        this.i18nBeanFactory = i18nBeanFactory;
        this.permissionManager = permissionManager;
        this.settingsManager=  settingsManager;
        this.taskManager = taskManager;
        this.allotAreaService = allotAreaService;
    }

    /**
     * Tagging a User, Area or a resource can be achieved via this rest api call
     * Most of the params or data are same for all the 3 types and they can be distinguished by the DB field Type alloted to User as 0, Room as 1 and Resource as 2. 
     * @param allotAreaRestModel 
     * @return  Response
     */
    @POST
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/allotAreaForUser")
    public Response allotAreaForUser(final AllotAreaRestModel allotAreaRestModel) {
        boolean isPermitted = isPermitted(allotAreaRestModel.getPageId(), allotAreaRestModel.getMacroName());
        LOGGER.log(Level.WARNING , "Office Admin : Permission to tag Area/Users : ", isPermitted);
        if(!isPermitted) {
            allotAreaRestModel.setHasActionAlert(true);
            allotAreaRestModel.setActionAlert(getI18NBean().getText("com.addteq.confluence.plugin.floorplan.permission.denied"));
            return Response.ok(allotAreaRestModel).build();
        }      
        if(allotAreaRestModel.getType() == 0 ){
            User u=userAccessor.getUserByName(allotAreaRestModel.getNote());
            if(u == null){
                return Response.status(Response.Status.BAD_REQUEST).entity("User \""+allotAreaRestModel.getNote()+"\" does not exist.").build();
            }
        }
        ao.executeInTransaction(new TransactionCallback<AllotAreaRestModel>() // (1)
        {
            @Override
            public AllotAreaRestModel doInTransaction() {
                
                if(allotAreaRestModel.getCreated() == 0) {
                    AllotAreaDB[] allotAreaDb = null;
                    		
            		if(allotAreaRestModel.isShowAllRecords()) {
            			allotAreaDb = ao.find(AllotAreaDB.class, "NOTE = ? ORDER BY \"CREATED\"", allotAreaRestModel.getNote());

            		}
            		else {
            			allotAreaDb = ao.find(AllotAreaDB.class, "NOTE = ? AND CHECKSUM = ? ORDER BY \"CREATED\"", allotAreaRestModel.getNote(), allotAreaRestModel.getChecksum());
            		}
            		
                    if (allotAreaRestModel.getType() == 0 && allotAreaDb.length >= 1 ) { 
                        // If already existing ask user if he wishes to override the location 
                        //of tagged area represented in the My profile page;
                        Page page = pageManager.getPage(allotAreaDb[0].getPageId());
                        if(page == null){
                            LOGGER.log(Level.SEVERE, "Office Admin : The page with page id: {0} does not exists", allotAreaDb[0].getPageId());
                        }
                        if("primaryOrNotPrimary".equalsIgnoreCase(allotAreaRestModel.getActionAlert()) && page != null) {
                            allotAreaRestModel.setHasActionAlert(true);
                            allotAreaRestModel.setActionAlert(new StringBuilder(allotAreaRestModel.getNote()).append(" is tagged in at another location in ")
                                    .append(pageManager.getPage(allotAreaDb[0].getPageId()).getTitle()).append(", Do you wish to remove him/her from that location.").toString());                    
                            allotAreaRestModel.setConfirm(true);
                            return allotAreaRestModel;
                        } else if("primaryOrNotPrimary".equalsIgnoreCase(allotAreaRestModel.getActionAlert()) && page == null){
                            // If a user was tagged in a page earlier and the same user being tagged in another page and the earlier page is deleted and purged permanently.
                            allotAreaDb[0].setxCord(allotAreaRestModel.getX1());
                            allotAreaDb[0].setyCord(allotAreaRestModel.getY1());
                            allotAreaDb[0].setHeight(allotAreaRestModel.getHeight());
                            allotAreaDb[0].setWidth(allotAreaRestModel.getWidth());
                            allotAreaDb[0].setPageId(allotAreaRestModel.getPageId());
                            allotAreaDb[0].setChecksum(allotAreaRestModel.getChecksum());
                            allotAreaDb[0].setMacroId(allotAreaRestModel.getMacroId());
                            allotAreaDb[0].setSeatNo(allotAreaRestModel.getSeatNo());
                            allotAreaDb[0].setAllotedId(allotAreaRestModel.getAllotedId());
                            long timeInMillis = Calendar.getInstance().getTimeInMillis();
                            allotAreaDb[0].setModified(timeInMillis);                           
                            allotAreaDb[0].setViewportwidth(allotAreaRestModel.getViewportwidth());
                            allotAreaDb[0].save();
                            allotAreaRestModel.setConfirm(false);
                            return allotAreaRestModel;
                        } else if("primary".equalsIgnoreCase(allotAreaRestModel.getActionAlert())) {
                            allotAreaDb[0].setxCord(allotAreaRestModel.getX1());
                            allotAreaDb[0].setyCord(allotAreaRestModel.getY1());
                            allotAreaDb[0].setHeight(allotAreaRestModel.getHeight());
                            allotAreaDb[0].setWidth(allotAreaRestModel.getWidth());
                            allotAreaDb[0].setPageId(allotAreaRestModel.getPageId());
                            allotAreaDb[0].setChecksum(allotAreaRestModel.getChecksum());
                            allotAreaDb[0].setMacroId(allotAreaRestModel.getMacroId());
                            allotAreaDb[0].setSeatNo(allotAreaRestModel.getSeatNo());
                            allotAreaDb[0].setAllotedId(allotAreaRestModel.getAllotedId());
                            long timeInMillis = Calendar.getInstance().getTimeInMillis();
                            allotAreaDb[0].setModified(timeInMillis);                           
                            allotAreaDb[0].setViewportwidth(allotAreaRestModel.getViewportwidth());
                            allotAreaDb[0].save();
                            allotAreaRestModel.setConfirm(false);
                            return allotAreaRestModel;

                        } else if("notPrimary".equalsIgnoreCase(allotAreaRestModel.getActionAlert())) {
                            AllotAreaDB allotAreaDbInsert = ao.create(AllotAreaDB.class); // (2)
                            allotAreaDbInsert.setType(allotAreaRestModel.getType());
                            allotAreaDbInsert.setxCord(allotAreaRestModel.getX1());
                            allotAreaDbInsert.setyCord(allotAreaRestModel.getY1());
                            allotAreaDbInsert.setHeight(allotAreaRestModel.getHeight());
                            allotAreaDbInsert.setWidth(allotAreaRestModel.getWidth());
                            allotAreaDbInsert.setNote(allotAreaRestModel.getNote());
                            allotAreaDbInsert.setPageId(allotAreaRestModel.getPageId());
                            long timeInMillis = Calendar.getInstance().getTimeInMillis();
                            allotAreaDbInsert.setCreated(timeInMillis);
                            allotAreaDbInsert.setModified(timeInMillis);
                            allotAreaDbInsert.setChecksum(allotAreaRestModel.getChecksum());
                            allotAreaDbInsert.setMacroId(allotAreaRestModel.getMacroId());
                            allotAreaDbInsert.setUserId(allotAreaRestModel.getUserId());
                            allotAreaDbInsert.setSeatNo(allotAreaRestModel.getSeatNo());
                            allotAreaDbInsert.setAllotedId(allotAreaRestModel.getAllotedId());
                            allotAreaDbInsert.setViewportwidth(allotAreaRestModel.getViewportwidth());
                            allotAreaDbInsert.save();
                            allotAreaRestModel.setConfirm(false);
                            return allotAreaRestModel;
                        }
                    }
                    else {                        
                        int getAllotedAreaType = allotAreaRestModel.getType();
                        allotAreaRestModel.setAllotedId(0);
                        if( getAllotedAreaType >= 1 ){             
                            int maxAllotedId = allotAreaService.setMaxAllotedAreaId(allotAreaRestModel);
                            allotAreaRestModel.setType(getAllotedAreaType);
                            allotAreaRestModel.setAllotedId(maxAllotedId + 1);
                        }
                        AllotAreaDB[] allotAreaObj = ao.find(AllotAreaDB.class, "PAGE_ID = ? AND CHECKSUM = ? AND TYPE = -1 AND MACRO_ID = ?", allotAreaRestModel.getPageId(), allotAreaRestModel.getChecksum(), allotAreaRestModel.getMacroId());
                        //Checking if type -1 entry already exist if yes then update the old entry. Type -1 is settings entry.
                        if (allotAreaObj.length >= 1 && getAllotedAreaType == -1) {
                            allotAreaService.updateAvatarSizeEntry(allotAreaRestModel);
                            return allotAreaRestModel;
                        } else {
                            AllotAreaDB allotAreaDbInsert = ao.create(AllotAreaDB.class); // (2)
                            allotAreaDbInsert.setType(allotAreaRestModel.getType());
                            allotAreaDbInsert.setxCord(allotAreaRestModel.getX1());
                            allotAreaDbInsert.setyCord(allotAreaRestModel.getY1());
                            allotAreaDbInsert.setHeight(allotAreaRestModel.getHeight());
                            allotAreaDbInsert.setWidth(allotAreaRestModel.getWidth());
                            allotAreaDbInsert.setNote(allotAreaRestModel.getNote());
                            allotAreaDbInsert.setShowLabel(allotAreaRestModel.getShowLabel());
                            allotAreaDbInsert.setPageId(allotAreaRestModel.getPageId());
                            long timeInMillis = Calendar.getInstance().getTimeInMillis();
                            allotAreaDbInsert.setCreated(timeInMillis);
                            allotAreaDbInsert.setModified(timeInMillis);
                            allotAreaDbInsert.setChecksum(allotAreaRestModel.getChecksum());
                            allotAreaDbInsert.setMacroId(allotAreaRestModel.getMacroId());
                            allotAreaDbInsert.setUserId(allotAreaRestModel.getUserId());
                            allotAreaDbInsert.setResourceUrl(allotAreaRestModel.getResourceUrl());
                            allotAreaDbInsert.setSeatNo(allotAreaRestModel.getSeatNo());
                            allotAreaDbInsert.setAllotedId(allotAreaRestModel.getAllotedId());
                            allotAreaDbInsert.setViewportwidth(allotAreaRestModel.getViewportwidth());
                            allotAreaDbInsert.save();
                            allotAreaRestModel.setConfirm(false);
                            return allotAreaRestModel;
                        }
                    }

                } else {
                    AllotAreaDB[] allotAreaDb = ao.find(AllotAreaDB.class, "CREATED = ? ORDER BY \"CREATED\"", allotAreaRestModel.getCreated());
                    if (allotAreaDb.length >= 1 ) {
                        allotAreaDb[0].setType(allotAreaRestModel.getType());
                        allotAreaDb[0].setNote(allotAreaRestModel.getNote());
                        allotAreaDb[0].setResourceUrl(allotAreaRestModel.getResourceUrl());
                        allotAreaDb[0].setViewportwidth(allotAreaRestModel.getViewportwidth());
                        allotAreaDb[0].setShowLabel(allotAreaRestModel.getShowLabel());
                        long timeInMillis = Calendar.getInstance().getTimeInMillis();
                        allotAreaDb[0].setModified(timeInMillis);
                        allotAreaDb[0].save();
                        allotAreaRestModel.setConfirm(false);
                        return allotAreaRestModel;
                    }
                }
                return allotAreaRestModel;
            }    
        });
        if(allotAreaRestModel.isConfirm()) {
            return Response.ok(allotAreaRestModel).build();
        }
        return Response.ok(allotAreaService.getAllAllotedAreaFromDb(allotAreaRestModel, true)).build();
    }

    /**
     * This method is used to permanently remove a user tagging from the DB
     * @param allotAreaRestModel
     * @return Response
     */
    @DELETE
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/removeArea")
    public Response removeArea(final AllotAreaRestModel allotAreaRestModel) {
        boolean isPermitted = isPermitted(allotAreaRestModel.getPageId(), allotAreaRestModel.getMacroName());
        if(isPermitted) {
            ao.executeInTransaction(new TransactionCallback<Void>() {
                @Override
                public Void doInTransaction() {
                    for (AllotAreaDB allotAreaDb : ao.find(AllotAreaDB.class, "ID = ? AND PAGE_ID = ? ", allotAreaRestModel.getId(), allotAreaRestModel.getPageId())) {
                        ao.delete(allotAreaDb);
                    }
                    return null;
                }
            });
        } else {
            allotAreaRestModel.setHasActionAlert(true);
            allotAreaRestModel.setActionAlert(getI18NBean().getText("com.addteq.confluence.plugin.floorplan.permission.denied"));
            return Response.ok(allotAreaRestModel).build();
        }
        return Response.ok(allotAreaService.getAllAllotedAreaFromDb(allotAreaRestModel, true)).build();
    }


    /**
     * Method to retrieve all the tagged users or areas from the DB on to the floorplan.
     * @param type
     * @param pageId
     * @param macroId
     * @param checksum
     * @param created
     * @return
     */
    @GET
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/getAllAllottedArea")
    public Response getAllAllottedArea( @QueryParam("type") int type, @QueryParam("pageId") Integer pageId,
            @QueryParam("macroId") String macroId,@QueryParam("checksum") String checksum,@QueryParam("created") long created, 
            @DefaultValue("false") @QueryParam("showAllRecords") boolean showAllRecords,
            @DefaultValue("false") @QueryParam("changeInRecords") boolean changeInRecords) {
        AllotAreaRestModel allotAreaRestModel = new AllotAreaRestModel(type,pageId,macroId,checksum,created);
        allotAreaRestModel.setShowAllRecords(showAllRecords);
        return Response.ok(allotAreaService.getAllAllotedAreaFromDb(allotAreaRestModel, changeInRecords)).build();
    }
    
    /**
     * Today the default viewport set is 1200 but in future it might be changed to more as 4k 5k displays are getting common, for this purpose we maintain 
     * persistence to keep a record that which taggings were applicable for which length of viewport.
     * @param macroId
     */
    public int getViewPortWidth(final String macroId) {                        
        AllotAreaDB[] allotAreaDb = ao.find(AllotAreaDB.class, "MACRO_ID = ?", macroId);
            if (allotAreaDb.length >= 1 ) {
                for (AllotAreaDB allotAreaDb1 : allotAreaDb) {
                    return allotAreaDb1.getViewportwidth();
                }
            }                                      
        return 1200;
    }

    /**
     * Method to retrieve a tagged user link on the my profile page so as for a user to navigate to the page where he or she is tagged
     * The link is posted on the my profile page of the user.
     * @param userName
     * @return
     */
    @GET
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/getUserProfileLink")
    public Response getUserProfileLink(@QueryParam("user") String userName) {
        Response res = null;
        AllotAreaRestModel allotAreaRestModel = new AllotAreaRestModel();
        try {      
            String note = userName;
            if(note.equalsIgnoreCase("currentUser")) {
                note = AuthenticatedUserThreadLocal.get().getName();
            }
            AllotAreaDB[] allotAreaDb = ao.find(AllotAreaDB.class, " NOTE = ? ORDER BY \"CREATED\"", note);
            if(allotAreaDb.length >= 1) {
                long pageId = allotAreaDb[0].getPageId();
                long seatId = allotAreaDb[0].getCreated();
                String seatNo = allotAreaDb[0].getSeatNo();
                String pageUrl = pageManager.getPage(pageId).getUrlPath() + "#" + seatId;
                allotAreaRestModel.setUserProfileUrl(pageUrl);
                allotAreaRestModel.setSeatNo(seatNo);
            }
            res = Response.ok(allotAreaRestModel).build();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return res;

    }
    
    /**
     * A mail is sent to a user when that particular user is tagged or updated on a floorplan.
     * @param allotAreaRestModel 
     */
    @POST
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/sendMailToUser")
    public void sendMailToUser(final AllotAreaRestModel allotAreaRestModel) {
        StringBuilder body = new StringBuilder();
        String subject, baseUrl ;
        String note = allotAreaRestModel.getNote();
        long pageId = allotAreaRestModel.getPageId();
        String pageTitle= pageManager.getPage(allotAreaRestModel.getPageId()).getTitle();
        ConfluenceUser user = userAccessor.getUserByName(note);
        if(user == null){
            return;
        }
        String mailTo = user.getEmail();
        long taggedId = allotAreaRestModel.getUserId();       
        boolean confirm = allotAreaRestModel.isConfirm();
        String loggedInUser = AuthenticatedUserThreadLocal.getUsername();
        String seatNo = allotAreaRestModel.getSeatNo();
        String fullName= userAccessor.getUserByName(loggedInUser).getFullName();
        String userImg= settingsManager.getGlobalSettings().getBaseUrl() + userAccessor.getUserProfilePicture(loggedInUser).getDownloadPath();
        baseUrl = settingsManager.getGlobalSettings().getBaseUrl() + pageManager.getPage(pageId).getUrlPath();
        Map context = MacroUtils.defaultVelocityContext();
        context.put("loggedInUser", fullName);
        context.put("pageTitle", pageTitle);
        context.put("userLink", settingsManager.getGlobalSettings().getBaseUrl()+"/users/viewuserprofile.action?username=" + loggedInUser);
        context.put("userImg", userImg);
        
        if(baseUrl.contains("?")){
            baseUrl = baseUrl + "#" + taggedId;
        }else{
            baseUrl = baseUrl + "#" + taggedId;
        }        
        //Prepare Body and Subject according to User is Updated or Deleted or Newly Tagged on Floorplan
        if ( !confirm && !seatNo.equals("Deleted") ) {
            subject = fullName + " tagged you in " + pageTitle;
            context.put("status", "tagged");            
            context.put("linkText", "Please visit below link to check your seat");
        }else if( confirm && !seatNo.equals("Deleted") ){
            subject = fullName + " updated you in " + pageTitle;
            context.put("status", "updated");            
            context.put("linkText", "Please visit below link to check your seat");
        }else{
            subject = fullName + " removed you in " + pageTitle;
            baseUrl = settingsManager.getGlobalSettings().getBaseUrl() + pageManager.getPage(pageId).getUrlPath();        
            context.put("status", "removed");
            context.put("linkText", "Please vist below link");
        }                
        context.put("baseUrl", baseUrl); 

        // Get Template in String, to send over Email.
        String finalBody = VelocityUtils.getRenderedTemplate("template/notification.vm", context);
        //Send Mail To User
        try{
            MailQueueItem mailQueueItem = new ConfluenceMailQueueItem(mailTo, subject, finalBody, MIME_TYPE_HTML);
            taskManager.addTask(MAIL, mailQueueItem);
        }catch(Exception e){
            LOGGER.log(Level.WARNING , "Office Admin : Error in sending notification mail to user for tag activity.");
        }
        
    }
    
    @POST
    @AnonymousAllowed
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/import")
    public Response importFloorPlan(@Context HttpServletRequest request, @QueryParam("pageId") long pageId,  
    		@QueryParam("macroName") String macroName, @QueryParam("checksum") String checksum) {

    	Response res = null;
         try {      
             
        	 if(isPermitted(pageId, macroName)) {

                 Reader reader = null;
                 DiskFileItemFactory factory = new DiskFileItemFactory();
                 ServletFileUpload fileUpload = new ServletFileUpload(factory);
                 
                
	        	   List<FileItem> formItems = fileUpload.parseRequest(request);
	
	               for(FileItem item : formItems) {                           	   
	                   if (!item.isFormField()) {                    	   
	                	   reader = new InputStreamReader(item.getInputStream()); 
	                   }
	               }
               
                 
                 Gson gson = new Gson();  

                 AllotAreaRestModel[] allotAreasArray = gson.fromJson(reader, AllotAreaRestModel[].class); 
                 
                 
         		allotAreaService.importFloorPlan(allotAreasArray, pageId, checksum);
         		res =  Response.ok().build();

         	}else {
         		res =  Response.notModified().build();
        	 }
         } catch (Exception e) {
        	 res =  Response.serverError().build();
         }
    	
    	return res;
    }
    
    /**
     * Method to find editing rights of a particular user to a floorplan or a flow diagram.
     * @param pageId
     * @param user
     * @param macroName
     * @return 
     */
    public boolean isPermitted(long pageId, String macroName) {
        
    	User user = AuthenticatedUserThreadLocal.getUser();
    	if(permissionManager == null) {
            permissionManager = (PermissionManager) ContainerManager.getComponent("permissionManager");
        }
        if(permissionManager.isConfluenceAdministrator(user)) {
            return true;
        }
        if(macroName.equals("floorplan")) {
            try {
                if(inPowerGroup()) {
                    return true;
                }else{
                    return false;
                }
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
        boolean hasEditPermission = permissionManager.hasPermissionNoExemptions(user, Permission.EDIT, (Object) pageManager.getPage(pageId));
        return hasEditPermission;
    }
    
    
    /**
     * Determing whether a user is a part of power group defined, or is individually defined as a power user.
     * @return
     * @throws EntityException 
     */
    public Boolean inPowerGroup() throws EntityException {
        ConfluenceUser confluenceUser = AuthenticatedUserThreadLocal.get();
        String loggedInUserName=confluenceUser.getName();
        List<PowerGroupRestBean> powerGroupRestBeanList = new ArrayList<PowerGroupRestBean>();
        PowerGroupDB[] powerGroupDB = ao.find(PowerGroupDB.class, " NAME = ? AND TYPE = ?", loggedInUserName, "user");

        if (powerGroupDB.length > 0) {
            return true;
        } else {
            if (userAccessor == null) {
                userAccessor = (UserAccessor) ContainerManager.getComponent("userAccessor");
            }
            List<String> groupNameList = userAccessor.getGroupNames(confluenceUser);
            for (String groupName : groupNameList) {
                PowerGroupDB[] groupNames = ao.find(PowerGroupDB.class, " NAME = ? AND TYPE = ?", groupName, "group");
                if (groupNames.length > 0) {
                    return true;
                }
            }
        } 
        return false;
    }

    private I18NBean getI18NBean() {
            return i18nBeanFactory.getI18NBean(localeManager
                            .getLocale(AuthenticatedUserThreadLocal.getUser()));
    }      
               
   }   
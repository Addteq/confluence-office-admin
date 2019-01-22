package com.addteq.confluence.plugin.userprofile.rest;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.confluence.user.AuthenticatedUserThreadLocal;
import com.atlassian.confluence.user.ConfluenceUser;
import com.atlassian.confluence.user.UserAccessor;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import com.atlassian.sal.api.transaction.TransactionCallback;
import com.atlassian.user.EntityException;
import com.atlassian.user.Group;
import com.atlassian.user.GroupManager;
import com.atlassian.user.User;
import com.atlassian.user.UserManager;
import com.addteq.confluence.plugin.userprofile.bean.PowerGroupRestBean;
import com.addteq.confluence.plugin.userprofile.bean.SearchPowerUserRestBean;
import com.addteq.confluence.plugin.userprofile.db.PowerGroupDB;
import java.util.ArrayList;
import java.util.List;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 *
 * @author trupti kanase
 */

@Path("/userProfilePowerGroupManager")
public class UserProfilePowerGroupManager {

    private final ActiveObjects ao;
    private final UserManager userManager;
    private final GroupManager groupManager;
    private final UserAccessor userAccessor;

    public UserProfilePowerGroupManager(ActiveObjects ao, UserManager userManager, GroupManager groupManager, UserAccessor userAccessor) {
        this.ao = ao;
        this.userManager = userManager;
        this.groupManager = groupManager;
        this.userAccessor = userAccessor;
    }

    /**
     * Save User or Group in the power group functionality.
     * Type here can be a user or a group.
     * @param powerGroupRestBean
     * @return
     * @throws EntityException 
     */
    @POST
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/saveUser")
    public Response saveUser(final PowerGroupRestBean powerGroupRestBean) throws EntityException {


        if("user".equals(powerGroupRestBean.getType())){
            User userExist=userManager.getUser(powerGroupRestBean.getName());

            if(userExist == null){
                return Response.ok("User Does not exist\nPlease Select User from Drop-down").build();
            }
            PowerGroupDB[] powerGroupDB = ao.find(PowerGroupDB.class," TYPE = ? AND NAME = ?","user",powerGroupRestBean.getName());
            PowerGroupDB[] GroupList = ao.find(PowerGroupDB.class," TYPE = ?","group");
            for (PowerGroupDB powerGroupDBTemp : GroupList) {
                 Group g=userAccessor.getGroup(powerGroupDBTemp.getName());
                 if(userAccessor.hasMembership(g, userExist)){
                     return Response.ok("User is member of \" "+powerGroupDBTemp.getName()+" \" which already present in Power Group").build();
                 }
            }
            if(powerGroupDB.length>0){
                return Response.ok("User already present in Power Group..!!").build();
            }
        }else if("group".equals(powerGroupRestBean.getType())){
            Group groupExist=groupManager.getGroup(powerGroupRestBean.getName());
            if(groupExist == null){
                return Response.ok("Group Does not exist").build();
            }
            PowerGroupDB[] powerGroupDB = ao.find(PowerGroupDB.class," TYPE = ? AND NAME = ?","group",powerGroupRestBean.getName());
            if(powerGroupDB.length>0){
                return Response.ok("Group already present in Power Group..!!").build();
            }
        }
        PowerGroupRestBean powerGroupRestBeanNew = ao.executeInTransaction(new TransactionCallback<PowerGroupRestBean>() // (1)
        {
            @Override
            public PowerGroupRestBean doInTransaction() {
                PowerGroupDB powerGroupDb = ao.create(PowerGroupDB.class); // (2)
                powerGroupDb.setType(powerGroupRestBean.getType());
                powerGroupDb.setName(powerGroupRestBean.getName());
                powerGroupDb.save();
                return powerGroupRestBean;
            }
        });

        return Response.ok(powerGroupRestBean).build();
    }

    @GET
    @AnonymousAllowed
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/getAllUsers")
    public Response getUsers() {
        return Response.ok(getPowerGeoupFromDb()).build();
    }

    public List<PowerGroupRestBean> getPowerGeoupFromDb() {
        List<PowerGroupRestBean> powerGroupRestBeanList = new ArrayList<PowerGroupRestBean>();
        PowerGroupRestBean powerGroupRestBean;
        PowerGroupDB[] powerGroupDB = ao.find(PowerGroupDB.class," TYPE = ?","user");
        for (PowerGroupDB powerGroupDBTemp : powerGroupDB) {

            powerGroupRestBean = new PowerGroupRestBean();

            powerGroupRestBean.setType(powerGroupDBTemp.getType());
            powerGroupRestBean.setName(powerGroupDBTemp.getName());

            powerGroupRestBeanList.add(powerGroupRestBean);
        }
        return powerGroupRestBeanList;
    }

    @GET
    @AnonymousAllowed
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/getAllGroups")
    public Response getAllGroups() {
        return Response.ok(getAllGroupsPowerGeoupFromDb()).build();
    }

    public List<PowerGroupRestBean> getAllGroupsPowerGeoupFromDb() {
        List<PowerGroupRestBean> powerGroupRestBeanList = new ArrayList<PowerGroupRestBean>();
        PowerGroupRestBean powerGroupRestBean;
        PowerGroupDB[] powerGroupDB = ao.find(PowerGroupDB.class, " TYPE = ?","group");
        for (PowerGroupDB powerGroupDBTemp : powerGroupDB) {

            powerGroupRestBean = new PowerGroupRestBean();

            powerGroupRestBean.setType(powerGroupDBTemp.getType());
            powerGroupRestBean.setName(powerGroupDBTemp.getName());

            powerGroupRestBeanList.add(powerGroupRestBean);
        }
        return powerGroupRestBeanList;
    }

    @DELETE
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/removeUser")
    public Response removeUser(final PowerGroupRestBean powerGroupRestBean){
        PowerGroupRestBean powerGroupRestBeanResponse = ao.executeInTransaction(new TransactionCallback<PowerGroupRestBean>() // (1)
        {
            @Override
            public PowerGroupRestBean doInTransaction() {
                PowerGroupRestBean agrb = new PowerGroupRestBean();
                            PowerGroupDB[] accessGroupDb = ao.find(PowerGroupDB.class, " NAME = ? AND TYPE = ?", powerGroupRestBean.getName(),powerGroupRestBean.getType());                
                            if (accessGroupDb.length > 0 ) {
                    ao.delete(accessGroupDb);
                }
                return powerGroupRestBean;
            }
        });
        return Response.ok(powerGroupRestBean).build();

    }
    
    /**
     * Identify whether a user is a power user or not
     * Used everywhere in the plugin in case of editing functionality of picture or form data
     * @return
     * @throws EntityException 
     */
    @GET
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/inPowerGroup")
    public Response inPowerGroup() throws EntityException {
        ConfluenceUser confluenceUser = AuthenticatedUserThreadLocal.get();
        if(confluenceUser == null){ //If Anonymous User
            return Response.ok("false").build();
        }
        String loggedInUserName=confluenceUser.getName();
        PowerGroupDB[] powerGroupDB = ao.find(PowerGroupDB.class, " NAME = ? AND TYPE = ?", loggedInUserName, "user");

        if (powerGroupDB.length > 0) {
            return Response.ok("true").build();
        } else {
            List<String> groupNameList = userAccessor.getGroupNames(confluenceUser);
            for (String groupName : groupNameList) {
                PowerGroupDB[] groupNames = ao.find(PowerGroupDB.class, " NAME = ? AND TYPE = ?", groupName, "group");
                if (groupNames.length > 0) {
                    return Response.ok("true").build();
                }
            }
        } 
        return Response.ok("false").build();
    }
    
    @GET
    @AnonymousAllowed
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/powerUserPicker")
    public Response powerUserPicker() throws EntityException{
       List<PowerGroupRestBean> powerGroupRestBeanList = new ArrayList<PowerGroupRestBean>();
        PowerGroupRestBean powerGroupRestBean;
        PowerGroupDB[] powerUserDB = ao.find(PowerGroupDB.class, " TYPE = ?","user");
        for (PowerGroupDB powerGroupDBTemp : powerUserDB) {
            powerGroupRestBean = new PowerGroupRestBean();
            powerGroupRestBean.setName(powerGroupDBTemp.getName());
            powerGroupRestBeanList.add(powerGroupRestBean);
        }
        PowerGroupDB[] powerGroupDB = ao.find(PowerGroupDB.class, " TYPE = ?","group");
        for (PowerGroupDB powerGroupDBTemp : powerGroupDB) {
            List<String> usersList=userAccessor.getMemberNamesAsList(userAccessor.getGroup(powerGroupDBTemp.getName()));
            for (String uName : usersList) {
                    powerGroupRestBean = new PowerGroupRestBean();
                    powerGroupRestBean.setName(uName);
                    powerGroupRestBeanList.add(powerGroupRestBean);
            }
        }
        return Response.ok(powerGroupRestBeanList).build();
    }

    
    @GET
    @AnonymousAllowed
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/powerGroupPicker")
    public Response powerGroupPicker() throws EntityException{
        List<Group> groupList = userAccessor.getGroupsAsList();
        List<SearchPowerUserRestBean> searchPowerUserRestBeanList = new ArrayList<SearchPowerUserRestBean>();     
        for (Group group : groupList) {
            PowerGroupDB[] powerGroupDB = ao.find(PowerGroupDB.class," TYPE = ? AND NAME = ?","group",group.getName());
            if(powerGroupDB.length <1){           
                    SearchPowerUserRestBean searchPowerUserRestBean = new SearchPowerUserRestBean();
                    searchPowerUserRestBean.setValue(group.getName());
                    searchPowerUserRestBeanList.add(searchPowerUserRestBean);
                }
        } 
        return Response.ok(searchPowerUserRestBeanList).build();
    }
}

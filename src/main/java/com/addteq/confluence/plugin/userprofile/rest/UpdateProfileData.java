package com.addteq.confluence.plugin.userprofile.rest;

import com.addteq.confluence.plugin.userprofile.action.UpdatePluginDataThread;
import com.addteq.confluence.plugin.userprofile.bean.SearchProfileBean;
import com.addteq.confluence.plugin.userprofile.db.SearchProfileDB;
import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.confluence.user.UserAccessor;
import com.atlassian.confluence.user.UserDetailsManager;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import com.atlassian.sal.api.transaction.TransactionCallback;
import com.atlassian.user.User;
import java.util.ArrayList;
import java.util.List;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/admin")
public class UpdateProfileData {

    private final ActiveObjects ao;
    private UserAccessor userAccessor;
    private UserDetailsManager userDetailsManager;
    
    public UpdateProfileData(ActiveObjects ao, UserAccessor userAccessor, UserDetailsManager userDetailsManager) {
        this.ao = ao;
        this.userAccessor = userAccessor;
        this.userDetailsManager = userDetailsManager;
    }

    @POST
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/updateProfileData")
    public Response updateProfileData(final SearchProfileBean searchProfileBean) {
        ao.executeInTransaction(new TransactionCallback<SearchProfileBean>() {
            @Override
            public SearchProfileBean doInTransaction() {
                if(searchProfileBean.isHardUpdate()) {
                    ao.delete(ao.find(SearchProfileDB.class));
                }             
                int startIndex=searchProfileBean.getFromIndex();
                int endIndex=searchProfileBean.getToIndex();
                int totalUsersCount=userAccessor.getUsers().getCurrentPage().size();
                if(startIndex>totalUsersCount){
                    startIndex=totalUsersCount;
                } 
                if(endIndex>totalUsersCount){
                    endIndex=totalUsersCount;
                }             
                List<User> userNameList = userAccessor.getUsers().getCurrentPage().subList(startIndex,endIndex);
                int profilePluginUsersCount = ao.count(SearchProfileDB.class);
                SearchProfileDB[] profileDB = ao.find(SearchProfileDB.class);
                List<String> userFromSearchProfileDB = new ArrayList<String>();
                for (SearchProfileDB profileDBTemp : profileDB) {
                    userFromSearchProfileDB.add(profileDBTemp.getUsername());
                }               
                if (userNameList.size() > profilePluginUsersCount) {                   
                    for (User cu : userNameList) {
                        if (!userFromSearchProfileDB.contains(cu.getName())) {
                            SearchProfileDB searchProfileDB = ao.create(SearchProfileDB.class);
                            StringBuilder profileData = new StringBuilder();
                            profileData.append("Name:").append(cu.getName()).append(";");
                            profileData.append("Full Name:").append(cu.getFullName()).append(";");
                            profileData.append("Email:").append(cu.getEmail()).append(";");
                            profileData.append("Phone:").append(userDetailsManager.getStringProperty(cu, "phone")).append(";");
                            profileData.append("IM:").append(userDetailsManager.getStringProperty(cu, "im")).append(";");
                            profileData.append("Manager:").append(userDetailsManager.getStringProperty(cu, "manager")).append(";");
                            profileData.append("Department:").append(userDetailsManager.getStringProperty(cu, "department")).append(";");
                            profileData.append("Location:").append(userDetailsManager.getStringProperty(cu, "location")).append(";");
                            profileData.append("Position:").append(userDetailsManager.getStringProperty(cu, "position")).append(";");
                            searchProfileDB.setUsername(cu.getName().toLowerCase());
                            searchProfileDB.setProfileData(profileData.toString().toLowerCase());
                            searchProfileDB.save();
                            ao.flushAll();
                        }
                    }
                    searchProfileBean.setResult("success");
                }
                else {
                    searchProfileBean.setResult("No update required");
                }
                return searchProfileBean;
            }
        });
        return Response.ok(searchProfileBean).build();
    }
//    This method has been written to clean the AO SearchProfileDB for development and testing purpose
//    Kept it commented intenionally to utilize this in future if needed.
//    
//    @GET
//    @AnonymousAllowed
//    @Consumes(MediaType.APPLICATION_JSON)
//    @Produces(MediaType.APPLICATION_JSON)
//    @Path("/cleanProfileData")
//    public Response cleanProfileData() {
//     final SearchProfileBean spb = new SearchProfileBean();
//     ao.executeInTransaction(new TransactionCallback<SearchProfileBean>() {
//            @Override
//            public SearchProfileBean doInTransaction() {
//                SearchProfileDB[] spDB = ao.find(SearchProfileDB.class);
//                ao.delete(spDB);
//                return spb;
//            }
//        });
//        spb.setResult("success");
//        return Response.ok(spb).build();
//    }

    @GET
    @AnonymousAllowed
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/getNoOfUsers")
    public Response getNoOfUsers() {
        return Response.ok(""+userAccessor.getUsers().getCurrentPage().size()).build();
    }


    @GET
    @AnonymousAllowed
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/getUpdateStatus")
    public Response getUpdateStatus() {
        return Response.ok(""+UpdatePluginDataThread.checkSchedulerValue()).build();
    }
    
    @GET
    @AnonymousAllowed
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/checkUpdateIsInProgress")
    public Response checkUpdateIsInProgress() {
        return Response.ok(""+UpdatePluginDataThread.checkSchedulerStatus()).build();
    }
}

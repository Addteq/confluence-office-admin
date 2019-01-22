/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package com.addteq.confluence.plugin.userprofile.rest;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import com.atlassian.sal.api.transaction.TransactionCallback;
import com.addteq.confluence.plugin.userprofile.bean.FormFieldsDataRestBean;
import com.addteq.confluence.plugin.userprofile.bean.SearchProfileBean;
import com.addteq.confluence.plugin.userprofile.db.FormBuilderDB;
import com.addteq.confluence.plugin.userprofile.db.FormFieldsDataDB;
import com.addteq.confluence.plugin.userprofile.db.SearchProfileDB;
import com.atlassian.confluence.user.UserAccessor;
import java.util.ArrayList;
import java.util.List;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 *
 * @author neeraj bodhe
 */


@Path("/userProfileFieldsManager")
public class UserProfileFieldsManager {
    
    private final ActiveObjects ao;
    private final UserAccessor userAccessor;

    public UserProfileFieldsManager(ActiveObjects ao, UserAccessor userAccessor) {
        this.ao = ao;
        this.userAccessor = userAccessor ;
    }
    
    /**
     * The custom configured fields data is stored from this method for FormFieldsDataDB 
     * Combination of fieldId from FormBuilderDB is mapped to userid and the corresponding value
     * @param formFieldsDataRestBeanArray
     * @return 
     */
    @POST
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/saveFormFieldsData")
    public Response saveFormFieldsData(final FormFieldsDataRestBean[] formFieldsDataRestBeanArray) {

        ao.executeInTransaction(new TransactionCallback<FormFieldsDataRestBean>()
        {
            @Override
            public FormFieldsDataRestBean doInTransaction() {
                FormFieldsDataDB formFieldsDataDB;
                SearchProfileBean searchProfileBean = new SearchProfileBean();
                StringBuilder profileData = new StringBuilder();
                for(FormFieldsDataRestBean formFieldsDataRestBean : formFieldsDataRestBeanArray) {

                    FormFieldsDataDB [] formFieldsDataDBpreviousRecord = ao.find(FormFieldsDataDB.class, " FIELD_ID = ? AND USER_ID = ? " , formFieldsDataRestBean.getFieldId(), formFieldsDataRestBean.getUserId());
                    if(formFieldsDataDBpreviousRecord.length == 1) {
                        formFieldsDataDB = formFieldsDataDBpreviousRecord[0];
                    } else {
                        formFieldsDataDB = ao.create(FormFieldsDataDB.class);
                    }
                    
                    formFieldsDataDB.setUserId(formFieldsDataRestBean.getUserId());
                    formFieldsDataDB.setFieldId(formFieldsDataRestBean.getFieldId()); 
                    formFieldsDataDB.setValue(formFieldsDataRestBean.getValue());                                        
                    formFieldsDataDB.save();
                }
                //Insert Profile Data only for those fields which are present in FormFields DB
                FormBuilderDB[] fbDB = ao.find(FormBuilderDB.class);
                for(FormBuilderDB fb : fbDB){
                    if(!fb.getType().toLowerCase().equals("label")){
                        FormFieldsDataDB [] formFieldsDataDBpreviousRecord = ao.find(FormFieldsDataDB.class," FIELD_ID = ? AND USER_ID = ? " ,fb.getIdOrName(),formFieldsDataRestBeanArray[0].getUserId());
                        String attributeLabel = fb.getLabel();
                        if(formFieldsDataDBpreviousRecord.length > 0){
                            profileData.append("\""+attributeLabel+"\"").append(":").append("\""+formFieldsDataDBpreviousRecord[0].getValue()+"\"").append(";");
                        }
                    }                   
                }                
                /**
                 * START SEARCH FEATURE | need to execute in the same transaction
                 * This block of code is to insert the user profile's all attribute in SEARCH_PROFILE_DB TABLE and all the
                 * attributes will be separated by semi comma.
                 */
                
                String username = formFieldsDataRestBeanArray[0].getUserId();
                searchProfileBean.setUsername(username.toLowerCase());
                searchProfileBean.setProfileData(profileData.toString().toLowerCase());
                SearchProfileDB[] searchProfileDB = ao.find(SearchProfileDB.class, " USERNAME = ? ", username); 
                if(searchProfileDB.length == 1) {
                    searchProfileDB[0].setUsername(searchProfileBean.getUsername());
                    searchProfileDB[0].setProfileData(searchProfileBean.getProfileData().toLowerCase());
                    searchProfileDB[0].save();
                }
                else {
                    SearchProfileDB profileDB = ao.create(SearchProfileDB.class);
                    profileDB.setUsername(searchProfileBean.getUsername());
                    profileDB.setProfileData(searchProfileBean.getProfileData().toLowerCase());
                    profileDB.save();
                }
                /**
                 * END SEARCH FEATURE 
                 */
                return formFieldsDataRestBeanArray[0];
            }
        });
        
        
        return Response.ok(formFieldsDataRestBeanArray).build();
    }
    
    @GET
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/getFormFieldValues")
    public Response getFormFieldValues(@QueryParam("userId") String userId,@QueryParam("fieldId") String fieldId, 
                    @QueryParam("value") String value) {
        return Response.ok(getFormFieldValuesFromDb(userId)).build();
    }
    
    public List<FormFieldsDataRestBean> getFormFieldValuesFromDb(final String userName){
        List<FormFieldsDataRestBean> formFieldsDataRestBeanlist = new ArrayList<FormFieldsDataRestBean>();
        FormFieldsDataRestBean formFieldsDataRestBean;
        FormFieldsDataDB[] formFieldsDataDB = ao.find(FormFieldsDataDB.class, " USER_ID = ?", userName);
        for (FormFieldsDataDB formFieldsDataDBTemp : formFieldsDataDB) {
            
            formFieldsDataRestBean = new FormFieldsDataRestBean();
                
            
            formFieldsDataRestBean.setUserId(formFieldsDataDBTemp.getUserId());
            formFieldsDataRestBean.setFieldId(formFieldsDataDBTemp.getFieldId());
            formFieldsDataRestBean.setValue(formFieldsDataDBTemp.getValue());
            
            formFieldsDataRestBeanlist.add(formFieldsDataRestBean);
        }
        return formFieldsDataRestBeanlist;
    }
    
    public void deletePreviousSavedRecordsOfTheUser(final String userName){
        FormFieldsDataRestBean formFieldsDataRestBean = ao.executeInTransaction(new TransactionCallback<FormFieldsDataRestBean>() {
            @Override
            public FormFieldsDataRestBean doInTransaction() {
                FormFieldsDataRestBean ffbrrb = new FormFieldsDataRestBean();
                FormFieldsDataDB[] formBuilderDB = ao.find(FormFieldsDataDB.class, " USER_ID = ?", userName);
                if (formBuilderDB.length > 0) {
                    ao.delete(formBuilderDB);
                }
                return ffbrrb;
            }
        });
    }
    
    /**
     * This method is used for retrieving and showing full name of a user on my profile page wherein user picker is used.
     * @param userName
     * @return 
     */
    @GET
    @AnonymousAllowed
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/getFullName")
    public Response getFullName(@QueryParam("userName") final String userName) {
        return Response.ok(userAccessor.getUserByName(userName).getFullName()).build();
    }
}

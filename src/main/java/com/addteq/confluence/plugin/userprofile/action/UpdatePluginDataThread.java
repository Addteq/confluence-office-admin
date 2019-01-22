package com.addteq.confluence.plugin.userprofile.action;

import com.addteq.confluence.plugin.avatar.AvatarManager;
import com.addteq.confluence.plugin.userprofile.db.FormBuilderDB;
import com.addteq.confluence.plugin.userprofile.db.FormFieldsDataDB;
import com.addteq.confluence.plugin.userprofile.db.SearchProfileDB;
import com.atlassian.activeobjects.external.ActiveObjects;
import org.json.JSONException;
import org.json.JSONObject;
import com.atlassian.confluence.user.PersonalInformation;
import com.atlassian.confluence.user.PersonalInformationManager;
import com.atlassian.confluence.user.UserDetailsManager;
import com.atlassian.sal.api.transaction.TransactionCallback;
import com.atlassian.user.User;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import net.java.ao.Query;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.type.TypeReference;
import org.apache.log4j.Logger;
import org.codehaus.jackson.JsonParser;


/**
 * This class is used to update the default field values to our AO. The total no of default field values are 10.
 * This is called from the plugin install event and also manually from general configuration.
 * @author trupti kanase
 */
public class UpdatePluginDataThread implements Runnable {

    private final Logger LOGGER =  Logger.getLogger(UpdatePluginDataThread.class.getName());
    private final ActiveObjects ao;
    private final UserDetailsManager userDetailsManager;
    private final PersonalInformationManager personalInformationManager;
    private static int noOfUsers;
    static private float updateStatusPercentage = (float) 0.00;
    static private String userProfileUpdateIsInProgress = "false";
    static private int userCnt;
    private final List<User> subList;
    private final AvatarManager avatarManager;
    
    public UpdatePluginDataThread(ActiveObjects ao, 
                                    UserDetailsManager userDetailsManager, 
                                    List<User> subList, 
                                    int noOfUsers, 
                                    PersonalInformationManager personalInformationManager,
                                    AvatarManager avatarManager) {
        this.ao = ao;
        this.userDetailsManager = userDetailsManager;
        this.subList = subList;
        this.personalInformationManager = personalInformationManager;
        this.avatarManager = avatarManager;
        setNoOfUsers(noOfUsers);
    }

    @Override
    public void run() {
        updateData(subList);
        generateMD5(subList);
    }

    private synchronized void increaseUserCnt() {
        userCnt++;
    }
    
    public static void setNoOfUsers(int noOfUsers) {
        UpdatePluginDataThread.noOfUsers = noOfUsers;
    }
    
    private static void checkAllUsersUpdateCompleted() {
        if (getUserCnt() >= noOfUsers) {
            updateStatusPercentage = 100;
            userProfileUpdateIsInProgress = "false";
        }
    }
    
    public static synchronized int getUserCnt() {
        return userCnt;
    }

    public static void setUserCnt(int userCnt) {
        UpdatePluginDataThread.userCnt = userCnt;
    }
    
    public static float checkSchedulerValue() {
        return updateStatusPercentage;
    }

    public static String checkSchedulerStatus() {
        return userProfileUpdateIsInProgress;
    }

    public static void setSchedulerValue(float updateStatusPercentage) {
        UpdatePluginDataThread.updateStatusPercentage = updateStatusPercentage;
    }

    public static void setSchedulerStatus(String userProfileUpdateIsInProgress) {
        UpdatePluginDataThread.userProfileUpdateIsInProgress = userProfileUpdateIsInProgress;
    }

    private String updateData(final List<User> userNameList) {
        ao.executeInTransaction(new TransactionCallback<String>() {
            @Override
            public String doInTransaction() {

                SearchProfileDB[] profileDB = ao.find(SearchProfileDB.class);
                List<String> userFromSearchProfileDB = new ArrayList<String>();
                for (SearchProfileDB profileDBTemp : profileDB) {
                    userFromSearchProfileDB.add(profileDBTemp.getUsername());
                }
                userProfileUpdateIsInProgress = "true";
                for (User cu : userNameList) {
                    try {
                        StringBuilder profileData = new StringBuilder();
                        String name = cu.getName();
                        LOGGER.info("\n\n#OfficeAdmin : Updating User " + name);
                        String fullName = cu.getFullName();
                        updateFormFieldsData(name, "Full Name", fullName);
                        String email = cu.getEmail();
                        updateFormFieldsData(name, "Email", email);
                        String phone = userDetailsManager.getStringProperty(cu, "phone");
                        updateFormFieldsData(name, "Phone", phone);
                        String im = userDetailsManager.getStringProperty(cu, "im");
                        updateFormFieldsData(name, "IM", im);
                        String manager = userDetailsManager.getStringProperty(cu, "manager");
                        updateFormFieldsData(name, "Manager", manager);
                        String department = userDetailsManager.getStringProperty(cu, "department");
                        updateFormFieldsData(name, "Department", department);
                        String location = userDetailsManager.getStringProperty(cu, "location");
                        updateFormFieldsData(name, "Location", location);
                        String position = userDetailsManager.getStringProperty(cu, "position");
                        updateFormFieldsData(name, "Position", position);
                        String website = userDetailsManager.getStringProperty(cu, "website");
                        updateFormFieldsData(name, "Website", website);
                        PersonalInformation personalInformation = personalInformationManager.getOrCreatePersonalInformation(cu);
                        String aboutMe = personalInformation.getBodyAsString();
                        updateFormFieldsData(name, "About Me", aboutMe);
                        if (!userFromSearchProfileDB.contains(cu.getName())) {
                            SearchProfileDB searchProfileDB = ao.create(SearchProfileDB.class);
                            searchProfileDB.setUsername(cu.getName());
                            profileData.append("\"Name\":").append("\"").append(name).append("\"").append(";");
                            profileData.append("\"Full Name\":").append("\"").append(fullName).append("\"").append(";");
                            profileData.append("\"Email\":").append("\"").append(email).append("\"").append(";");
                            profileData.append("\"Phone\":").append("\"").append(phone).append("\"").append(";");
                            profileData.append("\"IM\":").append("\"").append(im).append("\"").append(";");
                            profileData.append("\"Manager\":").append("\"").append(manager).append("\"").append(";");
                            profileData.append("\"Department\":").append("\"").append(department).append("\"").append(";");
                            profileData.append("\"Location\":").append("\"").append(location).append("\"").append(";");
                            profileData.append("\"Position\":").append("\"").append(position).append("\"").append(";");
                            profileData.append("\"Website\":").append("\"").append(website).append("\"").append(";");
                            profileData.append("\"About Me\":").append("\"").append(aboutMe).append("\"").append(";");
                            searchProfileDB.setProfileData(profileData.toString().toLowerCase());
                            updateStatusPercentage = (userCnt * 100) / noOfUsers;
                            searchProfileDB.save();
                            ao.flushAll();
                        } else {
                            SearchProfileDB searchProfileDB[] = ao.find(SearchProfileDB.class,Query.select().where("USERNAME = ? ",cu.getName()).order("ID DESC"));
                            /*
                                If Duplicate entry exist them delete all entries except latest one.
                             */
                            if (searchProfileDB.length > 1) {
                                int firstEntryId = searchProfileDB[0].getID();
                                int deletedRows = ao.deleteWithSQL(SearchProfileDB.class, "USERNAME = ? AND ID != ?", cu.getName(), firstEntryId);
                                ao.flushAll();//recommended to use this after deleteWithSQL() method
                                LOGGER.info(deletedRows + " duplicate users are deleted from DB with username:" + cu.getName());

                            }
                            String existingProfileData = searchProfileDB[0].getProfileData();
                            JSONObject existingProfileDataJSON = new JSONObject();
                            try {
                                try {
                                    Map redundantData = getRedundantData(existingProfileData, cu);
                                    existingProfileDataJSON = new JSONObject(redundantData);
                                } catch (Exception ex) {
                                    LOGGER.warn("#OfficeAdmin: Something went wrong while getting redundant data of existing user", ex);
                                }
                                existingProfileDataJSON.put("name", name);
                                existingProfileDataJSON.put("full name", fullName);
                                existingProfileDataJSON.put("email", email);
                                existingProfileDataJSON.put("phone", phone);
                                existingProfileDataJSON.put("im", im);
                                existingProfileDataJSON.put("manager", manager);
                                existingProfileDataJSON.put("department", department);
                                existingProfileDataJSON.put("location", location);
                                existingProfileDataJSON.put("position", position);
                                existingProfileDataJSON.put("website", website);
                                existingProfileDataJSON.put("about me", aboutMe);
                            } catch (JSONException ex) {
                                LOGGER.error("#OfficeAdmin: Something went wrong while updating existing user", ex);
                            }
                            String updatedProfileData = existingProfileDataJSON.toString();
                            updatedProfileData = updatedProfileData.substring(1, updatedProfileData.length() - 1);// To remove start & end '{' of JSON object
                            searchProfileDB[0].setProfileData(updatedProfileData.toLowerCase());
                            updateStatusPercentage = (userCnt * 100) / noOfUsers;
                            searchProfileDB[0].save();
                            ao.flushAll();
                        }

                        LOGGER.info("\n\n#OfficeAdmin : " + userCnt + " Users data updated successfully out of " + noOfUsers + " users");

                        increaseUserCnt();
                    } catch (Exception ex) {
                        LOGGER.warn("\n\n#OfficeAdmin : Exception occured while updating user with username: " + cu.getName());
                    }
                }
                checkAllUsersUpdateCompleted();
                LOGGER.info("\n\n#OfficeAdmin : Updating User Data done Successfully sync !!");                
                return "SUCCESS";
            }
        });
        return null;
    }
    
    private void updateFormFieldsData(String userId,String fieldLabel,String fieldValue) {
        FormFieldsDataDB formFieldsDataDB;
        FormBuilderDB[] fbDB = ao.find(FormBuilderDB.class, " LABEL = ? ", fieldLabel); 
        if(fbDB.length == 0 || fieldValue==null || "undefined".equals(fieldValue)){
            return;
        }
        String fieldId = fbDB[0].getIdOrName();
        FormFieldsDataDB[] formFieldsDataDBpreviousRecord = ao.find(FormFieldsDataDB.class, " FIELD_ID = ? AND USER_ID = ? ",fieldId ,userId);
        if (formFieldsDataDBpreviousRecord.length == 1) {
            formFieldsDataDB = formFieldsDataDBpreviousRecord[0];
        } else {
            formFieldsDataDB = ao.create(FormFieldsDataDB.class);
        }     
        formFieldsDataDB.setUserId(userId);
        formFieldsDataDB.setFieldId(fieldId);
        formFieldsDataDB.setValue(fieldValue);
        formFieldsDataDB.save();
    }
    
    private Map getRedundantData(String existingProfileData, User cu){
            Map<String, Object> redundantData = new HashMap<String, Object>();
            ObjectMapper mapper = new ObjectMapper();
            boolean isRedundant = true;
            try {
                mapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_CONTROL_CHARS, true);
                mapper.configure(JsonParser.Feature.ALLOW_BACKSLASH_ESCAPING_ANY_CHARACTER, true);
                mapper.configure(JsonParser.Feature.ALLOW_NON_NUMERIC_NUMBERS, true);
                mapper.configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true);
                redundantData = mapper.readValue("{" + existingProfileData + "}", new TypeReference<Map<String, String>>() {});
            } catch (IOException ex) {
                LOGGER.warn("#OfficeAdmin: Level> Fine. Something went wrong while removing duplicate keys for " + existingProfileData, ex);
                isRedundant = false;
            }
            
            if(!isRedundant){
                LOGGER.info("#OfficeAdmin: Formatting existingProfileData i.e. " + existingProfileData);
                FormFieldsDataDB[] formFieldsDataDB = ao.find(FormFieldsDataDB.class, " USER_ID = ?", cu.getName());
                StringBuilder profileData = new StringBuilder();
                //Fetch all Fields from FormFieldsDataDB for User and build a new Profile Data.
                for(FormFieldsDataDB formFieldsData : formFieldsDataDB){
                    profileData.append("\"").append(formFieldsData.getFieldId()).append("\":").append("\"").append(formFieldsData.getValue().replace("\"", "'")).append("\"").append(",");
                }
                //Remove extra Comma from last field and convert data in LowerCase and sent it back to Redundant Data Function.
                String finalExistingProfileData = profileData.substring(0, profileData.length() - 1).toLowerCase();
                LOGGER.info("Modified profileData for User : "+ cu.getName()+ " is "+ finalExistingProfileData);
                getRedundantData(finalExistingProfileData, cu);
            }
        return redundantData;
    }
    private void generateMD5(final List<User> userNameList) {
        for (User user : userNameList) {
            avatarManager.generateMD5(user);
        }
    }
}
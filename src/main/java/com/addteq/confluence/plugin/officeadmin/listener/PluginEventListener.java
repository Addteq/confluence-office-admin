package com.addteq.confluence.plugin.officeadmin.listener;

import com.addteq.confluence.plugin.avatar.AvatarManager;
import com.addteq.confluence.plugin.floorplan.AllotAreaService;
import com.addteq.confluence.plugin.userprofile.action.UpdatePluginDataThread;
import com.addteq.confluence.plugin.userprofile.bean.FormBuilderRestBean;
import com.addteq.confluence.plugin.userprofile.db.FormBuilderDB;
import com.addteq.confluence.plugin.userprofile.db.FormFieldsDataDB;
import com.addteq.confluence.plugin.userprofile.db.SearchProfileDB;
import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.confluence.user.UserAccessor;
import com.atlassian.confluence.user.UserDetailsManager;
import com.atlassian.event.api.EventListener;
import com.atlassian.event.api.EventPublisher;
import com.atlassian.plugin.event.events.PluginEnabledEvent;
import com.atlassian.confluence.event.events.user.UserCreateEvent;
import com.atlassian.confluence.user.ConfluenceUserImpl;
import com.atlassian.confluence.user.PersonalInformationManager;
import com.atlassian.crowd.event.user.UserCreatedFromDirectorySynchronisationEvent;
import com.atlassian.sal.api.lifecycle.LifecycleAware;
import com.atlassian.sal.api.transaction.TransactionCallback;
import com.atlassian.sal.api.transaction.TransactionTemplate;
import com.atlassian.user.User;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import static com.opensymphony.xwork.Action.SUCCESS;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import net.java.ao.Query;
import org.springframework.beans.factory.DisposableBean;
import net.sf.hibernate.HibernateException;

/**
 * The purpose of this class is to Migrate all the default data of users in our plugin AO on plugin install.
 * This would enable us to handle all the existing data appear as default to all the users which have configured that earlier in vanilla confluence.
 */
public class PluginEventListener implements DisposableBean, LifecycleAware {

    private final ActiveObjects ao;
    private final EventPublisher eventPublisher;
    private final UserDetailsManager userDetailsManager;
    private final UserAccessor userAccessor;
    private final TransactionTemplate transactionTemplate;
    private final PersonalInformationManager personalInformationManager;
    private boolean officeAdminPluginEnabled =false;
    private boolean officeAdminConfluenceReady =false;
    private final AllotAreaService allotAreaService;
    private final AvatarManager avatarManager;
        
    public PluginEventListener(final EventPublisher eventPublisher, 
                                final UserDetailsManager userDetailsManager, 
                                final UserAccessor userAccessor, 
                                final ActiveObjects ao, 
                                final TransactionTemplate transactionTemplate, 
                                final PersonalInformationManager personalInformationManager, 
                                AllotAreaService allotAreaService,
                                AvatarManager avatarManager) {
        this.eventPublisher = eventPublisher;
        eventPublisher.register(this);
        this.ao = ao;
        this.userDetailsManager = userDetailsManager;
        this.userAccessor = userAccessor;
        this.transactionTemplate = transactionTemplate;
        this.personalInformationManager = personalInformationManager;
        this.allotAreaService = allotAreaService;
        this.avatarManager = avatarManager;
    }

    //If Plugin is enabled 
    @EventListener
    public void PluginEnabledEvent(PluginEnabledEvent event) throws Exception{
        if (event.getPlugin().getKey().equals("com.addteq.officeadmin")) {
            officeAdminPluginEnabled=true;
            checkPluginInitialize();
        }
    }

    //If the plugin is uninstalled or disabled.
    @Override
    public void destroy() throws Exception {
        eventPublisher.unregister(this);
    }

    //On confluence lifecycle start event.
    @Override
    public void onStart() {
        officeAdminConfluenceReady= true;
        //Used transactionTemplate because of LazyInitializationException of Hibernate 
        //otherwise It throws the error that Object isn't bound to a session, so we can't access the AO.
        transactionTemplate.execute(new TransactionCallback() {
            @Override
            public Object doInTransaction() {
                try {
                    checkPluginInitialize();
                    return null;
                } catch (Exception ex) {
                    Logger.getLogger(PluginEventListener.class.getName()).log(Level.SEVERE, null, ex);
                }
                return null;
            }
        });
    }
    public void checkPluginInitialize() throws Exception{
        if(officeAdminPluginEnabled == true && officeAdminConfluenceReady == true){
            allotAreaService.updateAllotedAreaDB();
            saveDefaultFormOnPluginInstall();
        }
    }
    
    /**
     * The default fields which are seen in my profile page are saved to our AO on plugin install so as to make the users appear that existing data is in place
     * @throws HibernateException
     * @throws Exception 
     */
    public void saveDefaultFormOnPluginInstall() throws HibernateException, Exception {
        FormBuilderDB[] formBuilderDB = ao.find(FormBuilderDB.class, Query.select());
        if (formBuilderDB.length == 0) {
            
            //save default confluence form in plugins DB on plugin install
            try {
                String sampleFormData = "[{\"type\":\"LABEL\",\"idOrName\":\"userparam-personal\",\"label\":\"Personal\","
                        + "\"helpDesk\":\"\",\"size\":\"\",\"required\":false},{\"type\":\"INPUT\","
                        + "\"idOrName\":\"fullName\",\"label\":\"Full Name\",\"helpDesk\":\"\","
                        + "\"placeholder\":\"placeholder\",\"size\":\"input-xlarge\",\"required\":true},"
                        + "{\"type\":\"INPUT\",\"idOrName\":\"email\",\"label\":\"Email\",\"helpDesk\":\"\",\"placeholder\":\"placeholder\",\"size\":\"input-xlarge\",\"required\":true},{\"type\":\"INPUT\",\"idOrName\":\"userparam-phone\",\"label\":\"Phone\",\"helpDesk\":\"\",\"placeholder\":\"placeholder\",\"size\":\"input-xlarge\",\"required\":false},{\"type\":\"INPUT\",\"idOrName\":\"userparam-im\",\"label\":\"IM\",\"helpDesk\":\"\",\"placeholder\":\"placeholder\",\"size\":\"input-xlarge\",\"required\":false},{\"type\":\"INPUT\",\"idOrName\":\"userparam-website\",\"label\":\"Website\",\"helpDesk\":\"\",\"placeholder\":\"placeholder\",\"size\":\"input-xlarge\",\"required\":false},{\"type\":\"TEXTAREA\",\"idOrName\":\"about-me\",\"label\":\"About Me\",\"helpDesk\":\"\",\"placeholder\":\"placeholder\",\"required\":false},{\"type\":\"LABEL\",\"idOrName\":\"userparam-company\",\"label\":\"Company\",\"helpDesk\":\"\",\"size\":\"\",\"required\":false},{\"type\":\"INPUT\",\"idOrName\":\"userparam-position\",\"label\":\"Position\",\"helpDesk\":\"\",\"placeholder\":\"placeholder\",\"size\":\"input-xlarge\",\"required\":false},{\"type\":\"INPUT\",\"idOrName\":\"userparam-department\",\"label\":\"Department\",\"helpDesk\":\"\",\"placeholder\":\"placeholder\",\"size\":\"input-xlarge\",\"required\":false},{\"type\":\"INPUT\",\"idOrName\":\"userparam-location\",\"label\":\"Location\",\"helpDesk\":\"\",\"placeholder\":\"placeholder\",\"size\":\"input-xlarge\",\"required\":false}]";
                JsonParser jsonParser = new JsonParser();
                JsonArray defaultConfigObject = (JsonArray) jsonParser.parse(sampleFormData);

                final List<FormBuilderRestBean> formBuilderRestBeanList = new ArrayList<FormBuilderRestBean>();
                for (int i = 0; i < defaultConfigObject.size(); i++) {
                    FormBuilderRestBean formBuilderRestBean = new FormBuilderRestBean();
                    try {
                        JsonObject explrObject = (JsonObject) defaultConfigObject.get(i);
                        formBuilderRestBean.setType((String) explrObject.get("type").getAsString());
                        formBuilderRestBean.setIdOrName((String) explrObject.get("idOrName").getAsString());
                        formBuilderRestBean.setLabel((String) explrObject.get("label").getAsString());
                        formBuilderRestBean.setHelpDesk((String) explrObject.get("helpDesk").getAsString());
                        formBuilderRestBean.setRequired((Boolean) explrObject.get("required").getAsBoolean());
                        if(explrObject.get("placeholder") != null){
                            formBuilderRestBean.setPlaceholder((String) explrObject.get("placeholder").getAsString());
                        }
                        if(explrObject.get("size") != null){
                            formBuilderRestBean.setSize((String) explrObject.get("size").getAsString());
                        }
                        if(explrObject.get("type") != null){
                            formBuilderRestBean.setType((String) explrObject.get("type").getAsString());
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    formBuilderRestBeanList.add(formBuilderRestBean);
                }

                ao.executeInTransaction(new TransactionCallback<String>() {
                    @Override
                    public String doInTransaction() {
                        FormBuilderDB formBuilderDB;

                        for (FormBuilderRestBean formBuilderRestBean : formBuilderRestBeanList) {

                            formBuilderDB = ao.create(FormBuilderDB.class);

                            formBuilderDB.setType(formBuilderRestBean.getType());
                            formBuilderDB.setIdOrName(formBuilderRestBean.getIdOrName());
                            formBuilderDB.setLabel(formBuilderRestBean.getLabel());
                            formBuilderDB.setHelpDesk(formBuilderRestBean.getHelpDesk());
                            formBuilderDB.setPlaceholder(formBuilderRestBean.getPlaceholder());
                            formBuilderDB.setRequired(formBuilderRestBean.isRequired());
                            formBuilderDB.setSize(formBuilderRestBean.getSize());
                            formBuilderDB.setOptions(formBuilderRestBean.getOptions());

                            formBuilderDB.save();

                        }
                        return "SUCCESS";
                    }

                });
                
                //Used timer here because updatePluginData has some dependency on above formBuilderDB
                new java.util.Timer().schedule(new java.util.TimerTask() {
                        @Override
                        public void run() {
                            try { 
                                updatePluginData();
                            } catch (Exception ex) {
                                Logger.getLogger(PluginEventListener.class.getName()).log(Level.SEVERE, null, ex);
                            }
                        }
                }, 20 * 1000 );
                     
            } catch (Exception ex) {
                java.util.logging.Logger.getLogger(PluginEventListener.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
    }
    
    /**
     * Migrating default data of users to our AO FormFieldsDataDB using threading
     * @return 
     */
    private String updatePluginData(){
        List<User> userNameList = userAccessor.getUsers().getCurrentPage();
        int noOfUsers = userNameList.size();
        int noOfThreads = 5;
        if (noOfUsers <= noOfThreads) {
            noOfThreads = 1;
        }
        int threadSize = noOfUsers / noOfThreads + 1;
        int startIndex = 0;
        int endIndex = threadSize;
        UpdatePluginDataThread.setUserCnt(1);
        UpdatePluginDataThread.setSchedulerStatus("false");
        UpdatePluginDataThread.setSchedulerValue(0.0f);
        for (int i = 0; i < noOfThreads; i++) {
            if (endIndex > noOfUsers) {
                endIndex = noOfUsers;
            }
            UpdatePluginDataThread updatePluginDataThread = 
                    new UpdatePluginDataThread(ao, userDetailsManager, 
                    userNameList.subList(startIndex, endIndex), 
                    noOfUsers, personalInformationManager, avatarManager);
            Thread thread = new Thread(updatePluginDataThread);
            thread.start();
            startIndex = startIndex + threadSize;
            endIndex = endIndex + threadSize;
            if (startIndex > noOfUsers) {
                return SUCCESS;
            }
        }
        return SUCCESS;
    }
    
    //If a new user is added in confluence 
    @EventListener
    public void userCreatedEvent(UserCreateEvent event) throws Exception{
        saveNewUserCreatedinConfluenceInAO(event.getUser());
        avatarManager.generateMD5(event.getUser());
        
    }
    
    //If new user is added in confluence after synchronizing remote user directory
//    @EventListener
//    public void RemoteDirectorySynchronisedEvent(RemoteDirectorySynchronisedEvent remoteDirectorySynchronisedEvent) {
//        updatePluginData();
//    }
    /**
     * React when users discovered during directory synchronization
     * This has been done to achieve synchronization for only newly added users through crowd.
     * @param ucfdsEvent 
     */
    @EventListener
    public void UserCreatedFromDirectorySynchronisationEvent(UserCreatedFromDirectorySynchronisationEvent ucfdsEvent) {
        com.atlassian.crowd.model.user.User user = ucfdsEvent.getUser();
        User atlassianUser = new ConfluenceUserImpl(user.getName(), 
                                                    user.getFirstName()+" "+user.getLastName(), 
                                                    user.getEmailAddress());
        saveNewUserCreatedinConfluenceInAO(atlassianUser);
    }
    /**
     * New user creation or discovered during directory synchronization event is 
     * captured and its default data is included in our AO so as to show it when 
     * the users my profile page loads up
     * @param createdUser 
     */
    public void saveNewUserCreatedinConfluenceInAO(final User createdUser) {
        FormFieldsDataDB[] formFieldsDataDB = ao.find(FormFieldsDataDB.class, "USER_ID = ?", createdUser.getName());
        if(formFieldsDataDB.length == 0) {
            ao.executeInTransaction(new TransactionCallback<String>() {
                @Override
                public String doInTransaction() {
                    FormFieldsDataDB formFieldsDataDB;

                    formFieldsDataDB = ao.create(FormFieldsDataDB.class);
                    formFieldsDataDB.setUserId(createdUser.getName());
                    formFieldsDataDB.setValue(createdUser.getFullName());
                    formFieldsDataDB.setFieldId("fullName");
                    formFieldsDataDB.save();

                    formFieldsDataDB = ao.create(FormFieldsDataDB.class);
                    formFieldsDataDB.setUserId(createdUser.getName());
                    formFieldsDataDB.setValue(createdUser.getEmail());
                    formFieldsDataDB.setFieldId("email");
                    formFieldsDataDB.save();

                    StringBuilder profileData = new StringBuilder();
                    profileData.append("fullName").append(":").append("\""+createdUser.getFullName()+"\"").append(";");
                    profileData.append("email").append(":").append("\""+createdUser.getEmail()+"\"").append(";");
                    SearchProfileDB profileDB = ao.create(SearchProfileDB.class);
                    profileDB.setUsername(createdUser.getName());
                    profileDB.setProfileData(profileData.toString().toLowerCase());
                    profileDB.save();

                    return "SUCCESS";
                }
            });
        }
    }

    @Override
    public void onStop() {
        Logger.getLogger(PluginEventListener.class.getName()).log(Level.SEVERE, "plugin Lifecycle stop");
    }
}

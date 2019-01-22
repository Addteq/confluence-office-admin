package com.addteq.confluence.plugin.userprofile.action;

import com.addteq.confluence.plugin.avatar.AvatarManager;
import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.confluence.core.ConfluenceActionSupport;
import com.atlassian.confluence.user.PersonalInformationManager;
import com.atlassian.confluence.user.UserDetailsManager;
import com.atlassian.user.User;
import java.util.List;

/**
 * This action is used to manually sync the user information with our AO which is triggered from General Configuration --> Update Plugin data
 * @author trupti kanase
 */
public class UpdatePluginData extends ConfluenceActionSupport {

    private final ActiveObjects ao;
    private final UserDetailsManager userDetailsManager;
    private UpdatePluginDataThread updatePluginDataThread;
    private float updateStatusPercentage;
    private String userProfileUpdateIsInProgress = "false";
    private final PersonalInformationManager personalInformationManager;
    private final AvatarManager avatarManager;
    
    public UpdatePluginData(ActiveObjects ao, 
            UserDetailsManager userDetailsManager, 
            PersonalInformationManager personalInformationManager,
            AvatarManager avatarManager) {
        this.ao = ao;
        this.userDetailsManager = userDetailsManager;
        this.personalInformationManager = personalInformationManager;
        this.avatarManager = avatarManager;
    }

    @Override
    public String execute() throws Exception {
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
            updatePluginDataThread = 
                    new UpdatePluginDataThread(ao, userDetailsManager, 
                            userNameList.subList(startIndex, endIndex), 
                            noOfUsers, personalInformationManager,
                            avatarManager);
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

    @Override
    public String doDefault() throws Exception {
        return SUCCESS;
    }

    public float getUpdateStatusPercentage() {
        return updateStatusPercentage;
    }

    public String isUserProfileUpdateIsInProgress() {
        return userProfileUpdateIsInProgress;
    }

}
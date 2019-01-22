package com.addteq.confluence.plugin.userprofile.action;

import com.atlassian.confluence.core.ConfluenceActionSupport;
import com.atlassian.confluence.user.ConfluenceUser;
import com.atlassian.confluence.user.PersonalInformationManager;
import com.atlassian.confluence.user.UserAccessor;
import com.atlassian.confluence.user.UserDetailsManager;
import com.atlassian.user.User;
import com.atlassian.user.UserManager;
import com.atlassian.user.impl.DefaultUser;
import com.opensymphony.webwork.ServletActionContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.lang.StringUtils;

/**
 * After the Insertion or updation of custom configured fields in the AO DB, if the request also contains any native fields like full name or email etc, 
 * then these fields are updated in confluence via this action.
 * @author trupti kanase
 */

public class SaveUserProfileNativeFields extends ConfluenceActionSupport {

    private final UserDetailsManager userDetailsManager;
    private final UserAccessor userAccessor;
    private final PersonalInformationManager personalInformationManager;
    private final UserManager userManager;
    
    public SaveUserProfileNativeFields(UserDetailsManager userDetailsManager, UserAccessor userAccessor, PersonalInformationManager personalInformationManager,UserManager userManager) {
        this.userDetailsManager = userDetailsManager;
        this.userAccessor = userAccessor;
        this.personalInformationManager = personalInformationManager; 
        this.userManager=userManager;
    }

    @Override
    public String execute() throws Exception {

        HttpServletRequest request = ServletActionContext.getRequest();
        HttpServletResponse response = ServletActionContext.getResponse();

        String userName = request.getParameter("userName");
        String fullName = StringUtils.trimToEmpty(request.getParameter("fullName"));
        String email = StringUtils.trimToEmpty(request.getParameter("email"));

        String phone = request.getParameter("phone");
        String im = request.getParameter("im");
        String website = request.getParameter("website");
        String position = request.getParameter("position");
        String department = request.getParameter("department");
        String location = request.getParameter("location");
        String aboutMe = request.getParameter("aboutMe");
        User user = userAccessor.getUserByName(userName);
        
        if(!userManager.isReadOnly(user)){
            DefaultUser defaultUser = new DefaultUser(userName);
            ConfluenceUser confUser = userAccessor.getUserByName(userName);

            if (!"".equals(fullName)) {
                defaultUser.setFullName(fullName);
            } else {
                defaultUser.setFullName(confUser.getFullName());
            }

            if (!"".equals(email)) {
                defaultUser.setEmail(email);
            } else {
                defaultUser.setEmail(confUser.getEmail());
            }

            userManager.saveUser(defaultUser);
        }
        if(aboutMe != null){
            personalInformationManager.savePersonalInformation(user, aboutMe, fullName);
        }
       
        userDetailsManager.setStringProperty(user, "phone", phone);
        userDetailsManager.setStringProperty(user, "im", im);
        userDetailsManager.setStringProperty(user, "website", website);
        userDetailsManager.setStringProperty(user, "position", position);
        userDetailsManager.setStringProperty(user, "department", department);
        userDetailsManager.setStringProperty(user, "location", location);
        userDetailsManager.setStringProperty(user, "aboutMe", aboutMe);
        return SUCCESS;
    }
}

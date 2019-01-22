package com.addteq.confluence.plugin.userprofile.action;

import com.addteq.confluence.plugin.userprofile.bean.FormBuilderRestBean;
import com.addteq.confluence.plugin.userprofile.db.FormBuilderDB;
import com.addteq.confluence.plugin.userprofile.db.FormFieldsDataDB;
import com.addteq.confluence.plugin.userprofile.db.SearchProfileDB;
import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.confluence.core.ConfluenceActionSupport;
import com.atlassian.confluence.setup.BootstrapManager;
import com.atlassian.confluence.setup.settings.SettingsManager;
import com.atlassian.confluence.user.ConfluenceUser;
import com.atlassian.confluence.user.UserAccessor;
import com.atlassian.confluence.user.UserDetailsManager;
import com.atlassian.sal.api.auth.LoginUriProvider;
import com.atlassian.sal.api.user.UserManager;
import com.atlassian.upm.api.license.PluginLicenseManager;
import com.atlassian.upm.api.license.entity.PluginLicense;
import com.atlassian.user.User;
import com.opensymphony.webwork.ServletActionContext;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import net.java.ao.Query;
import org.json.JSONObject;

public class NewPeopleDirAction extends ConfluenceActionSupport {

    private final UserDetailsManager userDetailsManager;
    private final UserAccessor userAccessor;
    private final BootstrapManager bootstrapManager;
    private final String contextPath;
    private String peopleListHtml;
    private String queryString;
    private ActiveObjects ao;
    private int searchPeopleDataCount;
    private int pageId = 1;
    private final PluginLicenseManager licenseManager;
    private String licenseErrorHtml = "";
    private final SettingsManager settingsManager;
    private List<FormBuilderRestBean> topThreeFields;
    private final UserManager userManager;
    private final LoginUriProvider loginUriProvider;
    private final org.apache.log4j.Logger LOGGER = org.apache.log4j.Logger.getLogger(NewPeopleDirAction.class.getName());
    private static final int NO_OF_FIELDS_TO_DISPLAY_IN_PEOPLE_DIRECTORY = 3;
    public NewPeopleDirAction(UserDetailsManager udm, UserAccessor userAccessor, BootstrapManager bootstrapManager, 
            ActiveObjects ao, PluginLicenseManager licenseManager, SettingsManager settingsManager,
            UserManager userManager, LoginUriProvider loginUriProvider) {
        userDetailsManager = udm;
        this.userAccessor = userAccessor;
        this.bootstrapManager = bootstrapManager;
        this.contextPath = bootstrapManager.getWebAppContextPath();
        this.ao = ao;
        this.searchPeopleDataCount = 0;
        this.licenseManager = licenseManager;
        this.settingsManager=settingsManager;
        this.userManager = userManager;
        this.loginUriProvider = loginUriProvider;
    }

    @Override
    public String execute() {
        HttpServletResponse response = ServletActionContext.getResponse();
        HttpServletRequest request = ServletActionContext.getRequest();
        if (userManager.getRemoteUsername() == null)
        {
            redirectToLogin(request, response);
        }
        String contextPATH = settingsManager.getGlobalSettings().getBaseUrl();
        String redirectURL = contextPATH + "/plugins/servlet/upm/manage/all#manage";
        
        topThreeFields = topThreeFields();
        try {
            if (licenseManager.getLicense().isDefined()) {
                PluginLicense pluginLicense = licenseManager.getLicense().get();
                if (pluginLicense.getError().isDefined()) {
                    // handle license error scenario
                    // (e.g., expiration or user mismatch)
                    String msg = "Office Admin plugin: license " + pluginLicense.getError().get().name().toLowerCase();
                    String expirationMessage = "<div class=\"aui-message warning officeAdminUnlicensedError\">"
                            + "<p class=\"title\">"
                            + "<span class=\"aui-icon icon-warning\"></span>"
                            + "<strong>" + msg + ". Please "+"<a href='"+redirectURL+"'>install</a>"+" a license."+"</strong></p>"
                            + "</div>";
                    licenseErrorHtml = expirationMessage + "</br>";
                } else {
                    String div = "<div class='newpeoplesAsMacros'>";
                    List searchUserInTheSystem = new ArrayList();
                    List fieldValuesArr = new ArrayList(3);
                    fieldValuesArr.add("");fieldValuesArr.add("");fieldValuesArr.add("");
                    if (request.getParameter("pageId") == null || request.getParameter("pageId") == "") {
                        pageId = 1;
                    } else {
                        pageId = Integer.parseInt(request.getParameter("pageId"));
                    }

                    int start = pageId * 40 - 40;
                    int end = pageId * 40 - 1;
                    try {
                    ao.flushAll();
                    if (queryString == null || queryString.trim().isEmpty()) {
                        try{
                            peopleListHtml = showUserInPeopleFormat(start, end);
                        } catch(Exception e) {
                            LOGGER.error("\n ** Falling back to Confluence People directory because of following exception: " + e);
                            /**
                             * Fall back to native people directory as the custom 
                             * people directory is throwing duplicate user error
                             * */
                            return "nativePeopleDirectory";
                        }
                        searchPeopleDataCount = ao.count(SearchProfileDB.class);
                    } else {
                        searchPeopleDataCount = ao.count(SearchProfileDB.class);
                        ao.flushAll();
                        try {
                            SearchProfileDB[] searchProfileDB = ao.find(SearchProfileDB.class, Query.select().where("USERNAME LIKE ? OR PROFILE_DATA LIKE ? ", "%" + queryString.toLowerCase()+ "%", "%" + queryString.toLowerCase()+ "%"));
                            FormBuilderDB[] formBuilderDB = ao.find(FormBuilderDB.class, "REMOVED_FIELD = ?", true);
                            if (searchProfileDB.length > 0) {
                                for (SearchProfileDB searchProfileDB1 : searchProfileDB) {
                                    boolean flag = false;                                                                       
                                    //Convert String in JSON Object, delete the removedField from JSON.
                                    JSONObject dataObject = new JSONObject("{" + searchProfileDB1.getProfileData() + "}");
                                    for (FormBuilderDB label : formBuilderDB) {
                                        dataObject.remove(label.getLabel().toLowerCase());
                                    }
                                    String finalObjString = dataObject.toString();
                                    if (finalObjString.toLowerCase().indexOf(queryString.toLowerCase()) > -1) {
                                        flag = false;
                                    } else {
                                        flag = true;
                                    }
                                    
                                    if(!userAccessor.isDeactivated(searchProfileDB1.getUsername()) && !flag) {
                                        fieldValuesArr = new ArrayList(3);
                                        fieldValuesArr.add("");
                                        fieldValuesArr.add("");
                                        fieldValuesArr.add("");
                                        ConfluenceUser tu = userAccessor.getUserByName(searchProfileDB1.getUsername());
                                        FormFieldsDataDB[] formFieldsDataDB = ao.find(FormFieldsDataDB.class, " USER_ID = ?", searchProfileDB1.getUsername());
                                        int i = 0;
                                        for (FormBuilderRestBean topThreeField : topThreeFields) {
                                            for (FormFieldsDataDB formFieldsDataDBTemp : formFieldsDataDB) {

                                                if (topThreeField.getIdOrName().trim().equals(formFieldsDataDBTemp.getFieldId().trim())) {
                                                    if (topThreeField.getLabel().contains("Full Name")) {
                                                        fieldValuesArr.add(i, "<h4><a href=" + contextPath + "/display/~" + searchProfileDB1.getUsername() + " class='url fn confluence-userlink' data-username='" + searchProfileDB1.getUsername() + "'>" + formFieldsDataDBTemp.getValue() + "</a></h4>");
                                                    } else if (topThreeField.getLabel().contains("Email")) {
                                                        fieldValuesArr.add(i, "<a href='mailto:" + formFieldsDataDBTemp.getValue() + "' title='Send Email to " + tu.getFullName() + "' class='email'>" + formFieldsDataDBTemp.getValue() + "</a><br>");
                                                    } else if (topThreeField.getLabel().contains("Website")) {
                                                        String url = getValidURL(formFieldsDataDBTemp.getValue());
                                                        fieldValuesArr.add(i, "<a href='" + url + "' title='" + tu.getFullName() + "' class='website'>" + url + "</a><br>");
                                                    } else {
                                                        fieldValuesArr.add(i, "" + formFieldsDataDBTemp.getValue());
                                                    }

                                                    i++;
                                                }

                                            }
                                        }
                                        String cuName = tu.getName();
                                        String cuFullName = tu.getFullName();
                                        String cuEmail = tu.getEmail();
                                        String cuImage = userAccessor.getUserProfilePicture(tu).getDownloadPath();
                                        String cuPhone = userDetailsManager.getStringProperty(tu, "phone");
                                        cuPhone = cuPhone == null ? "" : cuPhone;
                                        div += buildDiv(cuName, cuFullName, cuEmail, cuImage, (String) fieldValuesArr.get(0), (String) fieldValuesArr.get(1), (String) fieldValuesArr.get(2));
                                        LOGGER.info("People directory User: "+cuName+" - OK");
                                    }
                                }    
                            }
                        } catch (Exception e) {
                            LOGGER.error(e);
                        }
                        div += "</div>";
                        peopleListHtml = div;
                    }
                }catch(Exception e) {
                    LOGGER.error(e);
                }
                }
            } else {
                // handle unlicensed scenario
                String expirationMessage = "<div class=\"aui-message warning officeAdminUnlicensedError\">"
                        + "<p class=\"title\">"
                        + "<span class=\"aui-icon icon-warning\"></span>"
                        + "<strong>Office Admin plugin: unlicensed. Please " + "<a href='" + redirectURL + "'>install</a>" + " a license.</strong></p>"
                        + "</div>";
                licenseErrorHtml = expirationMessage + "</br>";
            }
        } catch (Exception e) {
            LOGGER.error(e);
        }
        return SUCCESS;
    }

    public String getLicenseErrorHtml() {
        return licenseErrorHtml;
    }

    public int getUsersCount() {
        return userAccessor.countUsersWithConfluenceAccess();
    }

    public String showUserInPeopleFormat(int startIndex, int endIndex) throws Exception{
        String div = "<div class='newpeoplesAsMacros'>";
        List<String> allUserInTheSystem = userAccessor.getUserNamesWithConfluenceAccess();
        if (endIndex > allUserInTheSystem.size()) {
            endIndex = allUserInTheSystem.size();
        }

        List<String> sortedList = sortAccordingToFullName(allUserInTheSystem);
        List<String> subListOfUsers = sortedList.subList(startIndex, endIndex);
        for (String userId : subListOfUsers) {
            List fieldValuesArr = new ArrayList(3);
            fieldValuesArr.add("");fieldValuesArr.add("");fieldValuesArr.add("");
            User tu = userAccessor.getUserByName(userId);
            FormFieldsDataDB[] formFieldsDataDB = ao.find(FormFieldsDataDB.class, " USER_ID = ?", userId);
            int i = 0;
            for (FormBuilderRestBean topThreeField : topThreeFields) {
                for (FormFieldsDataDB formFieldsDataDBTemp : formFieldsDataDB) {
                    
                    if (topThreeField.getIdOrName().trim().equals(formFieldsDataDBTemp.getFieldId().trim())) {
                        if (topThreeField.getLabel().contains("Full Name")) {
                            fieldValuesArr.add(i, "<h4><a href=" + contextPath + "/display/~" + userId + " class='url fn confluence-userlink' data-username='" + userId + "'>" + formFieldsDataDBTemp.getValue() + "</a></h4>");
                        } else if (topThreeField.getLabel().contains("Email")) {
                            fieldValuesArr.add(i, "<a href='mailto:" + formFieldsDataDBTemp.getValue() + "' title='Send Email to " + tu.getFullName() + "' class='email'>" + formFieldsDataDBTemp.getValue() + "</a><br>");
                        } else if (topThreeField.getLabel().contains("Website")) {
                            String url = getValidURL(formFieldsDataDBTemp.getValue());
                            fieldValuesArr.add(i, "<a href='" + url + "' title='" + tu.getFullName() + "' class='website'>" + url + "</a><br>");
                        } else {
                            fieldValuesArr.add(i, "" + formFieldsDataDBTemp.getValue());
                        }
                        i++;
                    }

                }
            }
            String cuName = tu.getName();
            String cuFullName = tu.getFullName();
            String cuEmail = tu.getEmail();
            String cuImage = userAccessor.getUserProfilePicture(tu).getDownloadPath();
            String cuPhone = userDetailsManager.getStringProperty(tu, "phone");
            cuPhone = cuPhone == null ? "" : cuPhone;
            div += buildDiv(cuName, cuFullName, cuEmail, cuImage,(String) fieldValuesArr.get(0),(String) fieldValuesArr.get(1),(String) fieldValuesArr.get(2));
        }
        div += "</div>";
        return div;
    }

    private String buildDiv(String cuName, String cuFullName, String cuEmail, String cuImage, String firstField, String secondField, String thirdField) {
        String div = "";
        div += "<div class='profile-macro'>";
        div += "<div class='vcard'>";
        div += "<a class='userLogoLink' data-username='" + cuName + "' href=" + contextPath + "/display/~" + cuName + ">";
        div += "<img class='userLogo logo' src=" + contextPath + "" + cuImage + " alt='User icon: " + cuName + "' title='" + cuFullName + "'></a>";
        div += "<div class='values'>";
        div += "<div>" + firstField + "</div>";
        div += "<div>" + secondField + "</div>";
        div += "<div>" + thirdField + "</div>";
        div += "</div>";
        div += "</div>";
        div += "</div>";//profile-macro   
        return div;
    }

    public String getValidURL(String inputUrl) {
        String inputUrlTemp = inputUrl;
        if (!inputUrlTemp.contains("http://")) {
            inputUrlTemp = "http://" + inputUrlTemp;
        } else if (!inputUrlTemp.contains("https://")) {
            inputUrlTemp = "https://" + inputUrlTemp;
        }
        URL url = null;
        try {
            url = new URL(inputUrlTemp);
        } catch (MalformedURLException e) {

        }
        if (url != null) {
            return inputUrlTemp;
        } else {
            return inputUrl;
        }
    }
    
    /**
     * In People directory only 3 fields of a particular user is shown along with the profile picture
     * This method does the same but fetching the top 3 details of a user from our custom entity.
     * @return 
     */
    public List<FormBuilderRestBean> topThreeFields() {
        List<FormBuilderRestBean> formBuilderRestBeanList = new ArrayList<FormBuilderRestBean>();
        FormBuilderRestBean formBuilderRestBean;
        FormBuilderDB[] formBuilderDB = ao.find(FormBuilderDB.class, "TYPE != ?", "LABEL");
        for (FormBuilderDB formBuilderDBTemp : formBuilderDB) {

            formBuilderRestBean = new FormBuilderRestBean();
            formBuilderRestBean.setIdOrName(formBuilderDBTemp.getIdOrName());
            formBuilderRestBean.setLabel(formBuilderDBTemp.getLabel());

            formBuilderRestBeanList.add(formBuilderRestBean);
        }
        if(formBuilderRestBeanList.size() > NO_OF_FIELDS_TO_DISPLAY_IN_PEOPLE_DIRECTORY){
            return formBuilderRestBeanList.subList(0, NO_OF_FIELDS_TO_DISPLAY_IN_PEOPLE_DIRECTORY);
        }
        return formBuilderRestBeanList;
    }
    
    public List<String> sortAccordingToFullName(List<String> allUserInTheSystem) {
                
        int noOfUsers = allUserInTheSystem.size();
        String[][] data = new String[noOfUsers][2];
        ConfluenceUser tempUser;
        for(int i = 0; i < noOfUsers; i++) {
            tempUser = userAccessor.getUserByName(allUserInTheSystem.get(i));
            data[i][1] = allUserInTheSystem.get(i);
            data[i][0] = tempUser.getFullName();
        }

        Arrays.sort(data, new Comparator<String[]>() {
            @Override
            public int compare(final String[] entry1, final String[] entry2) {
                final String fullName1 = entry1[0];
                final String fullName2 = entry2[0];
                return fullName1.toLowerCase().compareTo(fullName2.toLowerCase());
            }
        });

        List<String> sortedList = new ArrayList<String>();
        for(int i = 0; i < noOfUsers; i++) {
            sortedList.add(i, data[i][1]);
        }
        return sortedList;
    }
    private void redirectToLogin(HttpServletRequest req, HttpServletResponse resp) {
        try {
            resp.sendRedirect(loginUriProvider.getLoginUri(URI.create(req.getRequestURL().toString())).toASCIIString());
        } catch (IOException ex) {
            Logger.getLogger(NewPeopleDirAction.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    public String getPeopleListHtml() {
        return peopleListHtml;
    }

    public void setPeopleListHtml(String peopleListHtml) {
        this.peopleListHtml = peopleListHtml;
    }

    public String getQueryString() {
        return queryString;
    }

    public void setQueryString(String queryString) {
        this.queryString = queryString;
    }

    public int getPageId() {
        return pageId;
    }

    public void setPageId(int pageId) {
        this.pageId = pageId;
    }

    public int getSearchPeopleDataCount() {
        return searchPeopleDataCount;
    }

    public void setSearchPeopleDataCount(int searchPeopleDataCount) {
        this.searchPeopleDataCount = searchPeopleDataCount;
    }

}
package com.addteq.confluence.plugin.userprofile.rest;

import com.addteq.confluence.plugin.userprofile.bean.FormBuilderRestBean;
import com.addteq.confluence.plugin.userprofile.db.FormBuilderDB;
import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.confluence.setup.settings.SettingsManager;
import com.atlassian.plugin.Plugin;
import com.atlassian.plugin.PluginAccessor;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import com.atlassian.sal.api.transaction.TransactionCallback;
import com.atlassian.upm.api.license.PluginLicenseManager;
import com.atlassian.upm.api.license.entity.PluginLicense;
import static com.opensymphony.xwork.Action.SUCCESS;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import net.java.ao.Query;

/**
 *
 * @author neeraj bodhe
 */
@Path("/userProfileManager")
public class UserProfileManager {

    private final ActiveObjects ao;
    private final PluginLicenseManager licenseManager;
    public static String licenseErrorHtml = "";
    private final SettingsManager settingsManager;
    private final PluginAccessor pluginAccessor;
    public UserProfileManager(ActiveObjects ao, PluginLicenseManager licenseManager, SettingsManager settingsManager,PluginAccessor pluginAccessor) {
        this.ao = ao;
        this.licenseManager = licenseManager;
        this.settingsManager=settingsManager;
        this.pluginAccessor = pluginAccessor;
    }   

    /**
     * Saves all attributes in the AO, They are actually all the properties of html elements used.
     * @param formBuilderRestBeanArray
     * @return 
     */
    @POST
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/saveFormBuilder")
    public Response saveFormBuilder(final FormBuilderRestBean[] formBuilderRestBeanArray) {
        deleteConfiguredForm();

        ao.executeInTransaction(new TransactionCallback<FormBuilderRestBean>() {
            @Override
            public FormBuilderRestBean doInTransaction() {
                FormBuilderDB formBuilderDB;
                for (FormBuilderRestBean formBuilderRestBean : formBuilderRestBeanArray) {

                    formBuilderDB = ao.create(FormBuilderDB.class);

                    formBuilderDB.setType(formBuilderRestBean.getType());
                    formBuilderDB.setIdOrName(formBuilderRestBean.getIdOrName());
                    formBuilderDB.setLabel(formBuilderRestBean.getLabel());
                    formBuilderDB.setHelpDesk(formBuilderRestBean.getHelpDesk());
                    formBuilderDB.setPlaceholder(formBuilderRestBean.getPlaceholder());
                    formBuilderDB.setRequired(formBuilderRestBean.isRequired());
                    formBuilderDB.setSize(formBuilderRestBean.getSize());
                    formBuilderDB.setOptions(formBuilderRestBean.getOptions());
                    formBuilderDB.setRemovedField(formBuilderRestBean.isRemovedField());

                    formBuilderDB.save();

                }
                return formBuilderRestBeanArray[0];
            }
        });

        return Response.ok(formBuilderRestBeanArray).build();
    }    
    
    @DELETE
    @AnonymousAllowed
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/removeFieldFormBuilder")
    public Response removeFieldFormBuilder(final FormBuilderRestBean formBuilderRestBean) {

        ao.executeInTransaction(new TransactionCallback<FormBuilderRestBean>() {
            @Override
            public FormBuilderRestBean doInTransaction() {
                    FormBuilderDB[] formBuilderDB = ao.find(FormBuilderDB.class, " ID_OR_NAME = ?", formBuilderRestBean.getIdOrName());
                    if (formBuilderDB.length > 0) {
                        ao.delete(formBuilderDB);   
                    }

                return formBuilderRestBean;
            }
        });

        return Response.ok(formBuilderRestBean).build();
    }

    @GET
    @AnonymousAllowed
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/getFormBuilder")
    public Response getFormFields() {
        return Response.ok(getFormFieldsFromDb()).build();
    }
    
    /*
        This method is used to retrive the form builder which is configured at Admin side.
    */
    public List<FormBuilderRestBean> getFormFieldsFromDb() {
        List<FormBuilderRestBean> formBuilderRestBeanList = new ArrayList<FormBuilderRestBean>();
        FormBuilderRestBean formBuilderRestBean;
        FormBuilderDB[] formBuilderDB = ao.find(FormBuilderDB.class, Query.select());
        
        /*
         *  Store all the field-ids of configured form in the SET 
         *   that will be used later to check if newly added field-id is already exist in the configured form.
         */
        Set<String> allFieldsIds = new HashSet<>();
        for (FormBuilderDB formBuilderDBTemp : formBuilderDB) {
            allFieldsIds.add(formBuilderDBTemp.getIdOrName());
        }
        
        Set<String> traveredFields = new HashSet<>();
        int i=0;
        for (FormBuilderDB formBuilderDBTemp : formBuilderDB) {
            /*  Ref: PLUG-5285
             *   In some scenarios fields were having duplicate Ids.
             *   With below snippet we are replacing all duplicate fieldId & assigning new id to those fields.
             */
            String id = formBuilderDBTemp.getIdOrName();
            if (traveredFields.contains(id)) {
                String newId = id;
                
                /* Generate a newId untill it is not unique. */
                while (allFieldsIds.contains(newId)) {
                    Matcher m = Pattern.compile("[0-9]+").matcher(id);
                    if (m.find(0)) {
                        long oldGroup = Long.parseLong(m.group(0));
                        long newGroup = oldGroup + ++i; //increamenet oldOd by 1
                        newId = id.replace(Long.toString(oldGroup),Long.toString(newGroup));
                    }
                }
                
                /* If newId is not same as oldId then only update the fieldId*/
                if(!id.equals(newId)){
                    formBuilderDBTemp.setIdOrName(newId);
                    formBuilderDBTemp.save();
                    traveredFields.add(newId);
                    allFieldsIds.add(newId);
                }
            } else {
                traveredFields.add(id);
            }
            /* End of replace duplicate Id */
            formBuilderRestBean = new FormBuilderRestBean();
            
            formBuilderRestBean.setType(formBuilderDBTemp.getType());
            formBuilderRestBean.setIdOrName(formBuilderDBTemp.getIdOrName());
            formBuilderRestBean.setLabel(formBuilderDBTemp.getLabel());
            formBuilderRestBean.setHelpDesk(formBuilderDBTemp.getHelpDesk());
            formBuilderRestBean.setPlaceholder(formBuilderDBTemp.getPlaceholder());
            formBuilderRestBean.setRequired(formBuilderDBTemp.isRequired());
            formBuilderRestBean.setOptions(formBuilderDBTemp.getOptions());
            formBuilderRestBean.setSize(formBuilderDBTemp.getSize());
            formBuilderRestBean.setRemovedField(formBuilderDBTemp.isRemovedField());
            
            formBuilderRestBeanList.add(formBuilderRestBean);
        }
        return formBuilderRestBeanList;
    }

    public void deleteConfiguredForm() {
        FormBuilderRestBean formBuilderRestBeanResponse = ao.executeInTransaction(new TransactionCallback<FormBuilderRestBean>() {
            @Override
            public FormBuilderRestBean doInTransaction() {
                FormBuilderRestBean fbrb = new FormBuilderRestBean();
                FormBuilderDB[] formBuilderDB = ao.find(FormBuilderDB.class, Query.select());
                if (formBuilderDB.length > 0) {
                    ao.delete(formBuilderDB);
                }
                return fbrb;
            }
        });
    }

    @GET
    @AnonymousAllowed
    @Path("/checkLicenseIsValid")
    public Response checkLicenseIsValid() {
        validateLicense();
        return Response.ok(licenseErrorHtml).build();
    }

    public String validateLicense() {
        String contextPATH=settingsManager.getGlobalSettings().getBaseUrl();
        String redirectURL=contextPATH+"/plugins/servlet/upm/manage/all#manage";
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
                    licenseErrorHtml = SUCCESS;
                }
            } else {
                // handle unlicensed scenario
                  String expirationMessage = "<div class=\"aui-message warning officeAdminUnlicensedError\">"
                    + "<p class=\"title\">"
                    + "<span class=\"aui-icon icon-warning\"></span>"
                    + "<strong>Office Admin plugin: unlicensed. Please "+"<a href='"+redirectURL+"'>install</a>"+" a license.</strong></p>"
                    + "</div>";
                licenseErrorHtml = expirationMessage + "</br>";
            }
        } catch (Exception e) {
            Logger.getLogger(UserProfileFieldsManager.class.getName()).log(Level.SEVERE, null, e);
              String expirationMessage = "<div class=\"aui-message warning officeAdminUnlicensedError\">"
                    + "<p class=\"title\">"
                    + "<span class=\"aui-icon icon-warning\"></span>"
                    + "<strong>Office Admin plugin: unlicensed. Please "+"<a href='"+redirectURL+"'>install</a>"+" a license.</strong></p>"
                    + "</div>";
            licenseErrorHtml = expirationMessage + "</br>";
        }
        return licenseErrorHtml;
    }
    
    @GET
    @AnonymousAllowed
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/isAnotherUserProfilePluginIsInstalled")
    public Response isAnotherUserProfilePluginIsInstalled() {
        
        List<String> userProfilePluginsList = new ArrayList<>();
        userProfilePluginsList.add("de.communardo.confluence.plugins.userprofile"); //User Profiles for Confluence
        userProfilePluginsList.add("net.seibertmedia.plugin.confluence.cup"); //Custom User Profile
        userProfilePluginsList.add("org.nyfoundling.confluence.customprofile"); //Custom User Profile Macro
        userProfilePluginsList.add("com.vertuna.confluence.plugins.profile-strength"); //User Profile Strength Plugin
        userProfilePluginsList.add("com.equionconsulting.confluence.epp"); //Enterprise Profile Pics for Confluence
        userProfilePluginsList.add("com.hascode.confluence.plugin.mobile-user-vcard"); //QR Code User Profile
        userProfilePluginsList.add("org.echocat.adam"); //echocat Adam
        
        Iterator<String> itr = userProfilePluginsList.iterator();
        while(itr.hasNext()){
            Plugin plugin = pluginAccessor.getEnabledPlugin(itr.next());
            if(plugin != null){
                return Response.ok(plugin.getName()).build();
            }
        }
        return Response.ok("FALSE").build();
    }
}

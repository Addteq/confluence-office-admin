package com.addteq.confluence.plugin.userprofile.rest;

import com.addteq.confluence.plugin.officeadmin.service.ModuleManagerService;
import com.addteq.confluence.plugin.officeadmin.utils.PluginModuleKeyUtils;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 * This provides all the REST endpoints to enable disable a module of the
 * plug-in.
 *
 * @author Vikash Kumar <vikash.kumar@addteq.com>
 */
@AnonymousAllowed
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/module-manager")
public class PluginModuleManager {

    private final ModuleManagerService moduleManager;

    public PluginModuleManager(ModuleManagerService moduleManager) {
        this.moduleManager = moduleManager;
    }

    /**
     * Get current status of the module `userprofile`
     *
     * @return true if the module is enabled and false if it is disabled.
     */
    @GET
    @Path("/userprofile")
    public Response userProfile() {

        Boolean result = moduleManager.isEnabled(PluginModuleKeyUtils.USER_PROFILE);
        return Response.ok(result).build();
    }

    /**
     * Change the status of the `userprofile` module by sending the action
     *
     * @param action can accept two possible and meaningful values 1. enable:
     * will enable the userprofile module and 2. disable will disable the
     * userprofile module. Anything apart from these two values will be
     * discarded.
     * @return
     */
    @PUT
    @Path("/userprofile/{action}")
    public Response userProfile(@PathParam("action") String action) {

        Boolean result = false;
        switch (action) {
            case PluginModuleKeyUtils.ENABLE:
                result = moduleManager.enable(PluginModuleKeyUtils.USER_PROFILE);
                break;

            case PluginModuleKeyUtils.DISABLE:
                result = moduleManager.disable(PluginModuleKeyUtils.USER_PROFILE);
                break;

            default:
                result = false;
                break;
        }

        return Response.ok(result).build();
    }

}

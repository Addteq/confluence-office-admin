package com.addteq.confluence.plugin.userprofile.action;

import com.atlassian.bandana.BandanaManager;
import com.atlassian.confluence.setup.bandana.ConfluenceBandanaContext;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@AnonymousAllowed
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/editProfile")
public class EditProfileAction {
    private final BandanaManager bandanaManager;

    public EditProfileAction(BandanaManager bandanaManager) {
        this.bandanaManager = bandanaManager;
    }

    @PUT
    @Path("/permission/{status}")
    public Response permission(@PathParam("status") String status) {
        if (status != null && ("true".equals(status) || "false".equals(status))) {
            bandanaManager.setValue(new ConfluenceBandanaContext(), "com.addteq.confluence.plugin.userprofile.allowEditOwnProfile", status);
        } else {
            return Response.status(Response.Status.BAD_REQUEST).entity("Wrong input value for `status`").build();
        }

        return Response.ok("true").build();
    }

    @GET
    @Path("/permission")
    public Response execute() throws Exception {
        String result = (String) bandanaManager.getValue(new ConfluenceBandanaContext(), "com.addteq.confluence.plugin.userprofile.allowEditOwnProfile");
        return Response.ok(result).build();
    }
}

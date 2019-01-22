package com.addteq.confluence.plugin.officeadmin.filter;

import com.atlassian.sal.api.user.UserKey;
import com.atlassian.sal.api.user.UserManager;
import com.atlassian.upm.api.license.PluginLicenseManager;
import java.io.IOException;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * A servlet filter which will check authorization of the every calls whose path
 * includes /module-manager/ in it.
 *
 * @author Vikash Kumar <vikash.kumar@addteq.com>
 */
public class AuthorizationFilter implements Filter {

    private final UserManager userManager;
    private final PluginLicenseManager pluginLicenseManager;

    public AuthorizationFilter(UserManager userManager, PluginLicenseManager pluginLicenseManager) {

        this.pluginLicenseManager = pluginLicenseManager;
        this.userManager = userManager;
    }

    /**
     * Check if the user is Confluence System Admin before making any
     * module-management related operations such as disabling a module from
     * Office Admin plugin via REST API.
     *
     * @param request ServletRequest Object
     * @param response ServletResponse Object
     * @param chain FilterChain Object
     * @throws IOException
     * @throws ServletException
     */
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {

        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        HttpServletResponse httpServletResponse = (HttpServletResponse) response;
        UserKey userKey = userManager.getRemoteUserKey(httpServletRequest);
        // Check if the currently loggedin user is Confluence System Admin
        if (!userManager.isSystemAdmin(userKey)) {
            httpServletResponse.sendError(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "You are not authorized to do this operation"
            );
        } else if (!isLicenseValid()) {
            httpServletResponse.sendError(
                    HttpServletResponse.SC_FORBIDDEN,
                    "You do not have valid license of the Office Admin plugin. Please contact your Confluence Adminstrator."
            );
        } else {
            chain.doFilter(request, response);
        }
    }

    public Boolean isLicenseValid() {
        if (pluginLicenseManager.getLicense().isDefined()) {
            if (pluginLicenseManager.getLicense().get().getError().isDefined()) {
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }
    /**
     * @param filterConfig
     * @throws javax.servlet.ServletException
     * @see Filter#init(FilterConfig)
     */
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // TODO Auto-generated method stub
    }

    /**
     * @see Filter#destroy()
     */
    @Override
    public void destroy() {
        // TODO Auto-generated method stub
    }


}

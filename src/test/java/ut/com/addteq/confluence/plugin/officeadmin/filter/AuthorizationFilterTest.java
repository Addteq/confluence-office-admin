package ut.com.addteq.confluence.plugin.officeadmin.filter;

import com.addteq.confluence.plugin.officeadmin.filter.AuthorizationFilter;
import com.atlassian.sal.api.user.UserKey;
import com.atlassian.sal.api.user.UserManager;
import com.atlassian.upm.api.license.PluginLicenseManager;
import com.atlassian.upm.api.license.entity.PluginLicense;
import com.atlassian.upm.api.util.Option;
import java.io.IOException;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import static org.mockito.Mockito.*;
import org.mockito.runners.MockitoJUnitRunner;

@RunWith(MockitoJUnitRunner.class)
public class AuthorizationFilterTest {

    @Mock
    HttpServletRequest httpServletRequest;
    @Mock
    HttpServletResponse httpServletResponse;
    @Mock
    UserManager userManager;
    @Mock
    Option<PluginLicense> pluginLicense;
    @Mock
    FilterChain filterChain;

    AuthorizationFilter authorizationFilter;
    PluginLicenseManager pluginLicenseManager;
    UserKey userKeyNotAdmin = new UserKey("notAdmin");
    UserKey userKeyAdmin = new UserKey("admin");

    @Before
    public void setup() {

        authorizationFilter = new AuthorizationFilter(userManager, pluginLicenseManager);
    }

    @After
    public void tearDown() {

        authorizationFilter.destroy();
    }

    /**
     * Test case when user is not system admin
     *
     * @throws IOException
     * @throws ServletException
     */
    @Test
    public void isUserNonSystemAdmin() throws IOException, ServletException {

        when(userManager.getRemoteUserKey(httpServletRequest)).thenReturn(userKeyAdmin);

        // Mock valid license
        final AuthorizationFilter spyAuthFilter = spy(authorizationFilter);
        doReturn(Boolean.TRUE).when(spyAuthFilter).isLicenseValid();
        spyAuthFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

        verify(httpServletResponse).sendError(
                HttpServletResponse.SC_UNAUTHORIZED,
                "You are not authorized to do this operation"
        );
    }

    /**
     * Test case when user is system admin.
     *
     * @throws IOException
     * @throws ServletException
     */
    @Test
    public void isUserSystemAdmin() throws IOException, ServletException {

        // Mock valid system admin user
        when(userManager.getRemoteUserKey(httpServletRequest)).thenReturn(userKeyAdmin);
        when(userManager.isSystemAdmin(userKeyAdmin)).thenReturn(Boolean.TRUE);

        //Test 1: Mock valid license
        final AuthorizationFilter spyAuthFilter = spy(authorizationFilter);
        doReturn(Boolean.TRUE).when(spyAuthFilter).isLicenseValid();
        spyAuthFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);
        verify(filterChain).doFilter(httpServletRequest, httpServletResponse);

        //TEST 2. Mock invalid license
        doReturn(Boolean.FALSE).when(spyAuthFilter).isLicenseValid();
        spyAuthFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);
        verify(httpServletResponse).sendError(
                HttpServletResponse.SC_FORBIDDEN,
                "You do not have valid license of the Office Admin plugin. Please contact your Confluence Adminstrator."
        );

    }

    /**
     * Test case when user does not exist
     *
     * @throws IOException
     * @throws ServletException
     */
    @Test
    public void userDoesNotExist() throws IOException, ServletException {

        //Return null for the given user so that it can satisfy the condition USER_DOES_NOT_EXISTS.
        when(userManager.getRemoteUserKey(httpServletRequest)).thenReturn(null);
        authorizationFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

        verify(httpServletResponse).sendError(
                HttpServletResponse.SC_UNAUTHORIZED,
                "You are not authorized to do this operation"
        );
    }

    /**
     * Test case to cover when the plugin is unlicensed and user trying to
     * enable/disable modules.
     *
     * @throws IOException
     * @throws ServletException
     */
    @Test
    public void unlicensedAccessToRestRecource() throws IOException, ServletException {

        // Mock valid system admin user
        when(userManager.getRemoteUserKey(httpServletRequest)).thenReturn(userKeyAdmin);
        when(userManager.isSystemAdmin(userKeyAdmin)).thenReturn(Boolean.TRUE);
        final AuthorizationFilter spyAuthFilter = spy(authorizationFilter);
        doReturn(Boolean.FALSE).when(spyAuthFilter).isLicenseValid();
        spyAuthFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

        verify(httpServletResponse).sendError(
                HttpServletResponse.SC_FORBIDDEN,
                "You do not have valid license of the Office Admin plugin. Please contact your Confluence Adminstrator."
        );
    }
}

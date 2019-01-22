package ut.com.addteq.confluence.plugin.officeadmin.service;

import com.addteq.confluence.plugin.officeadmin.service.ModuleManagerServiceImpl;
import com.atlassian.plugin.PluginAccessor;
import com.atlassian.plugin.PluginController;
import junit.framework.TestCase;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import static org.mockito.Mockito.*;
import org.mockito.runners.MockitoJUnitRunner;

/**
 * @author Vikash Kumar <vikash.kumar@addteq.com>
 * Testing
 * {@link com.addteq.confluence.plugin.userprofile.rest.PluginModuleManager}
 *
 */
@RunWith(MockitoJUnitRunner.class)
public class TestModuleManagerServiceImpl extends TestCase {

    @Mock
    private ModuleManagerServiceImpl moduleManagerServiceImpl;

    @Mock
    private PluginController pluginController;

    @Mock
    private PluginAccessor pluginAccessor;


    @Override
    protected void setUp() throws Exception {

    }

    @Test
    public void testEnable() {
        // Exception test case
        doThrow(Exception.class).when(pluginController).enablePluginModule("mockUserProfile");
        // When Exception is thrown then the result is set to `false`
        assertFalse(moduleManagerServiceImpl.enable("mockUserProfile"));

    }

    @Test
    public void testDisable() {
        // Exception test case
        doThrow(Exception.class).when(pluginController).disablePluginModule("mockUserProfile");
        // When Exception is thrown then the result is set to `false`
        assertFalse(moduleManagerServiceImpl.disable("mockUserProfile"));

    }

    public void testIsEnabled() {
        Mockito.when(pluginAccessor.isPluginModuleEnabled("mockUserProfile")).thenReturn(true, false);
        assertTrue(moduleManagerServiceImpl.isEnabled("mockUserProfile"));
        assertFalse(moduleManagerServiceImpl.isEnabled("mockUserProfile"));
    }
}

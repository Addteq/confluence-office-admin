/**
 * This file is used to redirect the default profile page to our plugin's custom profile page.
 * 
 */
AJS.toInit(function () {
    jQuery('#people-directory-link').attr('href', AJS.contextPath() + '/plugins/newpeopledir/newpeopledir.action?pageId=1');
    jQuery("#people-search").submit(function(event){      
        var searchString = jQuery("#queryString").val();
        if(searchString.length < 3) {
            alert("Search string must be of 3 characters or more.");
            event.preventDefault();
        } 
    });
});

// Redirect to Office Admin people directory if user tries to go to the native people direcotry of Confluence
// But, if the fallback flag is on then show the native people directory.
// fallback is on if any unhandled exception occurs in the office admin- people directory
if( document.location.href.indexOf("browsepeople.action") > 0 && document.location.href.indexOf("fallback")<0){        
    window.location.href = AJS.contextPath() + '/plugins/newpeopledir/newpeopledir.action?pageId=1';
}
if(document.location.href.indexOf("browsepeople.action#fallback")>0) {
    AJS.log("Office Admin: %c Falling back to Confluence People directory. Please check Confluence log for more details.",'background: yellow; color: red');
}
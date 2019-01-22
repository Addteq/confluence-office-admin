/**
 * This is to disable quick edit on any page wherein floorplan or flowdiagram is present.
 * Because of this all the JS resources are loaded successfully
 */
AJS.toInit(function () {

    jQuery(document).ready(function () {
        var editLinkUrl=jQuery('#editPageLink').attr('href');
        if (jQuery('#floorplanImage').length > 0) {
            //To disable Quick edit on "e" keypress & on "edit" button click.
            jQuery(document).keypress(function (e) {
                if (e.keyCode == 69) {
                    if(jQuery('input:focus').length < 0){
                        e.preventDefault();
                        window.location=editLinkUrl;
                    }
                }
            });
        }
    });

});
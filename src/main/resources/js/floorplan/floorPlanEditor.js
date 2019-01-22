var floorPlanErrorDialog = "<section role='dialog' id='floorPlanErrorDialog' class='aui-layer aui-dialog2 ' style= 'top:40%; width:450px; height: 160px;' aria-hidden='true'>"
        + "<header class='aui-dialog2-header'><h2 class='aui-dialog2-header-main'>Error</h2></header>"
        + "<div class='aui-dialog2-content'><div>Please enter image size of minimum 600px * 600px <br> And \'Reset the image size to original\' from Image Property Panel.</div></div>";

AJS.toInit(function () {
    jQuery(document).ready(function () {
        if (Confluence.QuickEdit !== undefined) { //If QuickPageEdit plugin is enabled
            //On QuickEdit load event.
            AJS.bind('quickedit.visible', function () {
                //Bind events
                bindPageEditEvents();
            });
        } else {
            //Bind events
            bindPageEditEvents();
        }
    });
});

function bindPageEditEvents(){
    
    jQuery('iframe').contents().find('head').append('<style>.wysiwyg-macro[data-macro-name="floorplan"] img,.wysiwyg-macro[data-macro-name="flowdiagram"] img{ width:auto !important;height: auto !important;} </style>');

        AJS.$("#rte-button-publish").mousedown(function (e) {  //On saving the page
            jQuery("iframe").contents().find(".wysiwyg-macro[data-macro-name='floorplan'], .wysiwyg-macro[data-macro-name='flowdiagram']").each(function () {
                jQuery(this).find(".confluence-embedded-image").each(function () {
                    if (jQuery(this)[0].naturalWidth < 600 || jQuery(this)[0].naturalHeight < 600) {
                        e.preventDefault();
                        if (jQuery('#floorPlanErrorDialog').length == 0) {
                            jQuery('body').append(floorPlanErrorDialog);
                        }
                        AJS.dialog2("#floorPlanErrorDialog").show();
                    }
                });
            });
        });

        /*Added below logic to remove image property panel which gets displayed by default whenever new image gets inserted in floorplan macro.**/
        var imageInsideFloorPlan = false;
        jQuery('body').bind('DOMNodeInserted', function (e) {
            if (e.target.className == "aui-property-panel" && imageInsideFloorPlan) {
                if (jQuery('.aui-property-panel').find('.macro-placeholder-property-panel-edit-button').length == 0) {
                    jQuery('.image-panel').remove();
                }
                imageInsideFloorPlan = false;
            }
        });
        /**** end ***/

        jQuery('iframe').contents().find('body').on('click', ".wysiwyg-macro[data-macro-name='floorplan'], .wysiwyg-macro[data-macro-name='flowdiagram']", function (e) {
            if (e.target.className == "" && e.target.nextSibling == null && e.currentTarget.className == "wysiwyg-macro") {
                if (jQuery('#insert-image-dialog').length <= 0) {
                    stopEvent(e);
                    jQuery("#rte-toolbar #rte-insert-image").click();
                }
            }

        });
        jQuery('iframe').contents().find('body').bind('DOMNodeInserted', function (e) {
            if ((jQuery.trim(e.target.className) == "wysiwyg-macro" || jQuery.trim(e.target.className) == "confluence-embedded-image") && jQuery(e.target).closest('.wysiwyg-macro[data-macro-name="floorplan"] ,.wysiwyg-macro[data-macro-name="flowdiagram"]').length > 0) { //If new image inserted & it is inside the floorplan macro
                imageInsideFloorPlan = true;
                var macroParameters = jQuery(e.target).attr('data-macro-parameters');
                if (macroParameters !== undefined && macroParameters.indexOf("macro-id") < 0) {
                    var d = new Date();
                    var uniqueCode = d.getTime();
                    macroParameters = macroParameters + '|macro-id=' + uniqueCode;
                    jQuery(e.target).attr('data-macro-parameters', macroParameters);
                }
            }

        });
        jQuery('iframe').contents().find("body").on("click", ".wysiwyg-macro[data-macro-name='floorplan'] img,.wysiwyg-macro[data-macro-name='flowdiagram'] img", function (e) {
            if (jQuery.trim(e.target.className) == "confluence-embedded-image" && jQuery(e.target).closest('.wysiwyg-macro[data-macro-name="floorplan"] ,.wysiwyg-macro[data-macro-name="flowdiagram"]').length > 0) { //If new image inserted & it is inside the floorplan macro
                imageInsideFloorPlan = true;
            }
        });
        
        //To disable click event on image inside floorplan macro.
        jQuery('iframe').contents().find("body").on("click", ".wysiwyg-macro[data-macro-name='floorplan'] img,.wysiwyg-macro[data-macro-name='flowdiagram'] img", function (e) {
            stopEvent(e)
        });

        //check for more than one florplan or flowdiagram and prompt error message.
        jQuery('iframe').contents().find('body').bind('DOMNodeInserted', function (event) {
            var $target = jQuery(event.target);
            var noOfFlowdiagramsFloorplanMacros = jQuery('iframe').contents().find('table[data-macro-name="flowdiagram"],table[data-macro-name="floorplan"]').length;
            
            if (noOfFlowdiagramsFloorplanMacros > 1 && ($target.attr("data-macro-name") == "floorplan" || $target.attr("data-macro-name") == "flowdiagram")) {
                jQuery('#moreThanOneMacroError').removeClass('hidden');               
                if (jQuery('#moreThanOneMacroError').length < 1) {
                    AJS.messages.error("body", {
                        id: "moreThanOneMacroError",
                        title: 'Error!',
                        body: '<p>Only one Floorplan or Flowdiagram macro is allowed per page.</p>',
                        closeable: true,
                        fadeout: true
                    });
                }
                $target.remove(); //remove the newly added macro if page already having one floorplan/flowdiagrom macro in it.
            } else {
                jQuery('#moreThanOneMacroError').addClass('hidden');
            }
        });


        //prompt error message if floorplan or flowdiagram macro was copied and pasted.
        //currently this code works  when the user tries to paste a macro
        //And also when user tries to view a page that has a macro copied and paste to it, an error will be prompted as well
        jQuery('#wysiwyg iframe').contents().bind("paste", function (e) {
            var items = (e.originalEvent).clipboardData.getData('text/html');
            var macroIdAvailable = items.match(/macro-id=[0-9]{13,}/g);
            var message = '<div id="moreThanOneMacroError" class="aui-message aui-message-error closeable"><p class="title"><strong>Error!</strong></p><p>Cannot copy floorplan or flowdiagram macro at this time.</p></div>';
            if ((items.indexOf('data-macro-name=\"floorplan\"') > 0 || items.indexOf('data-macro-name=\"flowdiagram\"') > 0) && macroIdAvailable.length > 0) {
                if (jQuery('#moreThanOneMacroError').length < 1) {
                    jQuery('#editor-messages').append(message);
                    AJS.messages.makeCloseable('#moreThanOneMacroError');
                }
            } else {
                jQuery('#moreThanOneMacroError').addClass('hidden');
            }
        });
}
function stopEvent(e) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
    return false;
}
/**
 *  Floorplan tagging types and their purpose
 *  
 *  -1. To define the size of the avatar image on the floorplan.
 *   0. User tagging.
 *   1. Department area tagging. 
 *   2. Resource area tagging. 
 */
var setUserPicTaggingSize = false; // This flag used for maintaining aspect ratio in jquery.imgareaselect-0.4.js while selecting area i.e a Square
var avatarSizeForFloorplan = 16;  // Default size of avatar 
var toggle = true;
var checksum;
var macroId;
var viewportwidth;
var notes = [];
var taggedListAfterViewSeat = [];
var seatOrDepartment = 0;
var pageId;
var isEditable;
var key = 0;
var userAllotedAreaId;
var zoomedInID;  // used when we need to zoom out and show that particular user again
var triggerByMouseScroll=false
var NoResultsLabel = "No Results"
var powerUser;
var zoomOut= false;
var clickedRoomDiv;
var allotedId = -1;
function openResourceDialog(urlValue) {
    window.open(urlValue, '_blank');
}
AJS.toInit(function() {
    jQuery("body").append('<div id="officeAdminAuiMessageContainer"></div>');
    //Load the I18n of the plugin.
    AJS.I18n.get("com.addteq.officeadmin");

     if(jQuery('#pancontainerid').length > 0){
        enableFloorplanOnPage();
        isPowerUser();
    }
    errorMessageForCopiedMacro();
});
function isPowerUser() {
    jQuery.ajax({
        url: AJS.contextPath() + "/rest/userprofile/poweruser/1.0/userProfilePowerGroupManager/inPowerGroup",
        type: "GET",
        dataType: "text",
        success: function (data) {
            powerUserCallback(data);
        }
    });
}
function powerUserCallback(data){
    powerUser=data;
}
function getQueryVariable() {
    if (window.location.hash.substr(1) == "") {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == "id") {
                return pair[1];
            }
        }
    } else {
        return window.location.hash.substr(1);
    }      
}
function enableFloorplanOnPage() {
    $ = jQuery;
    macro = jQuery('#pancontainerid').attr('macro');
    panContainer=jQuery('.pancontainer,#floorplanImage');    
    if(macro === 'floorplan')
        panContainer.imgAreaSelect({onSelectStart: showDefaultNote});
    else
        panContainer.imgAreaSelect({onSelectStart: showaddnote});
    panContainer.imgAreaSelect({onSelectChange: showaddnote});

    pageId = AJS.params.pageId;
    userAllotedAreaId = getQueryVariable() ;
    var taggedUserArray = [];
    jQuery(window).load(function() { 
        AJS.$('#listDiv').tooltip();
        jQuery(document).on('click','div .linkIcon',function(e){
            if(e.target.className !="editroom" && toggle==true){
                var urlValue = jQuery(this).closest('.room,.dept').attr('link-url').trim();
                if((urlValue.indexOf("http://") != 0 && urlValue.indexOf("https://")) != 0){
                    urlValue="http://"+urlValue;
                }
                if(urlValue !== "" && urlValue !== "http://")
                    window.open(urlValue, '_blank');
            }
        });
        jQuery(document).on('click','body',function(e){
            if(e.target.className != 'pancontainer' && e.target.id != 'floorpanImage' && jQuery(e.target).closest('.pancontainer,#floorplanImage,#noteform,.floorPlanSearch').length == 0 && setUserPicTaggingSize ==false){
                jQuery('#noteform').hide();
                panContainer.imgAreaSelect({hide: true});
            }
        });
      jQuery('#floorplanImage').each(function(){
            if (jQuery(this)[0].naturalWidth > viewportwidth ) {
            jQuery('.pancontainer').bind('mousemove', function (e) {
                var parentOffset = $(this).parent().offset();
                leftPos = (e.pageX - parentOffset.left);
                topPos = (e.pageY - parentOffset.top) - 40;
            });
            jQuery('.pancontainer').bind("mousewheel DOMMouseScroll", function (e) {
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();
                if (jQuery('#floorplanImage').is(':animated')) {
                    return false;
                }
                if (toggle == true) {
                    var delta = parseInt(e.originalEvent.wheelDelta || -e.originalEvent.detail);
                    triggerByMouseScroll = true;

                    if (delta < 0) {
                        jQuery(this).find('.magnifyZoomOut:visible').click();
                    } else {
                        jQuery(this).find('.magnifyZoomIn:visible').click();
                    }
                }
            });
            }
        });
        
        $ = jQuery;
        
        jQuery("#showAllandSearchDiv").on("keyup", "#s2id_userSearch input", function (e) {
            /*return if any search term is already selected*/
            var selectedEle = jQuery(this).closest("#s2id_userSearch").find(".select2-search-choice");
            if(selectedEle.length > 0){
                return;
            }
            
            var searchText = e.srcElement.value.toLowerCase();
            if (e.keyCode !== 13 && (e.keyCode < 37 || e.keyCode > 40)) {
                jQuery('.ripple').removeClass('ripple');
                /*If image is in zoom mode then zoom out*/
                if (zoomGlobal !== 1) {
                    zoomOut=true;
                    jQuery('#'+zoomedInID).hide();
                    ddimagepanner.zoomForSearch(jQuery, $imgGlobal, sGlobal, 0 + "px", 0 + "px", 0, 1000, "");
                }
            }
            
            jQuery('#'+zoomedInID).hide();
            jQuery(".note,.room,.dept").hide();  
            if(searchText == "") return;
            
            /*Show all possible matching users/areas with search term & hide rest all*/
            for (var i = 0; i < notes.length; i++) {
                var item = notes[i];
                if (item.type === 0 && ( (item.userTitle.toLowerCase()).indexOf(searchText.toLowerCase()) > -1 || (item.note.toLowerCase()).indexOf(searchText.toLowerCase()) > -1 ) ) {
                    jQuery("#note_" + item.created).show();
                } else if ((item.type === 1 || item.type === 2) && (item.note.toLowerCase()).indexOf(searchText.toLowerCase()) > -1) {
                    jQuery("#note_" + item.created).show();
                }
            }
        });
             
        checksum = jQuery('#floorPlanImageChecksum').val();
        macroId = jQuery('#macroId').val();
        viewportwidth = jQuery("#viewportwidth").val();
        isEditable = jQuery('#isEditAllowed').val();
        if (isEditable === "false") {
            jQuery('.togglePlugin').css({visibility: 'hidden'});
            jQuery('.magnifyZoomIn').addClass('topBorderRadius');
        }
        
        if(userAllotedAreaId !== undefined && userAllotedAreaId !== null && userAllotedAreaId !== "") {
            getAllAllottedArea(-1).done(function(response){   // -1 type is for the avatar size set for floorplan image.
                getAllAllottedArea(0).done(function(response){
                    profileClickMeLink();
                });
            });
            getListDataAfterViewSeatforTaggedList(2).done(function(response) { // these piped requests are only for the records to be populated in the tagged list.
                getListDataAfterViewSeatforTaggedList(1).done(function(response) {
                    getListDataAfterViewSeatforTaggedList(0).done(function(response) {
                    });
                });
            });
        } else {
            getAllAllottedArea(-1).done(function(response){
                getAllAllottedArea(2).done(function(response){    // -1 type is for the avatar size set for floorplan image.
                    getAllAllottedArea(1).done(function(response){
                        getAllAllottedArea(0).done(function(response){
                        });
                    });
                });
            });
        }
    
        jQuery('#cancelnote').click(function() {
            panContainer.imgAreaSelect({hide: true});
            clickedRoomDiv="";
            jQuery('#noteform').hide();
            if (jQuery('.pancontainer').attr('macro') != 'floorplan') {
                jQuery('.room,.dept').css({'border': '', 'background-color': ''});
                jQuery('.room,.dept').closest('.deptp').css({'background': ''});
                jQuery('.room,.dept').each(function () {
                    if (jQuery(this).children().first().css('display') == 'block') {
                        jQuery(this).children().first().css({'display': 'none'});
                    }
                });
            }
            jQuery('.ripple').removeClass('ripple');
        });
        
        jQuery(document).on('click', '#floorPlanListDialog #dialog-close-button', function(e) {
            e.preventDefault();
            AJS.dialog2("#floorPlanListDialog").hide();
            jQuery(document).find('body #floorPlanListDialog').remove();
        });

        jQuery(document).on('click', '#floorPlanListDialog .remove-list-item', function() {
            var id = jQuery(this).attr('removeId');
            var divId = jQuery(this).attr('id');
            removeSeat(id, divId);           
        });        
       
        jQuery(document).on('hover', '#floorplanImage', function () {
            jQuery('.dept,.room').find('.editroom, .linkIcon').on('mouseover', function () {
                jQuery(this).css('cursor', 'pointer');
            });
            jQuery('.room,.dept').hoverIntent({
                sensitivity: 1, // number = sensitivity threshold (must be 1 or higher)    
                interval: 10, // number = milliseconds for onMouseOver polling interval    
                timeout: 200, // number = milliseconds delay before onMouseOut    
                over: function () {
                    if (isEditable == 'true') {
                        var width = jQuery(this).css('width').replace('px', '');
                        var height = jQuery(this).css('height').replace('px', '');
                        var marginTop, marginLeft;
                        var editRoom = jQuery(this).find('.editroom');
                        if (!jQuery(editRoom).hasClass('black-editIcon') || !jQuery(editRoom).hasClass('white-editIcon')) {
                            if (parseInt(width) <= 30) {
                                marginTop = '-' + (parseInt(height) + ((parseInt(height) / 2) - 7)) + 'px';
                                if (width <= 21) {
                                    marginLeft = '-' + (parseInt(width) - 5) + 'px';
                                } else {
                                    marginLeft = '-' + (parseInt(width) - 10) + 'px';
                                }
                                if (jQuery(editRoom).hasClass('white-editIcon')) {
                                    jQuery(editRoom).removeClass('white-editIcon');
                                }

                                jQuery(editRoom).addClass('black-editIcon');
                            }
                            else {
                                // if show label is checked then allot area text is not blank
                                if (jQuery(this).text() !== "") { 
                                    marginTop = '-' + (parseInt(height) + ((parseInt(height) / 2) - 15)) + 'px';
                                } else {
                                    marginTop = '-' + ((parseInt(height) / 2) - 15) + 'px';
                                }
                                marginLeft = width - 17;
                                if (jQuery(editRoom).hasClass('black-editIcon')) {
                                    jQuery(editRoom).removeClass('black-editIcon');
                                }
                                jQuery(editRoom).addClass('white-editIcon');
                            }
                        }

                        jQuery(this).find(".editroom").css({'margin-top': marginTop, 'margin-left': marginLeft}).show();
                   }
                   if (jQuery('.pancontainer').attr('macro') != 'floorplan') {
                        var index = parseInt(jQuery(this).attr('alloted-id'));
                        var randomColor = randomColorCode(index);
                        jQuery(this).css({'border': '3px groove #' + randomColor[0], 'background-color': randomColor[1]});
                        jQuery(this).children().first().css({'display': 'block'});
                        jQuery(this).closest('.deptp').css({'background': "#" + randomColor[1], 'opacity': "0.95"});
                        jQuery(this).removeClass("hoverOut").toggleClass("hoverIn");
                    }
                },
                out: function () {
                    jQuery(this).find(".editroom").hide();
                    if (jQuery(this).attr('id') != clickedRoomDiv && jQuery('.pancontainer').attr('macro') != 'floorplan') {
                        jQuery(this).css({'border': '', 'background-color': ''});
                        jQuery(this).closest('.deptp').css({'background': ''});
                        jQuery(this).children().first().css({'display': 'none'});
                        jQuery(this).removeClass("hoverIn").toggleClass("hoverOut");
                    }                   
                }
            });
       });
       
        jQuery('div#floorPlanTaggedUserDiv').on('mouseover', '.taggedUserList', function() {
            jQuery('.notep').hide();
            jQuery('.note').hide();
            jQuery(this).children(".on-user-hover-show-remove").show();
            for (var i = 0; i < notes.length; i++) {
                if (notes[i]["created"] == jQuery(this).attr("id")) {
                    jQuery("#note_" + jQuery(this).attr("id")).show();
                    jQuery("#notep_" + jQuery(this).attr("id")).show();
                    break;
                }
            }
        });
        jQuery('div#floorPlanTaggedUserDiv').on('mouseout', '.taggedUserList', function() {
            jQuery('.notep').hide();
            jQuery('.note').show();
        });
        jQuery('div#pancontainerid').on('mousedown', '.editroom', function(e){
            var roompDiv = jQuery(this).parent();
            clickedRoomDiv = roompDiv.attr('id');
            var showLabel = roompDiv.attr("showLabel");
            if (showLabel === "true") {
                jQuery('#checkbox_showLabel').prop('checked', true);
            } else {
                jQuery('#checkbox_showLabel').prop('checked', false);
            }
            var area = {x1:roompDiv.css('left').replace("px",""),
                        y1:roompDiv.css('top').replace("px",""),
                        width:roompDiv.css('width').replace("px",""),
                        height:roompDiv.css('height').replace("px","") };
            showaddnote(jQuery('#floorplanImage'), area);
            jQuery('#checkbox_room').trigger('click');
            jQuery('#checkbox_room').trigger('click');
            if(roompDiv.attr('type') === '2')
                jQuery('#checkbox_room').prop('checked', true);
            var roomID = roompDiv.attr('id').replace("note_","");
            var text = jQuery('#notep_'+roomID).text();
            var url = jQuery('#note_'+roomID).attr('link-url');
            jQuery('#allotedAreaTextboxId,#allotedAreaTextboxHiddenId').val(text);
            jQuery('#resourceUrlForAllotArea').val(url);
            jQuery('#createdTime').val(roomID);
            jQuery(".avatarSizeSelect").css("display","none");
            jQuery(".ripple").removeClass("ripple");
            jQuery(this).closest(".room,.dept").addClass("ripple");
            return false;    //            e.stopPropagation();
        }); 
        
        // Rendered after clicked on profile view seat link
        //jQuery("#note_" + userAllotedAreaId).show();

        //changing the tag icon in floorplan and flowdiagram
        jQuery('.aui-button.togglePlugin.aui-button-primary').on("mouseup",function(){
          jQuery('.togglePlugin').addClass('bottomBorderRadius');
          changeTagMouseIcon();
        });
        jQuery('.pancontainer #floorplanImage').on('mouseenter',function(){
            if(!jQuery('.pancontainer #floorplanImage').hasClass('tagAimCursor')){
                if (parseInt(jQuery('.pancontainer #floorplanImage').css('width')) <= 1200 || parseInt(jQuery('.pancontainer #floorplanImage').css('height')) <= 675) {
                    jQuery('.pancontainer #floorplanImage').css({'cursor': 'default'});
                }
                else {
                    jQuery('.pancontainer #floorplanImage').css({'cursor': 'move'});
                }
            }
        });
    });    
    
    /*
     * Function to create a data in the auiSelect2 data format.
     */
    function formatUsersList() {
        var usersList = [], roomsList = [],resourcesList = [];
        for (var i = 0; i < notes.length; i++) {
            if(macro == "floorplan" && notes[i].type === 0) { //For Users
                usersList.push({
                    "id"    : notes[i].note,
                    "text"  : notes[i].userTitle,
                    "icon"  : notes[i].profilePicLink
                });
            }else if(notes[i].type === 1){ //For Areas
                roomsList.push({
                    "id"    : notes[i].note,
                    "text"  : notes[i].userTitle
                });
            }else if(notes[i].type === 2){ //For Resources
                resourcesList.push({
                    "id"    : notes[i].note,
                    "text"  : notes[i].userTitle
                });
            }
        }
        var newResp = [];
        if(usersList.length > 0){
            newResp.push({
                text    : "Users",
                children: usersList
            });
        }
        if(roomsList.length > 0){
            newResp.push({
                text    : "Rooms",
                children: roomsList
            });
        }
        if(resourcesList.length > 0){
            newResp.push({
                text    : "Resources",
                children: resourcesList
            });
        }
        return newResp;
    }
    /*
     * This function defines how the FloorPlan search dropdown will render.
     */
    function formatList(option) {
        if (!option.icon) {
            return $('<span>'+option.text+'</span>');
        }
        var $option = $('<span><img src="'+AJS.contextPath()+ option.icon.toLowerCase() + '"/> ' + option.text + ' ('+option.id+')</span>');
        return $option;
    }
    ;
    function renderSearchDropDown() {
        //Unbind the existing officeadmin(i.e. oa) events from AJS.$("userSearch") DOM element.
        AJS.$("#userSearch").off(".oa");
        
        AJS.$("#userSearch").auiSelect2({
            width: '100%',
            containerCssClass: "floorplan-search-container",
            dropdownCssClass: "floorplan-search-dropdown",
            tags: true,
            allowClear: true,
            multiple: true,
            maximumSelectionSize: 1,
            placeholder: "Click here and start typing to search.",
            data: formatUsersList(),
            formatResult: formatList
        }).on("change.oa", function(e) {
            var added = e.added;
            if(added ===  undefined) return;
            populateUser(added.text, added.value, added.id);
            searchingForUser();
        }).on('select2-removed.oa', function() { 
            clearSearch();
        }).on('select2-opening.oa', function() { 
            var searchTerms = jQuery("#s2id_userSearch").find(".select2-search-choice");
            //If any search term is already present.
            if(searchTerms.length > 0){
                return;
            }
            jQuery('.ripple').removeClass('ripple');
            //If Floorplan is in zoom mode then zoomout
            if (zoomGlobal !== 1) {
                zoomOut = true;
                jQuery('#' + zoomedInID).hide();
                ddimagepanner.zoomForSearch(jQuery, $imgGlobal, sGlobal, 0 + "px", 0 + "px", 0, 1000, "");
            }
        });
    }
    
    function randomColorCode(index) {
        index = index % 20;
        if(index == 0){
                index = 20;
        }
        var randomDark = ["FF1493", "DDA0DD", "9932CC", "6A5ACD", "0000FF", "00CED1", "32CD32", "556B2F", "BDB76B", "B8860B", "FF8C00", "F90606", "804000", "CCC000", "00CCCC", "FF9966", "8C66FF", "FF668C", "E60073", "6666FF"];
        var randomLight = ["rgba(255,105,180,0.3)", "rgba(238,130,238,0.3)", "rgba(186,85,211,0.3)", "rgba(123,104,238,0.3)", " rgba(65,105,225,0.3)", "rgba(64,224,208,0.3)", "rgba(144,238,144,0.3)", "rgba(107,142,35,0.3)", "rgba(240,230,140,0.3)", "rgba(218,165,32,0.3)", "rgba(255,165,0,0.3)", "rgba(249, 6, 6,0.3)", "rgba(128, 64, 0,0.3)", "rgba(204, 204, 0,0.3)", "rgba(0, 204, 204,0.3)", "rgba(255, 153, 102,0.3)", "rgba(140, 102, 255, 0.3)", "rgba(255, 102, 140,0.3)", "rgba(230, 0, 115, 0.3)", "rgba(102, 102, 255,0.3)"];
        var colors = [randomDark[index - 1], randomLight[index - 1]] ;
        return colors;
    }
    
    function removeSeat(key, divId) {
        var postData = {'id': key, 'checksum': checksum, 'pageId': pageId, 'macroId':macroId, 'macroName':macro};        
        var username = jQuery("#note_"+divId).attr('data-username');  
        var data = {'taggedId' : divId, 'confirm': "", 'note': username};
        var formURL = AJS.contextPath() + "/rest/floorplan/1.0/allotArea/removeArea";
        jQuery.ajax({
            url: formURL,
            type: "DELETE",
            data: JSON.stringify(postData),
            dataType: "json",
            contentType: 'application/json',
            success: function(responseData, textStatus, jqXHR)
            {
                AJS.dialog2("#floorPlanListDialog").hide();
                jQuery(document).find('body #floorPlanListDialog').remove();
                if (responseData.hasActionAlert === true) {
                    AJS.messages.error("#officeAdminAuiMessageContainer", {
                        id: "officeAdminAuiMessage",
                        title: 'Error:',
                        body: responseData.actionAlert,
                        fadeout: true
                    });
                    return false;
                }
                else {
                    notes = responseData;
                    jQuery('#floorplanImage').imgNotes(notes);
                    panContainer.imgAreaSelect({hide: true});
                    jQuery('#noteform').hide();
                    jQuery("#note_" + divId).remove();
                    jQuery("#notep_" + divId).remove();
                    loadLinkHover();
                }
                renderSearchDropDown();
              //  sendMailToUser(data, pageId)
            },
            error: function(jqXHR, textStatus, errorThrown)
            {
                alert("error: " + errorThrown);
            }
        });
    }

    function showAvatarSizeSelectionOnPageLoad() {
        jQuery('.togglePlugin').trigger('click');
        var area = {};
        var panHeight = panContainer.height() / 2 + "px";
        var panWidth = panContainer.width() / 2 + "px";
        area.width = 16, area.x1 = panContainer.width() / 2, area.y1 = panContainer.height() / 2;
        showDefaultSelectionofAvatarSize(panContainer, area);
        panContainer.append('<div id="tempAvatarSize" style="position: absolute; overflow: hidden; z-index: 0; border-style: solid; border-width: 1px; background-color: rgb(255, 255, 255); opacity: 0.2; width: 16px; height: 16px; left: ' + panWidth + '; top: ' + panHeight + ';" class="ripple avatarSizeSelect"></div><div id="tempAvatarSize1" style="position: absolute; overflow: hidden; z-index: 0; border-width: 1px; border-style: solid; border-color: rgb(0, 0, 0); width: 16px; height: 16px; left: ' + panWidth + '; top: ' + panHeight + ';" class="ripple avatarSizeSelect"></div><div id="tempAvatarSize2" style="position: absolute; overflow: hidden; z-index: 0; border-width: 1px; border-style: solid; border-color: rgb(255, 255, 255); width: 16px; height: 16px; left: ' + panWidth + '; top: ' + panHeight + ';" class="ripple avatarSizeSelect"></div>');
    }   

    function getAllAllottedArea(type) {
        var postData = {"checksum" : checksum, 
        				"macroId" : macroId, 
        				"pageId" : pageId, 
        				"type" : type, 
        				"created" : 0,
        				"showAllRecords" : jQuery("[name='showAllRecords']").val()};
        
        if(userAllotedAreaId !== undefined && userAllotedAreaId !== null && userAllotedAreaId !== "") {
            postData.created = userAllotedAreaId;
        }
      
        var formURL = AJS.contextPath() + "/rest/floorplan/1.0/allotArea/getAllAllottedArea";
        return jQuery.ajax({
            url: formURL,
            type: "GET",
            data: postData,
            dataType: "json",
            contentType: 'application/json'
        }).pipe(function(responseData){
            if (type === -1 && responseData.length !== 0) {
                avatarSizeForFloorplan = responseData[0].width;
                setUserPicTaggingSize = false;
            } else if(type === -1 && responseData.length === 0 && macro === 'floorplan') {
                setUserPicTaggingSize = true;
                showAvatarSizeSelectionOnPageLoad();
            }
            if(notes.length === 0 && type !== -1) {
               notes = responseData;
               renderSearchDropDown();
            } else if(type !== -1){
               notes = notes.concat(responseData);
               renderSearchDropDown();
            }
            jQuery('#floorplanImage').imgNotes(notes);
            loadLinkHover();
        });
    }
    
    function profileClickMeLink() {
                
                if(userAllotedAreaId !== undefined && userAllotedAreaId !== null && userAllotedAreaId !== "") {
                    var zoomRequired = 0, magnify = 1;
                    if($imgGlobal.context.naturalWidth > ($imgGlobal.width()*8)) {
                        zoomRequired = 4; magnify = 16;
                    } else if ($imgGlobal.context.naturalWidth > ($imgGlobal.width()*4)) {
                        zoomRequired = 3; magnify = 8;
                    } else if ($imgGlobal.context.naturalWidth > ($imgGlobal.width()*2)) {
                        zoomRequired = 2; magnify = 4;
                    } else if ($imgGlobal.context.naturalWidth > $imgGlobal.width()) {
                        zoomRequired = 1; magnify = 2;
                    }
                    var left = 0, top = 0;
                    if(((parseInt(jQuery('#note_'+userAllotedAreaId).css('left').replace("px","")) * magnify) + parseInt(($imgGlobal.width()/4) * magnify)) > ($imgGlobal.width() * magnify)) {
                        left = (($imgGlobal.width() * magnify) / 2);
                    } else if(((parseInt(jQuery('#note_'+userAllotedAreaId).css('left').replace("px","")) * magnify) - parseInt(($imgGlobal.width()/4) * magnify)) > 0 && ((parseInt(jQuery('#note_'+userAllotedAreaId).css('left').replace("px","")) * magnify) + parseInt(($imgGlobal.width()/4) * magnify)) < ($imgGlobal.width() * magnify)) {
                        left = ((parseInt(jQuery('#note_'+userAllotedAreaId).css('left').replace("px","")) * magnify));
                        left -= (($imgGlobal.width()/4) * magnify);
                    }

                    if(((parseInt(jQuery('#note_'+userAllotedAreaId).css('top').replace("px","")) * magnify) + parseInt(($imgGlobal.height()/4) * magnify)) > ($imgGlobal.height() * magnify)) {
                        top = (($imgGlobal.height() * magnify) / 2);
                    } else if(((parseInt(jQuery('#note_'+userAllotedAreaId).css('top').replace("px","")) * magnify) - parseInt(($imgGlobal.height()/4) * magnify)) > 0 && ((parseInt(jQuery('#note_'+userAllotedAreaId).css('top').replace("px","")) * magnify) + parseInt(($imgGlobal.height()/4) * magnify)) < ($imgGlobal.height() * magnify)) {
                        top = ((parseInt(jQuery('#note_'+userAllotedAreaId).css('top').replace("px","")) * magnify));
                        top -= (($imgGlobal.height()/4) * magnify);
                    }
                    

                    
                    if(zoomRequired !== 0 && magnify !== 1) {
                        var userName = jQuery("#note_" + userAllotedAreaId).attr('data-username');   
                        jQuery("#userSearch").val(userName).trigger("change");
                        jQuery(document).find('.closeIcon').show();
                        ddimagepanner.myProfileClickHereLink(jQuery, $imgGlobal, sGlobal, left + "px", top + "px", zoomRequired);        
                    } else {
                        jQuery("#note_" + userAllotedAreaId).show();
                    }
                    
                }    
    }
    
    jQuery.fn.serializeObject = function()
    {
        var o = {};
        var a = this.serializeArray();
        jQuery.each(a, function() {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                if(this.name=="note" || this.name=="seatNo"){
                   o[this.name]=scrapeHtmlTags(this.value);
                }else{
                   o[this.name] = this.value || ''; 
                }  
            }
        });
        return o;
    };

    function scrapeHtmlTags(fieldContent){
        var filteredContent1=fieldContent.replace(/(<[A-Za-z][A-Za-z0-9]*>)/g,""); //removing <b> like tags
        var filteredContent2=filteredContent1.replace(/(<\/[A-Za-z][A-Za-z0-9]*>)/g,""); //remoing </br> like tags
        var filteredContent3=filteredContent2.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g,""); //removing left over html tags with all types
        return filteredContent3;
    }

    function isUrl(s) {
//	var regexp = /(?:(?:http|https):\/\/)?([-a-zA-Z0-9.]{2,256}\.[a-z]{2,4})\b(?:\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi
        
        var regexp = /^((([hH][tT][tT][pP][sS]?|[fF][tT][pP])\:\/\/)?([\w\.\-]+(\:[\w\.\&%\$\-]+)*@)?((([^\s\(\)\<\>\\\"\.\[\]\,@;:]+)(\.[^\s\(\)\<\>\\\"\.\[\]\,@;:]+)*(\.[a-zA-Z]{2,4}))|((([01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}([01]?\d{1,2}|2[0-4]\d|25[0-5])))(\b\:(6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3}|0)\b)?((\/[^\/][\w\.\,\?\'\\\/\+&%\$#\=~_\-@]*)*[^\.\,\?\"\'\(\)\[\]!;<>{}\s\x7F-\xFF])?)$/
	if(!regexp.test(s)) {   /// this is for localhost url check which is used for demo purposes.
            var localhost = /(([hH][tT][tT][pP][sS]?|[fF][tT][pP])\:\/\/)(localhost)(:\d{2,4})?(\/)?/
            return localhost.test(s);
        } else
            return regexp.test(s);
    }
    jQuery("#allotAreaFormSubmitBtn").click(function () {
        var areaNameField = jQuery('#allotedAreaTextboxId:visible');
        if (areaNameField.length >0){
            if (areaNameField.val().trim() == "") {
                alert("Name can not be blank.");
                return;
            }
            jQuery('#allotedAreaTextboxHiddenId').val(areaNameField.val().trim());
            var valueShowLabel = jQuery('#checkbox_showLabel').prop("checked");
            jQuery('#checkboxShowLabelHiddenId').val(valueShowLabel);
        }
        saveNote();
        clickedRoomDiv="";
        jQuery('.room,.dept').each(function () {
            if (jQuery(this).children().first().css('display') == 'block') {
                jQuery(this).children().first().css({'display': 'none'});
            }
        });
    });
    
    jQuery(".avatarSpinner" ).bind('change mousewheel wheel',function() {
        avatarSizeSelectionChanged();
    });

    function avatarSizeSelectionChanged(){
        var selectedSize=jQuery('#selectedDefaultSize').val();
        if(selectedSize > 100){
            selectedSize=100;
            jQuery('#selectedDefaultSize').val(selectedSize);
            alert("Maximum Avatar size can be 100px * 100px.");
        }else if(selectedSize < 1){
            selectedSize=1;
            jQuery('#selectedDefaultSize').val(selectedSize);
            alert("Minimum Avatar size can be 1px * 1px.");
        }
        jQuery('#allotedAreaWidth').val(selectedSize);
        jQuery('#allotedAreaHeight').val(selectedSize);
        var oldTop= parseInt(jQuery('#noteform').css('top'))-parseInt(jQuery('.avatarSizeSelect.ripple').height());
        var newTop=oldTop+parseInt(selectedSize);
        jQuery('.avatarSizeSelect.ripple').css({'width':selectedSize+'px','height':selectedSize+'px'});      
        jQuery('#noteform').css({'top':newTop+'px'});
    }
    jQuery("#noThanksBtn").click(function() {
        jQuery('#allotedAreaHeight').val(16);
        jQuery('#allotedAreaWidth').val(16);
        saveNote();
    });
    
    function removeTypeElementsFromNotes(type) {
        if (type !== undefined && notes.length !== 0) {
            for (var i = 0; i < notes.length; i++) {
                if (notes[i].type === type) {
                    notes.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    function saveNote() {
        jQuery('#allotedAreaTextboxHiddenId').val(jQuery('#allotedAreaTextboxHiddenId').val().replace(/(\r\n|\n\r|\r|\n)/g, " "));
        // is not empty or whitespace
        var url = jQuery("#resourceUrlForAllotArea").val();
        if (jQuery.trim(url)) {
            // is not valid url
            if (!isUrl(url)) {
                jQuery('#resourceUrlForAllotArea').val("");
                alert("Invalid url, please provide valid url.\nEx. http://www.website.com");
            }
            if(jQuery('#checkbox_room').is(':checked')) {
                jQuery('#allotedAreaType').val(2);
            }
        }
        var userId;
        var data = jQuery("#allotAreaForm").serializeObject();
        var pageId = data.pageId;
        if(data.type == 0){
             userId = data.userId;
         }
        else{
            userId=""; 
        }
        var postData = JSON.stringify(jQuery("#allotAreaForm").serializeObject());   
        var formURL = AJS.contextPath() + "/rest/floorplan/1.0/allotArea/allotAreaForUser";
        jQuery('#allotAreaFormSubmitBtn').disable();
        jQuery.ajax({
            url: formURL,
            type: "POST",
            data: postData,
            dataType: "json",
            contentType: 'application/json',
            success: function(data, textStatus, jqXHR)
            {
                notes = data;
                renderSearchDropDown();
                if(notes.length === 1 && macro === 'floorplan') {  // This check is present so that the floorplan reloads after setting of the avatar size and the tagging plugin is re-initialized.
                    location.reload();
                }
                removeTypeElementsFromNotes(-1);
                if(data.hasActionAlert === true) {
                    
                    //If Unauthorized user is trying to set the default avatar size.
                    if (data.type == "-1" && jQuery("#officeAdminAuiMessage").length == 0) {
                        AJS.messages.error("#officeAdminAuiMessageContainer",{
                            id: "officeAdminAuiMessage",
                            title: 'Error:',
                            body: AJS.I18n.getText("officeadmin.unauthorized.error")
                        });
                        jQuery("#noteform").find(".submit :input").attr("disabled", true);
                        return false;
                    }
                    
                    // If loggedInUser is not authorized
                    if(data.actionAlert === AJS.I18n.getText("com.addteq.confluence.plugin.floorplan.permission.denied") && jQuery("#officeAdminAuiMessage").length === 0){
                        AJS.messages.error("#officeAdminAuiMessageContainer",{
                            id: "officeAdminAuiMessage",
                            title: 'Error:',
                            body: AJS.I18n.getText("com.addteq.confluence.plugin.floorplan.permission.denied"),
                            fadeout : true
                        });
                        panContainer.imgAreaSelect({hide: true});
                        jQuery('#noteform').hide();
                        jQuery("#noteform").find(".submit :input").removeAttr("disabled");
                        return false;
                    }
                    //user already tagged
                    var primaryOrNotPrimary = confirm(data.actionAlert);
                    if(primaryOrNotPrimary === true) {
                        jQuery("#notePrimaryLocation").val("primary");
                    }
                    else {
                        jQuery("#notePrimaryLocation").val("notPrimary");
                    }
                    var postData = JSON.stringify(jQuery("#allotAreaForm").serializeObject());
                    var formURL = AJS.contextPath() + "/rest/floorplan/1.0/allotArea/allotAreaForUser";
                    jQuery.ajax({
                        url: formURL,
                        type: "POST",
                        data: postData,
                        dataType: "json",
                        contentType: 'application/json',
                        success: function(successdata, textStatus, jqXHR)
                        {
                            notes = successdata;
                            removeTypeElementsFromNotes(-1);                            
                            jQuery('#floorplanImage').imgNotes(successdata);
                            if(data.type == 0){
                                sendMailToUser(data, pageId); // Send Mail Whose Seat has been changed on Floorplan
                            }
                            renderSearchDropDown();
                            jQuery("body").trigger("newAvatarSizeSet");
                        },
                        error: function(jqXHR, textStatus, errorThrown)
                        {
                            alert("error: " + jqXHR.responseText);
                            jQuery('#allotAreaFormSubmitBtn').enable();
                        }
                    });
                    
                }               
                jQuery("#userSearch").val("");
                jQuery('#allotAreaFormSubmitBtn').enable();
                panContainer.imgAreaSelect({hide: true});
                jQuery('#noteform').hide();
                loadLinkHover();
                jQuery('#floorplanImage').imgNotes(data);
                 if(!data.hasActionAlert) {//Send mail to newly tagged user on Floorplan 
                    var modifyData = jQuery("#allotAreaForm").serializeObject();
                    modifyData["confirm"] = false;
                    sendMailToUser(modifyData, pageId);
                    Confluence.Binder.userHover();
                 }
                jQuery("body").trigger("newAvatarSizeSet");
            },
            error: function(jqXHR, textStatus, errorThrown)
            {
                alert("error: " + jqXHR.responseText);
                jQuery('#allotAreaFormSubmitBtn').enable();
            }
        });
    };
    
    
    jQuery('#listDiv').click(function () {
        if(userAllotedAreaId !== undefined && userAllotedAreaId !== null && userAllotedAreaId !== "") {
            showTaggedList(taggedListAfterViewSeat);
        } else {
            showTaggedList(notes);
        }
    });
    
    function showTaggedList(listItems) {
        var floorPlanListDialog = "<section role='dialog' id='floorPlanListDialog' class='aui-layer aui-dialog2 ' style= 'top:30%; width:400px; height: 400px;' aria-hidden='true'>";
        if (macro === 'floorplan') {
            floorPlanListDialog += "<header class='aui-dialog2-header'><h2 class='aui-dialog2-header-main'>Tagged Users and Areas</h2></header>";
        } else {
            floorPlanListDialog += "<header class='aui-dialog2-header'><h2 class='aui-dialog2-header-main'>Tagged Areas</h2></header>";
        }
        
        var htmlList = "", htmlList1 = "";
        for (var i = 0; i < listItems.length; i++) {
            if (listItems[i]["type"] === 0) {
                var text = (listItems[i]["note"] + " (" + listItems[i]["userTitle"] + ")").substr(0, 40);
                htmlList = htmlList + "<div style=\"height:30px\"> <img style=\"float:left; width:30px; height:30px;\" src=" + AJS.General.getBaseUrl() + listItems[i]["profilePicLink"] + "> <div class=\"tooltipAui\" style=\"float:left; position:relative; padding-left: 10px; text-overflow: ellipsis; overflow: hidden; width: 230px; \" title=\" "+ listItems[i]["note"] + " (" + listItems[i]["userTitle"] +"\">" + text + " </div>";                
                if(isEditable === 'true') {
                    htmlList += '<button class="aui-button remove-list-item" style="float:right;" removeId="' + listItems[i]["id"] + '" id="' + listItems[i]["created"] +'"> Delete</button></div><br>';
                } else {
                    htmlList += '</div><br>';
                }
            } else if(listItems[i]["type"] === 1 || listItems[i]["type"] === 2) {
                var text = (listItems[i]["note"]).substr(0, 48);
                if(listItems[i]["type"] === 1 ) {
                    htmlList1 = htmlList1 + "<div style=\"height:30px;\"> <div class=\"deptIcon\" style=\"float:left; width:30px; height:30px;\" title=\"Tagged Area - (" + listItems[i]["note"] + ")\" /> <div class=\"tooltipAui\" style=\"float:left; position:relative; padding-left: 10px; text-overflow: ellipsis; overflow: hidden; width: 230px; \" title=\"Tagged Area - (" + listItems[i]["note"] + ")\" >" + text + " </div>";
                } else {
                    htmlList1 = htmlList1 + "<div style=\"height:30px;\"> <div class=\"roomIcon\" style=\"float:left; width:30px; height:30px;\" title=\"Tagged Area - (" + listItems[i]["note"] + ")\" /> <div class=\"tooltipAui\" style=\"float:left; position:relative; padding-left: 10px; text-overflow: ellipsis; overflow: hidden; width: 230px; \" title=\"Tagged Area - (" + listItems[i]["note"] + ")\" >" + text + " </div>";
                }
                if(isEditable === 'true') {
                    htmlList1 += '<button class="aui-button remove-list-item" style="float:right;" removeId="' + listItems[i]["id"] + '" id="' + listItems[i]["created"] + '" > Delete</button></div><br>';
                } else {
                    htmlList1 += '</div><br>';
                }
            }
        }
       
        htmlList += htmlList1;
        floorPlanListDialog +="<div class='aui-dialog2-content'>" + htmlList +"</div>";
        floorPlanListDialog +="<footer class='aui-dialog2-footer'><div class='aui-dialog2-footer-actions'><button id='dialog-close-button' class='aui-button aui-button-link'>Close</button></div></footer>";                
        
        jQuery('body').append(floorPlanListDialog);
        AJS.dialog2("#floorPlanListDialog").show();
        
        jQuery('.tooltipAui').tooltip();
        jQuery('.selectArea').tooltip();
    }
    
    function getListDataAfterViewSeatforTaggedList(type) {
        var postData = {"checksum": checksum, "type": type, 'macroId':macroId, 'pageId':pageId};
        var formURL = AJS.contextPath() + "/rest/floorplan/1.0/allotArea/getAllAllottedArea";
        return jQuery.ajax({
            url: formURL,
            type: "GET",
            data: postData,
            dataType: "json",
            contentType: 'application/json'
        }).pipe(function(responseData){
            if(taggedListAfterViewSeat.length === 0) {
               taggedListAfterViewSeat = responseData;
            } else {
               taggedListAfterViewSeat = taggedListAfterViewSeat.concat(responseData);
            }
        });
    }
    
    

  //click import button
  $("#floor-plan-import").click(function(){ 
  	AJS.dialog2("#import-floorplan-dialog").show();	
  });

  // submit import floorplan dialog
  $("#import-submit-button").click(function(){ 

  	var formURL = AJS.contextPath() + "/rest/floorplan/1.0/allotArea/import?pageId=" + Confluence.getContentId() + "&macroName=" + $("#allotAreaForm [name='macroName']").val() + "&checksum=" + checksum;

          var form = $("#import-floorplan-form")[0];
          var data = new FormData(form);

          $.ajax({
              type: "POST",
              enctype: 'multipart/form-data',
              url: formURL,
              data: data,
              processData: false,
              contentType: false,
              cache: false,
              beforeSend: function(request) {
  	     request.setRequestHeader("X-Atlassian-Token", "no-check");
  	   },
              success: function (data) {
            	  document.location.reload()
              },
              error: function (e) {
            	  alert("Something went wrong during import.")
              }
          });

  });

  // cancel import floorplan dialog
  $("#import-cancel-button").click(function(){ 
   AJS.dialog2("#import-floorplan-dialog").hide();
  });
    
    //Export
    $("#floor-plan-export").click(function(){ 

		var postData = {"checksum" : checksum, 
		"macroId" : macroId, 
		"pageId" : pageId, 
		"created" : 0,
		"showAllRecords" : jQuery("[name='showAllRecords']").val(),
		"changeInRecords" : true};
		  
		var formURL = AJS.contextPath() + "/rest/floorplan/1.0/allotArea/getAllAllottedArea";
		
		return jQuery.ajax({
		    url: formURL,
		    type: "GET",
		    data: postData,
		    dataType: "json",
		    contentType: 'application/json'
		}).done(function(data){
		
			var uri = 'data:text/json;charset=utf8,' + encodeURIComponent(JSON.stringify(data));
			var link = document.createElement("a");
			
			link.download = "floorPlan.json";
			link.href = uri;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			delete link;
		});

    });

}

function loadLinkHover() {
    Confluence.Binder.userHover(); // This JS function must be called in order to bind users mini profile.
}

function showDefaultNote(img, area) {
    seatOrDepartment = 0;
    imgLeft = parseInt(jQuery('#floorplanImage')[0].style.left, 10);
    imgTop = parseInt(jQuery('#floorplanImage')[0].style.top, 10);
    
    if(jQuery(img).attr('id') == 'floorplanImage'){
        jQuery('.pancontainer').imgAreaSelect({hide: true});
    }else if(jQuery(img).attr('class') == 'pancontainer'){
        jQuery('#floorplanImage').imgAreaSelect({hide: true});
    }
    form_left =  parseInt(area.x1);
    form_top = parseInt(area.y1);

    var positionTop = panContainer.position().top + 20;
    var positionLeft = panContainer.position().left;
    var cordX = parseInt((-(imgLeft) + form_left) / zoomGlobal); //x co-ord where clicked.
    var cordY = parseInt((-(imgTop) + form_top) / zoomGlobal); //Y co-ord where clicked.
    
    jQuery('#checkbox_room').prop('checked', false);
    jQuery('#roomspan').css({display: 'none'});
    jQuery('#noteform').css({left: form_left + positionLeft + 'px', top: form_top + positionTop + (zoomGlobal * avatarSizeForFloorplan) + 'px'});
    
    //check if another user is already tagged at same location.
    var check  = checkAnotherUserIsTaggedAtSameLocation(cordX+"px",cordY+"px");
    
    //If user tries to tag another user at the same location where another user is already tagged.
    if(check == true && seatOrDepartment == 0){
        jQuery('#noteform,#outLeft,#outRight,#outTop,#outBottom,.ripple').hide();
    }else{
        jQuery('#noteform,#outLeft,#outRight,#outTop,#outBottom,.ripple').show();
    }
    
    jQuery('#noteform').css("z-index", 10000);
    jQuery('#allotedAreaType').val(seatOrDepartment);
    jQuery('#allotedAreaCordX').val(cordX);
    jQuery('#allotedAreaCordY').val(cordY);
    jQuery('#allotedAreaHeight').val(avatarSizeForFloorplan);
    jQuery('#allotedAreaWidth').val(avatarSizeForFloorplan);
    jQuery('#seatNoForAllotArea').focus().val("");
    jQuery('#allotedAreaTextboxId').focus().val("");
    jQuery('#seatNoLabel').css({display: 'block'});
    jQuery('#seatNoForAllotArea').css({display: 'block'});
    jQuery('#resourceUrlForAllotArea').css({display: 'none'});
    jQuery('#resourceUrlForAllotAreaLabel').css({display: 'none'});
    jQuery('#resourceUrlForAllotArea').val("");
    jQuery('#notePrimaryLocation').val('primaryOrNotPrimary');
    jQuery('#createdTime').val("");
    jQuery('#showLabel').css({display: 'none'});
}
function showaddnote(img, area) {
    seatOrDepartment = 1;
    
    imgLeft = parseInt(jQuery('#floorplanImage')[0].style.left, 10);
    imgTop = parseInt(jQuery('#floorplanImage')[0].style.top, 10);
    
    form_left = parseInt(area.x1);
    form_top = parseInt(area.y1);

    var positionTop = panContainer.position().top + parseInt(area.height) + 20;
    var positionLeft = panContainer.position().left;
    
    if (macro !== 'floorplan') {
        jQuery('#roomspan').css({display: 'none'});
    } else {
        jQuery('#roomspan').css({display: 'inline'});
        jQuery('#showLabel').css({display: 'none'});
    }
        jQuery('#checkbox_room').prop('checked', false);
        jQuery('#seatNoForAllotArea').focus().val("");
        jQuery('#seatNoLabel').css({display: 'none'});
        jQuery('#seatNoForAllotArea').css({display: 'none'});
        jQuery('#resourceUrlForAllotArea').css({display: 'block'});
        jQuery('#resourceUrlForAllotAreaLabel').css({display: 'block'});
        jQuery('#resourceUrlForAllotArea').val("");
        jQuery('#noteform').css({left: (form_left + positionLeft) + 'px', top: (form_top + positionTop) + 'px'});
        jQuery('#noteform,#outLeft,#outRight,#outTop,#outBottom,.ripple').show();
        jQuery('#noteform').css("z-index", 10000);
        jQuery('#allotedAreaType').val(seatOrDepartment);
        jQuery('#allotedAreaCordX').val(parseInt((-(imgLeft) + form_left) / zoomGlobal));
        jQuery('#allotedAreaCordY').val(parseInt((-(imgTop) + form_top) / zoomGlobal));
        jQuery('#allotedAreaHeight').val(parseInt(area.height / zoomGlobal));
        jQuery('#allotedAreaWidth').val(parseInt(area.width / zoomGlobal));
        jQuery('#allotedAreaTextboxId').focus().val("");
        jQuery('#createdTime').val("");
}

function disableNote(img, area) {
    panContainer.imgAreaSelect({hide: true});
    jQuery('#noteform').hide();
}

function populateUser(title, username, userId) {
    jQuery('#allotedAreaTextboxId').val(title + ' (' + username + ')');
    jQuery('#allotedAreaTextboxHiddenId').val(username);
    jQuery('#allotedAreaUserId').val(userId);
    jQuery('#floorplanUserFill').css("display", "none");

}

function cancelSubmit() {
    return false;
}

function zoomSearchFieldNameSelection(idForZooming) {
                
                if(idForZooming !== undefined && idForZooming !== null && idForZooming !== "") {
                    jQuery('.note').hide();
                    var zoomRequired = 0;
                    var naturalwidth = $imgGlobal.context.naturalWidth;
                    var lessWidth =0, lessHeight =0;
                    var width = $imgGlobal.width();
                    var height = $imgGlobal.height();
                    var left = 0, top = 0;
                    var zoom;
                    //Get height of the viewport Image.
                    var getNormalHeight = parseInt(jQuery('#note_'+idForZooming).css('height').replace("px",""));
                    //Get width of the viewport Image.
                    var getNormalWidth = parseInt(jQuery('#note_'+idForZooming).css('width').replace("px",""));
                    //Get left of the viewport Image.
                    var getNormalLeft = parseInt(jQuery('#note_'+idForZooming).css('left').replace("px",""));
                    //Get top of the viewport Image.
                    var getNormalTop = parseInt(jQuery('#note_'+idForZooming).css('top').replace("px",""));

                    //Assign ZoomRequired, according to the width of the natural Image and viewport Image.
                    if(naturalwidth > (width*8)) {
                        zoomRequired = 4;
                    } else if (naturalwidth > (width*4)) {
                        zoomRequired = 3;
                    } else if (naturalwidth > (width*2)) {
                        zoomRequired = 2;
                    } else if (naturalwidth > width) {
                        zoomRequired = 1;
                    }
                    zoom = zoomRequired+1;
                    //Calculate appropriate zoomRquired on width,  if (width of the tagged area) * zoomRequired exceeds the limit of the viewport thus reduce zoomrequireed to decimal Points.
                    if((getNormalWidth * (zoomRequired+1)) > (width - 50)){
                        var copyMagnifyForLeft = (zoomRequired+1);
                        while((copyMagnifyForLeft * getNormalWidth) >=  (width - 20)){
                            if((copyMagnifyForLeft * getNormalWidth) >= (width - 20)){
                                copyMagnifyForLeft-=0.1;
                            }
                        }
                    }
                    else{
                        copyMagnifyForLeft = (zoomRequired+1);
                    }
                     //Calculate appropriate zoomRequired on height,  if (height of the tagged area) * zoomRequired exceeds the limit of the viewport thus reduce zoomrequireed to decimal Points.
                    if((getNormalHeight * (zoomRequired+1)) > (height - 30)){
                        var copyMagnifyForTop = (zoomRequired+1);
                        while((copyMagnifyForTop * getNormalHeight) >=  (height - 10)){
                            if((copyMagnifyForTop * getNormalHeight) >= (height - 10)){
                                copyMagnifyForTop-=0.1;
                            }
                        }
                    }else{
                        copyMagnifyForTop = (zoomRequired+1)
                    }
                    //Get minimal zoom.
                    if(copyMagnifyForLeft >= copyMagnifyForTop){
                        zoomRequired = copyMagnifyForTop - 1;
                        zoom = zoomRequired +1;
                    }
                    else if (copyMagnifyForLeft < copyMagnifyForTop){
                        zoomRequired = copyMagnifyForLeft -1;
                        zoom = zoomRequired +1;
                    }
                    //Reduce left css of the tagged area.
                    if( (getNormalLeft +getNormalWidth) < (width - 10) ){
                        lessWidth = ((parseInt(zoom) + 1) *10) - 20;
                    }
                    //Reduce top css of the tagged area.
                    if( (getNormalTop + getNormalHeight) < (height - 10) ){
                        lessHeight = ((parseInt(zoom) + 1) *10) - 20;
                    }
                    //Calculate Left and Top css of the tagged area on zoom.
                    if((getNormalWidth +getNormalLeft) * (zoom) > width){
                        left = (((getNormalWidth +getNormalLeft)) * zoom) - (width - lessWidth);
                    }
                    if((getNormalHeight +getNormalTop) * (zoom) > height){
                        top = (((getNormalHeight +getNormalTop)) * zoom) - (height - lessHeight);
                    }
                    jQuery(".note").hide();
                    jQuery(".dept").hide();
                    jQuery(".room").hide();
                    if(zoomRequired !== 0) {
                        ddimagepanner.zoomForSearch(jQuery, $imgGlobal, sGlobal, left + "px", top + "px", zoomRequired, 2000, idForZooming);
                    } else {
                        jQuery("#note_" + idForZooming).show();
                        jQuery("#note_" + idForZooming).addClass('ripple');
                    }
                    
                }    
    }

function searchingForUser() {
      jQuery('.note').hide();
      var foundUser=false;
    for (var i = 0; i < notes.length; i++) {
        if (notes[i]["note"] === jQuery('#userSearch').val()) {
            jQuery("#note_" + notes[i]["created"]).show();
            zoomSearchFieldNameSelection(notes[i]["created"]);
            jQuery(document).find('.closeIcon').show();
            zoomedInID = notes[i]["created"];
            foundUser=true;
            break;
        }
    }
    if(jQuery('.note:visible').length==0 && foundUser==false){
        alert("\""+jQuery('#userSearch').val()+"\" is not tagged anywhere on floorplan.");
    }
    }

function showSelectAvatarSize() {  // called only first time to modify the params of the tagging plugin to define area size for avatar
    
    setUserPicTaggingSize = true;

    panContainer.imgAreaSelect({maxWidth: 100});
    panContainer.imgAreaSelect({maxHeight: 100});
    panContainer.imgAreaSelect({minWidth: 10});
    panContainer.imgAreaSelect({minHeight: 10});
    
    panContainer.imgAreaSelect({onSelectStart: showDefaultSelectionofAvatarSize});
    panContainer.imgAreaSelect({onSelectChange: showDefaultSelectionofAvatarSize});
    
    if(jQuery.browser.chrome == false || jQuery.browser.chrome == undefined ){ //Support mouse wheel on select avatar size text box
        bindMouseWheelForInputText();
    }
}


function showDefaultSelectionofAvatarSize(img, area) {   // Note for selection of avatar size
    if(area.width !== 16 && area.width !== 0)
        avatarSizeForFloorplan = area.width;
    seatOrDepartment = -1;
    form_left =  parseInt(area.x1);
    form_top = parseInt(area.y1);

    var positionTop = panContainer.position().top + 20;
    var positionLeft = panContainer.position().left;
    var size=area.width;
    jQuery('#selectedDefaultSize').val(size);
    jQuery('#allotedAreaWidth').val(size);
    jQuery('#allotedAreaHeight').val(size);
    jQuery('.togglePlugin').css({'visibility':'hidden'});
    jQuery('#roomspan').css({display: 'none'});
    jQuery('#defaultAvatarSize').css({display: 'block'});
    jQuery('#allotAreaForm h2').text('Default Avatar Size');
    jQuery('#seatNoLabel').css({display: 'none'});
    jQuery('#seatNoForAllotArea').css({display: 'none'});
    jQuery('#resourceUrlForAllotArea').css({display: 'none'});
    jQuery('#resourceUrlForAllotAreaLabel').css({display: 'none'});
    jQuery('#allotedAreaTextboxIdLabel').hide();
    jQuery('#noteform').css({left: form_left + positionLeft + 'px', top: form_top + positionTop + parseInt(avatarSizeForFloorplan) + 'px'});
    jQuery('#noteform').show();
    jQuery('#noteform').css("z-index", 10000);
    jQuery('#allotedAreaType').val(seatOrDepartment);
    jQuery('#allotedAreaCordX').val(parseInt(form_left / zoomGlobal));
    jQuery('#allotedAreaCordY').val(parseInt(form_top / zoomGlobal));
    jQuery('#allotedAreaHeight').val(parseInt(avatarSizeForFloorplan));
    jQuery('#allotedAreaWidth').val(parseInt(avatarSizeForFloorplan));
    jQuery('#noThanksBtn').show();
    jQuery('#cancelnote').hide();
    jQuery('#allotedAreaTextboxId').css({display: 'none'});
    jQuery('#createdTime').val("");
    jQuery('#showLabel').css({display: 'none'});
}

function changeTagMouseIcon(){
    var opacity=jQuery('.aui-button.togglePlugin.aui-button-primary').css('opacity');
    if(opacity!="1"){
        jQuery('#floorplanImage').css({'cursor':''});
        jQuery('#floorplanImage').addClass('tagAimCursor');
    }else{
        jQuery('#floorplanImage').removeClass('tagAimCursor');
    }
}  

function errorMessageForCopiedMacro(){
    var macroCopied=jQuery('.wiki-content p:first input#macroId[type=hidden]');
    if(macroCopied.length>0){
        var message= '<div id="macroCopiedError" class="aui-message aui-message-error closeable"><p class="title"><strong>Error!</strong></p><p>Cannot copy and paste floorplan or flowdiagram macro at this time.</p></div>';
        jQuery('#editor-messages').append(message);
        AJS.messages.makeCloseable('#macroCopiedError');
    }else{
        jQuery('#macroCopiedError').addClass('hidden');
    }
} 

//This function is to support mousewheel event on default avatar size textbox (i.e <input type=number>) which by deafult does not work on browsers other than chrome.
function bindMouseWheelForInputText(){ 
    jQuery('#selectedDefaultSize').on("wheel", function(event) {
        event.preventDefault();
        $this = jQuery(this);
        $inc = parseFloat($this.attr('step'));
        $max = parseFloat($this.attr('max'));
        $min = parseFloat($this.attr('min'));
        $currVal = parseFloat($this.val());

        // If blank, assume value of 0
        if (isNaN($currVal)) {
            $currVal = 0;
        }

        // Increment or decrement numeric based on scroll distance
        if (event.originalEvent.deltaY < 0) {
            if ($currVal + $inc <= $max) {
                $this.val($currVal + $inc);
            }
        } else {
            if ($currVal - $inc >= $min) {
                $this.val($currVal - $inc);
            }
        }
    });
}

function sendMailToUser(Obj, pageId){ 
        var taggedId, postData, seatNo;
        var formURL = AJS.contextPath() + "/rest/floorplan/1.0/allotArea/sendMailToUser";
        
       //Get TaggedId from Link of the User
        if (Obj.confirm.toString() != "") {
            jQuery('.confluence-userlink.note').each(function () {
                if (jQuery(this).attr('data-username') == Obj.note) {
                    var id = jQuery(this).attr('id');
                    taggedId = id.replace(/^\D+/g, '');
                }
            });
            seatNo = "AllocatedOrUpdated"
        }else{
            taggedId = Obj.taggedId;
            seatNo = "Deleted"
        }
        
        //When User is tagged
        if(taggedId != undefined){
            //Make Rest Call to Send Mail
            postData= JSON.stringify({"userId": taggedId, "note" : Obj.note, "confirm": Obj.confirm, "pageId": pageId, "seatNo": seatNo});        
            jQuery.ajax({
                url: formURL,
                type: "POST",
                data: postData,
                dataType: "json",
                contentType: 'application/json'
            });
        }
}

function checkAnotherUserIsTaggedAtSameLocation(xcord, ycord) {
    var alreadyTagged = jQuery(".confluence-userlink.note").filter(function () {
        return (this.style.left == xcord && this.style.top == ycord);
    });
    if (alreadyTagged.length > 0) {
        return true;
    } else {
        return false;
    }
}

/*
 * Function to clear out FloorPlan/FlowDiagram search.
 */
function clearSearch() {
    /*If search comes from ProfilePage "ViewSeat Link"*/
    if (window.location.hash) {
        window.location = location.href.split('#')[0];
    } else {
        jQuery('#userSearch').val('');
        ddimagepanner.zoomForSearch(jQuery, $imgGlobal, sGlobal, 0 + "px", 0 + "px", 0, 1000, "");
        jQuery('.ripple').removeClass('ripple');
        jQuery('.room,.dept,.note').hide();
    }
}

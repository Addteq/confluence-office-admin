/**
 * imgnotes jQuery plugin
 * version 0.1
 *
 * Copyright (c) 2008 Dr. Tarique Sani <tarique@sanisoft.com>
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt) 
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * @URL      http://www.sanisoft.com/blog/2008/05/26/img-notes-jquery-plugin/
 * @Example  example.html
 *
 **/

//Wrap in a closure
(function($) {

	$.fn.imgNotes = function(n) {	
		if(undefined != n){
			notes = n;
		} 

		image = this;

		imgOffset = $(image).offset();
                $('.note').remove();
                $('.notep').remove();
                $('.room').remove();
                $('.roomp').remove();
		$(notes).each(function(){
			appendnote(this);
		});	
	
//		addnoteevents();
		
		$(window).resize(function () {
			$('.note').remove();
                        $('.notep').remove();
                        $('.room').remove();
                        $('.roomp').remove();
                        
			imgOffset = $(image).offset();

			$(notes).each(function(){
				appendnote(this);				
			});

			//addnoteevents();

		});                
	} 
    
    /**
     * This method is called for every note from floorplan.js wherein we retrieve all notes from the AO
     * The purpose is to append it on the floorplan or flowdiagram.
     * @param {type} note_data
     */	
    function appendnote(note_data){
        jQuery("#note_" + note_data.created).remove();
        jQuery("#notep_" + note_data.created).remove();    // removing the element from the floorplan if it exists i.e removing duplicasy PLUG-1581
        imgLeft = parseFloat(jQuery('#floorplanImage')[0].style.left, 10);
        imgTop = parseFloat(jQuery('#floorplanImage')[0].style.top, 10);
        note_left = (parseInt(note_data.x1) * zoomGlobal) + imgLeft;
        note_top = (parseInt(note_data.y1) * zoomGlobal) + imgTop;
        note_p_top = note_top + parseInt(note_data.height) + 5;
        note_p_width = note_data.width - 2;
        if (note_data.type === 1) {
            var showLabelAllotArea = note_data.note;
            var showLabel = "";
            if (macro == 'flowdiagram') {//if macro is flow diagram     
                showLabel = "showLabel = " + note_data.showLabel;
                if (note_data.showLabel == false) {
                    showLabelAllotArea = "";
                }
            }
            note_area_div = $("<div id='note_" + note_data.created + "' class='dept' " + showLabel + "  link-url=\"" + note_data.resourceUrl + "\" dept='" + note_data.note + "' alloted-id='" + note_data.allotedId + "' title='" + note_data.note + "' type='" + note_data.type + "'><div style='overflow:hidden; text-overflow: ellipsis; white-space: nowrap;' >" + showLabelAllotArea + "</div><div data-icon='a' class='editroom' style='display:none; width:0.5px; height:0.5px; '></div></div>").css({left: note_left + 'px', top: note_top + 'px', width: (note_data.width * zoomGlobal) + 'px', height: (note_data.height * zoomGlobal) + 'px', 'line-height': (note_data.height * zoomGlobal) + 'px'});
            note_text_div = $("<div id='notep_" + note_data.created + "' class='deptp' dept-text='" + showLabelAllotArea + "' >" + note_data.userTitle + '</div>').css({left: note_left + 'px', top: note_p_top + 'px', minWidth: note_p_width + 'px'});

        }else if (note_data.type === 2) {
            note_area_div = $("<div id='note_" + note_data.created + "' class='room' link-url=\"" + note_data.resourceUrl + "\" dept='" + note_data.note + "' alloted-id='"+ note_data.allotedId +"' title='" + note_data.note + "' type='" + note_data.type + "'><div style='overflow:hidden; text-overflow: ellipsis; white-space: nowrap;' >" + note_data.note + "</div><div data-icon='a' class='editroom' style='display:none; width:0.5px;height:0.5px;'></div></div>").css({left: note_left + 'px', top: note_top + 'px', width: (note_data.width * zoomGlobal) + 'px', height: (note_data.height * zoomGlobal) + 'px', "line-height": (note_data.height * zoomGlobal) + 'px'});
            if (!jQuery.trim(note_data.resourceUrl)) {
                note_text_div = $("<div id='notep_" + note_data.created + "' class='roomp' dept-text='" + note_data.note + "' >" + note_data.userTitle + '</div>').css({left: note_left + 'px', top: note_p_top + 'px', minWidth: note_p_width + 'px'});
            } else {
                note_text_div = $("<div id='notep_" + note_data.created + "' class='roomp' dept-text='" + note_data.note + "'  title='" + note_data.resourceUrl + "' >" + note_data.userTitle + '</div>').css({left: note_left + 'px', top: note_p_top + 'px', minWidth: note_p_width + 'px', cursor: "pointer"});
            }
        }
        else if (note_data.type === 0) {
            key++;
            if (typeof note_data.profilePicLink == "undefined") {
                note_data["profilePicLink"] = "/images/icons/profilepics/default.png";
            }
            note_area_div = $("<div id='note_" + note_data.created + "' class='confluence-userlink note' data-username='" + note_data.note + "' href='/confluence/display/~" + note_data.note + "' data-linked-resource-id='" + note_data.userId + "' data-linked-resource-type='userinfo' title='' data-user-hover-bound='true' data-processed='true'  type='" + note_data.type + "' >\
                                    <img class='confluence-userlink' data-username='" +note_data.note+"' src='" + AJS.General.getBaseUrl() + note_data.profilePicLink + "' alt='' style='width: 100%; height: 100%; border-radius:50%; overflow:visible;' /></div>")
                            .css({left: note_left + 'px', top: note_top + 'px', width: (note_data.width * zoomGlobal) + 'px', height: (note_data.height * zoomGlobal) + 'px'});
            note_text_div = $("<div id='notep_" + note_data.created + "' class='notep' >" + note_data.userTitle + '</div>').css({left: note_left + 'px', top: note_p_top + 'px', minWidth: note_p_width + 'px'});
        }

        if (note_data.type !== -1) {    // -1 type is for the avatar size set for floorplan image and so to avoid it being rendered this check is provided.
            $('#pancontainerid').append(note_area_div);
            $('#pancontainerid').append(note_text_div);
        }

        if (note_data.type === 2 || note_data.type === 1) {
            if (note_data.resourceUrl !== "") {
                var height = parseInt(note_data.height) - 20;
                jQuery('#note_' + note_data.created + " div:first-child").append('<span class="aui-icon aui-icon-small aui-iconfont-link linkIcon" style="color:#525252; left:4px; position:absolute; top:' + height + 'px;"></span>');
            }
            var colorCode = note_data.allotedId % 20;
            if(colorCode == 0){
                colorCode = 20;
            }
            loadColorForRoom(note_data.created, colorCode);
        }
        AJS.$(note_area_div).tooltip();
    }
        
    function loadColorForRoom(Room, ColorCode) {
        var colors = randomColorCode(ColorCode);
        var roomObj = jQuery('#note_' + Room);
        if (jQuery('.pancontainer').attr('macro') == 'floorplan') {
            roomObj.css({'background-color': colors[1]});
            roomObj.css({border: '3px groove #' + colors[0]});
            jQuery('#notep_' + Room).css({'background': "#" + colors[1], 'opacity': "0.95"});
        } else {
            roomObj.css({'background-color': ''});
            roomObj.css({border: ''});
            roomObj.children().first().css({'display': 'none'});
            jQuery('#notep_' + Room).css({'background': "#" + colors[1], 'opacity': "0.95"});
        }
    }

    function randomColorCode(index) {
        //var random = Math.floor(Math.random() * (11 - 0 + 1)) + 0;
        var randomDark = ["FF1493", "DDA0DD", "9932CC", "6A5ACD", "0000FF", "00CED1", "32CD32", "556B2F", "BDB76B", "B8860B", "FF8C00", "F90606", "804000", "CCC000", "00CCCC", "FF9966", "8C66FF", "FF668C", "E60073", "6666FF"];
        var randomLight = ["rgba(255,105,180,0.3)", "rgba(238,130,238,0.3)", "rgba(186,85,211,0.3)", "rgba(123,104,238,0.3)", " rgba(65,105,225,0.3)", "rgba(64,224,208,0.3)", "rgba(144,238,144,0.3)", "rgba(107,142,35,0.3)", "rgba(240,230,140,0.3)", "rgba(218,165,32,0.3)", "rgba(255,165,0,0.3)", "rgba(249, 6, 6,0.3)", "rgba(128, 64, 0,0.3)", "rgba(204, 204, 0,0.3)", "rgba(0, 204, 204,0.3)", "rgba(255, 153, 102,0.3)", "rgba(140, 102, 255, 0.3)", "rgba(255, 102, 140,0.3)", "rgba(230, 0, 115, 0.3)", "rgba(102, 102, 255,0.3)"];
        var colors = [randomDark[index - 1], randomLight[index - 1]];
        return colors;
    }

// End the closure
})(jQuery);
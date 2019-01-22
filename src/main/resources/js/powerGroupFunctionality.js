var changeProfilePicHtml = '<br><br> <div class="field-group" style=\"margin-top:-30px;\">\
                                <input type=\"Button\" class="aui-button aui-button-primary" value=\"Crop Image & Upload\" id=\"uploadWithCrop\" style=\"display:none;margin-bottom:5px;margin-right:5px;\"/>\
                                <button  class="aui-button aui-button-link" id=\"cancel\" style="display:none">Cancel</button>\
                                </div>';

var uploadPicHtml ='<form id="uploadCustomProfilePicture" style="position:absolute;" class="aui long-label"><div class=\"field-group\" style=\"position: absolute;padding-left: 0px;\">\
                                <div id="imageDiv" style="opacity:0.7;  cursor: pointer;"><p style="padding-top:17px; padding-left:10px; float: left;">\
                                <span class="icon-camera"></span></p>\
                                <p id="imgLabel" style="visibility:hidden; color:white; font-weight:bold; font-size:large; margin-top:5px; padding-left:42px; padding-top:20px;"> Upload Profile Pic</p></div>\
                                <input class=\"uploadNewPic\" style="display:none;"  type="file" id=\"uploadNewPicture\" name=\"uploadNewPicture\" title=\"Change new profile picture\">\
                                </div>\
                                </form>';

var uploadOnlyPicHtml = '<form id="uploadCustomProfilePicture" style="position:absolute;" class="aui long-label"><span class="icon-camera"></span></form>';
var onViewProfilePage = false;
var editOwnProfile = false;

AJS.toInit(function () {
    jQuery(document).ready(function () {
        var check = window.location.pathname;
        if (check === AJS.contextPath() + "/users/viewuserprofile.action" || check === AJS.contextPath() + "/users/viewmyprofile.action" || check.indexOf(AJS.contextPath() + '/display/~') > -1) {
        var loggedInUserName = AJS.params.remoteUser;
            var profileUrl = document.URL;
            var urlToSearch = "viewuserprofile.action?username=";
            var startIndex = profileUrl.indexOf(urlToSearch);
            onViewProfilePage = true;
            if (startIndex !== -1) {
                userName = profileUrl.substring(startIndex + urlToSearch.length);
            } else if (profileUrl.indexOf("viewuserprofile.action") !== -1) {
                userName = AJS.params.remoteUser;
            }
            else {
                startIndex = profileUrl.indexOf("viewmyprofile.action");
                if (startIndex !== -1) {
                    userName = AJS.params.remoteUser;
                }
                else {
                    userName = profileUrl.split('~')[1];
                }
            }
            checkIsInPowerGroup();
            EditOwnProfilePermissions("view");
        } else if (check.indexOf("editmyprofile.action") > -1) {
            EditOwnProfilePermissions("edit");
            userName = AJS.params.remoteUser;

        } else if (check.indexOf("editmyprofilepicture.action") > -1) {
            EditOwnProfilePermissions("editownprofilepicture");
        }
       
        jQuery(document).on('click', '#imageDiv', function () {
               $('.uploadNewPic').trigger('click');   
        });                  
        jQuery(document).on('mouseover','#imageDiv', function(){
             jQuery(this).css({"background-color":"black"});
             jQuery(this).find('#imgLabel').css({"visibility":"visible"});
             jQuery(this).find('.icon-camera').css({"color":"white"});
        });
        jQuery(document).on('mouseout','#imageDiv', function(){            
             jQuery(this).css({"border": "", "background-color":""});
             jQuery(this).find('#imgLabel').css({"visibility":"hidden"});
             jQuery(this).find('.icon-camera').css({"color":"black"});
        });       
        jQuery(document).on('hover','#cancel', function(){
            jQuery(this).css({'text-decoration':'none'});
        });
    });
});

function checkIsInPowerGroup() {
    jQuery.ajax({
        url: AJS.contextPath() + "/rest/userprofile/1.0/userProfilePowerGroupManager/inPowerGroup",
        type: "GET",
        dataType: "text",
        success: function (data) {
            var isPowerUser = data;
            jQuery.ajax({
                url: AJS.contextPath() + "/rest/userProfile/1.0/userProfileManager/checkLicenseIsValid",
                type: "GET",
                success: function(data) {
                    if (data.trim() === "success" && (isPowerUser === "true" || AJS.params.isConfluenceAdmin == true)) {
                        if ((window.location.pathname).indexOf(AJS.contextPath() + '/users/profile/editmyprofilepicture.action') === -1 && (window.location.pathname).indexOf(AJS.contextPath() + '/users/editmyprofile.action') === -1) {
                            if(jQuery('#userProfileBtnContainer').length === 0)
                                showEditProfileBtn();
                            if(jQuery('#uploadCustomProfilePicture').length === 0)
                                showChangeProfilePicOption();
                        }
                    } else if (data.trim() === "success" && isPowerUser !== "true" && (window.location.pathname).indexOf(AJS.contextPath() + '/users/profile/editmyprofilepicture.action') > -1) {
                        jQuery('.profile-page').html('<br><h1>You don\'t have permission for edit...Please contact Administrator</h1>');
                    } else if (data.trim() === "success" && isPowerUser !== "true" && (window.location.pathname).indexOf(AJS.contextPath() + '/users/editmyprofile.action') > -1) {
                        jQuery('.profile-page').html('<br><h1>You don\'t have permission for edit...Please contact Administrator</h1>');
                    } else if (data.trim() === "success" && isPowerUser !== "true" && editOwnProfile == false) {
                        jQuery('.content-navigation .edit-link').remove();
                    }
                }
            });
        }
    });
}

function showEditProfileBtn() {

    //If confluence native field "About-Me" is filled by the user then only it shows that on view profile page.
    //check that "about-me" is rendered on view profile or not.If yes then move that section inside the form on RHS.
    if (jQuery('#profile-about-me').length > 0) {
        jQuery('#profile-about-me').wrap('<fieldset id="about-me" class="customProfileField"></fieldset>');
        jQuery('#profile-about-me').find('form').replaceWith(jQuery('#profile-about-me').find('form').html());
        jQuery('.page-item.profile-info').find('form:last').append(jQuery('#about-me'));
        jQuery('#profile-about-me-content').addClass('field-group field-value').css('font-weight', 'normal');
    }

    //Add Button container
    jQuery('<br><br><div id="userProfileBtnContainer"><button id="editCustomProfile" class="aui-button" ><span class="aui-icon aui-icon-small aui-iconfont-edit">edit</span>Edit profile</button></div><br><br>').insertAfter(jQuery('.profile-info').find('form:last'));

    //On click of "Edit Custom Profile" button.
    jQuery(document).on('click', '#editCustomProfile', function () {
        //If "about-me" section is not rendered then create our own to allow modify it.
        if (jQuery('#profile-about-me').length === 0) {
            jQuery('.profile-info').find('fieldset').eq(0).append('<div class="field-group"><label id="personalInformation-label" class="aboutMeCustomProfile" for="personalInformation"> About Me </label> <textarea id="customProfileAboutMe" name="personalInformation" cols="50" rows="5" style="" class="monospaceInput textarea "></textarea></div>');
        }

        //To convert native fields of confluence in editable form.
        jQuery(".profile-info").find('fieldset[class!="customProfileField"]').find('.field-value').each(function () {
            jQuery(this).replaceWith('<input type="text" id=\"' + jQuery(this).attr('id') + '\" class="text customEditProfile" value="' + jQuery(this).text() + '"></input>');
        });

        //To convert about-me field in editable form
        jQuery('#profile-about-me-content').html('<textarea id="customProfileAboutMe" cols="50" rows="5" style="" class="monospaceInput textarea ">' + jQuery('#profile-about-me-content').text() + '</textarea>');

        //To convert configured fields of confluence in editable form.
        displayCustomFieldInEditableForm();

        //To replace "Edit-Cutom-Profile" button with Save & Cancel button.
        jQuery('.page-item.profile-info').find('form:last').append(jQuery('#userProfileBtnContainer').html('<input type="submit" id="saveCustomProfile" class="aui-button" value="Save">\
                                                 <input type="button" id="cancelCustomProfile" class="aui-button" value="Cancel">'));
    });

    //On click of cancel button
    jQuery(document).on('click', '#cancelCustomProfile', function () {
        location.reload();
    });

    jQuery(document).on('submit', '.profile-info form', function (e) {
        e.preventDefault();
      //  scrapeHtmlAndJsPowerUser();
        saveCustomFields(userName);
    });
}

/**
 * Show all the fields on user profile page in editable form so that user can edit his/her profile.
 * 
 */
function displayCustomFieldInEditableForm() {
    jQuery(formLayout).each(function (i, val) {
        var requiredSpan = "", requiredEelement = "";
        var element = jQuery('.' + val.idOrName + "-value");
        var id=val.idOrName;
        /*
         * Show only those fields which are configured on the admin page. 
         * Do not show fields on profile page which are removed fileds on admin page.
         */        
        if (!val.removedField){
            if (val.required === true) {
                requiredSpan = "<span class='aui-icon icon-required'> required</span>";
                requiredEelement = "required=true";
                jQuery('label[for=' + val.idOrName + ']').append(requiredSpan);
            }
            var value = jQuery('#' + val.idOrName + "-value").text();
            value = value.replace(/"/g, '&quot;');
            if (val.type == 'INPUT') {
                jQuery('#' + val.idOrName + "-value").replaceWith('<input type="text" id=' + val.idOrName + ' class="text ' + val.size + ' customEditProfile" ' + requiredEelement + ' placeholder=\"' + val.placeholder + '\" value="' + value + '"></input> <p class="help-block">' + val.helpDesk + '</p>');
            } else if (val.type == 'SELECT') {
                var options = val.options.split('~');
                var selectedText = jQuery('#' + val.idOrName + "-value").text();
                var select = '<select id=' + val.idOrName + ' class=\"select ' + val.size + '\">';
                for (i = 0; i < options.length; i++) {
                    if (jQuery.trim(options[i]) != "") {
                        select = select + '<option value=\"' + options[i] + '\">' + options[i] + '</option>';
                    }
                }
                select = select + '</select>';
                jQuery('#' + val.idOrName + "-value").replaceWith(select);
                jQuery('#' + val.idOrName).val(selectedText);
            } else if (val.type == 'TEXTAREA') {
                jQuery('#' + val.idOrName + "-value").replaceWith('<textarea id=' + val.idOrName + ' class="textarea "' + requiredEelement + ' cols="50" rows="5">' + value + '</textarea>');
            } else if (val.type === 'USERPICKER') {
                attachUserPicker(element, id);
            } else if (val.type === 'DATE') {
                var dateVal;
            if (val.placeholder === 'fuzzy')
            {
                dateVal = jQuery('#' + val.idOrName + "-value").attr('date');
            } else {
                dateVal = jQuery('#' + val.idOrName + "-value").text();
            }
            if (dateVal === undefined)
                dateVal = '';
                jQuery('#' + val.idOrName + "-value").replaceWith('<input type=\"' + 'text' + '\" id=\"' + val.idOrName + '\" name=\"' + val.idOrName + '\" ' + requiredEelement + ' placeholder=\"' + val.placeholder + '\" value=\"' + dateVal + '\"  class=\"text ' + val.size + ' \" datefield=true ></input><p class="help-block">' + val.helpDesk + '</p>');
                AJS.$('#' + val.idOrName).datePicker({'overrideBrowserDefault': true});
            }
        }
    });
}

function EditOwnProfilePermissions(type) {
    jQuery.ajax({
        url: AJS.contextPath() + "/rest/userProfile/poweruser/1.0/editProfile/permission",
        type: "GET",
        contentType: "application/json",
        success: function (data) {
            var result = data;  
            if (result === "false") {
                if (type === "view" || type === "edit" || type === "editownprofilepicture") {
                    var loggedInUserName = AJS.params.remoteUser;
                    checkIsInPowerGroup();
                }
            } else
                editOwnProfile = result;
        },
        error: function (data) {
            console.log("There was an error with the request while editing the profile permissions "+ data);
        }
    });
}

function showChangeProfilePicOption() { 
    if (jQuery('.profile-main').find('#photoo').length > 0 ) {
        if(jQuery("#uploadWithCrop").length == 0){ //Checked Crop image & Uploade button is already appended or not Ref: PLUG-5392
            jQuery('#photoo').append(changeProfilePicHtml);
        }
            jQuery('.userPicture').before(uploadPicHtml);
    } else {
        if(jQuery("#uploadWithCrop").length == 0){
            jQuery('.profile-main').prepend(changeProfilePicHtml);
        }
    }
    enableUploadPicOption();
}

function scrapeHtmlAndJsPowerUser(){
   /* This code affects in below cases, 
    1.edit profile button for power user
   */
    jQuery('form.aui .field-group input, form.aui .field-group textarea').each(function(e){
        var fieldContent=jQuery(this).val();
        var filteredContent1=fieldContent.replace(/(<[A-Za-z][A-Za-z0-9]*>)/g,""); //removing <b> like tags
        var filteredContent2=filteredContent1.replace(/(<\/[A-Za-z][A-Za-z0-9]*>)/g,""); //remoing </br> like tags
        jQuery(this).val(filteredContent2); 
    }); 
}
var pageurl, userName, pictureFileFormat, xcord = 0, ycord = 0, width, height, loadingDialog;
var uploadProfilePicFormHtml = '<br>Your profile picture is used as the icon for your personal space, and to represent you in Confluence.<br>The original image will become your big profile picture & cropped area will become your icon.\
                                <h1>Upload New Profile Picture</h1><br> <form id="uploadCustomProfilePic" class="aui long-label"><div class=\"field-group\">\
                                <label class="picture-upload" for="uploadNewPicture" style="">Upload a Profile Picture</label>\
                                <input class=\"uploadNewPic\" type=\"file\" id=\"uploadNewPicture\" name=\"uploadNewPicture\" title=\"Upload new profile picture\">\
                                <div class="description">Upload your own profile picture. On the next step you will be able to crop your avatar from the picture.</div>\
                                <img  id=\"cropbox\"/><br></br>\
                                <div id=\"uploadMsg\"></div></div>\
                                <div class="field-group">\
                                <input type=\"Button\" class="aui-button aui-button-primary" value=\"Crop Image & Upload\" id=\"uploadWithCrop\" style=\"display:none\"/>\
                                <button  class="aui-button aui-button-link" id=\"cancel\" style="display:none;">Cancel</button>\
                                </div></form>';
var url = window.location.href;
if (url.indexOf('editmyprofilepicture.action') > -1) {
    jQuery.ajax({
        url: AJS.contextPath() + "/rest/userProfile/1.0/userProfileManager/checkLicenseIsValid",
        type: "GET",
        success: function (data) {
            if (data.trim() != "success" && jQuery('.officeAdminUnlicensedError').length == 0) {
                jQuery(data).insertBefore(jQuery('.profile-info form:last,.edit-my-profile-picture'));
                jQuery('.profile-info,.profile-main,#user-profile,form[name="editUser"]').attr('style', 'display: table-cell !important;');
            } else {
                enableUploadPicOption();
            }
        }
    });
}
function enableUploadPicOption() {
    AJS.toInit(function () {
        loadingDialog = "<section role='dialog' id='loading-dialog' class='aui-layer aui-dialog2 ' style= 'top:30%; width:280px; height: 150px;' aria-hidden='true'>";
        loadingDialog += "<header class='aui-dialog2-header'><h3 class='aui-dialog2-header-main'>Uploading Profile Picture</h3></header>";
        loadingDialog +="<div class='aui-dialog2-content'><div id='spinner' class='loadingDiv'></div></div>";
        pageurl = window.location.pathname;
        pictureFileFormat = "";
        if (pageurl.indexOf('edituser.action') !== -1) {
            userName = getURLParameter('username');
            jQuery("#admin-body-content").append('<div style="border-top: 1px solid #ccc;margin:10px"></div>' + uploadProfilePicFormHtml);

        } else if (pageurl.indexOf("editmyprofilepicture.action") > -1) {
            userName = AJS.params.remoteUser;
            jQuery('.edit-my-picture-profile,.edit-my-profile-picture').html(uploadProfilePicFormHtml);
        }
        jQuery('.profile-info,.profile-main,#user-profile,form[name="editUser"]').attr('style', 'display: table-cell !important;');
        jQuery(document).on('click', '.uploadNewPic', function () {
            pictureFileFormat = "";
            pictureString = "";
            jQuery("#cropbox,.jcrop-holder").remove();
            jQuery('.userPicture').show();
            jQuery('#uploadWithCrop,#cancel').css('display', 'none');
        });
        jQuery(document).on("change", "#uploadNewPicture", function (event) {
            jQuery('#uploadMsg').text("");
            var ext = $('#uploadNewPicture').val().split('.').pop().toLowerCase();

            if ($.inArray(ext, ['png', 'jpg', 'jpeg']) === -1) {
                pictureFileFormat = "";
                //alert('invalid extension!');

            } else {
                if (ext === 'jpg') {
                    ext = 'jpeg';
                }

                pictureFileFormat = ext;

            }
            if (pictureFileFormat === "") {
                alert('The file is not a jpg or png image file');

                $('#uploadProfileImage').val('');

            } else {

                if (event && event.target && event.target.files.length) {

                    var imgSrc = event.target.files[0];
                    var reader = new FileReader();

                    reader.onload = (function (theFile) {

                        return function (e) {

                            pictureString = e.target.result;

                            var n = pictureString.split(",");

                            pictureString = n[1];
                            if (pictureString != '' && typeof (pictureString != 'undefined')) {
                                cropImage(pictureString);
                                if(jQuery('#uploadCustomProfilePicture').length > 0){
                                   jQuery('#uploadCustomProfilePicture').remove();
                                }
                                jQuery('#uploadWithCrop,#cancel').css('display', 'inline-block');
                            }
                        };

                    })(imgSrc);

                    reader.readAsDataURL(imgSrc);

                }

            }
        });

        //For Upload Image with cropping
        jQuery(document).on("click", "#uploadWithCrop", function () {
            jQuery('body').append(loadingDialog);
            AJS.dialog2("#loading-dialog").show();
            storeProfilePictureInPlugingFolder(true, xcord, ycord, width, height);
        });

        //For Cancel
        jQuery(document).on("click", '#cancel', function () {
            location.reload();
        });
        /* 
         * Added setTimeout here because we are setting width & height of the changeProfilePic option based on profilePic.
         * & profilePic takes some time to load.
         * Without setTimeout sometimes it shows width as 0px & height as 0px; 
         * */
        setTimeout(function(){
                var widthOfImage = jQuery('#photoo .userPicture').width();
                var heightOfImage = jQuery('#photoo .userPicture').height();
                jQuery(document).find('#imageDiv').css({'width': widthOfImage, 'height': '74px'});
                jQuery(document).find('#uploadCustomProfilePicture').css({'padding-top': heightOfImage - 104});
        }, 50);
    });
}


//To upload the profile picture in plugins folder
function storeProfilePictureInPlugingFolder(crop, xcord, ycord, width, height) {
    $.ajax({
        url: AJS.params.contextPath + "/rest/userprofile/1.0/userProfilePictureManager/uploadProfilePic",
        type: "POST",
        data: JSON.stringify({
            userName: userName,
            profilePicString: pictureString,
            profilePicType: pictureFileFormat,
            crop: crop,
            xcord: xcord,
            ycord: ycord,
            width: width,
            height: height
        }),
        contentType: "application/json",
        success: function (data) {
            AJS.dialog2("#loading-dialog").hide();
            jQuery(document).find('body #loading-dialog').remove();
            jQuery('#uploadMsg').html("<b>Uploaded Successfully...!!!</b>");

            //on successful profile pic upload it will redirect to view profile page of that user after 2 second
            setTimeout(function () {
                var url = window.location.href;
                url = url.replace("profile/editmyprofilepicture.action", "viewmyprofile.action");
                window.location = url;
            }, 500);
        },
        error: function (data) {
            console.log("ERROR::" + data);
            AJS.dialog2("#loading-dialog").hide();
            jQuery(document).find('body #loading-dialog').remove();
            jQuery('#uploadMsg').html("<b>Error in Uploading..Please try again</b>");
        },
        complete: function (data) {
            jQuery('#uploadWithCrop,#cancel').css('display', 'none');
            jQuery("#cropbox,.jcrop-holder").remove();
        }
    });
}

function cropImage(pictureString) {
    jQuery("#cropbox,.jcrop-holder").remove();
    url = window.location.href;
    if (onViewProfilePage) {
        jQuery("<img  id=\"cropbox\"/>").insertAfter(jQuery(".userPicture")).wrap('<div class="field-group"></div>');
        jQuery('.userPicture').hide();
    } else {
        jQuery("<img  id=\"cropbox\"/>").insertAfter(jQuery(".uploadNewPic").closest('.field-group')).wrap('<div class="field-group"></div>');
    }
    jQuery("#cropbox").one("load", function() {
        /* Ref: PLUG-5351
         * Set the cropBox x,y, width & height attributes after image load.
         */
        getWidth = jQuery('#cropbox').width();
        getHeight = jQuery('#cropbox').height();
        var x = (getWidth / 3), y = (getHeight / 3), x2 = ((getWidth * 40) / 100) + x, y2 = ((getHeight * 40) / 100) + y;
        var x1 = (getWidth / 4), y1 = (getHeight / 4);
        jQuery('#cropbox').Jcrop({
            aspectRatio: 1,
            setSelect: [x1, y1, x2, y2], //to set default selection box at center of the image
            boxWidth: 650, //Maximum width you want for your bigger images
            boxHeight: 400, //Maximum Height for your bigger images
            onSelect: updateCoords
        });
    }).attr("src", "data:image/png;base64," + pictureString);
}

function updateCoords(c)
{
    xcord = c.x;
    ycord = c.y;
    width = c.w;
    height = c.h;
}
function getURLParameter(name) {

    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null

}

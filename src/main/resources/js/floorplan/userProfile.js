/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var userProfileLink;
var seatNo;
AJS.toInit(function() {
//    alert(AJS.$("#view-user-profile-link").attr("href"));
    var username;
    var profileUrl = document.URL;
    var urlToSearch = "viewuserprofile.action?username=";
    var startIndex = profileUrl.indexOf(urlToSearch);
    if(startIndex!==-1){
        username = profileUrl.substring(startIndex+urlToSearch.length);
    }
    else{
        startIndex = profileUrl.indexOf("viewmyprofile.action")
        if(startIndex !==-1) {
            username = "currentUser";
        }
        else {
            username = profileUrl.split('~')[1];
        }
    }
    // If settings tab in my profile section is selected, the page contents are visible which are set to hidden in the css file and gets applied in all of profile pages.
    if(jQuery('.aui-nav-selected a').attr('href').indexOf('viewmysettings.action') !== -1) {
        jQuery('.profile-info,.profile-main,#user-profile,form[name="editUser"]').attr('style', 'display: block !important;');
    }
});

/**
 * Profile Link is generated for the user seat in this method.
 * Usage of promise and pipe api of jquery is utilized here. 
 * @param {type} username
 */
function getUserProfileLink(username) {   
    return jQuery.ajax({
        url: AJS.contextPath() + "/rest/floorplan/1.0/allotArea/getUserProfileLink",
        type: "GET",
        data: {"user":username},
        dataType: "json",
        contentType: 'application/json'
    }).pipe(function(responseData){
        if(responseData === null || responseData.userProfileUrl === undefined){
            return;
        }
        userProfileLink = AJS.contextPath() + responseData.userProfileUrl;
            seatNo = responseData.seatNo;
        if (seatNo === "" || seatNo === undefined || seatNo === null) {
                seatNo = "Click Here";
            }
            var viewSeatHtml = '<br><br><div class="field-group viewMode">\
                                <h2><label id="userparam-floorplan-seat-label" for="userparam-location" style="float:left">View Seat : &nbsp;&nbsp;</label>\
                                <span id="userparam-floorplan-seat" class="field-value"><a href="' + userProfileLink + '"> ' + seatNo + ' </a></span></h2></div>';

            var fieldset = jQuery("#userparam-location-label").parent().parent("fieldset");
//            jQuery(fieldset).append(viewSeatHtml);
            jQuery('#photoo').append(viewSeatHtml);
        return ([userProfileLink, seatNo]);
    });
}
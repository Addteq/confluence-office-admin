/**  Actions and their purpose
 *  
 *   1. viewuser.action  -- View user details from user administration from admin configuration
 * 
 *   2. edituser.action  -- Edit user details from user administration from admin configuration
 * 
 *   3. editmyprofile.action  -- Edit own profile from My profile window
 * 
 *   4. viewmyprofile.action  -- View own profile from My profile 
 * 
 *   5. /display/~  OR  viewuserprofile.action   -- View any other users profile in the system.
 * 
 */
var selections = [], temp=[];
jQuery(document).ready(function(){
    var url = window.location.href;
    var pageurl = window.location.pathname;
    if (url.indexOf('viewuser.action') > -1 || url.indexOf('edituser.action') > -1 || url.indexOf('editmyprofile.action') > -1 || url.indexOf('viewmyprofile.action') > -1 || url.indexOf('viewuserprofile.action') > -1 || url.indexOf('display') > -1) {
        jQuery.ajax({
            url: AJS.contextPath() + "/rest/userProfile/1.0/userProfileManager/checkLicenseIsValid",
            type: "GET",
            success: function (data) {
                AJS.toInit(function () {
                    if (data.trim() != "success" && jQuery('.officeAdminUnlicensedError').length == 0) {
                        jQuery(data).insertBefore(jQuery('.profile-info form:last,#admin-body'));
                        jQuery('.profile-info,.profile-main,#user-profile,form[name="editUser"]').attr('style', 'display: table-cell !important;');
                    } else {
                        AJS.I18n.get("com.addteq.officeadmin"); //Load the properties file.
                        enableOfficeAdminPlugin(pageurl);
                        checkIfAnotherUserProfilePluginIsInstalled();
                    }
                });
            }
        });
    }
    
    jQuery(document).on('keyup', 'div .select2-search-field input', function(){        
        temp=[], selections=[];
        var query = jQuery(this).val();
        if (query.length >= 2) {
            jQuery.ajax({
                url: AJS.contextPath() + "/rest/prototype/1/search/user.json?query=" + query+"&show-unlicensed=true",
                type: "GET",
                dataType: "text",
                contentType: "application/json",
                success: function (data) {
                    var result = jQuery.parseJSON(data).result;
                    jQuery(document).find('select.customFieldUsers').find('option').remove();                    
                    jQuery.each(result, function (key, value) {
                        if(temp.length == 0 || temp.indexOf(value.id) == -1){
                           temp.push(value.id);                        
                           selections.push({id: value.username, text: value.title});
                        }
                    });
                }
            });
        }
    });
});
//Extract Users Id that are been already selected.
var extract_preselected_ids = function(element){
        var preselected_ids = [];
        if(element.val())
            $(element.val().split(",")).each(function () {
                preselected_ids.push({id: this});
            });
        return preselected_ids;
};
//Extract Users that are been already selected.    
var preselect = function(preselected_ids){
        var pre_selections = [];
        for(index in selections)
            for(id_index in preselected_ids)
                if (selections[index].id == preselected_ids[id_index].id)
                    pre_selections.push(selections[index]);
        return pre_selections;
};
//Attach UserPicker to the particular Element.
function attachUserPicker(element, id){            
            var datausername = [], flag1=false;
            jQuery(element).each(function(){                 
                if(!flag1){
                    datausername.push(jQuery(this).attr('realValue'));                    
                    flag1=true;
                }
                else{
                    datausername.push(jQuery(this).attr('realValue'));                                        
                    jQuery(this).remove();
                }                                 
            });
            getUsernames(datausername,id,element);
}
//Get UserNames according to User's Id.
function getUsernames(datausername,id,element){
    var values=[],flag=0;
    if(datausername != ""){
            datausername.forEach(function(username){                   
                jQuery.ajax({
                    url: AJS.contextPath() + "/rest/prototype/1/search/user.json?query=" + username+"&show-unlicensed=true",
                    type: "GET",
                    dataType: "text",
                    contentType: "application/json",
                    success: function (data) {
                        var result = jQuery.parseJSON(data).result;
                        var user;
                        jQuery.each(result, function(key, value){
                            if(username == value.username){                               
                                user = value.username;             
                                selections.push({id:value.username,text:value.title});                                                            
                            }
                        });
                        callback(user);
                    }
                });
            });
            var callback = function(value){
                values.push(value);                       
                if(flag == (datausername.length - 1)){
                    var newValues = values.toString();  
                    attachSelect2(element,newValues,id);
                }
                else{
                    flag++;
                }
            }
    }else{
         attachSelect2(element,'',id);
    }
}
//Attach Select2 to Input Element, as to make Multi-User Selector.
function attachSelect2(element, newValues, id){
    if(element.hasClass('confluence-userlink')){
        jQuery(element).next('b').remove();
        jQuery(element).replaceWith('<input id=\"' + id + '\" value=\"' + newValues + '\" class=\"customFieldUsers\" name=\"' + id + '\">');
    }
    jQuery('#' + id).nextAll('b').remove();
    jQuery('#' + id).auiSelect2({
        placeholder: 'Pick Users',
        minimumInputLength: 3,
        multiple: true,
        allowClear: true,
        data: function(){
            return {results: selections}
        },
        initSelection: function(element, callback){
            var preselected_ids = extract_preselected_ids(element); //pre-selected IDs as per HTML attributes
            var preselections = preselect(preselected_ids);//pre-selected Names as per HTML attributes
            callback(preselections);
       },
        width: "300px"
    });
}

function enableOfficeAdminPlugin(pageurl){
            if (jQuery("#admin-body-content #user-profile").length) {
                viewCustomFormFields('1');
            }
            if (pageurl.indexOf('edituser.action') !== -1) {
                viewCustomFormFields('2');
                AJS.$('#admin-body').find('#cancel').attr("formnovalidate", "formnovalidate");
            } else if (pageurl.indexOf('editmyprofile.action') !== -1) {
                viewCustomFormFields('3');
                AJS.$('#editmyprofileform').find('#cancel').attr("formnovalidate", "formnovalidate");
            } else if (pageurl.indexOf('viewmyprofile.action') !== -1) {
                viewCustomFormFields('4');
            } else if (pageurl.indexOf('/display/~') !== -1 || pageurl.indexOf('viewuserprofile.action') !== -1) {
                viewCustomFormFields('5');
            } else if (pageurl.indexOf('viewuser.action') == -1 && pageurl.indexOf('edituser.action') == -1) {
                jQuery('.profile-info,.profile-main,#user-profile,form[name="editUser"]').attr('style', 'display: table-cell !important;');
            }
            //To display custom profile picture
            if (pageurl.indexOf('viewmyprofile.action') !== -1 || pageurl.indexOf('/display/~') !== -1 || pageurl.indexOf('viewuserprofile.action') !== -1) {
                var username;
                var profileUrl = document.URL;
                var urlToSearch = "viewuserprofile.action?username=";
                var startIndex = profileUrl.indexOf(urlToSearch);
                if (startIndex !== -1) {
                    username = profileUrl.substring(startIndex + urlToSearch.length);
                } else if (profileUrl.indexOf("viewuserprofile.action") !== -1) {
                    username = AJS.params.remoteUser;
                }
                else {
                    startIndex = profileUrl.indexOf("viewmyprofile.action")
                    if (startIndex !== -1) {
                        username = AJS.params.remoteUser;
                    }
                    else {
                        username = profileUrl.split('~')[1];
                    }
                }
                
                username = decodeURIComponent(username);
                getProfilePicture(username);
            }

                
            /////   Saving details from admin configuration
            jQuery('#admin-body-content fieldset .buttons-container #confirm').on('mousedown', function () {
                var save = true;
                jQuery("#admin-body-content fieldset input[required='true']").each(function(index, element){
                    if(jQuery(element).val() === "") {
                        save = false;
                        return;
                    }
                });
                if(save) {
                    var userName = jQuery('#username').val();
                //    scrapeHtmlAndJs();
                    saveCustomFields(userName);
                }
            });

            //To detect on which button (i.e confirm or cancel) user clicked for submitting the form.
            var buttonpressed;
            jQuery(document).on('click', '#editmyprofileform input[type="submit"]', function () {
                buttonpressed = jQuery(this).attr('name');
            });
            
            jQuery(document).on('click', 'form[name="editUser"] input[type="submit"][value="Submit"]', function (e) {
                if(isSafari())
                    e.preventDefault();
            });

            /////   Saving details from my profile
            jQuery('body').on('submit', '#editmyprofileform', function (e) {
                if (buttonpressed == "confirm") {
                    e.preventDefault();
                    var userName = AJS.params.remoteUser;
                  //  scrapeHtmlAndJs();
                    saveCustomFields(userName);
                }

            });
            displayProfilePic();
}
/**
 * Saving the custom fields data in active objects
 * @param {type} userName
 * 
 */
function saveCustomFields(userName) {
// validation for date field if entered correct
    var regex = /^((19|20)\d\d+)-(0[1-9]|1[012]+)-(0[1-9]|[12][0-9]|3[01])$/;
    var cancelSave = false;
    jQuery('input[datefield="true"]').each(function(index, element) {
        if(jQuery(element).val() !== "" && jQuery(element).val() !== undefined && !regex.test(jQuery(element).val())) {
            cancelSave = true;
            alert('Please set the date field values in this format \'yyyy-mm-dd\'');
            AJS.$('#password-dialog').hide();
            AJS.$('.aui-blanket').hide();
            return false;
        }    
    });
    jQuery("#editmyprofileform input[required='true'], #customfields input[required='true'], #admin-body-content input[customReq='true'],#admin-body-content textarea[customReq='true']").each(function(index, element) {
        if (jQuery(element).val() === "") {
            cancelSave = true;
            alert('Please fill out the mandatory fields');
            AJS.$('#password-dialog').hide();
            AJS.$('.aui-blanket').hide();
            return false;
        }
    });
    if(cancelSave)
        return;
// validation for date field if entered correct ends

    var postData = [];
    var customRecords = [];    
    customRecords = jQuery('div[customconfiguredfield]');    
    var count = 0;
    while (customRecords.size() > count) {
        var value;
        var element = customRecords[count];
        var getElement =jQuery(element).children().next();
        var id = jQuery(getElement).attr('id');
        if(jQuery(getElement).hasClass('customFieldUsers')){
            var dataOfUserPicker = jQuery(getElement).select2('data');
            if (dataOfUserPicker != ""){
                for (var i = 0; i < dataOfUserPicker.length; ++i) {
                    if (i != 0)
                        value = value + '~' + dataOfUserPicker[i].id;
                    else
                        value = dataOfUserPicker[i].id;
                }
            }else{
                value="";
            }
            id = id.replace('s2id_','');
        }
        else{
            value = jQuery(element).children().next().val();
        }

        postData.push(JSON.stringify({
            'userId': userName,
            'fieldId': id,
            'value': value
        }));
       
        count++;
    }
   
    if (postData.length > 0) {
        jQuery.ajax({
            url: AJS.contextPath() + "/rest/userProfile/1.0/userProfileFieldsManager/saveFormFieldsData",
            type: "POST",
            data: "[" + postData + "]",
            dataType: "json",
            contentType: 'application/json',
            success: function (data) {
                saveNativeFields(userName);
            }
        });
    }
}

/**
 * Method for fetching all the custom fields data against one user in the system.
 * @param {type} action
 * 
 */
function viewCustomFormFields(action) {
    
    var postData = '';

    if (action === '1') {
        postData = {'userId': jQuery('#user\\.name').text(), 'fieldId': '', 'value': ''};
    } else if (action === '1') {
        postData = {'userId': jQuery('#username').val(), 'fieldId': '', 'value': ''};
    } else if (action === '2') {
        postData = {'userId': jQuery('#username').val(), 'fieldId': '', 'value': ''};
    } else if (action === '5') {
        var userId = '';
        if ((window.location.pathname).indexOf('/display/~') !== -1) {
            userId = (window.location.pathname).substring((window.location.pathname).indexOf("~") + 1)
        } else if ((window.location.href).indexOf('viewuserprofile.action?username=') !== -1) {
            userId = (window.location.search).substring((window.location.search).indexOf("=") + 1);
        } else if ((window.location.pathname).indexOf('viewuserprofile.action') !== -1) {
            userId = AJS.params.remoteUser;
        }
        if (userId == "") {
            userId = AJS.params.remoteUser;
        }
        userId = decodeURIComponent(userId);
        postData = {'userId': userId, 'fieldId': '', 'value': ''};
    } else {
        postData = {'userId': AJS.params.remoteUser, 'fieldId': '', 'value': ''};
    }

    jQuery.ajax({
        cache: false,
        url: AJS.contextPath() + "/rest/userProfile/1.0/userProfileFieldsManager/getFormFieldValues",
        type: "GET",
        data: postData,
        dataType: "json",
        contentType: 'application/json',
        success: function (data) {
            if (action === '1') {
                getConfiguredCustomForm('1', data);
            } else if (action === '2') {
                getConfiguredCustomForm('2', data);
            } else if (action === '3') {
                getConfiguredCustomForm('3', data);
            } else if (action === '4') {
                getConfiguredCustomForm('4', data);
            } else if (action === '5') {
                getConfiguredCustomForm('5', data);
            }
        }
    });
}

function hideDefaultFields(listOfRecords) {

    var recs = jQuery('.page-item.profile-info').find('form:last').children();
    recs.each(function (index) {
        if (jQuery(this).attr('class') !== 'buttons-container')
            jQuery(this).hide();
    });

    recs = jQuery('#admin-body-content').find('fieldset').children();
    recs.each(function (index) {
        if (jQuery(this).attr('class') !== 'buttons-container')
            jQuery(this).hide();
    });

    recs = jQuery('#admin-body-content #user-profile .aui').children();
    recs.each(function (index) {
        if (jQuery(this).attr('class') !== 'buttons-container')
            jQuery(this).hide();
    });
    
    jQuery('fieldset#about-me').hide();
    jQuery('#profile-about-me').hide();
    
    /*    var j = 0;
     for(j = 0; j < listOfRecords.length ; j++) {
     if(listOfRecords[j].idOrName === 'email' || listOfRecords[j].idOrName === 'fullName' || listOfRecords[j].idOrName === 'userparam-phone' || listOfRecords[j].idOrName === 'userparam-im'
     || listOfRecords[j].idOrName === 'userparam-website' || listOfRecords[j].idOrName === 'userparam-position' || listOfRecords[j].idOrName === 'userparam-department' || listOfRecords[j].idOrName === 'userparam-location') {
     jQuery('#'+listOfRecords[j].idOrName).parent().hide();
     }
     }
     
     var profilePageFields = jQuery('.page-item.profile-info.section-3 .aui fieldset');
     profilePageFields.each(function(index) {
     if(jQuery(this).find('div:visible').length === 0) {
     if(jQuery(this).prev().prop("tagName") === "H2") {
     jQuery(this).prev().remove();
     }
     }
     });
     
     editProfilePageFields = jQuery('#editmyprofileform fieldset');
     editProfilePageFields.each(function(index) {
     if(jQuery(this).find('div:visible').length === 0) {
     if(jQuery(this).prev().prop("tagName") === "H2") {
     jQuery(this).prev().remove();
     }
     }
     });*/
}

/**
 * Method to fetch all the custom configured fields in the system. 
 * @param {type} action
 * @param {type} dataOfFields
 * 
 */
function getConfiguredCustomForm(action, dataOfFields) {

    jQuery.ajax({
        url: AJS.contextPath() + "/rest/userProfile/1.0/userProfileManager/getFormBuilder",
        type: "GET",
        dataType: "json",
        success: function (data) {
            formLayout = data;
            if (data.length > 0)
                hideDefaultFields(data);
            if (action === '1') {      // render fields in admin section
                renderViewProfileAdminSection(data, dataOfFields);
            } else if (action === '2') {
                renderEditProfileAdminSection(data, dataOfFields);
            } else if (action === '3') {
                renderEditMyProfileSection(data, dataOfFields);
            } else if (action === '4') {      // render fields in my profile section
                renderViewMyProfileSection(data, dataOfFields);
            } else if (action === '5') {      // render fields in my profile section viewed by another user
                renderViewMyProfileSection(data, dataOfFields);
            }

        }
    });
}

/**
 * Show the custom configured fields in user administration from admin section
 * @param {type} data
 * @param {type} listOfRecords
 */
function renderViewProfileAdminSection(data, listOfRecords) {
    if (data.length > 0) {

        var i = 0;
        for (i = 0; i < data.length; i++) {
            var element = data[i];
            var j = 0, value = '';
            for (j = 0; j < listOfRecords.length; j++) {
                if ((element.idOrName === listOfRecords[j].fieldId)) {
                    value = listOfRecords[j].value;
                    break;
                }
            }
            if(!element.removedField){
                if (element.type === 'LABEL') {
                    jQuery('#admin-body-content').find('#user-profile')
                            .find('.buttons-container').before('<h2>' + element.label + '</h2>');
                } else if (element.type === 'TEXTAREA') {
                    jQuery('#admin-body-content').find('#user-profile')
                            .find('.buttons-container')
                            .before('<div customConfiguredField = true class=\"field-group viewMode\"> <label for=\"' + element.idOrName + '\">' + element.label + '</label> ' +
                                    '<span id=\"' + element.idOrName + '-name\" class=\"field-value\"><pre class="wordWrapTextArea"></pre></span>');
                    jQuery('#admin-body-content').find('#user-profile').find("form").find('#'+ element.idOrName +'-name pre').text(value);
                }
                else if (element.type === 'USERPICKER') {
                    jQuery('#admin-body-content').find('#user-profile')
                            .find('.buttons-container').before('<div customConfiguredField = true class=\"field-group viewMode ' + element.idOrName + '\"> <label for=\"' + element.idOrName + '\">' + element.label + '</label> ');
                    if (value.indexOf('~') > 0) {
                        var values = value.split('~');
                        var flag = 0;
                        values.forEach(function (val) {
                            jQuery('#admin-body-content').find('#user-profile')
                                    .find('.' + element.idOrName).append('<a id="' + element.idOrName + '-value-' + flag + '" style="font-weight:bold;" class="' + element.idOrName + '-value confluence-userlink field-value" realValue = "' + val + '" data-username="' + val + '" href="' + AJS.contextPath() + '/display/~' + val + '" data-linked-resource-id="' + val + '" data-linked-resource-type="userinfo" title="" data-user-hover-bound="true">' + val + '</a>');
                            if (flag != values.length - 1) {
                                jQuery('#admin-body-content').find('#user-profile').find('.' + element.idOrName).find("#" + element.idOrName + '-value-' + flag).after('<b>,  </b>');
                            }
                            if (val !== "" && val !== null && val !== 'undefined')
                                getUserFullName(element.idOrName + '-value-' + flag, val);

                            flag++;
                        });
                    } else {
                        jQuery('#admin-body-content').find('#user-profile')
                                .find('.' + element.idOrName).append('<a id="' + element.idOrName + '-value" style="font-weight:bold;" class="' + element.idOrName + '-value confluence-userlink field-value" realValue = "' + value + '"  data-username="' + value + '" href="' + AJS.contextPath() + '/display/~' + value + '" data-linked-resource-id="' + value + '" data-linked-resource-type="userinfo" title="" data-user-hover-bound="true">' + value + '  </a>');

                        if (value !== "" && value !== null && value !== 'undefined')
                            getUserFullName(element.idOrName + '-value', value);
                    }
                }
                else {
                    jQuery('#admin-body-content').find('#user-profile')
                            .find('.buttons-container')
                            .before('<div customConfiguredField = true class=\"field-group viewMode\"> <label for=\"' + element.idOrName + '\">' + element.label + '</label> ' +
                                    '<span id=\"' + element.idOrName + '-name\" class=\"field-value\"></span>');
                    jQuery('#admin-body-content').find('#user-profile').find("form").find('#'+ element.idOrName +'-name').text(value);
                }
                if (element.type === 'DATE' && element.placeholder === 'fuzzy' && jQuery('#' + element.idOrName + '-name').text() !== '' && jQuery('#' + element.idOrName + '-name').text() !== undefined) {
                    var dateVal = jQuery('#' + element.idOrName + '-name').text();
                    jQuery('#' + element.idOrName + '-name').text(jQuery.timeago(jQuery('#' + element.idOrName + '-name').text())).attr('date', dateVal);
                }
            }
        }
    }
    jQuery('.profile-info,.profile-main,#user-profile,form[name="editUser"]').attr('style', 'display: table-cell !important;');
    loadLinkHover();
}

/**
 * Edit custom fields details of any user from user administration in admin section
 * @param {type} listOfRecords
 * @param {type} dataOfFields
 */
function renderEditProfileAdminSection(listOfRecords, dataOfFields) {
    if (listOfRecords.length > 0) {
        var i = 0;
        for (i = 0; i < listOfRecords.length; i++) {
            var element = listOfRecords[i];

            var j = 0;
            var value = '';
            for (j = 0; j < dataOfFields.length; j++) {
                if ((element.idOrName === dataOfFields[j].fieldId)) {
                    value = dataOfFields[j].value;
                    break;
                }
            }
            value = value.replace(/"/g, '&quot;');
            var requiredSpan = "", requiredElement = "";
            if (element.required === true) {
                requiredSpan = "<span class='aui-icon icon-required' style='background-position:0px!important'> required</span>";
                requiredElement = "required=true";
                if(isSafari()) {
                    requiredElement = "customReq=true";
                }
            }
            if(!element.removedField){
                if (element.type === 'TEXTAREA') {
                    jQuery('#admin-body-content').find('fieldset')
                            .find('.buttons-container')
                            .before('<div customConfiguredField = true class=\"field-group\"> <label for=\"' + element.idOrName + '\">' + element.label  + requiredSpan + '</label> ' +
                                    '<textarea maxlength="3000" cols="50" rows="5" class=\"textarea ' + element.size + '\" type=\"' + element.type + '\" id=\"' + element.idOrName + '\" name=\"' + element.idOrName  + '\" ' + requiredElement + ' placeholder=\"' + element.placeholder + '\">' + value + '</textarea>');

                } else if (element.type === 'INPUT') {
                    jQuery('#admin-body-content').find('fieldset')
                            .find('.buttons-container')
                            .before('<div customConfiguredField = true class=\"field-group\"> <label for=\"' + element.idOrName + '\">' + element.label + requiredSpan + '</label> ' +
                                    '<input class=\"text ' + element.size + '\" type=\"' + element.type + '\" id=\"' + element.idOrName + '\" name=\"' + element.idOrName + '\" ' + requiredElement + ' placeholder=\"' + element.placeholder + '\" value=\"' + value + '\"></input>' +
                                    '<p class="help-block">' + element.helpDesk + '</p>');
                } else if (element.type === 'SELECT') {
                    var optionsArray = new Array();
                    optionsArray = (element.options).split(' ~ ');
                    var optionsHtml = '', j = 0, selected = '';
                    for (j = 0; j < optionsArray.length - 1; j++) {
                        optionsHtml = optionsHtml + '<option>' + optionsArray[j] + '</option>'
                    }
                    jQuery('#admin-body-content').find('fieldset')
                            .find('.buttons-container')
                            .before('<div customConfiguredField = true class=\"field-group\"> <label for=\"' + element.idOrName + '\">' + element.label + '</label> ' +
                                    '<select class=\"' + element.size + '\" type=\"' + element.type + '\" id=\"' + element.idOrName + '\" name=\"' + element.idOrName + '\" >' + optionsHtml + '</select>');

                    jQuery('#' + element.idOrName).val(value);

                } else if (element.type === 'LABEL') {
                    jQuery('#admin-body-content').find('fieldset')
                            .find('.buttons-container')
                            .before('<h2>' + element.label + '</h2>');
                } else if (element.type === 'USERPICKER') {
                    var values;
                    if (value.indexOf('~') > 0) {
                        values = value.split('~');
                    } else {
                        values = ["" + value + ""];
                    }

                    jQuery('#admin-body-content').find('fieldset')
                            .find('.buttons-container')
                            .before('<div customConfiguredField = true class=\"field-group\"> <label for=\"' + element.idOrName + '\">' + element.label + requiredSpan + '</label> ' +
                                    '<input id=\"' + element.idOrName + '\" class=\"customFieldUsers\" name=\"' + element.idOrName + '\" ' + requiredElement + '"  value="' + values.toString() + '">  </input>' +
                                    '');
                    var inputElement = jQuery("#" + element.idOrName);
                    getUsernames(values, element.idOrName, inputElement);
                } else if (element.type === 'DATE') {
                    jQuery('#admin-body-content').find('fieldset')
                            .find('.buttons-container')
                            .before('<div customConfiguredField = true class=\"field-group\"> <label for=\"' + element.idOrName + '\">' + element.label + requiredSpan + '</label> ' +
                                    '<input type=\"' + 'text' + '\" id=\"' + element.idOrName + '\" name=\"' + element.idOrName + '\" ' + requiredElement + ' placeholder=\"' + element.placeholder + '\" value=\"' + value + '\"  class=\"text ' + element.size + '\" data-none-message=\"No users found\" data-resize-to-input=\"true\"  datefield=true ></input>' + // class="text long-field autocomplete-user" type="text" placeholder="Fill in just one user" 
                                    '<p class="help-block">' + element.helpDesk + '</p>');

                    AJS.$('#' + element.idOrName).datePicker({'overrideBrowserDefault': true});
                }
            }
        }
    }
    jQuery('.profile-info,.profile-main,#user-profile,form[name="editUser"]').attr('style', 'display: table-cell !important;');
}

/**
 * Show the custom configured fields in My Profile section of the user
 * @param {type} data
 * @param {type} listOfRecords
 */
function renderViewMyProfileSection(data, listOfRecords) {
    if (data.length > 0) {

        jQuery('.page-item.profile-info').find('form:last').append('<fieldset id="customfields" class="customProfileField"><fieldset>');

        var i = 0;
        for (i = 0; i < data.length; i++) {
            var element = data[i];
            var j = 0, value = '';
            for (j = 0; j < listOfRecords.length; j++) {
                if ((element.idOrName === listOfRecords[j].fieldId)) {
                    value = listOfRecords[j].value;
                    break;
                }
            }
            if(!element.removedField){
                if (element.type === 'LABEL') {
                    jQuery('.page-item.profile-info').find('form')
                            .find('#customfields').append('<h2>' + element.label + '</h2>');
                } else if (element.type === 'USERPICKER') {
                    jQuery('.page-item.profile-info').find('form')
                            .find('#customfields').append('<div customConfiguredField = true class=\"field-group viewMode ' + element.idOrName + '\"> <label for=\"' + element.idOrName + '\">' + element.label + '</label> ');
                    if (value.indexOf('~') > 0) {
                        var values = value.split('~');
                        var flag = 0;
                        values.forEach(function (val) {
                            jQuery('.page-item.profile-info').find('form')
                                    .find('#customfields .' + element.idOrName).append('<a id="' + element.idOrName + '-value-' + flag + '" class="' + element.idOrName + '-value confluence-userlink field-value" realValue = "' + val + '" data-username="' + val + '" href="' + AJS.contextPath() + '/display/~' + val + '" data-linked-resource-id="' + val + '" data-linked-resource-type="userinfo" title="" data-user-hover-bound="true">' + val + '</a>');
                            if (flag != values.length - 1) {
                                jQuery('.page-item.profile-info').find('form')
                                        .find('#customfields .' + element.idOrName).find("#" + element.idOrName + '-value-' + flag).after('<b>,  </b>');
                            }
                            if (val !== "" && val !== null && val !== 'undefined')
                                getUserFullName(element.idOrName + '-value-' + flag, val);

                            flag++;
                        });
                    }
                    else {
                        jQuery('.page-item.profile-info').find('form')
                                .find('#customfields .' + element.idOrName).append('<a id="' + element.idOrName + '-value" class="' + element.idOrName + '-value confluence-userlink field-value" realValue = "' + value + '"  data-username="' + value + '" href="' + AJS.contextPath() + '/display/~' + value + '" data-linked-resource-id="' + value + '" data-linked-resource-type="userinfo" title="" data-user-hover-bound="true">' + value + '  </a>');

                        if (value !== "" && value !== null && value !== 'undefined')
                            getUserFullName(element.idOrName + '-value', value);
                    }
                } else if (element.type === 'TEXTAREA') {
                    jQuery('.page-item.profile-info').find('form')
                            .find('#customfields')
                            .append('<div customConfiguredField = true class=\"field-group viewMode\"> <label for=\"' + element.idOrName + '\">' + element.label + '</label> ' +
                                    '<span id=\"' + element.idOrName + '-value\" class=\"field-value\"><pre class="wordWrapTextArea"></pre></span>');
                            jQuery('.page-item.profile-info').find('form') .find('#customfields').find('#'+ element.idOrName +'-value pre').text(value);
                } else {
                    jQuery('.page-item.profile-info').find('form')
                            .find('#customfields')
                            .append('<div customConfiguredField = true class=\"field-group viewMode\"> <label for=\"' + element.idOrName + '\">' + element.label + '</label> ' +
                                    '<span id=\"' + element.idOrName + '-value\" class=\"field-value\"></span>');
                            jQuery('.page-item.profile-info').find('form') .find('#customfields').find('#'+ element.idOrName +'-value').text(value);
                }
                if (element.type === 'DATE' && element.placeholder === 'fuzzy' && jQuery('#' + element.idOrName + '-value').text() !== '') {
                    var date = jQuery('#' + element.idOrName + '-value').text();
                    jQuery('#' + element.idOrName + '-value').attr('date', date).text(jQuery.timeago(jQuery('#' + element.idOrName + '-value').text()));
                }
            }
        }
         jQuery(".field-value").linkify({target: "_blank"});//linkify plugin converts URLs and email addresses to clickable link.
    }
    loadLinkHover();
    jQuery('.profile-info,.profile-main,#user-profile,form[name="editUser"]').attr('style', 'display: table-cell !important;');
    jQuery('fieldset#about-me').hide();  // hide system fields of about me. done here as well cos of the ajax req response speed affects this sometime.
    jQuery('#profile-about-me').hide();
}

/**
 * Edit custom fields details of user from my profile
 * @param {type} listOfRecords
 * @param {type} dataOfFields
 */
function renderEditMyProfileSection(listOfRecords, dataOfFields) {
    if (listOfRecords.length > 0) {
        var i = 0;
        for (i = 0; i < listOfRecords.length; i++) {
            var element = listOfRecords[i];

            var j = 0;
            var value = '';
            for (j = 0; j < dataOfFields.length; j++) {
                if ((element.idOrName === dataOfFields[j].fieldId)) {
                    value = dataOfFields[j].value;
                    break;
                }
            }
            value = value.replace(/"/g, '&quot;');            
            var requiredSpan = "", requiredElement = "";
            if (element.required === true) {
                requiredSpan = "<span class='aui-icon icon-required'> required</span>";
                requiredElement = 'required=true';
            }
            if(!element.removedField){
                if (element.type === 'TEXTAREA') {
                    jQuery('.page-item .profile-info')
                            .find('.buttons-container')
                            .before('<div customConfiguredField = true class=\"field-group\"> <label for=\"' + element.idOrName + '\">' + element.label + requiredSpan + '</label> ' +
                                    '<textarea maxlength="3000" class=\"textarea' + element.size + '\" type=\"' + element.type + '\" id=\"' + element.idOrName + '\" name=\"' + element.idOrName + '\" ' + requiredElement + ' placeholder=\"' + element.placeholder + '\">' + value + '</textarea>');

                } else if (element.type === 'INPUT') {
                    jQuery('.page-item .profile-info')
                            .find('.buttons-container')
                            .before('<div customConfiguredField = true class=\"field-group\"> <label for=\"' + element.idOrName + '\">' + element.label + requiredSpan + '</label> ' +
                                    '<input class=\"text ' + element.size + '\" type=\"' + element.type + '\" id=\"' + element.idOrName + '\" name=\"' + element.idOrName + '\" ' + requiredElement + ' placeholder=\"' + element.placeholder + '\" value=\"' + value + '\"></input>' +
                                    '<p class="help-block">' + element.helpDesk + '</p>');
                } else if (element.type === 'SELECT') {
                    var optionsArray = new Array();
                    optionsArray = (element.options).split(' ~ ');
                    var optionsHtml = '', j = 0, selected = '';
                    for (j = 0; j < optionsArray.length - 1; j++) {
                        optionsHtml = optionsHtml + '<option>' + optionsArray[j] + '</option>'
                    }
                    jQuery('.page-item .profile-info')
                            .find('.buttons-container')
                            .before('<div customConfiguredField = true class=\"field-group\"> <label for=\"' + element.idOrName + '\">' + element.label + '</label> ' +
                                    '<select class="select ' + element.size + '\" type=\"' + element.type + '\" id=\"' + element.idOrName + '\" name=\"' + element.idOrName + '\" >' + optionsHtml + '</select>');

                    jQuery('#' + element.idOrName).val(value);

                } else if (element.type === 'LABEL') {
                    jQuery('.page-item .profile-info')
                            .find('.buttons-container')
                            .before('<h2>' + element.label + '</h2>');
                } else if (element.type === 'USERPICKER') {
                    var values;
                    if (value.indexOf('~') > 0) {
                        values = value.split('~');
                    } else {
                        values = ["" + value + ""];
                    }
                    jQuery('.page-item .profile-info')
                            .find('.buttons-container')
                            .before('<div customConfiguredField = true class=\"field-group\"> <label for=\"' + element.idOrName + '\">' + element.label + requiredSpan + '</label> ' +
                                    '<input id=\"' + element.idOrName + '\" class=\"customFieldUsers\" name=\"' + element.idOrName + '\" ' + requiredElement + '"  value="' + values.toString() + '">  </input>' +
                                    '');
                    var inputElement = jQuery("#" + element.idOrName);
                    getUsernames(values, element.idOrName, inputElement);
                } else if (element.type === 'DATE') {
                    jQuery('.page-item .profile-info')
                            .find('.buttons-container')
                            .before('<div customConfiguredField = true class=\"field-group\"> <label for=\"' + element.idOrName + '\">' + element.label + requiredSpan + '</label> ' +
                                    '<input type=\"' + 'text' + '\" id=\"' + element.idOrName + '\" name=\"' + element.idOrName + '\" ' + requiredElement + ' placeholder=\"' + element.placeholder + '\" value=\"' + value + '\"  class=\"text ' + element.size + '\" data-none-message=\"No users found\" data-resize-to-input=\"true\" datefield=true ></input>' + // class="text long-field autocomplete-user" type="text" placeholder="Fill in just one user" 
                                    '<p class="help-block">' + element.helpDesk + '</p>');

                    AJS.$('#' + element.idOrName).datePicker({'overrideBrowserDefault': true});
                }
            }
        }
    }
    jQuery('.profile-info,.profile-main,#user-profile,form[name="editUser"]').attr('style', 'display: table-cell !important;');
}

function getProfilePicture(userName) {
    $.ajax({
        cache:false,
        url: AJS.params.contextPath + "/rest/userprofile/1.0/userProfilePictureManager/getProfilePic",
        type: "GET",
        data: { user : userName },
        dataType: "text",
        contentType: 'application/json',
        async: false,
        success: function (data) {
            userPicture = data;
            jQuery('.profile-main').prepend('<div id=\"photoo\"><h1>Profile Picture</h1><br>' + userPicture + '</div><br>').addClass("office-admin-profile-pic-container");
            getUserProfileLink(userName);
        },
        error: function (data) {
            userPicture = "";
            jQuery('.profile-main').prepend('<div id=\"photoo\"><h1>Profile Picture</h1><br><img id="profilePicPlaceholder" class="userPicture"></img></div><br>').addClass("office-admin-profile-pic-container");
            getUserProfileLink(userName);
        }
    });
}

function saveNativeFields(userName) {
    var profileInfo;
    if (formLayout.length <= 0) {
        profileInfo = jQuery('.profile-info,#admin-body-content');
    } else {
        profileInfo = jQuery('.profile-info,#admin-body-content').find('div[customconfiguredfield="true"]');
    }
    var fullNameValue = profileInfo.find("label:contains('Full Name')").closest('div[customconfiguredfield="true"],div[".field-group"]').find('input').val();
    var emailValue = profileInfo.find("label:contains('Email')").closest('div[customconfiguredfield="true"],div[".field-group"]').find('input').val();
    var phoneValue = profileInfo.find("label:contains('Phone')").closest('div[customconfiguredfield="true"],div[".field-group"]').find('input').val();
    var imValue = profileInfo.find("label:contains('IM')").closest('div[customconfiguredfield="true"],div[".field-group"]').find('input').val();
    var websiteValue = profileInfo.find("label:contains('Website')").closest('div[customconfiguredfield="true"],div[".field-group"]').find('input').val();
    var positionValue = profileInfo.find("label:contains('Position')").closest('div[customconfiguredfield="true"],div[".field-group"]').find('input').val();
    var departmentValue = profileInfo.find("label:contains('Department')").closest('div[customconfiguredfield="true"],div[".field-group"]').find('input').val();
    var locationValue = profileInfo.find("label:contains('Location')").closest('div[customconfiguredfield="true"],div[".field-group"]').find('input').val();
    var aboutMeValue = profileInfo.find("label:contains('About Me')").closest('div[customconfiguredfield="true"],div[".field-group"]').find('textarea').val();
    var ajaxA = $.ajax({
        url: AJS.params.contextPath + "/plugins/userprofile/saveuserinfo.action",
        type: "POST",
        data: {
            userName: userName,
            fullName: fullNameValue,
            email: emailValue,
            phone: phoneValue,
            im: imValue,
            website: websiteValue,
            position: positionValue,
            department: departmentValue,
            location: locationValue,
            aboutMe: aboutMeValue
        },
        dataType: "text",
        success: function (data) {
//            alert("Successfully Updated..!!!");
        },
        complete: function (data) {
            var url = window.location.href;
            if(url.indexOf('doedituser.action') >= 0) {
                window.location = url.substring(0, url.indexOf('doedituser.action')) + "viewuser.action?username="+userName;
            } else if (url.indexOf('edituser.action') >= 0) {
                window.location = url.replace('edituser.action', 'viewuser.action');
            } else if (url.indexOf('editmyprofile.action') >= 0) {
                window.location = url.replace('editmyprofile.action', 'viewmyprofile.action');
            } else {
                window.location.reload();
            }
        }
    });
}

function licenseValidation() {
    jQuery.ajax({
        url: AJS.contextPath() + "/rest/userProfile/1.0/userProfileManager/checkLicenseIsValid",
        type: "GET",
        success: function (data) {
            if (data != "SUCCESS") {
                jQuery('.profile-main').prepend(data);
            }
        }
    });
}

function scrapeHtmlAndJs(){
   /* This code affects in below cases, 
    1.edit profile button on right top for all users
    2.edit profile of others as an admin*/

    jQuery('#editmyprofileform .field-group input, #editmyprofileform .field-group textarea, form[name="editUser"] .field-group input, form[name="editUser"] .field-group textarea').each(function(e){
        var fieldContent=jQuery(this).val();
        var filteredContent1=fieldContent.replace(/(<[A-Za-z][A-Za-z0-9]*>)/g,""); //removing <b> like tags
        var filteredContent2=filteredContent1.replace(/(<\/[A-Za-z][A-Za-z0-9]*>)/g,""); //remoing </br> like tags
        jQuery(this).val(filteredContent2); 
    }); 
}

function isSafari() {
    if (navigator.userAgent.search("Safari") >= 0) {
        return true;
    } else
        return false;
}

function loadLinkHover() {
    // global list of IDs to ensure user-hovers don't get reloaded unnecessarily
    var users = [],
            contextPath = AJS.Confluence.getContextPath(),
            $ = AJS.$;

    var contentHoverPostProcess = function(id) {

        var username = users[id],
                data = {username: username, target: this};
        $(self).trigger("hover-user.open", data);
        $(".ajs-menu-bar", this).ajsMenu();
        $(".follow-icon, .unfollow-icon", this).each(function() {
            var $this = $(this).click(function(e) {
                if ($this.hasClass("waiting")) {
                    return;
                }
                var url = $this.hasClass("unfollow-icon") ? "/unfollowuser.action" : "/followuser.action";
                $this.addClass("waiting");
                AJS.safe.post(contextPath + url + "?username=" + username + "&mode=blank", function() {
                    $this.removeClass("waiting");
                    $this.parent().toggleClass("follow-item").toggleClass("unfollow-item");
                    $(self).trigger("hover-user.follow", data);
                    alert(data);
                });
                return AJS.stopEvent(e);
            });
        });
    };

    var selectors = [
        "span.user-hover-trigger",
        "a.confluence-userlink",
        "div.confluence-userlink",
        "img.confluence-userlink",
        "a.userLogoLink"
    ].join(", ");

    $(selectors).filter("[data-processed!=false]").each(function() {
        var userlink = $(this),
                username = userlink.attr("data-username");

        // Ensure no "popup" title will clash with the user hover.
        userlink.attr("title", "")
                .attr("data-processed", "true");
        $("img", userlink).attr("title", "");

        var arrayIndex = $.inArray(username, users);
        if (arrayIndex == -1) {
            users.push(username);
            arrayIndex = $.inArray(username, users);
        }
        $(this).addClass("userlink-" + arrayIndex);
    });
    $.each(users, function(i) {
        $(".userlink-" + i).unbind("mousemove").unbind("mouseover").unbind("mouseout");
       // AJS.contentHover($(".userlink-" + i), i, contextPath + "/users/userinfopopup.action?username=" + users[i], contentHoverPostProcess);
    });
    Confluence.Binder.userHover(); // This JS function must be called in order to bind users mini profile.
}

function getUserFullName(idOrName, userName){
    jQuery.ajax({
            url: AJS.contextPath() + "/rest/userProfile/1.0/userProfileFieldsManager/getFullName?userName="+userName,
            type: "GET",
            success: function (response) {                       
                jQuery('a#'+idOrName).text(response);
            }
        })
}

function displayProfilePic(){
      var userId;
      var currentUser = AJS.params.remoteUser.toString();
      if ((window.location.pathname).indexOf('/display/~') !== - 1) {
            userId = (window.location.pathname).substring((window.location.pathname).indexOf("~") + 1)
      } else if ((window.location.href).indexOf('viewuserprofile.action?username=') !== - 1) {
            userId = (window.location.search).substring((window.location.search).indexOf("=") + 1);
      } else if ((window.location.pathname).indexOf('viewuserprofile.action') !== - 1) {
            userId = AJS.params.remoteUser;
      }
      else{
            userId = AJS.params.remoteUser;
      }
      userId = decodeURIComponent(userId);

      if(userId == currentUser){
        showChangeProfilePicOption();
      }
}


function checkIfAnotherUserProfilePluginIsInstalled(){
    jQuery.ajax({
            url: AJS.contextPath() + "/rest/userProfile/1.0/userProfileManager/isAnotherUserProfilePluginIsInstalled",
            type: "GET",
            success: function (data) {
                if(data != "FALSE" && jQuery("#multipleUserProfileWarning").length == 0){
                    AJS.messages.warning("body", {
                        id  : "multipleUserProfileWarning",   
                        body: AJS.I18n.getText("officeadmin.multiple.userprofileplugin.warning",data)
                    });
                }
            }
        });
}

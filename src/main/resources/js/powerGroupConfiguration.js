var usersListInPowerGroup = [], groupsListInPowerGroup = [], NoResultsLabel = "No Results",usersArray=[];
AJS.toInit(function () {
    
    var check = window.location.pathname;
    if (check == AJS.contextPath() + '/admin/oa/powergroup.action') {
        /****** Events for Single User *****/
        showUsersListInPowerGroup();

        //On add User form submit
        jQuery(document).on('submit', '#configurePowerGroupForUserForm', function (e) {
            e.preventDefault();
            var userName = AJS.$("#addUserInPowerGroup").val();
            if (userName === "" || userName === undefined || userName.length <= 0) {
                alert("Input field cannot be empty");
                return false;
            }
            saveUser("user", userName);
            AJS.$("#addUserInPowerGroup").val("");
        });

        //remove user from power group
        jQuery(document).on('click', '.removeUserFromPowerGroup', function (e) {
            var userName = jQuery(e.target).closest('#closeable-label-nourl').text();
            jQuery(e.target).closest('#closeable-label-nourl').remove();
            removeUser("user", userName);
        });
       

        /****** Events for Groups *****/
        showGroupsListInPowerGroup();

        //On add group form submit
        jQuery(document).on('submit', '#configurePowerGroupForGroupForm', function (e) {
            e.preventDefault();
            var groupName = AJS.$("#addGroupInPowerGroup").val();
            if (groupName === "" || groupName === undefined || groupName.length <= 0) {
                alert("Input field cannot be empty");
                return false;
            }
            saveUser("group", groupName);
            AJS.$("#addGroupInPowerGroup").val("");
        });

        //remove group from power group
        jQuery(document).on('click', '.removeGroupFromPowerGroup', function (e) {
            var groupName = jQuery(e.target).closest('#closeable-label-nourl').text();
            jQuery(e.target).closest('#closeable-label-nourl').remove();
            removeUser("group", groupName);
        });
        
        //
        postData = {'actionType': 'GET'};

        jQuery("#editOwnProfile").change(function () {
            if (jQuery(this).is(":checked")) {
                postData = 'true';
                EditOwnProfilePermissions(postData);
            } else {
                postData = 'false';
                EditOwnProfilePermissions(postData);
            }
        });
        getPowerUsers();
        jQuery('#addUserInPowerGroup').keyup(function(){
            var query=jQuery(this).val();
            getPowerUserAutocomplete(query);
        });     
        jQuery('#addGroupInPowerGroup').focusin(function(){
            getPowerGroupAutocomplete();
        }); 
       
    }

});


//Display users list present in power group
function showUsersListInPowerGroup() {
    usersListInPowerGroup = [];
    jQuery.ajax({
        url: AJS.contextPath() + "/rest/userProfile/poweruser/1.0/userProfilePowerGroupManager/getAllUsers",
        type: "GET",
        dataType: "json",
        contentType: 'application/json',
        success: function (data) {
            var addedUsers = "";
            for (var i = 0; i < data.length; i++) {
                usersListInPowerGroup.push(data[i].name);
                addedUsers = addedUsers + "<span id=\"closeable-label-nourl\" class=\"aui-label aui-label-closeable\">" + data[i].name + "<span class=\"aui-icon aui-icon-close removeUserFromPowerGroup\" title=\"Click here to remove User from Power Group\"></span></span>";
            }
            jQuery('#userTableContainer').html(addedUsers);
        }
    })
}

function getPowerUsers() {
    jQuery.ajax({
        url: AJS.contextPath() + "/rest/userProfile/poweruser/1.0/userProfilePowerGroupManager/powerUserPicker",
        type: "GET",
        contentType: "application/json",
        success: function (data) {
            usersArray = [];
            for (var i = 0; i < data.length; i++) {
                usersArray.push(data[i].name);
            }
        }
    });
}
function getPowerUserAutocomplete(query) {
    jQuery.ajax({
        url: AJS.contextPath() + "/rest/prototype/1/search/user.json?max-results=10&query=" + query+"&show-unlicensed=true",
        type: "GET",
        contentType: "application/json",
        success: function (data) {
            jQuery("#addUserInPowerGroup").autocomplete({
                source: function (request, response) {
                    var newArr;
                    newArr = data.result.filter(function (val) {
                        return usersArray.indexOf(val.title) == -1;
                    });
                    var newResp=jQuery.map(newArr, function (item) {
                        return {
                            label: item.title,
                            value: item.username,
                            icon: item.thumbnailLink.href
                        };
                    }
                    );
                    response(newResp);
                    if (newArr.length <= 0) {
                        results = [NoResultsLabel];
                        response(results);
                    }
                },
                focus: function (event, ui) {
                    jQuery("#addUserInPowerGroup").val(jQuery('#ui-active-menuitem').find('#selectedValue').text());
                    return false;
                },
                select: function (event, ui) {
                    jQuery("#addUserInPowerGroup").val(jQuery('#ui-active-menuitem').find('#selectedValue').text());
                    return false;
                },
                create: function () {
                    jQuery(this).data('autocomplete')._renderItem = function (ul, item) {
                        jQuery(ul).addClass('aui-dropdown floorplan-dropdown powerGroupPage');
                        if (item.value == "No Results" && item.label == "No Results") {
                            return $('<li>').append(item.value).appendTo(ul);
                        } else {
                            return $('<li>')
                                    .append("<img src=" + item.icon + "><a href=" + AJS.contextPath() + "/display/~" + item.label + "><span>" + item.label + " (" + item.value + ") </span><span id='selectedValue' style='display:none'>" + item.value + "</span></span></a>")
                                    .appendTo(ul);
                        }
                    };
                }
            });
        }
    })
}

function getPowerGroupAutocomplete() {
    jQuery.ajax({
        url: AJS.contextPath() + "/rest/userProfile/poweruser/1.0/userProfilePowerGroupManager/powerGroupPicker",
        type: "GET",
        contentType: "application/json",
        success: function (data) {
            jQuery("#addGroupInPowerGroup").autocomplete({
                source: function (request, response) {
                    var results = $.ui.autocomplete.filter(data, request.term);
                    if (!results.length) {
                        results = [NoResultsLabel];
                    }
                    response(results);
                },
                max: 10,
                notFound: function(term) {
                    return "No items were found starting with \"" + term + "\"";
                },
                focus: function( event, ui ) {
                    jQuery( "#addGroupInPowerGroup" ).val( jQuery('#ui-active-menuitem').find('#selectedValue').text());
                    return false;
                },
                select: function( event, ui ) {
                     jQuery( "#addGroupInPowerGroup" ).val( jQuery('#ui-active-menuitem').find('#selectedValue').text());
                     return false;
                },
                create: function () {
                    jQuery(this).data('autocomplete')._renderItem = function (ul, item) {
                        jQuery(ul).addClass('aui-dropdown floorplan-dropdown powerGroupPage');
                        if(item.value== "No Results" && item.label == "No Results"){
                            return $('<li>').append(item.value).appendTo(ul);
                        }else {
                            return $('<li>')
                                .append("<img src="+AJS.contextPath()+"/images/icons/avatar_group_48.png><a href=#><span>" + item.value +"</span><span id='selectedValue' style='display:none'>"+item.value+"</span></span></a>")
                                .appendTo(ul);
                        }
                    };
                }
            });
        }
    })
}

//Display groups list present in power group
function showGroupsListInPowerGroup() {
    groupsListInPowerGroup = [];
    jQuery.ajax({
        url: AJS.contextPath() + "/rest/userProfile/poweruser/1.0/userProfilePowerGroupManager/getAllGroups",
        type: "GET",
        dataType: "json",
        contentType: 'application/json',
        success: function (data) {
            var addedUsers = "";
            for (var i = 0; i < data.length; i++) {
                groupsListInPowerGroup.push(data[i].name);
                addedUsers = addedUsers + "<span id=\"closeable-label-nourl\" class=\"aui-label aui-label-closeable\">" + data[i].name + "<span class=\"aui-icon aui-icon-close removeGroupFromPowerGroup\" title=\"Click here to remove group from Power Group\"></span></span>";
            }
            jQuery('#groupTableContainer').html(addedUsers);
        }
    })
}

//Save single user in power group
function saveUser(type, userName) {
    var postData = JSON.stringify({"type": type, "name": userName});
    jQuery.ajax({
        url: AJS.contextPath() + "/rest/userProfile/poweruser/1.0/userProfilePowerGroupManager/saveUser",
        type: "POST",
        data: postData,
        dataType: "json",
        contentType: 'application/json',
        success: function (data) {
            if (type === "user") {
                showUsersListInPowerGroup();
            }
            else if (type === "group") {
                showGroupsListInPowerGroup();
            }
            getPowerUsers();
        }
    });
}


//Remove entry from Power group
function removeUser(userType, userName) {
    var postData = JSON.stringify({"type": userType, "name": userName});
    jQuery.ajax({
        url: AJS.contextPath() + "/rest/userProfile/poweruser/1.0/userProfilePowerGroupManager/removeUser",
        type: "DELETE",
        data: postData,
        dataType: "json",
        contentType: 'application/json',
        success: function (data) {
            if (userType === "user") {
                showUsersListInPowerGroup();
            }
            else if (userType === "group") {
                showGroupsListInPowerGroup();
            }
            getPowerUsers();

        }
    })
}



function EditOwnProfilePermissions(postData) {
    jQuery.ajax({
        url: AJS.contextPath() + "/rest/userProfile/poweruser/1.0/editProfile/permission/"+postData,
        type: "PUT",
        contentType: "application/json",
        success: function (data) {
            var result = data;
            if (result == "true") {
                jQuery('#editOwnProfile').prop('checked', true);
            }
        }
    });
}
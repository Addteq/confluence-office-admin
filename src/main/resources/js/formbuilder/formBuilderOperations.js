function findDuplicates() {
    var arr = [];
    var allFields = jQuery('#build #target div.control-group');
    allFields.each(function(index) {
        var id = jQuery(this).find('.controls').children().prop('id');
        arr.push(id);
    });

    var i,
    len = arr.length,
    out = [],
    obj = {};

    for (i = 0; i < len; i++) {
        if (obj[arr[i]] != null) {
            if (!obj[arr[i]]) {
                out.push(arr[i]);
                obj[arr[i]] = 1;
            }
        } else {
            obj[arr[i]] = 0;
        }
    }
    return out;
}

/**
 * This method is used to collect all the fields and parse them that are to be saved in the database.
 * This is called upon the save form method
 */
function saveConfigurationForm() {
    var popOver = jQuery('.popover.fade.right.in .popover-content').length;
    if(popOver > 0) {
        alert('Please configure the Fields first and then hit the Save Form button');
        return;
    }    
    var postData = [], required;

    var allFields = jQuery('.fields form div.control-group');
    allFields.each(function(index) {
        var removedField;     
        var controlLabel = jQuery(this).find('.control-label');
        var controls = jQuery(this).find('.controls').children().prop('tagName');
        var id = jQuery(this).find('.controls').children().prop('id');
        
        if(controls === 'TEXTAREA') {
            var placeholder = jQuery(this).find('.controls').children().text();
            required = jQuery(this).find('.controls').children().prop('required');
        } else if(controls === 'INPUT') {
            var placeholder = jQuery(this).find('.controls').children().prop('placeholder');
            required = jQuery(this).find('.controls').children().prop('required');
        }

        var size = jQuery(this).find('.controls').children().prop('class');
        var help = jQuery(this).find('.controls').children().next().text();
        var optionString;
        if(controls === 'SELECT') {
            optionString = '';
            var options = jQuery(this).find('.controls').find('option');
            options.each(function(index) {
                optionString = optionString + jQuery(this).text() + ' ~ ';
            });
            required = jQuery(this).find('.controls').children().prop('required');
        }
        
        if(controls === 'LABEL') {
            controlLabel = jQuery(this).find('.controls');            
        }
        
        if(controls === 'INPUT' && jQuery(this).find('.controls').children().attr('isUserPicker') === 'true') {
            controls = 'USERPICKER';
            required = jQuery(this).find('.controls').children().prop('required');
        }
        
        if(controls === 'INPUT' && jQuery(this).find('.controls').children().attr('isDate') === 'true') {
            controls = 'DATE';
            placeholder = jQuery(this).find('.controls').children().attr('dateFormat');
            required = jQuery(this).find('.controls').children().prop('required');
        }
        if(jQuery(this).hasClass('removed')){
            removedField = true;
        }else{
            removedField = false;
        }
        postData.push(JSON.stringify({
            'type': controls,
            'idOrName': id,
            'label': jQuery.trim(controlLabel.text()),
            'helpDesk': help,
            'placeholder': placeholder,
            'size': size,
            'options': optionString,       
            'required': required,
            'removedField':removedField
        }));
    });

    if (postData.length > 0) {
        jQuery.ajax({
            url: AJS.contextPath() + "/rest/userProfile/1.0/userProfileManager/saveFormBuilder",
            type: "POST",
            data: "[" + postData + "]",
            dataType: "json",
            contentType: 'application/json',
            success: function(data) {
                location.reload(); 
            }
        });
    } else {
        alert('Please drag and drop atleast one element');
    }
        

}

function viewConfigurationForm() {
   
    jQuery.ajax({
        url: AJS.contextPath() + "/rest/userProfile/1.0/userProfileManager/getFormBuilder",
        type: "GET",
        dataType: "json",
        success: function(data) {           
                renderEditFormBuilder(data);
        }
    });
}

function addRemovedField(removedField) {
    
    jQuery('#removedFields form').append(removedField);
    jQuery('#removedFields form .control-group').last().addClass('removed').css({"margin-bottom":"0px"});
    jQuery('#removedFields form .control-group').last().find('.controls').children().first().attr("disabled", "disable").css("cursor", "pointer");    
    if(jQuery('#removedFields form .control-group').last().find('.controls').children().first().is('textarea')){
            jQuery('#removedFields form .control-group').last().css('min-height', '70px');
    } else {
            jQuery('#removedFields form .control-group').last().css('min-height', '50px');
    }
    if (jQuery('#removedFields form .control-group').last().find('.controls a').length == 0) {
        jQuery('#removedFields form .control-group').last().find('.controls').children().first()
                .after('<a href="#" class="aui-button aui-button-subtle" id="delete" title="Delete Permanently" style="margin-right:6px"><span class="aui-icon aui-icon-small aui-iconfont-delete"></span></a> <a title="Put Back" class="aui-button aui-button-subtle" style="padding-right: 10px;" href="#" id="undo"><span class="aui-icon aui-icon-small aui-iconfont-undo"></span></a> ')
    }    
    if (!jQuery('#removedFields form .control-group').last().find('.controls').children().first().is('label')){
            jQuery('#removedFields form .control-group').last().find('label, .controls').css('padding-top', '10px');
            jQuery('#removedFields form .control-group').last().find('label, .controls').children().first().css('margin-left', '-19px');
            jQuery('#removedFields form .control-group').last().find('label').css('margin-left', '45px');
    }
    else{
            jQuery('#removedFields form .control-group').last().find('label').css('padding-top', '10px');
            jQuery('#removedFields form .control-group').last().find('a').css('padding-top', '5px');
    }
    
    if (jQuery('#removedFields form .control-group').last().find('.controls label').length > 0) {
            jQuery('#removedFields form .control-group').last().find('.controls label').css("float", "left");
    }

}

function handleRemovedFields() {
    var allFields = jQuery('#build form div.control-group');
    var removedFieldId = jQuery('#removedFields form div.control-group');
    allFields.each(function (index) {
        var getId = jQuery(this).find('.controls').children().first().attr('id').toString();
        if (isElementRemoved.indexOf(getId) >= 0 && jQuery(removedFieldId).find("#" + getId).length <= 0) {
            addRemovedField(this);
        }
        if (jQuery(removedFieldId).find("#" + getId).length > 0) {
            jQuery(this).closest('.control-group').remove();
        }
    });
    
    var undoFieldId = getCookie("undoFieldId");
    if (undoFieldId != "") {
        jQuery("#build form .control-group").each(function () {
            if (jQuery(this).find('.controls').children().first().attr('id') == undoFieldId) {
                jQuery(this).wrapAll('<div id="overlay" style="border-left: 5px solid #326ca6; background-color:#f5f5f5;">');
                if(jQuery(this).find('.controls').children().first().is('textarea')){
                       jQuery('#overlay').css('height','100px');
                }else{
                    jQuery('#overlay').css('height','70px');
                }
                if(!jQuery(this).find('.controls').children().first().is('label'))
                    jQuery(this).find('label, .controls').css('padding-top','20px');
                else
                    jQuery(this).find('label').css('padding-top','20px');
                
                jQuery(this).parent('#overlay').delay(2000).fadeOut('medium',function(){
                   jQuery('#overlay').removeAttr('style');
                   //jQuery(this).find('label, .controls').removeAttr('style');
                   document.cookie = "undoFieldId=";
                });
            }
        });
    }
}

/**
 * Method used to render fields on the configure form which are present in the AO.
 * The bootstrap builder accepts a particular set of data which is in form of a json. 
 * @param {type} listOfRecords
 */
function renderEditFormBuilder(listOfRecords) {
    
    formBuilderEditContent = '[{ "title" : "Form Name", "fields": {"name" : {"label"   : "Form Name", "type"  : "input", "value" : "Drop Components Below"}}}';
    
    if(listOfRecords.length > 0) {
        var i = 0;
        isElementRemoved = [];
        fieldIds = [];
        for(i = 0; i < listOfRecords.length ; i++) {
            var element = listOfRecords[i];
            fieldIds.push(element.idOrName);
                if(element.removedField)
                    isElementRemoved.push(element.idOrName)
                
                if (element.type === 'TEXTAREA') {
                    formBuilderEditContent = formBuilderEditContent + ',{ "title": "Text Area", "fields": { "id": { "label": "ID / Name", "type": "input", "value": "' + element.idOrName + '" }, "label": { "label": "Label Text", "type": "input", "value": "' + element.label + '" }, "textarea": {"label": "Starting Text", "type": "textarea", "value": "' + element.placeholder + '" }, "required":{"label":"Required","type":"checkbox","value":' + element.required + '}  } }';
                } else if (element.type === 'INPUT') {
                    var inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    if (element.size === 'input-mini') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":true},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-small') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":true},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-medium') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":true},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-large') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":true},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-xlarge') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-xxlarge') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":true}]}';
                    }

                    formBuilderEditContent = formBuilderEditContent + ',{"title":"Text Input", "fields": {"id":{"label":"ID / Name","type":"input","value":"' + element.idOrName + '"},"label":{"label":"Label Text","type":"input","value":"' + element.label + '"},"placeholder":{"label":"Placeholder","type":"input","value":"' + element.placeholder + '"},"helptext":{"label":"Help Text","type":"input","value":"' + element.helpDesk + '"},"required":{"label":"Required","type":"checkbox","value":' + element.required + '},' + inputsize + '}}';

                } else if (element.type === 'SELECT') {
                    var optionsArray = new Array();
                    optionsArray = (element.options).split(' ~ ');
                    var optionsHtml = '', j = 0;
                    optionsHtml = '["' + optionsArray[0] + '"';
                    for (j = 1; j < optionsArray.length - 1; j++) {
                        optionsHtml = optionsHtml + ',"' + optionsArray[j] + '"';
                    }
                    optionsHtml = optionsHtml + ']';
                    var inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    if (element.size === 'input-mini') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":true},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-small') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":true},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-medium') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":true},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-large') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":true},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-xlarge') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-xxlarge') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":true}]}';
                    }

                    formBuilderEditContent = formBuilderEditContent + ',{"title":"Select Basic","fields":{"id":{"label":"ID / Name","type":"input","value":"' + element.idOrName + '"},"label":{"label":"Label Text","type":"input","value":"' + element.label + '"},"options":{"label":"Options","type":"textarea-split","value":' + optionsHtml + '},"required":{"label":"Required","type":"checkbox","value":' + element.required + '},' + inputsize + '}}';

                } else if (element.type === 'LABEL') {
                    formBuilderEditContent = formBuilderEditContent + ',{"title":"Prepended Text","fields":{"id":{"label":"ID / Name","type":"input","value":"' + element.idOrName + '"},"label":{"label":"Label Text","type":"input","value":"' + element.label + '"}}}';

                } else if (element.type === 'USERPICKER') {
                    var inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    if (element.size === 'input-mini') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":true},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-small') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":true},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-medium') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":true},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-large') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":true},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-xlarge') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-xxlarge') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":true}]}';
                    }

                    formBuilderEditContent = formBuilderEditContent + ',{"title":"Appended Text", "fields": {"id":{"label":"ID / Name","type":"input","value":"' + element.idOrName + '"},"label":{"label":"Label Text","type":"input","value":"' + element.label + '"},"placeholder":{"label":"Placeholder","type":"input","value":"' + element.placeholder + '"}, "required":{"label":"Required","type":"checkbox","value":' + element.required + '},' + inputsize + '}}';

                } else if (element.type === 'DATE') {
                    var inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    if (element.size === 'input-mini') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":true},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-small') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":true},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-medium') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":true},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-large') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":true},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-xlarge') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}';
                    } else if (element.size === 'input-xxlarge') {
                        inputsize = '"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":false},{"value":"input-xxlarge","label":"Xxlarge","selected":true}]}';
                    }

                    var dateFormat = '"dateFormat": {"label": "Date Format", "type": "select", "value": [{"value": "yyyymmdd","label": "yyyy-mm-dd","selected": true},{"value": "fuzzy","label": "Fuzzy Timestamp","selected": false}]}';
                    if (element.placeholder === 'fuzzy') {
                        dateFormat = '"dateFormat": {"label": "Date Format", "type": "select", "value": [{"value": "yyyymmdd","label": "yyyy-mm-dd","selected": false},{"value": "fuzzy","label": "Fuzzy Timestamp","selected": true}]}';
                    }
                    formBuilderEditContent = formBuilderEditContent + ', {"title":"Appended Checkbox", "fields": {"id":{"label":"ID / Name","type":"input","value":"' + element.idOrName + '"},"label":{"label":"Label Text","type":"input","value":"' + element.label + '"},"helptext":{"label":"Help Text","type":"input","value":"' + element.helpDesk + '"}, "required":{"label":"Required","type":"checkbox","value":' + element.required + '},' + inputsize + ',' + dateFormat + '}}';

                }            
            }
        
        formBuilderEditContent = formBuilderEditContent + ']';
//        alert(formBuilderEditContent);
        jQuery('#qwerty').html((formBuilderEditContent));        

    } else {
 
        var defaultFields = ',{"title":"Prepended Text","fields":{"id":{"label":"ID / Name","type":"input","value":"'+'userparam-personal'+'"},"label":{"label":"Label Text","type":"input","value":"'+'Personal'+'"}}}';

        defaultFields = defaultFields +',{"title":"Text Input", "fields": {"id":{"label":"ID / Name","type":"input","value":"'+'fullName'+'"},"label":{"label":"Label Text","type":"input","value":"'+'Full Name'+'"},"placeholder":{"label":"Placeholder","type":"input","value":"'+'placeholder'+'"},"helptext":{"label":"Help Text","type":"input","value":""},"required":{"label":"Required","type":"checkbox","value":'+true+'},'+'"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}'+',"defaultId":{"label":"defaultId","type":"input","value":"'+'email'+'"}}}';
        
        defaultFields = defaultFields + ',{"title":"Text Input", "fields": {"id":{"label":"ID / Name","type":"input","value":"'+'email'+'"},"label":{"label":"Label Text","type":"input","value":"'+'Email'+'"},"placeholder":{"label":"Placeholder","type":"input","value":"'+'placeholder'+'"},"helptext":{"label":"Help Text","type":"input","value":""},"required":{"label":"Required","type":"checkbox","value":'+true+'},'+'"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}'+'}}';
        
        defaultFields = defaultFields + ',{"title":"Text Input", "fields": {"id":{"label":"ID / Name","type":"input","value":"'+'userparam-phone'+'"},"label":{"label":"Label Text","type":"input","value":"'+'Phone'+'"},"placeholder":{"label":"Placeholder","type":"input","value":"'+'placeholder'+'"},"helptext":{"label":"Help Text","type":"input","value":""},"required":{"label":"Required","type":"checkbox","value":'+false+'},'+'"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}'+'}}';

        defaultFields = defaultFields + ',{"title":"Text Input", "fields": {"id":{"label":"ID / Name","type":"input","value":"'+'userparam-im'+'"},"label":{"label":"Label Text","type":"input","value":"'+'IM'+'"},"placeholder":{"label":"Placeholder","type":"input","value":"'+'placeholder'+'"},"helptext":{"label":"Help Text","type":"input","value":""},"required":{"label":"Required","type":"checkbox","value":'+false+'},'+'"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}'+'}}';
        
        defaultFields = defaultFields + ',{"title":"Text Input", "fields": {"id":{"label":"ID / Name","type":"input","value":"'+'userparam-website'+'"},"label":{"label":"Label Text","type":"input","value":"'+'Website'+'"},"placeholder":{"label":"Placeholder","type":"input","value":"'+'placeholder'+'"},"helptext":{"label":"Help Text","type":"input","value":""},"required":{"label":"Required","type":"checkbox","value":'+false+'},'+'"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}'+'}}';

        defaultFields = defaultFields + ',{"title":"Text Area", "fields": {"id":{"label":"ID / Name","type":"input","value":"'+'about-me'+'"},"label":{"label":"Label Text","type":"input","value":"'+'About Me'+'"},"placeholder":{"label":"Starting Text","type":"input","value":"'+'placeholder'+'"}'+'}}';

        defaultFields = defaultFields +  ',{"title":"Prepended Text","fields":{"id":{"label":"ID / Name","type":"input","value":"'+'userparam-company'+'"},"label":{"label":"Label Text","type":"input","value":"'+'Company'+'"}}}';
        
        defaultFields = defaultFields + ',{"title":"Text Input", "fields": {"id":{"label":"ID / Name","type":"input","value":"'+'userparam-position'+'"},"label":{"label":"Label Text","type":"input","value":"'+'Position'+'"},"placeholder":{"label":"Placeholder","type":"input","value":"'+'placeholder'+'"},"helptext":{"label":"Help Text","type":"input","value":""},"required":{"label":"Required","type":"checkbox","value":'+false+'},'+'"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}'+'}}';

        defaultFields = defaultFields + ',{"title":"Text Input", "fields": {"id":{"label":"ID / Name","type":"input","value":"'+'userparam-department'+'"},"label":{"label":"Label Text","type":"input","value":"'+'Department'+'"},"placeholder":{"label":"Placeholder","type":"input","value":"'+'placeholder'+'"},"helptext":{"label":"Help Text","type":"input","value":""},"required":{"label":"Required","type":"checkbox","value":'+false+'},'+'"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}'+'}}';

        defaultFields = defaultFields + ',{"title":"Text Input", "fields": {"id":{"label":"ID / Name","type":"input","value":"'+'userparam-location'+'"},"label":{"label":"Label Text","type":"input","value":"'+'Location'+'"},"placeholder":{"label":"Placeholder","type":"input","value":"'+'placeholder'+'"},"helptext":{"label":"Help Text","type":"input","value":""},"required":{"label":"Required","type":"checkbox","value":'+false+'},'+'"inputsize":{"label":"Input Size","type":"select","value":[{"value":"input-mini","label":"Mini","selected":false},{"value":"input-small","label":"Small","selected":false},{"value":"input-medium","label":"Medium","selected":false},{"value":"input-large","label":"Large","selected":false},{"value":"input-xlarge","label":"Xlarge","selected":true},{"value":"input-xxlarge","label":"Xxlarge","selected":false}]}'+'}}';

        
        jQuery('#qwerty').html('[{ "title" : "Form Name", "fields": {"name" : {"label"   : "Label", "type"  : "input", "value" : "Drop Components Below"}}}  '+defaultFields+']');

    }
    
    
    var o = jQuery('#formBuilderSrcAndDatamain');
    o.remove();
    if (document.getElementById("formBuilderContent") !== null && document.getElementById("formBuilderContent") !== undefined) {
        embedBootstrapFormBuilder(); // Enable bootstrap form builder from here     
    }        
}
    
function getCookie(fieldId) {
    var name = fieldId + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ')
            c = c.substring(1);
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}


AJS.toInit(function() {   
    jQuery(window).load(function() {
        jQuery(document).on('mouseover','#removedFields .control-group',function(){
            jQuery(this).css({'background':'aliceblue'});
        }).on('mouseout','#removedFields .control-group',function(){
            jQuery(this).css({'background':''});
        });               
        jQuery(document).on('mouseup', '.component', function(){ 
            jQuery('.popover-content #id').prop('disabled', true); 
        });
        
        viewConfigurationForm();                
        jQuery(document).on('mousedown', '.popover-content #save', function() {
            if(jQuery('.popover-content #options').val()) {
                if(jQuery('.popover-content #options').val().indexOf('~') > -1) { 
                    alert('Cannot include \'~\' character in the options list because of its internal usage by the system. Please use some other alternative.'); 
                }
            }
        });        
        jQuery(document).on('click','#undo', function () {                
                var divField = jQuery(this).closest('.control-group');
                var idOrName = jQuery(divField).find(".controls").children().first().attr("id");
                jQuery(divField).removeClass('removed').hide();
                saveConfigurationForm();
                location.reload();       
                document.cookie = "undoFieldId=" + idOrName;
        });
        jQuery(document).on('click','#delete', function () {
            var divField = jQuery(this).closest('.control-group');
            var idOrName = jQuery(divField).find(".controls").children().first().attr("id");
            var postData = {'idOrName': idOrName};
            jQuery.ajax({
                url: AJS.contextPath() + "/rest/userProfile/1.0/userProfileManager/removeFieldFormBuilder",
                type: "DELETE",
                data: JSON.stringify(postData),
                dataType: "json",
                contentType: 'application/json',
                success: function (data) {
                    var index = isElementRemoved.indexOf(idOrName);
                    if (index > -1) {
                        isElementRemoved.splice(index, 1);
                    }
                }
            });                              
            jQuery(this).closest('.control-group').remove();
            saveConfigurationForm();
            location.reload();         
        });

    });   
});
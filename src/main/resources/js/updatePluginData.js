AJS.toInit(function () {
   jQuery(document).ready(function(){
      estimatedTimeToUpdate();
   });
});

function estimatedTimeToUpdate(){
  jQuery.ajax({
      url: AJS.params.contextPath + "/rest/userProfile/1.0/admin/getNoOfUsers",
      type: "GET",
      dataType: "text",
      success: function (data) {
          if(data>0){
              var time=(data*0.08)/60;
              time=Math.round(time);
              var string=time+ " minute(s)"
              if(time<1){
                 jQuery('#estimatedTime').text("less than one minute");
              }else{
                jQuery('#estimatedTime').text(string);  
              }
          }else{
             jQuery('#estimatedTime').text('several minutes'); 
          }
      }
  });
}
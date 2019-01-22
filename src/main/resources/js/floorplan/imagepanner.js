/**
 * Plugin for zooming and dragging of the image inside a specified viewport.
 * 
 */
AJS.toInit(function() {

    panContainer=jQuery('.pancontainer,#floorplanImage');
    panContainer.imgAreaSelect({onSelectStart: disableNote});
    panContainer.imgAreaSelect({onSelectChange: disableNote});
    jQuery(window).load(function() {
        if(jQuery('#floorplanImage').length>0){
            if (jQuery('#floorplanImage')[0].naturalWidth < viewportwidth) {
                jQuery('.cfp-buttons').css({visibility: 'hidden'});
                jQuery(".cfp-buttons.sizeSelectDialog").css({visibility: 'visible'})
            }
            if (isEditable === "false" || (userAllotedAreaId !== undefined && userAllotedAreaId !== null && userAllotedAreaId !== "")) {
                jQuery('.togglePlugin').css({visibility: 'hidden'});
                jQuery(".cfp-buttons.sizeSelectDialog").css({visibility: 'hidden'})
            }
        }
    });
    zoomGlobal = 1;
    beginDragging = 0;                           
});

var ddimagepanner={

	magnifyicons: ['','', 50,23], //set path to zoom in/out images, plus their dimensions
	maxzoom: 4, //set maximum zoom level (from 1x)

	init:function($, $img, options){
		var s=options
		s.imagesize=[$img.width(), $img.height()]
		s.oimagesize=[$img.width(), $img.height()] //always remember image's original size
		s.pos=(s.pos=="center")? [-(s.imagesize[0]/2-s.wrappersize[0]/2), -(s.imagesize[1]/2-s.wrappersize[1]/2)] : [0, 0] //initial coords of image
                s.pos=[Math.floor(s.pos[0]), Math.floor(s.pos[1])]
		$img.css({position:'absolute', left:s.pos[0], top:s.pos[1]})
		if (s.canzoom=="yes"){ //enable image zooming?
			s.dragcheck={h: (s.wrappersize[0]>s.imagesize[0])? false:true, v:(s.wrappersize[1]>s.imagesize[1])? false:true} //check if image should be draggable horizon and vertically
			s.$statusdiv=$('<div style="position:absolute;color:white;background:#353535;padding:2px 10px;font-size:12px;visibility:hidden">1x Magnify</div>').appendTo(s.$pancontainer) //create DIV to show current magnify level
			s.$statusdiv.css({left:0, top:s.wrappersize[1]-s.$statusdiv.outerHeight(), display:'none', visibility:'visible'})
//			$('#pancontainer').bind("mousewheel DOMMouseScroll", function(e) { e.preventDefault(); e.stopImmediatePropagation();
//                e.stopPropagation(); this.zoomfunct($, $img, s)});
                        this.zoomfunct($, $img, s)
		}
		this.dragimage($, $img, s)
                if(userAllotedAreaId !== undefined && userAllotedAreaId !== null && userAllotedAreaId !== "") {
                    jQuery('.cfp-buttons').css({visibility:'hidden'});
                }
                $imgGlobal = $img;
                sGlobal = s;
	},
        
        /**
         * This function is used when someone comes on the floorplan page from a profile page. 
         * Provides the zoom functionality after coming to the page
         */
        myProfileClickHereLink: function($, $img, s, left, top, zoomRequired) {
            jQuery("#note_" + userAllotedAreaId).hide();
            jQuery('.magnifyZoomOut').css("opacity", 1);
            var curzoom = s.curzoom; //get current zoom level
            var basepos = [s.pos[0] / curzoom, s.pos[1] / curzoom];
            var newzoom = Math.min(ddimagepanner.maxzoom, curzoom + zoomRequired); //get new zoom level
            zoomGlobal = newzoom;

            clearTimeout(s.statustimer);
            s.$statusdiv.html(newzoom + "x Magnify").show() //show current zoom status/level
            var nd = [s.oimagesize[0] * newzoom, s.oimagesize[1] * newzoom];
            var newpos = [basepos[0] * newzoom, basepos[1] * newzoom];
            newpos = [s.wrappersize[0] / 2 - nd[0] / 2,
                s.wrappersize[1] / 2 - nd[1] / 2];
            $img.animate({width: nd[0], height: nd[1], left: "-" + left, top: "-" + top}, 2500, function() {
                s.statustimer = setTimeout(function() { s.$statusdiv.hide(); }, 2500);
            });
            s.imagesize = nd;
            s.curzoom = newzoom;
            s.pos = [newpos[0], newpos[1]];
            
            jQuery('.cfp-buttons').css({visibility:'visible'});
            
            setTimeout(function(){
                if (notes.length > 0) {
                    for (var i = 0; i < notes.length; i++) {
                        var noteId = notes[i].created;
                        if(noteId === parseInt(userAllotedAreaId) ) {
                            var vleft = (notes[i].x1 * zoomGlobal) + parseFloat(jQuery('#floorplanImage')[0].style.left, 10);
                            var vtop = (notes[i].y1 * zoomGlobal) + parseFloat(jQuery('#floorplanImage')[0].style.top, 10);
                            var nwidth = notes[i].width * zoomGlobal;
                            var nheight = notes[i].height * zoomGlobal;
                            jQuery('#note_' + noteId).css({left: vleft + 'px', top: vtop + 'px', width: nwidth + 'px', height: nheight + 'px'});
                            jQuery('#notep_' + noteId).css({left: vleft + 'px', top: vtop + parseInt(nheight) + 5 + 'px'});
                            jQuery("#note_" + noteId).show();
                            jQuery("#note_" + noteId).addClass('ripple');
                        }
                    }
                }
            }, 2500);
        },
        
        zoomForSearch: function($, $img, s, left, top, zoomRequired, delay, creationId) {
            if(creationId !== "" && jQuery('#userSearch').val() !== "") {
                jQuery(".note").hide();
                $('.room').hide();
                $('.roomp').hide();
                jQuery('.dept').hide();
            }
            var taggedUsersList = notes.length;
            jQuery('.magnifyZoomOut').css("opacity", 1);
            var curzoom = s.curzoom; //get current zoom level
            var basepos = [s.pos[0] / curzoom, s.pos[1] / curzoom];
            var newzoom = Math.min(ddimagepanner.maxzoom, zoomRequired + 1); //get new zoom level
            zoomGlobal = newzoom;

            clearTimeout(s.statustimer);
            s.$statusdiv.html(newzoom + "x Magnify").show() //show current zoom status/level
            var nd = [s.oimagesize[0] * newzoom, s.oimagesize[1] * newzoom];
            var newpos = [basepos[0] * newzoom, basepos[1] * newzoom];
            newpos = [s.wrappersize[0] / 2 - nd[0] / 2,
                s.wrappersize[1] / 2 - nd[1] / 2];
            $img.animate({width: nd[0], height: nd[1], left: '-'+ left, top: '-' + top}, delay, function() {
                s.statustimer = setTimeout(function() { s.$statusdiv.hide(); }, delay);
            });
            s.imagesize = nd;
            s.curzoom = newzoom;
            s.pos = [newpos[0], newpos[1]];
            
            jQuery('.cfp-buttons').css({visibility:'visible'});
            
            setTimeout(function(){
                if (taggedUsersList > 0 && creationId !== '') {
                    for (var i = 0; i < taggedUsersList; i++) {
                        var noteId = notes[i].created;
                        if(parseInt(noteId) === creationId) {
                            var vleft = (notes[i].x1 * zoomGlobal) + parseFloat(jQuery('#floorplanImage')[0].style.left, 10);
                            var vtop = (notes[i].y1 * zoomGlobal) + parseFloat(jQuery('#floorplanImage')[0].style.top, 10);
                            var nwidth = notes[i].width * zoomGlobal;
                            var nheight = notes[i].height * zoomGlobal;
                            jQuery('#note_' + noteId).css({left: vleft + 'px', top: vtop + 'px', width: nwidth + 'px', height: nheight + 'px','line-height': nheight + 'px'});
                            jQuery('#notep_' + noteId).css({left: vleft + 'px', top: vtop + parseInt(nheight) + 5 + 'px'});
                            var newLinkIconHeight = nheight-20;
                            jQuery('#note_' + noteId + " div:first-child").find(".linkIcon").css({"top":newLinkIconHeight});
                            jQuery("#note_" + noteId).show();
                            jQuery("#note_" + noteId).addClass('ripple');
                        }
                    }
                } else {
                    for (var i = 0; i < taggedUsersList; i++) {
                        var noteId = notes[i].created;
                        var vleft = (notes[i].x1 * zoomGlobal) + parseFloat(jQuery('#floorplanImage')[0].style.left, 10);
                        var vtop = (notes[i].y1 * zoomGlobal) + parseFloat(jQuery('#floorplanImage')[0].style.top, 10);
                        var nwidth = notes[i].width * zoomGlobal;
                        var nheight = notes[i].height * zoomGlobal;
                        jQuery('#note_' + noteId).css({left: vleft + 'px', top: vtop + 'px', width: nwidth + 'px', height: nheight + 'px', 'line-height': nheight + 'px'});
                        jQuery('#notep_' + noteId).css({left: vleft + 'px', top: vtop + parseInt(nheight) + 5 + 'px'});
                        var newLinkIconHeight = nheight-20;
                        jQuery('#note_' + noteId + " div:first-child").find(".linkIcon").css({"top":newLinkIconHeight});
                        jQuery("#note_" + noteId).show();
                    }
                }
                if(jQuery('.note:visible').length==0 && jQuery('.dept:visible').length==0 && jQuery('.room:visible').length==0){
                    alert("\""+jQuery('#userSearch').val()+"\" is not tagged anywhere on floorplan.");
                }
            }, delay);
        },
        
    /**
     * Dragging image along with the area or the tagged users inside the viewport.
     * This is done by calculating the Top and Left of the image
     */
	dragimage:function($, $img, s){
		$img.mousedown(function(e){
                        beginDragging = 1;
			s.pos=[parseInt($img.css('left')), parseInt($img.css('top'))]
			var xypos=[e.clientX, e.clientY]
			$img.bind('mousemove.dragstart', function(e){
				var pos=s.pos, imagesize=s.imagesize, wrappersize=s.wrappersize
				var dx=e.clientX-xypos[0] //distance to move horizontally
				var dy=e.clientY-xypos[1] //vertically
				s.dragcheck={h: (wrappersize[0]>imagesize[0])? false:true, v:(wrappersize[1]>imagesize[1])? false:true}
				if (s.dragcheck.h==true) //allow dragging horizontally?
					var newx=(dx>0)? Math.min(0, pos[0]+dx) : Math.max(-imagesize[0]+wrappersize[0], pos[0]+dx) //Set horizonal bonds. dx>0 indicates drag right versus left
				if (s.dragcheck.v==true) //allow dragging vertically?
					var newy=(dy>0)? Math.min(0, s.pos[1]+dy) : Math.max(-imagesize[1]+wrappersize[1], pos[1]+dy) //Set vertical bonds. dy>0 indicates drag downwards versus up
				$img.css({left:(typeof newx!="undefined")? newx : pos[0], top:(typeof newy!="undefined")? newy : pos[1]})
				return false //cancel default drag action
			})
			return false //cancel default drag action
		})
		$(document).bind('mouseup', function(e){
			$img.unbind('mousemove.dragstart')
                        if (notes.length > 0) {
                            for(var i = 0; i < notes.length; i++) {
                               var noteId = notes[i].created;
                                        var vleft = (notes[i].x1 * zoomGlobal) + parseFloat(jQuery('#floorplanImage')[0].style.left, 10);
                                        var vtop = (notes[i].y1 * zoomGlobal) + parseFloat(jQuery('#floorplanImage')[0].style.top, 10);
                                        var nwidth = notes[i].width * zoomGlobal;
                                        var nheight = notes[i].height * zoomGlobal;
                                        jQuery('#note_' + noteId).css({left: vleft + 'px', top: vtop + 'px', width: nwidth + 'px', height: nheight + 'px','line-height': nheight + 'px'});
                                        jQuery('#notep_' + noteId).css({left: vleft + 'px', top: vtop + parseInt(nheight)+5 + 'px'});
                                        if(beginDragging === 1 &&  ((($.browser.mozilla)?(jQuery('#note_' + noteId).css('background-color') !== 'transparent'):(jQuery('#note_' + noteId).css('background-color') !== 'rgba(0, 0, 0, 0)')) || jQuery('#notep_' + noteId).attr('class') === 'notep')) {
                                            if((userAllotedAreaId === undefined || userAllotedAreaId === null || userAllotedAreaId === "") && (jQuery("#userSearch").val() === "")) {        
                                                $('#note_' + noteId).show();
                                            } else {
                                                jQuery("#note_" + userAllotedAreaId).show();
                                                jQuery("#note_" + zoomedInID).show();
                                            }
                                        }
                            }
                        }
                        beginDragging = 0;
		})
	},

    zoomfunct: function ($, $img, s) {
        var $toggleimage = $(' <button class="aui-button togglePlugin aui-button-primary">' +
            '<span class="aui-icon aui-icon-small aui-iconfont-devtools-tag"></span></button>')
            .css({cursor: 'pointer', zIndex: 1000, position: 'absolute',
                top: 10, left: 10, opacity: 1, width: 30, height: 30, opacity: 0.7})
            .attr("title", "Tags")
            .appendTo(s.$pancontainer)
        AJS.$($toggleimage).tooltip();
        $toggleimage.click(function (e) {
            if (toggle == true) {
                jQuery(".cfp-buttons").css({visibility: 'hidden'});
                if (!setUserPicTaggingSize || macro === 'flowdiagram') {
                    if (macro === 'floorplan')
                        panContainer.imgAreaSelect({onSelectStart: showDefaultNote});
                    else
                        panContainer.imgAreaSelect({onSelectStart: showaddnote});
                    panContainer.imgAreaSelect({onSelectChange: showaddnote});
                } else if (macro === 'floorplan' && setUserPicTaggingSize)
                    showSelectAvatarSize();
                jQuery('.togglePlugin').css('opacity', '1');
                toggle = false
            } else {
                if (jQuery('#floorplanImage')[0].naturalWidth >= viewportwidth) {
                    jQuery(".cfp-buttons").css({visibility: 'visible'})
                } else {
                    jQuery(".cfp-buttons.sizeSelectDialog").css({visibility: 'visible'})
                }
                panContainer.imgAreaSelect({onSelectStart: disableNote});
                panContainer.imgAreaSelect({onSelectChange: disableNote});
                disableNote();
                jQuery('.togglePlugin').css('opacity', '0.7');
                jQuery('.togglePlugin').removeClass('bottomBorderRadius');
                toggle = true
            }
        });

        var magnifyicons=this.magnifyicons
		var $zoomimages=$('<button class ="aui-button cfp-buttons magnifyZoomIn aui-button-primary">+</button>' +
            '<button class ="aui-button cfp-buttons magnifyZoomOut aui-button-primary">-</button>' +
            '<button class ="aui-button cfp-buttons sizeSelectDialog aui-button-primary cfp-cogIcon" style="top:100px">' +
            '<span class="aui-icon aui-icon-small aui-iconfont-configure">Select default avatar size</span></button>')
			.css({cursor:'pointer', zIndex:1000, position:'absolute', top:70, left:0, opacity:0.7})
			.attr("title", "Zoom Out")
            .appendTo(s.$pancontainer);
        if (macro === "flowdiagram"){
            jQuery(".sizeSelectDialog").css({display:"none"})
        }

        $zoomimages.eq(0).css({left:0,top:40,opacity:1}) //position "zoom in" image
            .attr("title", "Zoom In");
        $zoomimages.eq(2).css({left:0,top:100,opacity:1, width:30}) //position "zoom in" image
            .attr("title", "Select default avatar size");
        AJS.$($zoomimages).tooltip();
		$zoomimages.on("click", function (e) { //assign click behavior to zoom images
            var $zimg = $(this); //reference image clicked on
            var curzoom = s.curzoom; //get current zoom level
            if($zimg[0].classList.contains("sizeSelectDialog")){//Open Avatar size dialog event
                var message = jQuery("body").addteqNotification({title: "Click anywhere on the macro."});
                message.showGenericMsg();
                //Below event will run when new avatar size is set call is complete
                jQuery("body").on("newAvatarSizeSet", function () {
                    location.reload();
                });
                jQuery("#selectedDefaultSize").value = 16;
                showSelectAvatarSize();
                return;
            }
            var zoomtype = ($zimg.html() === '+') ? "in" : "out"
            if (zoomtype == "in" && s.curzoom == ddimagepanner.maxzoom || zoomtype == "out" && s.curzoom == 1) //exit if user at either ends of magnify levels
                return;
            var basepos = [s.pos[0] / curzoom, s.pos[1] / curzoom]
            newzoom = (zoomtype == "out") ? Math.max(1, curzoom - 1) : Math.min(ddimagepanner.maxzoom, curzoom + 1) //get new zoom level
            zoomGlobal = newzoom;
            var imgProp = [jQuery('#floorplanImage')[0].offsetLeft, jQuery('#floorplanImage')[0].offsetTop];
            if (macro != 'flowdiagram') {
                $('.note').hide();
                $('.notep').hide();
                $('.dept').hide();
                $('.deptp').hide();
                $('.room').hide();
                $('.roomp').hide();
            }
            $zoomimages.css("opacity", 1)
            if (newzoom == 1) //if zoom level is 1x, dim "zoom out" image
                $zoomimages.eq(1).css("opacity", 0.7)
            else if (newzoom == ddimagepanner.maxzoom) //if zoom level is max level, dim "zoom in" image
                $zoomimages.eq(0).css("opacity", 0.7)
            clearTimeout(s.statustimer)
            s.$statusdiv.html(newzoom + "x Magnify").show() //show current zoom status/level
            var nd = [s.oimagesize[0] * newzoom, s.oimagesize[1] * newzoom]
            var newpos = [basepos[0] * newzoom, basepos[1] * newzoom]
            newpos = [(zoomtype == "in" && s.wrappersize[0] > s.imagesize[0] || zoomtype == "out" && s.wrappersize[0] > nd[0]) ? s.wrappersize[0] / 2 - nd[0] / 2 : Math.max(-nd[0] + s.wrappersize[0], newpos[0]),
                (zoomtype == "in" && s.wrappersize[1] > s.imagesize[1] || zoomtype == "out" && s.wrappersize[1] > nd[1]) ? s.wrappersize[1] / 2 - nd[1] / 2 : Math.max(-nd[1] + s.wrappersize[1], newpos[1])]
            if (triggerByMouseScroll == false) {
                leftPos = s.oimagesize[0] / 2, topPos = s.oimagesize[1] / 2;
            }

            if (zoomtype == 'in') {
                if (imgProp[0] <= leftPos && imgProp[1] <= topPos) {
                    newpos = [(imgProp[0]) - leftPos, (imgProp[1]) - topPos];
                } else if (imgProp[0] <= leftPos) {
                    newpos = [(imgProp[0]) - leftPos, (imgProp[1])];
                } else if (imgProp[1] <= topPos) {
                    newpos = [(imgProp[0]), (imgProp[1]) - topPos];
                } else {
                    newpos = [(imgProp[0]), (imgProp[1])];
                }
                if (Math.abs(newpos[0]) >= s.imagesize[0]) {
                    newpos[0] = -(s.imagesize[0] - leftPos);
                }
                if (Math.abs(newpos[1]) >= s.imagesize[1]) {
                    newpos[1] = -(s.imagesize[1] - topPos);
                }
            } else if (zoomtype == 'out') {
                if (imgProp[0] <= leftPos && imgProp[1] <= topPos) {
                    newpos = [(imgProp[0]) + leftPos, (imgProp[1]) + topPos];
                } else if (imgProp[0] <= leftPos) {
                    newpos = [(imgProp[0]) + leftPos, (imgProp[1])];
                } else if (imgProp[1] <= topPos) {
                    newpos = [(imgProp[0]), (imgProp[1]) + topPos];
                } else {
                    newpos = [(imgProp[0]), (imgProp[1])];
                }
                if (Math.abs(newpos[0]) >= s.imagesize[0]) {
                    newpos[0] = -(s.imagesize[0] + leftPos);
                }
                if (Math.abs(newpos[1]) >= s.imagesize[1]) {
                    newpos[1] = -(s.imagesize[1] + topPos);
                }
                if (newpos[0] > 0) {
                    newpos[0] = 0;
                }
                if (newpos[1] > 0) {
                    newpos[1] = 0;
                }
            }
            if (newzoom == 1) {
                newpos[0] = 0;
                newpos[1] = 0;
            }
            $img.stop().animate({width: nd[0], height: nd[1], left: newpos[0], top: newpos[1]}, function () {
                s.statustimer = setTimeout(function () {
                    s.$statusdiv.hide()
                }, 500);
                triggerByMouseScroll = false;
            });
            s.imagesize = nd;
            s.curzoom = newzoom;
            s.pos = [newpos[0], newpos[1]]
            setTimeout(function () {
                if (notes.length > 0) {
                    for (var i = 0; i < notes.length; i++) {
                        var noteId = notes[i].created;
                        var vleft = (notes[i].x1 * newzoom) + parseFloat(jQuery('#floorplanImage')[0].style.left, 10);
                        var vtop = (notes[i].y1 * newzoom) + parseFloat(jQuery('#floorplanImage')[0].style.top, 10);
                        var nwidth = notes[i].width * newzoom;
                        var nheight = notes[i].height * newzoom;
                        jQuery('#note_' + noteId).css({
                            left: vleft + 'px',
                            top: vtop + 'px',
                            width: nwidth + 'px',
                            height: nheight + 'px',
                            'line-height': nheight + 'px'
                        });
                        jQuery('#notep_' + noteId).css({left: vleft + 'px', top: vtop + parseInt(nheight) + 5 + 'px'});
                        if ((($.browser.mozilla) ? (jQuery('#note_' + noteId).css('background-color') !== 'transparent') : (jQuery('#note_' + noteId).css('background-color') !== 'rgba(0, 0, 0, 0)')) || jQuery('#notep_' + noteId).attr('class') === 'notep') {
                            if ((userAllotedAreaId === undefined || userAllotedAreaId === null || userAllotedAreaId === "") && (jQuery("#userSearch").val() === "")) {
                                $('#note_' + noteId).show();
                            } else {
                                jQuery("#note_" + userAllotedAreaId).show();
                                jQuery("#note_" + zoomedInID).show();
                            }
                        }
                        var newLinkIconHeight = nheight - 20;
                        jQuery('#note_' + noteId + " div:first-child").find(".linkIcon").css({"top": newLinkIconHeight});
                    }
                }
            }, 500);
        })
	}
                
};


jQuery.fn.imgmover=function(options){
	var $=jQuery
	return this.each(function(){ //return jQuery obj
		if (this.tagName!="IMG")
			return true //skip to next matched element 
		var $imgref=$(this)
		if (parseInt(this.style.width)>0 && parseInt(this.style.height)>0) //if image has explicit CSS width/height defined
			ddimagepanner.init($, $imgref, options)
		else if (this.complete){ //account for IE not firing image.onload
			ddimagepanner.init($, $imgref, options)
		}
		else{
			$imgref.bind('load', function(){
				ddimagepanner.init($, $imgref, options)
			})
		}
	})
};

/**
 * This is the entry point of enabling the plugin.  
 * The viewport is generated by mapping the image which is specified a class. 
 */
jQuery(document).ready(function($){ //By default look for DIVs with class="pancontainer"
	var $pancontainer=$('div.pancontainer')
	$pancontainer.each(function(){
		var $this=$(this).css({position:'relative', overflow:'hidden', cursor:'move'})
		var $img=$this.find('img:eq(0)') //image to pan
		var options={$pancontainer:$this, pos:$this.attr('data-orient'), curzoom:1, canzoom:$this.attr('data-canzoom'), wrappersize:[$this.width(), $this.height()]}
		$img.imgmover(options)
	});
});


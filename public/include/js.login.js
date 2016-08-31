/*
Google analytics
*/

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-83412525-1', 'auto');
ga('send', 'pageview');


$(document).ready(function(){
	$('#id_login_img_googlesignin')
	.click(function(){
		window.location.href = '/auth/google';
	})
	.hover(function(){
		$(this).children('img').css('visibility','hidden');
	},function(){
		$(this).children('img').css('visibility','visible');
	})
	
	$('#id_login_img_facebooksignin').click(function(){
		window.location.href = '/auth/facebook';
	});
	
	$('#page3').css('min-height',$(window).height());
	
	$(window).resize(function(){
		$('.page').eq(1).css('min-height',$(window).height()+20);
	});
	
	$('#id_login_btn_playpause').click(function(){
		if($('#id_login_btn_playpause span').first().hasClass('hidden')){
			if($('#id_login_nav_randomQuestionNavBg').is(':animated')){
				$('#id_login_nav_randomQuestionNavBg').stop();
				$('#id_login_btn_playpause span').toggleClass('hidden');
			}
		}else{
			tickflag=false;
			tick();
			$('#id_login_btn_playpause span').toggleClass('hidden');
		}
	});
	
	/* login button and panel binding */
	if($('#id_login_panelbody_loginpanelbody').length>0){
		$('#id_login_panelbody_loginpanelbody').parent().css({
		'top' : parseInt($('#id_navbar_login').css('height'))+parseInt($('#id_navbar_login').offset().top)-1,
		'right' : 0,
		'position' : 'absolute',
		'z-index' : '100'
		});
	}
	
	$('#id_navbar_login').off('click').click(function(){
		$(this).parent().toggleClass('active');
		$('#id_login_panelbody_loginpanelbody').collapse('toggle');
		return false;
	})
	
	$('#id_login_panelbody_loginpanelbody')
		.on('hidden.bs.collapse',function(){
			$(this).parent().addClass('hidden');
		})
		.on('show.bs.collapse',function(){
			$(this).parent().removeClass('hidden');
		})
		
	$('#id_login_btn_next').click(function(){
		if($('#id_login_btn_playpause span').last().hasClass('hidden')||$('#id_login_nav_randomQuestionNavBg').is(':animated')){	
			$('#id_login_btn_playpause span').first().addClass('hidden');
			$('#id_login_btn_playpause span').last().removeClass('hidden');
			$('#id_login_nav_randomQuestionNavBg').stop().clearQueue();
			queryflag = false;
			$('#id_login_div_randomQuestionRenderer,#id_login_span_subjectIndicator,#id_login_nav_randomQuestionNavBg').animate({'opacity':'0.0'},400,function(){
				$('#id_login_nav_randomQuestionNavBg').css('width',$('#id_login_nav_randomQuestionNav').css('width'));
				queryRandomQ('recur');
			})
		}
	});
	
	/*
	$('#id_login_btn_register').off('click').click(function(){
		info_modal('Registration will become available in the future.')
		return false;
	});
	*/
	
	$('#username,#password').off('keydown').keydown(function(e){
		if(e.which==13){
			$('#id_login_form_local').submit();
		}
	})
	
	queryRandomQ('start');
	
	if($('#id_slidshow_imgContainer_logo').css('display')!='none'){
		var residueHeight = $(window).height()-parseInt($('#id_navbar').css('height'))-parseInt($('#id_banner .carousel-inner').css('height'))-parseInt($('#id_slidshow_imgContainer_logo').css('height'))+20;
		$('#id_slidshow_imgContainer_logo').css({
			'margin-top':residueHeight/2,
			'margin-bottom':residueHeight/2,
		})
	}
	
	/* http://stackoverflow.com/a/24600597/6059235 */
	/*
	if (!/Mobi/i.test(navigator.userAgent)) {
		$('.container-fluid').first().slimScroll({
			height : $(window).height()
		})
	}
	*/
});



function info_modal(i){
	$('#id_core_modal_warning .modal-body').html(i);
	$('#id_core_modal_warning').modal('show');
}


/* parsing in [img] tags */
function parsing_preview(i,h_id){
	var escaped_i = escapeHtml(i);
	var j = escaped_i.replace(/\[img.*?\]/g,function(s){
		return parsing_img(s,h_id);
	});
	
	var index = 0;
	var k = j.replace(/\[mcq .*?\]/g,function(s){
		index += 1;
		return parsing_mcq(index,s);
	});
	
	var l = k.replace(/\[su.*?\]/g,function(s){
		if(s.indexOf('sub')==1){
			s = s.replace(/\[sub /,'<sub>');
			s = s.replace(/\]$/,'</sub>')
		}
		if(s.indexOf('sup')==1){
			s = s.replace(/\[sup /,'<sup>');
			s = s.replace(/\]$/,'</sup>')
		}
		return s;
	});
	
	var m = l.replace(/\[space .*?\]/g,function(s){
		s = s.replace(/\[space |\]/g,'');
		ssplit = s.split(' ');
		return parsing_space(ssplit[0],ssplit[1]);
	})
	
	return m;
}

function parsing_mcq(i,s){
	var letter = String.fromCharCode(64 + i);
	var string = s.replace(/\[mcq |\]/g,'');
	return '<div class = "row"><div class = "col-md-2">'+letter+'</div><div class = "col-md-8">'+string+'</div></div>';
}

function parsing_img(i,h_id){
	if($('.'+i.replace(/\[|\]/g,'').split(' ')[0]).length!=0){
		var returnstring = $('.'+i.replace(/\[|\]/g,'').split(' ')[0])[0].outerHTML;
	}else{
		var isplit = i.replace(/\[|\]/g,'').split(' ');
		var filename = isplit[0].substring(3,isplit[0].lastIndexOf('_'));
		var fileextension = isplit[0].substring(isplit[0].lastIndexOf('_')+1);
		var returnstring = '<img class = "col-md-12" src = img/'+ h_id +'/'+filename+'.'+fileextension+'>';
	}
	
	returnstring = returnstring.slice(0,returnstring.indexOf(' style="'))+'>';
	
	if(i.replace(/\[|\]/g,'').split(' ').length>1){
		for(var j=0;j<i.replace(/\[|\]/g,'').split(' ').length;j++){
			var params = i.replace(/\[|\]/g,'').split(' ')[j].split('=');
			if(params.length<2){
				continue;
			}
			returnstring = concatstyle(returnstring,params);
		}
	}else{
		return returnstring;
	}
	return returnstring;
}

function parsing_space(num,type){
	
	/* do not render spaces in preview */
	return '';
	/*
	if(!$.isNumeric(num)||(type!='lines'&&type!='blank'&&type!='box')){
		return '';
	}
	var returnstring = '<div class = "row">';
	for(var j=0;j<num;j++){
		returnstring += '<div class = "col-md-12 spaces_'+type+'"><h4>&nbsp;</h4></div>';
	}
	returnstring +='</div>';
	return returnstring;
	*/
}

function concatstyle(i,p){
	
	var r = '';
	var concatstring = '';
	
	switch(p[0]){
		case 'r':
			if(!$.isNumeric(p[1])){
				return i;
			}else{
				concatstring = 
					'-webkit-transform: rotate('+p[1]+'deg);'+
					'-moz-transform: rotate('+p[1]+'deg);'+
					'-o-transform: rotate('+p[1]+'deg);'+
					'-ms-transform: rotate('+p[1]+'deg);'+ 
					'transform: rotate('+p[1]+'deg);'
			}
		break;
		case 'w':
			if(!$.isNumeric(p[1])){
				return i;
			}else{
				concatstring = 'width:'+p[1]+'%'
			}
		break;
		default:
		break;
	}
	
	if(i.indexOf('style="')==-1){
		r=i.slice(0,i.length-1).concat(' style="'+concatstring+'">')
	}else{
		r=i.replace(' style="',' style="'+concatstring);
	}
	
	return r;
}

/* escape function */
var entityMap = {
"&": "&amp;",
"<": "&lt;",
">": "&gt;",
'"': '&quot;',
"'": '&#39;',
"/": '&#x2F;',
"\n":"<br>",
"\r":"<br>",
"\r\n":"<br>"
};

function escapeHtml(i){
	return String(i).replace(/\r\n|\r|\n|\&|\<|\>|\"|\'|\//g,function(s){
		return entityMap[s];
	});
}

var tickflag = false;
function tick(){
	if(tickflag){
		return;
	}
	tickflag = true;
	var timeRemaining = parseInt($('#id_login_nav_randomQuestionNavBg').css('width'))/parseInt($('#id_login_nav_randomQuestionNav').css('width'))*10000;
	$('#id_login_nav_randomQuestionNavBg').animate({'width':0},timeRemaining,'linear',function(){
		$('#id_login_div_randomQuestionRenderer,#id_login_span_subjectIndicator,#id_login_nav_randomQuestionNavBg').animate({'opacity':'0.0'},400,function(){
			$('#id_login_nav_randomQuestionNavBg').css('width',$('#id_login_nav_randomQuestionNav').css('width'));
			queryRandomQ('recur');
		})
	})
}

var queryflag = false;
function queryRandomQ(i){
	if(queryflag){
		return;
	}
	queryflag = true;
	var json = {
		'mode':'random',
		'quantity':1,
		'searchstring':''}
	$.ajax({
		type : 'POST',
		url : 'pingQ',
		data : json,
		success : function(o){
			$('#id_login_span_subjectIndicator').html(o.subject);
			$('#id_login_div_randomQuestionRenderer').html(parsing_preview(o.question,o.hashed_id));
			tickflag=false;
			$('#id_login_div_randomQuestionRenderer,#id_login_span_subjectIndicator,#id_login_nav_randomQuestionNavBg').animate({'opacity':'1.0'},400,function(){
				queryflag = false;
				tick();
			})
		}
	})
}
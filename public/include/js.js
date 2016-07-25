/* id/class _ scope(name or core) _ type (btn/a etc) _ name */
//var socket = io.connect('http://join.examcopedia.club:8000/');
var socket = io();

$(document).ready(function(){
	$('#id_login_img_googlesignin').click(function(){
		window.location.href = '/auth/google';
	});
	$('#id_login_img_facebooksignin').click(function(){
		window.location.href = '/auth/facebook';
	});
	
	/* chatter box */
	$('#id_view_input_generalChatBox').keypress(function(e){
		if(e.which==13){
			$('#id_view_btn_sendGeneralChat').click();
		}
	})
	
	/* binding login panels */
	if($('#id_navbar_login').length>0){
		$('#id_login_panelbody_loginpanelbody').parent().css({
		'top' : parseInt($('#id_navbar_login').css('height'))+parseInt($('#id_navbar_login').offset().top)-1,
		'right' : 0,
		'position' : 'absolute',
		'z-index' : '100'
		});
	}
	
	$('#id_login_panelbody_loginpanelbody input').off('keydown').keydown(function(e){
		if(e.which==13){
			$('#id_login_form_local').submit();
		}
	})
	
	$('#id_login_panelbody_loginpanelbody')
		.on('hidden.bs.collapse',function(){
			$(this).parent().addClass('hidden');
		})
		.on('show.bs.collapse',function(){
			$(this).parent().removeClass('hidden');
		})
		
	/* binding chatter box */
	if($('#id_navbar_chatter').length>0){
		$('#id_core_well_chatterbox').css('top',parseInt($('#id_navbar_chatter').css('height'))+parseInt($('#id_navbar_chatter').offset().top));
	}
	
	$('#id_navbar_chatter').click(function(){
		$('#id_core_well_chatterbox').collapse('toggle');
		$(this).parent().toggleClass('active');
		redPill('remove','#id_navbar_chatter');
		return false;
	});
	
	$('#id_view_btn_sendGeneralChat').off('click').click(function(){
		
		if($(this).hasClass('disabled')){
			return false;
		}
		$(this).addClass('disabled');
		
		var message = $('#id_view_input_generalChatBox').val();
		
		if(message.replace(/ /g,'')!=''){
			socket.emit('send general chat',message,function(o){
				if(o=='success'){
					$('#id_view_input_generalChatBox').val('');
					$('#id_view_btn_sendGeneralChat').removeClass('disabled');
				}
			})
		}else{
			$('#id_view_btn_sendGeneralChat').removeClass('disabled')
		}
	})
	
	socket.on('receive general chat',function(o){
		appendComment(o.user,o.message,o.created,'#id_view_well_generalChatWell',true);
		if(!$('#id_core_well_chatterbox').hasClass('in')){
			redPill('add','#id_navbar_chatter');
		}
	});
	
	socket.emit('retrieve general chat',function(o){
		for (var i = 0; i<o.length; i++){
			appendComment(o[i].username, o[i].comment, o[i].created, '#id_view_well_generalChatWell',false);
		}
	})
	
	/* tooltip for view/generation > option */
	$('#id_view_glyphicon_select').tooltip({
		html : 'true',
		placement : 'right',
		trigger : 'click',
		title : '<div class = "text-left">'+
				'for single question: <br>'+
				'e.g. 7<br>'+
				'e.g. 14<br><br>'+
				'for multiple questions: <br>'+
				'e.g. 5-16'+
				'</div>',
	})
	
	/* tooltip for question upload */
	$('#id_add_glyphicon_how').tooltip({
		html : 'true',
		placement : 'right',
		trigger : 'click',
		title : '<div class = "text-left">'+
				'To include uploaded images:<br>'+
				'e.g. [imgChem_JPG w=50]<br>'+
				'e.g. [img2 r=90]<br><br>'+
				
				'To add spaces:<br>'+
				'e.g. [space INTEGER lines|blank|box] <br><br>'+
				
				'To format questions or answers:<br>'+
				'e.g. [mcq MULTIPLE CHOICES]<br>'+
				'e.g. [sub SUBSCRIPT]<br>'+
				'e.g. [sup SUPSCRIPT]</div>',
	})
	
	/* img crop complete*/
	socket.on('append imgtank',function(i){
		
		$('.imgtank').removeClass('hidden');
		
		var imgno = 1;
		while($('.img'+imgno).length!=0){
			imgno += 1;
		}
		
		appendImgTank($('#id_core_input_hashedid').val(),i,imgno);
		
	})
	
	/* mobile upload complete */
	socket.on('mobile upload complete',function(i){
		try{
			var pastedImage = new Image();
			var canvas = document.getElementById('id_add_img_OCR');
			var ctx = canvas.getContext('2d');
			var pastedImage = new Image();
			pastedImage.onload = function(){
				canvas.width = pastedImage.width;
				canvas.height = pastedImage.height;
				ctx.drawImage(pastedImage,0,0 ,pastedImage.width, pastedImage.height, 0,0,canvas.width,canvas.height);
				
				$('#id_add_row_pdfControl').addClass('hidden');
				$('#id_add_img_OCR').cropper('destroy');
				
				$('#id_add_img_OCR').cropper({
					autoCrop : false,
					viewMode : 0,
					crop : function(e){
						$('#id_add_divContainer_OCREditor .btn-warning,#id_add_divContainer_OCREditor .btn-primary').removeClass('disabled')
					}
				});
			}
			pastedImage.src = 'data:image/jpeg;base64,'+String(i.b64);
			$('#id_add_collapseDiv_uploadImageOCR').collapse('show');
			$('#id_add_divContainer_OCREditor').removeClass('hidden');
			$('#id_add_divContainer_OCRContainer').addClass('hidden');
			
			bindImageManipulationBtnClicks();
			
		}catch(e){
			info_modal('Error'+e)
		}
	})
	
	
	/* socket io core functions */
	socket.on('throw error',function(i){
		info_modal(i);
	});
	
	/* when warning modal shows, focuses on the close btn */
	$('#id_core_modal_warning').on('shown.bs.modal',function(){
		$('#id_core_modal_warning .btn').focus();
	});
	
	/* when the syllabus select field changes, enable the choose dp button */
	$('#id_core_select_syllabus').change(function(){
		if($(this).val()!=''){
			$(this).parents('#id_view_div_tabcontainer').find('#id_core_btn_choosedp').removeClass('disabled');
		}else{
			$(this).parents('#id_view_div_tabcontainer').find('#id_core_btn_choosedp').addClass('disabled');
		}
		$('#id_core_input_dp').val('');
		$('#id_core_modal_dp select').children('option')
			.each(function(){
				if($(this).html()!=''){
					$(this).remove();
				}
			})
			.first().change();
	});
	
	/* more spaces on change */
	$('#id_add_formgroup_spaces').find('input,select').off('change').change(function(){
		if($('#id_core_textarea_qn').val()!=''){
			var space = 'spacesheader';
			$('#id_add_formgroup_spaces').children('.row').each(function(){
				space += '_' + $(this).children('.form-inline').children('input').val() + '.' + $(this).children('.form-inline').children('select').val();
			});
			
			append_spaces($('#id_add_div_previewspaces'),space);
		}
	});
	
	/* populate all the select boxes upon loading */
	$('select').each(function(){
		var selectfield = $(this);
		var select_id_split=$(this).attr('id').split('_');
		socket.emit('populate select',select_id_split[3],function(o){
			switch(select_id_split[3]){
				case 'subject':
					for (i=0;i<o.length;i++){
						selectfield.append('<option>'+o[i].subject+'</option>');
					}
				break;
				case 'syllabus':
					for (i=0;i<o.length;i++){
						if(o[i].TABLE_NAME.split('_')[0]=='curriculum'){
							selectfield.append('<option>'+o[i].TABLE_NAME.substring(o[i].TABLE_NAME.indexOf('_')+1)+'</option>');
						}
					}
				break;
				default:
				break;
			}
		})
	});
	
	/* modal choose dp, upon changing any select fields, either enable the next field or disable all fields following it */
	$('#id_core_modal_dp select').change(function(){
		if($(this).val()==''){
			
			empty_dp_select($(this).parent().parent());
		}else{
			var fillme = $(this).parent().parent().next();
			
			fillme.children('div').children('select').prop('disabled',false);
			fillme.children('div').children('select').val('');
			
			empty_dp_select(fillme); /* perhaps i need to check if fillme is the last unit */
			update_dp();
			
			fillme.children('div').children('select').children('option').each(function(){
				if($(this).html().indexOf($('#id_core_input_dp').val())==0||$(this).html()==''){
					$(this).removeClass('hidden');
				}else{
					$(this).addClass('hidden');
				}
			})
			fillme.children('div').children('.btn').removeClass('disabled');
		}
	});
	
	/* upon hiding of id_core_modal, remove .active class */
	$('#id_core_modal,#id_core_modal_dp').on('hide.bs.modal',function(){
		$('.btn-default.active').removeClass('active');
	});
	
	/* generate a hashed_id for this question */
	if($('#id_core_input_hashedid').length!=0){
		
		$('#id_core_input_hashedid').off('change').change(function(){
			console.log('hashed id changed');
		})
		
		$('#id_core_input_hashedid').val($.sha256(Date.now().toString()));
		
		new_hashedid();
	}
	
	/* since js is sync, the fileinput needs to be attached AFTER the hashed id is populated */
	if($('#id_add_file_file').length>0){
		
		/*
		// obsolete since 0.1.8 
		$('#id_add_file_file')
			.fileinput('refresh',{
				uploadUrl		:'/upload',
				uploadAsync		:false,
				showUpload		:false,
				showRemove		:false,
				dropZoneEnabled	:true,
				overwriteInitial : false,
				uploadExtraData	:{'hashedid':$('#id_core_input_hashedid').val()},
			})
			.on('filebatchselected',function(event,files){
				$('#id_add_file_file').fileinput('upload');
			})
			.on('filebatchuploadsuccess',function(event, data, previewId, index){
				//works. append <img> this somewhere 
				//data.files[i].name
				
				$('#id_add_file_file').fileinput('reset');
			});
		*/
		
		$('#id_add_file_OCR')
			.fileinput({
				uploadUrl		: '/upload',
				uploadAsync		: false,
				showUpload		: false,
				showRemove		: false,
				dropZoneEnabled	: true,
				uploadExtraData	: {
					'OCR'		: true,
					'hashedid'	: $('#id_core_input_hashedid').val(),
					},
			})
			.on('filebatchselected',function(event,file){
				if(/pdf/i.test(file[0].type)){
					$('#id_add_row_pdfControl').removeClass('hidden');
					var pdfurl = URL.createObjectURL(file[0]);
					$('#id_add_file_OCR').fileinput('clear');
					pageNum=1;
					PDFJS.getDocument(pdfurl).then(function(pdfDoc_){
						pdfDoc = pdfDoc_;
						renderPage(pageNum);
						$('#id_add_span_pdfTotalPages').html(pdfDoc.numPages);
					});
					$('.class_add_btn_pdfNav').off('click').click(function(){
						if($(this).attr('id')=='leftArrow'){
							pdfPrevPage();
						}else if($(this).attr('id')=='rightArrow'){
							pdfNextPage();
						}
					});
				}else{
					$('#id_add_row_pdfControl').addClass('hidden');
					$('#id_add_img_OCR').cropper('destroy');
					var _this = $(this);
					var canvas = document.getElementById('id_add_img_OCR');
					var ctx = canvas.getContext('2d');
					var img = new Image();
					img.onload = function(){
						canvas.width = img.width;
						canvas.height = img.height;
						/*
						if(canvas.width<img.width){
							canvas.height = img.height*canvas.width/img.width;
						}else{
							canvas.height = img.height;
						}
						*/
						ctx.drawImage(img,0,0 ,img.width, img.height, 0,0,canvas.width,canvas.height);
						
						$('#id_add_img_OCR').cropper({
							autoCrop : false,
							viewMode : 0,
							crop : function(e){
								$('#id_add_divContainer_OCREditor .btn-warning,#id_add_divContainer_OCREditor .btn-primary').removeClass('disabled')
							}
						});
						
						_this.fileinput('clear');
					}
					img.src = URL.createObjectURL(file[0]);
				}
				$('#id_add_divContainer_OCREditor').removeClass('hidden');
				$('#id_add_divContainer_OCRContainer').addClass('hidden');

				/* bind button clicks */
				
				bindImageManipulationBtnClicks();
				
			})
	}
	
	/* when .btn is clicked */
	$('.btn').click(function(){
		if($(this).attr('id')==undefined||$(this).prop('disabled')==true||$(this).hasClass('disabled')){
			return true;
		}
		btn_id_split = $(this).attr('id').split('_');
		switch(btn_id_split[1]){
			
			/* btns in landing page */
			case 'landing':
				window.location.href = '/'+btn_id_split[3];
			break;
			
			/* core functionalities */
			case 'core':
				$(this).addClass('active');
				switch(btn_id_split[3]){
					
					/* adding a new subject */
					case 'addsubject':
						addsubject();
					break;
					case 'addcurriculum':
						addcurriculum();
					break;
					case 'choosedp':
						if(!$(this).hasClass('disabled')){
							choosedp();
						}else{
							$(this).removeClass('active');
						}
					break;
					case 'addsubmit':
						addsubmit();
					break;
					case 'viewgo':
						viewgo();
					break;
					default:
					break;
				}
			break;
			
			/* add funcitonalities */
			case 'add':
				switch(btn_id_split[3]){
					case 'morespace':
						appendspace('more');
					break;
					case 'lessspace':
						appendspace('less');
					break;
					default:
					break;
				}
			break;
			
			/* view functionalities */
			case 'view':
				switch(btn_id_split[3]){
					case 'addblock':
						changeblock('add');
					break;
					case 'removeblock':
						changeblock('remove');
					break;
					case 'option':
						$(this).addClass('disabled');
						viewoption();
					break;
					default:
					break;
				}
			break;
			
			/* choose dot point functionalities */
			case 'modalchoosedp':
				if($(this).hasClass('disabled')){
					
				}else{
					$(this).addClass('active');
					adddp();
				}
			break;
			case 'login':
				var username = $('#username').val().replace(/ /g,'');
				var password = $('#password').val();
				if(username==''||password==''){
					info_modal('Username and passwords are required!');
					return false;
				}else{
					$('#id_login_form_local').submit();
				}
			break;
			default:
				console.log('no btn clicked');
			break;
		}
	});
	
	/* when anchor links are clicked */
	$('a').click(function(){
		a_id_split = $(this).attr('id').split('_');
		switch(a_id_split[1]){
			/* when anchors in navbar is clicked */
			case 'about':
				return true;
			break;
			case 'navbar':
				if($(this).attr('id')=='id_navbar_login'){
					$(this).parent().toggleClass('active');
					$('#id_login_panelbody_loginpanelbody').collapse('toggle');
					return false;
				}else{
					return true;
				}
			break;
			case 'view':
				if($(this).parent().hasClass('active')){
					return false;
				}
				$(this).parent().parent().children('li').removeClass('active');
				$(this).parent().addClass('active');
				var outgoing = $(this).parent().parent().parent().children('#id_view_div_tabcontainer').children('div:not(.hidden)');
				var incoming = $(this).parent().parent().parent().children('#id_view_div_tabcontainer').children('div').eq(a_id_split[2].substring(3)-1);
				outgoing.animate({'opacity':'0.0'},200,function(){
					outgoing.addClass('hidden');
					incoming
						.css('opacity','0.0')
						.removeClass('hidden')
						.animate({'opacity':'1.0'},400,function(){
						})
				})
			break;
			default:
				console.log('no anchor clicked');
			break;
		}
		return false;
	})
	
	/* type check functionality */
	if($('#id_input_random').length>0){
		$('#id_input_random').off('keydown').on('keydown',function(k){
			if(k.which==8||k.which==9||k.which==13||k.which==116||(k.which>47&&k.which<58)||(k.which>95&&k.which<106)){
				$(this).tooltip('hide');
			}else{
				/* error message here */
				$(this).tooltip('show');
				return false;
			}
		})
	}
	
	if($('#id_input_select').length>0){
		$('#id_input_select').off('keydown').on('keydown',function(k){
			if(k.which==46||k.which==188||k.which==8||k.which==9||k.which==13||k.which==116||(k.which>47&&k.which<58)||k.which==32||k.which==109||k.which==189||(k.which>95&&k.which<106)){
				$(this).tooltip('hide');
			}else{
				/* error message here */
				$(this).tooltip('show');
				return false;
			}
		})
	}
	
	$('#id_core_input_marks').keyup(function(){
		if($(this).val()==''||!$.isNumeric($(this).val())){
			
		}else{
			$('#id_core_div_previewmark h4').html($(this).val());
		}
	})
	
	/* preview functionality */
	$('#id_core_textarea_qn,#id_core_mixed_space_num').off('keyup').keyup(function(){
		if($('#id_core_textarea_qn').val()==''){
			$('#id_core_well_qn').addClass('hidden');
		}else{
			if($('#id_core_well_qn').hasClass('hidden')){
				$('#id_core_well_qn')
					.removeClass('hidden')
					.html(
					'<div class = "row">'+
						'<div class = "col-md-2">'+
							'<h4>5.</h4>'+
						'</div>'+
						'<div class = "col-md-9" id = "id_core_div_previewbody"><h4></h4>'+
							'<div class = "row" id = "id_add_div_previewspaces"></div>'+
						'</div>'+
						'<div class = "col-md-1" id = "id_core_div_previewmark"><strong><h4></h4></strong></div>'+
					'</div>');
			}
			$('#id_core_div_previewbody h4').html(parsing_preview($('#id_core_textarea_qn').val(),null));
			
			var space = 'spacesheader';
			$('#id_add_formgroup_spaces').children('.row').each(function(){
				space += '_' + $(this).children('.form-inline').children('input').val() +'.'+ $(this).children('.form-inline').children('select').val();
			});
			
			append_spaces($('#id_add_div_previewspaces'),space);
		}
	});
	
	$('#id_core_textarea_ans').off('keyup').keyup(function(){
		if($('#id_core_textarea_ans').val()==''){
			$('#id_core_well_ans').addClass('hidden');
		}else{
			if($('#id_core_well_ans').hasClass('hidden')){
				$('#id_core_well_ans')
					.removeClass('hidden')
					.html('<div class = "row"><div class = "col-md-2"><h4>Ans 5.</h4></div><div class = "col-md-9" id = "id_core_div_previewbody2"><h4></h4></div></div>');
			}
			$('#id_core_div_previewbody2 h4').html(parsing_preview($('#id_core_textarea_ans').val(),null));
		}
	});
	
	if($('#id_add_img_OCR').length>0){
		$(window).on('paste',function(e){
			if(e.originalEvent.clipboardData.getData('text')==''){
				e.preventDefault();
				var items = e.originalEvent.clipboardData.items;
				var blob = items[0].getAsFile();
				try{
					var pastedImage = new Image();
					var canvas = document.getElementById('id_add_img_OCR');
					var ctx = canvas.getContext('2d');
					var pastedImage = new Image();
					pastedImage.onload = function(){
						canvas.width = pastedImage.width;
						canvas.height = pastedImage.height;
						ctx.drawImage(pastedImage,0,0 ,pastedImage.width, pastedImage.height, 0,0,canvas.width,canvas.height);
						
						$('#id_add_row_pdfControl').addClass('hidden');
						$('#id_add_img_OCR').cropper('destroy');
						
						$('#id_add_img_OCR').cropper({
							autoCrop : false,
							viewMode : 0,
							crop : function(e){
								$('#id_add_divContainer_OCREditor .btn-warning,#id_add_divContainer_OCREditor .btn-primary').removeClass('disabled')
							}
						});
					}
					pastedImage.src = URL.createObjectURL(blob);
					$('#id_add_collapseDiv_uploadImageOCR').collapse('show');
					$('#id_add_divContainer_OCREditor').removeClass('hidden');
					$('#id_add_divContainer_OCRContainer').addClass('hidden');
					
					bindImageManipulationBtnClicks();
					
				}catch(e){
					console.log('nothing in the clipboard');
				}
			}
		})
	}
	/* bind tooltips for ocr image upload buttons */
	$('#id_add_divContainer_OCREditor').children('.well').children('.btn').tooltip({
		placement : 'bottom',
		html : true,
		title : 'Done! <span class = "btn btn-sm btn-default class_add_btn_copyToClipboard">copy to clipboard</span>',
		trigger : 'manual'
	})
	
	if($('#id_login_well_sampler').length>0){
		$('#id_login_btn_cog').off('click').click(function(){
			$('#id_core_modal_autoplaySetting').modal('show');
		});
		
		$('#id_login_btn_next').off('click').click(function(){
			if($('#id_login_btn_playpause span').last().hasClass('hidden')||$('#id_login_nav_randomQuestionNavBg').is(':animated')){	
				$('#id_login_btn_playpause span').first().addClass('hidden');
				$('#id_login_btn_playpause span').last().removeClass('hidden');
				$('#id_login_nav_randomQuestionNavBg').stop().clearQueue();
				queryflag = false;
				$('#id_login_div_randomQuestionRenderer,#id_login_nav_randomQuestionNavBg').animate({'opacity':'0.0'},400,function(){
					$('#id_login_nav_randomQuestionNavBg').css('width',$('#id_login_nav_randomQuestionNav').css('width'));
					queryRandomQ('recur');
				})
			}
		});
		
		$('#id_login_btn_playpause').off('click').click(function(){
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
		
		queryRandomQ('start');
		
		$('#id_core_modal_autoplaySetting').off('change').change(function(){
			update_setting();
		})
		
		$('#id_core_modal_autoplaySetting').keypress(function(e){
			if(e.which==13){
				$('#id_core_modal_autoplaySetting .btn-primary').click();
			}
		})
	}
	
	$('.page').css({
		'min-height' : $(window).height()-$('#id_navbar').height(),
	});
	
	/* http://stackoverflow.com/a/24600597/6059235 */
	/*
	var isMobile = window.matchMedia("only screen and (max-width: 760px)");
	
	if (!/Mobi/i.test(navigator.userAgent)) {
		$('#id_view_well_generalChatWell').slimScroll({
			height : '400px'
		});
		$('.container-fluid').slimScroll({
			height : $(window).height()
		})
	}
	*/
});


/* constants */
var appendAPanel = 
	'<div class = "panel panel-default">'+
		'<div class = "panel-heading"></div>'+
		'<div class = "panel-body"></div>'+
	'</div>';
var appendAnInput = 
	'<form role = "form">'+
		'<div class = "form-group">'+
			'<label class = "control-label col-md-3" for = "id_modal_input_input"></label>'+
			'<div class = "col-md-5">'+
				'<input type = "text" class = "form-control" id = "id_modal_input_input"></input>'+
			'</div>'+
	'</form>';
var addAButton = 
	'<form role = "form">'+
		'<div class = "form-group">'+
			'<label class = "control-label col-md-3" for = "id_modal_button_button"></label>'+
			'<div class = "col-md-5">'+
				'<div class = "btn btn-primary form-control" id = "id_modal_button_button"></div>'+
			'</div>'+
	'</form>';

var addDynamicTooltip = 
	'<span class = "glyphicon glyphicon-question-sign"></span>';

/* might have become obsolete */
var addAFile = 
	'<form id = "id_add_form_imgupload" role = "form" method="post">'+
		'<input class = "hidden" id = "id_modal_hiddeninput_hashedid" name = "hashed_id">'+
		'<div class = "form-group">'+
			//'<label class = "control-label col-md-3" for = "id_modal_button_button"></label>'+
			'<input data-allowed-file-extensions=\'["jpg", "gif", "png", "svg" , "pdf", "tiff"]\' id = "id_modal_file_file" name = "id_modal_file_file[]" data-show-upload="false" data-show-caption="true" multiple type = "file">'+
		'</div>'+
	'</form>';

/* sampler */

var tickflag = false;
var ticktime = 10000;
var ticksubject = '';
var tickcurr = '';
var tickdp = ''

function update_setting(){
	
	var string = '';
	var activeTab = $('#id_view_div_tabcontainer').children('div:not(.hidden)');
	switch($('#id_view_div_tabcontainer').children('div:not(.hidden)').attr('id')){
		case 'id_view_div_tab1':
			if($('#id_core_select_subject').val().replace(/ /g,'')==''){
				string = 'Random'
			}else{
				string = $('#id_core_select_subject').val();
				
				tickcurr = '';
				tickdp = ''
				ticksubject = $('#id_core_select_subject').val();
			}
		break;
		case 'id_view_div_tab2':
			if($('#id_core_select_syllabus').val().replace(/ /g,'')==''){
				string = 'Random'
			}else{
				
				string = $('#id_core_select_syllabus').val();
				
				tickcurr = $('#id_core_select_syllabus').val();
				tickdp = ''
				ticksubject = '';
				
				if($('#id_core_input_dp').val().replace(/ /g,'')!=''){
					string += ': '+$('#id_core_input_dp').val();
					tickdp = $('#id_core_input_dp').val();
				}
			}
		break;
		default:
		break;
	}
	
	if(string=='Random'){
		ticksubject = '';
		tickcurr = '';
		tickdp = ''
	}
	
	if($.isNumeric($('#id_modal_input_time').val())){
		if($('#id_modal_input_time').val()<3){
			string += ', 3s';
			ticktime = 3000;
		}else{
			string += ', ' + $('#id_modal_input_time').val() + 's';
			ticktime = $('#id_modal_input_time').val() * 1000;
		}
	}else{
		string += ', 10s';
	}
	$('#id_login_span_subjectIndicator').html(escapeHtml(string));
}

function tick(){
	if(tickflag){
		return;
	}
	tickflag = true;
	var timeRemaining = parseInt($('#id_login_nav_randomQuestionNavBg').css('width'))/parseInt($('#id_login_nav_randomQuestionNav').css('width'))*ticktime;
	$('#id_login_nav_randomQuestionNavBg').animate({'width':0},timeRemaining,'linear',function(){
		$('#id_login_div_randomQuestionRenderer,#id_login_nav_randomQuestionNavBg').animate({'opacity':'0.0'},400,function(){
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
		'subject': ticksubject,
		'syllabus':tickcurr,
		'dp':tickdp,
		'quantity':1,
		'searchstring':''}
	$.ajax({
		type : 'POST',
		url : 'pingQ',
		data : json,
		success : function(o){
			if(o.message=='failed'){
				info_modal(o.reason);
				$('#id_login_div_randomQuestionRenderer').html('');
				tickflag = false;
				$('#id_login_div_randomQuestionRenderer,#id_login_nav_randomQuestionNavBg').animate({'opacity':'1.0'},400,function(){
					queryflag = false;
					tick();
				})
			}else{
				$('#id_login_div_randomQuestionRenderer').html(parsing_preview(o.question,o.hashed_id));
				tickflag=false;
				$('#id_login_div_randomQuestionRenderer,#id_login_nav_randomQuestionNavBg').animate({'opacity':'1.0'},400,function(){
					queryflag = false;
					tick();
				})
			}
		}
	})
}	

function bindImageManipulationBtnClicks(){
	
	/* bind button clicks */
	$('#id_add_divContainer_OCREditor').children('.well').children('.btn').off('click').click(function(){
		if($(this).hasClass('disabled')){
			return false;
		}
		
		var formData = new FormData();
		
		if($(this).hasClass('btn-primary')){
			var _this = $(this);
			$(this).addClass('disabled');
			//ocr
			formData.append('base64jpeg',$('#id_add_img_OCR').cropper('getCroppedCanvas').toDataURL('image/jpeg'));
			
			$.ajax({
				processData : false,
				contentType : false,
				type : 'POST',
				url : '/ocr',
				data : formData,
				success : function(o){
					var parsedResult = JSON.parse(o).ParsedResults[0].ParsedText;
					$('#id_add_textarea_OCRResult').val(parsedResult);
					
					cropEnd(_this);
					
				},
				error : function (e){
					_this.removeClass('disabled');
					info_modal('OCR unsuccessful.')
					console.log('error'),
					console.log(e);
				}
			})
			
		}else if($(this).hasClass('btn-warning')){
			//crop images
			var formData = new FormData();
			formData.append('hashedid',$('#id_core_input_hashedid').val());
			formData.append('photo',$('#id_add_img_OCR').cropper('getCroppedCanvas').toDataURL('image/jpeg'));
			formData.append('name',String(Date.now())+'.jpg')
			$(this).addClass('disabled');
			var _this = $(this);
			$.ajax({
				processData : false,
				contentType : false,
				type : 'POST',
				url : '/mobileuploadphoto',
				data : formData,
				success : function(o){
					if (o.message == 'success'){
						var outputString = '[img'+o.filename.substring(0,o.filename.lastIndexOf('.'))+'_'+o.filename.substring(o.filename.lastIndexOf('.')+1)+']'
						$('#id_add_textarea_OCRResult').val(outputString);
						
						cropEnd(_this);
					}else if (o.message=='noroom'){
						info_modal('Login token expired. Please refresh the page.')
					}
					},
				error : function(e){
					info_modal(e);
					}
				
			})
		}else if($(this).hasClass('btn-info')){
			$('#id_add_divContainer_OCREditor').addClass('hidden');
			$('#id_add_divContainer_OCRContainer').removeClass('hidden');
			$('#id_add_textarea_OCRResult').val('');
			$('#id_add_divContainer_OCREditor').children('.well').children('.btn').tooltip('hide')
		}
	});
}

function cropEnd(btn){
	btn.removeClass('disabled').tooltip('show');
	setTimeout(function(){
		btn.tooltip('hide');
	},5000);
	$('.class_add_btn_copyToClipboard').off('click').click(function(){
		if($(this).hasClass('disabled')){
			return false;
		}
		$('#id_add_textarea_OCRResult').select();
		if(document.execCommand('copy')){
			$('.class_add_btn_copyToClipboard').addClass('disabled').html('Copied');
		}else{
			$('.class_add_btn_copyToClipboard').addClass('disabled').html('Error! Copy manually!');
		}
	})
}
	
/* constants related to pdf -> canvas */
	
var pageNum = 1,
	pageRendering = false,
	pageNumPending = null,	
	pdfDoc = null,
	scale = 2.0

/* OCR PDF functions */	
function renderPage(num){
	var canvas = document.getElementById('id_add_img_OCR'),
		ctx = canvas.getContext('2d');
	$('#id_add_img_OCR').cropper('destroy');
	pageRendering = true;
	// Using promise to fetch the page
	pdfDoc.getPage(num).then(function(page) {
		var viewport = page.getViewport(scale);
		canvas.height = viewport.height;
		canvas.width = viewport.width;

		// Render PDF page into canvas context
		var renderContext = {
			canvasContext: ctx,
			viewport: viewport
		};
		var renderTask = page.render(renderContext);

		// Wait for rendering to finish
		renderTask.promise.then(function () {
			pageRendering = false;
			if (pageNumPending !== null) {
				// New page rendering is pending
				renderPage(pageNumPending);
				pageNumPending = null;
			}else{
				$('#id_add_img_OCR').cropper({
					autoCrop : false,
					viewMode : 0,
					crop : function(e){
						$('#id_add_divContainer_OCREditor .btn').removeClass('disabled')
					}
				});
			}
		});
	});
	
	$('#id_add_input_pdfNavPageNum').html(pageNum);
}
function queueRenderPage(num){
	if(pageRendering){
		pageNumPending = num;
	}else{
		renderPage(num);
	}
}
function pdfPrevPage(){
	if(pageNum <= 1){
		return;
	}
	pageNum--;
	queueRenderPage(pageNum);
}
function pdfNextPage(){
	if(pageNum >= pdfDoc.numPages){
		return;
	}
	pageNum++;
	queueRenderPage(pageNum);
}

/* functions */
function redPill(mode,target){
	var t = $(target);
	switch(mode){
		case 'add':
			if(t.children('span.label').length==0){
				t.append(' <span class = "label label-danger">1</span>')
			}else{
				t.children('span.label').html(Number(t.children('span.label').html())+1);
			}
		break;
		case 'remove':
			var i = 0;
			while(
				i<Number(t.children('span.label').html())){
				$('#id_view_well_generalChatWell').children('div.row').eq(i).addClass('bg-info');
				i++;
				}
			t.children('span.label').remove();
			setTimeout(function(){
				$('#id_view_well_generalChatWell').children('div.row.bg-info').removeClass('bg-info');
			},5000)
		break;
		default:
		break;
	}
}

function viewoption(){
	var viewOption = $('.btn-option.disabled').parent().prev().children('input').val();
	var viewOptionSplit = viewOption.split(' : ');
	$('#id_view_modal_option #id_radio_'+viewOptionSplit[0]).prop('checked','checked')
	switch(viewOptionSplit[0]){
		case 'random':
		case 'select':
			$('input:checked').parent().next().val(viewOptionSplit[1]);
		break;
		default:
		break;
	}
	
	$('#id_view_modal_option').off('hide.bs.modal').on('hide.bs.modal',function(){
		$('.btn-option.disabled').removeClass('disabled');
	});
	
	$('#id_view_modal_option').find('input').off('change').on('change',function(){
		
		if($(this).prop('type')=='radio'){
			$(this).parent().parent().parent().children('div').children('input')
				.prop('disabled',true)
				.val('');
			$(this).parent().parent().children('input').prop('disabled',false);
		}
		
		if($('input:checked').val()=='all'){
			var outputString = $('input:checked').val();
		}else{
			var outputString = $('input:checked').val() + ' : ' + $('input:checked').parent().next().val();
		}
		$('.btn-option.disabled').parent().prev().children('input').val(outputString);
	})
	
	$('#id_view_modal_option').modal('show');
	
}

function new_hashedid(){
	/* after setting hashed id, call server to inform server of the hashed id. so that when images are uploaded, server could relay back to user */
	socket.emit('ping hashedid',$('#id_core_input_hashedid').val(),function(o){
		
	});
	
	/* use the hash id to generate a unique qr code for this page */
	$('#id_add_div_qrcode').empty().qrcode({
		text : window.location.href.substring(0,window.location.href.indexOf(window.location.pathname)) + '/mobileupload?' + $('#id_core_input_hashedid').val(),
		fill : '#337ab7',
		background : '#fff'
	});
	console.log(window.location.href.substring(0,window.location.href.indexOf(window.location.pathname)) + '/mobileupload?' + $('#id_core_input_hashedid').val());
	
	$('#id_add_file_file').fileinput('refresh',{
		uploadExtraData	:{'hashedid':$('#id_core_input_hashedid').val()}
		});
}

function random(i) {
    var x = Math.sin(i++) * 10000;
    return Math.floor((x - Math.floor(x))*10000);
}

function appendImgTank(hashedid,imgname,imgno){
	
	var imgurl = 'img/'+hashedid+'/';
	//imgname
	var imgalt1 = imgname.substring(0,imgname.lastIndexOf('.'))+'_alt1'+imgname.substring(imgname.lastIndexOf('.'));
	var imgalt2 = imgname.substring(0,imgname.lastIndexOf('.'))+'_alt2'+imgname.substring(imgname.lastIndexOf('.'));
	
	$('.imgtank').append(
		'<div class = "row">'+
			'<div class = "col-md-4">'+
				'<div class = "panel panel-default">'+
					'<div class = "panel-heading">[img'+imgname.replace('.','_')+']</div>'+
					'<div class = "panel-body"><img src = "'+imgurl+imgname+'" id = "img'+imgname.replace('.','_')+'" class = "col-md-12 img'+imgname.replace('.','_')+' img'+imgno+'"></div>'+
				'</div>'+
			'</div>'+
			'<div class = "col-md-4">'+
				'<div class = "panel panel-default">'+
					'<div class = "panel-heading">[img'+imgalt1.replace('.','_')+']</div>'+
					'<div class = "panel-body"><img src = "'+imgurl+imgalt1+'" id = "img'+imgalt1.replace('.','_')+'" class = "col-md-12 img'+imgalt1.replace('.','_')+' img'+imgno+'_alt1"></div>'+
				'</div>'+
			'</div>'+
			'<div class = "col-md-4">'+
				'<div class = "panel panel-default">'+
					'<div class = "panel-heading">[img'+imgalt2.replace('.','_')+']</div>'+
					'<div class = "panel-body"><img src = "'+imgurl+imgalt2+'" id = "img'+imgalt2.replace('.','_')+'" class = "col-md-12 img'+imgalt2.replace('.','_')+' img'+imgno+'_alt2"></div>'+
				'</div>'+
			'</div>'+
		'</div>');
}

function viewgo(){
	var flag = true;
	$('.class_view_div_unitblock').each(function(){
		if($(this).children('ul.nav-tabs.nav').children('li.active').children('a').attr('id')=='id_view_tab2'){
			if($(this).find('#id_core_select_syllabus').val()==''){
				flag = false;
				$(this).find('#id_core_select_syllabus').parent().parent().addClass('has-error');
			}
		}
	})
	
	if(!flag){
		info_modal('Please select a syllabus!');
		modal_shown_focus('btn');
		return;
	}
	
	/* add replace state and push state */
	history.replaceState(null,null,'/view');
	history.pushState(null,null,'/view');
	window.addEventListener('popstate',function(e){
		$('#id_view_div_form')
			.css('opacity','1.0')
			.removeClass('hidden');
		$('#id_view_div_preview')
			.addClass('hidden');
	})
	
	/* fade out id_view_div_form */
	$('#id_view_div_form').animate({'opacity':'0.0'},400,function(){
		
		$(this).addClass('hidden');
		
		/* clean out any previous preview data */
		$('#id_view_div_preview .panel-body').html('');
		
		$('#id_view_div_form .class_view_div_unitblock').each(function(){
			var mode = $(this).find('#id_view_input_option').val().split(' : ')[0];
			
			var length = null;
			
			if(mode!='all'){
				length = $(this).find('#id_view_input_option').val().split(' : ')[1];
			}
				
			var index = $(this).index();
			
			switch($(this).children('ul.nav-tabs.nav').children('li.active').children('a').attr('id')){
				/* by subject tab */
				case 'id_view_tab1':
					var json = {
						'mode' : 'subject',
						'subject' : $(this).find('#id_core_select_subject').val(),
						'method' : mode,
						'length' : length
						}
					socket.emit('view submit',json,function(o){
						console.log(o)
						if(o.length>0){
							$('#id_view_div_preview .panel-body').append('<div class = "row" id = "id_view_div_preview_'+index+'"></div>');
							view_append_preview(mode, length,$('#id_view_div_preview_'+index),o);
							bind_viewdiv_overlay($('#id_view_div_preview_'+index));
							
							/* show preview panel */
							$('#id_view_div_preview')
								.css('opacity','0.0')
								.removeClass('hidden')
								.animate({'opacity':'1.0'},400,function(){
									/* functiosn to execute at animation's end */
								})
						}
					});
				break;
				
				/* by curriculum tab */
				case 'id_view_tab2':
					var json = {
						'mode' : 'curriculum',
						'syllabus' : $(this).find('#id_core_select_syllabus').val(),
						'dp' : $(this).find('#id_core_input_dp').val(),
						'method' : mode,
						'length' : length
						}
					socket.emit('view submit',json,function(o){
						if(o.length>0){
							$('#id_view_div_preview .panel-body').append('<div class = "row" id = "id_view_div_preview_'+index+'"></div>');
							view_append_preview(mode, length,$('#id_view_div_preview_'+index),o);
							bind_viewdiv_overlay($('#id_view_div_preview_'+index));
							/* show preview panel */
							$('#id_view_div_preview')
								.css('opacity','0.0')
								.removeClass('hidden')
								.animate({'opacity':'1.0'},400,function(){
									/* functiosn to execute at animation's end */
								})
						}
					});
				break;
				default:
				break;
				
			}
		})
	});
	
	/* bind sending comment */
	$('#id_view_input_chatbox').keypress(function(e){
		if(e.which==13){
			$('#id_view_btn_sendcomment').click();
		}
	})
	
	$('#id_view_btn_sendcomment').off('click').click(function(){
		
		if($(this).hasClass('disabled')) return false;
		$(this).addClass('disabled');
		
		var comment = escapeHtml($('#id_view_input_chatbox').val());
		if(comment.replace(/ /g,'')!=''){
			var json = {
				'target' : $('#id_view_input_hashedid').val(),
				'comment' : comment
				}
			socket.emit('send comment',json,function(o){
				if(o.user){
					appendComment(o.user,comment,'Just nowT.','#id_view_well_comment',true);
					$('#id_view_input_chatbox').val('');
					$('#id_view_btn_sendcomment').removeClass('disabled');
				}
			})
		}else{
			$(this).removeClass('disabled');
		}
	})
	
	/* bind class_view_btn_edit */
	$('.class_view_btn_edit').off('click').click(function(){
		var idsplit = $(this).attr('id').split('_');
		switch(idsplit[4]){
			case 'global':
				viewglobaledit(idsplit[3]);
			case 'local':
				viewlocaledit(idsplit[3]);
			break;
			default:
			break;
		}
	})
	
	/* on editcomment modal hidden */
	$('#id_view_modal_editcomment').off('hidden.bs.modal').on('hidden.bs.modal',function(){
		$('#id_view_modal_editcomment').find('.in').removeClass('in');
	})
}

function viewglobaledit(mode){
	var data = {
		'hashed_id' : $('#id_view_input_hashedid').val(),
		'subject'	: $('#id_core_select_subject').val(),
		'question'	: $('#id_core_textarea_qn').val(),
		'answer'	: $('#id_core_textarea_ans').val(),
		'mark'		:$('#id_core_input_marks').val()
		}
	var json = {
		'mode' : mode,
		'data' : data,
	};
	socket.emit('globaledit',json,function(o){
		info_modal(o);
	})
}

function viewlocaledit(mode){
	var target = $('#'+$('#id_view_input_hashedid').val());
	switch(mode){
		case 'save':
			target.find('#id_view_div_qncontainer').children('h4').html(parsing_preview($('#id_core_textarea_qn').val(),$('#id_view_input_hashedid').val()));
			target.find('#id_view_div_mark').find('h4').html($('#id_core_input_marks').val());
		break;
		case 'remove':
			target.animate({'opacity':'0.0'},400,function(){
				var renumber = target.next();
				while(renumber.length != 0){
					var oldnum = Number(renumber.children('div').first().children('h4').html().replace('.',''));
					renumber.children('div').first().children('h4').html(oldnum-1+'.');
					renumber = renumber.next();
				}
				target.remove();
			});
			socket.emit('local remove',$('#id_view_input_hashedid').val(),function(o){
				
			});
		break;
		default:
		break;
	}	
	
	$('#id_view_modal_editcomment').modal('hide');
}

function appendComment(name,comment,timestamp,target,animation){
	var appendCommentString = '<div class ="row">'+
				'<blockquote>'+
					escapeHtml(comment)+
					'<footer>'+
						escapeHtml(name)+' <span class = "text-muted">('+escapeHtml(timestamp.split('T')[0])+' '+escapeHtml(timestamp.split('T')[1].split('.')[0])+')</span>'+
					'</footer>'+
				'</blockquote>'+
			'</div>';
			
	var newComment = $(appendCommentString);
	if($(target).children('.row').length==0){
		$(target).append(newComment);
	}else{
		newComment.insertBefore($(target).children('.row').first());
	}
	
	if(animation){
		var targetHeight = newComment.css('height');
		newComment.css('height','0');
		newComment.animate({'height':targetHeight},400,function(){
			
		})
	}
}

function bind_viewdiv_overlay(target){
	target.children('.row').hover(function(){
			$(this).animate({
				'background-color' : 'rgb(220,220,220,0.2)',
			},200)
		},function(){
			$(this).animate({
				'background-color' : 'rgba(220,220,220,0.0)',
			},400,function(){
				
			})
		})
		.click(function(){
			$('#id_view_modal_editcomment').modal('show');
			$('#id_view_well_comment').empty();
			var json = {
				'mode' : 'random',
				'hashed_id' : $(this).attr('id')
				};
				
			socket.emit('retrieve comments',json.hashed_id,function(o){
				for(var i=0;i<o.length;i++){
					appendComment(o[i].username,o[i].comment,o[i].created,'#id_view_well_comment',false)
				}
			});

			$.ajax({
				type : 'POST',
				url : 'pingQ',
				data : json,
				success : function(o){
					$('#id_view_input_hashedid').val(o.hashed_id);
					$('#id_core_select_subject').val(o.subject);
					$('#id_core_textarea_qn').val(o.question);
					$('#id_core_textarea_ans').val(o.answer);
					$('#id_core_input_marks').val(o.mark);
					
					$('#id_add_div_qrcode').empty().qrcode({
						text : window.location.href.substring(0,window.location.href.indexOf(window.location.pathname)) + '/mobileupload?' + $('#id_view_input_hashedid').val(),
						fill : '#337ab7',
						background : '#fff'
						});
					
					console.log(window.location.href.substring(0,window.location.href.indexOf(window.location.pathname)) + '/mobileupload?' + $('#id_view_input_hashedid').val());
					
					$('#id_add_file_file').fileinput('refresh',{
						uploadExtraData	:{'hashedid':$('#id_view_input_hashedid').val()}
						});
					
				}
			})
		})
}

/* shuffle array */
/* http://stackoverflow.com/a/12646864/6059235 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}


/* according to mode and length, append row units to appropriate targets */
function view_append_preview(mode, length, target, row){
	var bookkeeper = [];
	switch (mode){
		case 'random':
			/*
			//this is no longer needed, as server now handles the randomisation of questions and weighing of questions
			var counter = 1;
			var randomArray = shuffleArray(row);
			do{
				append_one(counter,target,row[counter-1]);
				bookkeeper.push(row[counter-1].hashed_id);
				counter ++;
			}while(counter - 1 < length && counter < row.length)
		break;
			*/
		case 'all':
			for (var i=0;i<row.length;i++){
				append_one(i+1,target,row[i]);
				bookkeeper.push(row[i].hashed_id);
			}
		break;
		case 'select':
			var decode_l = decode_select(length);
			if(decode_l==null){
				for (var i=0;i<row.length;i++){
					append_one(i+1,target,row[i]);
					bookkeeper.push(row[i].hashed_id);
				}
			}else{
				/* introduction of upper and lower bound, in case user inputted a number outside the bound */
				var upper_bound = Math.min(decode_l[1],row.length);
				var lower_bound = Math.min(Number(decode_l[0])-1,Number(row.length)-1);
				for (var i=lower_bound;i<upper_bound;i++){
					append_one(i+1,target,row[i]);
					bookkeeper.push(row[i].hashed_id);
				}
			}
		break;
		default:
		break;
	}
	
	/* important to keep track of the questions picked, for exhaustive method */
	socket.emit('picked questions',bookkeeper,function(o){
		
	});
}

function decode_select(i){
	var dec_i = i.replace(' ','').split('-');
	switch (dec_i.length){
		case 1:
			return [dec_i[0],dec_i[0]];
		break;
		case 2:
			return [Math.min(dec_i[0],dec_i[1]),Math.max(dec_i[0],dec_i[1])];
		break;
		default:
			return null;
		break;
		
	}
}

function append_one(counter,target,json){
	var qn_container = 
		'<div id="'+json.hashed_id+'" class = "row id_sync_active">'+
			'<div class = "col-xs-1 col-xs-offset-1"><h4>'+counter+'.</h4>'+
			'</div>'+
			'<div class = "col-xs-8" id = "id_view_div_qncontainer"><h4></h4>'+
				'<div class = "row" id = "id_view_div_spaces"></div>'+
			'</div>'+
			'<div class = "col-sm-offset-1 col-xs-1" id = "id_view_div_mark"><strong><h4></h4></strong></div>'+
		'</div>';
	target.append(qn_container);
	$('.id_sync_active').find('#id_view_div_qncontainer').children('h4').html(parsing_preview(json.question,json.hashed_id));
	append_spaces($('.id_sync_active #id_view_div_spaces'),json.space+'_1.blank');
	$('.id_sync_active #id_view_div_mark').find('h4').html(json.mark);
	$('.id_sync_active').removeClass('id_sync_active');
}

function append_spaces(home,instring){
	var space = instring.split('_');
	home.html('');
	for(var i=1;i<space.length;i++){
		space_split = space[i].split('.');
		if(home.html()!=''){
			append_spaces_ctrl(home,1,'blank');
		}
		if(space_split.length==2){
			append_spaces_ctrl(home,space_split[0],space_split[1]);
		}
		
	}
	if(home.html()==''){
		home.addClass('hidden');
	}else{
		home.removeClass('hidden');
	}
}

function append_spaces_ctrl(target,no,type){
	target.append('<div class = "row"></div>');
	for(j=0;j<no;j++){
		target.children('div.row').last().append('<div class = "col-md-12 spaces_'+type+'"><h4>&nbsp;</h4></div>');
	}
}

function empty_dp_select(j){

	var emptyme = j.next();
	var i = 0;
	do{
		emptyme.children('div').children('select')
			.prop('disabled',true)
			.val('');
		emptyme.children('div').children('.btn').addClass('disabled');
		emptyme = emptyme.next('div');
		i++;
	}while(emptyme.length==1&&i<10)
}

function addsubject(){
	$('#id_core_modal .modal-title').html('Add a New Subject');
	$('#id_core_modal .modal-body')
		.html(appendAPanel)
		.append(appendAnInput)
		.append('<hr>');
		
	$('#id_core_modal .panel-heading').html('Existing subjects');
	$('#id_core_modal label').html('New subject to be added:');
	$('#id_core_modal').modal('show');
	
	/* show existing subjects */
	show_existing_items();
	
	/* after modal is shown, focus on the input field */
	modal_shown_focus('input');
	
	/* binding the effect of clicking btn primary */
	$('#id_core_modal .btn-primary').off('click').on('click',function(c){
		if(c.which!=1){
			return false;
		}else{
			modal_ok();
			return false;
		}
	});
	
	/* binding enter key as clicking .btn-primary */
	$('#id_core_modal').off('keypress').on('keypress',function(k){
		if(k.which==13){
			modal_ok();
			return false;
		}
	});
}

function update_dp(){
	
	var dp = '';
	for (i=1;i<6;i++){
		if($('#id_modalchoosedp_select_lvl'+i).val()!=''){
			if($('#id_modalchoosedp_select_lvl'+i).val().split(/[ -]/)[0].toString()!=''){
				dp = $('#id_modalchoosedp_select_lvl'+i).val().split(/[ -]/)[0].toString();
			}
		}else{
			$('#id_core_input_dp').val(dp);
			return;
		}
	}
}

function modal_ok(){
	var home = $('.btn-default.active').parent().prev().children('select');
	for (var i = 0;i<home.children('option').length;i++){
		if(home.children('option').eq(i).html()==$('#id_modal_input_input').val()){
			$('.btn-default.active').parent().prev().children('select').val($('#id_modal_input_input').val());
			
			$('#id_core_modal').modal('hide');
			return false;
		}
	}
	
	/* also check if the name is in use already */
	$('.btn-default.active').parent().prev().children('select').append('<option>'+$('#id_modal_input_input').val()+'</option>');
	$('.btn-default.active').parent().prev().children('select').val($('#id_modal_input_input').val());
	$('#id_core_select_syllabus').change();
	
	$('#id_core_modal').modal('hide');
}

function info_modal(i){
	$('#id_core_modal_warning .modal-body').html(i);
	$('#id_core_modal_warning').modal('show');
}

function addcurriculum(){
	$('#id_core_modal .modal-title').html('Add a New Cirriculum');
	$('#id_core_modal .modal-body').html(appendAPanel);
	$('#id_core_modal .modal-body').append(appendAnInput);
	$('#id_core_modal .modal-body').append('<hr>');
	$('#id_core_modal .panel-heading').html('Existing curricula');
	$('#id_core_modal label').html('New curriculum to be added:');
	$('#id_core_modal').modal('show');
	
	/* append existing curricula */
	show_existing_items();
	
	/* after modal is shown, focus on the input field */
	modal_shown_focus('input');
	
	$('#id_core_modal .btn-primary').off('click').on('click',function(c){
		if(c.which!=1){
			return false;
		}else{
			if(/^[a-zA-Z0-9\w]*$/.test($('#id_modal_input_input').val())==false){
				info_modal('New curriculum name must only contain letters, numbers or underscores');
				$('#id_modal_input_input').parent().parent().addClass('has-error');
				return false;
			}
			/* add new cirriculum */
			socket.emit('add new curriculum',$('#id_modal_input_input').val(),function(o){
				if(o=='New curriculum created!'){
					reset_dp();
					modal_ok();
				}else if(o.code=='ER_TABLE_EXISTS_ERROR'){
					info_modal('Curriculum name already in use!');
				}else{
					info_modal(o);
				}
			});
			return false;
		}
	});
	
	$('#id_core_modal').off('keypress').on('keypress',function(k){
		if(k.which==13){
			if(/^[a-zA-Z0-9\w]*$/.test($('#id_modal_input_input').val())==false){
				info_modal('New curriculum name must only contain letters, numbers or underscores');
				$('#id_modal_input_input').parent().parent().addClass('has-error');
				return false;
			}
			/* add new cirriculum */
			socket.emit('add new curriculum',$('#id_modal_input_input').val(),function(o){
				if(o=='New curriculum created!'){
					reset_dp();
					modal_ok();
				}else if(o.code=='ER_TABLE_EXISTS_ERROR'){
					info_modal('Curriculum name already in use!');
				}else{
					info_modal(o);
				}
			});
			return false;		
		}
	})
}

function reset_dp(){
	$('#id_core_input_dp').val('');
}

/* parsing in [img] tags */
function parsing_preview(i,h_id){
	var escaped_i = escapeHtml(i);
	//h_id = escapeHtml(h_id);
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
	if(!$.isNumeric(num)||(type!='lines'&&type!='blank'&&type!='box')){
		return '';
	}
	var returnstring = '<div class = "row">';
	for(var j=0;j<num;j++){
		returnstring += '<div class = "col-md-12 spaces_'+type+'"><h4>&nbsp;</h4></div>';
	}
	returnstring +='</div>';
	return returnstring;
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

function choosedp(){
	$('#id_core_modal_dp .row.form-group select').html('<option></option>');
	socket.emit('populate dot points',$('#id_core_select_syllabus').val(),function(o){
		
		/* empty dp map so new items can append */
		$('#id_core_div_dpmap').empty();
		
		
		for(var i=0;i<o.length;i++){
			var obj = o[i].lvl.replace('.info','');
			var concatString = obj+' '+o[i].description;
			
			/* make dpmap here */
			var objsplit = obj.split('.');
			var objsplitstage = objsplit[0];
			for (var j = 0; j<objsplit.length;j++){
				if($('#id_dpmap_ul_'+j+'-'+objsplitstage).length<1){
					/* there is not yet an element with id #id_dpmap_div_ lvl _ dpno */
					if(j==0){
						/* append the first dp */
						$('#id_core_div_dpmap').append('<ul class = "list-group"><li class = "btn btn-default list-group-item" data-toggle="collapse" data-target="#id_dpmap_ul_'+j+'-'+objsplitstage+'"></li><ul class = "list-group collapse" id = "id_dpmap_ul_'+j+'-'+objsplitstage+'"></ul></ul>');
					}else{
						var target = $('#id_dpmap_ul_'+Number(j-1)+'-'+objsplitstage.substring(0,objsplitstage.lastIndexOf('_')));
						target.append('<ul class = "list-group"><li class = "btn btn-default list-group-item" data-toggle="collapse" data-target="#id_dpmap_ul_'+j+'-'+objsplitstage+'"></li><ul class = "list-group collapse" id = "id_dpmap_ul_'+j+'-'+objsplitstage+'"></ul></ul>');
					}
				}else{
				}
				
				if(j==objsplit.length-1){
					$('#id_dpmap_ul_'+j+'-'+objsplitstage).parent().children('li').html(concatString);
				}else{
					/* if there is already an element with id #id_dpmap_div_ lvl _ dpno */
					objsplitstage += '_'+objsplit[j+1];					
				}
			}
		}
		
		/* prepend the create new button */
		$('#id_core_div_dpmap ul:first-child').prepend('<li class = "list-group-item btn-link class_dp_btn_createnew">+ new dot point</li>');
		$('#id_core_div_dpmap ul').each(function(){
			if($(this).html()==''){
				$(this).html('<ul class = "list-group"><li class = "list-group-item btn-link class_dp_btn_createnew">+ new dot point</li></ul>');
			}
		});
		
		/* bind click listeners for li */
		$('#id_core_div_dpmap li.btn-default').off('click').click(function(){
			$('#id_core_div_dpmap li.active').removeClass('active');
			$(this).addClass('active');
			$('#id_core_input_dp').val($(this).html().split(' ')[0]);
			$('#id_core_input_dp').change();
		});
		
		/* bind create new button */
		$('#id_core_div_dpmap li.btn-link').off('click').click(function(){
			adddp($(this));
		})
		
		/* satisfy as much of the selected dp as possible */
		if($('#id_core_input_dp').val()!=''){
			var currdp = $('#id_core_input_dp').val().split('.');
			var checklvl = '';
			var findtarget = $('#id_core_div_dpmap').first();
			
			for(var j = 0;j<currdp.length;j++){
				
				if(j!=0){
					checklvl += '.';
				}
				checklvl += currdp[j];
				
				findtarget.children('ul').children('li').each(function(){
					if($(this).html().split(' ')[0]==checklvl){
						$(this).click();
						findtarget=$($(this).data('target'));
						return false;
					}
				});
			}
		}
		
		$('#id_core_modal_dp').modal('show');
	});
}

/* list existing items in modal dialog */
function show_existing_items(){
	$('.btn-default.active').parent().prev().children('select').children('option').each(function(){
		if(!$(this).hasClass('hidden')&&$(this).html()!=''){
			$('#id_core_modal .modal-body .panel-body').append('<div class = "row clickable"><div class = "col-md-12">'+$(this).html()+'</div></div>');
		}
	});
	$('.modal-body .panel-body .clickable').off('click').click(function(){
		$('.btn-default.active').parent().prev().children('select')
			.val($(this).children('div').html())
			.change();
		$('#id_core_modal').modal('hide');
	})
	
}

/* when add a dp is clicked in choose dp modal */
function adddp(i){
	$('#id_core_modal .modal-title').html('Add a New Dot Point');
	$('#id_core_modal .modal-body')
		.html(appendAnInput)
		.append('<hr>');
	
	var newTooltip = $(addDynamicTooltip);
	
	newTooltip.tooltip({
		placement : 'right',
		html : true,
		title : '<div class = "text-left">dotPointIndex description <br><br>'+
				'e.g. 1.3 Life on earth <br>'+
				'e.g. 1.3.1 Abiogenesis<br><br>'+
				'n.b. dotPointIndex must not contain underscores. <br><br>'+
				'n.b. dotPointIndex and description are to be separated by a single space.</div>',
				
		trigger : 'hover'
		});
	
	$('#id_modal_input_input').parent().parent().append(newTooltip);
	
	$('#id_core_modal label').html('New DP to be added:');
	$('#id_core_modal').modal('show');
	
	/* automatically generates the prefix of the dot point */
	if(i.parent().parent().attr('id')!='id_core_div_dpmap'){
	var str = i.parent().parent().parent().children('li.btn-default').html().split(' ')[0] + '.';
		$('#id_modal_input_input').val(str);
	}else{
		$('#id_modal_input_input').val('');
	}
	
	/* after modal is shown, focus on the input field */
	modal_shown_focus('input');
	
	$('#id_core_modal .btn-primary').off('click').on('click',function(c){
		if(c.which!=1){
			return false;
		}else{
			var json = {
				'target_syl' : $('#id_core_select_syllabus').val(),
				'value' : $('#id_modal_input_input').val()}
			socket.emit('save dp',json,function(o){
				if(o=='success'){
					$('#id_core_input_dp').val(json['value'].split(' ')[0]);
					$('#id_core_modal_dp').modal('hide');
					$('#id_core_modal').modal('hide');
				}else{
					info_modal(o);
				}
			})
			return false;
		}
	});
	
	$('#id_core_modal').off('keypress').on('keypress',function(k){
		if(k.which==13){
			var json = {
				'target_syl' : $('#id_core_select_syllabus').val(),
				'value' : $('#id_modal_input_input').val()}
			socket.emit('save dp',json,function(o){
				if(o=='success'){
					$('#id_core_input_dp').val(json['value'].split(' ')[0]);
					$('#id_core_modal_dp').modal('hide');
					$('#id_core_modal').modal('hide');
				}else{
					info_modal(o);
				}
			})
			return false;	
		}
	})
}

/* append space in submit question tab */
function appendspace(i){
	var c = $('#id_add_formgroup_spaces');
	var index = c.children('.row').length - 1;
	switch (i){
		case 'more':
			var newspace = $('#id_add_formgroup_spaces').children('.row').first().clone(true,true);
			newspace.children('label').remove();
			newspace.find('input').val('');
			newspace.find('select').val('lines');
			newspace.children('div').addClass('col-md-offset-3');
			newspace.insertAfter(c.children('.row').eq(index));
		break;
		case 'less':
			c.children('.row').eq(index).remove();
		break;
		default:
		
		break;
	}
	
	var numrows = c.children('.row').length;
	
	if(numrows == 1){
		$('#id_add_btn_lessspace').addClass('disabled');		
	}else if(numrows == 3){
		$('#id_add_btn_morespace').addClass('disabled');
	}else{
		$('#id_add_btn_morespace,#id_add_btn_lessspace').removeClass('disabled');
	}
	
	
	$('#id_add_formgroup_spaces').find('input,select').off('change').change(function(){
		if($('#id_core_textarea_qn').val()!=''){
			var space = 'spacesheader';
			$('#id_add_formgroup_spaces').children('.row').each(function(){
				space += '_' + $(this).children('.form-inline').children('input').val() + '.' + $(this).children('.form-inline').children('select').val();
			});
			
			append_spaces($('#id_add_div_previewspaces'),space);
		}
	});
}

/* add number of blocks of questions in view/generate tab */
function changeblock(i){
	var num = 1;
	
	do{
		num += 1;
	}while($('input[name="radio_mode_'+num+'"]').length!=0)
		
	var refblock = $('.class_view_div_unitblock:first-child');
	var newnum = $('.class_view_div_unitblock').length+1;
	var ctrl = $('#id_view_div_qsctrl');
	switch (i){
		case 'add':
			$('#id_view_btn_addblock').addClass('disabled');
			
			var newblock = refblock.clone(true, true);
			newblock.find('.class_unitblock_panel_optionpanel').children('div.panel-heading').attr('data-target','#id_view_panelbody_'+newnum);
			newblock.find('.class_unitblock_panel_optionpanel').children('div.panel-body').attr('id','id_view_panelbody_'+newnum);
			newblock.find('input[type="radio"]').attr('name','radio_mode_'+num);
			newblock.find('#id_core_input_dp').val('');
			newblock.find('#id_core_btn_choosedp').addClass('disabled');
			
			newblock
				.css('opacity','0.0')
				.insertBefore(ctrl)
				.animate({'opacity':'1.0'},400,function(){
					if($('.class_view_div_unitblock').length==1){
						$('#id_view_btn_removeblock').addClass('disabled');
					}else if($('.class_view_div_unitblock').length==5){
						$('#id_view_btn_addblock').addClass('disabled');
					}else{
						$('#id_view_btn_addblock,#id_view_btn_removeblock').removeClass('disabled');
					}
				});
		break;
		case 'remove':
			$('#id_view_btn_removeblock').addClass('disabled');
			ctrl.prev()
				.animate({'opacity':'0.0'},200,function(){
					ctrl.prev().remove();
					$('#id_view_btn_removeblock').addClass('disabled');
					
					if($('.class_view_div_unitblock').length==1){
						$('#id_view_btn_removeblock').addClass('disabled');
					}else if($('.class_view_div_unitblock').length==5){
						$('#id_view_btn_addblock').addClass('disabled');
					}else{
						$('#id_view_btn_addblock,#id_view_btn_removeblock').removeClass('disabled');
					}
				});
		break;
		default:
		break;		
	}
	
	
}

/* when modal is done showing, what to focus on */
function modal_shown_focus(i){
	switch (i){
		case 'input':
			$('#id_core_modal').off('shown.bs.modal').on('shown.bs.modal',function(){
				$('#id_modal_input_input').focus();
			});
		break;
		default:
		break;
	}
}

/* turn [img1] to true names */
function submit_filter(){
	$('#id_core_textarea_qn').val($('#id_core_textarea_qn').val().replace(/\[img.*?\]/g,function(s){
		if($('.'+s.replace(/\[|\]/g,'').split(' ')[0]).length!=0){
			var returnstring = '['+$('.'+s.replace(/\[|\]/g,'').split(' ')[0]).attr('id');
			for(var i = 1; i<s.replace(/\[|\]/g,'').split(' ').length;i++){
				returnstring += ' ' + s.replace(/\[|\]/g,'').split(' ')[i];
			}
			return returnstring + ']';
		}else{
			return s;
		}
	}));
	$('#id_core_textarea_ans').val($('#id_core_textarea_ans').val().replace(/\[img.*?\]/g,function(s){
		if($('.'+s.replace(/\[|\]/g,'').split(' ')[0]).length!=0){
			var returnstring = '['+$('.'+s.replace(/\[|\]/g,'').split(' ')[0]).attr('id');
			for(var i = 1; i<s.replace(/\[|\]/g,'').split(' ').length;i++){
				returnstring += ' ' + s.replace(/\[|\]/g,'').split(' ')[i];
			}
			return returnstring + ']';
		}else{
			return s;
		}
	}));
}

/* when submit is clicked in add tab */
function addsubmit(){
	
	$('.has-error').removeClass('has-error');
	var flag = true;
	
	if($('#id_core_select_subject').val().replace(' ','')==''){
		$('#id_core_select_subject').parent().parent().addClass('has-error');
		flag = false;
	}
	
	if($('#id_core_textarea_qn').val().replace(' ','')==''){
		$('#id_core_textarea_qn').parent().parent().addClass('has-error');
		flag = false;
	}
	
	if(!flag){
		info_modal('Please provide required information.');
		return false;
	}
	
	submit_filter();
	var space = 'spacesheader';
	$('#id_add_formgroup_spaces').children('.row').each(function(){
		space += '_' + $(this).children('.form-inline').children('input').val()+'.' + $(this).children('.form-inline').children('select').val();
	});
	var json = {
		'hashed_id'	:$('#id_core_input_hashedid').val(),
		'subject'	:$('#id_core_select_subject').val(),
		'question'	:$('#id_core_textarea_qn').val(),
		'answer'	:$('#id_core_textarea_ans').val(),
		'space'		:space,
		'mark'		:$('#id_core_input_marks').val()
		}
		
	$('#id_core_input_addsubmit').addClass('disabled');
	
	socket.emit('add submit',json,function(o){
		
		if(o!='Addition of question successful!'&&o!='Submission of question received. A moderator will assess the submission ASAP.'){
			info_modal('Addition unsuccessful. Contact a system administrator.');
			return;
		}
		
		$('#id_core_input_addsubmit').removeClass('disabled');
		
		/* empty img tank after submission is complete */
		$('.imgtank').empty().addClass('hidden');
		
		/* clear preview */
		$('#id_core_well_qn,#id_core_well_ans').empty().addClass('hidden');
		
		/* need hashed_id to find real id */
		var json1 = {
			'hashed_id'		:$('#id_core_input_hashedid').val(),
			'target_syl'	:$('#id_core_select_syllabus').val(),
			'lvl'			:$('#id_core_input_dp').val()
			}
		if($('#id_core_select_syllabus').val()==''){
			info_modal(o);
			
			/* resetting hashed id, qs and ans text fields */
			$('#id_core_input_hashedid').val($.sha256(Date.now()));
			$('#id_core_textarea_qn,#id_core_textarea_ans').val('');
			
			/* resetting suggested space */
			$('#id_core_mixed_space_num').val('');
			$('#id_core_mixed_space_type').val('lines');
			$('#id_add_formgroup_spaces .row:not(:first-child)').remove();
			$('#id_add_btn_lessspace').addClass('disabled');
			$('#id_add_btn_morespace').removeClass('disabled');
			
			/* resetting suggested marks */
			$('#id_core_input_marks').val('');
			
			new_hashedid();
			
		}else{
			socket.emit('categorise',json1,function(o1){
				if(o1.error){
					info_modal('Error: '+o1.error);
					return;
				}
				if(o1=='successful!'||o1=='pending approval.'){
					info_modal(o + ' Categorisationg into '+json1['target_syl']+' under '+json1['lvl']+' '+o1);
					
					/* resetting hashed id, qs and ans text fields */
					$('#id_core_input_hashedid').val($.sha256(Date.now()));
					$('#id_core_textarea_qn,#id_core_textarea_ans').val('');
					
					/* resetting suggested space */
					$('#id_core_mixed_space_num').val('');
					$('#id_core_mixed_space_type').val('lines');
					$('#id_add_formgroup_spaces .row:not(:first-child)').remove();
					$('#id_add_btn_lessspace').addClass('disabled');
					$('#id_add_btn_morespace').removeClass('disabled');
					
					/* resetting suggested marks */
					$('#id_core_input_marks').val('');
					
					new_hashedid();
				}
			});
		}
	});
}
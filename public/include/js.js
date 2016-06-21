/* id/class _ scope(name or core) _ type (btn/a etc) _ name */
var socket = io();

$(document).ready(function(){
	
	/*
	//pasting image to be implemented in the future... maybe
	window.addEventListener('paste',function(e){
		console.log(e.clipboardData);
		console.log(e.clipboardData.getData('image/bmp'));
	})
	*/
	/* tooltip for question upload */
	$('#id_add_glyphicon_how').tooltip({
		html : 'true',
		placement : 'right',
		trigger : 'click',
		title : '<div class = "text-left">'+
				'To include uploaded images:<br>'+
				'e.g. [imgChem_JPG w=50]<br>'+
				'e.g. [img2 r=90]<br><br>'+
				
				'To format questions or answers:<br>'+
				'e.g. [mcq MULTIPLE CHOICES]<br>'+
				'e.g. [sub SUBSCRIPT]<br>'+
				'e.g. [sup SUPSCRIPT]</div>',
	})
	
	/* mobile upload complete*/
	socket.on('append imgtank',function(i){
		
		var imgno = 1;
		while($('.img'+imgno).length!=0){
			imgno += 1;
		}
		
		appendImgTank($('#id_core_input_hashedid').val(),i,imgno);
		
		/*
		var stringInitialPreview = [];
		var stringInitialPreviewConfig = [];
		
		for (var i = 0; i<$('.imgtank img').length;i++){
			var imgsrc = $('.imgtank').children('img').eq(i).attr('src');
			var imgname = imgsrc.substring(imgsrc.lastIndexOf('/')+1);
			
			stringInitialPreview[i] = '<img src = "'+imgsrc+'" style = "width:160px;">' ;
			stringInitialPreviewConfig[i] = {
				caption : imgname,
				url : 'deletepreview',
				key : imgname
				}
		}
		*/
		
		/* should i disable fileinput and reinitialise it with the existing imgtank items? */
		
		/*
		$('#id_add_file_file').fileinput('destroy');
		$('#id_add_file_file').off().fileinput({
			uploadUrl		:'/upload',
			uploadAsync		:false,
			showUpload		:false,
			showRemove		:false,
			dropZoneEnabled	:true,
			overwriteInitial : false,
			uploadExtraData	:{'hashedid':$('#id_core_input_hashedid').val()},
			
			// need to fix this. need to append all items in .imgtank 
			initialPreview : stringInitialPreview,
			initialPreviewConfig : stringInitialPreviewConfig,
		})
		.on('filedeleted',function(e,k){
			var json = {'hashedid':$('#id_core_input_hashedid').val(),'filename':k}
			//console.log($('#'+id+' .file-footer-caption').html());
			// probably no longer needed this. since unsaved question images gets automatically deleted, and housekeeping deletes unused images 
			socket.emit('delete thumbnail',json,function(o){
				if(o=='done'){
					$('.img'+k.replace('.','_')).remove();
					return true;
				}else if (o=='error'){
					return false;
				}
			});
		})
		.on('filebatchselected',function(event,files){
			$('#id_add_file_file').fileinput('upload');
		})
		.on('filesuccessremove',function(event,id){
			var json = {'hashedid':$('#id_core_input_hashedid').val(),'filename':$('#'+id+' .file-footer-caption').html()}
			//console.log($('#'+id+' .file-footer-caption').html());
			socket.emit('delete thumbnail',json,function(o){
				if(o=='done'){
					$('.img'+$('#'+id+' .file-footer-caption').html().replace('.','_')).remove();
					return true;
				}else if (o=='error'){
					return false;
				}
			});
		})
		.on('filebatchuploadsuccess',function(event, data, previewId, index){
			//works. append <img> this somewhere 
			//data.files[i].name
			for(i=0;i<data.files.length;i++){
				
				var imgno = i;
				do{
					imgno += 1;
				}while($('.img'+imgno).length>0)
					
				
				//$('.imgtank').append('<img src = "'+imgurl+'" id = "img'+data.files[i].name.replace('.','_')+'" class = "col-md-12 img'+data.files[i].name.replace('.','_')+' img'+imgno+'">');
				
				
				appendImgTank($('#id_core_input_hashedid').val(),data.files[i].name,imgno);
				
			}
		})
		*/
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
			$('#id_core_btn_choosedp').removeClass('disabled');
		}else{
			$('#id_core_btn_choosedp').addClass('disabled');
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
			/*
			.on('filesuccessremove',function(event,id){
				var json = {'hashedid':$('#id_core_input_hashedid').val(),'filename':$('#'+id+' .file-footer-caption').html()}
				//console.log($('#'+id+' .file-footer-caption').html());
				socket.emit('delete thumbnail',json,function(o){
					if(o=='done'){
						$('.img'+$('#'+id+' .file-footer-caption').html().replace('.','_')).remove();
						return true;
					}else if (o=='error'){
						return false;
					}
				});
			})
			*/
			.on('filebatchuploadsuccess',function(event, data, previewId, index){
				//works. append <img> this somewhere 
				//data.files[i].name
				
				$('#id_add_file_file').fileinput('clear');
				
				/*
				for(i=0;i<data.files.length;i++){
					
					var imgno = i;
					do{
						imgno += 1;
					}while($('.img'+imgno).length>0)
						
					
					//$('.imgtank').append('<img src = "'+imgurl+'" id = "img'+data.files[i].name.replace('.','_')+'" class = "col-md-12 img'+data.files[i].name.replace('.','_')+' img'+imgno+'">');
					
					
					appendImgTank($('#id_core_input_hashedid').val(),data.files[i].name,imgno);
					
				}
				*/
			})
	}
	
	$('input[type="radio"]').off('change').change(function(){
		$(this).parent().parent().parent().children('div').children('input')
			.prop('disabled',true)
			.val('');
		$(this).parent().parent().children('input').prop('disabled',false);
	});
	
	/* when .btn is clicked */
	$('.btn').click(function(){
		if($(this).attr('id')==undefined||$(this).prop('disabled')==true||$(this).hasClass('disabled')){
			return;
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
			default:
				console.log('no btn clicked');
			break;
		}
	});
	
	/* when anchor links are clicked */
	$('a').click(function(){
		a_id_split = $(this).attr('id').split('_');
			console.log(a_id_split[1]);
		switch(a_id_split[1]){
			/* when anchors in navbar is clicked */
			case 'navbar':
				if(a_id_split[2]=='home'){
					window.location.href = '/';
				}else{
					window.location.href = '/'+a_id_split[2];
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
			if(k.which==9||k.which==13||k.which==116||(k.which>47&&k.which<58)||k.which==32||k.which==109||k.which==189||(k.which>95&&k.which<106)){
				$(this).tooltip('hide');
			}else{
				/* error message here */
				$(this).tooltip('show');
				return false;
			}
		})
	}
	
	/* preview functionality */
	$('#id_core_textarea_qn,#id_core_mixed_space_num').off('keyup').keyup(function(){
		if($('#id_core_textarea_qn').val()==''){
			$('#id_core_well_qn').addClass('hidden');
		}else{
			if($('#id_core_well_qn').hasClass('hidden')){
				$('#id_core_well_qn')
					.removeClass('hidden')
					.html('<div class = "row"><div class = "col-md-2"><h4>5.</h4></div><div class = "col-md-9" id = "id_core_div_previewbody"><h4></h4><div class = "row" id = "id_add_div_previewspaces"></div></div></div>');
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
	
/* functions */
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
	
	$('#id_view_modal_option .btn').off('click').click(function(){
		if($(this).hasClass('btn-primary')){
			if($('input:checked').val()=='all'){
				var outputString = $('input:checked').val();
			}else{
				var outputString = $('input:checked').val() + ' : ' + $('input:checked').parent().next().val();
			}
			$('.btn-option.disabled').parent().prev().children('input').val(outputString);
		}
		$('#id_view_modal_option').modal('hide');
	});
	
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
		
		$('.class_view_div_unitblock').each(function(){
			var mode = $(this).find('#id_view_input_option').val().split(' : ')[0];
			if(mode!='all'){
				var length = $(this).find('#id_view_input_option').val().split(' : ')[1];
				
				/* if input is not a number, set it to 10 instead */
				if(!$.isNumeric(length)||length<1){
					length = 10;
				}
			}else{
				var length = null;
			}
			var index = $(this).index();
			
			switch($(this).children('ul.nav-tabs.nav').children('li.active').children('a').attr('id')){
				/* by subject tab */
				case 'id_view_tab1':
					var json = {
						'mode' : 'subject',
						'subject' : $(this).find('#id_core_select_subject').val()
						}
					socket.emit('view submit',json,function(o){
						if(o.length>0){
							$('#id_view_div_preview .panel-body').append('<div class = "row" id = "id_view_div_preview_'+index+'"></div>');
							view_append_preview(mode, length,$('#id_view_div_preview_'+index),o);
							
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
						}
					socket.emit('view submit',json,function(o){
						if(o.length>0){
							$('#id_view_div_preview .panel-body').append('<div class = "row" id = "id_view_div_preview_'+index+'"></div>');
							view_append_preview(mode, length,$('#id_view_div_preview_'+index),o);
							
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
	
}

/* according to mode and length, append row units to appropriate targets */
function view_append_preview(mode, length, target, row){
	switch (mode){
		case 'random':
			var counter = 1;
			do{
				append_one(counter,target,row[random(counter)%(row.length)]);
				counter ++;
			}while(counter - 1 < length)
		break;
		case 'all':
			for (var i=0;i<row.length;i++){
				append_one(i+1,target,row[i]);
			}
		break;
		case 'select':
			var decode_l = decode_select(length);
			if(decode_l==null){
				for (var i=0;i<row.length;i++){
					append_one(i+1,target,row[i]);
				}
			}else{
				/* introduction of upper and lower bound, in case user inputted a number outside the bound */
				var upper_bound = Math.min(decode_l[1],row.length);
				var lower_bound = Math.min(Number(decode_l[0])-1,Number(row.length)-1);
				for (var i=lower_bound;i<upper_bound;i++){
					append_one(i+1,target,row[i]);
				}
			}
		break;
		default:
		break;
	}
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
		'<div class = "row id_sync_active">'+
			'<div class = "col-md-1 col-md-offset-1"><h4>'+counter+'.</h4>'+
			'</div>'+
			'<div class = "col-md-9" id = "id_view_div_qncontainer"><h4></h4>'+
				'<div class = "row" id = "id_view_div_spaces"></div>'+
			'</div>'+
		'</div>';
	target.append(qn_container);
	$('.id_sync_active').find('#id_view_div_qncontainer').children('h4').html(parsing_preview(json.question,json.hashed_id));
	append_spaces($('.id_sync_active #id_view_div_spaces'),json.space+'_1.blank');
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
			/* add new cirriculum */
			socket.emit('add new curriculum',$('#id_modal_input_input').val(),function(o){
				if(o=='New curriculum created!'){
					info_modal(o);
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
			socket.emit('add new curriculum',$('#id_modal_input_input').val(),function(o){
				if(o=='New curriculum created!'){
					info_modal(o);
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
	
	return l;
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
		var filename = isplit[0].substring(0,isplit[0].lastIndexOf('_'));
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
			$('.modal-body .panel-body').append('<div class = "row clickable"><div class = "col-md-12">'+$(this).html()+'</div></div>');
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
					info_modal('New dot point saved!');
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
					info_modal('New dot point saved!');
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
	socket.emit('add submit',json,function(o){
		
		if(o!='Addition of question successful!'){
			info_modal('Addition unsuccessful. Contact a system administrator.');
			return;
		}
		
		/* empty img tank after submission is complete */
		$('.imgtank').empty();
		
		/* clear preview */
		$('#id_core_well_qn,#id_core_well_ans').empty().addClass('hidden');
		
		/* need hashed_id to find real id */
		var json1 = {
			'hashed_id'		:$('#id_core_input_hashedid').val(),
			'target_syl'	:$('#id_core_select_syllabus').val(),
			'lvl'			:$('#id_core_input_dp').val()
			}
		if($('#id_core_select_syllabus').val()==''){
			info_modal('Question added successfully.');
			
			/* resetting hashed id, qs and ans text fields */
			$('#id_core_input_hashedid').val($.sha256(Date.now()));
			$('#id_core_textarea_qn,#id_core_textarea_ans').val('');
			
			/* resetting suggested space */
			$('#id_core_mixed_space_num').val('');
			$('#id_core_mixed_space_type').val('lines');
			$('#id_add_formgroup_spaces .row:not(:first-child)').remove();
			
			/* resetting suggested marks */
			$('#id_core_input_marks').val('');
			
			
			new_hashedid();
			
		}else{
			socket.emit('categorise',json1,function(o1){
				if(o1=='Categorise successful!'){
					info_modal('Question added successfully. Categorised into '+json1['target_syl']+' under '+json1['lvl']);
					
					/* resetting hashed id, qs and ans text fields */
					$('#id_core_input_hashedid').val($.sha256(Date.now()));
					$('#id_core_textarea_qn,#id_core_textarea_ans').val('');
					
					/* resetting suggested space */
					$('#id_core_mixed_space_num').val('');
					$('#id_core_mixed_space_type').val('lines');
					$('#id_add_formgroup_spaces .row:not(:first-child)').remove();
					
					/* resetting suggested marks */
					$('#id_core_input_marks').val('');
					
					new_hashedid();
				}
			});
		}
	});
}
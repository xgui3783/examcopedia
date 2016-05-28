/* id/class _ scope(name or core) _ type (btn/a etc) _ name */
var socket = io();

$(document).ready(function(){
	
	/* mobile upload complete*/
	socket.on('mobile upload',function(i){
		
		var imgno = 1;
		var imgurl = 'img/'+$('#id_core_input_hashedid').val()+'/'+i;
		while($('.img'+imgno).length!=0){
			imgno += 1;
		}
		$('.imgtank').append('<img src = "'+imgurl+'" id = "img'+i.replace('.','_')+'" class = "col-md-12 img'+i.replace('.','_')+' img'+imgno+'">');
		
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
		
		/* should i disable fileinput and reinitialise it with the existing imgtank items? */
		$('#id_add_file_file').fileinput('destroy');
		$('#id_add_file_file').off().fileinput({
			uploadUrl		:'/upload',
			uploadAsync		:false,
			showUpload		:false,
			showRemove		:false,
			dropZoneEnabled	:true,
			overwriteInitial : false,
			uploadExtraData	:{'hashedid':$('#id_core_input_hashedid').val()},
			
			/* need to fix this. need to append all items in .imgtank */
			initialPreview : stringInitialPreview,
			initialPreviewConfig : stringInitialPreviewConfig,
		})
		.on('filedeleted',function(e,k){
			var json = {'hashedid':$('#id_core_input_hashedid').val(),'filename':k}
			//console.log($('#'+id+' .file-footer-caption').html());
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
				var imgurl = 'img/'+$('#id_core_input_hashedid').val()+'/'+data.files[i].name;
				var imgno = i;
				do{
					imgno += 1;
				}while($('.img'+imgno).length>0)
				$('.imgtank').append('<img src = "'+imgurl+'" id = "img'+data.files[i].name.replace('.','_')+'" class = "col-md-12 img'+data.files[i].name.replace('.','_')+' img'+imgno+'">');
			}
		})
		
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
					var imgurl = 'img/'+$('#id_core_input_hashedid').val()+'/'+data.files[i].name;
					var imgno = i;
					do{
						imgno += 1;
					}while($('.img'+imgno).length>0)
					$('.imgtank').append('<img src = "'+imgurl+'" id = "img'+data.files[i].name.replace('.','_')+'" class = "col-md-12 img'+data.files[i].name.replace('.','_')+' img'+imgno+'">');
				}
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
					/*
					case 'adddiagram':
						adddiagram();
					break;
					*/
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
		switch(a_id_split[1]){
			
			/* when anchors in navbar is clicked */
			case 'navbar':
				if(a_id_split[2]=='home'){
					window.location.href = '/';
				}else{
					window.location.href = '/'+a_id_split[2];
				}
			break;
			default:
				console.log('no anchor clicked');
			break;
		}
		return false;
	})
	
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
	
var addAFile = 
	'<form id = "id_add_form_imgupload" role = "form" method="post">'+
		'<input class = "hidden" id = "id_modal_hiddeninput_hashedid" name = "hashed_id">'+
		'<div class = "form-group">'+
			//'<label class = "control-label col-md-3" for = "id_modal_button_button"></label>'+
			'<input data-allowed-file-extensions=\'["jpg", "gif", "png", "svg" , "pdf", "tiff"]\' id = "id_modal_file_file" name = "id_modal_file_file[]" data-show-upload="false" data-show-caption="true" multiple type = "file">'+
		'</div>'+
	'</form>';
	
/* functions */

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

function viewgo(){
	if($('#id_core_select_syllabus').val()==''){
		info_modal('Please select a syllabus!');
		modal_shown_focus('btn');
	}else{
		/* add replace state and push state */
		
		/* fade out id_view_div_form */
		$('#id_view_div_form').animate({'opacity':'0.0'},400,function(){
			$(this).addClass('hidden');
		});
		
		/* clean out any previous preview data */
		$('#id_view_div_preview .panel-body').html('');
		
		$('.class_view_div_unitblock').each(function(){
			var mode = $(this).find('input[type="radio"]:checked').val();
			if(mode!='all'){
				var length = $(this).find('input[type="radio"]:checked').parent().parent().children('input').val();
			}else{
				var length = null;
			}
			var index = $(this).index();
			var json = {
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
		})
	}
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
		case 'selected':
			if(length<row.length){
				var l = length;
			}else{
				var l = row.length;
			}
			for (i=0;i<l;i++){
				append_one(i,target,row[i]);
			}
		break;
		default:
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
	var home = $('.btn-default.active').parent().parent().children('div').children('select');
	for (var i = 0;i<home.children('option').length;i++){
		if(home.children('option').eq(i).html()==$('#id_modal_input_input').val()){
			info_modal('This name is already in use.');
			return false;
		}
	}
	
	$('#id_core_modal').modal('hide');
	
	/* also check if the name is in use already */
	$('.btn-default.active').parent().parent().children('div').children('select').append('<option>'+$('#id_modal_input_input').val()+'</option>');
	$('.btn-default.active').parent().parent().children('div').children('select').val($('#id_modal_input_input').val());
	$('#id_core_select_syllabus').change();
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
	$('#id_core_modal_dp select').html('<option></option>').first().change();
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
	return k;
}

function parsing_mcq(i,s){
	var letter = String.fromCharCode(64 + i);
	var string = s.replace(/\[mcq |\]/g,'');
	return '<div class = "row"><div class = "col-md-2">'+letter+'</div><div class = "col-md-8">'+string+'</div></div>';
}

function parsing_img(i,h_id){
	if($('.'+i.replace(/\[|\]/g,'').split(' ')[0]).length!=0){
		return $('.'+i.replace(/\[|\]/g,'').split(' ')[0])[0].outerHTML;
	}else{
		return '<img class = "col-md-12" src = img/'+ h_id +'/'+i.substring(4).split(/\ |\]|\_/g)[0]+'.'+i.substring(4).split(/\ |\]|\_/g)[1]+'>';
	}
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

/* might have became obsolete */
/*
function adddiagram(){
	$('#id_core_modal .modal-title').html('Add diagrams');
	
	$('#id_core_modal .modal-body')
		.html(addAFile);
	
	$('#id_modal_hiddeninput_hashedid').val($('#id_core_input_hashedid').val());
	$('#id_core_modal label').html('Select up to five files:');
	$('#id_modal_file_file')
		.fileinput({
			uploadUrl		:'/upload',
			uploadAsync		:false,
			showUpload		:false,
			showRemove		:true,
			minFileCount	:1,
			maxFileCount	:5,
			dropZoneEnabled	:true,
			uploadExtraData	:{'hashedid':$('#id_core_input_hashedid').val()}
		})
		.on('filebatchselected',function(event,files){
			$('#id_modal_file_file').fileinput('upload');
		})
	$('#id_core_modal').modal('show');
	
	$('#id_core_modal .btn-primary').off('click').on('click',function(c){
		if(c.which!=1){
			return;
		};
	})
}
*/

function choosedp(){
	$('#id_core_modal_dp .row.form-group select').html('<option></option>');
	socket.emit('populate dot points',$('#id_core_select_syllabus').val(),function(o){
		for(i=0;i<o.length;i++){
			var obj = o[i].lvl.replace('.info','');
			var lvl = obj.split('.').length;
			var concatString = obj+' '+o[i].description;
			$('#id_core_modal_dp .row.form-group').eq(Number(lvl)-1).children('div').children('select').append('<option>'+concatString+'</option>');
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
function adddp(){
	$('#id_core_modal .modal-title').html('Add a New Dot Point');
	$('#id_core_modal .modal-body')
		.html(appendAPanel)
		.append(appendAnInput)
		.append('<hr>');
	
	$('#id_core_modal .panel-heading').html('Existing DPs');
	$('#id_core_modal label').html('New DP to be added:');
	
	/* append existing dot points to the panel */
	show_existing_items();
	
	$('#id_core_modal').modal('show');
	
	/* automatically generates the prefix of the dot point */
	var str = '';
	var split = $('#id_core_input_dp').val().split('.');
	var i = 0;
	while(i<($('.modal-body form').children('div').index($('.modal-body .btn-default.active').parent().parent()))&&i<5){
		str += split[i] + '.';
		i++;
	}
	$('#id_modal_input_input').val(str);
	
	/* after modal is shown, focus on the input field */
	modal_shown_focus('input');
	
	$('#id_core_modal .btn-primary').off('click').on('click',function(c){
		if(c.which!=1){
			return false;
		}else{
			$('#id_core_modal_dp .btn-default.active').parent().prev().children('select')
				.append('<option>'+$('#id_modal_input_input').val()+'</option>')
				.val($('#id_modal_input_input').val())
				.change();
				
			$('#id_core_modal').modal('hide');
			
			var json = {'target_syl':$('#id_core_select_syllabus').val(),'target_level':$('#id_core_input_dp').val(),'value':$('#id_modal_input_input').val()}
			socket.emit('save dp',json,function(o){
				
			})
			return false;
		}
	});
	
	$('#id_core_modal').off('keypress').on('keypress',function(k){
		if(k.which==13){
			$('#id_core_modal_dp .btn-default.active').parent().prev().children('select')
				.append('<option>'+$('#id_modal_input_input').val()+'</option>')
				.val($('#id_modal_input_input').val())
				.change();
			
			$('#id_core_modal').modal('hide');
			
			var json = {'target_syl':$('#id_core_select_syllabus').val(),'target_level':$('#id_core_input_dp').val(),'value':$('#id_modal_input_input').val()}
			socket.emit('save dp',json,function(o){
				
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
				$('<div class = "row">'+
					'<div class = "col-md-9 col-md-offset-3 form-inline">'+
						'<input  class = "form-control" type = "text" id = "id_core_mixed_space_num"></input> '+
						'<select class = "form-control" id = "id_core_mixed_space_type">'+
							'<option selected>lines</option>'+
							'<option>box</option>'+
							'<option>blank</option>'+
						'</select>'+
					'</div>'+
				'</div>').insertAfter(c.children('.row').eq(index));
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
	var ctrl = $('#id_view_div_qsctrl');
	switch (i){
		case 'add':
			var newblock = refblock.clone(true, true);
			newblock.find('input[type="radio"]').attr('name','radio_mode_'+num);
			newblock.insertBefore(ctrl);
		break;
		case 'remove':
			ctrl.prev().remove();
		break;
		default:
		break;
	}
	
	
	if($('.class_view_div_unitblock').length==1){
		$('#id_view_btn_removeblock').addClass('disabled');
	}else if($('.class_view_div_unitblock').length==5){
		$('#id_view_btn_addblock').addClass('disabled');
	}else{
		$('#id_view_btn_addblock,#id_view_btn_removeblock').removeClass('disabled');
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
			return '['+$('.'+s.replace(/\[|\]/g,'').split(' ')[0]).attr('id')+']';
		}else{
			return s;
		}
	}));
	$('#id_core_textarea_ans').val($('#id_core_textarea_ans').val().replace(/\[img.*?\]/g,function(s){
		if($('.'+s.replace(/\[|\]/g,'').split(' ')[0]).length!=0){
			return '['+$('.'+s.replace(/\[|\]/g,'').split(' ')[0]).attr('id')+']';
		}else{
			return s;
		}
	}));
}

/* when submit is clicked in add tab */
function addsubmit(){
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
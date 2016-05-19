/* id/class _ scope(name or core) _ type (btn/a etc) _ name */
var socket = io();

$(document).ready(function(){
	
	/* socket io core functions */
	socket.on('throw error',function(i){
		info_modal(i);
	})
	
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
	$('#id_core_input_hashedid').val($.sha256(Date.now().toString()));
	
	/* when .btn is clicked */
	$('.btn').click(function(){
		if($(this).attr('id')==undefined){
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
					case 'adddiagram':
						adddiagram();
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
	
/* functions */

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
			$('#id_core_modal').modal('hide');
		}
	});
	
	/* binding enter key as clicking .btn-primary */
	$('#id_core_modal').off('keypress').on('keypress',function(k){
		if(k.which==13){
			modal_ok();
			$('#id_core_modal').modal('hide');
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
	
	/* also check if the name is in use already */
	$('.btn-default.active').parent().children('div').children('select').append('<option>'+$('#id_modal_input_input').val()+'</option>');
	$('.btn-default.active').parent().children('div').children('select').val($('#id_modal_input_input').val());
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
				info_modal(o);
				modal_ok();
				$('#id_core_modal').modal('hide');
			});
			reset_dp();
			return false;
		}
	});
	
	$('#id_core_modal').off('keypress').on('keypress',function(k){
		if(k.which==13){
			socket.emit('add new curriculum',$('#id_modal_input_input').val(),function(o){
				info_modal(o);
				modal_ok();
				$('#id_core_modal').modal('hide');
			});
			reset_dp();
			return false;			
		}
	})
}

function reset_dp(){
	$('#id_core_input_dp').val('');
	$('#id_core_modal_dp select').html('<option></option>').first().change();
}

function adddiagram(){
	$('#id_core_modal .modal-title').html('Add diagrams');
	
	$('#id_core_modal .modal-body')
		.html(appendAPanel)
		.append(addAButton)
		.append('<hr>');
		
	$('#id_core_modal .panel-heading').html('Uploaded diagrams');
	$('#id_core_modal #id_modal_button_button').html('Browse and select');
	$('#id_core_modal label').html('Drag and drop');
	$('#id_core_modal').modal('show');
	
	$('#id_core_modal .btn-primary').off('click').on('click',function(c){
		if(c.which!=1){
			return;
		}
		
	})
}

function choosedp(){
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
}

/* add number of blocks of questions in view/generate tab */
function changeblock(i){
	var refblock = $('.class_view_div_unitblock:first-child');
	var ctrl = $('#id_view_div_qsctrl');
	var lastblock = $('.class_view_div_unitblock:last-child');
	switch (i){
		case 'add':
			refblock.clone().insertBefore(ctrl);
		break;
		case 'remove':
			ctrl.prev().remove();
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

/* when submit is clicked in add tab */
function addsubmit(){
	var space = 'spacesheader';
	$('#id_add_formgroup_spaces').children('.row').each(function(){
		space += '_' + $(this).children('.form-inline').children('input').val() + $(this).children('.form-inline').children('select').val();
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
				}
			});
		}
	});
}
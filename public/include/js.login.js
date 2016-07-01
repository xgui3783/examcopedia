$(document).ready(function(){
	$('#id_login_img_googlesignin').click(function(){
		window.location.href = '/auth/google';
	});
	$('#id_login_img_facebooksignin').click(function(){
		window.location.href = '/auth/facebook';
	});
	
	$('.page').css('min-height',$(window).height());
	
	$(window).resize(function(){
		$('.page').css('min-height',$(window).height());
	});
	
	queryRandomQ();
});


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


function queryRandomQ(){
	var json = {
		'mode':'random',
		'subject':'',
		'quantity':1,
		'searchstring':''}
	$.ajax({
		type : 'POST',
		url : 'pingQ',
		data : json,
		success : function(o){
			$('#id_login_div_randomQuestionRenderer').html(parsing_preview(o.question,o.hashed_id))
		}
	})
}
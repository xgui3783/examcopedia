$(document).ready(function(){
	$('#id_login_img_googlesignin').click(function(){
		window.location.href = '/auth/google';
	});
	$('#id_login_img_facebooksignin').click(function(){
		window.location.href = '/auth/facebook';
	})
});
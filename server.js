#!/bin/env node
var http = require('http');
var fs = require('fs-extra');
var express = require('express');
var app = require('express')();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var mysql = require('mysql');
var sha256 = require('js-sha256');
var multer = require('multer');
var gm = require('gm').subClass({imageMagick:true})
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var googleStrategy = require('passport-google-oauth').OAuth2Strategy;
var facebookStrategy = require('passport-facebook').Strategy;
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var session = require('express-session');
var PDFDoc = require('pdfkit');
var request = require('request');
var passportSocketIO = require('passport.socketio');
var nodemailer = require('nodemailer');

var logos = [
	'join.examcopedia.club - crowd sourced, free forever'
	];


app.set('persistentDataDir',process.env.OPENSHIFT_DATA_DIR||'./public/');

var authConfig = require(app.get('persistentDataDir')+'include/config.js');

var transporter = nodemailer.createTransport(authConfig.email);

var verifyEmail = transporter.templateSender({
	subject : 'examcopedia registration - confirmation of your e-mail address',
	text : 'Dear {{username}}: \n\nTo complete your registration at examcopedia, copy and paste the link below to the address bar and hit Enter. This link will expire in 1 hour and 39 minutes. Why 1 hour and 39 minutes? I don\'t know. I think it\'s a rather nice number. \n\n{{link}}\n\nIf you did not request the registration at examcopedia, you can safely ignore and delete this e-mail.\n\n🐼',
	html : 'Dear {{username}}: <br><br>To complete your registration at examcopedia, click the link below or copy and paste the link below to the address bar and hit Enter. This link will expire in 1 hour and 39 minutes. Why 1 hour and 39 minutes? I don\'t know. I think it\'s a rather nice number. <br><br><a href = "{{link}}">{{link}}</a><br><br>If you did not request the registration at examcopedia, you can safely ignore and delete this e-mail.<br><br>🐼',
},{
	from : '"No Reply" <noreply-examcopedia@pandamakes.com.au>',
})

var thankyouEmail = transporter.templateSender({
	subject : 'Confirmation of registration',
	text : 'Dear {{username}}: \n\nThank you for registering. \n\nWe hate spam mails, too. We promise this is the last e-mail we will send.\n\n\n\n🐼',
	html : 'Dear {{username}}: <br><br>Thank you for registering.  <br><br>We hate spam mails, too. We promise this is the last e-mail we will send.<br><br>🐼',
},{
	from : '"No Reply" <noreply-examcopedia@pandamakes.com.au>',
})

app.set('mysqlhost',process.env.OPENSHIFT_MYSQL_DB_HOST||'localhost');
app.set('mysqluser',process.env.OPENSHIFT_MYSQL_DB_USERNAME||'root');
app.set('mysqlpswd',process.env.OPENSHIFT_MYSQL_DB_PASSWORD||'');
app.set('mysqldb','examcopedia');

var MySQLStore = require('express-mysql-session')(session);
var options = {
		host : app.get('mysqlhost'),
		user : app.get('mysqluser'),
		password : app.get('mysqlpswd'),
		database : app.get('mysqldb'),
	};
	

var sessionStore = new MySQLStore(options);

app.use(bodyParser.urlencoded({extended:true}));
app.use(session({resave:true,saveUninitialized:true,secret : 'pandaeatspeanuts', store : sessionStore ,cookie:{maxAge : 86400000}}));
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

io.use(passportSocketIO.authorize({
	secret : 'pandaeatspeanuts',
	store : sessionStore,
	success : function(obj,accept){
		/* funciton to call when passport socketio auth succeeds. needs to call accept(); */
		accept();
		},
	fail : function(data,message,error,accept){
		accept(null,!error)
		/* function to call when passport socket io auth fails for whatever reason */
		},
}))


var storage = multer.diskStorage({
	/* should check here if destination exist. if does not exist, create it. */
	destination	: function (req, files, callback){
		fs.stat('uploads',function(e,s){
			if(e){
				fs.mkdir('uploads',function(e1){
					if(e1){
						catch_error(e1);
					}
					else{
						callback(null, 'uploads');
					}
				});
			}else{
				callback(null, 'uploads')
			}
		})
	},
	filename : function(req,files,callback){
		callback(null, files.originalname);
	}
})

var mobileStorage = multer.diskStorage({
	destination : function (req,file,callback){
		callback(null, 'mobileuploads');
	},
	filename : function(req,file,callback){
		callback(null, file.originalname);
	}
})

var ocrStorage = multer.diskStorage({
	destination : function (req,file,callback){
		fs.stat('ocrStorage',function(e,s){
			if(e){
				catch_error(e);
				fs.mkdir('ocrStorage',function(e1){
					if(e1){
						catch_error(e1);
					}
					else{
						callback(null, 'ocrStroage');
					}
				});
			}else{
				callback(null, 'ocrStorage') 
			}			
		})
	},
	filename : function(req,file,callback){
		callback(null,file.originalname);
	}
})

var upload = multer({storage : storage}).single('id_modal_file_file[]',5);
var uploadMobile = multer({storage : mobileStorage}).single('photo');
var uploadOCR = multer({storage : ocrStorage}).single('photo');

/* maybe obsolete */
/*
app.post('/upload',function(req,res){
	upload(req,res,function(e){
		fs.mkdir(app.get('persistentDataDir')+'img/'+req.body.hashedid + '/', function(e1){
			if(!e1 || (e1 && e1.code == 'EEXIST')){
				for (i = 0; i<req.files.length; i++){
					
					
					/*
					var originalname = req.files[i].originalname;
					resizeImage('uploads/',app.get('persistentDataDir')+'img/'+req.body.hashedid + '/',req.files[i].originalname,function(o){
						
						if(o=='done'){
							io.sockets.to(req.body.hashedid).emit('append imgtank',originalname);
							var json = {
								message :'success'
							};
							res.send(json);
						}else{
							catch_error(o);
							res.send(o);
						}
					})
					*/
					
					/*
					fs.rename('uploads/' + req.files[i].originalname,app.get('persistentDataDir')+'img/'+req.body.hashedid + '/' + req.files[i].originalname,function(e2){
						if(e2){
							catch_error(e2);
						}else{
						}
					});
					/*
				}
			}else{
				catch_error(e1);
				res.send(e1);
			}
		});
	})
});
*/
function altCostume(dir,filename,callback){
	var alt1name = filename.substring(0,filename.lastIndexOf('.'))+'_alt1'+filename.substring(filename.lastIndexOf('.'));
	var alt2name = filename.substring(0,filename.lastIndexOf('.'))+'_alt2'+filename.substring(filename.lastIndexOf('.'));
	
	gm(dir+filename).edge(1).negative().write(dir+alt1name,function(e1){
		if(e1){
			catch_error(e1);
		}else{
			gm(dir+filename).edge(2).negative().write(dir+alt2name,function(e3){
				if(e3){
					catch_error(e3);
				}else{
					callback('done');
				}
			});
		}
	});
}

/* when files are uploaded, they are stored on a temporary storage loc, and then they are resized and written to the permanent loc */
function resizeImage(srcDir,destDir,filename,callback){
	gm(srcDir+filename).size(function(e,r){
		if(e){
			catch_error(e);
		}else{
			if(r.width!=undefined){
				if(r.width>1024){
					gm(srcDir+filename).resize(1024).write(destDir+filename,function(e){
						altCostume(destDir,filename,function(o){
							if(o=='done'){
								callback('done')
							}
						})
					});
				}else{
					gm(srcDir+filename).write(destDir+filename,function(e){
						altCostume(destDir,filename,function(o){
							if(o=='done'){
								callback('done')
							}
						})

					});
				}
				
				/* after resize, alt costume are created */
			}
		}
	})
}

/* do the rotation, delete files not needed by the question */
function cleanup(hashedid,q,a){
	var path = app.get('persistentDataDir')+'img/'+hashedid+'/';
	var toBeRotated=[];
	
	/* delete unused images */
	fs.readdir(path,function(e,f){
		if(f==undefined){
			/* if no images were uploaded, then life's but a dream */
		}else{
			f.forEach(function(v){
				var filename = v.substring(0,v.lastIndexOf('.'));
				/* .jpg .png etc */
				var extension = v.substring(v.lastIndexOf('.')); 
				var containAlt = (filename.substring(filename.length-5)=='_alt1'||filename.substring(filename.length-5)=='_alt2');
				if(containAlt){
					fs.stat(path+filename.substring(0,filename.length-5)+extension,function(e,s){
						if(e){
							/* probably does not exist */
							/* filename = filename */
						}else{
							/* probably exist */
							filename = filename.substring(0,filename.length-5);
						}
						
						var inUseQ = (q.indexOf('img'+filename+'_'+extension.substring(1))>-1)||(q.indexOf('img'+filename+'_alt1_'+extension.substring(1))>-1)||(q.indexOf('img'+filename+'_alt2_'+extension.substring(1))>-1);
						var inUseA = (a.indexOf('img'+filename+'_'+extension.substring(1))>-1)||(a.indexOf('img'+filename+'_alt1_'+extension.substring(1))>-1)||(a.indexOf('img'+filename+'_alt2_'+extension.substring(1))>-1);
						
						if(!inUseQ&&!inUseA){
							fs.unlink(path+filename+extension,function(e){
								if(e){
									catch_error(e);
								}
							});
							fs.unlink(path+filename+'_alt1'+extension,function(e){
								if(e){
									catch_error(e);
								}
							});
							fs.unlink(path+filename+'_alt2'+extension,function(e){
								if(e){
									catch_error(e);
								}
							});
						}
						
					});
				}else{
					var inUseQ = (q.indexOf('img'+filename+'_'+extension.substring(1))>-1)||(q.indexOf('img'+filename+'_alt1_'+extension.substring(1))>-1)||(q.indexOf('img'+filename+'_alt2_'+extension.substring(1))>-1);
					var inUseA = (a.indexOf('img'+filename+'_'+extension.substring(1))>-1)||(a.indexOf('img'+filename+'_alt1_'+extension.substring(1))>-1)||(a.indexOf('img'+filename+'_alt2_'+extension.substring(1))>-1);
					
					if(!inUseQ&&!inUseA){
						fs.unlink(path+filename+extension,function(e){
							if(e){
								catch_error(e);
							}
						});
						fs.unlink(path+filename+'_alt1'+extension,function(e){
							if(e){
								catch_error(e);
							}
						});
						fs.unlink(path+filename+'_alt2'+extension,function(e){
							if(e){
								catch_error(e);
							}
						});
					}
				}
				
			})
		}
	})
	
	/* imgs that were requested to be rotated and remove rotation param */
	cleaned_q = q.replace(/\[img.*?\]/g,function(s){
		s_split = s.replace(/\[|\]/g,'').split(' ');
		var returnstring = '['+s_split[0];
		for (var i = 1; i<s_split.length;i++){
			if(s_split[i].substring(0,2)=='r='){
				var r = s_split[i].split('=')[1];
				toBeRotated.push([s_split[0],r]);
				
				/*
				if(r==90||r==180||r==270){
					toBeRotated.push([s_split[0],r]);
				}
				*/
			}else{
				returnstring +=' '+s_split[i];
			}
		}
		return returnstring+']';
	})
	
	cleaned_a = a.replace(/\[img.*?\]/g,function(s){
		s_split = s.replace(/\[|\]/g,'').split(' ');
		var returnstring = '['+s_split[0];
		for (var i = 0; i<s_split.length;i++){
			if(s_split[i].substring(0,2)=='r='){
				var r = s_split[i].split('=')[1];
				toBeRotated.push([s_split[0],r]);
				
				/*
				if(r==90||r==180||r==270){
					toBeRotated.push([s_split[0],r]);
				}
				*/
			}else{
				returnstring +=' '+s_split[i];
			}
		}
		return returnstring+']';
	})
	
	rotateImage(hashedid,toBeRotated);
	
	return [hashedid,cleaned_q,cleaned_a];
}

/* need to figure out what if different alt costume was used at different places */
function rotateImage(hashed_id,arrayIn){
	var path = app.get('persistentDataDir')+'img/'+hashed_id+'/';
	var arrayDone = [];
	
	for(var j = 0; j<arrayIn.length; j++){
		var filename = arrayIn[j][0].substring(0,arrayIn[j][0].lastIndexOf('_')).substring(3);
		var extension = '.'+arrayIn[j][0].substring(arrayIn[j][0].lastIndexOf('_')+1);
		var containAlt = (filename.substring(filename.length-5)=='_alt1'||filename.substring(filename.length-5)=='_alt2');
		if(containAlt){
			fs.stat(path+filename.substring(0,filename.length-5)+extension,function(e,s){
				if(e){
					/* probably does not exist */
					/* filename = filename */
				}else{
					/* probably exist */
					filename = filename.substring(0,filename.length-5);
				}
				
				var flag = true;
				for(var k = 0;k<arrayDone.length;k++){
					if(arrayDone[k]==filename){
						flag = false;
					}
				}
				if(flag){
					arrayDone.push(filename);
					rotateImageBackend(hashed_id,filename,extension,arrayIn[j][1]);
				}
			});
		}else{
			var flag = true;
			for(var k = 0;k<arrayDone.length;k++){
				if(arrayDone[k]==filename){
					flag = false;
				}
			}
			if(flag){
				arrayDone.push(filename);
				rotateImageBackend(path,hashed_id,filename,extension,arrayIn[j][1]);
			}
		}
	}
}

function rotateImageBackend(path,hashed_id,filename,extension,r){
	gm(path+filename+extension).rotate('#ffffff',r).write(path+filename+extension,function(e){
		if(e){
			catch_error(e);
		}
	});
	gm(path+filename+'_alt1'+extension).rotate('#ffffff',r).write(path+filename+'_alt1'+extension,function(e){
		if(e){
			catch_error(e);
		}
	});
	gm(path+filename+'_alt2'+extension).rotate('#ffffff',r).write(path+filename+'_alt2'+extension,function(e){
		if(e){
			catch_error(e);
		}
	});
}

app.post('/uploadmobile2',function(req,res){
	uploadMobile(req,res,function(e){
		if(e){
			catch_error(e);
			//res.send('Error!'+e);
		}else{
			if(io.sockets.adapter.rooms[req.body.hashedid]!=undefined){
				fs.mkdir(app.get('persistentDataDir')+'img/'+req.body.hashedid+'/',function(e1){
					if(!e1 || e1 && e1.code =='EEXIST'){
						fs.readFile('mobileuploads/'+req.file.originalname,function(e,data){
							if(e){
								catch_error(e)
							}else{
								var json = {
									b64 : data.toString('base64')
									};
								io.sockets.to(req.body.hashedid).emit('mobile upload complete',json);
								res.send({message : 'success'});
							}
						})
					}
				})
			}else{
				res.send('noroom');
			}
		}
	});
})

app.post('/mobileuploadphoto',function(req,res){
	uploadMobile(req,res,function(e){
		if(e){
			catch_error(e);
			//res.send('Error!'+e);
		}else{
			if(io.sockets.adapter.rooms[req.body.hashedid]!=undefined){
				fs.mkdir(app.get('persistentDataDir')+'img/'+req.body.hashedid+'/',function(e1){
					if(!e1 || e1 && e1.code =='EEXIST'){
						
						if(req.file==undefined){
							/* saving cropped */
							var str = req.body.photo.replace(/^data:image\/jpeg;base64,/, "");
							var buf = new Buffer(str, 'base64'); 
							fs.writeFile('mobileuploads/'+req.body.name,buf,function(e2){
								resizeImage('mobileuploads/',app.get('persistentDataDir')+'img/'+req.body.hashedid + '/', req.body.name,function(o){
									if(o=='done'){
										io.sockets.to(req.body.hashedid).emit('append imgtank',req.body.name);
										var json = {
											message : 'success',
											filename : req.body.name
										}
										
										res.send(json);
									}
								});
							})
							/*
							fs.writeFile(app.get('persistentDataDir')+'img/'+req.body.hashedid + '/' + req.body.name, buf ,function(e2){
								if(e2){
									catch_error(e2);
								}else{
								}
							})
							*/
						}else{
							/* saving uncropped */
							
							resizeImage('mobileuploads/', app.get('persistentDataDir')+'img/'+req.body.hashedid + '/',req.file.originalname,function(o){
								if(o=='done'){
									io.sockets.to(req.body.hashedid).emit('append imgtank',req.file.originalname);
										var json = {
											message : 'success',
											filename : req.file.originalname
										}
										
										res.send(json);
								}
							})
						}
					}
				})
			}else{
				res.send('noroom');
			}
		}
	});
});

app.post('/ocr',function(req,res){
	uploadOCR(req,res,function(e){
		if(req.body.base64jpeg!=undefined){
			var str = req.body.base64jpeg.replace(/^data:image\/jpeg;base64,/, "");
			var buf = new Buffer(str, 'base64'); 
			var tempFilename = String(Date.now())+'.jpg';
			fs.writeFile('ocrStorage/'+tempFilename,buf,function(e){
				if(e){
					catch_error(e);
					res.send(e);
				}else{
					var form2 = {
						apikey : authConfig.ocrspace.apikey,
						file : fs.createReadStream('ocrStorage/'+tempFilename)
					}
					
					request.post({url: 'https://api.ocr.space/parse/image', formData : form2},function(e,h,b){
						if(e){
							catch_error(e);
						}else{
							res.send(b);
							/* need to clean up the now obsolete files */
							fs.unlink('ocrStorage/'+tempFilename,function(e){
								if(e){
									catch_error(e);
								}
							})
						}
					})
				}
			})
		}
	})
})

var connection = mysql.createConnection({
	host	:app.get('mysqlhost'),
	user	:app.get('mysqluser'),
	password	:app.get('mysqlpswd'),
	database	:app.get('mysqldb'),
});

io.on('connection',function(socket){
	
	/* check if db exist. if not, create db */
	/* table_masterquestions */
	connection.query('SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = "'+app.get('mysqldb')+'" AND TABLE_NAME = "table_masterquestions"',function(e,r){
		if(e){
			/* catch error */
			catch_error(e);
		}else{
			if(r.length==0){
				/* create table_masterquestions */
				connection.query(
				'CREATE TABLE table_masterquestions ('+
				'id int(8) NOT NULL AUTO_INCREMENT,'+
				'hashed_id varchar(64) NOT NULL,'+
				
				/* 8192 characters ~ 1000 words */
				'subject varchar(64) NOT NULL,'+
				'question varchar(8192) NOT NULL,'+
				'answer varchar(8192) NOT NULL,'+
				
				'space varchar(64) NOT NULL,'+
				'mark varchar(4) NOT NULL,'+
				'note varchar(512) NOT NULL,'+
				
				'delete_flag int(1) NOT NULL,'+
				
				'PRIMARY KEY(id));',function(e1){
					if(e1){
						/* catch error */
						catch_error(e1);
					}
				});
			}
		}
	})
	
	socket.join(socket.request.user.sessionID);
	
	socket.on('delete dp',function(i,cb){
		if(socket.request.user.admin>=1){
			/* delete stuff here */
			if(!i.syllabus){
				cb({error:'Syllabus is required, but not sent!'})
			}else if(!i.dp){
				cb({error:'DP is required, but not sent!'})
			}else{
				var syl = 'curriculum_'+i.syllabus
				var blurryDP = i.dp+'%'
				
				connection.query('SELECT * FROM ?? WHERE lvl LIKE ?',[syl,blurryDP],function(e1,r1){
					if(e1){
						catch_error(e1)
					}else{
						/* failsafe. make a record of the things that are deleted */
						fs.writeFile(app.get('persistentDataDir')+'apilog/dpdeletelog_'+String(Date.now())+'.json',JSON.stringify(r1),'utf8',function(){
							
						})
						connection.query('DELETE FROM ?? WHERE lvl LIKE ?',[syl,blurryDP],function(e,r){
							if(e){
								catch_error(e)
							}else{
								cb({success:'ok'})
							}
						})
					}
				})
			}
		}else{
			cb({error:'You are not authorised to delete dot points. Please contact a system admin.'})
		}
	})
	
	socket.on('check api',function(cb){
		connection.query('SELECT api FROM user_db WHERE id = ?',socket.request.user.id,function(e,r){
			if(e){
				catch_error(e)
				cb(e);
			}else{
				if(r.length!=1){
					cb({error:'User cannot be found.'})
				}else{
					cb(r[0])
				}
			}
		})
	})
	
	socket.on('enable api',function(cb){
		var newApiKey = sha256(String(Date.now()));
		connection.query('UPDATE user_db SET api = ? WHERE id = ?',[newApiKey,socket.request.user.id],function(e,r){
			if(e){
				catch_error(e);
				cb(e);
			}else{
				cb({success:true,api:newApiKey});
			}
		})
	})
	
	socket.on('admin moderation',function(json,cb){
		switch(json.mode){
			case 'reject':
			case 'approve':
				adminModDecide(json.mode,json.target,socket,function(o){
					if(o.error){
						catch_error(o.error)
						cb(o)
					}else{
						cb({success:true})
					}
				})
			break;
			case 'undo':
				connection.query('SELECT * FROM req_log WHERE id = ?',json.target,function(e,r){
					if(e){
						catch_error(e);
						cb(e);
					}else{
						if(r.length!=1){
							cb({error:'Selecting req_log Error'});
							return;
						}
						
						/* make a note in the req_log that the req has been undone and by whom */
						connection.query('UPDATE req_log SET notes1 = ? WHERE id = ?',[r[0].notes1+' undo '+socket.request.user.id,json.target],function(e2,r2){
							if(e2){
								catch_error(e2)
							}
						})
						
						fs.readFile(app.get('persistentDataDir')+'reqlog/'+r[0].id+'.json',function(e1,d){
							if(e1){
								catch_error(e1);
								cb(e1);
								return;
							}else{
								var jsonData = JSON.parse(d)
								switch(r[0].mode){
									case 'add submit':
										/* read json file and put delete_flag as 1 */
										connection.query('UPDATE table_masterquestions SET delete_flag = 1 WHERE hashed_id = ?',jsonData.hashed_id,function(e2,r2){
											if(e2){
												catch_error(e2);
												cb(e2);
											}else{
												cb({success:true})
												systemCommentLogAdminUndo(socket.request.user.id,jsonData.hashed_id,r[0].mode)
											}
										})
										
									break;
									case 'remove':
										/* read json file and put delete_flag as 0 */
										connection.query('UPDATE table_masterquestions SET delete_flag = 0 WHERE hashed_id = ?',jsonData.hashed_id,function(e2,r2){
											if(e2){
												catch_error(e2);
												cb(e2);
											}else{
												cb({success:true})
												systemCommentLogAdminUndo(socket.request.user.id,jsonData.hashed_id,r[0].mode)
											}
										})
									
									break;
									case 'add new curriculum':
										/* delete the said table */
										connection.query('DROP TABLE ??','curriculum_'+jsonData,function(e2,r2){
											if(e2){
												catch_error(e2);
												cb(e2);
											}else{
												cb({success:true})
											}
										})
									break;
									case 'add dp':
										/* delete the associated dp */
										connection.query('DELETE FROM ?? WHERE lvl = ?',['curriculum_'+jsonData.target_syl,jsonData.value+'.info'],function(e2,r2){
											if(e2){
												catch_error(e2);
												cb(e2);
											}else{
												cb({success:true})
											}
										})
									break;
									case 'categorise':
										/* need to read json file to see if categories are added or removed */
										switch(jsonData.mode){
											case 'add':
												connection.query('SELECT * FROM table_masterquestions WHERE hashed_id = ?',jsonData.hashed_id,function(e2,r2){
													if(e2){
														catch_error(e2);
														cb(e2);
													}else if(r2.length!=1){
														cb({error:'Found multiple questions with the same hash_id'})
													}else{
														systemCommentLog(socket.request.user.id,r2[0].id,{
															file : 'admin',
															decision : 'undo',
															originalEvent : 'categorise'})
														connection.query('DELETE FROM ?? WHERE lvl = ? AND f_id = ?',['curriculum_'+jsonData.target_syl,jsonData.lvl,r2[0].id],function(e3,r3){
															if(e3){
																catch_error(e3);
																cb(e3);
															}else{
																cb({success:true})
															}
														})
													}
												})
											break;
											case 'delete':
												connection.query('SELECT * FROM table_masterquestions WHERE hashed_id = ?',jsonData.hashed_id,function(e2,r2){
													if(e2){
														catch_error(e2);
														cb(e2);
													}else if(r2.length!=1){
														cb({error:'Found multiple questions with the same hash_id'})
													}else{
														systemCommentLog(socket.request.user.id,r2[0].id,{
															file : 'admin',
															decision : 'undo',
															originalEvent : 'categorise'})
														connection.query('INSERT INTO ?? (lvl,f_id) VALUES (?,?);',['curriculum_'+jsonData.target_syl,jsonData.lvl,r2[0].id],function(e3,r3){
															if(e3){
																catch_error(e3);
																cb(e3);
															}else{
																cb({success:true})
															}
														})
													}
												})
											break;
											default:
											break;
										}
									break;
									case 'save':
										/* need to read _overwrite.json */
										fs.readFile(app.get('persistentDataDir')+'reqlog/'+r[0].id+'_overwritten.json',function(e2,d2){
											if(e2){
												catch_error(e2);
												cb(e2)
											}else{
												var jsonData2 = JSON.parse(d2);
												var newJsonData2;
												if(jsonData2.edit0){
													/* for backwards compatibility */
													newJsonData2 = jsonData2.edit0;
												}else{
													newJsonData2 = jsonData2;
												}
												connection.query('UPDATE table_masterquestions SET ? WHERE id = ?',[newJsonData2,newJsonData2.id],function(e3,d3){
													if(e3){
														catch_error(e3);
														cb(e3);
													}else{
														systemCommentLog(socket.request.user.id,newJsonData2.id,{
															file : 'admin',
															decision : 'undo',
															originalEvent : 'save'})
														cb({success:true})
													}
												})
											}
										})
									break;
								}
								
								/* log admin undo decision */
								connection.query('INSERT INTO req_log (requester,mode,notes1) VALUES(?,?,?)',[socket.request.user.id,'admin','undo '+json.target],function(e2,r2){
									if(e){
										catch_error(e)
									}else{
										var target = [];
										if(jsonData.subject){
											target.push(jsonData.subject);
										}
										if(jsonData.target_syl){
											target.push(jsonData.target_syl);
										}
										subscriptionDelivery('news',{id:r2.insertId,rowData:[{id:r2.insertId,notes1:'',requester:socket.request.user.id,mode:'admin'}],keyword:target});
									}
								})
							}
						})
					}
				})
			break;
			default:
			break;
		}
	})
	
	socket.on('ping activity',function(id,cb){
		connection.query('SELECT * FROM req_log WHERE id = ?',id,function(e,r){
			if(e){
				catch_error(e);
				cb(e);
			}else{				
				if(r[0].mode=='admin'){
					cb({row:r[0]});
					return;
				}
				fs.readFile(app.get('persistentDataDir')+'reqlog/'+id+'.json',function(e1,data){
					if(e1){
						catch_error(e1);
						cb(e1);
					}else{
						fs.readFile(app.get('persistentDataDir')+'reqlog/'+id+'_overwritten.json',function(e2,data2){
							if(e2){
								cb({row:r[0],json:JSON.parse(data)})
							}else{
								cb({row:r[0],json:JSON.parse(data),overwritten:JSON.parse(data2)})
							}
						})
					}
				})
			}
		})
	})
	
	socket.on('clear inbox',function(i,cb){
		switch(i){
			case 'chat':
				var newNotes1 = socket.request.user.notes1.replace(/chat:.*;/,function(s){
					return 'chat:;'
				})
			break;
			case 'news':
				var newNotes1 = socket.request.user.notes1.replace(/news:.*;/,function(s){
					return 'news:;'
				})
			
			break;
			default:
			break;
		}
		connection.query('UPDATE user_db SET notes1 = ? WHERE id = ?',[newNotes1,socket.request.user.id],function(e,r){
			if(e){
				catch_error(e)
			}
		})
	})
	
	/* generate pdf */
	socket.on('make pdf',function(i,callback){
		/* need to parse async info, like image size */
		var arrImg = [];
		var arrFlag = [];
		JSON.stringify(i).replace(/<img.*?>/g,function(s){
			arrImg.push(s);
			/* arrFlag gets populated. After asynch img size determined, they will be spliced away */
			arrFlag.push(false);
		})
		if(arrImg.length>0){
			for(var j = 0; j<arrImg.length; j++){
				var styler='';
				arrImg[j].replace(/style\=\\?\".*?\\?\"/,function(s){
					styler=s.replace(/style\=|\\\"/g,'');
				})
				arrImg[j].replace(/src\=\\?\".*?\\?\"/,function(s){
					var imgUrl = s.replace(/src\=|\\\"/g,'')
					
					/* gm operations are asynch. if styler is in the loop then the width of all images will be the same */
					jsonImgData[imgUrl]={};
					jsonImgData[imgUrl]['style']=styler;
					
					gm(app.get('persistentDataDir')+imgUrl).size(function(e,v){
						if(e&&e.code==1){
							/* file cannot be found */
							jsonImgData[imgUrl]['dimension']={}
							jsonImgData[imgUrl]['dimension']['width']=400
							jsonImgData[imgUrl]['dimension']['height']=200
							arrFlag.splice(0,1);
							callToPdf(arrFlag,socket,i,callback);							
						}else if(e){
							catch_error(e);
							callback(e);
						}else{
							jsonImgData[imgUrl]['dimension']=v;
							arrFlag.splice(0,1);
							callToPdf(arrFlag,socket,i,callback);
						}
					})
				})
			}
		}else{
			callToPdf(arrFlag,socket,i,callback)
		}
	})
	
	/* retrieve general chat */
	socket.on('retrieve general chat',function(callback){
		connection.query('SELECT * FROM comment_db WHERE ref = ?','general chat',function(e,r){
			if(e){
				callback(e);
				catch_error(e);
			}else{
				callback(r);
			}
		})
	})	
	
	/* deciphering user id to display name */
	socket.on('decode user id',function(i,cb){
		if(isNaN(i)){
			cb(i);
		}else{
			connection.query('SELECT displayName FROM user_db WHERE id = ?',i,function(e,r){
				if(e){
					catch_error(e);
					cb(e)
				}else{
					if(r.length!=1){
						cb('User not found!');
					}else{
						cb(r[0].displayName);
					}
				}
			})
		}
	})
	
	/* receiving and broadcasting general chat */
	socket.on('send general chat',function(i,callback){
		var userId = '';
		if(/\{\{.*?\}\}/.test(i)&&socket.request.user.admin==9){
			userId = 'system';
		}else{
			userId = socket.request.user.id;
		}
		connection.query('INSERT INTO comment_db (username, comment, ref) VALUES (?,?,?)',[userId,i,'general chat'],function(e,r){
			if(e){
				callback(e);
				catch_error(e);
			}else{
				subscriptionDelivery('chat',{id:r.insertId});
				connection.query('SELECT * FROM comment_db WHERE id = ?',r.insertId,function(e1,r1){
					if(e1){
						catch_error(e1);
						callback(e1);
					}else{
						var json = {
							'user' : userId,
							'message' : i,
							'created' : r1[0].created
							}
						callback('success');
						io.emit('receive general chat',json);
					}
				})
			}
		})
	})
	
	/* retrieve comments */
	socket.on('retrieve comments',function(i,callback){
		connection.query('SELECT * FROM comment_db WHERE ref = ? ORDER BY created;',i,function(e,r){
			if(e){
				catch_error(e);
				callback(e);
			}else{
				callback(r)
			}
		})
	})
	
	/* receive comments */
	socket.on('send comment',function(i,callback){
		var user;
		
		if (socket.request.user.admin==9&&/^\{\{.*?\}\}/.test(i.comment)){
			user = 'system';
		}else{
			user = socket.request.user.id;
		}
		
		connection.query('INSERT INTO comment_db (username, comment, ref) VALUES (?,?,?)',[user,i.comment,i.target],function(e,r){
			if(e){
				catch_error(e)
				callback(e)
			}else{
				var json = {
					'user' : user
					}
				callback(json)
			}
		})
	})
	
	/* socket id identifies which question the user is editing on */
	socket.on('ping hashedid',function(i,callback){
		socket.join(i);
		socket.hashedid=i;
	})
	
	socket.on('hashed id query syllabus',function(i,cb){
		var curr = 'curriculum_'+i.syllabus;
		var hashedIdArr = i.qHashedIdArr;
		if(hashedIdArr.length==0){
			cb({message : 'failed',reason : 'input array length zero'});
		}else{
			var arrJson = [];
			for (var i = 0; i<hashedIdArr.length; i++){
				connection.query('SELECT id,hashed_id FROM table_masterquestions WHERE hashed_id = ?',hashedIdArr[i],function(e,r){
					if (e){
						catch_error(e);
					}else{
						if(r==0){
							catch_error('hashed id with no id');
						}else{
							connection.query('SELECT lvl FROM ?? WHERE f_id = ?', [curr,r[0].id],function(e0,r0){
								if(e0){
									catch_error(e0);
								}else{
									var json = {
										hashed_id : r[0].hashed_id,
										lvl : []
									}
									for (var j = 0; j<r0.length; j++){
										json.lvl.push(r0[j].lvl)
									}
									arrJson.push(json);
									if(arrJson.length == hashedIdArr.length){
										cb({message:'success',result:arrJson})
									}
								}
							})
						}
					}
				})
			}
		}
	})
	
	socket.on('populate dot points',function(i,callback){
		connection.query('SELECT DISTINCT lvl, description FROM ?? WHERE lvl LIKE "%info" ORDER BY lvl','curriculum_'+i,function(e,r){
			if(e){
				catch_error(e);
			}else{
				callback(r)
			}
		})
	})
	
	socket.on('view submit',function(i,callback){
		var optionalString = '';
		if(/exhaustive\:.*?\;/.test(socket.request.user.notes1)){
			optionalString += ' AND ';
			socket.request.user.notes1.replace(/exhaustive\:.*?\;/,function(s){
				var ssplit = s.replace(/\;|\,/g,'').split(/exhaustive\:|\r|\n|\r\n| /);
				var optionFlag = true;
				optionalString += ' id NOT IN ( '
				for(var j = 0; j<ssplit.length; j++){
					if(ssplit[j]){
						optionalString += connection.escape(ssplit[j]) + ',';
						optionFlag = false;
					}
				}
				if(optionFlag){
					optionalString += 0 + ',';
				}
				optionalString = optionalString.substring(0,optionalString.length-1)+')';
			})
		}
		
		switch(i.mode){
			case 'subject':
				if(i.subject.replace(' ','')==''||i.subject==undefined){
					if(i.hashed_id){
						if(i.hashed_id.replace(/ /g,'')!=''){
							optionalString += ' AND hashed_id = "' + connection.escape(i.hashed_id) + '"'
						}
					}
					connection.query('SELECT subject, hashed_id, question, answer,space,mark FROM table_masterquestions WHERE delete_flag = 0 '+optionalString+';',function(e,r){
						if(e){
							catch_error(e);
						}else{
							view_submit_filter_cb(i,r,callback);
						}
					})
				}else{
					connection.query('SELECT subject, hashed_id, question, answer,space,mark FROM table_masterquestions WHERE delete_flag = 0 AND subject = ? '+optionalString+';',i.subject,function(e,r){
						if(e){
							catch_error(e);
						}else{
							view_submit_filter_cb(i,r,callback);
						}
					})
				}
			break;
			case 'curriculum':
				connection.query('SELECT f_id FROM ?? WHERE lvl NOT LIKE "%info" AND lvl NOT LIKE "0%" AND lvl <>"" AND lvl LIKE ? ORDER BY id;',['curriculum_'+i.syllabus,i.dp+'%'],function(e,r){
					if(e){
						catch_error(e);
					}else{
						var querystring = '';
						for (var j=0;j<r.length;j++){
							if(querystring!=''){
								querystring +=',';
							}
							querystring+=r[j].f_id;
						}
						connection.query('SELECT subject, hashed_id, question, answer,space,mark FROM table_masterquestions WHERE delete_flag = 0 AND id IN ('+querystring+') '+optionalString+';',function(e1,r1){
							if(e1){
								catch_error(e1);
							}else{
								view_submit_filter_cb(i,r1,callback);
							}
						});
					}
				})
			break;
			default:
			break;
		}
	})
	
	socket.on('local remove',function(hashed_id,o){
		question_weight_modify(hashed_id,20);
	})
	
	socket.on('picked questions',function(input,callback){
		console.log(input.length)
		var queryString='';
		for (var j = 0; j<input.length; j++){
			if(queryString!=''){
				queryString += ',';
			}
			queryString += connection.escape(input[j]);
			question_weight_modify(input[j],1)
		}
		
		
		if(!/exhaustive/.test(socket.request.user.notes1)){
			callback('done');
			return false;
		};
		
		connection.query('SELECT id FROM table_masterquestions WHERE hashed_id IN ('+ queryString +')',function(e,r){
			if(e){
				catch_error(e);
			}else{
				var appendExhaustString = '';
				for (var l = 0; l<r.length; l++){
					if(appendExhaustString != ''){
						appendExhaustString  +=' ';
					}
					appendExhaustString += r[l].id;
				}
				
				connection.query('SELECT * FROM user_db WHERE authMethod = ? AND email = ?',[socket.request.user.authMethod,socket.request.user.email],function(e2,r2){
					if(e2){
						catch_error(e2)
					}else{
						var notes1 = r2[0].notes1.replace(/exhaustive\:.*?\;/,function(s){
							return s.replace(/\;|\r|\n|\r\n/,'') + ' ' + appendExhaustString+',;';
						})
						
						connection.query('UPDATE user_db SET notes1=? WHERE authMethod = ? AND email = ?',[notes1,socket.request.user.authMethod,socket.request.user.email],function(e1,r1){
							if(e1){
								catch_error(e1);
							}else{
								socket.request.user.notes1 = notes1;
							}
						})
					}
				})
			}
		});
	})
	
	socket.on('save dp',function(i,callback){
		restricting_access(socket.request.user,'add dp',i,null,function(o){
			if(o=='true'){
				var target_syl = 'curriculum_'+i.target_syl;
				var target_level = i.value.split(' ')[0]+'.info';
				
				/* only split the first instance of a space. as description may contain spaces */
				var info = i.value.substring(i.value.indexOf(' ')+1);
				
				connection.query('INSERT INTO ?? (lvl,description) VALUES (?,?);',[target_syl,target_level,info],function(e,r){
					if(e){
						catch_error(e);
					}else{
						callback('success');
					}
				})
			}else{
				callback('Adding DP request received and pending.')
			}
		})
	})
	
	socket.on('add submit',function(i,callback){
		
		/* console.log(socket.request.user); */
		
		var r=cleanup(i.hashed_id,i.question,i.answer);
		
		var question = r[1];
		var answer = r[2];
		
		restricting_access(socket.request.user,'add submit',i,null,function(o){
			if(o=='true'){
				connection.query(
					'INSERT INTO table_masterquestions (hashed_id, subject, question, answer, space, mark) VALUES (?,?,?,?,?,?);',[i.hashed_id,i.subject,question,answer,i.space,i.mark],function(e,r){
						if(e){
							catch_error(e);
						}else{
							purge(i.hashed_id)
							systemCommentLog(socket.request.user.id,r.insertId,{file:'file',action:'add',result:'pass'})
							callback('Addition of question successful!');
							/* trash cleaning function here. do the rotation, remove the unneeded photos */
						}
					})
			}else{
				if(o.error){
					callback(o);
				}else{
					connection.query(
						'INSERT INTO table_masterquestions (hashed_id, subject, question, answer, space, mark,delete_flag) VALUES (?,?,?,?,?,?,1);',[i.hashed_id,i.subject,question,answer,i.space,i.mark],function(e,r){
							if(e){
								catch_error(e);
							}else{
								purge(i.hashed_id)
								systemCommentLog(socket.request.user.id,r.insertId,{file:'file',action:'add',result:'approval'});
								callback('Submission of question received. A moderator will assess the submission ASAP.');
							}
						})
				}
			}
		});
	});
	
	socket.on('populate select',function(i,callback){
		switch(i){
			case 'subject':
				connection.query('SELECT DISTINCT subject FROM table_masterquestions ORDER BY subject;',function(e,r){
					if(e){
						catch_error(e);
					}else{
						callback(r);
					}
				});
			break;
			case 'syllabus':
				connection.query('SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = "'+app.get('mysqldb')+'";',function(e,r){
					if(e){
						catch_error(e);
					}else{
						callback(r);
					}
				})
			
			break;
			default:
			break;
		}
	});
	
	socket.on('add new curriculum',function(i,callback){
		/* check if curriculum has name */
		restricting_access(socket.request.user,'add new curriculum',i,null,function(o){
			if(o=='true'){
				var newcurrname = 'curriculum_'+i;
				connection.query(
				'CREATE TABLE ?? ('+
				'id int(8) NOT NULL AUTO_INCREMENT,'+
				'f_id int(8),'+
				
				/* use 5.3.1 to indicate 5th chapter, 3rd small chapter, 1st smaller chapter
				use 5.info for chapter description */
				
				'lvl varchar(64) NOT NULL,'+
				'description varchar(1024),' +
				'notes varchar(8192),'+
				
				'FOREIGN KEY(f_id) REFERENCES table_masterquestions(id),'+
				'PRIMARY KEY(id));',newcurrname,function(e1){
					if(e1){
						/* catch error */
						catch_error(e1);
						callback(e1);
					}else{
						connection.query('INSERT INTO ?? (`id`, `f_id`, `lvl`, `description`, `notes`) VALUES (NULL, NULL, "0.info", "irrelevant", NULL);',newcurrname,function(e2,r2){
							if(e2){
								catch_error(e2);
								callback(e2);
							}else{
								callback('New curriculum created!');						
							}
						})
					}
				});
			}else{
				callback('Request to add new curriculum received and will be reviewed ASAP.')
			}
		})
	});
	
	socket.on('categorise',function(i,callback){
		restricting_access(socket.request.user,'categorise',i,null,function(o){
			if(o=='true'){
				connection.query('SELECT id FROM table_masterquestions WHERE hashed_id = ?;',i.hashed_id,function(e,r){
					if(e){
						catch_error(e);
					}else{
						if(r.length>0){
							switch(i.mode){
								case 'delete':
									connection.query('DELETE FROM ?? WHERE f_id =? AND lvl = ?',['curriculum_'+i.target_syl,r[0].id,i.lvl],function(e1,r1){
										if(e1){
											catch_error(e1)
										}else{
											systemCommentLog(socket.request.user.id,r[0].id,{file:'categorise',action:i.mode,result:'pass',target_syl:i.target_syl,dp:i.lvl})
											callback('successful!')
										}
									})
								break;
								case 'add':
									connection.query('INSERT INTO ?? (f_id,lvl) VALUES (?,?);',['curriculum_'+i.target_syl,r[0].id,i.lvl],function(e1,r1){
										if(e1){
											catch_error(e1);
										}else{
											systemCommentLog(socket.request.user.id,r[0].id,{file:'categorise',action:i.mode,result:'pass',target_syl:i.target_syl,dp:i.lvl})
											callback('successful!');
										}
									})
								break;
								default:
								break;
							}
						}else{
							callback({'error':'hash id not found'});
							catch_error('hash id not found.');
						}
					}
				})
			}else{
				if(o.error){
					callback(o);
				}else{
				connection.query('SELECT id FROM table_masterquestions WHERE hashed_id = ?;',i.hashed_id,function(e,r){
						if(e){
							catch_error(e)
						}else{
							systemCommentLog(socket.request.user.id,r[0].id,{file:'categorise',action:i.mode,result:'approval',oldTarget_syl:i.target_syl,oldDP:i.lvl})
							callback('pending approval.');
						}
					})
				}
			}
		});
	});
	
	socket.on('populate activities',function(callback){
		//socket.request.user
		//logic: find latest login timestamp, find all edits in the mean time, return the the edits
		//probably check admin level? above... 5 can see edits

		connection.query('SELECT * FROM req_log ORDER BY id DESC LIMIT 50',function(e,r){
			if(e){
				catch_error(e)
			}else{
				callback({user:socket.request.user,data:r})
			}
		})
	})
	
	socket.on('modify site config',function(i,callback){
		
		//escape eval strings
		var newColEscaped = i.column.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
		if(isNaN(i.newState)){
			return;
		}
		
		eval('var newState = { '+ newColEscaped + ':' + i.newState + '}');
		connection.query('UPDATE table_config SET ? WHERE adminLvl = ?;',[newState,i.adminLvl],function(e,r){
			if(e){
				callback(e);
				catch_error(e);
			}else{
				callback('success');
			}
		})
	})
	
	socket.on('modify user config',function(i,callback){
		connection.query('UPDATE user_db SET ? WHERE id = ?',[i,i.id],function(e,r){
			if(e){
				catch_error(e);
				callback(e);
			}else{
				callback('success');
			}
		})
	})
	
	socket.on('globaledit',function(i,callback){
		var r=cleanup(i.data.hashed_id,i.data.question,i.data.answer);
		
		var json = {
			hashed_id : i.data.hashed_id,
			question : r[1],
			answer : r[2],
			mark : i.data.mark,
			subject : i.data.subject
		}
		
		restricting_access(socket.request.user,i.mode,json,null,function(o){
			if(o=='true'){
				/* carry out task */
				
				var querystring;
				var queryterms;
				var returnstring;
				
				switch(i.mode){
					case 'save':
						querystring = 'UPDATE table_masterquestions SET ? WHERE hashed_id = ?';
						queryterms = [json,i.data.hashed_id];
						returnstring = 'Saved to database!';
					break;
					case 'remove':
						querystring = 'UPDATE table_masterquestions SET delete_flag = ? WHERE hashed_id = ?';
						queryterms = [1,i.data.hashed_id];
						returnstring = 'Deleted from the database!';
					break;
					default:
					break;
				}
				connection.query(querystring,queryterms,function(e,r){
					if(e){
						catch_error(e)
						callback(e);
					}else{
						connection.query('SELECT id FROM table_masterquestions WHERE hashed_id = ?',i.data.hashed_id,function(e1,r1){
							if(e1){
								catch_error(e1)
							}else{
								systemCommentLog(socket.request.user.id,r1[0].id,{file:'file',action:i.mode,result:'pass'})
							}
						})
						callback(returnstring);
					}
				})
			}else{
				if(o.error){
					callback(o)
				}else{
					connection.query('SELECT id FROM table_masterquestions WHERE hashed_id = ?',i.data.hashed_id,function(e1,r1){
						if(e1){
							catch_error(e1)
						}else{
							systemCommentLog(socket.request.user.id,r1[0].id,{file:'file',action:i.mode,result:'approval'})
							callback('Submission received. Pending approval.');
						}
					})
				}
			}
		})
	})
	
	socket.on('disconnect',function(){
		/* should delete all file in socket.hashedid */
		if(socket.hashedid!=undefined){
			var path = app.get('persistentDataDir')+'img/' + socket.hashedid + '/';
			fs.remove(path,function(e){
				if(e){
					catch_error(e);
				}
			})
		}
	});
});

function weighting_function(i){
	
	/* try to return a monotoneous decreasing function, which is defined by all i>=0 */
	/* this is because the weighing value is designed to be inversely proportional to the pick frequency */
	
	return Math.exp(1/(i+0.01));
}

/* on everything except undos */
function adminModDecide(decision,id,socket,cb){
	connection.query('SELECT * FROM req_log WHERE id = ?',id,function(e,r){
		if(e){
			catch_error(e)
		}else{
			var newNotes1 = r[0].notes1 + ' ' + decision + ':' + socket.request.user.id+';';
			connection.query('UPDATE req_log SET notes1 = ? WHERE id = ?',[newNotes1,id],function(e1,r1){
				if(e1){
					catch_error(e1);
				}
			})
			connection.query('INSERT INTO req_log (requester,mode,notes1) VALUES (?,?,?)',[socket.request.user.id,'admin',decision + ' ' + id],function(e1,r1){
				if(e1){
					catch_error(e1)
				}else{
					if(decision=='reject'){
						switch(r[0].mode){
							case 'add submit':
							case 'categorise':
							case 'save':
							case 'remove':
								fs.readFile(app.get('persistentDataDir')+'reqlog/'+id+'.json',function(e2,d){
									if(e2){
										catch_error(e2)
									}else{
										var i = JSON.parse(d);
										connection.query('SELECT id FROM table_masterquestions WHERE id = ?',i.hashed_id,function(e3,r3){
											if(e3){
												catch_error(e3)
											}else{
												systemCommentLog(socket.request.user.id,r3[0].id,{file:'admin',decision:'reject',originalEvent:r[0].mode});
											}
										})
									}
								})
							break;
							default:
							break;
						}
						cb({success:true})
						return;
					}
					
					fs.readFile(app.get('persistentDataDir')+'reqlog/'+id+'.json',function(e2,d){
						
						if(e2){
							catch_error(e2)
							return;
						}
						
						var i = JSON.parse(d);
						
						switch(r[0].mode){
							case 'add submit':
							case 'categorise':
							case 'save':
							case 'remove':
								fs.readFile(app.get('persistentDataDir')+'reqlog/'+id+'.json',function(e2,d){
									if(e2){
										catch_error(e2)
									}else{
										var i = JSON.parse(d);
										connection.query('SELECT id FROM table_masterquestions WHERE id = ?',i.hashed_id,function(e3,r3){
											if(e3){
												catch_error(e3)
											}else{
												systemCommentLog(socket.request.user.id,r3[0].id,{file:'admin',decision:'approve',originalEvent:r[0].mode});
											}
										})
									}
								})
							break;
							default:
							break;
						}
						
						switch(r[0].mode){
							case 'add dp':
								var target_syl = 'curriculum_'+i.target_syl;
								var target_level = i.value.split(' ')[0]+'.info';
								
								/* only split the first instance of a space. as description may contain spaces */
								var info = i.value.substring(i.value.indexOf(' ')+1);
								
								connection.query('INSERT INTO ?? (lvl,description) VALUES (?,?);',[target_syl,target_level,info],function(e3,r3){
									if(e3){
										catch_error(e3);
										cb(e3);
									}else{
										cb({success:true});
									}
								})
							break;
							case 'add new curriculum':
								var newcurrname = 'curriculum_'+i;
								connection.query(
								'CREATE TABLE ?? ('+
								'id int(8) NOT NULL AUTO_INCREMENT,'+
								'f_id int(8),'+
								
								/* use 5.3.1 to indicate 5th chapter, 3rd small chapter, 1st smaller chapter
								use 5.info for chapter description */
								
								'lvl varchar(64) NOT NULL,'+
								'description varchar(1024),' +
								'notes varchar(8192),'+
								
								'FOREIGN KEY(f_id) REFERENCES table_masterquestions(id),'+
								'PRIMARY KEY(id));',newcurrname,function(e3){
									if(e3){
										/* catch error */
										catch_error(e3);
										cb(e3);
									}else{
										connection.query('INSERT INTO ?? (`id`, `f_id`, `lvl`, `description`, `notes`) VALUES (NULL, NULL, "0.info", "irrelevant", NULL);',newcurrname,function(e4,r4){
											if(e2){
												catch_error(e4);
												cb(e4);
											}else{
												cb({success:true});						
											}
										})
									}
								});
							break;
							case 'add submit':
								/* has already been cleaned up */
								connection.query('SELECT * FROM table_masterquestions WHERE hashed_id = ?',i.hashed_id,function(e3,r3){
									if(e3){
										catch_error(e3)
										cb(e3)
									}else{
										connection.query('UPDATE table_masterquestions SET delete_flag = "0" WHERE id = ?',r3[0].id,function(e4,r4){
											if(e4){
												catch_error(e4)
												cb(e4)
											}else{
												cb({success:true,mode:'add submit',id:r3[0].id})
											}
										})
									}
								})
							break;
							case 'categorise':
								connection.query('SELECT id FROM table_masterquestions WHERE hashed_id = ?;',i.hashed_id,function(e3,r3){
									if(e){
										catch_error(e3);
										cb(e3);
									}else{
										if(r.length>0){
											switch(i.mode){
												case 'delete':
													connection.query('DELETE FROM ?? WHERE f_id =? AND lvl = ?',['curriculum_'+i.target_syl,r[0].id,i.lvl],function(e4,r4){
														if(e4){
															catch_error(e4);
															cb(e4);
														}else{
															cb({success:true,mode:'remove tag',id:r3[0].id,target_syl:i.target_syl,lvl:i.lvl})
														}
													})
												break;
												case 'add':
													connection.query('INSERT INTO ?? (f_id,lvl) VALUES (?,?);',['curriculum_'+i.target_syl,r[0].id,i.lvl],function(e4,r4){
														if(e1){
															catch_error(e4);
														}else{
															callback({success:true,mode:'add tag',id:r3[0].id,target_syl:i.target_syl,lvl:i.lvl});
														}
													})
												break;
												default:
												break;
											}
										}else{
											callback({error:'hash id not found'});
											catch_error('hash id not found.');
										}
									}
								})
							break;
							case 'save':
							case 'remove':
								var querystring;
								var queryterms;
								var returnstring;
								var mode;
								
								switch(i.mode){
									case 'save':
										querystring = 'UPDATE table_masterquestions SET ? WHERE hashed_id = ?';
										queryterms = [i,i.hashed_id];
										mode = 'update';
									break;
									case 'remove':
										querystring = 'UPDATE table_masterquestions SET delete_flag = ? WHERE hashed_id = ?';
										queryterms = [1,i.hashed_id];
										mode = 'remove';
									break;
									default:
									break;
								}
								connection.query(querystring,queryterms,function(e4,r4){
									if(e4){
										catch_error(e4)
										cb(e4);
									}else{
										connection.query('SELECT id FROM table_masterquestions WHERE hashed_id = ?',i.hashed_id,function(e5,r5){
											if(e5){
												catch_error(e5);
												cb(e5)
											}else{
												cb({success:true,mode:mode,id:r5[0].id});
											}
										})
									}
								})
							break;
							default:
							
							break;
						}
					
					var target = [];
					if(i.subject){
						target.push(i.subject);
					}
					if(i.target_syl){
						target.push(i.target_syl);
					}
					subscriptionDelivery('news',{id:r1.insertId,rowData:[{id:r1.insertId,notes1:'',requester:socket.request.user.id,mode:'admin'}],keyword:target});
					})
				}
			})
		}
	})
}

function view_submit_filter_cb(i,r,cb){
	if(r.length==0){
		cb({message : 'failed',reason : 'no results obtained'});
		return;
	}
	
	var callbackR=[];
	switch(i.method){
		case 'random':
		
			var arrWeighting = [];
			var rawWeight;
			var totalWeight = 0;
			
			for (var j = 0; j<r.length; j++){
				if(!/weigh=/.test(r[j].note)){
					rawWeight = 0;
				}else{
					r[j].note.replace(/weigh=.*?\;/,function(s){
						if(isNaN(s.split(';')[0].split('=')[1])){
							rawWeight = 0;
						}else{
							rawWeight = Number(s.split(';')[0].split('=')[1]);
						}
					})
				}
				arrWeighting.push(weighting_function(rawWeight));
				totalWeight += weighting_function(rawWeight);
			}
			
			var num = 0;
			while(num<i.length&&r.length>0&&totalWeight>0){
				var counting=0;
				var dice = Math.random()*totalWeight;
				var j = -1;
				
				do{
					j++;
					counting += arrWeighting[j];
				}while(counting<dice)
				
				totalWeight -= arrWeighting[j]
				callbackR.push(r[j]);
				arrWeighting.splice(j,1);
				r.splice(j,1);
				num++;
			}
			/*
			var newR = shuffleArray(r);
			for(var j = 0; j<i.length; j++){
				callbackR.push(newR[j]);
			}
			*/
		break;
		case 'select':
			var selectS = i.length.replace(/ /g,'').split(',');
			selectS.forEach(function(s){
				if(/[0-9]*?-[0-9]*/.test(s)){
					s.replace(/[0-9]*?-[0-9]*/,function(s2){
						var upper = Math.max(Number(s2.split('-')[0]),Number(s2.split('-')[1]));
						var lower = Math.min(Number(s2.split('-')[0]),Number(s2.split('-')[1]));
						for (var j=lower-1;j<upper&&j<r.length;j++){
							callbackR.push(r[j])
						}
					})
				}else if(/[0-9]*/.test(s)){
					if(s<r.length){
						callbackR.push(r[s])
					}
				}
			})
		break;
		/* by default, all of the result will be sent back */
		case 'all':
		default:
			callbackR = r;
		break;
	}
	cb(callbackR);
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

function question_weight_modify(hashed_id,value){
	connection.query('SELECT id, note FROM table_masterquestions WHERE hashed_id = ?',hashed_id,function(e,r){
		if(e){
			catch_error(e);
		}else{
			if(r.length>0){
				if(!/weigh=/.test(r[0].note)){
					var newNote = r[0].note + 'weigh=1;'
				}else{
					var newNote = r[0].note.replace(/weigh=.*?\;/,function(s){
						if(isNaN(s.split(';')[0].split('=')[1])){
							newNumber = value;
						}else{
							newNumber = Number(value) + Number(s.split(';')[0].split('=')[1]);
						}
						return 'weigh='+newNumber+';';
					})
				}
				connection.query('UPDATE table_masterquestions SET note = ? WHERE id = ?',[newNote,r[0].id],function(e1,r1){
					if(e1){
						catch_error(e1)
					}
				})
			}else{
				catch_error('question weight modify no target')
			}
		}
	});
	
}

function catch_error(e){
	console.log(e);
	//socket.emit('throw error',e)
}

/* using local strategy to authenticate user. implement 3rd party authentication process later */
passport.use('local',new localStrategy(
	function(username,password,done){
		/* client:sha256(pswd) -> sha256(sha256(pswd)+salt)  */
		var newSessionId = sha256(String(Date.now()));
		connection.query('SELECT displayName,admin,email,authMethod, authId, salt, passtoken FROM user_db WHERE authMethod = ? AND email = ?',['local',username],function(e,r){
			if(e){
				catch_error(e);
				return done(null, false, e);
			}else{
				if(r.length==0){
					return done(null, false, {message :'Username and/or password incorrect.'});
				}else if (r.length>1){
					return done(null, false, {message :'Username and/or password incorrect.'});
				}else{
					if(sha256(password+r[0].salt) == r[0].passtoken){
						connection.query('UPDATE user_db SET SessionID = ? WHERE authMethod = ? AND email = ?',[newSessionId,'local',username],function(e1,r1){
							if(e1){
								catch_error(e1);
							}
						})
						r[0].sessionID = newSessionId;
						return done(null,r[0]);
					}else{
						return done(null, false, {message :'Username and/or password incorrect.'});
					}
				}
			}
		})
	}
));

/* login with facebook */

passport.use('facebookAuth',new facebookStrategy(authConfig.facebook,function(accessToken, refreshToken, profile, done){
		thirdpartylogin('facebook',profile,accessToken,function(user){
			return done(null,user);
		})
	}))

/* login with google */
passport.use('googleAuth',new googleStrategy(authConfig.google,function (token,tokenSecret, profile, done){
		thirdpartylogin('google',profile,token,function(user){
			return done(null,user);
		})
	}))

passport.serializeUser(function(user,done){
	done(null,[user.authMethod,user.authId]);
})

passport.deserializeUser(function(authMethodId,done){
	connection.query('SELECT id, displayName, admin,email, sessionID, notes1,authMethod FROM user_db WHERE authMethod = ? AND authId = ?;',[authMethodId[0],authMethodId[1]],function(e,r){
		if(e){
			return done(e);
		}else{
			if(r.length==0){
				return done(null,null);
			}else{
				return done(null,r[0]);
			}
		}
	})
})

app.use(express.static('public'));

function callToPdf(arrFlag,socket,i,callback){
	/* empty arrFlag indicates all of the image have been parsed */
	if(arrFlag.length!=0){
		return false;
	}
	/* title page and other misc */
	var doc = new PDFDoc({
		bufferPages : true,
		margins : pdfConfig.newPage.margin
		});
	var pdfFilename = String(Date.now())+'.pdf';
	var stream = doc.pipe(fs.createWriteStream(app.get('persistentDataDir')+'pdfout/'+ pdfFilename));
	docy = doc.y+20;
	var arrAsyncCallBack = [];
	var CBData;
	
	/* title, metadata */
	if(/customPDF\:.*?;/.test(socket.request.user.notes1)){
		socket.request.user.notes1.replace(/customPDF\:.*?;/,function(s){
			socket.request.user.customPDF = s.split(':')[1].replace(';','');
		})
		CBData = require('./'+socket.request.user.customPDF)(socket,doc,pdfConfig,'pdf info');
	}else{
		doc.info['Title'] = 'exam generated by examcopedia';
		doc.info['Author'] = 'examcopedia';			
	}
	
	/* cover page */
	if(socket.request.user.customPDF){
		CBData = require('./'+socket.request.user.customPDF)(socket,doc,pdfConfig,'coverpage');
	}else{
		pdfTitlePage(doc,'Compiled Exam');
	}
	
	var j = 1;
	
	var iOptions = i.options
	delete i.options
	
	for(var block in i){
		
		doc.addPage();
		
		if(Object.keys(i).length>1){
			doc.font('Times-Roman').fontSize(50).text('Section '+j,50,300,{ width : 500})
			
			j++;
			
			doc.addPage();
			doc.fontSize(14).font('Times-Roman');
			doc.lineWidth(pdfConfig.lineWidth);
			docy = doc.y + 20;
		}
		
		for(var question in i[block]){
			parseBody(i[block][question],'questionBody',doc,arrAsyncCallBack);
		}
	}
	
	/* adding page numbers */
	
	var range = doc.bufferedPageRange();
	var logo = logos[Math.floor(Math.random()*logos.length)];
	//range.start range.count
	//doc.switchToPage(idx) //0 indexed
	for(var k=1; k<range.count; k++){
		doc.switchToPage(k);
		doc.fontSize(11).opacity(pdfConfig.headerFooterOpacity);
		doc.moveTo(100,50).lineTo(500,50).undash().stroke();
		if(socket.request.user.customPDF){
			CBData = require('./'+socket.request.user.customPDF)(socket,doc,pdfConfig,'header');
		}else{
			doc.font('Times-Italic').text(logo,50,38,{width : doc.width, align:'center'});
		}
		doc.moveTo(100,730).lineTo(500,730).stroke();
		doc.font('Times-Roman').text('Page '+ (k+1) + ' of '+ range.count,50,735,{width : doc.width, align:'center'});
	}
	
	/* when pdf is done writing */
	stream.on('finish',function(){
		var json = {
			result : 'success',
			url : 'pdfout/'+pdfFilename,
		}
		var CBUrl;
		
		if(/customCounter\:.*?\;/.test(socket.request.user.notes1)){
			var newNote = socket.request.user.notes1.replace(/customCounter\:.*?\;/,function(s){
				var oldCounter = s.replace(/customCounter\:|\;/g,'')
				var newCounter = Number(oldCounter) + 1
				return 'customCounter:'+newCounter+';'
			})
			socket.request.user.notes1 = newNote;
			
			connection.query('UPDATE user_db SET notes1 = ? WHERE id = ?',[newNote,socket.request.user.id],function(e,r){
				if(e){
					catch_error(e)
				}
			})
		}
		
		if(/URLCallback\:/.test(socket.request.user.notes1)){
			socket.request.user.notes1.replace(/URLCallback\:.*?;/,function(s){
				var CBUrl = s.split(/\:(.+)?/)[1].replace(';','');
				var form2 = {
					user : JSON.stringify(socket.request.user),
					socketCall : JSON.stringify(i),
					CBData : CBData
				}
				request.post({url : CBUrl, form : form2},function(e,h,b){
					if(e){
						catch_error(e);
						json.URLCallback = 'failed';
						json.URLCallbackError = JSON.stringify(e);
					}else{
						if(b.error){
							json.URLCallback = 'failed';
							json.URLCallbackError = b.error;
						}else{
							json.URLCallback = 'success'
						}
					}
					callback(json)
				})
			})
		}else{
			callback(json);
		}
			
		setTimeout(function(){
			fs.unlink(app.get('persistentDataDir')+'pdfout/'+pdfFilename,function(e){
				if(e){
					catch_error(e);
				}
			})
		},1000*60*30)
	})
	
	/* if noAnswer is set to true, just finish the stream */
	if(iOptions){
		if(iOptions.noAnswer){
			if(iOptions.noAnswer==true){
				if(socket.request.user.customPDF){
					CBData = require('./'+socket.request.user.customPDF)(socket,doc,pdfConfig,'pre end');
				}
				docEnd(arrAsyncCallBack,doc);
				return;
			}
		}
	}
	
	/* start to write the answers */
	doc.addPage();
	pdfNormalTitle(doc,'Answer Keys');
	
	j = 1;
	
	for(var block in i){
		
		doc.addPage();
		docy = doc.y+20;
		doc.fontSize(12).font('Times-Roman');
		
		if(Object.keys(i).length>1){
			doc.font('Times-Roman').fontSize(50).text('Section '+j,50,300,{ width : 500})
			
			j++;
			
			doc.addPage();
			doc.fontSize(12).font('Times-Roman');
			doc.lineWidth(pdfConfig.lineWidth);
			docy = doc.y + 20;
		}
		
		for(var question in i[block]){
			parseBody(i[block][question],'questionAnswer',doc,arrAsyncCallBack);
		}
	}
	
	/* after answers has been written */
	if(socket.request.user.customPDF){
		CBData = require('./'+socket.request.user.customPDF)(socket,doc,pdfConfig,'pre end');
	}
	docEnd(arrAsyncCallBack,doc);
}

function docEnd(array,doc){
	if(array.length==0){
		doc.flushPages();
		doc.end();
	}
}

var jsonImgData = {};
var newLineCounter = 0;
var arrAns = [];
var docy = 0;

function pdfTitlePage(doc,title){
	doc.image(app.get('persistentDataDir')+'img/logoLg.png',50,50,{fit : [75,75]});
	doc.font('Helvetica').fontSize(16).text('examcopedia',50,140);
	doc.font('Times-Roman').fontSize(50).text(title,60,380,{
		width : 500,
	})
	doc.font('Times-Roman').fontSize(14).text('Comments & Suggestions?',60,680);
	doc.font('Times-Italic').fontSize(12);
	doc.text('join.examcopedia.club',80,doc.y);
	doc.text('panda@pandamakes.com.au');
	
	doc.fontSize(12).font('Times-Roman');
	doc.lineWidth(pdfConfig.lineWidth);
}

function pdfNormalTitle(doc,title){
	doc.font('Helvetica').fontSize(50).text(title,50,300,{
		width : 500,
	})
}

var pdfConfig = {
	lineHeight : 12,
	bodyTextSize : 10,
	lineWidth : 0.0001,
	dashLength : 1,
	dashSpace : 2,
	newLine : false,
	headerFooterOpacity : 0.3,
	newPage : {
		margin : {
			left : 37,
			right : 37,
			top : 52,
			bottom : 40
		}
	}
}

/* A4 is 595 x 842 pts */

function parseBody(jsonWriteToPDF,target,doc,arrAsyncCallBack){
	
	var lineHeight = 12;
	doc.fontSize(pdfConfig.bodyTextSize);
	var qBodyTrimSplitFlag = true;
	var qBodyTrim = jsonWriteToPDF[target].replace(/<h4>|<\/h4>|&nbsp;|<\/div>|<div class = "row">|<div class="row".*?>/g,'');
	
	qBodyTrim = qBodyTrim.replace(/\<br\>\(.?.?.\)/g,function(s){
		return '[questionPartsBreak]'+s;
	})
	var qBodyTrimSplit = qBodyTrim.split('[questionPartsBreak]');
	
	for(var k = 0; k<qBodyTrimSplit.length;k++){
		var wordCountTrim = qBodyTrimSplit[k].replace(/<div class="col-md-12 spaces_.{3,5}">|<br>|<img.*?>|<su.>.*?<\/su.>/g,'');
		var brCount = ( qBodyTrimSplit[k].match(/<br>|<div class="col-md-2">|<div class="col-md-8">/g) || [] ).length;
		var spaceCount = (qBodyTrimSplit[k].match(/<div class="col-md-12 spaces_.{3,5}">/g)||[]).length;
		var lines = spaceCount*2 + Math.ceil(wordCountTrim.length/60) + brCount;
		
		if((qBodyTrimSplit[k].match(/src=".*?"/g)||[]).length>0){
		/* if there are images in this block */
			var height = docy+(lines*lineHeight);
			qBodyTrimSplit[k].match(/src=".*?"/g).forEach(function(v,idx,array){
	
				/* img info should be in jsonImgData */
				var objId = v.replace(/src\=|\"/g,'');
				var thisImgData = jsonImgData[objId];
				var percentWidth=0;
				if(/width/.test(thisImgData.style)){
					thisImgData.style.replace(/width\:.*?\%/,function(s){
						percentWidth = s.replace(/width\:|%/g,'');
					})
				}
				if(percentWidth==0){
					percentWidth = 100;
				}
				//full width = 400pt
				//thisImgData.dimension.width
				var targetWidth = 400/100*percentWidth;
				var targetHeight = targetWidth /thisImgData.dimension.width * thisImgData.dimension.height;

				height += targetHeight;	
				arrAsyncCallBack.push(false);
			});
			if(height > 700){
				doc.addPage();
				docy = doc.y + 20;
			}
		}else{
		/* if there are no images in this block */
			if((docy+lines*lineHeight)>700){
				doc.addPage();
				docy = doc.y + 20;
			}
		}
		
		//var jsonWriteToPDF = i[block][question];
		//jsonWriteToPDF[target] = qBodyTrimSplit[k];
		var json = {};
		json[target]=qBodyTrimSplit[k];
		if(qBodyTrimSplitFlag){
			qBodyTrimSplitFlag = false;
			json.questionNumber = jsonWriteToPDF.questionNumber;
			json.questionMark = jsonWriteToPDF.questionMark;
		}else{
			json.questionNumber = '';
			json.questionMark = '';
		}
		docy = writeToPDF(json,doc,arrAsyncCallBack);
	}
}

function writeToPDF(obj,doc,arrAsyncCallBack){
	var newdocy;
	for(var frag in obj){
		/* first check the approx needed height */

		switch (frag) {
			case 'questionNumber':
				doc.text(obj[frag],65,docy,{
					width : 35
				});
			break;
			case 'questionAnswer':
			case 'questionBody':
				var imgFullDir;
				var qDocY = docy;
				var boxLines = 0;
				var pattReplAll = /<div class="col-md-12 spaces_.{3,5}">|<br>|<img.*?>|<su.>|<\/su.>|<div class="col-md-2">|<div class="col-md-8">/;
				while(obj[frag].search(pattReplAll)>-1){
					var index = obj[frag].search(pattReplAll);
					if(boxLines!=0&&obj[frag].search('<div class="col-md-12 spaces_box">')!=0){
						if(pdfConfig.newLine){
							qDocY += pdfConfig.lineHeight+8;
						}else{
							qDocY += 2 * pdfConfig.lineHeight+3;
						}
						doc.dash(pdfConfig.dashLength,pdfConfig.dashSpace).rect(100,qDocY,400,boxLines*24).stroke();
						qDocY += boxLines*24+24;
						pdfConfig.newLine = false;
						boxLines = 0;
					}
					if(index==0){
						/* implement drawing answering spaces for lines boxes and blank spaces */
						/* need switch statement to find if it's newline or imgtag or space tag */
						obj[frag] = obj[frag].replace(pattReplAll,function(s){
							
							switch(s){
								case '<br>':
								case '<div class="col-md-12 spaces_blank">':
								case '<div class="col-md-2">':
									doc.text('',100,qDocY,{
										width : 400,
										continued : false
									});
									
									pdfConfig.newLine = true;
									
									//so that there are no more than 3 consecutive new line characters
									if(newLineCounter<2){
										newLineCounter++;
										doc.moveDown();
										qDocY = doc.y;
									}
									
								break;
								
								//I forget what this is for. probably parsing the MCQ
								case '<div class="col-md-8">':
									doc.text('  ',100,qDocY,{
										width : 400,
										continued : true
									})
								break;
								case '<sup>':
									pdfConfig.newLine = false;
									qDocY -= 3;
									doc.fontSize(pdfConfig.bodyTextSize-2);								
								break;
								case '</sup>':
									pdfConfig.newLine = false;
									qDocY += 3;
									doc.fontSize(pdfConfig.bodyTextSize);
								break;
								case '<sub>':
									pdfConfig.newLine = false;
									qDocY += 3;
									doc.fontSize(pdfConfig.bodyTextSize-2);
								break;
								case '</sub>':
									pdfConfig.newLine = false;
									qDocY -= 3;
									doc.fontSize(pdfConfig.bodyTextSize);
								break;
								case '<div class="col-md-12 spaces_lines">':
									if(pdfConfig.newLine){
										qDocY += pdfConfig.lineHeight+10;
									}else{
										qDocY += 2 * pdfConfig.lineHeight + 3;
									}
									doc.moveTo(100,qDocY).lineTo(500,qDocY).dash(pdfConfig.dashLength,pdfConfig.dashSpace).stroke();
									pdfConfig.newLine = false;
									
								break;
								case '<div class="col-md-12 spaces_box">':
									pdfConfig.newLine = false;
									boxLines++;
								break;
								default:
								/* img tag */
									pdfConfig.newLine = true;
									var imageFilename = s.split('src="')[1].split('"')[0];
									try{
										var stat = fs.statSync(app.get('persistentDataDir')+imageFilename);
										var thisImgData = jsonImgData[imageFilename];
										var percentWidth=100;
										if(/width/.test(thisImgData.style)){
											thisImgData.style.replace(/width\:.*?\%/,function(s){
												percentWidth = s.replace(/width\:|%/g,'');
											})
										}
										//full width = 400px
										//thisImgData.dimension.width
										var targetWidth = Math.min(400/100*percentWidth,thisImgData.dimension.width);
										var targetHeight = targetWidth /thisImgData.dimension.width * thisImgData.dimension.height;
										doc.image(app.get('persistentDataDir')+imageFilename,100,qDocY,{fit : [targetWidth,targetHeight]});
										imgFullDir = app.get('persistentDataDir')+imageFilename;
										qDocY += targetHeight;
									}
									catch(error){
										doc.image(app.get('persistentDataDir')+'img/imageunlinked.png',100,qDocY,{fit : [400,200]});
										imgFullDir = app.get('persistentDataDir')+'img/imageunlinked.png';
									}
									qDocY += 40;
									arrAsyncCallBack.splice(0,1);
									/*
									// cannot invoke async, as writing pdf is either sync or async and asyc obtaining dimensions ruins the format
									gm(imgFullDir).size(function(e,r){
										if(e){
											qDocY += 300;
											arrAsyncCallBack.splice(0,1);
										}else{
											console.log(r);
											//r.width r.height
											if((r.width/r.height)>(4/3)){
												qDocY += 300*r.height/r.width;
											}else{
												qDocY += 300;
											}
											arrAsyncCallBack.splice(0,1);
											docEnd(arrAsyncCallBack,doc);
										}
									})
									*/
								break;
							}
							
							//replacing special tabs
							return '';
						});
					}else{
						//replacing tab spacing because pdfdoc does not parse them at all
						var writeQ = obj[frag].substring(0,index).replace(/\t/g,' ');
						doc.text(writeQ,100,qDocY,{
							width : 400,
							continued : true
						});
						
						//reset new line counter so new new line characters can be drawn
						newLineCounter = 0;
						pdfConfig.newLine = false;
						
						obj[frag] = obj[frag].substring(index);
						qDocY = doc.y;
					}
				}
				
				if(boxLines!=0){
					if(pdfConfig.newLine){
						qDocY += pdfConfig.lineHeight+8;
					}else{
						qDocY += 2 * pdfConfig.lineHeight+3;
					}
					doc.dash(pdfConfig.dashLength,pdfConfig.dashSpace).rect(100,qDocY,400,boxLines*24).stroke();
					pdfConfig.newLine = false;
					qDocY += boxLines*24+24;
					boxLines = 0;
				}
				
				//replacing tab spacing because pdf doc does not parse them at all
				doc.text(obj[frag].replace(/\t/g,' '),100,qDocY,{
					width : 400,
				});
				//reset new line counter so new new line characters can be drawn
				newLineCounter = 0;
				newdocy = doc.y;
			break;
			case 'questionMark':
				doc.text(obj[frag],550,docy,{
					width : 20,
				});						
			break;
		}
	}
	docy = newdocy+13;
	return docy;
}

function fetch_table_info(name,mode,callback){
	var order;
	if(name == 'table_config') {
		order = 'ORDER BY adminLvl';
	}else{
		order = 'ORDER BY id';
	}
	if(mode=='contents'){
		connection.query('SELECT * FROM ?? '+order,name,function(e,r){
			if(e){
				catch_error(e);
				callback(e);
			}else{
				callback(r)
			}
		})
	}else if(mode=='columns name'){
		connection.query('SELECT `COLUMN_NAME` FROM `INFORMATION_SCHEMA`.`COLUMNS` WHERE `TABLE_SCHEMA` = "'+app.get('mysqldb')+'" AND `TABLE_NAME` = ?',name,function(e,r){
			if(e){
				catch_error(e);
				callback(e);
			}else{
				callback(r);
			}
		})
	}
}

function thirdpartylogin(mode,profile,token,callback){
	
	/* callback(user) */
	/* define the items to be stored in user_db */
	var name;
	var email;
	var id;
	var passtoken;
	var salt = sha256(String(Date.now())); /* may not be necessary if already has an account */
	var passtoken;
	var sessionID = sha256(String(Date.now()));
	
	switch(mode){
		case 'google':
			name = profile.displayName;
			email = profile.emails[0].value;
			id = profile.id;
			passtoken = sha256(token+salt);
		break;
		case 'facebook':
			name = profile.name.givenName + ' ' + profile.name.familyName;
			email = profile.emails[0].value;
			id = profile.id;
			passtoken = sha256(token+salt);
		break;
		default:
		break;
	}
	
	connection.query('SELECT authId,displayName, admin, email, sessionID, authMethod FROM user_db WHERE authMethod = ? AND authID = ?;',[mode,id],function(e,r){
		if(e){
			catch_error(e);
			callback(null);
		}else{
			if(r.length==0){
				/* new login */
				connection.query('INSERT INTO user_db (authMethod, authID, displayName, email, salt, passtoken, sessionID, admin) VALUES (?,?,?,?,?,?,?,0)',[mode,id, name,email,salt,passtoken,sessionID,0],function(e1,r1){
					if(e1){
						catch_error(e1);
						callback(null);
					}else{
						var user = {authId : id, authMethod : mode,'email':email,'name':name,'admin':0,'sessionID':sessionID};
						callback(user);
					}
				})
			}else{
				callback(r[0]);
			}
		}
	})
}

//if target = chat, then json.id = int, if target = news, json.id = int, json.keyword = [keyword1, keyword2 ... ]
function subscriptionDelivery(target,json){
	connection.query('SELECT * FROM user_db',function(e,r){
		if(e){
			catch_error(e)
		}else{
			for (var i = 0; i<r.length; i++){
				switch(target){
					case 'chat':
						userNotification('chat',json.id,r[i]);
					break;
					case 'news':
						if(/subscription:.*?;/.test(r[i].notes1)){
							r[i].notes1.replace(/subscription:.*?;/,function(s){
								//json.keyword
								var ssplit = s.replace(/\;|subscription:|\ /g,'').split(',');
								for (var j = 0; j<ssplit.length; j++){
									if(json.keyword.indexOf(ssplit[j])>-1||ssplit[j]=='all'){
										io.sockets.to(r[i].sessionID).emit('receive news',json.rowData[0]);
										userNotification('news',json.id,r[i]);
										break;
									}
								}
							})
						}else{
							var newNotes1 = r[i].notes1 + 'subscription: ;'
							connection.query('UPDATE user_db SET notes1 = ? WHERE id = ?',[newNotes1,r[i].id],function(e1,r1){
								if(e1){
									catch_error(e1);
								}
							})
						}
					break;
					default:
					break;
					
				}
			}
		}
	})
}

function userNotification(mode,objId,user){
	switch(mode){
		case 'news':
			if(/news:.*?;/.test(user.notes1)){
				var newNotes1 = user.notes1.replace(/news:.*?;/,function(s){
					//only keep the latest 20 entries
					var ssplit = s.replace(/news:|;/,'').split(',');
					if(ssplit.length<20){
						return s.substring(0,s.length-1)+','+objId+';';
					}else{
						return ssplit.splice(0,1).join(',')+','+objId+';';
					}
				})
			}else{
				var newNotes1 = user.notes1+'news:'+objId+';';
			}
			
			connection.query('UPDATE user_db SET notes1 = ? WHERE id = ?;',[newNotes1,user.id],function(e,r){
				if(e){
					catch_error(e)
				}
			})
		break;
		case 'chat':
			if(/chat:.*?;/.test(user.notes1)){
				var newNotes1 = user.notes1.replace(/chat:.*?;/,function(s){
					//only keep the latest 20 entries
					var ssplit = s.replace(/chat:|;/,'').split(',');
					if(ssplit.length<20){
						return s.substring(0,s.length-1)+','+objId+';';
					}else{
						return ssplit.splice(0,1).join(',')+','+objId+';';
					}
				})
			}else{
				var newNotes1 = user.notes1+'chat:'+objId+';';
			}
			
			connection.query('UPDATE user_db SET notes1 = ? WHERE id = ?;',[newNotes1,user.id],function(e,r){
				if(e){
					catch_error(e)
				}
			})
			
		break;
		default:
		break;
	}
}

function restricting_access(user, mode, json, res, callback){
	connection.query('INSERT INTO ?? (requester,mode) VALUES (?,?);',['req_log',user.id,mode],function(e,r){
		if(e){
			catch_error(e);
			callback({'error' : e});
		}else{
			fs.writeFile(app.get('persistentDataDir')+'reqlog/'+r.insertId+'.json',JSON.stringify(json),'utf8',function(){
				connection.query('SELECT * FROM table_config WHERE adminLvl = ?',user.admin,function(e1,r1){
					if(e1){
						catch_error(e1);
						callback({'error':e1})
					}else if(r1.length==0){
						callback({'error':'admin lvl not found'})
					}else{
						switch(mode){
							case 'add dp':
								if(r1[0].addNewDP=='1'){
									connection.query('UPDATE ?? SET notes1=? WHERE id = ?',['req_log','true',r.insertId],function(e2,r2){
										if(e2){
											catch_error(e2)
										}else{
											subscriptionDelivery('news',{id:r.insertId,rowData:[{id:r.insertId,notes1:'true',requester:user.id,mode:mode}],keyword:[json.subject,json.target_syl]});
											callback('true');	
										}
									})								
								}else{
									subscriptionDelivery('news',{id:r.insertId,rowData:[{id:r.insertId,notes1:'',requester:user.id,mode:mode}],keyword:[json.subject,json.target_syl]});
									callback('pending');
								}								
							break;
							case 'add new curriculum':
								if(r1[0].addNewCurricula=='1'){
									connection.query('UPDATE ?? SET notes1=? WHERE id = ?',['req_log','true',r.insertId],function(e2,r2){
										if(e2){
											catch_error(e2)
										}else{
											subscriptionDelivery('news',{id:r.insertId,rowData:[{id:r.insertId,notes1:'true',requester:user.id,mode:mode}],keyword:[json.subject,json.target_syl]});	
											callback('true');	
										}
									})								
								}else{
									callback('pending');
									subscriptionDelivery('news',{id:r.insertId,rowData:[{id:r.insertId,notes1:'',requester:user.id,mode:mode}],keyword:[json.subject,json.target_syl]});
								}
							break;
							case 'save':
								if(r1[0].editQ=='1'){
									connection.query('SELECT * FROM table_masterquestions WHERE hashed_id = ?',json.hashed_id,function(es,rs){
										if(es){
											catch_error(es);
										}else{
											fs.writeFile(app.get('persistentDataDir')+'reqlog/'+r.insertId+'_overwritten.json',JSON.stringify(rs[0]),'utf8',function(){
												
											})
											connection.query('UPDATE ?? SET notes1=? WHERE id = ?',['req_log','true',r.insertId],function(e2,r2){
												if(e2){
													catch_error(e2)
												}else{
													subscriptionDelivery('news',{id:r.insertId,rowData:[{id:r.insertId,notes1:'true',requester:user.id,mode:mode}],keyword:[json.subject,json.target_syl]});
													callback('true');
												}
											})
										}
									})
								}else{
									subscriptionDelivery('news',{id:r.insertId,rowData:[{id:r.insertId,notes1:'',requester:user.id,mode:mode}],keyword:[json.subject,json.target_syl]});
									callback('pending');
								}
							break;
							case 'categorise':
							//break;
							case 'remove':
								if(r1[0].editQ=='1'){
									connection.query('UPDATE ?? SET notes1=? WHERE id = ?',['req_log','true',r.insertId],function(e2,r2){
										if(e2){
											catch_error(e2)
										}else{
											subscriptionDelivery('news',{id:r.insertId,rowData:[{id:r.insertId,notes1:'true',requester:user.id,mode:mode}],keyword:[json.subject,json.target_syl]});
											callback('true');
										}
									})
								}else{
									callback('pending');
									subscriptionDelivery('news',{id:r.insertId,rowData:[{id:r.insertId,notes1:'',requester:user.id,mode:mode}],keyword:[json.subject,json.target_syl]});
								}
							break;
							case 'add submit':
								if(r1[0].addNewQ=='1'){
									connection.query('UPDATE ?? SET notes1=? WHERE id = ?',['req_log','true',r.insertId],function(e2,r2){
										if(e2){
											catch_error(e2)
										}else{
											subscriptionDelivery('news',{id:r.insertId,rowData:[{id:r.insertId,notes1:'true',requester:user.id,mode:mode}],keyword:[json.subject,json.target_syl]});
											callback('true');
										}
									})
								}else{
									callback('pending');
									subscriptionDelivery('news',{id:r.insertId,rowData:[{id:r.insertId,notes1:'',requester:user.id,mode:mode}],keyword:[json.subject,json.target_syl]});
								}
							break;
							//break;
							default:
								if(user.admin>8){
									connection.query('UPDATE ?? SET notes1=? WHERE id = ?',['req_log','true',r.insertId],function(e2,r2){
										if(e2){
											catch_error(e2)
										}else{
											callback('true');
											subscriptionDelivery('news',{id:r.insertId,rowData:[{id:r.insertId,notes1:'true',requester:user.id,mode:mode}],keyword:[json.subject,json.target_syl]});
										}
									})
								}else{
									callback('pending');
									subscriptionDelivery('news',{id:r.insertId,rowData:[{id:r.insertId,notes1:'',requester:user.id,mode:mode}],keyword:[json.subject,json.target_syl]});
								}
							break;
						}
					}
				})
			});
		}
	})
	
	/*
	http://stackoverflow.com/a/14939404/6059235
	to retrieve the json object, do:
	
	var json = require('./path/filename.json')
	
	*/
}

function checkAuth(req,res,next){
	if(!req.user){
		res.redirect('/login');
	}else{
		return next();
	}
}

/* routes auth with fb */
app.get('/auth/facebook',passport.authenticate('facebookAuth',{scope : 'email'}));
app.get('/auth/facebook/callback',passport.authenticate('facebookAuth',{successRedirect : '/',failureRedirect : '/login'}));

/* local register */

app.post('/localRegister',function(req,res){
	
	var newAuthId = sha256(String(Date.now()));
	var newSalt = sha256(newAuthId);
	var newPswd = sha256(req.body.password+newSalt);
	connection.query('SELECT * FROM user_db WHERE authMethod = ? AND email = ?',['local',req.body.username],function(e,r){
		if(e){
			catch_error(e)
			res.send(e)
		}else{
			if(r.length>0){
				res.send({error:true,message:'User already exist!'})
			}else{
				connection.query('SELECT * FROM user_db WHERE (authMethod IS NULL OR authMethod = "") AND email = ?',[req.body.username],function(e1,r1){
					if(e1){
						catch_error(e1)
						res.send(e1)
					}else{
						if(r1.length>0){
							connection.query('UPDATE user_db SET authId = ?,passtoken = ?,salt=?,displayName=? WHERE authMethod = "" AND email = ?',[newAuthId,newPswd,newSalt,req.body.fullname,req.body.username],function(e2,r2){
								if(e2){
									catch_error(e2)
									res.send(e2)
								}else{
									res.send({success:true})
									verifyTimout(newAuthId,req.body);
								}
							})
						}else{
							connection.query('INSERT INTO user_db (authId,passtoken,email,salt,displayName) VALUES (?,?,?,?,?)',[newAuthId,newPswd,req.body.username,newSalt,req.body.fullname],function(e2,r2){
								if(e2){
									catch_error(e2)
									res.send(e2)
								}else{
									res.send({success:true})
									verifyTimout(newAuthId,req.body);
								}
							})
						}
					}
				})
			}
		}
	})
})

function verifyTimout(authId,body){
	
	setTimeout(function(){
		connection.query('DELETE from user_db WHERE authId = ? AND (authMethod IS NULL OR authMethod = ?)',[authId,''],function(e,r){
			if(e){
				catch_error(e)
			}
		})
	},99*60*1000)
	
	verifyEmail({
		to : body.username,
	},{
		username : body.fullname,
		link : 'http://join.examcopedia.club/verify?token='+authId,
	},function(e,i){
		if(e){
			catch_error(e)
		}
	})
}

app.get('/verify',function(req,res){
	connection.query('UPDATE user_db SET authMethod = "local" WHERE authId = ? AND (authMethod = "" OR authMethod IS NULL)',req.param('token'),function(e,r){
		if(e){
			catch_error(e)
		}else{
			if(r.affectedRows==1){
				res.send('Thanks for verifying your e-mail address.')
				thankyouEmail({
					to : body.username,
				},{
					username : body.fullname,
				},function(e1,i){
					if(e){
						catch_error(e1)
					}
				})
			}else{
				res.send('Your e-mail address was not verified. Perhaps try to register and verify it again?')
			}
		}
	})
})

/* routes auth local */
app.post('/loggingLocal',passport.authenticate('local',{successRedirect : '/', failureRedirect : '/login', failureFlash : true}))

/* routes auth google */
app.get('/auth/google',passport.authenticate('googleAuth',{scope : ['profile','email']}));
app.get('/auth/google/callback', 
	passport.authenticate('googleAuth',{failureRedirect : '/login'}),
	function(req,res){
		res.redirect('/')
	})

/* make mobileupload folder upon initialisation */
fs.stat('mobileuploads',function(e,s){
	if(e){
		catch_error(e);
		fs.mkdir('mobileuploads',function(e1){
			if(e1){
				catch_error(e1);
			}
		});
	}
});
	
	
/* making ocr folder */
fs.stat('ocrStorage',function(e,s){
	if(e){
		catch_error(e);
		fs.mkdir('ocrStorage',function(e1){
			if(e1){
				catch_error(e1);
			}
			else{
				
			}
		});
	}else{
		
	}			
});
	
/* making reqlog */
fs.stat(app.get('persistentDataDir')+'reqlog',function(e,s){
	if(e){
		fs.mkdir(app.get('persistentDataDir')+'reqlog',function(e1){
			if(e1){
				catch_error(e1);
			}
		});
	}
})

/* making pdfout */
fs.stat(app.get('persistentDataDir')+'pdfout',function(e,s){
	if(e){
		fs.mkdir(app.get('persistentDataDir')+'pdfout',function(e1){
			if(e1){
				catch_error(e1);
			}
		});
	}
})

/* creates req_log table */
connection.query('SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = "'+app.get('mysqldb')+'" AND TABLE_NAME = "apicalls"',function(e,r){
	if(e){
		catch_error(e);
	}else{
		if(r.length!=0){
			return;
		}
		connection.query('	CREATE TABLE `apicalls` ( `id` int(8) NOT NULL AUTO_INCREMENT, `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, `apikey` varchar(32) NOT NULL, PRIMARY KEY (`id`)) ',function(e1,r1){
			if(e1){
				catch_error(e1);
			}
		});
	}
})

/* creates req_log table */
connection.query('SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = "'+app.get('mysqldb')+'" AND TABLE_NAME = "req_log"',function(e,r){
	if(e){
		catch_error(e);
	}else{
		if(r.length!=0){
			return;
		}
		connection.query('CREATE TABLE `req_log` ( `id` int(16) NOT NULL AUTO_INCREMENT, `requester` varchar(256) NOT NULL, `mode` varchar(32) NOT NULL, `notes1` varchar(256) NOT NULL, `notes2` varchar(256) NOT NULL, PRIMARY KEY (`id`))',function(e1,r1){
			if(e1){
				catch_error(e1);
			}
		});
	}
})

/* creates user_db table */
connection.query('SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = "'+app.get('mysqldb')+'" AND TABLE_NAME = "user_db"',function(e,r){
	if(e){
		catch_error(e);
	}else if(r.length==0){
		connection.query('CREATE TABLE `user_db` ( `id` int(16) NOT NULL AUTO_INCREMENT, `authMethod` varchar(8) NOT NULL,`sessionID` varchar(64),`admin` int(1) NOT NULL, `authID` varchar(256) NOT NULL, `displayName` varchar(256) NOT NULL, `email` varchar(256) NOT NULL, `salt` varchar(64) NOT NULL, `passtoken` varchar(64) NOT NULL, `notes1` varchar(8196) NOT NULL, `notes2` varchar(8196) NOT NULL, PRIMARY KEY (`id`))',function(e1,r1){
			if(e1){
				catch_error(e1)
			}
		})
	}
})

/* create comment table */
connection.query('SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = "'+app.get('mysqldb')+'" AND TABLE_NAME = "comment_db"',function(e,r){
	if(e){
		catch_error(e);
	}else if(r.length==0){
		connection.query('CREATE TABLE `comment_db` ( `id` int(16) NOT NULL AUTO_INCREMENT, `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `username` varchar(256) NOT NULL, `comment` varchar(8196) NOT NULL, `ref` varchar(64) NOT NULL, `note1` varchar(256) NOT NULL, `note2` varchar(256) NOT NULL, PRIMARY KEY (`id`))',function(e1,r1){
			if(e1){
				catch_error(e1);
			}
		})
	}
})

/* create table_config */
connection.query('SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = "'+app.get('mysqldb')+'" AND TABLE_NAME = "table_config"',function(e,r){
	if(e){
		catch_error(e);
	}else if(r.length==0){
		connection.query('CREATE TABLE `table_config` ( `id` int(2) NOT NULL AUTO_INCREMENT, `adminLvl` int(1) NOT NULL, `addNewCurricula` int(1) NOT NULL, `addNewDP` int(1) NOT NULL, `addNewQ` int(1) NOT NULL, `editQ` int(1) NOT NULL, PRIMARY KEY (`id`))',function(e1,r1){
			if(e1){
				catch_error(e);
			}else{
				for(var i = 0; i<10; i++){
					connection.query('INSERT INTO table_config (adminLvl, addNewCurricula, addNewDP, addNewQ, editQ) VALUES (?,1,1,1,1)',i,function(e2,r2){
						if(e2){
							catch_error(e2);
						}else{
							
						}
					})
				}
			}
		})
	}
});

app.get('/mobileupload',function(req,res){
	res.sendfile('mobileupload.html');
});

app.get('/pdfout/*',function(req,res){
	fs.stat(app.get('persistentDataDir')+req.url,function(e,s){
		if(e){
			res.send('no file found')
		}else{
			res.sendfile(app.get('persistentDataDir')+req.url);
		}
	})
})

app.get('/img/*',function(req,res){
	fs.stat(app.get('persistentDataDir')+req.url,function(e,s){
		if(e){
			res.sendfile(app.get('persistentDataDir')+'img/imageunlinked.png');
		}else{
			res.sendfile(app.get('persistentDataDir')+req.url);
		}
	})
})

app.get('/reqlog/*',checkAuth,function(req,res){
	fs.stat(app.get('persistentDataDir')+req.url,function(e,s){
		if(e){
			res.send({error : req.url+' does not exist'});
		}else{
			fs.readFile(app.get('persistentDataDir')+req.url,function(e,data){
				if(e){
					catch_error(e);
				}else{
					res.send({data:JSON.parse(data)});
				}
			})
		}
	})
})

function systemCommentLogAdminUndo(userId,targetHashedId,mode){
	connection.query('SELECT id FROM table_masterquestions WHERE hashed_id = ?',targetHashedId,function(e,r){
		if(e){
			catch_error(e)
		}else if(r.length!=1){
			catch_error('hash id not unique!'+targetHashedId)
		}else{
			systemCommentLog(userId,r[0].id,{
				file : 'admin',
				action : 'undo',
				originalEvent : mode
			})
		}
	})
}

function systemCommentLog(user,target,mode){
	connection.query('SELECT hashed_id FROM table_masterquestions WHERE id = ?',target,function(e,r){
		if(e){
			catch_error(e)
		}else{
			var alertClass;
			var comment = '<span class = "hidden class_core_span_userName">' + user + '</span>';
			switch(mode.file){
				case 'file':
					switch(mode.action){
						case 'add':
							alertClass = 'info'
							comment += ' added this question'
						break;
						case 'save':
							alertClass = 'warning'
							comment += ' updated this question'
						break;
						case 'remove':
							alertClass = 'danger'
							comment += ' removed this question'
						break;
						default:
							comment += ' filed this question'
						break;
					}
					switch(mode.result){
						case 'pass':
							comment += '.'
						break;
						case 'approval':
							comment += ' pending approval.'
						break;
						default:
							comment += ' with unknown consequences.'
						break;
					}
				break;
				case 'categorise':
					switch(mode.action){
						case 'add':
							alertClass = 'success'
							comment += ' categorised this question according to ' + mode.target_syl + ' under ' + mode.dp
						break;
						case 'delete':
							alertClass = 'success'
							comment += ' removed the categorisation of this question in ' + mode.target_syl + ' under ' + mode.dp
						break;
						default:
							comment += ' categorised this question'
						break;
					}
					switch(mode.result){
						case 'pass':
							comment += '.'
						break;
						case 'approval':
							comment += ' pending approval.'
						break;
						default:
							comment += ' with unknown consequences.'
						break;
					}
				break;
				case 'admin':
					switch(mode.action){
						case 'approve':
							alertClass = 'danger'
							comment += ' approved'
						break;
						case 'reject':
							alertClass = 'danger'
							comment += ' rejected'
						break;
						case 'undo':
							alertClass = 'danger'
							comment += ' undid'
						break;
						default:
							comment += ' action admin power this question'
						break;
					}
					switch(mode.originalEvent){
						case 'add submit':
							comment += ' the request to add this question'
						break;
						case 'categorise':
							comment += ' the request to categorise this question.'
						break;
						case 'save':
							comment += ' the request to update this question.'
						break;
						case 'remove':
							comment += ' the request to delete this question.'
						break;
						default:
							comment += ' with unknown targets.'
						break;
					}
				break;
				default:
					comment += ' did something not quite right.'
				break;
			}
			var json = {
				username : "system",
				ref : r[0].hashed_id,
				comment : comment,
			}
			connection.query('INSERT INTO comment_db (username, comment, ref) VALUES (?,?,?);',[json.username,'{{' + alertClass + '}}'+json.comment,json.ref],function(e1,r1){
				if(e1){
					catch_error(e1)
				}
			})
		}
	})
	//user = userId
	//target = questionid
	//mode.file=file => mode.action = add | save | remove; result = approval | pass
	//mode.file=categorise => mode.action = delete | add; result= approval | pass; mode.target_syl mode.dp
	//mode.file=admin =>mode.decision=approve | reject | undo; mode.originalEvent = add submit | categorise | save | remove
}

/* check if req has valid api key or if it's from local/trusted source */
function checkAPI(req,res,next){
	var ref = req.headers.referer;
	if(/^http\:\/\/join\.examcopedia\.club/.test(ref)){
		return next();
	}else{
		if(req.body.apikey==''||req.body.apikey==undefined||req.body.apikey==0){
			res.send({error:'Error when searching api key.'})
		}else{
			connection.query('SELECT * FROM user_db WHERE api = ?',req.body.apikey,function(e,r){
				if(e){
					catch_error(e)
					res.send({error:'Error when searching api key.'})
				}else{
					if(r.length!=1){
						res.send({error:'Error with api key. Please contact an admin, quoting your username and apikey. We will try to fix it ASAP.'})
					}else{
						connection.query('INSERT INTO apicalls (apikey) VALUES (?);',req.body.apikey,function(e1,r1){
							if(e1){
								catch_error(e1);
								res.send({error:'Error storing api calls. Contact an admin.'})
							}else{
								req.insertId = r1.insertId;
								req.referer = ref;
								return next();
							}
						})
					}
				}
			})
		}
	}
}

/* make apilog folder */
fs.stat(app.get('persistentDataDir')+'apilog',function(e,s){
	if(e){
		catch_error(e);
		fs.mkdir(app.get('persistentDataDir')+'apilog',function(e1){
			if(e1){
				catch_error(e1)
			}
		})
	}
})

function writeAPICallLog(req,res,json){
	var jsonIn = {
		referer : req.headers.referer,
		request : req.body,
		response : json
		}
	
	/* check if the req came from local or foreign */
	if(req.insertId){
		/* sterilise the notes1 field */
		if(Array.isArray(json)){
			for (var i = 0; i<json.length; i++){
				json[i].note = '';
			}
		}else{
			json.note = '';
		}
		
		/* log the api call */
		fs.writeFile(app.get('persistentDataDir')+'apilog/'+req.insertId+'.json',JSON.stringify(jsonIn),'utf8',function(e){
			if(e){
				catch_error(e);
			}
		})
		res.send(json);
		
	}else{
		res.send(json)
	}
	
}

/* ping question for login random question or later on for speciality use (api etc?) */
app.post('/pingQ',checkAPI,function(req,res){
	var mode = req.body.mode;
	var escapedvar = [];
	var queryOptions = '';
	
	if (req.body.subject != undefined && req.body.subject != ''){
		queryOptions += ' AND subject LIKE ? ';
		escapedvar.push(req.body.subject);
	}
	
	if (req.body.hashed_id != undefined && req.body.hashed_id != ''){
		queryOptions += ' AND hashed_id = ? ';
		escapedvar.push(req.body.hashed_id);
	}
	
	if (req.body.syllabus != undefined && req.body.syllabus != ''){
		var querystring0 = 'SELECT f_id FROM ?? WHERE lvl NOT LIKE "%info" ';
		var escapedvar0 = ['curriculum_'+req.body.syllabus];
		
		if(req.body.dp != undefined && req.body.dp != ''){
			querystring0 += 'AND lvl LIKE ?'
			escapedvar0.push(req.body.dp+'%');
		}
		connection.query(querystring0,escapedvar0,function(e0,r0){
			if(e0){
				catch_error(e0)
			}else{
				
				var querystring1;
				if(r0.length==0){
					if(/not syllabus/.test(req.body.option)){
						querystring1='SELECT note,subject, hashed_id, question, answer,space,mark FROM table_masterquestions WHERE delete_flag = 0' + queryOptions;
					}else{
						writeAPICallLog(req,res,{error:true,message:'failed',reason:'no result'});
						return;
					}
				}else{
					var qs = '';
					for (i=0;i<r0.length;i++){
						if(qs!=''){
							qs +=',';
						}
						qs+=r0[i].f_id;
					}
					// qs = r0.join(',')
					querystring1 = 'SELECT note,subject, hashed_id, question, answer,space,mark FROM table_masterquestions WHERE delete_flag = 0 AND id';
					if(/not syllabus/.test(req.body.option)){
						querystring1 += ' NOT';
					}
					querystring1 += ' IN ('+qs+')' + queryOptions;
				}
				
				connection.query(querystring1,escapedvar,function(e,r){
					if(e){
						catch_error(e);
					}else{
						if(r.length==0){
							writeAPICallLog(req,res,{error:true,message:'failed',reason:'no result'});
						}else{
							switch (mode){
								case 'random':
									var json = {
										method : 'random',
										length : 1
									}
									view_submit_filter_cb(json,r,function(o){
										/* need to remove note */
										
										writeAPICallLog(req,res,o[0]);
									})
								break;
								case 'categorise':
									var json  = {
										method : 'random',
										length : req.body.length
									}
									view_submit_filter_cb(json,r,function(o){
										/* need to remove note */
										writeAPICallLog(req,res,o);
									})
								break;
								case 'all':
									view_submit_filter_cb({method : 'all'},r,function(o){
										/* need to remove note */
										writeAPICallLog(req,res,o);
									})
								break;
								default:
								break;
							}
						}
					}
				});
			}
		})
	}else{
		/* when syllabus is NOT defined. so use subject and/or hash_id to find questions */
		
		var querystring = 'SELECT note,subject, hashed_id, question, answer, space, mark FROM table_masterquestions WHERE delete_flag = 0 '+queryOptions;
		connection.query(querystring,escapedvar,function(e,r){
			if(e){
				catch_error(e);
			}else{
				switch (mode){
					case 'random':
						var json = {
							method : 'random',
							length : 1
						}
						view_submit_filter_cb(json,r,function(o){
							writeAPICallLog(req,res,o[0]);
						})
					break;
					case 'categorise':
						var json  = {
							method : 'random',
							length : req.body.length
						}
						view_submit_filter_cb(json,r,function(o){
							writeAPICallLog(req,res,o);
						})
					break;
					case 'all':
						view_submit_filter_cb({method : 'all'},r,function(o){
							writeAPICallLog(req,res,o);
						})
					break;
					default:
					break;
				}
			}
		})
	}
})

app.get('/logout',function(req,res){
	req.logout();
	res.redirect('/login');
})

app.set('view engine','ejs');

app.get('/profile',checkAuth,function(req,res){
	if(req.user.admin>2){
		fetch_table_info('table_config','contents',function(o){
			fetch_table_info('table_config','columns name',function(o1){
				if(req.user.admin>7){
					fetch_table_info('user_db','contents',function(o2){
						fetch_table_info('user_db','columns name',function(o3){
							res.render('../profile.ejs',{
								user : req.user,
								siteConfig : o,
								siteConfigSchema : o1,
								usersConfig : o2,
								usersConfigSchema : o3
							})
						})
					})
				}else{
					res.render('../profile.ejs',{
						user : req.user,
						siteConfig : o,
						siteConfigSchema : o1
					})
				}
			})
		})
	}else{
		res.render('../profile.ejs',{user : req.user});
	}
})

/* send login page */
app.get('/login',function(req,res){
	if(!req.user){
		res.render('../login.ejs',{
			user : false,
			errors : req.flash('error')
		});
	}else{
		res.redirect('/');
	}
})

app.get('/',checkAuth,function(req,res){
	res.render('../landing.ejs',{
		user : req.user
	});
});

app.get('/add',checkAuth,function(req,res){
	/* 
	//this stores the logged in user info
	console.log(req.user); 
	*/
	res.render('../add.ejs',{
		user : req.user
	});
});

app.get('/view',checkAuth,function(req,res){
	res.render('../view.ejs',{
		user : req.user
	});
});

app.get('/categorise',checkAuth,function(req,res){
	res.render('../categorise.ejs',{
		user : req.user
	});
});

app.get('/about',function(req,res){
	res.render('../about.ejs',{
		user : req.user,
		errors : req.flash('error')
	})
})

app.get('/api',function(req,res){
	res.render('../api.ejs',{
		user : req.user,
		errors : req.flash('error')
	})
})

app.post('/categoriseQ',checkAPI,function(req,res){
	var hashedId = req.body.hashedId
	var syl = 'curriculum_'+req.body.syl
	
	var query = '';
	for(var i = 0; i<hashedId.length; i++){
		if(query !=''){
			query += ','
		}
		query += connection.escape(hashedId[i]) 
	}
	
	connection.query(
	'SELECT table_masterquestions.hashed_id, ??.lvl '+
	'FROM table_masterquestions '+
	'INNER JOIN ?? '+
	'ON ??.f_id = table_masterquestions.id '+
	'WHERE table_masterquestions.hashed_id IN ('+query+')',
		[syl,syl,syl],
		function(e1,r1){
		if(e1){
			catch_error(e1)
		}else{
			
			if(r1.length==0){
				res.send({error:'hashed id(s) not found categorised in the syllabus'})
			}
			
			var query1 = ''
			for(var j = 0; j<r1.length; j++){
				if(query1!=''){
					query1 += ','
				}
				query1 +=connection.escape(r1[j].lvl+'.info')
			}
			connection.query('SELECT lvl,description FROM ?? WHERE lvl IN ('+query1+')',syl,function(e,r){
				if(e){
					catch_error(e)
				}else{
					for(var l = 0; l<r1.length; l++){
						for(var k = 0; k<r.length; k++){
							if(r1[l].lvl+'.info'==r[k].lvl){
								r1[l].description = r[k].description
								break;
							}
						}
					}
					res.send(r1)
				}
			})
		}
	})
})

/*
app.get('/test',function(req,res){
	res.send('hello!')
	return;
	
	fs.readFile(app.get('persistentDataDir')+'/reqlog/100_overwritten.json',function(e,d){
		if(e){
			catch_error(e)
		}else{
			res.send(JSON.parse(d))
		}
	})
	
})
*/
app.get('/random',function(req,res){
	getRandom(req.query.v,res)
})

function getRandom(v,res){
	switch(v){
		case 'physics':
		case 'chemistry':
		case 'biology':
			connection.query('SELECT hashed_id,question,mark FROM table_masterquestions WHERE subject = ? AND delete_flag = 0;',v,function(e,r){
				if(e){
					catch_error(e)
					res.send(e)
				}else{
					if(r.length==0){
						res.send('Where did all the questions go?')
					}else{
						
						res.render('../random',{
							arrQuestions : JSON.stringify(shuffleArray(r).slice(0,5))
						})
					}
				}
			})
		break;
		default:
			res.redirect('/login')
		break;
	}
}

app.get('/changelog',function(req,res){
	res.sendfile('changelog.txt');
})

/*
app.get('/trim',checkAuth,function(req,res){
	if(req.user.admin<9){
		res.send('Why? How?')
		return false;
	}
	trim();
	res.send('OK')
	
})

function trim(){
	connection.query('SELECT * FROM table_masterquestions',function(e,r){
		if(e){
			catch_error(e)
		}else{
			for(var i = 0; i<r.length; i++){
				if(r[i].space!=''){
					var flag = false
					var newSpace = ''
					var space = r[i].space.split('_')
					for(var j = 1; j<space.length; j++){
						if(space[j].split('.')[0]==''){
							continue
						}else{
							flag = true
							newSpace += '[space '+ space[j].split('.')[0] + ' '+space[j].split('.')[1]+']'
						}
					}
					if(flag){
						r[i].space = ''
						r[i].question += newSpace
						connection.query('UPDATE table_masterquestions SET ? WHERE id = ?',[r[i],r[i].id],function(e1,r1){
							if(e1){
								catch_error(e1)
							}
						})
					}
				}
			}
		}
	})
}

*/

/*
app.get('/purge',checkAuth,function(req,res){
	if(req.user.admin<9){
		res.send('Why? How?')
		return false;
	}
	res.send('Ok')
	fs.readdir(app.get('persistentDataDir')+'/img/',function(e,files){
		if(e){
			catch_error(e)
			return false
		}
		for(var i = 0; i<files.length; i++){
			if(files[i]=='banner'){
				continue;
			}
			var stat = fs.statSync(app.get('persistentDataDir')+'/img/'+files[i])
			if(stat.isDirectory()){
				purge(files[i])
			}
		}
	})
})
*/

function purge(hashed_id){
	connection.query('SELECT question, answer FROM table_masterquestions WHERE hashed_id = ?',hashed_id,function(e,r){
		if(e){
			catch_error(e)
		}else{
			if(r.length!=1){
				catch_error('purging hashed id return rows doesn\'t equal to 1.')
				catch_error('r\.length\='+r.length)
			}else{
				var masterString = r[0].question+r[0].answer
				try{
					var files = fs.readdirSync(app.get('persistentDataDir')+'/img/'+hashed_id)
				}catch(error){
					catch_error(error)
					return;
				}
				
				for(var j = 0; j<files.length; j++){
					var searchString = files[j].substring(0,files[j].lastIndexOf('.'))+'_'+files[j].substring(files[j].lastIndexOf('.')+1)
					var patt = new RegExp(searchString)
					if(!patt.test(masterString)){
						fs.unlink(app.get('persistentDataDir')+'/img/'+hashed_id+'/'+files[j],function(e){
							if(e){
								catch_error(e)
							}
						})
					}
				}
			}
		}
	})
}


app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002 );
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");

server.listen(app.get('port'),app.get('ip'));

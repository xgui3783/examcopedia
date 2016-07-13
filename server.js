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
	
var passportSocketIO = require('passport.socketio');

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
	fail : function(obj){
		/* function to call when passport socket io auth fails for whatever reason */
		},
}))

app.set('persistentDataDir',process.env.OPENSHIFT_DATA_DIR||'public/');

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
		fs.stat('mobileuploads',function(e,s){
			if(e){
				catch_error(e);
				fs.mkdir('mobileuploads',function(e1){
					if(e1){
						catch_error(e1);
					}
					else{
						callback(null, 'mobileuploads');
					}
				});
			}else{
				callback(null, 'mobileuploads') 
			}
		})
	},
	filename : function(req,file,callback){
		callback(null, file.originalname);
	}
})

var upload = multer({storage : storage}).array('id_modal_file_file[]',5);
var uploadMobile = multer({storage : mobileStorage}).single('photo');

app.post('/upload',function(req,res){
	upload(req,res,function(e){
		fs.mkdir(app.get('persistentDataDir')+'img/'+req.body.hashedid + '/', function(e1){
			if(!e1 || (e1 && e1.code == 'EEXIST')){
				for (i = 0; i<req.files.length; i++){
					var originalname = req.files[i].originalname;
					resizeImage('uploads/',app.get('persistentDataDir')+'img/'+req.body.hashedid + '/',req.files[i].originalname,function(o){
						if(o=='done'){
							io.sockets.to(req.body.hashedid).emit('append imgtank',originalname);
							var json = {};
							res.send(json);
						}else{
							catch_error(o);
							res.send(o);
						}
					})
					
					/*
					fs.rename('uploads/' + req.files[i].originalname,app.get('persistentDataDir')+'img/'+req.body.hashedid + '/' + req.files[i].originalname,function(e2){
						if(e2){
							catch_error(e2);
						}else{
						}
					});
					*/
				}
			}else{
				catch_error(e1);
			}
		});
	})
});

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
				if(r==90||r==180||r==270){
					toBeRotated.push([s_split[0],r]);
				}
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
				if(r==90||r==180||r==270){
					toBeRotated.push([s_split[0],r]);
				}
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
/*
app.post('/deletepreview', function(req,res){
	var json = {};
	res.send(json); 
});
*/

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
										res.send('success');
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
									res.send('success');
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
				
				'PRIMARY KEY(id));',function(e1){
					if(e1){
						/* catch error */
						catch_error(e1);
					}
				});
			}
		}
	})
	
	/* generate pdf */
	socket.on('make pdf',function(i,callback){
		var doc = new PDFDoc({bufferPages : true});
		var pdfFilename = String(Date.now())+'.pdf';
		var stream = doc.pipe(fs.createWriteStream(app.get('persistentDataDir')+'pdfout/'+ pdfFilename));
		var docy = doc.y+20;
		var arrAsyncCallBack = [];
		
		doc.info.Title = 'exam generated by examcopedia';
		doc.info.Author = 'examcopedia';
		
		doc.fontSize(12).font('Times-Roman');
		doc.lineWidth(0.3);
		
		for(var block in i){
			//console.log(i[key])
			for(var question in i[block]){
				var qBodyTrim = i[block][question]['questionBody'].replace(/<h4>|<\/h4>|&nbsp;|<\/div>|<div class = "row">|<div class="row".*?>/g,'');
				var wordCountTrim = qBodyTrim.replace(/<div class="col-md-12 spaces_.{3,5}">|<br>|<img.*?>|<su.>.*?<\/su.>/g,'');
				var brCount = ( qBodyTrim.match(/<br>|<div class="col-md-2">|<div class="col-md-8">/g) || [] ).length;
				var spaceCount = (qBodyTrim.match(/<div class="col-md-12 spaces_.{3,5}">/g)||[]).length;
				
				i[block][question]['questionBody']=qBodyTrim;
				
				var lineHeight = 12;
				var lines = spaceCount*2 + Math.ceil(wordCountTrim.length/60) + brCount;
				
				if((qBodyTrim.match(/src=".*?"/g)||[]).length>0){
					var height = docy+(lines*lineHeight);
					qBodyTrim.match(/src=".*?"/g).forEach(function(v,idx,array){
						height += 300;	
						arrAsyncCallBack.push(false);
						/*
						var filename = app.get('persistentDataDir')+v.replace(/"/g,'').substring(4);
						gm(filename).size(function(e,r){
							if(e){
								catch_error(e);
								height += 40;
							}else{
								height += r.height;
							}
							if(idx===array.length-1){
								if(height > 800){
									doc.addPage();
									docy = doc.y;
								}
								docy = writeToPDF(i[block][question],doc,docy);
							}
						})
						*/
					});
					
					if(height > 800){
						doc.addPage();
						docy = doc.y + 20;
					}
					docy = writeToPDF(i[block][question],doc,docy,arrAsyncCallBack);

				}else{
					/* first check if there is enough space */
					if((docy+lines*lineHeight)>800){
						doc.addPage();
						docy = doc.y+20;
					}
					docy = writeToPDF(i[block][question],doc,docy,arrAsyncCallBack);
				}

				//spaceCount
				//Math.ceil(wordCountTrim.length/60)
				//brCount
				
			}
		}
		stream.on('finish',function(){
			var json = {
				result : 'success',
				url : 'pdfout/'+pdfFilename,
			}
			callback(json);
		})
		docEnd(arrAsyncCallBack,doc);
	})
	
	/* user login db. to be implemented */
	
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
	
	/* receiving and broadcasting general chat */
	socket.on('send general chat',function(i,callback){
		connection.query('INSERT INTO comment_db (username, comment, ref) VALUES (?,?,?)',[socket.request.user.displayName,i,'general chat'],function(e,r){
			if(e){
				callback(e);
				catch_error(e);
			}else{
				connection.query('SELECT * FROM comment_db WHERE id = ?',r.insertId,function(e1,r1){
					if(e1){
						catch_error(e1);
						callback(e1);
					}else{
						var json = {
							'user' : socket.request.user.displayName,
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
		connection.query('INSERT INTO comment_db (username, comment, ref) VALUES (?,?,?)',[socket.request.user.displayName,i.comment,i.target],function(e,r){
			if(e){
				catch_error(e)
				callback(e)
			}else{
				var json = {
					'user' : socket.request.user.displayName
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
	
	/* probably don't need this, since on disconnection, everything gets deleted any way */
	/*
	socket.on('delete thumbnail',function(i,callback){
		var path = app.get('persistentDataDir')+'img/' + i.hashedid + '/' + i.filename;
		fs.unlink(path,function(e){
			if(e){
				catch_error(e)
				callback('error');
			}else{
				callback('done');
			}
		})
	})
	*/
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
		switch(i.mode){
			case 'subject':
				if(i.subject.replace(' ','')==''||i.subject==undefined){
					connection.query('SELECT subject, hashed_id, question, answer,space,mark FROM table_masterquestions WHERE delete_flag = 0;',function(e,r){
						if(e){
							catch_error(e);
						}else{
							callback(r);
						}
					})
				}else{
					connection.query('SELECT subject, hashed_id, question, answer,space,mark FROM table_masterquestions WHERE delete_flag = 0 AND subject = ?;',i.subject,function(e,r){
						if(e){
							catch_error(e);
						}else{
							callback(r);
						}
					})
				}
			break;
			case 'curriculum':
				connection.query('SELECT f_id FROM ?? WHERE lvl NOT LIKE "%info" AND lvl LIKE ? ORDER BY id;',['curriculum_'+i.syllabus,i.dp+'%'],function(e,r){
					if(e){
						catch_error(e);
					}else{
						var querystring = '';
						for (i=0;i<r.length;i++){
							if(querystring!=''){
								querystring +=',';
							}
							querystring+=r[i].f_id;
						}
						connection.query('SELECT subject, hashed_id, question, answer,space,mark FROM table_masterquestions WHERE delete_flag = 0 AND id IN ('+querystring+');',function(e1,r1){
							if(e1){
								catch_error(e1);
							}else{
								callback(r1);
							}
						});
					}
				})
			break;
			default:
			break;
		}
	})
	
	socket.on('save dp',function(i,callback){
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
	})
	
	socket.on('add submit',function(i,callback){
		
		/* console.log(socket.request.user); */
		
		var r=cleanup(i.hashed_id,i.question,i.answer);
		var hashedid = r[0];
		var question = r[1];
		var answer = r[2];
		
		var json = {
			'hashedid' : r[0],
			'question' : r[1],
			'answer' : r[2]}
		
		restricting_access(socket.request.user,'add submit',i,null,function(o){
			if(o=='true'){
				connection.query(
					'INSERT INTO table_masterquestions (hashed_id, subject, question, answer, space, mark) VALUES (?,?,?,?,?,?);',[i.hashed_id,i.subject,question,answer,i.space,i.mark],function(e,r){
						if(e){
							catch_error(e);
						}else{
							callback('Addition of question successful!');
							
							/* trash cleaning function here. do the rotation, remove the unneeded photos */
						}
					})
			}else{
				if(o.error){
					callback(o);
				}else{
					callback('Submission of question received. A moderator will assess the submission ASAP.');
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
	});
	
	socket.on('categorise',function(i,callback){
		restricting_access(socket.request.user,'categorise',i,null,function(o){
			if(o=='true'){
				connection.query('SELECT id FROM table_masterquestions WHERE hashed_id = ?;',i.hashed_id,function(e,r){
					if(e){
						catch_error(e);
					}else{
						if(r.length>0){
							connection.query('INSERT INTO ?? (f_id,lvl) VALUES (?,?);',['curriculum_'+i.target_syl,r[0].id,i.lvl],function(e1,r1){
								if(e1){
									catch_error(e1);
								}else{
									callback('successful!');
								}
							})
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
					callback('pending approval.');
				}
			}
		});
	});
	
	socket.on('modify site config',function(i,callback){
		eval('var newState = { '+ i.column + ':' + i.newState + '}');
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
		restricting_access(socket.request.user,i.mode,i.data,null,function(o){
			if(o=='true'){
				/* carry out task */
				
				var querystring;
				var queryterms;
				var returnstring;
				
				switch(i.mode){
					case 'save':
						querystring = 'UPDATE table_masterquestions SET ? WHERE hashed_id = ?';
						queryterms = [i.data,i.data.hashed_id];
						returnstring = 'Saved to database!';
					break;
					case 'remove':
						querystring = 'UPDATE table_masterquestions SET delete_flag = ? WHERE hashed_id = ?';
						queryterms = [1,i.data.hashed_id];
						returnstring = 'Marked for deletion!';
					break;
					default:
					break;
				}
				connection.query(querystring,queryterms,function(e,r){
					if(e){
						catch_error(e)
						callback(e);
					}else{
						callback(returnstring);
					}
				})
			}else{
				if(o.error){
					callback(o)
				}else{
					callback('Submission received. Pending approval.')
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

function catch_error(e){
	console.log(e);
	//socket.emit('throw error',e)
}

/* using local strategy to authenticate user. implement 3rd party authentication process later */
passport.use('local',new localStrategy(
	function(username,password,done){
		/* temporary username and password */
		if(username=='panda'&&password=='pandaeatsbamboo'){
			var user = {'email':'panda@pandamakes.com.au','name':'Panda Makes','admin':0,'sessionID':'no sessionID'};
			return done(null, user);
		}else{
			return done(null, false, {message : 'Incorrect username or password!'});
		}
	}
));

/* login with facebook */

passport.use('facebookAuth',new facebookStrategy({
	'clientID' : process.env.FACEBOOK_ID || '148560108885548',
	'clientSecret' : process.env.FACEBOOK_SECRET || '046bec94bef4180776b5b630663f9020',
	'callbackURL' : '/auth/facebook/callback',
	'profileFields' : ['id', 'emails', 'name']},
	function(accessToken, refreshToken, profile, done){
		thirdpartylogin('facebook',profile,accessToken,function(user){
			return done(null,user);
		})
	}))

/* login with google */
passport.use('googleAuth',new googleStrategy({
	'clientID' : '151214178438-15sjnpj6qb0p49cn59j2aaqamjqoh3s0.apps.googleusercontent.com',
	'clientSecret' : 'nY5MQYeyZVC24eRmMPYfcrZv',
	'callbackURL' : '/auth/google/callback'},function (token,tokenSecret, profile, done){
		thirdpartylogin('google',profile,token,function(user){
			return done(null,user);
		})
	}))

passport.serializeUser(function(user,done){
	done(null,user.email);
})

passport.deserializeUser(function(email,done){
	connection.query('SELECT displayName, admin,email, sessionID FROM user_db WHERE email = ?;',email,function(e,r){
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

function docEnd(array,doc){
	if(array.length==0){
		//console.log(doc.bufferedPageRange())
		var range = doc.bufferedPageRange();
		var logos = [
			'join.examcopedia.club',
			'deal.studywild.cards'
			];
		var logo = logos[Math.floor(Math.random()*logos.length)];
		//range.start range.count
		//doc.switchToPage(idx) //0 indexed
		for(var i=0; i<range.count; i++){
			doc.switchToPage(i);
			doc.moveTo(50,70).lineTo(570,70).stroke();
			doc.font('Times-Italic').text(logo,50,55,{width : doc.width, align:'center'});
			doc.moveTo(50,690).lineTo(570,690).stroke();
			doc.text('Page '+ (i+1) + ' of '+ range.count,50,700,{width : doc.width, align:'center'});
		}
		doc.flushPages();
		doc.end();
	}
}

function writeToPDF(obj,doc,docy,arrAsyncCallBack){
	var newdocy;
	for(var frag in obj){
		/* first check the approx needed height */

		switch (frag) {
			case 'questionNumber':
				doc.text(obj[frag],50,docy,{
					width : 50
				});
			break;
			case 'questionBody':
				var imgFullDir;
				var qDocY = docy;
				var boxLines = 0;
				var pattReplAll = /<div class="col-md-12 spaces_.{3,5}">|<br>|<img.*?>|<su.>|<\/su.>|<div class="col-md-2">|<div class="col-md-8">/;
				while(obj[frag].search(pattReplAll)>-1){
					var index = obj[frag].search(pattReplAll);
					if(boxLines!=0&&obj[frag].search('<div class="col-md-12 spaces_box">')!=0){
						doc.rect(100,qDocY+24,400,boxLines*24).stroke();
						qDocY += boxLines * 24;
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
									doc.moveDown();
									qDocY = doc.y;
								break;
								case '<div class="col-md-8">':
									doc.text('  ',100,qDocY,{
										width : 400,
										continued : true
									})
								break;
								case '<sup>':
									qDocY -= 3;
									doc.fontSize(9);								
								break;
								case '</sup>':
									qDocY += 3;
									doc.fontSize(12);
								break;
								case '<sub>':
									qDocY += 3;
									doc.fontSize(9);
								break;
								case '</sub>':
									qDocY -= 3;
									doc.fontSize(12);
								break;
								case '<div class="col-md-12 spaces_lines">':
									qDocY += 24;
									doc.moveTo(100,qDocY+14).lineTo(500,qDocY+14).stroke();
									
								break;
								case '<div class="col-md-12 spaces_box">':
									boxLines++;
								break;
								default:
								/* img tag */
									var imageFilename = s.split('src="')[1].split('"')[0];
									try{
										var stat = fs.statSync(app.get('persistentDataDir')+imageFilename);
										doc.image(app.get('persistentDataDir')+imageFilename,100,qDocY,{fit : [400,200]});
										imgFullDir = app.get('persistentDataDir')+imageFilename;
									}
									catch(error){
										doc.image(app.get('persistentDataDir')+'img/imageunlinked.png',100,qDocY,{fit : [400,200]});
										imgFullDir = app.get('persistentDataDir')+'img/imageunlinked.png';
									}
									qDocY += 200;
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
							return '';
						});
					}else{
						var writeQ = obj[frag].substring(0,index);
						doc.text(writeQ,100,qDocY,{
							width : 400,
							continued : true
						});
						
						obj[frag] = obj[frag].substring(index);
						qDocY = doc.y;
					}
				}
				
				if(boxLines!=0){
					doc.rect(100,qDocY+24,400,boxLines*24).stroke();
					qDocY += boxLines * 24;
					boxLines = 0;
				}
				doc.text(obj[frag],100,qDocY,{
					width : 400,
				});
				newdocy = doc.y;
			break;
			case 'questionMark':
				doc.text(obj[frag],550,docy,{
					width : 20,
				});						
			break;
		}
	}
	docy = newdocy+50;
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
	
	connection.query('SELECT displayName, admin, email, sessionID FROM user_db WHERE authMethod = ? AND authID = ?;',[mode,id],function(e,r){
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
						var user = {'email':email,'name':name,'admin':0,'sessionID':sessionID};
						callback(user);
					}
				})
			}else{
				callback(r[0]);
			}
		}
	})
}

function restricting_access(user, mode, json, res, callback){
	/* 
	
	logic goes like this: if user.admin is larger than 8, then the changes will always go live () admin status
	if user.admin is 8 or less, then by default, the user can add and categorise, but not able to edit or remove from db...
	
	*/
	
	var control = 'true';
	//var control = 'restricted';
	
	connection.query('INSERT INTO ?? (requester,mode,notes1) VALUES (?,?,?);',['req_log',user.displayName,mode,control],function(e,r){
		if(e){
			catch_error(e);
			callback({'error' : e});
		}else{
			fs.writeFile(app.get('persistentDataDir')+'reqlog/'+r.insertId+'.json',JSON.stringify(json),'utf8',function(){
				switch(mode){
					case 'save':
					//break;
					case 'remove':
						if(user.admin>8){
							callback('true');
						}else{
							callback('pending');
						}
					break;
					case 'add submit':
					//break;
					case 'categorise':
					//break;
					default:
						if(user.admin>8){
							callback('true');
						}else{
							callback(control);
						}
					break;
				}
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

/* routes auth local */

app.post('/loggingLocal',passport.authenticate('local',{successRedirect : '/', failureRedirect : '/login', failureFlash : true}))

/* toues auth google */
app.get('/auth/google',passport.authenticate('googleAuth',{scope : ['profile','email']}));
app.get('/auth/google/callback', 
	passport.authenticate('googleAuth',{failureRedirect : '/login'}),
	function(req,res){
		res.redirect('/')
	})


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
			}else{
				
			}
		});
	}
})

/* creates user_db table */
connection.query('SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = "'+app.get('mysqldb')+'" AND TABLE_NAME = "user_db"',function(e,r){
	if(e){
		catch_error(e);
	}else if(r.length==0){
		connection.query('CREATE TABLE `user_db` ( `id` int(16) NOT NULL AUTO_INCREMENT, `authMethod` varchar(8) NOT NULL,`sessionID` varchar(64),`admin` int(1) NOT NULL, `authID` varchar(256) NOT NULL, `displayName` varchar(256) NOT NULL, `email` varchar(256) NOT NULL, `salt` varchar(64) NOT NULL, `passtoken` varchar(64) NOT NULL, `notes1` varchar(256) NOT NULL, `notes2` varchar(256) NOT NULL, PRIMARY KEY (`id`))',function(e1,r1){
			if(e1){
				catch_error(e1)
			}else{
				
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
			}else{
				
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

app.get('/pdfout/*',checkAuth,function(req,res){
	
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

/* ping question for login random question or later on for speciality use (api etc?) */
app.post('/pingQ',function(req,res){
	
	var querystring = 'SELECT subject, hashed_id, question, answer, space, mark FROM table_masterquestions WHERE delete_flag = 0 ';
	var tally = 0;
	var escapedvar = [];
	
	if (req.body.subject != undefined){
		//if(tally == 0) querystring += 'WHERE ';
		//tally ++;
		querystring += 'AND subject LIKE ? ';
		escapedvar.push(req.body.subject);
	}
	
	if(req.body.hashed_id != undefined){
		//if(tally == 0){querystring += 'WHERE ';}else{querystring += 'AND '}
		//tally ++;
		querystring += 'AND hashed_id = ? ';
		escapedvar.push(req.body.hashed_id);
	}
	
	var mode = req.body.mode;
	
	connection.query(querystring,escapedvar,function(e,r){
		if(e){
			catch_error(e);
		}else{
			switch (mode){
				case 'random':
					var choose = Math.floor(Math.random()*r.length);
					res.send(r[choose]);
				break;
				default:
				break;
			}
		}
	})
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

app.get('/about',checkAuth,function(req,res){
	res.render('../about.ejs',{
		user : req.user
	})
})

app.get('/changelog',function(res,res){
	res.sendfile('changelog.txt');
})

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002 );
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");

server.listen(app.get('port'),app.get('ip'));
#!/bin/env node
//  OpenShift sample Node application
var http = require('http');
var fs = require('fs-extra');
var express = require('express');
var app = require('express')();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var mysql = require('mysql');
var sha256 = require('js-sha256');
var multer = require('multer');
var bodyparser = require('body-parser');

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
		fs.mkdir('public/img/'+req.body.hashedid + '/', function(e1){
			if(!e1 || (e1 && e1.code == 'EEXIST')){
				for (i = 0; i<req.files.length; i++){
					fs.rename('uploads/' + req.files[i].originalname,'public/img/'+req.body.hashedid + '/' + req.files[i].originalname,function(e2){
						if(e2){
							catch_error(e2);
						}else{
							console.log(app.get('persistentDataDir'));
						}
					});
				}
			}else{
				catch_error(e1);
			}
		});
		if(e){
			catch_error(e);
			res.end('Error!'+e);
		}else{
			var json = {};
			res.send(json);
		}
	})
});

app.post('/deletepreview', function(req,res){
	var json = {};
	res.send(json); 
});

app.post('/mobileuploadphoto',function(req,res){
	uploadMobile(req,res,function(e){
		if(e){
			catch_error(e);
			//res.send('Error!'+e);
		}else{
			if(io.sockets.adapter.rooms[req.body.hashedid]!=undefined){
				fs.mkdir('public/img/'+req.body.hashedid+'/',function(e1){
					if(!e1 || e1 && e1.code =='EEXIST'){
						if(req.file==undefined){
							var str = req.body.photo.replace(/^data:image\/jpeg;base64,/, "");
							var buf = new Buffer(str, 'base64'); 
							fs.writeFile('public/img/'+req.body.hashedid + '/' + req.body.name, buf ,function(e2){
								if(e2){
									catch_error(e2);
								}else{
									io.sockets.to(req.body.hashedid).emit('mobile upload',req.body.name);
									res.send('success');
								}
							})
						}else{
							/* saving uncropped */
							fs.rename('mobileuploads/' + req.file.originalname,'public/img/'+req.body.hashedid + '/' + req.file.originalname,function(e2){
								if(e2){
									catch_error(e2);
								}else{
									io.sockets.to(req.body.hashedid).emit('mobile upload',req.file.originalname);
									
									res.send('success');
								}
							});
						}
					}
				})
			}else{
				res.send('noroom');
			}
		}
	});
});

app.set('mysqlhost',process.env.OPENSHIFT_MYSQL_DB_HOST||'localhost');
app.set('mysqluser',process.env.OPENSHIFT_MYSQL_DB_USERNAME||'root');
app.set('mysqlpswd',process.env.OPENSHIFT_MYSQL_DB_PASSWORD||'');
app.set('mysqldb','examcopedia');

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
	
	/* user login db. to be implemented */
	
	/* socket id identifies which question the user is editing on */
	socket.on('ping hashedid',function(i,callback){
		socket.join(i);
		socket.hashedid=i;
	})
	
	socket.on('delete thumbnail',function(i,callback){
		var path = 'public/img/' + i.hashedid + '/' + i.filename;
		fs.unlink(path,function(e){
			if(e){
				catch_error(e)
				callback('error');
			}else{
				callback('done');
			}
		})
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
		switch(i.mode){
			case 'subject':
				if(i.subject.replace(' ','')==''||i.subject==undefined){
					connection.query('SELECT subject, hashed_id, question, answer,space,mark FROM table_masterquestions;',function(e,r){
						if(e){
							catch_error(e);
						}else{
							callback(r);
						}
					})
				}else{
					connection.query('SELECT subject, hashed_id, question, answer,space,mark FROM table_masterquestions WHERE subject = ?;',i.subject,function(e,r){
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
						connection.query('SELECT subject, hashed_id, question, answer,space,mark FROM table_masterquestions WHERE id IN ('+querystring+');',function(e1,r1){
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
		connection.query(
			'INSERT INTO table_masterquestions (hashed_id, subject, question, answer, space, mark) VALUES (?,?,?,?,?,?);',[i.hashed_id,i.subject,i.question,i.answer,i.space,i.mark],function(e,r){
				if(e){
					catch_error(e);
				}else{
					callback('Addition of question successful!');
				}
			})
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
		
		connection.query(
		'CREATE TABLE curriculum_'+i+' ('+
		'id int(8) NOT NULL AUTO_INCREMENT,'+
		'f_id int(8),'+
		
		/* use 5.3.1 to indicate 5th chapter, 3rd small chapter, 1st smaller chapter
		use 5.info for chapter description */
		
		'lvl varchar(64) NOT NULL,'+
		'description varchar(1024),' +
		'notes varchar(8192),'+
		
		'FOREIGN KEY(f_id) REFERENCES table_masterquestions(id),'+
		'PRIMARY KEY(id));',function(e1){
			if(e1){
				/* catch error */
				catch_error(e1);
				callback(e1);
			}else{
				callback('New curriculum created!');
			}
		});
	});
	
	socket.on('categorise',function(i,callback){
		console.log('categorise');
		connection.query('SELECT id FROM table_masterquestions WHERE hashed_id = ?;',i.hashed_id,function(e,r){
			if(e){
				catch_error(e);
			}else{
				if(r.length>0){
					connection.query('INSERT INTO ?? (f_id,lvl) VALUES (?,?);',['curriculum_'+i.target_syl,r[0].id,i.lvl],function(e1,r1){
						if(e1){
							catch_error(e1);
						}else{
							callback('Categorise successful!');
						}
					})
				}else{
					catch_error('hash id not found.');
				}
			}
		})
	});
	
	socket.on('disconnect',function(){
		/* should delete all file in socket.hashedid */
		if(socket.hashedid!=undefined){
			var path = 'public/img/' + socket.hashedid + '/';
			fs.readdir(path,function(e,files){
				if(e){
					//catch_error(e);
					return;
				}
				if(files==undefined){
					console.log('files == undefined');
					fs.rmdirSync(path);
					return;
				}else{
					files.forEach(function(file,index){
						var curPath = path + file;
						fs.unlinkSync(curPath);
					});
					fs.rmdirSync(path);
				}
			})
		}
	});
});

function catch_error(e){
	console.log(e);
	//socket.emit('throw error',e)
}

app.use(express.static('public'));

app.get('/',function(req,res){
	res.sendfile('landing.html');
});

app.get('/add',function(req,res){
	res.sendfile('add.html');
});

app.get('/view',function(req,res){
	res.sendfile('view.html');
});

app.get('/categorise',function(req,res){
	res.sendfile('categorise.html');
});

app.get('/mobileupload',function(req,res){
	res.sendfile('mobileupload.html');
});

app.get('/img/*',function(req,res,next){
	
	fs.stat('public/'+req.url,function(e,s){
		if(e){
			res.sendfile('public/img/imageunlinked.png');
		}else{
			res.sendfile('public/'+req.url);
		}
	})
})

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002 );
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");

server.listen(app.get('port'),app.get('ip'));
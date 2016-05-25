#!/bin/env node
//  OpenShift sample Node application
var http = require('http');
var fs = require('fs');
var express = require('express');
var app = require('express')();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var mysql = require('mysql');
var sha256 = require('js-sha256');
var multer = require('multer');

var storage = multer.diskStorage({
	/* should check here if destination exist. if does not exist, create it. */
	destination	: function (req, files, callback){
		fs.stat('uploads',function(e,s){
			if(e){
				fs.mkdir('uploads',function(e1){
					catch_error(e1);
				}else{
					callback(null, 'uploads')
				})
			}else{
				callback(null, 'uploads')
			}
		})
	},
	filename : function(req,files,callback){
		callback(null, files.originalname);
	}
});

var upload = multer({storage : storage}).array('id_modal_file_file[]',5);

/* apparently needed for parsing req.body */

app.post('/upload',function(req,res){
	upload(req,res,function(e){
		fs.mkdir('public/img/'+req.body.hashedid + '/', function(e1){
			if(!e1 || (e1 && e1.code == 'EEXIST')){
				for (i = 0; i<req.files.length; i++){
					var extension = req.files[i].originalname.substring(req.files[i].originalname.lastIndexOf('.'));
					fs.rename('uploads/' + req.files[i].originalname,'public/img/'+req.body.hashedid + '/' + req.files[i].originalname,function(e2){
						if(e2){
							catch_error(e2);
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
		connection.query('SELECT f_id FROM ?? WHERE lvl NOT LIKE "%info" AND lvl LIKE ?',['curriculum_'+i.syllabus,i.dp+'%'],function(e,r){
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
				connection.query('SELECT hashed_id, question, answer,space,mark FROM table_masterquestions WHERE id IN ('+querystring+');',function(e1,r1){
					if(e1){
						catch_error(e1);
					}else{
						callback(r1);
					}
				});
			}
		})
	})
	
	socket.on('save dp',function(i,callback){
		var target_syl = 'curriculum_'+i.target_syl;
		var target_level = i.target_level+'.info';
		var info = i.value;
		
		info = info.substring(info.indexOf(info.split(/ /)[1]));
		
		connection.query('INSERT INTO ?? (lvl,description) VALUES (?,?);',[target_syl,target_level,info],function(e,r){
			if(e){
				catch_error(e);
			}else{
				
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
			}else{
				callback('New cirriculum created!');
			}
		});
	});
	
	socket.on('categorise',function(i,callback){
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
var http = require('http');
var url = require('url');
var express = require('express');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var countID = new ObjectID.createFromHexString("54f41d303fae2d2407a556b6");
var app=express();

var usePort = 1119;
var MongoAccount,MongoPasswd,MongoUrl;
var idCnt = 0;
var db;

var doclose = false;
var debug = false;
//var debug = true;
var serverClose = function(){
		doclose=true;
		fs.appendFile('IDSrv.log',(new Date())+ '\nsrv id: '+idCnt+'  ; ', function (err) {
				db.collection("idCount").findOne({_id:countID},function(err,data){
						fs.appendFile('IDSrv.log', 'inDB id: '+JSON.stringify(data)+'\n', function (err) {
								console.log('idSrv closing');
								process.exit(0);
						});
				});
		});
};


var server = http.createServer(app);
//app.set('jsonp callback name');
//app.use(bodyParser.json());
//app.set('jsonp callback name');
//app.use();
app.get('/id/get/json/',function(request, response){
		if(doclose==true){
				response.write('{"status":"fail","reason":"idSrv is closing."}');
				response.end();
				return;
		}
				queryData=url.parse(request.url,true).query;
				var body = '';
				var sendString = '';
				var count = 0 ;
				request.on('data', function (data) {
						body += data;
						if (body.length > 1e6){//prevent too big
								request.connection.destroy();
						}
						});
				request.on('end', function () {
						});
				if(debug){
					src_ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
					console.log((new Date()) + " ip: "+src_ip + ' get request: '+JSON.stringify(queryData) );
				}
				//console.log(JSON.stringify(request.url) );
						//response.setHeader('Content-Type', 'application/json');
				response.writeHead(200);
				count = (queryData)?( parseInt(queryData.count) ||1):1;
				if(count<=0 && !debug){
						response.write('{"status":"fail","reason":"fail parameter"}');
						response.end();
						return;

				}
				sendString = '{"status":"OK","start":'+idCnt+',"count":'+count+'}';

				db.collection("idCount").update({},{$inc: {count:count} },{safe:false},function(err,data){
								if (err){
										console.log(err);
										response.write('{"status":"fail","reason":"db error(5)""}');
										response.end();

								}else{
									idCnt+= count;
									response.write(sendString);
									response.end();
								}
				});



});

app.get('/id/get/number/',function(request, response){
		if(doclose==true){
				response.write("idSrv is closing");
				response.end();
				return;
		}
				queryData=url.parse(request.url,true).query;
				var sendString = '';
				var count = 0 ;
				request.on('end', function () {
						});
				if(debug){
					src_ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
					console.log((new Date()) + " ip: "+src_ip + ' get request: '+JSON.stringify(queryData) );
				}
				//console.log(JSON.stringify(request.url) );
						//response.setHeader('Content-Type', 'application/json');
				response.writeHead(200);
				count = (queryData)?( parseInt(queryData.count) ||1):1;
				if(count<=0 && !debug){
						response.write("fail parameter");
						response.end();
						return;

				}
				sendString = ++idCnt;

				db.collection("idCount").update({},{$inc: {count:count} },{safe:false},function(err,data){
								if (err){
										console.log(err);
										response.write('db error(5)');
										response.end();

								}else{
									response.write(sendString+"");
									response.end();
								}
				});



});
fs.readFile('./mongoInfo.priv',function(err,data){
			if(err){
				console.log("read mongoInfo error"+JSON.stringify(err));
				process.exit(2);
			}
			try{
					data = JSON.parse(data);
			}catch(e){
					console.log("parse mongoInfo fail: " + JSON.stringify(e) );
					process.exit(2);
			}

			if(!data.account || !data.passwd || !data.url){
					console.log("mongoInfo not enough info: " + JSON.stringify(data) ) ;
					process.exit(2);
			}
			MongoAccount = data.account;
			MongoPasswd = data.passwd;
			MongoUrl= data.url;
			
			MongoClient.connect(MongoUrl, function(err, database) {
				if(err){
						console.log("mongo connect error! "+JSON.stringify(err));
						process.exit(1);
				}

				db = database;
						

					// Start the application after the database connection is ready
					db.authenticate(MongoAccount, MongoPasswd, function(err, result) {
							if(!result){
									console.log("mongo auth fail");
									process.exit(1);
							}
							if(debug)console.log("auth result : " + result);
	
							db.collection("idCount").findOne({_id:countID},function(err,data){
									if(err){
											console.log(JSON.stringify(err));
											process.exit(1);
									}
									if(data.count == undefined){
											console.log("error at mongo connect: data.count UNDEFINED");
											process.exit(1);
									}
									if(debug)console.log(JSON.stringify(data));
									idCnt = data.count ;
									server.listen(usePort, function() {
											console.log((new Date()) + 'run on port:' + usePort);
											});
							});
					});
				});
});
process.on('SIGINT', function () {
		serverClose();

});
process.on('SIGTERM', function () {
		serverClose();

});

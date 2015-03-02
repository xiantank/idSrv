var http = require('http');
var url = require('url');
var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var app=express();

var usePort = 9527;
var MongoAccount='',MongoPasswd='';//TODO passwd should get frome file!
var idCnt = 0;//TODO get from file or DB
var db;

var server = http.createServer(app);
//app.set('jsonp callback name');
//app.use(bodyParser.json());
//app.set('jsonp callback name');
//app.use();
app.get('/id/get/',function(request, response){
				src_ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
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
				console.log((new Date()) + " ip: "+src_ip + ' normal get request: '+JSON.stringify(queryData) );
				//console.log(JSON.stringify(request.url) );
						//response.setHeader('Content-Type', 'application/json');
				response.writeHead(200);
				count = (queryData)?(queryData.count||1):1;
				sendString = '{"status":"OK","start":'+idCnt+',"count":'+count+'}';

				db.collection("idCount").update({},{count:(idCnt + parseInt(count) )},{safe:false},function(err,data){
								if (err){
										console.log(err);
										response.write('{"status":"fail"}');
										response.end();

								}else{
									idCnt+= parseInt(count,10);
									response.write(sendString);
									response.end();
								}
				});



});
MongoClient.connect("mongodb://140.123.4.160:5005/idAssign", function(err, database) {
				if(err) throw err;

				db = database;

				// Start the application after the database connection is ready
				db.authenticate(MongoAccount, MongoPasswd, function(err, result) {
						if(!result){
								console.log("mongo auth fail");
								process.exit(1);
						}
						console.log("auth result : " + result);
						server.listen(usePort, function() {
								console.log((new Date()) + 'run on port:' + usePort);
						});
				});
});


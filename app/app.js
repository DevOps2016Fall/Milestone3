var redis = require('redis');
var path = require('path');
var multer  = require('multer');
var express = require('express');
var fs      = require('fs');
var http      = require('http');
var httpProxy = require('http-proxy');
var ip = require('ip');
var app = express();

var redis_ip, redis_port;
var redis_info = fs.readFileSync(path.resolve(__dirname, './redis_server.json'));
try {
    redisServer = JSON.parse(redis_info);
    redis_ip = redisServer.redis_ip;
    redis_port = redisServer.redis_port;
}
catch (err) {
    console.log('parsing redis_server.json failed!');
    console.log(err);
}

var client = redis.createClient(redis_port,redis_ip, {});
var serversList = {};
var PORT=3000;

// REDIS
//var client = redis.createClient(6379, '127.0.0.1', {})

///////////// WEB ROUTES

// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next)
{
	console.log(req.method, req.url);
  client.lpush('_recent0',req.url);
  // console.log('Time:', Date.now());
	next(); // Passing the request to the next handler in the stack.
});

app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
   console.log(req.body); // form fields
   console.log(req.files); // form files

   if( req.files.image )
   {
	   fs.readFile( req.files.image.path, function (err, data) {
	  		if (err) throw err;
	  		var img = new Buffer(data).toString('base64');
	  		console.log(img);
	  		client.lpush("myimg",img);
		});
	}

   res.status(204).end();
}]);

app.get('/meow', function(req, res) {
		res.writeHead(200, {'content-type':'text/html'});
		client.lrange("myimg", 0, -1, function(error, items){
		if (error) throw error;
		if( items.length === 0 )
			res.write("<h1>\n the queue is empty!! </h1>");
			// res.end();
		items.forEach(function (imagedata)
		{
			client.lpop("myimg");
   			res.write("<h1>\n<img src='data:my_pic.jpg;base64," + imagedata + "'/>");
		});
		res.end();
	});

});

app.get('/', function(req, res) {
  res.send("Hello world from product server! :" + ip.address()+":"+PORT.toString()+"/");
});

app.get('/recent',function(req,res){
	client.ltrim('_recent0',0,4);
	var send_ulrs="";
	client.lrange('_recent0',0,4,function(err,value){
		// console.log(value);
		value.forEach(function(item){
			send_ulrs +=" \n " +item.toString();
		});
	res.send(send_ulrs);});
});

app.get('/get',function(req,res){
	client.get('key', function(err,value){
		// console.log(value);
		res.send(value);
	});
	// res.send("sss");

});

app.get('/set',function(req,res){

	getSetFeature(function(value){
		if (value ==="0"){
			client.set('key','this message will self-destruct in 10 seconds');
			client.expire('key',20);
			res.send('setting key!');
		}
		else{
			res.send('setting key features is disabled! YOU CAN\'T SET IT ');
		}
	});
	// client.get('disableSET',function(err,value){
	// 	if (value ==="0"){
	// 		client.set('key','this message will self-destruct in 10 seconds');
	// 		client.expire('key',20);
	// 		res.send('setting key!');
	// 	}
	// 	else{
	// 		res.send('setting key features is disabled! YOU CAN\'T SET IT ');
	// 	}

	// });
});

function getSetFeature(callback){
	client.get('disableSET',function(err,value){
		callback(value);
	});
}

// HTTP SERVER
var server = app.listen(3000, function () {
  client.del('_recent0');
  // client.del('serversList')
  // var host = server.address().address;
  // var port = server.address().port;
  console.log('Example app listening at port', "", 3000);
});

module.exports = server;

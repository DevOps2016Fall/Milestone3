var http      = require('http');
var httpProxy = require('http-proxy');
var fs = require('fs');
var exec = require('child_process').exec;
var request = require("request");
var redis = require('redis');

var redis_ip, redis_port
var redis_info = fs.readFileSync('./redis_server.json');
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

var product = fs.readFileSync('./product_server.json');
var productServer = JSON.parse(product);
var productIp = productServer.product_ip;
var productPort = productServer.product_port;
var TARGET = "http://"+productIp+":"+productPort;


var START_PORT=3000;

var infrastructure =
{
  setup: function()
  {
    // Proxy.
    var options = {};
    var proxy   = httpProxy.createProxyServer(options);
    var server  = http.createServer(function(req, res)
    {
      if (req.url == "/spawn")
      {
        exec('node ../deployment/provision_newProductServer.js product', function(err,out,code)
        {
          var newProductServer
          console.log("attempting to launch "+ START_PORT.toString() +" server");
          if (err instanceof Error)
            throw err;
          if( err )
          {
            console.error( err );
          }
          client.lrange("productServersList", 0, 1, function(err, value){
            value.forEach(function(item){
              // newProductServer = item.toString();
              res.writeHead(200, {'Content-Type': 'text/plain'});
              res.end("Create a  server : "+ item);
            });
          });
        });
        // res.writeHead(200, {'Content-Type': 'text/plain'});
        // res.end("Create a  server : "+ newProductServer);
      }
      if(req.url == "/destroy")
      {
        client.lpop("serversList",function(err, src){
          var start = src.indexOf("t:")+2;
          var PortID = src.substring(start,start+4); //"http://localhost:4000/"
          exec("forever list | grep '"+PortID+"' | awk -F '] ' '{print $2}' | awk -F ' ' '{print $1}'", function(err,out,code)
          {
            exec("forever stop "+ out, function(err,out,code){
              console.log("destroy server: "+ PortID.toString());
            });
          });
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end("Destroy a server: http://localhost:"+ PortID.toString()+"/");
        });
      }
      if(req.url == "/")
      {
        client.rpoplpush("productServersList", "productServersList", function(err, TARGET){
        console.log("Proxy now pointing to server:" + TARGET);
        proxy.web( req, res, {target: TARGET } );
        });
      }
      if(req.url == "/listservers")
      {
        var live_servers="The following servers are available: \n";
        client.lrange('serversList',0,-1,function(err,value){
        value.forEach(function(item){
        live_servers +="\n\t" +item.toString();});
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(live_servers);
        });
      }

    });
    server.listen(8081);

    // exec('forever start main.js 4000', function(err, out, code)
    // {
    //   client.del("serversList");
    //   client.lpush("serversList","http://localhost:4000/");
    //   console.log("attempting to launch  4000 server");
    //   if (err instanceof Error)
    //         throw err;
    //   if( err )
    //   {
    //     console.error( err );
    //   }
    // });
  },

  teardown: function()
  {
    exec('forever stopall', function()
    {
      console.log("infrastructure shutdown");
      process.exit();
    });
  },
};

infrastructure.setup();

// Make sure to clean up.
process.on('exit', function(){infrastructure.teardown();} );
process.on('SIGINT', function(){infrastructure.teardown();} );
process.on('uncaughtException', function(err){
  console.error(err);
  infrastructure.teardown();} );

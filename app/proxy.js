var http      = require('http');
var path = require('path');
var httpProxy = require('http-proxy');
var fs = require('fs');
var exec = require('child_process').exec;
var request = require("request");
var redis = require('redis');

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

var TARGET;


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
        getAlert(function(alert){
          console.log(alert);
          if(alert=="yes"){
            client.rpoplpush("productServersList", "productServersList", function(err, TARGET){
              console.log("Proxy now pointing to a regular proudct server:" + TARGET);
              proxy.web( req, res, {target: TARGET } );
            });
          }
          else{
            if(Math.random()>0.7){
              client.rpoplpush("stagingServersList","stagingServersList",function(err,TARGET){
                console.log("Proxy now pointing to a staging server:" + TARGET);
                proxy.web( req, res, {target: TARGET } );
              });
            }
            else{
              client.rpoplpush("productServersList", "productServersList", function(err, TARGET){
                console.log("Proxy now pointing to a regular proudct server:" + TARGET);
                proxy.web( req, res, {target: TARGET } );
              });
            }
          }
        });
      }
      if(req.url == "/listservers")
      {
        var live_servers="The following proudct servers are available: \n";
        client.lrange('productServersList',0,-1,function(err,value){
        value.forEach(function(item){
        live_servers +="\n\t" +item.toString();});
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(live_servers);
        });
      }
      if(req.url == "/disableSET/0")
      {
        client.set("disableSET",0);
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("SET feature on product servers is activated!  ");
      }
      if (req.url == "/disableSET/1")
      {
        client.set("disableSET",1);
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("SET feature on product servers is disabled!  ");
      }

    });
    server.listen(8081);
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
function getAlert(callback){
  client.get("alert",function(err, value){
    callback(value);
  });

}
// Make sure to clean up.
process.on('exit', function(){infrastructure.teardown();} );
process.on('SIGINT', function(){infrastructure.teardown();} );
process.on('uncaughtException', function(err){
  console.error(err);
  infrastructure.teardown();} );

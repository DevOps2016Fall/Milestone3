var needle = require("needle");
var os   = require("os");
var redis = require('redis');
var fs = require("fs");
var exec = require('child_process').exec;
var args = process.argv.slice(2);
if(args.length == 0){
  throw "Please pass serverName!";
}

var redis_ip, redis_port
var redis_info = fs.readFileSync('../app/redis_server.json');
try {
    redisServer = JSON.parse(redis_info);
    redis_ip = redisServer.redis_ip;
    redis_port = redisServer.redis_port;
}
catch (err) {
    console.log('parsing redis_server.json failed!');
    console.log(err);
}

var redisClient = redis.createClient(redis_port,redis_ip, {});

var serverName = args[0]
var config = {};
config.token = "a40b9e915e57df76e39a1eab52a4495e327f445d7d52a00c6e9a059ca0574466";// my own token

var headers =
{
	'Content-Type':'application/json',
	Authorization: 'Bearer ' + config.token
};

// Documentation for needle:
// https://github.com/tomas/needle

var client =
{
	getSSHKeyID:function(onResponse)
	{
		needle.get("https://api.digitalocean.com/v2/account/keys/4d:83:e3:c6:40:65:6b:04:b2:b9:58:89:6f:2c:e4:8a",{headers:headers},onResponse)
  },
	retrieveDroplet:function(dropletId,onResponse)
	{
		needle.get("https://api.digitalocean.com/v2/droplets/"+dropletId, {headers:headers}, onResponse)
	},
	createDroplet: function (dropletName, region, imageName, sshID,onResponse)
	{
		var data = 
		{
			"name": dropletName,
			"region":region,
			"size":"512mb",
			"image":imageName,
			// Id to ssh_key already associated with account.
			"ssh_keys":[sshID],
			//"ssh_keys":null,
			"backups":false,
			"ipv6":false,
			"user_data":null,
			"private_networking":null
		};

		// console.log("Attempting to create: "+ JSON.stringify(data) );

		needle.post("https://api.digitalocean.com/v2/droplets", data, {headers:headers,json:true}, onResponse );
	}

};


// // // #############################################
// // // Get the ID of SSH_key
// // // var sshID=null;
// client.getSSHKeyID(function(err,response)
// {
// 	var data = response.body
// 	if(!err)
// 	{
// 		sshID = data.ssh_key.id
// 		console.log(sshID)
// 	}
// });


// #############################################
// #3 Create an droplet with the specified name, region, and image
// Comment out when completed. ONLY RUN ONCE!!!!!
// Write down/copy droplet id.
var name = "UnityId-"+os.hostname();
var region = "nyc2"; // Fill one in from #1
var image = "ubuntu-14-04-x64"; // Fill one in from #2
var sshID = 3374967; // get it by proxy
var dropletId = null;
client.createDroplet(name, region, image, sshID,function(err, resp, body)
{
	// StatusCode 202 - Means server accepted request.
	if(!err && resp.statusCode == 202)
	{
		dropletId = body.droplet.id;
		// console.log("dropletId: "+ dropletId)
	}
});

// setTimeout(callCreate(){
//   if(serverName == "product"){
//   	redisClient.lpush("productServersList","http://"+publicIP+":3000/");
//   }
// },20000);

setTimeout(function(){
	callPostCreate(client, function(serverName,publicIP){
	  if(serverName == "product"){
  		redisClient.lpush("productServersList","http://"+publicIP+":3000/");
  	}
		var util  = require('util'),
		    spawn = require('child_process').spawn,
		    ls    = spawn('ansible-playbook',['-i','/root/Milestone3/deployment/inventory_product','/root/Milestone3/deployment/product.yml']);

		ls.stdout.on('data', function (data) {
		  console.log('stdout: ' + data.toString());
		});

		ls.stderr.on('data', function (data) {
		  console.log('stderr: ' + data.toString());
		});

		ls.on('exit', function (code) {
		  console.log('child process exited with code ' + code.toString());
		});

	})},38000);

setTimeout(exec('forever stopall', function()
    {
      console.log("infrastructure shutdown");
      process.exit();
    }),240000);

function callPostCreate(client, callback){
	client.retrieveDroplet(dropletId,function(err, response){
	var data = response.body;
	console.log(data)
  var publicIP = data.droplet.networks.v4[0].ip_address;
  console.log("DigitalOcean PublicIP: "+ publicIP);
	fs.appendFile('inventory_product', publicIP +' ansible_ssh_host='+publicIP+' ansible_ssh_user=root ansible_host_key_checking=False ansible_ssh_private_key_file=/root/Milestone3/key/ssh\n');
  console.log("A new product server is provisioned: done!");
  callback(serverName, publicIP)
  });
}





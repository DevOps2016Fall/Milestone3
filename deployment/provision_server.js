var needle = require("needle");
var redis = require('redis');
var os   = require("os");
var fs = require("fs");
var exec = require('child_process').exec;
var args = process.argv.slice(2);
var serverName = args[0];
if(args.length === 0){
  throw "Please pass serverName!";
}
if(serverName!="redis"){
	var redis_ip, redis_port;
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
}

var config = {};
config.token = "*****";// my own token
var headers =
{
	'Content-Type':'application/json',
	Authorization: 'Bearer ' + config.token
};

// Documentation for needle:
// https://github.com/tomas/needle

var client ={
	getSSHKeyID:function(onResponse){
		needle.get("https://api.digitalocean.com/v2/account/keys/6e:a5:95:7d:ba:9b:e6:fd:d1:65:c2:1b:21:21:ef:7e",{headers:headers},onResponse);
  },
	retrieveDroplet:function(dropletId,onResponse){
		needle.get("https://api.digitalocean.com/v2/droplets/"+dropletId, {headers:headers}, onResponse);
	},
	createDroplet: function (dropletName, region, imageName, sshID,onResponse){
		var data ={
			"name": dropletName,
			"region":region,
			"size":"512mb",
			"image":imageName,
			// Id to ssh_key already associated with account.
			"ssh_keys":[sshID],
			"backups":false,
			"ipv6":false,
			"user_data":null,
			"private_networking":null
		};
		needle.post("https://api.digitalocean.com/v2/droplets", data, {headers:headers,json:true}, onResponse );
	}
};

// #############################################
// #3 Create an droplet with the specified name, region, and image
// Comment out when completed. ONLY RUN ONCE!!!!!
// Write down/copy droplet id.
var name = serverName;
var region = "nyc2"; // Fill one in from #1
var image = "ubuntu-14-04-x64"; // Fill one in from #2
var sshID=3374967;
var dropletId = null;
client.createDroplet(name, region, image, sshID,function(err, resp, body)
{
	if(!err && resp.statusCode == 202)
	{
		dropletId = body.droplet.id;
	}
});

setTimeout(function(){
  callCreate(client, function(serverName,publicIP){
	  if(serverName == "redis"){
	  	fs.writeFile('../app/redis_server.json','{\"redis_ip\":\"'+publicIP+'\", \"redis_port\":6379}');
		  fs.appendFile('inventory', serverName+' ansible_ssh_host='+publicIP+' ansible_ssh_user=root  ansible_host_key_checking=False ansible_ssh_private_key_file=~/Milestone3/key/ssh\n');
		  run_ansible("/Users/WeiFu/Milestone3/deployment/inventory","/Users/WeiFu/Milestone3/deployment/redis.yml");
	  }
	  if(serverName == "product"){
	  	redisClient.lpush("productServersList","http://"+publicIP+":3000/");
			fs.appendFile('inventory_product', publicIP +' ansible_ssh_host='+publicIP+' ansible_ssh_user=root  ansible_host_key_checking=False ansible_ssh_private_key_file=~/Milestone3/key/ssh\n');
      run_ansible("/Users/WeiFu/Milestone3/deployment/inventory_product","/Users/WeiFu/Milestone3/deployment/product.yml");
      console.log("A new product server is provisioned: done!");
	  }
	  if(serverName == "staging"){
      console.log("A new product server is provisioned: done!");
	  	redisClient.lpush("stagingServersList","http://"+publicIP+":3000/");
		  fs.appendFile('inventory', serverName +' ansible_ssh_host='+publicIP+' ansible_ssh_user=root  ansible_host_key_checking=False ansible_ssh_private_key_file=~/Milestone3/key/ssh\n');
      run_ansible("/Users/WeiFu/Milestone3/deployment/inventory","/Users/WeiFu/Milestone3/deployment/staging.yml");
      console.log("A new staging server is provisioned: done!");
    }
  });
},38000);

function callCreate(client, callback){
	client.retrieveDroplet(dropletId,function(err, response){
	var data = response.body;
  var publicIP = data.droplet.networks.v4[0].ip_address;
  console.log("DigitalOcean PublicIP: "+ publicIP);
  callback(serverName, publicIP);
  });
}

function run_ansible(inventory, playbook){
	var util  = require('util'),
	    spawn = require('child_process').spawn,
	    ls    = spawn('ansible-playbook',['-i',inventory,playbook]);
	ls.stdout.on('data', function (data) {
	  console.log('stdout: ' + data.toString());
	});
	ls.stderr.on('data', function (data) {
	  console.log('stderr: ' + data.toString());
	});
	ls.on('exit', function (code) {
	  console.log('child process exited with code ' + code.toString());
    exec('forever stopall', function(){
      console.log("infrastructure shutdown");
      process.exit();
    });
	});
}

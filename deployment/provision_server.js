var needle = require("needle");
var os   = require("os");
var fs = require("fs");
var args = process.argv.slice(2);
if(args.length == 0){
  throw "Please pass serverName!";
}

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
		needle.get("https://api.digitalocean.com/v2/account/keys/6e:a5:95:7d:ba:9b:e6:fd:d1:65:c2:1b:21:21:ef:7e",{headers:headers},onResponse)
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
var sshID = 3374967; // get it by retrieve
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

setTimeout(function(){
	client.retrieveDroplet(dropletId,function(err, response){
	var data = response.body;
  var publicIP = data.droplet.networks.v4[0].ip_address;
  console.log("DigitalOcean PublicIP: "+ publicIP);
	fs.appendFile('inventory', serverName+' ansible_ssh_host='+publicIP+' ansible_ssh_user=root ansible_ssh_private_key_file=~/.ssh/id_rsa\n');
  console.log("DigitalOcean: done!");
  if(serverName == "redis"){
  	fs.writeFile('../app/redis_server.json','{\"redis_ip\":\"'+publicIP+'\", \"redis_port\":6379}')
  }
  if(serverName == "product"){
  	fs.appendFile('../app/product_server.json','{\"product_ip\":\"'+publicIP+'\", \"product_port\":3000}')
  }
  if(serverName == "staging"){
  	fs.appendFile('../app/product_server.json','{\"stage_ip\":\"'+publicIP+'\", \"stage_port\":3000}')
  }
  });
},20000);





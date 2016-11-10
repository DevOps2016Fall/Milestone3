var fs = require('fs');
var path = require('path');
var redis = require('redis');
var redis_ip, redis_port;
var redis_info = fs.readFileSync('/root/Milestone3/app/redis_server.json');
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
var alert = process.argv[2];
client.set('alert', alert);

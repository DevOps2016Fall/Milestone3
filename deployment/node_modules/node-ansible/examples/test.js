var Ansible = require('../index');
var p = new Ansible.AdHoc().hosts('ender').module('ping').privateKey('/home/user/.ssh/id_rsa').inventory('/devhome/source/bigpanda/playbooks/all/hosts').verbose('vvv').exec();
p.then(function(result) {
  console.log(result.output);
  console.log(result.code);
})

setInterval(function() {

}, 1000)
// var exec = require('child_process').exec;

// exec("./run_ansible.sh",function(err){
//   	if (err instanceof Error)
//       throw err;
//     if( err )
//     {
//       console.error( err );
//     }
//   });

var util  = require('util'),
    spawn = require('child_process').spawn,
    ls    = spawn('ansible-playbook',['-i','~/proxy/Milestone3/deployment/inventory_product','~/proxy/Milestone3/deployment/product.yml']);

ls.stdout.on('data', function (data) {
  console.log('stdout: ' + data.toString());
});

ls.stderr.on('data', function (data) {
  console.log('stderr: ' + data.toString());
});

ls.on('exit', function (code) {
  console.log('child process exited with code ' + code.toString());
});
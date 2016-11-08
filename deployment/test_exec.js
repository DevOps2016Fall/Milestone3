var exec = require('child_process').exec;

exec("export ANSIBLE_HOST_KEY_CHECKING=False",function(err){
  	if (err instanceof Error)
      throw err;
    if( err )
    {
      console.error( err );
    }
  });


const spawn = require( 'child_process' ).spawnSync,
     ls = spawn( 'ansible-playbook', [ '-i', '~/proxy/Milestone3/deployment/inventory_product','~/proxy/Milestone3/deployment/product.yml' ] );
// console.log( `stderr: ${ls.stderr.toString()}` );
// console.log( `stdout: ${ls.stdout.toString()}` );
// var Ansible = require('node-ansible')
// exec("ansible-playbook -i ~/proxy/Milestone3/deployment/inventory_product ~/proxy/Milestone3/deployment/product.yml", function(err){
//   	if (err instanceof Error)
//       throw err;
//     if( err )
//     {
//       console.error( err );
//     }
// });
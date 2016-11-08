var exec = require('child_process').exec;
exec("ansible-playbook -i ~/proxy/Milestone3/deployment/inventory_product ~/proxy/Milestone3/deployment/product.yml", function(err){
  	if (err instanceof Error)
      throw err;
    if( err )
    {
      console.error( err );
    }
});
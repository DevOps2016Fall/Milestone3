var exec = require('child_process').exec;

exec("./run_ansible",function(err){
  	if (err instanceof Error)
      throw err;
    if( err )
    {
      console.error( err );
    }
  });

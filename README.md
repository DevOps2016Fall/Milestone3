# Milestone3 Continuous Deployment

## Introduction
In this mileston, we're using DigitalOcean as our cloud provider to deploy our simple app on it by the continous deployment framework designed by us. We have four servers as the following

* Proxy server
* Global redis server
* Product server
* Staging server

We reuse the [hw1 code](https://github.com/DevOps2016Fall/Milestone3/blob/master/deployment/provision_server.js) to automatically create digital ocean droplet for our different servers. 



## Task 1: Deploy software to production envronsment
* We create a git [pre-commit](https://github.com/DevOps2016Fall/Milestone3/blob/master/pre-commit.sh) hook to do testing and analysis. If pass, then continue to commit; otherwise, this commit will be rejected. 
* Specifically, we use Jhint to do analysis and mocha, chai to do express server unit test.
* Our simple unit test script is [here](https://github.com/DevOps2016Fall/Milestone3/blob/master/test/test.js)
* We create a [post-receive](https://github.com/DevOps2016Fall/Milestone3/blob/master/pre-push.sh) hook, which will call ansible to deploy the software into product server automatically.


## Task 2: Automatic configuration of remote servers.
We create four different ansible playbooks for different servers, e.g.[proxy.yml](https://github.com/DevOps2016Fall/Milestone3/blob/master/deployment/proxy.yml),[product.yml](https://github.com/DevOps2016Fall/Milestone3/blob/master/deployment/product.yml),[redis.yml](https://github.com/DevOps2016Fall/Milestone3/blob/master/deployment/redis.yml),[staging.yml](https://github.com/DevOps2016Fall/Milestone3/blob/master/deployment/staging.yml). Each time, we push any new stuff into different servers, we will call different playbook to configure the corresponding servers.
The main functionality of playbooks are listed below, which could be a minor different between those fours.

* Configure dependencies for the server, install packages, like npm, nodejs, git, etc,etc.
* Pull app codes from github, according to their roles
   * Product server: will pull codes from master branch
   * Staging server: will pull codes from staging branch
* Start the corresponding service, like node.

## Task3:  Monitor the deployed application

We create python [scripts](https://github.com/DevOps2016Fall/Milestone3/tree/master/monitor) to monitor the servers(proxy, prouduct..), which will run at background. 

* For this task, we only monitor __CPU__ and __Memory__ usage.
* We configure our server to be able to sent email by the [instruction](https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-postfix-as-a-send-only-smtp-server-on-ubuntu-14-04) provided by Digital Ocean.
* When CPU usage is greater than 50% or memory is greater than 50%, an alert email will be sent to my eamil box.

## Task4: Autoscale individual components of production

We create another js script [provision_newProductServer.js](https://github.com/DevOps2016Fall/Milestone3/blob/master/deployment/provision_newProductServer.js), which will be able to creat a Digital Ocean droplet automatically if triggered. We design out workflow is as followed:

* Only proxy server has the ability to automatically creat a product server.
* When the proxy server CPU is greater than 50%, it will call ```provision_newProductServer.js``` to provision a product server.
* After that, an ansible playbook will come in to work, to automatically configure the newly created product server.
* The ip of this new product server will be udpated in the redis server, which join the other product servers to provide service.

## Task5: Use feature flags

The proxy server has the ability to set feature flags. In this task, we have a feature called ```disableSET```, which will disable the __SET__ key functionality. The workflow is as follows:

* Users can disable\enable such feature by pass the parameters 1 or 0 to url ````root\disable\1``` or ````root\disable\0```
* 1 means disable, and 0 means enable.
* Then such feature flag value is stored in redis server.
* When a user visit, for exmaple: 162.243.59.161\Set, the product server will check ```disableSET``` value in redis server
* if its value is 1 then, such the user can't use SET feature, or it's avaiable.

## Task6: Perform a canary release

For this task, we have a staging server, which will be hosting a new version of app, can need to have a canary release. Our workflow is as follows:

* The proxy server will redirect the traffic randomly to any product server at 70% probability and 30% to staging server.
* We also monitor the proxy server as we did in Task3. If the CPU usage is greater than 50%, it will set "yes" to alert key in redis, then all the traffic will go to product server, no traffic goes to staging server anymore.












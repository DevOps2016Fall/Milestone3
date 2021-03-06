#!/bin/bash
sysname=$(hostname)
ip=$(ip route get 1 | awk '{print $NF;exit}')
while :
do
    cpu=$(python cpu.py)
    echo $cpu

    if [ $cpu -gt 50 ]; then
        echo The CPU usage is high. $cpu%  | mail -s "High CPU usage for $sysname at ip $ip" wfu@ncsu.edu
        cd ../app
        node canary.js "yes"
        cd ../monitor
    fi
    # cd ../monitor
    mem=$(python memory.py)
    echo $mem
    if [ $mem -gt 50 ]; then
        echo The Memory usage is high. $mem% | mail -s "High memory usage for $sysname at ip $ip" wfu@ncsu.edu
        # cd ../app
        # node canary.js "yes"
    fi
    if [[ $cpu -gt 70 && $sysname == *"Weis-MacBook-Air.local"* ]]; then
        cd ../deployment
        # echo Proxy server has monitorred high traffic and a new app server is being auomatically provisioned
        # node provision_newProductServer.js product
        sleep 10s
        # export ansible_host_key_checking=False
        # ansible-playbook  -e 'host_key_checking=False' -i ~/proxy/Milestone3/deployment/inventory_product ~/proxy/Milestone3/deployment/product.yml
        cd ../monitor
    fi
    sleep 30s
done

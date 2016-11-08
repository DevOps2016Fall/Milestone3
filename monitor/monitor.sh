#!/bin/bash
sysname=$(hostname)
while :
do
    cpu=$(python cpu.py)
    if [ $cpu -gt 60 ]; then
        echo The CPU usage is high. $cpu%  | mail -s "High CPU usage for $sysname" wfu@ncsu.edu
    fi
    mem=$(python memory.py)
    if [ $memOutput -gt 30 ]; then
        echo The Memory usage is high. $mem% | mail -s "High memory usage for $sysname" wfu@ncsu.edu
    fi
    if [ $cpu -gt 80 | $sysname == *"UnityId-Weis-MacBook-Air.local"* ]; then
        ansible-playbook -i ~/proxy/Milestone3/deployment/inventory_product ~/proxy/Milestone3/deployment/product.yml
    fi
    sleep 1m
done


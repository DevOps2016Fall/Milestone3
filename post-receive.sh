#!/bin/bash

# This pre-push hook will deploy app according to different branches that git pushes to:
# master branch: the stable app.
# staging branch: the staging app.

current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')
cd ~/Milestone3/deployment
if [[ $current_branch = "master" ]];then
    echo "you're about to deploy app on stable prodct server."
    ansible-playbook -i inventory_product product.yml
fi
if [[ $current_branch = "staging" ]];then
    echo "you're about to deploy app on staging server."
    ansible-playbook -i inventory staging.yml
fi

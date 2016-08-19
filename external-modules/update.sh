#!/usr/bin/env bash

for dir in $(ls -d */)
do
    cd $dir
    git checkout master
    git reset --hard
    git pull
    cd -
done


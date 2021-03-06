#!/usr/bin/env bash

SRC=$(cd $(dirname "$0"); pwd)
source "${SRC}/include.sh"

echo -e "\033[1mRunning tests:\033[0m"

cd $file_path

#
# Testing pull,forward,backward methods
#
git config --global user.email "jshkurti@student.42.fr"
git config --global user.name "jshkurti"
git clone https://github.com/keymetrics/app-playground.git
cd app-playground
git checkout hotfix
export PM2_WORKER_INTERVAL=1000
$pm2 start ./process.json --name app
sleep 5

OUT=`$pm2 ls | grep errored | wc -l`
[ $OUT -eq 1 ] || fail "$1"
success "$1"

OUT=`$pm2 info 0 | grep remote | egrep -oh 'https://([^ ]+)'`
[ $OUT = "https://github.com/keymetrics/app-playground.git" ] || fail "$1"
success "$1"

OUT=`$pm2 backward app | wc -l`
[ $OUT -eq 13 ] || fail "$1"
success "$1"

OUT=`$pm2 forward app | wc -l`
[ $OUT -eq 13 ] || fail "$1"
success "$1"

OUT=`$pm2 forward app | wc -l`
[ $OUT -eq 2 ] || fail "$1"
success "$1"

OUT=`$pm2 pull app | wc -l`
[ $OUT -eq 2 ] || fail "$1"
success "$1"

OUT=`$pm2 ls | grep "16 " | wc -l`
[ $OUT -eq 1 ] || fail "$1"
success "$1"

#
# Testing refresh-versioning worker
#
OUT=`$pm2 jlist | egrep -oh '"unstaged":true' | wc -c`
[ $OUT -eq 16 ] || fail "$1"
success "$1"

git add --all
git commit -m 'staged now'
sleep 5
OUT=`$pm2 jlist | egrep -oh '"unstaged":false' | wc -c`
[ $OUT -eq 17 ] || fail "$1"
success "$1"

OUT=`$pm2 jlist | egrep -oh '"ahead":true' | wc -c`
[ $OUT -eq 13 ] || fail "$1"
success "$1"

$pm2 kill
cd ..
rm -rf ./app-playground

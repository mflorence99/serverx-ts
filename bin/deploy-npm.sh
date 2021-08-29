#!/bin/bash 

version=${1:-patch}
message=${2:-"Prepare new version for release"}

npm run build

git add . *
git commit -m "$message"

npm version $version

git push origin master

npm publish

#!/usr/bin/env bash

set -o pipefail
set -o errexit
set -o nounset

pushd ../recharts
npm run build
# capture the last row of npm pack output
last_row=$(npm pack | tail -n 1)
absolute_path=$(realpath "$last_row")
popd
./run-test.sh "$1" "file:$absolute_path"

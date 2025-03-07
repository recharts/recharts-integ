#!/bin/bash

# script for running integration tests
# How to use:
# `./scripts/run-tests.sh <test-folder-name>`
# The script will run one integration test if the name is provided,
# or all tests if there is no name, and print the results.
# it will exit with 0 on success and non-0 on failure

set -o pipefail
set -o errexit
set -o nounset
set -x

# one folder in the subfolder 'integrations' is one integration test

# first we need to make sure we are in the correct directory. We want to support running this script from any directory

# this function will verify that a given dependency is only installed once.
# it will throw an error if there are two different versions of the same package
function verify_single_dependency {
  local package_name=$1
  local ls_output
  pwd
  ls_output=$(npm ls "$package_name" --parseable --long)
  local unique_versions
  unique_versions=$(echo "$ls_output" | awk -F: '{print $2}' | sort -u)
  local count_of_unique_versions
  count_of_unique_versions=$(echo "$unique_versions" | wc -l)
  if [ "$count_of_unique_versions" -gt 1 ]; then
    echo "Error: multiple versions of $package_name found"
    exit 1
  fi
}

function test {
  local integration=$1
  pushd "$integration"
  rm -rf node_modules
  npm install --package-lock=false
  npm run build
  verify_single_dependency recharts
  verify_single_dependency react
  verify_single_dependency 'react-dom'
  verify_single_dependency 'react-redux'
  verify_single_dependency '@reduxjs/toolkit'
  popd
}

# if we have received a folder name as a first argument, run that
if [ $# -eq 1 ]; then
  test "integrations/$1"
  exit 0
fi

# else, run integration tests one by one
for integration in integrations/*; do
  test "$integration"
done

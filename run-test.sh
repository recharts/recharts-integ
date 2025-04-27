#!/bin/bash

# script for running integration tests
# How to use:
# `./scripts/run-test.sh <test-folder-name>`
# The script will run an integration test in the given folder.
# it will exit with 0 on success and non-0 on failure

set -o pipefail
set -o errexit
set -o nounset

# this function will verify that a given dependency is only installed once.
# it will throw an error if there are two different versions of the same package
function npm_verify_single_dependency {
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
  else
    echo "Verified: $package_name is installed only once with version $(echo "$unique_versions" | head -n 1)"
  fi
}

function yarn_verify_single_dependency {
  local package_name=$1
  local ls_output
  ls_output=$(yarn why "$package_name" --emoji false --no-progress --non-interactive | grep 'Found' | sed 's/"//g' | sed 's/.*Found[[:space:]]//g' | sed 's/.*#//')
  local count_of_unique_versions
  count_of_unique_versions=$(echo "$ls_output" | grep -c "$package_name")
  if [ "$count_of_unique_versions" -gt 1 ]; then
    local ls_output_singleline
    ls_output_singleline=$(echo "$ls_output" | tr '\n' ' ')
    echo "Error: multiple versions of $package_name found: $ls_output_singleline"
    exit 1
  else
    echo "Verified: $package_name is installed only once"
  fi
}

function run_yarn_test_if_exists {
  if [ ! -f "package.json" ]; then
    exit 2
  fi
  # yarn does not support the --if-present option so we have to parse the package.json file
  local test_script
  # let's assume that jq is not installed in the environment
  test_script=$(grep '"test":' package.json || echo "")
  if [ -n "$test_script" ]; then
    yarn run test
  else
    echo "No test script found in package.json"
  fi
}

function npm_test {
  local integration=$1
  pushd "$integration"
  rm -rf node_modules
  npm install --package-lock=false
  npm run test --if-present
  npm run build
  npm_verify_single_dependency recharts
  npm_verify_single_dependency react
  npm_verify_single_dependency 'react-dom'
  npm_verify_single_dependency 'react-redux'
  npm_verify_single_dependency '@reduxjs/toolkit'
  popd
}

function yarn_test {
  local integration=$1
  pushd "$integration"
  rm -rf node_modules
  rm -f yarn.lock
  # so we don't want to generate the lockfile for CI run but yarn refuses to run `yarn list` and `yarn why` without lockfile so we need one anyway
  yarn install # --frozen-lockfile
  run_yarn_test_if_exists
  yarn build
  yarn_verify_single_dependency recharts
  yarn_verify_single_dependency react
  yarn_verify_single_dependency 'react-dom'
  yarn_verify_single_dependency 'react-redux'
  yarn_verify_single_dependency '@reduxjs/toolkit'
  popd
}

if [ $# -eq 1 ]; then
  folder=$1
  if [[ "$folder" == *"npm"* ]]; then
    npm_test "$folder"
  elif [[ "$folder" == *"yarn"* ]]; then
    yarn_test "$folder"
  else
    echo "Error: not sure which runner to use for $folder"
    exit 1
  fi
  exit 0
else
  # otherwise log usage and exit
  all_available_tests=$(find integrations* -mindepth 1 -maxdepth 1 -type d | tr '\n' ' ')
  echo "Usage: $0 <test-folder>"
  echo "available tests are: $all_available_tests"
  exit 1
fi

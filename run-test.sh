#!/bin/bash

# script for running integration tests
# How to use:
# `./scripts/run-test.sh <test-folder-name> [optional-recharts-version]`
# The script will run an integration test in the given folder.
# If a version is provided, it will be used to install the recharts package.
# You can also provide a tgz file with the version of recharts you want to test
# as both npm and yarn support installing from a tgz file:
# https://docs.npmjs.com/cli/v8/commands/npm-install
# https://classic.yarnpkg.com/lang/en/docs/cli/add/
# https://yarnpkg.com/cli/add
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

function replace_version_in_package_json {
  local package_json_file=$1
  local version=$2
  if [ -z "$version" ]; then
    return 0
  fi
  if [ -f "$package_json_file" ]; then
    echo "Replacing recharts version in '$package_json_file' with '$version'"
    # uses pipe character | instead of the more common / to escape the slashes in the version in case it is a file path
    sed -i.bak "s|\"recharts\": \".*\"|\"recharts\": \"$version\"|" "$package_json_file"
    rm "$package_json_file.bak"
  else
    echo "Error: $package_json_file not found"
    exit 1
  fi
}

if [ $# -ge 1 ] && [ $# -le 2 ]; then
  folder=$1
  version=${2:-}
  replace_version_in_package_json "$folder/package.json" "$version"
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
  all_available_tests=$(find integrations -mindepth 1 -maxdepth 1 -type d | tr '\n' ' ')
  echo "Usage: $0 <test-folder> [optional-recharts-version]"
  echo "available tests are: $all_available_tests"
  exit 1
fi
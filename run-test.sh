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
# If you want to use the tgz file then the version should be prefixed with `file:` and it should be an absolute path
# so for example:
# `./scripts/run-test.sh integrations/npm file:$(realpath ../recharts-snapshot.tgz)`
# This script will exit with 0 on success and non-0 on failure

set -o pipefail
set -o errexit
set -o nounset

test_name="${1:-}"
if [[ -z "$test_name" ]]; then
  echo "Please provide a test folder name"
  exit 1
fi

absolute_path=$(realpath "$test_name")

version="${2:-}"

node scripts/run.js "$absolute_path" "$version"

"use strict";

/**
 * This script lists all integration test names.
 * Use these names to run specific tests by passing them to the test runner:
 * ./run-test.sh <test-name>
 *
 * Usage:
 *
 * Lists all integration test names, one per line:
 * node list.js
 *
 * Lists all integration test names as a JSON array:
 * node list.js --json
 *
 * Lists only stable tests, those that should be running in CI:
 * node list.js --ci
 */

const fs = require('fs');
const path = require('path');

const allSupportedPackageManagers = ['npm', 'yarn']

/**
 * Will return all folders in the given directory
 * joined with the directory name as a prefix.
 * @param dir
 */
function listAllFolders(dir) {
    return fs
        .readdirSync(path.join(__dirname, dir))
        .filter((file) => fs.statSync(path.join(__dirname, dir, file)).isDirectory())
        .map(file => path.join(dir, file));
}

function listAllLibraryTests() {
    // Because of how we have defined the package.json dependencies, not everything is compatible with everything.
    const react16Tests = [{ library: 'my-charts-react16', app: 'app-react16' }]
    const react17Tests = [{ library: 'my-charts-react17', app: 'app-react17' }]
    const react18Tests = [
        { library: 'my-charts-react18', app: 'app-react18' },
        { library: 'my-charts-react19', app: 'app-react18' },
        { library: 'my-charts-react18', app: 'app-react19' },
        { library: 'my-charts-react19', app: 'app-react19' },
    ]
    const allTestCombinations = [...react16Tests, ...react17Tests, ...react18Tests];

    return allSupportedPackageManagers.flatMap((packageManager) => {
        return allTestCombinations.map(({ library, app }) => {
            return `${packageManager}:${library}:${app}`
        })
    })
}

function listAllDirectDependencyTests() {
    const allIntegrations = listAllFolders('integrations-npm');
    return allIntegrations.flatMap((integration) => {
        return allSupportedPackageManagers.map((packageManager) => {
            return `${packageManager}:${integration}`
        })
    })
}

/**
 * Lists all integration tests, optionally filtering for stable tests suitable for CI.
 * 
 * @param {boolean} isCi - If true, only stable tests that should run in CI are included.
 * @returns {string[]} An array of test folder paths.
 */
function listAllTests(isCi) {
    const npmTests = listAllFolders('integrations-npm');
    const yarnTests = listAllFolders('integrations-yarn');
    const stableLibraryTests = ['integrations-library-inside-library']

    const output = [].concat(
        npmTests, yarnTests, stableLibraryTests
    )

    if (!isCi) {
        output.push(
            ...(listAllDirectDependencyTests()),
            ...listAllLibraryTests()
        );
    }

    return output
}

function main() {
    const isJson = process.argv.includes('--json');
    const isCi = process.argv.includes('--ci');
    const tests = listAllTests(isCi);

    if (isJson) {
        console.log(JSON.stringify(tests));
    } else {
        console.log(tests.join('\n'));
    }
}

if (require.main === module) {
    main();
}

exports.listAllTests = listAllTests
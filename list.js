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
    // Because of how we have defined the package.json dependencies, only certain combinations of libraries and apps are supported.
    const allTestCombinations = [
        {library: 'my-charts-react16', app: 'app-react16'},
        {library: 'my-charts-react17', app: 'app-react16'},

        {library: 'my-charts-react17', app: 'app-react17'},
        {library: 'my-charts-react18', app: 'app-react17'},
        {library: 'my-charts-react19', app: 'app-react17'},

        {library: 'my-charts-react18', app: 'app-react18'},
        {library: 'my-charts-react19', app: 'app-react18'},

        {library: 'my-charts-react19', app: 'app-react19'},
    ]

    return allSupportedPackageManagers.flatMap((packageManager) => {
        return allTestCombinations.map(({library, app}) => {
            return `${packageManager}:${library}:${app}`
        })
    })
}

function listAllDirectDependencyTests() {
    const allIntegrations = listAllFolders('integrations');
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
    if (isCi) {
        return [
            'npm:integrations/ts-react16-overrides',
            'npm:integrations/ts-react18',
            'npm:integrations/ts-react18',
            'npm:integrations/ts-react19',
            'npm:integrations/ts4-react17',
            'npm:my-charts-react18:app-react18',
            'npm:my-charts-react19:app-react18',
            'npm:my-charts-react19:app-react19',
            'yarn:integrations/ts-react16-resolutions',
            'yarn:integrations/ts-react19',
            'yarn:my-charts-react19:app-react19',
        ]
    }

    if (!isCi) {
        return [].concat(
            listAllDirectDependencyTests(),
            listAllLibraryTests()
        )
    }

    return output.sort()
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
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

// Note: This file is kept as CommonJS for backwards compatibility with CI scripts
// All test definitions now live in test-registry.ts

/**
 * Lists all integration tests, optionally filtering for stable tests suitable for CI.
 *
 * @param {boolean} isCi - If true, only stable tests that should run in CI are included.
 * @returns {string[]} An array of test names.
 */
function listAllTests(isCi) {
    // Dynamic import of the registry (must use require for sync CommonJS compatibility)
    // For the proper usage, import test-registry.ts directly in TypeScript/ESM code
    const registryPath = require('path').join(__dirname, 'test-ui', 'server', 'scripts', 'test-registry.ts');

    const {getAllTestNames} = require(registryPath);
    if (isCi) {
        return getAllTestNames('stable').sort();
    } else {
        return getAllTestNames().sort();
    }
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